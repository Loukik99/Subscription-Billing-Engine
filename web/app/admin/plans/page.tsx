'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Plan } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Plus, Check, X, Trash, Play } from 'lucide-react';

export default function PlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newPlan, setNewPlan] = useState({
    id: '',
    name: '',
    amount: 1000,
    currency: 'USD',
    interval: 'MONTH' as import('@/types').PlanInterval,
  });

  const fetchPlans = () => {
    setLoading(true);
    api.getPlans()
      .then(setPlans)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createPlan(newPlan);
      setShowCreate(false);
      fetchPlans();
      setNewPlan({ id: '', name: '', amount: 1000, currency: 'USD', interval: 'MONTH' });
    } catch (error) {
      console.error(error);
      alert('Failed to create plan');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    try {
      await api.deletePlan(id);
      fetchPlans();
    } catch (error) {
      console.error(error);
      alert('Failed to delete plan');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Plans</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 cursor-pointer"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Plan
        </button>
      </div>

      {showCreate && (
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-medium">New Plan</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">ID</label>
              <input
                type="text"
                required
                value={newPlan.id}
                onChange={e => setNewPlan({ ...newPlan, id: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                placeholder="e.g. pro-monthly"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                required
                value={newPlan.name}
                onChange={e => setNewPlan({ ...newPlan, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                placeholder="e.g. Pro Monthly"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount (cents)</label>
              <input
                type="number"
                required
                value={newPlan.amount}
                onChange={e => setNewPlan({ ...newPlan, amount: parseInt(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Currency</label>
              <select
                value={newPlan.currency}
                onChange={e => setNewPlan({ ...newPlan, currency: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="INR">INR</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Interval</label>
              <select
                value={newPlan.interval}
                onChange={e => setNewPlan({ ...newPlan, interval: e.target.value as 'MONTH' | 'YEAR' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              >
                <option value="MONTH">Monthly</option>
                <option value="YEAR">Yearly</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
              >
                Save Plan
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div>Loading plans...</div>
      ) : (
        <div className="overflow-hidden bg-white shadow sm:rounded-md">
          <ul role="list" className="divide-y divide-gray-200">
            {plans.map((plan) => (
              <li key={plan.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="truncate text-sm font-medium text-blue-600">{plan.name}</div>
                    <button
                      onClick={() => handleDelete(plan.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                      title="Delete Plan"
                    >
                      <Trash className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        {formatCurrency(plan.amount, plan.currency)} / {plan.interval.toLowerCase()}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

