import { actionErrorMessage, useActionMutation, useActionQuery } from "@agent-native/core/client/hooks";
import { useSetPageTitle } from "@agent-native/toolkit/app-shell";
import { IconArrowLeft, IconCheck, IconLoader2, IconPlugConnected, IconX } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type Provider = "builder" | "openai" | "anthropic" | "ollama" | "custom";

const PROVIDERS: {
  id: Provider;
  label: string;
  keyHint?: string;
  url?: { label: string; placeholder: string; optional?: boolean };
  note?: string;
}[] = [
  {
    id: "builder",
    label: "Builder.io",
    note: "Uses the Builder.io connection of this workspace (or BUILDER_PRIVATE_KEY in .env).",
  },
  {
    id: "openai",
    label: "OpenAI",
    keyHint: "sk-…",
  },
  {
    id: "anthropic",
    label: "Anthropic",
    keyHint: "sk-ant-…",
  },
  {
    id: "ollama",
    label: "Ollama (local)",
    url: { label: "Base URL", placeholder: "http://localhost:11434" },
    note: "No key needed. The model must already be pulled in Ollama.",
  },
  {
    id: "custom",
    label: "Custom (OpenAI-compatible)",
    keyHint: "API key",
    url: { label: "Base URL", placeholder: "https://my-proxy.example.com/v1" },
    note: "Calls POST {baseUrl}/chat/completions with Authorization: Bearer {key}. Works with DeepSeek, OpenRouter, Together, and local proxies.",
  },
];

export function meta() {
  return [{ title: "Settings — ResearchNotebook" }];
}

export default function SettingsRoute() {
  useSetPageTitle("Settings");
  const settings = useActionQuery("get-llm-settings", {});
  const save = useActionMutation("save-llm-settings");
  const test = useActionMutation("test-llm-connection");

  const [provider, setProvider] = useState<Provider>("openai");
  const [model, setModel] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current || !settings.data) return;
    initialized.current = true;
    setProvider(settings.data.provider as Provider);
    setModel(settings.data.model);
    setBaseUrl(settings.data.baseUrl);
  }, [settings.data]);

  const option = PROVIDERS.find((item) => item.id === provider) ?? PROVIDERS[1]!;
  const hasSavedKey = Boolean(settings.data?.hasKey) && settings.data?.provider === provider;

  function changeProvider(next: Provider) {
    setProvider(next);
    setModel(settings.data?.defaults?.[next] ?? "");
    setBaseUrl(next === "ollama" ? "http://localhost:11434" : "");
    setApiKey("");
    setStatus(null);
  }

  function onSave() {
    save.mutate(
      { provider, model, baseUrl, apiKey },
      {
        onSuccess: () => {
          setApiKey("");
          setStatus({ ok: true, message: "Saved. New drafts use this connection." });
        },
      },
    );
  }

  function onTest() {
    setStatus(null);
    test.mutate(
      { provider, model, baseUrl, apiKey },
      {
        onSuccess: (result) => setStatus({ ok: result.ok, message: result.message }),
        onError: (error) =>
          setStatus({ ok: false, message: actionErrorMessage(error) ?? "Test failed." }),
      },
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-10 sm:px-8 sm:py-14">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <IconArrowLeft className="size-3.5" />
        Notebooks
      </Link>

      <header className="mt-4 border-b border-border pb-6">
        <h1 className="font-serif text-3xl tracking-tight">LLM connection</h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
          One connection for both: drafting a note when you paste a source, and
          the agent that refines it. Without a working model the app still saves
          a local draft in the note shape.
        </p>
      </header>

      {settings.isLoading ? (
        <div className="mt-8 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          <div>
            <label htmlFor="provider" className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Provider
            </label>
            <select
              id="provider"
              value={provider}
              onChange={(event) => changeProvider(event.target.value as Provider)}
              className="mt-2 h-11 w-full rounded-lg border border-input bg-card px-3 text-sm shadow-sm outline-none focus-visible:border-[hsl(var(--brand))] focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand))]/20"
            >
              {PROVIDERS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            {option.note ? (
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{option.note}</p>
            ) : null}
          </div>

          {option.url ? (
            <div>
              <label htmlFor="base-url" className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                {option.url.label}
              </label>
              <input
                id="base-url"
                value={baseUrl}
                onChange={(event) => setBaseUrl(event.target.value)}
                placeholder={option.url.placeholder}
                spellCheck={false}
                className="mt-2 h-11 w-full rounded-lg border border-input bg-card px-3 font-mono text-[13px] shadow-sm outline-none placeholder:text-muted-foreground/60 focus-visible:border-[hsl(var(--brand))] focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand))]/20"
              />
            </div>
          ) : null}

          <div>
            <label htmlFor="model" className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Model name
            </label>
            <input
              id="model"
              value={model}
              onChange={(event) => setModel(event.target.value)}
              placeholder={provider === "custom" ? "e.g. deepseek-v4.1-flash" : undefined}
              spellCheck={false}
              className="mt-2 h-11 w-full rounded-lg border border-input bg-card px-3 font-mono text-[13px] shadow-sm outline-none focus-visible:border-[hsl(var(--brand))] focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand))]/20"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Free text. Any model the provider accepts.
            </p>
          </div>

          {provider !== "builder" ? (
            <div>
              <label htmlFor="api-key" className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                API key {provider === "ollama" ? "(optional)" : ""}
              </label>
              <input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder={hasSavedKey ? "•••••••• saved — leave empty to keep" : option.keyHint}
                autoComplete="off"
                spellCheck={false}
                className="mt-2 h-11 w-full rounded-lg border border-input bg-card px-3 font-mono text-[13px] shadow-sm outline-none placeholder:text-muted-foreground/60 focus-visible:border-[hsl(var(--brand))] focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand))]/20"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                Stored server-side and never sent to the browser again.
              </p>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button onClick={onSave} disabled={save.isPending || !model.trim()}>
              {save.isPending ? <IconLoader2 className="size-4 motion-safe:animate-spin" /> : null}
              Save
            </Button>
            <Button variant="outline" onClick={onTest} disabled={test.isPending || !model.trim()}>
              {test.isPending ? (
                <IconLoader2 className="size-4 motion-safe:animate-spin" />
              ) : (
                <IconPlugConnected className="size-4" />
              )}
              {test.isPending ? "Testing…" : "Test connection"}
            </Button>
            {save.error ? (
              <p className="text-xs text-destructive">
                {actionErrorMessage(save.error) ?? "Could not save."}
              </p>
            ) : null}
          </div>

          {status ? (
            <div
              role="status"
              className={
                status.ok
                  ? "flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300"
                  : "flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
              }
            >
              {status.ok ? (
                <IconCheck className="mt-0.5 size-3.5 shrink-0" />
              ) : (
                <IconX className="mt-0.5 size-3.5 shrink-0" />
              )}
              <span className="break-words">{status.message}</span>
            </div>
          ) : null}

          <div className="border-t border-border pt-5">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Deployment fallback
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              With no key saved here, the app reads <code className="font-mono">ANTHROPIC_API_KEY</code>,{" "}
              <code className="font-mono">OPENAI_API_KEY</code> (and{" "}
              <code className="font-mono">OPENAI_BASE_URL</code>), or{" "}
              <code className="font-mono">OLLAMA_BASE_URL</code> from <code className="font-mono">.env</code>.
              With neither, pasting a source still writes a local draft.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
