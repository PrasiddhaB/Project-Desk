"""
Response serializers for accounts app.
"""
from rest_framework import serializers
from apps.accounts.models import User


class UserResponseSerializer(serializers.ModelSerializer):
    """Serializer for user response data."""
    
    class Meta:
        model = User
        fields = [
            'id',
            'full_name',
            'username',
            'email',
            'phone',
            'role',
            'profile_pic',
            'is_active',
            'created_at',
            'updated_at'
        ]
        read_only_fields = fields


class AuthResponseSerializer(serializers.Serializer):
    """Serializer for authentication response."""
    
    user = UserResponseSerializer()
    access = serializers.CharField()
    refresh = serializers.CharField()
    
    def to_representation(self, instance):
        """Format the response data."""
        return {
            'user': UserResponseSerializer(instance['user']).data,
            'tokens': {
                'access': instance['access'],
                'refresh': instance['refresh']
            }
        }


class TokenRefreshResponseSerializer(serializers.Serializer):
    """Serializer for token refresh response."""
    
    access = serializers.CharField()
    refresh = serializers.CharField(required=False)
