# Step D48 refuter report (on .agents/worktrees/D48, base 40059354d)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

One departure of my own comes first, because it changes what you know about machine load. I ran `sh utils/scratch-count.sh` to reproduce the report's `node before 0` / `node after 0` line. That script runs `npm test`, which is the whole unit suite, and my brief forbade running it. It printed `node before 0`, `node after 0` and exited 0. Nothing in any tree was changed by it. `git status --short` gives 67 lines both before and after the review.

## Verification (rerun by the reviewer)

All commands were run from `.agents/worktrees/D48/tools/oculus`, with PATH holding node v24.21.0. The load average was about 18 during the runs (`uptime`: `load averages: 18.50 14.43 14.03`).

```
npm run test:quick -- --base 40059354d          (first run, 16:17)
 Test Files  1 failed | 114 passed | 3 skipped (118)
      Tests  1 failed | 975 passed | 29 skipped (1005)
test:quick: 105.6 s (limit 45.0 s); failed: vitest
test:quick: over the time limit
  (the one failure: tests/server/machine/lsp/servers.test.ts:74, a file the step does not change)
npx vitest run tests/server/machine/lsp/servers.test.ts
 Test Files  1 passed (1)
      Tests  6 passed (6)

npm run test:quick -- --base 40059354d          (second run, saved in full)
test:quick: 67 changed file(s), from git since 40059354d
test:quick: 118 test file(s), 10 essential
ok      prettier (0.7 s): All matched files use Prettier code style!
ok      ASCII gate (0.8 s)
ok      svelte-kit sync (2.7 s)
ok      eslint (2.7 s)
ok      svelte-check (9.3 s): 1791555554960 COMPLETED 441 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (40.7 s): Duration  34.65s (transform 28.84s, setup 0ms, import 54.32s, tests 78.23s, environment 1.00s)
test:quick: 41.8 s (limit 45.0 s); every command passed
quick-exit 0

npx vitest run <the brief's eleven files>       (default 5 s timeout)
 Test Files  1 failed | 10 passed (11)
      Tests  1 failed | 147 passed (148)
  (timeouts at 5000ms in tests/checks/tree/size.test.ts (two tests) and tests/checks/source/keys.test.ts (one); these are load timeouts)
npx vitest run <the brief's eleven files> --testTimeout 0     (the form the report quotes)
 Test Files  11 passed (11)
      Tests  148 passed (148)

npx vitest run tests/server/edit/writes.test.ts -t 'ticks and reopens'
 Test Files  1 passed (1)
      Tests  1 passed | 12 skipped (13)
npx vitest run --tagsFilter slow tests/server/edit/writes.test.ts tests/routes/edit/undo/undo.test.ts tests/server/git/deposit.test.ts tests/server/core/changes.test.ts --testTimeout 20000
 Test Files  4 passed (4)
      Tests  14 passed | 23 skipped (37)
  (includes 'side:idea: ticks, reopens and takes out a line', 'root:r: ...', both undo rows and both new changes.test.ts rows)

npx vitest run tests/checks --testTimeout 0 --hookTimeout 0
checks-exit 0
 Test Files  17 passed (17)
      Tests  248 passed (248)

ASCII gate (the perl command of agents/spec.md, verbatim)
bfs: error: bin: No such file or directory.
perl exit 0
LC_ALL=C grep -n '[^ -~]' DESIGN.md HELP.md docs/apps.md docs/views.md docs/configuration.md utils/diagrams/writes.mjs <report>
grep exit 1   (nothing printed)

sh utils/folder-check.sh                        folder-check exit 0
ls src/lib/state/boards/board | wc -l           10
ls src/lib/data/snapshot | wc -l                10
wc -l: normalise-plans.ts 77, side-lines.ts 75, ticker-lines.ts 178, ticker.ts 521, model-entities.ts 836, deposit.ts 875, writes/manifest.ts 609, Personal.svelte 295

sh utils/unused-exports.sh vs D48-base/tools/oculus/unused-exports.txt: 364 lines each; diff:
11c11  normalise.ts loses "followups, subtasks"
51c51  writes.ts loses "insideHub" (checked name by name: the only difference)
no line added

python3 yaml.safe_load: ok for options.yml, vocab.yml, side-project-schema.yml, sources.yml, findings.yml, focus.yml, personal.yml

npx prettier --check .                          All matched files use Prettier code style!
npx eslint .                                    eslint exit 0, no output

history-word grep over every added line and the three new files: only descriptive hits (help text "the date before which", "still hide it"; code `before:` fields)

Builder's scratch runs, changed tree (npx vitest run --config $TMPDIR/d48/vitest.scratch.config.mts):
 reproduces the report's "after" lines for cases 1 to 12, 15 and 16, for example:
 CASE1 problems []
 CASE2 findings: "deadline: deadline is not text ...", "pin: pin is not true or false ...", "subtasks: subtasks is not a map or a list of lines ...", "venue: key venue is not a field of the side-project schema and is not read", "waiting-on: waiting-on is not a list of text ..."
 CASE4 side manifest with eleven research-shaped values: valid=true; with venue: valid=false ["additionalProperties:venue"]
 TICKER deadlines: ["side|dl|days=10|..."]; overdue: ["side|Deadline past|days=-5|..."]; the 120-day and parked projects give no line
 CASE5 openLine calls ["onfile:{...side-projects/dl10/project.yml...}","onproject:proj-a"]; categoryLabel side -> "side projects"
 CASE6 runHeading ["side projects","other","funding"]
 WAITING people [{"label":"Alice","count":1}]
 CASE9/10/11 lines as quoted in the report; CASE16 adds hub:side-projects/idea/project.yml:2:16 and :3:13
 1 failed: first9.scratch.ts, the unchanged-tree probe that calls the old writer signature ("sides.find is not a function"); expected on the changed tree

Builder's scratch runs, unchanged copy ($TMPDIR/d48/before/cfg.mts):
 Test Files  7 passed (7); reproduces the report's first-run lines (CASE1 eleven key findings, CASE4 valid=false, TICKER no side lines, WAITING people [], CASE9 found:false for side:alpha and root:r)

New test rows on the unchanged copy ($TMPDIR/d48/unchanged/oculus):
npx vitest run tests/server/core/changes.test.ts tests/data/snapshot/references.test.ts tests/server/edit/writes.test.ts tests/routes/edit/undo/undo.test.ts --testTimeout 0
 Test Files  4 failed (4)
      Tests  11 failed | 59 passed (70)
 (the same eleven titles the report lists)

Reviewer scratch run for case 13's state functions (file in my scratchpad, not in any tree):
ORDER ["side:z:running","side:b:running","side:a:parked"]     (pinned first within its status)
LINKS collaborators [{"id":"alice","label":"Alice A"}], related [{"id":"proj-a","label":"pa"},{"id":"nope","label":"nope"}]
FLAMES 3 for priority high
WAIT {"kind":"people","text":"waiting on Alice A, pa"}
LIVE running=true building=true idea=true parked=false odd=true
```

