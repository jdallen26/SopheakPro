from django.urls import path
from .import views

app_name = 'api.v1.payroll'

urlpatterns = [
    path('comments', views.comments, name='comments'),
    path('sites', views.sites, name='sites'),
    path('task_list', views.task_list, name='task_list'),
    path('task_selection', views.insert_entry_task_selection, name='task_selection'),
    path('pselect', views.pselect, name='pselect'),
    path('pselect_edit', views.pselect_edit, name='pselect_edit'),
    path('payroll_weeks', views.payroll_weeks, name='payroll_weeks'),
    path('debug_payroll_model', views.debug_payroll_model, name='debug_payroll_model'),
]
