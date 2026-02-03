'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Customer, Plan } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowLeft, Check, Search } from 'lucide-react';
import Link from 'next/link';

function NewSubscriptionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedPlanId = searchParams.get('planId');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<1 | 2>(1);
  
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (preSelectedPlanId) {
      setSelectedPlanId(preSelectedPlanId);
    }
  }, [preSelectedPlanId]);

  useEffect(() => {
    const init = async () => {
      try {
        const [custData, plansData] = await Promise.all([
          api.getCustomers(),
          api.getPlans()
        ]);
        setCustomers(custData);
        setPlans(plansData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleCreate = async () => {
    if (!selectedCustomerId || !selectedPlanId) return;
    try {
      await api.createSubscription({ 
        customerId: selectedCustomerId, 
        planId: selectedPlanId 
      });
      router.push('/admin/subscriptions');
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Failed to create subscription');
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const selectedPlan = plans.find(p => p.id === selectedPlanId);
  
  // Filter plans by selected customer's currency
  const compatiblePlans = selectedCustomer 
    ? plans.filter(p => p.currency === selectedCustomer.currency && p.active)
    : [];

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <Link href="/admin/subscriptions" className="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Subscriptions
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Create New Subscription</h1>
        <p className="mt-2 text-sm text-gray-500">
          Manually create a subscription by selecting a customer and a plan.
        </p>
      </div>

      {/* Progress Steps */}
      {selectedPlan && (
        <div className="mb-6 rounded-md bg-blue-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-blue-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Plan Pre-selected</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  You are creating a subscription for <strong>{selectedPlan.name}</strong>. 
                  Only customers with {selectedPlan.currency} currency are shown.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <nav aria-label="Progress">
        <ol role="list" className="flex items-center">
          <li className={`relative pr-8 sm:pr-20 ${step === 1 ? 'text-blue-600' : 'text-gray-500'}`}>
            <div className="flex items-center">
              <div className={`relative flex h-8 w-8 items-center justify-center rounded-full border-2 ${step === 1 ? 'border-blue-600' : 'border-gray-300 bg-white'}`}>
                <span className="h-2.5 w-2.5 rounded-full bg-current" aria-hidden="true" />
              </div>
              <span className="ml-4 text-sm font-medium">Select Customer</span>
            </div>
          </li>
          <li className={`relative pr-8 sm:pr-20 ${step === 2 ? 'text-blue-600' : 'text-gray-500'}`}>
            <div className="flex items-center">
               <div className={`relative flex h-8 w-8 items-center justify-center rounded-full border-2 ${step >= 2 ? 'border-blue-600' : 'border-gray-300 bg-white'}`}>
                <span className="h-2.5 w-2.5 rounded-full bg-current" aria-hidden="true" />
              </div>
              <span className="ml-4 text-sm font-medium">Select Plan</span>
            </div>
          </li>
        </ol>
      </nav>

      <div className="bg-white shadow sm:rounded-lg overflow-hidden">
        {step === 1 && (
          <div className="p-6 space-y-6">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">Search Customer</label>
              <div className="relative mt-1 flex items-center">
                <input
                  type="text"
                  name="search"
                  id="search"
                  className="block w-full rounded-md border-gray-300 pr-12 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  placeholder="Name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute inset-y-0 right-0 flex py-1.5 pr-1.5">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto border rounded-md">
              {filteredCustomers.map((customer) => (
                <li 
                  key={customer.id} 
                  className={`cursor-pointer p-4 hover:bg-gray-50 ${selectedCustomerId === customer.id ? 'bg-blue-50 ring-1 ring-blue-500' : ''}`}
                  onClick={() => setSelectedCustomerId(customer.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                      <p className="text-sm text-gray-500">{customer.email}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {customer.region} â€¢ {customer.currency}
                    </div>
                  </div>
                </li>
              ))}
              {filteredCustomers.length === 0 && (
                <li className="p-4 text-center text-gray-500">No customers found.</li>
              )}
            </ul>

            <div className="flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!selectedCustomerId}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
              >
                Next: Select Plan
              </button>
            </div>
          </div>
        )}

        {step === 2 && selectedCustomer && (
          <div className="p-6 space-y-6">
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-sm font-medium text-gray-900">Selected Customer</h3>
              <p className="mt-1 text-sm text-gray-500">{selectedCustomer.name} ({selectedCustomer.email})</p>
              <p className="text-xs text-gray-400 mt-1">Currency: {selectedCustomer.currency}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Available Plans ({selectedCustomer.currency})</label>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {compatiblePlans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative flex cursor-pointer rounded-lg border p-4 shadow-sm focus:outline-none ${
                      selectedPlanId === plan.id ? 'border-blue-600 ring-2 ring-blue-600' : 'border-gray-300'
                    }`}
                    onClick={() => setSelectedPlanId(plan.id)}
                  >
                    <div className="flex flex-1">
                      <div className="flex flex-col">
                        <span className="block text-sm font-medium text-gray-900">{plan.name}</span>
                        <span className="mt-1 flex items-center text-sm text-gray-500">
                          {formatCurrency(plan.amount, plan.currency)} / {plan.interval}
                        </span>
                      </div>
                    </div>
                    {selectedPlanId === plan.id && (
                      <Check className="h-5 w-5 text-blue-600" aria-hidden="true" />
                    )}
                  </div>
                ))}
                {compatiblePlans.length === 0 && (
                  <p className="col-span-2 text-sm text-red-500">
                    No active plans found for currency {selectedCustomer.currency}.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Back
              </button>
              <button
                onClick={handleCreate}
                disabled={!selectedPlanId}
                className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-50"
              >
                Create Subscription
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NewSubscriptionPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewSubscriptionContent />
    </Suspense>
  );
}

