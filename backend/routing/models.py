# python
# File: `routing/models.py`
from dataclasses import asdict
from decimal import Decimal, ROUND_HALF_UP

from django.db import models


class Routes(models.Model):
    id = models.AutoField(primary_key=True, db_column='id')
    route = models.CharField(max_length=3, null=True, blank=True, db_column='route')
    description = models.CharField(max_length=50, null=True, blank=True, db_column='Desription')
    active = models.BooleanField(null=True, db_column='Active')
    numberIcon = models.CharField(max_length=255, null=True, blank=True, db_column='Number_Icon')
    driver = models.IntegerField(null=True, blank=True, db_column='Driver')
    icon = models.IntegerField(null=True, blank=True, db_column='Icon')
    sortOrder = models.IntegerField(null=True, blank=True, db_column='Sort_Order')
    latitude = models.FloatField(null=True, blank=True, db_column='Latitude')
    longitude = models.FloatField(null=True, blank=True, db_column='Longitude')

    class Meta:
        db_table = 'tbl_Route'
        verbose_name = 'Route'
        verbose_name_plural = 'Routes'
        managed = False  # prevents Django migrations for this model

    def __str__(self):
        return f"Route {self.route or 'n/a'} (ID: {self.id})"


class Tasks(models.Model):
    id = models.AutoField(primary_key=True, db_column='ID')
    type = models.CharField(max_length=12, null=False, blank=False, db_column='type', default='WINDOWS')
    cust_id = models.CharField(max_length=10, null=False, blank=False, db_column='CustID')
    master_id = models.CharField(max_length=10, null=False, blank=False, db_column='MasterID')
    service_date = models.DateTimeField(null=True, blank=True, db_column='service date')
    commission = models.DecimalField(max_digits=3, decimal_places=2, null=False, blank=False, db_column='commission', default=Decimal('0.35'))
    description = models.CharField(max_length=55, null=False, blank=False, db_default='WASH WINDOWS IN AND OUT', db_column='description')
    unit_price = models.DecimalField(max_digits=19, decimal_places=2, default=Decimal('0.00'), null=False, blank=False, db_column='unit price')
    sale_tax = models.DecimalField(max_digits=5, decimal_places=5, null=True, blank=True, db_column='sale tax', default=Decimal('0'))
    grand_total = models.DecimalField(max_digits=19, decimal_places=2, default=Decimal('0.00'), null=False, blank=False, db_column='grand total')
    next_due = models.DateTimeField(null=True, blank=True, db_column='nextdue')
    adv_date = models.DateTimeField(null=True, blank=True, db_column='AdvDate')
    end_date = models.DateTimeField(null=True, blank=True, db_column='enddate')
    quantity = models.IntegerField(null=True, blank=True, db_column='Quantity', db_default=0)
    frequency = models.IntegerField(null=True, blank=True, db_column='Frequency')
    task_order = models.IntegerField(null=True, blank=True, db_column='TaskOrder')
    adv_freq = models.IntegerField(null=True, blank=True, db_column='AdvFreq')
    spec_note = models.BooleanField(default=False, db_column='SpecNote', db_default='False')
    spec_equipment = models.BooleanField(default=False, db_column='SpecEquip', db_default='False')
    obros_id = models.IntegerField(null=True, blank=True, db_column='OBROS_ID')
    selected = models.BooleanField(default=False, db_column='Selected', db_default='False')

    class Meta:
        db_table = 'tasks'
        verbose_name = 'Task'
        verbose_name_plural = 'Tasks'
        managed = False  # prevents Django migrations for this model

    def __str__(self):
        return (f"ID {self.id or 'n/a'} (CustID: {self.cust_id} "
                f"MasterID: {self.master_id} Description: {self.description} Service Date: {self.service_date})")
