from django.urls import path
from . import views

app_name = 'api.v1.accounting'

urlpatterns = [
    path('deposit_list', views.deposit_list, name='deposit_list'),
    path('monthly_invoice_tasks', views.monthly_invoice_tasks, name='monthly_invoice_tasks'),
    path('edit_monthly_invoice_task', views.edit_monthly_invoice_task, name='edit_monthly_invoice_task'),
    path('invoice_history_tasks', views.invoice_history_tasks, name='invoice_history_tasks'),
    path('debug_accounting_model', views.debug_accounting_model, name='debug_accounting_model'),
]
