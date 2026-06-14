import { buildQwenPrompt, createDispatchPacket, extractJsonObject, mergeQwenPacket } from "../../src/lib/agentEngine";
import type { DispatchPacket, IncidentInput } from "../../src/lib/types";

type QwenChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export type QwenRunDiagnostics = {
  apiKeyVisible: boolean;
  baseUrl: string;
  model: string;
  liveAttempted: boolean;
  fallbackReason?: string;
  httpStatus?: number;
  httpStatusText?: string;
  errorPreview?: string;
};

export async function runQwenDispatchAgent(input: IncidentInput): Promise<DispatchPacket> {
  const { packet } = await runQwenDispatchAgentWithDiagnostics(input);
  return packet;
}

export async function runQwenDispatchAgentWithDiagnostics(
  input: IncidentInput
): Promise<{ packet: DispatchPacket; diagnostics: QwenRunDiagnostics }> {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  const baseUrl = process.env.DASHSCOPE_BASE_URL ?? "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
  const model = process.env.QWEN_MODEL ?? "qwen-flash-us";
  const diagnostics: QwenRunDiagnostics = {
    apiKeyVisible: Boolean(apiKey),
    baseUrl,
    model,
    liveAttempted: false
  };

  if (!apiKey) {
    return {
      packet: createDispatchPacket(input, { source: "api", qwenMode: "simulated" }),
      diagnostics: {
        ...diagnostics,
        fallbackReason: "DASHSCOPE_API_KEY is not visible to the Node process."
      }
    };
  }

  const prompt = buildQwenPrompt(input);

  try {
    diagnostics.liveAttempted = true;
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
      const errorPreview = await response.text();
      return {
        packet: createDispatchPacket(input, { source: "api", qwenMode: "simulated" }),
        diagnostics: {
          ...diagnostics,
          fallbackReason: "Qwen API returned a non-OK response.",
          httpStatus: response.status,
          httpStatusText: response.statusText,
          errorPreview: errorPreview.slice(0, 500)
        }
      };
    }

    const body = (await response.json()) as QwenChatResponse;
    const content = body.choices?.[0]?.message?.content ?? "";
    const rawPacket = extractJsonObject(content);
    return {
      packet: mergeQwenPacket(rawPacket, input, { source: "api" }),
      diagnostics
    };
  } catch (error) {
    return {
      packet: createDispatchPacket(input, { source: "api", qwenMode: "simulated" }),
      diagnostics: {
        ...diagnostics,
        fallbackReason: "Qwen API request threw before a response was parsed.",
        errorPreview: error instanceof Error ? error.message : String(error)
      }
    };
  }
}
