# Q85a2, the builder's first run (round 0 hand-back)

NOT done: everything in the brief except its first task. This report stops at the first run, as the brief orders, because one case of the brief gives a result its own rule contradicts (case 23, `acc.title`). No source file under `src/` is changed (`diff -rq` of `src` against an untouched copy prints nothing). Items 1 to 13 are not done: no schema, no `core/json.ts` change, no `DESIGN.md` change, no allowlist line, no timing after the change, no `checks.sh`, no Verify 3 to 7. The full report is at /Users/axelfaes/workspace/research-hub/.agents/worktrees/Q85a2/tools/oculus/.scratch/migration/agents/reviews/Q85a2-report.md and is reproduced here.

## Open items (only what Axel must rule on; every report opens with this list verbatim and repeats it until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.

- Z138 (raised 2026-10-01 03:36, step X3d, its builder's open item A). Your ruling of 2026-09-25 says Seti's own table and colours, and X3d's round-0 ruling 4 draws them as `--seti-*` tokens set to `seti-ui`'s `ui-variables.less` values in every theme. Its premise that one set serves every theme is wrong: VS Code's Seti theme carries a `light` set (238 extension, 98 filename and 82 language entries; the default file icon `#d4d7d6` dark, `#bfc2c1` light), and on oculus's light panel Seti's own colours measure a contrast of 1.45 for white, 1.73 for yellow (every `.json`) and 2.13 for green (the builder's report, `agents/reviews/X3d-report.md`). (1) Keep Seti's colours in every theme. For: your ruling's words exactly. Against: icons on the light themes are hard to see, `.json` worst. (2) Copy VS Code's light values. For: what VS Code shows. Against: breaks the brief's rule that no VS Code hex is copied. (3) Keep Seti's values on the dark themes and set each `--seti-*` token on the light themes to a darker value derived from the same colour in `themes/derive.ts`, as other light tokens are derived. For: Seti's colours where they were made for, readable icons everywhere, no copied hex. Against: the light theme's icon colours are oculus's, not Seti's. Recommendation: (3). The lazy option is (1). What waits: only the light-theme colours of X3d's icons. X3d landed at 06:19 with Seti's colours in every theme, as (1) reads; a ruling of (3) or (2) is a change on top of it, folded into U2's fixes or the next step that touches `themes/`.

## The first run on the unchanged tree

Command: `npx vitest run tests/server/edit tests/routes/edit tests/server/sessions tests/server/transcripts` (26 files, the 12 test files below among them). Result: `Test Files 1 failed | 25 passed (26)`, `Tests 1 failed | 619 passed (620)`.

The one failure is the new-behaviour half of case 23, which is the failure the brief says the first run shows: `tests/server/sessions/stores/transcripts.test.ts:895`, "drops an entry with a field of the wrong type, and the scan folds from zero", `expect(loaded(f, text)).toStrictEqual({})` receives the entry kept (`"offset": "5"`, and `acc.aiTitle: 3`). Every other case (1 to 22, 24, 25, and the unchanged-answer half of 23) passes on the unchanged tree. The expected values of cases 17, 18 and the turns and usage cases were taken from the unchanged tree and are literals in the tests.

New cases are added at the end of existing files only; no existing case is edited; no test file is added.

| Test file | Cases | Lines |
| --- | --- | --- |
| `tests/routes/edit/write.test.ts` | 1 to 11 (bodies readers, 20-reader `__proto__` loop) | 891 |
| `tests/routes/edit/undo-removed.test.ts` | 16 | |
| `tests/server/edit/yaml-edit.test.ts` | 12 | |
| `tests/server/edit/feeds.test.ts` | 13 | |
| `tests/server/edit/writes-collection.test.ts` | 14, 15 | |
| `tests/server/sessions/stores/transcripts.test.ts` | 17, 23 | 900 |
| `tests/server/sessions/stores/turns.test.ts` | turns over wrong-type records | 431 |
| `tests/server/sessions/stores/codex.test.ts` | 18 | 762 |
| `tests/server/transcripts/usage.test.ts` | 19 | |
| `tests/server/sessions/overrides.test.ts` | 20 | |
| `tests/server/sessions/registry.test.ts` | 21 | |
| `tests/server/sessions/stores/customizations.test.ts` | 22 | |

## The timing baseline (item 13), unchanged tree

Script: `scratchpad/timing.mjs` (outside the tree), 50,000 records per transcript, five runs after a warm-up, output in `scratchpad/timing-before.txt`.

| Call | Mean | SD | Min | Max |
| --- | --- | --- | --- | --- |
| foldFrom + foldClaude | 71.6 ms | 5.7 | 66.1 | 81.5 |
| foldFrom + foldCodex | 36.2 ms | 5.9 | 31.7 | 47.6 |
| claudeUsage | 1.5 ms | 0.2 | 1.4 | 1.8 |
| codexUsage | 2.0 ms | 0.1 | 1.9 | 2.2 |
| readTurns claude | 88.5 ms | 5.9 | 80.2 | 96.7 |
| readTurns codex | 35.6 ms | 6.9 | 31.1 | 49.4 |

## What in the brief is wrong or impossible

