"""
Payment and Subscription models.
"""
from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta


class SubscriptionPlan(models.Model):
    """Subscription plan model."""
    
    class PlanType(models.TextChoices):
        FREE = 'free', 'Free'
        BASIC = 'basic', 'Basic'
        PRO = 'pro', 'Pro'
        ENTERPRISE = 'enterprise', 'Enterprise'
    
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    plan_type = models.CharField(
        max_length=20,
        choices=PlanType.choices,
        unique=True
    )
    description = models.TextField(blank=True, null=True)
    price_monthly = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    price_yearly = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Plan limits
    max_users = models.IntegerField(default=5)
    max_projects = models.IntegerField(default=3)
    max_tasks_per_project = models.IntegerField(default=50)
    max_storage_mb = models.IntegerField(default=100)
    
    # Features
    has_priority_support = models.BooleanField(default=False)
    has_advanced_analytics = models.BooleanField(default=False)
    has_custom_branding = models.BooleanField(default=False)
    has_api_access = models.BooleanField(default=False)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'subscription_plans'
        ordering = ['price_monthly']
    
    def __str__(self):
        return f"{self.name} (${self.price_monthly}/mo)"


class Subscription(models.Model):
    """User subscription model."""
    
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        CANCELLED = 'cancelled', 'Cancelled'
        EXPIRED = 'expired', 'Expired'
        TRIAL = 'trial', 'Trial'
        PAST_DUE = 'past_due', 'Past Due'
    
    class BillingCycle(models.TextChoices):
        MONTHLY = 'monthly', 'Monthly'
        YEARLY = 'yearly', 'Yearly'
    
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
        default=Status.TRIAL
    )
    billing_cycle = models.CharField(
        max_length=20,
        choices=BillingCycle.choices,
        default=BillingCycle.MONTHLY
    )
    
    # Dates
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField(null=True, blank=True)
    trial_end_date = models.DateTimeField(null=True, blank=True)
    next_billing_date = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    
    # Payment gateway info
    stripe_customer_id = models.CharField(max_length=255, blank=True, null=True)
    stripe_subscription_id = models.CharField(max_length=255, blank=True, null=True)
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'subscriptions'
    
    def __str__(self):
        return f"{self.user.username} - {self.plan.name}"
    
    @property
    def is_active(self):
        if self.status == self.Status.ACTIVE:
            return True
        if self.status == self.Status.TRIAL and self.trial_end_date:
            return timezone.now() < self.trial_end_date
        return False
    
    @property
    def days_remaining(self):
        if self.status == self.Status.TRIAL and self.trial_end_date:
            delta = self.trial_end_date - timezone.now()
            return max(0, delta.days)
        if self.end_date:
            delta = self.end_date - timezone.now()
            return max(0, delta.days)
        return None
    
    def start_trial(self, days=14):
        """Start a trial period."""
        self.status = self.Status.TRIAL
        self.trial_end_date = timezone.now() + timedelta(days=days)
        self.save()
    
    def activate(self):
        """Activate subscription."""
        self.status = self.Status.ACTIVE
        self.start_date = timezone.now()
        if self.billing_cycle == self.BillingCycle.MONTHLY:
            self.next_billing_date = timezone.now() + timedelta(days=30)
        else:
            self.next_billing_date = timezone.now() + timedelta(days=365)
        self.save()
    
    def cancel(self):
        """Cancel subscription."""
        self.status = self.Status.CANCELLED
        self.cancelled_at = timezone.now()
        self.save()


class Payment(models.Model):
    """Payment transaction model."""
    
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        COMPLETED = 'completed', 'Completed'
        FAILED = 'failed', 'Failed'
        REFUNDED = 'refunded', 'Refunded'
    
    class PaymentMethod(models.TextChoices):
        CARD = 'card', 'Credit/Debit Card'
        BANK_TRANSFER = 'bank_transfer', 'Bank Transfer'
        UPI = 'upi', 'UPI'
        WALLET = 'wallet', 'Digital Wallet'
    
    id = models.AutoField(primary_key=True)
    subscription = models.ForeignKey(
        Subscription,
        on_delete=models.CASCADE,
        related_name='payments'
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
        default=PaymentMethod.CARD
    )
    
    # Payment gateway info
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True, null=True)
    stripe_invoice_id = models.CharField(max_length=255, blank=True, null=True)
    
    # Transaction details
    description = models.TextField(blank=True, null=True)
    receipt_url = models.URLField(blank=True, null=True)
    failure_reason = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'payments'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Payment #{self.id} - {self.amount} {self.currency}"


class Invoice(models.Model):
    """Invoice model."""
    
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        SENT = 'sent', 'Sent'
        PAID = 'paid', 'Paid'
        OVERDUE = 'overdue', 'Overdue'
        CANCELLED = 'cancelled', 'Cancelled'
    
    id = models.AutoField(primary_key=True)
    subscription = models.ForeignKey(
        Subscription,
        on_delete=models.CASCADE,
        related_name='invoices'
    )
    invoice_number = models.CharField(max_length=50, unique=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT
    )
    
    # Dates
    issue_date = models.DateField(default=timezone.now)
    due_date = models.DateField()
    paid_date = models.DateField(null=True, blank=True)
    
    # Details
    description = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'invoices'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Invoice {self.invoice_number}"
    
    def save(self, *args, **kwargs):
        if not self.invoice_number:
            # Generate invoice number
            last_invoice = Invoice.objects.order_by('-id').first()
            next_num = (last_invoice.id + 1) if last_invoice else 1
            self.invoice_number = f"INV-{timezone.now().year}-{next_num:05d}"
        if not self.total_amount:
            self.total_amount = self.amount + self.tax_amount
        super().save(*args, **kwargs)
