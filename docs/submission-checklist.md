# Submission Checklist

- [x] Fresh project for Qwen Cloud AI Agent.
- [x] Track selected: Track 4, Autopilot Agent.
- [x] Public repo: https://github.com/airowe/dispatchpilot-qwen
- [x] MIT license.
- [x] Architecture diagram source.
- [x] Demo script.
- [x] Qwen Cloud code path.
- [x] Alibaba Cloud deployment proof file.
- [ ] Qwen Cloud account verified.
- [ ] Live `DASHSCOPE_API_KEY` run captured.
- [ ] API deployed to Alibaba Function Compute.
- [ ] Hosted app URL created.
- [ ] Public demo video under 3 minutes.
- [ ] Devpost draft filled and submitted.

## Readiness rule

Do not call this ready to submit until all four external gates are verified:

1. `npm run verify:qwen` returns `"qwenMode": "live"`.
2. `/health` responds from an Alibaba Cloud endpoint, not only localhost.
3. The hosted app URL loads and can generate a packet.
4. The Devpost draft has the public repo, architecture diagram, hosted URL, and public video.

## Devpost summary draft

DispatchPilot is a mobile Autopilot Agent for field-service teams. It turns messy incidents into dispatch packets with Qwen-powered risk triage, crew assignment, parts staging, customer updates, runbooks, memory hits, and human approval. The app is built with Expo/React Native, backed by a Node API designed for Alibaba Function Compute, and calls Qwen Cloud through Alibaba Model Studio's OpenAI-compatible chat endpoint.

## Testing instructions draft

1. Open the hosted app or run `npm run web`.
2. Select "Freezer emergency".
3. Tap "Run Autopilot".
4. Review the generated dispatch packet.
5. Approve the customer update and queued actions.
6. Inspect memory and audit trail sections.
