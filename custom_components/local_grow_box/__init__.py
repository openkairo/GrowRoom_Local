"""The Local Grow Box integration."""
from __future__ import annotations

import logging
import datetime
import math
import os
import json
import base64
import voluptuous as vol
from datetime import timedelta

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.helpers.event import async_track_time_interval
from homeassistant.util import dt as dt_util
from homeassistant.components.http import StaticPathConfig
from homeassistant.components import panel_custom, websocket_api

from .const import (
    DOMAIN, CONF_LIGHT_ENTITY, CONF_FAN_ENTITY, CONF_TEMP_SENSOR, CONF_HUMIDITY_SENSOR,
    CONF_TARGET_TEMP, CONF_MAX_HUMIDITY, DEFAULT_TARGET_TEMP, DEFAULT_MAX_HUMIDITY,
    PHASE_LIGHT_HOURS, PHASE_VEGETATIVE, CONF_PHASE_SEEDLING_HOURS, CONF_PHASE_VEGETATIVE_HOURS,
    CONF_PHASE_FLOWERING_HOURS, CONF_PHASE_DRYING_HOURS, CONF_PHASE_CURING_HOURS,
    CONF_CUSTOM1_NAME, CONF_CUSTOM1_HOURS, CONF_CUSTOM2_NAME, CONF_CUSTOM2_HOURS,
    CONF_CUSTOM3_NAME, CONF_CUSTOM3_HOURS, PHASE_SEEDLING, PHASE_FLOWERING, PHASE_DRYING,
    PHASE_CURING, CONF_PUMP_DURATION, CONF_MOISTURE_SENSOR, CONF_TARGET_MOISTURE,
    CONF_LIGHT_START_HOUR, CONF_PHASE_START_DATE, DEFAULT_PUMP_DURATION,
    DEFAULT_TARGET_MOISTURE, DEFAULT_LIGHT_START_HOUR, CONF_PUMP_ENTITY, CONF_CAMERA_ENTITY,
)

_LOGGER = logging.getLogger(__name__)

PLATFORMS: list[Platform] = [Platform.SENSOR, Platform.SWITCH, Platform.SELECT]

