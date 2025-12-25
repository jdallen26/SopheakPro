from decimal import Decimal, ROUND_HALF_UP, getcontext
from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator, MinLengthValidator
from django.db.models import Index
from django.conf import settings
from reportlab.lib.colors import describe

from utils import dt

# Ensure predictable Decimal behavior for money calculations
getcontext().prec = 12


def _managed_for(app_label: str):
    return settings.MODELS_MANAGED_OVERRIDES.get(app_label, settings.MODELS_MANAGED_DEFAULT)


class PayrollComments(models.Model):
    comment = models.TextField(primary_key=True, null=False, blank=False, db_column='comment')

    class Meta:
        db_table = 'vw_Payroll_Comments'
        verbose_name = 'Payroll Comment'
        verbose_name_plural = 'Payroll Comments'
        managed = False


class PayrollSites(models.Model):
    cust_id = models.CharField(max_length=10, primary_key=True, db_column='CustID')
    company = models.CharField(max_length=100, null=True, blank=True, db_column='Company')
    wee_of = dt.parse_date_val(models.DateTimeField(null=True, blank=True, db_column='Weekof'))
    cod = models.BooleanField(default=False, db_column='COD')
    mailto = models.BooleanField(default=False, db_column='Mailto')
    taxable = models.BooleanField(default=False, db_column='Taxable')
    voucher = models.BooleanField(default=False, db_column='Voucher')
    other_bill = models.BooleanField(default=False, db_column='Otherbill')
    adv_bill = models.BooleanField(default=False, db_column='AdvBill')
    in_monthly = models.BooleanField(default=False, db_column='InMonthly')

    class Meta:
        db_table = 'vw_Payroll_Sites'
        verbose_name = 'Payroll Site'
        verbose_name_plural = 'Payroll Sites'
        managed = False


class PayrollTasks(models.Model):
    uid = models.AutoField(primary_key=True, db_column='UID')
    id = models.IntegerField(null=True, blank=True, db_column='ID', db_comment='Task ID')
    cust_id = models.CharField(max_length=10, null=True, blank=True, db_column='CustID')
    week_of = models.DateTimeField(null=True, blank=True, db_column='Weekof')
    company = models.CharField(max_length=100, null=True, blank=True, db_column='Company')
    charge = models.DecimalField(max_digits=19, decimal_places=2, default=Decimal('0.00'), db_column='Charge')
    done_by = models.CharField(max_length=25, null=True, blank=True, db_column='DoneBy')
    emp_id = models.IntegerField(null=True, blank=True, db_column='EmpID')
    cash_paid = models.DecimalField(max_digits=19, decimal_places=2, default=Decimal('0.00'), db_column='CashPaid')
    commission = models.FloatField(null=True, blank=True, db_column='commission')
    route = models.CharField(max_length=2, null=True, blank=True, db_column='route')
    cod = models.BooleanField(default=False, db_column='COD')
    price = models.DecimalField(max_digits=19, decimal_places=2, default=Decimal('0.00'), db_column='price')
    description = models.CharField(max_length=55, null=True, blank=True, db_column='description')
    comm = models.DecimalField(max_digits=19, decimal_places=4, default=Decimal('0.00'), db_column='Comm')
    other_bill = models.BooleanField(default=False, db_column='OtherBill')
    type = models.CharField(max_length=50, null=True, blank=True, db_column='Type')
    comment = models.CharField(max_length=50, null=True, blank=True, db_column='comment')
    order = models.IntegerField(default=0, db_column='Order')
    task_order = models.IntegerField(default=0, db_column='TaskOrder')
    spec_equip = models.BooleanField(default=False, db_column='SpecEquip')
    week_done = models.DateTimeField(null=True, blank=True, db_column='Weekdone')
    work_order = models.CharField(max_length=15, null=True, blank=True, db_column='WorkOrder')
    temp_deposit_date = models.DateTimeField(null=True, blank=True, db_column='TempDepositDate')
    site_comm = models.BooleanField(default=False, db_column='SiteComm')

    class Meta:
        db_table = 'vw_Payroll_Tasks'
        verbose_name = 'Payroll Task'
        verbose_name_plural = 'Payroll Tasks'
        managed = False

    def __str__(self):
        return f"Payroll Task {self.uid} (Cust: {self.company}, Desc: {self.description}, Price: {self.price})"

