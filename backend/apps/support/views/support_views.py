"""
Support ticket API views.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.support.models import SupportTicket, TicketReply
from apps.support.serializers import (
    SupportTicketSerializer,
    SupportTicketListSerializer,
    SupportTicketDetailSerializer,
    CreateTicketSerializer,
    UpdateTicketStatusSerializer,
    CreateReplySerializer,
    TicketReplySerializer,
)


class SupportTicketViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Support Tickets.
    
    - Employee: Can create tickets, view own tickets, reply to own tickets
    - Admin: Can view all tickets, update status, reply to any ticket
    """
    
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return SupportTicketListSerializer
        elif self.action == 'retrieve':
            return SupportTicketDetailSerializer
        elif self.action == 'create':
            return CreateTicketSerializer
        elif self.action == 'update_status':
            return UpdateTicketStatusSerializer
        elif self.action == 'reply':
            return CreateReplySerializer
        return SupportTicketSerializer
    
    def get_queryset(self):
        user = self.request.user
        queryset = SupportTicket.objects.select_related('user').prefetch_related('replies')
        
        # Admin sees all, employee sees only their own
        if user.role not in ('admin', 'superadmin'):
            queryset = queryset.filter(user=user)
        
        # Filters
        status_filter = self.request.query_params.get('status')
        priority_filter = self.request.query_params.get('priority')
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if priority_filter:
            queryset = queryset.filter(priority=priority_filter)
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ticket = serializer.save()
        
        from apps.common.utils import log_activity
        log_activity(
            user=request.user, action='ticket_created',
            description=f'Created support ticket "{ticket.subject}"',
            target_type='ticket', target_id=ticket.id,
        )
        
        response_serializer = SupportTicketDetailSerializer(ticket)
        return Response({
            'message': 'Ticket created successfully',
            'data': response_serializer.data
        }, status=status.HTTP_201_CREATED)
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Only owner or admin can delete
        if instance.user != request.user and request.user.role not in ('admin', 'superadmin'):
            return Response({
                'message': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        instance.delete()
        return Response({'message': 'Ticket deleted'})
    
    @action(detail=True, methods=['patch'], url_path='status')
    def update_status(self, request, pk=None):
        """Update ticket status (admin only)."""
        if request.user.role not in ('admin', 'superadmin'):
            return Response({
                'message': 'Only admin can update ticket status'
            }, status=status.HTTP_403_FORBIDDEN)
        
        ticket = self.get_object()
        serializer = self.get_serializer(ticket, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response({
            'message': 'Status updated',
            'data': SupportTicketDetailSerializer(ticket).data
        })
    
    @action(detail=True, methods=['post'], url_path='reply')
    def reply(self, request, pk=None):
        """Add reply to ticket."""
        ticket = self.get_object()
        
        # Check permission - owner or admin can reply
        if ticket.user != request.user and request.user.role not in ('admin', 'superadmin'):
            return Response({
                'message': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        reply = TicketReply.objects.create(
            ticket=ticket,
            user=request.user,
            message=serializer.validated_data['message']
        )
        
        from apps.common.utils import log_activity
        log_activity(
            user=request.user, action='ticket_replied',
            description=f'Replied to ticket "{ticket.subject}"',
            target_type='ticket', target_id=ticket.id,
        )
        
        return Response({
            'message': 'Reply added',
            'data': TicketReplySerializer(reply).data
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'], url_path='my-tickets')
    def my_tickets(self, request):
        """Get current user's tickets."""
        tickets = SupportTicket.objects.filter(user=request.user)
        serializer = SupportTicketListSerializer(tickets, many=True)
        return Response({
            'count': tickets.count(),
            'data': serializer.data
        })
    
    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        """Get ticket statistics (admin only)."""
        if request.user.role not in ('admin', 'superadmin'):
            queryset = SupportTicket.objects.filter(user=request.user)
        else:
            queryset = SupportTicket.objects.all()
        
        return Response({
            'total': queryset.count(),
            'open': queryset.filter(status='open').count(),
            'in_progress': queryset.filter(status='in_progress').count(),
            'resolved': queryset.filter(status='resolved').count(),
            'closed': queryset.filter(status='closed').count(),
        })
