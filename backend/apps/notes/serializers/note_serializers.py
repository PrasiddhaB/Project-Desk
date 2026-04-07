"""
Note serializers for API endpoints.
"""
from rest_framework import serializers
from apps.notes.models import Note, NoteShare
from apps.accounts.models import User


class UserMiniSerializer(serializers.ModelSerializer):
    """Mini serializer for user info in notes."""
    
    class Meta:
        model = User
        fields = ['id', 'username', 'full_name']


class NoteShareSerializer(serializers.ModelSerializer):
    """Serializer for note shares."""
    shared_by_name = serializers.CharField(source='shared_by.full_name', read_only=True)
    shared_with_name = serializers.CharField(source='shared_with.full_name', read_only=True)
    
    class Meta:
        model = NoteShare
        fields = ['id', 'note_id', 'shared_by', 'shared_by_name', 
                  'shared_with', 'shared_with_name', 'can_edit', 'created_at']


class NoteSerializer(serializers.ModelSerializer):
    """Base note serializer."""
    owner_name = serializers.CharField(read_only=True)
    shares = NoteShareSerializer(many=True, read_only=True)
    
    class Meta:
        model = Note
        fields = ['id', 'title', 'content', 'status', 'pinned', 
                  'is_private', 'color', 'user', 'owner_name', 'shares',
                  'created_at', 'updated_at']


class NoteListSerializer(serializers.ModelSerializer):
    """Serializer for note list (lighter payload)."""
    owner_name = serializers.CharField(read_only=True)
    share_count = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    
    class Meta:
        model = Note
        fields = ['id', 'title', 'content', 'status', 'pinned', 'is_private',
                  'color', 'user', 'owner_name', 'share_count', 'can_edit',
                  'created_at', 'updated_at']
    
    def get_share_count(self, obj):
        return obj.shares.count()
    
    def get_can_edit(self, obj):
        request = self.context.get('request')
        if not request or not request.user:
            return False
        # Owner can always edit
        if obj.user == request.user:
            return True
        # Check if shared with edit permission
        share = obj.shares.filter(shared_with=request.user).first()
        return share.can_edit if share else False


class NoteDetailSerializer(serializers.ModelSerializer):
    """Serializer for note detail."""
    owner_name = serializers.CharField(read_only=True)
    shares = NoteShareSerializer(many=True, read_only=True)
    can_edit = serializers.SerializerMethodField()
    
    class Meta:
        model = Note
        fields = ['id', 'title', 'content', 'status', 'pinned',
                  'is_private', 'color', 'user', 'owner_name', 'shares', 
                  'can_edit', 'created_at', 'updated_at']
    
    def get_can_edit(self, obj):
        request = self.context.get('request')
        if not request or not request.user:
            return False
        if obj.user == request.user:
            return True
        share = obj.shares.filter(shared_with=request.user).first()
        return share.can_edit if share else False


class NoteCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating notes."""
    
    class Meta:
        model = Note
        fields = ['title', 'content', 'status', 'pinned', 'is_private', 'color']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return Note.objects.create(**validated_data)


class NoteUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating notes."""
    
    class Meta:
        model = Note
        fields = ['title', 'content', 'status', 'pinned', 'is_private', 'color']


class ShareNoteRequestSerializer(serializers.Serializer):
    """Serializer for sharing a note."""
    shared_with = serializers.IntegerField()
    can_edit = serializers.BooleanField(default=False)
    
    def validate_shared_with(self, value):
        try:
            User.objects.get(id=value)
        except User.DoesNotExist:
            raise serializers.ValidationError('User not found')
        return value
