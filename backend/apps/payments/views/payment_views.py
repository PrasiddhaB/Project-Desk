"""
Payment API views.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone

from apps.payments.models import SubscriptionPlan, Subscription, Payment, Invoice
from apps.payments.serializers import (
    SubscriptionPlanSerializer,
    SubscriptionSerializer,
    SubscriptionDetailSerializer,
    PaymentSerializer,
    InvoiceSerializer,
    CreateSubscriptionSerializer,
    UpdateSubscriptionSerializer,
)


class SubscriptionPlanViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for subscription plans.
    Anyone can view plans, only admin can manage.
    """
    queryset = SubscriptionPlan.objects.filter(is_active=True)
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['get'], url_path='compare')
    def compare(self, request):
        """Compare all plans side by side."""
        plans = SubscriptionPlan.objects.filter(is_active=True).order_by('price_monthly')
        serializer = self.get_serializer(plans, many=True)
        return Response({
            'count': plans.count(),
            'data': serializer.data
        })


class SubscriptionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for user subscriptions.
    """
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return SubscriptionDetailSerializer
        elif self.action == 'create':
            return CreateSubscriptionSerializer
        elif self.action in ['update', 'partial_update']:
            return UpdateSubscriptionSerializer
        return SubscriptionSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Subscription.objects.select_related('plan', 'user').all()
        return Subscription.objects.filter(user=user).select_related('plan')
    
    @action(detail=False, methods=['get'], url_path='my-subscription')
    def my_subscription(self, request):
        """Get current user's subscription."""
        try:
            subscription = Subscription.objects.select_related('plan').get(user=request.user)
            serializer = SubscriptionDetailSerializer(subscription)
            return Response({
                'data': serializer.data
            })
        except Subscription.DoesNotExist:
            return Response({
                'message': 'No active subscription',
                'data': None
            })
    
    def create(self, request, *args, **kwargs):
        """Create a new subscription for the user."""
        # Check if user already has subscription
        if Subscription.objects.filter(user=request.user).exists():
            return Response({
                'message': 'User already has a subscription. Use upgrade/downgrade instead.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        plan = SubscriptionPlan.objects.get(id=serializer.validated_data['plan_id'])
        billing_cycle = serializer.validated_data['billing_cycle']
        
        # Create subscription with trial
        subscription = Subscription.objects.create(
            user=request.user,
            plan=plan,
            billing_cycle=billing_cycle,
            status=Subscription.Status.TRIAL
        )
        subscription.start_trial(days=14)
        
        response_serializer = SubscriptionDetailSerializer(subscription)
        return Response({
            'message': 'Subscription created with 14-day trial',
            'data': response_serializer.data
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'], url_path='upgrade')
    def upgrade(self, request):
        """Upgrade subscription to a higher plan."""
        try:
            subscription = Subscription.objects.get(user=request.user)
        except Subscription.DoesNotExist:
            return Response({
                'message': 'No subscription found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        plan_id = request.data.get('plan_id')
        if not plan_id:
            return Response({
                'message': 'plan_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            new_plan = SubscriptionPlan.objects.get(id=plan_id, is_active=True)
        except SubscriptionPlan.DoesNotExist:
            return Response({
                'message': 'Invalid plan'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if it's actually an upgrade
        if new_plan.price_monthly <= subscription.plan.price_monthly:
            return Response({
                'message': 'New plan must be higher than current plan'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        old_plan = subscription.plan.name
        subscription.plan = new_plan
        subscription.save()
        
        serializer = SubscriptionDetailSerializer(subscription)
        return Response({
            'message': f'Upgraded from {old_plan} to {new_plan.name}',
            'data': serializer.data
        })
    
    @action(detail=False, methods=['post'], url_path='cancel')
    def cancel(self, request):
        """Cancel subscription."""
        try:
            subscription = Subscription.objects.get(user=request.user)
        except Subscription.DoesNotExist:
            return Response({
                'message': 'No subscription found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        subscription.cancel()
        
        serializer = SubscriptionDetailSerializer(subscription)
        return Response({
            'message': 'Subscription cancelled',
            'data': serializer.data
        })
    
    @action(detail=False, methods=['post'], url_path='reactivate')
    def reactivate(self, request):
        """Reactivate a cancelled subscription."""
        try:
            subscription = Subscription.objects.get(user=request.user)
        except Subscription.DoesNotExist:
            return Response({
                'message': 'No subscription found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        if subscription.status != Subscription.Status.CANCELLED:
            return Response({
                'message': 'Subscription is not cancelled'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        subscription.activate()
        
        serializer = SubscriptionDetailSerializer(subscription)
        return Response({
            'message': 'Subscription reactivated',
            'data': serializer.data
        })
    
    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        """Get subscription stats (admin only)."""
        if request.user.role != 'admin':
            return Response({
                'message': 'Admin only'
            }, status=status.HTTP_403_FORBIDDEN)
        
        total = Subscription.objects.count()
        active = Subscription.objects.filter(status=Subscription.Status.ACTIVE).count()
        trial = Subscription.objects.filter(status=Subscription.Status.TRIAL).count()
        cancelled = Subscription.objects.filter(status=Subscription.Status.CANCELLED).count()
        
        return Response({
            'total': total,
            'active': active,
            'trial': trial,
            'cancelled': cancelled,
        })


class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for payments (read-only for users).
    """
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Payment.objects.select_related('subscription__user').all()
        return Payment.objects.filter(subscription__user=user)
    
    @action(detail=False, methods=['get'], url_path='my-payments')
    def my_payments(self, request):
        """Get current user's payment history."""
        payments = Payment.objects.filter(
            subscription__user=request.user
        ).order_by('-created_at')
        
        serializer = self.get_serializer(payments, many=True)
        return Response({
            'count': payments.count(),
            'data': serializer.data
        })


class InvoiceViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for invoices (read-only for users).
    """
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Invoice.objects.select_related('subscription__user').all()
        return Invoice.objects.filter(subscription__user=user)
    
    @action(detail=False, methods=['get'], url_path='my-invoices')
    def my_invoices(self, request):
        """Get current user's invoices."""
        invoices = Invoice.objects.filter(
            subscription__user=request.user
        ).order_by('-created_at')
        
        serializer = self.get_serializer(invoices, many=True)
        return Response({
            'count': invoices.count(),
            'data': serializer.data
        })
