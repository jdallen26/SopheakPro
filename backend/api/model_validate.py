# python
import os
import django

# Set your settings module (replace with your project settings path)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'base.settings')

# Initialize Django
django.setup()

# Now safe to import Django models and use ORM
from routing.models import Tasks

print(Tasks.objects.count())