import { getScenario } from "./fixtures";
import type { DispatchAction, DispatchPacket, IncidentInput, RiskLevel, Scenario } from "./types";

const riskKeywords: Array<{ keyword: string; level: RiskLevel; score: number }> = [
  { keyword: "product loss", level: "critical", score: 94 },
  { keyword: "food", level: "critical", score: 92 },
  { keyword: "leak", level: "high", score: 84 },
  { keyword: "angry", level: "high", score: 81 },
  { keyword: "patients", level: "high", score: 80 },
  { keyword: "safety", level: "high", score: 79 },
  { keyword: "eta", level: "medium", score: 64 }
];

export function buildQwenPrompt(input: IncidentInput, scenario = getScenario(input.scenarioId)): string {
  return [
    "You are DispatchPilot, a Qwen-powered Autopilot Agent for field-service dispatch.",
    "Return compact JSON that matches this schema: risk, assignment, customerUpdate, actions, runbook, memoryHits, auditTrail.",
    "Use human-in-loop approvals for customer-visible or safety-critical actions.",
    "Do not invent completed work. Queue proposed actions and explain why each action matters.",
    "",
    `Incident note: ${input.note || scenario.note}`,
    `Reporter role: ${input.reporterRole ?? "dispatcher"}`,
    `Customer: ${scenario.customer}`,
    `Site: ${scenario.site}`,
    `Service level: ${scenario.serviceLevel}`,
    `Operating memory: ${scenario.memory.join(" | ")}`,
    `Available inventory: ${scenario.inventory.join(", ")}`,
    `Crew: ${scenario.crew.join(", ")}`
  ].join("\n");
}

export function createDispatchPacket(
  input: IncidentInput,
  options: { source?: DispatchPacket["source"]; qwenMode?: DispatchPacket["qwenMode"]; now?: Date } = {}
): DispatchPacket {
  const scenario = getScenario(input.scenarioId);
  const note = (input.note || scenario.note).trim();
  const risk = inferRisk(note);
  const crewLead = chooseCrewLead(scenario, note);
  const createdAt = (options.now ?? new Date()).toISOString();
  const id = `run_${stableId(`${scenario.id}:${note}:${createdAt.slice(0, 16)}`)}`;
  const customerUpdate = composeCustomerUpdate(scenario, risk.level, crewLead);
  const actions = createActions(scenario, risk.level, crewLead);

  return {
    id,
    createdAt,
    source: options.source ?? "local",
    qwenMode: options.qwenMode ?? "simulated",
    track: "Autopilot Agent",
    customer: scenario.customer,
    site: scenario.site,
    risk: {
      level: risk.level,
      score: risk.score,
      rationale: risk.rationale
    },
    assignment: {
      crewLead,
      arrivalWindow: risk.level === "critical" ? "25-35 minutes" : "45-60 minutes",
      dispatchReason:
        risk.level === "critical"
          ? "Revenue or safety exposure is immediate; dispatch senior lead and parts support together."
          : "Customer impact is time-bound; dispatch lead with a clear update cadence."
    },
    customerUpdate: {
      channel: "sms",
      draft: customerUpdate,
      approvalState: "needs_approval"
    },
    actions,
    runbook: [
      "Confirm site access and customer contact before rolling the truck.",
      "Have crew lead acknowledge the packet and parts list.",
      "Send the approved customer update with ETA and next checkpoint.",
      "Capture arrival photo, first diagnostic note, and any scope change.",
      "Close with customer-facing summary and follow-up owner."
    ],
    memoryHits: selectMemoryHits(scenario, note),
    budgetEstimate: {
      qwenCalls: 1,
      cloudNote: "One Qwen chat completion per dispatch packet; demo mode uses no paid cloud calls."
    },
    auditTrail: [
      "Incident normalized into dispatch context.",
      "Operating memory matched against customer, site, inventory, and crew constraints.",
      "Qwen Autopilot packet generated for human approval.",
      "Customer-visible actions held until manager approval."
    ]
  };
}

