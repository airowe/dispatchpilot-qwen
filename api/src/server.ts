import cors from "cors";
import "dotenv/config";
import express from "express";
import { scenarios } from "../../src/lib/fixtures";
import type { DispatchPacket, IncidentInput } from "../../src/lib/types";
import { runQwenDispatchAgent } from "./qwenClient";

const app = express();
const runs = new Map<string, DispatchPacket>();
const port = Number(process.env.PORT ?? 8787);
const corsOrigin = process.env.CORS_ORIGIN ?? "*";

app.use(
  cors({
    origin: corsOrigin === "*" ? true : corsOrigin.split(",").map((origin) => origin.trim())
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_request, response) => {
  response.json({
    ok: true,
    service: "dispatchpilot-api",
    qwenMode: process.env.DASHSCOPE_API_KEY ? "live-ready" : "simulated",
    alibabaService: "Function Compute target; Qwen Cloud via DashScope OpenAI-compatible endpoint"
  });
});

app.get("/api/scenarios", (_request, response) => {
  response.json({ scenarios });
});

app.post("/api/agent/run", async (request, response) => {
  const input = normalizeIncidentInput(request.body);
  if (!input.note.trim()) {
    response.status(400).json({ error: "Incident note is required." });
    return;
  }

  const packet = await runQwenDispatchAgent(input);
  runs.set(packet.id, packet);
  response.json({ packet });
});

app.get("/api/runs/:id", (request, response) => {
  const packet = runs.get(request.params.id);
  if (!packet) {
    response.status(404).json({ error: "Run not found." });
    return;
  }
  response.json({ packet });
});

app.listen(port, () => {
  console.log(`DispatchPilot API listening on http://localhost:${port}`);
});

function normalizeIncidentInput(value: unknown): IncidentInput {
  const record = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  return {
    note: typeof record.note === "string" ? record.note : "",
    scenarioId: typeof record.scenarioId === "string" ? record.scenarioId : undefined,
    reporterRole: typeof record.reporterRole === "string" ? record.reporterRole : "dispatcher",
    submittedAt: new Date().toISOString()
  };
}
