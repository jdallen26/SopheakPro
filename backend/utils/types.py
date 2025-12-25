

def validate_bool(value):
    if value in ('1', 'true', 'True'):
        return True
    elif value in ('0', 'false', 'False'):
        return False
    return None

