# python file api/accounting/views.py
from django.conf import settings
import importlib, sys, traceback, os, json
from django.db.models import Q
from django.http import JsonResponse
from django.views.decorators.http import require_GET, require_POST
from django.views.decorators.csrf import csrf_exempt
from django.core.cache import cache
from django.apps import apps
from base.settings import CACHE_TTL, MAX_RECORDS
from utils.types import validate_bool
from datetime import datetime

# python
@csrf_exempt
@require_POST
def deposit_list(request):
    try:
        payload = json.loads(request.body.decode('utf-8') or '{}')
    except Exception:
        return JsonResponse({'error': 'invalid json'}, status=400)

    q = str(payload.get('q', '')).strip()
    emp_id = payload.get('emp_id', '')
    deposit_id = payload.get('deposit_id', '')
    description = payload.get('description', '').strip()
    refresh = payload.get('refresh') in (True, '1', 'true', 'True')
    cc = request.META.get('HTTP_CACHE_CONTROL', '')
    count_only = validate_bool(payload.get('count_only'))
    limit = int(payload.get('limit', MAX_RECORDS))

    # build filters
    filters = {}
    try:
        if emp_id not in ('', None):
            filters['emp_id'] = int(emp_id)
        elif deposit_id not in ('', None):
            filters['deposit_id'] = int(deposit_id)
        elif description not in ('', None):
            filters['description__icontains'] = description
    except (ValueError, TypeError):
        return JsonResponse({'count': 0, 'deposits': []})

    if 'no-cache' in cc or 'max-age=0' in cc:
        refresh = True

    cache_key = f'accounting_deposits_v1_emp_{emp_id}' if emp_id else 'accounting_deposits_v1_all'
    data = None if refresh else cache.get(cache_key)

    if data is not None:
        if q:
            ql = q.lower()
            data = [
                d for d in data
                if ql in str(d.get('deposit_id', '')).lower()
                   or ql in str(d.get('deposit_num', '')).lower()
                   or ql in (d.get('description') or '').lower()
                   or ql in str(d.get('emp_id', '')).lower()
            ]
        if limit and len(data) > limit:
            data = data[:limit]
    else:
        try:
            try:
                Model = apps.get_model('accounting', 'Deposit')
            except LookupError:
                Model = None

            if Model is None:
                return JsonResponse({'count': 0, 'deposits': []})

            qs = Model.objects.filter(**filters) if filters else Model.objects.all()

            if q:
                if q.isdigit():
                    qi = int(q)
                    qs = qs.filter(
                        Q(deposit_id=qi) |
                        Q(deposit_num=qi) |
                        Q(emp_id=qi)
                    )
                else:
                    qs = qs.filter(
                        Q(deposit_num__icontains=q) |
                        Q(description__icontains=q)
                    )

            qs = qs[:limit]

            data = [{
                'deposit_id': getattr(d, 'deposit_id', None),
                'deposit': getattr(d, 'deposit', None),
                'deposit_num': getattr(d, 'deposit_num', None),
                'emp_id': getattr(d, 'emp_id', None),
                'deposit_date': getattr(d, 'deposit_date', None),
                'description': getattr(d, 'description', '') or '',
            } for d in qs]

        except Exception:
            data = []

        if not q and not refresh and not filters:
            cache.set(cache_key, data, CACHE_TTL)

    if count_only:
        return JsonResponse({'count': len(data)})

    return JsonResponse({'count': len(data), 'deposits': data})


