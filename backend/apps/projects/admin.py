"""
Admin configuration for Projects app.
"""
from django.contrib import admin
from .models import Project


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'status', 'created_by', 'member_count', 'task_count', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['name', 'description']
    filter_horizontal = ['members']
