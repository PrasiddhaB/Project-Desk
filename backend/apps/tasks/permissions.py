"""
Task permissions for API endpoints.
"""
from rest_framework import permissions


class IsAdminUser(permissions.BasePermission):
    """
    Permission check for admin users.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'admin'
        )


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Admin can do anything. Others can only read.
    """
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'admin'
        )


class IsTaskAssigneeOrAdmin(permissions.BasePermission):
    """
    Permission for task operations.
    - Admin: Full access
    - Employee: Can only update status of tasks assigned to them
    """
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Admin has full access
        if request.user.role == 'admin':
            return True
        
        # For safe methods, check if user is assigned
        if request.method in permissions.SAFE_METHODS:
            return request.user in obj.assigned_to.all()
        
        # For status update, employee can update if assigned
        if view.action == 'update_status':
            return request.user in obj.assigned_to.all()
        
        # Employees cannot edit/delete tasks
        return False


class CanViewTask(permissions.BasePermission):
    """
    Permission to view tasks.
    - Admin: Can view all tasks
    - Employee: Can only view tasks assigned to them
    """
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True
        return request.user in obj.assigned_to.all()
