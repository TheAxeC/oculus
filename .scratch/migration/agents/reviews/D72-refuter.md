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

## Repair round 1, refuted

Run over D72's repair round 1, in `/Users/axelfaes/workspace/research-hub/.agents/worktrees/D72` against base `dece7bd18`. The round's delta was taken in two parts. For the 151 paths of `/Users/axelfaes/workspace/research-hub/.agents/worktrees/D72-round-1/files.txt`, `diff -u` of each snapshot copy against the worktree file (38 paths differ). For the paths changed now that `files.txt` does not list, `git diff dece7bd18` or the whole file: `palette-keys.ts`, `resolve.ts`, `workbench-keys.svelte.ts`, `tests/server/edit/writes-fixture.ts` and the untracked `palette-table.ts`. Both parts were read against the whole diff since the base.

```
$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH   (every command below, from tools/oculus in the worktree)
$ npm run test:quick -- --base dece7bd18                     (exit 0; load average 6.19 at the start)
ok      ASCII gate (0.5 s)
ok      prettier (2.3 s): All matched files use Prettier code style!
ok      eslint (1.9 s)
ok      svelte-kit sync (2.4 s)
ok      svelte-check (5.7 s): 1791878666687 COMPLETED 498 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (43.1 s): Duration  37.82s (transform 49.39s, setup 0ms, import 78.83s, tests 60.10s, environment 745ms)
test:quick: 43.9 s (limit 45.0 s); every command passed
$ npm run lint                 > eslint .   (no error line, exit 0)
$ npm run format:check         All matched files use Prettier code style!
$ npm run check                1791879112482 COMPLETED 3994 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npx vitest run tests/checks --testTimeout 0 --hookTimeout 0 --reporter=dot
 Test Files  2 failed | 16 passed (18)
      Tests  2 failed | 265 passed (267)
  FAIL tests/checks/config/config-folder.test.ts > oculus's own config directory > names a group of its own and a path under the hub for every document: Error: expected any number of assertion, but got none
  FAIL tests/checks/config/integrity.test.ts > the real hub > validates with no findings: AssertionError: expected [ Array(239) ] to deeply equal []
$ <the 239 findings, grouped by message>   159 "... not a key of vocab.venue_themes", 55 "... not a key of vocab.data_themes", 25 "project <id> names the domain <d>, which is not in the domains of .oculus/config/catalogs/vocab.yml ..."
$ ls -d .agents/worktrees/D72/.oculus      ls: .oculus: No such file or directory
$ <spec.md ASCII gate perl over src tests bin config>     (bfs: error: bin: No such file or directory.) ascii exit 0, no line printed
$ LC_ALL=C grep -n '[^ -~]' docs/palette.md HELP.md DESIGN.md README.md docs/apps.md ../../docs/DATA-MAP.md utils/diagrams/palette.mjs     exit 1 (nothing)
$ sh utils/folder-check.sh     folder exit 0
$ sh utils/size-check.sh       size exit 0
$ sh utils/unused-exports.sh   worktree: Unused exports (238), Unused exported types (114); main's tools/oculus (same src/tests/utils/config as the base copy .agents/worktrees/D72-base except config/schemas/manifest-schema.yml, by diff -rq): (242), (117)
  lines the worktree prints that main does not: only "src/lib/state/boards/board/index.ts: FACETS, NONE, authorLine, bucketOf, venueText, facetValues, facetHeading, filtersInForce, valueLabel, emptyBoardState" (main's line for that file without `slug`)
$ node <scratch>/twice.mjs <worktree tools/oculus>   (paletteText() of utils/diagrams/palette.mjs twice, in memory)
first==committed true second==first true sha1 8e6bfcfa17dc919fe460b5b071f132d00b696ad3 committed sha1 8e6bfcfa17dc919fe460b5b071f132d00b696ad3 lines 184
$ npx vitest run tests/checks/diagrams/palette.test.ts --testTimeout 0      Test Files 1 passed (1), Tests 1 passed (1)

Commands the round's report quotes as evidence:
$ grep -rn "PALETTE_PREFIXES\|PALETTE_KEYS\|palette's own registry" src tests utils DESIGN.md HELP.md README.md docs     exit 1
$ npx vitest run tests/shell/keys tests/checks/diagrams/palette.test.ts tests/checks/source tests/state/system/apps/app-keys.test.ts --testTimeout 120000     Test Files 8 passed (8), Tests 128 passed (128)
$ npx vitest run tests/server/edit/writes.test.ts       Test Files 1 passed (1), Tests 49 passed (49)
$ npx vitest run tests/state/forms/entry-save.test.ts   Test Files 1 passed (1), Tests 11 passed (11)
$ npx vitest run tests/server/edit/writes.test.ts tests/server/edit/writes-collection.test.ts tests/state/forms tests/shell/keys tests/routes/edit/undo/undo.test.ts tests/routes/edit/apps tests/state/client/held-unsaved.test.ts     Test Files 15 passed (15), Tests 277 passed (277)
$ npx vitest run tests/routes/edit/apps/app-gate.test.ts tests/routes/hubs/hub-writes.test.ts tests/routes/edit/undo/undo.test.ts --tagsFilter slow --testTimeout 60000     Test Files 3 passed (3), Tests 48 passed | 35 skipped (83)
$ npm test -- --reporter=dot     Test Files 216 passed | 50 skipped (266), Tests 2187 passed | 450 skipped (2637)
$ npx tsc --noEmit -p .          exit 2, three lines: card.ts(12,15), entry-actions.ts(20,15), task-card.ts(12,15): error TS2614: Module '"*.svelte"' has no exported member 'CardAction'
$ git show dece7bd18:<each of the three files> | grep CardAction     card.ts:12, entry-actions.ts:6, task-card.ts:12 each hold "import type { CardAction } from '...CardActions.svelte';" at the base
$ grep -n "addresses a venue by its id" tests/server/edit/writes-collection.test.ts     180 (the report says 188; no decision rests on the line)
$ grep -n "createEntry" tests/server/edit/writes-collection.test.ts     15 (import), 225 (shared-identity case)
$ grep -n "fields that name the new entry" DESIGN.md HELP.md ../../docs/DATA-MAP.md     HELP.md:234, DATA-MAP.md:511, DESIGN.md:703
$ grep -n "tables the palette runs on" DESIGN.md HELP.md README.md     README.md:28, HELP.md:67, DESIGN.md:707
$ sed -n '112,122p;172,184p' docs/palette.md     Prefixes and Keys input columns in code type (`:`, `:<number>`, `#`, `Cmd+P`; `Cmd+K` ... `Escape`)
$ stat of agents/reviews/D72-before-round1.patch     Oct 13 08:26:17 2026 (round brief 08:26:05; the round's worktree edits are dated 08:28 to 09:30; D72-round-1/files.txt 10:01:13)
```

How the reruns compare with the report:
- Every count the report quotes reproduces: 128, 49, 11 and 277 tests; 48 passed and 35 skipped in the slow run; 216 test files and 2187 tests in `npm test`; 3994 files in `npm run check`; 238 and 114 unused exports; the page's sha1.
- `test:quick` took 43.9 s here, against the report's 91.8 s.
- The two `tests/checks` failures and the three `tsc` lines reproduce.

The six points the orchestrator asked me to judge:

1. **`test:quick` over 45 s.** My rerun of the same command took 43.9 s, inside the limit, so the report's 91.8 s reflects the machine's load and is not a defect of the step. No finding.
2. **The two `test:checks` failures.** Both come from the missing hub layer, as the report says, and neither is the step's.
   - The worktree has no `.oculus` folder.
   - The config-folder case loops over `config.docs`, which only the hub layer fills. With no hub layer it makes no assertion (`config-folder.test.ts:555-568`).
   - All 239 integrity findings are vocabulary findings (159 venue themes, 55 data themes, 25 project domains).
   - None of the 239 comes from the three new collections, whose schemas were checked against the worktree's `registries/people.yml`, `organisations.yml` and `resources.yml`.
   - Not verified here: the result once the hub layer is in place, which is checked at landing.
3. **The three `tsc` lines.** All three imports were already in the base (`git show dece7bd18:`, quoted above). `entry-actions.ts` only moved its import from line 6 to line 20. `tsc` is not in the verify list, and `npm run check` reports 0 errors. Not the step's, and no finding.
4. **The statement that the pre-round tree "is not kept".** The statement is wrong, but the first runs still meet the Proof heading; see Finding 6.
5. **Literal English reasons in other server writes.** `writeHost`, `entry-edit/host-status.ts` and the base parts of `entry-edit/entries.ts` and `feeds.ts` predate the step and are outside both the brief and ruling 3. `entry-edit/merge.ts`, however, was added by this step, so its literal reasons are inside spec.md's catalog rule; see Finding 3.
6. **The limit of ruling 1.** The library genuinely limits the walk keys and the Enter of Shift+Enter. bits-ui 2.19.3's Command answers ARROW_UP, HOME, END and ENTER itself (`node_modules/bits-ui/dist/bits/command/command.svelte.js:905-935`) and takes no key list from oculus. The stated limit is still wrong in two ways:
   - Escape belongs to the dialog, not the list component (Finding 2).
   - It is not the only part of the table that no code reads (Finding 1).

### Verdicts

These cover the whole diff since the base.

Items of the brief's "What to build":

- **1 (a page for every entry): holds.** Evidence: `page-entry.test.ts` and `referrers.test.ts` in the 277-test run, and `npm test` green. The drawn page is checked at the look.
- **2 (the editor): holds.**
  - Behaviour 4 of the first review is closed: `savePage` breaks at a write refused as a whole (`entry-save.ts:84-88`), and `EntryEditor.svelte:115-134` settles only the fields in `changed` and shows both lines. `entry-save.test.ts` passes 11 of 11.
  - Behaviour 1 is now stated in the report's table.
  - The literal refusal reasons this step's server code shows under a field are Finding 3.
- **3 (Add): holds.** The run is 277 of 277. The moved rows no longer assert the id `createEntry` answers (Finding 4). That weakens the proof but not the code: by reading, `entries.ts` sets `values[ident] = value`.
- **4 (Delete): holds.** Behaviour 3 is closed by reading. `Person.svelte:73-76` and `:161-162`, and `RadarCard.svelte:59-68` and `:151-152`, pass `blockedBy(...)` to `title` and `disabled`, as `Entry.svelte:102-103` and `:184-185` do. The drawing is checked at the look.
- **5 (referrers): holds.** Evidence: `referrers.test.ts` (person, organisation, resource) in the 277-test run.
- **6 (people, organisations and resources as collections): holds.**
  - `config/sources.yml:60-62` lists the three, and `config/layout.yml:89` reads `view: [venues, data, statements, people, organisations, resources]`.
  - The integrity rerun shows no finding from the three files.
- **7 (career): holds.**
  - Spec 2 of the first review is closed: `careerKeyRefusals` (`subtasks.ts:311-329`), with the rows at `writes.test.ts` "refuses $name and writes nothing for it" (4 rows) and "refuses every key of a file with no schema with the one sentence"; 49 of 49 pass.
  - The real career file's top-level sections all appear in its `schema:` (python read of `registries/career.yml`), so the new refusal does not block the career editor.
  - The changed refusal words are Finding 8.
- **8 (feeds): holds.** Evidence: `feeds.test.ts`, `hub-writes.test.ts` and `entry-save.test.ts` green.
- **9 (`:task-add`): holds.** Evidence: `new-entry.test.ts` green.
- **10 (the palette page): violated.** See Finding 1. Standards 3 of the first review is closed (the code type in `docs/palette.md:117-120` and `:177-183`), and Spec 1 is closed only in part.
- **11 (leftovers and words): violated.** See Findings 2 and 3. The sentences ruling 7 named are rewritten (the greps quoted above, plus `VenueCard.svelte:96` and `HELP.md:258` in the delta).

Cases of the brief's "Cases":

- **Funding entry with no `link`: met.** The page's data is checked by `page-entry.test.ts` "finds a collection entry with the values, the fixed fields and the peers", and the funding referrers by `referrers.test.ts`. By reading, `Entry.svelte` draws the folder blocks only when `pageFolder` names a folder. The drawing is checked at the look.
- **Funding entry whose `link` names a folder: not verifiable here.** No run draws the page; the look settles it.
- **Editor of an events entry (`meta`): met.** `writes-collection.test.ts` "adds one row of a metalist and writes that field alone", and `entry-save.test.ts` "posts the fields whose payload differs, in the schema order".
- **Editor of a dataset (`retrieval`): met.** "changes one sub-field of a nested map and keeps the folded text, the comments and the rest" and "keeps the lines of a sub-field untouched while another is replaced".
- **Editor of a venue: met.** "addresses a venue by its id and writes the short name alone", "renames a venue through its name and leaves its id", and `entry-save.test.ts` "posts a venue name and never its id".
- **Edit typed and not saved, then a reload: met for the store.** `form-draft.test.ts` (three cases). The close question is checked at the look.
- **Select value not among the options: met.** "refuses a select value that is none of its options and leaves the file". The reason drawn under the field is checked at the look.
- **Add on Tasks with `review-x`, and with a held key: met.** `ADD_ROWS` "writes the key and nothing else" and "refuses a held key". The answered id is no longer asserted (Finding 4). The page opening is checked at the look.
- **Add on a file whose `entries:` holds only comments: met.** `ADD_ROWS` row 2, and `collections.test.ts` "reads an `entries:` that holds only comments as a collection with no entries".
- **Add with a key that begins with a hub's key and a colon: met.** `ADD_ROWS` "refuses a key that begins with the key of a hub and a colon".
- **Add on a card list showing a second hub's collection: met.** `hub-writes.test.ts` "goes to the primary hub when it creates an entry, whatever other hubs are built".
- **Add on Venues, with name and id and with an empty id: met.** `ADD_ROWS` rows 6 and 7.
- **Add on Lit Watch: met for the write.** The `radar-add` refusals are covered by `feeds.test.ts`. The box and the page opening are checked at the look.
- **Add on Leads: met for the write.** The `lead-add` refusal is covered by `feeds.test.ts`. The look covers the rest.
- **Delete of a pillar two projects name: met for the referrers and the undo.** `referrers.test.ts` and `undo.test.ts`. The question's words and the History row are checked at the look.
- **Delete of a statement no file names: met by reading.** `referrersOf` has no statement field. The look covers the question.
- **Organisation page: met.** `referrers.test.ts` "names for an organisation the people affiliated and the schemes it funds".
- **Resource page: met.** "names for a resource the projects that compute on it and the setting that names it".
- **Person page of a collaborator: not verifiable here.** The look settles it.
- **People, Organisations and Resources in References: met by reading.** `config/layout.yml:89` and `config/sources.yml:60-62`.
- **Career panel's Edit, changing `milestone`: met.** `writes.test.ts` "writes the changed section alone and records its before and after", and the undo row in `undo.test.ts`.
- **The career editor (situation, host score column, eligibility caveat): met.** The three `writes.test.ts` cases for situation, a host's score column and eligibility.
- **A source tab holding unsaved text while the editor saves: met.** `held-unsaved.test.ts`.
- **A lead's page, `fit` and `country`: met.** `feeds.test.ts` and `entry-save.test.ts`. The status control is checked at the look.
- **A feed entry of a second hub: met.** `entry-save.test.ts` and `hub-writes.test.ts`.
- **A feed file with two entries of one title: met.** `feeds.test.ts` "refuses a write and a deletion of an entry whose title another entry shares".
- **A radar entry, Dismiss and Delete: met.** `feeds.test.ts` and `undo.test.ts` "puts a deleted Lit Watch entry back as it was recorded".
- **`:task-add` twice with the same title: met.** `new-entry.test.ts`.
- **`:task-add` with U+00E9: met.** `new-entry.test.ts`.
- **`:task-add` with nothing or only spaces: met.** `new-entry.test.ts`.
- **`:task-add` with U+65E5 U+672C: met.** `new-entry.test.ts`.
- **`:task-add` with Shift+Enter: not verifiable here.** `opensTaskPage` is read by `CommandRows.svelte:148-149`; the look settles it.
- **`:task-add` with no tasks collection: met.** "is none when the primary hub holds no tasks collection".
- **`:task-add` with a 200-character title: met.** "is cut to 80 characters with no trailing hyphen".
- **A pillar's page whose entry is deleted from its toolbar: met for the data.** `page-entry.test.ts` "reads the saved values of the page now, and none for a page that is gone". The look covers the rest.
- **Delete of a person a project's `waiting-on` names: met.** `referrers.test.ts` person row.
- **Delete of the resource `slurm.resource` names: met.** `referrers.test.ts` resource row.
- **`npm run docs:palette` twice: met.** The in-memory run gave first==committed and second==first; `palette-page.test.ts` passes in the 128-test run; `palette.test.ts` passed.
- **A second hub's collection, pages and editors: met.** `page-entry.test.ts` "finds an entry of another hub by the id the merged portfolio gives it", and `hub-writes.test.ts`.
- **A collection file with two entries of one identity: met.** `writes-collection.test.ts` "refuses a write, an add and a delete with the shared-identity sentence and leaves the file".

### Findings

**1. Spec: part of the palette table is read by nothing but the page.**
- **Where:** `src/lib/data/helpers/keys/oculus/palette-table.ts:35`, `:41-44`, `:62-66` and `:68`.
- **Quoted:** `open: { word: 'palette_page.key_open', presses: [{ key: 'k', command: true }] }`, `presses: [{ key: 't', command: true, code: 'KeyT' }]`, `line: { word: 'palette_page.prefix_line', prefix: ':', ... }` and `files: { word: 'palette_page.prefix_files', prefix: null }`.
- **What is wrong:** Ruling 1 asks that the predicates and the mode parser take their prefixes and chords from the rows, so that a row taken out stops working and the page cannot drift. Outside the stated limit, the page writes several fields that no function reads:
  - The symbols row: `resolve.ts:180` matches only `KEY_ROWS.symbols.presses[0].code`, with the modifiers hardcoded at `:173-175`. The page writes `key` and `command` (`palette-page.ts` `pressText`).
  - The open row's `command`: `togglesPalette` (`palette-keys.ts:38-41`) accepts `metaKey || ctrlKey` on every platform and reads only the letter.
  - The line row's `prefix`: `parseCommand` (`state/workbench/palette.ts:393`) reads `PREFIX_ROWS.command.prefix`, and `lineQuery` reads only `line.only.pattern`.
  - The files prefix row as a whole: only `prefixInputs` reads it.
  - `Palette.svelte:376` still strips the symbol prefix with `query.slice(1)`.
- **What the documents claim:** `DESIGN.md:707` states that "a row taken out stops working and leaves it" for every row outside the walk keys, Escape and Enter.
- **Failure scenarios:**
  - The symbols row's `key` is changed from `'t'` to `'y'`. After `npm run docs:palette` the page says `Cmd+Y`, while the app still opens the symbols on Cmd+T, and `palette.test.ts` passes.
  - `PREFIX_ROWS.files` is deleted. The page loses its Cmd+P prefix row while Cmd+P keeps working.
- **Verdict:** item 10 violated.

**2. Standards: false sentence about Escape.**
- **Where:** `DESIGN.md:707` and `src/lib/data/helpers/keys/oculus/palette-table.ts:6-9`.
- **Quoted:** "The arrow keys, Home, End, Enter and Escape are answered by the list component the palette is drawn with, so their rows are listed on the page and read by no function of oculus" (DESIGN), and "The walk keys and Escape are answered by the list component the palette is drawn with, which reads no row" (head comment).
- **What is wrong:** Escape is answered by the palette's `Modal`, which stands on bits-ui's Dialog: `src/lib/ui/frame/Modal.svelte:2-10` ("Escape and a press on the ground outside the box close it") and `Palette.svelte:17` ("Escape and a press on the ground beside it close it"). bits-ui's Command answers ARROW_UP, HOME, END and ENTER and has no ESCAPE case (`command.svelte.js:905-935`). The same `DESIGN.md:707` sentence that "a row taken out stops working" is false for the rows of Finding 1. The rules file asks that a sentence the change makes false is rewritten.
- **Failure scenario:** A maintainer who wants Escape to read the `close` row looks in the Command component, where nothing handles Escape, and leaves the Modal untouched.
- **Verdict:** item 11 violated.

**3. Standards: literal English refusal reasons in code this step added, and a false sentence about them in the round's report.**
- **Where:** `src/lib/server/edit/entry-edit/merge.ts` (added by the step; `git status --short` shows `A`), for example `:94`, `:98` and `:136`. Also the report's "Repair round 1 / Anything wrong" point 6.
- **Quoted:** `if (given === undefined || given === null) return fail('the value cannot be written here');` and `return fail('the value has no place in the file');`. The file has 28 such `fail(...)` calls, including the new sentences "the row would be left without a key" and "the value has a shape no field is written in". The report: "Other write functions of the server still carry literal English reasons (`writeHost` in `subtasks.ts`, `entry-edit/host-status.ts`, `entry-edit/entries.ts`, `entry-edit/merge.ts`, `feeds.ts` ...) ... the others are other writes and are unchanged by this step."
- **What is wrong:**
  - spec.md ("What every package obeys") requires every string a reader sees to come from a catalog, and an engine error to be mapped to a catalog line before it is shown. Item 2 shows a refused field's reason under the field.
  - `merge.ts` is this step's own code, so these literals are inside the brief. Ruling 3 named only the career write, and the pre-existing literals of `writeHost`, `host-status.ts` and the base parts of `entries.ts` and `feeds.ts` are outside the step.
  - The report's "unchanged by this step" is false for `merge.ts`.
  - The base layer it extends (`lines.ts`, `yaml-edit.ts`, `entry-edit/entries.ts`) uses the same literal form, so the fix is the catalog threading the career write got in this round.
- **Failure scenario:** A dataset `retrieval` save whose value has no place in the file shows "the value has no place in the file" in English under the field, from no catalog line, and the report tells the reader this code is not the step's.
- **Verdict:** item 11 violated, with Finding 2.

**4. Proof: a moved createEntry row lost an assertion.**
- **Where:** `tests/server/edit/writes.test.ts`, the `ADD_ROWS` row "writes the key and nothing else" and its `it.each` in the `adding an entry` describe.
- **Quoted:** `expect(out.changed).toEqual(row.changed); expect(out.refused).toEqual(...); expect(readFileSync(file, 'utf8')).toBe(row.after);`. The snapshot's `writes-collection.test.ts` asserted `expect(out).toMatchObject({ found: true, id: 'review-x', changed: ['entries'], refused: [] })`.
- **What is wrong:** Ruling 5 asked for a move into one table, and the move dropped `found` and `id`. The `id` is what Add opens the new entry's page by (item 3). No other test asserts the id `createEntry` answers for a key-identity file: the only id assertion left is "appends a new entry rendered from the file schema", for a title-identity file.
- **Failure scenario:** `createEntry` answering an empty or wrong `id` for a keyed collection passes the suite, while Add on Tasks opens no page for `review-x`.
- **Verdict:** none. Item 3 and its case are met by reading `entries.ts`.

**5. Proof: assertions over a constant, and no first run for the round's palette-page test changes.**
- **Where:** `tests/shell/keys/palette-page.test.ts`, the new test "writes a row for each prefix and each key of the palette table, in code type".
- **Quoted:** `expect(Object.keys(KEY_ROWS)).toHaveLength(7); expect(Object.keys(PREFIX_ROWS)).toHaveLength(4);`
- **What is wrong:**
  - These are assertions over a constant, which spec.md forbids ("an assertion over ... a constant proves nothing and is not written"). They also fail when a row is added, which ruling 1 says should simply appear on the page.
  - The round's report quotes no run on the unchanged tree for this new test, or for the changed assertions of the first test (`| `#` |`, `| `Cmd+K` |`). The Proof heading asks for a quoted failure for a new or changed test of an added behaviour.
- **Failure scenario:** A key row added to `KEY_ROWS`, with the page regenerated and correct, turns this test red.
- **Verdict:** none.

**6. Proof (point 4): the pre-round tree was kept.**
- **Where:** the report's "Ruling 3: the first runs", "Ruling 9: the first run" and "Anything wrong" point 4.
- **Quoted:** "The tree as it stood before this round is not kept, and making it again by removing the fix is a revert of the code under test".
- **What is wrong:**
  - `agents/reviews/D72-before-round1.patch` was written at 08:26:17, before the round's first worktree edit (08:28). The snapshot `D72-round-1` now holds the same tree.
  - The round brief does not name the patch, so the builder had no pointer to it, but the sentence is false.
  - The first runs quoted, `TypeError: writeCareer is not a function` and `Cannot find module '.../entry-save.ts'`, are failures on the unchanged tree (the base). That meets the Proof heading as written.
  - Reading the rows against the snapshot's code shows they test what the rulings add:
    - The snapshot's `writeCareer` has no key refusal, so `{ milestone, schema: 'x' }` answers `changed` with `schema` in it and the row's `toEqual(['milestone'])` fails.
    - The snapshot's `savePage` loop has no `break` and keeps `merged.error ??= answer.error`, so the calls are `fit`, `country`, `region` and the row's `['fit', 'country']` fails.
- **Failure scenario:** A reader takes the pre-round state as lost and does not look at the patch or the snapshot.
- **Verdict:** none.

**7. Behaviour: the report's before/after for the radar seed id is wrong.**
- **Where:** the report's "Host- and user-visible changes added (ruling 10)", the row "The ids `slugOf` makes".
- **Quoted:** "a radar motif is cut at 80 characters after the leading punctuation is dropped ... the motif `(block-term decompositions of tensors in neural network layers)` gave `block-term-decompositions-of-tensors-in` and gives `block-term-decompositions-of-tensors-in-neural-network-layers`".
- **What is wrong:** `src/lib/state/feeds/radar.ts:17` is `const SLUG_MAX = 40;`, and `:108` calls `slugOf(..., SLUG_MAX)`. A node evaluation of the shared rule and of the base's radar rule gives, for that motif, `old: block-term-decompositions-of-tensors-in`, `new(40): block-term-decompositions-of-tensors-in`. The cut is 40 and that id does not change. What does change is the following:
  - Accents are stripped (`R<U+00E9>seaux de tenseurs`: `r-seaux-de-tenseurs` to `reseaux-de-tenseurs`, correct in the report).
  - A leading hyphen no longer counts in the 40-character cut, so a motif with leading punctuation can gain one character.
- **Failure scenario:** At the look, or reading the table, a reviewer expects radar seed ids of up to 80 characters and a new id for that motif, and neither occurs.
- **Verdict:** none.

**8. Behaviour: changed career refusal words are not stated.**
- **Where:** `src/lib/server/edit/writes/subtasks.ts:358` and `:366`, `src/lib/server/edit/writes.ts:149-152`, and `config/text/server.yml` `server.career.*`.
- **Quoted:** `reason: words(text, 'server.career.no_parse')` ("The career file does not parse"), `no_map` ("The career file is no map"), `no_file` ("The career file is not on this hub").
- **What is wrong:** The words a reader sees on these refusals change from "the file does not parse", "the file is no map" and "the career file is not on this hub". spec.md counts "the words of a refusal" as visible, and the report's before/after table has no row for them.
- **Failure scenario:** The look on landing has no before and after to check the career editor's refusal lines against.
- **Verdict:** none.

### Declined to judge

- **Running `npm run docs:palette` and `npm run diagrams` as commands.** Both write files in the worktree. The page was generated in memory twice and compared with the committed file, and the diagrams check passed inside the `tests/checks` run.
- **Running the round's tests on the base copy or the snapshot.** This would need test files copied into a shared folder; the tests were judged by reading against the snapshot's code (Finding 6).
- **The drawn parts of the cases marked "not verifiable here" or "at the look":**
  - the editor's two result lines after a stopped feed save;
  - Delete disabled on the person page and on the radar card;
  - the palette's keys after the table change;
  - Shift+Enter on `:task-add`;
  - every question and page drawing.

  No page is run here; the look on landing settles them.
- **Whether the round's builder ran any git command.** The round's report does not say. The worktree index still holds the staged deletions of round 0 (`git status --short` shows `D ` for `state/feeds/idents.ts`, `forms/manifest-draft.ts`, `focus/CareerPanel.svelte` and `tests/state/forms/manifest-draft.test.ts`). Only the builder's transcript would settle it.
- **The `integrity.test.ts` and `config-folder.test.ts` results with the hub's `.oculus/config` layer in place, and the hub lines made at landing.** These are at landing on main.
- **The full rewrap of every comment paragraph the step edited.** A scan of the comments the round edited found no line short inside a sentence. Round-0 head comments were not re-read line by line.

Reviewer usage: aad2c8c24c24034e1, claude-opus-5-5, 295542 tokens, 82 tool uses, 28.3 min.

## Closed

- Round 1, Finding 1 (Spec): fixed at landing; every row of the palette table but those of the walk keys, Escape and the Enter of the task-add row is read by the code that runs it. `isPress` reads a press marked `byPosition` from its physical key (`Key` and the letter), and `appKey` (`resolve.ts`) answers the symbols row through it, modifiers included; `togglesPalette` reads the open row's `command`; `lineQuery` takes the query and reads the line row's prefix and pattern; `Palette.svelte` strips the symbols row's prefix by its length; Cmd+P's file mode is the `mode` of the files key row, so `PREFIX_ROWS` holds only prefixes and the page's prefix table lists the key rows that carry a mode. `npm run docs:palette` writes `docs/palette.md` byte-identical to the committed page (`cmp` in the gate).
- Round 1, Finding 2 (Standards): fixed at landing; `DESIGN.md:707` and the head comment of `palette-table.ts` say the walk keys and Enter are answered by bits-ui's Command and Escape by the dialog the palette stands in (`src/lib/ui/frame/Modal.svelte`, on bits-ui's Dialog), and that a row taken out stops working except those.
- Round 1, Finding 3 (Standards): raised and closed in automode as Z865 (plan.md Rulings, choices.md): the 140 English refusal sentences of `src/lib/server/edit` (11 files, `merge.ts`'s 28 among them, 113 on the base) go to `config/text/server.yml` as part 10 of D74; the report's sentence that `merge.ts` is unchanged by the step is corrected in the booking.
- Round 1, Finding 4 (Proof): fixed at landing; the `ADD_ROWS` row 'writes the key and nothing else' carries `id: 'review-x'`, and the table's runner asserts `found: true` and the id for a row that names one.
- Round 1, Finding 5 (Proof): fixed at landing; the two assertions over the lengths of `KEY_ROWS` and `PREFIX_ROWS` are removed from `tests/shell/keys/palette-page.test.ts`; the missing first run of the round's palette-page test changes is recorded in the booking.
- Round 1, Finding 6 (Proof): corrected in the booking; the tree before the round is kept in `agents/reviews/D72-before-round1.patch` and was the snapshot `.agents/worktrees/D72-round-1`.
- Round 1, Finding 7 (Behaviour): corrected in the booking; a radar seed id is cut at 40 characters (`radar.ts:17`, `SLUG_MAX`), the motif named in the report keeps its id, and what changes is accents stripped and a leading hyphen no longer counted in the cut.
- Round 1, Finding 8 (Behaviour): stated in the booking with before and after; the career refusals read "The career file does not parse", "The career file is no map" and "The career file is not on this hub" in place of "the file does not parse", "the file is no map" and "the career file is not on this hub".
- Landing look, the palette (Spec, item 1): fixed at landing; a palette result for a collection entry, a lead or a Lit Watch paper opened an `entry` tab that said it was opened for no entry, since `openPaletteItem` (`src/lib/shell/keys/palette-open.ts`) opened every result but a project without its state; a result that reveals no card now opens with the state that names it, as a card's title does. Seen on the scratch oculus: Neurocomputing, a lead and the ZonMw funding scheme each open their page from the palette.
- Landing look, a feed entry's page (Spec, item 1): raised and closed in automode as Z867 (plan.md Rulings, choices.md): the page of a lead or a Lit Watch paper shows the editor alone, against item 1's "the page shows the record, its editor"; the builder's report says so (`D72-report.md`, "A feed entry's page shows the editor only") and neither review raised it; the cards move to `src/lib/views/shared/` and are drawn on the page as part 12 of D74.
- Landing look, entry pages right after a write (Behaviour): raised and closed in automode as Z866: after Save the editor shows the old value with "nothing changed" until the hub data is read again, a page opened by Add or `:task-add` first says the file holds no entry with its key, and an undo's History row is labelled by the kind of the write it reverses; part 11 of D74.
