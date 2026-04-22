"""
Migration: Expand role choices to include 'superadmin', widen the role
column, add is_email_verified, and auto-promote all existing 'admin'
users to 'superadmin' (product-owner tier).

Phase 1 of the role split:
  BEFORE:  admin | employee
  AFTER:   superadmin | admin | employee

Existing 'admin' users represent the original product owner and are
promoted to 'superadmin'. After this migration runs, you can create
new 'admin' (company lead) users through the normal admin UI.
"""
from django.db import migrations, models


def promote_admins_to_superadmin(apps, schema_editor):
    """Promote every existing 'admin' user to 'superadmin'."""
    User = apps.get_model('accounts', 'User')
    # Existing admin accounts become superadmins (product owners).
    User.objects.filter(role='admin').update(role='superadmin')


def demote_superadmins_to_admin(apps, schema_editor):
    """Reverse: move superadmins back to admin."""
    User = apps.get_model('accounts', 'User')
    User.objects.filter(role='superadmin').update(role='admin')


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_profile_pic_last_active'),
    ]

    operations = [
        # Widen the role column first so new values fit.
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(
                choices=[
                    ('superadmin', 'Super Admin'),
                    ('admin', 'Admin'),
                    ('employee', 'Employee'),
                ],
                default='employee',
                max_length=20,
            ),
        ),
        # Add email verification flag.
        migrations.AddField(
            model_name='user',
            name='is_email_verified',
            field=models.BooleanField(default=False),
        ),
        # Promote existing admins to superadmin.
        migrations.RunPython(
            promote_admins_to_superadmin,
            reverse_code=demote_superadmins_to_admin,
        ),
    ]
