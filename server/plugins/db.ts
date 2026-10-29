import { runMigrations } from "@agent-native/core/db";

export default runMigrations(
  [
    {
      version: 1,
      name: "notebooks-sources-notes",
      sql: `
CREATE TABLE IF NOT EXISTS notebooks (
  id TEXT PRIMARY KEY,
  topic TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (now())
);
CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  notebook_id TEXT NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
  raw_text TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (now())
);
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  notebook_id TEXT NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
  source_id TEXT REFERENCES sources(id) ON DELETE SET NULL,
  draft_kind TEXT NOT NULL DEFAULT 'ai',
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (now()),
  updated_at TEXT NOT NULL DEFAULT (now())
);
CREATE INDEX IF NOT EXISTS sources_notebook_created_idx ON sources (notebook_id, created_at);
CREATE INDEX IF NOT EXISTS notes_notebook_created_idx ON notes (notebook_id, created_at);

INSERT INTO notebooks (id, topic, created_at) VALUES
  ('seed-sleep', 'Sleep and memory consolidation', '2026-10-26T09:00:00.000Z'),
  ('seed-heat', 'Urban heat islands and street trees', '2026-10-27T09:00:00.000Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO sources (id, notebook_id, raw_text, created_at) VALUES
  ('seed-src-sleep-1', 'seed-sleep', $seed$Participants who slept for eight hours after studying a list of 60 word pairs recalled about 15% more of the pairs after 24 hours than participants who stayed awake for the same period. The effect was strongest for pairs learned late in the session, and it disappeared when sleep was restricted to four hours.$seed$, '2026-10-26T09:00:01.000Z'),
  ('seed-src-sleep-2', 'seed-sleep', $seed$Slow-wave sleep appears to do the heavy lifting. During deep non-REM sleep the hippocampus replays newly encoded sequences in compressed bursts, and the prefrontal cortex gradually takes over the representation. Blocking this replay in rodents prevents the overnight gain, which is why researchers describe sleep as an active filing process rather than a passive pause.$seed$, '2026-10-26T09:02:00.000Z'),
  ('seed-src-heat-1', 'seed-heat', $seed$Street trees can lower afternoon surface temperatures by 2-4 degrees Celsius within 30 metres of their canopy, according to measurements across 120 city blocks. The cooling is unevenly distributed: neighbourhoods with fewer trees and more asphalt can be 5 degrees warmer than leafy ones a few blocks away. Shade matters more than transpiration during peak heat, and young trees need irrigation for their first two summers to survive.$seed$, '2026-10-27T09:00:01.000Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO notes (id, notebook_id, source_id, draft_kind, content, created_at, updated_at) VALUES
  ('seed-note-sleep-1', 'seed-sleep', 'seed-src-sleep-1', 'seed', $note$## Summary
Sleeping after study produced a modest but reliable recall gain: about 15% more word pairs after a 24-hour delay, compared with staying awake.

## Key points
- The benefit was largest for material learned late in the session.
- Four hours of sleep erased the advantage, so duration matters.
- A 24-hour test controls for simple fatigue at the moment of recall.

## Quote
> Participants who slept ... recalled about 15% more of the pairs after 24 hours than participants who stayed awake.$note$, '2026-10-26T09:00:02.000Z', '2026-10-26T09:00:02.000Z'),
  ('seed-note-sleep-2', 'seed-sleep', 'seed-src-sleep-2', 'seed', $note$## Summary
Deep sleep is active, not passive: the brain replays the day's sequences and gradually shifts them from the hippocampus to long-term cortical storage.

## Key points
- Slow-wave (deep non-REM) sleep carries most of the consolidation effect.
- Hippocampal replay happens in compressed bursts.
- The prefrontal cortex gradually takes over the memory trace.
- Blocking replay in rodents removes the overnight gain.

## Quote
> ... researchers describe sleep as an active filing process rather than a passive pause.$note$, '2026-10-26T09:02:01.000Z', '2026-10-26T09:02:01.000Z'),
  ('seed-note-heat-1', 'seed-heat', 'seed-src-heat-1', 'seed', $note$## Summary
Street trees cool streets unevenly: canopy coverage predicts afternoon heat better than the amount of green space drawn on a map.

## Key points
- 2-4 degrees cooler within 30 metres of canopy.
- Shade dominates during peak heat; transpiration matters less.
- Uneven canopy creates 5 degree gaps between neighbouring blocks.
- Young trees need two summers of irrigation to establish.

## Quote
> ... neighbourhoods with fewer trees and more asphalt can be 5 degrees warmer than leafy ones a few blocks away.$note$, '2026-10-27T09:00:02.000Z', '2026-10-27T09:00:02.000Z')
ON CONFLICT (id) DO NOTHING;
`,
    },
  ],
  { table: "research_notebook_migrations" },
);
