'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Play, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BillingPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message?: string;
    generatedInvoices?: number;
    invoiceIds?: string[];
    error?: string;
  } | null>(null);

  const handleRunBilling = async () => {
    if (!confirm('Are you sure you want to run the billing job? This will generate invoices for all active subscriptions due for billing.')) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const data = await api.triggerBillingCycle();
      setResult({
        success: true,
        message: data.message,
        generatedInvoices: data.generatedInvoices,
        invoiceIds: data.invoiceIds
      });
    } catch (error: any) {
      console.error(error);
      setResult({
        success: false,
        error: error.message || 'Failed to run billing job'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">
          Billing Operations
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage and execute billing cycles manually.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Billing Job Card */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
              <Clock className="mr-2 h-5 w-5 text-gray-500" />
              Daily Billing Job
            </h3>
          </div>
          <div className="px-6 py-4">
            <div className="mb-4 text-sm text-gray-600">
              <p className="mb-2">
                This job scans all active subscriptions to detect billable periods and generate due invoices.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Idempotent: Safe to re-run multiple times.</li>
                <li>Generates invoices only for due subscriptions.</li>
                <li>Updates next billing dates automatically.</li>
              </ul>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={cn(
                  "inline-flex h-2.5 w-2.5 rounded-full",
                  loading ? "bg-yellow-400 animate-pulse" : "bg-gray-300"
                )} />
                <span className="text-sm font-medium text-gray-500">
                  {loading ? 'Job Running...' : 'Ready'}
                </span>
              </div>
              
              <button
                onClick={handleRunBilling}
                disabled={loading}
                className={cn(
                  "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2",
                  loading
                    ? "cursor-not-allowed bg-gray-400"
                    : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                )}
              >
                {loading ? (
                  <>Processing...</>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Run Billing Job
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Results Card */}
        {result && (
          <div className={cn(
            "rounded-lg border shadow-sm",
            result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
          )}>
            <div className="px-6 py-4">
              <h3 className={cn(
                "text-lg font-medium leading-6 flex items-center",
                result.success ? "text-green-900" : "text-red-900"
              )}>
                {result.success ? (
                  <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="mr-2 h-5 w-5 text-red-600" />
                )}
                {result.success ? 'Job Completed Successfully' : 'Job Failed'}
              </h3>
              
              <div className="mt-4">
                {result.success ? (
                  <div className="text-sm text-green-800">
                    <p className="font-medium">{result.message}</p>
                    <p className="mt-2">
                      Invoices Generated: <span className="font-bold">{result.generatedInvoices}</span>
                    </p>
                    {result.invoiceIds && result.invoiceIds.length > 0 && (
                      <div className="mt-3">
                        <p className="mb-1 text-xs uppercase tracking-wide opacity-75">Generated Invoice IDs:</p>
                        <ul className="list-disc pl-5 space-y-1 font-mono text-xs">
                          {result.invoiceIds.map(id => (
                            <li key={id}>{id}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-red-800">
                    <p className="font-medium">Error details:</p>
                    <p className="mt-1">{result.error}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
