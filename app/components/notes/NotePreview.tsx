import { parseNoteMarkdown } from "@/lib/note-markdown";

/** Renders the fixed note shape the agent drafts, plus plain paragraphs. */
export function NotePreview({ content }: { content: string }) {
  const blocks = parseNoteMarkdown(content);
  if (blocks.length === 0) {
    return <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>;
  }
  return (
    <div className="note-preview space-y-4">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          return (
            <h3
              key={index}
              className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--brand))]"
            >
              {block.text}
            </h3>
          );
        }
        if (block.type === "list") {
          return (
            <ul key={index} className="space-y-1.5">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="flex gap-2 text-sm leading-relaxed">
                  <span aria-hidden className="mt-[7px] size-1 shrink-0 rounded-full bg-[hsl(var(--brand))]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          );
        }
        if (block.type === "quote") {
          return (
            <blockquote
              key={index}
              className="border-s-2 border-[hsl(var(--brand))]/50 ps-3 text-sm italic leading-relaxed text-muted-foreground"
            >
              {block.text}
            </blockquote>
          );
        }
        return (
          <p key={index} className="text-sm leading-relaxed">
            {block.text}
          </p>
        );
      })}
    </div>
  );
}
