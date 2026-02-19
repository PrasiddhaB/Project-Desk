/**
 * Project Types
 */

export type ProjectStatus = 'active' | 'on_hold' | 'completed' | 'archived';

export interface ProjectMember {
  id: number;
  username: string;
  full_name: string;
  email: string;
  role: 'admin' | 'employee';
}

export interface Project {
  id: number;
  name: string;
  description: string | null;
  status: ProjectStatus;
  created_by: number;
  created_by_name: string;
  members: ProjectMember[];
  member_count: number;
  task_count: number;
  completed_task_count: number;
  progress_percentage: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectFormData {
  name: string;
  description: string;
  status: ProjectStatus;
  start_date: string;
  end_date: string;
  member_ids: number[];
}

export const PROJECT_STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
];