export function mergeQwenPacket(
  raw: unknown,
  input: IncidentInput,
  options: { source?: DispatchPacket["source"]; now?: Date } = {}
): DispatchPacket {
  const fallback = createDispatchPacket(input, {
    source: options.source ?? "api",
    qwenMode: "live",
    now: options.now
  });

  if (!isRecord(raw)) {
    return fallback;
  }

  return {
    ...fallback,
    risk: {
      ...fallback.risk,
      ...(isRecord(raw.risk) ? cleanRisk(raw.risk, fallback.risk) : {})
    },
    assignment: {
      ...fallback.assignment,
      ...(isRecord(raw.assignment) ? cleanAssignment(raw.assignment) : {})
    },
    customerUpdate: {
      ...fallback.customerUpdate,
      ...(isRecord(raw.customerUpdate) ? cleanCustomerUpdate(raw.customerUpdate) : {})
    },
    actions: Array.isArray(raw.actions) ? cleanActions(raw.actions, fallback.actions) : fallback.actions,
    runbook: cleanStringArray(raw.runbook, fallback.runbook),
    memoryHits: cleanStringArray(raw.memoryHits, fallback.memoryHits),
    auditTrail: cleanStringArray(raw.auditTrail, fallback.auditTrail)
  };
}

export function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) {
    return undefined;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) {
      return undefined;
    }
    try {
      return JSON.parse(match[0]);
    } catch {
      return undefined;
    }
  }
}

function inferRisk(note: string): { level: RiskLevel; score: number; rationale: string } {
  const normalized = note.toLowerCase();
  const match = riskKeywords.find((item) => normalized.includes(item.keyword));
  if (!match) {
    return {
      level: "medium",
      score: 58,
      rationale: "The incident needs coordination, but no immediate safety or revenue-loss keyword was found."
    };
  }

  return {
    level: match.level,
    score: match.score,
    rationale: `Matched "${match.keyword}" in the incident note, which raises dispatch urgency.`
  };
}

function chooseCrewLead(scenario: Scenario, note: string): string {
  const normalized = note.toLowerCase();
  if (normalized.includes("freezer") || normalized.includes("condenser")) {
    return scenario.crew.find((crew) => crew.includes("Maya")) ?? scenario.crew[0];
  }
  if (normalized.includes("leak") || normalized.includes("ceiling")) {
    return scenario.crew.find((crew) => crew.includes("Luis")) ?? scenario.crew[0];
  }
  return scenario.crew[0];
}

function composeCustomerUpdate(scenario: Scenario, level: RiskLevel, crewLead: string): string {
  const urgency = level === "critical" ? "priority emergency" : "priority service";
  return `${scenario.customer}: we have this logged as a ${urgency}. ${crewLead.split(" - ")[0]} is being assigned now with the recommended parts/checklist. Current ETA window is ${
    level === "critical" ? "25-35" : "45-60"
  } minutes, and we will send the next update after the first diagnostic checkpoint.`;
}

function createActions(scenario: Scenario, level: RiskLevel, crewLead: string): DispatchAction[] {
  const firstPart = scenario.inventory[0] ?? "standard diagnostic kit";
  const secondPart = scenario.inventory[1] ?? "backup kit";

  return [
    {
      id: "assign-lead",
      type: "assign",
      title: `Assign ${crewLead.split(" - ")[0]} as crew lead`,
      owner: "dispatcher",
      eta: "now",
      reason: "The lead matches the incident type and can own the customer-facing plan.",
      approvalRequired: false,
      status: "queued"
    },
    {
      id: "stage-parts",
      type: "parts",
      title: `Stage ${firstPart} and ${secondPart}`,
      owner: "parts desk",
      eta: level === "critical" ? "10 minutes" : "20 minutes",
      reason: "Staging likely parts before dispatch reduces a second truck roll.",
      approvalRequired: false,
      status: "queued"
    },
    {
      id: "send-customer-update",
      type: "customer_update",
      title: "Send customer ETA update",
      owner: "manager",
      eta: "after approval",
      reason: "Customer-visible communication should be approved before sending.",
      approvalRequired: true,
      status: "needs_approval"
    },
    {
      id: "safety-check",
      type: "safety",
      title: "Run site-specific safety checklist",
      owner: crewLead.split(" - ")[0],
      eta: "on arrival",
      reason: "The plan includes physical site work and needs an arrival safety gate.",
      approvalRequired: false,
      status: "queued"
    }
  ];
}

