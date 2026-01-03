# python file api/accounting/views.py
import importlib
import json
import os
import sys
import traceback

from django.apps import apps
from django.contrib.admin.checks import refer_to_missing_field
from django.core.cache import cache
from django.db.models import Q
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST, require_http_methods

from base import settings
from base.settings import CACHE_TTL, MAX_RECORDS
from utils.types import validate_bool


@csrf_exempt
@require_POST
def employees(request):
    """
    POST /employees
    Supports: q, id|emp_id, name, company, city, state, employed, refresh, cache-control, count_only
    """
    try:
        payload = json.loads(request.body.decode('utf-8') or '{}')
    except Exception:
        return JsonResponse({'error': 'invalid json'}, status=400)

    q = str(payload.get('q', '')).strip()
    filters = {}
    refresh = payload.get('refresh') in (True, '1', 'true', 'True')
    cc = request.META.get('HTTP_CACHE_CONTROL', '')
    count_only = validate_bool(payload.get('count_only'))
    limit = int(payload.get('limit', MAX_RECORDS))

    emp_id = payload.get('id', '') or payload.get('emp_id', '')
    name = payload.get('name', '')
    company = payload.get('company', '')
    
    # Use explicit get without default to allow None
    employed = validate_bool(payload.get('employed'))
    
    status = payload.get('status', '')
    hourly = payload.get('hourly', '')
    address1 = payload.get('address1', '')
    address2 = payload.get('address2', '')
    city = payload.get('city', '')
    state = payload.get('state', '')
    zip_code = payload.get('zip', '')
    cell = payload.get('cell', '')
    phone = payload.get('phone', '')
    start_date = payload.get('start_date', '')
    end_date = payload.get('end_date', '')
    driver = validate_bool(payload.get('driver'))
    subcontractor = validate_bool(payload.get('subcontractor'))
    is_1099 = validate_bool(payload.get('is_1099'))
    email = payload.get('email', '')
    cache_key = None

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
    if zip_code:
        filters['zip__icontains'] = zip_code
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
        cache_key = 'hr_employees_v1_all'

    # Logic fix: If refresh is True, we usually want to fetch from DB, not cache.
    # But if we are using a shared cache key 'hr_employees_v1_all', maybe we want to use it?
    # The original logic was: if refresh and cache has data, use it. This is weird.
    # I will change it to: if NOT refresh, try cache.
    
    data = None
    if not refresh and cache_key:
        data = cache.get(cache_key)

    if data is not None:
        # Filter cached data in Python
        if employed is not None:
             data = [e for e in data if e.get('employed') == employed]
             
        if q:
            ql = q.lower()
            data = [
                e for e in data
                if ql in str(e.get('id', '')).lower()
                   or ql in (e.get('name') or '').lower()
                   or ql in (e.get('company') or '').lower()
                   or ql in (e.get('email') or '').lower()
            ]
        # Apply limit to cached data
        if limit and len(data) > limit:
            data = data[:limit]
    else:
        try:
            try:
                Model = apps.get_model('hr', 'Employee')
            except LookupError:
                Model = None

            if Model is None:
                data = []
            else:
                qs = Model.objects.filter(**filters) if filters else Model.objects.all()

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
                
                # Apply limit
                qs = qs[:limit]

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

        if (refresh or cache_key is not None) and cache_key:
            # Only cache if we have a key (which implies we are caching 'all' or a specific set)
            # But here we only set cache_key if headers are present.
            # And if we filtered by 'employed' in DB, we shouldn't cache it as 'all'.
            # So we should only cache if filters is empty (except maybe q? no, q filters too).
            
            # If we have filters, we shouldn't update the 'all' cache with filtered data.
            if not filters and not q:
                 cache.set(cache_key, data, CACHE_TTL)

    if count_only:
        return JsonResponse({'count': len(data)})

    return JsonResponse({'count': len(data), 'employees': data})


@csrf_exempt
@require_POST
# /notes
def notes(request):
    # Not implemented yet
    return JsonResponse(
        {
            "success": True,
            "status": 200,
            "feature": "Geo Data",
            "Message:": "Not Yet Implemented"
        }
    )


@csrf_exempt
@require_POST
# /goe
def geo(request):
    return JsonResponse(
        {
            "success": True,
            "status": 200,
            "feature": "Geo Data",
            "Message:": "Not Yet Implemented"
        }
    )


