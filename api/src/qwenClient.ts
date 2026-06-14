import { buildQwenPrompt, createDispatchPacket, extractJsonObject, mergeQwenPacket } from "../../src/lib/agentEngine";
import type { DispatchPacket, IncidentInput } from "../../src/lib/types";

type QwenChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export async function runQwenDispatchAgent(input: IncidentInput): Promise<DispatchPacket> {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    return createDispatchPacket(input, { source: "api", qwenMode: "simulated" });
  }

  const baseUrl = process.env.DASHSCOPE_BASE_URL ?? "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
  const model = process.env.QWEN_MODEL ?? "qwen-plus";
  const prompt = buildQwenPrompt(input);

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You convert messy field-service incidents into dispatch autopilot packets. Return only JSON. Keep every customer-visible action in needs_approval unless explicitly told it was approved."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2
      })
    });

    if (!response.ok) {
      return createDispatchPacket(input, { source: "api", qwenMode: "simulated" });
    }

    const body = (await response.json()) as QwenChatResponse;
    const content = body.choices?.[0]?.message?.content ?? "";
    const rawPacket = extractJsonObject(content);
    return mergeQwenPacket(rawPacket, input, { source: "api" });
  } catch {
    return createDispatchPacket(input, { source: "api", qwenMode: "simulated" });
  }
}
