"""
Note API views.
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q

from apps.notes.models import Note, NoteShare
from apps.notes.serializers import (
    NoteSerializer,
    NoteListSerializer,
    NoteDetailSerializer,
    NoteCreateSerializer,
    NoteUpdateSerializer,
    NoteShareSerializer,
    ShareNoteRequestSerializer,
)
from apps.notes.permissions import HasActiveSubscription, check_note_limit
from apps.accounts.models import User


class NoteViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Note CRUD operations.
    
    Endpoints:
    - GET /api/notes/ - List user's notes + shared notes
    - POST /api/notes/ - Create note
    - GET /api/notes/{id}/ - Get note detail
    - PUT /api/notes/{id}/ - Update note
    - DELETE /api/notes/{id}/ - Delete note
    - GET /api/notes/my-notes/ - User's own notes only
    - GET /api/notes/shared/ - Notes shared with user
    - POST /api/notes/{id}/share/ - Share note with user
    - DELETE /api/notes/{id}/unshare/{user_id}/ - Remove share
    
    Note: Employees need active subscription to access notes.
    """
    
    permission_classes = [IsAuthenticated, HasActiveSubscription]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'content']
    ordering_fields = ['created_at', 'updated_at', 'pinned']
    ordering = ['-pinned', '-updated_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return NoteListSerializer
        elif self.action == 'retrieve':
            return NoteDetailSerializer
        elif self.action == 'create':
            return NoteCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return NoteUpdateSerializer
        elif self.action == 'share':
            return ShareNoteRequestSerializer
        return NoteSerializer
    
    def get_queryset(self):
        """
        Return notes owned by user OR shared with user.
        """
        user = self.request.user
        
        # Own notes + shared notes
        queryset = Note.objects.filter(
            Q(user=user) | Q(shares__shared_with=user)
        ).distinct().select_related('user').prefetch_related('shares')
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter private/public
        is_private = self.request.query_params.get('is_private')
        if is_private is not None:
            queryset = queryset.filter(is_private=is_private == 'true')
        
        # Filter pinned
        pinned = self.request.query_params.get('pinned')
        if pinned is not None:
            queryset = queryset.filter(pinned=pinned == 'true')
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        # Check note limit before creating
        is_private = request.data.get('is_private', False)
        can_create, message = check_note_limit(request.user, is_private)
        
        if not can_create:
            return Response({
                'message': message,
                'limit_reached': True
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        note = serializer.save()
        
        response_serializer = NoteDetailSerializer(note, context={'request': request})
        return Response({
            'message': 'Note created successfully',
            'data': response_serializer.data
        }, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Check if user can edit
        if instance.user != request.user:
            share = instance.shares.filter(shared_with=request.user).first()
            if not share or not share.can_edit:
                return Response({
                    'message': 'You do not have permission to edit this note'
                }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = self.get_serializer(instance, data=request.data, partial=kwargs.get('partial', False))
        serializer.is_valid(raise_exception=True)
        note = serializer.save()
        
        response_serializer = NoteDetailSerializer(note, context={'request': request})
        return Response({
            'message': 'Note updated successfully',
            'data': response_serializer.data
        })
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Only owner can delete
        if instance.user != request.user:
            return Response({
                'message': 'Only the owner can delete this note'
            }, status=status.HTTP_403_FORBIDDEN)
        
        title = instance.title
        instance.delete()
        return Response({
            'message': f'Note "{title}" deleted successfully'
        })
    
    @action(detail=False, methods=['get'], url_path='my-notes')
    def my_notes(self, request):
        """Get only user's own notes."""
        notes = Note.objects.filter(user=request.user).select_related('user')
        serializer = NoteListSerializer(notes, many=True, context={'request': request})
        return Response({
            'count': notes.count(),
            'data': serializer.data
        })
    
    @action(detail=False, methods=['get'], url_path='shared')
    def shared_notes(self, request):
        """Get notes shared with user."""
        notes = Note.objects.filter(
            shares__shared_with=request.user
        ).distinct().select_related('user').prefetch_related('shares')
        
        serializer = NoteListSerializer(notes, many=True, context={'request': request})
        return Response({
            'count': notes.count(),
            'data': serializer.data
        })
    
    @action(detail=False, methods=['get'], url_path='private')
    def private_notes(self, request):
        """Get user's private notes."""
        notes = Note.objects.filter(user=request.user, is_private=True)
        serializer = NoteListSerializer(notes, many=True, context={'request': request})
        return Response({
            'count': notes.count(),
            'data': serializer.data
        })
    
    @action(detail=True, methods=['post'], url_path='share')
    def share(self, request, pk=None):
        """Share note with another user."""
        note = self.get_object()
        
        # Only owner can share
        if note.user != request.user:
            return Response({
                'message': 'Only the owner can share this note'
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = ShareNoteRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        shared_with_id = serializer.validated_data['shared_with']
        can_edit = serializer.validated_data['can_edit']
        
        # Can't share with yourself
        if shared_with_id == request.user.id:
            return Response({
                'message': 'Cannot share note with yourself'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        shared_with_user = User.objects.get(id=shared_with_id)
        
        # Check if already shared
        existing_share = NoteShare.objects.filter(
            note=note, shared_with=shared_with_user
        ).first()
        
        if existing_share:
            existing_share.can_edit = can_edit
            existing_share.save()
            message = 'Share permissions updated'
        else:
            NoteShare.objects.create(
                note=note,
                shared_by=request.user,
                shared_with=shared_with_user,
                can_edit=can_edit
            )
            message = f'Note shared with {shared_with_user.full_name}'
        
        response_serializer = NoteDetailSerializer(note, context={'request': request})
        return Response({
            'message': message,
            'data': response_serializer.data
        })
    
    @action(detail=True, methods=['delete'], url_path='unshare/(?P<user_id>[^/.]+)')
    def unshare(self, request, pk=None, user_id=None):
        """Remove share from a user."""
        note = self.get_object()
        
        # Only owner can unshare
        if note.user != request.user:
            return Response({
                'message': 'Only the owner can manage shares'
            }, status=status.HTTP_403_FORBIDDEN)
        
        share = NoteShare.objects.filter(note=note, shared_with_id=user_id).first()
        if not share:
            return Response({
                'message': 'Share not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        share.delete()
        return Response({
            'message': 'Share removed successfully'
        })
    
    @action(detail=False, methods=['get'], url_path='calendar')
    def calendar_events(self, request):
        """
        Get notes as calendar events (based on created_at date).
        Query params:
        - start_date: YYYY-MM-DD
        - end_date: YYYY-MM-DD
        """
        from datetime import datetime
        
        user = request.user
        
        # Get user's notes + shared notes
        queryset = Note.objects.filter(
            Q(user=user) | Q(shares__shared_with=user)
        ).distinct().select_related('user')
        
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        # Filter by date range if provided
        if start_date:
            try:
                start = datetime.strptime(start_date, '%Y-%m-%d')
                queryset = queryset.filter(created_at__date__gte=start)
            except ValueError:
                pass
        
        if end_date:
            try:
                end = datetime.strptime(end_date, '%Y-%m-%d')
                queryset = queryset.filter(created_at__date__lte=end)
            except ValueError:
                pass
        
        # Format as calendar events
        events = []
        for note in queryset:
            color = '#8b5cf6'  # purple for notes
            if note.status == 'completed':
                color = '#10b981'  # green
            elif note.is_private:
                color = '#6366f1'  # indigo
            elif note.pinned:
                color = '#f59e0b'  # amber
            
            events.append({
                'id': f'note-{note.id}',
                'title': note.title,
                'date': note.created_at.date().isoformat(),
                'type': 'note',
                'status': note.status,
                'is_private': note.is_private,
                'pinned': note.pinned,
                'color': color,
                'owner': note.user.full_name,
                'url': f'/notes/{note.id}',
            })
        
        return Response({
            'count': len(events),
            'events': events
        })
