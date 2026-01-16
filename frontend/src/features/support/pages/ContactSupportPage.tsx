/**
 * Contact Support Page - Employee create ticket
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Card, Button, Input } from '@/components/ui';
import { useAuth } from '@/app/providers/AuthProvider';
import { getTicketsByUserId } from '@/mock/support';
import { TicketFormData, TicketPriority, TICKET_PRIORITY_OPTIONS } from '@/types';

export const ContactSupportPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Get user's recent tickets
  const recentTickets = getTicketsByUserId(user?.id || 0).slice(0, 3);

  const [formData, setFormData] = useState<TicketFormData>({
    subject: '',
    description: '',
    priority: 'medium',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof TicketFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof TicketFormData, string>> = {};

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    navigate('/support/tickets?success=Ticket submitted successfully');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-700';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700';
      case 'resolved':
        return 'bg-green-100 text-green-700';
      case 'closed':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
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
          <h1 className="text-2xl font-bold text-gray-800">Contact Support</h1>
          <nav className="text-sm text-gray-500 mt-1">
            <span>Home</span>
            <span className="mx-2">/</span>
            <span className="text-gray-700">Contact Support</span>
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Submit a Ticket</h2>
                  <p className="text-sm text-gray-500">We'll get back to you as soon as possible</p>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={formData.subject}
                      onChange={e => {
                        setFormData(prev => ({ ...prev, subject: e.target.value }));
                        setErrors(prev => ({ ...prev, subject: undefined }));
                      }}
                      placeholder="Brief description of your issue"
                      error={errors.subject}
                    />
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {TICKET_PRIORITY_OPTIONS.map(option => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, priority: option.value }))}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border-2 ${
                            formData.priority === option.value
                              ? option.value === 'low'
                                ? 'border-gray-500 bg-gray-100 text-gray-700'
                                : option.value === 'medium'
                                ? 'border-blue-500 bg-blue-100 text-blue-700'
                                : option.value === 'high'
                                ? 'border-orange-500 bg-orange-100 text-orange-700'
                                : 'border-red-500 bg-red-100 text-red-700'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={e => {
                        setFormData(prev => ({ ...prev, description: e.target.value }));
                        setErrors(prev => ({ ...prev, description: undefined }));
                      }}
                      placeholder="Please describe your issue in detail..."
                      rows={8}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        errors.description ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.description && (
                      <p className="text-sm text-red-500 mt-1">{errors.description}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.description.length} characters (minimum 20)
                    </p>
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    isLoading={isSubmitting}
                    className="w-full"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Submit Ticket
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Links */}
            <Card className="border-0 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Links</h3>
              <div className="space-y-3">
                <Link
                  to="/support/tickets"
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className="text-gray-700">View My Tickets</span>
                </Link>
              </div>
            </Card>

            {/* Recent Tickets */}
            {recentTickets.length > 0 && (
              <Card className="border-0 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Recent Tickets</h3>
                  <Link to="/support/tickets" className="text-sm text-primary-500 hover:text-primary-600">
                    View all
                  </Link>
                </div>
                <div className="space-y-3">
                  {recentTickets.map(ticket => (
                    <Link
                      key={ticket.id}
                      to={`/support/${ticket.id}`}
                      className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <span className="font-medium text-gray-800 text-sm line-clamp-1">
                          {ticket.subject}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(ticket.status)}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {formatDate(ticket.created_at)}
                      </p>
                    </Link>
                  ))}
                </div>
              </Card>
            )}

            {/* Help Tips */}
            <Card className="border-0 shadow-sm bg-blue-50">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="font-medium text-blue-800 mb-1">Tips for faster resolution</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Be specific about your issue</li>
                    <li>• Include steps to reproduce</li>
                    <li>• Mention any error messages</li>
                    <li>• Add relevant screenshots</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ContactSupportPage;