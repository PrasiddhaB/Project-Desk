/**
 * Calendar API Service
 */

import client from '@/services/http/client';

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: 'task' | 'note';
  status: string;
  priority?: string;
  color: string;
  url: string;
  assignee?: string;
  project?: string;
  is_private?: boolean;
  owner?: string;
}

interface CalendarResponse {
  events: CalendarEvent[];
  count: number;
  start_date: string;
  end_date: string;
}

export const calendarApi = {
  async getEvents(start?: string, end?: string, type?: 'all' | 'tasks' | 'notes'): Promise<CalendarEvent[]> {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    if (type) params.append('type', type);
    
    const response = await client.get<CalendarResponse>(`/calendar/events/?${params.toString()}`);
    return response.data.events;
  },

  async getTaskEvents(start?: string, end?: string): Promise<CalendarEvent[]> {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    
    const response = await client.get<CalendarResponse>(`/calendar/tasks/?${params.toString()}`);
    return response.data.events;
  },

  async getNoteEvents(start?: string, end?: string): Promise<CalendarEvent[]> {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    
    const response = await client.get<CalendarResponse>(`/calendar/notes/?${params.toString()}`);
    return response.data.events;
  },
};

export default calendarApi;
