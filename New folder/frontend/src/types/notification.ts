/**
 * Notification Types
 */

export type NotificationType = 'task_assigned' | 'support_ticket' | 'note_shared' | 'task_updated' | 'ticket_reply';

export interface Notification {
  id: number;
  user_id: number;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  reference_id?: number;
  reference_type?: string;
  created_at: string;
}

export interface NotificationGroup {
  date: string;
  label: string;
  notifications: Notification[];
}