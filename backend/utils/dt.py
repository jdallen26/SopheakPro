from datetime import datetime, timedelta

def parse_date_val(v):
    if v is None or v == "":
        return None
    # already a datetime
    if isinstance(v, datetime):
        return v
    # numeric timestamp (seconds)
    if isinstance(v, (int, float)):
        try:
            return datetime.fromtimestamp(v)
        except Exception:
            return None
    if isinstance(v, str):
        # try common formats including requested '%m/%d/%Y'
        formats = [
            '%m/%d/%Y',
            '%Y-%m-%d',
            '%m/%d/%Y %H:%M:%S',
            '%Y-%m-%d %H:%M:%S',
            '%Y-%m-%dT%H:%M:%S',
        ]
        for fmt in formats:
            try:
                return datetime.strptime(v, fmt)
            except Exception:
                continue
        # fall back to fromisoformat for other ISO-like strings
        try:
            return datetime.fromisoformat(v)
        except Exception:
            return None
    return None
