'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Invoice } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';
import { FileText } from 'lucide-react';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    api.getInvoices()
      .then(setInvoices)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredInvoices = invoices.filter(invoice => 
    invoice.customer?.name?.toLowerCase().includes(filter.toLowerCase()) ||
    invoice.customer?.email?.toLowerCase().includes(filter.toLowerCase()) ||
    invoice.id.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) return <div>Loading invoices...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Invoices</h1>
        <div className="w-64">
          <input
            type="text"
            placeholder="Filter by customer or ID..."
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-hidden bg-white shadow sm:rounded-md">
        <ul role="list" className="divide-y divide-gray-200">
          {filteredInvoices.map((invoice) => (
            <li key={invoice.id}>
              <Link href={`/admin/invoices/${invoice.id}`} className="block hover:bg-gray-50">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="mr-2 h-5 w-5 text-gray-400" />
                      <p className="truncate text-sm font-medium text-blue-600">
                        {invoice.customer?.name || invoice.customerId}
                      </p>
                    </div>
                    <div className="ml-2 flex flex-shrink-0">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        invoice.status === 'PAID' ? 'bg-green-100 text-green-800' :
                        invoice.status === 'OPEN' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {invoice.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        {formatCurrency(invoice.amount, invoice.currency)}
                      </p>
                      <p className="mt-2 flex items-center text-sm text-gray-500 sm:ml-6 sm:mt-0">
                        Date: {formatDate(invoice.date)}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <p>Due: {formatDate(invoice.dueDate)}</p>
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
