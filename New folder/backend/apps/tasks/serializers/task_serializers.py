"""
Task serializers for API endpoints.
"""
from rest_framework import serializers
from django.utils import timezone
from apps.tasks.models import Task
from apps.accounts.models import User


class AssigneeSerializer(serializers.ModelSerializer):
    """Serializer for task assignees."""
    
    class Meta:
        model = User
        fields = ['id', 'username', 'full_name', 'email', 'profile_pic']


class CreatorSerializer(serializers.ModelSerializer):
    """Serializer for task creator."""
    
    class Meta:
        model = User
        fields = ['id', 'username', 'full_name']


class TaskSerializer(serializers.ModelSerializer):
    """Base task serializer."""
    
    assigned_to = AssigneeSerializer(many=True, read_only=True)
    created_by = CreatorSerializer(read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    assignee_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'status', 'priority',
            'due_date', 'created_by', 'assigned_to', 'is_overdue',
            'assignee_count', 'created_at', 'updated_at'
        ]


class TaskListSerializer(serializers.ModelSerializer):
    """Serializer for task list view (lighter payload)."""
    
    assigned_to = AssigneeSerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    assignee_count = serializers.IntegerField(read_only=True)
    project_name = serializers.CharField(read_only=True)
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'status', 'priority', 'due_date',
            'project', 'project_name', 'created_by_name', 'assigned_to', 
            'is_overdue', 'assignee_count', 'created_at'
        ]


class TaskDetailSerializer(serializers.ModelSerializer):
    """Serializer for task detail view."""
    
    assigned_to = AssigneeSerializer(many=True, read_only=True)
    created_by = CreatorSerializer(read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    assignee_count = serializers.IntegerField(read_only=True)
    project_name = serializers.CharField(read_only=True)
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'status', 'priority',
            'due_date', 'project', 'project_name', 'created_by', 
            'assigned_to', 'is_overdue', 'assignee_count', 
            'created_at', 'updated_at'
        ]


class TaskCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating tasks."""
    
    assigned_to_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        default=[]
    )
    project_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = Task
        fields = [
            'title', 'description', 'status', 'priority',
            'due_date', 'assigned_to_ids', 'project_id'
        ]
    
    def validate_due_date(self, value):
        """Validate due date is not in the past."""
        if value and value < timezone.now().date():
            raise serializers.ValidationError('Due date cannot be in the past.')
        return value
    
    def validate_assigned_to_ids(self, value):
        """Validate assignee IDs exist."""
        if value:
            existing_ids = set(User.objects.filter(id__in=value).values_list('id', flat=True))
            invalid_ids = set(value) - existing_ids
            if invalid_ids:
                raise serializers.ValidationError(
                    f'Invalid user IDs: {list(invalid_ids)}'
                )
        return value
    
    def validate_project_id(self, value):
        """Validate project exists."""
        if value:
            from apps.projects.models import Project
            if not Project.objects.filter(id=value).exists():
                raise serializers.ValidationError('Project not found.')
        return value
    
    def create(self, validated_data):
        """Create task with assignees and project."""
        assigned_to_ids = validated_data.pop('assigned_to_ids', [])
        project_id = validated_data.pop('project_id', None)
        
        # Set created_by from request user
        validated_data['created_by'] = self.context['request'].user
        
        # Set project if provided
        if project_id:
            from apps.projects.models import Project
            validated_data['project'] = Project.objects.get(id=project_id)
        
        task = Task.objects.create(**validated_data)
        
        # Add assignees
        if assigned_to_ids:
            task.assigned_to.set(assigned_to_ids)
        
        return task


class TaskUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating tasks (Admin only)."""
    
    assigned_to_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    project_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = Task
        fields = [
            'title', 'description', 'status', 'priority',
            'due_date', 'assigned_to_ids', 'project_id'
        ]
    
    def validate_assigned_to_ids(self, value):
        """Validate assignee IDs exist."""
        if value is not None:
            existing_ids = set(User.objects.filter(id__in=value).values_list('id', flat=True))
            invalid_ids = set(value) - existing_ids
            if invalid_ids:
                raise serializers.ValidationError(
                    f'Invalid user IDs: {list(invalid_ids)}'
                )
        return value
    
    def validate_project_id(self, value):
        """Validate project exists."""
        if value:
            from apps.projects.models import Project
            if not Project.objects.filter(id=value).exists():
                raise serializers.ValidationError('Project not found.')
        return value
    
    def update(self, instance, validated_data):
        """Update task with assignees and project."""
        assigned_to_ids = validated_data.pop('assigned_to_ids', None)
        project_id = validated_data.pop('project_id', None)
        
        # Update project if provided
        if project_id is not None:
            from apps.projects.models import Project
            instance.project = Project.objects.get(id=project_id) if project_id else None
        
        # Update task fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update assignees if provided
        if assigned_to_ids is not None:
            instance.assigned_to.set(assigned_to_ids)
        
        return instance


class TaskStatusUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating task status only (Employee can use this)."""
    
    class Meta:
        model = Task
        fields = ['status']
    
    def validate_status(self, value):
        """Validate status transition."""
        valid_statuses = [choice[0] for choice in Task.Status.choices]
        if value not in valid_statuses:
            raise serializers.ValidationError(
                f'Invalid status. Must be one of: {valid_statuses}'
            )
        return value


class TaskAssignSerializer(serializers.Serializer):
    """Serializer for assigning/unassigning users to tasks."""
    
    user_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=True,
        min_length=1
    )
    action = serializers.ChoiceField(
        choices=['add', 'remove', 'set'],
        default='set'
    )
    
    def validate_user_ids(self, value):
        """Validate user IDs exist."""
        existing_ids = set(User.objects.filter(id__in=value).values_list('id', flat=True))
        invalid_ids = set(value) - existing_ids
        if invalid_ids:
            raise serializers.ValidationError(
                f'Invalid user IDs: {list(invalid_ids)}'
            )
        return value
