from django.core.management.base import BaseCommand
from django.apps import apps
from django.db import connection


class Command(BaseCommand):
    help = 'Display the current pselect record for debugging'

    def _table_exists(self, table_name: str) -> bool:
        try:
            return table_name in connection.introspection.table_names()
        except Exception:
            return False

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('=== PSelect Record Test ==='))
        
        try:
            # Try to get the PSelect model
            PSelect = apps.get_model('accounting', 'PSelect')
            self.stdout.write(f"✓ PSelect model found: {PSelect}")
            
            # Check if table exists
            table_name = PSelect._meta.db_table
            if not self._table_exists(table_name):
                self.stdout.write(self.style.ERROR(f"✗ Table '{table_name}' does not exist"))
                return
            
            self.stdout.write(f"✓ Table '{table_name}' exists")
            
            # Get record count
            count = PSelect.objects.count()
            self.stdout.write(f"✓ Total PSelect records: {count}")
            
            if count == 0:
                self.stdout.write(self.style.WARNING("⚠ No PSelect records found"))
                return
            
            # Get the latest record
            ps = PSelect.objects.order_by('-uid').first()
            if not ps:
                self.stdout.write(self.style.WARNING("⚠ No latest record found"))
                return
            
            self.stdout.write(f"✓ Latest PSelect record found (UID: {ps.uid})")
            self.stdout.write("=" * 50)
            
            # Display all fields
            self.stdout.write(f"UID: {ps.uid}")
            self.stdout.write(f"EmpID: {ps.emp_id}")
            self.stdout.write(f"Start: {ps.start}")
            self.stdout.write(f"End: {ps.end}")
            self.stdout.write(f"WeekDone: {ps.week_done}")
            self.stdout.write(f"OldStart: {ps.oldstart}")
            self.stdout.write(f"OldEnd: {ps.oldend}")
            self.stdout.write(f"ForLookup: {ps.forlookup}")
            self.stdout.write(f"MileRate: {ps.mile_rate}")
            self.stdout.write(f"ChkPricePaid: {ps.chk_price_paid}")
            self.stdout.write(f"ReimExp: {ps.reim_exp}")
            self.stdout.write(f"OtimePercentage: {ps.otime_percentage}")
            self.stdout.write(f"SpecEquip: {ps.spec_equip}")
            self.stdout.write(f"BillingDate: {ps.billing_date}")
            self.stdout.write(f"InvoiceNum: {ps.invoice_num}")
            self.stdout.write(f"TravDir (Route): {ps.trav_dir}")
            
            # Try to get employee name
            self.stdout.write("=" * 50)
            if ps.emp_id:
                try:
                    HREmployee = apps.get_model('hr', 'Employee')
                    if self._table_exists(HREmployee._meta.db_table):
                        emp = HREmployee.objects.get(pk=int(ps.emp_id))
                        self.stdout.write(f"✓ Employee found: {emp.name} (ID: {emp.id})")
                    else:
                        self.stdout.write(self.style.WARNING("⚠ HR Employee table does not exist"))
                except HREmployee.DoesNotExist:
                    self.stdout.write(self.style.ERROR(f"✗ Employee with ID {ps.emp_id} not found"))
                except ValueError:
                    self.stdout.write(self.style.ERROR(f"✗ Invalid employee ID: {ps.emp_id}"))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"✗ Error looking up employee: {e}"))
            else:
                self.stdout.write(self.style.WARNING("⚠ No employee ID in pselect record"))
            
            # Show what would be displayed in header
            self.stdout.write("=" * 50)
            self.stdout.write("HEADER DISPLAY TEST:")
            
            pselect_data = {
                'emp_id': str(ps.emp_id).strip() if ps.emp_id else '',
                'employee_name': '',
                'old_start': ps.oldstart.isoformat() if ps.oldstart else '',
                'old_end': ps.oldend.isoformat() if ps.oldend else '',
                'route': ps.trav_dir if ps.trav_dir else '',
                'special_equipment': ps.spec_equip
            }
            
            # Try to get employee name
            if ps.emp_id:
                try:
                    HREmployee = apps.get_model('hr', 'Employee')
                    if self._table_exists(HREmployee._meta.db_table):
                        emp = HREmployee.objects.get(pk=int(ps.emp_id))
                        pselect_data['employee_name'] = emp.name
                    else:
                        pselect_data['employee_name'] = f"Employee #{ps.emp_id}"
                except:
                    pselect_data['employee_name'] = f"Employee #{ps.emp_id}"
            
            self.stdout.write(f"Employee: {pselect_data['employee_name'] or '[Employee]'}")
            self.stdout.write(f"WeekOf: {pselect_data['old_start']} to {pselect_data['old_end']}")
            self.stdout.write(f"Route: {pselect_data['route'] or '[Route]'}")
            self.stdout.write(f"Special Equipment: {pselect_data['special_equipment']}")
            
        except LookupError:
            self.stdout.write(self.style.ERROR("✗ Accounting app or PSelect model not found"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"✗ Error: {e}"))