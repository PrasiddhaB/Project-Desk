/**
 * Mock Notifications Data
 */

import { Notification, NotificationGroup } from '@/types';

export const mockNotifications: Notification[] = [
  {
    id: 1,
    user_id: 2,
    type: 'task_assigned',
    title: 'New Task Assigned',
    message: "'Complete FYP Documentation' has been assigned to you. Please review and start working on it.",
    is_read: false,
    reference_id: 1,
    reference_type: 'task',
    created_at: '2026-01-13T08:00:00Z',
  },
  {
    id: 2,
    user_id: 2,
    type: 'note_shared',
    title: 'Note Shared',
    message: "A note titled 'Meeting Notes - Sprint Planning' has been shared with you.",
    is_read: false,
    reference_id: 3,
    reference_type: 'note',
    created_at: '2026-01-12T14:30:00Z',
  },
  {
    id: 3,
    user_id: 2,
    type: 'task_assigned',
    title: 'New Task Assigned',
    message: "'Security Audit' has been assigned to you. Please review and start working on it.",
    is_read: true,
    reference_id: 9,
    reference_type: 'task',
    created_at: '2026-01-12T08:00:00Z',
  },
  {
    id: 4,
    user_id: 1,
    type: 'support_ticket',
    title: 'Support Ticket',
    message: "New support ticket (#1): 'Login issue' submitted by Abiral",
    is_read: false,
    reference_id: 1,
    reference_type: 'ticket',
    created_at: '2026-01-11T10:00:00Z',
  },
  {
    id: 5,
    user_id: 1,
    type: 'support_ticket',
    title: 'Support Ticket',
    message: "New support ticket (#2): 'Payment not working' submitted by Samprada",
    is_read: true,
    reference_id: 2,
    reference_type: 'ticket',
    created_at: '2026-01-10T15:00:00Z',
  },
  {
    id: 6,
    user_id: 3,
    type: 'task_assigned',
    title: 'New Task Assigned',
    message: "'Unit Testing' has been assigned to you. Please review and start working on it.",
    is_read: false,
    reference_id: 8,
    reference_type: 'task',
    created_at: '2026-01-11T10:00:00Z',
  },
  {
    id: 7,
    user_id: 2,
    type: 'ticket_reply',
    title: 'Ticket Reply',
    message: "Admin replied to your ticket 'Login issue'",
    is_read: true,
    reference_id: 1,
    reference_type: 'ticket',
    created_at: '2026-01-11T12:00:00Z',
  },
  {
    id: 8,
    user_id: 4,
    type: 'task_updated',
    title: 'Task Updated',
    message: "'Setup CI/CD Pipeline' status has been updated to In Progress",
    is_read: true,
    reference_id: 6,
    reference_type: 'task',
    created_at: '2026-01-11T09:00:00Z',
  },
];

export const getNotificationsByUserId = (userId: number): Notification[] => {
  return mockNotifications
    .filter(n => n.user_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

export const getUnreadNotificationsByUserId = (userId: number): Notification[] => {
  return getNotificationsByUserId(userId).filter(n => !n.is_read);
};

export const getUnreadCount = (userId: number): number => {
  return getUnreadNotificationsByUserId(userId).length;
};

export const groupNotificationsByDate = (notifications: Notification[]): NotificationGroup[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const groups: { [key: string]: Notification[] } = {};
  
  notifications.forEach(notification => {
    const notifDate = new Date(notification.created_at);
    notifDate.setHours(0, 0, 0, 0);
    
    let label: string;
    if (notifDate.getTime() === today.getTime()) {
      label = 'Today';
    } else if (notifDate.getTime() === yesterday.getTime()) {
      label = 'Yesterday';
    } else {
      label = notifDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    }
    
    if (!groups[label]) {
      groups[label] = [];
    }
    groups[label].push(notification);
  });
  
  return Object.entries(groups).map(([label, notifications]) => ({
    date: label,
    label,
    notifications,
  }));
};

export const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
};