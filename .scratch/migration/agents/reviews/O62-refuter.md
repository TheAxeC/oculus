# Refuter report: O62

## Verification

All commands were run from /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O62 with node v24.21.0. The load average was 12 to 14 throughout (`uptime`).

Verify 1, `npx vitest run tests/checks/config/config-folder.test.ts tests/checks/source/keys.test.ts --reporter=verbose`:
```
 <check mark> |unit| tests/checks/config/config-folder.test.ts > oculus's own config directory > holds exactly the expected top-level keys, and no more 379ms
 <multiplication sign> |unit| tests/checks/config/config-folder.test.ts > oculus's own config directory > names a glyph only where the source or another config file reads it 14393ms
 <check mark> |unit| tests/checks/source/keys.test.ts > catalog file keys > has a reader for every top-level key of every catalog file 1057ms
 <multiplication sign> |unit| tests/checks/config/config-folder.test.ts > oculus's own config directory > ships a drawing for every one of them 8187ms
 Test Files  1 failed | 1 passed (2)
      Tests  2 failed | 38 passed | 2 skipped (42)
```
The two failures are timeouts in cases the step does not reach. Rerunning `config-folder.test.ts` alone printed `Error: Test timed out in 5000ms.` at `tests/checks/config/config-folder.test.ts:446:5`. With `--testTimeout 0`, which is the flag `test:checks` uses:
```
 Test Files  1 passed (1)
      Tests  30 passed | 2 skipped (32)
```
`npx vitest run tests/checks/source/keys.test.ts --testTimeout 0 --reporter=verbose`:
```
 <check mark> |unit| tests/checks/source/keys.test.ts > catalog file keys > has a reader for every top-level key of every catalog file 249ms
      Tests  10 passed (10)
```

Verify 2:
- `npm run format` and `npm run diagrams` were not run because both write the tree (see "Declined to judge"). In their place:
  - `npx prettier --check` over the four changed files printed `All matched files use Prettier code style!` and exit 0.
  - `npx vitest run tests/checks/diagrams/diagrams.test.ts --testTimeout 0` printed `<check mark> ... the committed diagrams > are what the source gives now, each file byte for byte 9809ms`, and every case passed.
- `npm run test:quick` printed:
```
test:quick: 13 changed file(s), from git since HEAD
ok      svelte-kit sync (9.5 s)
ok      prettier (9.5 s): All matched files use Prettier code style!
ok      ASCII gate (11.0 s)
ok      vitest (41.7 s): Duration  26.59s ...
ok      eslint (46.3 s)
ok      svelte-check (50.7 s): ... 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
test:quick: 60.4 s (limit 45.0 s); every command passed
test:quick: over the time limit
exit 0
```

Verify 3 was not run in its own form, because it needs `npm run diagrams`. `git diff a2288789 --stat` lists eight changed files under `docs/diagrams/`: `layer-state.dot/.svg`, `layer-views.dot/.svg`, `layers.dot/.svg` and `writes.dot/.svg`. So Verify 3 cannot print nothing on this base (Spec S1).

Verify 4, the ASCII gate over the four files, printed nothing: `exit 0`.

Verify 5, the C1 grep in non-git form, `grep -rIn -i --exclude=local.yml --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.scratch --exclude-dir=.agents --exclude-dir=.svelte-kit 'archive_order\|archiveOrder\|archive order' .`, printed nothing: `exit 1`. The same grep over the base copy (`migration-O62-base`: src tests utils config) printed the three lines the brief names:
```
src/lib/data/shapes/catalog-files/vocab.ts:286:    archive_order: z
tests/checks/config/config-folder.test.ts:220:            'archive_order',
config/catalogs/vocab.yml:208:archive_order: [published, submitted, in-prep, abandoned, nogo, dropped, disproved, tech-report, software, finished, archived]
```

Verify 6: `sh utils/unused-exports.sh` printed `knip exit 0`. The `diff` against the base copy's `unused-exports.txt` printed nothing (`diff exit 0`), and the file has 342 lines.

Verify 7, `diff <base>/tests/checks/config/config-folder.test.ts tests/checks/config/config-folder.test.ts`:
```
220d219
<             'archive_order',
```

Verify 8: the report quotes both failing lines on the unchanged tree. Reproducing them needs the change reverted, so they are judged by reading (see "Declined to judge").

Other runs:
- `diff -rq` against the base copy over src tests utils config lists only the four files of the write list.
- `wc -l`: base 268/321/810/713, worktree 264/317/809/772. These match the report's table.
- `LC_ALL=C grep -n '[^ -~]'` over the report printed nothing: exit 1.
- The history-word grep over the added lines of tests, src and config printed nothing: exit 1.
- `grep -rln --exclude=local.yml 'archive_order' ~/workspace/research-hub/.oculus` printed nothing: exit 1.

## Verdicts

