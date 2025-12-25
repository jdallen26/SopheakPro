from decimal import Decimal
from django.db import models
from django.core.validators import MinLengthValidator
from django.conf import settings

def _managed_for(app_label: str):
    return settings.MODELS_MANAGED_OVERRIDES.get(app_label, settings.MODELS_MANAGED_DEFAULT)

class Deposit(models.Model):
    deposit_id = models.AutoField(primary_key=True, db_column='ID')
    deposit = models.DecimalField(max_digits=19, decimal_places=2, null=True, blank=True, db_column='Deposit')
    deposit_num = models.IntegerField(default=0, db_column='DepositNum')
    emp_id = models.IntegerField(null=True, blank=True, db_column='Empid')
    deposit_date = models.DateTimeField(null=True, blank=True, db_column='DepositDate')
    description = models.CharField(max_length=50, null=True, blank=True, db_column='Description', validators=[MinLengthValidator(1)])

    class Meta:
        db_table = 'Deposit'
        verbose_name = 'Deposit'
        verbose_name_plural = 'Deposits'
        managed = _managed_for('accounting')

    def __str__(self):
        return f"Deposit {self.id} - {self.deposit or 0}"


class HistOfInvcCurrent(models.Model):
    uid = models.AutoField(primary_key=True, db_column='UID')
    task_id = models.IntegerField(null=True, blank=True, db_column='ID')
    cust_id = models.CharField(max_length=10, null=True, blank=True, db_column='CustID')
    week_of = models.DateTimeField(null=True, blank=True, db_column='Weekof')
    company = models.CharField(max_length=100, null=True, blank=True, db_column='Company')
    charge = models.DecimalField(max_digits=19, decimal_places=2, default=Decimal('0.00'), db_column='Charge')
    done_by = models.CharField(max_length=25, null=True, blank=True, db_column='DoneBy')
    emp_id = models.IntegerField(null=True, blank=True, db_column='EmpID')
    cash_paid = models.DecimalField(max_digits=19, decimal_places=2, default=Decimal('0.00'), db_column='CashPaid')
    commission = models.FloatField(null=True, blank=True, db_column='commission')
    tax = models.FloatField(null=True, blank=True, db_column='tax')
    route = models.CharField(max_length=2, null=True, blank=True, db_column='route')
    cod = models.BooleanField(default=False, db_column='COD')
    voucher = models.BooleanField(default=False, db_column='Voucher')
    price = models.DecimalField(max_digits=19, decimal_places=2, default=Decimal('0.00'), db_column='price')
    description = models.CharField(max_length=55, null=True, blank=True, db_column='description')
    taxable = models.BooleanField(default=True, db_column='Taxable')
    comm = models.DecimalField(max_digits=19, decimal_places=4, default=Decimal('0.00'), db_column='Comm')
    master_id = models.CharField(max_length=10, null=True, blank=True, db_column='MasterID')
    other_bill = models.BooleanField(default=False, db_column='OtherBill')
    task_type = models.CharField(max_length=50, null=True, blank=True, db_column='Type')
    comment = models.CharField(max_length=50, null=True, blank=True, db_column='comment')
    adjust_amount = models.DecimalField(max_digits=19, decimal_places=2, default=Decimal('0.00'), db_column='Adjust_Amount')
    mailto = models.BooleanField(default=False, db_column='Mailto')
    task_order = models.IntegerField(default=0, db_column='TaskOrder')
    adv_date = models.DateTimeField(null=True, blank=True, db_column='Advdate')
    adv_bill = models.BooleanField(default=False, db_column='Advbill')
    order = models.IntegerField(null=True, blank=True, db_column='Order')
    adv_freq = models.IntegerField(default=0, db_column='AdvFreq')
    adv_credit = models.IntegerField(default=-1, db_column='AdvCredit')
    spec_note = models.BooleanField(default=False, db_column='SpecNote')
    frequency = models.IntegerField(default=0, db_column='Frequency')
    spec_equip = models.BooleanField(default=False, db_column='SpecEquip')
    week_done = models.DateTimeField(null=True, blank=True, db_column='Weekdone')
    emp_paid = models.BooleanField(default=False, db_column='Emp_Paid')
    work_order = models.CharField(max_length=15, null=True, blank=True, db_column='WorkOrder')
    invoice_number = models.CharField(max_length=20, null=True, blank=True, db_column='Invoice_Number')

    class Meta:
        db_table = 'HistofInvc_current'
        verbose_name = 'HistOfInvoiceCurrent'
        verbose_name_plural = 'HistOfInvoiceCurrents'
        managed = _managed_for('accounting')

    def __str__(self):
        return f"HistOfInvc {self.uid} (Cust: {self.cust_id})"


