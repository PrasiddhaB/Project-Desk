"""
Calendar app URLs.
"""
from django.urls import path
from apps.calendar.views import get_calendar_events, get_task_calendar, get_note_calendar

urlpatterns = [
    path('events/', get_calendar_events, name='calendar-events'),
    path('tasks/', get_task_calendar, name='task-calendar'),
    path('notes/', get_note_calendar, name='note-calendar'),
]
