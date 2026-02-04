'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await login({ email, password });
      
      // Store auth data
      localStorage.setItem("auth_token", res.token);
      if (res.user) {
        localStorage.setItem("user_role", res.user.role);
        if (res.user.customerId) {
          localStorage.setItem("portal_customer_id", res.user.customerId);
        }
      }

      // Redirect based on role
      if (res.user?.role === 'ADMIN') {
        router.push("/admin");
      } else {
        router.push("/portal/customer");
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-2 text-center text-2xl font-bold">
          Sign in to your account
        </h1>
        <p className="mb-6 text-center text-sm text-gray-600">
          Or <Link href="/auth/register" className="font-medium text-indigo-600 hover:text-indigo-500">create a new account</Link>
        </p>

        {error && (
          <div className="mb-4 rounded bg-red-100 p-3 text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded border px-3 py-2"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded border px-3 py-2"
          />

          <button
            type="submit"
            className="w-full rounded bg-indigo-600 py-2 text-white hover:bg-indigo-700"
          >
            Sign in
          </button>

        </form>
      </div>
    </div>
  );
}
