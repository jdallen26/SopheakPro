# String messages for app
import re
from datetime import datetime, date, time

# --- Date/Time Format Constants ---
# US Standard Formats
FMT_US_DATE = "%m/%d/%Y"                  # 01/31/2023
FMT_US_TIME_24H = "%H:%M:%S"                  # 14:30:00
FMT_US_DATETIME = "%m/%d/%Y:%H:%M:%S"      # 01/31/2023:14:30:00
FMT_US_TIME_12H = "%I:%M:%S %p"           # 02:30:00 PM

# ISO / API Standard Formats
FMT_ISO_DATE = "%Y-%m-%d"                 # 2023-01-31
FMT_ISO_DATETIME = "%Y-%m-%dT%H:%M:%S"     # 2023-01-31T14:30:00

# Readable Formats
FMT_READABLE_DATE = "%B %d, %Y"            # January 31, 2023


def get_message(message_template, **kwargs):
    """
    Formats a message string with the given keyword arguments.

    - Cleans up values that might be byte string representations (e.g., b'value').
    - Auto-formats datetime, date, and time objects using default US formats.
    - Allows for forced formatting by passing a tuple: (value, format_string).

    Args:
        message_template (str): The string containing placeholders (e.g., "{NAME}").
        **kwargs: Keyword arguments. For custom date formatting, pass the value as a
                  tuple, e.g., `D=(datetime.now(), s.FMT_ISO_DATE)`.

    Returns:
        str: The formatted message string.
    """
    cleaned_kwargs = {}
    for key, value in kwargs.items():
        format_string = None
        actual_value = value

        # Check for forced formatting: (value, format_string)
        if isinstance(value, tuple) and len(value) == 2 and isinstance(value[1], str):
            actual_value, format_string = value

        # Handle Date/Time formatting
        if isinstance(actual_value, (datetime, date, time)):
            if format_string:
                # Use the forced format string provided by the user
                s_value = actual_value.strftime(format_string)
            else:
                # Use default formatting based on type
                if isinstance(actual_value, datetime):
                    s_value = actual_value.strftime(FMT_US_DATETIME)
                elif isinstance(actual_value, date):
                    s_value = actual_value.strftime(FMT_US_DATE)
                elif isinstance(actual_value, time):
                    s_value = actual_value.strftime(FMT_US_TIME)
        else:
            s_value = str(actual_value)

        # Clean up byte string representation, if any
        match = re.match(r"^b['\"](.*)['\"]$", s_value)
        if match:
            s_value = match.group(1)
        
        cleaned_kwargs[key] = s_value

    return message_template.format(**cleaned_kwargs)


# JSON
JSON_INVALID = "Invalid JSON provided: {JSON}"

# Record Creation
RECORD_CREATED = "{NAME} record created successfully."
RECORD_NOT_CREATED = "{NAME} record failed to create."

# Record Update
RECORD_UPDATED = "{NAME} record updated successfully."
RECORD_NOT_UPDATED = "{NAME} record failed to update."


# Record Deletion
RECORD_DELETED = "{NAME} record deleted successfully."
RECORD_NOT_DELETED = "{NAME} record failed to delete."

# Record Retrieval
RECORDS_NOT_FOUND = "{NAME} record/s not found."
RECORDS_NOT_FOUND_FILTER = "{NAME} record/s not found with filter: {FILTER}"

NO_RECORDS_RETURNED_UNK = "No records returned. No reason given."

# Filters
FILTER_INVALID = "Invalid filter provided: {FILTER}"
FILTER_NOT_APPLIED = "Filter {FILTER} not applied to results."

# Fields
FIELD_NOT_FOUND = "Field {FIELD} not found."
FIELD_CONVERSION_ERROR = "Error converting field {FIELD} to {TYPE}."

# Params
MISSING_PARAM = "Missing or invalid {NAME} parameter."

# Models
INVALID_MODEL_NAME = "Model {NAME} is invalid or model not found."

# Misc
NOT_YET_IMPLEMENTED = "Endpoint {NAME} not yet implemented."

