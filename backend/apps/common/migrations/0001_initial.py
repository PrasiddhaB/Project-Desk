"""
Migration for ActivityLog model.
"""
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ActivityLog',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('action', models.CharField(choices=[
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
                ], max_length=50)),
                ('description', models.TextField()),
                ('target_type', models.CharField(blank=True, max_length=50, null=True)),
                ('target_id', models.IntegerField(blank=True, null=True)),
                ('metadata', models.JSONField(blank=True, null=True)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='activity_logs', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'activity_logs',
                'ordering': ['-created_at'],
            },
        ),
    ]
