"""
Request serializers for accounts app.
"""
from rest_framework import serializers
from django.contrib.auth import authenticate
from apps.accounts.models import User


class RegisterRequestSerializer(serializers.Serializer):
    """Serializer for user registration request."""
    
    full_name = serializers.CharField(
        max_length=100,
        required=True,
        error_messages={
            'required': 'Full name is required',
            'blank': 'Full name cannot be blank'
        }
    )
    username = serializers.CharField(
        max_length=50,
        required=True,
        error_messages={
            'required': 'Username is required',
            'blank': 'Username cannot be blank'
        }
    )
    email = serializers.EmailField(
        required=True,
        error_messages={
            'required': 'Email is required',
            'blank': 'Email cannot be blank',
            'invalid': 'Invalid email format'
        }
    )
    password = serializers.CharField(
        min_length=6,
        write_only=True,
        required=True,
        error_messages={
            'required': 'Password is required',
            'blank': 'Password cannot be blank',
            'min_length': 'Password must be at least 6 characters'
        }
    )
    
    def validate_username(self, value):
        """Check if username already exists."""
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError('Username already exists')
        return value
    
    def validate_email(self, value):
        """Check if email already exists."""
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('Email already exists')
        return value
    
    def create(self, validated_data):
        """Create and return a new user."""
        return User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            full_name=validated_data['full_name'],
            role='employee'
        )


class LoginRequestSerializer(serializers.Serializer):
    """Serializer for user login request."""
    
    username = serializers.CharField(
        required=True,
        error_messages={
            'required': 'Username is required',
            'blank': 'Username cannot be blank'
        }
    )
    password = serializers.CharField(
        write_only=True,
        required=True,
        error_messages={
            'required': 'Password is required',
            'blank': 'Password cannot be blank'
        }
    )
    
    def validate(self, attrs):
        """Validate login credentials."""
        username = attrs.get('username')
        password = attrs.get('password')
        
        if username and password:
            user = authenticate(
                request=self.context.get('request'),
                username=username,
                password=password
            )
            
            if not user:
                raise serializers.ValidationError(
                    'Incorrect username or password',
                    code='authentication'
                )
            
            if not user.is_active:
                raise serializers.ValidationError(
                    'User account is disabled',
                    code='authorization'
                )
            
            attrs['user'] = user
        
        return attrs
