"""Sensor platform for Local Grow Box."""
from __future__ import annotations

import logging
import math

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorStateClass,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import UnitOfPressure
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.device_registry import DeviceInfo
from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up the sensor platform."""
    _LOGGER.debug("Setting up Local Grow Box sensor platform")
    # Retrieve the manager
    try:
        manager = hass.data[DOMAIN][entry.entry_id]
        async_add_entities([
            GrowBoxVPDSensor(hass, manager, entry.entry_id),
            GrowBoxDaysInPhaseSensor(hass, manager, entry.entry_id)
        ])
        _LOGGER.debug("Sensors added successfully")
    except Exception as e:
        _LOGGER.error("Error setting up sensors: %s", e)

class GrowBoxVPDSensor(SensorEntity):
    """Representation of a VPD Sensor."""

    _attr_has_entity_name = True
    _attr_name = "Vapor Pressure Deficit"
    _attr_native_unit_of_measurement = UnitOfPressure.KPA
    _attr_device_class = SensorDeviceClass.PRESSURE
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_icon = "mdi:water-percent"

    def __init__(self, hass, manager, entry_id):
        """Initialize the sensor."""
        self.hass = hass
        self.manager = manager
        self._entry_id = entry_id
        self._attr_unique_id = f"{entry_id}_vpd"

    @property
    def device_info(self) -> DeviceInfo:
        """Return the device info."""
        return DeviceInfo(
            identifiers={(DOMAIN, self._entry_id)},
            name=self.manager.entry.title,
            manufacturer="Local Grow Box",
            model="Grow Box Controller",
            entry_type=None,
        )

    @property
    def native_value(self) -> float:
        """Return the value of the sensor."""
        return round(self.manager.vpd, 2)
        
    async def async_added_to_hass(self) -> None:
        """Register callbacks."""
        pass
        
    def update(self):
        """Fetch new state data for the sensor."""
        pass

class GrowBoxDaysInPhaseSensor(SensorEntity):
    """Representation of Days in Phase Sensor."""

    _attr_has_entity_name = True
    _attr_name = "Days in Current Phase"
    _attr_native_unit_of_measurement = "days"
    _attr_icon = "mdi:calendar-clock"

    def __init__(self, hass, manager, entry_id):
        """Initialize the sensor."""
        self.hass = hass
        self.manager = manager
        self._entry_id = entry_id
        self._attr_unique_id = f"{entry_id}_days_in_phase"

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
    def native_value(self) -> int:
        """Return the value of the sensor."""
        return self.manager.days_in_phase
