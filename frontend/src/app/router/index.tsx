/**
 * Application Router - All routes with role-based protection.
 *
 * Role split:
 *   - SuperAdminRoute: only role === 'superadmin'. Used for Manage Plans
 *     and Manage Subscriptions (payment portal).
 *   - AdminRoute: elevated access (admin OR superadmin). Used for
 *     management pages like Tasks, Employees, Support Tickets.
 *   - EmployeeRoute: only employees (rarely used).
 */

import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';

// Auth Pages
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { VerifyEmailPage } from '@/features/auth/pages/VerifyEmailPage';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage';

// Dashboard
import { DashboardPage } from '@/features/dashboard/pages';

// Calendar
import { CalendarPage } from '@/features/calendar/pages';

// Tasks
import {
  MyTasksPage,
  MyTaskDetailPage,
  TasksPage,
  TaskDetailPage,
  TaskFormPage,
} from '@/features/tasks/pages';

// Notes
import {
  NotesPage,
  PrivateNotesPage,
  SharedNotesPage,
  NoteDetailPage,
  NoteFormPage,
} from '@/features/notes/pages';

// Employees
import {
  EmployeesPage,
  EmployeeDetailPage,
  EmployeeFormPage,
} from '@/features/employees/pages';

// Projects
import {
  ProjectsPage,
  ProjectDetailPage,
  ProjectFormPage,
} from '@/features/projects/pages';

// Support
import {
  ContactSupportPage,
  MyTicketsPage,
  TicketDetailPage,
  AllTicketsPage,
} from '@/features/support/pages';

// Billing
import { BillingPage, AdminPlansPage, AdminSubscriptionsPage } from '@/features/billing/pages';

// Notifications
import { NotificationsPage } from '@/features/notifications/pages';

// Profile
import { ProfilePage } from '@/features/profile/pages';

// Team
import { TeamPage } from '@/features/team/pages';

// Activity Log
import { ActivityLogPage } from '@/features/activity/pages';

// Not Found
import { NotFoundPage } from '@/features/not-found/pages';

/**
 * Protected Route - any authenticated user.
 */
const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

/**
 * Admin Route - role is admin OR superadmin (elevated privileges).
 * Used for management pages that both roles should access.
 */
const AdminRoute: React.FC = () => {
  const { user } = useAuth();

  if (user?.role !== 'admin' && user?.role !== 'superadmin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

/**
 * SuperAdmin Route - role is strictly 'superadmin'.
 * Used for the payment portal (Manage Plans + Manage Subscriptions).
 */
const SuperAdminRoute: React.FC = () => {
  const { user } = useAuth();

  if (user?.role !== 'superadmin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

/**
 * Employee Route - role is strictly 'employee'.
 */
const EmployeeRoute: React.FC = () => {
  const { user } = useAuth();

  if (user?.role !== 'employee') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

/**
 * Guest Route - redirects authenticated users away from auth pages.
 */
const GuestRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export const router = createBrowserRouter([
  // Guest Routes
  {
    element: <GuestRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
    ],
  },

  // Verify email page - accessible to authenticated-but-unverified users,
  // so it lives OUTSIDE the GuestRoute.
  {
    path: '/verify-email',
    element: <VerifyEmailPage />,
  },

  // Protected Routes
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/', element: <Navigate to="/dashboard" replace /> },
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/calendar', element: <CalendarPage /> },

      // My Tasks (all roles)
      { path: '/my-tasks', element: <MyTasksPage /> },
      { path: '/my-tasks/:id', element: <MyTaskDetailPage /> },

      // Admin / SuperAdmin: Tasks Management
      {
        element: <AdminRoute />,
        children: [
          { path: '/tasks', element: <TasksPage /> },
          { path: '/tasks/create', element: <TaskFormPage /> },
          { path: '/tasks/:id', element: <TaskDetailPage /> },
          { path: '/tasks/:id/edit', element: <TaskFormPage /> },
        ],
      },

      // Notes (all roles)
      { path: '/notes', element: <NotesPage /> },
      { path: '/notes/create', element: <NoteFormPage /> },
      { path: '/notes/private', element: <PrivateNotesPage /> },
      { path: '/notes/shared', element: <SharedNotesPage /> },
      { path: '/notes/:id', element: <NoteDetailPage /> },
      { path: '/notes/:id/edit', element: <NoteFormPage /> },

      // Admin / SuperAdmin: Employees Management
      {
        element: <AdminRoute />,
        children: [
          { path: '/employees', element: <EmployeesPage /> },
          { path: '/employees/:id', element: <EmployeeDetailPage /> },
          { path: '/employees/:id/edit', element: <EmployeeFormPage /> },
        ],
      },

      // Projects
      { path: '/projects', element: <ProjectsPage /> },
      { path: '/projects/:id', element: <ProjectDetailPage /> },
      {
        element: <AdminRoute />,
        children: [
          { path: '/projects/create', element: <ProjectFormPage /> },
          { path: '/projects/:id/edit', element: <ProjectFormPage /> },
        ],
      },

      // Support
      { path: '/support', element: <ContactSupportPage /> },
      { path: '/support/tickets', element: <MyTicketsPage /> },
      { path: '/support/:id', element: <TicketDetailPage /> },

      // Admin / SuperAdmin: Support Tickets Management
      {
        element: <AdminRoute />,
        children: [
          { path: '/admin/support', element: <AllTicketsPage /> },
        ],
      },

      // SuperAdmin ONLY: Payment portal (Manage Plans + Subscriptions)
      {
        element: <SuperAdminRoute />,
        children: [
          { path: '/admin/plans', element: <AdminPlansPage /> },
          { path: '/admin/subscriptions', element: <AdminSubscriptionsPage /> },
        ],
      },

      // Billing (admin + employee can subscribe; superadmin sees a no-op view)
      { path: '/billing', element: <BillingPage /> },

      { path: '/notifications', element: <NotificationsPage /> },
      { path: '/profile', element: <ProfilePage /> },
      { path: '/team', element: <TeamPage /> },
      { path: '/activity', element: <ActivityLogPage /> },
    ],
  },

  // 404
  { path: '*', element: <NotFoundPage /> },
]);

export default router;
