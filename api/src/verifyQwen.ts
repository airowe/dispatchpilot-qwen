import "dotenv/config";
import { runQwenDispatchAgentWithDiagnostics } from "./qwenClient";

const { packet, diagnostics } = await runQwenDispatchAgentWithDiagnostics({
  scenarioId: "freezer-emergency",
  note: "Walk-in freezer warming fast. Product loss starts soon. Need ETA and parts plan.",
  reporterRole: "submission-check"
});

const liveReady = packet.qwenMode === "live";

console.log(
  JSON.stringify(
    {
      ok: liveReady,
      id: packet.id,
      qwenMode: packet.qwenMode,
      liveReady,
      diagnostics,
      risk: packet.risk,
      actionCount: packet.actions.length,
      customer: packet.customer
    },
    null,
    2
  )
);

if (!liveReady) {
  process.exitCode = 1;
}
