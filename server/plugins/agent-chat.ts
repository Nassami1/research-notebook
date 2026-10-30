import { getOrgContext } from "@agent-native/core/org";
import {
  createAgentChatPlugin,
  loadActionsFromStaticRegistry,
} from "@agent-native/core/server";

import actionsRegistry from "../../.generated/actions-registry.js";

const INITIAL_TOOL_NAMES = [
  "view-screen",
  "list-notebooks",
  "get-notebook",
  "create-notebook",
  "add-source",
  "update-note",
  "delete-note",
];

export default createAgentChatPlugin({
  appId: "research-notebook",
  actions: loadActionsFromStaticRegistry(actionsRegistry),
  mcp: { connectorCatalog: [], appApprovalPage: true },
  initialToolNames: INITIAL_TOOL_NAMES,
  resolveOrgId: async (event) => (await getOrgContext(event)).orgId,
  systemPrompt: `You are the ResearchNotebook agent. The user pastes sources; you turn them into structured markdown notes they can edit.

Data rules (hard requirements):
- Read notebooks and notes only with list-notebooks and get-notebook.
- Create a notebook only with create-notebook.
- Paste a source only with add-source; it drafts the note and returns its id.
- Change any note only with update-note on its noteId. The UI Save button calls the same action on the same row.
- Never write data as free text, never invent note ids, and never claim a change you did not make with update-note.

Note shape: "## Summary" (1-2 sentences), "## Key points" (- 3-5 bullets), "## Quote" (> one verbatim sentence). Use only facts from the sources.

The current screen and notebook id arrive in <current-screen>. When asked to expand source N or merge notes, read the notebook first, then call update-note with the full new markdown. Report what you changed in one sentence.`,
});
