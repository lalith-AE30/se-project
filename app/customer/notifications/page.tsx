"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Notification = {
  id: string;
  customerId: string;
  type: "CLAIM_APPROVED" | "CLAIM_REJECTED";
  message: string;
  claimId?: string;
  createdAt: string;
  read: boolean;
};

export default function CustomerNotificationsPage() {
  const [customerId, setCustomerId] = useState("cust-01");
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endpoint = useMemo(
    () => `/api/notifications?customerId=${encodeURIComponent(customerId)}`,
    [customerId]
  );

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(endpoint, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setItems(json.data as Notification[]);
    } catch (e: any) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [endpoint]);

  return (
    <div className="min-h-screen w-full bg-white text-black">
      <div className="mx-auto max-w-4xl py-10 px-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold">Customer Notifications</h1>
          <Link href="/" className="text-sm underline">Home</Link>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <label className="text-sm">Customer ID</label>
          <input
            className="border rounded px-2 py-1 bg-white"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
          />
          <button
            onClick={load}
            className="text-sm rounded-full border px-3 py-1 hover:bg-black/5"
          >
            Refresh
          </button>
        </div>

        {loading && <div className="text-sm">Loading…</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="grid gap-3">
          {items.length === 0 && !loading && (
            <div className="text-sm text-zinc-600">No notifications.</div>
          )}
          {items.map((n) => (
            <div key={n.id} className="rounded-lg border p-4 bg-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">
                    {n.type === "CLAIM_APPROVED" ? "Claim Approved" : "Claim Rejected"}
                  </div>
                  <div className="text-sm mt-1">{n.message}</div>
                  {n.claimId && (
                    <div className="text-xs text-zinc-500 mt-1">Claim: {n.claimId}</div>
                  )}
                </div>
                <div className="text-xs text-zinc-500 whitespace-nowrap">
                  {new Date(n.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
