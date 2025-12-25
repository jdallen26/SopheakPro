from django.apps import AppConfig


class RoutingConfig(AppConfig):
    name = 'routing'
    verbose_name = 'Routing'
    default_auto_field = 'django.db.models.BigAutoField'

    def ready(self):
        # import signal handlers or perform startup tasks; ignore if module missing
        try:
            import signals
        except Exception:
            pass
