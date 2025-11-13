import { listWorkflows, createFromTemplate } from "@/lib/workflows";

export async function GET() {
  return new Response(JSON.stringify({ data: listWorkflows() }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const key = body?.key as string | undefined;
  const name = body?.name as string | undefined;
  if (!key) {
    return new Response(JSON.stringify({ error: "key is required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  const created = createFromTemplate(key as any, name);
  if (!created) {
    return new Response(JSON.stringify({ error: "invalid key" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ data: created }), {
    status: 201,
    headers: { "content-type": "application/json" },
  });
}
