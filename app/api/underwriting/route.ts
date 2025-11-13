import { listAssignedApplications } from "@/lib/store";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const underwriterId = searchParams.get("underwriterId");
  if (!underwriterId) {
    return new Response(JSON.stringify({ error: "underwriterId is required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  const items = listAssignedApplications(underwriterId);
  return new Response(JSON.stringify({ data: items }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
