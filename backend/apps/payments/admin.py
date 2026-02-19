"""
Admin configuration for Payments app.
"""
from django.contrib import admin
from .models import SubscriptionPlan, Subscription, Payment, Invoice


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'plan_type', 'price_monthly', 'price_yearly', 'max_users', 'max_projects', 'is_active']
    list_filter = ['plan_type', 'is_active']
    search_fields = ['name', 'description']


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'plan', 'status', 'billing_cycle', 'start_date', 'next_billing_date']
    list_filter = ['status', 'billing_cycle', 'plan']
    search_fields = ['user__username', 'user__email']
    raw_id_fields = ['user']


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['id', 'subscription', 'amount', 'currency', 'status', 'payment_method', 'created_at']
    list_filter = ['status', 'payment_method', 'created_at']
    search_fields = ['subscription__user__username', 'stripe_payment_intent_id']


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'subscription', 'total_amount', 'status', 'issue_date', 'due_date']
    list_filter = ['status', 'issue_date']
    search_fields = ['invoice_number', 'subscription__user__username']
