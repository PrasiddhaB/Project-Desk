/**
 * Task Form Page - Admin create/edit task
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Card, Button, Input } from '@/components/ui';
import { getTaskById } from '@/mock/tasks';
import { getEmployees } from '@/mock/users';
import { TaskFormData, TaskStatus, TaskPriority, STATUS_OPTIONS, PRIORITY_OPTIONS } from '@/types';

export const TaskFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const existingTask = isEditing ? getTaskById(Number(id)) : null;
  const employees = getEmployees();

  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    due_date: '',
    assigned_to: [],
  });

  const [errors, setErrors] = useState<Partial<Record<keyof TaskFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (existingTask) {
      setFormData({
        title: existingTask.title,
        description: existingTask.description,
        status: existingTask.status,
        priority: existingTask.priority,
        due_date: existingTask.due_date || '',
        assigned_to: existingTask.assigned_to.map(a => a.id),
      });
    }
  }, [existingTask]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof TaskFormData, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.assigned_to.length === 0) {
      newErrors.assigned_to = 'Please assign at least one employee';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    navigate('/tasks?success=' + (isEditing ? 'Task updated successfully' : 'Task created successfully'));
  };

  const handleAssigneeToggle = (employeeId: number) => {
    setFormData(prev => ({
      ...prev,
      assigned_to: prev.assigned_to.includes(employeeId)
        ? prev.assigned_to.filter(id => id !== employeeId)
        : [...prev.assigned_to, employeeId],
    }));
    setErrors(prev => ({ ...prev, assigned_to: undefined }));
  };

  if (isEditing && !existingTask) {
    return (
      <AppLayout>
        <div className="p-6">
          <Card className="border-0 shadow-sm">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-800 mb-2">Task Not Found</h3>
              <p className="text-gray-500 mb-4">The task you're trying to edit doesn't exist.</p>
              <Button onClick={() => navigate('/tasks')}>Back to Tasks</Button>
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
            <span className="text-gray-700">{isEditing ? 'Edit Task' : 'Create Task'}</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEditing ? 'Edit Task' : 'Create New Task'}
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-0 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Task Details</h2>
                
                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={formData.title}
                      onChange={e => {
                        setFormData(prev => ({ ...prev, title: e.target.value }));
                        setErrors(prev => ({ ...prev, title: undefined }));
                      }}
                      placeholder="Enter task title"
                      error={errors.title}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={e => {
                        setFormData(prev => ({ ...prev, description: e.target.value }));
                        setErrors(prev => ({ ...prev, description: undefined }));
                      }}
                      placeholder="Enter task description"
                      rows={5}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        errors.description ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.description && (
                      <p className="text-sm text-red-500 mt-1">{errors.description}</p>
                    )}
                  </div>
                </div>
              </Card>

              {/* Assign To */}
              <Card className="border-0 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Assign To <span className="text-red-500">*</span>
                </h2>
                
                {errors.assigned_to && (
                  <p className="text-sm text-red-500 mb-3">{errors.assigned_to}</p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {employees.map(employee => (
                    <label
                      key={employee.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.assigned_to.includes(employee.id)
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.assigned_to.includes(employee.id)}
                        onChange={() => handleAssigneeToggle(employee.id)}
                        className="w-4 h-4 text-primary-500 rounded focus:ring-primary-500"
                      />
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-medium text-sm">
                          {employee.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{employee.full_name}</p>
                          <p className="text-xs text-gray-500">@{employee.username}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="border-0 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Task Settings</h2>
                
                <div className="space-y-4">
                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
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

                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
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

                  {/* Due Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                    <Input
                      type="date"
                      value={formData.due_date}
                      onChange={e => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                    />
                  </div>
                </div>
              </Card>

              {/* Actions */}
              <Card className="border-0 shadow-sm">
                <div className="space-y-3">
                  <Button
                    type="submit"
                    isLoading={isSubmitting}
                    className="w-full"
                  >
                    {isEditing ? 'Update Task' : 'Create Task'}
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

export default TaskFormPage;