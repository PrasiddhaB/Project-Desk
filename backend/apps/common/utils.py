"""
Common utility functions.
"""
from rest_framework.response import Response
from rest_framework import status


def log_activity(user, action, description, target_type=None, target_id=None, metadata=None):
    """
    Safely create an activity log entry. Never raises - if logging
    fails, we don't want it to break the actual user request.
    """
    try:
        from apps.common.models import ActivityLog
        ActivityLog.objects.create(
            user=user,
            action=action,
            description=description,
            target_type=target_type,
            target_id=target_id,
            metadata=metadata,
        )
    except Exception:
        # Swallow: logging must never break a user-facing action.
        pass


def success_response(data=None, message='Success', status_code=status.HTTP_200_OK):
    """
    Create a standardized success response.
    
    Args:
        data: Response data
        message: Success message
        status_code: HTTP status code
        
    Returns:
        Response object
    """
    response_data = {
        'success': True,
        'message': message,
    }
    
    if data is not None:
        response_data['data'] = data
    
    return Response(response_data, status=status_code)


def error_response(message='Error', errors=None, status_code=status.HTTP_400_BAD_REQUEST):
    """
    Create a standardized error response.
    
    Args:
        message: Error message
        errors: Error details
        status_code: HTTP status code
        
    Returns:
        Response object
    """
    response_data = {
        'success': False,
        'message': message,
    }
    
    if errors is not None:
        response_data['errors'] = errors
    
    return Response(response_data, status=status_code)


def paginated_response(paginator, serializer_class, queryset, request):
    """
    Create a standardized paginated response.
    
    Args:
        paginator: Paginator instance
        serializer_class: Serializer class for the data
        queryset: Queryset to paginate
        request: Request object
        
    Returns:
        Response object
    """
    page = paginator.paginate_queryset(queryset, request)
    
    if page is not None:
        serializer = serializer_class(page, many=True)
        return paginator.get_paginated_response(serializer.data)
    
    serializer = serializer_class(queryset, many=True)
    return success_response(data=serializer.data)
