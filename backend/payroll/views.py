# File: `payroll/views.py`
# django imports
import importlib
import os
import sys
import traceback

from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET
from django.shortcuts import render, get_object_or_404
from django.db import connection, transaction
from django.apps import apps
from django.utils import timezone
from django.core.cache import cache

# general imports
from decimal import Decimal, InvalidOperation
import json
from datetime import datetime, timedelta

from base import settings
from .models import PayrollComments
from accounting.models import PSelect
from utils import dt


def _table_exists(table_name: str) -> bool:
    """
    :rtype: bool
    """
    try:
        return table_name in connection.introspection.table_names()
    except Exception:
        return False


def index(request):
    # Get the latest pselect record and related data
    pselect_data = {
        'emp_id': '',
        'employee_name': '',
        'old_start': None,
        'old_end': None,
        'route': 'Z',  # Default route is "Z"
        'route_id': '',  # For popup pre-selection
        'special_equipment': False,
        'commrate': Decimal('0.00'),
    }

    old_start_date = None  # Track the date for filtering

    try:
        PSelect = apps.get_model('accounting', 'PSelect')
        if _table_exists(PSelect._meta.db_table):
            ps = PSelect.objects.order_by('-uid').first()
            if ps:
                pselect_data['emp_id'] = str(ps.emp_id).strip() if ps.emp_id else ''
                pselect_data['old_start'] = ps.oldstart
                pselect_data['old_end'] = ps.oldend
                pselect_data['special_equipment'] = ps.spec_equip
                old_start_date = ps.oldstart
                pselect_data['route'] = getattr(ps, 'route', pselect_data['route']) or pselect_data['route']
                # Look up employee name from HR if possible
                if ps.emp_id:
                    try:
                        HREmployee = apps.get_model('hr', 'Employee')
                        if _table_exists(HREmployee._meta.db_table):
                            emp = HREmployee.objects.get(pk=int(ps.emp_id))
                            pselect_data['employee_name'] = emp.name
                            pselect_data['commrate'] = emp.commrate if getattr(emp, 'commrate', None) is not None else Decimal('0.35')  # | 0.00
                    except Exception:
                        pselect_data['employee_name'] = f"Employee #{ps.emp_id}"
    except LookupError:
        pass

    # --- New: load active employees for the popup ---
    employee_options = []
    try:
        HREmployee = apps.get_model('hr', 'Employee')
        if _table_exists(HREmployee._meta.db_table):
            qs = HREmployee.objects.filter(employed=True).order_by('name').values_list('id', 'name')
            # normalize id to string to make template comparison straightforward
            employee_options = [
                {'id': str(eid), 'name': (name.title() if name else '')}
                for (eid, name) in qs
            ]
    except Exception:
        employee_options = []
    # Ensure the selected employee from pselect_data is in the options
    if pselect_data.get('emp_id') and pselect_data.get('employee_name'):
        emp_id_str = str(pselect_data['emp_id'])
        if not any(emp['id'] == emp_id_str for emp in employee_options):
            employee_options.append({
                'id': emp_id_str,
                'name': pselect_data['employee_name']
            })
    # --------------------------------------------------

    # --- New: load active routes for the popup (server-rendered) ---
    route_options = []
    try:
        # prefer importing model via apps to avoid import-time errors if app not present
        Route = apps.get_model('routing', 'Route')
        if _table_exists(Route._meta.db_table):
            qs = Route.objects.filter(active=True).order_by('route').values_list('id', 'route')
            route_options = [{'id': str(rid), 'route': (route or '')} for (rid, route) in qs]
    except Exception:
        route_options = []
    # --------------------------------------------------

    # Get filter values from request.GET with defaults
    route_filter = request.GET.get('route')
    if route_filter:
        try:
            Route = apps.get_model('routing', 'Route')
            route_obj = Route.objects.get(id=int(route_filter))
            route_filter = route_obj.route
        except Exception:
            route_filter = 'A'
    else:
        route_filter = 'A'

    selected_date_str = request.GET.get('date')
    if selected_date_str:
        try:
            start_date = datetime.strptime(selected_date_str, '%Y-%m-%d').date()
        except ValueError:
            start_date = old_start_date if old_start_date else None
    else:
        start_date = old_start_date

    # Update pselect_data with selected values from popup
    employee_param = request.GET.get('employee')
    if employee_param:
        try:
            emp_id = int(employee_param)
            HREmployee = apps.get_model('hr', 'Employee')
            if _table_exists(HREmployee._meta.db_table):
                emp = HREmployee.objects.get(pk=emp_id)
                pselect_data['emp_id'] = str(emp_id)
                pselect_data['employee_name'] = emp.name
        except Exception:
            pass

    if start_date:
        pselect_data['old_start'] = start_date

    pselect_data['route'] = route_filter

    special_param = request.GET.get('special_equipment')
    pselect_data['special_equipment'] = special_param in ('on', '1')

    # Set route_id for popup pre-selection
    if request.GET.get('route'):
        pselect_data['route_id'] = str(request.GET.get('route'))
    else:
        try:
            Route = apps.get_model('routing', 'Route')
            route_obj = Route.objects.get(route=pselect_data['route'])
            pselect_data['route_id'] = str(route_obj.id)
        except Exception:
            pselect_data['route_id'] = ''

    # Provide tasks from accounting.MonthlyInvoice with 7-day date range filter
    tasks = []
    try:
        PayrollTasks = apps.get_model('accounting', 'PayrollTasks')
        tasks_table = PayrollTasks._meta.db_table

        queryset = PayrollTasks.objects.all()

        # Filter by 7-day range if we have a start_date
        if start_date:
            start_dt = timezone.make_aware(datetime.combine(start_date, datetime.min.time()))
            end_dt = timezone.make_aware(datetime.combine(start_date + timedelta(days=6), datetime.max.time()))
            queryset = queryset.filter(
                weekof__gte=start_dt,
                weekof__lte=end_dt
            )

        # Filter by Route
        if route_filter:
            queryset = queryset.filter(route=route_filter)
        queryset = queryset.filter(cust_id__isnull=False).order_by('-weekof', 'route', 'order', 'company', 'cust_id', 'type',
                                                                   'task_order')
        queryset = queryset.only('uid', 'company', 'description', 'route', 'weekof', 'cash_paid', 'done_by', 'work_order',
                                 'comment', 'temp_deposit_date', 'site_comm')

        tasks = list(queryset)

    except LookupError:
        tasks = []

    # Build comment dropdown set from all distinct MonthlyInvoice.comment values (not just filtered tasks)
    comment_set = set()
    try:
        PayrollTasks = apps.get_model('payroll', 'PayrollComments')
        comments_table = PayrollComments._meta.db_table
        qs = PayrollComments.objects.values_list('comment', flat=True).order_by('comment').distinct()
        # Uppercase all distinct comment values
        comment_set = {str(c).upper() for c in qs}
    except Exception:
        comment_set = set()
    comment_options = sorted(comment_set)

    # Buttons helper for the template
    buttons = range(9)

    return render(request, 'payroll/index.html', {
        'tasks': tasks,
        'buttons': buttons,
        'comment_options': comment_options,
        'pselect_data': pselect_data,
        'employee_options': employee_options,
        'route_options': route_options,
    })


