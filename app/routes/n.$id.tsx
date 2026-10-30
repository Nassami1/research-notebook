import { actionErrorMessage, callAction, useActionMutation, useActionQuery } from "@agent-native/core/client/hooks";
import { sendToAgentChat } from "@agent-native/toolkit/app/chat";
import { useSetPageTitle } from "@agent-native/toolkit/app-shell";
import {
  IconArrowLeft,
  IconDownload,
  IconLoader2,
  IconSend,
  IconSparkles,
} from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";

import { NoteCard } from "@/components/notes/NoteCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function meta() {
  return [{ title: "Notebook — ResearchNotebook" }];
}

function charLabel(length: number) {
  return `${length.toLocaleString("en-US")} chars`;
}

export default function NotebookPage() {
  const { id = "" } = useParams();
  const [sourceText, setSourceText] = useState("");
  const notebook = useActionQuery("get-notebook", { notebookId: id });
  const addSource = useActionMutation("add-source");
  useSetPageTitle(notebook.data?.notebook.topic ?? "Notebook");

  const noteBySource = useMemo(() => {
    const map = new Map<string, string>();
    for (const note of notebook.data?.notes ?? []) {
      if (note.sourceId) map.set(note.sourceId, note.id);
    }
    return map;
  }, [notebook.data?.notes]);

  function onAddSource() {
    const text = sourceText.trim();
    if (text.length < 10 || addSource.isPending) return;
    addSource.mutate(
      { notebookId: id, text },
      {
        onSuccess: (result) => {
          setSourceText("");
          if (result.mode === "local") {
            toast("Saved a local draft", {
              description: "Connect an LLM in Settings for structured AI drafting.",
            });
          }
        },
      },
    );
  }

  async function download(format: "md" | "json") {
    const result = await callAction("export-notebook", { notebookId: id }, { method: "GET" });
    const body =
      format === "md" ? result.markdown : JSON.stringify(result.json, null, 2);
    const blob = new Blob([body], {
      type: format === "md" ? "text/markdown;charset=utf-8" : "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${meta.topic.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "notebook"}.${format}`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function askAgentToMerge() {
    sendToAgentChat({
      message:
        "Merge the notes in this notebook into one summary note. Read the notebook first, then write the merged markdown with update-note on a note in this notebook — do not invent facts.",
      context: `Notebook id: ${id}\nTopic: ${notebook.data?.notebook.topic ?? ""}`,
      contextLabel: notebook.data?.notebook.topic ?? "Notebook",
      submit: true,
      openSidebar: true,
    });
  }

  if (notebook.isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-4 h-10 w-2/3" />
        <div className="mt-8 grid gap-8 lg:grid-cols-[340px_minmax(0,1fr)]">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (notebook.error || !notebook.data) {
    return (
      <div className="mx-auto w-full max-w-3xl px-5 py-16 text-center">
        <h1 className="font-serif text-2xl">This notebook could not be opened.</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {actionErrorMessage(notebook.error) ?? "It may have been deleted."}
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/">Back to notebooks</Link>
        </Button>
      </div>
    );
  }

  const { notebook: meta, sources, notes } = notebook.data;
  const pending = addSource.isPending;

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-16 pt-8 sm:px-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <IconArrowLeft className="size-3.5" />
        Notebooks
      </Link>

      <header className="mt-4 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="max-w-2xl font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
            {meta.topic}
          </h1>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            {sources.length} {sources.length === 1 ? "source" : "sources"} ·{" "}
            {notes.length} {notes.length === 1 ? "note" : "notes"} ·{" "}
            {pending ? "drafting…" : "agent + you, same rows"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void download("md")}>
            <IconDownload className="size-4" />
            Download .md
          </Button>
          <Button variant="outline" size="sm" onClick={() => void download("json")}>
            <IconDownload className="size-4" />
            Download .json
          </Button>
          <Button variant="outline" size="sm" onClick={askAgentToMerge}>
            <IconSparkles className="size-4" />
            Merge notes with the agent
          </Button>
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start">
        <aside className="space-y-5 lg:sticky lg:top-6">
          <section>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Sources
            </h2>
            {sources.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Nothing pasted yet.
              </p>
            ) : (
              <ol className="mt-3 space-y-2">
                {sources.map((source, index) => (
                  <li
                    key={source.id}
                    className="rounded-lg border border-border bg-card/60 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {noteBySource.has(source.id) ? (
                        <span className="size-1.5 rounded-full bg-[hsl(var(--brand))]" aria-hidden />
                      ) : null}
                      <span className="ms-auto font-mono text-[10px] text-muted-foreground">
                        {charLabel(source.rawText.length)}
                      </span>
                    </div>
                    <p className="mt-1.5 line-clamp-3 text-[13px] leading-relaxed text-foreground/80">
                      {source.rawText}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Paste a source
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              Only text you already have. No fetching, no search API.
            </p>
            <textarea
              value={sourceText}
              onChange={(event) => setSourceText(event.target.value)}
              rows={7}
              placeholder="Paste an article excerpt, abstract, or notes…"
              className="mt-3 w-full resize-y rounded-lg border border-input bg-background p-3 text-[13px] leading-relaxed outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-[hsl(var(--brand))] focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand))]/20"
            />
            <div className="mt-2 flex items-center gap-2">
              <span className="font-mono text-[10px] text-muted-foreground">
                {charLabel(sourceText.trim().length)}
              </span>
              <Button
                size="sm"
                className="ms-auto"
                disabled={sourceText.trim().length < 10 || pending}
                onClick={onAddSource}
              >
                {pending ? (
                  <IconLoader2 className="size-4 motion-safe:animate-spin" />
                ) : (
                  <IconSend className="size-4" />
                )}
                {pending ? "Drafting note…" : "Draft note"}
              </Button>
            </div>
            {addSource.error ? (
              <p className="mt-2 text-xs text-destructive">
                {actionErrorMessage(addSource.error) ?? "Could not add the source."}
              </p>
            ) : null}
          </section>
        </aside>

        <section className="min-w-0">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Notes
            </h2>
            <span className="font-mono text-[10px] text-muted-foreground">
              edit left · preview right
            </span>
          </div>

          <div className="mt-3 space-y-5">
            {pending ? (
              <div className="flex items-center gap-3 rounded-xl border border-dashed border-[hsl(var(--brand))]/40 bg-[hsl(var(--brand))]/5 p-4 text-sm text-muted-foreground">
                <IconLoader2 className="size-4 motion-safe:animate-spin text-[hsl(var(--brand))]" />
                Drafting a note from the pasted source…
              </div>
            ) : null}

            {notes.length === 0 && !pending ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <p className="font-serif text-lg">No notes yet.</p>
                <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
                  Paste a source on the left and the agent drafts the first note.
                </p>
              </div>
            ) : null}

            {notes.map((note, index) => (
              <NoteCard key={note.id} note={note} index={index} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
