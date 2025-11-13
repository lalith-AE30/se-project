export type Application = {
  id: string;
  applicantName: string;
  product: string;
  premium: number;
  submittedAt: string; // ISO
  status: "PENDING" | "APPROVED" | "REJECTED";
  assignedUnderwriterId: string;
  notes?: string;
};

// Simple in-memory store for demo. In real app, replace with DB.
const applications: Application[] = [
  {
    id: "APP-1001",
    applicantName: "Ayesha Sharma",
    product: "Term Life 1Cr",
    premium: 12450,
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    status: "PENDING",
    assignedUnderwriterId: "uw-101",
    notes: "Age 29, non-smoker",
  },
  {
    id: "APP-1002",
    applicantName: "Rohit Verma",
    product: "Health Plus",
    premium: 8650,
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    status: "PENDING",
    assignedUnderwriterId: "uw-102",
    notes: "Family floater",
  },
  {
    id: "APP-1003",
    applicantName: "Neha Gupta",
    product: "Auto Comprehensive",
    premium: 4300,
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    status: "PENDING",
    assignedUnderwriterId: "uw-101",
    notes: "New car, no claims",
  },
];

export function listAssignedApplications(underwriterId: string) {
  return applications.filter(
    (a) => a.assignedUnderwriterId === underwriterId && a.status === "PENDING"
  );
}

export function getApplication(appId: string) {
  return applications.find((a) => a.id === appId);
}

export function updateStatus(appId: string, status: Application["status"], notes?: string) {
  const app = applications.find((a) => a.id === appId);
  if (!app) return undefined;
  app.status = status;
  if (notes !== undefined) app.notes = notes;
  return app;
}

export function resetStoreForTests() {
  // no-op in this simple example; kept for possible unit tests
}
