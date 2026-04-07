/**
 * Task Types
 */

export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskAssignee {
  id: number;
  full_name: string;
  username: string;
  email: string;
  profile_pic?: string;
}

export interface TaskCreator {
  id: number;
  username: string;
  full_name: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  project?: number | null;
  project_name?: string | null;
  created_by: TaskCreator;
  created_by_name?: string;
  assigned_to: TaskAssignee[];
  is_overdue?: boolean;
  assignee_count?: number;
  created_at: string;
  updated_at: string;
}

export interface TaskFormData {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string;
  assigned_to_ids: number[];
  project_id?: number | null;
}

export interface TaskStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  overdue: number;
  due_today: number;
  high_priority: number;
}

export interface TaskTimeEntry {
  id: number;
  task: number;
  task_title: string;
  user: number;
  user_name: string;
  description?: string;
  duration_minutes: number;
  duration_display: string;
  started_at?: string;
  ended_at?: string;
  created_at: string;
}

export const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

export const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];