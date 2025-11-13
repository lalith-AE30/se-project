export type Claim = {
  id: string;
  policyId: string;
  customerId: string;
  submittedAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  lossType: string;
};

const claims: Claim[] = [
  {
    id: "CLM-2001",
    policyId: "POL-9001",
    customerId: "cust-01",
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    status: "PENDING",
    lossType: "Auto Accident",
  },
  {
    id: "CLM-2002",
    policyId: "POL-9002",
    customerId: "cust-02",
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    status: "PENDING",
    lossType: "Health Hospitalization",
  },
];

export function getClaim(id: string) {
  return claims.find((c) => c.id === id);
}

export function listClaimsByStatus(status?: Claim["status"]) {
  return status ? claims.filter((c) => c.status === status) : claims;
}

export function updateClaimStatus(id: string, status: Claim["status"]) {
  const c = claims.find((x) => x.id === id);
  if (!c) return undefined;
  c.status = status;
  return c;
}
