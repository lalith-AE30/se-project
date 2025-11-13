"use client";

import { FormEvent, useMemo, useState } from "react";

type ClaimFormState = {
  policyNumber: string;
  claimantName: string;
  claimantEmail: string;
  incidentDate: string;
  incidentTime: string;
  incidentLocation: string;
  claimType: string;
  description: string;
  additionalNotes: string;
};

type FieldErrors = Partial<Record<keyof ClaimFormState, string>> & {
  supportingDocuments?: string;
};

type SubmissionState =
  | { status: "idle" }
  | { status: "submitting"; progress: number }
  | { status: "success"; referenceId: string }
  | { status: "error"; message: string; reasons?: string[] };

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
];

const initialFormState: ClaimFormState = {
  policyNumber: "",
  claimantName: "",
  claimantEmail: "",
  incidentDate: "",
  incidentTime: "",
  incidentLocation: "",
  claimType: "",
  description: "",
  additionalNotes: "",
};

async function submitFormData(
  formData: FormData,
  onProgress: (progress: number) => void
): Promise<{ referenceId: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/claims");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error while submitting claim."));
    };

    xhr.onload = () => {
      try {
        const { status, responseText } = xhr;
        const data = responseText ? JSON.parse(responseText) : {};

        if (status >= 200 && status < 300) {
          resolve(data);
        } else {
          const error = new Error(data?.message ?? "Submission failed.");
          (error as any).response = { status, data };
          reject(error);
        }
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    };

    xhr.send(formData);
  });
}

