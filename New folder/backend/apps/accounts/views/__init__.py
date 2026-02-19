"""
Accounts views module.
"""
from .api import (
    RegisterView, 
    LoginView, 
    LogoutView, 
    MeView, 
    CustomTokenRefreshView, 
    UsersListView,
    DashboardView,
    ProfileUpdateView,
)

__all__ = [
    'RegisterView',
    'LoginView',
    'LogoutView',
    'MeView',
    'CustomTokenRefreshView',
    'UsersListView',
    'DashboardView',
    'ProfileUpdateView',
]
