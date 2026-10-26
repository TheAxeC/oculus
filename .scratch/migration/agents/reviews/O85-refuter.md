# Step O85 refuter report (on .agents/worktrees/migration-O85, base 8d52965c)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

All from the worktree root with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`, in the foreground. Load average at the start: 5.67 11.30 16.50. `npm run diagrams` was not run (it writes into the worktree; see "Declined to judge").

```
$ npm run test:quick -- --base 8d52965c        (exit 1, 5 min 10 s)
test:quick: 60 changed file(s), from git since 8d52965c
test:quick: 131 test file(s)
ok      prettier (5.0 s): All matched files use Prettier code style!
ok      ASCII gate (5.0 s)
ok      svelte-kit sync (11.4 s)
ok      eslint (127.5 s)
ok      svelte-check (152.5 s): 1793033190659 COMPLETED 545 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (205.6 s): Duration  190.75s (transform 363.20s, setup 0ms, import 524.40s, tests 161.85s, environment 59.58s)
ok      vitest checks (210.6 s): Duration  195.29s (transform 173.41s, setup 0ms, import 430.05s, tests 259.36s, environment 2ms)
FAILED  vitest slow (297.9 s)
 Test Files  1 failed | 43 passed (44)
      Tests  2 failed | 472 passed | 79 skipped (553)
test:quick: 309.4 s; failed: vitest slow
  the two red tests, both in tests/server/machine/apps/tools/tasks.test.ts (a file the step does not change):
  "runs a shell execution and a process execution ..." Error: terminal-not-started; "runs a task again in the terminal that ended ..." Error: Test timed out in 90000ms.
$ npx vitest run tests/server/machine/apps/tools/tasks.test.ts --reporter=dot      (rerun alone)
 Test Files  1 passed (1)
      Tests  6 passed (6)

$ npx vitest run tests/server/edit/config-key.test.ts tests/server/edit/config-value.test.ts tests/routes/edit/undo/undo.test.ts tests/state/client/held-unsaved.test.ts tests/state/system/settings/ --reporter=dot      (check 2)
 Test Files  11 passed (11)
      Tests  194 passed (194)
$ npx vitest run tests/routes/edit/undo/hub-settings.test.ts tests/state/system/settings/chosen-hub.test.ts tests/checks/tree/boundaries.test.ts
 Test Files  1 failed | 2 passed (3)      (the one red line: boundaries "holds across src/lib", Test timed out in 5000ms, a tree check run under the unit time limit)
      Tests  1 failed | 29 passed (30)
$ npx vitest run tests/checks/tree/boundaries.test.ts --reporter=dot      (rerun alone)
 Test Files  1 passed (1)
      Tests  11 passed (11)
  (hub-settings.test.ts 3 + chosen-hub.test.ts 16 passed, so check 2 with the new undo file is 12 files, 197 tests, as the report quotes)

$ wc -l <every changed source and test file>      (check 3)
largest source file src/lib/state/client/writes.svelte.ts 876; largest component src/lib/views/system/workbench/Settings.svelte 510; Item.svelte 484; none over 880 or 520

check 4: judged by reading the quoted failing lines against the test lines (see "Declined to judge" for the rerun on the unchanged tree)

$ sh utils/unused-exports.sh > <scratch>/unused.txt; diff .agents/worktrees/O85-base/unused-exports.txt <scratch>/unused.txt      (check 5)
exit=0
diff=0

$ grep -rn 'Z10[0-9][0-9]\|ruling 4[0-9][0-9]\|\bO8[0-9]\b' src config docs tests --exclude=local.yml      (check 6)
exit=1 (nothing printed)

$ LC_ALL=C perl -ne '<the gate of spec.md>' <the 58 changed and new files, .scratch/ left out>      (check 7)
perl exit=0 (nothing printed)
$ LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/reviews/O85-report.md
report grep exit=1 (nothing printed)

$ grep -rn "primary hub's settings file\|primary hub's .oculus/config.yml\|primary hub's \`.oculus/config.yml\`" src config --exclude=local.yml      (check 8)
25 hits, the same files and lines the report lists under "Still true", each read: about a primary-only key, the primary's own reading, the group's line, or the new primary_only sentence

