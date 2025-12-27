from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-change-me-for-dev'

DEBUG = True

ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'corsheaders',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django_bootstrap5',
    'django.contrib.humanize',
    'accounting.apps.AccountingConfig',
    'customers.apps.CustomersConfig',
    'payroll.apps.PayrollConfig',
    'hr.apps.HRConfig',
    'routing.apps.RoutingConfig',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'base.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'base.wsgi.application'

# Database configured to use DSN defined in ODBC: SopheakWebApp
DATABASES = {
    'default': {
        'ENGINE': 'mssql',
        'NAME': 'MBMMaster',
        'OPTIONS': {
            'dsn': 'SopheakWebApp',
        },
    },
}

# Internationalization / Static
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = False
USE_TZ = False

STATIC_URL = '/static/'
# Primary development static dir
STATICFILES_DIRS = [BASE_DIR / 'static']
# Also include collect static output if present (helps when collect static was run previously)
if (BASE_DIR / 'staticfiles').exists():
    STATICFILES_DIRS.append(BASE_DIR / 'staticfiles')

# Only set STATIC_ROOT for production (when DEBUG is False)
if not DEBUG:
    STATIC_ROOT = BASE_DIR / 'staticfiles'
else:
    # Development: do not set STATIC_ROOT so runserver serves from STATICFILES_DIRS
    STATIC_ROOT = None

CACHE_TTL = 600  # 10 minutes
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Model management toggle:
# Default: DO NOT let Django manage (create/alter) tables.
# Set to True to allow migrations to run for all models.
MODELS_MANAGED_DEFAULT = False

# Per-app overrides: {'app_label': True} to enable management for that app.
# Example: MODELS_MANAGED_OVERRIDES = {'hr': True, 'payroll': True}
MODELS_MANAGED_OVERRIDES = {}

# Disable migrations for core contrib apps to keep the project migration-free and silence warnings
MIGRATION_MODULES = {
    'admin': None,
    'auth': None,
    'contenttypes': None,
    'sessions': None,
    'payroll': None,
    'routing': None,
    'accounting': None,
}

# DEV: allow only your Next dev origin(s)
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.12.142:3000",
    "http://192.168.12.241:3000",
]

# OR for quick local testing only (not recommended for production):
# CORS_ALLOW_ALL_ORIGINS = True

CORS_ALLOW_CREDENTIALS = True
# Optionally restrict headers/methods if needed (defaults are usually fine)
# CORS_ALLOW_HEADERS = list(default_headers) + [...]
# CORS_ALLOW_METHODS = list(default_methods) + [...]

RECORD_PER_PAGE = 50
MAX_RECORDS = 3000