import { getClaim, updateClaimStatus } from "@/lib/claims";
import { pushNotification } from "@/lib/notifications";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const claim = getClaim(params.id);
  if (!claim) {
    return new Response(JSON.stringify({ error: "not found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ data: claim }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({} as any));
  const action = body?.action as string | undefined; // "approve" | "reject"
  if (!action || !["approve", "reject"].includes(action)) {
    return new Response(JSON.stringify({ error: "invalid action" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  const claim = getClaim(params.id);
  if (!claim) {
    return new Response(JSON.stringify({ error: "not found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }
  const status = action === "approve" ? "APPROVED" : "REJECTED" as const;
  const updated = updateClaimStatus(params.id, status);
  if (!updated) {
    return new Response(JSON.stringify({ error: "update failed" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
  pushNotification({
    customerId: claim.customerId,
    type: status === "APPROVED" ? "CLAIM_APPROVED" : "CLAIM_REJECTED",
    message:
      status === "APPROVED"
        ? `Your claim ${claim.id} has been approved. We will contact you with settlement details.`
        : `Your claim ${claim.id} was rejected. Please review the decision or contact support for assistance.`,
    claimId: claim.id,
  });
  return new Response(JSON.stringify({ data: updated }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
