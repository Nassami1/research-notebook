import { getAgentEngineEntry, registerBuiltinEngines } from "@agent-native/core/agent/engine";
import { getSetting } from "@agent-native/core/settings";

export type LlmProvider = "builder" | "openai" | "anthropic" | "ollama" | "custom";

export const LLM_PROVIDERS: LlmProvider[] = [
  "builder",
  "openai",
  "anthropic",
  "ollama",
  "custom",
];

registerBuiltinEngines();

function engineDefault(engine: string, fallback: string): string {
  return getAgentEngineEntry(engine)?.defaultModel ?? fallback;
}

/**
 * Defaults come from the installed engines, not from a hand-written list, so a
 * fresh install proposes the model the framework actually ships. Custom
 * endpoints have no sensible default; the field starts empty.
 */
export const DEFAULT_MODELS: Record<LlmProvider, string> = {
  builder: engineDefault("builder", "claude-sonnet-5-5"),
  openai: engineDefault("ai-sdk:openai", "gpt-4o-mini"),
  anthropic: engineDefault("anthropic", "claude-3-5-sonnet-latest"),
  ollama: engineDefault("ai-sdk:ollama", "llama3.1"),
  custom: "",
};

export interface LlmConfig {
  provider: LlmProvider;
  model: string;
  baseUrl?: string;
  apiKey?: string;
}

const SETTING_KEY = "llm-config";

function isProvider(value: unknown): value is LlmProvider {
  return typeof value === "string" && LLM_PROVIDERS.includes(value as LlmProvider);
}

/** Only the connection saved in /settings. Env keys stay with the framework. */
export async function readLlmConfig(): Promise<LlmConfig | null> {
  const raw = await getSetting(SETTING_KEY);
  if (!raw || !isProvider(raw.provider)) return null;
  const baseUrl = typeof raw.baseUrl === "string" && raw.baseUrl.trim() ? raw.baseUrl.trim() : undefined;
  const apiKey = typeof raw.apiKey === "string" && raw.apiKey.trim() ? raw.apiKey.trim() : undefined;
  return {
    provider: raw.provider,
    model:
      typeof raw.model === "string" && raw.model.trim()
        ? raw.model.trim()
        : DEFAULT_MODELS[raw.provider],
    ...(baseUrl ? { baseUrl } : {}),
    ...(apiKey ? { apiKey } : {}),
  };
}

/**
 * Engine descriptor for completeText. The custom provider is OpenAI chat
 * completions at `{baseUrl}/chat/completions`, which is what the AI SDK's
 * OpenAI provider already does with a baseURL.
 */
export function engineFor(config: LlmConfig): string | { name: string; config: Record<string, unknown> } {
  switch (config.provider) {
    case "anthropic":
      return { name: "anthropic", config: { apiKey: config.apiKey } };
    case "ollama":
      return {
        name: "ai-sdk:ollama",
        config: { baseUrl: config.baseUrl || "http://localhost:11434" },
      };
    case "builder":
      return "builder";
    default:
      return {
        name: "ai-sdk:openai",
        config: { apiKey: config.apiKey, ...(config.baseUrl ? { baseUrl: config.baseUrl } : {}) },
      };
  }
}
