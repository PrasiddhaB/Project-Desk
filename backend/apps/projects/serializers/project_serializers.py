"""
Project serializers for API endpoints.
"""
from rest_framework import serializers
from apps.projects.models import Project
from apps.accounts.models import User


class MemberSerializer(serializers.ModelSerializer):
    """Serializer for project members."""
    
    class Meta:
        model = User
        fields = ['id', 'username', 'full_name', 'email', 'role']


class ProjectSerializer(serializers.ModelSerializer):
    """Base project serializer."""
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    member_count = serializers.IntegerField(read_only=True)
    task_count = serializers.IntegerField(read_only=True)
    completed_task_count = serializers.IntegerField(read_only=True)
    progress_percentage = serializers.IntegerField(read_only=True)
    members = MemberSerializer(many=True, read_only=True)
    
    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'status', 
            'created_by', 'created_by_name', 'members',
            'member_count', 'task_count', 'completed_task_count', 'progress_percentage',
            'start_date', 'end_date', 'created_at', 'updated_at'
        ]


class ProjectListSerializer(serializers.ModelSerializer):
    """Serializer for project list (lighter payload)."""
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    member_count = serializers.IntegerField(read_only=True)
    task_count = serializers.IntegerField(read_only=True)
    progress_percentage = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'status',
            'created_by', 'created_by_name',
            'member_count', 'task_count', 'progress_percentage',
            'start_date', 'end_date', 'created_at'
        ]


class ProjectDetailSerializer(serializers.ModelSerializer):
    """Serializer for project detail view."""
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    member_count = serializers.IntegerField(read_only=True)
    task_count = serializers.IntegerField(read_only=True)
    completed_task_count = serializers.IntegerField(read_only=True)
    progress_percentage = serializers.IntegerField(read_only=True)
    members = MemberSerializer(many=True, read_only=True)
    
    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'status',
            'created_by', 'created_by_name', 'members',
            'member_count', 'task_count', 'completed_task_count', 'progress_percentage',
            'start_date', 'end_date', 'created_at', 'updated_at'
        ]


class ProjectCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating projects."""
    member_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Project
        fields = ['name', 'description', 'status', 'start_date', 'end_date', 'member_ids']
    
    def create(self, validated_data):
        member_ids = validated_data.pop('member_ids', [])
        validated_data['created_by'] = self.context['request'].user
        
        project = Project.objects.create(**validated_data)
        
        if member_ids:
            members = User.objects.filter(id__in=member_ids)
            project.members.set(members)
        
        return project


class ProjectUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating projects."""
    member_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Project
        fields = ['name', 'description', 'status', 'start_date', 'end_date', 'member_ids']
    
    def update(self, instance, validated_data):
        member_ids = validated_data.pop('member_ids', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if member_ids is not None:
            members = User.objects.filter(id__in=member_ids)
            instance.members.set(members)
        
        return instance


class ProjectMemberSerializer(serializers.Serializer):
    """Serializer for adding/removing project members."""
    user_ids = serializers.ListField(child=serializers.IntegerField())
    action = serializers.ChoiceField(choices=['add', 'remove', 'set'])