### Items
1. Holds. The diff removes `vocab.yml` lines 207-210 and nothing else. `sed -n '200,210p'` shows `focus_lane_tones:`, two blank lines, then the `tiers:` comment.
2. Holds. The diff removes `vocab.ts` lines 286-289 and nothing else. `vocabFileShape` stays `z.strictObject` at line 229.
3. Holds. Verify 7 shows the single removed row.
4. Holds. The new `describe('catalog file keys')` is at `keys.test.ts:751-772`:
   - It reads every `.yml` under `config/catalogs/`.
   - A key counts as read when `\.<key>\b` or `['"]<key>['"]` matches the comment-stripped code (`codeOf`) of a src module outside `lib/data/shapes/catalog-files/`, or when `from:\s*vocab\.<key>\b` matches `config/schemas/*.yml` or `docs/templates.md` with comment lines dropped.
   - A failure lists each orphan as `<file>: <key>`.
   - The head comment (lines 6-10) says the gate covers the catalog files' keys.
   - The case reuses `treeFiles`, `codeOf`, `readFileSync`, `readdirSync` and `parse`. No import or dependency was added.
5. Holds. Read on the base copy, no src file outside the shapes folder names any key besides `archive_order` in a way the case would miss: the worktree's src outside the shapes folder equals the base's (`diff -rq`), and every other key passes now. So the case on the base finds `archive_order` alone, which items 1-3 remove.

### Cases
- C1 met. The grep prints nothing after the change, and the same grep over the base copy prints the three lines.
- C2 met. `config-folder.test.ts` passes, `30 passed | 2 skipped`. The two default-timeout failures are load timeouts in cases the step does not reach.
- C3 met, by reading. `vocab.ts:229` is `z.strictObject`, the key is gone, and `config/text/findings.yml:135` reads `shape_unknown: 'key {0} is not a key this file takes'`.
- C4 met, by reading. `src/lib/data/sources/config/catalog/schemas/engine.ts:110` builds the editor schema from `CATALOG_FILES...shape`, which no longer holds the key.
- C5 met. The `sed -n '200,210p'` output above shows it.
- C6 met:
  - After the change: the case passes (`249ms`, `Tests 10 passed (10)`).
  - Before the change: the report quotes `expected [ 'vocab.yml: archive_order' ] to deeply equal []`, which is consistent with reading the base copy (item 5). I did not rerun it, because that needs a revert.
- C7 met. `venue_categories` is in `vocab.yml` and is drawn only by `docs/templates.md:680` (`from: vocab.venue_categories`), and the case passes, so it is not named. By reading, the comment rule holds: `codeOf` spaces every comment (`tests/checks/source/code.ts`).

## Spec

S1. The brief's premise is false, and its write list and Verify 3 rest on it.
- Brief, "What is on the tree", last bullet: "`docs/diagrams/` draws folders and their imports; the step removes no import, so `npm run diagrams` changes nothing there."
- What is wrong: `writes.dot` also draws each unplaced parse site by file and line. At the base it carries `"23. ? src/lib/data/shapes/catalog-files/vocab.ts:300" ... textMap.optional(`. `git show a2288789:src/lib/data/shapes/catalog-files/vocab.ts | sed -n 300p` and the worktree's line 296 both print `leads_fit: textMap.optional()...`, so removing lines 286-289 moves the site to `:296`.
- This step's part of the diagram change is four lines of `writes.dot` (the node and edge, before and after) and the 10 of the 34 changed lines of `writes.svg` that name `vocab.ts`. These paths are missing from the brief's write list, and the step needs them.
- The rest of the eight-file change is drift that was already on the base:
  - `git show a2288789:src/lib/server/edit/writes/subtasks.ts` has `148:export function writeFollowup(`, while `git show a2288789:docs/diagrams/writes.dot | grep -c writeFollowup` prints `0`.
  - `git show a2288789:src/lib/server/edit/writes/undo.ts | sed -n '315p;502p'` prints the `mapShape.safeParse(` and `workspaceValueShape.parse(` calls that the base diagram places at `:308` and `:495`.
  - The `layers`, `layer-state` and `layer-views` count changes name no file the step changes.
- What the brief asked: Verify 2 asks for `npm run diagrams`, and Verify 3 asks that it change nothing. On this base the two cannot both hold, and the builder correctly put this in the report's first line.
- Failure scenarios:
  - Landing O62 without `writes.dot/.svg`: `tests/checks/diagrams/diagrams.test.ts` 'are what the source gives now, each file byte for byte' is red on `vocab.ts:296`.
  - Landing all eight files: O62's one commit carries six files and the `writeFollowup`/`undo.ts` lines of base drift that no item asks for, and a `git revert` of O62 would make those diagrams stale again.
- My judgment: the `vocab.ts` lines of `writes.dot/.svg` belong to O62. The drift is outside O62 but cannot be separated from them by any means other than hand-editing generated files. The diagrams test is already red on the base, so the end-state fix is to regenerate the diagrams on main at landing and say in the landing commit that the drift came with it. The orchestrator rules on this, and the brief's write list is the defect.

No other spec finding. No change outside the items appears in src, tests or config, no substitute mechanism is used, and no dependency or script was added.

## Proof

none.
- Both changed tests are covered: the report quotes a failing-first line for the changed `EXPECTED` row and for the new case.
- No threshold or predicate was widened. The diff of `config-folder.test.ts` removes one row only.
- No file-scope mutable was added: `SHAPES_DIR` is a const string, and `codeOf`'s cache existed before.
- Judged by reading, the new case fails when a catalog key has no reader. Its known blind spot, a key whose name is a common word, is stated in the brief (Decision 2) and in the head comment.

