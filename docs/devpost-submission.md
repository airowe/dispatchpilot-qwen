# Devpost Submission Draft

## Project name

DispatchPilot

## Tagline

Qwen-powered mobile dispatch autopilot for field-service teams.

## Track

Track 4: Autopilot Agent

Secondary fit: Track 1, MemoryAgent.

## Links

- Public repo: https://github.com/airowe/dispatchpilot-qwen
- Hosted demo: https://airowe.github.io/dispatchpilot-qwen/
- Hosted demo with live API after deployment: `https://airowe.github.io/dispatchpilot-qwen/?api=<alibaba-api-url>`
- Architecture diagram: `docs/architecture.svg`
- Demo video: TODO

## Inspiration

Small field-service teams dispatch from phones under pressure. The notes are messy, the customer wants an ETA, the right technician and parts are not always obvious, and safety or customer communication mistakes are expensive. DispatchPilot turns that ambiguous moment into a structured dispatch packet.

## What it does

DispatchPilot takes a field-service incident note and produces a Qwen-powered dispatch plan:

- severity and rationale,
- best crew assignment,
- arrival window,
- parts checklist,
- customer update draft,
- safety and follow-up actions,
- customer/site memory hits,
- audit trail,
- human approval controls.

Customer-visible updates stay in a pending state until a manager approves them.

## How we built it

The app is an Expo / React Native mobile interface that also exports to web for judges. The backend is a Node/Express API designed for Alibaba Function Compute. The agent layer builds an operating-memory prompt and calls Qwen Cloud through Alibaba Model Studio's OpenAI-compatible chat completions endpoint. A deterministic fallback keeps the demo runnable without spending cloud credits, but the live path is isolated in `api/src/qwenClient.ts` and verified with `npm run verify:qwen`.

## How we used Qwen Cloud / Alibaba Cloud

- Qwen Cloud: `api/src/qwenClient.ts` sends the dispatch prompt to the Qwen chat completions API.
- Alibaba Function Compute: `deploy/alibaba-function-compute.yaml` defines the HTTP API deployment target.
- Live readiness command: `npm run verify:qwen`.

## What makes it an Autopilot Agent

DispatchPilot does not simply summarize the incident. It converts ambiguous input into operational decisions and proposed actions: assignment, ETA, parts staging, customer message, safety checks, and follow-up. It keeps human approval in the loop for customer-facing and safety-sensitive steps.

## Challenges

The main design challenge was keeping the agent bounded. Past hackathon work showed that an unbounded agent can wander. DispatchPilot preloads the context it needs, asks for one structured packet, validates the schema, and falls back safely if a live model call fails.

## Accomplishments

- Fresh Expo/React Native app.
- Typed dispatch packet schema.
- Node API with Qwen Cloud adapter.
- Deterministic fallback for low-cost testing.
- Hosted GitHub Pages demo.
- Browser verifier that confirms the hosted app generates a packet and approval flow on mobile width.
- Architecture diagram and submission checklist.

## What is next

- Verify live Qwen Cloud mode with `DASHSCOPE_API_KEY`.
- Deploy the API to Alibaba Function Compute.
- Record the final under-3-minute demo video.
- Add real integrations for SMS/customer updates, inventory, and technician schedules.
