"""
API views for authentication.
"""
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from django.contrib.auth.hashers import make_password, check_password

from apps.accounts.serializers import (
    RegisterRequestSerializer,
    LoginRequestSerializer,
    UserResponseSerializer,
    AuthResponseSerializer
)
from apps.accounts.services import AuthService
from apps.accounts.models import User, SecurityQuestion, PasswordResetToken


class RegisterView(APIView):
    """
    API endpoint for user registration.
    
    POST /api/auth/register/
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Handle user registration."""
        serializer = RegisterRequestSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.save()
            
            # Save security questions if provided
            security_questions = request.data.get('security_questions', [])
            for sq in security_questions:
                if sq.get('question') and sq.get('answer'):
                    SecurityQuestion.objects.create(
                        user=user,
                        question=sq['question'],
                        answer=make_password(sq['answer'].lower().strip())
                    )
            
            auth_data = AuthService.get_auth_response(user)
            response_serializer = AuthResponseSerializer(auth_data)
            
            return Response(
                {
                    'success': True,
                    'message': 'Registration successful',
                    'data': response_serializer.data
                },
                status=status.HTTP_201_CREATED
            )
        
        return Response(
            {
                'success': False,
                'message': 'Registration failed',
                'errors': serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )


class LoginView(APIView):
    """
    API endpoint for user login.
    
    POST /api/auth/login/
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Handle user login."""
        serializer = LoginRequestSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            user = serializer.validated_data['user']
            auth_data = AuthService.get_auth_response(user)
            response_serializer = AuthResponseSerializer(auth_data)
            
            return Response(
                {
                    'success': True,
                    'message': 'Login successful',
                    'data': response_serializer.data
                },
                status=status.HTTP_200_OK
            )
        
        return Response(
            {
                'success': False,
                'message': serializer.errors.get('non_field_errors', ['Login failed'])[0],
                'errors': serializer.errors
            },
            status=status.HTTP_401_UNAUTHORIZED
        )


class LogoutView(APIView):
    """
    API endpoint for user logout.
    
    POST /api/auth/logout/
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Handle user logout by blacklisting refresh token."""
        refresh_token = request.data.get('refresh')
        
        if not refresh_token:
            return Response(
                {
                    'success': False,
                    'message': 'Refresh token is required'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        success = AuthService.blacklist_token(refresh_token)
        
        if success:
            return Response(
                {
                    'success': True,
                    'message': 'Logout successful'
                },
                status=status.HTTP_200_OK
            )
        
        return Response(
            {
                'success': False,
                'message': 'Invalid token'
            },
            status=status.HTTP_400_BAD_REQUEST
        )


class MeView(APIView):
    """
    API endpoint for getting current user profile.
    
    GET /api/auth/me/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Return current authenticated user's data."""
        serializer = UserResponseSerializer(request.user)
        
        return Response(
            {
                'success': True,
                'data': serializer.data
            },
            status=status.HTTP_200_OK
        )


class UsersListView(APIView):
    """
    API endpoint for listing users (for task assignment).
    
    GET /api/auth/users/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Return list of active users with search/filter."""
        users = User.objects.filter(is_active=True).order_by('full_name')
        
        # Search filter
        search = request.query_params.get('search', '')
        if search:
            users = users.filter(
                models.Q(full_name__icontains=search) |
                models.Q(username__icontains=search) |
                models.Q(email__icontains=search)
            )
        
        # Role filter
        role = request.query_params.get('role', '')
        if role:
            users = users.filter(role=role)
        
        serializer = UserResponseSerializer(users, many=True)
        
        return Response(
            {
                'success': True,
                'count': users.count(),
                'data': serializer.data
            },
            status=status.HTTP_200_OK
        )


class CustomTokenRefreshView(TokenRefreshView):
    """
    Custom token refresh view with consistent response format.
    
    POST /api/auth/token/refresh/
    """
    
    def post(self, request, *args, **kwargs):
        """Handle token refresh."""
        try:
            response = super().post(request, *args, **kwargs)
            return Response(
                {
                    'success': True,
                    'message': 'Token refreshed successfully',
                    'data': {
                        'tokens': response.data
                    }
                },
                status=status.HTTP_200_OK
            )
        except (TokenError, InvalidToken) as e:
            return Response(
                {
                    'success': False,
                    'message': 'Token is invalid or expired',
                    'errors': {'token': [str(e)]}
                },
                status=status.HTTP_401_UNAUTHORIZED
            )


class DashboardView(APIView):
    """
    Dashboard stats API.
    
    GET /api/auth/dashboard/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from apps.tasks.models import Task
        from apps.notes.models import Note
        from apps.projects.models import Project
        from django.utils import timezone
        
        user = request.user
        today = timezone.now().date()
        
        if user.role == 'admin':
            # Admin sees all stats
            tasks = Task.objects.all()
            notes = Note.objects.all()
            projects = Project.objects.all()
            
            # Get all users count
            total_employees = User.objects.filter(role='employee', is_active=True).count()
        else:
            # Employee sees only their stats
            tasks = Task.objects.filter(assigned_to=user)
            notes = Note.objects.filter(user=user)
            projects = Project.objects.filter(members=user)
            total_employees = 0
        
        stats = {
            'tasks': {
                'total': tasks.count(),
                'pending': tasks.filter(status='pending').count(),
                'in_progress': tasks.filter(status='in_progress').count(),
                'completed': tasks.filter(status='completed').count(),
                'overdue': tasks.filter(due_date__lt=today).exclude(status='completed').count(),
                'due_today': tasks.filter(due_date=today).count(),
            },
            'notes': {
                'total': notes.count(),
                'private': notes.filter(is_private=True).count(),
                'shared': notes.filter(is_private=False).count(),
            },
            'projects': {
                'total': projects.count(),
                'active': projects.filter(status='active').count(),
                'completed': projects.filter(status='completed').count(),
            },
            'total_employees': total_employees,
        }
        
        # Add recent tasks
        recent_tasks = tasks.order_by('-created_at')[:5]
        stats['recent_tasks'] = [
            {
                'id': t.id,
                'title': t.title,
                'status': t.status,
                'priority': t.priority,
                'due_date': str(t.due_date) if t.due_date else None,
            }
            for t in recent_tasks
        ]
        
        return Response({
            'success': True,
            'data': stats
        })


class ProfileUpdateView(APIView):
    """
    Update user profile.
    
    PUT /api/auth/profile/
    """
    permission_classes = [IsAuthenticated]
    
    def put(self, request):
        user = request.user
        data = request.data
        
        # Update allowed fields
        if 'full_name' in data:
            user.full_name = data['full_name']
        if 'email' in data:
            user.email = data['email']
        if 'phone' in data:
            user.phone = data['phone']
        
        user.save()
        
        serializer = UserResponseSerializer(user)
        return Response({
            'success': True,
            'message': 'Profile updated',
            'data': serializer.data
        })
    
    def patch(self, request):
        return self.put(request)


# ========== WELCOME / ONBOARDING ==========

class MarkWelcomedView(APIView):
    """Mark user as welcomed (onboarding complete)."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        user.is_welcomed = True
        user.save()
        
        return Response({
            'success': True,
            'message': 'Welcome status updated'
        })


# ========== SECURITY QUESTIONS ==========

class SecurityQuestionsView(APIView):
    """Manage security questions."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get user's security questions (without answers)."""
        questions = SecurityQuestion.objects.filter(user=request.user)
        data = [{'id': q.id, 'question': q.question} for q in questions]
        
        return Response({
            'success': True,
            'data': data
        })
    
    def post(self, request):
        """Set/update security questions."""
        questions = request.data.get('questions', [])
        
        if len(questions) < 2:
            return Response({
                'success': False,
                'message': 'At least 2 security questions required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Delete old questions
        SecurityQuestion.objects.filter(user=request.user).delete()
        
        # Create new questions
        for q in questions:
            if q.get('question') and q.get('answer'):
                SecurityQuestion.objects.create(
                    user=request.user,
                    question=q['question'],
                    answer=make_password(q['answer'].lower().strip())
                )
        
        return Response({
            'success': True,
            'message': 'Security questions updated'
        })


# ========== PASSWORD RESET ==========

class ForgotPasswordView(APIView):
    """Initiate password reset via security questions."""
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Step 1: Get security questions for email."""
        email = request.data.get('email')
        
        if not email:
            return Response({
                'success': False,
                'message': 'Email is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({
                'success': False,
                'message': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        questions = SecurityQuestion.objects.filter(user=user)
        if not questions.exists():
            return Response({
                'success': False,
                'message': 'No security questions set for this account'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        data = [{'id': q.id, 'question': q.question} for q in questions]
        
        return Response({
            'success': True,
            'user_id': user.id,
            'questions': data
        })


class VerifySecurityAnswersView(APIView):
    """Verify security question answers."""
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Step 2: Verify answers and get reset token."""
        user_id = request.data.get('user_id')
        answers = request.data.get('answers', [])  # [{id, answer}, ...]
        
        if not user_id or not answers:
            return Response({
                'success': False,
                'message': 'User ID and answers required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({
                'success': False,
                'message': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Verify all answers
        for answer in answers:
            try:
                question = SecurityQuestion.objects.get(id=answer['id'], user=user)
                if not check_password(answer['answer'].lower().strip(), question.answer):
                    return Response({
                        'success': False,
                        'message': 'Incorrect answer'
                    }, status=status.HTTP_400_BAD_REQUEST)
            except SecurityQuestion.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'Invalid question'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate reset token
        token = PasswordResetToken.create_token(user)
        
        return Response({
            'success': True,
            'message': 'Answers verified',
            'reset_token': token.token
        })


class ResetPasswordView(APIView):
    """Reset password with token."""
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Step 3: Reset password with token."""
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        
        if not token or not new_password:
            return Response({
                'success': False,
                'message': 'Token and new password required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if len(new_password) < 6:
            return Response({
                'success': False,
                'message': 'Password must be at least 6 characters'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            reset_token = PasswordResetToken.objects.get(token=token)
        except PasswordResetToken.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Invalid token'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not reset_token.is_valid:
            return Response({
                'success': False,
                'message': 'Token expired or already used'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Reset password
        user = reset_token.user
        user.set_password(new_password)
        user.save()
        
        # Mark token as used
        reset_token.used = True
        reset_token.save()
        
        return Response({
            'success': True,
            'message': 'Password reset successful'
        })


# ========== ADMIN USER MANAGEMENT ==========

class AdminUserListView(APIView):
    """Admin: List all users with search/filter."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        if request.user.role != 'admin':
            return Response({
                'success': False,
                'message': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)
        
        users = User.objects.all().order_by('-created_at')
        
        # Search
        search = request.query_params.get('search', '')
        if search:
            from django.db.models import Q
            users = users.filter(
                Q(full_name__icontains=search) |
                Q(username__icontains=search) |
                Q(email__icontains=search)
            )
        
        # Role filter
        role = request.query_params.get('role', '')
        if role:
            users = users.filter(role=role)
        
        # Active filter
        is_active = request.query_params.get('is_active', '')
        if is_active:
            users = users.filter(is_active=is_active == 'true')
        
        serializer = UserResponseSerializer(users, many=True)
        
        return Response({
            'success': True,
            'count': users.count(),
            'data': serializer.data
        })


class AdminUserDetailView(APIView):
    """Admin: Get/Update/Delete single user."""
    permission_classes = [IsAuthenticated]
    
    def get_user(self, pk):
        try:
            return User.objects.get(pk=pk)
        except User.DoesNotExist:
            return None
    
    def get(self, request, pk):
        if request.user.role != 'admin':
            return Response({
                'success': False,
                'message': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)
        
        user = self.get_user(pk)
        if not user:
            return Response({
                'success': False,
                'message': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        serializer = UserResponseSerializer(user)
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    def put(self, request, pk):
        if request.user.role != 'admin':
            return Response({
                'success': False,
                'message': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)
        
        user = self.get_user(pk)
        if not user:
            return Response({
                'success': False,
                'message': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        data = request.data
        
        # Update fields
        if 'full_name' in data:
            user.full_name = data['full_name']
        if 'email' in data:
            user.email = data['email']
        if 'phone' in data:
            user.phone = data['phone']
        if 'role' in data:
            user.role = data['role']
        if 'is_active' in data:
            user.is_active = data['is_active']
        if 'password' in data and data['password']:
            user.set_password(data['password'])
        
        user.save()
        
        serializer = UserResponseSerializer(user)
        return Response({
            'success': True,
            'message': 'User updated',
            'data': serializer.data
        })
    
    def delete(self, request, pk):
        if request.user.role != 'admin':
            return Response({
                'success': False,
                'message': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)
        
        user = self.get_user(pk)
        if not user:
            return Response({
                'success': False,
                'message': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Prevent self-deletion
        if user.id == request.user.id:
            return Response({
                'success': False,
                'message': 'Cannot delete yourself'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        username = user.username
        user.delete()
        
        return Response({
            'success': True,
            'message': f'User {username} deleted'
        })


class AdminCreateUserView(APIView):
    """Admin: Create new user."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        if request.user.role != 'admin':
            return Response({
                'success': False,
                'message': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data
        
        # Validate required fields
        required = ['username', 'email', 'password', 'full_name']
        for field in required:
            if not data.get(field):
                return Response({
                    'success': False,
                    'message': f'{field} is required'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check unique constraints
        if User.objects.filter(username=data['username']).exists():
            return Response({
                'success': False,
                'message': 'Username already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(email=data['email']).exists():
            return Response({
                'success': False,
                'message': 'Email already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create user
        user = User.objects.create_user(
            username=data['username'],
            email=data['email'],
            password=data['password'],
            full_name=data['full_name'],
            phone=data.get('phone', ''),
            role=data.get('role', 'employee'),
        )
        
        serializer = UserResponseSerializer(user)
        return Response({
            'success': True,
            'message': 'User created',
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)


# ========== PROFILE PICTURE UPLOAD ==========

class ProfilePicUploadView(APIView):
    """Upload profile picture."""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        file = request.FILES.get('profile_pic')
        if not file:
            return Response({
                'success': False,
                'message': 'No file provided'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if file.content_type not in allowed_types:
            return Response({
                'success': False,
                'message': 'Invalid file type. Use JPEG, PNG, GIF, or WebP.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate file size (max 5MB)
        if file.size > 5 * 1024 * 1024:
            return Response({
                'success': False,
                'message': 'File too large. Max 5MB.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Delete old profile pic
        user = request.user
        if user.profile_pic:
            user.profile_pic.delete(save=False)
        
        user.profile_pic = file
        user.save()
        
        serializer = UserResponseSerializer(user)
        return Response({
            'success': True,
            'message': 'Profile picture updated',
            'data': serializer.data
        })
    
    def delete(self, request):
        """Remove profile picture."""
        user = request.user
        if user.profile_pic:
            user.profile_pic.delete(save=False)
            user.profile_pic = None
            user.save()
        
        serializer = UserResponseSerializer(user)
        return Response({
            'success': True,
            'message': 'Profile picture removed',
            'data': serializer.data
        })


# ========== TEAM PAGE ==========

class TeamView(APIView):
    """Get team members with online status."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        users = User.objects.filter(is_active=True).order_by('full_name')
        
        # Search filter
        search = request.query_params.get('search', '')
        if search:
            from django.db.models import Q
            users = users.filter(
                Q(full_name__icontains=search) |
                Q(username__icontains=search) |
                Q(email__icontains=search)
            )
        
        # Role filter
        role = request.query_params.get('role', '')
        if role:
            users = users.filter(role=role)
        
        serializer = UserResponseSerializer(users, many=True)
        
        online_count = sum(1 for u in users if u.is_online)
        
        return Response({
            'success': True,
            'count': users.count(),
            'online_count': online_count,
            'data': serializer.data
        })


# ========== ACTIVITY LOG ==========

class ActivityLogView(APIView):
    """Get activity log for the user or all (admin)."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from apps.common.models import ActivityLog
        
        user = request.user
        
        if user.role == 'admin':
            logs = ActivityLog.objects.all()
        else:
            logs = ActivityLog.objects.filter(user=user)
        
        # Filter by action type
        action_type = request.query_params.get('action', '')
        if action_type:
            logs = logs.filter(action=action_type)
        
        # Limit
        limit = int(request.query_params.get('limit', 50))
        logs = logs[:limit]
        
        data = []
        for log in logs:
            data.append({
                'id': log.id,
                'user_id': log.user_id,
                'user_name': log.user.full_name if log.user else 'System',
                'user_username': log.user.username if log.user else 'system',
                'action': log.action,
                'description': log.description,
                'target_type': log.target_type,
                'target_id': log.target_id,
                'metadata': log.metadata,
                'created_at': log.created_at.isoformat(),
            })
        
        return Response({
            'success': True,
            'count': len(data),
            'data': data
        })


# ========== TEAMS ==========

class TeamListCreateView(APIView):
    """List all teams or create a new team (admin only)."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from apps.accounts.team_models import Team
        teams = Team.objects.prefetch_related('members').all()
        
        data = []
        for team in teams:
            members = team.members.all()
            data.append({
                'id': team.id,
                'name': team.name,
                'description': team.description,
                'color': team.color,
                'member_count': members.count(),
                'members': [
                    {
                        'id': m.id,
                        'full_name': m.full_name,
                        'username': m.username,
                        'profile_pic_url': m.profile_pic_url,
                        'is_online': m.is_online,
                    }
                    for m in members[:10]
                ],
                'created_at': team.created_at.isoformat(),
            })
        
        return Response({
            'success': True,
            'count': len(data),
            'data': data
        })
    
    def post(self, request):
        if request.user.role != 'admin':
            return Response({'success': False, 'message': 'Admin only'}, status=status.HTTP_403_FORBIDDEN)
        
        from apps.accounts.team_models import Team
        name = request.data.get('name', '').strip()
        if not name:
            return Response({'success': False, 'message': 'Name required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if Team.objects.filter(name__iexact=name).exists():
            return Response({'success': False, 'message': 'Team name already exists'}, status=status.HTTP_400_BAD_REQUEST)
        
        team = Team.objects.create(
            name=name,
            description=request.data.get('description', ''),
            color=request.data.get('color', 'blue'),
            created_by=request.user,
        )
        
        member_ids = request.data.get('member_ids', [])
        if member_ids:
            team.members.set(member_ids)
        
        return Response({
            'success': True,
            'message': f'Team "{name}" created',
            'data': {'id': team.id, 'name': team.name}
        }, status=status.HTTP_201_CREATED)


class TeamDetailView(APIView):
    """Get/Update/Delete a team."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        from apps.accounts.team_models import Team
        try:
            team = Team.objects.prefetch_related('members').get(pk=pk)
        except Team.DoesNotExist:
            return Response({'success': False, 'message': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        
        members = team.members.all()
        return Response({
            'success': True,
            'data': {
                'id': team.id,
                'name': team.name,
                'description': team.description,
                'color': team.color,
                'members': [
                    {'id': m.id, 'full_name': m.full_name, 'username': m.username, 'profile_pic_url': m.profile_pic_url, 'is_online': m.is_online}
                    for m in members
                ],
            }
        })
    
    def put(self, request, pk):
        if request.user.role != 'admin':
            return Response({'success': False, 'message': 'Admin only'}, status=status.HTTP_403_FORBIDDEN)
        
        from apps.accounts.team_models import Team
        try:
            team = Team.objects.get(pk=pk)
        except Team.DoesNotExist:
            return Response({'success': False, 'message': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if 'name' in request.data:
            team.name = request.data['name']
        if 'description' in request.data:
            team.description = request.data['description']
        if 'color' in request.data:
            team.color = request.data['color']
        team.save()
        
        if 'member_ids' in request.data:
            team.members.set(request.data['member_ids'])
        
        return Response({'success': True, 'message': 'Team updated'})
    
    def delete(self, request, pk):
        if request.user.role != 'admin':
            return Response({'success': False, 'message': 'Admin only'}, status=status.HTTP_403_FORBIDDEN)
        
        from apps.accounts.team_models import Team
        try:
            team = Team.objects.get(pk=pk)
        except Team.DoesNotExist:
            return Response({'success': False, 'message': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        
        team.delete()
        return Response({'success': True, 'message': 'Team deleted'})
