from django.db import connection


def _table_exists(table_name: str) -> dict:
    """
    Check whether `table_name` exists in the current DB and whether it's a table or view.
    Returns a dict: {'exists': bool, 'is_table': bool, 'is_view': bool}
    """
    try:
        intros = connection.introspection
        with connection.cursor() as cursor:
            # Preferred API: get_table_list(cursor) -> list of TableInfo(name, type)
            if hasattr(intros, "get_table_list"):
                tbls = intros.get_table_list(cursor)
                is_table = False
                is_view = False
                for t in tbls:
                    if isinstance(t, str):
                        name = t
                        typ = None
                    else:
                        # TableInfo namedtuple or similar
                        name = getattr(t, "name", None) or (t[0] if isinstance(t, (list, tuple)) else None)
                        typ = getattr(t, "type", None) or (t[1] if isinstance(t, (list, tuple)) and len(t) > 1 else None)
                    if name == table_name:
                        if typ and str(typ).lower() in ("v", "view"):
                            is_view = True
                        elif typ and str(typ).lower() in ("t", "table"):
                            is_table = True
                        else:
                            # if no type info, treat as table (best-effort)
                            is_table = True
                exists = is_table or is_view
                return {"exists": exists, "is_table": is_table, "is_view": is_view}

            # Fallback: table_names(cursor) or table_names()
            if hasattr(intros, "table_names"):
                try:
                    names = intros.table_names(cursor)
                except TypeError:
                    names = intros.table_names()
                exists = table_name in names
                return {"exists": exists, "is_table": exists, "is_view": False}

    except Exception:
        return {"exists": False, "is_table": False, "is_view": False}