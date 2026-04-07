"""
Custom middleware for Project Desk.
"""
from django.utils import timezone


class OnlineStatusMiddleware:
    """Update user's last_active timestamp on every authenticated request."""
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        
        # Update last_active for authenticated users
        if hasattr(request, 'user') and request.user.is_authenticated:
            # Only update every 60 seconds to avoid excessive DB writes
            user = request.user
            now = timezone.now()
            
            if not user.last_active or (now - user.last_active).total_seconds() > 60:
                # Use update() to avoid triggering save signals
                from apps.accounts.models import User
                User.objects.filter(pk=user.pk).update(last_active=now)
        
        return response
