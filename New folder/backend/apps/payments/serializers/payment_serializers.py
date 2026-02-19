"""
Payment serializers for API endpoints.
"""
from rest_framework import serializers
from apps.payments.models import SubscriptionPlan, Subscription, Payment, Invoice


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    """Serializer for subscription plans."""
    
    class Meta:
        model = SubscriptionPlan
        fields = [
            'id', 'name', 'plan_type', 'description',
            'price_monthly', 'price_yearly',
            'max_users', 'max_projects', 'max_tasks_per_project', 'max_storage_mb',
            'has_priority_support', 'has_advanced_analytics', 
            'has_custom_branding', 'has_api_access',
            'is_active'
        ]


class SubscriptionSerializer(serializers.ModelSerializer):
    """Serializer for subscriptions."""
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    plan_type = serializers.CharField(source='plan.plan_type', read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    days_remaining = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Subscription
        fields = [
            'id', 'user', 'plan', 'plan_name', 'plan_type',
            'status', 'billing_cycle', 'is_active', 'days_remaining',
            'start_date', 'end_date', 'trial_end_date', 'next_billing_date',
            'created_at'
        ]


class SubscriptionDetailSerializer(serializers.ModelSerializer):
    """Detailed subscription serializer with plan info."""
    plan = SubscriptionPlanSerializer(read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    days_remaining = serializers.IntegerField(read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    
    class Meta:
        model = Subscription
        fields = [
            'id', 'user', 'user_email', 'user_name', 'plan',
            'status', 'billing_cycle', 'is_active', 'days_remaining',
            'start_date', 'end_date', 'trial_end_date', 'next_billing_date',
            'cancelled_at', 'created_at', 'updated_at'
        ]


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for payments."""
    subscription_user = serializers.CharField(source='subscription.user.username', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'subscription', 'subscription_user',
            'amount', 'currency', 'status', 'payment_method',
            'description', 'receipt_url', 'failure_reason',
            'created_at'
        ]


class InvoiceSerializer(serializers.ModelSerializer):
    """Serializer for invoices."""
    subscription_user = serializers.CharField(source='subscription.user.username', read_only=True)
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'subscription', 'subscription_user',
            'invoice_number', 'amount', 'tax_amount', 'total_amount',
            'currency', 'status', 'issue_date', 'due_date', 'paid_date',
            'description', 'notes', 'created_at'
        ]


class CreateSubscriptionSerializer(serializers.Serializer):
    """Serializer for creating a subscription."""
    plan_id = serializers.IntegerField()
    billing_cycle = serializers.ChoiceField(choices=Subscription.BillingCycle.choices)
    
    def validate_plan_id(self, value):
        if not SubscriptionPlan.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError('Invalid or inactive plan.')
        return value


class UpdateSubscriptionSerializer(serializers.Serializer):
    """Serializer for updating subscription."""
    plan_id = serializers.IntegerField(required=False)
    billing_cycle = serializers.ChoiceField(
        choices=Subscription.BillingCycle.choices,
        required=False
    )
    action = serializers.ChoiceField(
        choices=['upgrade', 'downgrade', 'cancel', 'reactivate'],
        required=False
    )
