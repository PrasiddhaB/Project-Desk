/**
 * Admin Support Page - View all tickets
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Card, Button, Badge, Avatar } from '@/components/ui';
import { mockTickets } from '@/mock/support';
import { TicketStatus, TICKET_STATUS_OPTIONS, TICKET_PRIORITY_OPTIONS } from '@/types';

export const AdminSupportPage: React.FC = () => {
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter tickets
  let tickets = [...mockTickets];

  if (statusFilter !== 'all') {
    tickets = tickets.filter(ticket => ticket.status === statusFilter);
  }

  if (priorityFilter !== 'all') {
    tickets = tickets.filter(ticket => ticket.priority === priorityFilter);
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    tickets = tickets.filter(
      ticket =>
        ticket.subject.toLowerCase().includes(query) ||
        ticket.description.toLowerCase().includes(query) ||
        ticket.user_name.toLowerCase().includes(query)
    );
  }

  // Stats
  const openCount = mockTickets.filter(t => t.status === 'open').length;
  const inProgressCount = mockTickets.filter(t => t.status === 'in_progress').length;
  const resolvedCount = mockTickets.filter(t => t.status === 'resolved').length;

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
    });
  };

  return (
    <AppLayout>
      <div className="p-6 bg-gray-50 min-h-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Support Tickets</h1>
          <nav className="text-sm text-gray-500 mt-1">
            <span>Home</span>
            <span className="mx-2">/</span>
            <span className="text-gray-700">Support Tickets</span>
          </nav>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Tickets</p>
                <p className="text-xl font-bold text-gray-800">{mockTickets.length}</p>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Open</p>
                <p className="text-xl font-bold text-gray-800">{openCount}</p>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">In Progress</p>
                <p className="text-xl font-bold text-gray-800">{inProgressCount}</p>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Resolved</p>
                <p className="text-xl font-bold text-gray-800">{resolvedCount}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-sm mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as TicketStatus | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              {TICKET_STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Priority</option>
              {TICKET_PRIORITY_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </Card>

        {/* Tickets Table */}
        <Card className="border-0 shadow-sm overflow-hidden">
          {tickets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">#</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Subject</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">User</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Priority</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Created</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tickets.map((ticket, index) => (
                    <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-gray-600">{ticket.id}</td>
                      <td className="py-3 px-4">
                        <Link
                          to={`/support/${ticket.id}`}
                          className="font-medium text-gray-800 hover:text-primary-500"
                        >
                          {ticket.subject}
                        </Link>
                        {ticket.replies && ticket.replies.length > 0 && (
                          <span className="ml-2 text-xs text-gray-500">
                            ({ticket.replies.length} replies)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Avatar name={ticket.user_name} size="xs" />
                          <span className="text-gray-600">{ticket.user_name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(ticket.status)}</td>
                      <td className="py-3 px-4">{getPriorityBadge(ticket.priority)}</td>
                      <td className="py-3 px-4 text-gray-600">{formatDate(ticket.created_at)}</td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/support/${ticket.id}`}
                          className="px-3 py-1.5 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-800 mb-2">No Tickets Found</h3>
              <p className="text-gray-500">Try adjusting your filters</p>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
};

export default AdminSupportPage;