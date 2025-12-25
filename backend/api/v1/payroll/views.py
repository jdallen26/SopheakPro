# python
import importlib
import os
import sys
import traceback

from django.db.models import Q
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_GET
from django.core.cache import cache
from django.apps import apps
from rest_framework.response import Response

from base import settings
from base.settings import CACHE_TTL, MAX_RECORDS
from utils.types import validate_bool


@require_GET
def comments(request):
    filters = {}
    q = request.GET.get('q', '').strip()
    comment = request.GET.get('comment', '').strip()
    refresh = request.GET.get('refresh') in ('1', 'true', 'True')
    cc = request.META.get('HTTP_CACHE_CONTROL', request.GET.get('cache-Control', ''))
    count_only = request.GET.get('count_only', '0') in ('1', 'true', 'True')

    if comment not in ('', None):
        filters['comment__icontains'] = comment

    if 'no-cache' in cc or 'max-age=0' in cc:
        refresh = True

    if comment:
        cache_key = f'payroll_comments_v1_comment_{comment}'
    else:
        cache_key = f'payroll_comments_v1_all'

    data = None if refresh else cache.get(cache_key)

    if data is None:
        try:
            try:
                Model = apps.get_model('payroll', 'PayrollComments')
            except LookupError:
                return JsonResponse({'count': 0, 'comments': []})
            if Model is None:
                return JsonResponse({'count': len(data)})

            qs = Model.objects.filter(**filters) if filters else Model.objects.all()[:MAX_RECORDS]

            def _fmt_comment(c):
                return {
                    'comment': getattr(c, 'comment', None),
                }

            data = [_fmt_comment(c) for c in qs]

        except Exception:
            data = []

        if not q and not refresh:
            cache.set(cache_key, data, CACHE_TTL)

    if count_only:
        return JsonResponse({'count': len(data)})

    return JsonResponse({'count': len(data), 'comments': data})


@require_GET
# /sites
def sites(request):
    q = request.GET.get('q', '').strip()
    filters = {}
    refresh = request.GET.get('refresh') in ('1', 'true', 'True')
    cc = request.META.get('HTTP_CACHE_CONTROL', request.GET.get('cache-Control', ''))
    cust_id = request.GET.get('cust_id', '')
    company = request.GET.get('company', '')
    in_monthly = validate_bool(request.GET.get('in_monthly', ''))
    show_all = validate_bool(request.GET.get('show_all', '0') in ('1', 'true', 'True'))
    count_only = validate_bool(request.GET.get('count_only', '0') in ('1', 'true', 'True'))

    if cust_id not in ('', None):
        filters['cust_id'] = cust_id
    if company not in ('', None):
        filters['company__icontains'] = company

    if in_monthly:
        filters['in_monthly'] = in_monthly

    if 'no-cache' in cc or 'max-age=0' in cc:
        refresh = True

    if cust_id:
        cache_key = f'payroll_sites_v1_cust_{cust_id}'
    else:
        cache_key = f'payroll_sites_v1_show_all_{show_all}'

    data = None if refresh else cache.get(cache_key)
    if data is not None:
        if q:
            ql = q.lower()
            data = [d for d in data if
                    ql in (d.get('company', '') or '').lower() or ql in str(d.get('cust_id', '')).lower()]
    else:
        try:
            # Try likely model names and app labels to avoid LookupError
            def _get_model(app_labels, names):
                for app_label in app_labels:
                    for name in names:
                        try:
                            return apps.get_model(app_label, name)
                        except LookupError:
                            continue
                return None

            model = _get_model(
                app_labels=['payroll', 'api.payroll'],
                names=['PayrollSites', 'PayrollSite', 'Sites', 'Site']
            )
            if model is None:
                # model is not registered; return empty consistent response
                data = []
            else:
                qs = model.objects.filter(**filters) if filters else model.objects.all()[:MAX_RECORDS]
                if q:
                    qs = qs.filter(company__icontains=q) | qs.filter(cust_id__icontains=q)

                data = [{
                    'cust_id': site.cust_id,
                    'company': site.company,
                    'cod': bool(getattr(site, 'cod', False)),
                    'mailto': bool(getattr(site, 'mailto', False)),
                    'taxable': bool(getattr(site, 'taxable', False)),
                    'voucher': bool(getattr(site, 'voucher', False)),
                    'other_bill': bool(getattr(site, 'other_bill', False)),
                    'adv_bill': bool(getattr(site, 'adv_bill', False)),
                    'in_monthly': bool(getattr(site, 'in_monthly', False)),
                } for site in qs]

        except Exception:
            data = []

        if not q and not refresh:
            cache.set(cache_key, data, CACHE_TTL)

    if count_only:
        return JsonResponse({'count': len(data)})

    return JsonResponse({'count': len(data), 'sites': data})


