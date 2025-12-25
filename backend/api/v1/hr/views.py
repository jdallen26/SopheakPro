# python file api/accounting/views.py
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
def employees(request):
    """
    GET /employees
    Supports: q, id|emp_id, name, company, city, state, employed, refresh, cache-control, count_only
    """
    q = request.GET.get('q', '').strip()
    filters = {}
    refresh = request.GET.get('refresh') in ('1', 'true', 'True')
    cc = request.META.get('HTTP_CACHE_CONTROL', request.GET.get('cache-Control', ''))
    count_only = request.GET.get('count_only', '0') in ('1', 'true', 'True')

    emp_id = request.GET.get('id', '') or request.GET.get('emp_id', '')
    name = request.GET.get('name', '')
    company = request.GET.get('company', '')
    employed = validate_bool(request.GET.get('employed', ''))
    status = request.GET.get('status', '')
    hourly = request.GET.get('hourly', '')
    address1 = request.GET.get('address1', '')
    address2 = request.GET.get('address2', '')
    city = request.GET.get('city', '')
    state = request.GET.get('state', '')
    zip = request.GET.get('zip', '')
    cell = request.GET.get('cell', '')
    phone = request.GET.get('phone', '')
    start_date = request.GET.get('start_date', '')
    end_date = request.GET.get('end_date', '')
    driver = validate_bool(request.GET.get('driver', ''))
    subcontractor = validate_bool(request.GET.get('subcontractor', ''))
    is_1099 = validate_bool(request.GET.get('is_1099', ''))
    email = request.GET.get('email', '')

    if emp_id:
        filters['id'] = emp_id
    if name:
        filters['name__icontains'] = name
    if company:
        filters['company__icontains'] = company
    if employed is not None:
        filters['employed'] = employed
    if status:
        filters['status__iexact'] = status
    if hourly:
        filters['hourly'] = float(hourly)
    if address1:
        filters['address1__icontains'] = address1
    if address2:
        filters['address2__icontains'] = address2
    if city:
        filters['city__icontains'] = city
    if state:
        filters['state__iexact'] = state
    if zip:
        filters['zip__icontains'] = zip
    if cell:
        filters['cell__icontains'] = cell
    if phone:
        filters['phone__icontains'] = phone
    if start_date:
        filters['start_date__date'] = start_date
    if end_date:
        filters['end_date__date'] = end_date
    if driver is not None:
        filters['driver'] = driver
    if subcontractor is not None:
        filters['subcontractor'] = subcontractor
    if is_1099 is not None:
        filters['is_1099'] = is_1099
    if email:
        filters['email__icontains'] = email

    if 'no-cache' in cc or 'max-age=0' in cc:
        refresh = True

        # if emp_id:
        #     cache_key = f'hr_employees_v1_id_{emp_id}'
        # elif company:
        #     cache_key = f'hr_employees_v1_company_{company}'
        # else:
        cache_key = 'hr_employees_v1_all'

    data = None if refresh else cache.get(cache_key)

    if data is not None:
        if q:
            ql = q.lower()
            data = [
                e for e in data
                if ql in str(e.get('id', '')).lower()
                   or ql in (e.get('name') or '').lower()
                   or ql in (e.get('company') or '').lower()
                   or ql in (e.get('email') or '').lower()
            ]
    else:
        try:
            try:
                Model = apps.get_model('hr', 'Employee')
            except LookupError:
                Model = None

            if Model is None:
                data = []
            else:
                qs = Model.objects.filter(**filters) if filters else Model.objects.all()[:MAX_RECORDS]

                if q:
                    if q.isdigit():
                        qs = qs.filter(
                            Q(id__exact=q) |
                            Q(name__icontains=q) |
                            Q(company__icontains=q)
                        )
                    else:
                        qs = qs.filter(
                            Q(name__icontains=q) |
                            Q(company__icontains=q) |
                            Q(email__icontains=q) |
                            Q(city__icontains=q)
                        )

                def _fmt_employee(e):
                    return {
                        'id': getattr(e, 'id', None),
                        'name': getattr(e, 'name', '') or '',
                        'company': getattr(e, 'company', '') or '',
                        'ssn': getattr(e, 'ssn', '') or '',
                        'employed': getattr(e, 'employed', None),
                        'status': getattr(e, 'status', '') or '',
                        'allowances': getattr(e, 'allowances', None),
                        'hourly': getattr(e, 'hourly', None),
                        'address1': getattr(e, 'address1', '') or '',
                        'address2': getattr(e, 'address2', '') or '',
                        'city': getattr(e, 'city', '') or '',
                        'state': getattr(e, 'state', '') or '',
                        'zip': getattr(e, 'zip', '') or '',
                        'cell': getattr(e, 'cell', '') or '',
                        'phone': getattr(e, 'phone', '') or '',
                        'phone2': getattr(e, 'phone2', '') or '',
                        'start_date': getattr(e, 'start_date', None),
                        'end_date': getattr(e, 'end_date', None),
                        'comm_rate': getattr(e, 'comm_rate', None),
                        'efficiency': getattr(e, 'efficiency', None),
                        'map_link': getattr(e, 'map_link', '') or '',
                        'photo': getattr(e, 'photo', '') or '',
                        'sales_commission_rate': getattr(e, 'sales_commission_rate', None),
                        'pwd': getattr(e, 'pwd', '') or '',
                        'driver': getattr(e, 'driver', None),
                        'mass_mailer': getattr(e, 'mass_mailer', None),
                        'has_personal_prospects': getattr(e, 'has_personal_prospects', None),
                        'sales': getattr(e, 'sales', None),
                        'subcontractor': getattr(e, 'subcontractor', None),
                        'is_1099': getattr(e, 'is_1099', None),
                        'fed_tax_number': getattr(e, 'fed_tax_number', '') or '',
                        'entity': getattr(e, 'entity', '') or '',
                        'email': getattr(e, 'email', '') or '',
                    }

                data = [_fmt_employee(emp) for emp in qs]

        except Exception:
            data = []

        if not q and not refresh:
            cache.set(cache_key, data, CACHE_TTL)

    if count_only:
        return JsonResponse({'count': len(data)})

    return JsonResponse({'count': len(data), 'employees': data})


