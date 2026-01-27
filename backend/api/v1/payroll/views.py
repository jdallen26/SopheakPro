# python
import importlib
import os
import sys
import traceback
import json
import utils.strings as st

from datetime import datetime
from django.http import JsonResponse
from django.views.decorators.http import require_GET, require_POST
from django.views.decorators.csrf import csrf_exempt
from django.core.cache import cache
from django.apps import apps

from base import settings
from base.settings import CACHE_TTL, MAX_RECORDS
from utils.types import validate_bool


@csrf_exempt
@require_POST
def comments(request):
    try:
        payload = json.loads(request.body.decode('utf-8') or '{}')
    except Exception:
        return JsonResponse({'count': 0, 'success': False, 'message': st.get_message(st.JSON_INVALID, NAME=request.body)}, status=400)

    filters = {}
    q = str(payload.get('q', '')).strip()
    comment = str(payload.get('comment', '')).strip()
    refresh = payload.get('refresh') in (True, '1', 'true', 'True')
    cc = request.META.get('HTTP_CACHE_CONTROL', '')
    count_only = validate_bool(payload.get('count_only'))
    min_count = payload.get('min_count')

    if comment not in ('', None):
        filters['comment__icontains'] = comment

    if 'no-cache' in cc or 'max-age=0' in cc:
        refresh = True

    if min_count is not None:
        filters['count__gt'] = int(min_count)

    suffix = f'_min_{min_count}' if min_count is not None else ''

    if comment:
        cache_key = f'payroll_comments_v1_comment_{comment}{suffix}'
    else:
        cache_key = f'payroll_comments_v1_all{suffix}'

    data = None if refresh else cache.get(cache_key)

    if data is None:
        try:
            try:
                Model = apps.get_model('payroll', 'PayrollComments')
            except LookupError:
                return JsonResponse({'message': st.get_message(st.INVALID_MODEL_NAME,NAME='payroll/PayrollComments'), 'success': False}, status=500)
            if Model is None:
                return JsonResponse({'message': st.get_message(st.INVALID_MODEL_NAME,NAME='payroll/PayrollComments'), 'success': False}, status=500)

            qs = Model.objects.filter(**filters) if filters else Model.objects.all()
            qs = qs.order_by('comment')

            def _fmt_comment(c):
                return {
                    'id': getattr(c, 'id', None),
                    'comment': getattr(c, 'comment', '').replace('"', '') if getattr(c, 'comment', None) else None,
                    'count': getattr(c, 'count', 0),
                }

            data = [_fmt_comment(c) for c in qs]

        except Exception:
            data = []

        if not q and not refresh:
            cache.set(cache_key, data, CACHE_TTL)

    if count_only:
        return JsonResponse({'count': len(data), 'success': True})

    return JsonResponse({'count': len(data), 'success': True, 'comments': data})


