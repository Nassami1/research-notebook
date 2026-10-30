import { describe, expect, it } from "vitest";

import { localDraft } from "./local-draft";

describe("localDraft", () => {
  it("builds Summary / Key points / Quote from a multi-sentence source", () => {
    const draft = localDraft(
      "Coffee raises alertness within 30 minutes. It also narrows blood vessels. Decaf has a smaller effect.",
    );
    expect(draft.startsWith("## Summary\n")).toBe(true);
    expect(draft).toContain("\n## Key points\n- It also narrows blood vessels.");
    expect(draft).toContain("\n## Quote\n> Coffee raises alertness within 30 minutes.");
  });

  it("still finds bullets when the source is one long sentence", () => {
    const draft = localDraft(
      "Street trees cool the air within thirty metres of their canopy, and shade matters more than transpiration at peak heat.",
    );
    expect(draft.split("\n- ").length).toBeGreaterThan(1);
    expect(draft).toContain("## Quote\n>");
  });

  it("clips a very long first sentence", () => {
    const draft = localDraft(`${"word ".repeat(80)}end.`);
    const summary = draft.split("\n")[1] ?? "";
    expect(summary.length).toBeLessThanOrEqual(140);
    expect(summary.endsWith("...")).toBe(true);
  });
});
