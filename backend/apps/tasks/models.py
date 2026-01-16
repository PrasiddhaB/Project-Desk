"""
Task models for Project Desk.
"""
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError


class Task(models.Model):
    """Task model for task management."""
    
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        IN_PROGRESS = 'in_progress', 'In Progress'
        COMPLETED = 'completed', 'Completed'
    
    class Priority(models.TextChoices):
        LOW = 'low', 'Low'
        MEDIUM = 'medium', 'Medium'
        HIGH = 'high', 'High'
        URGENT = 'urgent', 'Urgent'
    
    id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.MEDIUM
    )
    due_date = models.DateField(blank=True, null=True)
    
    # Relationships
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_tasks'
    )
    assigned_to = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='assigned_tasks',
        blank=True
    )
    
    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'tasks'
        ordering = ['-created_at']
        verbose_name = 'Task'
        verbose_name_plural = 'Tasks'
    
    def __str__(self):
        return self.title
    
    def clean(self):
        """Validate task data."""
        # Due date validation - cannot be in the past for new tasks
        if self.due_date and self.due_date < timezone.now().date():
            if not self.pk:  # Only for new tasks
                raise ValidationError({
                    'due_date': 'Due date cannot be in the past.'
                })
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
    
    @property
    def is_overdue(self):
        """Check if task is overdue."""
        if self.due_date and self.status != self.Status.COMPLETED:
            return self.due_date < timezone.now().date()
        return False
    
    @property
    def assignee_count(self):
        """Get number of assignees."""
        return self.assigned_to.count()
    
    @classmethod
    def get_priority_order(cls):
        """Get priority ordering for sorting."""
        return {
            cls.Priority.URGENT: 1,
            cls.Priority.HIGH: 2,
            cls.Priority.MEDIUM: 3,
            cls.Priority.LOW: 4,
        }
