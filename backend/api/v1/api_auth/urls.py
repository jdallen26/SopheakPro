from django.urls import path
from .import views

app_name = 'api.v1.api-auth'

urlpatterns = [
    path('users', views.users, name='users'),
    path('roles', views.roles, name='roles'),
    path('groups', views.groups, name='groups'),
    path('permissions', views.permissions, name='permissions'),
    path('debug_api_auth_model', views.debug_api_auth_model, name='debug_api_auth_model'),
]
