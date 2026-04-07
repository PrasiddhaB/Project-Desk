/**
 * Task API Service
 * Handles all task-related API calls
 */

import client from '@/services/http/client';
import { Task, TaskStatus, TaskPriority } from '@/types';

// API Response types
interface ApiResponse<T> {
  message?: string;
  data: T;
  count?: number;
}

interface TaskStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  overdue: number;
  due_today: number;
  high_priority: number;
}

// Request types
interface CreateTaskRequest {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
  assigned_to_ids?: number[];
}

interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
  assigned_to_ids?: number[];
}

interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee?: number;
  overdue?: boolean;
  due_today?: boolean;
  search?: string;
}

interface AssignUsersRequest {
  user_ids: number[];
  action: 'add' | 'remove' | 'set';
}

/**
 * Task API Service
 */
export const taskApi = {
  /**
   * Get all tasks (admin sees all, employee sees assigned only)
   */
  async getTasks(filters?: TaskFilters): Promise<Task[]> {
    const params = new URLSearchParams();
    
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.assignee) params.append('assignee', String(filters.assignee));
    if (filters?.overdue) params.append('overdue', 'true');
    if (filters?.due_today) params.append('due_today', 'true');
    if (filters?.search) params.append('search', filters.search);
    
    const queryString = params.toString();
    const url = queryString ? `/tasks/?${queryString}` : '/tasks/';
    
    const response = await client.get<Task[]>(url);
    return response.data;
  },

  /**
   * Get single task by ID
   */
  async getTask(id: number): Promise<Task> {
    const response = await client.get<ApiResponse<Task>>(`/tasks/${id}/`);
    return response.data.data || response.data;
  },

  /**
   * Create new task (admin only)
   */
  async createTask(data: CreateTaskRequest): Promise<Task> {
    const response = await client.post<ApiResponse<Task>>('/tasks/', data);
    return response.data.data;
  },

  /**
   * Update task (admin only)
   */
  async updateTask(id: number, data: UpdateTaskRequest): Promise<Task> {
    const response = await client.put<ApiResponse<Task>>(`/tasks/${id}/`, data);
    return response.data.data;
  },

  /**
   * Partially update task (admin only)
   */
  async patchTask(id: number, data: Partial<UpdateTaskRequest>): Promise<Task> {
    const response = await client.patch<ApiResponse<Task>>(`/tasks/${id}/`, data);
    return response.data.data;
  },

  /**
   * Delete task (admin only)
   */
  async deleteTask(id: number): Promise<void> {
    await client.delete(`/tasks/${id}/`);
  },

  /**
   * Update task status only (admin or assignee)
   */
  async updateTaskStatus(id: number, status: TaskStatus): Promise<Task> {
    const response = await client.patch<ApiResponse<Task>>(`/tasks/${id}/status/`, {
      status,
    });
    return response.data.data;
  },

  /**
   * Assign users to task (admin only)
   */
  async assignUsers(id: number, data: AssignUsersRequest): Promise<Task> {
    const response = await client.post<ApiResponse<Task>>(`/tasks/${id}/assign/`, data);
    return response.data.data;
  },

  /**
   * Get current user's assigned tasks
   */
  async getMyTasks(status?: TaskStatus): Promise<Task[]> {
    const url = status ? `/tasks/my-tasks/?status=${status}` : '/tasks/my-tasks/';
    const response = await client.get<ApiResponse<Task[]>>(url);
    return response.data.data;
  },

  /**
   * Get task statistics
   */
  async getStats(): Promise<TaskStats> {
    const response = await client.get<TaskStats>('/tasks/stats/');
    return response.data;
  },

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(): Promise<Task[]> {
    const response = await client.get<ApiResponse<Task[]>>('/tasks/overdue/');
    return response.data.data;
  },

  /**
   * Get tasks due today
   */
  async getDueTodayTasks(): Promise<Task[]> {
    const response = await client.get<ApiResponse<Task[]>>('/tasks/due-today/');
    return response.data.data;
  },

  // ========== TIME TRACKING ==========

  /**
   * Get time entries for a task
   */
  async getTimeEntries(taskId: number): Promise<{count: number; total_minutes: number; total_display: string; data: any[]}> {
    const response = await client.get(`/tasks/${taskId}/time-entries/`);
    return response.data;
  },

  /**
   * Add time entry to a task
   */
  async addTimeEntry(taskId: number, data: { description?: string; duration_minutes: number }): Promise<any> {
    const response = await client.post(`/tasks/${taskId}/time-entries/`, data);
    return response.data.data;
  },

  /**
   * Delete a time entry
   */
  async deleteTimeEntry(taskId: number, entryId: number): Promise<void> {
    await client.delete(`/tasks/${taskId}/time-entries/${entryId}/`);
  },

  /**
   * Get current user's time entries
   */
  async getMyTimeEntries(limit?: number): Promise<{count: number; total_minutes: number; total_display: string; data: any[]}> {
    const url = limit ? `/tasks/my-time-entries/?limit=${limit}` : '/tasks/my-time-entries/';
    const response = await client.get(url);
    return response.data;
  },
};

export default taskApi;
