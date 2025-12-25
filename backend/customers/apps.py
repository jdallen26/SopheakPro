# python
from django.apps import AppConfig


class CustomersConfig(AppConfig):
    name = 'customers'
    label = 'customers'
    verbose_name = 'Customers'
    default_auto_field = 'django.db.models.BigAutoField'

    def ready(self):
        # import signal handlers or perform startup tasks; ignore if module missing
        try:
            from . import signals  # use relative import so Django can find the module
        except Exception:
            pass