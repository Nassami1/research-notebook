import { actionErrorMessage, useActionMutation } from "@agent-native/core/client/hooks";
import { IconAlertTriangle, IconCheck } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { NotePreview } from "./NotePreview";

export interface NoteRow {
  id: string;
  content: string;
  draftKind: string;
  sourceId: string | null;
  updatedAt: string;
}

function wordCount(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return words === 1 ? "1 word" : `${words} words`;
}

export function NoteCard({ note, index }: { note: NoteRow; index: number }) {
  const [value, setValue] = useState(note.content);
  const [justSaved, setJustSaved] = useState(false);
  const save = useActionMutation("update-note");
  const dirty = value !== note.content;
  const valueRef = useRef(value);
  const serverRef = useRef(note.content);
  valueRef.current = value;

  // An agent write lands here as new content. Apply it only when the user has
  // no unsaved text, so a concurrent edit is never overwritten.
  useEffect(() => {
    const wasClean = valueRef.current === serverRef.current;
    serverRef.current = note.content;
    if (wasClean) setValue(note.content);
  }, [note.content]);

  useEffect(() => {
    if (!justSaved) return;
    const timer = window.setTimeout(() => setJustSaved(false), 2000);
    return () => window.clearTimeout(timer);
  }, [justSaved]);

  function onSave() {
    save.mutate(
      { noteId: note.id, content: value },
      { onSuccess: () => setJustSaved(true) },
    );
  }

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_1px_0_hsl(var(--border))]">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border/70 bg-muted/30 px-4 py-2.5">
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {note.sourceId ? "Drafted note" : "Merged note"}
        </span>
        {note.draftKind === "local" ? (
          <Badge
            variant="outline"
            className="border-amber-500/40 bg-amber-500/10 text-[11px] font-normal text-amber-600 dark:text-amber-300"
          >
            local draft — connect an LLM in /settings for AI drafting
          </Badge>
        ) : null}
        <span className="ms-auto text-[11px] text-muted-foreground">
          {wordCount(value)}
        </span>
      </header>

      <div className="grid md:grid-cols-2 md:divide-x md:divide-border/70">
        <div className="p-3">
          <Textarea
            aria-label={`Markdown for note ${index + 1}`}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            spellCheck={false}
            className="min-h-[280px] resize-y border-0 bg-transparent p-2 font-mono text-[13px] leading-relaxed shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="border-t border-border/70 p-5 md:border-t-0">
          <NotePreview content={value} />
        </div>
      </div>

      <footer className="flex items-center gap-3 border-t border-border/70 px-4 py-2.5">
        {save.error ? (
          <p className="flex items-center gap-1.5 text-xs text-destructive">
            <IconAlertTriangle className="size-3.5" />
            {actionErrorMessage(save.error) ?? "Could not save the note."}
          </p>
        ) : justSaved ? (
          <p className="flex items-center gap-1.5 text-xs text-[hsl(var(--brand))]">
            <IconCheck className="size-3.5" />
            Saved — the agent reads this same row.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            {dirty ? "Unsaved changes" : "Saved"}
          </p>
        )}
        <Button
          size="sm"
          variant={dirty ? "default" : "outline"}
          className="ms-auto"
          disabled={!dirty || save.isPending}
          onClick={onSave}
        >
          {save.isPending ? "Saving…" : "Save note"}
        </Button>
      </footer>
    </article>
  );
}
