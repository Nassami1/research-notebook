import { defineAction } from "@agent-native/core/action";
import { completeText } from "@agent-native/core/server";
import { z } from "zod";

import { DEFAULT_MODELS, engineFor, readLlmConfig, type LlmConfig } from "../server/lib/llm.js";

export default defineAction({
  description:
    "Send one minimal chat request with the given provider settings and report success or the provider's error. Does not save anything.",
  schema: z.object({
    provider: z
      .enum(["builder", "openai", "anthropic", "ollama", "custom"])
      .describe("builder | openai | anthropic | ollama | custom"),
    model: z.string().min(1).max(200).describe("Model name to test"),
    baseUrl: z.string().max(500).optional().describe("Ollama host or OpenAI-compatible base URL"),
    apiKey: z
      .string()
      .max(500)
      .optional()
      .describe("Key to test. When empty, the saved key for the same provider is used."),
  }),
  run: async ({ provider, model, baseUrl, apiKey }) => {
    const saved = await readLlmConfig();
    const key = apiKey?.trim() || (saved?.provider === provider ? saved.apiKey : undefined);
    const trimmedUrl = baseUrl?.trim();
    const config: LlmConfig = {
      provider,
      model,
      ...(trimmedUrl ? { baseUrl: trimmedUrl } : {}),
      ...(key ? { apiKey: key } : {}),
    };
    if (!key && provider !== "ollama" && provider !== "builder") {
      return { ok: false, message: "Add an API key first, then test." };
    }
    try {
      const result = await completeText({
        appId: "research-notebook",
        engine: engineFor(config),
        model: model || DEFAULT_MODELS[provider],
        systemPrompt: "You are checking that a connection works.",
        input: "Reply with the single word: ok",
        maxOutputTokens: 8,
        temperature: 0,
        timeoutMs: 20_000,
      });
      return {
        ok: true,
        message: `Connected. ${model} replied: ${result.text.trim().slice(0, 40) || "(empty)"}`,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { ok: false, message: message.slice(0, 400) };
    }
  },
});
