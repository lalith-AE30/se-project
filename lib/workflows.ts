export type WorkflowStep = {
  id: string;
  name: string;
  type: "TASK" | "AUTOMATION" | "APPROVAL";
  assigneeRole?: "Agent" | "Underwriter" | "Operations" | "Claims" | "Billing" | "Admin";
};

export type WorkflowDef = {
  id: string;
  key: "ISSUANCE" | "RENEWAL" | "ENDORSEMENT" | "CLAIM" | string;
  name: string;
  active: boolean;
  steps: WorkflowStep[];
  version: number;
  updatedAt: string;
};

let seq = 10;
const now = () => new Date().toISOString();

const presets: WorkflowDef[] = [
  {
    id: "wf-issuance-1",
    key: "ISSUANCE",
    name: "Policy Issuance v1",
    active: true,
    version: 1,
    updatedAt: now(),
    steps: [
      { id: "s1", name: "KYC Check", type: "AUTOMATION" },
      { id: "s2", name: "Underwriter Review", type: "APPROVAL", assigneeRole: "Underwriter" },
      { id: "s3", name: "Policy Generation", type: "AUTOMATION" },
      { id: "s4", name: "Operations Issue Policy", type: "TASK", assigneeRole: "Operations" }
    ],
  },
  {
    id: "wf-renewal-1",
    key: "RENEWAL",
    name: "Renewal v1",
    active: true,
    version: 1,
    updatedAt: now(),
    steps: [
      { id: "s1", name: "Reminder Notification", type: "AUTOMATION" },
      { id: "s2", name: "Payment Processing", type: "AUTOMATION" },
      { id: "s3", name: "Underwriter Exception Review", type: "APPROVAL", assigneeRole: "Underwriter" }
    ],
  },
  {
    id: "wf-endorsement-1",
    key: "ENDORSEMENT",
    name: "Endorsement v1",
    active: true,
    version: 1,
    updatedAt: now(),
    steps: [
      { id: "s1", name: "Change Request Intake", type: "TASK", assigneeRole: "Agent" },
      { id: "s2", name: "Underwriter Approval", type: "APPROVAL", assigneeRole: "Underwriter" },
      { id: "s3", name: "Policy Update", type: "AUTOMATION" }
    ],
  },
  {
    id: "wf-claim-1",
    key: "CLAIM",
    name: "Claims v1",
    active: true,
    version: 1,
    updatedAt: now(),
    steps: [
      { id: "s1", name: "FNOL Capture", type: "TASK", assigneeRole: "Claims" },
      { id: "s2", name: "Coverage Validation", type: "AUTOMATION" },
      { id: "s3", name: "Fraud Check", type: "AUTOMATION" },
      { id: "s4", name: "Adjuster Approval", type: "APPROVAL", assigneeRole: "Claims" },
      { id: "s5", name: "Settlement", type: "AUTOMATION" }
    ],
  },
];

const workflows: WorkflowDef[] = [...presets];

export function listWorkflows() {
  return workflows;
}

export function createFromTemplate(key: WorkflowDef["key"], name?: string) {
  const base = presets.find((p) => p.key === key);
  if (!base) return undefined;
  const id = `wf-${++seq}`;
  const clone: WorkflowDef = {
    ...base,
    id,
    name: name || `${base.name.split(" v")[0]} v${base.version + 1}`,
    version: base.version + 1,
    updatedAt: now(),
    steps: base.steps.map((s, idx) => ({ ...s, id: `s${idx + 1}` })),
  };
  workflows.push(clone);
  return clone;
}

export function getWorkflow(id: string) {
  return workflows.find((w) => w.id === id);
}

export function updateWorkflow(id: string, patch: Partial<Pick<WorkflowDef, "name" | "active" | "steps">>) {
  const w = workflows.find((x) => x.id === id);
  if (!w) return undefined;
  if (patch.name !== undefined) w.name = patch.name;
  if (patch.active !== undefined) w.active = patch.active;
  if (patch.steps !== undefined) w.steps = patch.steps;
  w.version += 1;
  w.updatedAt = now();
  return w;
}

export function deleteWorkflow(id: string) {
  const idx = workflows.findIndex((w) => w.id === id);
  if (idx === -1) return false;
  workflows.splice(idx, 1);
  return true;
}
