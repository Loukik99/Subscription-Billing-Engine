'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../../../lib/api';
import { ArrowLeft, Download } from 'lucide-react';

export default function PortalInvoiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id || Array.isArray(id)) return;

    api.getPortalInvoice(id)
      .then(setInvoice)
      .catch((err: any) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownload = () => {
    alert(`Downloading PDF for invoice ${id}... (Mock)`);
  };

  if (loading) return <div className="text-gray-500">Loading invoice details...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!invoice) return <div className="text-gray-500">Invoice not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="flex items-center text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Invoices
        </button>
        <button
          onClick={handleDownload}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Download className="w-4 h-4 mr-2" />
          Download PDF
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Invoice {invoice.id}</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Issued on {new Date(invoice.date).toLocaleDateString()}
            </p>
          </div>
          <div>
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
              invoice.status === 'PAID' ? 'bg-green-100 text-green-800' : 
              invoice.status === 'OPEN' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {invoice.status}
            </span>
          </div>
        </div>
        
        <div className="border-t border-gray-200">
          <div className="px-4 py-5 sm:p-6">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Line Items</h4>
            <table className="min-w-full divide-y divide-gray-200 mb-8">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoice.items?.map((item: any) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2 text-sm text-gray-900">{item.description}</td>
                    <td className="px-3 py-2 text-sm text-gray-900 text-right">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency }).format(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end">
              <div className="w-full sm:w-1/3">
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Subtotal</dt>
                    <dd className="text-sm text-gray-900">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency }).format(invoice.subtotal)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Tax</dt>
                    <dd className="text-sm text-gray-900">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency }).format(invoice.tax)}
                    </dd>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-2">
                    <dt className="text-base font-medium text-gray-900">Total</dt>
                    <dd className="text-base font-medium text-gray-900">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency }).format(invoice.amount)}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
