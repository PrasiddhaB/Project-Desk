"""
Custom permissions for accounts app.

Role hierarchy:
    superadmin > admin > employee

Permission classes:
    IsSuperAdmin        - only superadmin (product owner)
    IsAdmin             - admin OR superadmin (elevated access). This is
                          the common "back-office" gate used across the app.
                          It exists with this name so that all the existing
                          `request.user.role == 'admin'` checks map cleanly
                          to the same semantics after the role split.
    IsManagerOnly       - only the middle admin role (not superadmin).
                          Rarely needed.
    IsEmployee          - only employee.
    IsOwnerOrAdmin      - owner of the object OR any admin/superadmin.
"""
from rest_framework import permissions


class IsSuperAdmin(permissions.BasePermission):
    """Only superadmin (product owner) passes."""
    message = 'Super admin access required.'
    
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'superadmin'
        )


class IsAdmin(permissions.BasePermission):
    """
    Admin OR superadmin passes. This is what the old `admin` role used
    to protect, so reusing this name keeps existing call sites correct.
    """
    message = 'Admin access required.'
    
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ('admin', 'superadmin')
        )


class IsManagerOnly(permissions.BasePermission):
    """Only the middle admin role (company lead). Superadmin does NOT pass."""
    message = 'Manager access required.'
    
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'admin'
        )


class IsEmployee(permissions.BasePermission):
    """Only employees pass."""
    message = 'Employee access required.'
    
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'employee'
        )


class IsOwnerOrAdmin(permissions.BasePermission):
    """Object owner OR any admin/superadmin passes."""
    message = 'You do not have permission to perform this action.'
    
    def has_object_permission(self, request, view, obj):
        # Admins (includes superadmin) can access anything
        if request.user.role in ('admin', 'superadmin'):
            return True
        
        # Check if the object has a user field
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        # Check if the object has a user_id field
        if hasattr(obj, 'user_id'):
            return obj.user_id == request.user.id
        
        # Check if the object is the user themselves
        return obj == request.user
