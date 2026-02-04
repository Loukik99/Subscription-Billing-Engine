const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005/api';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetcher<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Add Authorization header if token exists
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      cache: 'no-store',
      headers,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new ApiError(res.status, errorData.error || 'An error occurred');
    }

    const contentType = res.headers.get('content-type') || '';
    if (res.status === 204 || res.status === 205) {
      return undefined as T;
    }
    if (contentType.includes('application/json')) {
      return res.json();
    }
    const text = await res.text();
    return text as unknown as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    console.error(`Network error fetching ${API_URL}${endpoint}:`, error);
    // Return a rejected promise with a clearer error message for the UI to handle
    throw new Error(`Network error: Unable to connect to server at ${API_URL}. Please ensure the backend is deployed and NEXT_PUBLIC_API_URL is set.`);
  }
}

export const api = {
  // Customers
  getCustomers: () => fetcher<import('../types').Customer[]>('/customers'),
  getCustomer: (id: string) => fetcher<import('../types').Customer & { subscriptions: import('../types').Subscription[], invoices: import('../types').Invoice[] }>(`/customers/${id}`),
  createCustomer: (data: Partial<import('../types').Customer>) => 
    fetcher<import('../types').Customer>('/customers', { method: 'POST', body: JSON.stringify(data) }),
  deleteCustomer: (id: string) => fetcher<void>(`/customers/${id}`, { method: 'DELETE' }),

  // Plans
  getPlans: () => fetcher<import('../types').Plan[]>('/plans'),
  createPlan: (data: Partial<import('../types').Plan>) => 
    fetcher<import('../types').Plan>('/plans', { method: 'POST', body: JSON.stringify(data) }),
  deletePlan: (id: string) => fetcher<void>(`/plans/${id}`, { method: 'DELETE' }),

  // Subscriptions
  getSubscriptions: () => fetcher<import('../types').Subscription[]>('/subscriptions'),
  createSubscription: (data: { customerId: string; planId: string }) => 
    fetcher<import('../types').Subscription>('/subscriptions', { method: 'POST', body: JSON.stringify(data) }),
  getSubscription: (id: string) => fetcher<import('../types').Subscription>(`/subscriptions/${id}`),
  cancelSubscription: (id: string, immediate = false) => 
    fetcher<import('../types').Subscription>(`/subscriptions/${id}/cancel`, { method: 'POST', body: JSON.stringify({ immediate }) }),
  changePlan: (id: string, newPlanId: string) => 
    fetcher<import('../types').Subscription>(`/subscriptions/${id}/change-plan`, { method: 'POST', body: JSON.stringify({ newPlanId }) }),
  deleteSubscription: (id: string) => fetcher<void>(`/subscriptions/${id}`, { method: 'DELETE' }),

  // Invoices
  getInvoices: () => fetcher<import('../types').Invoice[]>('/invoices'),
  getInvoice: (id: string) => fetcher<import('../types').Invoice>(`/invoices/${id}`),
  payInvoice: (id: string) => fetcher<import('../types').Invoice>(`/invoices/${id}/pay`, { method: 'POST' }),

  // Billing
  triggerBillingCycle: (targetDate?: string) => 
    fetcher<{ message: string; generatedInvoices: number; invoiceIds: string[] }>('/billing/cycle', { 
      method: 'POST', 
      body: JSON.stringify({ targetDate }) 
    }),

  // Dashboard & System
  getDashboardSummary: () => fetcher<import('../types').DashboardSummary>('/dashboard/summary'),
  getSystemStatus: () => fetcher<import('../types').SystemStatus>('/dashboard/system'),

  // Auth

  // Portal
  getPortalDashboard: () => fetcher<any>('/portal/me'),
  getPortalSubscription: () => fetcher<any>('/portal/me/subscription'),
  getPortalInvoices: () => fetcher<any[]>('/portal/me/invoices'),
  getPortalInvoice: (invoiceId: string) => fetcher<any>(`/portal/me/invoices/${invoiceId}`),
};

export const login = (credentials: { email: string; password: string }) =>
  fetcher<{ token: string; user: any }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