@csrf_exempt
@require_POST
# /sites
def sites(request):
    try:
        payload = json.loads(request.body.decode('utf-8') or '{}')
    except Exception:
        return JsonResponse({'count': 0, 'success': False, 'message': st.get_message(st.JSON_INVALID, NAME=request.body)}, status=400)

    q = str(payload.get('q', '')).strip()
    filters = {}
    refresh = payload.get('refresh') in (True, '1', 'true', 'True')
    cc = request.META.get('HTTP_CACHE_CONTROL', '')
    cust_id = payload.get('cust_id', '')
    company = payload.get('company', '')
    taxable = validate_bool(payload.get('taxable', ''))
    in_monthly = validate_bool(payload.get('in_monthly', ''))

    show_all_val = payload.get('show_all', False)
    if isinstance(show_all_val, str):
        show_all = validate_bool(show_all_val.lower() in ('1', 'true'))
    else:
        show_all = validate_bool(show_all_val)

    count_only_val = payload.get('count_only', False)
    if isinstance(count_only_val, str):
        count_only = validate_bool(count_only_val.lower() in ('1', 'true'))
    else:
        count_only = validate_bool(count_only_val)

    limit = int(payload.get('limit', MAX_RECORDS))

    if cust_id not in ('', None):
        filters['cust_id'] = cust_id
    if company not in ('', None):
        filters['company__icontains'] = company

    if in_monthly:
        filters['in_monthly'] = in_monthly

    if taxable:
        filters['taxable'] = taxable

    # Caching
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
        # Apply limit to cached data if needed (though cache usually stores full set, slicing list is cheap)
        if limit and len(data) > limit:
            data = data[:limit]
    else:
        try:
            model = apps.get_model('payroll', 'PayrollSites')
            if model is None:
                # model is not registered; return empty consistent response
                data = []
            else:
                qs = model.objects.filter(**filters) if filters else model.objects.all()
                if q:
                    qs = qs.filter(company__icontains=q) | qs.filter(cust_id__icontains=q)

                # Apply limit
                qs = qs[:limit]

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
@csrf_exempt
@require_POST
def insert_entry_task_selection(request):
    try:
        payload = json.loads(request.body.decode('utf-8') or '{}')
    except Exception:
        return JsonResponse({'count': 0, 'success': False, 'message': st.INVALID_JSON}, status=400)

    filters = {}
    count_only = validate_bool(payload.get('count_only'))
    q = str(payload.get('q', '')).strip()
    cust_id = str(payload.get('cust_id', '')).strip()
    limit = int(payload.get('limit', MAX_RECORDS))

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

    qs = Tasks.objects.filter(**filters) if filters else Tasks.objects.all()

    # Apply limit
    qs = qs[:limit]

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


@csrf_exempt
@require_POST
# /task_list
def task_list(request):
    try:
        payload = json.loads(request.body.decode('utf-8') or '{}')
    except Exception:
        return JsonResponse({'count': 0, 'success': False, 'message': st.INVALID_JSON}, status=400)

    filters = {}
    cust_id = str(payload.get('cust_id', '')).strip()
    route = str(payload.get('route', '')).strip()
    week_of = str(payload.get('week_of', '')).strip()
    count_only = validate_bool(payload.get('count_only'))
    limit = int(payload.get('limit', MAX_RECORDS))

    # Builtin filters
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
        base_qs = base_qs.order_by('route', 'order', 'company', 'week_of', 'cust_id', 'type', 'task_order')
        qs = base_qs[:limit]

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
                'cash_paid': str(getattr(t, 'cash_paid', None)),
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


@csrf_exempt
@require_POST
# /pselect
def pselect(request):
    try:
        payload = json.loads(request.body.decode('utf-8') or '{}')
    except Exception:
        return JsonResponse({'count': 0, 'success': False, 'message': st.INVALID_JSON}, status=400)

    filters = {}
    psid = payload.get('psid', '')
    limit = int(payload.get('limit', MAX_RECORDS))

    # Build filters (respect the presence of params)
    if psid not in ('', None):
        try:
            filters['uid'] = int(psid)
        except (ValueError, TypeError):
            # invalid id -> no results
            return JsonResponse({'count': 0, 'pselect': []})
    else:
        try:
            filters['uid'] = 1
        except (ValueError, TypeError):
            return JsonResponse({'count': 0, 'pselect': []})

    try:
        try:
            p_model = apps.get_model('payroll', 'Pselect')
        except (ValueError, TypeError):
            return JsonResponse({'count': 0, 'pselect': []})

        p_rec = p_model.objects.filter(**filters) if filters else p_model.objects.all()

        # Apply limit
        p_rec = p_rec[:limit]

        def _fmt_task(p):
            return {
                'uid': getattr(p, 'uid', None),
                'emp_id': int(getattr(p, 'emp_id', None)),
                'emp_name': getattr(p, 'emp_name', '') or '',
                'start': getattr(p, 'start_mmddyyyy', '') or '',
                'end': getattr(p, 'end_mmddyyyy', '') or '',
                'week_done': getattr(p, 'week_done_mmddyyyy', '') or '',
                'old_start': getattr(p, 'oldstart_mmddyyyy', '') or '',
                'old_end': getattr(p, 'oldend_mmddyyyy', '') or '',
                'mile_rate': getattr(p, 'mile_rate', '') or '',
                'chk_price_paid': getattr(p, 'chk_price_paid', '') or '',
                'reim_exp': getattr(p, 'reim_exp_currency', '') or '',
                'otime_percentage': getattr(p, 'otime_percentage', '') or '',
                'spec_equip': bool(getattr(p, 'spec_equip', False)),
                'billing_date': getattr(p, 'billing_date_mmddyyyy', '') or '',
                'invoice_num': getattr(p, 'invoice_num', '') or '',
                'route': getattr(p, 'route', '') or '',
                'route_description': getattr(p, 'route_description', '') or ''
            }

        data = [_fmt_task(t) for t in p_rec]
    except Exception:
        data = []

    return JsonResponse({'count': len(data), 'pselect': data})


