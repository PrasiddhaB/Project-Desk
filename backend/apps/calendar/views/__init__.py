"""
Calendar API views - aggregates tasks and notes for calendar display.
"""
from datetime import datetime, timedelta
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.tasks.models import Task
from apps.notes.models import Note


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_calendar_events(request):
    """
    Get calendar events (tasks + notes) for the current user.
    
    Query params:
    - start: Start date (YYYY-MM-DD)
    - end: End date (YYYY-MM-DD)
    - type: 'all', 'tasks', 'notes'
    """
    user = request.user
    is_admin = user.role == 'admin'
    
    # Parse date range
    start_str = request.query_params.get('start')
    end_str = request.query_params.get('end')
    event_type = request.query_params.get('type', 'all')
    
    # Default to current month if no dates provided
    today = datetime.now().date()
    if start_str:
        try:
            start_date = datetime.strptime(start_str, '%Y-%m-%d').date()
        except ValueError:
            start_date = today.replace(day=1)
    else:
        start_date = today.replace(day=1)
    
    if end_str:
        try:
            end_date = datetime.strptime(end_str, '%Y-%m-%d').date()
        except ValueError:
            next_month = today.replace(day=28) + timedelta(days=4)
            end_date = next_month.replace(day=1) - timedelta(days=1)
    else:
        next_month = today.replace(day=28) + timedelta(days=4)
        end_date = next_month.replace(day=1) - timedelta(days=1)
    
    events = []
    
    # Get tasks
    if event_type in ['all', 'tasks']:
        if is_admin:
            tasks = Task.objects.filter(
                due_date__gte=start_date,
                due_date__lte=end_date
            ).select_related('project', 'created_by').prefetch_related('assigned_to')
        else:
            tasks = Task.objects.filter(
                assigned_to=user,
                due_date__gte=start_date,
                due_date__lte=end_date
            ).select_related('project', 'created_by').prefetch_related('assigned_to')
        
        for task in tasks:
            first_assignee = task.assigned_to.first()
            events.append({
                'id': f'task-{task.id}',
                'title': task.title,
                'start': task.due_date.isoformat() if task.due_date else None,
                'end': task.due_date.isoformat() if task.due_date else None,
                'type': 'task',
                'status': task.status,
                'priority': task.priority,
                'color': get_task_color(task.priority, task.status),
                'url': f'/tasks/{task.id}' if is_admin else f'/my-tasks/{task.id}',
                'assignee': first_assignee.full_name if first_assignee else None,
                'project': task.project.name if task.project else None,
            })
    
    # Get notes
    if event_type in ['all', 'notes']:
        if is_admin:
            notes = Note.objects.filter(
                created_at__date__gte=start_date,
                created_at__date__lte=end_date
            ).select_related('user')
        else:
            notes = Note.objects.filter(
                user=user,
                created_at__date__gte=start_date,
                created_at__date__lte=end_date
            )
        
        for note in notes:
            events.append({
                'id': f'note-{note.id}',
                'title': note.title,
                'start': note.created_at.date().isoformat(),
                'end': note.created_at.date().isoformat(),
                'type': 'note',
                'status': note.status,
                'is_private': note.is_private,
                'color': '#9333ea' if note.is_private else '#0891b2',
                'url': f'/notes/{note.id}',
                'owner': note.user.full_name if note.user else None,
            })
    
    return Response({
        'events': events,
        'count': len(events),
        'start_date': start_date.isoformat(),
        'end_date': end_date.isoformat(),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_task_calendar(request):
    """Get only tasks for calendar view."""
    request.query_params._mutable = True
    request.query_params['type'] = 'tasks'
    request.query_params._mutable = False
    return get_calendar_events(request)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_note_calendar(request):
    """Get only notes for calendar view."""
    request.query_params._mutable = True
    request.query_params['type'] = 'notes'
    request.query_params._mutable = False
    return get_calendar_events(request)


def get_task_color(priority, status):
    """Get color for task based on priority and status."""
    if status == 'completed':
        return '#22c55e'  # Green
    
    priority_colors = {
        'critical': '#ef4444',  # Red
        'high': '#f97316',      # Orange
        'medium': '#eab308',    # Yellow
        'low': '#3b82f6',       # Blue
    }
    return priority_colors.get(priority, '#6b7280')  # Gray default
