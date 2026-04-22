"""
Response serializers for accounts app.
"""
from rest_framework import serializers
from apps.accounts.models import User


class UserResponseSerializer(serializers.ModelSerializer):
    """Serializer for user response data."""
    
    is_online = serializers.BooleanField(read_only=True)
    profile_pic_url = serializers.SerializerMethodField()
    
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
            'profile_pic_url',
            'is_active',
            'is_welcomed',
            'is_email_verified',
            'is_online',
            'last_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields
    
    def get_profile_pic_url(self, obj):
        """
        Return an ABSOLUTE URL for the profile picture so the frontend
        (served from a different port) can load it directly.
        Falls back to the relative URL if there's no request context.
        """
        if not obj.profile_pic:
            return None
        url = obj.profile_pic.url
        request = self.context.get('request') if hasattr(self, 'context') else None
        if request is not None:
            return request.build_absolute_uri(url)
        return url


class AuthResponseSerializer(serializers.Serializer):
    """Serializer for authentication response."""
    
    user = UserResponseSerializer()
    access = serializers.CharField()
    refresh = serializers.CharField()
    
    def to_representation(self, instance):
        """Format the response data."""
        return {
            'user': UserResponseSerializer(
                instance['user'],
                context=self.context,
            ).data,
            'tokens': {
                'access': instance['access'],
                'refresh': instance['refresh'],
            },
        }


class TokenRefreshResponseSerializer(serializers.Serializer):
    """Serializer for token refresh response."""
    
    access = serializers.CharField()
    refresh = serializers.CharField(required=False)
