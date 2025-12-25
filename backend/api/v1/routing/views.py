# python file api/routing/views.py
import importlib
import os
import sys
import traceback

from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_GET
from django.core.cache import cache
from django.apps import apps
from django.db.models import Q
from rest_framework.response import Response

from base import settings
from base.settings import CACHE_TTL, MAX_RECORDS
from utils.types import validate_bool


@require_GET
#/task_list
def task_list(request):
    q = request.GET.get('q', '').strip()
    task_id = request.GET.get('id', '').strip()
    cust_id = request.GET.get('cust_id', '').strip()
    master_id = request.GET.get('master_id', '').strip()
    selected = validate_bool(request.GET.get('selected', None))
    spec_equip = validate_bool(request.GET.get('spec_equip', None))
    description = request.GET.get('description', '').strip()
    task_type = request.GET.get('type', '').strip()
    service_date = request.GET.get('service_date', '').strip()
    next_due = request.GET.get('next_due', '').strip()
    end_date = request.GET.get('end_date', '').strip()
    frequency = request.GET.get('frequency', '').strip()
    refresh = request.GET.get('refresh') in ('1', 'true', 'True')
    cc = request.META.get('HTTP_CACHE_CONTROL', request.GET.get('cache-Control', ''))
    show_all = validate_bool(request.GET.get('show_all'))
    count_only = validate_bool(request.GET.get('count_only'))

    # Build filters only for provided params
    filters = {}
    if task_id:
        filters['id'] = int(task_id)
    if cust_id:
        filters['cust_id'] = cust_id
    if master_id:
        filters['master_id'] = master_id
    if selected not in (None, ''):
        filters['selected'] = selected
    if spec_equip not in (None, ''):
        filters['spec_equipment'] = spec_equip
    if description:
        filters['description__icontains'] = description
    if task_type:
        filters['type__icontains'] = task_type
    if service_date:
        filters['service_date'] = service_date
    if next_due:
        filters['next_due'] = next_due
    if end_date:
        filters['end_date'] = end_date
    if frequency:
        filters['frequency'] = int(frequency)

    if 'no-cache' in cc or 'max-age=0' in cc:
        refresh = True

    # Cache key strategy consistent with payroll_sites_api_v1
    if task_id:
        cache_key = f'routing_tasks_v1_task_id_{task_id}'
    elif cust_id:
        cache_key = f'routing_tasks_v1_cust_{cust_id}'
    else:
        cache_key = f'routing_tasks_v1_show_all_{show_all}'

    data = None if refresh else cache.get(cache_key)
    if data is not None:
        if q:
            ql = q.lower()
            data = [
                d for d in data
                if ql in (d.get('description', '') or '').lower()
                or ql in (d.get('cust_id', '') or '').lower()
                or ql in str(d.get('task_id', ''))
            ]
    else:
        try:
            # runtime model resolution with fallbacks
            def _get_model(app_labels, names):
                for app_label in app_labels:
                    for name in names:
                        try:
                            return apps.get_model(app_label, name)
                        except LookupError:
                            continue
                return None

            Tasks = _get_model(app_labels=['routing', 'api.routing'], names=['Tasks', 'Task'])
            if Tasks is None:
                data = []
            else:
                qs = Tasks.objects.filter(**filters) if filters else Tasks.objects.all()

                if q:
                    if q.isdigit():
                        qs = qs.filter(
                            Q(description__icontains=q) |
                            Q(cust_id__icontains=q) |
                            Q(master_id__icontains=q) |
                            Q(task_id=int(q))
                        )
                    else:
                        qs = qs.filter(
                            Q(description__icontains=q) |
                            Q(cust_id__icontains=q) |
                            Q(master_id__icontains=q) |
                            Q(task_type__icontains=q)
                        )

                qs = qs.order_by('task_order')

                data = [{
                    'id': getattr(t, 'id', 0),
                    'type': getattr(t, 'type', None),
                    'cust_id': getattr(t, 'cust_id', None),
                    'service_date': getattr(t, 'service_date', None),
                    'commission': getattr(t, 'commission', None),
                    'description': getattr(t, 'description', None),
                    'unit_price': getattr(t, 'unit_price', None),
                    'sale_tax': getattr(t, 'sale_tax', None),
                    'grand_total': getattr(t, 'grand_total', None),
                    'next_due': getattr(t, 'next_due', None),
                    'adv_date': getattr(t, 'adv_date', None),
                    'end_date': getattr(t, 'end_date', None),
                    'master_id': getattr(t, 'master_id', None),
                    'quantity': getattr(t, 'quantity', None),
                    'frequency': getattr(t, 'frequency', None),
                    'task_order': getattr(t, 'task_order', None),
                    'adv_freq': getattr(t, 'adv_freq', None),
                    'spec_note': bool(getattr(t, 'spec_note', False)),
                    'spec_equip': bool(getattr(t, 'spec_equip', False)),
                    'obros_id': getattr(t, 'obros_id', None),
                    'selected': bool(getattr(t, 'selected', False)),
                } for t in qs]

        except Exception:
            data = []

        if not q and not refresh:
            cache.set(cache_key, data, CACHE_TTL)

    if count_only:
        return JsonResponse({'count': len(data)})

    return JsonResponse({'count': len(data), 'tasks': data})