class MonthlyInvoice(models.Model):
    uid = models.AutoField(primary_key=True, db_column='UID')
    task_id = models.IntegerField(null=True, blank=True, db_column='ID')
    cust_id = models.CharField(max_length=10, null=True, blank=True, db_column='CustID')
    week_of = models.DateTimeField(null=True, blank=True, db_column='Weekof')
    company = models.CharField(max_length=100, null=True, blank=True, db_column='Company')
    charge = models.DecimalField(max_digits=19, decimal_places=2, default=Decimal('0.00'), db_column='Charge')
    invoice_number = models.CharField(max_length=20, null=True, blank=True, db_column='Invoice_Number')
    done_by = models.CharField(max_length=25, null=True, blank=True, db_column='DoneBy')
    emp_id = models.IntegerField(null=True, blank=True, db_column='EmpID')
    cash_paid = models.DecimalField(max_digits=19, decimal_places=2, default=Decimal('0.00'), db_column='CashPaid')
    commission = models.FloatField(null=True, blank=True, db_column='commission')
    tax = models.FloatField(null=True, blank=True, db_column='tax')
    route = models.CharField(max_length=2, null=True, blank=True, db_column='route')
    cod = models.BooleanField(default=False, db_column='COD')
    voucher = models.BooleanField(default=False, db_column='Voucher')
    price = models.DecimalField(max_digits=19, decimal_places=2, default=Decimal('0.00'), db_column='price')
    description = models.CharField(max_length=55, null=True, blank=True, db_column='description')
    taxable = models.BooleanField(default=True, db_column='Taxable')
    comm = models.DecimalField(max_digits=19, decimal_places=4, default=Decimal('0.00'), db_column='Comm')
    master_id = models.CharField(max_length=10, null=True, blank=True, db_column='MasterID')
    other_bill = models.BooleanField(default=False, db_column='OtherBill')
    type = models.CharField(max_length=50, null=True, blank=True, db_column='Type')
    comment = models.CharField(max_length=50, null=True, blank=True, db_column='comment')
    adjust_amount = models.DecimalField(max_digits=19, decimal_places=2, default=Decimal('0.00'), db_column='Adjust_Amount')
    mailto = models.BooleanField(default=False, db_column='Mailto')
    order = models.IntegerField(default=0, db_column='Order')
    task_order = models.IntegerField(default=0, db_column='TaskOrder')
    adv_date = models.DateTimeField(null=True, blank=True, db_column='AdvDate')
    adv_bill = models.BooleanField(default=False, db_column='Advbill')
    adv_freq = models.IntegerField(default=0, db_column='AdvFreq')
    adv_credit = models.IntegerField(default=-1, db_column='AdvCredit')
    spec_note = models.BooleanField(default=False, db_column='SpecNote')
    frequency = models.IntegerField(default=0, db_column='Frequency')
    spec_equip = models.BooleanField(default=False, db_column='SpecEquip')
    week_done = models.DateTimeField(null=True, blank=True, db_column='Weekdone')
    status = models.IntegerField(null=True, blank=True, db_column='Status')
    emp_paid = models.BooleanField(default=False, db_column='Emp_Paid')
    work_order = models.CharField(max_length=15, null=True, blank=True, db_column='WorkOrder')
    temp_deposit_date = models.DateTimeField(null=True, blank=True, db_column='TempDepositDate')
    selected = models.BooleanField(null=True, blank=True, db_column='Selected')
    
    class Meta:
        db_table = 'MonthlyInvoice'
        verbose_name = 'Monthly Invoice'
        verbose_name_plural = 'Monthly Invoices'
        managed = _managed_for('accounting')

    def __str__(self):
        return f"MonthlyInvoice {self.uid} (Cust: {self.cust_id})"
