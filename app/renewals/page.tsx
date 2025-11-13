"use client";

import { useEffect, useMemo, useState } from "react";

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

type RenewalFormState = {
  policyNumber: string;
  customerName: string;
  customerEmail: string;
  contactPhone: string;
  expiryDate: string;
  leadTimes: string;
};

type FieldErrors = Partial<Record<keyof RenewalFormState, string>>;

type SubmissionState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success" }
  | { status: "error"; message: string };

const initialForm: RenewalFormState = {
  policyNumber: "",
  customerName: "",
  customerEmail: "",
  contactPhone: "",
  expiryDate: "",
  leadTimes: "30,14,7,2",
};

function parseLeadTimes(input: string): number[] {
  if (!input.trim()) {
    return [30, 14, 7, 2];
  }

  const parsed = input
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value) && value > 0);

  return parsed.length > 0 ? parsed.sort((a, b) => b - a) : [30, 14, 7, 2];
}

function validateForm(form: RenewalFormState): FieldErrors | null {
  const errors: FieldErrors = {};

  if (!form.policyNumber.trim()) {
    errors.policyNumber = "Policy number is required.";
  }
  if (!form.customerName.trim()) {
    errors.customerName = "Customer name is required.";
  }
  if (!form.customerEmail.trim()) {
    errors.customerEmail = "Customer email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail.trim())) {
    errors.customerEmail = "Enter a valid email address.";
  }
  if (!form.expiryDate) {
    errors.expiryDate = "Expiry date is required.";
  } else if (Number.isNaN(Date.parse(form.expiryDate))) {
    errors.expiryDate = "Enter a valid expiry date.";
  }

  const leadTimes = parseLeadTimes(form.leadTimes);
  if (!leadTimes || leadTimes.length === 0) {
    errors.leadTimes = "Provide at least one reminder interval (in days).";
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

function formatDate(dateIso: string, options?: Intl.DateTimeFormatOptions) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      ...options,
    }).format(new Date(dateIso));
  } catch (error) {
    return dateIso;
  }
}

