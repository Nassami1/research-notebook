import { defineAction, fail } from "@agent-native/core/action";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db/index.js";

export default defineAction({
  description:
    "Export one notebook as markdown and JSON: the topic, every source, and every note. Read-only.",
  schema: z.object({
    notebookId: z.string().min(1).describe("Id of the notebook to export"),
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
      .limit(500);
    const noteRows = await db
      .select()
      .from(schema.notes)
      .where(eq(schema.notes.notebookId, notebookId))
      .orderBy(asc(schema.notes.createdAt))
      .limit(500);
    const sourceNumber = new Map(sourceRows.map((source, index) => [source.id, index + 1]));

    const sections = noteRows.map((note, index) => {
      const number = note.sourceId ? sourceNumber.get(note.sourceId) : undefined;
      const heading = number ? `## Source ${number}` : `## Note ${index + 1}`;
      const source = note.sourceId
        ? sourceRows.find((candidate) => candidate.id === note.sourceId)
        : undefined;
      return [
        heading,
        source ? `\n${source.rawText}\n` : "",
        note.content.trim(),
      ]
        .filter(Boolean)
        .join("\n");
    });

    const markdown = [`# ${notebook.topic}`, "", ...sections.flatMap((section) => [section, ""])]
      .join("\n")
      .trimEnd();

    return {
      markdown,
      json: {
        topic: notebook.topic,
        sources: sourceRows.map((source) => ({ id: source.id, rawText: source.rawText })),
        notes: noteRows.map((note) => ({
          id: note.id,
          sourceId: note.sourceId,
          draftKind: note.draftKind,
          content: note.content,
        })),
      },
    };
  },
});
