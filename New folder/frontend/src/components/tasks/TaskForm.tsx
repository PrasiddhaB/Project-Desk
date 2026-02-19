/**
 * Task Form Component
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Task, TaskFormData, STATUS_OPTIONS, PRIORITY_OPTIONS } from '@/types/task';
import { mockUsers } from "@/mock/users";
import { Button, Alert } from '@/components/ui';

interface TaskFormProps {
  task?: Task;
  mode: 'create' | 'edit';
  onSubmit: (data: TaskFormData) => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({ task, mode, onSubmit }) => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<TaskFormData>({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'pending',
    priority: task?.priority || 'medium',
    due_date: task?.due_date || '',
    assigned_to: task?.assigned_to.map(u => u.id) || [],
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAssigneeChange = (userId: number) => {
    setFormData(prev => ({
      ...prev,
      assigned_to: prev.assigned_to.includes(userId)
        ? prev.assigned_to.filter(id => id !== userId)
        : [...prev.assigned_to, userId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      onSubmit(formData);
      navigate('/tasks');
    } catch (err) {
      setError('Failed to save task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="error">{error}</Alert>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Task Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/25 transition-all"
          placeholder="Enter task title"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/25 transition-all resize-none"
          placeholder="Enter task description"
        />
      </div>

      {/* Status & Priority Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/25 transition-all bg-white"
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Priority
          </label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/25 transition-all bg-white"
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
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Due Date
        </label>
        <input
          type="date"
          name="due_date"
          value={formData.due_date}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/25 transition-all"
        />
      </div>

      {/* Assign To */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Assign To
        </label>
        <div className="border border-gray-200 rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto">
          {mockUsers.map(user => (
            <label
              key={user.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={formData.assigned_to.includes(user.id)}
                onChange={() => handleAssigneeChange(user.id)}
                className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
              />
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-sm font-medium text-primary-600">
                {user.full_name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{user.full_name}</p>
                <p className="text-xs text-gray-500">@{user.username}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
        <Button
          type="submit"
          isLoading={isSubmitting}
        >
          {mode === 'create' ? 'Create Task' : 'Save Changes'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/tasks')}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default TaskForm;