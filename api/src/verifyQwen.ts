import "dotenv/config";
import { runQwenDispatchAgent } from "./qwenClient";

const packet = await runQwenDispatchAgent({
  scenarioId: "freezer-emergency",
  note: "Walk-in freezer warming fast. Product loss starts soon. Need ETA and parts plan.",
  reporterRole: "submission-check"
});

console.log(
  JSON.stringify(
    {
      ok: true,
      id: packet.id,
      qwenMode: packet.qwenMode,
      risk: packet.risk,
      actionCount: packet.actions.length,
      customer: packet.customer
    },
    null,
    2
  )
);
