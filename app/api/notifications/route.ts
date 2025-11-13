import { listNotifications } from "@/lib/notifications";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customerId");
  if (!customerId) {
    return new Response(JSON.stringify({ error: "customerId is required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  const items = listNotifications(customerId);
  return new Response(JSON.stringify({ data: items }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
