"""
Project models.
"""
from django.db import models
from django.conf import settings
from django.utils import timezone


class Project(models.Model):
    """Project model - groups tasks and team members."""
    
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        ON_HOLD = 'on_hold', 'On Hold'
        COMPLETED = 'completed', 'Completed'
        ARCHIVED = 'archived', 'Archived'
    
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE
    )
    
    # Project owner/creator (Admin)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_projects'
    )
    
    # Team members (can be multiple)
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='projects',
        blank=True
    )
    
    # Dates
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'projects'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name
    
    @property
    def member_count(self):
        return self.members.count()
    
    @property
    def task_count(self):
        return self.tasks.count()
    
    @property
    def completed_task_count(self):
        return self.tasks.filter(status='completed').count()
    
    @property
    def progress_percentage(self):
        total = self.task_count
        if total == 0:
            return 0
        return int((self.completed_task_count / total) * 100)