# python
@csrf_exempt
@require_POST
def invoice_history_tasks(request):
    try:
        payload = json.loads(request.body.decode('utf-8') or '{}')
    except Exception:
        return JsonResponse({'error': 'invalid json'}, status=400)

    q = str(payload.get('q', '')).strip()
    refresh = payload.get('refresh') in (True, '1', 'true', 'True')
    cc = request.META.get('HTTP_CACHE_CONTROL', '')
    count_only = validate_bool(payload.get('count_only'))
    limit = int(payload.get('limit', MAX_RECORDS))

    # --- Filter Extraction ---
    uid = payload.get('uid')
    task_id = payload.get('task_id')
    invoice_number = payload.get('invoice_number')
    emp_id = payload.get('emp_id')
    cust_id = payload.get('cust_id')
    master_id = payload.get('master_id')
    company = payload.get('company')
    week_of = payload.get('week_of')
    week_done = payload.get('week_done')
    route = payload.get('route')
    done_by = payload.get('done_by')
    work_order = payload.get('work_order')

    # --- DB Filtering Logic ---
    filters = {}
    if uid: filters['uid'] = int(uid)
    if task_id: filters['task_id'] = int(task_id)
    if invoice_number: filters['invoice_number'] = invoice_number
    if emp_id: filters['emp_id'] = int(emp_id)
    if cust_id: filters['cust_id'] = cust_id
    if master_id: filters['master_id'] = master_id
    if company: filters['company__icontains'] = company
    if week_of: filters['week_of'] = week_of
    if week_done: filters['week_done'] = week_done
    if route: filters['route__iexact'] = route
    if done_by: filters['done_by__icontains'] = done_by
    if work_order: filters['work_order__icontains'] = work_order

    # --- Caching Strategy ---
    # Only cache simple, common lookups. Bypass cache for complex filter combinations.
    cache_key = None
    if not filters and not q:
        cache_key = 'accounting_invoice_history_v1_all'
    elif len(filters) == 1 and 'uid' in filters:
        cache_key = f'accounting_invoice_history_v1_uid_{uid}'

    if 'no-cache' in cc or 'max-age=0' in cc:
        refresh = True

    data = None
    if not refresh and cache_key:
        data = cache.get(cache_key)

    if data is None:
        try:
            Model = apps.get_model('accounting', 'HistOfInvcCurrent')
            qs = Model.objects.filter(**filters)

            if q:
                if q.isdigit():
                    qs = qs.filter(Q(uid=q) | Q(task_id=q) | Q(emp_id=q))
                else:
                    qs = qs.filter(
                        Q(company__icontains=q) | Q(description__icontains=q) |
                        Q(cust_id__icontains=q) | Q(done_by__icontains=q) |
                        Q(invoice_number__icontains=q) | Q(work_order__icontains=q)
                    )

            qs = qs[:limit]

            def _fmt(h):
                return {
                    'uid': getattr(h, 'uid', None), 'task_id': getattr(h, 'task_id', None),
                    'cust_id': getattr(h, 'cust_id', None), 'week_of': getattr(h, 'week_of', None),
                    'company': getattr(h, 'company', '') or '', 'charge': getattr(h, 'charge', None),
                    'done_by': getattr(h, 'done_by', '') or '', 'emp_id': getattr(h, 'emp_id', None),
                    'cash_paid': getattr(h, 'cash_paid', None), 'commission': getattr(h, 'commission', None),
                    'tax': getattr(h, 'tax', None), 'route': getattr(h, 'route', '') or '',
                    'cod': getattr(h, 'cod', None), 'voucher': getattr(h, 'voucher', None),
                    'price': getattr(h, 'price', None), 'description': getattr(h, 'description', '') or '',
                    'taxable': getattr(h, 'taxable', None), 'comm': getattr(h, 'comm', None),
                    'master_id': getattr(h, 'master_id', None), 'other_bill': getattr(h, 'other_bill', None),
                    'task_type': getattr(h, 'task_type', '') or '', 'comment': getattr(h, 'comment', '') or '',
                    'adjust_amount': getattr(h, 'adjust_amount', None), 'mailto': getattr(h, 'mailto', None),
                    'task_order': getattr(h, 'task_order', None), 'adv_date': getattr(h, 'adv_date', None),
                    'adv_bill': getattr(h, 'adv_bill', None), 'order': getattr(h, 'order', None),
                    'adv_freq': getattr(h, 'adv_freq', None), 'adv_credit': getattr(h, 'adv_credit', None),
                    'spec_note': getattr(h, 'spec_note', None), 'frequency': getattr(h, 'frequency', None),
                    'spec_equip': getattr(h, 'spec_equip', None), 'week_done': getattr(h, 'week_done', None),
                    'emp_paid': getattr(h, 'emp_paid', None), 'work_order': getattr(h, 'work_order', '') or '',
                    'invoice_number': getattr(h, 'invoice_number', '') or '',
                }

            data = [_fmt(h) for h in qs]

            if cache_key:
                cache.set(cache_key, data, CACHE_TTL)
        except Exception:
            data = []

    if count_only:
        return JsonResponse({'count': len(data)})
    return JsonResponse({'count': len(data), 'tasks': data})


