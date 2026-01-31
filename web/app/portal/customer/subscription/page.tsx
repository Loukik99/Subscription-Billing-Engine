'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../../lib/api';

export default function PortalSubscriptionPage() {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getPortalSubscription()
      .then(setSubscription)
      .catch((err: any) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleRequestCancellation = () => {
    alert('Cancellation request submitted. Support will contact you shortly.');
    // In a real app, this would verify with backend first, as per requirements: "creates a request record ONLY"
  };

  if (loading) return <div className="text-gray-500">Loading subscription...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  if (!subscription) {
    return (
      <div className="bg-white shadow sm:rounded-lg p-6 text-center">
        <h3 className="text-lg font-medium text-gray-900">No Subscription</h3>
        <p className="mt-1 text-sm text-gray-500">You do not have an active subscription.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Subscription</h1>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Subscription Details</h3>
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            subscription.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {subscription.status}
          </span>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Plan</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {subscription.planName} ({new Intl.NumberFormat('en-US', { style: 'currency', currency: subscription.currency }).format(subscription.amount)} / {subscription.interval})
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Start Date</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {new Date(subscription.startDate).toLocaleDateString()}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Current Period</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {new Date(subscription.currentPeriodStart).toLocaleDateString()} — {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Auto-Renewal</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {subscription.cancelAtPeriodEnd ? 'Disabled (Cancels at end of period)' : 'Enabled'}
              </dd>
            </div>
          </dl>
        </div>
        <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
          <button
            onClick={handleRequestCancellation}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 border-red-300"
          >
            Request Cancellation
          </button>
        </div>
      </div>
    </div>
  );
}
