/**
 * Ticket Detail Page - View and reply to ticket
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Card, Button, Badge, Avatar } from '@/components/ui';
import { useAuth } from '@/app/providers/AuthProvider';
import { supportApi } from '@/services/support';
import { SupportTicket, TICKET_STATUS_OPTIONS } from '@/types';

export const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const data = await supportApi.getTicket(Number(id));
      setTicket(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ticket not found');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!replyMessage.trim() || !ticket) return;

    try {
      setSending(true);
      await supportApi.addReply(ticket.id, replyMessage);
      setReplyMessage('');
      fetchTicket();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket) return;
    try {
      await supportApi.updateStatus(ticket.id, newStatus as any);
      fetchTicket();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'primary';
      case 'in_progress': return 'warning';
      case 'resolved': return 'success';
      case 'closed': return 'secondary';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 flex justify-center items-center min-h-[400px]">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AppLayout>
    );
  }

  if (error || !ticket) {
    return (
      <AppLayout>
        <div className="p-6">
          <Card className="border-0 shadow-sm text-center py-12">
            <h3 className="text-lg font-medium text-gray-800 mb-4">{error || 'Ticket not found'}</h3>
            <Button onClick={() => navigate('/support/tickets')}>Back to Tickets</Button>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 bg-gray-50 min-h-full">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <nav className="text-sm text-gray-500 mb-4">
            <Link to="/support/tickets" className="hover:text-primary-500">Tickets</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-700">#{ticket.id}</span>
          </nav>

          <Card className="border-0 shadow-sm mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold text-gray-800">{ticket.subject}</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Opened by {ticket.user_name} on {new Date(ticket.created_at).toLocaleDateString()}
                </p>
              </div>
              <Badge variant={getStatusColor(ticket.status)}>
                {TICKET_STATUS_OPTIONS.find(o => o.value === ticket.status)?.label}
              </Badge>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
            </div>

            {/* Admin Status Update */}
            {isAdmin && (
              <div className="mt-4 pt-4 border-t flex items-center gap-2">
                <span className="text-sm text-gray-500">Update Status:</span>
                {TICKET_STATUS_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handleStatusChange(opt.value)}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      ticket.status === opt.value
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Replies */}
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Conversation ({ticket.replies?.length || 0})
          </h2>

          <div className="space-y-4 mb-6">
            {ticket.replies && ticket.replies.length > 0 ? (
              ticket.replies.map(reply => (
                <Card 
                  key={reply.id} 
                  className={`border-0 shadow-sm ${reply.is_admin ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar name={reply.user_name} size="sm" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">{reply.user_name}</span>
                        {reply.is_admin && (
                          <Badge variant="primary" size="sm">Admin</Badge>
                        )}
                        <span className="text-xs text-gray-400">
                          {new Date(reply.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-700 mt-1">{reply.message}</p>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="border-0 shadow-sm text-center py-6">
                <p className="text-gray-500">No replies yet</p>
              </Card>
            )}
          </div>

          {/* Reply Form */}
          {ticket.status !== 'closed' && (
            <Card className="border-0 shadow-sm">
              <h3 className="font-medium text-gray-800 mb-3">Add Reply</h3>
              <textarea
                value={replyMessage}
                onChange={e => setReplyMessage(e.target.value)}
                placeholder="Type your message..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 mb-3"
              />
              <div className="flex justify-end">
                <Button onClick={handleReply} isLoading={sending} disabled={!replyMessage.trim()}>
                  Send Reply
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default TicketDetailPage;
