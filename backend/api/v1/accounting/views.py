# python file api/accounting/views.py
from django.conf import settings
import importlib, sys, traceback, os
from django.db.models import Q
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.core.cache import cache
from django.apps import apps
from base.settings import CACHE_TTL, MAX_RECORDS


# python
@require_GET
def deposit_list(request):
    q = request.GET.get('q', '').strip()
    emp_id = request.GET.get('emp_id', '').strip()
    deposit_id = request.GET.get('deposit_id', '').strip()
    description = request.GET.get('description', '').strip()
    refresh = request.GET.get('refresh') in ('1', 'true', 'True')
    cc = request.META.get('HTTP_CACHE_CONTROL', request.GET.get('cache-Control', ''))
    count_only = request.GET.get('count_only', '0') in ('1', 'true', 'True')

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
    else:
        try:
            try:
                Model = apps.get_model('accounting', 'Deposit')
            except LookupError:
                Model = None

            if Model is None:
                return JsonResponse({'count': 0, 'deposits': []})

            qs = Model.objects.filter(**filters) if filters else Model.objects.all()[:MAX_RECORDS]

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

        if not q and not refresh:
            cache.set(cache_key, data, CACHE_TTL)

    if count_only:
        return JsonResponse({'count': len(data)})

    return JsonResponse({'count': len(data), 'deposits': data})


