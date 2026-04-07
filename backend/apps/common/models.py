"""
Common base models.
"""
from django.db import models
from django.conf import settings
from django.utils import timezone


class TimeStampedModel(models.Model):
    """
    Abstract base model with created_at and updated_at fields.
    """
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True


class ActivityLog(models.Model):
    """Activity log to track user actions across the system."""
    
    ACTION_CHOICES = [
        ('task_created', 'Task Created'),
        ('task_updated', 'Task Updated'),
        ('task_status_changed', 'Task Status Changed'),
        ('task_deleted', 'Task Deleted'),
        ('note_created', 'Note Created'),
        ('note_updated', 'Note Updated'),
        ('note_deleted', 'Note Deleted'),
        ('note_shared', 'Note Shared'),
        ('project_created', 'Project Created'),
        ('project_updated', 'Project Updated'),
        ('user_login', 'User Login'),
        ('user_registered', 'User Registered'),
        ('profile_updated', 'Profile Updated'),
        ('ticket_created', 'Ticket Created'),
        ('ticket_replied', 'Ticket Replied'),
        ('time_logged', 'Time Logged'),
    ]
    
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='activity_logs'
    )
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    description = models.TextField()
    target_type = models.CharField(max_length=50, blank=True, null=True)
    target_id = models.IntegerField(blank=True, null=True)
    metadata = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'activity_logs'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user} - {self.action} - {self.description[:50]}"
    
    @classmethod
    def log(cls, user, action, description, target_type=None, target_id=None, metadata=None):
        """Helper to create a log entry."""
        return cls.objects.create(
            user=user,
            action=action,
            description=description,
            target_type=target_type,
            target_id=target_id,
            metadata=metadata,
        )