#/route_list
@require_GET
def route_list(request):
    filters = {}
    route_id = request.GET.get('id', '').strip()
    route = request.GET.get('route', '').strip()
    active = validate_bool(request.GET.get('active', None))
    description = request.GET.get('description', '').strip()
    count_only = validate_bool(request.GET.get('count_only', False))

    if route_id not in ('', None):
        filters['id'] = route_id
    elif route not in ('', None):
        filters['route'] = route
    elif description not in ('', None):
        filters['description__icontains'] = description

    if active:
        filters['active'] = active

    try:
        try:
            Routes = apps.get_model('routing', 'Routes')
        except LookupError:
            return JsonResponse({'count': 0, 'routes': []})

        qs = Routes.objects.filter(**filters) if filters else Routes.objects.all()

        qs.order_by('sortOrder', 'route')
        data = [{
            'id': getattr(r, 'id', None),
            'route': getattr(r, 'route', '') or '',
            'description': getattr(r, 'description', '') or '',
            'active': bool(getattr(r, 'active', False)),
            'numberIcon': getattr(r, 'numberIcon', None),
            'driver': getattr(r, 'driver', None),
            'icon': getattr(r, 'icon', None),
            'sortOrder': getattr(r, 'sortOrder', None),
            'latitude': getattr(r, 'latitude', None),
            'longitude': getattr(r, 'longitude', None),
        } for r in qs]

    except Exception:
        return JsonResponse({'count': 0, 'routes': []})

    if count_only:
        return JsonResponse({'count': len(data)})

    return JsonResponse({'count': len(data), 'routes': data})


@require_GET
def debug_routing_model(request):
    info = {}
    # environment
    info['DJANGO_SETTINGS_MODULE'] = os.environ.get('DJANGO_SETTINGS_MODULE')
    info['INSTALLED_APPS_contains_routing'] = 'routing' in getattr(settings, 'INSTALLED_APPS', [])
    # app config
    try:
        app_cfg = apps.get_app_config('routing')
        info['app_config_found'] = True
        info['app_label'] = app_cfg.label
        info['registered_model_names'] = sorted(list(app_cfg.models.keys()))
    except Exception as e:
        info['app_config_found'] = False
        info['app_config_error'] = repr(e)

    # apps.get_model attempt
    try:
        Model = apps.get_model('routing', 'Routes')
        info['apps_get_model_result'] = str(Model)
    except Exception as e:
        info['apps_get_model_error'] = repr(e)

    # sys.modules and direct import
    info['sys_modules_has_routing_models'] = 'routing.models' in sys.modules
    info['sys_modules_routing_models_repr'] = repr(
        sys.modules.get('routing.models')) if 'routing.models' in sys.modules else None

    try:
        mod = importlib.import_module('routing.models')
        info['import_ok'] = True
        info['routing_models_has_Route'] = hasattr(mod, 'Routes')
    except Exception:
        info['import_ok'] = False
        info['import_traceback'] = traceback.format_exc()

    return JsonResponse(info)
