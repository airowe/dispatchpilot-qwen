export type RiskLevel = "low" | "medium" | "high" | "critical";

export type IncidentInput = {
  note: string;
  scenarioId?: string;
  reporterRole?: string;
  submittedAt?: string;
};

export type Scenario = {
  id: string;
  name: string;
  customer: string;
  note: string;
  site: string;
  serviceLevel: string;
  memory: string[];
  inventory: string[];
  crew: string[];
};

export type DispatchAction = {
  id: string;
  type: "assign" | "parts" | "customer_update" | "safety" | "follow_up";
  title: string;
  owner: string;
  eta: string;
  reason: string;
  approvalRequired: boolean;
  status: "queued" | "needs_approval" | "approved";
};

export type DispatchPacket = {
  id: string;
  createdAt: string;
  source: "local" | "api";
  qwenMode: "simulated" | "live";
  track: "Autopilot Agent";
  customer: string;
  site: string;
  risk: {
    level: RiskLevel;
    score: number;
    rationale: string;
  };
  assignment: {
    crewLead: string;
    arrivalWindow: string;
    dispatchReason: string;
  };
  customerUpdate: {
    channel: "sms" | "email";
    draft: string;
    approvalState: "needs_approval" | "approved";
  };
  actions: DispatchAction[];
  runbook: string[];
  memoryHits: string[];
  budgetEstimate: {
    qwenCalls: number;
    cloudNote: string;
  };
  auditTrail: string[];
};
