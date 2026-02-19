"""
Notes permissions with subscription check.
"""
from rest_framework import permissions
from apps.payments.models import Subscription


class HasActiveSubscription(permissions.BasePermission):
    """
    Permission check for active subscription.
    Admins always have access.
    Employees need active subscription.
    """
    message = 'You need an active subscription to access notes.'
    
    def has_permission(self, request, view):
        user = request.user
        
        # Admin always has access
        if user.role == 'admin':
            return True
        
        # Check for active subscription
        try:
            subscription = Subscription.objects.get(user=user)
            subscription.check_expired()  # Update status if expired
            return subscription.is_active
        except Subscription.DoesNotExist:
            return False


def check_note_limit(user, is_private=False):
    """
    Check if user can create more notes based on plan limits.
    Returns (can_create, message)
    """
    from apps.notes.models import Note
    
    # Admin has no limits
    if user.role == 'admin':
        return True, None
    
    # Get subscription
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
                return True, None  # No limit set
            current_count = Note.objects.filter(user=user, is_private=True).count()
            if current_count >= plan.private_note_limit:
                return False, f'Private note limit reached ({plan.private_note_limit}). Upgrade your plan for more.'
        else:
            if plan.note_limit is None:
                return True, None  # No limit set
            current_count = Note.objects.filter(user=user, is_private=False).count()
            if current_count >= plan.note_limit:
                return False, f'Note limit reached ({plan.note_limit}). Upgrade your plan for more.'
        
        return True, None
        
    except Subscription.DoesNotExist:
        return False, 'No active subscription'