function validateForm(
  form: ClaimFormState,
  files: File[]
): FieldErrors | null {
  const errors: FieldErrors = {};

  const requiredFields: (keyof ClaimFormState)[] = [
    "policyNumber",
    "claimantName",
    "claimantEmail",
    "incidentDate",
    "incidentTime",
    "incidentLocation",
    "claimType",
    "description",
  ];

  for (const field of requiredFields) {
    if (!form[field] || form[field].trim() === "") {
      errors[field] = "This field is required.";
    }
  }

  if (form.claimantEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.claimantEmail)) {
    errors.claimantEmail = "Enter a valid email address.";
  }

  const invalidTypes = files.filter((file) => !ALLOWED_FILE_TYPES.includes(file.type));
  const tooLarge = files.filter((file) => file.size > MAX_FILE_SIZE_BYTES);

  if (invalidTypes.length > 0 || tooLarge.length > 0) {
    const invalidNames = invalidTypes.map((file) => file.name).join(", ");
    const tooLargeNames = tooLarge.map((file) => file.name).join(", ");
    const messages = [] as string[];

    if (invalidNames) {
      messages.push(`Unsupported file types: ${invalidNames}.`);
    }
    if (tooLargeNames) {
      messages.push(`Files over 10MB: ${tooLargeNames}.`);
    }

    errors.supportingDocuments = messages.join(" ");
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

export default function ClaimSubmissionPage() {
  const [form, setForm] = useState<ClaimFormState>(initialFormState);
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submission, setSubmission] = useState<SubmissionState>({ status: "idle" });

  const isSubmitting = submission.status === "submitting";
  const progress = submission.status === "submitting" ? submission.progress : 0;

  const acceptedFileTypes = useMemo(
    () => ALLOWED_FILE_TYPES.map((type) => type.replace("image/", "image/*")).join(","),
    []
  );

  function handleInputChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files ? Array.from(event.target.files) : [];
    setFiles(selected);
    if (selected.length === 0) {
      setErrors((prev) => ({ ...prev, supportingDocuments: undefined }));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateForm(form, files);
    if (validationErrors) {
      setErrors(validationErrors);
      setSubmission({ status: "idle" });
      return;
    }

    const formData = new FormData();
    formData.append("policyNumber", form.policyNumber.trim());
    formData.append("claimantName", form.claimantName.trim());
    formData.append("claimantEmail", form.claimantEmail.trim());
    formData.append("incidentDate", form.incidentDate);
    formData.append("incidentTime", form.incidentTime);
    formData.append("incidentLocation", form.incidentLocation.trim());
    formData.append("claimType", form.claimType.trim());
    formData.append("description", form.description.trim());
    if (form.additionalNotes.trim()) {
      formData.append("additionalNotes", form.additionalNotes.trim());
    }

    files.forEach((file) => {
      formData.append("supportingDocuments", file);
    });

    setSubmission({ status: "submitting", progress: 0 });

    try {
      const result = await submitFormData(formData, (value) => {
        setSubmission((prev) =>
          prev.status === "submitting" ? { status: "submitting", progress: value } : prev
        );
      });

      setSubmission({ status: "success", referenceId: result.referenceId });
      setForm(initialFormState);
      setFiles([]);
      setErrors({});
    } catch (error) {
      const response = (error as any)?.response;
      if (response) {
        if (response.status === 400 && response.data?.errors) {
          setErrors(response.data.errors as FieldErrors);
          setSubmission({
            status: "error",
            message: response.data.message ?? "Validation failed.",
          });
          return;
        }

        if (response.status === 409) {
          setSubmission({
            status: "error",
            message: response.data?.message ?? "Claim is not eligible for submission.",
            reasons: Array.isArray(response.data?.reasons) ? response.data.reasons : undefined,
          });
          return;
        }
      }

      setSubmission({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while submitting the claim.",
      });
    }
  }

  return (
    <div className="min-h-screen bg-zinc-100 py-12">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-3xl font-semibold text-zinc-900">Claim Submission</h1>
        <p className="mt-2 text-zinc-600">
          Provide your claim details and attach any supporting documents. Fields marked with * are
          required.
        </p>

        {submission.status === "success" && (
          <div className="mt-6 rounded-lg border border-green-300 bg-green-50 p-4 text-green-800">
            <h2 className="text-lg font-semibold">Claim submitted successfully!</h2>
            <p className="mt-1 text-sm">
              Your reference ID is <span className="font-mono font-semibold">{submission.referenceId}</span>.
              Please keep it for your records.
            </p>
          </div>
        )}

        {submission.status === "error" && (
          <div className="mt-6 rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">
            <h2 className="text-lg font-semibold">Unable to submit claim</h2>
            <p className="mt-1 text-sm">{submission.message}</p>
            {submission.reasons && submission.reasons.length > 0 && (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                {submission.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          <section>
            <h2 className="text-xl font-semibold text-zinc-900">Policy &amp; Claim Details</h2>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-zinc-700" htmlFor="policyNumber">
                  Policy Number *
                </label>
                <input
                  id="policyNumber"
                  name="policyNumber"
                  type="text"
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
                  value={form.policyNumber}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  required
                />
                {errors.policyNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.policyNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700" htmlFor="claimType">
                  Claim Type *
                </label>
                <input
                  id="claimType"
                  name="claimType"
                  type="text"
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
                  value={form.claimType}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  required
                />
                {errors.claimType && <p className="mt-1 text-sm text-red-600">{errors.claimType}</p>}
              </div>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-zinc-700" htmlFor="incidentDate">
                  Incident Date *
                </label>
                <input
                  id="incidentDate"
                  name="incidentDate"
                  type="date"
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
                  value={form.incidentDate}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  required
                />
                {errors.incidentDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.incidentDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700" htmlFor="incidentTime">
                  Incident Time *
                </label>
                <input
                  id="incidentTime"
                  name="incidentTime"
                  type="time"
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
                  value={form.incidentTime}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  required
                />
                {errors.incidentTime && (
                  <p className="mt-1 text-sm text-red-600">{errors.incidentTime}</p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-zinc-700" htmlFor="incidentLocation">
                Incident Location *
              </label>
              <input
                id="incidentLocation"
                name="incidentLocation"
                type="text"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
                value={form.incidentLocation}
                onChange={handleInputChange}
                disabled={isSubmitting}
                required
              />
              {errors.incidentLocation && (
                <p className="mt-1 text-sm text-red-600">{errors.incidentLocation}</p>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900">Claimant Information</h2>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-zinc-700" htmlFor="claimantName">
                  Full Name *
                </label>
                <input
                  id="claimantName"
                  name="claimantName"
                  type="text"
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
                  value={form.claimantName}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  required
                />
                {errors.claimantName && (
                  <p className="mt-1 text-sm text-red-600">{errors.claimantName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700" htmlFor="claimantEmail">
                  Email Address *
                </label>
                <input
                  id="claimantEmail"
                  name="claimantEmail"
                  type="email"
                  autoComplete="email"
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
                  value={form.claimantEmail}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  required
                />
                {errors.claimantEmail && (
                  <p className="mt-1 text-sm text-red-600">{errors.claimantEmail}</p>
                )}
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900">Description</h2>
            <div className="mt-4">
              <label className="block text-sm font-medium text-zinc-700" htmlFor="description">
                Describe the incident *
              </label>
              <textarea
                id="description"
                name="description"
                rows={5}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
                value={form.description}
                onChange={handleInputChange}
                disabled={isSubmitting}
                required
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-zinc-700" htmlFor="additionalNotes">
                Additional Notes (optional)
              </label>
              <textarea
                id="additionalNotes"
                name="additionalNotes"
                rows={4}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
                value={form.additionalNotes}
                onChange={handleInputChange}
                disabled={isSubmitting}
              />
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900">Supporting Documents</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Upload images or PDF files (up to 10MB each). You can select multiple files.
            </p>
            <div className="mt-3">
              <label
                htmlFor="supportingDocuments"
                className="block text-sm font-medium text-zinc-700"
              >
                Upload files
              </label>
              <input
                id="supportingDocuments"
                name="supportingDocuments"
                type="file"
                multiple
                accept="application/pdf,image/*"
                className="mt-1 block w-full text-sm text-zinc-700 file:mr-4 file:rounded-full file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-zinc-800"
                disabled={isSubmitting}
                onChange={handleFileChange}
              />
              {errors.supportingDocuments && (
                <p className="mt-1 text-sm text-red-600">{errors.supportingDocuments}</p>
              )}

              {files.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm text-zinc-600">
                  {files.map((file) => (
                    <li key={file.name}>
                      {file.name} ({Math.round(file.size / 1024)} KB)
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {isSubmitting && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm font-medium text-blue-800">Uploading documents…</p>
              <div className="mt-2 h-3 w-full rounded-full bg-blue-100">
                <div
                  className="h-3 rounded-full bg-blue-600 transition-all"
                  style={{ width: `${progress}%` }}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress}
                  role="progressbar"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-4">
            <button
              type="reset"
              className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900"
              onClick={() => {
                setForm(initialFormState);
                setFiles([]);
                setErrors({});
                setSubmission({ status: "idle" });
              }}
              disabled={isSubmitting}
            >
              Clear form
            </button>
            <button
              type="submit"
              className="rounded-full bg-zinc-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting…" : "Submit claim"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
