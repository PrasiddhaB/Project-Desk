"""
Migration: Add color field to Note model.
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('notes', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='note',
            name='color',
            field=models.CharField(blank=True, default=None, max_length=20, null=True),
        ),
    ]
