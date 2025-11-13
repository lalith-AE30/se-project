"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Step = {
  id: string;
  name: string;
  type: "TASK" | "AUTOMATION" | "APPROVAL";
  assigneeRole?: string;
};

type Workflow = {
  id: string;
  key: string;
  name: string;
  active: boolean;
  steps: Step[];
  version: number;
  updatedAt: string;
};

export default function AdminWorkflowsPage() {
  const [items, setItems] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templateKey, setTemplateKey] = useState("ISSUANCE");

  const listEndpoint = useMemo(() => "/api/workflows", []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(listEndpoint, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setItems(json.data as Workflow[]);
    } catch (e: any) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [listEndpoint]);

  async function createFromTemplate() {
    const res = await fetch("/api/workflows", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key: templateKey }),
    });
    if (res.ok) {
      await load();
    } else {
      alert("Failed to create workflow");
    }
  }

  async function patch(id: string, patch: Partial<Pick<Workflow, "name" | "active" | "steps">>) {
    const res = await fetch(`/api/workflows/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      alert("Update failed");
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this workflow?")) return;
    const res = await fetch(`/api/workflows/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((cur) => cur.filter((w) => w.id !== id));
    } else {
      alert("Delete failed");
    }
  }

  return (
    <div className="min-h-screen w-full bg-white text-zinc-900">
      <div className="mx-auto max-w-5xl py-10 px-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold">Admin · Workflows</h1>
          <Link href="/" className="text-sm underline">Home</Link>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <label className="text-sm">Create from template</label>
          <select
            className="border rounded px-2 py-1 bg-white"
            value={templateKey}
            onChange={(e) => setTemplateKey(e.target.value)}
          >
            <option value="ISSUANCE">Policy Issuance</option>
            <option value="RENEWAL">Renewal</option>
            <option value="ENDORSEMENT">Endorsement</option>
            <option value="CLAIM">Claim</option>
          </select>
          <button
            onClick={createFromTemplate}
            className="text-sm rounded-full border px-3 py-1 hover:bg-black/5"
          >
            Create
          </button>
        </div>

        {loading && <div className="text-sm">Loading…</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="grid gap-4">
          {items.length === 0 && !loading && (
            <div className="text-sm text-zinc-600">No workflows defined.</div>
          )}
          {items.map((wf) => (
            <div key={wf.id} className="rounded-lg border p-4 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-medium">{wf.name} <span className="text-xs text-zinc-500">({wf.key})</span></div>
                  <div className="text-xs text-zinc-500">v{wf.version} · Updated {new Date(wf.updatedAt).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm">Active</label>
                  <input
                    type="checkbox"
                    checked={wf.active}
                    onChange={(e) => {
                      const next = items.map((x) => x.id === wf.id ? { ...x, active: e.target.checked } : x);
                      setItems(next);
                      patch(wf.id, { active: e.target.checked });
                    }}
                  />
                  <button
                    onClick={() => remove(wf.id)}
                    className="text-sm rounded-full border px-3 py-1 hover:bg-black/5"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="mt-4">
                <label className="text-xs uppercase tracking-wide text-zinc-500">Name</label>
                <input
                  className="mt-1 w-full rounded border bg-white px-2 py-1"
                  value={wf.name}
                  onChange={(e) => {
                    const next = items.map((x) => x.id === wf.id ? { ...x, name: e.target.value } : x);
                    setItems(next);
                  }}
                  onBlur={(e) => patch(wf.id, { name: e.target.value })}
                />
              </div>
              <div className="mt-4">
                <div className="text-xs uppercase tracking-wide text-zinc-500 mb-2">Steps</div>
                <ol className="space-y-2">
                  {wf.steps.map((s, idx) => (
                    <li key={s.id} className="flex items-center justify-between gap-3">
                      <div className="text-sm">
                        {idx + 1}. {s.name}
                        <span className="ml-2 text-xs text-zinc-500">[{s.type}{s.assigneeRole ? ` · ${s.assigneeRole}` : ""}]</span>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
