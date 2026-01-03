# python
# File: `api/v1/customers/views.py`
import importlib
import os
import sys
import traceback
import json

from django.db.models import Q
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from django.core.cache import cache
from django.apps import apps

from base import settings
from base.settings import CACHE_TTL, MAX_RECORDS
from utils.types import validate_bool


@csrf_exempt
@require_POST
def sites(request):
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
    filters = {}
    if payload.get('mkt_co'): filters['mkt_co__iexact'] = payload.get('mkt_co')
    if payload.get('cust_id'): filters['cust_id__icontains'] = payload.get('cust_id')
    if payload.get('master_id'): filters['master_id__icontains'] = payload.get('master_id')
    if payload.get('reg_name'): filters['reg_name__icontains'] = payload.get('reg_name')
    if payload.get('company'): filters['company__icontains'] = payload.get('company')
    if payload.get('address'): filters['address__icontains'] = payload.get('address')
    if payload.get('city'): filters['city__icontains'] = payload.get('city')
    if payload.get('county'): filters['county__icontains'] = payload.get('county')
    if payload.get('state'): filters['state__iexact'] = payload.get('state')
    if payload.get('zip_code'): filters['zip_code__icontains'] = payload.get('zip_code')
    if payload.get('phone'): filters['phone__icontains'] = payload.get('phone')
    if payload.get('business_type'): filters['business_type__iexact'] = payload.get('business_type')
    if payload.get('email'): filters['email__icontains'] = payload.get('email')
    if payload.get('cell'): filters['cell__icontains'] = payload.get('cell')
    if payload.get('work_phone'): filters['work_phone__icontains'] = payload.get('work_phone')
    if payload.get('customer_notes'): filters['customer_notes__icontains'] = payload.get('customer_notes')
    if payload.get('tax_rate'): filters['tax_rate__iexact'] = payload.get('tax_rate')
    if payload.get('pmt_type'): filters['pmt_type__iexact'] = payload.get('pmt_type')
    if payload.get('inv_type'): filters['inv_type__iexact'] = payload.get('inv_type')
    if payload.get('prospect_status'): filters['prospect_status__iexact'] = payload.get('prospect_status')
    if payload.get('task_style'): filters['task_style__iexact'] = payload.get('task_style')
    if payload.get('quick_note'): filters['quick_note__icontains'] = payload.get('quick_note')
    if payload.get('call_blasted_date'): filters['call_blasted_date__iexact'] = payload.get('call_blasted_date')
    if payload.get('job_types'): filters['job_types__icontains'] = payload.get('job_types')

    # Boolean filters
    if validate_bool(payload.get('cod')) is not None: filters['cod'] = validate_bool(payload.get('cod'))
    if validate_bool(payload.get('voucher')) is not None: filters['voucher'] = validate_bool(payload.get('voucher'))
    if validate_bool(payload.get('taxable')) is not None: filters['taxable'] = validate_bool(payload.get('taxable'))
    if validate_bool(payload.get('other_bill')) is not None: filters['other_bill'] = validate_bool(
        payload.get('other_bill'))
    if validate_bool(payload.get('mailto')) is not None: filters['mailto'] = validate_bool(payload.get('mailto'))
    if validate_bool(payload.get('adv_bill')) is not None: filters['adv_bill'] = validate_bool(payload.get('adv_bill'))
    if validate_bool(payload.get('adv_credit')) is not None: filters['adv_credit'] = validate_bool(
        payload.get('adv_credit'))
    if validate_bool(payload.get('billing_cycle')) is not None: filters['billing_cycle'] = validate_bool(
        payload.get('billing_cycle'))
    if validate_bool(payload.get('site_comm')) is not None: filters['site_comm'] = validate_bool(
        payload.get('site_comm'))
    if validate_bool(payload.get('service_client')) is not None: filters['service_client'] = validate_bool(
        payload.get('service_client'))
    if validate_bool(payload.get('active')) is not None: filters['active'] = validate_bool(payload.get('active'))
    if validate_bool(payload.get('send_receipt')) is not None: filters['send_receipt'] = validate_bool(
        payload.get('send_receipt'))
    if validate_bool(payload.get('e_mail_flag')) is not None: filters['e_mail_flag'] = validate_bool(
        payload.get('e_mail_flag'))
    if validate_bool(payload.get('signature_required')) is not None: filters['signature_required'] = validate_bool(
        payload.get('signature_required'))
    if validate_bool(payload.get('sms_opt_in')) is not None: filters['sms_opt_in'] = validate_bool(
        payload.get('sms_opt_in'))
    if validate_bool(payload.get('needs_price_increased')) is not None: filters[
        'needs_price_increased'] = validate_bool(payload.get('needs_price_increased'))
    if validate_bool(payload.get('call_blasted')) is not None: filters['call_blasted'] = validate_bool(
        payload.get('call_blasted'))
    if validate_bool(payload.get('pays_own_invoices')) is not None: filters['pays_own_invoices'] = validate_bool(
        payload.get('pays_own_invoices'))
    if validate_bool(payload.get('ct_exception')) is not None: filters['ct_exception'] = validate_bool(
        payload.get('ct_exception'))

    # --- Caching Strategy ---
    cache_key = None
    if not filters and not q:
        cache_key = 'customers_sites_v1_all'
    elif len(filters) == 1 and 'cust_id' in filters:
        cache_key = f"customers_sites_v1_cust_{filters['cust_id']}"

    if 'no-cache' in cc or 'max-age=0' in cc:
        refresh = True

    data = None
    if not refresh and cache_key:
        data = cache.get(cache_key)

    if data is None:
        try:
            Model = apps.get_model('customers', 'Site')
            qs = Model.objects.filter(**filters)

            if q:
                if q.isdigit():
                    qs = qs.filter(Q(cust_id__icontains=q))
                else:
                    qs = qs.filter(
                        Q(company__icontains=q) | Q(reg_name__icontains=q) |
                        Q(address__icontains=q) | Q(city__icontains=q) |
                        Q(phone__icontains=q)
                    )

            qs = qs[:limit]

            def _fmt_site(site):
                return {
                    'cust_id': getattr(site, 'cust_id', None), 'mkt_co': getattr(site, 'mkt_co', None),
                    'reg_name': getattr(site, 'reg_name', '') or '', 'company': getattr(site, 'company', '') or '',
                    'address': getattr(site, 'address', '') or '', 'city': getattr(site, 'city', '') or '',
                    'county': getattr(site, 'county', '') or '', 'state': getattr(site, 'state', '') or '',
                    'zip_code': getattr(site, 'zip_code', '') or '', 'phone': getattr(site, 'phone', '') or '',
                    'start': getattr(site, 'start', None), 'master_id': getattr(site, 'master_id', None),
                    'business_type': getattr(site, 'business_type', None), 'cod': getattr(site, 'cod', None),
                    'voucher': getattr(site, 'voucher', None), 'taxable': getattr(site, 'taxable', None),
                    'other_bill': getattr(site, 'other_bill', None), 'mailto': getattr(site, 'mailto', None),
                    'adv_bill': getattr(site, 'adv_bill', None), 'adv_credit': getattr(site, 'adv_credit', None),
                    'billing_cycle': getattr(site, 'billing_cycle', None),
                    'site_comm': getattr(site, 'site_comm', None),
                    'longitude': getattr(site, 'longitude', None), 'latitude': getattr(site, 'latitude', None),
                    'fax': getattr(site, 'fax', '') or '', 'email': getattr(site, 'email', '') or '',
                    'cell': getattr(site, 'cell', '') or '', 'work_phone': getattr(site, 'work_phone', '') or '',
                    'customer_notes': getattr(site, 'customer_notes', '') or '',
                    'tax_rate': getattr(site, 'tax_rate', None),
                    'service_client': getattr(site, 'service_client', None), 'active': getattr(site, 'active', None),
                    'updated_by': getattr(site, 'updated_by', None),
                    'updated_date': getattr(site, 'updated_date', None),
                    'pmt_type': getattr(site, 'pmt_type', None), 'inv_type': getattr(site, 'inv_type', None),
                    'send_receipt': getattr(site, 'send_receipt', None),
                    'e_mail_flag': getattr(site, 'e_mail_flag', None),
                    'signature_required': getattr(site, 'signature_required', None),
                    'default_contact': getattr(site, 'default_contact', '') or '',
                    'custom1': getattr(site, 'custom1', '') or '', 'custom2': getattr(site, 'custom2', '') or '',
                    'prospect_status': getattr(site, 'prospect_status', None),
                    'task_style': getattr(site, 'task_style', None),
                    'quick_note': getattr(site, 'quick_note', '') or '',
                    'sms_opt_in': getattr(site, 'sms_opt_in', None),
                    'needs_price_increased': getattr(site, 'needs_price_increased', None),
                    'price_increase_document': getattr(site, 'price_increase_document', '') or '',
                    'sold_by': getattr(site, 'sold_by', None), 'call_blasted': getattr(site, 'call_blasted', None),
                    'call_blasted_date': getattr(site, 'call_blasted_date', None),
                    'job_types': getattr(site, 'job_types', '') or '',
                    'job_types_abbrs': getattr(site, 'job_types_abbrs', '') or '',
                    'pays_own_invoices': getattr(site, 'pays_own_invoices', None),
                    'ct_exception': getattr(site, 'ct_exception', None),
                }

            data = [_fmt_site(site) for site in qs]

            if cache_key:
                cache.set(cache_key, data, CACHE_TTL)
        except Exception:
            data = []

    if count_only:
        return JsonResponse({'count': len(data)})
    return JsonResponse({'count': len(data), 'sites': data})


