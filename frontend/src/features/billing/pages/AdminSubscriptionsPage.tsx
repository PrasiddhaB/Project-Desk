/**
 * Admin Manage Subscriptions Page - View and manage user subscriptions
 */

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, Button, Badge, Input } from '@/components/ui';
import { Subscription, SUBSCRIPTION_STATUS_OPTIONS } from '@/types';
import client from '@/services/http/client';

export const AdminSubscriptionsPage: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await client.get('/billing/subscriptions/');
      setSubscriptions(response.data);
    } catch (err) {
      console.error('Failed to fetch subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (sub: Subscription) => {
    if (!window.confirm(`Cancel subscription for ${sub.user_name}?`)) return;

    try {
      await client.patch(`/billing/subscriptions/${sub.id}/`, {
        status: 'cancelled',
      });
      fetchSubscriptions();
    } catch (err) {
      console.error('Failed to cancel subscription:', err);
    }
  };

  const handleReactivate = async (sub: Subscription) => {
    try {
      await client.patch(`/billing/subscriptions/${sub.id}/`, {
        status: 'active',
      });
      fetchSubscriptions();
    } catch (err) {
      console.error('Failed to reactivate subscription:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'expired': return 'danger';
      case 'cancelled': return 'secondary';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Filter subscriptions
  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = !searchQuery || 
      sub.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.plan_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = !statusFilter || sub.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Stats
  const totalActive = subscriptions.filter(s => s.status === 'active' && s.is_active).length;
  const totalExpired = subscriptions.filter(s => s.status === 'expired').length;
  const totalCancelled = subscriptions.filter(s => s.status === 'cancelled').length;

  return (
    <AppLayout>
      <div className="p-6 bg-gray-50 min-h-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Manage Subscriptions</h1>
          <p className="text-gray-500 mt-1">View and manage user subscriptions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-sm p-4">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-800">{subscriptions.length}</p>
          </Card>
          <Card className="border-0 shadow-sm p-4">
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-2xl font-bold text-green-600">{totalActive}</p>
          </Card>
          <Card className="border-0 shadow-sm p-4">
            <p className="text-sm text-gray-500">Expired</p>
            <p className="text-2xl font-bold text-red-600">{totalExpired}</p>
          </Card>
          <Card className="border-0 shadow-sm p-4">
            <p className="text-sm text-gray-500">Cancelled</p>
            <p className="text-2xl font-bold text-gray-600">{totalCancelled}</p>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-sm mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                type="text"
                placeholder="Search by user name, email, or plan..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Status</option>
              {SUBSCRIPTION_STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <Button variant="outline" onClick={fetchSubscriptions}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </Button>
          </div>
        </Card>

        {/* Subscriptions Table */}
        {loading ? (
          <Card className="border-0 shadow-sm text-center py-12">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading subscriptions...</p>
          </Card>
        ) : (
          <Card className="border-0 shadow-sm overflow-hidden">
            {filteredSubscriptions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">User</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Plan</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Start Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">End Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Days Left</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredSubscriptions.map(sub => (
                      <tr key={sub.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-800">{sub.user_name || 'N/A'}</p>
                            <p className="text-sm text-gray-500">{sub.user_email || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium">{sub.plan_name}</span>
                          <p className="text-sm text-gray-500">Rs. {sub.plan_price}/mo</p>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={getStatusColor(sub.status)}>
                            {SUBSCRIPTION_STATUS_OPTIONS.find(o => o.value === sub.status)?.label || sub.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {formatDate(sub.start_date)}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {formatDate(sub.end_date)}
                        </td>
                        <td className="py-3 px-4">
                          {sub.is_active ? (
                            <span className="text-green-600 font-medium">{sub.days_remaining} days</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {sub.status === 'active' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelSubscription(sub)}
                            >
                              Cancel
                            </Button>
                          ) : sub.status === 'cancelled' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReactivate(sub)}
                            >
                              Reactivate
                            </Button>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-800 mb-2">No Subscriptions Found</h3>
                <p className="text-gray-500">
                  {searchQuery || statusFilter 
                    ? 'Try adjusting your filters' 
                    : 'No users have subscribed yet'}
                </p>
              </div>
            )}
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default AdminSubscriptionsPage;
