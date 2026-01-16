/**
 * My Tickets Page - Employee view their tickets
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Card, Button, Badge } from '@/components/ui';
import { useAuth } from '@/app/providers/AuthProvider';
import { getTicketsByUserId } from '@/mock/support';
import { TicketStatus, TICKET_STATUS_OPTIONS } from '@/types';

export const MyTicketsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');

  // Get user's tickets
  let tickets = getTicketsByUserId(user?.id || 0);

  // Apply status filter
  if (statusFilter !== 'all') {
    tickets = tickets.filter(ticket => ticket.status === statusFilter);
  }

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'open':
        return <Badge variant="info">Open</Badge>;
      case 'in_progress':
        return <Badge variant="warning">In Progress</Badge>;
      case 'resolved':
        return <Badge variant="success">Resolved</Badge>;
      case 'closed':
        return <Badge variant="gray">Closed</Badge>;
      default:
        return <Badge variant="gray">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'low':
        return <Badge variant="gray" size="sm">Low</Badge>;
      case 'medium':
        return <Badge variant="info" size="sm">Medium</Badge>;
      case 'high':
        return <Badge variant="warning" size="sm">High</Badge>;
      case 'urgent':
        return <Badge variant="danger" size="sm">Urgent</Badge>;
      default:
        return <Badge variant="gray" size="sm">{priority}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AppLayout>
      <div className="p-6 bg-gray-50 min-h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">My Support Tickets</h1>
            <nav className="text-sm text-gray-500 mt-1">
              <span>Home</span>
              <span className="mx-2">/</span>
              <span className="text-gray-700">My Tickets</span>
            </nav>
          </div>
          <Button onClick={() => navigate('/support')}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Ticket
          </Button>
        </div>

        {/* Status Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-primary-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            All Tickets
          </button>
          {TICKET_STATUS_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={() => setStatusFilter(option.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === option.value
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Tickets List */}
        {tickets.length > 0 ? (
          <div className="space-y-4">
            {tickets.map(ticket => (
              <Card key={ticket.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Link
                        to={`/support/${ticket.id}`}
                        className="font-semibold text-gray-800 hover:text-primary-500"
                      >
                        {ticket.subject}
                      </Link>
                      {getStatusBadge(ticket.status)}
                      {getPriorityBadge(ticket.priority)}
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                      {ticket.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Created: {formatDate(ticket.created_at)}
                      </span>
                      {ticket.replies && ticket.replies.length > 0 && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                          {ticket.replies.length} {ticket.replies.length === 1 ? 'reply' : 'replies'}
                        </span>
                      )}
                    </div>
                  </div>
                  <Link
                    to={`/support/${ticket.id}`}
                    className="ml-4 px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-0 shadow-sm">
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-800 mb-2">No Tickets Found</h3>
              <p className="text-gray-500 mb-4">
                {statusFilter !== 'all'
                  ? 'No tickets match your selected filter'
                  : "You haven't submitted any support tickets yet"}
              </p>
              <Button onClick={() => navigate('/support')}>
                Submit a Ticket
              </Button>
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default MyTicketsPage;