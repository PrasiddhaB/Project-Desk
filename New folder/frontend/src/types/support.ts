/**
 * Support Ticket Types
 */

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TicketReply {
  id: number;
  ticket_id: number;
  user_id: number;
  user_name: string;
  user_role: 'admin' | 'employee';
  is_admin: boolean;
  message: string;
  created_at: string;
}

export interface SupportTicket {
  id: number;
  user_id: number;
  user_name: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  replies: TicketReply[];
  created_at: string;
  updated_at: string;
}

export interface TicketFormData {
  subject: string;
  description: string;
  priority: TicketPriority;
}

export const TICKET_STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

export const TICKET_PRIORITY_OPTIONS: { value: TicketPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];