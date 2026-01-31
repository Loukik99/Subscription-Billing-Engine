
import { api } from './web/lib/api';

// Mock fetch for Node environment (built-in in Node 18+)
// global.fetch = require('node-fetch');
// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    clear: () => { store = {}; },
    removeItem: (key: string) => { delete store[key]; }
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// We need to bypass the "window" check in api.ts or mock window
(global as any).window = {};

// Override API_URL for Node test (since web/lib/api.ts might use localhost:3000 default if env not set, 
// but we changed it to 3005 in code? No, we changed it in .env, but api.ts has a fallback.
// Let's set process.env.NEXT_PUBLIC_API_URL manually here just in case)
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3005/api';

async function test() {
  try {
    console.log('Logging in...');
    const loginRes = await fetch('http://localhost:3005/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'admin123' })
    });
    
    if (!loginRes.ok) {
      throw new Error(`Login failed: ${loginRes.status} ${await loginRes.text()}`);
    }

    const loginData = await loginRes.json();
    console.log('Login successful. Token:', loginData.token.substring(0, 20) + '...');
    
    // Set token for api calls (if we were using the api object, but let's just use fetch directly to be sure)
    
    console.log('Fetching dashboard summary...');
    const dashRes = await fetch('http://localhost:3005/api/dashboard/summary', {
      headers: {
        'Authorization': `Bearer ${loginData.token}`
      }
    });

    if (!dashRes.ok) {
        console.log('Dashboard fetch failed status:', dashRes.status);
        console.log('Response:', await dashRes.text());
    } else {
        const dashData = await dashRes.json();
        console.log('Dashboard data received:', dashData);
    }

  } catch (e) {
    console.error('Test error:', e);
  }
}

test();