# /invoice_tasks
@csrf_exempt
@require_POST
def monthly_invoice_tasks(request):
    try:
        payload = json.loads(request.body.decode('utf-8') or '{}')
    except Exception:
        return JsonResponse({'error': 'invalid json'}, status=400)

    q = str(payload.get('q', '')).strip()
    refresh = payload.get('refresh') in (True, '1', 'true', 'True')
    cc = request.META.get('HTTP_CACHE_CONTROL', '')
    count_only = validate_bool(payload.get('count_only'))
    limit = int(payload.get('limit', MAX_RECORDS))

    # --- Filter Extraction ---
    uid = payload.get('uid')
    task_id = payload.get('task_id')
    master_id = payload.get('master_id')
    cust_id = payload.get('cust_id')
    company = payload.get('company')
    invoice_number = payload.get('invoice_number')
    week_of = payload.get('week_of')
    week_done = payload.get('week_done')
    emp_id = payload.get('emp_id')
    route = payload.get('route')
    done_by = payload.get('done_by')
    work_order = payload.get('work_order')

    # --- DB Filtering Logic ---
    filters = {}
    if uid: filters['uid'] = int(uid)
    if task_id: filters['task_id'] = int(task_id)
    if master_id: filters['master_id'] = master_id
    if cust_id: filters['cust_id'] = cust_id
    if invoice_number: filters['invoice_number'] = invoice_number
    if emp_id: filters['emp_id'] = int(emp_id)
    if company: filters['company__icontains'] = company
    if week_of: filters['week_of'] = week_of
    if week_done: filters['week_done'] = week_done
    if route: filters['route__iexact'] = route
    if done_by: filters['done_by__icontains'] = done_by
    if work_order: filters['work_order__icontains'] = work_order

    # --- Caching Strategy ---
    # Only cache simple lookups. Bypass cache for any complex filter combinations.
    cache_key = None
    if not filters and not q:
        cache_key = 'accounting_invoice_tasks_v1_all'
    elif len(filters) == 1 and 'uid' in filters:
        cache_key = f'accounting_invoice_tasks_v1_uid_{uid}'
    elif len(filters) == 1 and 'task_id' in filters:
        cache_key = f'accounting_invoice_tasks_v1_task_{task_id}'

    if 'no-cache' in cc or 'max-age=0' in cc:
        refresh = True

    data = None
    if not refresh and cache_key:
        data = cache.get(cache_key)

    if data is None:
        try:
            Model = apps.get_model('accounting', 'MonthlyInvoice')
            qs = Model.objects.filter(**filters)

            if q:
                if q.isdigit():
                    qs = qs.filter(
                        Q(uid=q) | Q(task_id=q) | Q(emp_id=q) |
                        Q(invoice_number__icontains=q)
                    )
                else:
                    qs = qs.filter(
                        Q(company__icontains=q) | Q(description__icontains=q) |
                        Q(cust_id__icontains=q) | Q(invoice_number__icontains=q)
                    )

            qs = qs[:limit]

            def _dec(v):
                return str(v) if v is not None else None

            def _fmt(t):
                return {
                    'uid': getattr(t, 'uid', None), 'task_id': getattr(t, 'task_id', None),
                    'cust_id': getattr(t, 'cust_id', None), 'week_of': getattr(t, 'week_of', None),
                    'company': getattr(t, 'company', '') or '', 'charge': _dec(getattr(t, 'charge', None)),
                    'invoice_number': getattr(t, 'invoice_number', '') or '',
                    'done_by': getattr(t, 'done_by', '') or '',
                    'emp_id': getattr(t, 'emp_id', None), 'cash_paid': _dec(getattr(t, 'cash_paid', None)),
                    'commission': getattr(t, 'commission', None), 'tax': getattr(t, 'tax', None),
                    'route': getattr(t, 'route', None), 'cod': getattr(t, 'cod', None),
                    'voucher': getattr(t, 'voucher', None), 'price': _dec(getattr(t, 'price', None)),
                    'description': getattr(t, 'description', '') or '', 'taxable': getattr(t, 'taxable', None),
                    'comm': _dec(getattr(t, 'comm', None)), 'master_id': getattr(t, 'master_id', None),
                    'other_bill': getattr(t, 'other_bill', None), 'type': getattr(t, 'type', '') or '',
                    'comment': getattr(t, 'comment', '') or '',
                    'adjust_amount': _dec(getattr(t, 'adjust_amount', None)),
                    'mailto': getattr(t, 'mailto', None), 'task_order': getattr(t, 'task_order', None),
                    'adv_date': getattr(t, 'adv_date', None), 'adv_bill': getattr(t, 'adv_bill', None),
                    'order': getattr(t, 'order', None), 'adv_freq': getattr(t, 'adv_freq', None),
                    'adv_credit': getattr(t, 'adv_credit', None), 'spec_note': getattr(t, 'spec_note', None),
                    'frequency': getattr(t, 'frequency', None), 'spec_equip': getattr(t, 'spec_equip', None),
                    'week_done': getattr(t, 'week_done', None), 'emp_paid': getattr(t, 'emp_paid', None),
                    'work_order': getattr(t, 'work_order', '') or '', 'status': getattr(t, 'status', None),
                    'temp_deposit_date': getattr(t, 'temp_deposit_date', None),
                    'selected': getattr(t, 'selected', None),
                }

            data = [_fmt(t) for t in qs]

            if cache_key:
                cache.set(cache_key, data, CACHE_TTL)
        except Exception:
            data = []

    if count_only:
        return JsonResponse({'count': len(data)})
    return JsonResponse({'count': len(data), 'tasks': data})


