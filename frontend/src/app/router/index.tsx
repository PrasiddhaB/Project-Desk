/**
 * Application Router - All routes with role-based protection
 */

import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';

// Auth Pages
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';

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
 * Protected Route Wrapper - Requires authentication
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
 * Admin Route Wrapper - Requires admin role
 */
const AdminRoute: React.FC = () => {
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

/**
 * Employee Route Wrapper - Requires employee role
 */
const EmployeeRoute: React.FC = () => {
  const { user } = useAuth();

  if (user?.role !== 'employee') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

/**
 * Guest Route Wrapper - Redirects authenticated users
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

/**
 * Application Router Configuration
 */
export const router = createBrowserRouter([
  // Guest Routes (Login, Register)
  {
    element: <GuestRoute />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/register',
        element: <RegisterPage />,
      },
    ],
  },

  // Protected Routes (Requires Authentication)
  {
    element: <ProtectedRoute />,
    children: [
      // Dashboard
      {
        path: '/',
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: '/dashboard',
        element: <DashboardPage />,
      },

      // Calendar
      {
        path: '/calendar',
        element: <CalendarPage />,
      },

      // My Tasks (All Users - Kanban View)
      {
        path: '/my-tasks',
        element: <MyTasksPage />,
      },
      {
        path: '/my-tasks/:id',
        element: <MyTaskDetailPage />,
      },

      // Admin Only: Tasks Management
      {
        element: <AdminRoute />,
        children: [
          {
            path: '/tasks',
            element: <TasksPage />,
          },
          {
            path: '/tasks/create',
            element: <TaskFormPage />,
          },
          {
            path: '/tasks/:id',
            element: <TaskDetailPage />,
          },
          {
            path: '/tasks/:id/edit',
            element: <TaskFormPage />,
          },
        ],
      },

      // Notes (All Users)
      {
        path: '/notes',
        element: <NotesPage />,
      },
      {
        path: '/notes/create',
        element: <NoteFormPage />,
      },
      {
        path: '/notes/private',
        element: <PrivateNotesPage />,
      },
      {
        path: '/notes/shared',
        element: <SharedNotesPage />,
      },
      {
        path: '/notes/:id',
        element: <NoteDetailPage />,
      },
      {
        path: '/notes/:id/edit',
        element: <NoteFormPage />,
      },

      // Admin Only: Employees Management
      {
        element: <AdminRoute />,
        children: [
          {
            path: '/employees',
            element: <EmployeesPage />,
          },
          {
            path: '/employees/:id',
            element: <EmployeeDetailPage />,
          },
          {
            path: '/employees/:id/edit',
            element: <EmployeeFormPage />,
          },
        ],
      },

      // Projects (All users can view, Admin can manage)
      {
        path: '/projects',
        element: <ProjectsPage />,
      },
      {
        path: '/projects/:id',
        element: <ProjectDetailPage />,
      },
      {
        element: <AdminRoute />,
        children: [
          {
            path: '/projects/create',
            element: <ProjectFormPage />,
          },
          {
            path: '/projects/:id/edit',
            element: <ProjectFormPage />,
          },
        ],
      },

      // Support - Contact (Employee creates ticket)
      {
        path: '/support',
        element: <ContactSupportPage />,
      },
      {
        path: '/support/tickets',
        element: <MyTicketsPage />,
      },
      {
        path: '/support/:id',
        element: <TicketDetailPage />,
      },

      // Admin Only: Support Tickets Management
      {
        element: <AdminRoute />,
        children: [
          {
            path: '/admin/support',
            element: <AllTicketsPage />,
          },
          {
            path: '/admin/plans',
            element: <AdminPlansPage />,
          },
          {
            path: '/admin/subscriptions',
            element: <AdminSubscriptionsPage />,
          },
        ],
      },

      // Billing (All Users)
      {
        path: '/billing',
        element: <BillingPage />,
      },

      // Notifications (All Users)
      {
        path: '/notifications',
        element: <NotificationsPage />,
      },

      // Profile (All Users)
      {
        path: '/profile',
        element: <ProfilePage />,
      },

      // Team (All Users)
      {
        path: '/team',
        element: <TeamPage />,
      },

      // Activity Log (All Users)
      {
        path: '/activity',
        element: <ActivityLogPage />,
      },
    ],
  },

  // 404 Not Found
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export default router;