# python
@require_GET
def invoice_history_tasks(request):
    q = request.GET.get('q', '').strip()
    refresh = request.GET.get('refresh') in ('1', 'true', 'True')
    cc = request.META.get('HTTP_CACHE_CONTROL', request.GET.get('cache-Control', ''))
    count_only = request.GET.get('count_only', '0') in ('1', 'true', 'True')

    uid = request.GET.get('uid', '').strip()
    task_id = request.GET.get('task_id', '').strip()
    invoice_number = request.GET.get('invoice_number', '').strip()
    emp_id = request.GET.get('emp_id', '').strip()
    cust_id = request.GET.get('cust_id', '').strip()
    master_id = request.GET.get('master_id', '').strip()
    company = request.GET.get('company', '').strip()
    week_of = request.GET.get('week_of', '').strip()
    week_done = request.GET.get('week_done', '').strip()
    route = request.GET.get('route', '').strip()
    done_by = request.GET.get('done_by', '').strip()
    work_order = request.GET.get('work_order', '').strip()

    # respect cache-control
    if 'no-cache' in cc or 'max-age=0' in cc:
        refresh = True

    # choose a cache key
    if uid:
        cache_key = f'accounting_invoice_history_v1_task_{uid}'
    elif task_id:
        cache_key = f'accounting_invoice_history_v1_task_{task_id}'
    elif invoice_number:
        cache_key = f'accounting_invoice_history_v1_invoice_{invoice_number}'
    elif emp_id:
        cache_key = f'accounting_invoice_history_v1_invoice_{emp_id}'
    elif cust_id:
        cache_key = f'accounting_invoice_history_v1_cust_{cust_id}'
    elif master_id:
        cache_key = f'accounting_invoice_history_v1_master_{master_id}'
    elif company:
        cache_key = f'accounting_invoice_history_v1_company_{company}'
    elif week_of:
        cache_key = f'accounting_invoice_history_v1_week_of_{week_of}'
    elif week_done:
        cache_key = f'accounting_invoice_history_v1_week_done_{week_done}'
    elif route:
        cache_key = f'accounting_invoice_history_v1_route_{route}'
    elif done_by:
        cache_key = f'accounting_invoice_history_v1_done_by_{done_by}'
    elif work_order:
        cache_key = f'accounting_invoice_history_v1_work_order_{work_order}'
    else:
        cache_key = 'accounting_invoice_history_v1_all'

    data = None if refresh else cache.get(cache_key)

    if data is not None:
        # filter the cached list by q if provided
        if q:
            ql = q.lower()
            if q.isdigit():
                # numeric queries: match numeric fields as text
                data = [
                    t for t in data
                    if ql == str(t.get('uid', '')).lower()
                       or ql == str(t.get('task_id', '')).lower()
                       or ql == str(t.get('emp_id', '')).lower()
                ]
            else:
                data = [
                    t for t in data
                    if ql in (t.get('company') or '').lower()
                       or ql in (t.get('cust_id') or '').lower()
                       or ql in (t.get('master_id') or '').lower()
                       or ql in (t.get('done_by') or '').lower()
                       or ql in (t.get('invoice_number') or '').lower()
                       or ql in (t.get('work_order') or '').lower()
                       or ql in (t.get('week_of') or '').lower()
                ]
    else:
        try:
            try:
                Model = apps.get_model('accounting', 'HistOfInvcCurrent')
            except LookupError:
                Model = None

            if Model is None:
                data = []
            else:
                # build filters with validation
                filters = {}
                if uid not in ('', None):
                    filters['uid'] = int(uid)

                if task_id not in ('', None):
                    filters['task_id'] = int(task_id)

                if invoice_number not in ('', None):
                    filters['invoice_number'] = invoice_number

                if emp_id not in ('', None):
                    filters['emp_id'] = int(emp_id)

                if cust_id not in ('', None):
                    filters['cust_id'] = cust_id

                if master_id not in ('', None):
                    filters['master_id'] = master_id

                if company not in ('', None):
                    filters['company'] = company

                if week_of not in ('', None):
                    filters['week_of'] = week_of

                if week_done not in ('', None):
                    filters['week_done'] = week_done

                if route not in ('', None):
                    filters['route__iexact'] = route

                if done_by not in ('', None):
                    filters['done_by'] = done_by

                if work_order not in ('', None):
                    filters['work_order'] = work_order

                qs = Model.objects.filter(**filters) if filters else Model.objects.all()[:MAX_RECORDS]

                if q:
                    if q.isdigit():
                        qi = int(q)
                        qs = qs.filter(
                            Q(uid=qi) |
                            Q(task_id=qi) |
                            Q(emp_id=qi)
                        )
                    else:
                        qs = qs.filter(
                            Q(company__icontains=q) |
                            Q(description__icontains=q) |
                            Q(cust_id__icontains=q) |
                            Q(done_by__icontains=q) |
                            Q(invoice_number__icontains=q) |
                            Q(work_order__icontains=q) |
                            Q(Type__icontains=q) |
                            Q(comment__icontains=q)
                        )

                def _fmt(h):
                    return {
                        'uid': getattr(h, 'uid', None),
                        'task_id': getattr(h, 'task_id', None),
                        'cust_id': getattr(h, 'cust_id', None),
                        'week_of': getattr(h, 'week_of', None),
                        'company': getattr(h, 'company', '') or '',
                        'charge': getattr(h, 'charge', None),
                        'done_by': getattr(h, 'done_by', '') or '',
                        'emp_id': getattr(h, 'emp_id', None),
                        'cash_paid': getattr(h, 'cash_paid', None),
                        'commission': getattr(h, 'commission', None),
                        'tax': getattr(h, 'tax', None),
                        'route': getattr(h, 'route', '') or '',
                        'cod': getattr(h, 'cod', None),
                        'voucher': getattr(h, 'voucher', None),
                        'price': getattr(h, 'price', None),
                        'description': getattr(h, 'description', '') or '',
                        'taxable': getattr(h, 'taxable', None),
                        'comm': getattr(h, 'comm', None),
                        'master_id': getattr(h, 'master_id', None),
                        'other_bill': getattr(h, 'other_bill', None),
                        'task_type': getattr(h, 'task_type', '') or '',
                        'comment': getattr(h, 'comment', '') or '',
                        'adjust_amount': getattr(h, 'adjust_amount', None),
                        'mailto': getattr(h, 'mailto', None),
                        'task_order': getattr(h, 'task_order', None),
                        'adv_date': getattr(h, 'adv_date', None),
                        'adv_bill': getattr(h, 'adv_bill', None),
                        'order': getattr(h, 'order', None),
                        'adv_freq': getattr(h, 'adv_freq', None),
                        'adv_credit': getattr(h, 'adv_credit', None),
                        'spec_note': getattr(h, 'spec_note', None),
                        'frequency': getattr(h, 'frequency', None),
                        'spec_equip': getattr(h, 'spec_equip', None),
                        'week_done': getattr(h, 'week_done', None),
                        'emp_paid': getattr(h, 'emp_paid', None),
                        'work_order': getattr(h, 'work_order', '') or '',
                        'invoice_number': getattr(h, 'invoice_number', '') or '',
                    }

                data = [_fmt(h) for h in qs]

        except Exception:
            data = []

        if not q and not refresh:
            cache.set(cache_key, data, CACHE_TTL)

    if count_only:
        return JsonResponse({'count': len(data)})

    return JsonResponse({'count': len(data), 'tasks': data})


