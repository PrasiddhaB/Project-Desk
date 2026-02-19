"""
Support ticket models.
"""
from django.db import models
from django.conf import settings
from django.utils import timezone


class SupportTicket(models.Model):
    """Support ticket model."""
    
    class Status(models.TextChoices):
        OPEN = 'open', 'Open'
        IN_PROGRESS = 'in_progress', 'In Progress'
        RESOLVED = 'resolved', 'Resolved'
        CLOSED = 'closed', 'Closed'
    
    class Priority(models.TextChoices):
        LOW = 'low', 'Low'
        MEDIUM = 'medium', 'Medium'
        HIGH = 'high', 'High'
        URGENT = 'urgent', 'Urgent'
    
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='support_tickets'
    )
    subject = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.OPEN
    )
    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.MEDIUM
    )
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'support_tickets'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"#{self.id} - {self.subject}"
    
    @property
    def user_name(self):
        return self.user.full_name
    
    @property
    def reply_count(self):
        return self.replies.count()


class TicketReply(models.Model):
    """Reply to a support ticket."""
    
    id = models.AutoField(primary_key=True)
    ticket = models.ForeignKey(
        SupportTicket,
        on_delete=models.CASCADE,
        related_name='replies'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ticket_replies'
    )
    message = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'ticket_replies'
        ordering = ['created_at']
    
    def __str__(self):
        return f"Reply to #{self.ticket.id} by {self.user.username}"
    
    @property
    def user_name(self):
        return self.user.full_name
    
    @property
    def user_role(self):
        return self.user.role
    
    @property
    def is_admin(self):
        return self.user.role == 'admin'
