/**
 * Admin Manage Subscriptions Page - View and manage user subscriptions
 */

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, Button, Badge, Avatar } from '@/components/ui';
import { Subscription, SUBSCRIPTION_STATUS_OPTIONS } from '@/types';
import client from '@/services/http/client';

export const ManageSubscriptionsPage: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (subscription: Subscription) => {
    if (!window.confirm(`Are you sure you want to cancel subscription for ${subscription.user_name}?`)) return;
    
    try {
      await client.patch(`/billing/subscriptions/${subscription.id}/`, {
        status: 'cancelled',
      });
      fetchSubscriptions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel subscription');
    }
  };

  const handleActivateSubscription = async (subscription: Subscription) => {
    try {
      await client.patch(`/billing/subscriptions/${subscription.id}/`, {
        status: 'active',
      });
      fetchSubscriptions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to activate subscription');
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

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = 
      sub.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.plan_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = !statusFilter || sub.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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

  return (
    <AppLayout>
      <div className="p-6 bg-gray-50 min-h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Manage Subscriptions</h1>
            <p className="text-gray-500 mt-1">View and manage user subscriptions</p>
          </div>
          <Button onClick={fetchSubscriptions} variant="outline">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-sm p-4">
            <p className="text-sm text-gray-500">Total Subscriptions</p>
            <p className="text-2xl font-bold text-gray-800">{subscriptions.length}</p>
          </Card>
          <Card className="border-0 shadow-sm p-4">
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-2xl font-bold text-green-600">
              {subscriptions.filter(s => s.status === 'active').length}
            </p>
          </Card>
          <Card className="border-0 shadow-sm p-4">
            <p className="text-sm text-gray-500">Expired</p>
            <p className="text-2xl font-bold text-red-600">
              {subscriptions.filter(s => s.status === 'expired').length}
            </p>
          </Card>
          <Card className="border-0 shadow-sm p-4">
            <p className="text-sm text-gray-500">Cancelled</p>
            <p className="text-2xl font-bold text-gray-600">
              {subscriptions.filter(s => s.status === 'cancelled').length}
            </p>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-sm mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search by user, email, or plan..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Status</option>
              {SUBSCRIPTION_STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </Card>

        {/* Subscriptions Table */}
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
                  {filteredSubscriptions.map(subscription => (
                    <tr key={subscription.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={subscription.user_name || 'User'} size="sm" />
                          <div>
                            <p className="font-medium text-gray-800">{subscription.user_name}</p>
                            <p className="text-sm text-gray-500">{subscription.user_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-800">{subscription.plan_name}</p>
                          <p className="text-sm text-gray-500">Rs. {subscription.plan_price}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={getStatusColor(subscription.status)} size="sm">
                          {SUBSCRIPTION_STATUS_OPTIONS.find(o => o.value === subscription.status)?.label || subscription.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {formatDate(subscription.start_date)}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {formatDate(subscription.end_date)}
                      </td>
                      <td className="py-3 px-4">
                        {subscription.is_active ? (
                          <span className="font-medium text-green-600">{subscription.days_remaining} days</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {subscription.status === 'active' ? (
                            <button
                              onClick={() => handleCancelSubscription(subscription)}
                              className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              Cancel
                            </button>
                          ) : subscription.status === 'cancelled' ? (
                            <button
                              onClick={() => handleActivateSubscription(subscription)}
                              className="px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded transition-colors"
                            >
                              Reactivate
                            </button>
                          ) : null}
                        </div>
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
                  ? 'Try adjusting your search or filter' 
                  : 'No users have subscribed yet'}
              </p>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
};

export default ManageSubscriptionsPage;