Not run: `npm run diagrams`, because it writes `docs/diagrams/`. `tests/checks/diagrams/diagrams.test.ts` passed inside `tests/checks`, so the committed diagrams match the source.

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds.
  - `normalise-personal.ts` reads the eleven keys and leaves out a key the manifest does not hold (via `compact`). `followups` and `subtasks` were moved to `normalise-plans.ts` and are imported by both readers.
  - `SideProject` is a `Partial<Pick<Project, ...>>`.
  - The finding sentences are true for every field (CASE2).
  - The schema goes through the manifest translation (`sideSchema`, CASE4).
  - `fieldTypes` reads the list form.
  - The G66 references are reached (case 16 row).
  - Three findings, none of which makes the item violated: Spec 2 (the help text was changed without saying so), Spec 3 (own readers in place of `str` and `strings`) and Proof 2 (the prose read and the greps are missing from the report).
- 2: holds.
  - The `side` group, the overdue lines, follow-ups, subtasks under "side projects", snooze, `focusLabel`, `openLine` for a side line and the waiting tally all show in the scratch runs.
  - A parked side project draws no line and counts nothing (scratch runs).
  - `sideLive` reads `live` from the `side_project_status` row.
- 3: holds.
  - Snooze, wake, tick, reopen, add and delete work on `side:` and `root:` ids (rows and scratch).
  - The lookup goes through `WriteTarget.sideProjects` and `isOwnFile`.
  - Refusals are as for a research write.
  - Undo puts the file back (undo rows).
  - The absolute path is logged for a root's file (changes.test.ts row).
  - Every caller follows (svelte-check, 0 errors).
  - Findings: Spec 4, Standards 1, Standards 2, Standards 3.
