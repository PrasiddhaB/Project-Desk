/**
 * Task Detail Page - View task details
 * Dynamic - connects to backend API
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Card, Button, Badge, Avatar } from '@/components/ui';
import { StatusBadge, PriorityBadge } from '@/components/tasks';
import { useAuth } from '@/app/providers/AuthProvider';
import { taskApi } from '@/services/tasks';
import { Task, TaskStatus, STATUS_OPTIONS } from '@/types';

export const TaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

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
      console.error('Error fetching task:', err);
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

  // Delete task
  const handleDelete = async () => {
    if (!task) return;
    if (!window.confirm(`Are you sure you want to delete "${task.title}"?`)) return;

    try {
      await taskApi.deleteTask(task.id);
      navigate('/tasks?success=Task deleted');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete task');
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
              <Button onClick={() => navigate(isAdmin ? '/tasks' : '/my-tasks')}>
                Back to Tasks
              </Button>
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
            <Link to={isAdmin ? '/tasks' : '/my-tasks'} className="hover:text-primary-500">
              Tasks
            </Link>
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
            
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate(isAdmin ? '/tasks' : '/my-tasks')}>
                Back
              </Button>
              {isAdmin && (
                <>
                  <Button variant="outline" onClick={() => navigate(`/tasks/${task.id}/edit`)}>
                    Edit
                  </Button>
                  <Button variant="danger" onClick={handleDelete}>
                    Delete
                  </Button>
                </>
              )}
            </div>
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
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleStatusUpdate(option.value)}
                    disabled={updating || task.status === option.value}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      task.status === option.value
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    } disabled:opacity-50`}
                  >
                    {updating && task.status !== option.value ? 'Updating...' : option.label}
                  </button>
                ))}
              </div>
            </Card>

            {/* Assignees */}
            <Card className="border-0 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Assignees ({task.assigned_to.length})
              </h2>
              {task.assigned_to.length > 0 ? (
                <div className="space-y-3">
                  {task.assigned_to.map(assignee => (
                    <div key={assignee.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Avatar name={assignee.full_name} size="md" />
                      <div>
                        <p className="font-medium text-gray-800">{assignee.full_name}</p>
                        <p className="text-sm text-gray-500">@{assignee.username}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No assignees</p>
              )}
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
                  <p className="text-sm text-gray-500">Status</p>
                  <StatusBadge status={task.status} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created By</p>
                  <p className="font-medium text-gray-800">{task.created_by.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="text-gray-600 text-sm">{formatDateTime(task.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p className="text-gray-600 text-sm">{formatDateTime(task.updated_at)}</p>
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
