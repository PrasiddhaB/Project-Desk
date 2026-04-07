"""
Migration: Add profile_pic as ImageField and last_active field.
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_alter_user_groups'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='profile_pic',
            field=models.ImageField(blank=True, null=True, upload_to='profile_pics/'),
        ),
        migrations.AddField(
            model_name='user',
            name='last_active',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
