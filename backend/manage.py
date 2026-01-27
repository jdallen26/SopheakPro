#!/usr/bin/env python
import os
import sys
import warnings
warnings.filterwarnings("ignore", category=RuntimeWarning, module="pyodbc")

def main():
    """Run administrative tasks."""
    # Force our settings module to avoid interference from the environment
    os.environ["DJANGO_SETTINGS_MODULE"] = "base.settings"

    # Monkey patch to support SQL Server v17 (likely Azure SQL Edge or similar)
    try:
        import mssql.base
        from django.db.utils import NotSupportedError
        # from django.utils.functional import cached_property # Removed cached_property usage to avoid TypeError

        if hasattr(mssql.base.DatabaseWrapper, 'sql_server_version'):
            original_prop = mssql.base.DatabaseWrapper.sql_server_version
            if hasattr(original_prop, 'func'):
                original_func = original_prop.func
                
                def patched_sql_server_version(self):
                    try:
                        return original_func(self)
                    except NotSupportedError as e:
                        # If the version is 17, suppress the error and return 16 (SQL Server 2022)
                        if "SQL Server v17 is not supported" in str(e):
                            return 16
                        raise e
                
                # Use standard property instead of cached_property to avoid __set_name__ issues
                mssql.base.DatabaseWrapper.sql_server_version = property(patched_sql_server_version)
    except Exception as e:
        # If patching fails, just print a warning and continue, the original error will likely occur again
        print(f"Warning: Failed to apply SQL Server version patch: {e}")

    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and available on your PYTHONPATH environment variable? "
            "Did you forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