check 9: read (see Standards 3 and 4)

The report's evidence, rerun:
$ node after-run.ts .agents/worktrees/migration-O85      (rebuilt from the report's quoted source, 236 lines; config/local.yml absent from the worktree, checked with test -e)
exit=0; 125 lines; every one of the 107 output lines the report quotes under its cases found verbatim in the rerun (temporary path normalised to TMP): checked=107 missing=0; git status --short | wc -l in the worktree: 60 before and after
$ node first-run.ts .agents/worktrees/O85-base      (rebuilt from the report's quoted source, 197 lines, run on the base copy)
exit=0; of the 47 quoted output lines, 46 found verbatim; the one other is the report's placeholder "case 12 extra: <scratch>/wN/x exists: false" (the run prints w14, w15, w16)
$ npx vitest run tests/checks/imports/order.test.ts tests/checks/tree/boundaries.test.ts --testTimeout 0
      Tests  24 passed (24)
$ sh utils/folder-check.sh
folder-check=0
$ git diff 8d52965c --stat -- src/lib/data/model/ src/lib/server/root/ src/lib/data/helpers/hub-names.ts | wc -l
0
$ git diff 8d52965c --stat -- tests/routes/edit/undo/undo.test.ts | wc -l; git show 8d52965c:tests/routes/edit/undo/undo.test.ts | wc -l
0
863
$ grep -rn "typedText\|withTypedText\|withSavedDraft\|hasSavedDraft\|savedBase" src tests | grep -v "editors/slots.ts\|config/typed.ts"
the callers the report names, each passing slotOf(row), and QuickPick.svelte:38,41 and Console.svelte:170,221, unrelated names

The reviewer's own runs:
$ node keys.ts .agents/worktrees/migration-O85      (the hub list split by OWN_HUB_KEYS)
hub list: 49 own: 37 dupes: 0
own not in list: []
rest: ["portfolio_deck","career_file","bookmarks","schedules","apps_dir","wallpaper.image","docs","counts","slurm.resource","lint.writing_skip","lint.writing_glyphs","app_settings"]
vocab keys in own: 22 vocab keys in list: 22
$ node reset-comments.ts <tree>      (resetConfig of the last key of a hub file '# the lab\nmemories_dir: pictures\n', then a write of the key)
== .agents/worktrees/O85-base
reset: {"changed":[],"refused":[{"field":"sources.yml:memories_dir","reason":"is not a map of keys"}]}
file after reset: "# the lab\nmemories_dir: pictures\n"
== .agents/worktrees/migration-O85
reset: {"changed":["sources.yml:memories_dir"],"refused":[]}
file after reset: "# the lab\n{}\n"
next write: {"changed":["sources.yml:memories_dir"],"refused":[]}
file after next write: "# the lab\nmemories_dir: pictures\n"
$ find . (node_modules, .svelte-kit and .git left out) -type f -newer .agents/worktrees/O85-base/unused-exports.txt, less the 58 changed paths
.scratch/migration/agents/briefs/O85-cases.md, .scratch/migration/agents/reviews/O85-report.md, six docs/diagrams files npm run diagrams rewrote with the same text, tests/routes/edit/undo/undo.test.ts (rewritten, byte-equal to the base)
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `src/lib/data/shapes/hub-keys.ts` `OWN_HUB_KEYS` holds the 37 keys, none outside the hub list, and the rest of the hub list is the 12 the plan line names (`keys.ts` above); `hub-names.ts` unchanged (`git diff --stat` prints nothing); read by the server (`config-write.ts`, `undo.ts`, `server/files/source/hub-settings.ts`) and the page (`view/hub-settings.svelte.ts`).
- 2: holds. `landing` in `config-write.ts:422-448` places a body's `root` (no root or the primary's name: the target's layers; empty, path-like, unknown or a hub without its settings file: `no_hub_named`; one of the 12: `primary_only`), folder and record checks over the named hub's `SourceInputs`; `recordLayers` (`undo.ts:113-121`) finds the hub's layers among the workspace's hubs; cases 3 to 8, 11 to 16, 18 to 23, 25, 27 and 28 reproduced by the rerun of `after-run.ts`. Two additions no item asks for: Spec 1 (`keptAsMap`) and Standards 1 (`not_hub_key`).
- 3: holds. `writeConfigKey`, `writeConfigValue`, `resetConfig` (`writes.svelte.ts:568-627`) and `shapes.ts:386-417` take `root`; `WriteConfigValue` (`editors/writer.ts:360`) and `WriteConfigKey` (`write.ts`) pass it; `settingsFile` (`write-files.ts:115-126`) names `inRoot(root, HUB_FILE)`; no split needed at 876 lines; test in `held-unsaved.test.ts`.
- 4: holds. `withHubs`/`chosenRow` (`view/hub-settings.svelte.ts`) give `choice` with the hubs from `hubsTaking` (primary first), `chosenHub` first, `pickHub` while none is chosen, no choice for the 12 and for one hub; `Item.svelte` draws a `ui/` `Select`; picks kept in `Settings.svelte`'s `chosen` state, never saved, pruned when a hub leaves; write state keyed by `heldKey` (`write.ts`, `editors/writer.ts`), drafts and typed text by `slotOf` (Z1035); tests in `chosen-hub.test.ts`, `row-writer.test.ts`, `editor-saved.test.ts`.
- 5: violated, Behaviour 1: while B's slice is being read and after its read failed, a row with B chosen shows A's value, A's Modified bar and A's own line, under a link named `B/.oculus/config.yml` that opens A's file. Otherwise the route, the reader, `hubRow`, the lists of B and the reread on each push do what the item says (cases 2, 29, 30, 31).
- 6: holds. `server.workspace.primary_only` and `not_hub_key` in `config/text/server.yml`, six `settings_hub_*`/`settings_pick_hub` keys in `config/text/views/system/workbench.yml`; style notes under Standards 1 and 3.
- 7: holds. Every new test is in a file of G8, G9, G28 or G96 or in `chosen-hub.test.ts`, except `tests/routes/edit/undo/hub-settings.test.ts`, which the size rule requires (`undo.test.ts` is 863 lines at the base and the cases add about 66, past 900); it belongs to G9, whose Test line names only `undo.test.ts` today and is written at landing. The labels of two tests are wrong (Proof 1).
- 8: holds. `recordLayers`'s doc comment, the head comments of `writes.ts:29-32` and `write-files.ts:15-21`, the schema description at `workspace-file.ts:55` and the comments of each changed file read true after the change; the remaining check-8 hits each read true.
- 9: holds. The three "Doc text" replacements are true of the code (read against `landing`, `chosenRow` and the 12 keys of `keys.ts`); `docs/data-map.md` line 258 is the base's line (`git show 8d52965c:docs/data-map.md | grep -n "are not read"` prints 258), the brief's 260 being wrong.

Cases of the brief's "Cases", case 16 and case 20 as `agents/briefs/O85-cases.md` rules them:

- 1 (look): met by `chosen-hub.test.ts` row "two hubs: the primary first and chosen" and the `Select` in `Item.svelte`; the drawing is the landing look.
- 2 (look): met by "shows lab's value, default and line, and opens lab's file, with lab chosen" (value B's, Modified true); the drawing is the landing look.
- 3: met: rerun "case 3" B gains the `exploring` entry, A `same as before: true`, undo leaves B `{}\n`.
- 4 (look): met: rerun "case 4" B `{}\n`, A unchanged.
- 5: met: rerun "case 5", B holds the row keyed `key: idea`.
- 6: met: rerun "case 6".
- 7: met: rerun "case 7", B `scan:\n  - { dir: only-b }`.
- 8: met: rerun "case 8", B `audit:\n  required_files:`.
- 9 (look): met: rerun "case 9" lands in A; test row "a key read from the primary alone: no choice".
- 10 (look): met: test rows "one hub, the primary: no choice" and "one hub that is not the primary: no choice, the write names it".
- 11 (look): met: rerun "case 11" and "case 11/25" land in B with no primary; test rows "two hubs and no primary: none chosen, nothing written" and "... lab picked".
- 12: met: rerun of the three roots, each refused with `no_hub_named`, both files unchanged, no `x` made; config-key test rows.
- 13: met: rerun "case 13" refused with the new sentence, no file changed.
- 14: met: rerun "case 14" twice into A; "undone alike" by reading: the record carries no `root`, so `recordLayers` takes the target's own layers for both.
- 15: met: rerun "case 15" refused with the `local.yml` sentence, B's link target unchanged; config-key test.
- 16 (as ruled): met: test rows "lab chosen while lab's file does not parse" (`settings_unparsed`, naming `lab/.oculus/config.yml`) and "... is being read" (`settings_loading`); `blocked` stops `send` in `write.ts` and `editors/writer.ts`, Reset in `Item.svelte`, the copy in `EditLink.svelte`; the primary's rows unchanged (`chosenRow` returns the row as it was); body refused `not_parsed` (rerun "case 16", config-value test).
- 17: met: `git diff --stat` over `src/lib/data/model/` and `src/lib/server/root/` prints nothing.
- 18: met: rerun "case 18" refused `no_hub_named`, `B/.oculus/config.yml exists: false`.
- 19: met: test row "lab chosen and gone from the workspace: the primary chosen again", the pruning `$effect` in `Settings.svelte`, rerun "case 19" refused.
- 20 (with the ruling's addition): met: rerun "case 20" refused with "changed since it was read"; `editor-saved.test.ts` both new tests (B's draft kept, drawn again with B, not on A's row; a push of A's row does not end it). The draft shows as stale for the time B's slice is read again after a pick: Behaviour 1.
- 21: met: rerun "case 21" nothing changed, A unchanged, no record; page by reading (`own` from B's file, `write.ts` and `editors/writer.ts` send no reset when `own` is false).
- 22: met: rerun "case 22" B gains B's value `#16a34a`, A keeps `#aaaaaa`, undo leaves B `{}\n`; `EditLink.svelte` sends `row.value` with `row.hub`.
- 23: met: rerun "moved" and "gone"; `hub-settings.test.ts`.
- 24: met: `held-unsaved.test.ts` new test.
- 25: met: reruns "case 25" and "case 11/25"; folder picker by reading (`listsFor` gives `listsWith(..., hub)`, `folderIn(hub, ...)`); `audit.website.file` by reading, the same `SourceInputs` path.
- 26: met: `row-writer.test.ts` "names lab in its write and its reset, and keeps lab's answer apart from the primary's".
- 27: met: rerun "case 27"; test row "one hub that is not the primary".
- 28: met: rerun both halves; config-key rows.
- 29: met: rerun "case 29: B's slice holds stage exploring: true; A's merge holds it: false"; route test (categories with B chosen keeps `nascent`, Modified false).
- 30: met by reading (`Settings.svelte` effect on `pushed`, `reader.want(others, pushed)`; each hub's `HUB_FILE` watched by `portfolio.ts`) and the reader test; the move of `own` and line is the landing look.
- 31: met: rerun "case 31" lines; route test.

## 1. Spec

- `src/lib/server/edit/writes/config/config-reset.ts:58-66,141`: "function keptAsMap(edited: string): string { ... return `${edited}...${EMPTY_MAP}`; }"; what is wrong: no item asks for it (the nearest is item 2's Reset into a hub's file); it changes the primary's Reset as well as B's. The change itself is right: on the base a Reset of the last key of a hub file that also holds a comment is refused with "is not a map of keys" and nothing is written; after it, the key comes out and the file holds the comments then `{}`, and the next write replaces the `{}` (`reset-comments.ts` output above). failure scenario: a reader whose primary `.oculus/config.yml` opens with a comment and holds one key gets a Reset that now writes where it was refused, with no ruling or brief item that names the change; the landing books it as part of O85 without a decision on record. verdict: none (item 2 holds).
- builder's process: "An earlier shell append to `tests/routes/edit/undo/undo.test.ts` was made in the build"; what is wrong: a shell redirect changed a worktree file, which the rules file ("What every package obeys", case-run programs and scripts) allows only to the Edit and Write tools or under an approval quoted from `plan.md`'s Rulings; no approval covers it (open item 262 (a) covers case-run programs that print). The redirects of check output went to scratchpad files only. End state: `undo.test.ts` is byte-equal to the base (`git diff --stat` prints nothing) and its mtime is newer than the base copy (`find -newer`); no other worktree file outside the 58 paths changed. failure scenario: had the append not been undone in full, `undo.test.ts` would carry text no Edit or Write made, which the diff read cannot tell apart from the builder's own; under the standing demand on unapproved builder scripts this is closed in automode, with the command list asked for in the repair round. verdict: none.
- brief, "What is on the tree", item 5's premise "`CLOSED_WRITES` already closes the three write kinds to apps, `src/lib/server/edit/writes/apps/gate.ts:113-116`"; what is wrong: `CLOSED_WRITES` is at `src/lib/data/helpers/files/apps/apps.ts:155-170` (`grep -rn "CLOSED_WRITES" src`); `gate.ts:113-116` is `gateWrite`'s head. The fact holds (`config-key`, `config-value`, `config-reset` are in the list). failure scenario: a reader checking the premise at the cited place finds no list and may take the route or the writes as open to apps. verdict: none.

## 2. Proof

- `.scratch/migration/agents/reviews/O85-report.md`, "New tests": "a key read from the primary alone, with no primary and no hub named, refused | G8 | audit" and "writes the primary alike for a body naming it and a body naming no hub | G8 | audit"; what is wrong: the brief's definition of an audit is a test that still passes with its behaviour taken out of the code. Read against the code, both fail without it: the second sends `root: 'hub'` with `into.hubs` holding only `lab`, so without the branch `root === into.primary` of `landing` (`config-write.ts:428`) `otherHubLayers` answers null and the write is refused `no_hub_named`, failing `expect([one.changed, two.changed])`; the first fails without the `no_primary` refusal of `placeRefusal`, which `landing` reaches through the target's own layers. Both are tests of behaviour whose failure costs something (a write landing in the wrong file, a write with no place accepted). Their passing runs on the unchanged tree are quoted only as the aggregate "Tests 26 failed / 3 passed", not by title. The decision resting on it: the orchestrator's landing, where the standing demand "no audits" would delete two real checks of case 14 and case 28. failure scenario: the landing deletes both as audits, and the branch that treats the primary's name as no root loses its only test. verdict: none (item 7 holds).
- `.scratch/migration/agents/reviews/O85-report.md`, "Judgment calls" 3: "The route's answer carries `from` for the top-level keys of the slice, beside `hub` and `config`, since the rows read the file a value came from."; what is wrong: no row reads it. `hubSliceShape` (`view/hub-settings.svelte.ts:38-42`) parses `from` and nothing reads `slice.from` (`grep -n "\.from\b" rows.ts groups.ts view/hub-settings.svelte.ts Settings.svelte` prints none). Item 5's "`from` for them" may mean the options entries' own `from` (the list a word comes from, which the catalog entries in the slice already carry, as case 29 uses it), or the merge's `from` map the builder sends. The decision resting on it: whether the field stays in the route's answer. failure scenario: the orchestrator keeps a field in a new route on the strength of a reader that does not exist, and a later step that changes the field breaks nothing a test or a reader shows. verdict: none.

## 3. Standards

- `src/lib/server/edit/writes/config/config-write.ts:435` with `config/text/server.yml:523`: "if (hubFileOf(key) !== file) return refuse(words(text, 'server.workspace.not_hub_key', key));" and "not_hub_key: \"{0} is kept in the open workspace file, not in a hub's settings file, so the write names no hub\""; what is wrong: a branch, a catalog key and a test row (config-key "a key of the open workspace file, refused for lab") for an input no sender makes: the page sends `root` only on rows of the 37 keys, and apps cannot send these kinds (`CLOSED_WRITES`). Without the branch the same body is refused with `primary_only` and nothing is written, so the test row guards a wording whose failure costs nothing (the rules file's test rule; the review's "code larger than its job"). The sentence also tells a request that named a hub that "the write names no hub", and is built as "kept in X, not in Y" (the rules file's prose rule against the negation contrast). failure scenario: a hand-made request with `root` on `code_theme` is told the write names no hub while its body names one. verdict: none.
- `.scratch/migration/agents/reviews/O85-report.md`, "New tests": every new test of `config-key.test.ts` "a write that names a hub", `config-value.test.ts` "a list or family written into the hub the write names", `chosen-hub.test.ts` "the route that answers the settings of a hub" and the whole of `hub-settings.test.ts` (`@module-tag slow`) are tagged slow, and the report does not name them as slow; what is wrong: the rules file ("What every package obeys", the tests paragraph) asks a slow test to be named in the report with its run alone. Their runs are quoted (check 2 with the new file, 12 files, 197 tests). failure scenario: the orchestrator does not see that `npm test` leaves these cases out, and books G8 and G9 as covered by the unit suite. verdict: none.
- `config/text/views/system/workbench.yml:221`: "settings_hub_choice_tip: 'The hub whose .oculus/config.yml this setting is read from and written to.'"; what is wrong: the group's one-sentence tips end without a period (`settings_edit_in_tip`, `settings_machine_edit_tip`, `open_settings_file_tip`, `save_workspace_tip`, `show_defaults_tip`); this one ends with one. failure scenario: the tooltip of the hub choice reads in a different style from every other tooltip of the Settings view. verdict: none.
- `.scratch/migration/agents/reviews/O85-report.md`, DONE row 1: "imported by `config-place.ts`"; what is wrong: `config-place.ts` names `data/shapes/hub-keys.ts` in its head comment and imports nothing from it (its imports: `hub-names.ts`, `config.ts`, `manifests.ts`). No decision rests on it. failure scenario: a reader looking for the place check of the key set in `config-place.ts` finds none. verdict: none.

## 4. Behaviour

- `src/lib/state/system/config/view/hub-settings.svelte.ts:170-174` with `rows.ts:205-210` (`placeName`), `Item.svelte:194-209` and `EditLink.svelte:55-59`: "if (read.state === 'loading') return { ...row, hub, blocked: message('hubLoading', hub) };" and the same for `failed`; what is wrong: the row returned is the primary's row with `hub` set. While B's slice is read (each time B is picked after the reader dropped it, since `want` forgets a hub no row has picked) and after a failed read, the row shows A's value, A's Modified bar and A's `own` and line; `placeName` labels its line link and Edit in file `B/.oculus/config.yml`, while `placeOf` keeps the primary's root (`PRIMARY_ROOT`), so a press opens A's file at A's line; `EditLink.edit` opens before its `blocked` guard when `row.own` is A's. In `Editor.svelte:85-90` a held B draft is compared with A's value and drawn as stale (only Discard offered) for that time. The report's judgment call 5 states only "shows the primary's value with the sentence `settings_hub_loading`" and says nothing of the failed state's value, the link or the draft. failure scenario: a reader picks B on `stages`, presses the line link `B/.oculus/config.yml:3` before the read lands (or while the read has failed) and edits A's file believing it is B's; or presses Discard on B's draft while it is drawn as stale and loses it. verdict: item 5 violated.
- `src/lib/server/edit/writes/config/config-reset.ts:141` (`keptAsMap`), the report's "Host- and user-visible changes": the change is not listed there, and judgment call 6 gives its before as "a file of comments alone does not parse as a map and the next write to it was refused"; what is wrong: on the base the Reset itself is refused with "is not a map of keys" and the file is left as it was (`reset-comments.ts` on `O85-base`); after the change the Reset is taken and the file holds the comments and `{}`. This holds for the primary's file as well as B's. failure scenario: the landing's look and booking compare the primary's Reset against the report's "before" and miss that a Reset Settings refused on the base now writes. verdict: none.

## Declined to judge

- `npm run diagrams`: not run, since it writes into the worktree; the 12 changed `docs/diagrams` files were not regenerated or compared, and six more diagram files carry new mtimes with unchanged text.
- Check 4's runs on the unchanged tree: not rerun. They need a second tree with the base's sources, the step's tests and a vite config loaded, which this review does not build; each quoted failing line was read against the line it names in the test files and matches what the base code would give (for example `row-writer.test.ts:176` `listed.push(row.hub)` with the base calling `lists()` with no row, `editor-saved.test.ts:102` `slotOf` absent at the base).
- The looks of cases 1, 2, 4, 9, 10, 11 and 30 and every drawing of the hub choice (the `Select` under the description, its width, the "Pick a hub" state): the landing look on TEST.
- The 11 single-test reruns the report quotes for verify 1: not rerun one by one; this review's own run of the list passed `vitest` and `vitest checks`, and its one red file (`tasks.test.ts`, not changed by the step) passed alone.
- Ignored stray files: `git status --ignored` is outside the three git forms allowed; a `find` over the worktree (node_modules, .svelte-kit and .git left out) found no file newer than the base copy outside the 58 paths but the ones named in the verification block.
- The command the builder used for its shell append and to undo it: not in any file this review reads; only the end state was checked.
- Bookings at landing, the orchestrator's: G9's Test line gains `tests/routes/edit/undo/hub-settings.test.ts`; G96's Code line has none of the units `chosen-hub.test.ts` tests (`withHubs` and `hubReader` in `view/hub-settings.svelte.ts`, `hubSettingsAnswer` in `server/files/source/hub-settings.ts` and its route, `hubSlice` in `data/sources/config/settings/hub-slice.ts`); its typed-text test ("is kept under lab and not shown on the primary's row") reads as G28's guarantee (an unsaved edit kept) more than G96's.
- `docs/data-map.md`: main's working tree already holds an uncommitted line naming the same 12 keys ("Twelve keys of a hub's `config.yml` are read from the primary's alone", line 274 there), so the replacement for the base's line 258 repeats it; reconciling the two is the landing's.
- The quick list and check 2 load the worktree's `vite.config.ts` through vitest, as the brief's checks require; no other program that loads it was run.

Reviewer usage: a0e17faa413580c97, claude-opus-5-5, 107756 tokens, 105 tool uses, 26 min 59 s.

## Repair round 1, refuted

All commands ran from the worktree root `.agents/worktrees/migration-O85` with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`, in the foreground. The load average at the start was 4.84 7.21 8.49. `npm run diagrams` was not run, because it writes into the worktree (see "Declined to judge"). The round's delta was read as `diff -u` of each of the 18 snapshot files that differ from the worktree (`cmp` over the 57 paths of `files.txt`). No path outside `files.txt` changed in the round, apart from the ledger copies, which are the same as main's (`cmp`), and six diagram files that were rewritten with the same text.

```
$ npm run test:quick -- --base 8d52965c      (once; 2 min 37 s; only the last 40 lines were kept)
ok      prettier (0.6 s): All matched files use Prettier code style!
ok      ASCII gate (0.7 s)
ok      svelte-kit sync (2.2 s)
ok      eslint (2.4 s)
ok      svelte-check (9.8 s): 1793036350938 COMPLETED 545 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (97.3 s)
ok      vitest checks (111.3 s)
ok      vitest slow (154.8 s)
test:quick: 157.2 s; every command passed

$ npx vitest run <check 2's files> --reporter=dot      Tests 197 passed (197)
$ the same with tests/routes/edit/undo/hub-settings.test.ts and --testTimeout 20000      Tests 200 passed (200)
$ wc -l <the 46 changed and new files>      largest source writes.svelte.ts 876; largest component Settings.svelte 510
$ sh utils/unused-exports.sh; diff with the base list      diff exit=0
$ history grep over src config docs tests      exit=1 (nothing printed)
$ the character-set gate over the 46 files      exit=0
$ node round1-run.ts <worktree>      each refused with primary_only, nothing written, records 0; route answer keys ["hub","config"]
$ node round1-reset.ts <unchanged> / <worktree> withRoot      before: refused "is not a map of keys"; after: the key comes out, the file holds its comment and {}, the next write replaces it, for A and for B
$ config-key "a key read from the primary alone, wi..."      worktree 2 passed; unchanged tree 1 failed (text key not in config: server.workspace.primary_only)
$ svelte-check full      0 ERRORS 0 WARNINGS; eslint on the ten files exit=0; folder-check and size-check exit=0
```

### Verdicts

- Items 1 to 9: hold. Item 5: `unreadRow` (`view/hub-settings.svelte.ts:171-185`) gives a row with B chosen no value, default or line while B's slice is read or failed, `Item.svelte:327` draws no `Control` for it, `EditLink.edit` checks `blocked` first, the route answers `{ hub, config }`.
- Cases 1 to 31: met (16 and 20 as `O85-cases.md` rules them; the looks of 1, 2, 4, 9, 10, 11 and 30 are the landing look).

### 1. Spec

none.

### 2. Proof

- `O85-report.md`, "New tests" row 96 and DONE row 6: the table still names the test "a key of the open workspace file, refused for lab" and the key `not_hub_key`, both removed in the round. Failure scenario: the landing books under G8 a test title and a catalog key the tree does not hold.

### 3. Standards

- `src/lib/state/system/config/view/gear.ts:1-3`: the head comment says Reset takes a value out of the open workspace file or the primary hub's settings file; since the step, a Reset with B chosen on a hub key takes it out of B's `.oculus/config.yml`. Failure scenario: a reader relies on the comment and writes hub-blind code again.
- `tests/state/system/settings/editor-saved.test.ts:8-10,151,155`: "are read" names the read in progress (describe) and the read finished (it); the sibling tests say "are being read". Failure scenario: a reader of G96's Test line misreads the guarantee.
- `O85-report.md`, "Repair round 1": no history-word grep quoted over the round's lines; the reviewer's grep has one hit, `editor-saved.test.ts:40`, judged not history.

### 4. Behaviour

none.

### Declined to judge

- `npm run diagrams` not run (it writes into the worktree); the three changed `.dot` sources agree with the round's import changes.
- The before-runs of the round's three new tests not reproduced (that would revert the code under test); each read, and each fails without the round's change.
- The `primary_only` sentence a hand-made body gets for a key of the open workspace file ("read from the primary hub's settings file alone") is false of that key; the orchestrator's call.
- The new `editor-saved.test.ts` test renders `settings/Item.svelte` under G96; booking it is the landing's.
- EditLink stays drawn and inert on a row that says why it writes nothing; the look's call.
- The close question's Save while B is being read: unchanged by the round (read in `Editor.svelte:135-136`), not run.
- The looks of cases 1, 2, 4, 9, 10, 11 and 30 and of an unread row: the landing look on TEST.
- The bookings carried from the first run: G9's Test line, G96's Code line, the reconciling of `docs/data-map.md`.

Reviewer usage: ae28be89d8e8cf281, claude-opus-5-5, 262691 tokens, 77 tool uses, 19 min 3 s.

## Closed

- Proof (report tables): fixed at landing; the G8 booking is written from the test titles in the tree, and the two stale rows of the saved `O85-report.md` are corrected.
- Standards (`gear.ts:1-3`): fixed at landing, the head comment says Reset takes the value out of the file of the hub chosen.
- Standards (`editor-saved.test.ts` titles): fixed at landing, "are read" becomes "are being read" in the describe and the head comment.
- Standards (no history grep in the round section): closed, no change; the reviewer's grep over the round's lines has one hit, judged not history.
- Declined (`primary_only` sentence false for a workspace-file key): fixed at landing, the sentence is reworded so it is true of every key outside the 37.
- Declined (G96 booking of the view test): booked at landing under G96.
- Declined (inert EditLink on an unread row): judged at the look on TEST.
