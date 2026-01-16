/**
 * Employee Detail Page - View employee profile
 */

import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Card, Button, Badge, Avatar } from '@/components/ui';
import { StatusBadge } from '@/components/tasks';
import { getUserById } from '@/mock/users';
import { getTasksByUserId } from '@/mock/tasks';
import { getNotesByUserId } from '@/mock/notes';

export const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = getUserById(Number(id));

  if (!user) {
    return (
      <AppLayout>
        <div className="p-6">
          <Card className="border-0 shadow-sm">
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-800 mb-2">User Not Found</h3>
              <p className="text-gray-500 mb-4">The user you're looking for doesn't exist.</p>
              <Button onClick={() => navigate('/employees')}>Back to Employees</Button>
            </div>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const userTasks = getTasksByUserId(user.id);
  const userNotes = getNotesByUserId(user.id);

  const pendingTasks = userTasks.filter(t => t.status === 'pending');
  const inProgressTasks = userTasks.filter(t => t.status === 'in_progress');
  const completedTasks = userTasks.filter(t => t.status === 'completed');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      // Mock delete
      console.log('Delete user:', user.id);
      navigate('/employees?success=User deleted successfully');
    }
  };

  return (
    <AppLayout>
      <div className="p-6 bg-gray-50 min-h-full">
        {/* Header */}
        <div className="mb-6">
          <nav className="text-sm text-gray-500 mb-2">
            <Link to="/employees" className="hover:text-primary-500">Employees</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-700">User Details</span>
          </nav>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar name={user.full_name} size="xl" showStatus status={user.is_active ? 'online' : 'offline'} />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{user.full_name}</h1>
                <p className="text-gray-500">@{user.username}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={user.role === 'admin' ? 'primary' : 'info'}>
                    {user.role === 'admin' ? 'Admin' : 'Employee'}
                  </Badge>
                  <Badge variant={user.is_active ? 'success' : 'gray'}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate('/employees')}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </Button>
              <Button variant="outline" onClick={() => navigate(`/employees/${user.id}/edit`)}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="border-0 shadow-sm">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center mx-auto mb-2">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{pendingTasks.length}</p>
                  <p className="text-sm text-gray-500">Pending</p>
                </div>
              </Card>

              <Card className="border-0 shadow-sm">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-2">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{inProgressTasks.length}</p>
                  <p className="text-sm text-gray-500">In Progress</p>
                </div>
              </Card>

              <Card className="border-0 shadow-sm">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mx-auto mb-2">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{completedTasks.length}</p>
                  <p className="text-sm text-gray-500">Completed</p>
                </div>
              </Card>
            </div>

            {/* Recent Tasks */}
            <Card className="border-0 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Assigned Tasks</h2>
                <span className="text-sm text-gray-500">{userTasks.length} total</span>
              </div>

              {userTasks.length > 0 ? (
                <div className="space-y-3">
                  {userTasks.slice(0, 5).map(task => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1 min-w-0 mr-4">
                        <Link
                          to={`/tasks/${task.id}`}
                          className="font-medium text-gray-800 hover:text-primary-500"
                        >
                          {task.title}
                        </Link>
                        <p className="text-sm text-gray-500 truncate mt-1">
                          {task.description.slice(0, 50)}...
                        </p>
                      </div>
                      <StatusBadge status={task.status} size="sm" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No tasks assigned</p>
              )}
            </Card>

            {/* Notes */}
            <Card className="border-0 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">User's Notes</h2>
                <span className="text-sm text-gray-500">{userNotes.length} total</span>
              </div>

              {userNotes.length > 0 ? (
                <div className="space-y-3">
                  {userNotes.filter(n => !n.is_private).slice(0, 3).map(note => (
                    <div
                      key={note.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1 min-w-0 mr-4">
                        <Link
                          to={`/notes/${note.id}`}
                          className="font-medium text-gray-800 hover:text-primary-500"
                        >
                          {note.pinned && '📌 '}{note.title}
                        </Link>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(note.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No public notes</p>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <Card className="border-0 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h2>
              
              <div className="space-y-4">
                {/* Email */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <a href={`mailto:${user.email}`} className="text-gray-800 hover:text-primary-500">
                      {user.email}
                    </a>
                  </div>
                </div>

                {/* Phone */}
                {user.phone && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <a href={`tel:${user.phone}`} className="text-gray-800 hover:text-primary-500">
                        {user.phone}
                      </a>
                    </div>
                  </div>
                )}

                {/* Username */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Username</p>
                    <p className="text-gray-800">@{user.username}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Account Info */}
            <Card className="border-0 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Account Details</h2>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Role</p>
                  <p className="font-medium text-gray-800 capitalize">{user.role}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium text-gray-800">{user.is_active ? 'Active' : 'Inactive'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Member Since</p>
                  <p className="font-medium text-gray-800">{formatDate(user.created_at)}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default EmployeeDetailPage;