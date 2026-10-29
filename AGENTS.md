# ResearchNotebook — Agent Guide

Paste a source, get a structured markdown note, edit it in place, then ask the agent to refine it. The UI Save button and the agent both write through `update-note` on the same row. Routes: `/` notebooks, `/n/:id` notebook workspace, `/settings` LLM connection, `/chat` full-page chat.

## Skills

Search with `rg --hidden --follow`; read the exact linked guide before deeper work. `.agents/skills/build-an-app/SKILL.md` — start here for vague requests to create a domain app. `.agents/skills/adding-a-feature/SKILL.md` — cross-area feature checklist. Data/integrations: `.agents/skills/actions/SKILL.md`, `.agents/skills/storing-data/SKILL.md`, `.agents/skills/security/SKILL.md`, `.agents/skills/secrets/SKILL.md`, `.agents/skills/sharing/SKILL.md`. UI: `.agents/skills/frontend-design/SKILL.md`, `.agents/skills/shadcn-ui/SKILL.md`, `.agents/skills/client-side-routing/SKILL.md`. Agent context/workflows: `.agents/skills/context-awareness/SKILL.md`, `.agents/skills/real-time-sync/SKILL.md`, `.agents/skills/reliable-mutations/SKILL.md`, `.agents/skills/performance/SKILL.md`, `.agents/skills/delegate-to-agent/SKILL.md`. Framework: `.agents/skills/agent-native-docs/SKILL.md`, `.agents/skills/agent-native-toolkit/SKILL.md`, `.agents/skills/customizing-agent-native/SKILL.md`.

Use local docs only (no web research): `pnpm action docs-search --query "<topic>"`, `pnpm action docs-search --slug "<slug>"`, `pnpm action docs-search --list`, `pnpm action source-search --query "<pattern>"`, `pnpm action source-search --path <path>`, or `pnpm action source-search --list`. For external-agent integrations, read `pnpm action docs-search --slug "external-agents"`.

## Core rules

- UI feedback: target 100 ms, never exceed 400 ms; acknowledge before network work.
- Normal app data must flow through actions. Keep actions deterministic and focused; use agent chat/AgentSidebar for AI work and follow-ups in the same thread. Keep structured state in SQL and large files in configured storage; persist references only.
- For external integrations, inspect the workspace/provider connection catalog first; reuse its scoped resolver. Never hardcode credentials, webhook URLs, or private/customer data.
- Never fabricate. Report failures and recover; verify writes by reading the row or screen. Navigation is in `<current-screen>`; use `view-screen` for fresh visible-record details.

For custom branding, keep `server/plugins/agent-native-email-branding.ts` aligned: `app.name` appears in transactional email and optional `app.logoUrl` must be an absolute HTTPS URL.

## ResearchNotebook domain

- `notebooks(id, topic)` → `sources(id, notebook_id, raw_text)` → `notes(id, notebook_id, source_id, draft_kind, content)`; seeded with two sample notebooks so the demo runs offline.
- `add-source` stores the source and drafts the note in one action. With no working LLM it writes a local draft from the first 300 characters (`draft_kind = "local"`); never fail the paste because the model is down.
- Note markdown shape: `## Summary`, `## Key points` bullets, `## Quote` with one verbatim sentence. Never invent facts or citations.
- Writes are only these actions; reject a free-text "write the note" shortcut and use `update-note` with the full markdown.
- `notebookId` is in application state on `/n/:id`; read the notebook before editing so ids and current content are real.

| Action | When |
| --- | --- |
| list-notebooks | find a notebook or its counts |
| get-notebook | read sources + notes before an edit |
| create-notebook | a new topic |
| add-source | paste source text, get a drafted note |
| update-note | replace one note's markdown (UI Save uses it too) |

LLM settings live in the `llm-config` settings row: provider (`builder`, `openai`, `anthropic`, `ollama`, `custom`), model, base URL, key. Env fallback: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`/`OPENAI_BASE_URL`, `OLLAMA_BASE_URL`. Never return the key from an action.

## Application state

- `navigation` describes the view and selected ids. Chat is `chat` at `/chat` and `/chat/<threadId>`; notebooks are `notebooks` at `/`; a notebook is `notebook` at `/n/<notebookId>` with `notebookId` set; settings is `settings`.
- Use `navigate` when supported and `view-screen` for a fresh read of visible details; basic navigation is already in `<current-screen>`.

## Building a domain app

Choose the primary workflow and route before editing. Add a domain route under `app/routes/` and set `app.homePath` in `server/plugins/agent-native-email-branding.ts` with `defineAppConfig`. The default Get started page lives at `/home`, and Chat stays at `/chat`; edit `app/routes/home.tsx` when replacing that page with a domain-specific home. Add a static link in `app/components/layout/Sidebar.tsx` before `ChatThreadsSection`; `Header.tsx` uses `APP_TITLE` elsewhere. Shared sidebar and AgentInspector remain.

Use `adding-a-feature` for functional parity and `frontend-design` for a user-facing screen. Keep feature guidance here; do not rewrite `README.md` or `DESIGN.md`. After all edits, run one typecheck, one doctor check, and one browser smoke of the primary workflow, including overlap rejection, cancellation freeing the slot, and authenticated landing. Skip production build and extra test suites.

Before building common workspace or agent UI, read `agent-native-toolkit`; for supported customization, read `customizing-agent-native`.

- Guarded verification: run `pnpm agent-native:doctor`; fix findings before done.
