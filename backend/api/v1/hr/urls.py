from django.urls import path
from .import views

app_name = 'api.v1.hr'

urlpatterns = [
    path('employees', views.employees, name='employees'),
    path('employees/create', views.create_employee, name='create_employee'),
    path('employee_notes', views.employee_notes, name='employee_notes'),
    path('employee_geo', views.employee_geo, name='employee_geo'),
    path('debug_hr_model', views.debug_hr_model, name='debug_hr_model'),
]
