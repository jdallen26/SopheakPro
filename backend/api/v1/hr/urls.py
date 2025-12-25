from django.urls import path
from .import views

app_name = 'api.v1.hr'

urlpatterns = [
    path('employees/', views.employees, name='employees'),
    path('notes/', views.notes, name='notes'),
    path('geo/', views.geo, name='geo'),
    path('debug_hr_model/', views.debug_hr_model, name='debug_hr_model'),
]
