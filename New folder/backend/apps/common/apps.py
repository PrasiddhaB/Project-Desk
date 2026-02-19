"""
App configuration for common.
"""
from django.apps import AppConfig


class CommonConfig(AppConfig):
    """Configuration for common app."""
    
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.common'
    verbose_name = 'Common'
