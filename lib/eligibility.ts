import path from "path";
import { promises as fs } from "fs";

const POLICIES_PATH = path.join(process.cwd(), "data", "policies.json");
const CLAIMS_ROOT = path.join(process.cwd(), "data", "claims");

export type EligibilityCheck =
  | { eligible: true; reasons: [] }
  | { eligible: false; reasons: string[] };

type PolicyRecord = {
  policyNumber: string;
  status: "active" | "inactive" | string;
  coverageStart: string;
  coverageEnd: string;
  coveredClaimTypes: string[];
  maxClaimsPerYear?: number;
};

type ClaimRecord = {
  policyNumber: string;
  claimType: string;
  status?: string;
  submittedAt?: string;
};

export async function checkClaimEligibility(payload: {
  policyNumber: string;
  claimType: string;
  incidentDate: string;
}): Promise<EligibilityCheck> {
  const reasons: string[] = [];

  const policies = await loadPolicies();
  const policy = policies.find(
    (entry) => entry.policyNumber.toLowerCase() === payload.policyNumber.toLowerCase()
  );

  if (!policy) {
    reasons.push("Policy not found.");
    return { eligible: false, reasons };
  }

  if (policy.status.toLowerCase() !== "active") {
    reasons.push("Policy is inactive or lapsed.");
  }

  const incidentDate = new Date(payload.incidentDate);
  if (Number.isNaN(incidentDate.getTime())) {
    reasons.push("Incident date is invalid.");
  } else {
    const coverageStart = new Date(policy.coverageStart);
    const coverageEnd = new Date(policy.coverageEnd);
    if (incidentDate < coverageStart || incidentDate > coverageEnd) {
      reasons.push("Incident date is outside policy coverage window.");
    }
  }

  if (
    policy.coveredClaimTypes.length > 0 &&
    !policy.coveredClaimTypes.some(
      (type) => type.toLowerCase() === payload.claimType.toLowerCase()
    )
  ) {
    reasons.push("Claim type is not covered by this policy.");
  }

  const duplicateReasons = await checkDuplicateClaims(policy, payload.claimType);
  reasons.push(...duplicateReasons);

  if (reasons.length === 0) {
    return { eligible: true, reasons: [] };
  }

  return { eligible: false, reasons };
}

async function loadPolicies(): Promise<PolicyRecord[]> {
  try {
    const content = await fs.readFile(POLICIES_PATH, "utf-8");
    return JSON.parse(content) as PolicyRecord[];
  } catch (error) {
    console.warn("Failed to load policies configuration", error);
    return [];
  }
}

async function checkDuplicateClaims(
  policy: PolicyRecord,
  claimType: string
): Promise<string[]> {
  try {
    const policyFolderEntries = await fs.readdir(CLAIMS_ROOT, { withFileTypes: true });
    const now = new Date();
    const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 365);
    let countWithinYear = 0;

    for (const entry of policyFolderEntries) {
      if (!entry.isDirectory()) continue;
      const claimFolder = path.join(CLAIMS_ROOT, entry.name);
      const metadataPath = path.join(claimFolder, "claim.json");

      try {
        const content = await fs.readFile(metadataPath, "utf-8");
        const claim = JSON.parse(content) as ClaimRecord;

        if (claim.policyNumber?.toLowerCase() !== policy.policyNumber.toLowerCase()) {
          continue;
        }

        if (claim.claimType?.toLowerCase() === claimType.toLowerCase()) {
          const submittedAt = claim.submittedAt ? new Date(claim.submittedAt) : undefined;
          if (submittedAt && submittedAt > cutoff) {
            countWithinYear += 1;
          }
        }
      } catch (error) {
        console.warn(`Failed to inspect claim at ${metadataPath}`, error);
      }
    }

    if (typeof policy.maxClaimsPerYear === "number") {
      if (countWithinYear >= policy.maxClaimsPerYear) {
        return [
          `Policy exceeds the maximum of ${policy.maxClaimsPerYear} ${claimType} claim(s) allowed within the last 12 months.`,
        ];
      }
    }

    if (countWithinYear > 0) {
      return ["Potential duplicate claim detected within the last 12 months."];
    }

    return [];
  } catch (error) {
    console.error("Failed to evaluate duplicate claims", error);
    return ["Eligibility check could not be completed. Please try again later."];
  }
}

async function getPolicy(policyNumber: string): Promise<PolicyRecord | undefined> {
  const policies = await loadPolicies();
  return policies.find(
    (entry) => entry.policyNumber.toLowerCase() === policyNumber.toLowerCase()
  );
}
