"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Application = {
  id: string;
  applicantName: string;
  product: string;
  premium: number;
  submittedAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  assignedUnderwriterId: string;
  notes?: string;
};

export default function UnderwriterDashboard() {
  const [underwriterId, setUnderwriterId] = useState("uw-101");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Application[]>([]);

  const endpoint = useMemo(
    () => `/api/underwriting?underwriterId=${encodeURIComponent(underwriterId)}`,
    [underwriterId]
  );

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(endpoint, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setItems(json.data as Application[]);
    } catch (e: any) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [endpoint]);

  async function act(app: Application, action: "approve" | "reject") {
    const prev = items;
    setItems((cur) => cur.filter((i) => i.id !== app.id));
    try {
      const res = await fetch(`/api/applications/${app.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("Action failed");
    } catch (e) {
      setItems(prev);
      alert("Failed to update. Try again.");
    }
  }

  return (
    <div className="min-h-screen w-full bg-white text-black">
      <div className="mx-auto max-w-4xl py-10 px-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold">Underwriter Dashboard</h1>
          <Link href="/" className="text-sm underline">Home</Link>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <label className="text-sm">Underwriter</label>
          <select
            className="border rounded px-2 py-1 bg-white"
            value={underwriterId}
            onChange={(e) => setUnderwriterId(e.target.value)}
          >
            <option value="uw-101">uw-101</option>
            <option value="uw-102">uw-102</option>
          </select>
          <button
            onClick={load}
            className="text-sm rounded-full border px-3 py-1 hover:bg-black/5"
          >
            Refresh
          </button>
        </div>

        {loading && <div className="text-sm">Loading…</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="grid gap-4">
          {items.length === 0 && !loading && (
            <div className="text-sm text-zinc-600">No pending applications.</div>
          )}
          {items.map((app) => (
            <div key={app.id} className="rounded-lg border p-4 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-medium">{app.id} · {app.applicantName}</div>
                  <div className="text-sm text-zinc-600">{app.product} · Premium ₹{app.premium}</div>
                  <div className="text-xs text-zinc-500">Submitted {new Date(app.submittedAt).toLocaleString()}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => act(app, "approve")}
                    className="rounded-full bg-green-600 text-white px-4 py-2 text-sm hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => act(app, "reject")}
                    className="rounded-full bg-red-600 text-white px-4 py-2 text-sm hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
