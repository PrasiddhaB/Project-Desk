"""
URL configuration for Project Desk.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/tasks/', include('apps.tasks.urls')),
    path('api/notes/', include('apps.notes.urls')),
    path('api/support/', include('apps.support.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/projects/', include('apps.projects.urls')),
    path('api/billing/', include('apps.payments.urls')),
    path('api/calendar/', include('apps.calendar.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
