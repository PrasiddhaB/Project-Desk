"""
Notes permissions with subscription check.

Access rules:
    superadmin - always has access (no subscription ever needed)
    admin      - needs an active subscription (same as employee)
    employee   - needs an active subscription
"""
from rest_framework import permissions
from apps.payments.models import Subscription


class HasActiveSubscription(permissions.BasePermission):
    """
    Allow access if user has an active subscription.

    Only superadmin bypasses entirely. Admin and employee alike must
    have an active subscription - this is the key behavior change
    requested: the middle 'admin' role now has to subscribe too.
    """
    message = 'You need an active subscription to access notes.'
    
    def has_permission(self, request, view):
        user = request.user
        
        # Superadmin (product owner) always passes.
        if user.role == 'superadmin':
            return True
        
        # Admin and employee must have an active subscription.
        try:
            subscription = Subscription.objects.get(user=user)
            subscription.check_expired()  # Update status if expired
            return subscription.is_active
        except Subscription.DoesNotExist:
            return False


def check_note_limit(user, is_private=False):
    """
    Check if user can create more notes based on plan limits.
    Returns (can_create, message).

    Superadmin has no limits. Admin and employee are bound by their plan.
    """
    from apps.notes.models import Note
    
    # Superadmin has no limits.
    if user.role == 'superadmin':
        return True, None
    
    # Admin and employee alike: check subscription plan limits.
    try:
        subscription = Subscription.objects.select_related('plan').get(user=user)
        if not subscription.is_active:
            return False, 'Your subscription has expired'
        
        plan = subscription.plan
        
        # Unlimited plan
        if plan.is_unlimited:
            return True, None
        
        # Check limits
        if is_private:
            if plan.private_note_limit is None:
                return True, None
            current_count = Note.objects.filter(user=user, is_private=True).count()
            if current_count >= plan.private_note_limit:
                return False, (
                    f'Private note limit reached ({plan.private_note_limit}). '
                    f'Upgrade your plan for more.'
                )
        else:
            if plan.note_limit is None:
                return True, None
            current_count = Note.objects.filter(user=user, is_private=False).count()
            if current_count >= plan.note_limit:
                return False, (
                    f'Note limit reached ({plan.note_limit}). '
                    f'Upgrade your plan for more.'
                )
        
        return True, None
        
    except Subscription.DoesNotExist:
        return False, 'No active subscription'
