from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET
from django.http import JsonResponse, HttpResponseBadRequest
from django.utils import timezone
from customers.models import Site

COLUMNS = {
    "cust_id": "cust_id",
    "mkt_co": "mkt_co",
    "reg_name": "reg_name",
    "company": "company",
    "address": "address",
    "city": "city",
    "county": "county",
    "state": "state",
    "zip": "zip_code",
    "phone": "phone",
    "start": "start",
    "master_id": "master_id",
    "business_type": "business_type",
    "cod": "cod",
    "voucher": "voucher",
    "taxable": "taxable",
    "other_bill": "other_bill",
    "mailto": "mailto",
    "adv_bill": "adv_bill",
    "adv_credit": "adv_credit",
    "billing_cycle": "billing_cycle",
    "site_comm": "site_comm",
    "longitude": "longitude",
    "latitude": "latitude",
    "fax": "fax",
    "email": "email",
    "cell": "cell",
    "work_phone": "work_phone",
    "customer_notes": "customer_notes",
    "tax_rate": "tax_rate",
    "service_client": "service_client",
    "active": "active",
    "updated_by": "updated_by",
    "updated_date": "updated_date",
    "pmt_type": "pmt_type",
    "inv_type": "inv_type",
    "send_receipt": "send_receipt",
    "e_mail": "e_mail_flag",
    "signature_required": "signature_required",
    "default_contact": "default_contact",
    "custom1": "custom1",
    "custom2": "custom2",
    "prospect_status": "prospect_status",
    "task_style": "task_style",
    "quick_note": "quick_note",
    "sms_opt_in": "sms_opt_in",
    "needs_price_increased": "needs_price_increased",
    "price_increase_document": "price_increase_document",
    "sold_by": "sold_by",
    "call_blasted": "call_blasted",
    "call_blasted_date": "call_blasted_date",
    "job_types": "job_types",
    "job_types_abbrs": "job_types_abbrs",
    "pays_own_invoices": "pays_own_invoices",
    "ct_exception": "ct_exception",
}

# presets for pages
PRESETS = {
    "list": ["cust_id", "company", "address", "city", "state"],
    "page_b": ["cust_id", "phone", "tax_rate"],
    "default": ["cust_id", "company", "active"],
}

def _to_bool(v):
    return str(v).lower() in ("1", "true", "yes", "on")

# allowed filters: public_param -> (model_field, lookup, type_converter)
ALLOWED_FILTERS = {
    "company": ("company", "icontains", str),
    "city": ("city", "iexact", str),
    "state": ("state", "iexact", str),
    "active": ("active", "exact", _to_bool),
}

# date fields that need formatting
DATE_FIELDS = {"start", "updated_date"}

def _format_dt_cache():
    cache = {}
    def fmt(dt):
        if not dt:
            return None
        if dt in cache:
            return cache[dt]
        try:
            s = timezone.localtime(dt).strftime("%m/%d/%Y")
        except Exception:
            s = str(dt)
        cache[dt] = s
        return s
    return fmt

def site_list(request):
    # Determine columns to include
    cols_param = request.GET.get("cols", "default")
    if cols_param in PRESETS:
        columns = PRESETS[cols_param]
    else:
        columns = [col.strip() for col in cols_param.split(",") if col.strip() in COLUMNS]
        if not columns:
            return HttpResponseBadRequest("No valid columns specified.")

    # Build queryset with filters
    queryset = Site.objects.all()
    for param, (field, lookup, converter) in ALLOWED_FILTERS.items():
        if param in request.GET:
            try:
                value = converter(request.GET[param])
                filter_kwargs = {f"{field}__{lookup}": value}
                queryset = queryset.filter(**filter_kwargs)
            except Exception:
                return HttpResponseBadRequest(f"Invalid value for filter '{param}'.")

    # Fetch data
    data = list(queryset.values(*[COLUMNS[col] for col in columns]))

    # Format date fields
    fmt_date = _format_dt_cache()
    for row in data:
        for col in columns:
            model_field = COLUMNS[col]
            if model_field in DATE_FIELDS:
                row[model_field] = fmt_date(row[model_field])

    return JsonResponse({"data": data})

@require_GET
def get_site(request, uid):
    try:
        site = Site.objects.get(cust_id=uid)
    except Site.DoesNotExist:
        return HttpResponseBadRequest("Site not found.")

    data = {}
    for col, model_field in COLUMNS.items():
        value = getattr(site, model_field)
        if model_field in DATE_FIELDS:
            value = timezone.localtime(value).strftime("%m/%d/%Y") if value else None
        data[col] = value

    return JsonResponse(data)
