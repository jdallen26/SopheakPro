from django.urls import path
from .import views

app_name = 'api.v1.customers'

urlpatterns = [
    path('sites/', views.sites, name='sites'),
    path('masters/', views.masters, name='masters'),
    path('geo/', views.geo, name='geo'),
    path('debug_customers_model/', views.debug_customers_model, name='debug_customers_model'),
]
