/**
 * Task Form Page - Create and Edit tasks
 * Dynamic - connects to backend API
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Card, Button, Input } from '@/components/ui';
import { taskApi } from '@/services/tasks';
import client from '@/services/http/client';
import { Task, TaskStatus, TaskPriority, STATUS_OPTIONS, PRIORITY_OPTIONS } from '@/types';

interface UserOption {
  id: number;
  username: string;
  full_name: string;
}

export const TaskFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  // State
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserOption[]>([]);

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending' as TaskStatus,
    priority: 'medium' as TaskPriority,
    due_date: '',
    assigned_to_ids: [] as number[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch users for assignment dropdown
  const fetchUsers = async () => {
    try {
      const response = await client.get('/auth/users/');
      setUsers(response.data.data || response.data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  // Fetch task for edit mode
  const fetchTask = async () => {
    try {
      setLoading(true);
      const task = await taskApi.getTask(Number(id));
      setFormData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        due_date: task.due_date || '',
        assigned_to_ids: task.assigned_to.map(u => u.id),
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load task');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    if (isEditMode) {
      fetchTask();
    }
  }, [id]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        ...formData,
        due_date: formData.due_date || null,
      };

      if (isEditMode) {
        await taskApi.updateTask(Number(id), payload);
      } else {
        await taskApi.createTask(payload);
      }

      navigate('/tasks?success=' + (isEditMode ? 'Task updated' : 'Task created'));
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        err.response?.data?.detail ||
        `Failed to ${isEditMode ? 'update' : 'create'} task`
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Handle assignee toggle
  const handleAssigneeToggle = (userId: number) => {
    setFormData(prev => ({
      ...prev,
      assigned_to_ids: prev.assigned_to_ids.includes(userId)
        ? prev.assigned_to_ids.filter(id => id !== userId)
        : [...prev.assigned_to_ids, userId],
    }));
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

  return (
    <AppLayout>
      <div className="p-6 bg-gray-50 min-h-full">
        {/* Header */}
        <div className="mb-6">
          <nav className="text-sm text-gray-500 mb-2">
            <Link to="/tasks" className="hover:text-primary-500">Tasks</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-700">{isEditMode ? 'Edit Task' : 'Create Task'}</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEditMode ? 'Edit Task' : 'Create New Task'}
          </h1>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <Card className="border-0 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Task Information</h2>

                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <Input
                      type="text"
                      value={formData.title}
                      onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter task title"
                      error={errors.title}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter task description"
                      rows={5}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  {/* Status & Priority */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as TaskStatus }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        {STATUS_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority
                      </label>
                      <select
                        value={formData.priority}
                        onChange={e => setFormData(prev => ({ ...prev, priority: e.target.value as TaskPriority }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        {PRIORITY_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Due Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date
                    </label>
                    <Input
                      type="date"
                      value={formData.due_date}
                      onChange={e => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                    />
                  </div>
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Assignees */}
              <Card className="border-0 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Assign To ({formData.assigned_to_ids.length})
                </h2>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {users.length > 0 ? (
                    users.map(user => (
                      <label
                        key={user.id}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          formData.assigned_to_ids.includes(user.id)
                            ? 'bg-primary-50 border-2 border-primary-500'
                            : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.assigned_to_ids.includes(user.id)}
                          onChange={() => handleAssigneeToggle(user.id)}
                          className="w-4 h-4 text-primary-500 rounded focus:ring-primary-500"
                        />
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{user.full_name}</p>
                          <p className="text-xs text-gray-500">@{user.username}</p>
                        </div>
                      </label>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No users available</p>
                  )}
                </div>
              </Card>

              {/* Actions */}
              <Card className="border-0 shadow-sm">
                <div className="space-y-3">
                  <Button type="submit" isLoading={submitting} className="w-full">
                    {isEditMode ? 'Update Task' : 'Create Task'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/tasks')}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
};

// Wrapper components for routing
export const CreateTaskPage: React.FC = () => <TaskFormPage />;
export const EditTaskPage: React.FC = () => <TaskFormPage />;

export default TaskFormPage;
