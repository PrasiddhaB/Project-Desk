"""
Notification models.
"""
from django.db import models
from django.conf import settings
from django.utils import timezone


class Notification(models.Model):
    """Notification model."""
    
    class Type(models.TextChoices):
        TASK_ASSIGNED = 'task_assigned', 'Task Assigned'
        TASK_UPDATED = 'task_updated', 'Task Updated'
        NOTE_SHARED = 'note_shared', 'Note Shared'
        SUPPORT_TICKET = 'support_ticket', 'Support Ticket'
        TICKET_REPLY = 'ticket_reply', 'Ticket Reply'
    
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    type = models.CharField(max_length=50, choices=Type.choices)
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    
    # Optional reference to related object
    reference_id = models.IntegerField(null=True, blank=True)
    reference_type = models.CharField(max_length=50, null=True, blank=True)
    
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.user.username}"
