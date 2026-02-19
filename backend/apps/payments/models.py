"""
Payment and Subscription models.
"""
from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta


class SubscriptionPlan(models.Model):
    """Subscription plan model."""
    
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # Price in NPR
    
    # Note limits
    note_limit = models.IntegerField(null=True, blank=True)  # NULL = unlimited
    private_note_limit = models.IntegerField(null=True, blank=True)  # NULL = unlimited
    is_unlimited = models.BooleanField(default=False)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'subscription_plans'
        ordering = ['price']
    
    def __str__(self):
        return f"{self.name} (Rs. {self.price})"


class Subscription(models.Model):
    """User subscription model."""
    
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        EXPIRED = 'expired', 'Expired'
        CANCELLED = 'cancelled', 'Cancelled'
    
    id = models.AutoField(primary_key=True)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='subscription'
    )
    plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.PROTECT,
        related_name='subscriptions'
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE
    )
    
    # Dates
    start_date = models.DateField(default=timezone.now)
    end_date = models.DateField()
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'subscriptions'
    
    def __str__(self):
        return f"{self.user.username} - {self.plan.name}"
    
    @property
    def is_active(self):
        if self.status != self.Status.ACTIVE:
            return False
        return self.end_date >= timezone.now().date()
    
    @property
    def days_remaining(self):
        if not self.is_active:
            return 0
        delta = self.end_date - timezone.now().date()
        return max(0, delta.days)
    
    def activate(self, days=30):
        """Activate subscription for given days."""
        self.status = self.Status.ACTIVE
        self.start_date = timezone.now().date()
        self.end_date = timezone.now().date() + timedelta(days=days)
        self.save()
    
    def cancel(self):
        """Cancel subscription."""
        self.status = self.Status.CANCELLED
        self.save()
    
    def check_expired(self):
        """Check and update if subscription has expired."""
        if self.status == self.Status.ACTIVE and self.end_date < timezone.now().date():
            self.status = self.Status.EXPIRED
            self.save()
            return True
        return False


class Payment(models.Model):
    """Payment transaction model."""
    
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        COMPLETED = 'completed', 'Completed'
        FAILED = 'failed', 'Failed'
        REFUNDED = 'refunded', 'Refunded'
        EXPIRED = 'expired', 'Expired'
        CANCELLED = 'cancelled', 'Cancelled'
    
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='payments'
    )
    plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.PROTECT,
        related_name='payments'
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)  # Amount in NPR
    currency = models.CharField(max_length=3, default='NPR')
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
    
    # Khalti payment info
    khalti_pidx = models.CharField(max_length=255, blank=True, null=True)
    khalti_transaction_id = models.CharField(max_length=255, blank=True, null=True)
    purchase_order_id = models.CharField(max_length=255, blank=True, null=True)
    
    # Transaction details
    description = models.TextField(blank=True, null=True)
    failure_reason = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'payments'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Payment #{self.id} - Rs. {self.amount}"
