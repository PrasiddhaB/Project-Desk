"""
Note models for Project Desk.
"""
from django.db import models
from django.conf import settings
from django.utils import timezone


class Note(models.Model):
    """Note model for notes management."""
    
    class Status(models.TextChoices):
        NOT_STARTED = 'not-started', 'Not Started'
        PENDING = 'pending', 'Pending'
        COMPLETED = 'completed', 'Completed'
    
    id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255)
    content = models.TextField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.NOT_STARTED
    )
    pinned = models.BooleanField(default=False)
    is_private = models.BooleanField(default=True)
    
    # Owner
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notes'
    )
    
    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'notes'
        ordering = ['-pinned', '-updated_at']
        verbose_name = 'Note'
        verbose_name_plural = 'Notes'
    
    def __str__(self):
        return self.title
    
    @property
    def owner_name(self):
        return self.user.full_name


class NoteShare(models.Model):
    """Model for sharing notes between users."""
    
    id = models.AutoField(primary_key=True)
    note = models.ForeignKey(
        Note,
        on_delete=models.CASCADE,
        related_name='shares'
    )
    shared_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notes_shared_by_me'
    )
    shared_with = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notes_shared_with_me'
    )
    can_edit = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'note_shares'
        unique_together = ['note', 'shared_with']
        verbose_name = 'Note Share'
        verbose_name_plural = 'Note Shares'
    
    def __str__(self):
        return f"{self.note.title} shared with {self.shared_with.username}"
