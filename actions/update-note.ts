import { defineAction, fail } from "@agent-native/core/action";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db/index.js";

export default defineAction({
  description:
    "Replace a note's markdown content. The UI Save button and the agent both call this same action on the same note row.",
  schema: z.object({
    noteId: z.string().min(1).describe("Id of the note to update"),
    content: z
      .string()
      .min(1)
      .max(20000)
      .describe("Full markdown content of the note, replacing what is there"),
  }),
  run: async ({ noteId, content }) => {
    const db = getDb();
    const updated = await db
      .update(schema.notes)
      .set({ content, updatedAt: new Date().toISOString() })
      .where(eq(schema.notes.id, noteId))
      .returning({ noteId: schema.notes.id, content: schema.notes.content });
    const row = updated[0];
    if (!row) {
      fail("Note not found.", { errorCode: "not_found", statusCode: 404 });
    }
    return { noteId: row.noteId, content: row.content };
  },
});
