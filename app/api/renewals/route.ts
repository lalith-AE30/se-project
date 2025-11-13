import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import crypto from "crypto";

const RENEWALS_ROOT = path.join(process.cwd(), "data", "renewals");

interface RenewalRequestBody {
  policyNumber?: string;
  customerName?: string;
  customerEmail?: string;
  expiryDate?: string;
  leadTimes?: number[] | string;
  contactPhone?: string;
}

type ReminderStatus = "scheduled" | "sent" | "skipped";

type RenewalReminder = {
  leadDays: number;
  scheduledFor: string;
  status: ReminderStatus;
};

type RenewalRecord = {
  id: string;
  policyNumber: string;
  customerName: string;
  customerEmail: string;
  contactPhone?: string;
  expiryDate: string;
  leadTimes: number[];
  reminders: RenewalReminder[];
  createdAt: string;
};

const DEFAULT_LEAD_TIMES = [30, 14, 7, 2];

function parseLeadTimes(value: RenewalRequestBody["leadTimes"]): number[] {
  if (!value || (Array.isArray(value) && value.length === 0)) {
    return DEFAULT_LEAD_TIMES;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item) && item > 0)
      .sort((a, b) => b - a);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => Number(item.trim()))
      .filter((item) => Number.isFinite(item) && item > 0)
      .sort((a, b) => b - a);
  }

  return DEFAULT_LEAD_TIMES;
}

function validateRequest(body: RenewalRequestBody) {
  const errors: Record<string, string> = {};

  if (!body.policyNumber || body.policyNumber.trim() === "") {
    errors.policyNumber = "Policy number is required.";
  }

  if (!body.customerName || body.customerName.trim() === "") {
    errors.customerName = "Customer name is required.";
  }

  if (!body.customerEmail || body.customerEmail.trim() === "") {
    errors.customerEmail = "Customer email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.customerEmail)) {
    errors.customerEmail = "Enter a valid email address.";
  }

  if (!body.expiryDate || body.expiryDate.trim() === "") {
    errors.expiryDate = "Policy expiry date is required.";
  } else if (isNaN(Date.parse(body.expiryDate))) {
    errors.expiryDate = "Invalid expiry date.";
  }

  return errors;
}

function generateId() {
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const random = crypto.randomBytes(3).toString("hex");
  return `RNW-${timestamp}-${random}`;
}

function buildReminderSchedule(expiryDate: Date, leadTimes: number[]): RenewalReminder[] {
  const now = new Date();
  return leadTimes
    .map<RenewalReminder | null>((lead) => {
      const reminderDate = new Date(expiryDate);
      reminderDate.setDate(reminderDate.getDate() - lead);

      if (isNaN(reminderDate.getTime())) {
        return null;
      }

      return {
        leadDays: lead,
        scheduledFor: reminderDate.toISOString(),
        status: reminderDate < now ? "skipped" : "scheduled",
      };
    })
    .filter((value): value is RenewalReminder => value !== null)
    .sort((a: RenewalReminder, b: RenewalReminder) => {
      return new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime();
    });
}

async function ensureDirectoryExists() {
  await fs.mkdir(RENEWALS_ROOT, { recursive: true });
}

async function listRenewalRecords(): Promise<RenewalRecord[]> {
  try {
    await ensureDirectoryExists();
    const entries = await fs.readdir(RENEWALS_ROOT, { withFileTypes: true });
    const records: RenewalRecord[] = [];

    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".json")) {
        const fullPath = path.join(RENEWALS_ROOT, entry.name);
        try {
          const content = await fs.readFile(fullPath, "utf-8");
          const record = JSON.parse(content) as RenewalRecord;
          records.push(record);
        } catch (error) {
          console.warn(`Failed to parse renewal record ${entry.name}`, error);
        }
      }
    }

    return records.sort(
      (a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
    );
  } catch (error) {
    console.error("Failed to list renewal reminders", error);
    throw error;
  }
}

export async function GET() {
  try {
    const records = await listRenewalRecords();
    return NextResponse.json({ reminders: records }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Unable to load renewal reminders." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RenewalRequestBody;
    const errors = validateRequest(body);

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ message: "Validation failed.", errors }, { status: 400 });
    }

    const expiryDate = new Date(body.expiryDate!);
    const leadTimes = parseLeadTimes(body.leadTimes);
    const schedule = buildReminderSchedule(expiryDate, leadTimes);

    if (schedule.length === 0) {
      return NextResponse.json(
        {
          message:
            "Could not schedule reminders. Please review the expiry date or lead time configuration.",
        },
        { status: 400 }
      );
    }

    const id = generateId();
    await ensureDirectoryExists();

    const record: RenewalRecord = {
      id,
      policyNumber: body.policyNumber!.trim(),
      customerName: body.customerName!.trim(),
      customerEmail: body.customerEmail!.trim(),
      contactPhone: body.contactPhone?.trim() || undefined,
      expiryDate: expiryDate.toISOString(),
      leadTimes: schedule.map((reminder) => reminder.leadDays),
      reminders: schedule,
      createdAt: new Date().toISOString(),
    };

    const filePath = path.join(RENEWALS_ROOT, `${id}.json`);
    await fs.writeFile(filePath, JSON.stringify(record, null, 2), "utf-8");

    // Placeholder for integration with email/SMS services.

    return NextResponse.json({ reminder: record }, { status: 201 });
  } catch (error) {
    console.error("Failed to schedule renewal reminder", error);
    return NextResponse.json(
      { message: "An unexpected error occurred while scheduling the renewal reminder." },
      { status: 500 }
    );
  }
}
