# O94 round 0: the cases ruled

Rules: `agents/spec.md`, `agents/guarded.md` and the step's brief `agents/briefs/O94.md`, which stay in force except where this file says otherwise. The builder's hand-back of its first run raised two cases the brief got wrong. Both fixes stay inside the step's part, so the orchestrator rules them.

## Ruling A: case 7

The brief's case 7 cannot be reached. The next number is the highest `NN-` of every name in the folder plus one (`feeds.ts:329-333`), so no planted file can be named with that number without raising the highest number itself.

- Case 7 is dropped.
- The `post_exists` check stays as it is, with its catalog line. It guards a file made between the listing of the folder and the rename, and that file would otherwise be overwritten.
- No test row reaches it, and the report says so under the cases with this reason.
- The option that deletes the check was the lazy one, since it removes the guard against the race.

## Ruling B: a key line written twice

Item 1 replaces each `date` or `publish` line when a front matter holds two, and also reads the new front matter back with the `yaml` library. `yaml` 2.9.1 refuses a map with a key written twice (`parse('date: 2026-10-27\npublish: True\ndate: 2026-10-27\n')` throws `YAMLParseError`), so the two rules together would refuse every such file.

- The read-back parses with `parse(text, { uniqueKeys: false })`, so a front matter whose key is written twice reads back. Both lines then hold the day, so whichever value is read is right.
- One new row is added to the table: an idea whose front matter holds `date: 2025-02-12` twice and `publish: False`. Expected: renamed to the next number, both `date` lines read `date: 2026-10-27`, the `publish` line reads `publish: True`, the rest of the text unchanged, checked with `toBe` on the whole text.
- Its first run on the unchanged source is quoted in the report with the others.
- The option that leaves it as briefed was the lazy one, since it leaves the "each such line" rule with no effect.

## Paths

The brief's paths. Nothing is added.
