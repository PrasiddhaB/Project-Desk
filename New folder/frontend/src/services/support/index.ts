/**
 * Support Tickets API Service
 */

import client from '@/services/http/client';
import { SupportTicket, TicketStatus, TicketPriority } from '@/types';

interface ApiResponse<T> {
  message?: string;
  data: T;
  count?: number;
}

interface CreateTicketRequest {
  subject: string;
  description: string;
  priority?: TicketPriority;
}

interface TicketFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
}

export const supportApi = {
  async getTickets(filters?: TicketFilters): Promise<SupportTicket[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    
    const queryString = params.toString();
    const url = queryString ? `/support/?${queryString}` : '/support/';
    
    const response = await client.get<SupportTicket[]>(url);
    return response.data;
  },

  async getTicket(id: number): Promise<SupportTicket> {
    const response = await client.get<ApiResponse<SupportTicket>>(`/support/${id}/`);
    return response.data.data || response.data;
  },

  async createTicket(data: CreateTicketRequest): Promise<SupportTicket> {
    const response = await client.post<ApiResponse<SupportTicket>>('/support/', data);
    return response.data.data;
  },

  async deleteTicket(id: number): Promise<void> {
    await client.delete(`/support/${id}/`);
  },

  async updateStatus(id: number, status: TicketStatus): Promise<SupportTicket> {
    const response = await client.patch<ApiResponse<SupportTicket>>(`/support/${id}/status/`, { status });
    return response.data.data;
  },

  async addReply(ticketId: number, message: string): Promise<any> {
    const response = await client.post(`/support/${ticketId}/reply/`, { message });
    return response.data.data;
  },

  async getMyTickets(): Promise<SupportTicket[]> {
    const response = await client.get<ApiResponse<SupportTicket[]>>('/support/my-tickets/');
    return response.data.data;
  },

  async getStats(): Promise<any> {
    const response = await client.get('/support/stats/');
    return response.data;
  },
};

export default supportApi;
