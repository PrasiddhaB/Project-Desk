/**
 * Dashboard API Service
 */

import client from '@/services/http/client';

export interface DashboardStats {
  tasks: {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    overdue: number;
    due_today: number;
  };
  notes: {
    total: number;
    private: number;
    shared: number;
  };
  total_employees: number;
  recent_tasks: {
    id: number;
    title: string;
    status: string;
    priority: string;
    due_date: string | null;
  }[];
}

export const dashboardApi = {
  async getStats(): Promise<DashboardStats> {
    const response = await client.get('/auth/dashboard/');
    return response.data.data;
  },
};

export default dashboardApi;
