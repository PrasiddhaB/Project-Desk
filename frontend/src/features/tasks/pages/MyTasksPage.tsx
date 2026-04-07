/**
 * My Tasks Page - Kanban with Drag & Drop + Search
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Card } from '@/components/ui';
import { PriorityBadge, DueDateBadge } from '@/components/tasks';
import { taskApi } from '@/services/tasks';
import { Task, TaskStatus, TaskStats } from '@/types';

export const MyTasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const dragItem = useRef<number | null>(null);
  const dragOverColumn = useRef<TaskStatus | null>(null);

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleStatusUpdate = async (taskId: number, newStatus: TaskStatus) => {
    try {
      setUpdatingTaskId(taskId);
      await taskApi.updateTaskStatus(taskId, newStatus);
      setTasks(prev => prev.map(task =>
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
      const newStats = await taskApi.getStats();
      setStats(newStats);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update task status');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // Drag handlers
  const handleDragStart = (taskId: number) => {
    dragItem.current = taskId;
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    dragOverColumn.current = status;
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const taskId = dragItem.current;
    if (taskId !== null) {
      const task = tasks.find(t => t.id === taskId);
      if (task && task.status !== status) {
        handleStatusUpdate(taskId, status);
      }
    }
    dragItem.current = null;
    dragOverColumn.current = null;
  };

  const handleDragEnd = () => {
    dragItem.current = null;
    dragOverColumn.current = null;
  };

  // Filter by search
  const filtered = tasks.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const pendingTasks = filtered.filter(t => t.status === 'pending');
  const inProgressTasks = filtered.filter(t => t.status === 'in_progress');
  const completedTasks = filtered.filter(t => t.status === 'completed');

  // Task Card
  const TaskCard: React.FC<{ task: Task }> = ({ task }) => (
    <div
      draggable
      onDragStart={() => handleDragStart(task.id)}
      onDragEnd={handleDragEnd}
      className={`bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 mb-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${
        updatingTaskId === task.id ? 'opacity-50' : ''
      }`}
    >
      <Link to={`/my-tasks/${task.id}`} className="block">
        <h4 className="font-medium text-slate-800 dark:text-slate-100 mb-2 hover:text-primary-500">
          {task.title}
        </h4>
      </Link>

      <div className="flex items-center gap-2 flex-wrap mb-3">
        <PriorityBadge priority={task.priority} />
        <DueDateBadge dueDate={task.due_date} status={task.status} />
      </div>

      {/* Quick status buttons */}
      <div className="flex gap-1 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
        {task.status !== 'pending' && (
          <button
            onClick={() => handleStatusUpdate(task.id, 'pending')}
            className="flex-1 text-xs py-1.5 px-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            disabled={updatingTaskId === task.id}
          >
            Pending
          </button>
        )}
        {task.status !== 'in_progress' && (
          <button
            onClick={() => handleStatusUpdate(task.id, 'in_progress')}
            className="flex-1 text-xs py-1.5 px-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-200 transition-colors"
            disabled={updatingTaskId === task.id}
          >
            In Progress
          </button>
        )}
        {task.status !== 'completed' && (
          <button
            onClick={() => handleStatusUpdate(task.id, 'completed')}
            className="flex-1 text-xs py-1.5 px-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded hover:bg-green-200 transition-colors"
            disabled={updatingTaskId === task.id}
          >
            Complete
          </button>
        )}
      </div>
    </div>
  );

  // Column with drop zone
  const Column: React.FC<{
    title: string;
    count: number;
    tasks: Task[];
    color: string;
    status: TaskStatus;
  }> = ({ title, count, tasks: columnTasks, color, status }) => {
    const [isDragOver, setIsDragOver] = useState(false);

    return (
      <div className="flex-1 min-w-[300px]">
        <div className={`rounded-t-lg px-4 py-3 ${color}`}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">{title}</h3>
            <span className="bg-white/20 text-white text-sm px-2 py-0.5 rounded-full">
              {count}
            </span>
          </div>
        </div>
        <div
          onDragOver={e => { handleDragOver(e, status); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={e => { handleDrop(e, status); setIsDragOver(false); }}
          className={`rounded-b-lg p-3 min-h-[400px] transition-colors ${
            isDragOver
              ? 'bg-primary-50 dark:bg-primary-500/10 border-2 border-dashed border-primary-400'
              : 'bg-slate-100 dark:bg-slate-800/50 border-2 border-transparent'
          }`}
        >
          {columnTasks.length > 0 ? (
            columnTasks.map(task => <TaskCard key={task.id} task={task} />)
          ) : (
            <div className="text-center py-8 text-slate-400 text-sm">
              {isDragOver ? 'Drop here' : 'No tasks'}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="p-6 min-h-full">
        {/* Header + Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">My Tasks</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Track and manage your assigned tasks</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-64 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />
            </div>
            <button onClick={fetchTasks} className="p-2 text-slate-500 hover:text-primary-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="border border-slate-200 dark:border-slate-700 shadow-sm p-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Tasks</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.total}</p>
            </Card>
            <Card className="border border-slate-200 dark:border-slate-700 shadow-sm p-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">{stats.in_progress}</p>
            </Card>
            <Card className="border border-slate-200 dark:border-slate-700 shadow-sm p-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
            </Card>
            <Card className="border border-slate-200 dark:border-slate-700 shadow-sm p-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </Card>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg mb-6">{error}</div>
        )}

        {loading ? (
          <Card className="border-0 shadow-sm">
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-500">Loading tasks...</p>
            </div>
          </Card>
        ) : (
          <>
            <p className="text-xs text-slate-400 mb-3">Drag and drop tasks between columns to change status</p>
            <div className="flex gap-6 overflow-x-auto pb-4">
              <Column title="Pending" count={pendingTasks.length} tasks={pendingTasks} color="bg-slate-500" status="pending" />
              <Column title="In Progress" count={inProgressTasks.length} tasks={inProgressTasks} color="bg-blue-500" status="in_progress" />
              <Column title="Completed" count={completedTasks.length} tasks={completedTasks} color="bg-green-500" status="completed" />
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default MyTasksPage;
