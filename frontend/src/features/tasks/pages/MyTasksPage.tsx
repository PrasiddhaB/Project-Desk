/**
 * My Tasks Page - Kanban board for employees
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Card, Badge } from '@/components/ui';
import { StatusBadge, PriorityBadge } from '@/components/tasks';
import { useAuth } from '@/app/providers/AuthProvider';
import { getTasksByUserId } from '@/mock/tasks';
import { Task, TaskStatus } from '@/types';

export const MyTasksPage: React.FC = () => {
  const { user } = useAuth();
  const tasks = getTasksByUserId(user?.id || 0);

  // Group tasks by status
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  const columns = [
    {
      id: 'pending',
      title: 'Pending',
      tasks: pendingTasks,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      countBg: 'bg-yellow-100',
      countText: 'text-yellow-700',
    },
    {
      id: 'in_progress',
      title: 'In Progress',
      tasks: inProgressTasks,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      countBg: 'bg-blue-100',
      countText: 'text-blue-700',
    },
    {
      id: 'completed',
      title: 'Completed',
      tasks: completedTasks,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      countBg: 'bg-green-100',
      countText: 'text-green-700',
    },
  ];

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isOverdue = (dateString: string | null) => {
    if (!dateString) return false;
    const dueDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  return (
    <AppLayout>
      <div className="p-6 bg-gray-50 min-h-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">My Tasks</h1>
          <nav className="text-sm text-gray-500 mt-1">
            <span>Home</span>
            <span className="mx-2">/</span>
            <span className="text-gray-700">My Tasks</span>
          </nav>
        </div>

        {/* Kanban Board */}
        {tasks.length > 0 ? (
          <div className="flex gap-6 overflow-x-auto pb-4">
            {columns.map(column => (
              <div
                key={column.id}
                className={`flex-shrink-0 w-[340px] rounded-xl ${column.bgColor} border ${column.borderColor}`}
              >
                {/* Column Header */}
                <div className="p-4 border-b border-gray-200/50">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">{column.title}</h3>
                    <span
                      className={`px-2.5 py-1 text-sm font-medium rounded-full ${column.countBg} ${column.countText}`}
                    >
                      {column.tasks.length}
                    </span>
                  </div>
                </div>

                {/* Column Content */}
                <div className="p-4 space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto">
                  {column.tasks.length > 0 ? (
                    column.tasks.map(task => (
                      <Link
                        key={task.id}
                        to={`/my-tasks/${task.id}`}
                        className="block"
                      >
                        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-200 transition-all">
                          {/* Due Date */}
                          {task.due_date && (
                            <div className="mb-2">
                              <span
                                className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${
                                  isOverdue(task.due_date) && task.status !== 'completed'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {formatDate(task.due_date)}
                              </span>
                            </div>
                          )}

                          {/* Title */}
                          <h4 className="font-medium text-gray-800 mb-2 line-clamp-2">
                            {task.title}
                          </h4>

                          {/* Description */}
                          <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                            {task.description}
                          </p>

                          {/* Footer */}
                          <div className="flex items-center justify-between">
                            <PriorityBadge priority={task.priority} size="sm" />
                            <span className="text-xs text-gray-400">
                              View Details →
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <svg className="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p className="text-sm">No tasks</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card className="border-0 shadow-sm">
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <h3 className="text-lg font-medium text-gray-800 mb-2">No Tasks Found</h3>
              <p className="text-gray-500">You don't have any tasks assigned yet.</p>
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default MyTasksPage;