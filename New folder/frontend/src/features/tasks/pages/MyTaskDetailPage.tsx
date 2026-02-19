/**
 * My Task Detail Page - Employee view single task
 * Dynamic - connects to backend API
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Card, Button, Badge, Avatar } from '@/components/ui';
import { StatusBadge, PriorityBadge } from '@/components/tasks';
import { taskApi } from '@/services/tasks';
import { Task, TaskStatus, STATUS_OPTIONS } from '@/types';

export const MyTaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Fetch task
  const fetchTask = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await taskApi.getTask(Number(id));
      setTask(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load task');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
  }, [id]);

  // Update status
  const handleStatusUpdate = async (newStatus: TaskStatus) => {
    if (!task) return;

    try {
      setUpdating(true);
      await taskApi.updateTaskStatus(task.id, newStatus);
      setTask(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6">
          <Card className="border-0 shadow-sm">
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading task...</p>
            </div>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (error || !task) {
    return (
      <AppLayout>
        <div className="p-6">
          <Card className="border-0 shadow-sm">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                {error || 'Task Not Found'}
              </h3>
              <Button onClick={() => navigate('/my-tasks')}>Back to My Tasks</Button>
            </div>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 bg-gray-50 min-h-full">
        {/* Header */}
        <div className="mb-6">
          <nav className="text-sm text-gray-500 mb-2">
            <Link to="/my-tasks" className="hover:text-primary-500">My Tasks</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-700">{task.title}</span>
          </nav>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">{task.title}</h1>
              <div className="flex items-center gap-3">
                <StatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
                {task.is_overdue && <Badge variant="danger">Overdue</Badge>}
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate('/my-tasks')}>
              Back
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card className="border-0 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Description</h2>
              <p className="text-gray-600 whitespace-pre-wrap">
                {task.description || 'No description provided.'}
              </p>
            </Card>

            {/* Status Update */}
            <Card className="border-0 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Update Status</h2>
              <p className="text-sm text-gray-500 mb-4">
                Click on a status to update this task
              </p>
              <div className="flex flex-wrap gap-3">
                {STATUS_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleStatusUpdate(option.value)}
                    disabled={updating || task.status === option.value}
                    className={`px-6 py-3 rounded-lg font-medium transition-all ${
                      task.status === option.value
                        ? 'bg-primary-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:shadow'
                    } disabled:opacity-50`}
                  >
                    {option.label}
                    {task.status === option.value && (
                      <svg className="w-4 h-4 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="border-0 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Task Details</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Due Date</p>
                  <p className={`font-medium ${task.is_overdue ? 'text-red-600' : 'text-gray-800'}`}>
                    {formatDate(task.due_date)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Priority</p>
                  <PriorityBadge priority={task.priority} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created By</p>
                  <p className="font-medium text-gray-800">{task.created_by.full_name}</p>
                </div>
              </div>
            </Card>

            {/* Other Assignees */}
            {task.assigned_to.length > 1 && (
              <Card className="border-0 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Team Members</h2>
                <div className="space-y-2">
                  {task.assigned_to.map(user => (
                    <div key={user.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                      <Avatar name={user.full_name} size="sm" />
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{user.full_name}</p>
                        <p className="text-xs text-gray-500">@{user.username}</p>
                      </div>
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
