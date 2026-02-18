"""Select platform for Local Grow Box."""
from __future__ import annotations

import logging

from homeassistant.components.select import SelectEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.restore_state import RestoreEntity

from homeassistant.helpers.device_registry import DeviceInfo
from .const import DOMAIN, GROW_PHASES, PHASE_VEGETATIVE

_LOGGER = logging.getLogger(__name__)

async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up the select platform."""
    manager = hass.data[DOMAIN][entry.entry_id]
    async_add_entities([GrowPhaseSelect(hass, manager, entry.entry_id)])

class GrowPhaseSelect(SelectEntity, RestoreEntity):
    """Representation of a Grow Phase Selector."""

    _attr_has_entity_name = True
    _attr_name = "Grow Phase"
    _attr_options = GROW_PHASES
    _attr_icon = "mdi:sprout"

    def __init__(self, hass, manager, entry_id):
        """Initialize the selector."""
        self.hass = hass
        self.manager = manager
        self._entry_id = entry_id
        self._attr_unique_id = f"{entry_id}_phase"
        self._attr_current_option = manager.current_phase

    @property
    def device_info(self) -> DeviceInfo:
        """Return the device info."""
        return DeviceInfo(
            identifiers={(DOMAIN, self._entry_id)},
            name=self.manager.config.get("name", "Local Grow Box"),
            manufacturer="Local Grow Box",
            model="Grow Box Controller",
        )

    async def async_added_to_hass(self) -> None:
        """Run when entity about to be added."""
        await super().async_added_to_hass()
        if (last_state := await self.async_get_last_state()) is not None:
            if last_state.state in GROW_PHASES:
                self._attr_current_option = last_state.state
                # Sync manager with restored state
                self.manager.set_phase(last_state.state)

    async def async_select_option(self, option: str) -> None:
        """Change the selected option."""
        self._attr_current_option = option
        self.manager.set_phase(option)
        self.async_write_ha_state()