class PSelect(models.Model):
    uid = models.AutoField(primary_key=True, db_column='UID')
    emp_id = models.CharField(max_length=50, null=True, blank=True, db_column='EmpID', validators=[MinLengthValidator(1)])
    start = models.DateTimeField(null=True, blank=True, db_column='start')
    end = models.DateTimeField(null=True, blank=True, db_column='End')
    week_done = models.DateTimeField(null=True, blank=True, db_column='WeekDone')
    oldstart = models.DateTimeField(null=True, blank=True, db_column='oldstart')
    oldend = models.DateTimeField(null=True, blank=True, db_column='oldend')
    forlookup = models.PositiveSmallIntegerField(default=1, db_column='Forlookup')
    mile_rate = models.DecimalField(max_digits=19, decimal_places=2, null=True, blank=True, db_column='MileRate')
    chk_price_paid = models.BooleanField(default=False, db_column='ChkPricePaid')
    reim_exp = models.DecimalField(max_digits=19, decimal_places=2, null=True, blank=True, db_column='ReimExp')
    otime_percentage = models.IntegerField(null=True, blank=True, db_column='OtimePercentage')
    spec_equip = models.BooleanField(default=False, db_column='SpecEquip')
    billing_date = models.DateTimeField(null=True, blank=True, db_column='BillingDate')
    invoice_num = models.FloatField(null=True, blank=True, db_column='InvoiceNum')
    trav_dir = models.CharField(max_length=50, null=True, blank=True, db_column='TravDir', validators=[MinLengthValidator(1)])

    # Convenience read-only properties that return only the date portion formatted as MM/DD/YYYY
    @property
    def start_mmddyyyy(self):
        """Return a start date as 'MM/DD/YYYY' (no time) or None if not set."""
        if self.start:
            try:
                return self.start.date().strftime('%m/%d/%Y')
            except Exception:
                return None
        return None

    @property
    def end_mmddyyyy(self):
        """Return a end date as 'MM/DD/YYYY' (no time) or None if not set."""
        if self.end:
            try:
                return self.end.date().strftime('%m/%d/%Y')
            except Exception:
                return None
        return None

    @property
    def week_done_mmddyyyy(self):
        """Return a week_done date as 'MM/DD/YYYY' (no time) or None if not set."""
        if self.week_done:
            try:
                return self.week_done.date().strftime('%m/%d/%Y')
            except Exception:
                return None
        return None

    @property
    def oldstart_mmddyyyy(self):
        """Return an oldstart date as 'MM/DD/YYYY' (no time) or None if not set."""
        if self.oldstart:
            try:
                return self.oldstart.date().strftime('%m/%d/%Y')
            except Exception:
                return None
        return None

    @property
    def oldend_mmddyyyy(self):
        """Return an oldend date as 'MM/DD/YYYY' (no time) or None if not set."""
        if self.oldend:
            try:
                return self.oldend.date().strftime('%m/%d/%Y')
            except Exception:
                return None
        return None

    @property
    def billing_date_mmddyyyy(self):
        """Return a billing_date as 'MM/DD/YYYY' (no time) or None if not set."""
        if self.billing_date:
            try:
                return self.billing_date.date().strftime('%m/%d/%Y')
            except Exception:
                return None
        return None

    class Meta:
        db_table = 'pselect'
        verbose_name = 'PSelect'
        verbose_name_plural = 'PSelects'
        managed = _managed_for('accounting')

    def __str__(self):
        return f"PSelect {self.uid} (Emp: {self.emp_id})"