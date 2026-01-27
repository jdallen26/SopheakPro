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
import utils.strings as st

@csrf_exempt
@require_POST
# /users
def users(request):
    # Not implemented yet
    return JsonResponse(
        {
            "success": True,
            "feature": "User List",
            "Message:": st.get_message(st.NOT_YET_IMPLEMENTED, NAME='users')
        }
    )


@csrf_exempt
@require_POST
# /permissions
def permissions(request):
    # Not implemented yet
    return JsonResponse(
        {
            "success": True,
            "feature": "Permissions",
            "Message:": st.get_message(st.NOT_YET_IMPLEMENTED, NAME='permissions')}
    )


@csrf_exempt
@require_POST
# /groups
def groups(request):
    # Not implemented yet
    return JsonResponse(
        {
            "success": True,
            "feature": "Groups",
            "Message:": st.get_message(st.NOT_YET_IMPLEMENTED, NAME='groups')}

    )


@csrf_exempt
@require_POST
# /roles
def roles(request):
    # Not implemented yet
    return JsonResponse(
        {
            "success": True,
            "feature": "Roles",
            "Message:": st.get_message(st.NOT_YET_IMPLEMENTED, NAME='roles')}
    )


@csrf_exempt
@require_POST
def debug_api_auth_model(request):
    info = {}
    # environment
    info['DJANGO_SETTINGS_MODULE'] = os.environ.get('DJANGO_SETTINGS_MODULE')
    info['INSTALLED_APPS_contains_'] = 'api_auth' in getattr(settings, 'INSTALLED_APPS', [])
    # app config
    try:
        app_cfg = apps.get_app_config('api_auth')
        info['app_config_found'] = True
        info['app_label'] = app_cfg.label
        info['registered_model_names'] = sorted(list(app_cfg.models.keys()))
    except Exception as e:
        info['app_config_found'] = False
        info['app_config_error'] = repr(e)

    # apps.get_model attempt
    try:
        # TODO: replace with your app label and model name
        Model = apps.get_model('', '')
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
        # TODO: add your model names here
        info['payroll_models_has_tasks'] = hasattr(mod, '')
    except Exception:
        info['import_ok'] = False
        info['import_traceback'] = traceback.format_exc()

    return JsonResponse(info)
