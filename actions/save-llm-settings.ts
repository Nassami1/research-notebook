import { defineAction, fail } from "@agent-native/core/action";
import { deleteAppSecret, writeAppSecret } from "@agent-native/core/secrets";
import { getRequestUserEmail } from "@agent-native/core/server";
import { putSetting } from "@agent-native/core/settings";
import { z } from "zod";

import { DEFAULT_MODELS, LLM_PROVIDERS, readLlmConfig } from "../server/lib/llm.js";

const ENGINE_FOR: Record<string, string> = {
  builder: "builder",
  openai: "ai-sdk:openai",
  anthropic: "anthropic",
  ollama: "ai-sdk:ollama",
  custom: "ai-sdk:openai",
};

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

/**
 * The agent chat reads the framework's workspace credential store, not our
 * settings row. Mirror the same connection there so one save powers drafting
 * and the agent. Best effort: a credential-store failure must not lose the
 * drafting config the user just saved.
 */
async function mirrorToAgentEngine(args: {
  provider: string;
  model: string;
  baseUrl?: string;
  key?: string;
}) {
  const email = getRequestUserEmail();
  if (!email) return;
  const scope = { scope: "user" as const, scopeId: email };
  const write = (key: string, value: string) => writeAppSecret({ key, value, ...scope });
  const remove = (key: string) => deleteAppSecret({ key, ...scope });
  try {
    if (args.provider === "openai" || args.provider === "custom") {
      if (args.key) await write("OPENAI_API_KEY", args.key);
      if (args.baseUrl) await write("OPENAI_BASE_URL", args.baseUrl);
      else await remove("OPENAI_BASE_URL");
    } else if (args.provider === "anthropic") {
      if (args.key) await write("ANTHROPIC_API_KEY", args.key);
    } else if (args.provider === "ollama") {
      if (args.baseUrl) await write("OLLAMA_BASE_URL", args.baseUrl);
    }
    // Legacy deployment-wide default: the chat's engine picker honours it when
    // no org/user-scoped row exists.
    await putSetting("agent-engine", {
      engine: ENGINE_FOR[args.provider],
      model: args.model,
    });
  } catch {
    // The drafting connection is already saved; the chat falls back to
    // detection or its own settings page.
  }
}

export default defineAction({
  description:
    "Save the LLM connection used for AI drafting and for the agent chat. The key is stored server-side and never returned. An empty key keeps the saved key for the same provider.",
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
    const resolvedModel =
      model.trim() || DEFAULT_MODELS[provider as keyof typeof DEFAULT_MODELS];
    await putSetting("llm-config", {
      provider,
      model: resolvedModel,
      ...(normalizedUrl ? { baseUrl: normalizedUrl } : {}),
      ...(key ? { apiKey: key } : {}),
    });
    await mirrorToAgentEngine({
      provider,
      model: resolvedModel,
      ...(normalizedUrl ? { baseUrl: normalizedUrl } : {}),
      ...(key ? { key } : {}),
    });
    return {
      provider,
      model: resolvedModel,
      baseUrl: normalizedUrl ?? "",
      hasKey: Boolean(key),
    };
  },
});
