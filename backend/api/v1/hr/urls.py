from django.urls import path
from .import views

app_name = 'api.v1.hr'

urlpatterns = [
    path('employees/', views.employees, name='employees'),
    path('employees/create/', views.create_employee, name='create_employee'),
    path('employees/<int:emp_id>/', views.update_employee, name='update_employee'),
    path('employees/<int:emp_id>/delete/', views.delete_employee, name='delete_employee'),
    path('notes/', views.notes, name='notes'),
    path('geo/', views.geo, name='geo'),
    path('debug_hr_model/', views.debug_hr_model, name='debug_hr_model'),
]
