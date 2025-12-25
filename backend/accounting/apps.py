# File: `accounting/apps.py`
from django.apps import AppConfig


class AccountingConfig(AppConfig):
    name = 'accounting'
    label = 'accounting'
    verbose_name = 'Accounting'
    default_auto_field = 'django.db.models.BigAutoField'

    def ready(self):
        try:
            from . import signals
        except Exception:
            pass
