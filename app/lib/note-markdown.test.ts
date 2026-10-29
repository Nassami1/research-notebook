import { describe, expect, it } from "vitest";

import { parseNoteMarkdown } from "./note-markdown";

describe("parseNoteMarkdown", () => {
  it("parses the agent's summary / points / quote shape", () => {
    const blocks = parseNoteMarkdown(
      [
        "## Summary",
        "Sleep helps recall.",
        "",
        "## Key points",
        "- Faster for late material.",
        "- Four hours erases the gain.",
        "",
        "## Quote",
        "> Sleep is an active filing process.",
      ].join("\n"),
    );
    expect(blocks).toEqual([
      { type: "heading", text: "Summary" },
      { type: "paragraph", text: "Sleep helps recall." },
      { type: "heading", text: "Key points" },
      { type: "list", items: ["Faster for late material.", "Four hours erases the gain."] },
      { type: "heading", text: "Quote" },
      { type: "quote", text: "Sleep is an active filing process." },
    ]);
  });

  it("keeps plain text and joins wrapped lines", () => {
    expect(parseNoteMarkdown("one\ntwo\n\nthree")).toEqual([
      { type: "paragraph", text: "one two" },
      { type: "paragraph", text: "three" },
    ]);
  });

  it("returns nothing for empty input", () => {
    expect(parseNoteMarkdown("  \n\n ")).toEqual([]);
  });
});