# python
@csrf_exempt
@require_POST
def payroll_weeks(request):
    try:
        payload = json.loads(request.body.decode('utf-8') or '{}')
    except Exception:
        return JsonResponse({'count': 0, 'success': False, 'message': st.INVALID_JSON}, status=400)

    limit = int(payload.get('limit', MAX_RECORDS))

    try:
        PayrollWeeks = apps.get_model('payroll', 'PayrollWeeks')
        if PayrollWeeks is None:
            return JsonResponse({'count': 0, 'weeks': []})

        base_qs = PayrollWeeks.objects.all()
        # use Django ordering syntax for descending
        base_qs = base_qs.order_by('-payroll_week')
        qs = base_qs[:limit]

        def _format_date_mmddyyyy(val):
            if not val:
                return None
            try:
                # datetime or date
                from datetime import datetime, date
                if hasattr(val, 'date'):
                    d = val.date() if isinstance(val, datetime) else val
                    return d.strftime('%m/%d/%Y')
                # string -> try ISO parse then fallback to raw string
                if isinstance(val, str):
                    try:
                        dt = datetime.fromisoformat(val)
                        return dt.date().strftime('%m/%d/%Y')
                    except Exception:
                        # last resort: return original string (or None)
                        return val
            except Exception:
                return None
            return None

        def _fmt_week(w):
            pw = getattr(w, 'payroll_week', None)
            return {
                'row_id': getattr(w, 'row_id', None),
                'payroll_week': _format_date_mmddyyyy(pw),
                'task_count': getattr(w, 'task_count', '') or '',
            }

        data = [_fmt_week(w) for w in qs]

    except Exception:
        data = []

    return JsonResponse({'count': len(data), 'weeks': data})


