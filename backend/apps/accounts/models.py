"""
User model for Project Desk.
"""
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone
import secrets


class UserManager(BaseUserManager):
    """Custom user manager for User model."""
    
    def create_user(self, username, email, password=None, **extra_fields):
        """Create and return a regular user."""
        if not username:
            raise ValueError('Username is required')
        if not email:
            raise ValueError('Email is required')
        
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, username, email, password=None, **extra_fields):
        """Create and return a superuser (superadmin)."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        # Django superuser => Project Desk superadmin (product owner)
        extra_fields.setdefault('role', 'superadmin')
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(username, email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User model for Project Desk.

    Role hierarchy:
      - superadmin: Product owner (Project Desk). Manages plans, global
                    subscriptions, payment config. Does not need a
                    subscription. Typically only one.
      - admin:      Company / project lead. Manages their company's users,
                    projects, tasks, notes, support, etc. Needs a
                    subscription just like an employee. Cannot manage
                    plans or global subscriptions.
      - employee:   Regular user. Needs a subscription. Limited scope.
    """
    
    class Role(models.TextChoices):
        SUPERADMIN = 'superadmin', 'Super Admin'
        ADMIN = 'admin', 'Admin'
        EMPLOYEE = 'employee', 'Employee'
    
    id = models.AutoField(primary_key=True)
    full_name = models.CharField(max_length=100)
    username = models.CharField(max_length=50, unique=True)
    email = models.EmailField(max_length=100, unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    password = models.CharField(max_length=255)
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.EMPLOYEE
    )
    profile_pic = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    
    # Django auth fields
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    
    # Onboarding
    is_welcomed = models.BooleanField(default=False)
    
    # Email verification (Phase 2 - field added now so migration is stable)
    is_email_verified = models.BooleanField(default=False)
    
    # Online status tracking
    last_active = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email', 'full_name']
    
    class Meta:
        db_table = 'users'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.username
    
    # ----- Role helpers -----
    # Semantics:
    #   is_superadmin -> ONLY superadmin (product owner).
    #   is_admin      -> admin OR superadmin (has elevated privileges).
    #                    Preserves backward compatibility for existing
    #                    `user.is_admin`-style checks throughout the app.
    #   is_manager    -> ONLY the middle 'admin' role (company lead).
    #   is_employee   -> ONLY employee.
    
    @property
    def is_superadmin(self):
        return self.role == self.Role.SUPERADMIN
    
    @property
    def is_admin(self):
        """True for both admin and superadmin (elevated privileges)."""
        return self.role in (self.Role.ADMIN, self.Role.SUPERADMIN)
    
    @property
    def is_manager(self):
        """True ONLY for the middle 'admin' role (company lead)."""
        return self.role == self.Role.ADMIN
    
    @property
    def is_employee(self):
        return self.role == self.Role.EMPLOYEE
    
    @property
    def needs_subscription(self):
        """Admin and employee need a paid subscription. Superadmin does not."""
        return self.role in (self.Role.ADMIN, self.Role.EMPLOYEE)
    
    @property
    def is_online(self):
        """User is online if active within last 5 minutes."""
        if self.last_active:
            from datetime import timedelta
            return (timezone.now() - self.last_active) < timedelta(minutes=5)
        return False
    
    @property
    def profile_pic_url(self):
        """Get profile picture URL."""
        if self.profile_pic:
            return self.profile_pic.url
        return None


class SecurityQuestion(models.Model):
    """Security questions for password recovery (legacy flow kept)."""
    
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='security_questions'
    )
    question = models.CharField(max_length=255)
    answer = models.CharField(max_length=255)  # Store hashed
    
    class Meta:
        db_table = 'security_questions'
    
    def __str__(self):
        return f"{self.user.username} - {self.question}"


class PasswordResetToken(models.Model):
    """Token for password reset via security questions (legacy)."""
    
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='password_reset_tokens'
    )
    token = models.CharField(max_length=255, unique=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'password_reset_tokens'
    
    def __str__(self):
        return f"Reset token for {self.user.username}"
    
    @classmethod
    def create_token(cls, user):
        """Create a new password reset token."""
        from datetime import timedelta
        token = secrets.token_urlsafe(32)
        expires_at = timezone.now() + timedelta(hours=1)
        return cls.objects.create(
            user=user,
            token=token,
            expires_at=expires_at
        )
    
    @property
    def is_valid(self):
        """Check if token is still valid."""
        return not self.used and self.expires_at > timezone.now()


# ---------------------------------------------------------------------------
# Email verification (6-digit code, Gmail-style)
# ---------------------------------------------------------------------------

def _generate_6_digit_code() -> str:
    """Generate a cryptographically secure 6-digit numeric code."""
    # secrets.randbelow avoids the modulo bias of random.randint.
    return f"{secrets.randbelow(1_000_000):06d}"


class EmailVerificationCode(models.Model):
    """
    6-digit OTP emailed to a user to verify their email address.

    Created on registration and on first login with an unverified
    email. Codes expire after 10 minutes. Each resend invalidates
    previous unused codes for the same user.
    """

    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='email_verification_codes',
    )
    code = models.CharField(max_length=6)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    attempts = models.IntegerField(default=0)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'email_verification_codes'
        ordering = ['-created_at']

    def __str__(self):
        return f"EmailVerify {self.user.username} ({'used' if self.used else 'pending'})"

    @classmethod
    def issue_for(cls, user):
        """
        Invalidate any existing unused codes for this user and create
        a fresh one, returning the new instance.
        """
        from datetime import timedelta
        cls.objects.filter(user=user, used=False).update(used=True)
        return cls.objects.create(
            user=user,
            code=_generate_6_digit_code(),
            expires_at=timezone.now() + timedelta(minutes=10),
        )

    @property
    def is_valid(self):
        return (
            not self.used
            and self.attempts < 5
            and self.expires_at > timezone.now()
        )


# ---------------------------------------------------------------------------
# Password reset (6-digit code emailed to user)
# ---------------------------------------------------------------------------

class PasswordResetCode(models.Model):
    """
    6-digit OTP emailed to a user to reset their password.

    Created when the user submits the "Forgot Password" form.
    Codes expire after 15 minutes. Each new request invalidates
    previous unused codes for the same user.
    """

    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='password_reset_codes',
    )
    code = models.CharField(max_length=6)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    attempts = models.IntegerField(default=0)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'password_reset_codes'
        ordering = ['-created_at']

    def __str__(self):
        return f"PwdReset {self.user.username} ({'used' if self.used else 'pending'})"

    @classmethod
    def issue_for(cls, user):
        from datetime import timedelta
        cls.objects.filter(user=user, used=False).update(used=True)
        return cls.objects.create(
            user=user,
            code=_generate_6_digit_code(),
            expires_at=timezone.now() + timedelta(minutes=15),
        )

    @property
    def is_valid(self):
        return (
            not self.used
            and self.attempts < 5
            and self.expires_at > timezone.now()
        )
