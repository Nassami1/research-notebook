import { randomUUID } from "node:crypto";

import { defineAction, fail } from "@agent-native/core/action";
import { completeText } from "@agent-native/core/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db/index.js";
import { engineFor, readLlmConfig } from "../server/lib/llm.js";
import { localDraft } from "../server/lib/local-draft.js";

const DRAFT_PROMPT = `You turn one pasted source into one structured research note.
Return markdown only, in exactly this shape:
## Summary
One or two sentences in your own words.

## Key points
- Three to five short bullets.

## Quote
> One short verbatim sentence copied from the source.

Use only facts in the source. Never invent numbers, names, or citations. Keep the whole note under 170 words.`;

export default defineAction({
  description:
    "Paste a source into a notebook. Drafts a structured markdown note from it, or a local first-300-chars draft when no LLM is configured. Returns the source id and the draft.",
  schema: z.object({
    notebookId: z.string().min(1).describe("Id returned by create-notebook"),
    text: z
      .string()
      .min(10)
      .max(20000)
      .describe("The pasted source text, at least 10 characters"),
  }),
  run: async ({ notebookId, text }) => {
    const db = getDb();
    const [notebook] = await db
      .select({ id: schema.notebooks.id, topic: schema.notebooks.topic })
      .from(schema.notebooks)
      .where(eq(schema.notebooks.id, notebookId))
      .limit(1);
    if (!notebook) {
      fail("Notebook not found.", { errorCode: "not_found", statusCode: 404 });
    }

    let draft: string;
    let draftKind: "ai" | "local";
    const llm = await readLlmConfig();
    try {
      const result = await completeText({
        appId: "research-notebook",
        // No saved connection: completeText still finds a deployment env key
        // (ANTHROPIC_API_KEY / OPENAI_API_KEY) and picks the engine itself.
        ...(llm ? { engine: engineFor(llm), model: llm.model } : {}),
        systemPrompt: DRAFT_PROMPT,
        input: `Notebook topic: ${notebook.topic}\n\nSource text:\n${text}`,
        maxOutputTokens: 450,
        temperature: 0.2,
        timeoutMs: 25_000,
      });
      const content = result.text.trim();
      if (!content) throw new Error("Empty draft");
      draft = content;
      draftKind = "ai";
    } catch {
      // No key, unreachable provider, or a bad response: keep the demo working.
      draft = localDraft(text);
      draftKind = "local";
    }

    const sourceId = randomUUID();
    const noteId = randomUUID();
    await db.transaction(async (tx) => {
      await tx.insert(schema.sources).values({ id: sourceId, notebookId, rawText: text });
      await tx.insert(schema.notes).values({
        id: noteId,
        notebookId,
        sourceId,
        draftKind,
        content: draft,
      });
    });

    return { sourceId, noteId, draft, mode: draftKind };
  },
});