## Standards

T1. The builder ran git commands.
- Place: the report, "Judgment calls", item 8.
- Quoted: "`git status --short` was run ... and `git status` with `git log --oneline -1` once at the start to confirm the base."
- What is wrong: `spec.md` (last section) says "a builder runs no git command at all, since the orchestrator reads its diff". The report says the dispatch allowed `git status`, but `git log` is not covered even by that claim.
- Failure scenario: the commands were read-only and the tree is unaffected. The finding is the broken rule.

Outside the step, for the orchestrator:
- `npx prettier --check src/lib/server/content/wallpaper.ts src/lib/views/shared/forms/entry/edit/EntryForm.svelte` prints `[warn] Code style issues found in 2 files`.
- Both files are at base bytes (`diff -rq` against the base copy lists neither), so the landing list's format check over the whole tree will be red on them whatever O62 does.

No other standards finding:
- The ASCII gate is clean, and the history-word grep is clean.
- `keys.test.ts` has 772 lines, under 880.
- The head comment lines are 92 to 100 columns, rewrapped as one paragraph.
- I checked these against the change: the head comments of `vocab.yml` (1-4), `vocab.ts` (1-4) and `catalog-files.ts` (1-12), the doc comment of `VOCAB_FILE_KEYS` (`vocab.ts:316`), and the `spec.md` sentence "every catalog key has a reader in the tree (a test fails on an orphan key)". All are still true or are made true.
- `grep -rn -i "orphan\|keys\.test" docs README.md CLAUDE.md config` finds no document that describes this gate.

## Behaviour

B1. One host-visible change is stated in neither the report nor the brief's "What it must do".
- Place: `src/lib/data/shapes/catalog-files/vocab.ts:317`.
- Quoted: `export const VOCAB_FILE_KEYS: readonly string[] = Object.keys(vocabFileShape.shape);`. It is read by `src/lib/data/snapshot/schema/static.ts:52`, which is `return VOCAB_FILE_KEYS.includes(key) && merged[key] !== undefined ? [] : undefined;`, and by `run.ts:228`.
- What is wrong: a hub schema field written `from: vocab.archive_order` behaves differently, and nothing says so.
  - Before: the field offered the eleven words of the shipped list, and the schema check passed.
  - After: `schemaFileProblems` gets `undefined` for the list, so the schema check reports a `from` that names no vocab list, and the field offers nothing.
- Failure scenario: a hub `.oculus` schema with `- { field: outcome, type: select, from: vocab.archive_order }` gets a schema-file finding after O62, and the report's before/after does not warn of it.
- Severity: no current hub is affected, since the `research-hub/.oculus` grep printed nothing (exit 1) and the shipped schemas and templates do not draw the key. The report's before/after should still carry the line.

The report states the other host-visible changes, each with before and after: the unknown-key finding for a `vocab.yml` that sets the key, the hub settings finding (unchanged), and the editor schema no longer offering the key.

## Declined to judge

- `npm run format` and `npm run diagrams` were not run, because both write the tree and this review changes nothing. I used `npx prettier --check` on the four files and `tests/checks/diagrams/diagrams.test.ts` in their place.
- The C1 grep in its `git grep` form is not one of my three git commands. I ran the `grep -rIn` form over the worktree and the base copy.
- The two failing-first runs were not reproduced: the config-folder test with only the row removed, and the new case on the base text. Both need a revert of the change, which the no-breakage rule bans, so I judged them by reading.
- Whether the dispatch prompt allowed the builder `git status`: the dispatch is not in the files I was given.
- Which commit on main left the diagrams stale. `git log --oneline a2288789 -- docs/diagrams src/lib/server/edit/writes/subtasks.ts src/lib/server/edit/writes/undo.ts` would settle it.
- Whether main's current head still has `wallpaper.ts` and `EntryForm.svelte` out of prettier's style. Running `npx prettier --check` on those two files in the main checkout would settle it.

Usage: acc2eb3d4addcfcb2, claude-opus-5-5, 157328 tokens, 34 tool uses, 15 min 12 s

## Closed

- S1: fixed at landing. `npm run diagrams` is run on main after the cherry-pick, so `writes.dot` and `writes.svg` place the parse site at `vocab.ts:296`; the regenerated diagrams carry the base's drift with them, named in the booking.
- T1: no code change. The builder's commands were read-only; the launch prompt allows `git status`, `git diff` and `git show`, and `git log --oneline -1` is outside it. Named in the booking.
- B1: closed in the booking, which states the before and after of a hub schema field written `from: vocab.archive_order`: before, the field offered the eleven words of the shipped list; after, the schema check reports a `from` that names no vocab list and the field offers nothing. No hub sets it (`grep` over the hub's `.oculus`, exit 1).
- The prettier warning on `wallpaper.ts` and `EntryForm.svelte` is outside the step: those files are at base bytes in the worktree, and main's `npm run format:check` passed at O58's landing.
