"""
Migration: Add EmailVerificationCode and PasswordResetCode tables.

These back the Phase 2 OTP flows (Gmail-style 6-digit codes) for:
  - Email verification on registration / unverified-login
  - Forgot password reset
"""
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0004_role_split_and_email_verification'),
    ]

    operations = [
        migrations.CreateModel(
            name='EmailVerificationCode',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('code', models.CharField(max_length=6)),
                ('expires_at', models.DateTimeField()),
                ('used', models.BooleanField(default=False)),
                ('attempts', models.IntegerField(default=0)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='email_verification_codes',
                    to='accounts.user',
                )),
            ],
            options={
                'db_table': 'email_verification_codes',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='PasswordResetCode',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('code', models.CharField(max_length=6)),
                ('expires_at', models.DateTimeField()),
                ('used', models.BooleanField(default=False)),
                ('attempts', models.IntegerField(default=0)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='password_reset_codes',
                    to='accounts.user',
                )),
            ],
            options={
                'db_table': 'password_reset_codes',
                'ordering': ['-created_at'],
            },
        ),
    ]