class GrowBoxManager:
    """Class to manage the Grow Box automation."""

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry):
        """Initialize the manager."""
        self.hass = hass
        self.entry = entry
        self.config = {**entry.data, **entry.options}
        self._remove_update_listener = None
        self.master_switch_on = True
        self.current_phase = self.config.get("current_phase", PHASE_VEGETATIVE)
        self.phase_start_date = None
        start_date_str = self.config.get(CONF_PHASE_START_DATE)
        if start_date_str:
            try:
                self.phase_start_date = datetime.datetime.fromisoformat(start_date_str)
            except ValueError:
                pass
        
        if self.phase_start_date is None:
             self.phase_start_date = dt_util.now()

        self.vpd = 0.0
        self.pump_start_time = None
        self.last_pump_stop_time = dt_util.now()
        
        self.logs = []
        self._last_log_state = {}
        self._log_file_path = hass.config.path(f".storage", f"local_grow_box_logs_{self.entry.entry_id}.json")
        self._load_logs()

    def _load_logs(self):
        """Load logs from file."""
        if os.path.exists(self._log_file_path):
            try:
                with open(self._log_file_path, "r", encoding="utf-8") as f:
                    self.logs = json.load(f)
                    
                    # Reconstruct last state from history
                    # We reverse so we process oldest -> newest (self.logs has newest at index 0)
                    for log in reversed(self.logs):
                        try:
                            msg = log.split("] ", 1)[-1]
                            prefix = msg.split(" (")[0]
                            category = prefix.split(" ")[0]
                            self._last_log_state[category] = prefix
                        except Exception:
                            pass
            except Exception as e:
                _LOGGER.error("Failed to load Local Grow Box logs: %s", e)

    def _save_logs(self):
        """Save logs to file."""
        try:
            with open(self._log_file_path, "w", encoding="utf-8") as f:
                json.dump(self.logs, f)
        except Exception as e:
            pass # avoid spamming if permissions fail

    def add_log(self, message: str):
        """Add a log entry with timestamp."""
        prefix = message.split(" (")[0]
        category = prefix.split(" ")[0]
        
        # Deduplication check
        if self._last_log_state.get(category) == prefix:
            return  # Same action already logged recently
            
        self._last_log_state[category] = prefix

        timestamp = dt_util.now().strftime("%d.%m.%Y %H:%M:%S")
        self.logs.insert(0, f"[{timestamp}] {message}")
        
        if len(self.logs) > 1000:
            self.logs.pop()
            
        self.hass.async_create_task(self.hass.async_add_executor_job(self._save_logs))

    async def async_setup(self):
        """Setup background tasks."""
        # Check more frequently (1s) to handle pump duration accurately
        self._remove_update_listener = async_track_time_interval(
            self.hass, self._async_update_logic, timedelta(seconds=1)
        )
        self.hass.async_create_task(self._async_update_logic(dt_util.now()))

    def async_unload(self):
        """Unload and clean up."""
        if self._remove_update_listener:
            self._remove_update_listener()

    @property
    def days_in_phase(self) -> int:
        """Return number of days in current phase."""
        if not self.phase_start_date:
            return 0
        now = dt_util.now()
        start = self.phase_start_date
        if start and start.tzinfo is None:
            start = dt_util.as_local(start)
        delta = now - start
        return max(0, delta.days)

    def _get_safe_state(self, entity_id: str):
        if not entity_id:
            return None
        state = self.hass.states.get(entity_id)
        if not state or state.state in ["unavailable", "unknown"]:
            return None
        return state

    def _get_config_value(self, key, default, type_func=str):
        val = self.config.get(key)
        if val is None or val == "":
            return default
        try:
            return type_func(val)
        except (ValueError, TypeError):
            return default

    async def _async_update_logic(self, now: datetime.datetime):
        if not self.master_switch_on:
            return
            
        # Isolate Light Logic
        try:
            await self._async_update_light_logic(now)
        except Exception as e:
            _LOGGER.error("Error in Light Logic: %s", e)

        # Isolate Climate Logic
        try:
            await self._async_update_climate_logic(now)
        except Exception as e:
            _LOGGER.error("Error in Climate Logic: %s", e)

        # Isolate Water Logic
        try:
            await self._async_update_water_logic(now)
        except Exception as e:
            _LOGGER.error("Error in Water Logic: %s", e)

        # Update Display Logic
        try:
            await self._async_update_display_logic()
        except Exception as e:
            _LOGGER.error("Error in Display Logic: %s", e)

    async def _async_update_display_logic(self):
        """Send current state to ESPHome Display"""
        # Find all display services available
        esphome_services = self.hass.services.async_services().get("esphome", {})
        
        # We look for the base service name of ANY connected display (ignoring the _update_room_X suffix)
        basenames = set()
        for s in esphome_services:
            if "growbox_display" in s and "_update_room_" in s:
                basename = s.rsplit("_update_room_", 1)[0]
                basenames.add(basename)
                
        if not basenames:
             return
             
        # Determine the "Room ID" (1 to 5) for THIS specific Grow Box instance
        # We do this by sorting all configured Local Grow Box entries by their creation/ID
        # so they always get the same slot on the display
        all_entries = self.hass.config_entries.async_entries(DOMAIN)
        # Sort by entry_id to keep the assignment semi-stable
        all_entries.sort(key=lambda x: x.entry_id)
        
        room_index = 1
        for i, entry in enumerate(all_entries):
            if entry.entry_id == self.entry.entry_id:
                room_index = i + 1
                break
                
        # If a user has more than 5 boxes, cap it at 5 since our display only supports 5 pages
        if room_index > 5:
            room_index = 5
            
        target_service_suffix = f"_update_room_{room_index}"
             
        # Gather all current data
        # Use the name the user gave this Grow Box integration instance
        name = self.entry.title if self.entry and self.entry.title else f"Grow Box {room_index}"
        if len(name) > 13:
            name = name[:10] + "..."

        # Temp
        temp_entity = self.config.get(CONF_TEMP_SENSOR)
        temp_state = self._get_safe_state(temp_entity)
        temp_val = "--.-"
        if temp_state:
            try:
                temp_val = f"{float(temp_state.state):.1f}"
            except ValueError:
                temp_val = str(temp_state.state)

        # Hum
        hum_entity = self.config.get(CONF_HUMIDITY_SENSOR)
        hum_state = self._get_safe_state(hum_entity)
        hum_val = "--"
        if hum_state:
            try:
                hum_val = f"{float(hum_state.state):.1f}"
                if hum_val.endswith(".0"):
                    hum_val = hum_val[:-2]
            except ValueError:
                hum_val = str(hum_state.state)

        # Soil
        soil_entity = self.config.get(CONF_MOISTURE_SENSOR)
        soil_state = self._get_safe_state(soil_entity)
        soil_val = "--"
        if soil_state:
            try:
                soil_val = f"{float(soil_state.state):.0f}"
            except ValueError:
                soil_val = str(soil_state.state)

        # VPD is calculated globally in manager
        vpd_val = f"{self.vpd:.2f}" if self.vpd > 0 else "-.--"

        # Light
        light_entity = self.config.get(CONF_LIGHT_ENTITY)
        light_state = self._get_safe_state(light_entity)
        light_str = "Aus"
        if light_state and light_state.state == "on":
            light_str = "An"
            
        # Fan
        fan_entity = self.config.get(CONF_FAN_ENTITY)
        fan_state_obj = self._get_safe_state(fan_entity)
        fan_str = "Aus"
        if fan_state_obj and fan_state_obj.state == "on":
            fan_str = "An"

        display_data = {
            "name": name,
            "temp": temp_val,
            "hum": hum_val,
            "soil": soil_val,
            "vpd": vpd_val,
            "light_state": f"{light_str} ({self.current_phase})",
            "fan_state": fan_str
        }

        # Fire and forget updating all connected screens
        for basename in basenames:
            service_name = f"{basename}{target_service_suffix}"
            await self.hass.services.async_call("esphome", service_name, display_data)

    async def _async_update_light_logic(self, now: datetime.datetime):
        light_entity = self.config.get(CONF_LIGHT_ENTITY)
        if not light_entity:
            return
            
        # Check if light is also configured as fan (common conflict)
        fan_entity = self.config.get(CONF_FAN_ENTITY)
        if fan_entity and fan_entity == light_entity:
            _LOGGER.warning("CONFIGURATION ERROR: Light entity is same as Fan entity! This will cause toggling.")

        light_hours = 0
        phase = self.current_phase

        if phase == PHASE_SEEDLING:
            light_hours = self._get_config_value(CONF_PHASE_SEEDLING_HOURS, 18, float)
        elif phase == PHASE_VEGETATIVE:
            light_hours = self._get_config_value(CONF_PHASE_VEGETATIVE_HOURS, 18, float)
        elif phase == PHASE_FLOWERING:
            light_hours = self._get_config_value(CONF_PHASE_FLOWERING_HOURS, 12, float)
        elif phase == PHASE_DRYING:
            light_hours = self._get_config_value(CONF_PHASE_DRYING_HOURS, 0, float)
        elif phase == PHASE_CURING:
            light_hours = self._get_config_value(CONF_PHASE_CURING_HOURS, 0, float)
        elif phase == self.config.get(CONF_CUSTOM1_NAME):
            light_hours = self._get_config_value(CONF_CUSTOM1_HOURS, 0, float)
        elif phase == self.config.get(CONF_CUSTOM2_NAME):
            light_hours = self._get_config_value(CONF_CUSTOM2_HOURS, 0, float)
        elif phase == self.config.get(CONF_CUSTOM3_NAME):
            light_hours = self._get_config_value(CONF_CUSTOM3_HOURS, 0, float)
        else:
             light_hours = PHASE_LIGHT_HOURS.get(phase, 12)

        start_hour = self._get_config_value(CONF_LIGHT_START_HOUR, DEFAULT_LIGHT_START_HOUR, int)
        
        # Validate start_hour to prevent crash
        if not (0 <= start_hour <= 23):
             _LOGGER.warning("Invalid start_hour %s. Using default.", start_hour)
             start_hour = 18

        now_local = dt_util.now()
        start_time = now_local.replace(hour=int(start_hour), minute=0, second=0, microsecond=0)
        
        # If we are before start_hour relative to 'today starts at 00:00', 
        # then the cycle must have started yesterday.
        if now_local.hour < int(start_hour):
             start_time = start_time - timedelta(days=1)

        elapsed = (now_local - start_time).total_seconds()
        duration = float(light_hours) * 3600
        is_light_time = 0 <= elapsed < duration

        _LOGGER.debug(
            "Light Logic: Phase=%s, Hours=%s, Start=%s, Now=%s, Elapsed=%.1f, Duration=%.1f, IsLightTime=%s", 
            phase, light_hours, start_hour, now_local.strftime("%H:%M"), elapsed, duration, is_light_time
        )

        current_state = self._get_safe_state(light_entity)
        if not current_state:
            return
            
        if current_state.state in ["unavailable", "unknown"]:
            _LOGGER.debug("Light entity %s is unavailable. Skipping.", light_entity)
            return

        is_on = current_state.state == "on"
        
        if is_light_time and not is_on:
            # Check Manual Override (Debounce 15 mins)
            last_changed = current_state.last_changed
            if last_changed:
                diff = (dt_util.utcnow() - last_changed).total_seconds()
                if diff < 10:
                    _LOGGER.info("Light manual override detected (changed %.0fs ago). Skipping auto-control.", diff)
                    return

            _LOGGER.info("Light should be ON. Turning ON.")
            self.add_log("Licht eingeschaltet (Automatik)")
            await self.hass.services.async_call("homeassistant", "turn_on", {"entity_id": light_entity})
        elif not is_light_time and is_on:
            # Check Manual Override (Debounce 15 mins)
            last_changed = current_state.last_changed
            if last_changed:
                diff = (dt_util.utcnow() - last_changed).total_seconds()
                if diff < 900:
                    _LOGGER.info("Light manual override detected (changed %.0fs ago). Skipping auto-control.", diff)
                    return

            _LOGGER.info("Light should be OFF. Turning OFF.")
            self.add_log("Licht ausgeschaltet (Automatik)")
            await self.hass.services.async_call("homeassistant", "turn_off", {"entity_id": light_entity})

    async def _async_update_water_logic(self, now: datetime.datetime):
        pump_entity = self.config.get(CONF_PUMP_ENTITY)
        if not pump_entity:
            return

        pump_state = self._get_safe_state(pump_entity)
        if not pump_state:
            return
            
        if pump_state.state in ["unavailable", "unknown"]:
            return

        is_on = pump_state.state == "on"
        duration = self._get_config_value(CONF_PUMP_DURATION, DEFAULT_PUMP_DURATION, float)
        
        if is_on:
            # Start tracking if not already
            if not self.pump_start_time:
                 self.pump_start_time = now
            
            elapsed = (now - self.pump_start_time).total_seconds()
            
            if elapsed >= duration:
                 _LOGGER.info("Pump ran for %.1fs. Turning OFF.", elapsed)
                 self.add_log(f"Pumpe ausgeschaltet (Lief {elapsed:.1f}s)")
                 await self.hass.services.async_call("homeassistant", "turn_off", {"entity_id": pump_entity})
                 self.last_pump_stop_time = now
                 self.pump_start_time = None
        else:
            # Pump is OFF
            self.pump_start_time = None
            
            # Soak Time Check (15 min)
            if self.last_pump_stop_time:
                 time_off = (now - self.last_pump_stop_time).total_seconds()
                 if time_off < 900: # 900s = 15 min
                      return

            # Moisture Check
            moisture_entity = self.config.get(CONF_MOISTURE_SENSOR)
            if not moisture_entity:
                return
                
            state = self._get_safe_state(moisture_entity)
            if not state or state.state in ["unavailable", "unknown"]:
                return
            
            try:
                val = float(state.state)
                target = self._get_config_value(CONF_TARGET_MOISTURE, DEFAULT_TARGET_MOISTURE, float)
                
                if val < target:
                     _LOGGER.info("Moisture low (%.1f < %.1f). Starting Pump.", val, target)
                     self.add_log(f"Pumpe eingeschaltet (Bodenfeuchte {val}% < {target}%)")
                     await self.hass.services.async_call("homeassistant", "turn_on", {"entity_id": pump_entity})
                     self.pump_start_time = now
            except ValueError:
                pass

    async def _async_update_climate_logic(self, now: datetime.datetime):
        temp_entity = self.config.get(CONF_TEMP_SENSOR)
        humid_entity = self.config.get(CONF_HUMIDITY_SENSOR)
        fan_entity = self.config.get(CONF_FAN_ENTITY)
        
        if not temp_entity or not humid_entity:
            return

        target_temp = self._get_config_value(CONF_TARGET_TEMP, DEFAULT_TARGET_TEMP, float)
        max_humidity = self._get_config_value(CONF_MAX_HUMIDITY, DEFAULT_MAX_HUMIDITY, float)

        temp_state = self._get_safe_state(temp_entity)
        humid_state = self._get_safe_state(humid_entity)

        if not temp_state or not humid_state:
             return

        try:
            current_temp = float(temp_state.state)
            current_humid = float(humid_state.state)
        except ValueError:
            return

        svp = 0.61078 * math.exp((17.27 * current_temp) / (current_temp + 237.3))
        self.vpd = svp * (1 - current_humid / 100)

        if not fan_entity:
            return
            
        fan_state = self._get_safe_state(fan_entity)
        if not fan_state:
            return

        is_fan_on = fan_state.state == "on"
        should_fan_on = False

        if current_temp > target_temp or current_humid > max_humidity:
            should_fan_on = True
        elif current_temp < (target_temp - 1.0) and current_humid < (max_humidity - 5.0):
             should_fan_on = False
        else:
             should_fan_on = is_fan_on

        if should_fan_on and not is_fan_on:
             self.add_log(f"Abluft eingeschaltet (T={current_temp}°, H={current_humid}%)")
             await self.hass.services.async_call("homeassistant", "turn_on", {"entity_id": fan_entity})
        elif not should_fan_on and is_fan_on:
             self.add_log(f"Abluft ausgeschaltet (T={current_temp}°, H={current_humid}%)")
             await self.hass.services.async_call("homeassistant", "turn_off", {"entity_id": fan_entity})

    def set_master_switch(self, state: bool):
        self.master_switch_on = state
        self.hass.async_create_task(self._async_update_logic(dt_util.now()))

    def set_phase(self, phase: str):
        self.current_phase = phase
        self.hass.async_create_task(self._async_update_logic(dt_util.now()))

