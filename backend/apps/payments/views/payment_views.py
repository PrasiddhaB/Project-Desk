"""
Payment API views with Khalti integration.

Role access matrix (enforced below):

    Action                                     superadmin  admin  employee
    --------------------------------------------------------------------------
    List active plans (public catalog)             OK       OK      OK
    List ALL plans (incl. inactive)                OK        -       -
    Create / update / delete plan                  OK        -       -
    List ALL subscriptions globally                OK        -       -
    Admin-cancel ANY subscription                  OK        -       -
    Get my own subscription                        OK       OK      OK
    Cancel my own subscription                      -       OK      OK
    Initiate Khalti payment                         -       OK      OK
    View my payment history                        OK       OK      OK
    View ALL payments                              OK        -       -

Superadmin never needs to subscribe and the initiate-payment endpoint
returns a friendly 400 for them.
"""
import os
import requests
import json
import uuid
from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from django.shortcuts import redirect

from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView

from apps.payments.models import SubscriptionPlan, Subscription, Payment
from apps.payments.serializers import (
    SubscriptionPlanSerializer,
    SubscriptionSerializer,
    SubscriptionDetailSerializer,
    PaymentSerializer,
    InitiatePaymentSerializer,
)
from apps.accounts.permissions import IsSuperAdmin


# ---------------------------------------------------------------------------
# Khalti API Configuration
# ---------------------------------------------------------------------------
KHALTI_SECRET_KEY = getattr(settings, 'KHALTI_SECRET_KEY', None) or os.environ.get(
    'KHALTI_SECRET_KEY', '5bf2afad915247d1a28055fb7aaee102'
)
KHALTI_ENV = getattr(settings, 'KHALTI_ENV', None) or os.environ.get('KHALTI_ENV', 'dev')

if KHALTI_ENV == 'live':
    KHALTI_API_URL = 'https://khalti.com/api/v2/epayment/initiate/'
    KHALTI_LOOKUP_URL = 'https://khalti.com/api/v2/epayment/lookup/'
else:
    KHALTI_API_URL = 'https://dev.khalti.com/api/v2/epayment/initiate/'
    KHALTI_LOOKUP_URL = 'https://dev.khalti.com/api/v2/epayment/lookup/'


# ---------------------------------------------------------------------------
# Subscription Plans (SuperAdmin-only for write ops)
# ---------------------------------------------------------------------------

class SubscriptionPlanViewSet(viewsets.ModelViewSet):
    """
    Plan catalog.

    Read: anyone (authenticated) can browse active plans to pick one.
    Write (create/update/delete): superadmin ONLY. This is the "Manage
    Plans" page in the navbar - hidden from admin and employee.
    """
    queryset = SubscriptionPlan.objects.filter(is_active=True)
    serializer_class = SubscriptionPlanSerializer
    
    def get_queryset(self):
        # Superadmin sees everything (including inactive plans)
        user = self.request.user
        if user.is_authenticated and user.role == 'superadmin':
            return SubscriptionPlan.objects.all()
        return SubscriptionPlan.objects.filter(is_active=True)
    
    def get_permissions(self):
        # Public read so the signup/upgrade page can show plans
        if self.action in ('list', 'retrieve'):
            return [AllowAny()]
        # Writes: superadmin only
        return [IsAuthenticated(), IsSuperAdmin()]


# ---------------------------------------------------------------------------
# Subscriptions
# ---------------------------------------------------------------------------