@require_GET
# /notes
def notes(request):
    # Not implemented yet
    return JsonResponse(
        {
            "type": "FeatureCollection",
            "features": []
        }
    )


# /goe
def geo(request):
    return JsonResponse(
        {
            "type": "FeatureCollection",
            "features": []
        }
    )


@require_GET
def debug_hr_model(request):
    info = {}
    # environment
    info['DJANGO_SETTINGS_MODULE'] = os.environ.get('DJANGO_SETTINGS_MODULE')
    info['INSTALLED_APPS_contains_hr'] = 'hr' in getattr(settings, 'INSTALLED_APPS', [])
    # app config
    try:
        app_cfg = apps.get_app_config('hr')
        info['app_config_found'] = True
        info['app_label'] = app_cfg.label
        info['registered_model_names'] = sorted(list(app_cfg.models.keys()))
    except Exception as e:
        info['app_config_found'] = False
        info['app_config_error'] = repr(e)

    # apps.get_model attempt
    try:
        Model = apps.get_model('hr', 'Employee')
        info['apps_get_model_result'] = str(Model)
    except Exception as e:
        info['apps_get_model_error'] = repr(e)

    # sys.modules and direct import
    info['sys_modules_has_hr_models'] = 'hr.models' in sys.modules
    info['sys_modules_hr_models_repr'] = repr(
        sys.modules.get('hr.models')) if 'hr.models' in sys.modules else None

    try:
        mod = importlib.import_module('hr.models')
        info['import_ok'] = True
        info['hr_models_has_Employee'] = hasattr(mod, 'Site')
    except Exception:
        info['import_ok'] = False
        info['import_traceback'] = traceback.format_exc()

    return JsonResponse(info)
