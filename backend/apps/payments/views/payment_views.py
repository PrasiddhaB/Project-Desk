"""
Payment API views with Khalti integration.
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


# Khalti API Configuration
# In production, set KHALTI_SECRET_KEY and KHALTI_ENV in your .env file
KHALTI_SECRET_KEY = getattr(settings, 'KHALTI_SECRET_KEY', None) or os.environ.get('KHALTI_SECRET_KEY', '5bf2afad915247d1a28055fb7aaee102')
KHALTI_ENV = getattr(settings, 'KHALTI_ENV', None) or os.environ.get('KHALTI_ENV', 'dev')

# Use test or live URLs based on environment
if KHALTI_ENV == 'live':
    KHALTI_API_URL = 'https://khalti.com/api/v2/epayment/initiate/'
    KHALTI_LOOKUP_URL = 'https://khalti.com/api/v2/epayment/lookup/'
else:
    KHALTI_API_URL = 'https://dev.khalti.com/api/v2/epayment/initiate/'
    KHALTI_LOOKUP_URL = 'https://dev.khalti.com/api/v2/epayment/lookup/'


class SubscriptionPlanViewSet(viewsets.ModelViewSet):
    """ViewSet for subscription plans."""
    queryset = SubscriptionPlan.objects.filter(is_active=True)
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        # Regular users see only active plans
        if self.request.user.is_authenticated and self.request.user.role == 'admin':
            return SubscriptionPlan.objects.all()
        return SubscriptionPlan.objects.filter(is_active=True)
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [AllowAny()]
    
    def create(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            return Response({
                'message': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            return Response({
                'message': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            return Response({
                'message': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


class SubscriptionViewSet(viewsets.ModelViewSet):
    """ViewSet for user subscriptions."""
    permission_classes = [IsAuthenticated]
    serializer_class = SubscriptionSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Subscription.objects.select_related('plan', 'user').all()
        return Subscription.objects.filter(user=user).select_related('plan')
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [IsAuthenticated()]
    
    def create(self, request, *args, **kwargs):
        """Admin can create subscription for any user."""
        if request.user.role != 'admin':
            return Response({
                'message': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)
        
        user_id = request.data.get('user_id')
        plan_id = request.data.get('plan_id')
        days = request.data.get('days', 30)
        
        if not user_id or not plan_id:
            return Response({
                'message': 'user_id and plan_id required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        from apps.accounts.models import User
        try:
            user = User.objects.get(id=user_id)
            plan = SubscriptionPlan.objects.get(id=plan_id)
        except (User.DoesNotExist, SubscriptionPlan.DoesNotExist):
            return Response({
                'message': 'User or Plan not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        subscription, created = Subscription.objects.update_or_create(
            user=user,
            defaults={
                'plan': plan,
                'status': 'active',
                'start_date': timezone.now().date(),
                'end_date': timezone.now().date() + timedelta(days=days)
            }
        )
        
        serializer = SubscriptionDetailSerializer(subscription)
        return Response({
            'message': 'Subscription created' if created else 'Subscription updated',
            'data': serializer.data
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
    
    def update(self, request, *args, **kwargs):
        """Admin can update subscription."""
        if request.user.role != 'admin':
            return Response({
                'message': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)
        
        instance = self.get_object()
        data = request.data
        
        if 'plan_id' in data:
            try:
                instance.plan = SubscriptionPlan.objects.get(id=data['plan_id'])
            except SubscriptionPlan.DoesNotExist:
                return Response({'message': 'Plan not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if 'status' in data:
            instance.status = data['status']
        
        if 'end_date' in data:
            instance.end_date = data['end_date']
        
        instance.save()
        
        serializer = SubscriptionDetailSerializer(instance)
        return Response({
            'message': 'Subscription updated',
            'data': serializer.data
        })
    
    def destroy(self, request, *args, **kwargs):
        """Admin can cancel subscription."""
        if request.user.role != 'admin':
            return Response({
                'message': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)
        
        instance = self.get_object()
        instance.status = 'cancelled'
        instance.save()
        
        return Response({
            'message': 'Subscription cancelled'
        })
    
    @action(detail=False, methods=['get'], url_path='my-subscription')
    def my_subscription(self, request):
        """Get current user's active subscription."""
        try:
            subscription = Subscription.objects.select_related('plan').get(
                user=request.user,
                status='active'
            )
            # Check if expired
            subscription.check_expired()
            
            if subscription.is_active:
                serializer = SubscriptionDetailSerializer(subscription)
                return Response({
                    'has_subscription': True,
                    'data': serializer.data
                })
            else:
                return Response({
                    'has_subscription': False,
                    'message': 'Subscription expired',
                    'data': None
                })
        except Subscription.DoesNotExist:
            return Response({
                'has_subscription': False,
                'message': 'No active subscription',
                'data': None
            })
    
    @action(detail=False, methods=['get'], url_path='check')
    def check_subscription(self, request):
        """Quick check if user has active subscription (for frontend guards)."""
        # Admin always has access
        if request.user.role == 'admin':
            return Response({
                'has_access': True,
                'is_admin': True
            })
        
        try:
            subscription = Subscription.objects.get(user=request.user, status='active')
            subscription.check_expired()
            
            return Response({
                'has_access': subscription.is_active,
                'is_admin': False,
                'plan_name': subscription.plan.name if subscription.is_active else None,
                'days_remaining': subscription.days_remaining if subscription.is_active else 0
            })
        except Subscription.DoesNotExist:
            return Response({
                'has_access': False,
                'is_admin': False
            })


