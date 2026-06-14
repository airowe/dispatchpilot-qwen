# DispatchPilot Demo Script

Target length: 2:30 to 2:45.

## 0:00-0:20 - The problem

Show the mobile app with the "Freezer emergency" scenario selected. The incident note says the freezer is warming, product loss is close, a part may be needed, and the customer needs a real ETA.

## 0:20-0:55 - Run the autopilot

Tap **Run Autopilot**. Show the generated dispatch packet:

- critical risk score,
- assigned crew lead,
- arrival window,
- Qwen mode,
- customer update draft.

## 0:55-1:45 - Human-in-loop execution

Approve the customer update and two dispatch actions. Call out that the agent proposes actions but customer-visible communication waits for approval.

## 1:45-2:15 - Memory and audit

Show memory hits: customer update preference, dock access, emergency rate history. Show the audit trail and cost note: one Qwen call per packet, demo mode for development.

## 2:15-2:45 - Sponsor-tech proof

Show:

- `api/src/qwenClient.ts` for Qwen Cloud / DashScope,
- `deploy/alibaba-function-compute.yaml` for Alibaba Function Compute,
- `docs/architecture.md` for the architecture diagram.

Close on the outcome: a messy incident became a dispatch-ready plan on the manager's phone.
