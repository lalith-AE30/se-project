'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    if (res.ok) {
      const { user } = await res.json();
      localStorage.setItem('user', JSON.stringify(user));
      router.push('/dashboard');
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #ffd5cd 0%, #a8d5e2 100%)' }}>
      <div className="card max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-2" style={{ color: '#5a5a5a' }}>Insurance Portal</h1>
        <p className="text-center text-gray-600 mb-6">Automated Policy & Claims Management</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="user@example.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
              required
            />
          </div>
          
          {error && <p className="text-red-600 text-sm">{error}</p>}
          
          <button type="submit" className="btn btn-primary w-full">
            Login
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/register" className="text-blue-600 hover:text-blue-800 font-medium">
              Register here
            </Link>
          </p>
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 rounded-lg text-sm">
          <p className="font-semibold mb-2">Demo Accounts (password: password123):</p>
          <ul className="space-y-1 text-gray-700">
            <li>• customer@test.com - Customer</li>
            <li>• underwriter@insurance.com - Underwriter</li>
            <li>• adjuster@insurance.com - Claims Adjuster</li>
            <li>• analyst@insurance.com - Fraud Analyst</li>
            <li>• manager@insurance.com - Manager</li>
            <li>• admin@insurance.com - Admin</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
