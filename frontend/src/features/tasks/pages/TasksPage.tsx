/**
 * Tasks Page - Admin view with table list
 */

import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Card, Button, Input, Badge } from '@/components/ui';
import { StatusBadge, PriorityBadge } from '@/components/tasks';
import { mockTasks, getOverdueTasks, getTasksDueToday, getTasksWithNoDeadline } from '@/mock/tasks';
import { Task, TaskStatus } from '@/types';

type FilterType = 'all' | 'due_today' | 'overdue' | 'no_deadline';

export const TasksPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState('');
  const activeFilter = (searchParams.get('filter') as FilterType) || 'all';

  // Get tasks based on filter
  const getFilteredTasks = (): Task[] => {
    let filtered: Task[];
    
    switch (activeFilter) {
      case 'due_today':
        filtered = getTasksDueToday();
        break;
      case 'overdue':
        filtered = getOverdueTasks();
        break;
      case 'no_deadline':
        filtered = getTasksWithNoDeadline();
        break;
      default:
        filtered = mockTasks;
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        task =>
          task.title.toLowerCase().includes(query) ||
          task.description.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const tasks = getFilteredTasks();

  // Stats
  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;

  const filters: { id: FilterType; label: string }[] = [
    { id: 'all', label: 'All Tasks' },
    { id: 'due_today', label: 'Due Today' },
    { id: 'overdue', label: 'Overdue' },
    { id: 'no_deadline', label: 'No Deadline' },
  ];

  const handleFilterChange = (filter: FilterType) => {
    if (filter === 'all') {
      searchParams.delete('filter');
    } else {
      searchParams.set('filter', filter);
    }
    setSearchParams(searchParams);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isOverdue = (dateString: string | null, status: TaskStatus) => {
    if (!dateString || status === 'completed') return false;
    const dueDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  const handleDelete = (taskId: number) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      // Mock delete
      console.log('Delete task:', taskId);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 bg-gray-50 min-h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {activeFilter === 'all' ? 'All Tasks' : filters.find(f => f.id === activeFilter)?.label}
            </h1>
            <nav className="text-sm text-gray-500 mt-1">
              <span>Home</span>
              <span className="mx-2">/</span>
              <span className="text-gray-700">Tasks</span>
            </nav>
          </div>
          <Button onClick={() => navigate('/tasks/create')}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Task
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Tasks</p>
                <p className="text-xl font-bold text-gray-800">{tasks.length}</p>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-xl font-bold text-gray-800">{pendingCount}</p>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">In Progress</p>
                <p className="text-xl font-bold text-gray-800">{inProgressCount}</p>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-xl font-bold text-gray-800">{completedCount}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {filters.map(filter => (
            <button
              key={filter.id}
              onClick={() => handleFilterChange(filter.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === filter.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Tasks Table */}
        <Card className="border-0 shadow-sm overflow-hidden">
          {tasks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">#</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Title</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Description</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Assigned To</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Due Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tasks.map((task, index) => (
                    <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-gray-600">{index + 1}</td>
                      <td className="py-3 px-4">
                        <Link
                          to={`/tasks/${task.id}`}
                          className="font-medium text-gray-800 hover:text-primary-500"
                        >
                          {task.title}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-gray-600 max-w-xs truncate">
                        {task.description.length > 40
                          ? task.description.slice(0, 40) + '...'
                          : task.description}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {task.assigned_to.length > 0 ? (
                            task.assigned_to.map(assignee => (
                              <Badge key={assignee.id} variant="secondary" size="sm">
                                {assignee.full_name}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-gray-400">Unassigned</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {task.due_date ? (
                          <span className={isOverdue(task.due_date, task.status) ? 'text-red-600 font-medium' : 'text-gray-600'}>
                            {formatDate(task.due_date)}
                            {isOverdue(task.due_date, task.status) && (
                              <Badge variant="danger" size="sm" className="ml-2">Overdue</Badge>
                            )}
                          </span>
                        ) : (
                          <Badge variant="gray" size="sm">No Deadline</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/tasks/${task.id}/edit`}
                            className="p-2 text-gray-500 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>
                          <button
                            onClick={() => handleDelete(task.id)}
                            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-medium text-gray-800 mb-2">No tasks found</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first task.</p>
              <Button onClick={() => navigate('/tasks/create')}>Create New Task</Button>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
};

export default TasksPage;