@csrf_exempt
@require_POST
def create_employee(request):
    """
    POST /employees/create
    Creates a new employee record
    """
    test = request.POST.get('test', '')

    if test == '1':
        return JsonResponse({'success': True, 'message': 'Test successful'})

    try:
        data = json.loads(request.body)

        try:
            Model = apps.get_model('hr', 'Employee')
        except LookupError:
            return JsonResponse({'error': 'Employee model not found'}, status=500)

        # Create employee with provided data
        employee = Model.objects.create(
            id=data.get('id'),
            name=data.get('name', ''),
            company=data.get('company'),
            ssn=data.get('ssn'),
            employed=data.get('employed', False),
            status=data.get('status'),
            allowances=data.get('allowances', 0),
            hourly=data.get('hourly', 0.00),
            address1=data.get('address1'),
            address2=data.get('address2'),
            city=data.get('city'),
            state=data.get('state'),
            zip=data.get('zip'),
            cell=data.get('cell'),
            phone=data.get('phone'),
            phone2=data.get('phone2'),
            start_date=data.get('start_date'),
            end_date=data.get('end_date'),
            comm_rate=data.get('comm_rate', 0.35),
            efficiency=data.get('efficiency'),
            map_link=data.get('map_link'),
            photo=data.get('photo'),
            sales_commission_rate=data.get('sales_commission_rate', 0.0000),
            pwd=data.get('pwd'),
            driver=data.get('driver', False),
            mass_mailer=data.get('mass_mailer', False),
            has_personal_prospects=data.get('has_personal_prospects', False),
            sales=data.get('sales', False),
            subcontractor=data.get('subcontractor', False),
            is_1099=data.get('is_1099', False),
            fed_tax_number=data.get('fed_tax_number'),
            entity=data.get('entity'),
            email=data.get('email')
        )

        # Clear cache
        cache.delete('hr_employees_v1_all')

        return JsonResponse({
            'success': True,
            'message': 'Employee created successfully',
            'employee': {
                'id': employee.id,
                'name': employee.name,
                'company': employee.company,
                'email': employee.email
            }
        }, status=201)

    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["PUT", "PATCH"])
def update_employee(request, emp_id):
    """
    PUT/PATCH /employees/<emp_id>
    Updates an existing employee record
    """
    try:
        data = json.loads(request.body)

        try:
            Model = apps.get_model('hr', 'Employee')
        except LookupError:
            return JsonResponse({'error': 'Employee model not found'}, status=500)

        try:
            employee = Model.objects.get(id=emp_id)
        except Model.DoesNotExist:
            return JsonResponse({'error': 'Employee not found'}, status=404)

        # Update fields if provided
        if 'name' in data:
            employee.name = data['name']
        if 'company' in data:
            employee.company = data['company']
        if 'ssn' in data:
            employee.ssn = data['ssn']
        if 'employed' in data:
            employee.employed = data['employed']
        if 'status' in data:
            employee.status = data['status']
        if 'allowances' in data:
            employee.allowances = data['allowances']
        if 'hourly' in data:
            employee.hourly = data['hourly']
        if 'address1' in data:
            employee.address1 = data['address1']
        if 'address2' in data:
            employee.address2 = data['address2']
        if 'city' in data:
            employee.city = data['city']
        if 'state' in data:
            employee.state = data['state']
        if 'zip' in data:
            employee.zip = data['zip']
        if 'cell' in data:
            employee.cell = data['cell']
        if 'phone' in data:
            employee.phone = data['phone']
        if 'phone2' in data:
            employee.phone2 = data['phone2']
        if 'start_date' in data:
            employee.start_date = data['start_date']
        if 'end_date' in data:
            employee.end_date = data['end_date']
        if 'comm_rate' in data:
            employee.comm_rate = data['comm_rate']
        if 'efficiency' in data:
            employee.efficiency = data['efficiency']
        if 'map_link' in data:
            employee.map_link = data['map_link']
        if 'photo' in data:
            employee.photo = data['photo']
        if 'sales_commission_rate' in data:
            employee.sales_commission_rate = data['sales_commission_rate']
        if 'pwd' in data:
            employee.pwd = data['pwd']
        if 'driver' in data:
            employee.driver = data['driver']
        if 'mass_mailer' in data:
            employee.mass_mailer = data['mass_mailer']
        if 'has_personal_prospects' in data:
            employee.has_personal_prospects = data['has_personal_prospects']
        if 'sales' in data:
            employee.sales = data['sales']
        if 'subcontractor' in data:
            employee.subcontractor = data['subcontractor']
        if 'is_1099' in data:
            employee.is_1099 = data['is_1099']
        if 'fed_tax_number' in data:
            employee.fed_tax_number = data['fed_tax_number']
        if 'entity' in data:
            employee.entity = data['entity']
        if 'email' in data:
            employee.email = data['email']

        employee.save()

        # Clear cache
        cache.delete('hr_employees_v1_all')

        return JsonResponse({
            'success': True,
            'message': 'Employee updated successfully',
            'employee': {
                'id': employee.id,
                'name': employee.name,
                'company': employee.company,
                'email': employee.email
            }
        })

    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["DELETE"])
def delete_employee(request, emp_id):
    """
    DELETE /employees/<emp_id>
    Deletes an employee record
    """
    try:
        try:
            Model = apps.get_model('hr', 'Employee')
        except LookupError:
            return JsonResponse({'error': 'Employee model not found'}, status=500)

        try:
            employee = Model.objects.get(id=emp_id)
        except Model.DoesNotExist:
            return JsonResponse({'error': 'Employee not found'}, status=404)

        employee_data = {
            'id': employee.id,
            'name': employee.name,
            'company': employee.company
        }

        employee.delete()

        # Clear cache
        cache.delete('hr_employees_v1_all')

        return JsonResponse({
            'success': True,
            'message': 'Employee deleted successfully',
            'employee': employee_data
        })

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_POST
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
