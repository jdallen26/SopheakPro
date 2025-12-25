# python
from django.apps import AppConfig


class HRConfig(AppConfig):
    name = 'hr'
    label = 'hr'
    verbose_name = 'HR'
    default_auto_field = 'django.db.models.BigAutoField'

    def ready(self):
        # import signal handlers or perform startup tasks; ignore if module missing
        try:
            import signals
        except Exception:
            pass