# /invoice_tasks
@require_GET
def invoice_tasks(request):
    q = request.GET.get('q', '').strip()
    refresh = request.GET.get('refresh') in ('1', 'true', 'True')
    cc = request.META.get('HTTP_CACHE_CONTROL', request.GET.get('cache-Control', ''))
    count_only = request.GET.get('count_only', '0') in ('1', 'true', 'True')

    uid = request.GET.get('uid', '').strip()
    task_id = request.GET.get('task_id', '').strip()
    master_id = request.GET.get('master_id', '').strip()
    cust_id = request.GET.get('cust_id', '').strip()
    company = request.GET.get('company', '').strip()
    invoice_number = request.GET.get('invoice_number', '').strip()
    week_of = request.GET.get('week_of', '').strip()
    week_done = request.GET.get('week_done', '').strip()
    emp_id = request.GET.get('emp_id', '').strip()
    route = request.GET.get('route', '').strip()
    done_by = request.GET.get('done_by', '').strip()
    work_order = request.GET.get('work_order', '').strip()

    # respect cache-control request
    if 'no-cache' in cc or 'max-age=0' in cc:
        refresh = True

    # choose a cache key (prefer specific selectors)
    if uid:
        cache_key = f'accounting_invoice_tasks_v1_uid_{uid}'
    elif task_id:
        cache_key = f'accounting_invoice_tasks_v1_task_{task_id}'
    elif cust_id:
        cache_key = f'accounting_invoice_tasks_v1_cust_{cust_id}'
    elif master_id:
        cache_key = f'accounting_invoice_tasks_v1_master_{master_id}'
    elif invoice_number:
        cache_key = f'accounting_invoice_tasks_v1_invoice_{invoice_number}'
    else:
        cache_key = 'accounting_invoice_tasks_v1_all'

    data = None if refresh else cache.get(cache_key)

    if data is not None:
        # filter the cached list by q if provided
        if q:
            ql = q.lower()
            data = [
                t for t in data
                if ql in str(t.get('uid', '')).lower()
                   or ql in (t.get('cust_id') or '').lower()
                   or ql in (t.get('master_id') or '').lower()
                   or ql in (t.get('done_by') or '').lower()
                   or ql in (t.get('invoice_number') or '').lower()
                   or ql in (t.get('work_order') or '').lower()
                   or ql in (t.get('week_of') or '').lower()
            ]
    else:
        try:
            try:
                Model = apps.get_model('accounting', 'MonthlyInvoice')
            except LookupError:
                Model = None

            if Model is None:
                data = []
            else:
                # build filters independently so multiple params may be combined
                filters = {}
                try:
                    if uid not in ('', None):
                        filters['uid'] = int(uid)
                except (ValueError, TypeError):
                    return JsonResponse({'count': 0, 'tasks': []})

                try:
                    if task_id not in ('', None):
                        filters['task_id'] = int(task_id)
                except (ValueError, TypeError):
                    return JsonResponse({'count': 0, 'tasks': []})

                if master_id not in ('', None):
                    filters['master_id'] = master_id

                if cust_id not in ('', None):
                    filters['cust_id'] = cust_id

                if invoice_number not in ('', None):
                    filters['invoice_number'] = invoice_number

                try:
                    if emp_id not in ('', None):
                        filters['emp_id'] = int(emp_id)
                except (ValueError, TypeError):
                    return JsonResponse({'count': 0, 'tasks': []})

                if company not in ('', None):
                    filters['company__icontains'] = company

                if week_of not in ('', None):
                    filters['week_of'] = week_of

                if week_done not in ('', None):
                    filters['week_done'] = week_done

                if route not in ('', None):
                    filters['route__iexact'] = route

                if done_by not in ('', None):
                    filters['done_by__iexact'] = done_by

                if work_order not in ('', None):
                    filters['work_order__iexact'] = work_order

                qs = Model.objects.filter(**filters) if filters else Model.objects.all()
                if not filters:
                    qs = qs[:MAX_RECORDS]

                if q:
                    # numeric q prefers numeric-id fields
                    if q.isdigit():
                        qi = int(q)
                        qs = qs.filter(
                            Q(uid=qi) |
                            Q(id_ref=qi) |
                            Q(emp_id=qi) |
                            Q(invoice_number__icontains=q)
                        )
                    else:
                        qs = qs.filter(
                            Q(company__icontains=q) |
                            Q(description__icontains=q) |
                            Q(cust_id__icontains=q) |
                            Q(invoice_number__icontains=q)
                        )

                def _dec(v):
                    # return decimal as plain string when present
                    return str(v) if v is not None else None

                def _fmt(t):
                    return {
                        'uid': getattr(t, 'uid', None),
                        'task_id': getattr(t, 'task_id', None),
                        'cust_id': getattr(t, 'cust_id', None),
                        'week_of': getattr(t, 'week_of', None),
                        'company': getattr(t, 'company', '') or '',
                        'charge': _dec(getattr(t, 'charge', None)),
                        'invoice_number': getattr(t, 'invoice_number', '') or '',
                        'done_by': getattr(t, 'done_by', '') or '',
                        'emp_id': getattr(t, 'emp_id', None),
                        'cash_paid': _dec(getattr(t, 'cash_paid', None)),
                        'commission': getattr(t, 'commission', None),
                        'tax': getattr(t, 'tax', None),
                        'route': getattr(t, 'route', None),
                        'cod': getattr(t, 'cod', None),
                        'voucher': getattr(t, 'voucher', None),
                        'price': _dec(getattr(t, 'price', None)),
                        'description': getattr(t, 'description', '') or '',
                        'taxable': getattr(t, 'taxable', None),
                        'comm': _dec(getattr(t, 'comm', None)),
                        'master_id': getattr(t, 'master_id', None),
                        'other_bill': getattr(t, 'other_bill', None),
                        'type': getattr(t, 'type', '') or '',
                        'comment': getattr(t, 'comment', '') or '',
                        'adjust_amount': _dec(getattr(t, 'adjust_amount', None)),
                        'mailto': getattr(t, 'mailto', None),
                        'task_order': getattr(t, 'task_order', None),
                        'adv_date': getattr(t, 'adv_date', None),
                        'adv_bill': getattr(t, 'adv_bill', None),
                        'order': getattr(t, 'order', None),
                        'adv_freq': getattr(t, 'adv_freq', None),
                        'adv_credit': getattr(t, 'adv_credit', None),
                        'spec_note': getattr(t, 'spec_note', None),
                        'frequency': getattr(t, 'frequency', None),
                        'spec_equip': getattr(t, 'spec_equip', None),
                        'week_done': getattr(t, 'week_done', None),
                        'emp_paid': getattr(t, 'emp_paid', None),
                        'work_order': getattr(t, 'work_order', '') or '',
                        'status': getattr(t, 'status', None),
                        'temp_deposit_date': getattr(t, 'temp_deposit_date', None),
                        'selected': getattr(t, 'selected', None),
                    }

                data = [_fmt(t) for t in qs]

        except Exception:
            data = []

        if not q and not refresh:
            cache.set(cache_key, data, CACHE_TTL)

    if count_only:
        return JsonResponse({'count': len(data)})

    return JsonResponse({'count': len(data), 'tasks': data})


@require_GET
def debug_accounting_model(request):
    info = {}
    # environment
    info['DJANGO_SETTINGS_MODULE'] = os.environ.get('DJANGO_SETTINGS_MODULE')
    info['INSTALLED_APPS_contains_accounting'] = 'accounting' in getattr(settings, 'INSTALLED_APPS', [])
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