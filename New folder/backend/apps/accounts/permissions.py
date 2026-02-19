"""
Custom permissions for accounts app.
"""
from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """
    Custom permission to only allow admin users.
    """
    message = 'Admin access required.'
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'admin'
        )


class IsEmployee(permissions.BasePermission):
    """
    Custom permission to only allow employee users.
    """
    message = 'Employee access required.'
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'employee'
        )


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission to allow owners or admins.
    """
    message = 'You do not have permission to perform this action.'
    
    def has_object_permission(self, request, view, obj):
        # Admin can access anything
        if request.user.role == 'admin':
            return True
        
        # Check if the object has a user field
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        # Check if the object has a user_id field
        if hasattr(obj, 'user_id'):
            return obj.user_id == request.user.id
        
        # Check if the object is the user themselves
        return obj == request.user
