'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SubmitClaim() {
  const [user, setUser] = useState<any>(null);
  const [policies, setPolicies] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    policyId: '',
    type: 'accident',
    amount: 5000,
    description: '',
    documents: '',
  });
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    const u = JSON.parse(userData);
    setUser(u);
    loadPolicies(u);
  }, []);

  const loadPolicies = async (u: any) => {
    const res = await fetch(`/api/policies?role=customer&userId=${u.id}`);
    if (res.ok) {
      const data = await res.json();
      setPolicies(data.policies.filter((p: any) => p.status === 'active'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const res = await fetch('/api/claims', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, customerId: user.id }),
    });

    if (res.ok) {
      const data = await res.json();
      alert(`Claim submitted successfully! Claim Number: ${data.claimNumber}${data.isFlagged ? ' (Flagged for review)' : ''}`);
      router.push('/dashboard');
    } else {
      const error = await res.json();
      alert(`Error: ${error.error}`);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#fef9f3] p-6">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => router.back()} className="btn bg-white mb-4">← Back</button>
        
        <div className="card">
          <h1 className="text-2xl font-bold mb-6">Submit Claim</h1>
          
          {policies.length === 0 ? (
            <p className="text-gray-600">You don't have any active policies to claim against.</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Policy</label>
                <select
                  value={formData.policyId}
                  onChange={(e) => setFormData({ ...formData, policyId: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">Choose a policy...</option>
                  {policies.map((policy) => (
                    <option key={policy.id} value={policy.id}>
                      {policy.policy_number} - {policy.type} (${policy.coverage_amount.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Claim Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="input"
                >
                  <option value="accident">Accident</option>
                  <option value="theft">Theft</option>
                  <option value="damage">Damage</option>
                  <option value="medical">Medical</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Claim Amount ($)</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  rows={4}
                  placeholder="Describe the incident..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Supporting Documents (comma-separated URLs)</label>
                <input
                  type="text"
                  value={formData.documents}
                  onChange={(e) => setFormData({ ...formData, documents: e.target.value })}
                  className="input"
                  placeholder="doc1.pdf, doc2.pdf, photo.jpg"
                />
              </div>

              <button type="submit" className="btn btn-success w-full">
                Submit Claim
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
