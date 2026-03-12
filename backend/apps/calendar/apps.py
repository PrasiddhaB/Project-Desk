"""
Calendar app configuration.
"""
from django.apps import AppConfig


class CalendarConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.calendar'
    label = 'app_calendar'  # Avoid conflict with Python's calendar module