# Used in the Insert Entry popup
@require_GET
def insert_entry_task_selection(request):
    filters = {}
    count_only = validate_bool(request.GET.get('count_only'))
    q = request.GET.get('q', '').strip()
    cust_id = request.GET.get('cust_id', '').strip()

    if cust_id not in ('', None):
        filters['cust_id__iexact'] = cust_id

    if q not in ('', None):
        filters['description__icontains'] = q

    try:
        try:
            Tasks = apps.get_model('routing', 'Tasks')
        except LookupError:
            return JsonResponse({'count': 0, 'tasks': []})

    except Exception:
        return JsonResponse({'count': 0, 'tasks': []})

    qs = Tasks.objects.filter(**filters) if filters else Tasks.objects.all()[:MAX_RECORDS]

    def _fmt_task(t):
        return {
            'id': getattr(t, 'id', None) or getattr(t, 'pk', None),
            'cust_id': getattr(t, 'cust_id', '') or '',
            'description': getattr(t, 'description', '') or getattr(t, 'desc', '') or '',
            'grand_total': getattr(t, 'grand_total', None) or getattr(t, 'grandtotal', None),
            'task_order': getattr(t, 'task_order', None),
        }

    if count_only:
        return JsonResponse({'count': len(qs)})

    data = [_fmt_task(t) for t in qs]
    return JsonResponse({'count': len(data), 'tasks': data})


@require_GET
# /task_list
def task_list(request):
    filters = {}
    q = request.GET.get('q', '').strip()
    cust_id = request.GET.get('cust_id', '').strip()
    route = request.GET.get('route', '').strip()
    week_of = request.GET.get('week_of', '').strip()
    count_only = validate_bool(request.GET.get('count_only'))

    if cust_id not in ('', None):
        filters['cust_id__iexact'] = cust_id
    if route not in ('', None):
        filters['route__iexact'] = route
    if week_of not in ('', None):
        filters['week_of'] = week_of

    try:
        Tasks = apps.get_model('payroll', 'PayrollTasks')
        if Tasks is None:
            return JsonResponse({'count': 0, 'tasks': []})

        base_qs = Tasks.objects.filter(**filters) if filters else Tasks.objects.all()
        base_qs = base_qs.order_by('week_of', 'uid')
        qs = base_qs[:MAX_RECORDS]

        def _fmt_task(t):
            return {
                'uid': getattr(t, 'uid', None),
                'id': getattr(t, 'id', None),
                'cust_id': getattr(t, 'cust_id', '') or '',
                'week_of': getattr(t, 'week_of', None),
                'company': getattr(t, 'company', '') or '',
                'charge': str(getattr(t, 'charge', '')),
                'done_by': getattr(t, 'done_by', '') or '',
                'emp_id': getattr(t, 'emp_id', None),
                'cash_paid': str(getattr(t, 'cash_paid', '')),
                'commission': getattr(t, 'commission', None),
                'route': getattr(t, 'route', '') or '',
                'cod': bool(getattr(t, 'cod', False)),
                'price': str(getattr(t, 'price', '')),
                'description': getattr(t, 'description', '') or '',
                'comm': str(getattr(t, 'comm', '')),
                'other_bill': bool(getattr(t, 'other_bill', False)),
                'type': getattr(t, 'type', '') or '',
                'comment': getattr(t, 'comment', '') or '',
                'order': getattr(t, 'order', None),
                'task_order': getattr(t, 'task_order', None),
                'spec_equip': bool(getattr(t, 'spec_equip', False)),
                'week_done': getattr(t, 'week_done', None),
                'work_order': getattr(t, 'work_order', '') or '',
                'temp_deposit_date': getattr(t, 'temp_deposit_date', None),
                'site_comm': getattr(t, 'site_comm', None),

            }

        data = [_fmt_task(t) for t in qs]

    except Exception:
        data = []

    if count_only:
        return JsonResponse({'count': len(data)})

    return JsonResponse({'count': len(data), 'tasks': data})


