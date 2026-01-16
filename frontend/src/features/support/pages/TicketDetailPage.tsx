/**
 * Ticket Detail Page - View ticket with replies
 */

import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Card, Button, Badge, Avatar } from '@/components/ui';
import { useAuth } from '@/app/providers/AuthProvider';
import { getTicketById } from '@/mock/support';
import { TicketStatus, TICKET_STATUS_OPTIONS } from '@/types';

export const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const ticket = getTicketById(Number(id));
  const isAdmin = user?.role === 'admin';

  const [replyMessage, setReplyMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newStatus, setNewStatus] = useState<TicketStatus | ''>('');

  if (!ticket) {
    return (
      <AppLayout>
        <div className="p-6">
          <Card className="border-0 shadow-sm">
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Ticket Not Found</h3>
              <p className="text-gray-500 mb-4">The ticket you're looking for doesn't exist.</p>
              <Button onClick={() => navigate(isAdmin ? '/admin/support' : '/support/tickets')}>
                Back to Tickets
              </Button>
            </div>
          </Card>
        </div>
      </AppLayout>
    );
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
        return <Badge variant="gray">Low Priority</Badge>;
      case 'medium':
        return <Badge variant="info">Medium Priority</Badge>;
      case 'high':
        return <Badge variant="warning">High Priority</Badge>;
      case 'urgent':
        return <Badge variant="danger">Urgent</Badge>;
      default:
        return <Badge variant="gray">{priority}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    setReplyMessage('');
    // In real app, would refresh ticket data
  };

  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    // Simulate API call
    console.log('Update status:', newStatus);
    setNewStatus('');
  };

  return (
    <AppLayout>
      <div className="p-6 bg-gray-50 min-h-full">
        {/* Header */}
        <div className="mb-6">
          <nav className="text-sm text-gray-500 mb-2">
            <Link to={isAdmin ? '/admin/support' : '/support/tickets'} className="hover:text-primary-500">
              {isAdmin ? 'All Tickets' : 'My Tickets'}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-700">Ticket #{ticket.id}</span>
          </nav>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">{ticket.subject}</h1>
              <div className="flex items-center gap-3">
                {getStatusBadge(ticket.status)}
                {getPriorityBadge(ticket.priority)}
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate(isAdmin ? '/admin/support' : '/support/tickets')}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Original Message */}
            <Card className="border-0 shadow-sm">
              <div className="flex items-start gap-4">
                <Avatar name={ticket.user_name} size="md" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-800">{ticket.user_name}</span>
                    <span className="text-xs text-gray-500">{formatDate(ticket.created_at)}</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 mt-2">
                    <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Replies */}
            {ticket.replies && ticket.replies.length > 0 && (
              <Card className="border-0 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Replies ({ticket.replies.length})
                </h2>
                <div className="space-y-4">
                  {ticket.replies.map(reply => (
                    <div
                      key={reply.id}
                      className={`flex items-start gap-4 ${
                        reply.is_admin ? 'flex-row-reverse' : ''
                      }`}
                    >
                      <Avatar name={reply.user_name} size="sm" />
                      <div className={`flex-1 ${reply.is_admin ? 'text-right' : ''}`}>
                        <div className={`flex items-center gap-2 mb-1 ${reply.is_admin ? 'justify-end' : ''}`}>
                          <span className="font-medium text-gray-800 text-sm">{reply.user_name}</span>
                          {reply.is_admin && (
                            <Badge variant="primary" size="sm">Admin</Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            {formatDate(reply.created_at)}
                          </span>
                        </div>
                        <div
                          className={`rounded-lg p-3 mt-1 inline-block max-w-[85%] ${
                            reply.is_admin
                              ? 'bg-primary-100 text-primary-900 text-left'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{reply.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Reply Form */}
            {ticket.status !== 'closed' && (
              <Card className="border-0 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Add a Reply</h2>
                <form onSubmit={handleReplySubmit}>
                  <textarea
                    value={replyMessage}
                    onChange={e => setReplyMessage(e.target.value)}
                    placeholder="Type your reply here..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 mb-3"
                  />
                  <div className="flex justify-end">
                    <Button type="submit" isLoading={isSubmitting} disabled={!replyMessage.trim()}>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Send Reply
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Closed Notice */}
            {ticket.status === 'closed' && (
              <Card className="border-0 shadow-sm bg-gray-50">
                <div className="flex items-center gap-3 text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>This ticket has been closed. No further replies can be added.</span>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ticket Info */}
            <Card className="border-0 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Ticket Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Ticket ID</label>
                  <span className="font-medium text-gray-800">#{ticket.id}</span>
                </div>

                <div>
                  <label className="text-sm text-gray-500 block mb-1">Status</label>
                  {getStatusBadge(ticket.status)}
                </div>

                <div>
                  <label className="text-sm text-gray-500 block mb-1">Priority</label>
                  {getPriorityBadge(ticket.priority)}
                </div>

                <div>
                  <label className="text-sm text-gray-500 block mb-1">Created By</label>
                  <span className="font-medium text-gray-800">{ticket.user_name}</span>
                </div>

                <div>
                  <label className="text-sm text-gray-500 block mb-1">Created</label>
                  <span className="text-gray-600 text-sm">{formatDate(ticket.created_at)}</span>
                </div>

                <div>
                  <label className="text-sm text-gray-500 block mb-1">Last Updated</label>
                  <span className="text-gray-600 text-sm">{formatDate(ticket.updated_at)}</span>
                </div>
              </div>
            </Card>

            {/* Admin: Update Status */}
            {isAdmin && ticket.status !== 'closed' && (
              <Card className="border-0 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Update Status</h2>
                <div className="space-y-3">
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value as TicketStatus)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select new status...</option>
                    {TICKET_STATUS_OPTIONS.filter(opt => opt.value !== ticket.status).map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <Button
                    onClick={handleStatusUpdate}
                    disabled={!newStatus}
                    variant="outline"
                    className="w-full"
                  >
                    Update Status
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default TicketDetailPage;