export default function RenewalAutomationPage() {
  const [form, setForm] = useState<RenewalFormState>(initialForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submission, setSubmission] = useState<SubmissionState>({ status: "idle" });
  const [reminders, setReminders] = useState<RenewalRecord[]>([]);
  const [isLoadingList, setIsLoadingList] = useState<boolean>(false);
  const [listError, setListError] = useState<string | null>(null);

  const isSubmitting = submission.status === "submitting";

  const nextUpcomingReminders = useMemo(() => {
    return reminders
      .map((record) => {
        const upcoming = record.reminders.find((reminder) => reminder.status === "scheduled");
        return upcoming ? { record, reminder: upcoming } : null;
      })
      .filter((entry): entry is { record: RenewalRecord; reminder: RenewalReminder } => entry !== null)
      .sort((a, b) =>
        new Date(a.reminder.scheduledFor).getTime() - new Date(b.reminder.scheduledFor).getTime()
      );
  }, [reminders]);

  async function loadReminders() {
    setIsLoadingList(true);
    setListError(null);
    try {
      const response = await fetch("/api/renewals", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to load renewal reminders.");
      }
      const data = (await response.json()) as { reminders: RenewalRecord[] };
      setReminders(data.reminders ?? []);
    } catch (error) {
      setListError(
        error instanceof Error
          ? error.message
          : "Unable to load renewal reminders right now."
      );
    } finally {
      setIsLoadingList(false);
    }
  }

  useEffect(() => {
    void loadReminders();
  }, []);

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateForm(form);
    if (validationErrors) {
      setErrors(validationErrors);
      setSubmission({ status: "idle" });
      return;
    }

    setSubmission({ status: "submitting" });

    try {
      const payload = {
        policyNumber: form.policyNumber.trim(),
        customerName: form.customerName.trim(),
        customerEmail: form.customerEmail.trim(),
        contactPhone: form.contactPhone.trim() || undefined,
        expiryDate: form.expiryDate,
        leadTimes: parseLeadTimes(form.leadTimes),
      };

      const response = await fetch("/api/renewals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.status === 400) {
        const data = await response.json();
        setErrors(data.errors ?? {});
        setSubmission({ status: "error", message: data.message ?? "Validation failed." });
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to schedule renewal reminder.");
      }

      setSubmission({ status: "success" });
      setForm(initialForm);
      setErrors({});
      await loadReminders();
    } catch (error) {
      setSubmission({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while scheduling the reminder.",
      });
    }
  }

  return (
    <div className="min-h-screen bg-zinc-100 py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6">
        <header className="space-y-3">
          <span className="inline-flex w-fit rounded-full border border-blue-200 bg-blue-50 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
            Policy Renewal Automation
          </span>
          <h1 className="text-4xl font-semibold text-zinc-900">Stay covered without the chase.</h1>
          <p className="max-w-3xl text-lg text-zinc-600">
            Schedule proactive reminders for policy renewals so your customers receive timely emails
            before their coverage lapses. Configure lead times to match your communication cadence and
            monitor upcoming reminders at a glance.
          </p>
        </header>

        <section className="grid gap-8 lg:grid-cols-[2fr,3fr]">
          <div className="rounded-3xl bg-white p-8 shadow-lg">
            <h2 className="text-xl font-semibold text-zinc-900">Schedule reminders</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Required fields are marked with *
            </p>

            {submission.status === "success" && (
              <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                Renewal reminders scheduled successfully.
              </div>
            )}

            {submission.status === "error" && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {submission.message}
              </div>
            )}

            <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-zinc-700" htmlFor="policyNumber">
                    Policy number *
                  </label>
                  <input
                    id="policyNumber"
                    name="policyNumber"
                    type="text"
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
                    value={form.policyNumber}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    required
                  />
                  {errors.policyNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.policyNumber}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700" htmlFor="customerName">
                    Customer name *
                  </label>
                  <input
                    id="customerName"
                    name="customerName"
                    type="text"
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
                    value={form.customerName}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    required
                  />
                  {errors.customerName && (
                    <p className="mt-1 text-sm text-red-600">{errors.customerName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700" htmlFor="customerEmail">
                    Customer email *
                  </label>
                  <input
                    id="customerEmail"
                    name="customerEmail"
                    type="email"
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
                    value={form.customerEmail}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    required
                  />
                  {errors.customerEmail && (
                    <p className="mt-1 text-sm text-red-600">{errors.customerEmail}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700" htmlFor="contactPhone">
                    Contact phone
                  </label>
                  <input
                    id="contactPhone"
                    name="contactPhone"
                    type="tel"
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
                    value={form.contactPhone}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700" htmlFor="expiryDate">
                    Policy expiry date *
                  </label>
                  <input
                    id="expiryDate"
                    name="expiryDate"
                    type="date"
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
                    value={form.expiryDate}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    required
                  />
                  {errors.expiryDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.expiryDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700" htmlFor="leadTimes">
                    Reminder lead times (days before expiry)
                  </label>
                  <input
                    id="leadTimes"
                    name="leadTimes"
                    type="text"
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
                    value={form.leadTimes}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    placeholder="e.g. 30,14,7,2"
                  />
                  <p className="mt-1 text-xs text-zinc-500">
                    Enter comma-separated days; reminders scheduled in descending order. Defaults to 30,
                    14, 7, 2 days.
                  </p>
                  {errors.leadTimes && <p className="mt-1 text-sm text-red-600">{errors.leadTimes}</p>}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="reset"
                  className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900"
                  onClick={() => {
                    setForm(initialForm);
                    setErrors({});
                    setSubmission({ status: "idle" });
                  }}
                  disabled={isSubmitting}
                >
                  Clear
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-zinc-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Scheduling…" : "Schedule reminders"}
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-zinc-900">Upcoming reminders</h2>
                <button
                  type="button"
                  className="rounded-full border border-zinc-300 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-800"
                  onClick={() => void loadReminders()}
                  disabled={isLoadingList}
                >
                  {isLoadingList ? "Refreshing…" : "Refresh"}
                </button>
              </div>

              {listError && (
                <p className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {listError}
                </p>
              )}

              {!listError && nextUpcomingReminders.length === 0 && (
                <p className="mt-3 text-sm text-zinc-500">
                  No upcoming reminders yet. Schedule one to see it appear here.
                </p>
              )}

              <ul className="mt-4 space-y-3">
                {nextUpcomingReminders.map(({ record, reminder }) => (
                  <li
                    key={`${record.id}-${reminder.leadDays}`}
                    className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-zinc-900">
                          Policy {record.policyNumber}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {record.customerName} • {record.customerEmail}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-zinc-900">
                          {formatDate(reminder.scheduledFor, {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                        <p className="text-xs text-zinc-500">{reminder.leadDays} days before expiry</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-zinc-900">All scheduled reminders</h2>

              {reminders.length === 0 ? (
                <p className="mt-3 text-sm text-zinc-500">
                  No renewal schedules yet. Create one using the form above.
                </p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full divide-y divide-zinc-200 text-sm">
                    <thead className="bg-zinc-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-zinc-700">Policy</th>
                        <th className="px-4 py-3 text-left font-semibold text-zinc-700">Customer</th>
                        <th className="px-4 py-3 text-left font-semibold text-zinc-700">Expiry</th>
                        <th className="px-4 py-3 text-left font-semibold text-zinc-700">Lead times</th>
                        <th className="px-4 py-3 text-left font-semibold text-zinc-700">Reminder status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {reminders.map((record) => (
                        <tr key={record.id} className="bg-white">
                          <td className="px-4 py-3">
                            <div className="font-medium text-zinc-900">{record.policyNumber}</div>
                            <div className="text-xs text-zinc-500">Created {formatDate(record.createdAt)}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-zinc-900">{record.customerName}</div>
                            <div className="text-xs text-zinc-500">{record.customerEmail}</div>
                            {record.contactPhone && (
                              <div className="text-xs text-zinc-500">{record.contactPhone}</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-zinc-900">{formatDate(record.expiryDate)}</div>
                            <div className="text-xs text-zinc-500">
                              Expires in {Math.max(
                                0,
                                Math.round(
                                  (new Date(record.expiryDate).getTime() - Date.now()) /
                                    (1000 * 60 * 60 * 24)
                                )
                              )} days
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-zinc-900">Lead: {record.leadTimes.join(", ")} days</div>
                            <div className="mt-1 flex flex-wrap gap-2 text-xs text-zinc-500">
                              {record.reminders.map((reminder) => (
                                <span
                                  key={`${record.id}-date-${reminder.leadDays}`}
                                  className="rounded-full bg-zinc-100 px-2 py-0.5"
                                >
                                  {formatDate(reminder.scheduledFor, {
                                    day: "2-digit",
                                    month: "short",
                                  })}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              {record.reminders.map((reminder) => {
                                const statusColor =
                                  reminder.status === "sent"
                                    ? "bg-green-100 text-green-700"
                                    : reminder.status === "scheduled"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-zinc-100 text-zinc-500";

                                return (
                                  <span
                                    key={`${record.id}-status-${reminder.leadDays}`}
                                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${statusColor}`}
                                  >
                                    <span>{reminder.leadDays}d</span>
                                    <span>{reminder.status}</span>
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
