#!/usr/bin/env python
import os
import sys
import warnings
warnings.filterwarnings("ignore", category=RuntimeWarning, module="pyodbc")

def main():
    """Run administrative tasks."""
    # Force our settings module to avoid interference from the environment
    os.environ["DJANGO_SETTINGS_MODULE"] = "base.settings"
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
