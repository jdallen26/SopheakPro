from payroll.models import PayrollComments

from django.contrib import admin


@admin.register(PayrollComments)
class PayrollCommentsAdmin(admin.ModelAdmin):
    pass
