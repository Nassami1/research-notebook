export type NoteBlock =
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] }
  | { type: "quote"; text: string }
  | { type: "paragraph"; text: string };

/**
 * The agent drafts one fixed shape (## heading, - bullets, > quote), so the
 * preview only needs those four blocks. Anything else stays a paragraph.
 */
export function parseNoteMarkdown(markdown: string): NoteBlock[] {
  const blocks: NoteBlock[] = [];
  let list: string[] = [];
  let paragraph: string[] = [];

  const flushList = () => {
    if (list.length > 0) blocks.push({ type: "list", items: list });
    list = [];
  };
  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ type: "paragraph", text: paragraph.join(" ") });
    }
    paragraph = [];
  };
  const flushAll = () => {
    flushList();
    flushParagraph();
  };

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      flushAll();
      continue;
    }
    if (line.startsWith("## ")) {
      flushAll();
      blocks.push({ type: "heading", text: line.slice(3).trim() });
    } else if (line.startsWith("- ")) {
      flushParagraph();
      list.push(line.slice(2).trim());
    } else if (line.startsWith("> ")) {
      flushAll();
      blocks.push({ type: "quote", text: line.slice(2).trim() });
    } else {
      flushList();
      paragraph.push(line);
    }
  }
  flushAll();
  return blocks;
}
