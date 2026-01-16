"""
Authentication service for business logic.
"""
from typing import Dict, Any, Optional
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from apps.accounts.models import User


class AuthService:
    """Service class for authentication operations."""
    
    @staticmethod
    def create_user(
        username: str,
        email: str,
        password: str,
        full_name: str,
        role: str = 'employee'
    ) -> User:
        """
        Create a new user.
        
        Args:
            username: User's username
            email: User's email
            password: User's password
            full_name: User's full name
            role: User's role (default: employee)
            
        Returns:
            User: The created user instance
        """
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            full_name=full_name,
            role=role
        )
        return user
    
    @staticmethod
    def authenticate_user(username: str, password: str) -> Optional[User]:
        """
        Authenticate a user with username and password.
        
        Args:
            username: User's username
            password: User's password
            
        Returns:
            User if authentication successful, None otherwise
        """
        user = authenticate(username=username, password=password)
        return user
    
    @staticmethod
    def get_tokens_for_user(user: User) -> Dict[str, str]:
        """
        Generate JWT tokens for a user.
        
        Args:
            user: User instance
            
        Returns:
            Dict containing access and refresh tokens
        """
        refresh = RefreshToken.for_user(user)
        
        return {
            'access': str(refresh.access_token),
            'refresh': str(refresh)
        }
    
    @staticmethod
    def refresh_token(refresh_token: str) -> Dict[str, str]:
        """
        Refresh access token using refresh token.
        
        Args:
            refresh_token: Valid refresh token
            
        Returns:
            Dict containing new access token
        """
        refresh = RefreshToken(refresh_token)
        
        return {
            'access': str(refresh.access_token),
            'refresh': str(refresh)
        }
    
    @staticmethod
    def blacklist_token(refresh_token: str) -> bool:
        """
        Blacklist a refresh token (logout).
        
        Args:
            refresh_token: Refresh token to blacklist
            
        Returns:
            True if successful
        """
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return True
        except Exception:
            return False
    
    @staticmethod
    def get_auth_response(user: User) -> Dict[str, Any]:
        """
        Get full authentication response with user and tokens.
        
        Args:
            user: Authenticated user
            
        Returns:
            Dict containing user data and tokens
        """
        tokens = AuthService.get_tokens_for_user(user)
        
        return {
            'user': user,
            'access': tokens['access'],
            'refresh': tokens['refresh']
        }
