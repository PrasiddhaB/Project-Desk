"""
Custom exception handling for the API.
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    """
    Custom exception handler to return consistent error responses.
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)
    
    if response is not None:
        # Get the error message
        if isinstance(response.data, dict):
            if 'detail' in response.data:
                message = response.data['detail']
                errors = None
            else:
                message = 'Validation failed'
                errors = response.data
        elif isinstance(response.data, list):
            message = response.data[0] if response.data else 'An error occurred'
            errors = response.data
        else:
            message = str(response.data)
            errors = None
        
        response.data = {
            'success': False,
            'message': str(message),
            'errors': errors
        }
    
    return response


class APIException(Exception):
    """Base API Exception."""
    
    status_code = status.HTTP_400_BAD_REQUEST
    default_message = 'An error occurred'
    
    def __init__(self, message=None, status_code=None):
        self.message = message or self.default_message
        if status_code:
            self.status_code = status_code
        super().__init__(self.message)


class BadRequestException(APIException):
    """Bad request exception."""
    
    status_code = status.HTTP_400_BAD_REQUEST
    default_message = 'Bad request'


class UnauthorizedException(APIException):
    """Unauthorized exception."""
    
    status_code = status.HTTP_401_UNAUTHORIZED
    default_message = 'Unauthorized'


class ForbiddenException(APIException):
    """Forbidden exception."""
    
    status_code = status.HTTP_403_FORBIDDEN
    default_message = 'Forbidden'


class NotFoundException(APIException):
    """Not found exception."""
    
    status_code = status.HTTP_404_NOT_FOUND
    default_message = 'Resource not found'
