/**
 * Admin Manage Plans Page - CRUD for subscription plans
 */

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, Button, Badge, Input } from '@/components/ui';
import { SubscriptionPlan } from '@/types';
import client from '@/services/http/client';

export const ManagePlansPage: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    note_limit: 10,
    private_note_limit: 5,
    is_unlimited: false,
    is_active: true,
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await client.get('/billing/plans/');
      setPlans(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (plan?: SubscriptionPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        description: plan.description || '',
        price: plan.price,
        note_limit: plan.note_limit || 10,
        private_note_limit: plan.private_note_limit || 5,
        is_unlimited: plan.is_unlimited,
        is_active: plan.is_active,
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: '',
        description: '',
        price: 0,
        note_limit: 10,
        private_note_limit: 5,
        is_unlimited: false,
        is_active: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPlan(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      
      const payload = {
        ...formData,
        note_limit: formData.is_unlimited ? null : formData.note_limit,
        private_note_limit: formData.is_unlimited ? null : formData.private_note_limit,
      };

      if (editingPlan) {
        await client.put(`/billing/plans/${editingPlan.id}/`, payload);
      } else {
        await client.post('/billing/plans/', payload);
      }
      
      handleCloseModal();
      fetchPlans();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save plan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (plan: SubscriptionPlan) => {
    if (!window.confirm(`Are you sure you want to delete "${plan.name}"?`)) return;
    
    try {
      await client.delete(`/billing/plans/${plan.id}/`);
      fetchPlans();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete plan');
    }
  };

  const handleToggleActive = async (plan: SubscriptionPlan) => {
    try {
      await client.patch(`/billing/plans/${plan.id}/`, {
        is_active: !plan.is_active,
      });
      fetchPlans();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update plan');
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

  return (
    <AppLayout>
      <div className="p-6 bg-gray-50 min-h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Manage Plans</h1>
            <p className="text-gray-500 mt-1">Create and manage subscription plans</p>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Plan
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>
        )}

        {/* Plans Table */}
        <Card className="border-0 shadow-sm overflow-hidden">
          {plans.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Plan Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Price (NPR)</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Note Limit</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Private Note Limit</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {plans.map(plan => (
                    <tr key={plan.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-800">{plan.name}</p>
                          <p className="text-sm text-gray-500 truncate max-w-[200px]">{plan.description}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-800">Rs. {plan.price}</span>
                      </td>
                      <td className="py-3 px-4">
                        {plan.is_unlimited ? (
                          <Badge variant="success" size="sm">Unlimited</Badge>
                        ) : (
                          <span className="text-gray-600">{plan.note_limit}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {plan.is_unlimited ? (
                          <Badge variant="success" size="sm">Unlimited</Badge>
                        ) : (
                          <span className="text-gray-600">{plan.private_note_limit}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleActive(plan)}
                          className="focus:outline-none"
                        >
                          <Badge variant={plan.is_active ? 'success' : 'secondary'} size="sm">
                            {plan.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(plan)}
                            className="p-2 text-gray-500 hover:text-blue-500"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(plan)}
                            className="p-2 text-gray-500 hover:text-red-500"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="text-lg font-medium text-gray-800 mb-2">No Plans</h3>
              <p className="text-gray-500 mb-4">Create your first subscription plan</p>
              <Button onClick={() => handleOpenModal()}>Add Plan</Button>
            </div>
          )}
        </Card>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={handleCloseModal}></div>
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                {editingPlan ? 'Edit Plan' : 'Create Plan'}
              </h2>
              
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name *</label>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Basic Plan"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Plan description..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (NPR) *</label>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={e => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                      min={0}
                      required
                    />
                  </div>

                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_unlimited}
                      onChange={e => setFormData(prev => ({ ...prev, is_unlimited: e.target.checked }))}
                      className="w-4 h-4 text-primary-500 rounded"
                    />
                    <div>
                      <p className="font-medium text-gray-800">Unlimited</p>
                      <p className="text-xs text-gray-500">No limits on notes</p>
                    </div>
                  </label>

                  {!formData.is_unlimited && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Note Limit</label>
                        <Input
                          type="number"
                          value={formData.note_limit}
                          onChange={e => setFormData(prev => ({ ...prev, note_limit: Number(e.target.value) }))}
                          min={1}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Private Note Limit</label>
                        <Input
                          type="number"
                          value={formData.private_note_limit}
                          onChange={e => setFormData(prev => ({ ...prev, private_note_limit: Number(e.target.value) }))}
                          min={1}
                        />
                      </div>
                    </div>
                  )}

                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={e => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="w-4 h-4 text-primary-500 rounded"
                    />
                    <div>
                      <p className="font-medium text-gray-800">Active</p>
                      <p className="text-xs text-gray-500">Plan is available for purchase</p>
                    </div>
                  </label>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button type="button" variant="outline" onClick={handleCloseModal} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={submitting} className="flex-1">
                    {editingPlan ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default ManagePlansPage;
