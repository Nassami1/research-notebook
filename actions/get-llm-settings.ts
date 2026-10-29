import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import {
  DEFAULT_MODELS,
  LLM_PROVIDERS,
  readLlmConfig,
} from "../server/lib/llm.js";

export default defineAction({
  description:
    "Read the saved LLM connection: provider, model, base URL, and whether a key is stored. Never returns the key itself.",
  schema: z.object({}),
  http: { method: "GET" },
  readOnly: true,
  run: async () => {
    const saved = await readLlmConfig();
    const provider = saved?.provider ?? "openai";
    return {
      provider,
      model: saved?.model ?? DEFAULT_MODELS[provider],
      baseUrl: saved?.baseUrl ?? "",
      hasKey: Boolean(saved?.apiKey),
      source: saved ? "settings" : "none",
      providers: LLM_PROVIDERS,
      defaults: DEFAULT_MODELS,
    };
  },
});
