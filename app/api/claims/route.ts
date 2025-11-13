import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import path from "path";
import { promises as fs } from "fs";

const CLAIMS_ROOT = path.join(process.cwd(), "data", "claims");
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB per file
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
]);

type ClaimPayload = {
  policyNumber: string;
  claimantName: string;
  claimantEmail: string;
  incidentDate: string;
  incidentTime: string;
  incidentLocation: string;
  claimType: string;
  description: string;
  additionalNotes?: string;
};

type ClaimRecord = ClaimPayload & {
  referenceId: string;
  submittedAt: string;
  attachments: string[];
};

function generateReferenceId() {
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const random = crypto.randomBytes(3).toString("hex");
  return `CLM-${timestamp}-${random}`;
}

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function validatePayload(payload: Partial<ClaimPayload>) {
  const requiredFields: (keyof ClaimPayload)[] = [
    "policyNumber",
    "claimantName",
    "claimantEmail",
    "incidentDate",
    "incidentTime",
    "incidentLocation",
    "claimType",
    "description",
  ];

  const missing = requiredFields.filter((field) => {
    const value = payload[field];
    return !value || (typeof value === "string" && value.trim() === "");
  });

  if (missing.length > 0) {
    return {
      valid: false,
      errors: missing.reduce<Record<string, string>>((acc, field) => {
        acc[field] = "This field is required.";
        return acc;
      }, {}),
    } as const;
  }

  const email = payload.claimantEmail ?? "";
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return {
      valid: false,
      errors: {
        claimantEmail: "Enter a valid email address.",
      },
    } as const;
  }

  return { valid: true } as const;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const payload: Partial<ClaimPayload> = {
      policyNumber: formData.get("policyNumber")?.toString() ?? "",
      claimantName: formData.get("claimantName")?.toString() ?? "",
      claimantEmail: formData.get("claimantEmail")?.toString() ?? "",
      incidentDate: formData.get("incidentDate")?.toString() ?? "",
      incidentTime: formData.get("incidentTime")?.toString() ?? "",
      incidentLocation: formData.get("incidentLocation")?.toString() ?? "",
      claimType: formData.get("claimType")?.toString() ?? "",
      description: formData.get("description")?.toString() ?? "",
      additionalNotes: formData.get("additionalNotes")?.toString() ?? undefined,
    };

    const validation = validatePayload(payload);
    if (!validation.valid) {
      return NextResponse.json(
        {
          message: "Validation failed.",
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    const files = formData.getAll("supportingDocuments");
    const invalidFiles: string[] = [];
    const tooLarge: string[] = [];

    for (const entry of files) {
      if (entry instanceof File) {
        if (!ALLOWED_MIME_TYPES.has(entry.type)) {
          invalidFiles.push(entry.name);
        }
        if (entry.size > MAX_FILE_SIZE_BYTES) {
          tooLarge.push(entry.name);
        }
      }
    }

    if (invalidFiles.length || tooLarge.length) {
      return NextResponse.json(
        {
          message: "File validation failed.",
          errors: {
            invalidTypes: invalidFiles,
            tooLarge,
          },
        },
        { status: 400 }
      );
    }

    const referenceId = generateReferenceId();
    const claimDir = path.join(CLAIMS_ROOT, referenceId);
    await fs.mkdir(claimDir, { recursive: true });

    const attachments: string[] = [];
    for (const entry of files) {
      if (entry instanceof File) {
        const safeName = sanitizeFilename(entry.name || "attachment");
        const buffer = Buffer.from(await entry.arrayBuffer());
        const filePath = path.join(claimDir, safeName);
        await fs.writeFile(filePath, buffer);
        attachments.push(path.relative(CLAIMS_ROOT, filePath));
      }
    }

    const claimRecord: ClaimRecord = {
      ...(payload as ClaimPayload),
      referenceId,
      submittedAt: new Date().toISOString(),
      attachments,
    };

    const metadataPath = path.join(claimDir, "claim.json");
    await fs.writeFile(metadataPath, JSON.stringify(claimRecord, null, 2), "utf-8");

    // Placeholder for notification implementation.

    return NextResponse.json({ referenceId }, { status: 201 });
  } catch (error) {
    console.error("Failed to process claim submission", error);
    return NextResponse.json(
      {
        message: "An unexpected error occurred while processing the claim.",
      },
      { status: 500 }
    );
  }
}
