import { actionErrorMessage, useActionMutation, useActionQuery } from "@agent-native/core/client/hooks";
import { useSetPageTitle } from "@agent-native/toolkit/app-shell";
import { IconArrowRight, IconLoader2, IconPlus } from "@tabler/icons-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function meta() {
  return [{ title: "Notebooks — ResearchNotebook" }];
}

function count(value: number, noun: string) {
  return `${value} ${noun}${value === 1 ? "" : "s"}`;
}

function formatDay(value: string) {
  const date = new Date(value.replace(" ", "T").replace(/\+00$/, "+00:00"));
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function NotebooksPage() {
  useSetPageTitle("Notebooks");
  const navigate = useNavigate();
  const [topic, setTopic] = useState("");
  const notebooks = useActionQuery("list-notebooks", {});
  const create = useActionMutation("create-notebook");

  function onCreate(event: FormEvent) {
    event.preventDefault();
    const value = topic.trim();
    if (!value || create.isPending) return;
    create.mutate(
      { topic: value },
      {
        onSuccess: (result) => {
          setTopic("");
          navigate(`/n/${result.notebookId}`);
        },
      },
    );
  }

  const rows = notebooks.data?.notebooks ?? [];

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
      <section className="max-w-2xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[hsl(var(--brand))]">
          ResearchNotebook
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-[1.1] tracking-tight sm:text-5xl">
          Sources in. Notes out.
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Paste what you are reading. The agent drafts a structured note for each
          source. You edit the note in place, and the agent refines it on the next
          turn — both writing the same row.
        </p>
      </section>

      <form onSubmit={onCreate} className="mt-8 flex max-w-2xl flex-col gap-2 sm:flex-row">
        <input
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          aria-label="New notebook topic"
          placeholder="New notebook topic — e.g. “Ocean acidification”"
          maxLength={200}
          className="h-11 min-w-0 flex-1 rounded-lg border border-input bg-card px-3.5 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-[hsl(var(--brand))] focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand))]/20"
        />
        <Button type="submit" size="lg" className="h-11" disabled={!topic.trim() || create.isPending}>
          {create.isPending ? (
            <IconLoader2 className="size-4 motion-safe:animate-spin" />
          ) : (
            <IconPlus className="size-4" />
          )}
          Create notebook
        </Button>
      </form>
      {create.error ? (
        <p className="mt-2 text-xs text-destructive">
          {actionErrorMessage(create.error) ?? "Could not create the notebook."}
        </p>
      ) : null}

      <section className="mt-12">
        <div className="flex items-baseline justify-between border-b border-border pb-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Your notebooks
          </h2>
          {rows.length > 0 ? (
            <span className="font-mono text-[11px] text-muted-foreground">
              {rows.length} total
            </span>
          ) : null}
        </div>

        {notebooks.isLoading ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        ) : notebooks.error ? (
          <p className="mt-4 text-sm text-destructive">
            {actionErrorMessage(notebooks.error) ?? "Could not load notebooks."}
          </p>
        ) : rows.length === 0 ? (
          <p className="mt-4 max-w-lg text-sm text-muted-foreground">
            No notebooks yet. Create one above, then paste your first source.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {rows.map((notebook) => (
              <li key={notebook.id}>
                <Link
                  to={`/n/${notebook.id}`}
                  className="group flex h-full flex-col justify-between gap-6 rounded-xl border border-border bg-card p-5 transition-colors hover:border-[hsl(var(--brand))]/60 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand))]/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-serif text-xl leading-snug">{notebook.topic}</h3>
                    <IconArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-[hsl(var(--brand))]" />
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[11px] text-muted-foreground">
                    <span>{count(notebook.sourceCount, "source")}</span>
                    <span aria-hidden>·</span>
                    <span>{count(notebook.noteCount, "note")}</span>
                    <span className="ms-auto">{formatDay(notebook.createdAt)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
