
def validate_bool(value):
    if isinstance(value, bool):
        return value
    if isinstance(value, int):
        return bool(value)
    if isinstance(value, str):
        v = value.lower()
        if v in ('1', 'true', 'yes', 'on'):
            return True
        if v in ('0', 'false', 'no', 'off'):
            return False
    return None