@csrf_exempt
@require_POST
def masters(request):
    # Not implemented yet
    return JsonResponse(
        {
            "success": True,
            "status": 200,
            "feature": "Masters",
            "Message:": "Not Yet Implemented"
        }
    )


@csrf_exempt
@require_POST
def geo(request):
    return JsonResponse(
        {
            "success": True,
            "status": 200,
            "feature": "Site and Master Geo Data",
            "Message:": "Not Yet Implemented"
        }
    )


@csrf_exempt
@require_POST
def debug_customers_model(request):
    info = {}
    # environment
    info['DJANGO_SETTINGS_MODULE'] = os.environ.get('DJANGO_SETTINGS_MODULE')
    info['INSTALLED_APPS_contains_customers'] = 'customers' in getattr(settings, 'INSTALLED_APPS', [])
    # app config
    try:
        app_cfg = apps.get_app_config('customers')
        info['app_config_found'] = True
        info['app_label'] = app_cfg.label
        info['registered_model_names'] = sorted(list(app_cfg.models.keys()))
    except Exception as e:
        info['app_config_found'] = False
        info['app_config_error'] = repr(e)

    # apps.get_model attempt
    try:
        Model = apps.get_model('customers', 'Site')
        info['apps_get_model_result'] = str(Model)
    except Exception as e:
        info['apps_get_model_error'] = repr(e)

    # sys.modules and direct import
    info['sys_modules_has_customers_models'] = 'customers.models' in sys.modules
    info['sys_modules_customers_models_repr'] = repr(
        sys.modules.get('customers.models')) if 'customers.models' in sys.modules else None

    try:
        mod = importlib.import_module('customers.models')
        info['import_ok'] = True
        info['customers_models_has_Site'] = hasattr(mod, 'Site')
    except Exception:
        info['import_ok'] = False
        info['import_traceback'] = traceback.format_exc()

    return JsonResponse(info)
