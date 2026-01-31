'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Subscription, Plan, Customer, Invoice } from '@/types';
import { formatDate, formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { useParams } from 'next/navigation';

interface SubscriptionDetail extends Subscription {
  plan: Plan;
  customer: Customer;
  invoices: Invoice[];
}

export default function SubscriptionDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  
  const [subscription, setSubscription] = useState<SubscriptionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.getSubscription(id);
      setSubscription(data as any); // Cast because api return type might not include relations yet
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const handleCancel = async (immediate: boolean) => {
    const message = immediate 
      ? 'Are you sure you want to cancel this subscription IMMEDIATELY? This action cannot be undone.' 
      : 'Are you sure you want to cancel this subscription at the END of the current period?';
      
    if (!confirm(message)) return;
    
    setProcessing(true);
    try {
      await api.cancelSubscription(id, immediate);
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Failed to cancel subscription');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div>Loading subscription...</div>;
  if (!subscription) return <div>Subscription not found</div>;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/subscriptions" className="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Subscriptions
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Subscription Details</h1>
          <div className="flex gap-2">
            {subscription.status === 'ACTIVE' && !subscription.cancelAtPeriodEnd && (
              <button
                onClick={() => handleCancel(false)}
                disabled={processing}
                className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-50 disabled:opacity-50"
              >
                Cancel (Period End)
              </button>
            )}
            {subscription.status === 'ACTIVE' && (
              <button
                onClick={() => handleCancel(true)}
                disabled={processing}
                className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50"
              >
                Cancel Immediately
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Subscription Info */}
      <div className="overflow-hidden bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900">Information</h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  subscription.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                  subscription.status === 'CANCELED' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'
                }`}>
                  {subscription.status}
                </span>
                {subscription.cancelAtPeriodEnd && (
                   <span className="ml-2 inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                     Ends on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                   </span>
                )}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Plan</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {subscription.plan?.name} ({formatCurrency(subscription.plan?.amount, subscription.plan?.currency)}/{subscription.plan?.interval})
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Customer</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <Link href={`/customers/${subscription.customerId}`} className="text-blue-600 hover:underline">
                  {subscription.customer?.name} ({subscription.customer?.email})
                </Link>
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Current Period</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
              </dd>
            </div>
             <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">ID</dt>
              <dd className="mt-1 text-sm font-mono text-gray-900">{subscription.id}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Linked Invoices */}
      <div>
        <h3 className="mb-4 text-lg font-medium text-gray-900">Invoices</h3>
        <div className="overflow-hidden bg-white shadow sm:rounded-md">
          {subscription.invoices && subscription.invoices.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Invoice ID</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Amount</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {subscription.invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      <span className="font-mono text-xs">{inv.id.substring(0, 8)}...</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {formatCurrency(inv.amount, inv.currency)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                       <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        inv.status === 'PAID' ? 'bg-green-100 text-green-800' : 
                        inv.status === 'OPEN' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {formatDate(inv.date)}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <Link href={`/invoices/${inv.id}`} className="text-blue-600 hover:text-blue-900">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
             <div className="p-6 text-center text-gray-500">No invoices found for this subscription.</div>
          )}
        </div>
      </div>
    </div>
  );
}
