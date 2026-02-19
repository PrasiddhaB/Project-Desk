"""
Project API views.
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.projects.models import Project
from apps.projects.serializers import (
    ProjectSerializer,
    ProjectListSerializer,
    ProjectDetailSerializer,
    ProjectCreateSerializer,
    ProjectUpdateSerializer,
    ProjectMemberSerializer,
)
from apps.accounts.models import User


class ProjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Project CRUD operations.
    
    - Admin: Can see all projects, create, update, delete
    - Employee: Can only see projects they're a member of
    """
    
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'name', 'status']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ProjectListSerializer
        elif self.action == 'retrieve':
            return ProjectDetailSerializer
        elif self.action == 'create':
            return ProjectCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ProjectUpdateSerializer
        elif self.action == 'members':
            return ProjectMemberSerializer
        return ProjectSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        # Admin sees all projects
        if user.role == 'admin':
            queryset = Project.objects.all()
        else:
            # Employee sees only projects they're a member of
            queryset = Project.objects.filter(members=user)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.select_related('created_by').prefetch_related('members')
    
    def create(self, request, *args, **kwargs):
        # Only admin can create projects
        if request.user.role != 'admin':
            return Response({
                'message': 'Only admin can create projects'
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        project = serializer.save()
        
        response_serializer = ProjectDetailSerializer(project)
        return Response({
            'message': 'Project created successfully',
            'data': response_serializer.data
        }, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        # Only admin can update projects
        if request.user.role != 'admin':
            return Response({
                'message': 'Only admin can update projects'
            }, status=status.HTTP_403_FORBIDDEN)
        
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=kwargs.get('partial', False))
        serializer.is_valid(raise_exception=True)
        project = serializer.save()
        
        response_serializer = ProjectDetailSerializer(project)
        return Response({
            'message': 'Project updated successfully',
            'data': response_serializer.data
        })
    
    def destroy(self, request, *args, **kwargs):
        # Only admin can delete projects
        if request.user.role != 'admin':
            return Response({
                'message': 'Only admin can delete projects'
            }, status=status.HTTP_403_FORBIDDEN)
        
        instance = self.get_object()
        name = instance.name
        instance.delete()
        
        return Response({
            'message': f'Project "{name}" deleted successfully'
        })
    
    @action(detail=True, methods=['post'], url_path='members')
    def members(self, request, pk=None):
        """Add/remove/set project members (Admin only)."""
        if request.user.role != 'admin':
            return Response({
                'message': 'Only admin can manage project members'
            }, status=status.HTTP_403_FORBIDDEN)
        
        project = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user_ids = serializer.validated_data['user_ids']
        action_type = serializer.validated_data['action']
        
        users = User.objects.filter(id__in=user_ids)
        
        if action_type == 'add':
            project.members.add(*users)
            message = f'Added {users.count()} members'
        elif action_type == 'remove':
            project.members.remove(*users)
            message = f'Removed {users.count()} members'
        elif action_type == 'set':
            project.members.set(users)
            message = f'Set {users.count()} members'
        
        response_serializer = ProjectDetailSerializer(project)
        return Response({
            'message': message,
            'data': response_serializer.data
        })
    
    @action(detail=False, methods=['get'], url_path='my-projects')
    def my_projects(self, request):
        """Get current user's projects (as member)."""
        projects = Project.objects.filter(members=request.user)
        serializer = ProjectListSerializer(projects, many=True)
        return Response({
            'count': projects.count(),
            'data': serializer.data
        })
    
    @action(detail=True, methods=['get'], url_path='tasks')
    def project_tasks(self, request, pk=None):
        """Get tasks for a specific project."""
        project = self.get_object()
        
        # Check permission
        if request.user.role != 'admin' and request.user not in project.members.all():
            return Response({
                'message': 'You are not a member of this project'
            }, status=status.HTTP_403_FORBIDDEN)
        
        from apps.tasks.serializers import TaskListSerializer
        
        tasks = project.tasks.all()
        
        # Employee sees only their assigned tasks
        if request.user.role != 'admin':
            tasks = tasks.filter(assigned_to=request.user)
        
        serializer = TaskListSerializer(tasks, many=True, context={'request': request})
        return Response({
            'count': tasks.count(),
            'data': serializer.data
        })
    
    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        """Get project statistics."""
        if request.user.role == 'admin':
            projects = Project.objects.all()
        else:
            projects = Project.objects.filter(members=request.user)
        
        return Response({
            'total': projects.count(),
            'active': projects.filter(status='active').count(),
            'on_hold': projects.filter(status='on_hold').count(),
            'completed': projects.filter(status='completed').count(),
            'archived': projects.filter(status='archived').count(),
        })
