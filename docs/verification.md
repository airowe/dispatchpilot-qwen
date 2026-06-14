# Verification

Last local verification: 2026-06-14

## Commands

```bash
npm run typecheck
npm run test
npm exec -- expo export -p web
npm run verify:hosted
npm run verify:qwen
```

## Current results

- TypeScript passes.
- Unit tests pass: 1 file, 4 tests.
- Expo web export succeeds.
- Hosted demo verification passes against https://airowe.github.io/dispatchpilot-qwen/.
- Hosted demo can generate a packet and approve the customer update at a 390px mobile viewport.
- Screenshot artifact: `docs/hosted-demo-check.png`.
- Demo screen recording exists: `docs/dispatchpilot-demo.webm`.
- Public screen recording asset returns 200: https://airowe.github.io/dispatchpilot-qwen/dispatchpilot-demo.webm.
- Public architecture PNG returns 200: https://airowe.github.io/dispatchpilot-qwen/architecture.png.
- `ffprobe` reports the screen recording as VP8 WebM, 1280x720, 4.32 seconds.
- `npm audit --audit-level=high` passes. Remaining reported advisories are moderate Expo transitive dependency issues whose available fix requires a breaking Expo 56 upgrade.
- `npm run verify:qwen` now sees `DASHSCOPE_API_KEY`, reaches Qwen, and returns `403 AllocationQuota.FreeTierOnly`.
- Tested model outcomes on the US endpoint:
  - `qwen-plus`: `403 AllocationQuota.FreeTierOnly`
  - `qwen-flash-us`: `403 AllocationQuota.FreeTierOnly`
  - `qwen3.6-flash`: `403 AllocationQuota.FreeTierOnly`
  - `qwen-turbo`: `404 model_not_found`
- The remaining live-Qwen blocker is console-side: activate hackathon credits or disable "use free tier only" with a strict spend cap.

## Submit-ready gates still open

- Live Qwen Cloud packet generation: `npm run verify:qwen` must return `"qwenMode": "live"`.
- Alibaba Function Compute endpoint: `/health` must respond from the deployed Alibaba URL.
- Public demo video under 3 minutes.
- Devpost draft and final submission.