@csrf_exempt
@require_POST
def pselect_edit(request):
    """
    POST-JSON body to update a Pselect record.
    Required: uid
    Allowed fields (if present) will be updated:
      emp_id, emp_name, start_mmddyyyy, end_mmddyyyy, week_done_mmddyyyy,
      old_start_mmddyyyy, old_end_mmddyyyy, mile_rate, chk_price_paid,
      reim_exp_currency, otime_percentage, spec_equip, billing_date_mmddyyyy,
      invoice_num, route, route_description
    """
    try:
        payload = json.loads(request.body.decode('utf-8') or '{}')
    except Exception:
        return JsonResponse({'count': 0, 'success': False, 'message': st.INVALID_JSON}, status=400)

    uid = payload.get('uid') or request.POST.get('uid')
    if uid is None:
        return JsonResponse({'error': 'missing uid'}, status=400)
    try:
        uid = int(uid)
    except Exception:
        return JsonResponse({'error': 'invalid uid'}, status=400)

    try:
        # Use the actual table model for updates
        Table = apps.get_model('payroll', 'PSelectTable')
        # Use the view model for reading back rich data
        View = apps.get_model('payroll', 'Pselect')
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
        if 'emp_id' in payload:
            val = payload['emp_id']
            r.emp_id = str(val) if val is not None and val != '' else None

        if 'start' in payload:
            r.start = parse_date(payload['start'])
        if 'end' in payload:
            r.end = parse_date(payload['end'])
        if 'week_done' in payload:
            r.week_done = parse_date(payload['week_done'])
        if 'old_start' in payload:
            r.oldstart = parse_date(payload['old_start'])
        if 'old_end' in payload:
            r.oldend = parse_date(payload['old_end'])
        if 'billing_date' in payload:
            r.billing_date = parse_date(payload['billing_date_mmddyyyy'])

        if 'mile_rate' in payload:
            r.mile_rate = payload['mile_rate']
        if 'chk_price_paid' in payload:
            r.chk_price_paid = validate_bool(payload['chk_price_paid'])

        if 'reim_exp_currency' in payload:
            val = str(payload['reim_exp_currency']).replace('$', '').replace(',', '')
            r.reim_exp = val if val else None

        if 'otime_percentage' in payload:
            r.otime_percentage = payload['otime_percentage']
        if 'spec_equip' in payload:
            r.spec_equip = validate_bool(payload['spec_equip'])
        if 'invoice_num' in payload:
            r.invoice_num = payload['invoice_num']
        if 'route' in payload:
            r.route = payload['route']

        r.save()

        # Fetch the view record to return rich data (names, descriptions, etc)
        view_rec = View.objects.filter(uid=uid).first()

        def _fmt_pselect(p):
            eid = getattr(p, 'emp_id', None)
            if eid == '':
                eid = None
            return {
                'uid': getattr(p, 'uid', None),
                'emp_id': int(eid) if eid is not None else None,
                'emp_name': getattr(p, 'emp_name', '') or '',
                'start': getattr(p, 'start_mmddyyyy', '') or '',
                'end': getattr(p, 'end_mmddyyyy', '') or '',
                'week_done': getattr(p, 'week_done_mmddyyyy', '') or '',
                'old_start': getattr(p, 'oldstart_mmddyyyy', '') or '',
                'old_end': getattr(p, 'oldend_mmddyyyy', '') or '',
                'mile_rate': getattr(p, 'mile_rate', '') or '',
                'chk_price_paid': getattr(p, 'chk_price_paid', '') or '',
                'reim_exp': getattr(p, 'reim_exp_currency', '') or '',
                'otime_percentage': getattr(p, 'otime_percentage', '') or '',
                'spec_equip': bool(getattr(p, 'spec_equip', False)),
                'billing_date': getattr(p, 'billing_date_mmddyyyy', '') or '',
                'invoice_num': getattr(p, 'invoice_num', '') or '',
                'route': getattr(p, 'route', '') or '',
                'route_description': getattr(p, 'route_description', '') or ''
            }

        return JsonResponse({'count': 1, 'pselect': [_fmt_pselect(view_rec)]})
    except Exception as e:
        return JsonResponse({'error': f'update failed: {str(e)}'}, status=500)

@csrf_exempt
@require_POST
def payroll_aggregate(request):
    try:
        payload = json.loads(request.body.decode('utf-8') or '{}')
    except Exception:
        return JsonResponse({'count': 0, 'success': False, 'message': st.INVALID_JSON}, status=400)

    filters = {}
    week_of = payload.get('week_of')
    route = payload.get('route')
    limit = int(payload.get('limit', MAX_RECORDS))

    if week_of:
        filters['week_of'] = week_of
    if route:
        filters['route__iexact'] = route

    try:
        Model = apps.get_model('payroll', 'PayrollAggregate')
        qs = Model.objects.filter(**filters) if filters else Model.objects.all()
        qs = qs[:limit]

        def _fmt(agg):
            return {
                'week_of': agg.week_of,
                'route': agg.route,
                'task_count': agg.task_count,
                'completed_count': agg.completed_count,
                'percent_complete': f"{agg.percent_complete:.2f}%" if agg.percent_complete is not None else "0.00%",
                'cash_paid': agg.cash_paid,
                'charges': agg.charges,
                'total_tax': agg.total_tax,
                'total_price': agg.total_price,
                'total_commission_paid': agg.total_commission_paid,
            }

        data = [_fmt(agg) for agg in qs]
        return JsonResponse({'count': len(data), 'data': data})

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@require_GET
def debug_payroll_model(request):
    info = {'DJANGO_SETTINGS_MODULE': os.environ.get('DJANGO_SETTINGS_MODULE'),
            'INSTALLED_APPS_contains_payroll': 'payroll' in getattr(settings, 'INSTALLED_APPS', [])}
    # environment
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
        Model = apps.get_model('payroll', 'PayrollWeeks')
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