# @csrf_exempt
def get_pselect(request, uid):
    """
        Returns the PSelect record with the given uid as JSON.
    """
    task = get_object_or_404(PSelect, pk=uid)
    return JsonResponse({
        "emp_id": task.emp_id,
        "start": task.start_mmddyyyy,
        "end": task.end_mmddyyyy,
        "week_done": task.week_done_mmddyyyy,
        "oldstart": task.oldstart_mmddyyyy,
        "oldend": task.oldend_mmddyyyy,
        "mile_rate": task.mile_rate,
        "chk_price_paid": task.chk_price_paid,
        "reim_exp": task.reim_exp,
        "otime_percentage": task.otime_percentage,
        "spec_equip": task.spec_equip,
        "billing_date": task.billing_date_mmddyyyy,
        "invoice_num": task.invoice_num,
    })


@csrf_exempt
def edit_pselect(request, uid):
    """
        Accepts JSON body with any of: emp_id, start, end, week_done, oldstart, oldend, mile_rate, chk_price_paid,
        reim_exp, otime_percentage, spec_equip, billing_date, invoice_num, trav_dir
        Updates the MonthlyInvoice with the given uid and returns the updated record.
    """
    try:
        payload = json.loads(request.body.decode("utf-8") or "{}")
    except (ValueError, TypeError):
        return HttpResponseBadRequest("Invalid JSON")

    print("Received payload:", payload)  # Print to server terminal

    # Collect updates only for allowed fields
    updates = {}
    allowed_fields = [
        "emp_id", "start", "end", "week_done", "oldstart", "oldend", "mile_rate", "chk_price_paid",
        "reim_exp", "otime_percentage", "spec_equip", "billing_date", "invoice_num", "route",
    ]

    # fields that should be parsed as dates
    date_fields = {"start", "end", "week_done", "oldstart", "oldend", "billing_date"}

    # Handle special_equipment as alias for spec_equip
    if "special_equipment" in payload:
        updates["spec_equip"] = payload["special_equipment"]

    for field in allowed_fields:
        if field in payload:
            val = payload[field]
            if field in date_fields:
                parsed = dt.parse_date_val(val)
                # Accept explicit null/empty to clear the field
                if val in (None, ""):
                    updates[field] = None
                else:
                    if parsed is None:
                        return HttpResponseBadRequest(f"Invalid date format for {field}: {val}")
                    updates[field] = timezone.make_aware(parsed)
            elif field == "emp_id":
                try:
                    updates["emp_id"] = int(val) if val is not None and val != "" else None
                except (ValueError, TypeError):
                    return HttpResponseBadRequest("Invalid emp_id value")
            else:
                updates[field] = val

    if not updates:
        return HttpResponseBadRequest("No editable fields provided")

    task = get_object_or_404(PSelect, pk=uid)

    with transaction.atomic():
        for field, value in updates.items():
            setattr(task, field, value)
        task.save()

    # Return formatted dates (MM/DD/YYYY) where applicable, others as-is
    return JsonResponse({
        "emp_id": task.emp_id,
        "start": task.start_mmddyyyy,
        "end": task.end_mmddyyyy,
        "week_done": task.week_done_mmddyyyy,
        "oldstart": task.oldstart_mmddyyyy,
        "oldend": task.oldend_mmddyyyy,
        "mile_rate": task.mile_rate,
        "chk_price_paid": task.chk_price_paid,
        "reim_exp": task.reim_exp,
        "otime_percentage": task.otime_percentage,
        "spec_equip": task.spec_equip,
        "billing_date": task.billing_date_mmddyyyy,
        "invoice_num": task.invoice_num,
        # "route": task.route,
    })


@csrf_exempt
def get_payroll_task(request, uid):
    """
        Returns the PayrollRecord with the given uid as JSON.
    """
    PayrollTasks = apps.get_model('accounting', 'PayrollTasks')

    task = get_object_or_404(PayrollTasks, pk=uid)
    return JsonResponse({
        "uid": task.uid,
        "weekof": task.weekof,
        "company": task.company,
        "description": task.description,
        "route": task.route,
        "charge": task.charge,
        "comment": task.comment,
        "site_comm": task.site_comm,
    })
