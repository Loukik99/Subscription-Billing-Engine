'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Invoice } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';
import { ArrowLeft, User, CreditCard, Calendar, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function InvoiceDetailPage() {
  const { id } = useParams() as { id: string };
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (id) {
      api.getInvoice(id)
        .then(setInvoice)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <div className="p-8 text-center">Loading invoice details...</div>;
  if (!invoice) return <div className="p-8 text-center text-red-600">Invoice not found</div>;

  return (
    <div className="py-8 max-w-5xl mx-auto">
      {/* Back Link */}
      <div className="mb-6">
        <Link href="/admin/invoices" className="flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Invoices
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Invoice {invoice.id}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Issued on {formatDate(invoice.date)}
            </p>
          </div>
          <div className="flex flex-col items-end">
            <span className={cn(
              "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium mb-2",
              invoice.status === 'PAID' ? 'bg-green-100 text-green-800' :
              invoice.status === 'OPEN' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            )}>
              {invoice.status}
            </span>
            <span className="text-sm text-gray-500">
              Due {formatDate(invoice.dueDate)}
            </span>
            {invoice.status === 'OPEN' && (
              <button
                onClick={async () => {
                  if (!confirm('Mark this invoice as PAID?')) return;
                  setProcessing(true);
                  try {
                    const updated = await api.payInvoice(id);
                    setInvoice(updated);
                  } catch (error) {
                    console.error(error);
                    alert('Failed to mark invoice as paid');
                  } finally {
                    setProcessing(false);
                  }
                }}
                disabled={processing}
                className="mt-3 inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-50 cursor-pointer"
                title="Mark as Paid"
              >
                Mark as Paid
              </button>
            )}
          </div>
        </div>

        {/* Details Grid */}
        <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50">
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Bill To
            </h3>
            {invoice.customer ? (
              <div className="bg-white p-4 rounded border border-gray-200">
                <Link href={`/admin/customers/${invoice.customer.id}`} className="group block">
                  <div className="flex items-center mb-2">
                    <User className="h-4 w-4 text-gray-400 mr-2 group-hover:text-blue-500" />
                    <span className="font-medium text-gray-900 group-hover:text-blue-600">
                      {invoice.customer.name}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 ml-6">
                    {invoice.customer.email}
                  </div>
                  <div className="text-sm text-gray-500 ml-6 mt-1">
                    {invoice.customer.currency}
                  </div>
                </Link>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">Customer details unavailable</p>
            )}
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Reference
            </h3>
            <div className="bg-white p-4 rounded border border-gray-200 space-y-3">
              {invoice.subscriptionId && (
                <div className="flex items-center text-sm">
                  <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-500 mr-2">Subscription:</span>
                  <Link href={`/admin/subscriptions/${invoice.subscriptionId}`} className="text-blue-600 hover:underline">
                    {invoice.subscriptionId}
                  </Link>
                </div>
              )}
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-500 mr-2">Billing Reason:</span>
                <span className="font-medium text-gray-900 capitalize">
                  {invoice.billingReason.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="border-t border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoice.items?.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.description}
                    {item.periodStart && item.periodEnd && (
                      <span className="block text-xs text-gray-500 mt-1">
                        {formatDate(item.periodStart)} - {formatDate(item.periodEnd)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                      item.type === 'TAX' ? "bg-red-100 text-red-800" :
                      item.type === 'PRORATION' ? "bg-purple-100 text-purple-800" :
                      "bg-gray-100 text-gray-800"
                    )}>
                      {item.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-mono">
                    {formatCurrency(item.amount, item.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={2} className="px-6 py-3 text-right text-sm font-medium text-gray-500">Subtotal</td>
                <td className="px-6 py-3 text-right text-sm text-gray-900 font-mono">
                  {formatCurrency(invoice.subtotal, invoice.currency)}
                </td>
              </tr>
              <tr>
                <td colSpan={2} className="px-6 py-3 text-right text-sm font-medium text-gray-500">Tax</td>
                <td className="px-6 py-3 text-right text-sm text-gray-900 font-mono">
                  {formatCurrency(invoice.tax, invoice.currency)}
                </td>
              </tr>
              <tr>
                <td colSpan={2} className="px-6 py-4 text-right text-base font-bold text-gray-900">Total</td>
                <td className="px-6 py-4 text-right text-base font-bold text-gray-900 font-mono">
                  {formatCurrency(invoice.amount, invoice.currency)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
