import { defineAction, fail } from "@agent-native/core/action";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db/index.js";

export default defineAction({
  description:
    "Read one notebook with its sources and its notes. Call this before editing a note so you know the note id and current content.",
  schema: z.object({
    notebookId: z.string().min(1).describe("Id of the notebook to read"),
  }),
  http: { method: "GET" },
  readOnly: true,
  run: async ({ notebookId }) => {
    const db = getDb();
    const [notebook] = await db
      .select()
      .from(schema.notebooks)
      .where(eq(schema.notebooks.id, notebookId))
      .limit(1);
    if (!notebook) {
      fail("Notebook not found.", { errorCode: "not_found", statusCode: 404 });
    }
    const sourceRows = await db
      .select()
      .from(schema.sources)
      .where(eq(schema.sources.notebookId, notebookId))
      .orderBy(asc(schema.sources.createdAt))
      .limit(200);
    const noteRows = await db
      .select()
      .from(schema.notes)
      .where(eq(schema.notes.notebookId, notebookId))
      .orderBy(asc(schema.notes.createdAt))
      .limit(200);
    return { notebook, sources: sourceRows, notes: noteRows };
  },
});