async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    await hass.http.async_register_static_paths([
        StaticPathConfig("/local_grow_box", hass.config.path("custom_components/local_grow_box/frontend"), True)
    ])
    img_path = hass.config.path("www", "local_grow_box_images")
    if not os.path.exists(img_path):
        os.makedirs(img_path)
    await panel_custom.async_register_panel(
        hass, webcomponent_name="local-grow-box-panel", frontend_url_path="grow-room",
        module_url=f"/local_grow_box/local-grow-box-panel.js?v={int(dt_util.now().timestamp())}",
        sidebar_title="Grow Room", sidebar_icon="mdi:sprout", require_admin=False,
    )

    # Register Websocket API
    _LOGGER.debug("Registering Local Grow Box Websocket Commands")
    try:
        websocket_api.async_register_command(hass, ws_upload_image)
        websocket_api.async_register_command(hass, ws_update_config)
        websocket_api.async_register_command(hass, ws_get_config)
        websocket_api.async_register_command(hass, ws_get_logs)
    except Exception as e:
        _LOGGER.warning("Failed to register websocket commands in async_setup (might be duplicate): %s", e)
    
    return True

async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    hass.data.setdefault(DOMAIN, {})
    
    # FAILSAFE: Ensure commands are registered even if async_setup didn't run or failed
    try:
        websocket_api.async_register_command(hass, ws_upload_image)
        websocket_api.async_register_command(hass, ws_update_config)
        websocket_api.async_register_command(hass, ws_get_config)
        websocket_api.async_register_command(hass, ws_get_logs)
    except Exception:
        pass # Expected if already registered

    manager = GrowBoxManager(hass, entry)
    hass.data[DOMAIN][entry.entry_id] = manager
    await manager.async_setup()
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    entry.async_on_unload(entry.add_update_listener(async_reload_entry))
    return True

