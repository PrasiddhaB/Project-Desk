/**
 * Billing & Payments API Service
 */

import client from '@/services/http/client';
import { SubscriptionPlan, Subscription, Payment, Invoice, BillingCycle } from '@/types';

interface ApiResponse<T> {
  message?: string;
  data: T;
  count?: number;
}

export const billingApi = {
  // Plans
  async getPlans(): Promise<SubscriptionPlan[]> {
    const response = await client.get<SubscriptionPlan[]>('/billing/plans/');
    return response.data;
  },

  async comparePlans(): Promise<SubscriptionPlan[]> {
    const response = await client.get<ApiResponse<SubscriptionPlan[]>>('/billing/plans/compare/');
    return response.data.data;
  },

  // Subscriptions
  async getMySubscription(): Promise<Subscription | null> {
    const response = await client.get<ApiResponse<Subscription>>('/billing/subscriptions/my-subscription/');
    return response.data.data;
  },

  async createSubscription(planId: number, billingCycle: BillingCycle): Promise<Subscription> {
    const response = await client.post<ApiResponse<Subscription>>('/billing/subscriptions/', {
      plan_id: planId,
      billing_cycle: billingCycle,
    });
    return response.data.data;
  },

  async upgradeSubscription(planId: number): Promise<Subscription> {
    const response = await client.post<ApiResponse<Subscription>>('/billing/subscriptions/upgrade/', {
      plan_id: planId,
    });
    return response.data.data;
  },

  async cancelSubscription(): Promise<Subscription> {
    const response = await client.post<ApiResponse<Subscription>>('/billing/subscriptions/cancel/');
    return response.data.data;
  },

  async reactivateSubscription(): Promise<Subscription> {
    const response = await client.post<ApiResponse<Subscription>>('/billing/subscriptions/reactivate/');
    return response.data.data;
  },

  async getSubscriptionStats(): Promise<any> {
    const response = await client.get('/billing/subscriptions/stats/');
    return response.data;
  },

  // Payments
  async getMyPayments(): Promise<Payment[]> {
    const response = await client.get<ApiResponse<Payment[]>>('/billing/payments/my-payments/');
    return response.data.data;
  },

  // Invoices
  async getMyInvoices(): Promise<Invoice[]> {
    const response = await client.get<ApiResponse<Invoice[]>>('/billing/invoices/my-invoices/');
    return response.data.data;
  },
};

export default billingApi;
