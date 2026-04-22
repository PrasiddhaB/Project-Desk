/**
 * Billing & Payments API Service
 */

import client from '@/services/http/client';
import { SubscriptionPlan, Subscription, Payment, SubscriptionCheck } from '@/types';

interface ApiResponse<T> {
  message?: string;
  data: T;
  count?: number;
  has_subscription?: boolean;
  has_access?: boolean;
  is_superadmin?: boolean;
}

interface InitiatePaymentResponse {
  success: boolean;
  payment_url?: string;
  pidx?: string;
  expires_at?: string;
  expires_in?: number;
  message?: string;
}

export const billingApi = {
  // Plans (public catalog)
  async getPlans(): Promise<SubscriptionPlan[]> {
    const response = await client.get<SubscriptionPlan[]>('/billing/plans/');
    // DRF returns array directly for list actions
    const body: any = response.data;
    if (Array.isArray(body)) return body as SubscriptionPlan[];
    if (Array.isArray(body?.results)) return body.results as SubscriptionPlan[];
    if (Array.isArray(body?.data)) return body.data as SubscriptionPlan[];
    return [];
  },

  // My subscription (any role)
  async getMySubscription(): Promise<{ has_subscription: boolean; is_superadmin?: boolean; data: Subscription | null }> {
    const response = await client.get<ApiResponse<Subscription | null>>('/billing/subscriptions/my-subscription/');
    return {
      has_subscription: response.data.has_subscription || false,
      is_superadmin: response.data.is_superadmin || false,
      data: response.data.data ?? null,
    };
  },

  // Cancel my own subscription (admin + employee)
  async cancelMySubscription(): Promise<{ message: string; data: Subscription | null }> {
    const response = await client.post<{ message: string; data: Subscription | null }>(
      '/billing/subscriptions/cancel-my-subscription/',
      {}
    );
    return response.data;
  },

  // Access check used by route guards
  async checkSubscription(): Promise<SubscriptionCheck> {
    const response = await client.get<SubscriptionCheck>('/billing/subscriptions/check/');
    return response.data;
  },

  // Payments
  async initiatePayment(planId: number): Promise<InitiatePaymentResponse> {
    const response = await client.post<InitiatePaymentResponse>('/billing/initiate-payment/', {
      plan_id: planId,
    });
    return response.data;
  },

  async getMyPayments(): Promise<Payment[]> {
    const response = await client.get<ApiResponse<Payment[]>>('/billing/payments/my-payments/');
    return response.data.data;
  },

  // Super-admin helpers (gated on backend; frontend just exposes the calls)
  async listAllSubscriptions(): Promise<Subscription[]> {
    const response = await client.get<any>('/billing/subscriptions/');
    const body = response.data;
    if (Array.isArray(body)) return body as Subscription[];
    if (Array.isArray(body?.results)) return body.results as Subscription[];
    if (Array.isArray(body?.data)) return body.data as Subscription[];
    return [];
  },

  async adminCancelSubscription(subscriptionId: number): Promise<{ message: string }> {
    const response = await client.delete<{ message: string }>(`/billing/subscriptions/${subscriptionId}/`);
    return response.data;
  },

  async createPlan(data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    const response = await client.post<SubscriptionPlan>('/billing/plans/', data);
    return response.data;
  },

  async updatePlan(id: number, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    const response = await client.patch<SubscriptionPlan>(`/billing/plans/${id}/`, data);
    return response.data;
  },

  async deletePlan(id: number): Promise<void> {
    await client.delete(`/billing/plans/${id}/`);
  },
};

export default billingApi;