class SubscriptionViewSet(viewsets.ModelViewSet):
    """
    Subscription management.

    list / retrieve         -> superadmin only (Manage Subscriptions page)
    create / update         -> superadmin only (assign plan to any user)
    destroy                 -> superadmin only (admin-cancel)
    my_subscription         -> any authenticated user (their own)
    cancel_my_subscription  -> admin or employee (their own)
    check                   -> any authenticated user (access check)
    """
    permission_classes = [IsAuthenticated]
    serializer_class = SubscriptionSerializer
    
    def get_queryset(self):
        user = self.request.user
        # Only superadmin has a global view.
        if user.role == 'superadmin':
            return Subscription.objects.select_related('plan', 'user').all()
        # Everyone else only ever sees their own subscription row.
        return Subscription.objects.filter(user=user).select_related('plan')
    
    def _require_superadmin(self, request):
        """Return a 403 Response if caller is not superadmin, else None."""
        if request.user.role != 'superadmin':
            return Response(
                {'message': 'Super admin access required'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return None
    
    def list(self, request, *args, **kwargs):
        forbidden = self._require_superadmin(request)
        if forbidden is not None:
            return forbidden
        return super().list(request, *args, **kwargs)
    
    def retrieve(self, request, *args, **kwargs):
        forbidden = self._require_superadmin(request)
        if forbidden is not None:
            return forbidden
        return super().retrieve(request, *args, **kwargs)
    
    def create(self, request, *args, **kwargs):
        """Superadmin can create/assign a subscription for any user."""
        forbidden = self._require_superadmin(request)
        if forbidden is not None:
            return forbidden
        
        user_id = request.data.get('user_id')
        plan_id = request.data.get('plan_id')
        days = request.data.get('days', 30)
        
        if not user_id or not plan_id:
            return Response(
                {'message': 'user_id and plan_id required'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        from apps.accounts.models import User
        try:
            user = User.objects.get(id=user_id)
            plan = SubscriptionPlan.objects.get(id=plan_id)
        except (User.DoesNotExist, SubscriptionPlan.DoesNotExist):
            return Response(
                {'message': 'User or Plan not found'},
                status=status.HTTP_404_NOT_FOUND,
            )
        
        subscription, created = Subscription.objects.update_or_create(
            user=user,
            defaults={
                'plan': plan,
                'status': 'active',
                'start_date': timezone.now().date(),
                'end_date': timezone.now().date() + timedelta(days=days),
            },
        )
        
        serializer = SubscriptionDetailSerializer(subscription)
        return Response(
            {
                'message': 'Subscription created' if created else 'Subscription updated',
                'data': serializer.data,
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )
    
    def update(self, request, *args, **kwargs):
        forbidden = self._require_superadmin(request)
        if forbidden is not None:
            return forbidden
        
        instance = self.get_object()
        data = request.data
        
        if 'plan_id' in data:
            try:
                instance.plan = SubscriptionPlan.objects.get(id=data['plan_id'])
            except SubscriptionPlan.DoesNotExist:
                return Response(
                    {'message': 'Plan not found'},
                    status=status.HTTP_404_NOT_FOUND,
                )
        
        if 'status' in data:
            instance.status = data['status']
        
        if 'end_date' in data:
            instance.end_date = data['end_date']
        
        instance.save()
        
        serializer = SubscriptionDetailSerializer(instance)
        return Response({'message': 'Subscription updated', 'data': serializer.data})
    
    def partial_update(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Superadmin: admin-cancel a subscription."""
        forbidden = self._require_superadmin(request)
        if forbidden is not None:
            return forbidden
        
        instance = self.get_object()
        instance.status = 'cancelled'
        instance.save()
        return Response({'message': 'Subscription cancelled'})
    
    @action(detail=False, methods=['get'], url_path='my-subscription')
    def my_subscription(self, request):
        """Get current user's subscription (any role)."""
        # Superadmin doesn't need/have one - return a friendly shape.
        if request.user.role == 'superadmin':
            return Response(
                {
                    'has_subscription': False,
                    'is_superadmin': True,
                    'message': 'Super admin does not require a subscription',
                    'data': None,
                }
            )
        
        try:
            subscription = Subscription.objects.select_related('plan').get(user=request.user)
            subscription.check_expired()
            
            if subscription.is_active:
                serializer = SubscriptionDetailSerializer(subscription)
                return Response({'has_subscription': True, 'data': serializer.data})
            
            # Return the (expired/cancelled) row too so UI can show history.
            serializer = SubscriptionDetailSerializer(subscription)
            return Response(
                {
                    'has_subscription': False,
                    'message': f'Subscription {subscription.status}',
                    'data': serializer.data,
                }
            )
        except Subscription.DoesNotExist:
            return Response(
                {
                    'has_subscription': False,
                    'message': 'No active subscription',
                    'data': None,
                }
            )
    
    @action(detail=False, methods=['post'], url_path='cancel-my-subscription')
    def cancel_my_subscription(self, request):
        """
        Admin or employee cancels their OWN subscription.

        Superadmin is rejected because they have none.
        Access remains active until `end_date` - we just flip status.
        """
        if request.user.role == 'superadmin':
            return Response(
                {'message': 'Super admin has no subscription to cancel'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        try:
            subscription = Subscription.objects.get(user=request.user)
        except Subscription.DoesNotExist:
            return Response(
                {'message': 'You do not have a subscription'},
                status=status.HTTP_404_NOT_FOUND,
            )
        
        if subscription.status == 'cancelled':
            return Response(
                {'message': 'Subscription is already cancelled'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        subscription.status = 'cancelled'
        subscription.save()
        
        serializer = SubscriptionDetailSerializer(subscription)
        return Response(
            {
                'message': 'Your subscription has been cancelled. '
                           'You retain access until the end of the current billing period.',
                'data': serializer.data,
            }
        )
    
    @action(detail=False, methods=['get'], url_path='check')
    def check_subscription(self, request):
        """
        Quick access check used by frontend guards.

        Superadmin -> always has access, flagged accordingly.
        Admin / employee -> has access iff their subscription is active.
        """
        user = request.user
        
        if user.role == 'superadmin':
            return Response(
                {
                    'has_access': True,
                    'is_superadmin': True,
                    'is_admin': True,   # kept for backward-compat with old UI
                    'role': 'superadmin',
                }
            )
        
        try:
            subscription = Subscription.objects.get(user=user)
            subscription.check_expired()
            return Response(
                {
                    'has_access': subscription.is_active,
                    'is_superadmin': False,
                    'is_admin': user.role == 'admin',
                    'role': user.role,
                    'plan_name': subscription.plan.name if subscription.is_active else None,
                    'days_remaining': subscription.days_remaining if subscription.is_active else 0,
                    'status': subscription.status,
                }
            )
        except Subscription.DoesNotExist:
            return Response(
                {
                    'has_access': False,
                    'is_superadmin': False,
                    'is_admin': user.role == 'admin',
                    'role': user.role,
                }
            )


# ---------------------------------------------------------------------------
# Payments (read-only history)
# ---------------------------------------------------------------------------

class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    """Payments (read-only)."""
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        # Only superadmin sees all payments globally.
        if user.role == 'superadmin':
            return Payment.objects.select_related('user', 'plan').all()
        return Payment.objects.filter(user=user).select_related('plan')
    
    @action(detail=False, methods=['get'], url_path='my-payments')
    def my_payments(self, request):
        """Get current user's payment history (any role)."""
        payments = Payment.objects.filter(user=request.user).order_by('-created_at')
        serializer = self.get_serializer(payments, many=True)
        return Response({'count': payments.count(), 'data': serializer.data})


# ---------------------------------------------------------------------------
# Initiate Khalti payment (admin + employee only; superadmin has no use)
# ---------------------------------------------------------------------------

class InitiatePaymentView(APIView):
    """Initiate Khalti payment."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        # Superadmin doesn't subscribe.
        if request.user.role == 'superadmin':
            return Response(
                {
                    'success': False,
                    'message': 'Super admin does not require a subscription',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        serializer = InitiatePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        plan_id = serializer.validated_data['plan_id']
        plan = SubscriptionPlan.objects.get(id=plan_id)
        
        # Block re-subscribing while an active one exists.
        existing_sub = Subscription.objects.filter(
            user=request.user,
            status='active',
            end_date__gte=timezone.now().date(),
        ).first()
        
        if existing_sub:
            return Response(
                {
                    'success': False,
                    'message': 'You already have an active subscription',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        # Generate unique order ID
        order_id = f"ORDER_{request.user.id}_{int(timezone.now().timestamp())}_{uuid.uuid4().hex[:8]}"
        
        # Amount in paisa (multiply by 100)
        amount_in_paisa = int(plan.price * 100)
        
        # Minimum amount check (Rs. 10 = 1000 paisa)
        if amount_in_paisa < 1000:
            return Response(
                {'success': False, 'message': 'Amount should be greater than Rs. 10'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        return_url = request.build_absolute_uri('/api/billing/verify-payment/')
        website_url = request.build_absolute_uri('/')
        
        payload = {
            'return_url': return_url,
            'website_url': website_url,
            'amount': str(amount_in_paisa),
            'purchase_order_id': order_id,
            'purchase_order_name': plan.name,
            'customer_info': {
                'name': request.user.full_name or 'Customer',
                'email': request.user.email or 'test@test.com',
                'phone': request.user.phone or '9800000001',
            },
            'amount_breakdown': [{'label': 'Plan Price', 'amount': amount_in_paisa}],
            'product_details': [
                {
                    'identity': str(plan.id),
                    'name': plan.name,
                    'total_price': amount_in_paisa,
                    'quantity': 1,
                    'unit_price': amount_in_paisa,
                }
            ],
            'merchant_username': request.user.username,
            'merchant_extra': json.dumps(
                {
                    'plan_id': plan.id,
                    'user_id': request.user.id,
                    'order_id': order_id,
                    'plan_name': plan.name,
                    'amount': amount_in_paisa,
                }
            ),
        }
        
        headers = {
            'Authorization': f'Key {KHALTI_SECRET_KEY}',
            'Content-Type': 'application/json',
        }
        
        try:
            response = requests.post(KHALTI_API_URL, json=payload, headers=headers, timeout=30)
            response_data = response.json()
            
            if response.status_code == 200 and 'payment_url' in response_data:
                Payment.objects.create(
                    user=request.user,
                    plan=plan,
                    amount=plan.price,
                    status='pending',
                    khalti_pidx=response_data.get('pidx'),
                    purchase_order_id=order_id,
                    description=f'Payment for {plan.name}',
                )
                
                return Response(
                    {
                        'success': True,
                        'payment_url': response_data['payment_url'],
                        'pidx': response_data.get('pidx'),
                        'expires_at': response_data.get('expires_at'),
                        'expires_in': response_data.get('expires_in'),
                    }
                )
            
            error_message = response_data.get('detail', 'Payment initiation failed')
            return Response(
                {'success': False, 'message': error_message},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except requests.exceptions.RequestException:
            return Response(
                {'success': False, 'message': 'Failed to connect to payment service'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )


# ---------------------------------------------------------------------------
# Verify Khalti payment (public callback)
# ---------------------------------------------------------------------------

@api_view(['GET'])
@permission_classes([AllowAny])
def verify_payment(request):
    """Verify Khalti payment callback."""
    
    pidx = request.GET.get('pidx')
    # (other params currently unused but kept in case of future need)
    
    frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
    
    if not pidx:
        return redirect(f'{frontend_url}/billing?payment_status=error&error=Missing payment ID')
    
    headers = {
        'Authorization': f'Key {KHALTI_SECRET_KEY}',
        'Content-Type': 'application/json',
    }
    
    try:
        response = requests.post(
            KHALTI_LOOKUP_URL,
            json={'pidx': pidx},
            headers=headers,
            timeout=30,
        )
        lookup_data = response.json()
        
        if response.status_code != 200:
            return redirect(f'{frontend_url}/billing?payment_status=error&error=Verification failed')
        
        khalti_status = lookup_data.get('status')
        payment = Payment.objects.filter(khalti_pidx=pidx).first()
        
        if not payment:
            return redirect(f'{frontend_url}/billing?payment_status=error&error=Payment not found')
        
        if khalti_status == 'Completed':
            payment.status = 'completed'
            payment.khalti_transaction_id = lookup_data.get('transaction_id')
            payment.save()
            
            subscription, _created = Subscription.objects.update_or_create(
                user=payment.user,
                defaults={
                    'plan': payment.plan,
                    'status': 'active',
                    'start_date': timezone.now().date(),
                    'end_date': timezone.now().date() + timedelta(days=30),
                },
            )
            
            # Notify all superadmins (product owners) of the new subscription.
            try:
                from apps.notifications.models import Notification
                from apps.accounts.models import User
                for sa in User.objects.filter(role='superadmin'):
                    Notification.objects.create(
                        user=sa,
                        type='subscription',
                        title='New Subscription',
                        message=(
                            f'{payment.user.full_name} subscribed to '
                            f'{payment.plan.name} for Rs. {payment.amount}'
                        ),
                    )
            except Exception:
                pass
            
            return redirect(f'{frontend_url}/notes?payment_status=success')
        
        if khalti_status == 'Pending':
            return redirect(f'{frontend_url}/billing?payment_status=pending')
        
        if khalti_status == 'Expired':
            payment.status = 'expired'
            payment.save()
            return redirect(f'{frontend_url}/billing?payment_status=expired')
        
        if khalti_status == 'User canceled':
            payment.status = 'cancelled'
            payment.save()
            return redirect(f'{frontend_url}/billing?payment_status=cancelled')
        
        if khalti_status == 'Refunded':
            payment.status = 'refunded'
            payment.save()
            return redirect(f'{frontend_url}/billing?payment_status=refunded')
        
        payment.status = 'failed'
        payment.failure_reason = f'Unknown status: {khalti_status}'
        payment.save()
        return redirect(f'{frontend_url}/billing?payment_status=error&error={khalti_status}')
    
    except requests.exceptions.RequestException:
        return redirect(f'{frontend_url}/billing?payment_status=error&error=Verification failed')
