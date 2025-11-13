'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ApplyPolicy() {
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    type: 'auto',
    coverageAmount: 50000,
    premium: 1200,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(userData));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const res = await fetch('/api/policies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, customerId: user.id }),
    });

    if (res.ok) {
      alert('Policy application submitted successfully!');
      router.push('/dashboard');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#fef9f3] p-6">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => router.back()} className="btn bg-white mb-4">← Back</button>
        
        <div className="card">
          <h1 className="text-2xl font-bold mb-6">Apply for Insurance Policy</h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Policy Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="input"
              >
                <option value="auto">Auto Insurance</option>
                <option value="home">Home Insurance</option>
                <option value="health">Health Insurance</option>
                <option value="life">Life Insurance</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Coverage Amount ($)</label>
              <input
                type="number"
                value={formData.coverageAmount}
                onChange={(e) => setFormData({ ...formData, coverageAmount: Number(e.target.value) })}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Annual Premium ($)</label>
              <input
                type="number"
                value={formData.premium}
                onChange={(e) => setFormData({ ...formData, premium: Number(e.target.value) })}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="input"
                required
              />
            </div>

            <button type="submit" className="btn btn-success w-full">
              Submit Application
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