1. Case 23 and item 8 contradict each other on `acc.title: 3`. Case 23 says an entry whose `acc.title` is `3` is "kept on the unchanged tree and dropped after the change". Item 8 says `cacheEntryShape` checks `acc` as "a map whose fields, each optional ..., have the types `Acc` declares (`record.ts:35`)". `Acc` (`src/lib/server/sessions/record.ts:35` to 60) has no `title` key (it has `aiTitle: string | null`), so under item 8's rule an entry with `acc.title: 3` is kept after the change as well. Evidence, from `scratchpad/cachecase.mjs` run against the untouched copy (`node cachecase.mjs scratchpad/orig/src`):

```
acc.title: 3     entries kept by loadCache: 1 | scan title: "go" | equals clean scan: true
offset: '5'      entries kept by loadCache: 1 | scan title: "go" | equals clean scan: false
acc.aiTitle: 3   entries kept by loadCache: 1 | scan title: 3 | equals clean scan: false
```

   The entry with `acc.title: 3` is kept today and gives the same scan as no cache, so it is not a changed answer; `offset: '5'` and `acc.aiTitle: 3` are. The test in `transcripts.test.ts` uses `offset: '5'` and `acc.aiTitle: 3`. Decision needed for the brief: case 23 names `acc.aiTitle` in place of `acc.title`, or item 8 is widened to refuse unknown keys (that would also drop entries with any extra key the unchanged tree keeps, which item 8 does not ask for). Recommendation: `acc.aiTitle`. The lazy option is to keep the sentence and let the builder pass it by testing something else.

2. The item 13 bound of 1.5 times the mean per function looks unattainable for `claudeUsage` and `codexUsage`. Baselines are 1.5 ms and 2.0 ms for 50,000 records. A zod parse of a nested usage record costs 18.7 to 29.6 ms per 50,000 records (`node scratchpad/zodbench.mjs`, three runs), against 0.8 to 2.3 ms for the hand code on the same records (same script). That is about ten times, not 1.5 times. The fold-level bound (71.6 and 36.2 ms) is not measured with schemas yet, so it is not verified. The brief's remedy ("one parse per record, schemas built once at module level") is already what the benchmark does. What would settle it: write the schemas and time them; if the bound is missed, the brief needs either a bound on `foldFrom` and the usage table's whole pass, or a reader that checks the fields it uses and keeps the per-field coercions by hand.

3. Cases 1 to 12 live in `@module-tag slow` files (`tests/routes/edit/write.test.ts:9`, `tests/server/edit/writes.test.ts:10`, `tests/server/edit/yaml-edit.test.ts:12`), which `npm test` leaves out. They ran above because the command names the files directly; `checks.sh` will not run them. Verify 4 or 5 should name them if the brief wants them gated.

4. `tests/server/sessions/stores/transcripts.test.ts` is at 900 lines, the tree check's limit (900 passes); any further case in it fails the size check.

5. Case 16 says `text: 't'`; lines of text `t` cannot form valid lines for the `lines put back` path, so the lines-put-back cases use `title: "A title"\n` and the value-written cases use the brief's offsets (1.5, -1, empty text, missing next). The cases hold the same rule.

6. A shared `mapShape` would live in `src/lib/server/core/json.ts`, because `src/lib/data/helpers/guards.ts` is outside the step's paths. `z.looseObject({})` accepts exactly what `isMap` accepts (probed in `scratchpad/probe1.mjs`).

7. Differences between zod and the unchanged readers found in probes (`scratchpad/probe1.mjs`, `probe2.mjs`), each of which the schemas must handle to keep every answer: `z.int()` refuses `2**60` (use `z.number().refine(Number.isInteger)`); `z.number()` refuses NaN and Infinity; `z.record` refuses a Date or Map and drops an own `__proto__` key; `z.object` reads inherited properties; `z.array(z.string())` refuses sparse arrays that `.every` accepts (no JSON or YAML source produces one); `z.unknown()` object keys are required; `z.custom` returns the input value itself, which keeps identity.

8. The `listOf` / `readCollection` loops in `edit/writes/` need a schema or a named exception for the Verify 3 grep. Not settled before the stop.

## DONE / NOT DONE

| Row | Status | Command |
| --- | --- | --- |
| First run of cases 1 to 25 on the unchanged tree | DONE | `npx vitest run` as above: 619 passed, 1 failed (case 23 new behaviour, as the brief expects) |
| Timing baseline of item 13 | DONE | `node scratchpad/timing.mjs`, `scratchpad/timing-before.txt` |
| Stop on a brief rule that gives a wrong result for a case | DONE | finding 1 above |
| Items 1 to 12 (schemas, `core/json.ts`, docs, allowlist) | NOT DONE | stopped at the first run |
| Item 13 after the change | NOT DONE | stopped at the first run |
| `npm run diagrams`, `checks.sh`, Verify 3 to 7 | NOT DONE | stopped at the first run |

## The 28 files

No source file is changed, so no schema is added, no check line moves and nothing stays with a reason yet. The 12 test files changed are in the table under the first run.

## Next

The brief needs a ruling on finding 1 (case 23's field name) and on finding 2 (the item 13 bound) before the schemas are written. Findings 3 to 8 are decided by the builder when the schemas are written and need no ruling.

Usage: claude-sonnet-5-5, 99,564 tokens, 98 tool uses, 22.0 min.
