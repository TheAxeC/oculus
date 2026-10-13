# Step D72 refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/D72, base dece7bd18)

Open items for the orchestrator: three findings below make an item violated or partial: Spec 1 (the palette page's prefixes and keys are a hand list, item 10), Standards 1 (sentences the step makes false, item 11) and Standards 2 (the builder ran git commands). Every UI-only case is "not verifiable" by reading and needs a look at landing.

## Verification (rerun by the reviewer)

```
$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run test:quick -- --base dece7bd18      (exit 0)
test:quick: 149 changed file(s), from git since dece7bd18
test:quick: 163 test file(s), 10 essential
ok      ASCII gate (0.5 s)
ok      prettier (0.5 s): All matched files use Prettier code style!
ok      eslint (1.6 s)
ok      svelte-kit sync (2.2 s)
ok      svelte-check (6.8 s): 1791871414757 COMPLETED 498 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (44.0 s): Duration  38.21s (transform 47.29s, setup 0ms, import 78.07s, tests 64.49s, environment 1.10s)
test:quick: 44.6 s (limit 45.0 s); every command passed
(tests/server/edit/writes.test.ts, changed, is not in quick's selection; app-gate and hub-writes are listed as "changed, run by npm run test:slow")

$ npx vitest run <every changed test file: writes, feeds, writes-collection, app-gate, hub-writes, undo, tests/data, tests/state/forms, held-unsaved, palette-page> --reporter=dot
Test Files  45 passed (45)
Tests  621 passed (621)

$ npx vitest run tests/checks --testTimeout 0 --hookTimeout 0      (exit 1)
Test Files  2 failed | 16 passed (18)
Tests  2 failed | 265 passed (267)
  config-folder "names a group of its own and a path under the hub for every document": Error: expected any number of assertion, but got none
  integrity "validates with no findings": expected [ Array(239) ] to deeply equal []
  (the palette check tests/checks/diagrams/palette.test.ts and the diagrams check passed)

$ npm run lint          > eslint .   (no error line)
$ npm run format:check  All matched files use Prettier code style!
$ npm run check         COMPLETED 3993 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ <spec.md ASCII gate perl over src tests config utils docs/palette.md HELP.md DESIGN.md README.md docs/apps.md ../../docs/DATA-MAP.md>   printed nothing, exit 0
$ sh utils/folder-check.sh   exit 0
$ sh utils/size-check.sh     exit 0

$ unused-exports (run on main's tools/oculus, which differs from the base under src/utils/tests/config only by config/schemas/manifest-schema.yml, one line)
main:     Unused exports (242)   Unused exported types (117)
worktree: Unused exports (238)   Unused exported types (114)
diff of the two lists: removals only (sharedIdentity, slug, feedIdentity, parseManifestDraft, BlockValue, ManifestDraft, PromptField) and the board/index.ts line printed without `slug`; no added line.

$ node $TMPDIR/d72/twice.mjs   (paletteText run twice in memory against the committed docs/palette.md)
first==committed true second==first true lines 184

$ diff of the worktree's ledger copies of the brief and the report against main's: SAME_BRIEF, SAME_REPORT
```

The two tests/checks failures are not D72's: the worktree has no `.oculus` folder, so the config-folder test's document list is empty, and all 239 integrity findings are vocab findings from the missing hub layer (159 venue_themes, 55 data_themes, 25 project domains).

How the reruns compare with the builder's report: test:quick 44.6 s here against the report's 50.0 s; `npm test` not rerun; the palette page checked in memory; unused-exports consistent.

## Verdicts

Items: 1 holds; 2 holds (Behaviour 1); 3 holds; 4 holds (Behaviour 3); 5 holds; 6 holds; 7 holds with Spec 2; 8 holds; 9 holds; 10 violated (Spec 1, Standards 3); 11 partial (Standards 1).

Cases: every write, refusal, referrer, undo and draft case is met by the tests named (writes-collection.test.ts, feeds.test.ts, undo.test.ts, entry-save.test.ts, form-draft.test.ts, referrers.test.ts, new-entry.test.ts, held-unsaved.test.ts, hub-writes.test.ts, page-entry.test.ts). Partial: funding entry with no link (folder blocks need a look), delete of a pillar two projects name (question text and History need a look), `npm run docs:palette` twice (Spec 1). Not verifiable by reading, a look at landing: funding entry whose link names a folder, person page of a collaborator, `:task-add` with Shift+Enter, pillar page deleted from its toolbar with Undo, and the drawing of every editor, question and notice.

## 1. Spec

1. `src/lib/shell/keys/palette-page.ts:41-58`: `PALETTE_PREFIXES` and `PALETTE_KEYS` are hand lists that `utils/diagrams/palette.mjs:101-102` passes as the registry. The code that runs them is `src/lib/data/helpers/keys/oculus/palette-keys.ts`, `resolve.ts:179` (KeyT) and `src/lib/shell/keys/palette-modes.ts`. Failure: a key rebound or a prefix added leaves the page stale and `tests/checks/diagrams/palette.test.ts` still passes. Item 10 violated.
2. `src/lib/server/edit/writes/subtasks.ts:336-339`: `career` takes any top-level key; `schema`, the empty key and an undeclared section are not refused. Failure: `{ kind: 'career', fields: { schema: [] } }` replaces the file's schema block; `{ '': 'x' }` appends a key of no name. Item 7 partial.

## 2. Proof

1. `tests/server/edit/writes-collection.test.ts:188-191`: the title says the venue is addressed by its name; the call addresses it by its id `existing`.
2. `tests/server/edit/writes-collection.test.ts:223-297`: several new tests hold behaviour createEntry already had; the report's first-run account ("6 failed | 10 passed") names none of the passing ones.

## 3. Standards

1. Sentences the step makes false: `DESIGN.md:707` (prefixes and keys from the code), `HELP.md:67` and `README.md:28` (the same); `DESIGN.md:703` ("Add asks for the key and nothing else" with a venue's two fields and a paper's three); `docs/DATA-MAP.md:511` ("Add writes only the key"); `DESIGN.md:706` (slugOf users listed wrongly: feeds.ts:253 and new-entry.ts use it, the radar use is the NewIdea seed id); `VenueCard.svelte:96` (head comment omits Delete). Item 11 partial.
2. Builder report, "Anything wrong" point 4: the builder ran `git -C . status` twice and `git -C . mv` once. spec.md forbids any git command; check the worktree index for a staged rename before the cherry-pick.
3. `docs/palette.md:118`: the Prefixes and Keys input columns are not in code type, so `:<number>` renders as ":".
4. createEntry's tests now sit in two files (`writes-collection.test.ts:223` and `writes.test.ts:375`) as separate `it` blocks; spec.md asks one table per unit.
5. `subtasks.ts:330`, `:334` and the 404 return literal English reasons instead of catalog keys (weak).

## 4. Behaviour

1. `src/lib/state/forms/form-draft.ts:35-48, :89`: an unsaved project-editor draft in the old `{ project, edits }` shape is no longer read after landing, and the old keys stay in the record. Not stated as a user-visible change.
2. The shared `slugOf` (guards.ts:99-108) changes ids: tab_rollup bucket ids of accented labels (presets.ts:309), LinkedIn idea file names of accented titles (feeds.ts:253), radar seed ids for a motif with leading punctuation (radar.ts:108). Not in the report's before/after table.
3. `Person.svelte:151-157` and `RadarCard.svelte:138`: Delete is not disabled while a source tab holds unsaved text of the file, unlike `Entry.svelte:184-185`.
4. `EntryEditor.svelte:113-116`: when a later feed-field write is refused as a whole after earlier ones were written, the editor shows only the failure, does not settle the draft and does not say which fields went out.
5. `src/lib/state/workbench/palette.ts` buildIndex: a palette result for a collection entry now opens the entry page; the report's before/after table omits it.

## Declined to judge

The UI-only parts of the cases (a look at landing); `npm test`, `npm run docs:palette` and `npm run diagrams` as commands (they write files); the new tests against the base copy; line-by-line component reading of LabelRows.svelte, EntryFolder.svelte, CareerHosts.svelte; the regenerated diagram files' content; the hub lines made at landing.

Reviewer usage: aa2b5f3bc2f7eb249, claude-opus-5-5, 110671 tokens, 119 tool uses, 22.3 min.
