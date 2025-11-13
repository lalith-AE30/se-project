import { getWorkflow, updateWorkflow, deleteWorkflow } from "@/lib/workflows";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const wf = getWorkflow(params.id);
  if (!wf) {
    return new Response(JSON.stringify({ error: "not found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ data: wf }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({} as any));
  const patch: any = {};
  if (typeof body.name === "string") patch.name = body.name;
  if (typeof body.active === "boolean") patch.active = body.active;
  if (Array.isArray(body.steps)) patch.steps = body.steps;

  const updated = updateWorkflow(params.id, patch);
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

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const ok = deleteWorkflow(params.id);
  if (!ok) {
    return new Response(JSON.stringify({ error: "not found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }
  return new Response(null, { status: 204 });
}
