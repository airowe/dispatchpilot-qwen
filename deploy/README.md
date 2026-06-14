# Alibaba Deployment Runbook

This runbook turns DispatchPilot from demo mode into live Qwen/Alibaba mode.

## Prerequisites

- Alibaba Cloud account with Function Compute access.
- Qwen Cloud / Alibaba Model Studio API key.
- Serverless Devs or equivalent Alibaba Function Compute deployment tooling.
- Environment variables available locally:

```bash
export DASHSCOPE_API_KEY=...
export DASHSCOPE_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
export QWEN_MODEL=qwen-plus
```

## 1. Verify Qwen Cloud before deploy

From the project root:

```bash
npm run verify:qwen
```

Submit-ready output must include:

```json
{
  "qwenMode": "live"
}
```

If it returns `"simulated"`, the API key is missing or the Qwen call failed.

## 2. Deploy the API

Use `deploy/alibaba-function-compute.yaml` as the deployment source. Keep `DASHSCOPE_API_KEY` in Alibaba's secret/environment configuration, not in the repo.

After deployment, verify:

```bash
curl -s https://YOUR-ALIBABA-ENDPOINT/health
```

Expected:

```json
{
  "ok": true,
  "service": "dispatchpilot-api"
}
```

## 3. Verify the hosted app against live API

Use the GitHub Pages build with the deployed API URL:

```text
https://airowe.github.io/dispatchpilot-qwen/?api=https://YOUR-ALIBABA-ENDPOINT
```

Then run a packet from the app. The Qwen mode metric should show `live`.

## 4. Submission proof links

Use these in Devpost:

- Public repo: https://github.com/airowe/dispatchpilot-qwen
- Hosted demo: https://airowe.github.io/dispatchpilot-qwen/
- Live API demo URL: `https://airowe.github.io/dispatchpilot-qwen/?api=<alibaba-api-url>`
- Qwen client source: `api/src/qwenClient.ts`
- Alibaba deployment file: `deploy/alibaba-function-compute.yaml`