@require_GET
# /pselect
def pselect(request):
    filters = {}
    psid = request.GET.get('psid', '')
    # Build filters (respect the presence of params)
    if psid not in ('', None):
        try:
            filters['uid'] = int(psid)
        except (ValueError, TypeError):
            # invalid id -> no results
            return JsonResponse({'count': 0, 'pselect': []})
    else:
        return JsonResponse({'count': 0, 'pselect': []})

    try:
        try:
            p_model = apps.get_model('payroll', 'Pselect')
        except:
            return JsonResponse({'count': 0, 'pselect': []})

        p_rec = p_model.objects.filter(**filters) if filters else p_model.objects.all()[:MAX_RECORDS]

        def _fmt_task(p):
            return {
                'uid': getattr(p, 'uid', None),
                'emp_id': int(getattr(p, 'emp_id', None)),
                'start': getattr(p, 'start_mmddyyyy', '') or '',
                'end': getattr(p, 'end_mmddyyyy', '') or '',
                'week_done': getattr(p, 'week_done_mmddyyyy', '') or '',
                'old_start': getattr(p, 'oldstart_mmddyyyy', '') or '',
                'old_end': getattr(p, 'oldend_mmddyyyy', '') or '',
                'mile_rate': getattr(p, 'mile_rate', '') or '',
                'chk_price_paid': getattr(p, 'chk_price_paid', '') or '',
                'reim_exp': getattr(p, 'reim_exp', '') or '',
                'otime_percentage': getattr(p, 'otime_percentage', '') or '',
                'spec_equip': bool(getattr(p, 'spec_equip', False)),
                'billing_date': getattr(p, 'billing_date_mmddyyyy', '') or '',
                'invoice_num': getattr(p, 'invoice_num', '') or '',
            }

        data = [_fmt_task(t) for t in p_rec]
    except Exception:
        data = []

    return JsonResponse({'count': len(data), 'pselect': data})


@require_GET
def debug_payroll_model(request):
    info = {}
    # environment
    info['DJANGO_SETTINGS_MODULE'] = os.environ.get('DJANGO_SETTINGS_MODULE')
    info['INSTALLED_APPS_contains_payroll'] = 'payroll' in getattr(settings, 'INSTALLED_APPS', [])
    # app config
    try:
        app_cfg = apps.get_app_config('payroll')
        info['app_config_found'] = True
        info['app_label'] = app_cfg.label
        info['registered_model_names'] = sorted(list(app_cfg.models.keys()))
    except Exception as e:
        info['app_config_found'] = False
        info['app_config_error'] = repr(e)

    # apps.get_model attempt
    try:
        Model = apps.get_model('payroll', 'PayrollTasks')
        info['apps_get_model_result'] = str(Model)
    except Exception as e:
        info['apps_get_model_error'] = repr(e)

    # sys.modules and direct import
    info['sys_modules_has_payroll_models'] = 'payroll.models' in sys.modules
    info['sys_modules_payroll_models_repr'] = repr(
        sys.modules.get('payroll.models')) if 'payroll.models' in sys.modules else None

    try:
        mod = importlib.import_module('payroll.models')
        info['import_ok'] = True
        info['payroll_models_has_Comment'] = hasattr(mod, 'PayrollComments')
    except Exception:
        info['import_ok'] = False
        info['import_traceback'] = traceback.format_exc()

    return JsonResponse(info)
