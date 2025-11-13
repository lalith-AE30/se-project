import { getApplication, updateStatus } from "@/lib/store";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const app = getApplication(params.id);
  if (!app) {
    return new Response(JSON.stringify({ error: "not found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ data: app }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({} as any));
  const action = body?.action as string | undefined;
  const notes = body?.notes as string | undefined;
  if (!action || !["approve", "reject"].includes(action)) {
    return new Response(JSON.stringify({ error: "invalid action" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  const newStatus = action === "approve" ? "APPROVED" : "REJECTED" as const;
  const updated = updateStatus(params.id, newStatus, notes);
  if (!updated) {
    return new Response(JSON.stringify({ error: "not found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ data: updated }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
