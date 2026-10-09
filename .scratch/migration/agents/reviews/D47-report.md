# D47 report, after repair round 1: one Session view

(Same text as /Users/axelfaes/workspace/research-hub/.agents/worktrees/D47/tools/oculus/.scratch/migration/agents/reviews/D47-report.md)

Items 1 to 9 of the round brief are done and every command below passed. Not done by me, because only the page shows them: the page-only half of cases 2, 3, 5, 6, 7, 8, 15, 16, 17, 20 and 21 (marked "the look" in the cases table), which belong to the landing look on TEST, and the armed Resume press of case 8, which runs on a scratch oculus only. `npm run test:quick` passed every command and took 97.3 s against its 45.0 s limit (its last lines say "over the time limit"; other worktrees were running suites).

## Open items of the state file

Copied from `tools/oculus/.scratch/migration/orchestrator-state.md` in the main checkout at the moment of writing (`awk` over the section from line 221 on, saved at `$TMPDIR/d47/open-items.txt`):

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

- 27. The hub's `network/events.yml` fails its own schema since your commit f28e137f1: the entry "Research visit - Linkoping (Sweden)" (`entries[2]`, line 47) lost its `status: planned` line, and the file's `schema:` block (line 9) marks `status` as `required: true`. The landing gate's `tests/checks/config/integrity.test.ts` "validates with no findings" fails on it with "key entries[2].status is required", on main as on D41 (D41 changes no file under `network/` and no schema). (a) Recommended: put a status back on the entry; `planned` is what it held, and every other entry carries one. (b) Make `status` optional in the file's `schema:` block, so a dated entry may carry none. (c) Leave it, which keeps the integrity check red at every landing; this is the lazy option. Both files are yours, so I change neither until you rule. D41 lands with this red line named as main's, not D41's.
```

D47 touches nothing it names.

## What this round changed

1. `src/lib/state/workbench/layout/saved/migrate.ts` (96 lines): a view is looked up in `RETIRED` through `successorOf(view)`, which answers `Object.hasOwn(RETIRED, view) ? RETIRED[view] : undefined`; both places that read `RETIRED` (the "pane holds a retired tab" test and the per-tab lookup) call it. A saved tab whose view is `constructor`, `toString` or `hasOwnProperty` reads back as it was saved. New G29 row 'tabs named like inherited object properties are read as they were saved' (a `constructor` tab and a `hasOwnProperty` tab, `active` the second).
2. `tests/state/workbench/layout/saved/layout-saved.test.ts` (145 lines) lines 1-4: head comment says the older envelope is read by migration, a workbench of two trees and a docked panel opens as the one tree a page now is, a tab of a retired view (`changes`, `agents`) is carried to its successor or dropped where a tab of the successor already holds the pane, and every other tab is kept.
3. Same file: `describe('a saved tab of a retired view (changes, agents)', ...)`.
4. Case 19 ruling applied (see the cases table).
5. `src/lib/state/workbench/layout/saved/saved.ts` lines 554-558: the four lines of the base paragraph are unchanged word for word, including "the rest of the arrangement is still the one the viewer left."; one sentence is appended after them: "A saved `changes` or `agents` tab is carried to a `session-detail` tab by the same step."
6. The `config` carry is kept as built; its before and after is in the list of visible changes.
7. The list of visible changes is rewritten (item 7 of the round brief); the checks moved to "For the look".
8. Every scratch run is quoted with its command and scratch file.

## The cases' first run (unchanged tree) and after

Scratch files, all under `$TMPDIR` (here `/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T`), kept there until the review of this round:

- `$TMPDIR/d47/cases.test.ts` and `$TMPDIR/d47/render.test.ts` with `$TMPDIR/d47/vitest.config.mts`: the changed tree.
- `$TMPDIR/d47-base-cases/cases.test.ts` with `$TMPDIR/d47-base-cases/vitest.config.mts`: the same cases, with the import paths pointing at the unchanged tree.
- `$TMPDIR/d47-base-run`: a copy of `.agents/worktrees/D47-base/tools/oculus` with `node_modules` linked to the worktree's (`diff -rq` of its `src`, `tests` and `config` against the base copy lists only `tests/state/workbench/layout/saved/layout-saved.test.ts`, which holds the round's test file; `config/local.yml` excluded).

Commands (from the directory named, node from `$HOME/.nvm/versions/node/v24.21.0/bin`):

```
# changed tree; output lines in $TMPDIR/d47/out.log, run log $TMPDIR/d47/run-changed-round1.log
cd .agents/worktrees/D47/tools/oculus && npx vitest run --config $TMPDIR/d47/vitest.config.mts
  -> Test Files  2 passed (2) / Tests  7 passed (7) / exit 0
