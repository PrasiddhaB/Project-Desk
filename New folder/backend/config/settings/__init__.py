"""
Settings module initialization.
Defaults to development settings.
"""
import os

environment = os.environ.get('DJANGO_SETTINGS_MODULE', 'config.settings.dev')

if 'prod' in environment:
    from .prod import *
else:
    from .dev import *
