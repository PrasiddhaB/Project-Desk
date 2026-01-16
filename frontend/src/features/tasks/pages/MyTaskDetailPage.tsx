/**
 * My Task Detail Page - Employee view with status update only
 */

import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Card, Button, Badge } from '@/components/ui';
import { StatusBadge, PriorityBadge } from '@/components/tasks';
import { getTaskById } from '@/mock/tasks';
import { TaskStatus, STATUS_OPTIONS } from '@/types';

export const MyTaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const task = getTaskById(Number(id));

  const [status, setStatus] = useState<TaskStatus>(task?.status || 'pending');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

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
              <Button onClick={() => navigate('/my-tasks')}>Back to My Tasks</Button>
            </div>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const handleStatusUpdate = async () => {
    setIsUpdating(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsUpdating(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

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

  return (
    <AppLayout>
      <div className="p-6 bg-gray-50 min-h-full">
        {/* Header */}
        <div className="mb-6">
          <nav className="text-sm text-gray-500 mb-2">
            <Link to="/my-tasks" className="hover:text-primary-500">My Tasks</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-700">Task Details</span>
          </nav>
          <div className="flex items-start justify-between">
            <h1 className="text-2xl font-bold text-gray-800">{task.title}</h1>
            <Button variant="outline" onClick={() => navigate('/my-tasks')}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </Button>
          </div>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-green-800">Status updated successfully!</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Description */}
            <Card className="border-0 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Description</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                {task.description}
              </p>
            </Card>

            {/* Update Status */}
            <Card className="border-0 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Update Status</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {STATUS_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setStatus(option.value)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        status === option.value
                          ? option.value === 'pending'
                            ? 'border-yellow-500 bg-yellow-50'
                            : option.value === 'in_progress'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        {option.value === 'pending' && (
                          <svg className={`w-8 h-8 mx-auto mb-2 ${status === option.value ? 'text-yellow-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        {option.value === 'in_progress' && (
                          <svg className={`w-8 h-8 mx-auto mb-2 ${status === option.value ? 'text-blue-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        )}
                        {option.value === 'completed' && (
                          <svg className={`w-8 h-8 mx-auto mb-2 ${status === option.value ? 'text-green-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        <span className={`text-sm font-medium ${
                          status === option.value ? 'text-gray-800' : 'text-gray-500'
                        }`}>
                          {option.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                <Button
                  onClick={handleStatusUpdate}
                  isLoading={isUpdating}
                  disabled={status === task.status}
                  className="w-full"
                >
                  Update Status
                </Button>

                {status === task.status && (
                  <p className="text-sm text-gray-500 text-center">
                    Select a different status to update
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Task Info */}
            <Card className="border-0 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Task Information</h2>
              
              <div className="space-y-4">
                {/* Current Status */}
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Current Status</label>
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
                      {isOverdue(task.due_date) && (
                        <Badge variant="danger" size="sm">Overdue</Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-500">No deadline</span>
                  )}
                </div>

                {/* Created By */}
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Assigned By</label>
                  <span className="font-medium text-gray-800">{task.created_by_name}</span>
                </div>

                {/* Created At */}
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Created</label>
                  <span className="text-gray-600">{formatDate(task.created_at)}</span>
                </div>
              </div>
            </Card>

            {/* Other Assignees */}
            {task.assigned_to.length > 1 && (
              <Card className="border-0 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Team Members</h2>
                <div className="space-y-3">
                  {task.assigned_to.map(assignee => (
                    <div key={assignee.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-medium text-sm">
                        {assignee.full_name.charAt(0)}
                      </div>
                      <span className="text-gray-800">{assignee.full_name}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default MyTaskDetailPage;