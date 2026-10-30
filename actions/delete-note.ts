import { defineAction, fail } from "@agent-native/core/action";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db/index.js";

export default defineAction({
  description:
    "Delete one note by id. The pasted source is kept. Use it when the user asks to remove a draft.",
  schema: z.object({
    noteId: z.string().min(1).describe("Id of the note to delete"),
  }),
  run: async ({ noteId }) => {
    const deleted = await getDb()
      .delete(schema.notes)
      .where(eq(schema.notes.id, noteId))
      .returning({ id: schema.notes.id });
    if (!deleted[0]) {
      fail("Note not found.", { errorCode: "not_found", statusCode: 404 });
    }
    return { noteId };
  },
});
