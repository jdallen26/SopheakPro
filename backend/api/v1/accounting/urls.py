from django.urls import path
from . import views

app_name = 'api.v1.accounting'

urlpatterns = [
    path('deposit_list/', views.deposit_list, name='deposit_list'),
    path('invoice_tasks/', views.invoice_tasks, name='invoice_tasks'),
    path('invoice_history_tasks/', views.invoice_history_tasks, name='invoice_history_tasks'),
    path('debug_accounting_model/', views.debug_accounting_model, name='debug_accounting_model'),
]
