'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();

  const handleLogout = () => {
    // Clear all auth related items
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('portal_customer_id');
    
    // Redirect to the welcome portal
    router.push('/portal');
  };

  return (
    <button
      onClick={handleLogout}
      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${className || ''}`}
    >
      <LogOut className="mr-2 h-4 w-4" />
      Sign Out
    </button>
  );
}
