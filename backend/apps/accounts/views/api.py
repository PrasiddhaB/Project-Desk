"""
API views for authentication.
"""
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken

from apps.accounts.serializers import (
    RegisterRequestSerializer,
    LoginRequestSerializer,
    UserResponseSerializer,
    AuthResponseSerializer
)
from apps.accounts.services import AuthService


class RegisterView(APIView):
    """
    API endpoint for user registration.
    
    POST /api/auth/register/
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Handle user registration."""
        serializer = RegisterRequestSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.save()
            auth_data = AuthService.get_auth_response(user)
            response_serializer = AuthResponseSerializer(auth_data)
            
            return Response(
                {
                    'success': True,
                    'message': 'Registration successful',
                    'data': response_serializer.data
                },
                status=status.HTTP_201_CREATED
            )
        
        return Response(
            {
                'success': False,
                'message': 'Registration failed',
                'errors': serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )


class LoginView(APIView):
    """
    API endpoint for user login.
    
    POST /api/auth/login/
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Handle user login."""
        serializer = LoginRequestSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            user = serializer.validated_data['user']
            auth_data = AuthService.get_auth_response(user)
            response_serializer = AuthResponseSerializer(auth_data)
            
            return Response(
                {
                    'success': True,
                    'message': 'Login successful',
                    'data': response_serializer.data
                },
                status=status.HTTP_200_OK
            )
        
        return Response(
            {
                'success': False,
                'message': serializer.errors.get('non_field_errors', ['Login failed'])[0],
                'errors': serializer.errors
            },
            status=status.HTTP_401_UNAUTHORIZED
        )


class LogoutView(APIView):
    """
    API endpoint for user logout.
    
    POST /api/auth/logout/
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Handle user logout by blacklisting refresh token."""
        refresh_token = request.data.get('refresh')
        
        if not refresh_token:
            return Response(
                {
                    'success': False,
                    'message': 'Refresh token is required'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        success = AuthService.blacklist_token(refresh_token)
        
        if success:
            return Response(
                {
                    'success': True,
                    'message': 'Logout successful'
                },
                status=status.HTTP_200_OK
            )
        
        return Response(
            {
                'success': False,
                'message': 'Invalid token'
            },
            status=status.HTTP_400_BAD_REQUEST
        )


class MeView(APIView):
    """
    API endpoint for getting current user profile.
    
    GET /api/auth/me/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Return current authenticated user's data."""
        serializer = UserResponseSerializer(request.user)
        
        return Response(
            {
                'success': True,
                'data': serializer.data
            },
            status=status.HTTP_200_OK
        )


class UsersListView(APIView):
    """
    API endpoint for listing users (for task assignment).
    
    GET /api/auth/users/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Return list of active users."""
        from apps.accounts.models import User
        
        users = User.objects.filter(is_active=True).order_by('full_name')
        serializer = UserResponseSerializer(users, many=True)
        
        return Response(
            {
                'success': True,
                'data': serializer.data
            },
            status=status.HTTP_200_OK
        )


class CustomTokenRefreshView(TokenRefreshView):
    """
    Custom token refresh view with consistent response format.
    
    POST /api/auth/token/refresh/
    """
    
    def post(self, request, *args, **kwargs):
        """Handle token refresh."""
        try:
            response = super().post(request, *args, **kwargs)
            return Response(
                {
                    'success': True,
                    'message': 'Token refreshed successfully',
                    'data': {
                        'tokens': response.data
                    }
                },
                status=status.HTTP_200_OK
            )
        except (TokenError, InvalidToken) as e:
            return Response(
                {
                    'success': False,
                    'message': 'Token is invalid or expired',
                    'errors': {'token': [str(e)]}
                },
                status=status.HTTP_401_UNAUTHORIZED
            )
