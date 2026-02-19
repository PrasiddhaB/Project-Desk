/**
 * Billing Page - Subscription and payment management
 */

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, Button, Badge } from '@/components/ui';
import { useAuth } from '@/app/providers/AuthProvider';
import { billingApi } from '@/services/payments';
import { SubscriptionPlan, Subscription, SUBSCRIPTION_STATUS_OPTIONS } from '@/types';

export const BillingPage: React.FC = () => {
  const { user } = useAuth();
  
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansData, subData] = await Promise.all([
        billingApi.getPlans(),
        billingApi.getMySubscription(),
      ]);
      setPlans(plansData);
      setSubscription(subData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: number) => {
    try {
      const sub = await billingApi.createSubscription(planId, billingCycle);
      setSubscription(sub);
      alert('Subscription created with 14-day free trial!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to subscribe');
    }
  };

  const handleUpgrade = async (planId: number) => {
    try {
      const sub = await billingApi.upgradeSubscription(planId);
      setSubscription(sub);
      alert('Subscription upgraded!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to upgrade');
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription?')) return;
    try {
      const sub = await billingApi.cancelSubscription();
      setSubscription(sub);
      alert('Subscription cancelled');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel');
    }
  };

  const handleReactivate = async () => {
    try {
      const sub = await billingApi.reactivateSubscription();
      setSubscription(sub);
      alert('Subscription reactivated!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reactivate');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'trial': return 'primary';
      case 'cancelled': return 'danger';
      case 'expired': return 'secondary';
      case 'past_due': return 'warning';
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

  return (
    <AppLayout>
      <div className="p-6 bg-gray-50 min-h-full">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Billing & Subscription</h1>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>
          )}

          {/* Current Subscription */}
          {subscription && (
            <Card className="border-0 shadow-sm mb-8">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-2">Current Subscription</h2>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl font-bold text-gray-800">{subscription.plan.name}</span>
                    <Badge variant={getStatusColor(subscription.status)}>
                      {SUBSCRIPTION_STATUS_OPTIONS.find(o => o.value === subscription.status)?.label}
                    </Badge>
                  </div>
                  <p className="text-gray-500">
                    {subscription.billing_cycle === 'monthly' ? 'Billed monthly' : 'Billed yearly'}
                    {subscription.days_remaining !== null && ` • ${subscription.days_remaining} days remaining`}
                  </p>
                  {subscription.next_billing_date && (
                    <p className="text-sm text-gray-500 mt-1">
                      Next billing: {new Date(subscription.next_billing_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {subscription.status === 'cancelled' ? (
                    <Button onClick={handleReactivate}>Reactivate</Button>
                  ) : (
                    <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Billing Cycle Toggle */}
          <div className="flex justify-center mb-8">
            <div className="bg-gray-100 p-1 rounded-lg inline-flex">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-gray-800 shadow'
                    : 'text-gray-600'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === 'yearly'
                    ? 'bg-white text-gray-800 shadow'
                    : 'text-gray-600'
                }`}
              >
                Yearly <span className="text-green-600">(Save 20%)</span>
              </button>
            </div>
          </div>

          {/* Plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map(plan => {
              const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
              const isCurrentPlan = subscription?.plan.id === plan.id;
              const canUpgrade = subscription && plan.price_monthly > subscription.plan.price_monthly;

              return (
                <Card 
                  key={plan.id} 
                  className={`border-0 shadow-sm ${isCurrentPlan ? 'ring-2 ring-primary-500' : ''}`}
                >
                  {isCurrentPlan && (
                    <div className="bg-primary-500 text-white text-center text-xs py-1 -mt-5 -mx-5 mb-4 rounded-t-lg">
                      Current Plan
                    </div>
                  )}
                  
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-800">${price}</span>
                    <span className="text-gray-500">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                  </div>

                  <ul className="space-y-2 mb-6 text-sm">
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {plan.max_users} Users
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {plan.max_projects} Projects
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {plan.max_tasks_per_project} Tasks/Project
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className={`w-4 h-4 ${plan.has_priority_support ? 'text-green-500' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={!plan.has_priority_support ? 'text-gray-400' : ''}>Priority Support</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className={`w-4 h-4 ${plan.has_advanced_analytics ? 'text-green-500' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={!plan.has_advanced_analytics ? 'text-gray-400' : ''}>Analytics</span>
                    </li>
                  </ul>

                  {!subscription ? (
                    <Button 
                      className="w-full" 
                      onClick={() => handleSubscribe(plan.id)}
                      variant={plan.plan_type === 'pro' ? 'primary' : 'outline'}
                    >
                      Start Free Trial
                    </Button>
                  ) : isCurrentPlan ? (
                    <Button className="w-full" disabled>Current Plan</Button>
                  ) : canUpgrade ? (
                    <Button className="w-full" onClick={() => handleUpgrade(plan.id)}>
                      Upgrade
                    </Button>
                  ) : (
                    <Button className="w-full" variant="outline" disabled>
                      Downgrade N/A
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default BillingPage;
