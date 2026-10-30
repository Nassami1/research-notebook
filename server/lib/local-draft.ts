/**
 * No model configured: still produce the same three-section shape the AI
 * draft uses, so the preview, the agent, and exports never see a second format.
 */
export function localDraft(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  const sentences =
    clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((sentence) => sentence.trim()).filter(Boolean) ??
    [];
  const first = sentences[0] ?? clean;
  const summary = clip(first, 140);

  let points = sentences.slice(1, 4).map((sentence) => clip(sentence, 120));
  if (points.length === 0) {
    points = clean
      .split(/;\s+|,\s+(?=[a-z])/)
      .map((part) => clip(part.trim(), 120))
      .filter((part) => part.length > 12)
      .slice(0, 3);
  }
  if (points.length === 0) points = [summary];

  return [
    "## Summary",
    summary,
    "",
    "## Key points",
    ...points.map((point) => `- ${point}`),
    "",
    "## Quote",
    `> ${first}`,
  ].join("\n");
}

function clip(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 3).trimEnd()}...`;
}
