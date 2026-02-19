"""
Admin configuration for Tasks app.
"""
from django.contrib import admin
from .models import Task


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    """Admin view for Task model."""
    
    list_display = [
        'id', 'title', 'status', 'priority', 
        'due_date', 'created_by', 'created_at'
    ]
    list_filter = ['status', 'priority', 'created_at']
    search_fields = ['title', 'description', 'created_by__username']
    filter_horizontal = ['assigned_to']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Task Information', {
            'fields': ('title', 'description', 'status', 'priority', 'due_date')
        }),
        ('Assignment', {
            'fields': ('created_by', 'assigned_to')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
