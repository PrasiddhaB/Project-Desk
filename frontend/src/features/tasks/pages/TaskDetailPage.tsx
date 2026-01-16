/**
 * Task Detail Page - Admin view
 */

import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Card, Button, Badge, Avatar } from '@/components/ui';
import { StatusBadge, PriorityBadge } from '@/components/tasks';
import { getTaskById } from '@/mock/tasks';

export const TaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const task = getTaskById(Number(id));

  if (!task) {
    return (
      <AppLayout>
        <div className="p-6">
          <Card className="border-0 shadow-sm">
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Task Not Found</h3>
              <p className="text-gray-500 mb-4">The task you're looking for doesn't exist.</p>
              <Button onClick={() => navigate('/tasks')}>Back to Tasks</Button>
            </div>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isOverdue = (dateString: string | null) => {
    if (!dateString) return false;
    const dueDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today && task.status !== 'completed';
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      // Mock delete
      console.log('Delete task:', task.id);
      navigate('/tasks?success=Task deleted successfully');
    }
  };

  return (
    <AppLayout>
      <div className="p-6 bg-gray-50 min-h-full">
        {/* Header */}
        <div className="mb-6">
          <nav className="text-sm text-gray-500 mb-2">
            <Link to="/tasks" className="hover:text-primary-500">Tasks</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-700">Task Details</span>
          </nav>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{task.title}</h1>
              <div className="flex items-center gap-3 mt-2">
                <StatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
                {isOverdue(task.due_date) && (
                  <Badge variant="danger">Overdue</Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate('/tasks')}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </Button>
              <Button variant="outline" onClick={() => navigate(`/tasks/${task.id}/edit`)}>
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
            {/* Description */}
            <Card className="border-0 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Description</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                {task.description}
              </p>
            </Card>

            {/* Assigned Team Members */}
            <Card className="border-0 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Assigned To</h2>
              {task.assigned_to.length > 0 ? (
                <div className="space-y-3">
                  {task.assigned_to.map(assignee => (
                    <div key={assignee.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Avatar name={assignee.full_name} size="md" />
                      <div>
                        <p className="font-medium text-gray-800">{assignee.full_name}</p>
                        <p className="text-sm text-gray-500">{assignee.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No team members assigned</p>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Task Info */}
            <Card className="border-0 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Task Information</h2>
              
              <div className="space-y-4">
                {/* Status */}
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Status</label>
                  <StatusBadge status={task.status} />
                </div>

                {/* Priority */}
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Priority</label>
                  <PriorityBadge priority={task.priority} />
                </div>

                {/* Due Date */}
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Due Date</label>
                  {task.due_date ? (
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${isOverdue(task.due_date) ? 'text-red-600' : 'text-gray-800'}`}>
                        {formatDate(task.due_date)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-500">No deadline</span>
                  )}
                </div>

                {/* Created By */}
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Created By</label>
                  <span className="font-medium text-gray-800">{task.created_by_name}</span>
                </div>

                {/* Created At */}
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Created</label>
                  <span className="text-gray-600">{formatDate(task.created_at)}</span>
                </div>

                {/* Updated At */}
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Last Updated</label>
                  <span className="text-gray-600">{formatDate(task.updated_at)}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default TaskDetailPage;