function selectMemoryHits(scenario: Scenario, note: string): string[] {
  const normalized = note.toLowerCase();
  const scored = scenario.memory.filter((memory) =>
    memory
      .toLowerCase()
      .split(/\W+/)
      .some((word) => word.length > 4 && normalized.includes(word))
  );
  return scored.length > 0 ? scored : scenario.memory.slice(0, 2);
}

function cleanRisk(raw: Record<string, unknown>, fallback: DispatchPacket["risk"]): DispatchPacket["risk"] {
  const level = typeof raw.level === "string" && isRiskLevel(raw.level) ? raw.level : fallback.level;
  const score = typeof raw.score === "number" && Number.isFinite(raw.score) ? Math.max(0, Math.min(100, raw.score)) : fallback.score;
  const rationale = typeof raw.rationale === "string" && raw.rationale.trim() ? raw.rationale.trim() : fallback.rationale;
  return { level, score, rationale };
}

function cleanAssignment(raw: Record<string, unknown>): Partial<DispatchPacket["assignment"]> {
  return {
    ...(typeof raw.crewLead === "string" ? { crewLead: raw.crewLead } : {}),
    ...(typeof raw.arrivalWindow === "string" ? { arrivalWindow: raw.arrivalWindow } : {}),
    ...(typeof raw.dispatchReason === "string" ? { dispatchReason: raw.dispatchReason } : {})
  };
}

function cleanCustomerUpdate(raw: Record<string, unknown>): Partial<DispatchPacket["customerUpdate"]> {
  return {
    ...(raw.channel === "sms" || raw.channel === "email" ? { channel: raw.channel } : {}),
    ...(typeof raw.draft === "string" ? { draft: raw.draft } : {}),
    ...(raw.approvalState === "approved" || raw.approvalState === "needs_approval" ? { approvalState: raw.approvalState } : {})
  };
}

function cleanActions(rawActions: unknown[], fallback: DispatchAction[]): DispatchAction[] {
  const actions = rawActions
    .filter(isRecord)
    .slice(0, 6)
    .map((raw, index) => ({
      id: typeof raw.id === "string" ? raw.id : `qwen-action-${index + 1}`,
      type: cleanActionType(raw.type),
      title: typeof raw.title === "string" && raw.title.trim() ? raw.title.trim() : fallback[index]?.title ?? "Review action",
      owner: typeof raw.owner === "string" && raw.owner.trim() ? raw.owner.trim() : fallback[index]?.owner ?? "dispatcher",
      eta: typeof raw.eta === "string" && raw.eta.trim() ? raw.eta.trim() : fallback[index]?.eta ?? "next checkpoint",
      reason: typeof raw.reason === "string" && raw.reason.trim() ? raw.reason.trim() : fallback[index]?.reason ?? "Qwen recommended this action.",
      approvalRequired: typeof raw.approvalRequired === "boolean" ? raw.approvalRequired : fallback[index]?.approvalRequired ?? true,
      status:
        raw.status === "approved" || raw.status === "queued" || raw.status === "needs_approval"
          ? raw.status
          : fallback[index]?.status ?? "needs_approval"
    }));

  return actions.length > 0 ? actions : fallback;
}

function cleanStringArray(raw: unknown, fallback: string[]): string[] {
  if (!Array.isArray(raw)) {
    return fallback;
  }
  const values = raw.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, 8);
  return values.length > 0 ? values : fallback;
}

function cleanActionType(raw: unknown): DispatchAction["type"] {
  if (raw === "assign" || raw === "parts" || raw === "customer_update" || raw === "safety" || raw === "follow_up") {
    return raw;
  }
  return "follow_up";
}

function isRiskLevel(value: string): value is RiskLevel {
  return value === "low" || value === "medium" || value === "high" || value === "critical";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stableId(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
