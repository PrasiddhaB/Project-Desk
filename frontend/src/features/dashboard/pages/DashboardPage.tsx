/**
 * Dashboard Page - Role-based views for Admin and Employee
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Card, Avatar, Badge } from '@/components/ui';
import { StatusBadge, PriorityBadge } from '@/components/tasks';
import { useAuth } from '@/app/providers/AuthProvider';
import { mockTasks, getTasksByUserId, getOverdueTasks, getTasksDueToday } from '@/mock/tasks';
import { mockUsers, getEmployees } from '@/mock/users';
import { mockNotes } from '@/mock/notes';
import { mockTickets, getOpenTickets } from '@/mock/support';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Get data based on role
  const userTasks = isAdmin ? mockTasks : getTasksByUserId(user?.id || 0);
  const pendingTasks = userTasks.filter(t => t.status === 'pending');
  const inProgressTasks = userTasks.filter(t => t.status === 'in_progress');
  const completedTasks = userTasks.filter(t => t.status === 'completed');
  const overdueTasks = getOverdueTasks();
  const todayTasks = getTasksDueToday();
  const employees = getEmployees();
  const openTickets = getOpenTickets();

  // Recent items (last 5)
  const recentTasks = [...userTasks]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const recentNotes = [...mockNotes]
    .filter(n => isAdmin || n.user_id === user?.id || !n.is_private)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <AppLayout>
      <div className="p-6 bg-gray-50 min-h-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome back, {user?.full_name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-500 mt-1">
            Here's what's happening with your {isAdmin ? 'team' : 'tasks'} today.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Tasks */}
          <Card className="border-0 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">{isAdmin ? 'Total Tasks' : 'My Tasks'}</p>
                <p className="text-2xl font-bold text-gray-800">{userTasks.length}</p>
              </div>
            </div>
          </Card>

          {/* Pending */}
          <Card className="border-0 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-gray-800">{pendingTasks.length}</p>
              </div>
            </div>
          </Card>

          {/* In Progress */}
          <Card className="border-0 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">In Progress</p>
                <p className="text-2xl font-bold text-gray-800">{inProgressTasks.length}</p>
              </div>
            </div>
          </Card>

          {/* Completed */}
          <Card className="border-0 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-gray-800">{completedTasks.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Admin Only: Additional Stats */}
        {isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Employees */}
            <Card className="border-0 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Employees</p>
                  <p className="text-2xl font-bold text-gray-800">{employees.length}</p>
                </div>
              </div>
            </Card>

            {/* Overdue Tasks */}
            <Card className="border-0 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Overdue Tasks</p>
                  <p className="text-2xl font-bold text-gray-800">{overdueTasks.length}</p>
                </div>
              </div>
            </Card>

            {/* Open Tickets */}
            <Card className="border-0 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Open Tickets</p>
                  <p className="text-2xl font-bold text-gray-800">{openTickets.length}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Tasks */}
          <Card className="border-0 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Recent Tasks</h2>
              <Link
                to={isAdmin ? '/tasks' : '/my-tasks'}
                className="text-sm text-primary-500 hover:text-primary-600 font-medium"
              >
                View all
              </Link>
            </div>

            {recentTasks.length > 0 ? (
              <div className="space-y-3">
                {recentTasks.map(task => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0 mr-4">
                      <Link
                        to={isAdmin ? `/tasks/${task.id}` : `/my-tasks/${task.id}`}
                        className="font-medium text-gray-800 hover:text-primary-500 truncate block"
                      >
                        {task.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge status={task.status} size="sm" />
                        <PriorityBadge priority={task.priority} size="sm" />
                      </div>
                    </div>
                    {task.due_date && (
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {new Date(task.due_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p>No tasks yet</p>
              </div>
            )}
          </Card>

          {/* Recent Notes */}
          <Card className="border-0 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Recent Notes</h2>
              <Link
                to="/notes"
                className="text-sm text-primary-500 hover:text-primary-600 font-medium"
              >
                View all
              </Link>
            </div>

            {recentNotes.length > 0 ? (
              <div className="space-y-3">
                {recentNotes.map(note => (
                  <div
                    key={note.id}
                    className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0 mr-4">
                      <Link
                        to={`/notes/${note.id}`}
                        className="font-medium text-gray-800 hover:text-primary-500 truncate block"
                      >
                        {note.pinned && <span className="text-yellow-500 mr-1">📌</span>}
                        {note.title}
                      </Link>
                      <p className="text-sm text-gray-500 truncate mt-1">
                        {note.content.replace(/<[^>]*>/g, '').slice(0, 60)}...
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-500">
                        {new Date(note.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      {note.is_private && (
                        <Badge variant="gray" size="sm" className="ml-2">
                          Private
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>No notes yet</p>
              </div>
            )}
          </Card>
        </div>

        {/* Admin Only: Team Members */}
        {isAdmin && (
          <Card className="border-0 shadow-sm mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Team Members</h2>
              <Link
                to="/employees"
                className="text-sm text-primary-500 hover:text-primary-600 font-medium"
              >
                Manage team
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employees.slice(0, 6).map(employee => {
                const employeeTasks = getTasksByUserId(employee.id);
                const employeePending = employeeTasks.filter(t => t.status === 'pending').length;
                const employeeInProgress = employeeTasks.filter(t => t.status === 'in_progress').length;

                return (
                  <div
                    key={employee.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <Avatar name={employee.full_name} size="md" showStatus status={employee.is_active ? 'online' : 'offline'} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{employee.full_name}</p>
                      <p className="text-sm text-gray-500">
                        {employeePending} pending, {employeeInProgress} in progress
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Employee Only: Due Today */}
        {!isAdmin && todayTasks.length > 0 && (
          <Card className="border-0 shadow-sm mt-6 border-l-4 border-l-yellow-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Due Today</h2>
            </div>

            <div className="space-y-3">
              {todayTasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <Link
                      to={`/my-tasks/${task.id}`}
                      className="font-medium text-gray-800 hover:text-primary-500"
                    >
                      {task.title}
                    </Link>
                  </div>
                  <StatusBadge status={task.status} size="sm" />
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default DashboardPage;