@csrf_exempt
@require_POST
def edit_monthly_invoice_task(request):
    try:
        payload = json.loads(request.body.decode('utf-8') or '{}')
    except Exception:
        return JsonResponse({'error': 'invalid json'}, status=400)

    uid = payload.get('uid') or request.POST.get('uid')
    if uid is None:
        return JsonResponse({'error': 'missing uid'}, status=400)
    try:
        uid = int(uid)
    except Exception:
        return JsonResponse({'error': 'invalid uid'}, status=400)

    try:
        # Use the actual table model for updates
        Table = apps.get_model('accounting', 'MonthlyInvoice')
        # Use the view model for reading back rich data
        View = apps.get_model('payroll', 'PayrollTasks')
    except Exception:
        return JsonResponse({'error': 'model not found'}, status=500)

    try:
        r = Table.objects.filter(uid=uid).first()
        if not r:
            return JsonResponse({'count': 0, 'pselect': []}, status=404)

        def parse_date(val):
            if not val: return None
            try:
                return datetime.strptime(val, '%m/%d/%Y')
            except ValueError:
                return None

        # Map payload fields to model fields
        if 'week_of' in payload:
            r.week_of = parse_date(payload['week_of'])
        if 'company' in payload:
            r.company = payload['company']
        if 'charge' in payload:
            r.charge = payload['charge']
        if 'invoice_number' in payload:
            r.invoice_number = payload['invoice_number']
        if 'done_by' in payload:
            r.done_by = payload['done_by']
        if 'emp_id' in payload:
            r.emp_id = payload['emp_id']
        if 'cash_paid' in payload:
            r.cash_paid = payload['cash_paid']
        if 'commission' in payload:
            r.commission = payload['commission']
        if 'tax' in payload:
            r.tax = payload['tax']
        if 'route' in payload:
            r.route = payload['route']
        if 'cod' in payload:
            r.cod = validate_bool(payload['cod'])
        if 'voucher' in payload:
            r.voucher = validate_bool(payload['voucher'])
        if 'price' in payload:
            r.price = payload['price']
        if 'description' in payload:
            r.description = payload['description']
        if 'taxable' in payload:
            r.taxable = validate_bool(payload['taxable'])
        if 'comm' in payload:
            r.comm = payload['comm']
        if 'master_id' in payload:
            r.master_id = payload['master_id']
        if 'other_bill' in payload:
            r.other_bill = validate_bool(payload['other_bill'])
        if 'type' in payload:
            r.type = payload['type']
        if 'comment' in payload:
            r.comment = payload['comment']
        if 'adjust_amount' in payload:
            r.adjust_amount = payload['adjust_amount']
        if 'mailto' in payload:
            r.mailto = validate_bool(payload['mailto'])
        if 'order' in payload:
            r.order = payload['order']
        if 'task_order' in payload:
            r.task_order = payload['task_order']
        if 'adv_date' in payload:
            r.adv_date = parse_date(payload['adv_date'])
        if 'adv_bill' in payload:
            r.adv_bill = validate_bool(payload['adv_bill'])
        if 'adv_freq' in payload:
            r.adv_freq = payload['adv_freq']
        if 'adv_credit' in payload:
            r.adv_credit = payload['adv_credit']
        if 'spec_note' in payload:
            r.spec_note = payload['spec_note']
        if 'frequency' in payload:
            r.frequency = payload['frequency']
        if 'spec_equip' in payload:
            r.spec_equip = validate_bool(payload['spec_equip'])
        if 'week_done' in payload:
            r.week_done = parse_date(payload['week_done'])
        if 'status' in payload:
            r.status = payload['status']
        if 'emp_paid' in payload:
            r.emp_paid = payload['emp_paid']
        if 'work_order' in payload:
            r.work_order = payload['work_order']
        if 'temp_deposit_date' in payload:
            r.temp_deposit_date = parse_date(payload['temp_deposit_date'])
        if 'selected' in payload:
            r.selected = validate_bool(payload['selected'])

        r.save()

        view_rec = View.objects.filter(uid=uid).first()

        def _fmt_task(p):
            # Helper to format date
            def _d(val):
                if hasattr(val, 'strftime'): return val.strftime('%m/%d/%Y')
                return ''

            return {
                'uid': getattr(p, 'uid', '') or '',
                'task_id': getattr(p, 'id', '') or '',
                'cust_id': getattr(p, 'cust_id', '') or '',
                'week_of': _d(getattr(p, 'week_of', None)),
                'company': getattr(p, 'company', '') or '',
                'charge': getattr(p, 'charge', '') or '',
                'done_by': getattr(p, 'done_by', '') or '',
                'route': getattr(p, 'route', '') or '',
                'work_order': getattr(p, 'work_order', '') or '',
                'comment': getattr(p, 'comment', '') or ''
            }

        return JsonResponse({'count': 1, 'task': [_fmt_task(view_rec)]})
    except Exception as e:
        return JsonResponse({'error': f'update failed: {str(e)}'}, status=500)


