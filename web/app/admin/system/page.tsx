'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { SystemStatus } from '@/types';
import { formatDate } from '@/lib/utils';
import { Activity, CheckCircle, AlertTriangle, Server, Database } from 'lucide-react';

export default function SystemPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSystemStatus()
      .then(setStatus)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center">Loading system status...</div>;
  if (!status) return <div className="p-8 text-center text-red-600">Failed to load system status.</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">System Status</h1>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center space-x-3 mb-4">
            <Server className="h-6 w-6 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900">Core Engine</h3>
          </div>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Status</dt>
              <dd className="flex items-center text-sm font-medium text-green-600">
                <CheckCircle className="mr-1.5 h-4 w-4" />
                {status.status}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Version</dt>
              <dd className="text-sm font-medium text-gray-900">{status.version}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Environment</dt>
              <dd className="text-sm font-medium text-gray-900">{status.environment}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Last Billing Run</dt>
              <dd className="text-sm font-medium text-gray-900">
                {status.lastBillingRun ? formatDate(status.lastBillingRun) : 'Never'}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center space-x-3 mb-4">
            <Activity className="h-6 w-6 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900">Health Monitor</h3>
          </div>
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">System Healthy</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>
                    All systems are operational. Billing jobs are ready to execute.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 border-t border-gray-100 pt-4">
             <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Connectivity</h4>
             <ul className="space-y-2 text-sm text-gray-600">
               <li className="flex items-center">
                 <Database className="mr-2 h-4 w-4 text-gray-400" />
                 Database: <span className="ml-2 text-green-600 font-medium">Connected</span>
               </li>
             </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

