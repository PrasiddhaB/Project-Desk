/**
 * My Tickets Page - View user's tickets
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Card, Button, Badge } from '@/components/ui';
import { supportApi } from '@/services/support';
import { SupportTicket, TICKET_STATUS_OPTIONS } from '@/types';

export const MyTicketsPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await supportApi.getMyTickets();
      setTickets(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
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

  return (
    <AppLayout>
      <div className="p-6 bg-gray-50 min-h-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">My Tickets</h1>
            <p className="text-gray-500 mt-1">View your support requests</p>
          </div>
          <Button onClick={() => navigate('/support')}>
            New Ticket
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>
        )}

        {loading ? (
          <Card className="border-0 shadow-sm text-center py-12">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading tickets...</p>
          </Card>
        ) : tickets.length > 0 ? (
          <div className="space-y-4">
            {tickets.map(ticket => (
              <Card key={ticket.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Link to={`/support/${ticket.id}`} className="font-semibold text-gray-800 hover:text-primary-500">
                      #{ticket.id} - {ticket.subject}
                    </Link>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{ticket.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={getStatusColor(ticket.status)} size="sm">
                        {TICKET_STATUS_OPTIONS.find(o => o.value === ticket.status)?.label}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Link to={`/support/${ticket.id}`} className="text-primary-500 text-sm hover:underline">
                    View →
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-0 shadow-sm text-center py-12">
            <p className="text-gray-500 mb-4">No tickets yet</p>
            <Button onClick={() => navigate('/support')}>Create Ticket</Button>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default MyTicketsPage;
