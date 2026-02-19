"""
URL configuration for Payments app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.payments.views import (
    SubscriptionPlanViewSet,
    SubscriptionViewSet,
    PaymentViewSet,
    InitiatePaymentView,
    verify_payment,
)

router = DefaultRouter()
router.register(r'plans', SubscriptionPlanViewSet, basename='plans')
router.register(r'subscriptions', SubscriptionViewSet, basename='subscriptions')
router.register(r'payments', PaymentViewSet, basename='payments')

urlpatterns = [
    path('', include(router.urls)),
    path('initiate-payment/', InitiatePaymentView.as_view(), name='initiate-payment'),
    path('verify-payment/', verify_payment, name='verify-payment'),
]