- 4: holds by reading and by my scratch run of the state functions (pin order, flames, latest line, waiting line, `CardLinks` collaborators and related headed `personal.related`). The drawing is left to the look.
- 5: holds by reading of `Ticker.svelte`:
  - row at `calc(18px * var(--text-scale, 1))`, `--fs-xs` and a 14 px line;
  - `.name`, `.plain` and `.tail.toned` at 400;
  - `.act` is border-box, `height: calc(18px * ...)`, `padding: 0 6px`, its words centred;
  - no heading CSS or `focus.yml` heading changed.
- 6: holds for every sentence the item lists. Two sentences outside that list were made false; see Standards 1 and Standards 2.
- 7: holds. `ticker.ts` 521, `model-entities.ts` 836 (D41 adds 5 lines), both folders at 10, `size.test.ts` green.

Cases of the brief's "Cases":

- 1: met. Scratch rerun on both trees.
- 2: met. Scratch rerun: five findings, each naming the type the field takes, and `venue` gives the new key sentence.
- 3: met. Scratch rerun shows equal values, and `normalise-personal.ts:23` imports from `./normalise-plans.ts`.
- 4: met. Scratch rerun on both trees.
- 5: met. Scratch rerun: one `side` line at 10 days, one overdue line, none at 120 days, none for parked. Labels under `short` and `full`, `categoryLabel('side')` gives "side projects", `openLine` calls the file opener.
- 6: met. Scratch rerun.
- 7: met. Scratch rerun.
- 8: met. Scratch rerun.
- 9: partial.
  - The behaviour is shown: eleven new rows fail on the unchanged copy (reproduced) and pass after.
  - Missing part: the rows are new `it` titles beside the tables, not rows of 'writes the changed field and nothing else' and 'ticks and reopens a line of a manifest'. `agents/guarded.md` names none of them (Spec 1).
- 10: met. The refusal rows and scratch CASE10 show not found for an unknown side id and an unserved root, the schema refusal for `venue`, and files unchanged.
- 11: met. Scratch CASE11 shows a deadline line with a `root` target and a snooze that writes `.oculus/project.yml`; the undo row for `root:r` passes.
- 12: met. Scratch WAITING shows Alice counted once (running counted, parked not).
- 13: not verifiable here for what is drawn. The order, links, flames and waiting text are settled by my scratch run. The look on a scratch oculus settles the rest: the ring, the glyph placement, the latest line, and the related tag opening a project tab.
- 14: not verifiable here. Computed heights need a layout engine. The arithmetic reading holds (button = row = 18s px at 0.7, 1 and 1.6). The look on TEST at the three scales and under Rice settles it.
- 15: met. Scratch CASE15 gives `3 projects 0 findings 0 read findings` on both trees, and `personal.test.ts` passes in the eleven-file run.
- 16: met. The references row fails on the unchanged copy (reproduced) and passes after; scratch CASE16 adds the side manifest's lines.

## 1. Spec

- `tests/server/edit/writes.test.ts:58-115`, `:132-152`; `tests/server/core/changes.test.ts:133`, `:238`; `tests/routes/edit/undo/undo.test.ts:81`.
  - Quoted: "describe('the file of a side project', ... it.each(SIDE_IDS)('%s: snoozes and wakes, changing that key of that file alone'".
  - What is wrong: case 9, as closed in the brief check ("rewritten as rows of the existing tables of G8 and G9, no new `it`, so no new title for `guarded.md`"), asks for rows of 'writes the changed field and nothing else' and 'ticks and reopens a line of a manifest'. The rules file's test rule says "A test exists only as the test of one entry of `agents/guarded.md`, and `agents/guarded.md` names it there by file and title. A builder writes no other test."
  - What is there: the builder wrote nine new titles: five in `writes.test.ts`, two in `changes.test.ts`, one `it.each` in `undo.test.ts`, and the references row. `grep -c -F` of each title in `agents/guarded.md` prints 0. The report lists this as a judgment call ("side rows are separate `it` blocks beside them"), but the brief had already taken that choice.
  - Failure scenario: G8 and G9 name tests that do not cover the side ids. A later step deletes or rewrites "unnamed" tests under the one-test-per-unit rule, and the only proof of side writes goes with them.
  - Verdict: case 9 partial.
