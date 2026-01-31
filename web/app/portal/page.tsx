'use client';

import { useRouter } from 'next/navigation';

export default function PortalEntry() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to Billing Portal
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please select your role to continue
          </p>
        </div>
        <div className="mt-8 space-y-4">
          <button
            onClick={() => router.push('/admin')}
            className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-lg font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Continue as Admin
          </button>
          
          <button
            onClick={() => router.push('/auth/login')}
            className="group relative w-full flex justify-center py-4 px-4 border border-gray-300 text-lg font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Continue as Customer
          </button>
        </div>
      </div>
    </div>
  );
}
