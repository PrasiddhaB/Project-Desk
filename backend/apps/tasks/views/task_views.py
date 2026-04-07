"""
Task API views.
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count
from django.utils import timezone

from apps.tasks.models import Task, TaskTimeEntry
from apps.tasks.serializers import (
    TaskSerializer,
    TaskListSerializer,
    TaskDetailSerializer,
    TaskCreateSerializer,
    TaskUpdateSerializer,
    TaskStatusUpdateSerializer,
    TaskAssignSerializer,
    TimeEntrySerializer,
    TimeEntryCreateSerializer,
)
from apps.tasks.permissions import (
    IsAdminUser,
    IsAdminOrReadOnly,
    IsTaskAssigneeOrAdmin,
    CanViewTask,
)


class TaskViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Task CRUD operations.
    
    Endpoints:
    - GET /api/tasks/ - List all tasks (admin) or assigned tasks (employee)
    - POST /api/tasks/ - Create task (admin only)
    - GET /api/tasks/{id}/ - Get task detail
    - PUT /api/tasks/{id}/ - Update task (admin only)
    - PATCH /api/tasks/{id}/ - Partial update (admin only)
    - DELETE /api/tasks/{id}/ - Delete task (admin only)
    - PATCH /api/tasks/{id}/status/ - Update status only (assignee or admin)
    - POST /api/tasks/{id}/assign/ - Assign users to task (admin only)
    - GET /api/tasks/my-tasks/ - Get current user's assigned tasks
    - GET /api/tasks/stats/ - Get task statistics
    """
    
    queryset = Task.objects.all()
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'due_date', 'priority', 'status']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'list':
            return TaskListSerializer
        elif self.action == 'retrieve':
            return TaskDetailSerializer
        elif self.action == 'create':
            return TaskCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return TaskUpdateSerializer
        elif self.action == 'update_status':
            return TaskStatusUpdateSerializer
        elif self.action == 'assign':
            return TaskAssignSerializer
        return TaskSerializer
    
    def get_permissions(self):
        """Return appropriate permissions based on action."""
        if self.action in ['create', 'destroy', 'assign']:
            # Only admin can create, delete, or assign
            return [IsAuthenticated(), IsAdminUser()]
        elif self.action in ['update', 'partial_update']:
            # Only admin can fully update
            return [IsAuthenticated(), IsAdminUser()]
        elif self.action == 'update_status':
            # Admin or assignee can update status
            return [IsAuthenticated(), IsTaskAssigneeOrAdmin()]
        elif self.action in ['retrieve']:
            # Admin can view any, employee only assigned
            return [IsAuthenticated(), CanViewTask()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        """
        Return queryset based on user role.
        Admin sees all tasks, employee sees only assigned tasks.
        """
        user = self.request.user
        queryset = Task.objects.select_related('created_by').prefetch_related('assigned_to')
        
        # If not admin, only show assigned tasks
        if user.role != 'admin':
            queryset = queryset.filter(assigned_to=user)
        
        # Apply filters from query params
        status_filter = self.request.query_params.get('status')
        priority_filter = self.request.query_params.get('priority')
        assignee_filter = self.request.query_params.get('assignee')
        overdue_filter = self.request.query_params.get('overdue')
        due_today_filter = self.request.query_params.get('due_today')
        project_filter = self.request.query_params.get('project')
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        if priority_filter:
            queryset = queryset.filter(priority=priority_filter)
        
        if assignee_filter and user.role == 'admin':
            queryset = queryset.filter(assigned_to__id=assignee_filter)
        
        if project_filter:
            queryset = queryset.filter(project_id=project_filter)
        
        if overdue_filter == 'true':
            today = timezone.now().date()
            queryset = queryset.filter(
                due_date__lt=today
            ).exclude(status=Task.Status.COMPLETED)
        
        if due_today_filter == 'true':
            today = timezone.now().date()
            queryset = queryset.filter(due_date=today)
        
        return queryset.distinct()
    
    def create(self, request, *args, **kwargs):
        """Create a new task."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        task = serializer.save()
        
        # Return detailed response
        response_serializer = TaskDetailSerializer(task)
        return Response(
            {
                'message': 'Task created successfully',
                'data': response_serializer.data
            },
            status=status.HTTP_201_CREATED
        )
    
    def update(self, request, *args, **kwargs):
        """Update a task."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        task = serializer.save()
        
        response_serializer = TaskDetailSerializer(task)
        return Response({
            'message': 'Task updated successfully',
            'data': response_serializer.data
        })
    
    def destroy(self, request, *args, **kwargs):
        """Delete a task."""
        instance = self.get_object()
        task_title = instance.title
        instance.delete()
        return Response(
            {'message': f'Task "{task_title}" deleted successfully'},
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['patch'], url_path='status')
    def update_status(self, request, pk=None):
        """
        Update task status only.
        Employees can only update status of tasks assigned to them.
        """
        task = self.get_object()
        serializer = self.get_serializer(task, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        old_status = task.status
        serializer.save()
        
        return Response({
            'message': f'Task status updated from {old_status} to {task.status}',
            'data': {
                'id': task.id,
                'title': task.title,
                'old_status': old_status,
                'new_status': task.status
            }
        })
    
    @action(detail=True, methods=['post'], url_path='assign')
    def assign(self, request, pk=None):
        """
        Assign or unassign users to/from a task.
        Admin only.
        """
        task = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user_ids = serializer.validated_data['user_ids']
        action_type = serializer.validated_data['action']
        
        if action_type == 'add':
            task.assigned_to.add(*user_ids)
            message = f'Users added to task "{task.title}"'
        elif action_type == 'remove':
            task.assigned_to.remove(*user_ids)
            message = f'Users removed from task "{task.title}"'
        else:  # set
            task.assigned_to.set(user_ids)
            message = f'Task "{task.title}" assignees updated'
        
        response_serializer = TaskDetailSerializer(task)
        return Response({
            'message': message,
            'data': response_serializer.data
        })
    
    @action(detail=False, methods=['get'], url_path='my-tasks')
    def my_tasks(self, request):
        """
        Get tasks assigned to the current user.
        """
        user = request.user
        tasks = Task.objects.filter(assigned_to=user).select_related(
            'created_by'
        ).prefetch_related('assigned_to')
        
        # Apply status filter
        status_filter = request.query_params.get('status')
        if status_filter:
            tasks = tasks.filter(status=status_filter)
        
        serializer = TaskListSerializer(tasks, many=True)
        return Response({
            'count': tasks.count(),
            'data': serializer.data
        })
    
    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        """
        Get task statistics.
        Admin sees all stats, employee sees only their stats.
        """
        user = request.user
        
        if user.role == 'admin':
            queryset = Task.objects.all()
        else:
            queryset = Task.objects.filter(assigned_to=user)
        
        today = timezone.now().date()
        
        stats = {
            'total': queryset.count(),
            'pending': queryset.filter(status=Task.Status.PENDING).count(),
            'in_progress': queryset.filter(status=Task.Status.IN_PROGRESS).count(),
            'completed': queryset.filter(status=Task.Status.COMPLETED).count(),
            'overdue': queryset.filter(
                due_date__lt=today
            ).exclude(status=Task.Status.COMPLETED).count(),
            'due_today': queryset.filter(due_date=today).count(),
            'high_priority': queryset.filter(
                priority__in=[Task.Priority.HIGH, Task.Priority.URGENT]
            ).exclude(status=Task.Status.COMPLETED).count(),
        }
        
        return Response(stats)
    
    @action(detail=False, methods=['get'], url_path='overdue')
    def overdue_tasks(self, request):
        """Get all overdue tasks."""
        user = request.user
        today = timezone.now().date()
        
        if user.role == 'admin':
            queryset = Task.objects.all()
        else:
            queryset = Task.objects.filter(assigned_to=user)
        
        overdue = queryset.filter(
            due_date__lt=today
        ).exclude(
            status=Task.Status.COMPLETED
        ).select_related('created_by').prefetch_related('assigned_to')
        
        serializer = TaskListSerializer(overdue, many=True)
        return Response({
            'count': overdue.count(),
            'data': serializer.data
        })
    
    @action(detail=False, methods=['get'], url_path='due-today')
    def due_today_tasks(self, request):
        """Get tasks due today."""
        user = request.user
        today = timezone.now().date()
        
        if user.role == 'admin':
            queryset = Task.objects.all()
        else:
            queryset = Task.objects.filter(assigned_to=user)
        
        due_today = queryset.filter(
            due_date=today
        ).select_related('created_by').prefetch_related('assigned_to')
        
        serializer = TaskListSerializer(due_today, many=True)
        return Response({
            'count': due_today.count(),
            'data': serializer.data
        })
    
    @action(detail=False, methods=['get'], url_path='calendar')
    def calendar_events(self, request):
        """
        Get tasks as calendar events.
        Query params:
        - start_date: YYYY-MM-DD
        - end_date: YYYY-MM-DD
        """
        from datetime import datetime
        
        user = request.user
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if user.role == 'admin':
            queryset = Task.objects.all()
        else:
            queryset = Task.objects.filter(assigned_to=user)
        
        # Filter by date range if provided
        if start_date:
            try:
                start = datetime.strptime(start_date, '%Y-%m-%d').date()
                queryset = queryset.filter(due_date__gte=start)
            except ValueError:
                pass
        
        if end_date:
            try:
                end = datetime.strptime(end_date, '%Y-%m-%d').date()
                queryset = queryset.filter(due_date__lte=end)
            except ValueError:
                pass
        
        # Only include tasks with due dates
        queryset = queryset.filter(due_date__isnull=False).select_related(
            'created_by', 'project'
        ).prefetch_related('assigned_to')
        
        # Format as calendar events
        events = []
        for task in queryset:
            color = '#6b7280'  # gray default
            if task.status == 'completed':
                color = '#10b981'  # green
            elif task.is_overdue:
                color = '#ef4444'  # red
            elif task.priority == 'urgent':
                color = '#f59e0b'  # orange
            elif task.priority == 'high':
                color = '#f97316'  # orange-red
            elif task.status == 'in_progress':
                color = '#3b82f6'  # blue
            
            events.append({
                'id': f'task-{task.id}',
                'title': task.title,
                'date': task.due_date.isoformat(),
                'type': 'task',
                'status': task.status,
                'priority': task.priority,
                'color': color,
                'project_id': task.project_id,
                'project_name': task.project_name,
                'assignees': [
                    {'id': u.id, 'name': u.full_name}
                    for u in task.assigned_to.all()
                ],
                'url': f'/tasks/{task.id}',
            })
        
        return Response({
            'count': len(events),
            'events': events
        })
    
    # ========== TIME TRACKING ==========
    
    @action(detail=True, methods=['get', 'post'], url_path='time-entries')
    def time_entries(self, request, pk=None):
        """
        GET: List time entries for a task.
        POST: Add a time entry to a task.
        """
        task = self.get_object()
        
        if request.method == 'GET':
            entries = TaskTimeEntry.objects.filter(task=task).select_related('user')
            
            # Filter by user if not admin
            if request.user.role != 'admin':
                entries = entries.filter(user=request.user)
            
            serializer = TimeEntrySerializer(entries, many=True)
            
            total_minutes = sum(e.duration_minutes for e in entries)
            
            return Response({
                'count': entries.count(),
                'total_minutes': total_minutes,
                'total_display': f"{total_minutes // 60}h {total_minutes % 60}m",
                'data': serializer.data
            })
        
        elif request.method == 'POST':
            serializer = TimeEntryCreateSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            entry = TaskTimeEntry.objects.create(
                task=task,
                user=request.user,
                **serializer.validated_data
            )
            
            response_serializer = TimeEntrySerializer(entry)
            return Response({
                'message': 'Time entry added',
                'data': response_serializer.data
            }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['delete'], url_path='time-entries/(?P<entry_id>[^/.]+)')
    def delete_time_entry(self, request, pk=None, entry_id=None):
        """Delete a time entry."""
        task = self.get_object()
        
        try:
            entry = TaskTimeEntry.objects.get(id=entry_id, task=task)
        except TaskTimeEntry.DoesNotExist:
            return Response({
                'message': 'Time entry not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Only owner or admin can delete
        if entry.user != request.user and request.user.role != 'admin':
            return Response({
                'message': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        entry.delete()
        return Response({'message': 'Time entry deleted'})
    
    @action(detail=False, methods=['get'], url_path='my-time-entries')
    def my_time_entries(self, request):
        """Get all time entries for the current user."""
        entries = TaskTimeEntry.objects.filter(
            user=request.user
        ).select_related('task', 'user').order_by('-created_at')
        
        # Optional date range filter
        from datetime import datetime
        start = request.query_params.get('start_date')
        end = request.query_params.get('end_date')
        
        if start:
            try:
                entries = entries.filter(created_at__date__gte=datetime.strptime(start, '%Y-%m-%d').date())
            except ValueError:
                pass
        if end:
            try:
                entries = entries.filter(created_at__date__lte=datetime.strptime(end, '%Y-%m-%d').date())
            except ValueError:
                pass
        
        limit = int(request.query_params.get('limit', 50))
        entries = entries[:limit]
        
        serializer = TimeEntrySerializer(entries, many=True)
        total_minutes = sum(e.duration_minutes for e in entries)
        
        return Response({
            'count': len(serializer.data),
            'total_minutes': total_minutes,
            'total_display': f"{total_minutes // 60}h {total_minutes % 60}m",
            'data': serializer.data
        })
