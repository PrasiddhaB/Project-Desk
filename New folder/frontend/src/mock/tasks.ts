/**
 * Mock Tasks Data
 */

import { Task, TaskStatus, TaskPriority } from '@/types';
import { mockUsers } from './users';

export const mockTasks: Task[] = [
  {
    id: 1,
    title: 'Complete FYP Documentation',
    description: 'Write the final year project documentation including all chapters and references.',
    status: 'pending',
    priority: 'high',
    due_date: '2026-01-31',
    created_by: 1,
    created_by_name: 'Darshan Admin',
    assigned_to: [
      { id: 2, full_name: 'Abiral Sharma', username: 'abiral', email: 'abiral@projectdesk.com' },
    ],
    created_at: '2026-01-10T08:00:00Z',
    updated_at: '2026-01-10T08:00:00Z',
  },
  {
    id: 2,
    title: 'Design Database Schema',
    description: 'Create the complete database schema for the project management system.',
    status: 'completed',
    priority: 'high',
    due_date: '2026-01-15',
    created_by: 1,
    created_by_name: 'Darshan Admin',
    assigned_to: [
      { id: 3, full_name: 'Samprada Thapa', username: 'samprada', email: 'samprada@projectdesk.com' },
    ],
    created_at: '2026-01-05T09:00:00Z',
    updated_at: '2026-01-14T16:00:00Z',
  },
  {
    id: 3,
    title: 'Implement User Authentication',
    description: 'Build the login, register, and JWT token authentication system.',
    status: 'in_progress',
    priority: 'urgent',
    due_date: '2026-01-20',
    created_by: 1,
    created_by_name: 'Darshan Admin',
    assigned_to: [
      { id: 2, full_name: 'Abiral Sharma', username: 'abiral', email: 'abiral@projectdesk.com' },
      { id: 4, full_name: 'Rajesh Hamal', username: 'rajesh', email: 'rajesh@projectdesk.com' },
    ],
    created_at: '2026-01-08T10:00:00Z',
    updated_at: '2026-01-12T14:00:00Z',
  },
  {
    id: 4,
    title: 'Create Dashboard UI',
    description: 'Design and implement the main dashboard with statistics and charts.',
    status: 'pending',
    priority: 'medium',
    due_date: '2026-01-25',
    created_by: 1,
    created_by_name: 'Darshan Admin',
    assigned_to: [
      { id: 5, full_name: 'Priya Gurung', username: 'priya', email: 'priya@projectdesk.com' },
    ],
    created_at: '2026-01-09T11:00:00Z',
    updated_at: '2026-01-09T11:00:00Z',
  },
  {
    id: 5,
    title: 'Write API Documentation',
    description: 'Document all REST API endpoints with request/response examples.',
    status: 'pending',
    priority: 'low',
    due_date: null,
    created_by: 1,
    created_by_name: 'Darshan Admin',
    assigned_to: [
      { id: 3, full_name: 'Samprada Thapa', username: 'samprada', email: 'samprada@projectdesk.com' },
    ],
    created_at: '2026-01-07T08:30:00Z',
    updated_at: '2026-01-07T08:30:00Z',
  },
  {
    id: 6,
    title: 'Setup CI/CD Pipeline',
    description: 'Configure GitHub Actions for automated testing and deployment.',
    status: 'in_progress',
    priority: 'medium',
    due_date: '2026-01-18',
    created_by: 1,
    created_by_name: 'Darshan Admin',
    assigned_to: [
      { id: 4, full_name: 'Rajesh Hamal', username: 'rajesh', email: 'rajesh@projectdesk.com' },
    ],
    created_at: '2026-01-06T14:00:00Z',
    updated_at: '2026-01-11T09:00:00Z',
  },
  {
    id: 7,
    title: 'Mobile Responsive Design',
    description: 'Make all pages mobile responsive with proper breakpoints.',
    status: 'pending',
    priority: 'high',
    due_date: '2026-01-28',
    created_by: 1,
    created_by_name: 'Darshan Admin',
    assigned_to: [
      { id: 5, full_name: 'Priya Gurung', username: 'priya', email: 'priya@projectdesk.com' },
      { id: 2, full_name: 'Abiral Sharma', username: 'abiral', email: 'abiral@projectdesk.com' },
    ],
    created_at: '2026-01-10T15:00:00Z',
    updated_at: '2026-01-10T15:00:00Z',
  },
  {
    id: 8,
    title: 'Unit Testing',
    description: 'Write unit tests for all service functions with minimum 80% coverage.',
    status: 'pending',
    priority: 'medium',
    due_date: '2026-02-05',
    created_by: 1,
    created_by_name: 'Darshan Admin',
    assigned_to: [
      { id: 3, full_name: 'Samprada Thapa', username: 'samprada', email: 'samprada@projectdesk.com' },
      { id: 4, full_name: 'Rajesh Hamal', username: 'rajesh', email: 'rajesh@projectdesk.com' },
    ],
    created_at: '2026-01-11T10:00:00Z',
    updated_at: '2026-01-11T10:00:00Z',
  },
  {
    id: 9,
    title: 'Security Audit',
    description: 'Perform security audit and fix any vulnerabilities found.',
    status: 'pending',
    priority: 'urgent',
    due_date: '2026-01-22',
    created_by: 1,
    created_by_name: 'Darshan Admin',
    assigned_to: [
      { id: 2, full_name: 'Abiral Sharma', username: 'abiral', email: 'abiral@projectdesk.com' },
    ],
    created_at: '2026-01-12T08:00:00Z',
    updated_at: '2026-01-12T08:00:00Z',
  },
  {
    id: 10,
    title: 'Performance Optimization',
    description: 'Optimize database queries and frontend bundle size.',
    status: 'completed',
    priority: 'medium',
    due_date: '2026-01-10',
    created_by: 1,
    created_by_name: 'Darshan Admin',
    assigned_to: [
      { id: 4, full_name: 'Rajesh Hamal', username: 'rajesh', email: 'rajesh@projectdesk.com' },
    ],
    created_at: '2026-01-03T09:00:00Z',
    updated_at: '2026-01-10T17:00:00Z',
  },
];

export const getTaskById = (id: number): Task | undefined => {
  return mockTasks.find(task => task.id === id);
};

export const getTasksByUserId = (userId: number): Task[] => {
  return mockTasks.filter(task => 
    task.assigned_to.some(assignee => assignee.id === userId)
  );
};

export const getTasksByStatus = (status: TaskStatus): Task[] => {
  return mockTasks.filter(task => task.status === status);
};

export const getTasksDueToday = (): Task[] => {
  const today = new Date().toISOString().split('T')[0];
  return mockTasks.filter(task => task.due_date === today);
};

export const getOverdueTasks = (): Task[] => {
  const today = new Date().toISOString().split('T')[0];
  return mockTasks.filter(task => 
    task.due_date && task.due_date < today && task.status !== 'completed'
  );
};

export const getTasksWithNoDeadline = (): Task[] => {
  return mockTasks.filter(task => !task.due_date);
};

export const filterTasks = (
  status?: TaskStatus,
  priority?: TaskPriority,
  search?: string
): Task[] => {
  let filtered = [...mockTasks];

  if (status) {
    filtered = filtered.filter(task => task.status === status);
  }

  if (priority) {
    filtered = filtered.filter(task => task.priority === priority);
  }

  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(
      task =>
        task.title.toLowerCase().includes(searchLower) ||
        task.description.toLowerCase().includes(searchLower)
    );
  }

  return filtered;
};