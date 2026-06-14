# DispatchPilot

DispatchPilot is a mobile Autopilot Agent for the Global AI Hackathon Series with Qwen Cloud. It turns messy field-service incidents into approved dispatch packets: risk, crew assignment, parts checklist, customer update, runbook, memory hits, and audit trail.

Target track: **Track 4 - Autopilot Agent**  
Secondary angle: **Track 1 - MemoryAgent**

Public repo: https://github.com/airowe/dispatchpilot-qwen
Hosted demo: https://airowe.github.io/dispatchpilot-qwen/

## Why it fits the event

- Qwen Cloud is the model layer through Alibaba Cloud Model Studio's OpenAI-compatible chat API.
- Alibaba Cloud Function Compute is the planned backend deployment target.
- Expo / React Native gives judges a mobile operator surface on iOS, Android, and web.
- The workflow is human-in-loop: customer-visible and safety-critical actions stay queued until approved.
- Demo mode runs without cloud spend; live mode uses one Qwen call per dispatch packet.

## Run locally

```bash
npm install
npm run api
npm run web
```

Set `EXPO_PUBLIC_API_BASE_URL=http://localhost:8787` for the Expo app to call the local API. Without an API URL, the app runs its deterministic local demo packet.

## Live Qwen mode

Copy `.env.example` to `.env` and set:

```bash
DASHSCOPE_API_KEY=...
DASHSCOPE_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
QWEN_MODEL=qwen-plus
```

The API calls:

```text
POST /chat/completions
```

against the configured DashScope / Alibaba Cloud Model Studio base URL. If the key is missing or the API fails, DispatchPilot falls back to demo mode so judges can still inspect the workflow.

Verify the live path before submission:

```bash
npm run verify:qwen
```

The output must show `"qwenMode": "live"` before the project should be marked ready to submit. `"simulated"` is acceptable for local development only.

## API

- `GET /health`
- `GET /api/scenarios`
- `POST /api/agent/run`
- `GET /api/runs/:id`

Example:

```bash
curl -s http://localhost:8787/api/agent/run \
  -H "Content-Type: application/json" \
  -d '{"scenarioId":"freezer-emergency","note":"Walk-in freezer warming fast. Product loss starts soon. Need ETA."}'
```

## Submission assets

- Architecture: `docs/architecture.md`
- Demo script: `docs/demo-script.md`
- Submission checklist: `docs/submission-checklist.md`
- Verification log: `docs/verification.md`
- Alibaba Function Compute proof path: `deploy/alibaba-function-compute.yaml`
- Qwen client proof: `api/src/qwenClient.ts`

## Cost controls

- No background polling.
- No GPU services.
- One model call per packet in live mode.
- Deterministic demo mode for local development and video rehearsal.
- Server-side Qwen key only; no model key in the Expo app.

## External references

- Qwen / Alibaba Model Studio OpenAI-compatible chat endpoint: https://www.alibabacloud.com/help/en/model-studio/qwen-api-via-openai-chat-completions
- First Qwen API call guide: https://www.alibabacloud.com/help/en/model-studio/first-api-call-to-qwen
- Alibaba Function Compute HTTP trigger docs: https://www.alibabacloud.com/help/en/functioncompute/fc-2-0/user-guide/configure-an-http-trigger-that-invokes-a-function-with-http-requests
