# 90-second demo

Record at 1440×900, dark theme, browser chrome hidden. One notebook is enough.

| Time | On screen | Say / do |
| --- | --- | --- |
| 0:00 | `/` | "Every research session starts as tabs. Paste a source, get a note you can actually edit." |
| 0:08 | `/n/seed-sleep` | Open the seeded "Sleep and memory consolidation" notebook. Point at sources on the left, drafts on the right. |
| 0:16 | paste box | Paste a paragraph. Press **Draft note**. While it spins: "One action stores the source *and* asks the model for the note." |
| 0:28 | new note | The structured draft appears: Summary, Key points, Quote. |
| 0:36 | editor | Change one line in the left textarea — e.g. reword a bullet. The preview updates as you type. Press **Save note**. |
| 0:46 | Save footer | "Saved — the agent reads this same row." Hold on that line. |
| 0:52 | agent rail | Open the agent, ask: "Expand the second bullet of the newest note with one more detail from its source." |
| 1:06 | note | The agent rewrites the markdown through `update-note`; the card updates without a refresh. |
| 1:16 | `/settings` | Show the five providers, the Custom base URL + key fields, and press **Test connection** — "Connected." |
| 1:26 | `/n/seed-sleep` | Press **Download .md** — "the whole notebook, sources and notes, leaves through a read action." |
| 1:32 | `/` | Close on the notebook list. "One data layer, two callers: the UI and the agent call the same actions." |

Reset before recording: delete `data/pglite`, restart `pnpm dev` to reseed, then set the model in `/settings`.
