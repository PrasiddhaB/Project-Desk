"""
URL patterns for accounts app.
"""
from django.urls import path
from apps.accounts.views import (
    RegisterView,
    LoginView,
    LogoutView,
    MeView,
    CustomTokenRefreshView,
    UsersListView,
    DashboardView,
    ProfileUpdateView,
    MarkWelcomedView,
    SecurityQuestionsView,
    ForgotPasswordView,
    VerifySecurityAnswersView,
    ResetPasswordView,
    AdminUserListView,
    AdminUserDetailView,
    AdminCreateUserView,
    ProfilePicUploadView,
    TeamView,
    ActivityLogView,
    TeamListCreateView,
    TeamDetailView,
    VerifyEmailView,
    ResendVerificationCodeView,
    ForgotPasswordEmailView,
    ResetPasswordEmailView,
)

app_name = 'accounts'

urlpatterns = [
    # Auth
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', MeView.as_view(), name='me'),
    path('token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    
    # Email verification (Phase 2)
    path('verify-email/', VerifyEmailView.as_view(), name='verify_email'),
    path('resend-verification/', ResendVerificationCodeView.as_view(), name='resend_verification'),
    
    # Forgot password via email (Phase 2)
    path('forgot-password-email/', ForgotPasswordEmailView.as_view(), name='forgot_password_email'),
    path('reset-password-email/', ResetPasswordEmailView.as_view(), name='reset_password_email'),
    
    # Profile
    path('profile/', ProfileUpdateView.as_view(), name='profile'),
    path('profile/picture/', ProfilePicUploadView.as_view(), name='profile_pic'),
    path('mark-welcomed/', MarkWelcomedView.as_view(), name='mark_welcomed'),
    path('security-questions/', SecurityQuestionsView.as_view(), name='security_questions'),
    
    # Legacy: security-question password reset (kept for backward compat)
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot_password'),
    path('verify-security-answers/', VerifySecurityAnswersView.as_view(), name='verify_security_answers'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset_password'),
    
    # Users
    path('users/', UsersListView.as_view(), name='users'),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('team/', TeamView.as_view(), name='team'),
    path('activity-log/', ActivityLogView.as_view(), name='activity_log'),
    
    # Team Groups
    path('teams/', TeamListCreateView.as_view(), name='teams_list'),
    path('teams/<int:pk>/', TeamDetailView.as_view(), name='teams_detail'),
    
    # Admin User Management
    path('admin/users/', AdminUserListView.as_view(), name='admin_users_list'),
    path('admin/users/create/', AdminCreateUserView.as_view(), name='admin_users_create'),
    path('admin/users/<int:pk>/', AdminUserDetailView.as_view(), name='admin_users_detail'),
]
