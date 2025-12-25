from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/payroll/', include('api.v1.payroll.urls')),
    path('api/v1/routing/', include('api.v1.routing.urls')),
    path('api/v1/accounting/', include('api.v1.accounting.urls')),
    path('api/v1/hr/', include('api.v1.hr.urls')),
    path('api/v1/customers/', include('api.v1.customers.urls')),
    path('api/v1/api_auth/', include('api.v1.api_auth.urls')),
]

# Serve static files during development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0])
