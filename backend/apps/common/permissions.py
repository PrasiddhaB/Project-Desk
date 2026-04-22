"""
Shared permissions for the application.
"""
from rest_framework import permissions


class IsAuthenticatedAndActive(permissions.BasePermission):
    """
    Permission to check if user is authenticated and active.
    """
    message = 'Authentication required.'
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.is_active
        )


class IsAdminUser(permissions.BasePermission):
    """
    Permission to only allow admin users.
    """
    message = 'Admin privileges required.'
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ('admin', 'superadmin')
        )


class ReadOnly(permissions.BasePermission):
    """
    Permission to only allow read operations.
    """
    
    def has_permission(self, request, view):
        return request.method in permissions.SAFE_METHODS
