"""
URL configuration for Payments app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.payments.views import (
    SubscriptionPlanViewSet,
    SubscriptionViewSet,
    PaymentViewSet,
    InvoiceViewSet,
)

router = DefaultRouter()
router.register(r'plans', SubscriptionPlanViewSet, basename='plans')
router.register(r'subscriptions', SubscriptionViewSet, basename='subscriptions')
router.register(r'payments', PaymentViewSet, basename='payments')
router.register(r'invoices', InvoiceViewSet, basename='invoices')

urlpatterns = [
    path('', include(router.urls)),
]
