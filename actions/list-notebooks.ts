import { defineAction } from "@agent-native/core/action";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db/index.js";

export default defineAction({
  description:
    "List notebooks with their source and note counts, newest first. Use it before adding a source when you need a notebook id.",
  schema: z.object({}),
  http: { method: "GET" },
  readOnly: true,
  run: async () => {
    const db = getDb();
    const rows = await db
      .select({
        id: schema.notebooks.id,
        topic: schema.notebooks.topic,
        createdAt: schema.notebooks.createdAt,
      })
      .from(schema.notebooks)
      .orderBy(desc(schema.notebooks.createdAt))
      .limit(100);
    const sources = await db
      .select({ notebookId: schema.sources.notebookId })
      .from(schema.sources);
    const notes = await db
      .select({ notebookId: schema.notes.notebookId })
      .from(schema.notes);
    const count = (items: { notebookId: string }[], id: string) =>
      items.filter((item) => item.notebookId === id).length;
    return {
      notebooks: rows.map((row) => ({
        ...row,
        sourceCount: count(sources, row.id),
        noteCount: count(notes, row.id),
      })),
    };
  },
});
