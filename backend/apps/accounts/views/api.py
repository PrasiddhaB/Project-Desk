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
from django.utils import timezone

from apps.accounts.serializers import (
    RegisterRequestSerializer,
    LoginRequestSerializer,
    UserResponseSerializer,
    AuthResponseSerializer
)
from apps.accounts.services import AuthService
from apps.accounts.services.email_service import (
    send_verification_code,
    send_password_reset_code,
)
from apps.accounts.models import (
    User,
    SecurityQuestion,
    PasswordResetToken,
    EmailVerificationCode,
    PasswordResetCode,
)


class RegisterView(APIView):
    """
    API endpoint for user registration.
    
    POST /api/auth/register/

    Always sends a 6-digit verification code to the new user's email.
    The account is created immediately (soft gate) - the user can log
    in but `is_email_verified` stays False until they verify the code.
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
            
            # Issue and email a 6-digit verification code.
            code_obj = EmailVerificationCode.issue_for(user)
            send_verification_code(user, code_obj.code)
            
            # Activity log
            from apps.common.utils import log_activity
            log_activity(
                user=user,
                action='user_registered',
                description=f'{user.full_name or user.username} registered a new account',
                target_type='user', target_id=user.id,
            )
            
            auth_data = AuthService.get_auth_response(user)
            response_serializer = AuthResponseSerializer(auth_data)
            payload = response_serializer.data
            # Surface the unverified state so the frontend can route
            # straight to the verify-email page.
            payload['email_verification_required'] = True
            
            return Response(
                {
                    'success': True,
                    'message': 'Registration successful. A verification code has been emailed to you.',
                    'data': payload,
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

    Soft-gate behavior: unverified-email users can still log in (so
    the frontend can show them the verify screen). If the email is
    unverified, a fresh 6-digit code is emailed and the response
    includes `email_verification_required: True`.
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
            payload = response_serializer.data
            
            # Activity log: login
            from apps.common.utils import log_activity
            log_activity(
                user=user,
                action='user_login',
                description=f'{user.full_name or user.username} logged in',
                target_type='user', target_id=user.id,
            )
            
            # If the user's email is unverified, issue a code so the
            # frontend can prompt them for it. Superadmin is exempt -
            # the original product-owner account shouldn't be locked
            # out by a verification loop.
            needs_verify = (
                not user.is_email_verified
                and user.role != 'superadmin'
            )
            if needs_verify:
                code_obj = EmailVerificationCode.issue_for(user)
                send_verification_code(user, code_obj.code)
            
            payload['email_verification_required'] = needs_verify
            
            return Response(
                {
                    'success': True,
                    'message': 'Login successful',
                    'data': payload,
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
        
        if user.role in ('admin', 'superadmin'):
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
        
        from apps.common.utils import log_activity
        log_activity(
            user=user, action='profile_updated',
            description=f'{user.full_name or user.username} updated their profile',
            target_type='user', target_id=user.id,
        )
        
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
        if request.user.role not in ('admin', 'superadmin'):
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
        if request.user.role not in ('admin', 'superadmin'):
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
        if request.user.role not in ('admin', 'superadmin'):
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
    
    def patch(self, request, pk):
        """PATCH behaves the same as PUT - partial update."""
        return self.put(request, pk)
    
    def delete(self, request, pk):
        if request.user.role not in ('admin', 'superadmin'):
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
        if request.user.role not in ('admin', 'superadmin'):
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
        
        if user.role in ('admin', 'superadmin'):
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
        try:
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
        except Exception:
            return Response({
                'success': True,
                'count': 0,
                'data': []
            })
    
    def post(self, request):
        if request.user.role not in ('admin', 'superadmin'):
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
        if request.user.role not in ('admin', 'superadmin'):
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
        if request.user.role not in ('admin', 'superadmin'):
            return Response({'success': False, 'message': 'Admin only'}, status=status.HTTP_403_FORBIDDEN)
        
        from apps.accounts.team_models import Team
        try:
            team = Team.objects.get(pk=pk)
        except Team.DoesNotExist:
            return Response({'success': False, 'message': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        
        team.delete()
        return Response({'success': True, 'message': 'Team deleted'})


# ===========================================================================
# EMAIL VERIFICATION (Phase 2)
# ===========================================================================

class VerifyEmailView(APIView):
    """
    Verify a 6-digit email verification code.

    POST /api/auth/verify-email/
    Body: {"code": "123456"}

    Authenticated endpoint - the user is identified by their JWT.
    On success, sets `is_email_verified=True`.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        code = str(request.data.get('code', '')).strip()
        if not code or not code.isdigit() or len(code) != 6:
            return Response(
                {'success': False, 'message': 'A 6-digit code is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user
        if user.is_email_verified:
            return Response(
                {'success': True, 'message': 'Email already verified'},
                status=status.HTTP_200_OK,
            )

        # Find the most recent unused code for this user.
        code_obj = (
            EmailVerificationCode.objects
            .filter(user=user, used=False)
            .order_by('-created_at')
            .first()
        )
        if not code_obj:
            return Response(
                {
                    'success': False,
                    'message': 'No active verification code. Please request a new one.',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Expired
        if code_obj.expires_at < timezone.now():
            return Response(
                {
                    'success': False,
                    'message': 'Verification code expired. Please request a new one.',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Too many attempts
        if code_obj.attempts >= 5:
            code_obj.used = True
            code_obj.save(update_fields=['used'])
            return Response(
                {
                    'success': False,
                    'message': 'Too many incorrect attempts. Please request a new code.',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Incorrect code
        if code_obj.code != code:
            code_obj.attempts += 1
            code_obj.save(update_fields=['attempts'])
            remaining = max(0, 5 - code_obj.attempts)
            return Response(
                {
                    'success': False,
                    'message': f'Incorrect code. {remaining} attempt(s) remaining.',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Success
        code_obj.used = True
        code_obj.save(update_fields=['used'])
        user.is_email_verified = True
        user.save(update_fields=['is_email_verified'])

        return Response(
            {
                'success': True,
                'message': 'Email verified successfully',
                'data': UserResponseSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


class ResendVerificationCodeView(APIView):
    """
    Resend the email verification code.

    POST /api/auth/resend-verification/

    Rate-limited to one fresh code every 60 seconds per user.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.is_email_verified:
            return Response(
                {'success': True, 'message': 'Email already verified'},
                status=status.HTTP_200_OK,
            )

        # Cooldown: if the most recent code was issued < 60s ago, block.
        from datetime import timedelta
        latest = (
            EmailVerificationCode.objects
            .filter(user=user)
            .order_by('-created_at')
            .first()
        )
        if latest and latest.created_at > timezone.now() - timedelta(seconds=60):
            wait = 60 - int((timezone.now() - latest.created_at).total_seconds())
            return Response(
                {
                    'success': False,
                    'message': f'Please wait {wait} seconds before requesting another code.',
                    'retry_after_seconds': wait,
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        code_obj = EmailVerificationCode.issue_for(user)
        sent = send_verification_code(user, code_obj.code)
        return Response(
            {
                'success': True,
                'message': (
                    'A new verification code has been sent to your email.'
                    if sent else
                    'Verification code generated (email delivery may have failed; check server logs).'
                ),
            },
            status=status.HTTP_200_OK,
        )


# ===========================================================================
# FORGOT PASSWORD (Phase 2 - email-based with 6-digit code)
# ===========================================================================

class ForgotPasswordEmailView(APIView):
    """
    Initiate password reset via email.

    POST /api/auth/forgot-password-email/
    Body: {"email": "user@example.com"}

    Always returns 200 whether or not the email exists, to avoid
    leaking account presence (standard security practice).
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = str(request.data.get('email', '')).strip().lower()
        if not email:
            return Response(
                {'success': False, 'message': 'Email is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(email__iexact=email).first()
        if user:
            # Enforce a 60-second cooldown.
            from datetime import timedelta
            latest = (
                PasswordResetCode.objects
                .filter(user=user)
                .order_by('-created_at')
                .first()
            )
            cooldown_ok = (
                not latest
                or latest.created_at <= timezone.now() - timedelta(seconds=60)
            )
            if cooldown_ok:
                code_obj = PasswordResetCode.issue_for(user)
                send_password_reset_code(user, code_obj.code)

        # Always a positive response (don't leak whether the email is registered).
        return Response(
            {
                'success': True,
                'message': (
                    'If an account with that email exists, a reset code has been sent. '
                    'Please check your inbox (and spam folder).'
                ),
            },
            status=status.HTTP_200_OK,
        )


class ResetPasswordEmailView(APIView):
    """
    Complete password reset with email + code + new password.

    POST /api/auth/reset-password-email/
    Body: {
        "email": "user@example.com",
        "code": "123456",
        "new_password": "newpass"
    }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = str(request.data.get('email', '')).strip().lower()
        code = str(request.data.get('code', '')).strip()
        new_password = request.data.get('new_password', '')

        if not email or not code or not new_password:
            return Response(
                {
                    'success': False,
                    'message': 'Email, code, and new password are required.',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not code.isdigit() or len(code) != 6:
            return Response(
                {'success': False, 'message': 'Code must be 6 digits.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(new_password) < 6:
            return Response(
                {
                    'success': False,
                    'message': 'Password must be at least 6 characters.',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            return Response(
                {'success': False, 'message': 'Invalid email or code.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        code_obj = (
            PasswordResetCode.objects
            .filter(user=user, used=False)
            .order_by('-created_at')
            .first()
        )
        if not code_obj:
            return Response(
                {
                    'success': False,
                    'message': 'No active reset code. Please request a new one.',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if code_obj.expires_at < timezone.now():
            return Response(
                {
                    'success': False,
                    'message': 'Reset code expired. Please request a new one.',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if code_obj.attempts >= 5:
            code_obj.used = True
            code_obj.save(update_fields=['used'])
            return Response(
                {
                    'success': False,
                    'message': 'Too many incorrect attempts. Please request a new code.',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if code_obj.code != code:
            code_obj.attempts += 1
            code_obj.save(update_fields=['attempts'])
            remaining = max(0, 5 - code_obj.attempts)
            return Response(
                {
                    'success': False,
                    'message': f'Incorrect code. {remaining} attempt(s) remaining.',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Success - reset the password.
        user.set_password(new_password)
        # Resetting via email is itself a form of verification.
        if not user.is_email_verified:
            user.is_email_verified = True
        user.save()

        code_obj.used = True
        code_obj.save(update_fields=['used'])

        return Response(
            {
                'success': True,
                'message': 'Password has been reset. You can now log in with your new password.',
            },
            status=status.HTTP_200_OK,
        )
