"""
Payment serializers for API endpoints.
"""
from rest_framework import serializers
from apps.payments.models import SubscriptionPlan, Subscription, Payment


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    """Serializer for subscription plans."""
    
    class Meta:
        model = SubscriptionPlan
        fields = [
            'id', 'name', 'description', 'price',
            'note_limit', 'private_note_limit', 'is_unlimited',
            'is_active', 'created_at'
        ]


class SubscriptionSerializer(serializers.ModelSerializer):
    """Serializer for subscriptions."""
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    plan_price = serializers.DecimalField(source='plan.price', max_digits=10, decimal_places=2, read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    days_remaining = serializers.IntegerField(read_only=True)
    note_limit = serializers.IntegerField(source='plan.note_limit', read_only=True)
    private_note_limit = serializers.IntegerField(source='plan.private_note_limit', read_only=True)
    is_unlimited = serializers.BooleanField(source='plan.is_unlimited', read_only=True)
    
    class Meta:
        model = Subscription
        fields = [
            'id', 'user', 'plan', 'plan_name', 'plan_price',
            'status', 'is_active', 'days_remaining',
            'note_limit', 'private_note_limit', 'is_unlimited',
            'start_date', 'end_date', 'created_at'
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
            'status', 'is_active', 'days_remaining',
            'start_date', 'end_date', 'created_at', 'updated_at'
        ]


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for payments."""
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'user', 'user_name', 'plan', 'plan_name',
            'amount', 'currency', 'status',
            'khalti_pidx', 'khalti_transaction_id', 'purchase_order_id',
            'description', 'failure_reason', 'created_at'
        ]


class InitiatePaymentSerializer(serializers.Serializer):
    """Serializer for initiating Khalti payment."""
    plan_id = serializers.IntegerField()
    
    def validate_plan_id(self, value):
        if not SubscriptionPlan.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError('Invalid or inactive plan.')
        return value
