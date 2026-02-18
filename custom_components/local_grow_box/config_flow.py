"""Config flow for Local Grow Box integration."""
from __future__ import annotations

import logging
from typing import Any

import voluptuous as vol

from homeassistant import config_entries
from homeassistant.core import callback
from homeassistant.data_entry_flow import FlowResult
from homeassistant.helpers import selector

from .const import (
    DOMAIN,
    CONF_LIGHT_ENTITY,
    CONF_FAN_ENTITY,
    CONF_PUMP_ENTITY,
    CONF_CAMERA_ENTITY,
    CONF_TEMP_SENSOR,
    CONF_HUMIDITY_SENSOR,
    CONF_MOISTURE_SENSOR,
)

_LOGGER = logging.getLogger(__name__)

class ConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Local Grow Box."""

    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Handle the initial step."""
        if user_input is None:
            return self.async_show_form(
                step_id="user", 
                data_schema=vol.Schema({
                    vol.Required("name", default="My Grow Box"): str,
                    
                    # Essential Sensors
                    vol.Optional(CONF_TEMP_SENSOR): selector.EntitySelector(
                        selector.EntitySelectorConfig(domain="sensor")
                    ),
                    vol.Optional(CONF_HUMIDITY_SENSOR): selector.EntitySelector(
                        selector.EntitySelectorConfig(domain="sensor")
                    ),
                    
                    # Controls
                    vol.Optional(CONF_LIGHT_ENTITY): selector.EntitySelector(
                        selector.EntitySelectorConfig(domain=["switch", "light", "input_boolean"])
                    ),
                    vol.Optional(CONF_FAN_ENTITY): selector.EntitySelector(
                        selector.EntitySelectorConfig(domain=["switch", "fan", "input_boolean"])
                    ),
                    
                    # Water
                    vol.Optional(CONF_PUMP_ENTITY): selector.EntitySelector(
                        selector.EntitySelectorConfig(domain=["switch", "input_boolean"])
                    ),
                    vol.Optional(CONF_MOISTURE_SENSOR): selector.EntitySelector(
                        selector.EntitySelectorConfig(domain="sensor")
                    ),
                    
                    # Camera
                    vol.Optional(CONF_CAMERA_ENTITY): selector.EntitySelector(
                        selector.EntitySelectorConfig(domain="camera")
                    ),
                })
            )

        return self.async_create_entry(title=user_input["name"], data=user_input, options=user_input)

    @staticmethod
    @callback
    def async_get_options_flow(
        config_entry: config_entries.ConfigEntry,
    ) -> config_entries.OptionsFlow:
        """Create the options flow."""
        return OptionsFlowHandler(config_entry)


class OptionsFlowHandler(config_entries.OptionsFlow):
    """Handle options flow for Local Grow Box."""

    def __init__(self, config_entry: config_entries.ConfigEntry) -> None:
        """Initialize options flow."""
        self.config_entry = config_entry

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Manage the options."""
        if user_input is not None:
            return self.async_create_entry(title="", data=user_input)

        # Pre-fill with existing options or data
        options = self.config_entry.options
        data = self.config_entry.data
        
        def get_val(key):
            val = options.get(key, data.get(key))
            if val is None:
                return vol.UNDEFINED
            return val

        # Dynamically build schema to avoid 'None' issues
        schema = {
            vol.Optional(CONF_TEMP_SENSOR, description={"suggested_value": get_val(CONF_TEMP_SENSOR)}): selector.EntitySelector(
                selector.EntitySelectorConfig(domain="sensor")
            ),
            vol.Optional(CONF_HUMIDITY_SENSOR, description={"suggested_value": get_val(CONF_HUMIDITY_SENSOR)}): selector.EntitySelector(
                selector.EntitySelectorConfig(domain="sensor")
            ),
            vol.Optional(CONF_LIGHT_ENTITY, description={"suggested_value": get_val(CONF_LIGHT_ENTITY)}): selector.EntitySelector(
                selector.EntitySelectorConfig(domain=["switch", "light", "input_boolean"])
            ),
            vol.Optional(CONF_FAN_ENTITY, description={"suggested_value": get_val(CONF_FAN_ENTITY)}): selector.EntitySelector(
                selector.EntitySelectorConfig(domain=["switch", "fan", "input_boolean"])
            ),
            vol.Optional(CONF_PUMP_ENTITY, description={"suggested_value": get_val(CONF_PUMP_ENTITY)}): selector.EntitySelector(
                selector.EntitySelectorConfig(domain=["switch", "input_boolean"])
            ),
            vol.Optional(CONF_MOISTURE_SENSOR, description={"suggested_value": get_val(CONF_MOISTURE_SENSOR)}): selector.EntitySelector(
                selector.EntitySelectorConfig(domain="sensor")
            ),
            vol.Optional(CONF_CAMERA_ENTITY, description={"suggested_value": get_val(CONF_CAMERA_ENTITY)}): selector.EntitySelector(
                selector.EntitySelectorConfig(domain="camera")
            ),
        }

        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema(schema)
        )
