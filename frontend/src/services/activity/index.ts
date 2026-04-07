/**
 * Activity Log API Service
 */

import client from '@/services/http/client';

export interface ActivityLogEntry {
  id: number;
  user_id: number;
  user_name: string;
  user_username: string;
  action: string;
  description: string;
  target_type?: string;
  target_id?: number;
  metadata?: Record<string, any>;
  created_at: string;
}

interface ActivityResponse {
  success: boolean;
  count: number;
  data: ActivityLogEntry[];
}

export const activityApi = {
  async getLogs(action?: string, limit?: number): Promise<ActivityResponse> {
    const params = new URLSearchParams();
    if (action) params.append('action', action);
    if (limit) params.append('limit', String(limit));
    const q = params.toString();
    const url = q ? `/auth/activity-log/?${q}` : '/auth/activity-log/';
    const response = await client.get<ActivityResponse>(url);
    return response.data;
  },
};

export default activityApi;