- `config/schemas/side-project-schema.yml:20`, `:21`, `:24`, `:26`, `:27`.
  - Quoted: "{ field: pin, type: checkbox, help: "Tick to draw the card first among the cards of its status. ..." }".
  - What is wrong: item 1 says each row carries "the help text of its `manifest_schema` row". Five rows carry rewritten help (deadline, subtasks, snooze, pin, short; compare `manifest-schema.yml:38,46,61,64,80`). The research text would be false for a side project, so the rewrite is defensible. But neither the judgment calls nor the before and after section names it.
  - Failure scenario: the orchestrator reads the report as rows copied verbatim. A later sync of help text between the two schemas overwrites the side rows with sentences that are false for a side project ("Add and tick them on the project's card").
  - Verdict: none.
- `src/lib/data/snapshot/normalise-personal.ts:81-127`.
  - Quoted: "function textField(...) ... const text = readAs(textShape, value);" and "function textsField(...)".
  - What is wrong: item 1 says the keys are read "with the functions `project()` uses: `str` and `strings` from `data/helpers/guards.ts`". The builder wrote its own readers over zod shapes. For every value that is read they give the same values as `str`/`strings`, and they add the per-field finding the item also asks for. This is a substitute for a named mechanism, and the report does not mention it.
  - Failure scenario: a later change to `strings` (for example, accepting one string as a one-item list) changes research `waiting-on` and leaves side `waiting-on` reading differently, against "read by the same code".
  - Verdict: none.
- `src/lib/server/edit/writes.ts:369-375`, together with `docs/apps.md:417`.
  - Quoted: "const outcome = writeManifest(into.hub, into.config, into.sideProjects(), write.id, write.fields);"
  - What is wrong: the route serves apps too. An app approved for the `manifest` write kind can now write a side manifest, including `.oculus/project.yml` of any served repository root, which lies outside the hub. The brief's decision 3 keeps the request shape for the page's buttons, and decision 9 covers only the read map. Neither hands the builder a widening of what an approved app may write. The builder listed it as a judgment call; under the rules file it is a user-visible choice to raise.
  - Failure scenario: an app approved under the words "Edit a project's manifest." (`config/text/views/apps/apps.yml:43`) rewrites a repository's `.oculus/project.yml`, and the approval the reader gave said nothing about repositories.
  - Verdict: none. The orchestrator decides whether to raise it.

## 2. Proof

- `tests/server/edit/writes.test.ts:91`.
  - Quoted: "it('refuses a root id whose root is not among the served roots', () => { ... const kept = world.sides.filter((one) => one.id !== 'root:r');".
  - What is wrong: the title claims the unserved-root case. The body removes `root:r` from the list handed in, which is the same input class and the same branch (`sides.find(...) === undefined`, `manifest.ts:255-256`) as 'refuses an id the published portfolio does not hold', where `root:gone` is already a row. Both tests pass on the unchanged tree (reproduced: 59 passed). This one adds no outcome the other lacks. The rules file asks for "one row per input that gives a different outcome".
  - Failure scenario: a reader takes this test as proof that a root dropped from `roots:` is refused before the portfolio republishes. It proves only list membership.
  - Verdict: none.
- `.scratch/migration/agents/reviews/D48-report.md`, sections "DONE / NOT DONE" and "The listed sentences".
  - What is wrong: the report leaves out four things.
    - Verify 5's prose read ("each new or changed sentence ... read against `agents/spec.md`'s rules on prose, and each place it departs ... named") is absent.
    - The rules file's grep of each changed name (`writeManifest`'s signature, `insideHub`, `TickerItem`, `SideProject`) is not quoted.
    - The reuse grep before each new helper (`textsField`, `flagField`, `planField`, `sideLinks`, `sideLive`, `LinkedItem`, `manifestSource`, `homeOf`, `isOwnFile`, `sideSchema`) is not quoted.
    - Item 6's side-project grep output is not quoted.
  - Failure scenario: the false sentences in Standards 1 and 2 would have been found by the changed-name grep. The report gives the orchestrator no trace that it was run.
  - Verdict: none.

## 3. Standards

- `src/lib/server/edit/writes/manifest.ts:4-6`.
  - Quoted: "the id names a manifest readManifests already found under the hub's own scan directories, and insideHub checks the resolved path against them again before the write. Nothing outside them is ever opened for writing."
  - What is wrong: the rules file ("A sentence in a document or a head comment that the change makes false is a defect of the change"). The step writes a root's `.oculus/project.yml` outside the hub's scan directories. The next paragraph qualifies this, but the sentence as written is now false.
  - Failure scenario: a reader auditing the write path relies on this sentence and does not check the side branch for path containment.
  - Verdict: none.