@csrf_exempt
@require_POST
def debug_accounting_model(request):
    info = {'DJANGO_SETTINGS_MODULE': os.environ.get('DJANGO_SETTINGS_MODULE'),
            'INSTALLED_APPS_contains_accounting': 'accounting' in getattr(settings, 'INSTALLED_APPS', [])}
    # environment
    # app config
    try:
        app_cfg = apps.get_app_config('accounting')
        info['app_config_found'] = True
        info['app_label'] = app_cfg.label
        info['registered_model_names'] = sorted(list(app_cfg.models.keys()))
    except Exception as e:
        info['app_config_found'] = False
        info['app_config_error'] = repr(e)

    # apps.get_model attempt
    try:
        Model = apps.get_model('accounting', 'Deposit')
        info['apps_get_model_result'] = str(Model)
    except Exception as e:
        info['apps_get_model_error'] = repr(e)

    # sys.modules and direct import
    info['sys_modules_has_accounting_models'] = 'accounting.models' in sys.modules
    info['sys_modules_accounting_models_repr'] = repr(
        sys.modules.get('accounting.models')) if 'accounting.models' in sys.modules else None

    try:
        mod = importlib.import_module('accounting.models')
        info['import_ok'] = True
        info['accounting_models_has_Deposit'] = hasattr(mod, 'Deposit')
    except Exception:
        info['import_ok'] = False
        info['import_traceback'] = traceback.format_exc()

    return JsonResponse(info)


def edit_invoice(request):
    pass


def edit_invoice_task(request):
    pass


def edit_deposit(request):
    pass


def edit_invoice_history(request):
    pass
