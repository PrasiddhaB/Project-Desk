"""
Notification serializers.
"""
from rest_framework import serializers
from apps.notifications.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """Notification serializer."""
    
    class Meta:
        model = Notification
        fields = ['id', 'user', 'type', 'title', 'message', 'is_read', 
                  'reference_id', 'reference_type', 'created_at']
        read_only_fields = ['user', 'type', 'title', 'message', 'reference_id', 'reference_type']
