/**
 * My Tasks Page - Employee Kanban view
 * Dynamic - connects to backend API
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Card, Badge, Avatar } from '@/components/ui';
import { PriorityBadge } from '@/components/tasks';
import { taskApi } from '@/services/tasks';
import { Task, TaskStatus, TaskStats } from '@/types';

export const MyTasksPage: React.FC = () => {
  // State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [tasksData, statsData] = await Promise.all([
        taskApi.getMyTasks(),
        taskApi.getStats(),
      ]);
      
      setTasks(tasksData);
      setStats(statsData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load tasks');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Update task status (drag & drop simulation)
  const handleStatusUpdate = async (taskId: number, newStatus: TaskStatus) => {
    try {
      setUpdatingTaskId(taskId);
      await taskApi.updateTaskStatus(taskId, newStatus);
      
      // Update local state
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
      
      // Refresh stats
      const newStats = await taskApi.getStats();
      setStats(newStats);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update task status');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // Group tasks by status
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Task Card Component
  const TaskCard: React.FC<{ task: Task }> = ({ task }) => (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3 ${
      updatingTaskId === task.id ? 'opacity-50' : ''
    }`}>
      <Link to={`/my-tasks/${task.id}`} className="block">
        <h4 className="font-medium text-gray-800 mb-2 hover:text-primary-500">
          {task.title}
        </h4>
      </Link>
      
      <div className="flex items-center gap-2 mb-3">
        <PriorityBadge priority={task.priority} />
        {task.is_overdue && <Badge variant="danger" size="sm">Overdue</Badge>}
      </div>
      
      {task.due_date && (
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Due: {formatDate(task.due_date)}</span>
        </div>
      )}
      
      {/* Status Actions */}
      <div className="flex gap-1 mt-3 pt-3 border-t border-gray-100">
        {task.status !== 'pending' && (
          <button
            onClick={() => handleStatusUpdate(task.id, 'pending')}
            className="flex-1 text-xs py-1.5 px-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
            disabled={updatingTaskId === task.id}
          >
            Pending
          </button>
        )}
        {task.status !== 'in_progress' && (
          <button
            onClick={() => handleStatusUpdate(task.id, 'in_progress')}
            className="flex-1 text-xs py-1.5 px-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
            disabled={updatingTaskId === task.id}
          >
            In Progress
          </button>
        )}
        {task.status !== 'completed' && (
          <button
            onClick={() => handleStatusUpdate(task.id, 'completed')}
            className="flex-1 text-xs py-1.5 px-2 bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors"
            disabled={updatingTaskId === task.id}
          >
            Complete
          </button>
        )}
      </div>
    </div>
  );

  // Column Component
  const Column: React.FC<{
    title: string;
    count: number;
    tasks: Task[];
    color: string;
  }> = ({ title, count, tasks: columnTasks, color }) => (
    <div className="flex-1 min-w-[300px]">
      <div className={`rounded-t-lg px-4 py-3 ${color}`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white">{title}</h3>
          <span className="bg-white/20 text-white text-sm px-2 py-0.5 rounded-full">
            {count}
          </span>
        </div>
      </div>
      <div className="bg-gray-100 rounded-b-lg p-3 min-h-[400px]">
        {columnTasks.length > 0 ? (
          columnTasks.map(task => <TaskCard key={task.id} task={task} />)
        ) : (
          <div className="text-center py-8 text-gray-400 text-sm">
            No tasks
          </div>
        )}
      </div>
    </div>
  );

  return (
    <AppLayout>
      <div className="p-6 bg-gray-50 min-h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">My Tasks</h1>
            <p className="text-gray-500 mt-1">Track and manage your assigned tasks</p>
          </div>
          <button onClick={fetchTasks} className="p-2 text-gray-500 hover:text-primary-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-0 shadow-sm p-4">
              <p className="text-sm text-gray-500">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </Card>
            <Card className="border-0 shadow-sm p-4">
              <p className="text-sm text-gray-500">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">{stats.in_progress}</p>
            </Card>
            <Card className="border-0 shadow-sm p-4">
              <p className="text-sm text-gray-500">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
            </Card>
            <Card className="border-0 shadow-sm p-4">
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </Card>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <Card className="border-0 shadow-sm">
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading tasks...</p>
            </div>
          </Card>
        ) : (
          /* Kanban Board */
          <div className="flex gap-6 overflow-x-auto pb-4">
            <Column
              title="Pending"
              count={pendingTasks.length}
              tasks={pendingTasks}
              color="bg-gray-500"
            />
            <Column
              title="In Progress"
              count={inProgressTasks.length}
              tasks={inProgressTasks}
              color="bg-blue-500"
            />
            <Column
              title="Completed"
              count={completedTasks.length}
              tasks={completedTasks}
              color="bg-green-500"
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default MyTasksPage;
