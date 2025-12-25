# file: `accounting/views.py`
from django.db.models import Q
from django.shortcuts import render
from .models import Deposit, MonthlyInvoice
from decimal import Decimal, InvalidOperation
import json
from utils.dt import parse_date_val
from base.settings import CACHE_TTL, MAX_RECORDS

from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods, require_GET
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.core.cache import cache
from django.apps import apps


@csrf_exempt
@require_http_methods(["PUT", "POST"])
def edit_monthly_invoice_task(request, uid):
    """
    Accepts JSON body with any field listed in allowed_fields[].
    Updates the MonthlyInvoice with the given uid and returns the updated record.
    """
    try:
        payload = json.loads(request.body.decode("utf-8") or "{}")
    except (ValueError, TypeError):
        return HttpResponseBadRequest("Invalid JSON")

    # Collect updates only for allowed fields
    updates = {}
    allowed_fields = [
        "weekof", "charge", "invoice_number", "done_by", "emp_id", "cash_paid", "type",
        "commission", "taxable", "tax", "route", "price", "comm", "comment", "adjust_amount",
        "weekdone", "emp_paid", "work_order", "temp_deposit_date", "selected", "specnote",
    ]

    # Fields that should be parsed as dates
    date_fields = {"weekof", "weekdone", "temp_deposit_date", }
    int_fields = {"emp_id", "invoice_number", }
    decimal_fields = {"charge", "cash_paid", "commission", "tax", "price", "comm", "adjust_amount", }
    bit_fields = {"taxable", "selected", "specnote", "emp_paid"}

    for field in allowed_fields:
        # Validate the field is updateable
        if field not in payload: continue

        val = payload[field]

        # Accept explicit null/empty to clear the field for typed fields
        if val in (None, "") and (field in date_fields or field in int_fields or field in decimal_fields):
            updates[field] = None
            continue

        if field in date_fields:
            parsed_date = parse_date_val(val)
            if parsed_date is None:
                return HttpResponseBadRequest(f"Invalid date for field '{field}': {val}")
            updates[field] = parsed_date
        elif field in int_fields:
            try:
                updates[field] = int(val)
            except (ValueError, TypeError):
                return HttpResponseBadRequest(f"Invalid integer for field '{field}': {val}")
        elif field in decimal_fields:
            try:
                updates[field] = Decimal(str(val))
            except (InvalidOperation, TypeError):
                return HttpResponseBadRequest(f"Invalid decimal for field '{field}': {val}")
        elif field in bit_fields:
            if isinstance(val, bool):
                updates[field] = val
            elif str(val) in ("0", "1"):
                updates[field] = str(val) == "1"
            else:
                return HttpResponseBadRequest(f"Invalid boolean for field '{field}': {val}")
        else:
            updates[field] = val

    if not updates:
        return HttpResponseBadRequest(f"No editable fields provided. Allowed fields: {', '.join(sorted(allowed_fields))}")

    task = get_object_or_404(MonthlyInvoice, uid=uid)

    with transaction.atomic():
        for field, value in updates.items():
            setattr(task, field, value)
        task.save()

    resp = {
        "success": True,
        "uid": task.uid,
        "cust_id": task.cust_id,
        "master_id": task.master_id,
        "company": task.company,
        "description": task.description,
    }
    for field, value in updates.items():
        resp[field] = str(value) if isinstance(value, Decimal) else value

    return JsonResponse(resp)


# python
@require_GET
def payroll_task_selection_api_v1(request):
    q = request.GET.get('q', '').strip()
    cust_id = request.GET.get('cust_id', '').strip()
    count_only = request.GET.get('count_only', '0') in ('1', 'true', 'True')

    if not cust_id:
        return JsonResponse({'count': 0, 'tasks': []})

    try:
        def _get_model(app_labels, names):
            for app_label in app_labels:
                for name in names:
                    try:
                        return apps.get_model(app_label, name)
                    except LookupError:
                        continue
            return None

        model = _get_model(
            app_labels=['accounting', 'api.accounting'],
            names=['PayrollTasks', 'PayrollTask', 'Tasks', 'Task']
        )

        if model is None:
            data = []
        else:
            qs = model.objects.filter(cust_id=cust_id) if cust_id else model.objects.all()[MAX_RECORDS]

            if q:
                if q.isdigit():
                    qs = qs.filter(Q(description__icontains=q) | Q(id=int(q)))
                else:
                    qs = qs.filter(description__icontains=q)

            def _dec(v):
                return str(v) if v is not None else None

            data = [{
                'id': getattr(t, 'id', getattr(t, 'pk', None)),
                'description': getattr(t, 'description', '') or '',
                'frequency': getattr(t, 'frequency', None),
                'adv_freq': getattr(t, 'adv_freq', None),
                'commission': getattr(t, 'commission_formatted', _dec(getattr(t, 'commission', None))),
                'spec_equip': bool(getattr(t, 'spec_equip', False)),
                'spec_note': bool(getattr(t, 'spec_note', False)),
            } for t in qs]

    except Exception:
        data = []

    if count_only:
        return JsonResponse({'count': len(data)})

    return JsonResponse({'count': len(data), 'tasks': data})