- `docs/apps.md:413`.
  - Quoted: "`write(kind, body)` asks oculus to change the hub's data."
  - What is wrong: the same rule. With rows 417 and 419 rewritten, an app's `manifest` and `subtask` writes now reach a repository root's file outside the hub.
  - Failure scenario: an app author reads the page as hub-only and does not expect writes to repositories.
  - Verdict: none.
- `src/lib/server/edit/writes/manifest.ts:265`.
  - Quoted: ": "the manifest is not the side project's own project.yml"".
  - What is wrong: the rules file ("every user-facing string from a catalog file ... An error from the engine ... is mapped to a catalog line before it is shown"). The refusal reason reaches the page through `act` (`rows.ts`, `t('editor.failed', refused)`). The research reasons beside it are literals too; this adds one more.
  - Failure scenario: the words cannot be changed from the catalog, and a translation of the catalog misses this sentence.
  - Verdict: none.
- `tests/routes/edit/write-fixture.ts:313-355` and `tests/server/edit/writes-fixture.ts:123-199`.
  - Quoted: "export const SIDE_MANIFEST =" (twice, with different contents), "const record = (id, file, source): SideProject => ({" and "function sideRecord(id, file, source): SideProject {".
  - What is wrong: the rules file's principles ("a parser, a fold or a rule exists once and is reused; before writing a helper ... grep ... and reuse what exists"). Two planting helpers build the same two side projects with two different manifests.
  - Failure scenario: a change to `SideProject`'s required fields has to be made in two fixtures, and the two manifests drift, so the write rows and the route rows test different files under the same name.
  - Verdict: none.

## 4. Behaviour

- `src/lib/views/boards/focus/Tasks.svelte:106-107` and `src/lib/views/boards/focus/CommandCenterView.svelte:88`.
  - Quoted: "{@render group(t('focus.command.dlcat_side'), t('views.personal_glyph'), view.side)}".
  - What is wrong: the Tasks band gains a fourth group headed "side projects", after Tasks. In the command center's subtasks group, side runs get their own sub-heading. The report's before and after section says only "its follow-ups and subtasks appear as for a research project". It names neither group, nor the view and state for the look to be read against, which the rules file asks of that section.
  - Failure scenario: the look on landing checks Focus for side lines among the research subtasks and treats the separate "side projects" group in the Tasks band as unexpected, or misses it.
  - Verdict: none.
- `src/lib/data/sources/config/catalog/schemas/engine.ts:101-107` and `src/lib/data/shapes/catalog-files.ts:397-413`.
  - Quoted: "fromShape('schemas/side-project-schema', sideProjectSchemaFileShape, ...)".
  - What is wrong: the YAML editor now checks `config/schemas/side-project-schema.yml` itself against a strict row shape (field, type from `MANIFEST_WIDGETS`, help, from, options, required) instead of the generic block schema. The report gives the reason (the config-folder test) but not this editor-visible change.
  - Failure scenario: a reader adds `label:` to a side row and sees it marked, with no line of the report or the docs saying so.
  - Verdict: none.

## Point-by-point answers the orchestrator asked for

**1. Files outside "Paths this step writes".** All are needed. All are the smallest change except `ticker-lines.ts`, which is justified.

