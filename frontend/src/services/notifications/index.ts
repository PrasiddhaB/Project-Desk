/**
 * Notifications API Service
 */

import client from '@/services/http/client';
import { Notification } from '@/types';

interface ApiResponse<T> {
  message?: string;
  data: T;
  count?: number;
}

export const notificationApi = {
  async getNotifications(): Promise<Notification[]> {
    const response = await client.get<Notification[]>('/notifications/');
    return response.data;
  },

  async getUnread(): Promise<Notification[]> {
    const response = await client.get<ApiResponse<Notification[]>>('/notifications/unread/');
    return response.data.data;
  },

  async getUnreadCount(): Promise<number> {
    const response = await client.get<{ count: number }>('/notifications/unread-count/');
    return response.data.count;
  },

  async markAsRead(id: number): Promise<void> {
    await client.patch(`/notifications/${id}/read/`);
  },

  async markAsUnread(id: number): Promise<void> {
    await client.patch(`/notifications/${id}/unread/`);
  },

  async markAllAsRead(): Promise<void> {
    await client.post('/notifications/mark-all-read/');
  },

  async deleteNotification(id: number): Promise<void> {
    await client.delete(`/notifications/${id}/`);
  },
};

export default notificationApi;
