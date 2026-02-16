"""
Admin configuration for Notes app.
"""
from django.contrib import admin
from .models import Note, NoteShare


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'user', 'status', 'pinned', 'is_private', 'created_at']
    list_filter = ['status', 'pinned', 'is_private', 'created_at']
    search_fields = ['title', 'content', 'user__username']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(NoteShare)
class NoteShareAdmin(admin.ModelAdmin):
    list_display = ['id', 'note', 'shared_by', 'shared_with', 'can_edit', 'created_at']
    list_filter = ['can_edit', 'created_at']
    search_fields = ['note__title', 'shared_by__username', 'shared_with__username']
