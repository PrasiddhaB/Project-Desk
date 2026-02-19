/**
 * Billing Page - Subscription plans with Khalti payment
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Card, Button, Badge } from '@/components/ui';
import { useAuth } from '@/app/providers/AuthProvider';
import { billingApi } from '@/services/payments';
import { SubscriptionPlan, Subscription, Payment, SUBSCRIPTION_STATUS_OPTIONS } from '@/types';

export const BillingPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const paymentStatus = searchParams.get('payment_status');
  
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPlanId, setProcessingPlanId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    handlePaymentStatus();
  }, []);

  const handlePaymentStatus = () => {
    switch (paymentStatus) {
      case 'success':
        setSuccessMessage('Payment successful! Your subscription has been activated.');
        break;
      case 'pending':
        setError('Payment is pending. Please contact support for assistance.');
        break;
      case 'cancelled':
        setError('Payment was cancelled. Please try again.');
        break;
      case 'expired':
        setError('Payment link expired. Please try again.');
        break;
      case 'refunded':
        setError('This transaction has been refunded.');
        break;
      case 'error':
        const errorMsg = searchParams.get('error');
        setError(errorMsg || 'Payment error occurred.');
        break;
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansData, subData, paymentsData] = await Promise.all([
        billingApi.getPlans(),
        billingApi.getMySubscription(),
        billingApi.getMyPayments().catch(() => []),
      ]);
      setPlans(plansData);
      setHasSubscription(subData.has_subscription);
      setSubscription(subData.data);
      setPayments(paymentsData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (planId: number) => {
    try {
      setProcessingPlanId(planId);
      setError(null);
      
      const response = await billingApi.initiatePayment(planId);
      
      if (response.success && response.payment_url) {
        // Show expiration warning if available
        if (response.expires_in) {
          const minutes = Math.floor(response.expires_in / 60);
          const proceed = window.confirm(
            `Payment link will expire in ${minutes} minutes. Proceed to payment?`
          );
          if (!proceed) {
            setProcessingPlanId(null);
            return;
          }
        }
        // Redirect to Khalti payment page
        window.location.href = response.payment_url;
      } else {
        setError(response.message || 'Failed to initiate payment');
        setProcessingPlanId(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to initiate payment');
      setProcessingPlanId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'expired': return 'danger';
      case 'cancelled': return 'secondary';
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'danger';
      default: return 'secondary';
    }
  };

  // Admin doesn't need subscription
  if (user?.role === 'admin') {
    return (
      <AppLayout>
        <div className="p-6 bg-gray-50 min-h-full">
          <div className="max-w-3xl mx-auto">
            <Card className="border-0 shadow-sm text-center py-12">
              <svg className="w-16 h-16 mx-auto mb-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Full Access</h2>
              <p className="text-gray-500">As an admin, you have full access to all features.</p>
            </Card>
          </div>
        </div>
      </AppLayout>
    );
  }

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
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Subscription Plans</h1>

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg mb-6 flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {successMessage}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-6 flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Current Subscription */}
          {hasSubscription && subscription && (
            <Card className="border-0 shadow-sm mb-8 bg-gradient-to-r from-primary-50 to-primary-100">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-2">Current Subscription</h2>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl font-bold text-primary-600">{subscription.plan_name}</span>
                    <Badge variant={getStatusColor(subscription.status)}>
                      {SUBSCRIPTION_STATUS_OPTIONS.find(o => o.value === subscription.status)?.label}
                    </Badge>
                  </div>
                  <p className="text-gray-600">
                    {subscription.days_remaining} days remaining
                    {subscription.is_unlimited ? ' • Unlimited notes' : ''}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Valid until: {new Date(subscription.end_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Info for users without subscription */}
          {!hasSubscription && (
            <Card className="border-0 shadow-sm mb-8 bg-yellow-50 border-l-4 border-yellow-400">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-gray-800">Subscribe to Access Notes</h3>
                  <p className="text-sm text-gray-600">Choose a plan below to unlock Private Notes and Shared Notes features.</p>
                </div>
              </div>
            </Card>
          )}

          {/* Plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {plans.map((plan, index) => {
              const isCurrentPlan = subscription?.plan?.id === plan.id;
              const isProcessing = processingPlanId === plan.id;
              const isHighlighted = index === plans.length - 1; // Highlight last (premium) plan

              return (
                <Card 
                  key={plan.id} 
                  className={`border-0 shadow-sm relative ${
                    isCurrentPlan ? 'ring-2 ring-primary-500' : ''
                  } ${isHighlighted ? 'ring-2 ring-indigo-500' : ''}`}
                >
                  {isHighlighted && !isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-indigo-500 text-white text-xs px-3 py-1 rounded-full">
                      Recommended
                    </div>
                  )}
                  
                  {isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary-500 text-white text-xs px-3 py-1 rounded-full">
                      Current Plan
                    </div>
                  )}
                  
                  <div className="pt-4">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{plan.name}</h3>
                    <p className="text-gray-500 text-sm mb-4">{plan.description}</p>
                    
                    <div className="mb-6">
                      <span className="text-3xl font-bold text-gray-800">Rs. {plan.price}</span>
                      <span className="text-gray-500">/month</span>
                    </div>

                    <ul className="space-y-3 mb-6">
                      <li className="flex items-center gap-2 text-sm">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>
                          {plan.is_unlimited 
                            ? 'Unlimited Shared Notes' 
                            : `${plan.note_limit || 0} Shared Notes`}
                        </span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>
                          {plan.is_unlimited 
                            ? 'Unlimited Private Notes' 
                            : `${plan.private_note_limit || 0} Private Notes`}
                        </span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>30 days access</span>
                      </li>
                    </ul>

                    {isCurrentPlan ? (
                      <Button className="w-full" disabled>
                        Current Plan
                      </Button>
                    ) : hasSubscription ? (
                      <Button 
                        className="w-full" 
                        variant="outline"
                        disabled
                      >
                        Already Subscribed
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        variant={isHighlighted ? 'primary' : 'outline'}
                        onClick={() => handleSelectPlan(plan.id)}
                        isLoading={isProcessing}
                        disabled={isProcessing || processingPlanId !== null}
                      >
                        {isProcessing ? 'Processing...' : 'Select Plan'}
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Payment History */}
          {payments.length > 0 && (
            <Card className="border-0 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Payment History</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 font-medium text-gray-500">Date</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-500">Plan</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-500">Amount</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(payment => (
                      <tr key={payment.id} className="border-b border-gray-100">
                        <td className="py-3 px-2">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-2">{payment.plan_name}</td>
                        <td className="py-3 px-2">Rs. {payment.amount}</td>
                        <td className="py-3 px-2">
                          <Badge variant={getStatusColor(payment.status)} size="sm">
                            {payment.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default BillingPage;
