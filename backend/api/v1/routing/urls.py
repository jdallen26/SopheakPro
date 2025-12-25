from django.urls import path
from .import views

app_name = 'api.v1.routing'

urlpatterns = [
    path('route_list/', views.route_list, name='route_list'),
    path('task_list/', views.task_list, name='task_list'),
    path('debug_routing_model/', views.debug_routing_model, name='debug_routing_model')
]
