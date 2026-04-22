"""
Email service for Project Desk.

In development (EMAIL_BACKEND=console.EmailBackend) the emails print
to the Django runserver console so you can test the full flow without
SMTP credentials.

In production, set in your .env:
    EMAIL_HOST=smtp.gmail.com
    EMAIL_PORT=587
    EMAIL_HOST_USER=you@gmail.com
    EMAIL_HOST_PASSWORD=<16-char Gmail App Password>
    EMAIL_USE_TLS=True
    DEFAULT_FROM_EMAIL="Project Desk <you@gmail.com>"
"""
from __future__ import annotations

import logging
from django.conf import settings
from django.core.mail import EmailMultiAlternatives

logger = logging.getLogger(__name__)


def _from_address() -> str:
    return (
        getattr(settings, 'DEFAULT_FROM_EMAIL', None)
        or 'Project Desk <noreply@projectdesk.local>'
    )


def _send(subject: str, to_email: str, text_body: str, html_body: str) -> bool:
    """Send an email with both plain text and HTML parts. Returns True on success."""
    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_body,
            from_email=_from_address(),
            to=[to_email],
        )
        msg.attach_alternative(html_body, 'text/html')
        msg.send(fail_silently=False)
        return True
    except Exception as exc:  # noqa: BLE001
        logger.error('Email send failed to %s: %s', to_email, exc)
        return False


def send_verification_code(user, code: str) -> bool:
    """Send the email-verification 6-digit code."""
    subject = 'Verify your Project Desk email'
    text_body = (
        f"Hi {user.full_name or user.username},\n\n"
        f"Your Project Desk email verification code is: {code}\n\n"
        f"This code expires in 10 minutes. If you did not request this, you can ignore this email.\n\n"
        f"— Project Desk"
    )
    html_body = f"""
    <!DOCTYPE html>
    <html><body style="font-family: Arial, sans-serif; background:#f5f6fa; padding:24px;">
      <div style="max-width:480px; margin:0 auto; background:#fff; border-radius:12px; padding:32px; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
        <h2 style="color:#1f2937; margin:0 0 8px;">Verify your email</h2>
        <p style="color:#4b5563; margin:0 0 24px;">Hi {user.full_name or user.username}, use the code below to verify your Project Desk account.</p>
        <div style="background:#eef2ff; color:#4f46e5; font-size:32px; letter-spacing:8px; font-weight:700; text-align:center; padding:18px; border-radius:8px; margin:0 0 24px;">{code}</div>
        <p style="color:#6b7280; font-size:13px; margin:0;">This code expires in <strong>10 minutes</strong>. If you didn't request this, you can safely ignore this email.</p>
        <hr style="border:none; border-top:1px solid #e5e7eb; margin:24px 0;" />
        <p style="color:#9ca3af; font-size:12px; margin:0;">— Project Desk</p>
      </div>
    </body></html>
    """
    return _send(subject, user.email, text_body, html_body)


def send_password_reset_code(user, code: str) -> bool:
    """Send the password-reset 6-digit code."""
    subject = 'Reset your Project Desk password'
    text_body = (
        f"Hi {user.full_name or user.username},\n\n"
        f"Your Project Desk password reset code is: {code}\n\n"
        f"This code expires in 15 minutes. If you did not request a password reset, "
        f"you can ignore this email and your password will stay the same.\n\n"
        f"— Project Desk"
    )
    html_body = f"""
    <!DOCTYPE html>
    <html><body style="font-family: Arial, sans-serif; background:#f5f6fa; padding:24px;">
      <div style="max-width:480px; margin:0 auto; background:#fff; border-radius:12px; padding:32px; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
        <h2 style="color:#1f2937; margin:0 0 8px;">Reset your password</h2>
        <p style="color:#4b5563; margin:0 0 24px;">Hi {user.full_name or user.username}, use the code below to reset your Project Desk password.</p>
        <div style="background:#fff7ed; color:#ea580c; font-size:32px; letter-spacing:8px; font-weight:700; text-align:center; padding:18px; border-radius:8px; margin:0 0 24px;">{code}</div>
        <p style="color:#6b7280; font-size:13px; margin:0 0 8px;">This code expires in <strong>15 minutes</strong>.</p>
        <p style="color:#6b7280; font-size:13px; margin:0;">If you didn't request a password reset, you can safely ignore this email — your password will not be changed.</p>
        <hr style="border:none; border-top:1px solid #e5e7eb; margin:24px 0;" />
        <p style="color:#9ca3af; font-size:12px; margin:0;">— Project Desk</p>
      </div>
    </body></html>
    """
    return _send(subject, user.email, text_body, html_body)
