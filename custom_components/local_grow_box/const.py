"""Constants for the Local Grow Box integration."""

DOMAIN = "local_grow_box"

CONF_LIGHT_ENTITY = "light_entity"
CONF_FAN_ENTITY = "fan_entity"
CONF_PUMP_ENTITY = "pump_entity"
CONF_CAMERA_ENTITY = "camera_entity"
CONF_TEMP_SENSOR = "temp_sensor"
CONF_HUMIDITY_SENSOR = "humidity_sensor"
CONF_TARGET_TEMP = "target_temp"
CONF_MAX_HUMIDITY = "max_humidity"

# Grow Phases
PHASE_SEEDLING = "seedling"
PHASE_VEGETATIVE = "vegetative"
PHASE_FLOWERING = "flowering"
PHASE_DRYING = "drying"
PHASE_CURING = "curing"

GROW_PHASES = [
    PHASE_SEEDLING,
    PHASE_VEGETATIVE,
    PHASE_FLOWERING,
    PHASE_DRYING,
    PHASE_CURING,
]

# Defaults
DEFAULT_TARGET_TEMP = 24.0
DEFAULT_MAX_HUMIDITY = 60.0

# Phase Keys
CONF_PHASE_SEEDLING_HOURS = "phase_seedling_hours"
CONF_PHASE_VEGETATIVE_HOURS = "phase_vegetative_hours"
CONF_PHASE_FLOWERING_HOURS = "phase_flowering_hours"
CONF_PHASE_DRYING_HOURS = "phase_drying_hours"
CONF_PHASE_CURING_HOURS = "phase_curing_hours"

CONF_CUSTOM1_NAME = "custom1_phase_name"
CONF_CUSTOM1_HOURS = "custom1_phase_hours"
CONF_CUSTOM2_NAME = "custom2_phase_name"
CONF_CUSTOM2_HOURS = "custom2_phase_hours"
CONF_CUSTOM3_NAME = "custom3_phase_name"
CONF_CUSTOM3_HOURS = "custom3_phase_hours"

# Advanced Features
CONF_PUMP_DURATION = "pump_duration" # In seconds
CONF_MOISTURE_SENSOR = "moisture_sensor"
CONF_TARGET_MOISTURE = "target_moisture" # In %
CONF_LIGHT_START_HOUR = "light_start_hour"
CONF_PHASE_START_DATE = "phase_start_date"

# Defaults
DEFAULT_TARGET_TEMP = 24.0
DEFAULT_MAX_HUMIDITY = 60.0
DEFAULT_PUMP_DURATION = 30
DEFAULT_TARGET_MOISTURE = 40.0
DEFAULT_LIGHT_START_HOUR = 18

# Phase Defaults (Hours of Light)
PHASE_LIGHT_HOURS = {
    PHASE_SEEDLING: 18,
    PHASE_VEGETATIVE: 18,
    PHASE_FLOWERING: 12,
    PHASE_DRYING: 0,
    PHASE_CURING: 0,
}