async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    manager = hass.data[DOMAIN].pop(entry.entry_id)
    manager.async_unload()
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)

async def async_reload_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    await hass.config_entries.async_reload(entry.entry_id)

@websocket_api.websocket_command({
    vol.Required("type"): "local_grow_box/update_config",
    vol.Required("entry_id"): str,
    vol.Required("config"): dict,
})
@websocket_api.async_response
async def ws_update_config(hass, connection, msg):
    """Handle config update."""
    entry_id = msg["entry_id"]
    new_config = msg["config"]
    entry = hass.config_entries.async_get_entry(entry_id)

    if not entry:
        connection.send_error(msg["id"], "not_found", "Entry not found")
        return

    # Check for phase change to update start date
    if "current_phase" in new_config:
        full_config = {**entry.data, **entry.options}
        current_phase = full_config.get("current_phase") if full_config else None
        
        if current_phase != new_config.get("current_phase"):
            # If phase changed and no start date provided, reset it
            if CONF_PHASE_START_DATE not in new_config:
                new_config[CONF_PHASE_START_DATE] = dt_util.now().isoformat()

    # Clean empty values
    # Clean None values, but ALLOW empty strings (to clear fields)
    clean = {k: v for k, v in new_config.items() if v is not None}
    opts = {**entry.options, **clean}
    
    hass.config_entries.async_update_entry(entry, options=opts)
    connection.send_result(msg["id"], {"options": opts})

