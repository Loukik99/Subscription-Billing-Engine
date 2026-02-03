'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Subscription } from '@/types';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const subsData = await api.getSubscriptions();
      setSubscriptions(subsData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subscription? This action cannot be undone.')) return;
    try {
      await api.deleteSubscription(id);
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Failed to delete subscription');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Subscriptions</h1>
        <Link
          href="/admin/subscriptions/new"
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Create Subscription
        </Link>
      </div>

      {loading ? (
        <div>Loading subscriptions...</div>
      ) : (
        <div className="overflow-hidden bg-white shadow sm:rounded-md">
           {subscriptions.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No subscriptions found.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">ID</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Customer</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Plan</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Period</th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {subscriptions.map((sub) => (
                  <tr key={sub.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      <Link href={`/admin/subscriptions/${sub.id}`} className="text-blue-600 hover:text-blue-900 hover:underline">
                        {sub.id.slice(0, 8)}...
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-blue-600">
                      <Link href={`/admin/customers/${sub.customerId}`} className="hover:underline">
                        {sub.customer?.email || sub.customerId}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                       <Link href={`/admin/subscriptions/${sub.id}`} className="hover:text-blue-600 hover:underline">
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
                      <div className="flex justify-end gap-3 items-center">
                        <Link href={`/admin/subscriptions/${sub.id}`} className="text-blue-600 hover:text-blue-900">
                          View
                        </Link>
                        <button
                          onClick={() => handleDelete(sub.id)}
                          className="text-red-600 hover:text-red-900 cursor-pointer"
                          title="Delete Subscription"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

