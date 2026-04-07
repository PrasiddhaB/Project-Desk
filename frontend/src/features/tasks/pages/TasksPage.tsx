/**
 * Tasks Page - Admin view with Table + Kanban toggle
 * Includes drag and drop functionality
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Card, Button, Badge, Avatar } from '@/components/ui';
import { StatusBadge, PriorityBadge, DueDateBadge } from '@/components/tasks';
import { taskApi } from '@/services/tasks';
import { Task, TaskStatus, TaskPriority, STATUS_OPTIONS, PRIORITY_OPTIONS } from '@/types';

type ViewMode = 'table' | 'kanban';

export const TasksPage: React.FC = () => {
  const navigate = useNavigate();
  
  // State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);
  const [showStatusEditor, setShowStatusEditor] = useState(false);
  
  // Custom statuses (stored in localStorage)
  const [customStatuses, setCustomStatuses] = useState<{key: string; label: string; icon: string}[]>(() => {
    const saved = localStorage.getItem('pd-task-statuses');
    if (saved) return JSON.parse(saved);
    return [
      { key: 'pending', label: 'Pending', icon: '📋' },
      { key: 'in_progress', label: 'In Progress', icon: '🚀' },
      { key: 'completed', label: 'Completed', icon: '✅' },
    ];
  });
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | ''>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters: any = {};
      if (statusFilter) filters.status = statusFilter;
      if (priorityFilter) filters.priority = priorityFilter;
      if (searchQuery) filters.search = searchQuery;
      
      const data = await taskApi.getTasks(filters);
      setTasks(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load tasks');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, priorityFilter]);

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTasks();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Delete task
  const handleDelete = async (id: number, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    
    try {
      await taskApi.deleteTask(id);
      setTasks(tasks.filter(t => t.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete task');
    }
  };

  // Update task status (for drag & drop)
  const handleStatusUpdate = async (taskId: number, newStatus: TaskStatus) => {
    try {
      setUpdatingTaskId(taskId);
      await taskApi.updateTaskStatus(taskId, newStatus);
      
      // Update local state
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update task status');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== newStatus) {
      handleStatusUpdate(draggedTask.id, newStatus);
    }
    setDraggedTask(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Group tasks by status for Kanban
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  // Kanban Card Component
  const KanbanCard: React.FC<{ task: Task }> = ({ task }) => (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, task)}
      onDragEnd={handleDragEnd}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3 cursor-move hover:shadow-md transition-shadow ${
        updatingTaskId === task.id ? 'opacity-50' : ''
      } ${draggedTask?.id === task.id ? 'opacity-50 border-dashed' : ''}`}
    >
      <Link to={`/tasks/${task.id}`} className="block">
        <h4 className="font-medium text-gray-800 mb-2 hover:text-primary-500">
          {task.title}
        </h4>
      </Link>
      
      <div className="flex items-center gap-2 mb-3">
        <PriorityBadge priority={task.priority} />
        <DueDateBadge dueDate={task.due_date} status={task.status} />
      </div>
      
      {task.due_date && (
        <div className="text-xs text-gray-500 mb-2">
          {(() => {
            const today = new Date(); today.setHours(0,0,0,0);
            const due = new Date(task.due_date + 'T00:00:00');
            const diff = Math.ceil((due.getTime() - today.getTime()) / 86400000);
            if (diff < 0) return '';
            if (diff === 0) return 'Due today';
            return `${diff} days left`;
          })()}
        </div>
      )}

      {/* Assignees */}
      {task.assigned_to.length > 0 && (
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex -space-x-2">
            {task.assigned_to.slice(0, 3).map(user => (
              <Avatar key={user.id} name={user.full_name} size="xs" />
            ))}
            {task.assigned_to.length > 3 && (
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-xs text-gray-600">
                +{task.assigned_to.length - 3}
              </span>
            )}
          </div>
          <div className="flex gap-1">
            <Link
              to={`/tasks/${task.id}/edit`}
              className="p-1 text-gray-400 hover:text-blue-500"
              onClick={(e) => e.stopPropagation()}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Link>
          </div>
        </div>
      )}
    </div>
  );

  // Kanban Column Component
  const KanbanColumn: React.FC<{
    title: string;
    status: TaskStatus;
    count: number;
    tasks: Task[];
    color: string;
  }> = ({ title, status, count, tasks: columnTasks, color }) => (
    <div className="flex-1 min-w-[320px]">
      <div className={`rounded-t-lg px-4 py-3 ${color}`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white">{title}</h3>
          <span className="bg-white/20 text-white text-sm px-2 py-0.5 rounded-full">
            {count}
          </span>
        </div>
      </div>
      <div 
        className={`bg-gray-100 rounded-b-lg p-3 min-h-[500px] transition-colors ${
          draggedTask && draggedTask.status !== status ? 'bg-gray-200 border-2 border-dashed border-gray-400' : ''
        }`}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, status)}
      >
        {columnTasks.length > 0 ? (
          columnTasks.map(task => <KanbanCard key={task.id} task={task} />)
        ) : (
          <div className="text-center py-8 text-gray-400 text-sm">
            {draggedTask ? 'Drop here' : 'No tasks'}
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
            <h1 className="text-2xl font-bold text-gray-800">Task Management</h1>
            <p className="text-gray-500 mt-1">Manage and assign tasks to employees</p>
          </div>
          <Button onClick={() => navigate('/tasks/create')}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Task
          </Button>
        </div>

        {/* Filters & View Toggle */}
        <Card className="border-0 shadow-sm mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as TaskStatus | '')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Status</option>
              {STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value as TaskPriority | '')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Priority</option>
              {PRIORITY_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'table' 
                    ? 'bg-white text-gray-800 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                Table
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'kanban' 
                    ? 'bg-white text-gray-800 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
                Kanban
              </button>
            </div>

            {/* Refresh */}
            <Button variant="outline" onClick={fetchTasks}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </Button>

            {/* Status Editor */}
            <Button variant="outline" onClick={() => setShowStatusEditor(true)} title="Edit task statuses">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Button>
          </div>
        </Card>

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
        ) : viewMode === 'table' ? (
          /* TABLE VIEW */
          <Card className="border-0 shadow-sm overflow-hidden">
            {tasks.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Task</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Priority</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Due Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Est. Time</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Responsible</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Project</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {tasks.map(task => (
                      <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <Link to={`/tasks/${task.id}`} className="font-medium text-gray-800 hover:text-primary-500">
                            {task.title}
                          </Link>
                          {task.is_overdue && (
                            <Badge variant="danger" size="sm" className="ml-2">Overdue</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={task.status} />
                        </td>
                        <td className="py-3 px-4">
                          <PriorityBadge priority={task.priority} />
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {formatDate(task.due_date)}
                        </td>
                        <td className="py-3 px-4 text-gray-500 text-sm">
                          —
                        </td>
                        <td className="py-3 px-4">
                          {task.assigned_to.length > 0 ? (
                            <div className="flex items-center gap-2">
                              <Avatar name={task.assigned_to[0].full_name} size="xs" />
                              <span className="text-sm text-gray-700">{task.assigned_to[0].full_name}</span>
                              {task.assigned_to.length > 1 && (
                                <span className="text-xs text-gray-400">+{task.assigned_to.length - 1}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm italic">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {task.project_name || (
                            <span className="text-gray-400 italic">Independent</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={`/tasks/${task.id}`}
                              className="p-2 text-gray-500 hover:text-primary-500 transition-colors"
                              title="View"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </Link>
                            <Link
                              to={`/tasks/${task.id}/edit`}
                              className="p-2 text-gray-500 hover:text-blue-500 transition-colors"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Link>
                            <button
                              onClick={() => handleDelete(task.id, task.title)}
                              className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                              title="Delete"
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
                <h3 className="text-lg font-medium text-gray-800 mb-2">No Tasks Found</h3>
                <p className="text-gray-500 mb-4">Get started by creating your first task</p>
                <Button onClick={() => navigate('/tasks/create')}>Create Task</Button>
              </div>
            )}
          </Card>
        ) : (
          /* KANBAN VIEW */
          <div className="flex gap-6 overflow-x-auto pb-4">
            <KanbanColumn
              title="Pending"
              status="pending"
              count={pendingTasks.length}
              tasks={pendingTasks}
              color="bg-gray-500"
            />
            <KanbanColumn
              title="In Progress"
              status="in_progress"
              count={inProgressTasks.length}
              tasks={inProgressTasks}
              color="bg-blue-500"
            />
            <KanbanColumn
              title="Completed"
              status="completed"
              count={completedTasks.length}
              tasks={completedTasks}
              color="bg-green-500"
            />
          </div>
        )}
      </div>

      {/* Status Editor Modal */}
      {showStatusEditor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => setShowStatusEditor(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Edit task statuses</h2>
            
            <div className="space-y-3 mb-6">
              {customStatuses.map((s, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-slate-700">
                  <span className="text-lg">{s.icon}</span>
                  <input
                    type="text"
                    value={s.label}
                    onChange={e => {
                      const updated = [...customStatuses];
                      updated[i] = { ...updated[i], label: e.target.value };
                      setCustomStatuses(updated);
                    }}
                    className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-gray-800 dark:text-white"
                  />
                  {customStatuses.length > 2 && s.key !== 'completed' && (
                    <button
                      onClick={() => setCustomStatuses(customStatuses.filter((_, j) => j !== i))}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}

              {/* Completed always at bottom, separated */}
              <div className="pt-2 border-t border-gray-200 dark:border-slate-700 mt-2">
                <p className="text-xs text-gray-400 mb-2">Done status (cannot be removed)</p>
              </div>
            </div>

            {/* Add new status */}
            <button
              onClick={() => {
                const key = `custom_${Date.now()}`;
                setCustomStatuses(prev => {
                  const withoutCompleted = prev.filter(s => s.key !== 'completed');
                  const completed = prev.find(s => s.key === 'completed');
                  return [...withoutCompleted, { key, label: 'New Status', icon: '📌' }, ...(completed ? [completed] : [])];
                });
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-primary-500 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg transition-colors mb-6"
            >
              + Add new status
            </button>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowStatusEditor(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  localStorage.setItem('pd-task-statuses', JSON.stringify(customStatuses));
                  setShowStatusEditor(false);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default TasksPage;
