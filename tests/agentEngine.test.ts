import { describe, expect, it } from "vitest";
import { buildQwenPrompt, createDispatchPacket, extractJsonObject, mergeQwenPacket } from "../src/lib/agentEngine";

describe("DispatchPilot agent engine", () => {
  it("creates a critical dispatch packet for urgent freezer incidents", () => {
    const packet = createDispatchPacket({
      scenarioId: "freezer-emergency",
      note: "Walk-in freezer has product loss risk and customer needs ETA now."
    });

    expect(packet.track).toBe("Autopilot Agent");
    expect(packet.risk.level).toBe("critical");
    expect(packet.actions.some((action) => action.approvalRequired)).toBe(true);
    expect(packet.customerUpdate.approvalState).toBe("needs_approval");
    expect(packet.budgetEstimate.qwenCalls).toBe(1);
  });

  it("builds a Qwen prompt with operating memory and inventory", () => {
    const prompt = buildQwenPrompt({
      scenarioId: "water-leak",
      note: "Leak above conference room B."
    });

    expect(prompt).toContain("DispatchPilot");
    expect(prompt).toContain("Operating memory");
    expect(prompt).toContain("Available inventory");
    expect(prompt).toContain("Return compact JSON");
  });

  it("extracts JSON from fenced or narrated model output", () => {
    const raw = extractJsonObject('Here is the packet:\n{"risk":{"level":"high","score":88,"rationale":"urgent"}}');

    expect(raw).toEqual({
      risk: {
        level: "high",
        score: 88,
        rationale: "urgent"
      }
    });
  });

  it("merges partial Qwen output into a complete packet", () => {
    const packet = mergeQwenPacket(
      {
        risk: { level: "high", score: 86, rationale: "tenant event at risk" },
        customerUpdate: { draft: "We are dispatching now.", approvalState: "needs_approval" },
        actions: [{ title: "Call building owner", owner: "manager", eta: "now", reason: "approval needed" }]
      },
      {
        scenarioId: "water-leak",
        note: "Ceiling leak above conference room."
      }
    );

    expect(packet.qwenMode).toBe("live");
    expect(packet.risk.score).toBe(86);
    expect(packet.actions[0].title).toBe("Call building owner");
    expect(packet.runbook.length).toBeGreaterThan(0);
  });
});
