/**
 * Mock Support Tickets Data
 */

import { SupportTicket } from '@/types';

export const mockTickets: SupportTicket[] = [
  {
    id: 1,
    user_id: 2,
    user_name: 'Abiral Sharma',
    subject: 'Login issue on mobile',
    description: 'I am unable to login from my mobile device. The page keeps refreshing after I enter my credentials.',
    status: 'in_progress',
    priority: 'high',
    replies: [
      {
        id: 1,
        ticket_id: 1,
        user_id: 2,
        user_name: 'Abiral Sharma',
        user_role: 'employee',
        is_admin: false,
        message: 'I have tried clearing cache but still facing the same issue.',
        created_at: '2026-01-11T10:30:00Z',
      },
      {
        id: 2,
        ticket_id: 1,
        user_id: 1,
        user_name: 'Darshan Admin',
        user_role: 'admin',
        is_admin: true,
        message: 'Thank you for reporting. We are looking into this issue. Can you please tell us which browser and device you are using?',
        created_at: '2026-01-11T12:00:00Z',
      },
      {
        id: 3,
        ticket_id: 1,
        user_id: 2,
        user_name: 'Abiral Sharma',
        user_role: 'employee',
        is_admin: false,
        message: 'I am using Chrome on iPhone 13.',
        created_at: '2026-01-11T12:30:00Z',
      },
    ],
    created_at: '2026-01-11T10:00:00Z',
    updated_at: '2026-01-11T12:30:00Z',
  },
  {
    id: 2,
    user_id: 3,
    user_name: 'Samprada Thapa',
    subject: 'Payment not working through Khalti',
    description: 'I am not able to pay through Khalti. The payment gateway shows an error after OTP verification.',
    status: 'open',
    priority: 'urgent',
    replies: [],
    created_at: '2026-01-10T15:00:00Z',
    updated_at: '2026-01-10T15:00:00Z',
  },
  {
    id: 3,
    user_id: 4,
    user_name: 'Rajesh Hamal',
    subject: 'How to export tasks?',
    description: 'Is there a way to export my tasks to Excel or PDF format? I need to share it with my team lead.',
    status: 'resolved',
    priority: 'low',
    replies: [
      {
        id: 4,
        ticket_id: 3,
        user_id: 1,
        user_name: 'Darshan Admin',
        user_role: 'admin',
        is_admin: true,
        message: 'Currently, the export feature is not available. However, we are planning to add this in our next release. You can use the print option from your browser as a workaround.',
        created_at: '2026-01-09T11:00:00Z',
      },
      {
        id: 5,
        ticket_id: 3,
        user_id: 4,
        user_name: 'Rajesh Hamal',
        user_role: 'employee',
        is_admin: false,
        message: 'Okay, thank you for the information!',
        created_at: '2026-01-09T11:30:00Z',
      },
    ],
    created_at: '2026-01-09T10:00:00Z',
    updated_at: '2026-01-09T11:30:00Z',
  },
  {
    id: 4,
    user_id: 5,
    user_name: 'Priya Gurung',
    subject: 'Notification not showing',
    description: 'I am not receiving any notifications for new task assignments. Other team members are able to see but I cannot.',
    status: 'closed',
    priority: 'medium',
    replies: [
      {
        id: 6,
        ticket_id: 4,
        user_id: 1,
        user_name: 'Darshan Admin',
        user_role: 'admin',
        is_admin: true,
        message: 'Please check if you have enabled notifications in your browser settings. Also, try logging out and logging back in.',
        created_at: '2026-01-08T14:00:00Z',
      },
      {
        id: 7,
        ticket_id: 4,
        user_id: 5,
        user_name: 'Priya Gurung',
        user_role: 'employee',
        is_admin: false,
        message: 'Re-login worked! Thank you so much.',
        created_at: '2026-01-08T14:30:00Z',
      },
    ],
    created_at: '2026-01-08T13:00:00Z',
    updated_at: '2026-01-08T14:30:00Z',
  },
];

export const getTicketById = (id: number): SupportTicket | undefined => {
  return mockTickets.find(ticket => ticket.id === id);
};

export const getTicketsByUserId = (userId: number): SupportTicket[] => {
  return mockTickets.filter(ticket => ticket.user_id === userId);
};

export const getAllTickets = (): SupportTicket[] => {
  return [...mockTickets].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
};

export const getOpenTickets = (): SupportTicket[] => {
  return mockTickets.filter(ticket => ticket.status === 'open' || ticket.status === 'in_progress');
};