# unchanged tree; output lines in $TMPDIR/d47-base-cases/out.log, run log $TMPDIR/d47/run-base-round1.log
cd $TMPDIR/d47-base-run && npx vitest run --config $TMPDIR/d47-base-cases/vitest.config.mts
  -> Test Files  1 passed (1) / Tests  6 passed (6) / exit 0
```

(The first run before any edit is in `$TMPDIR/d47/out-first.log`, produced by the same `cases.test.ts` and the same config run in the worktree before the first change; the output below is the rerun on the unchanged-tree copy, the same lines.)

Case 19 ruling (round 1 item 4). Case 19 is run over a storage holding both `LAYOUT_KEY` (a version 2 envelope) and `PREVIOUS_KEY`, since with `PREVIOUS_KEY` alone `load.ts:109` (`if (parsed !== null && previous !== null && parseWorkbench(raw) !== null)`) does not use the previous workbench and loads the default page on the unchanged tree and on the changed one. The expected result is the brief's: the pre-pages workbench's `changes` tab reads back as a Session tab. Both storages were run on both trees by the commands above (the `19 only previous` and `19 previous and layout` lines below).

Output as printed, unchanged tree (`$TMPDIR/d47-base-cases/out.log`):

```
CASE 1 sessions tabs [["session-list","{}"],["terminal","{}"],["transcript","{}"],["timeline","{}"],["session-detail","{}"],["changes","{}"],["agents","{}"],["files","{\"follow\":true}"]]
CASE 4 after pick {"session":"b","label":"B"}
CASE 4 after unpin {}
CASE 4 after pin {"session":"c","label":"C"}
CASE 4 other tab {"closed":["agents"]}
CASE 9 old arrangement [{"id":"t1","view":"session-detail","state":null},{"id":"t2","view":"changes","state":null},{"id":"t3","view":"agents","state":null},{"id":"t4","view":"files","state":{"follow":true}}]
CASE 9 active "t3"
CASE 10 [{"id":"c1","view":"changes","state":{"session":"A","label":"a"}},{"id":"s1","view":"session-detail","state":{"session":"B","label":"b"}}]
CASE 10 active "c1"
CASE 11 [{"id":"g1","view":"agents","state":{"session":"A","label":"a"}}]
CASE 12 [{"id":"a1","view":"projects","state":null},{"id":"a2","view":"session-detail","state":{"session":"A","label":"a"}}]
CASE 18 [{"id":"c1","view":"changes","state":{"session":"A","label":"a"}},{"id":"g1","view":"agents","state":{"session":"A","label":"a"}}]
CASE 18 active "g1"
CASE 13 SESSION_VIEWS ["session-list","session-detail","timeline","changes","agents"]
CASE 14 sessions group [["agents","sessions.view_agents",6],["changes","sessions.view_changes",5],["session-detail","sessions.detail_title",4],["session-list","sessions.rail_title",0],["terminal","sessions.view_terminal",1],["timeline","sessions.view_timeline",3],["transcript","sessions.view_transcript",2]]
CASE 14 changes or agents ["agents","changes"]
CASE 21 chord ["m",["session-list","terminal","transcript","timeline","session-detail","changes","agents"]]
CASE 19 only previous {"restored":false,"pages":[["Page 1",["status"]]]}
CASE 19 previous and layout {"restored":true,"pages":[["Page 1",["changes","config"]],["Sessions",["changes","settings"]]]}
CASE CFG two config tabs {"tabs":[{"id":"k1","view":"settings","state":null},{"id":"k2","view":"settings","state":null}],"active":"k2"}
CASE PROTO constructor {"tabs":[{"id":"k1","view":"constructor","state":null}],"active":"k1"}
CASE PROTO toString {"tabs":[{"id":"k1","view":"toString","state":null}],"active":"k1"}
CASE PROTO hasOwnProperty {"tabs":[{"id":"k1","view":"hasOwnProperty","state":null}],"active":"k1"}
```

Output as printed, changed tree (`$TMPDIR/d47/out.log`):

```
RENDER all open order ["details","changes","agents"]
RENDER all open has details/kv, touched, repo, agents rows [true,true,true,true]
RENDER changes closed order ["agents","details","changes"]
RENDER changes closed has kv, touched, repo, agents rows [true,false,false,true]
RENDER agents closed rows [false,true]
RENDER no session [[],false]
RENDER broken state ["agents","details","changes"]
RENDER count heads []
CASE 1 sessions tabs [["session-list","{}"],["terminal","{}"],["transcript","{}"],["timeline","{}"],["session-detail","{}"],["files","{\"follow\":true}"]]
CASE 4 after pick {"session":"b","label":"B","closed":["changes"],"sections":["agents","details","changes"]}
CASE 4 after unpin {"closed":["changes"],"sections":["agents","details","changes"]}
CASE 4 after pin {"closed":["changes"],"sections":["agents","details","changes"],"session":"c","label":"C"}
CASE 4 other tab {"closed":["agents"]}
CASE 9 old arrangement [{"id":"t1","view":"session-detail","state":null},{"id":"t4","view":"files","state":{"follow":true}}]
CASE 9 active "t1"
CASE 10 [{"id":"c1","view":"session-detail","state":{"session":"A","label":"a"}},{"id":"s1","view":"session-detail","state":{"session":"B","label":"b"}}]
CASE 10 active "c1"
CASE 11 [{"id":"g1","view":"session-detail","state":{"session":"A","label":"a"}}]
CASE 12 [{"id":"a1","view":"projects","state":null},{"id":"a2","view":"session-detail","state":{"session":"A","label":"a"}}]
CASE 18 [{"id":"c1","view":"session-detail","state":{"session":"A","label":"a"}}]
CASE 18 active "c1"
CASE 13 SESSION_VIEWS ["session-list","session-detail","timeline"]
CASE 14 sessions group [["session-detail","sessions.detail_title",4],["session-list","sessions.rail_title",0],["terminal","sessions.view_terminal",1],["timeline","sessions.view_timeline",3],["transcript","sessions.view_transcript",2]]
CASE 14 changes or agents []
CASE 21 chord ["m",["session-list","terminal","transcript","timeline","session-detail"]]
CASE 19 only previous {"restored":false,"pages":[["Page 1",["status"]]]}
CASE 19 previous and layout {"restored":true,"pages":[["Page 1",["session-detail","settings"]],["Sessions",["session-detail","settings"]]]}
CASE CFG two config tabs {"tabs":[{"id":"k1","view":"settings","state":null}],"active":"k1"}
CASE PROTO constructor {"tabs":[{"id":"k1","view":"constructor","state":null}],"active":"k1"}
CASE PROTO toString {"tabs":[{"id":"k1","view":"toString","state":null}],"active":"k1"}
CASE PROTO hasOwnProperty {"tabs":[{"id":"k1","view":"hasOwnProperty","state":null}],"active":"k1"}
```

(`RENDER count heads []` comes from a regex that misses Svelte's class suffix on `<span class="count svelte-...">`; `$TMPDIR/d47/all.html`, the rendered page of the same run, holds that span with the counts 2 and 2, Details none, as the refuter found.)

The cases, each with its checking command or reading and its result on the unchanged tree, then after the change:

| # | Case | Unchanged tree | After the change |
|---|---|---|---|
| 1 | Sessions page from its arrangement | `CASE 1` above: tabs Session, Changes, Agents and Files; `npx vitest run tests/checks/config/arrangements.test.ts` passes on both trees, so proves nothing here | `CASE 1` above: Session and Files, no Changes or Agents tab; `RENDER all open order ["details","changes","agents"]`; arrangements test in the table below |
| 2 | One pick, three sections | Read: `session-detail/SessionDetail.svelte:76`, `changes/Changes.svelte:46`, `agents/Agents.svelte:53` each call `sessionFor(instance.id)`, and `<SessionPicker>` is drawn at `SessionDetail.svelte:252`, `Changes.svelte:147`, `Agents.svelte:109` (found by `grep -n` over the three files) | `grep -n` over `session-detail/`: one `<SessionPicker instance={instance.id} />` at `SessionDetail.svelte:111` and one `sessionFor(` at `:61`; its `record` goes to `DetailsBody`, `ChangesTouched`, `ChangesRepository`, `AgentRows`. The pick on the page: the look |
| 3 | No session | Read: `<PickSession>` at `SessionDetail.svelte:264`, `Changes.svelte:154`, `Agents.svelte:116` | `RENDER no session [[],false]`; `<PickSession>` at `SessionDetail.svelte:123` |
| 4 | Closed list kept over pick, pin, unpin | `CASE 4` above: `after pick {"session":"b","label":"B"}`, `after unpin {}`; closed and order lost | `CASE 4` above: `closed` and `sections` kept through all three; `other tab {"closed":["agents"]}` keeps its own. The reload and the tab move: the look |
| 5 | Drag Agents above Details, Alt+Up | Read: the view has no sections | `SessionDetail.svelte:70-75` makes the drag over `order`, `write` calls `restateInstance(instance.id, sectionsOrdered(saved, next))`; `RENDER changes closed order ["agents","details","changes"]` is a kept order drawn; `RENDER broken state ["agents","details","changes"]`. The drag and the keys: the look |
| 6 | Changes shapes and writes | Read: shape chain `Changes.svelte:157-181` (`unplaced` at 157, `failed` at 176), `<AskConfirm>` at `:215` | Read: `ChangesRepository.svelte:130-159` (`unplaced`, `missing`, `none`, `failed`, `reading`, readable), `<AskConfirm>` at `:186`; `ChangesRepo.svelte` differs from the base by its head comment and `SharedMark`. The presses and the shapes TEST cannot stage: the look |
| 7 | Timer and listing while closed | Read: `Agents.svelte:66` `setInterval`, `Changes.svelte:74` `gate.due` | `AgentRows.svelte:45` `setInterval`, `ChangesRepository.svelte:58` `gate.due`; `RENDER changes closed has kv, touched, repo, agents rows [true,false,false,true]`, `RENDER agents closed rows [false,true]`. The ticking and the request count: the look |
| 8 | Details controls and toolbar | Read: `pin('transcript')` `:227`, `pin('timeline')` `:233`, `pin('changes')` `:239`, `pin('agents')` `:245` | `grep -n "pin('"` over `SessionDetail.svelte`: `:98` transcript and `:104` timeline only; the controls are in `DetailsBody.svelte`. Presses: the look; the armed Resume run: scratch oculus only, not run |
| 9 | Old Sessions arrangement saved | `CASE 9` above: four tabs, active `t3` | `CASE 9` above: `t1` and `t4`, active `t1`; G29 row 1 |
| 10 | Changes pinned A beside Session pinned B | `CASE 10` above: `changes` A and `session-detail` B | `CASE 10` above: both `session-detail`, active `c1`; G29 row 2 |
| 11 | Agents alone | `CASE 11` above: `agents` | `CASE 11` above: `session-detail` with its pin; G29 rows 3 and 4 (pane and float) |
| 12 | No retired tab | `CASE 12` above | `CASE 12` above, identical; G29 row 5 |
| 13 | `SESSION_VIEWS` | `CASE 13` above: five views | `CASE 13` above: three views |
| 14 | Views catalogue | `CASE 14` above: `agents` (6) and `changes` (5) in the sessions group | `CASE 14` above: neither; the palette's view commands come from the same registry (read, not run) |
| 15 | Files view sections | not run | `Section.svelte` and `list-drag.svelte.ts` moved, importers follow; `svelte-check` and the boundaries test pass (table below). Drawing, dragging, moving: the look |
| 16 | Narrow pane | not run | the look |
| 17 | Keyboard | not run | Read: one `<TreeView>` per section (`SessionSection.svelte:49`), rows are level-2 tree items. Tab order and typing in Details: the look |
| 18 | Changes and Agents of one pin, no Session tab | `CASE 18` above: both stay, active `g1` | `CASE 18` above: one `session-detail` tab, active `c1`; G29 row 7 |
| 19 | Workbench held before pages | ruling above; `CASE 19 previous and layout` above: `changes`, `config` | `CASE 19 previous and layout` above: `session-detail`, `settings` on both pages |
| 20 | Transcript and Timeline | `CASE 14` above: registered, orders 2 and 3 | `CASE 14` above: still registered, toolbar `pin('transcript')`, `pin('timeline')`; `config/layout.yml:64` unchanged. The buttons on the page: the look |
| 21 | Chords | `CASE 21` above: m1 to m7 | `CASE 21` above: five views, so m1 to m5; m6 and m7 open nothing. The keys on the page: the look |

### G29: `tests/state/workbench/layout/saved/layout-saved.test.ts`, `it.each` "carries a retired view's saved tab to its successor: $name"

Seven rows: Changes and Agents beside an unpinned Session tab (case 9); a Changes tab pinned to another session than the Session tab beside it (10); an Agents tab alone in a pane and alone in a float (11); a pane with neither (12); tabs named `constructor` and `hasOwnProperty` (new this round); Changes and Agents of one pin with no Session tab (18).

Unchanged tree, with the round's test file copied into `$TMPDIR/d47-base-run`:

```
cd $TMPDIR/d47-base-run && npx vitest run tests/state/workbench/layout/saved/layout-saved.test.ts --reporter=verbose   (log: $TMPDIR/d47/g29-base-round1.log)
 Test Files  1 failed (1)
      Tests  5 failed | 3 passed (8)
```

The five that fail are the rows of cases 9, 10, 11 (pane), 11 (float) and 18, each with `AssertionError: expected { kind: 'pane', ...(2) } to deeply equal { kind: 'pane', ...(2) }` (`-   "active": "t1",` / `+   "active": "t3",` for case 9) at `layout-saved.test.ts:142:39`. The three that pass are the existing 'migrates every page, and reads which one was current', the case 12 row 'a pane holding neither view is read a...' and the new `constructor` row 'tabs named like inherited object prop...': behaviours the change preserves, which pass on the unchanged tree and after. On the unchanged tree the same input reads back as saved (`CASE PROTO constructor`, `toString`, `hasOwnProperty` in the unchanged-tree output above).

Changed tree:

```
cd .agents/worktrees/D47/tools/oculus && npx vitest run tests/state/workbench/layout/saved/layout-saved.test.ts --reporter=verbose
 Test Files  1 passed (1)
      Tests  8 passed (8)
```

The new row tests a behaviour the change preserves, as the round brief rules: it passes on the unchanged tree and on the changed tree. On the code before this round's fix, the refuter's rerun of the same input threw `TypeError: successor.carry is not a function` (its report, "Two inputs the report does not name"); I did not run that code again.

## DONE / NOT DONE

Last change of the round: `tests/state/workbench/layout/saved/layout-saved.test.ts`, then `migrate.ts` and `saved.ts` before it; the commands below ran after it.

| Item | Command | Output as printed |
|---|---|---|
| Round items 1 to 9 | read in the files named in "What this round changed" | done |
| `npm run diagrams` | `npm run diagrams` | the 18 files `docs/diagrams/layers.dot` through `docs/diagrams/writes.svg` listed; `diagrams exit 0` |
| `npm run test:quick` | `npm run test:quick` (log `$TMPDIR/d47/verify1.log`) | `test:quick: 51 changed file(s), from git since HEAD` / `test:quick: 17 test file(s), 10 essential` / `ok      prettier (13.5 s): All matched files use Prettier code style!` / `ok      ASCII gate (20.7 s)` / `ok      svelte-kit sync (36.2 s): See https://rolldown.rs/reference/InputOptions.checks#plugintimings for more details.` / `ok      vitest (73.0 s): Duration  45.78s (transform 132.09s, setup 0ms, import 155.02s, tests 8.02s, environment 5ms)` / `ok      eslint (74.0 s)` / `ok      svelte-check (60.1 s): 1791553430521 COMPLETED 444 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` / `test:quick: 97.3 s (limit 45.0 s); every command passed` / `test:quick: over the time limit` / `test:quick exit 0` |
| Brief Verify 2 | `npx vitest run tests/state/workbench/layout/saved/layout-saved.test.ts tests/state/workbench/layout/saved/layout-unread.test.ts tests/checks/config/arrangements.test.ts tests/checks/source/keys.test.ts tests/checks/config/config-folder.test.ts tests/checks/config/config.test.ts tests/checks/tree/boundaries.test.ts tests/checks/tree/duplication.test.ts tests/checks/tree/size.test.ts --testTimeout 0 --hookTimeout 0 --reporter=dot` | ` Test Files  9 passed (9)` / `      Tests  126 passed (126)`. The brief's form without the two timeout flags times out at 5000 ms in the tree checks under machine load, as the refuter found; the flags are those `npm run test:checks` uses |
| Tree checks | `npm run test:checks -- --reporter=dot` | ` Test Files  17 passed (17)` / `      Tests  248 passed (248)` |
| Folder sizes | `sh utils/folder-check.sh; echo "folder-check exit $?"` | `folder-check exit 0` |
| Unused exports | `sh utils/unused-exports.sh > $TMPDIR/d47/unused-round1.txt`, then `diff` against `.agents/worktrees/D47-base/tools/oculus/unused-exports.txt` | 364 lines; `unused identical to base` |
| ASCII gate | the spec's `LC_ALL=C perl -ne 'my $l = $_; $l =~ s/\xC3[\x80-\xBF]//g if $ARGV =~ m{^config/}; print "$ARGV:$.:$_" if $l =~ /[^\x20-\x7E\n]/; close ARGV if eof' $(find src tests config -type f ! -name local.yml)` from `tools/oculus` (`bin` does not exist in this tree) | prints nothing; `gate exit 0` |
| ASCII of this report | `LC_ALL=C grep -n '[^ -~]'` over this file | prints nothing |
| History words in comments added or changed this round | read: `successorOf`'s doc comment, the appended sentence in `saved.ts`, the test file's head comment and its describe and row titles | none compares with an earlier state of the code; the base words "still the one the viewer left" in `saved.ts` are the ones item 5 keeps |

What the green results do not cover: `test:quick` runs the 17 test files its selection names, not `tests/checks` (run separately above) nor the landing list (`npm run test:landing`, once at landing on main); no check runs the page.

## Terms

No glossary (`ls tools/oculus/docs` holds none).

## Files (`wc -l` after the last change)

`src/lib/views/sessions/session-detail/` (9 items): `SessionDetail.svelte` 192, `SessionSection.svelte` 56, `DetailsBody.svelte` 417, `ChangesRepository.svelte` 212, `ChangesRepo.svelte` 162, `ChangesTouched.svelte` 93, `AgentRows.svelte` 130, `SharedMark.svelte` 26, `session-sections.ts` 55. Removed: `views/sessions/changes/` (240 + 171 + 144 lines in the base) and `views/sessions/agents/Agents.svelte` (190 in the base).

`src/lib/views/shared/explorer/sections/`: `Section.svelte` 75 and `list-drag.svelte.ts` 173 (moved; import-only edits in `Files.svelte` and eight files under `sources/files/sections/`).

Other edited files: `src/lib/state/workbench/layout/saved/migrate.ts` 96, `saved.ts` 703, `load.ts` 137, `src/lib/state/workbench/layout/instances.ts` 412, `src/lib/views/shared/card/card.ts` 130, `tests/state/workbench/layout/saved/layout-saved.test.ts` 145, `src/lib/state/sources/repositories/answers.ts` (comment), `tests/checks/tree/allow-duplication.txt` (one line removed), config (`layout.yml`, `catalogs/glyphs.yml`, `catalogs/icons.yml`, `text/app.yml`, `text/views/sessions/{session-detail,changes,agents}.yml`), docs (`HELP.md`, `docs/views.md`, `DESIGN.md`, `docs/diagrams/{layers,layer-views}.{dot,svg}` regenerated).

Paths outside the brief's write list, each needed: `config/behavior.yml:257` and `config/catalogs/options.yml:832` (each said "The Changes view asks this model"); the comment in `saved.ts` (lines 554-558); the head comments of the two moved files; `DESIGN.md` `ViewId` and the Agents file path. The orchestrator records `config/behavior.yml` and `config/catalogs/options.yml` as shared paths (round brief, "Not sent").

## Every control, row, state and sentence of the three old views, and where it now is

Session detail (all in `DetailsBody.svelte`, Details section): the key-value block, every field and its tooltip; Pin select; Title input with set and clear buttons; Resume (armed, then run) and the "still running" line; Open Transcript; the outcome line; the context meter and its number; the tokens line; the cache line. Its Transcript and Timeline toolbar buttons stay in `SessionDetail.svelte`; the Changes and Agents buttons go, as the brief says. The bar's `SessionPicker` is the Session view's one picker.

Changes: the touched files (`ChangesTouched.svelte`: sub-heading "Touched by this session", the empty line, one row per file with name, folder, the "also open" mark and its tooltip, tool verb, count, whole path as the tooltip); the repository shapes with their sentences, the branch menu, new-branch field, commit box, change groups, Stage, Unstage, Discard, group acts, Mark Resolved, Open File, row opening its diff, the busy line with Cancel, the outcome line, the `AskConfirm` for discard, discard all, branch switch and branch create (`ChangesRepository.svelte`, `ChangesRepo.svelte`).

Agents (`AgentRows.svelte`): one row per agent newest first with status dot, kind, model, description (tooltip) and the right-hand status, time, chars and tokens; the one-second timer while a row runs; the empty sentence.

States: the title draft, the armed Resume and the outcome (Details body); the typed branch name, the pending question and the branch list (Changes repository). Each lasts while its section is open (see the list of visible changes, items 7 and 8).

The Changes count of the sub-heading is now the count on the Changes head; the two pane titles and the three bar labels are gone with their views.

## Paragraphs and head comments of "What is on the tree"

- `answers.ts:2`: rewritten ("the Changes section").
- Still true: "the Changes panel" in `ChangeGroups.svelte:2`, `repositories.ts:13` and `:768`, `repo-shape.ts:3`, `Repo.svelte:21` and `:258`, `DESIGN.md:571`, `ChangeCounts.svelte:3`, `ChangeRow.svelte:15`, `change-actions.ts:1`, `CommitBox.svelte:11`, `repositories.svelte.ts:7`, `Controls.svelte:4`, `docs/source-control.md:23`, `DESIGN.md:472`, `config/behavior.yml:11` and `config/catalogs/options.yml:212` ("session detail meter").
- Rewritten: `DESIGN.md:225` and `:456`; `HELP.md:43`, `:134`, and `:138-139` (rows removed); `docs/views.md` (`## Session` rewritten, `## Changes` and `## Agents` removed with their content taken in); `config/text/app.yml:13` (`m1-m5`); the text files' head comments; `config/behavior.yml:257`; `config/catalogs/options.yml:832`.
- Head comments: `migrate.ts`, `Section.svelte`, `list-drag.svelte.ts`, `ChangesRepo.svelte` rewritten; `load.ts` new comment; `instances.ts` `pinInstance` and `unpinInstance` doc comments rewritten; the `saved.ts` paragraph at lines 554-558 keeps its base words and gains one sentence (round item 5); `Files.svelte`, `Sections.svelte` and the Files section partials: imports only, head comments still true.
- `grep -rn "list-drag\|/Section.svelte" src tests docs *.md` over the changed tree (run in the previous round; no file of that grep changed since except `migrate.ts`, `saved.ts` and the test file, none of which names them): every hit is the shared path `views/shared/explorer/sections/` except `views/academic/present/Slide.svelte:13`, which imports its own `./parts/Section.svelte`.

## Judgment calls the brief left open

1. One generic `SessionSection.svelte` (a `TreeView` plus the shared head) used three times; bodies `DetailsBody`, `ChangesTouched` with `ChangesRepository`, `AgentRows`. A body is drawn only while its section is open, which stops the timer and the git listing. Internal, reversible.
2. Touched files and agents are `TreeItem` rows of the section's tree; the repository part (shapes, commit box, groups) stays as non-row markup in an `li` under the rows. Reversible.
3. The `sections` and `closed` keys hold the ids `details`, `changes`, `agents` in the tab's layout state; a name that is no section, a repeat, or a value that is no list is read as absent (`session-sections.ts`).
4. The drag type string is `application/x-oculus-session-section`.
5. The 9-line clone between `ChangesRepo` and `ChangesTouched` is folded into `SharedMark.svelte`, and its `allow-duplication.txt` line removed.
6. `unpinInstance` keeps the tab's other state by removing only `session` and `label`; `pinInstance` spreads the existing state. Both apply to every view that uses `SessionPicker` (Transcript and Timeline too).
7. The sub-headings "Touched by this session" and "The repository" stay inside the Changes body.
8. `successorOf` is one function over `RETIRED` used at both places that read it, rather than `Object.hasOwn` repeated at each.
9. The G29 `constructor` row uses two inherited names (`constructor`, `hasOwnProperty`) in one pane; `toString` runs in the scratch case only.

## Host- or user-visible changes, before and after

1. Sessions page right pane: before, tabs Session, Changes, Agents, Files; after, Session and Files. The Session tab shows Details, Changes, Agents, all open, each with a head; Changes and Agents carry a count.
2. Section heads: open and close on press, drag over each other, Alt+Up and Alt+Down on a focused head; the closed list and the order are kept in the tab through reload, tab switch, pick, pin and unpin (`CASE 4` above); a second Session tab has its own.
3. Toolbar of a pinned Session tab: before, Transcript, Timeline, Changes, Agents; after, Transcript and Timeline.
4. Keys `m6` and `m7`: before, Changes and Agents; after, they open nothing; the key sheet and HELP say `m1-m5`.
5. A saved `changes` or `agents` tab (in a layout, a float, or the pre-pages workbench) opens as a Session tab with its id and pin; beside a Session tab of the same pin it is dropped (`CASE 9`, `10`, `11`, `18`, `19`).
6. A pane holding two `config` tabs and no `settings` tab: before, it read back as two `settings` tabs (`CASE CFG`, unchanged tree: `"tabs":[{"id":"k1",...},{"id":"k2",...}],"active":"k2"`); after, one `settings` tab, `active` `k1` (`CASE CFG`, changed tree). It follows from the carry rule "a tab carried earlier in the same pane included".
7. (i) Closing a section discards its local state: the Details title draft, an armed Resume and its outcome line, the Changes branch name and branch list. Before, each lasted as long as the tab.
8. (ii) A pending Discard or branch question goes when the shown session is dismissed. Before, `AskConfirm` sat outside `{#if record === null}` in `Changes.svelte` and stayed.
9. (iii) The "Touched by this session" sub-heading loses its count and its bottom rule (`border-bottom: 1px solid var(--line)` in the base `ChangesTouched.svelte`, line 85); the `gap: 12px` between the blocks (base `Changes.svelte:221`) is gone and the space between the touched block and the repository block is the repository block's `padding: 4px 6px 6px` (`ChangesRepository.svelte:193`).
10. (iv) Touched-file and agent rows are focusable tree items with accessible names (the absolute path of a touched file; the kind and description of an agent), and each section is a `role="tree"` named Details, Changes or Agents. Before, those rows carried no role, tab stop or label (`grep -n "role=\|tabindex\|aria-label\|<button"` over the base `ChangesTouched.svelte` and `Agents.svelte` prints nothing).
11. (v) The Settings help text of `git.message_model` changes words (`config/catalogs/options.yml:832`): before "The model the Changes view asks for a suggested commit message. Empty uses the command line's own default model.", after "The model the Changes section of the Session view asks for a suggested commit message. Empty uses the command line's own default model.".
12. Rows: a touched row's tool verb and count, which started at one x in every row (a grid), are at the row's right edge; an agent row's status dot sits inline before the kind.

### For the look

- The Discard and branch questions open over the tab; the dialog draws through the modal portal.
- The Details inputs take typing without the tree's type-ahead moving the focus.
- Light and dark themes; a 200 px pane.
- The section drag and Alt+Up and Alt+Down; a closed section's timer and listing at rest (case 7); the Files view's sections after the move (case 15).
- The armed Resume press (case 8) on a scratch oculus.

## Anything in the brief that was wrong or impossible

- Case 19 as worded (`PREVIOUS_KEY` alone) cannot reach the carry: `load.ts:109` uses the previous workbench only beside a version 2 `LAYOUT_KEY` (`CASE 19 only previous` on both trees: the default page). The orchestrator's ruling (both keys) is applied above.
- The brief's write list lacked `config/behavior.yml`, `config/catalogs/options.yml` and the comment in `saved.ts`; each held a sentence the change made false and is named under "Files".
- `npx vitest run tests/checks/...` without `--testTimeout 0 --hookTimeout 0` times out at 5000 ms in `config-folder`, `boundaries`, `size` and `keys` under machine load; the quoted runs use the flags.
- A pre-pages workbench saved under `PREVIOUS_KEY` with no `LAYOUT_KEY` is discarded on load (existing behaviour, unchanged by this step).
