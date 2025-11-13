'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [policies, setPolicies] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [slaData, setSlaData] = useState<any>(null);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    const u = JSON.parse(userData);
    setUser(u);
    loadData(u);
  }, []);

  const loadData = async (u: any) => {
    const [policiesRes, claimsRes, notifRes, renewalsRes] = await Promise.all([
      fetch(`/api/policies?role=${u.role}&userId=${u.id}`),
      fetch(`/api/claims?role=${u.role}&userId=${u.id}`),
      fetch(`/api/notifications?userId=${u.id}`),
      fetch('/api/policies/renewals'),
    ]);

    if (policiesRes.ok) {
      const data = await policiesRes.json();
      setPolicies(data.policies);
    }

    if (claimsRes.ok) {
      const data = await claimsRes.json();
      setClaims(data.claims);
    }

    if (notifRes.ok) {
      const data = await notifRes.json();
      setNotifications(data.notifications);
    }

    if (u.role === 'manager' || u.role === 'admin') {
      const slaRes = await fetch('/api/sla');
      if (slaRes.ok) {
        const data = await slaRes.json();
        setSlaData(data.slaData);
      }

      const workflowsRes = await fetch('/api/workflows?type=workflows');
      if (workflowsRes.ok) {
        const data = await workflowsRes.json();
        setWorkflows(data.report);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleApprovePolicy = async (id: number) => {
    await fetch('/api/policies', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'approved' }),
    });
    loadData(user);
  };

  const handleApproveClaim = async (id: number, status: string) => {
    await fetch('/api/claims', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    loadData(user);
  };

  const downloadReport = async () => {
    const res = await fetch('/api/workflows?type=compliance');
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data.report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-report-${new Date().toISOString()}.json`;
    a.click();
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#fef9f3]">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#5a5a5a' }}>Insurance Portal</h1>
            <p className="text-sm text-gray-600">{user.name} - {user.role}</p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="relative">
              <span className="badge badge-pending">{notifications.filter((n: any) => !n.is_read).length} new</span>
            </div>
            <button onClick={handleLogout} className="btn btn-danger">Logout</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button onClick={() => setActiveTab('overview')} className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'bg-white'}`}>Overview</button>
          <button onClick={() => setActiveTab('policies')} className={`btn ${activeTab === 'policies' ? 'btn-primary' : 'bg-white'}`}>Policies</button>
          <button onClick={() => setActiveTab('claims')} className={`btn ${activeTab === 'claims' ? 'btn-primary' : 'bg-white'}`}>Claims</button>
          <button onClick={() => setActiveTab('notifications')} className={`btn ${activeTab === 'notifications' ? 'btn-primary' : 'bg-white'}`}>Notifications</button>
          {(user.role === 'manager' || user.role === 'admin') && (
            <>
              <button onClick={() => setActiveTab('sla')} className={`btn ${activeTab === 'sla' ? 'btn-primary' : 'bg-white'}`}>SLA</button>
              <button onClick={() => setActiveTab('workflows')} className={`btn ${activeTab === 'workflows' ? 'btn-primary' : 'bg-white'}`}>Workflows</button>
            </>
          )}
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card bg-gradient-to-br from-blue-100 to-blue-200">
              <h3 className="text-lg font-semibold mb-2">Policies</h3>
              <p className="text-3xl font-bold">{policies.length}</p>
            </div>
            <div className="card bg-gradient-to-br from-green-100 to-green-200">
              <h3 className="text-lg font-semibold mb-2">Claims</h3>
              <p className="text-3xl font-bold">{claims.length}</p>
            </div>
            <div className="card bg-gradient-to-br from-purple-100 to-purple-200">
              <h3 className="text-lg font-semibold mb-2">Notifications</h3>
              <p className="text-3xl font-bold">{notifications.filter((n: any) => !n.is_read).length}</p>
            </div>
          </div>
        )}

        {activeTab === 'policies' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Policies</h2>
              {user.role === 'customer' && (
                <button onClick={() => router.push('/policies/apply')} className="btn btn-success">Apply for Policy</button>
              )}
            </div>
            {policies.map((policy: any) => (
              <div key={policy.id} className="card">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{policy.policy_number}</h3>
                    <p className="text-gray-600">{policy.type}</p>
                    <p className="text-sm text-gray-500">Coverage: ${policy.coverage_amount.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">Premium: ${policy.premium.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">{policy.start_date} to {policy.end_date}</p>
                  </div>
                  <div className="text-right">
                    <span className={`badge badge-${policy.status}`}>{policy.status}</span>
                    {user.role === 'underwriter' && policy.status === 'pending' && (
                      <button onClick={() => handleApprovePolicy(policy.id)} className="btn btn-success mt-2 text-sm">
                        Approve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'claims' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Claims</h2>
              {user.role === 'customer' && (
                <button onClick={() => router.push('/claims/submit')} className="btn btn-success">Submit Claim</button>
              )}
            </div>
            {claims.map((claim: any) => (
              <div key={claim.id} className="card">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{claim.claim_number}</h3>
                    <p className="text-gray-600">Policy: {claim.policy_number}</p>
                    <p className="text-sm text-gray-500">{claim.type} - ${claim.amount.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">{claim.description}</p>
                    {claim.is_flagged && <span className="badge badge-danger mt-2">Flagged (Score: {claim.fraud_score})</span>}
                  </div>
                  <div className="text-right">
                    <span className={`badge badge-${claim.status === 'under_review' ? 'pending' : claim.status}`}>{claim.status}</span>
                    {(user.role === 'adjuster' || user.role === 'analyst') && claim.status === 'under_review' && (
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => handleApproveClaim(claim.id, 'approved')} className="btn btn-success text-sm">
                          Approve
                        </button>
                        <button onClick={() => handleApproveClaim(claim.id, 'rejected')} className="btn btn-danger text-sm">
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Notifications</h2>
            {notifications.map((notif: any) => (
              <div key={notif.id} className={`card ${notif.is_read ? 'opacity-60' : 'bg-blue-50'}`}>
                <h3 className="font-semibold">{notif.title}</h3>
                <p className="text-gray-600">{notif.message}</p>
                <p className="text-xs text-gray-500 mt-2">{new Date(notif.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'sla' && slaData && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">SLA Monitoring</h2>
            </div>
            {slaData.map((data: any) => (
              <div key={data.entity_type} className="card">
                <h3 className="font-semibold text-lg capitalize">{data.entity_type} SLA</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-2xl font-bold">{data.total}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Breached</p>
                    <p className="text-2xl font-bold text-red-600">{data.breached}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">At Risk</p>
                    <p className="text-2xl font-bold text-yellow-600">{data.at_risk}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Avg Hours</p>
                    <p className="text-2xl font-bold">{data.avg_completion_hours?.toFixed(1) || 'N/A'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'workflows' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Workflows</h2>
              <button onClick={downloadReport} className="btn btn-success">Download Compliance Report</button>
            </div>
            {workflows.map((workflow: any) => (
              <div key={workflow.id} className="card">
                <h3 className="font-semibold text-lg">{workflow.name}</h3>
                <p className="text-gray-600 capitalize">Type: {workflow.type}</p>
                <p className="text-sm text-gray-500">SLA: {workflow.sla_hours} hours</p>
                <div className="mt-2">
                  <p className="text-sm font-medium">Steps:</p>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {JSON.parse(workflow.steps).map((step: string, i: number) => (
                      <span key={i} className="badge badge-approved">{step}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
