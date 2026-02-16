"""
Support ticket serializers.
"""
from rest_framework import serializers
from apps.support.models import SupportTicket, TicketReply


class TicketReplySerializer(serializers.ModelSerializer):
    """Serializer for ticket replies."""
    user_name = serializers.CharField(read_only=True)
    user_role = serializers.CharField(read_only=True)
    is_admin = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = TicketReply
        fields = ['id', 'ticket', 'user', 'user_name', 'user_role', 'is_admin', 'message', 'created_at']
        read_only_fields = ['user']


class SupportTicketSerializer(serializers.ModelSerializer):
    """Base ticket serializer."""
    user_name = serializers.CharField(read_only=True)
    reply_count = serializers.IntegerField(read_only=True)
    replies = TicketReplySerializer(many=True, read_only=True)
    
    class Meta:
        model = SupportTicket
        fields = ['id', 'user', 'user_name', 'subject', 'description', 'status', 
                  'priority', 'reply_count', 'replies', 'created_at', 'updated_at']


class SupportTicketListSerializer(serializers.ModelSerializer):
    """Serializer for ticket list."""
    user_name = serializers.CharField(read_only=True)
    reply_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = SupportTicket
        fields = ['id', 'user', 'user_name', 'subject', 'status', 'priority', 
                  'reply_count', 'created_at', 'updated_at']


class SupportTicketDetailSerializer(serializers.ModelSerializer):
    """Serializer for ticket detail."""
    user_name = serializers.CharField(read_only=True)
    reply_count = serializers.IntegerField(read_only=True)
    replies = TicketReplySerializer(many=True, read_only=True)
    
    class Meta:
        model = SupportTicket
        fields = ['id', 'user', 'user_name', 'subject', 'description', 'status',
                  'priority', 'reply_count', 'replies', 'created_at', 'updated_at']


class CreateTicketSerializer(serializers.ModelSerializer):
    """Serializer for creating tickets."""
    
    class Meta:
        model = SupportTicket
        fields = ['subject', 'description', 'priority']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return SupportTicket.objects.create(**validated_data)


class UpdateTicketStatusSerializer(serializers.ModelSerializer):
    """Serializer for updating ticket status (admin only)."""
    
    class Meta:
        model = SupportTicket
        fields = ['status']


class CreateReplySerializer(serializers.ModelSerializer):
    """Serializer for creating replies."""
    
    class Meta:
        model = TicketReply
        fields = ['message']
