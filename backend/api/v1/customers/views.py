# python
# File: `api/v1/customers/views.py`
import importlib
import os
import sys
import traceback

from django.db.models import Q
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_GET
from django.core.cache import cache
from django.apps import apps

from base import settings
from base.settings import CACHE_TTL, MAX_RECORDS
from utils.types import validate_bool

@require_GET
# /sites
# python
def sites(request):
    q = request.GET.get('q', '').strip()
    filters = {}
    refresh = request.GET.get('refresh') in ('1', 'true', 'True')
    cc = request.META.get('HTTP_CACHE_CONTROL', request.GET.get('cache-Control', ''))
    count_only = request.GET.get('count_only', '0') in ('1', 'true', 'True')

    mkt_co = request.GET.get('mkt_co', '')
    cust_id = request.GET.get('cust_id', '')
    master_id = request.GET.get('master_id', '')
    reg_name = request.GET.get('reg_name', '')
    company = request.GET.get('company', '')
    address = request.GET.get('address', '')
    city = request.GET.get('city', '')
    county = request.GET.get('county', '')
    state = request.GET.get('state', '')
    zip_code = request.GET.get('zip_code', '')
    phone = request.GET.get('phone', '')
    business_type = request.GET.get('business_type', '')
    cod = validate_bool(request.GET.get('cod', ''))
    voucher = validate_bool(request.GET.get('voucher', ''))
    taxable = validate_bool(request.GET.get('taxable', ''))
    other_bill = validate_bool(request.GET.get('other_bill', ''))
    mailto = validate_bool(request.GET.get('mailto', ''))
    adv_bill = validate_bool(request.GET.get('adv_bill', ''))
    adv_credit = validate_bool(request.GET.get('adv_credit', ''))
    billing_cycle = validate_bool(request.GET.get('billing_cycle', ''))
    site_comm = validate_bool(request.GET.get('site_comm', ''))
    email = request.GET.get('email', '')
    cell = request.GET.get('cell', '')
    work_phone = request.GET.get('work_phone', '')
    customer_notes = request.GET.get('customer_notes', '')
    tax_rate = request.GET.get('tax_rate', '')
    service_client = validate_bool(request.GET.get('service_client', ''))
    active = validate_bool(request.GET.get('active', ''))
    pmt_type = request.GET.get('pmt_type', '')
    inv_type = request.GET.get('inv_type', '')
    send_receipt = validate_bool(request.GET.get('send_receipt', ''))
    e_mail_flag = validate_bool(request.GET.get('e_mail_flag', ''))
    signature_required = validate_bool(request.GET.get('signature_required', ''))
    prospect_status = request.GET.get('prospect_status', '')
    task_style = request.GET.get('task_style', '')
    quick_note = request.GET.get('quick_note', '')
    sms_opt_in = validate_bool(request.GET.get('sms_opt_in', ''))
    needs_price_increased = validate_bool(request.GET.get('needs_price_increased', ''))
    call_blasted = validate_bool(request.GET.get('call_blasted', ''))
    call_blasted_date = request.GET.get('call_blasted_date', '')
    job_types = request.GET.get('job_types', '')
    pays_own_invoices = validate_bool(request.GET.get('pays_own_invoices', ''))
    ct_exception = validate_bool(request.GET.get('ct_exception', ''))

    if mkt_co not in ('', None):
        filters['mkt_co__iexact'] = mkt_co
    if cust_id not in ('', None):
        filters['cust_id__icontains'] = cust_id
    if master_id not in ('', None):
        filters['master_id__icontains'] = master_id
    if reg_name not in ('', None):
        filters['reg_name__icontains'] = reg_name
    if company not in ('', None):
        filters['company__icontains'] = company
    if address not in ('', None):
        filters['address__icontains'] = address
    if city not in ('', None):
        filters['city__icontains'] = city
    if county not in ('', None):
        filters['county__icontains'] = county
    if state not in ('', None):
        filters['state__iexact'] = state
    if zip_code not in ('', None):
        filters['zip_code__icontains'] = zip_code
    if phone not in ('', None):
        filters['phone__icontains'] = phone
    if business_type not in ('', None):
        filters['business_type__iexact'] = business_type
    if cod not in ('', None):
        filters['cod__iexact'] = cod
    if voucher not in ('', None):
        filters['voucher__iexact'] = voucher
    if taxable not in ('', None):
        filters['taxable__iexact'] = taxable
    if other_bill not in ('', None):
        filters['other_bill__iexact'] = other_bill
    if mailto not in ('', None):
        filters['mailto__iexact'] = mailto
    if adv_bill not in ('', None):
        filters['adv_bill__iexact'] = adv_bill
    if adv_credit not in ('', None):
        filters['adv_credit__iexact'] = adv_credit
    if billing_cycle not in ('', None):
        filters['billing_cycle__iexact'] = billing_cycle
    if site_comm not in ('', None):
        filters['site_comm__iexact'] = site_comm
    if email not in ('', None):
        filters['email__icontains'] = email
    if cell not in ('', None):
        filters['cell__icontains'] = cell
    if work_phone not in ('', None):
        filters['work_phone__icontains'] = work_phone
    if customer_notes not in ('', None):
        filters['customer_notes__icontains'] = customer_notes
    if tax_rate not in ('', None):
        filters['tax_rate__iexact'] = tax_rate
    if service_client not in ('', None):
        filters['service_client__iexact'] = service_client
    if active not in ('', None):
        filters['active__iexact'] = active
    if pmt_type not in ('', None):
        filters['pmt_type__iexact'] = pmt_type
    if inv_type not in ('', None):
        filters['inv_type__iexact'] = inv_type
    if send_receipt not in ('', None):
        filters['send_receipt__iexact'] = send_receipt
    if e_mail_flag not in ('', None):
        filters['e_mail_flag__iexact'] = e_mail_flag
    if signature_required not in ('', None):
        filters['signature_required__iexact'] = signature_required
    if prospect_status not in ('', None):
        filters['prospect_status__iexact'] = prospect_status
    if task_style not in ('', None):
        filters['task_style__iexact'] = task_style
    if quick_note not in ('', None):
        filters['quick_note__icontains'] = quick_note
    if sms_opt_in not in ('', None):
        filters['sms_opt_in__iexact'] = sms_opt_in
    if needs_price_increased not in ('', None):
        filters['needs_price_increased__iexact'] = needs_price_increased
    if call_blasted not in ('', None):
        filters['call_blasted__iexact'] = call_blasted
    if call_blasted_date not in ('', None):
        filters['call_blasted_date__iexact'] = call_blasted_date
    if job_types not in ('', None):
        filters['job_types__icontains'] = job_types
    if pays_own_invoices not in ('', None):
        filters['pays_own_invoices__icontains'] = pays_own_invoices
    if ct_exception not in ('', None):
        filters['ct_exception__iexact'] = ct_exception

    if 'no-cache' in cc or 'max-age=0' in cc:
        refresh = True

    if county or city or zip_code or company or reg_name or address or phone or cell or work_phone or billing_cycle:
        cache_key = f'customers_sites_v1_filtered'
    else:
        cache_key = 'customers_sites_v1_all_sites'

    data = None if refresh else cache.get(cache_key)

    if data is not None:
        # filter the cached list by q if provided
        if q:
            ql = q.lower()
            data = [
                s for s in data
                if ql in str(s.get('cust_id', '')).lower()
                   or ql in (s.get('company') or '').lower()
                   or ql in (s.get('reg_name') or '').lower()
                   or ql in (s.get('address') or '').lower()
                   or ql in (s.get('city') or '').lower()
                   or ql in (s.get('phone') or '').lower()
            ]
    else:
        try:
            try:
                Model = apps.get_model('customers', 'Site')
            except LookupError:
                Model = None

            if Model is None:
                data = []
            else:
                # FIX: use slicing to limit results
                qs = Model.objects.filter(**filters) if filters else Model.objects.all()[:MAX_RECORDS]

                if q:
                    # prefer the exact cust_id match when q looks like an id
                    if q.isdigit():
                        qs = qs.filter(
                            Q(cust_id__icontains=q) |
                            Q(company__icontains=q) |
                            Q(reg_name__icontains=q)
                        )
                    else:
                        qs = qs.filter(
                            Q(company__icontains=q) |
                            Q(reg_name__icontains=q) |
                            Q(address__icontains=q) |
                            Q(city__icontains=q) |
                            Q(phone__icontains=q)
                        )

                def _fmt_site(site):
                    return {
                        'cust_id': getattr(site, 'cust_id', None),
                        'mkt_co': getattr(site, 'mkt_co', None),
                        'reg_name': getattr(site, 'reg_name', '') or '',
                        'company': getattr(site, 'company', '') or '',
                        'address': getattr(site, 'address', '') or '',
                        'city': getattr(site, 'city', '') or '',
                        'county': getattr(site, 'county', '') or '',
                        'state': getattr(site, 'state', '') or '',
                        'zip_code': getattr(site, 'zip_code', '') or '',
                        'phone': getattr(site, 'phone', '') or '',
                        'start': getattr(site, 'start', None),
                        'master_id': getattr(site, 'master_id', None),
                        'business_type': getattr(site, 'business_type', None),
                        'cod': getattr(site, 'cod', None),
                        'voucher': getattr(site, 'voucher', None),
                        'taxable': getattr(site, 'taxable', None),
                        'other_bill': getattr(site, 'other_bill', None),
                        'mailto': getattr(site, 'mailto', None),
                        'adv_bill': getattr(site, 'adv_bill', None),
                        'adv_credit': getattr(site, 'adv_credit', None),
                        'billing_cycle': getattr(site, 'billing_cycle', None),
                        'site_comm': getattr(site, 'site_comm', None),
                        'longitude': getattr(site, 'longitude', None),
                        'latitude': getattr(site, 'latitude', None),
                        'fax': getattr(site, 'fax', '') or '',
                        'email': getattr(site, 'email', '') or '',
                        'cell': getattr(site, 'cell', '') or '',
                        'work_phone': getattr(site, 'work_phone', '') or '',
                        'customer_notes': getattr(site, 'customer_notes', '') or '',
                        'tax_rate': getattr(site, 'tax_rate', None),
                        'service_client': getattr(site, 'service_client', None),
                        'active': getattr(site, 'active', None),
                        'updated_by': getattr(site, 'updated_by', None),
                        'updated_date': getattr(site, 'updated_date', None),
                        'pmt_type': getattr(site, 'pmt_type', None),
                        'inv_type': getattr(site, 'inv_type', None),
                        'send_receipt': getattr(site, 'send_receipt', None),
                        'e_mail_flag': getattr(site, 'e_mail_flag', None),
                        'signature_required': getattr(site, 'signature_required', None),
                        'default_contact': getattr(site, 'default_contact', '') or '',
                        'custom1': getattr(site, 'custom1', '') or '',
                        'custom2': getattr(site, 'custom2', '') or '',
                        'prospect_status': getattr(site, 'prospect_status', None),
                        'task_style': getattr(site, 'task_style', None),
                        'quick_note': getattr(site, 'quick_note', '') or '',
                        'sms_opt_in': getattr(site, 'sms_opt_in', None),
                        'needs_price_increased': getattr(site, 'needs_price_increased', None),
                        'price_increase_document': getattr(site, 'price_increase_document', '') or '',
                        'sold_by': getattr(site, 'sold_by', None),
                        'call_blasted': getattr(site, 'call_blasted', None),
                        'call_blasted_date': getattr(site, 'call_blasted_date', None),
                        'job_types': getattr(site, 'job_types', '') or '',
                        'job_types_abbrs': getattr(site, 'job_types_abbrs', '') or '',
                        'pays_own_invoices': getattr(site, 'pays_own_invoices', None),
                        'ct_exception': getattr(site, 'ct_exception', None),
                    }

                data = [_fmt_site(site) for site in qs]

        except Exception:
            data = []

        if not q and not refresh:
            cache.set(cache_key, data, CACHE_TTL)

    if count_only:
        return JsonResponse({'count': len(data)})

    return JsonResponse({'count': len(data), 'sites': data})


@require_GET
# /masters
def masters(request):
    # Not implemented yet
    return JsonResponse(
        {
            "type": "FeatureCollection",
            "features": []
        }
    )


@require_GET
def geo(request):
    return JsonResponse(
        {
            "type": "FeatureCollection",
            "features": []
        }
    )


@require_GET
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
