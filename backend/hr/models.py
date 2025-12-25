from decimal import Decimal
from django.db import models
from django.conf import settings

def _managed_for(app_label: str):
    return settings.MODELS_MANAGED_OVERRIDES.get(app_label, settings.MODELS_MANAGED_DEFAULT)

class Employee(models.Model):
    # Matches [dbo].[Employee]
    id = models.IntegerField(primary_key=True, db_column='ID')
    name = models.CharField(max_length=30, db_column='Name')
    company = models.CharField(max_length=200, null=True, blank=True, db_column='Company')
    ssn = models.CharField(max_length=11, null=True, blank=True, db_column='Social Security')
    employed = models.BooleanField(default=False, db_column='employed')
    status = models.CharField(max_length=10, null=True, blank=True, db_column='status')
    allowances = models.SmallIntegerField(default=0, null=True, blank=True, db_column='allowances')
    hourly = models.DecimalField(max_digits=19, decimal_places=4, default=Decimal('0.00'), db_column='hourly')
    address1 = models.CharField(max_length=34, null=True, blank=True, db_column='Address1')
    address2 = models.CharField(max_length=34, null=True, blank=True, db_column='Address2')
    city = models.CharField(max_length=200, null=True, blank=True, db_column='City')
    state = models.CharField(max_length=3, null=True, blank=True, db_column='State')
    zip = models.CharField(max_length=9, null=True, blank=True, db_column='Zip')
    cell = models.CharField(max_length=10, null=True, blank=True, db_column='Cell')
    phone = models.CharField(max_length=10, null=True, blank=True, db_column='Phone')
    phone2 = models.CharField(max_length=10, null=True, blank=True, db_column='Phone2')
    start_date = models.DateTimeField(null=True, blank=True, db_column='startdate')
    end_date = models.DateTimeField(null=True, blank=True, db_column='enddate')
    comm_rate = models.DecimalField(max_digits=19, decimal_places=4, default=Decimal('0.35'), null=True, blank=True, db_column='Commrate')
    efficiency = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True, db_column='Effeciency')
    map_link = models.CharField(max_length=2047, null=True, blank=True, db_column='MapLink')
    photo = models.CharField(max_length=255, null=True, blank=True, db_column='Photo')
    sales_commission_rate = models.DecimalField(max_digits=6, decimal_places=4, default=Decimal('0.0000'), null=True, blank=True, db_column='Sales_Commission_Rate')
    pwd = models.CharField(max_length=1024, null=True, blank=True, db_column='PWD')
    driver = models.BooleanField(default=False, db_column='Driver')
    mass_mailer = models.BooleanField(default=False, db_column='MASS_MAILER')
    has_personal_prospects = models.BooleanField(default=False, db_column='HasPersonalProspects')
    sales = models.BooleanField(default=False, db_column='Sales')
    subcontractor = models.BooleanField(default=False, db_column='SubContractor')
    is_1099 = models.BooleanField(default=False, db_column='Is1099')
    fed_tax_number = models.CharField(max_length=50, null=True, blank=True, db_column='FedTaxNumber')
    entity = models.CharField(max_length=200, null=True, blank=True, db_column='Entity')
    email = models.EmailField(max_length=253, null=True, blank=True, db_column='Email')

    class Meta:
        db_table = 'Employee'
        verbose_name = 'Employee'
        verbose_name_plural = 'Employees'
        ordering = ['id']
        managed = _managed_for('hr')

    def __str__(self):
        return f"{self.id} - {self.name}"