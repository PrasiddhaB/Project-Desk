/**
 * Admin Manage Plans Page - CRUD for subscription plans
 */

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, Button, Badge, Input, Modal } from '@/components/ui';
import { SubscriptionPlan } from '@/types';
import client from '@/services/http/client';

export const AdminPlansPage: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    note_limit: '',
    private_note_limit: '',
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
    } catch (err) {
      console.error('Failed to fetch plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      note_limit: '',
      private_note_limit: '',
      is_unlimited: false,
      is_active: true,
    });
    setEditingPlan(null);
    setError(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || '',
      price: plan.price.toString(),
      note_limit: plan.note_limit?.toString() || '',
      private_note_limit: plan.private_note_limit?.toString() || '',
      is_unlimited: plan.is_unlimited,
      is_active: plan.is_active,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        note_limit: formData.is_unlimited ? null : (formData.note_limit ? parseInt(formData.note_limit) : null),
        private_note_limit: formData.is_unlimited ? null : (formData.private_note_limit ? parseInt(formData.private_note_limit) : null),
        is_unlimited: formData.is_unlimited,
        is_active: formData.is_active,
      };

      if (editingPlan) {
        await client.put(`/billing/plans/${editingPlan.id}/`, payload);
      } else {
        await client.post('/billing/plans/', payload);
      }

      setShowModal(false);
      resetForm();
      fetchPlans();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save plan');
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
    } catch (err) {
      console.error('Failed to toggle plan status:', err);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 bg-gray-50 min-h-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Manage Plans</h1>
            <p className="text-gray-500 mt-1">Create and manage subscription plans</p>
          </div>
          <Button onClick={handleOpenCreate}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Plan
          </Button>
        </div>

        {loading ? (
          <Card className="border-0 shadow-sm text-center py-12">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading plans...</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map(plan => (
              <Card key={plan.id} className={`border-0 shadow-sm ${!plan.is_active ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{plan.name}</h3>
                    <Badge variant={plan.is_active ? 'success' : 'secondary'} size="sm">
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-primary-600">
                    Rs. {plan.price}
                  </div>
                </div>

                <p className="text-gray-500 text-sm mb-4">{plan.description || 'No description'}</p>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Shared Notes</span>
                    <span className="font-medium">{plan.is_unlimited ? 'Unlimited' : (plan.note_limit || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Private Notes</span>
                    <span className="font-medium">{plan.is_unlimited ? 'Unlimited' : (plan.private_note_limit || 0)}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="outline" size="sm" onClick={() => handleOpenEdit(plan)} className="flex-1">
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(plan)}
                    className="flex-1"
                  >
                    {plan.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <button
                    onClick={() => handleDelete(plan)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </Card>
            ))}

            {plans.length === 0 && (
              <div className="col-span-full">
                <Card className="border-0 shadow-sm text-center py-12">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No Plans Yet</h3>
                  <p className="text-gray-500 mb-4">Create your first subscription plan</p>
                  <Button onClick={handleOpenCreate}>Add Plan</Button>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Create/Edit Modal */}
        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingPlan ? 'Edit Plan' : 'Create Plan'}>
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>
            )}

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
                  onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="e.g., 200"
                  min="10"
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
                  <p className="font-medium text-gray-800">Unlimited Notes</p>
                  <p className="text-xs text-gray-500">No limits on notes for this plan</p>
                </div>
              </label>

              {!formData.is_unlimited && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Shared Notes Limit</label>
                    <Input
                      type="number"
                      value={formData.note_limit}
                      onChange={e => setFormData(prev => ({ ...prev, note_limit: e.target.value }))}
                      placeholder="e.g., 10"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Private Notes Limit</label>
                    <Input
                      type="number"
                      value={formData.private_note_limit}
                      onChange={e => setFormData(prev => ({ ...prev, private_note_limit: e.target.value }))}
                      placeholder="e.g., 5"
                      min="0"
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
                  <p className="text-xs text-gray-500">Users can subscribe to this plan</p>
                </div>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" isLoading={submitting} className="flex-1">
                {editingPlan ? 'Update Plan' : 'Create Plan'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppLayout>
  );
};

export default AdminPlansPage;