@websocket_api.websocket_command({
    vol.Required("type"): "local_grow_box/upload_image",
    vol.Required("device_id"): str,
    vol.Optional("entry_id"): str,
    vol.Required("image"): str, # Base64 encoded
})
@websocket_api.async_response
async def ws_upload_image(hass, connection, msg):
    """Handle image upload."""
    device_id = msg["device_id"]
    entry_id = msg.get("entry_id")
    image_data = msg["image"]
    
    if "," in image_data:
        image_data = image_data.split(",")[1]

    try:
        decoded = base64.b64decode(image_data)
        img_path = hass.config.path("www", "local_grow_box_images", f"{device_id}.jpg")
        
        def _write_file():
            with open(img_path, "wb") as f:
                f.write(decoded)

        await hass.async_add_executor_job(_write_file)

        # Update config entry with version timestamp to bust cache
        try:
            timestamp = int(dt_util.now().timestamp())
            entry = None
            if entry_id:
                entry = hass.config_entries.async_get_entry(entry_id)
            
            # Fallback (though device_id is likely not the entry_id)
            if not entry:
                entry = hass.config_entries.async_get_entry(device_id)

            if entry:
                new_opts = {**entry.options, "image_version": timestamp}
                hass.config_entries.async_update_entry(entry, options=new_opts)
                
                # Update running manager immediately to avoid race condition
                if DOMAIN in hass.data and entry.entry_id in hass.data[DOMAIN]:
                    manager = hass.data[DOMAIN][entry.entry_id]
                    if hasattr(manager, 'config'):
                        manager.config["image_version"] = timestamp
            else:
                _LOGGER.warning("Upload: No entry found for device_id %s / entry_id %s", device_id, entry_id)
        except Exception as err:
            _LOGGER.error("Error updating config entry during upload: %s", err)
            # Default to current time if config update fails, so frontend at least tries to refresh
            timestamp = int(dt_util.now().timestamp())
            
        connection.send_result(msg["id"], {
            "path": f"/local/local_grow_box_images/{device_id}.jpg",
            "version": timestamp
        })
    except Exception as e:
        _LOGGER.error("Upload failed: %s", e)
        connection.send_error(msg["id"], "upload_failed", str(e))

@websocket_api.websocket_command({
    vol.Required("type"): "local_grow_box/get_config",
    vol.Required("entry_id"): str,
})
@websocket_api.async_response
async def ws_get_config(hass, connection, msg):
    """Handle config get."""
    entry_id = msg["entry_id"]
    entry = hass.config_entries.async_get_entry(entry_id)

    if not entry:
        connection.send_error(msg["id"], "not_found", "Entry not found")
        return

    data = {**entry.data, **entry.options}
    connection.send_result(msg["id"], {"config": data})

@websocket_api.websocket_command({
    vol.Required("type"): "local_grow_box/get_logs",
    vol.Required("entry_id"): str,
})
@websocket_api.async_response
async def ws_get_logs(hass, connection, msg):
    """Handle get logs."""
    entry_id = msg["entry_id"]
    manager = hass.data[DOMAIN].get(entry_id)
    if manager:
        connection.send_result(msg["id"], {"logs": manager.logs})
    else:
        connection.send_result(msg["id"], {"logs": []})