class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for payments."""
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Payment.objects.select_related('user', 'plan').all()
        return Payment.objects.filter(user=user).select_related('plan')
    
    @action(detail=False, methods=['get'], url_path='my-payments')
    def my_payments(self, request):
        """Get current user's payment history."""
        payments = Payment.objects.filter(user=request.user).order_by('-created_at')
        serializer = self.get_serializer(payments, many=True)
        return Response({
            'count': payments.count(),
            'data': serializer.data
        })


class InitiatePaymentView(APIView):
    """Initiate Khalti payment."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = InitiatePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        plan_id = serializer.validated_data['plan_id']
        plan = SubscriptionPlan.objects.get(id=plan_id)
        
        # Check if user already has active subscription
        existing_sub = Subscription.objects.filter(
            user=request.user,
            status='active',
            end_date__gte=timezone.now().date()
        ).first()
        
        if existing_sub:
            return Response({
                'success': False,
                'message': 'You already have an active subscription'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate unique order ID
        order_id = f"ORDER_{request.user.id}_{int(timezone.now().timestamp())}_{uuid.uuid4().hex[:8]}"
        
        # Amount in paisa (multiply by 100)
        amount_in_paisa = int(plan.price * 100)
        
        # Minimum amount check (Rs. 10 = 1000 paisa)
        if amount_in_paisa < 1000:
            return Response({
                'success': False,
                'message': 'Amount should be greater than Rs. 10'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Construct return URL
        # In production, use your actual domain
        return_url = request.build_absolute_uri('/api/billing/verify-payment/')
        website_url = request.build_absolute_uri('/')
        
        # Prepare Khalti payload
        payload = {
            'return_url': return_url,
            'website_url': website_url,
            'amount': str(amount_in_paisa),
            'purchase_order_id': order_id,
            'purchase_order_name': plan.name,
            'customer_info': {
                'name': request.user.full_name or 'Customer',
                'email': request.user.email or 'test@test.com',
                'phone': request.user.phone or '9800000001'
            },
            'amount_breakdown': [
                {
                    'label': 'Plan Price',
                    'amount': amount_in_paisa
                }
            ],
            'product_details': [
                {
                    'identity': str(plan.id),
                    'name': plan.name,
                    'total_price': amount_in_paisa,
                    'quantity': 1,
                    'unit_price': amount_in_paisa
                }
            ],
            'merchant_username': request.user.username,
            'merchant_extra': json.dumps({
                'plan_id': plan.id,
                'user_id': request.user.id,
                'order_id': order_id,
                'plan_name': plan.name,
                'amount': amount_in_paisa
            })
        }
        
        # Call Khalti API
        headers = {
            'Authorization': f'Key {KHALTI_SECRET_KEY}',
            'Content-Type': 'application/json'
        }
        
        try:
            response = requests.post(
                KHALTI_API_URL,
                json=payload,
                headers=headers,
                timeout=30
            )
            
            response_data = response.json()
            
            if response.status_code == 200 and 'payment_url' in response_data:
                # Create pending payment record
                Payment.objects.create(
                    user=request.user,
                    plan=plan,
                    amount=plan.price,
                    status='pending',
                    khalti_pidx=response_data.get('pidx'),
                    purchase_order_id=order_id,
                    description=f'Payment for {plan.name}'
                )
                
                return Response({
                    'success': True,
                    'payment_url': response_data['payment_url'],
                    'pidx': response_data.get('pidx'),
                    'expires_at': response_data.get('expires_at'),
                    'expires_in': response_data.get('expires_in')
                })
            else:
                error_message = response_data.get('detail', 'Payment initiation failed')
                return Response({
                    'success': False,
                    'message': error_message
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except requests.exceptions.RequestException as e:
            return Response({
                'success': False,
                'message': 'Failed to connect to payment service'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)


@api_view(['GET'])
@permission_classes([AllowAny])
def verify_payment(request):
    """Verify Khalti payment callback."""
    
    pidx = request.GET.get('pidx')
    transaction_id = request.GET.get('transaction_id')
    amount = request.GET.get('amount')
    payment_status = request.GET.get('status')
    purchase_order_id = request.GET.get('purchase_order_id')
    merchant_extra = request.GET.get('merchant_extra')
    
    # Frontend URL for redirects - use environment variable
    frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
    
    if not pidx:
        return redirect(f'{frontend_url}/billing?payment_status=error&error=Missing payment ID')
    
    # Verify with Khalti lookup API
    headers = {
        'Authorization': f'Key {KHALTI_SECRET_KEY}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.post(
            KHALTI_LOOKUP_URL,
            json={'pidx': pidx},
            headers=headers,
            timeout=30
        )
        
        lookup_data = response.json()
        
        if response.status_code != 200:
            return redirect(f'{frontend_url}/billing?payment_status=error&error=Verification failed')
        
        khalti_status = lookup_data.get('status')
        
        # Find the payment record
        payment = Payment.objects.filter(khalti_pidx=pidx).first()
        
        if not payment:
            return redirect(f'{frontend_url}/billing?payment_status=error&error=Payment not found')
        
        if khalti_status == 'Completed':
            # Update payment status
            payment.status = 'completed'
            payment.khalti_transaction_id = lookup_data.get('transaction_id')
            payment.save()
            
            # Create or update subscription
            subscription, created = Subscription.objects.update_or_create(
                user=payment.user,
                defaults={
                    'plan': payment.plan,
                    'status': 'active',
                    'start_date': timezone.now().date(),
                    'end_date': timezone.now().date() + timedelta(days=30)
                }
            )
            
            # Create notification for admins (optional)
            from apps.notifications.models import Notification
            from apps.accounts.models import User
            
            admins = User.objects.filter(role='admin')
            for admin in admins:
                Notification.objects.create(
                    user=admin,
                    type='subscription',
                    title='New Subscription',
                    message=f'{payment.user.full_name} subscribed to {payment.plan.name} for Rs. {payment.amount}'
                )
            
            return redirect(f'{frontend_url}/notes?payment_status=success')
        
        elif khalti_status == 'Pending':
            return redirect(f'{frontend_url}/billing?payment_status=pending')
        
        elif khalti_status == 'Expired':
            payment.status = 'expired'
            payment.save()
            return redirect(f'{frontend_url}/billing?payment_status=expired')
        
        elif khalti_status == 'User canceled':
            payment.status = 'cancelled'
            payment.save()
            return redirect(f'{frontend_url}/billing?payment_status=cancelled')
        
        elif khalti_status == 'Refunded':
            payment.status = 'refunded'
            payment.save()
            return redirect(f'{frontend_url}/billing?payment_status=refunded')
        
        else:
            payment.status = 'failed'
            payment.failure_reason = f'Unknown status: {khalti_status}'
            payment.save()
            return redirect(f'{frontend_url}/billing?payment_status=error&error={khalti_status}')
            
    except requests.exceptions.RequestException as e:
        return redirect(f'{frontend_url}/billing?payment_status=error&error=Verification failed')
