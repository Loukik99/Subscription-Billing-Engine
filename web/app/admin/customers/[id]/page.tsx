'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Customer, Plan, Subscription } from '@/types';
import { formatDate, formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { Plus, ArrowLeft } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function CustomerDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  
  const [customer, setCustomer] = useState<Customer & { subscriptions: Subscription[] } | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateSub, setShowCreateSub] = useState(false);
  const [newSubPlanId, setNewSubPlanId] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [customerData, plansData] = await Promise.all([
        api.getCustomer(id),
        api.getPlans()
      ]);
      setCustomer(customerData);
      setPlans(plansData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch customer data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubPlanId) return;
    try {
      await api.createSubscription({ customerId: id, planId: newSubPlanId });
      setShowCreateSub(false);
      setNewSubPlanId('');
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to create subscription');
    }
  };

  if (loading) return <div>Loading customer...</div>;
  if (error) return <div className="text-red-500 p-4">Error: {error}</div>;
  if (!customer) return <div>Customer not found</div>;

  // Filter plans by customer currency
  const compatiblePlans = plans.filter(p => p.currency === customer.currency);

  // Check for existing ACTIVE subscription
  const activeSubscription = customer.subscriptions?.find(s => s.status === 'ACTIVE');

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/customers" className="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Customers
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Customer Details</h1>
          {!activeSubscription && (
            <button
              onClick={() => setShowCreateSub(!showCreateSub)}
              className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Subscription
            </button>
          )}
        </div>
      </div>

      <div className="overflow-hidden bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900">Customer Information</h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Full name</dt>
              <dd className="mt-1 text-sm text-gray-900">{customer.name}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Email address</dt>
              <dd className="mt-1 text-sm text-gray-900">{customer.email}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Region</dt>
              <dd className="mt-1 text-sm text-gray-900">{customer.region || 'US'}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Currency</dt>
              <dd className="mt-1 text-sm text-gray-900">{customer.currency}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Account Balance</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatCurrency(customer.balance || 0, customer.currency)}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">ID</dt>
              <dd className="mt-1 text-sm font-mono text-gray-900">{customer.id}</dd>
            </div>
             <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Created At</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(customer.createdAt)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {showCreateSub && (
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-medium">Create Subscription</h2>
          <form onSubmit={handleCreateSubscription} className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">Select Plan ({customer.currency})</label>
              <select
                required
                value={newSubPlanId}
                onChange={e => setNewSubPlanId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              >
                <option value="">Select a plan</option>
                {compatiblePlans.map(p => (
                  <option key={p.id} value={p.id}>{p.name} - {formatCurrency(p.amount, p.currency)}/{p.interval}</option>
                ))}
              </select>
              {compatiblePlans.length === 0 && (
                <p className="mt-1 text-xs text-red-500">No plans available for {customer.currency}. Create a plan with this currency first.</p>
              )}
            </div>
            <button
              type="submit"
              disabled={!newSubPlanId}
              className="rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-50"
            >
              Start Subscription
            </button>
          </form>
        </div>
      )}

      <div>
        <h3 className="mb-4 text-lg font-medium text-gray-900">Subscriptions</h3>
        <div className="overflow-hidden bg-white shadow sm:rounded-md">
          {customer.subscriptions && customer.subscriptions.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Plan</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Period</th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {customer.subscriptions.map((sub: any) => (
                  <tr key={sub.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      <Link href={`/admin/subscriptions/${sub.id}`} className="text-blue-600 hover:underline">
                        {sub.plan?.name || sub.planId}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        sub.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                        sub.status === 'CANCELED' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {formatDate(sub.currentPeriodStart)} - {formatDate(sub.currentPeriodEnd)}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <Link href={`/admin/subscriptions/${sub.id}`} className="text-blue-600 hover:text-blue-900">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center text-gray-500">No subscriptions found for this customer.</div>
          )}
        </div>
      </div>
    </div>
  );
}
