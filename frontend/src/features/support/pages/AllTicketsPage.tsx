/**
 * All Tickets Page - Admin view all tickets
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Card, Badge } from '@/components/ui';
import { supportApi } from '@/services/support';
import { SupportTicket, TICKET_STATUS_OPTIONS, TicketStatus } from '@/types';

export const AllTicketsPage: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('');

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const filters = statusFilter ? { status: statusFilter } : undefined;
      const data = await supportApi.getTickets(filters);
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'danger';
      case 'high': return 'warning';
      default: return 'secondary';
    }
  };

  return (
    <AppLayout>
      <div className="p-6 bg-gray-50 min-h-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">All Support Tickets</h1>
            <p className="text-gray-500 mt-1">Manage support requests from employees</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-sm mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Filter:</span>
            <button
              onClick={() => setStatusFilter('')}
              className={`px-3 py-1 text-sm rounded-full ${
                statusFilter === '' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              All
            </button>
            {TICKET_STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`px-3 py-1 text-sm rounded-full ${
                  statusFilter === opt.value ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </Card>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>
        )}

        {loading ? (
          <Card className="border-0 shadow-sm text-center py-12">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading tickets...</p>
          </Card>
        ) : tickets.length > 0 ? (
          <Card className="border-0 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Subject</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">User</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Priority</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {tickets.map(ticket => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <Link to={`/support/${ticket.id}`} className="text-primary-500 hover:underline">
                        #{ticket.id}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <Link to={`/support/${ticket.id}`} className="text-gray-800 hover:text-primary-500">
                        {ticket.subject}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{ticket.user_name}</td>
                    <td className="py-3 px-4">
                      <Badge variant={getStatusColor(ticket.status)} size="sm">
                        {TICKET_STATUS_OPTIONS.find(o => o.value === ticket.status)?.label}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={getPriorityColor(ticket.priority)} size="sm">
                        {ticket.priority}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-sm">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ) : (
          <Card className="border-0 shadow-sm text-center py-12">
            <p className="text-gray-500">No tickets found</p>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default AllTicketsPage;
