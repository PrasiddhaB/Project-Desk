"""
Admin configuration for Payments app.
"""
from django.contrib import admin
from .models import SubscriptionPlan, Subscription, Payment


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'price', 'note_limit', 'private_note_limit', 'is_unlimited', 'is_active']
    list_filter = ['is_active', 'is_unlimited']
    search_fields = ['name', 'description']


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'plan', 'status', 'start_date', 'end_date', 'is_active']
    list_filter = ['status', 'plan']
    search_fields = ['user__username', 'user__email']
    raw_id_fields = ['user']


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'plan', 'amount', 'currency', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['user__username', 'khalti_pidx', 'khalti_transaction_id']
