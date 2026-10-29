import { randomUUID } from "node:crypto";

import { defineAction, fail } from "@agent-native/core/action";
import { z } from "zod";

import { getDb, schema } from "../server/db/index.js";

export default defineAction({
  description:
    "Create a research notebook for a topic. Returns the new notebook id.",
  schema: z.object({
    topic: z
      .string()
      .min(1)
      .max(200)
      .describe('What the notebook covers, e.g. "Sleep and memory consolidation"'),
  }),
  run: async ({ topic }) => {
    const trimmed = topic.trim();
    if (!trimmed) {
      fail("Topic is required.", { errorCode: "invalid_topic" });
    }
    const notebookId = randomUUID();
    await getDb().insert(schema.notebooks).values({ id: notebookId, topic: trimmed });
    return { notebookId };
  },
});
