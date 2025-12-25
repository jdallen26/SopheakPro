from decimal import Decimal
from django.db import models
from django.core.validators import MinLengthValidator
from django.conf import settings
from django.db import models


def _managed_for(app_label: str):
    return settings.MODELS_MANAGED_OVERRIDES.get(app_label, settings.MODELS_MANAGED_DEFAULT)


class Site(models.Model):
    cust_id = models.CharField(max_length=10, primary_key=True, db_column='CustID')
    mkt_co = models.IntegerField(null=True, blank=True, db_column='MktCo', default=2)
    reg_name = models.CharField(max_length=255, null=True, blank=True, db_column='RegName')
    company = models.CharField(max_length=255, null=True, blank=True, db_column='Company')
    address = models.CharField(max_length=40, null=True, blank=True, db_column='Address')
    city = models.CharField(max_length=19, null=True, blank=True, db_column='City')
    county = models.CharField(max_length=100, null=True, blank=True, db_column='County')
    state = models.CharField(max_length=2, null=True, blank=True, db_column='State', default='MN')
    zip_code = models.CharField(max_length=10, null=True, blank=True, db_column='Zip')
    phone = models.CharField(max_length=15, null=True, blank=True, db_column='Phone')
    start = models.DateTimeField(null=True, blank=True, db_column='Start')
    master_id = models.CharField(max_length=10, null=True, blank=True, db_column='MasterID')
    business_type = models.IntegerField(null=True, blank=True, db_column='Business_Type')
    cod = models.BooleanField(null=True, blank=True, db_column='COD')
    voucher = models.BooleanField(null=True, blank=True, db_column='Voucher')
    taxable = models.BooleanField(null=True, blank=True, db_column='Taxable')
    other_bill = models.BooleanField(null=True, blank=True, db_column='OtherBill')
    mailto = models.BooleanField(null=True, blank=True, db_column='Mailto')
    adv_bill = models.BooleanField(null=True, blank=True, db_column='AdvBill')
    adv_credit = models.BooleanField(null=True, blank=True, db_column='AdvCredit')
    billing_cycle = models.IntegerField(null=True, blank=True, db_column='BillingCycle')
    site_comm = models.BooleanField(null=True, blank=True, db_column='SiteComm')
    longitude = models.CharField(max_length=50, null=True, blank=True, db_column='Longitude')
    latitude = models.CharField(max_length=50, null=True, blank=True, db_column='Latitude')
    fax = models.CharField(max_length=15, null=True, blank=True, db_column='Fax')
    email = models.CharField(max_length=100, null=True, blank=True, db_column='Email')
    cell = models.CharField(max_length=15, null=True, blank=True, db_column='Cell')
    work_phone = models.CharField(max_length=50, null=True, blank=True, db_column='Work Phone')
    customer_notes = models.CharField(max_length=50, null=True, blank=True, db_column='Customer_Notes')
    tax_rate = models.FloatField(null=True, blank=True, db_column='Tax_Rate')
    service_client = models.BooleanField(null=True, blank=True, db_column='Service_Client')
    active = models.BooleanField(null=True, blank=True, db_column='Active')
    updated_by = models.IntegerField(null=True, blank=True, db_column='Updated_By')
    updated_date = models.DateTimeField(null=True, blank=True, db_column='Updated_Date')
    pmt_type = models.IntegerField(null=True, blank=True, db_column='Pmt_Type')
    inv_type = models.IntegerField(null=True, blank=True, db_column='Inv_Type')
    send_receipt = models.BooleanField(null=True, blank=True, db_column='Send_Reciept')
    e_mail_flag = models.BooleanField(null=True, blank=True, db_column='E-Mail')
    signature_required = models.BooleanField(null=True, blank=True, db_column='Signature_required')
    default_contact = models.CharField(max_length=25, null=True, blank=True, db_column='Default_Contact')
    custom1 = models.CharField(max_length=255, null=True, blank=True, db_column='CUSTOM1')
    custom2 = models.CharField(max_length=255, null=True, blank=True, db_column='CUSTOM2')
    prospect_status = models.IntegerField(null=True, blank=True, db_column='prospect_status')
    task_style = models.IntegerField(null=True, blank=True, db_column='Task_Style', default=1)
    quick_note = models.CharField(max_length=255, null=True, blank=True, db_column='Quick_Note')
    sms_opt_in = models.BooleanField(null=True, blank=True, db_column='SMS_Opt_In')
    needs_price_increased = models.BooleanField(null=True, blank=True, db_column='Needs_Price_Increased')
    price_increase_document = models.CharField(max_length=255, null=True, blank=True, db_column='Price_Increase_Document')
    sold_by = models.IntegerField(null=True, blank=True, db_column='SoldBy')
    call_blasted = models.BooleanField(null=True, blank=True, db_column='CallBlasted')
    call_blasted_date = models.DateTimeField(null=True, blank=True, db_column='CallBlastedDate')
    job_types = models.CharField(max_length=255, null=True, blank=True, db_column='Job_types', default='WINDOWS')
    job_types_abbrs = models.CharField(max_length=255, null=True, blank=True, db_column='Job_types_ABBRs', default='WD')
    pays_own_invoices = models.BooleanField(null=True, blank=True, db_column='PaysOwnInvoices')
    ct_exception = models.BooleanField(null=True, blank=True, db_column='CT_Exception')

    class Meta:
        db_table = 'Site'
        verbose_name = 'Site'
        verbose_name_plural = 'Sites'
        managed = _managed_for('sites')

    def __str__(self):
        return f"{self.cust_id} - {self.company or self.reg_name or ''}"
