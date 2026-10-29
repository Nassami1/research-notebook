import { defineAction, fail } from "@agent-native/core/action";
import { putSetting } from "@agent-native/core/settings";
import { z } from "zod";

import {
  DEFAULT_MODELS,
  LLM_PROVIDERS,
  readLlmConfig,
} from "../server/lib/llm.js";

function normalizeBaseUrl(value: string | undefined, required: boolean) {
  const trimmed = value?.trim();
  if (!trimmed) {
    if (required) fail("Base URL is required for this provider.", { errorCode: "invalid_base_url" });
    return undefined;
  }
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    fail("Base URL must be a full URL, e.g. https://my-proxy.example.com/v1.", {
      errorCode: "invalid_base_url",
    });
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    fail("Base URL must start with http:// or https://.", { errorCode: "invalid_base_url" });
  }
  return trimmed.replace(/\/+$/, "");
}

export default defineAction({
  description:
    "Save the LLM connection used for AI drafting. The key is stored server-side and never returned. An empty key keeps the saved key for the same provider.",
  schema: z.object({
    provider: z.enum(LLM_PROVIDERS as [string, ...string[]]).describe("builder | openai | anthropic | ollama | custom"),
    model: z.string().min(1).max(200).describe("Model name, free text"),
    baseUrl: z
      .string()
      .max(500)
      .optional()
      .describe("Ollama host or OpenAI-compatible base URL, e.g. https://api.deepseek.com/v1"),
    apiKey: z
      .string()
      .max(500)
      .optional()
      .describe("API key. Omit or send an empty string to keep the stored key."),
  }),
  run: async ({ provider, model, baseUrl, apiKey }) => {
    const saved = await readLlmConfig();
    const requiresUrl = provider === "custom" || provider === "ollama";
    const normalizedUrl = normalizeBaseUrl(baseUrl, requiresUrl);
    const existingKey = saved?.provider === provider ? saved.apiKey : undefined;
    const key = apiKey?.trim() || existingKey;
    await putSetting("llm-config", {
      provider,
      model: model.trim() || DEFAULT_MODELS[provider as keyof typeof DEFAULT_MODELS],
      ...(normalizedUrl ? { baseUrl: normalizedUrl } : {}),
      ...(key ? { apiKey: key } : {}),
    });
    return {
      provider,
      model,
      baseUrl: normalizedUrl ?? "",
      hasKey: Boolean(key),
    };
  },
});