- `catalog-files.ts`: needed by item 2 (the `live` flag fails the strict vocab shape otherwise) and by item 1 (the side schema file's widget words). Smallest. Unstated behaviour: Behaviour 2.
- `engine.ts`: needed, as above. Smallest.
- `hooks.ts`: needed by item 3 (`sideProjects(hub)` for `WriteTarget`). Smallest.
- `presets.ts`, `board/index.ts`, `stats.ts`: needed by item 4 to reuse `CardLinks` and `waitingLine`. Type widening only; research behaviour is unchanged (svelte-check clean).
- `CardLinks.svelte`: needed by item 4 and decision 8. Research cards draw no related row because empty kinds are skipped (`{#if kind.tags.length > 0}`).
- `side-lines.ts`: inside the list.
- `ticker-lines.ts`: not needed for size (`ticker.ts` would be about 670 lines without it). It breaks the import cycle side-lines.ts <-> ticker.ts. Justified, not the smallest.
- The fixtures `write-fixture.ts`, `writes-fixture.ts`, `audit-mute.test.ts`, `deposit.test.ts`: needed by the `WriteTarget` field and case 9. See Standards 4.
- `portfolio.ts`, `model/index.ts`, `options.yml` (line 1230, the `scan` help), `docs/configuration.md` (21, 41), `docs/apps.md` (248, 417, 419): sentences made true. These are comments and words only.
- `utils/diagrams/writes.mjs`: needed to keep `diagrams.test.ts` green after the regenerated writes diagram. It makes the port parting also cover a plain arrow that `labelsAcross` names; it does not loosen any check. Its behaviour (the port churn in `writes.dot`/`.svg`) is stated in the report. It changes how every later regeneration of the writes diagram is laid out.

**2. Rows that pass on the unchanged tree.** Two rows: 'refuses an id the published portfolio does not hold and writes nothing' and 'refuses a root id whose root is not among the served roots'.

- Both guard a refusal that the unchanged tree already gives, by a different path. The first tests what it claims.
- The second tests the same branch with the same outcome, not an unserved root as such (Proof 1).
- The brief's claim that every case 9/10 row fails first is wrong for these two, as the report says.

**3. The builder's judgment calls.**

- Research id wins over side id: left open by the brief, correctly listed. A collision needs a research folder literally named `side:<slug>` or `root:<key>`. Each side write also scans the research manifests first (`manifest.ts:243`), a cost only.
- `TickerItem.side`: internal, left open, listed.
- `focus.command.side_deadline` ("deadline in {0}d"): a visible word the brief did not name. It is correctly listed as a decision. The generic `generic_in` would have needed a `word('side')` entry, so a key was needed either way.
- No agent button on side lines: the brief already takes this. Item 3 lists the buttons, and agent is not among them.
- Manifest write kind writes side manifests: the page part follows from decision 3. The app part is a user-visible widening the brief did not hand over (Spec 4).

**4. `test:quick` time.**

- My times: 105.6 s on the first run (with an unrelated LSP flake, load about 18) and 41.8 s on the second run, every command passing, under the 45 s limit.
- The builder's 128.6 s line shows eslint 60.4 s and svelte-check 93.4 s, against my 2.7 s and 9.3 s on the same change set. That points at cold caches and machine load, not the step's files.
- The selection is 118 files because the step changes widely imported modules (`writes.ts`, `hooks.ts`, the model types). I did not measure each file's share, since `quick.mjs` has no selection-only mode.

**5. Cases 13 and 14.**

- Case 13's state functions are settled without the app, by my scratch run above: `sideCards` pin order, `sideLinks`, `flamesOf`, `waitingLine` on a side project. A string render of `Personal.svelte` in a scratch run could also show the lines are present. Only placement, ring, glyph and the press need the look.
- Case 14 needs layout. The Gallery part (no buttons) is settled by reading (`Gallery.svelte` passes no `onaction`).

**6. Files other steps in flight also write.** No D48 hunk depends on code another step changes.

- D41's `typeWritten` (model-entities 82-106, 505-510; normalise 303) touches none of the eleven fields `SideProject` picks.
- D52's `hub-names.ts` 95-107 and `normalise.ts` 514, and D46/D47/D51's `options.yml` hunks (146, 832, 857-868), sit on other lines.
- D52's `Subtasks.svelte` change is a comment and calls the client writer, not the server signatures D48 changed.
- No other worktree imports `insideHub`, `writeManifest`, `subtaskHost`, `openLine` or `TickerItem` differently from the base (grep over D41, D46, D47, D51, D52).
- Ledger inaccuracy:
  - D48's `shared_paths` describes its `options.yml` hunk as "the side_project_status description". The hunk is the `scan` help at line 1230.
  - The entry omits `portfolio.ts` (D41 589-606, D48 92) and `model/index.ts` (D41 608, D46 557, D48 147). These are different lines, so the merges are simple.
  - Once D48 lands, the `writes.mjs` change alters the port choices any later `npm run diagrams` makes; D51 regenerates `docs/diagrams/` at landing.

## Declined to judge

- Whether a dangling `related` id (no such project, drawn as its id: scratch LINKS `{"id":"nope","label":"nope"}`) should open a project tab. The brief does not say, and it is the orchestrator's call.
- What cases 13 and 14 look like on screen. They need the look.
- Whether the builder ran the first runs before any change. The scratch timestamps (14:04 for the first runs, a second "before" set at 16:05) do not settle the order.
- The brief's "Closed" section: it is in `agents/reviews/D48-brief-check.md`, not in `agents/briefs/D48.md`. Unlike D46 and D47, `plan.md`'s D48 line carries no "Step 0" line. These are ledger matters outside the diff.

Reviewer usage: agent id not known to me, served model claude-opus-5-5, about 336,000 tokens (context counter), about 75 tool uses, about 37 minutes.
