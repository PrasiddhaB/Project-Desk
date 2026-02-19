"""
Admin configuration for Support app.
"""
from django.contrib import admin
from .models import SupportTicket, TicketReply


@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ['id', 'subject', 'user', 'status', 'priority', 'created_at']
    list_filter = ['status', 'priority', 'created_at']
    search_fields = ['subject', 'description', 'user__username']


@admin.register(TicketReply)
class TicketReplyAdmin(admin.ModelAdmin):
    list_display = ['id', 'ticket', 'user', 'created_at']
    list_filter = ['created_at']
    search_fields = ['message', 'user__username']
