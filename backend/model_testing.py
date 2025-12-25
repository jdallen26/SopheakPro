# python
import os
import sys
import json
from django.core.serializers.json import DjangoJSONEncoder

# Initialize Django (match manage.py)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "base.settings")
import django
django.setup()

from django.apps import apps

DEFAULT_SAMPLE_LIMIT = 20
LARGE_COUNT_WARNING = 100000

def list_apps():
    apps_with_models = []
    for app_config in apps.get_app_configs():
        models = list(app_config.get_models())
        if models:
            apps_with_models.append((app_config.label, models))
    return apps_with_models

def pick_from_list(prompt, items):
    if not items:
        print("  (none)")
        return None
    for i, name in enumerate(items, start=1):
        print(f"  {i}) {name}")
    print("  b) Back")
    print("  q) Quit")
    while True:
        sel = input(prompt).strip().lower()
        if sel in ("b", "q"):
            return sel
        if sel.isdigit():
            idx = int(sel) - 1
            if 0 <= idx < len(items):
                return idx
        print("Invalid selection, try again.")

def show_model_structure(Model):
    print(f"\nModel: {Model.__module__}.{Model.__name__}")
    print("Fields:")
    for f in Model._meta.get_fields():
        # Only show concrete fields with attribute metadata where possible
        attrs = []
        try:
            col = getattr(f, "column", None)
            attrs.append(f"column={col}" if col else "")
            attrs.append(f"type={f.get_internal_type()}" if hasattr(f, "get_internal_type") else "")
            attrs.append("pk" if getattr(f, "primary_key", False) else "")
            attrs.append("nullable" if getattr(f, "null", False) else "")
            if getattr(f, "max_length", None) is not None:
                attrs.append(f"max_length={f.max_length}")
        except Exception:
            attrs = []
        meta = ", ".join([a for a in attrs if a])
        print(f"  - {f.name} {('(' + meta + ')') if meta else ''}")
    print("")

def get_sample(Model, limit):
    try:
        qs = Model.objects.all()[:limit]
        # pick concrete field names (exclude related descriptors)
        field_names = [f.name for f in Model._meta.fields]
        rows = []
        for obj in qs:
            row = {}
            for fn in field_names:
                try:
                    row[fn] = getattr(obj, fn)
                except Exception:
                    row[fn] = None
            # include helpful read-only props if present (e.g. *_mmddyyyy)
            for prop in ("start_mmddyyyy", "end_mmddyyyy", "week_done_mmddyyyy", "oldstart_mmddyyyy", "oldend_mmddyyyy", "billing_date_mmddyyyy"):
                if hasattr(obj, prop):
                    try:
                        row[prop] = getattr(obj, prop)
                    except Exception:
                        row[prop] = None
            rows.append(row)
        return rows
    except Exception as e:
        print("Error fetching sample:", e)
        return []

def model_menu(Model):
    while True:
        print(f"\n== Model: {Model.__name__} ==")
        print("  1) Count")
        print("  2) Data sample")
        print("  3) Model structure")
        print("  b) Back")
        print("  q) Quit")
        sel = input("Choose an option: ").strip().lower()
        if sel == "1":
            try:
                cnt = Model.objects.count()
                print(f"Count: {cnt}")
                if cnt > LARGE_COUNT_WARNING:
                    print("Warning: large table. Avoid heavy operations or confirm actions.")
            except Exception as e:
                print("Error getting count:", e)
        elif sel == "2":
            limit = DEFAULT_SAMPLE_LIMIT
            raw = input(f"Sample limit [{DEFAULT_SAMPLE_LIMIT}] (enter to accept or type number): ").strip()
            if raw:
                if raw.isdigit():
                    limit = int(raw)
                else:
                    print("Invalid number, using default.")
            if limit <= 0:
                print("Limit must be > 0.")
                continue
            if limit > DEFAULT_SAMPLE_LIMIT:
                confirm = input(f"You're requesting {limit} rows. Continue? (y/N): ").strip().lower()
                if confirm != "y":
                    print("Cancelled.")
                    continue
            rows = get_sample(Model, limit)
            print(json.dumps({"count": len(rows), "rows": rows}, cls=DjangoJSONEncoder, indent=2, default=str))
        elif sel == "3":
            show_model_structure(Model)
        elif sel == "b":
            return
        elif sel == "q":
            print("Exiting.")
            sys.exit(0)
        else:
            print("Invalid choice.")

def main_loop():
    while True:
        print("\n== Apps ==")
        apps_models = list_apps()
        labels = [a for a, _ in apps_models]
        if not labels:
            print("No apps with models found.")
            return
        sel = pick_from_list("Select app: ", labels)
        if sel == "b":
            continue
        if sel == "q":
            print("Exiting.")
            return
        if isinstance(sel, int):
            app_label, model_list = apps_models[sel]
            # prepare model names
            model_names = [m.__name__ for m in model_list]
            while True:
                print(f"\n== Models in `{app_label}` ==")
                msel = pick_from_list("Select model: ", model_names)
                if msel == "b":
                    break
                if msel == "q":
                    print("Exiting.")
                    return
                if isinstance(msel, int):
                    Model = model_list[msel]
                    model_menu(Model)

if __name__ == "__main__":
    try:
        main_loop()
    except KeyboardInterrupt:
        print("\nInterrupted. Exiting.")
        sys.exit(0)
