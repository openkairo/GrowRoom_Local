"""Switch platform for Local Grow Box."""
from __future__ import annotations

import logging

from homeassistant.components.switch import SwitchEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.restore_state import RestoreEntity
from homeassistant.helpers.device_registry import DeviceInfo

from .const import (
    DOMAIN, 
    CONF_PUMP_ENTITY, 
    CONF_CAMERA_ENTITY,
    CONF_TEMP_SENSOR,
    CONF_HUMIDITY_SENSOR,
    CONF_LIGHT_ENTITY,
    CONF_FAN_ENTITY,
    CONF_PUMP_DURATION,
    CONF_MOISTURE_SENSOR,
    CONF_TARGET_MOISTURE,
    CONF_LIGHT_START_HOUR,
    CONF_TARGET_TEMP,
    CONF_MAX_HUMIDITY,
    DEFAULT_PUMP_DURATION,
    DEFAULT_TARGET_MOISTURE,
    DEFAULT_LIGHT_START_HOUR,
    DEFAULT_TARGET_TEMP,
    DEFAULT_MAX_HUMIDITY,
)

_LOGGER = logging.getLogger(__name__)

async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up the switch platform."""
    manager = hass.data[DOMAIN][entry.entry_id]
    entities = [GrowBoxMasterSwitch(hass, manager, entry.entry_id)]
    
    if manager.config.get(CONF_PUMP_ENTITY):
        entities.append(GrowBoxPumpSwitch(hass, manager, entry.entry_id))
        
    async_add_entities(entities)


class GrowBoxMasterSwitch(SwitchEntity, RestoreEntity):
    """Representation of the Master Switch."""

    _attr_has_entity_name = True
    _attr_name = "Master Control"
    _attr_icon = "mdi:power"

    def __init__(self, hass, manager, entry_id):
        """Initialize the switch."""
        self.hass = hass
        self.manager = manager
        self._entry_id = entry_id
        self._attr_unique_id = f"{entry_id}_master_switch"
        self._is_on = manager.master_switch_on

    @property
    def device_info(self) -> DeviceInfo:
        """Return the device info."""
        return DeviceInfo(
            identifiers={(DOMAIN, self._entry_id)},
            name=self.manager.entry.title,
            manufacturer="Local Grow Box",
            model="Grow Box Controller",
        )

    @property
    def extra_state_attributes(self):
        """Return entity specific state attributes."""
        return {
            "camera_entity": self.manager.config.get(CONF_CAMERA_ENTITY),
            "temp_sensor": self.manager.config.get(CONF_TEMP_SENSOR),
            "humidity_sensor": self.manager.config.get(CONF_HUMIDITY_SENSOR),
            "light_entity": self.manager.config.get(CONF_LIGHT_ENTITY),
            "fan_entity": self.manager.config.get(CONF_FAN_ENTITY),
            "pump_entity": self.manager.config.get(CONF_PUMP_ENTITY),
            "moisture_sensor": self.manager.config.get(CONF_MOISTURE_SENSOR),
            "target_moisture": self.manager.config.get(CONF_TARGET_MOISTURE, DEFAULT_TARGET_MOISTURE),
            "pump_duration": self.manager.config.get(CONF_PUMP_DURATION, DEFAULT_PUMP_DURATION),
            "light_start_hour": self.manager.config.get(CONF_LIGHT_START_HOUR, DEFAULT_LIGHT_START_HOUR),
            "target_temp": self.manager.config.get(CONF_TARGET_TEMP, DEFAULT_TARGET_TEMP),
            "max_humidity": self.manager.config.get(CONF_MAX_HUMIDITY, DEFAULT_MAX_HUMIDITY),
            "phase_start_date": self.manager.phase_start_date.isoformat() if self.manager.phase_start_date else None,
            "days_in_phase": self.manager.days_in_phase,
        }

    @property
    def is_on(self) -> bool:
        """Return true if switch is on."""
        return self._is_on

    async def async_added_to_hass(self) -> None:
        """Run when entity about to be added."""
        await super().async_added_to_hass()
        if (last_state := await self.async_get_last_state()) is not None:
            if last_state.state == "on":
                self._is_on = True
            else:
                self._is_on = False
            # Sync manager
            self.manager.set_master_switch(self._is_on)

    async def async_turn_on(self, **kwargs) -> None:
        """Turn the switch on."""
        self._is_on = True
        self.manager.set_master_switch(True)
        self.async_write_ha_state()

    async def async_turn_off(self, **kwargs) -> None:
        """Turn the switch off."""
        self._is_on = False
        self.manager.set_master_switch(False)
        self.async_write_ha_state()

class GrowBoxPumpSwitch(SwitchEntity, RestoreEntity):
    """Representation of the Water Pump Switch."""

    _attr_has_entity_name = True
    _attr_name = "Water Pump"
    _attr_icon = "mdi:water-pump"

    def __init__(self, hass, manager, entry_id):
        """Initialize the switch."""
        self.hass = hass
        self.manager = manager
        self._entry_id = entry_id
        self._attr_unique_id = f"{entry_id}_water_pump"
        self._pump_entity = manager.config[CONF_PUMP_ENTITY]
        self._is_on = False

    @property
    def device_info(self) -> DeviceInfo:
        """Return the device info."""
        return DeviceInfo(
            identifiers={(DOMAIN, self._entry_id)},
            name=self.manager.entry.title,
            manufacturer="Local Grow Box",
            model="Grow Box Controller",
        )

    @property
    def is_on(self) -> bool:
        """Return true if switch is on."""
        # Query actual entity state
        state = self.hass.states.get(self._pump_entity)
        if state:
            return state.state == "on"
        return False

    async def async_turn_on(self, **kwargs) -> None:
        """Turn the switch on."""
        await self.hass.services.async_call(
            "homeassistant", "turn_on", {"entity_id": self._pump_entity}
        )
        self.async_write_ha_state()

    async def async_turn_off(self, **kwargs) -> None:
        """Turn the switch off."""
        await self.hass.services.async_call(
            "homeassistant", "turn_off", {"entity_id": self._pump_entity}
        )
        self.async_write_ha_state()

    async def async_added_to_hass(self):
        """Register callbacks."""
        # Listen for changes to the underlying pump entity
        from homeassistant.helpers.event import async_track_state_change_event
        
        async def update_listener(event):
            self.async_write_ha_state()
            
        self.async_on_remove(
             async_track_state_change_event(self.hass, [self._pump_entity], update_listener)
        )
