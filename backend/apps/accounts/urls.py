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
)

app_name = 'accounts'

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', MeView.as_view(), name='me'),
    path('users/', UsersListView.as_view(), name='users'),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('profile/', ProfileUpdateView.as_view(), name='profile'),
    path('token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
]
