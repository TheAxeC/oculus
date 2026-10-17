# Step O37 refuter report (on .agents/worktrees/O37, base 0f04ce969)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

```
$ npm run test:quick -- --base 0f04ce969        (tools/oculus in the worktree)
test:quick: 232 changed file(s), from git since 0f04ce969
test:quick: 174 test file(s), 10 essential
ok prettier (3.4 s): All matched files use Prettier code style!
ok ASCII gate (3.8 s)
ok svelte-kit sync (25.4 s)
ok eslint (33.6 s)
ok svelte-check (35.4 s): 1792173868078 COMPLETED 511 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok vitest (95.2 s): Duration 87.79s (...)
test:quick: 120.8 s (limit 45.0 s); every command passed
test:quick: over the time limit
(exit 0; it names git-write.test.ts "changed, run by npm run test:slow" and keys/comment-width "run by npm run test:checks")

$ LC_ALL=C perl -ne '...' $(find src tests config utils docs -type f ! -name local.yml)    (ASCII gate of spec.md)
(no output, exit 0)
$ LC_ALL=C grep -n '[^ -~]' over registries/venues.yml, pillars.yml, domains.yml, career.yml, tools/skills/catalog.yaml, against the same grep over O37-base/hub/
no line the base does not print

$ sh utils/size-check.sh
exit 0
$ sh utils/unused-exports.sh   compared with O37-base/unused-exports.txt
no new line; two lines shorter: "images.ts: READ_CAP" (base "READ_CAP, SEGMENTS"), "forces.ts: FORCES" (base "FORCES, advance")
$ sh utils/folder-check.sh
not run: it runs git (see Declined); a find count of every folder of src, tests, utils, config finds none over 10

$ grep -rnw <name> src tests   for the twenty names of triage item 8
14 print nothing; useClock lsp-fixture.ts:287,311; Copies hubs-fixture.ts:22,24 ("export function copies(): Copies {"); PersonalTarget write-fixture.ts:386,392,407; REPOSITORY_MANIFEST write-fixture.ts:426,456; RepositoryTarget write-fixture.ts:440,451; Planted apps-fixture.ts:37,55,139; every line in its own file, the only `export` words on exported functions whose signatures name the local type

$ npx vitest run <the 19 test files of the guarded entries the step touches>
Test Files 19 passed (19)
Tests 216 passed (216)
$ npx vitest run <7 files> --reporter=verbose
Test Files 7 passed (7)
Tests 92 passed (92)
$ npx vitest run tests/server/git/git-write.test.ts
"stages a path whose type changed and discards it, the whole path each time" 654ms; Test Files 1 passed (1)
$ npx vitest run tests/state/workbench/layout/saved tests/server/sessions/transcripts.test.ts tests/ui/html.dom.test.ts tests/server/root/config-cache.test.ts tests/server/machine/pty/channel.test.ts --reporter=verbose
every row the report lists under G5, G29, G35 (channel), G40 and G61 printed with a pass mark
Test Files 7 passed (7)
Tests 74 passed (74)
$ npx vitest run tests/routes/hubs/make.test.ts tests/routes/sessions/terminal.test.ts tests/server/machine/runs/schedules --reporter=verbose
"offers both controls on a folder under a home folder whose .oculus holds config.yml, and neither on the home folder itself, ..." pass
"keeps the recovery terminal after its command ended, with its exit status, as a task terminal" 5ms pass
Test Files 6 passed (6)
Tests 35 passed (35)

$ npm run test:checks          (the report quotes it as evidence)
Test Files 19 passed (19)
Tests 297 passed | 8 skipped (305)
Duration 45.14s

Item 24's named files, each alone, worktree:
tests/routes/edit/config-key.test.ts      Tests 8 passed (8)   Duration 9.11s (... tests 7.02s)
tests/routes/edit/config-value.test.ts    Tests 1 passed (1)   Duration 2.99s (... tests 1.19s)
tests/server/edit/config-value.test.ts    Tests 5 passed (5)   Duration 4.14s (... tests 2.14s)
tests/server/git/refs/detached.test.ts    Tests 1 passed (1)   Duration 1.55s
tests/server/git/git-scan-depth.test.ts   Tests 12 passed (12) Duration 2.50s
tests/checks/source/comment-width.test.ts Tests 2 passed (2)   Duration 3.44s
tests/checks/source/keys.test.ts          Tests 8 passed (8)   Duration 22.21s (transform 8.12s, import 21.42s, tests 684ms)
tests/server/git/git-ops.test.ts          Tests 17 passed (17) Duration 24.06s (tests 22.81s)
Base copy: tests/routes/edit/config-key.test.ts   Tests 8 passed (8)   Duration 9.33s (... tests 7.27s); each case 526ms to 1631ms

$ node -e "import('./vite.config.ts').then((m) => console.log('TYPES_WRITTEN', m.TYPES_WRITTEN))"   (report, judgment call 4)
TYPES_WRITTEN OCULUS_TYPES_WRITTEN
$ grep -n read_again config/text/views/sources/files.yml   (report, item 19)
188:        read_again: Read again
$ grep -n -i 'cockpit\|build.py' ../skills/catalog.yaml ../../registries/career.yml ../../registries/venues.yml   (case 40)
(no line, exit 1)
$ diff O37-base/hub/career.yml ../../registries/career.yml
1c1  (one changed line)
$ head -c 400 docs/diagrams/writes.svg
width="750pt" height="7086pt"
$ grep -o "monaco-dialog-modal-block.dimmed{[^}]*}" "/Applications/Visual Studio Code.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.css"
monaco-dialog-modal-block.dimmed{background:#00000080}
$ find .agents/worktrees -name c5.js -o -name place-time.js -o -name c18.js -o -name 'c17*' -o -name changed-paths.txt   (node_modules pruned)
(no output)
$ grep -n "CACHE_VERSION" DESIGN.md src/lib/server/sessions/cache.ts
DESIGN.md:754: ... `CACHE_VERSION` is 7 so every cached session is folded again with it ...
src/lib/server/sessions/cache.ts:31:export const CACHE_VERSION = 8;
$ sed -n 118,297p O37-report.md | grep -c '^| [a-zA-Z.]'      (start patch table rows)
172
$ grep -c '^diff --git' O37-start.patch
171

Not rerun: the report's `node -e` runs of notes/c5.js, notes/place-time.js, notes/c18.js, the c17 runs, the createSaves run and the placeNames run (no text in the report, no file on disk); `npm run diagrams` (it writes files).
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds, `_one` keys at repositories.yml:93,113-121,132,148,162,178,198,282 and changes.yml push_detail_one, read at Merge.svelte, change-menu.ts, RepoList.svelte, AppSourceItem.svelte, HunkBar.svelte, hunk-acts.svelte.ts, Changes.svelte, repositories.ts:849,866, RepoItems.svelte:128,137; keys.test.ts 8 passed.
- 2: holds, G33 row passes (' T' then 'T ' then ' T' then gone, file restored); DiffSection.svelte `typeChangeWords`, keys.test.ts status list holds 'T'.
- 3: holds, MergeSide.svelte `.lens` with `flex-wrap: wrap` and `.link { overflow-wrap: anywhere }`, plain ToolButtons parted by `sessions.meta_sep`; see Behaviour 5 for what it dropped.
- 4: holds, by reading choices.ts `glyphWords` and GlyphDialog as a QuickPick (read before this report's verification block).
- 5: holds, by reading follow.svelte.ts (`renode`, `relink`, `recentre`) and layout.ts `placementTurn`; the measurement is not rerun (Proof 1); see Behaviour 4.
- 6: holds, by reading labels.ts (`crosses`, `cut`, `side`) and the order of `shownLabels`; the time increase and its reason are stated; not rerun (Proof 1).
- 7: holds, Graph.svelte `viewBox` from `follow.bounds()`, the SVG's measured size.
- 8: holds, the twenty greps above.
- 9: holds, by reading Toolbar.svelte `markPanel` as an `{@attach}`.
- 10: holds, list-width.svelte.ts `listFit`, TerminalList.svelte `.narrow` and `.actions { flex: 0 10000 auto; min-width: 0; overflow: hidden }`, TerminalActions terminals menu.
- 11: holds, TreeActions.svelte `display: var(--actions-display, none)`.
- 12: holds, by reading saves.ts and builds.ts; the createSaves run is not rerun (Proof 1).
- 13: holds, tokens.css:114 `--scrim: rgba(0, 0, 0, 0.5)` equals VS Code's `#00000080`; ScheduleDialog class `box`; pdf-styles.ts wraps pdf_viewer.css in `@scope (.oc-pdf)` with `:root` turned to `:scope`, and the sheet holds only `@media` at-rules (grep); see Behaviour 1.
- 14: holds, by reading ui.svelte.ts `editorLook()` read by Editor, Diff, Merge.
- 15: holds, by reading selection.svelte.ts `keepShown` and `followedSession`, used in SessionPicker.svelte and Files.svelte.
- 16: holds, G29 row passes.
- 17: violated, Spec 1 and Spec 2.
- 18: holds, images.ts head comment states the bound (what comes before the first frame or image data and one BLOCK); not rerun (Proof 1).
- 19: holds, files.yml:188.
- 20: holds, by reading place-names.ts `placeNames`, kill-arm.svelte.ts ("Focus moving does not end it"), composer.ts `splitEnded` called at Composer.svelte start.
- 21: holds, writes.svg 750pt wide, source.mjs FONT 'Helvetica' with FONTS written into the SVG; the diagrams test in test:checks passes.
- 22: not applicable, the brief takes no test and judges it under "What is on the tree".
- 23: holds, Editor.svelte:435-438 draws the highlights once a model is set.
- 24: violated, Spec 4 and Spec 5.
- 25: holds, RailEditor.svelte `read` gates the empty sentence and `dirty`.
- 26: holds, by reading away.ts and the Catalogue head comment; across reloads the look settles it.
- 27: holds, the two G35 channel rows pass; see Behaviour 3.
- 28: holds, by reading UpdateTray.svelte's two cells.
- 29: holds, the recover row passes; terminal-list.ts `terminalTip` adds `terminal_row_ended` with the exit status.
- 30: holds, intro greps print nothing; RegistryHead.svelte draws `file.collection.intro` through Intro (sanitised); G5 rows pass; see Standards 2.
- 31: holds, by reading CommandCenterView `.behind` and `.lead`.
- 32: violated, Spec 3.
- 33: holds, by reading SessionList/Customizations through place-names.ts and selectors.svelte.ts.
- 34: holds, G61 and G32 rows pass; picks.svelte.ts computes `making.offerAt` as the menu opens; the dialog's collections are read at the item's pick, as the report says.
- 35: holds, by reading TabView.svelte's `<svelte:boundary>` and its `failed` snippet with Draw again.
- 36: holds, G5 rows pass; card-math.svelte.ts loads KaTeX once per component on a `$`.
- 37: holds, card.ts:21 holds 'transcript', `sessionTab` takes the tab used last.
- 38: holds, kill-arm.svelte.ts `holdArm` ends the arm on the window's `blur` when the focus is on an IFRAME.
- 39: holds, Card.svelte `--card-at-rest`, CardActions/Usage/LeadCard/RadarCard read it; DESIGN.md card paragraph rewritten.
- 40: holds, case 40's grep exit 1 and one changed line.
- 41: not applicable for the builder. The reviewer's judgment over the whole diff: the three Q89 findings (Q89-landing.md, "What was found") are ended: the picker names places by place-names.ts, a pointer-armed Kill is not disarmed by focus (kill-arm.svelte.ts), a Split tab drops its split and worktree folders once a start lands (composer.ts `splitEnded`). Of O33-report.md's items, the diff touches make.ts (items 3, 4, 13), the recover route (A8) and the schedule record's lock (moved to json.ts `takeLock`): make.test.ts with O33's home-folder row, the recover rows and the schedules tests pass (run above); no other file an O33 item names is in the diff.
- 42: holds, the table has 172 rows for 171 file diffs (count only; see Declined).
- 43: holds, "The looks (item 43)" section lists items 1 to 40.

Cases of the brief's "Cases":

- 1: met for the words (merge_left/merge_left_one, merge_complete_confirm/_one and the other keys above); the merge editor and Complete Merge are the look.
- 2: met for the parser and the whole-path Stage and Discard (G33 row); the row's words and the missing block actions are the look.
- 3: not verifiable, the look at 110 px and 600 px.
- 4: not verifiable, the look under every theme.
- 5: not verifiable, the builder's notes/c5.js run is not on disk (Proof 1); the look.
- 6: not verifiable, notes/place-time.js is not on disk (Proof 1); the look.
- 7: not verifiable, the look in a tall and a wide pane.
- 8: met, the greps above.
- 9: not verifiable, the look.
- 10: not verifiable, the look at 400, 200 and 100 px.
- 11: not verifiable, the look at 189 px.
- 12: not verifiable, the createSaves `node -e` text is not in the report (Proof 1).
- 13: not verifiable, the look; the token's value is VS Code's.
- 14: not verifiable, the look.
- 15: not verifiable, the look.
- 16: met for the G29 row; the reload is the look.
- 17: unmet, Spec 1 and Spec 2; the builder's c17 runs are not on disk (Proof 1).
- 18: not verifiable, notes/c18.js and its files are not on disk (Proof 1).
- 19: met, files.yml:188.
- 20: not verifiable for the naming run (Proof 1); the Kill and the Split composer are the look.
- 21: not verifiable, the look in the Help page; writes.svg's size and the diagrams test are above.
- 22: not applicable, the orchestrator's.
- 23: not verifiable, the look.
- 24: partial, each file alone is quoted above; `npm run test:quick` is over 45 s (Spec 4) and config-key is no faster than base (Spec 5).
- 25: not verifiable, the look.
- 26: not verifiable, the look.
- 27: met for the G35 rows; the app's tmux terminal is the look.
- 28: not verifiable, the look.
- 29: met for the recover row; the hover is the look.
- 30: met for the greps and G5 rows; the views are the look.
- 31: not verifiable, the look.
- 32: partial, the prompt and title row passes; "the reader's version changed" holds only for a hand-raised constant (Spec 3).
- 33: not verifiable, the look.
- 34: met for the G61 and G32 rows; the menu is the look.
- 35: met, by reading TabView.svelte.
- 36: met for the G5 rows; the card is the look.
- 37: not verifiable, the look; card.ts reads right.
- 38: not verifiable, the look.
- 39: not verifiable, the look.
- 40: met.
- 41: met for the count of rows; each row's kept, fixed or taken out is not checked (Declined).

## 1. Spec

- 1. vite.config.ts:86 and src/lib/server/core/json.ts:273: "const TYPES_LOCK_WAITS: LockWaits = { retryMs: 50, waitMs: 90_000, staleMs: 60_000 };" with "if (ended || age > waits.staleMs) {"; what is wrong: a writer holds the types lock while `noReaders` waits up to READERS_WAIT_MS (vite.config.ts:95, 15 minutes) for vitest runs to end, and nothing refreshes the lock file, so after 60 s any new starter takes the lock over from a live process by age alone; item 17 asks that a sync or build never rewrite the types under a run and that two writers never interleave; failure scenario: `npm test` is running, `npx svelte-kit sync` starts and waits holding the lock, and 61 s later `npx vitest run tests/x.test.ts` starts, prints "took over ... which was N ms old", gets `tookOver: true`, waits for the same reader, and when `npm test` ends the sync and the new vitest's `configureServer` both write `.svelte-kit/types` at once with truncating writes; the sync's later `drop()` also removes the vitest's lock; verdict: item 17 violated, case 17 unmet.
- 2. src/lib/server/core/json.ts:273-281: "const ended = leftByEnded(lock); if (ended || age > waits.staleMs) { ... unlinkSync(lock); ... continue; }"; what is wrong: the takeover unlinks whatever file is at the path after deciding, so of two starters that both read a lock left by a killed process, the second can delete the lock the first has just created, and both hold it; item 17 asks that a run killed mid-sync leave the next runs able to proceed with whole types and that two runs started at once never leave the types half written; failure scenario: a `svelte-kit sync` is killed while holding the lock, then two `npx vitest run` start together: both see the dead pid, the first unlinks and creates its lock, the second unlinks that lock and creates its own, both have `tookOver` true and both call the original `configureServer`, writing the types together; verdict: item 17 violated, case 17 unmet.
- 3. src/lib/server/sessions/cache.ts:31: "export const CACHE_VERSION = 8;"; what is wrong: the fold cache stays keyed on a constant raised by hand, the mechanism that let defect 33 happen; the brief asks for "the cache keyed on what the reader reads"; the report's judgment call 1 says a computed key needs a new script, which is not shown (a key built in code at load is not a script under the brief's rule), and it is the cheaper option; failure scenario: the next change to fold.ts or turns.ts that forgets the raise serves the old records to every listing until a later raise, and the G40 row 'serves a record from the cache its reader wrote, and folds it again for another reader' passes all the while since it only flips the constant; verdict: item 32 violated, case 32 partial.
- 4. tests/tiers/quick.mjs (the step's verify run) and report "The verify list": "test:quick: 72.1 s (limit 45.0 s); every command passed", reviewer rerun "test:quick: 120.8 s (limit 45.0 s)"; what is wrong: item 24 asks that `npm run test:quick` stay inside its 45 s and case 24 asks for one run at the end inside 45 s; the report substitutes a run over the eight named files (34.5 s) and lists the limit under "What in the brief was wrong"; failure scenario: the orchestrator reads item 24 as DONE while the verify list for this step's change is over its limit by 27 s on the builder's machine and 76 s on the reviewer's; verdict: item 24 violated, case 24 partial.
- 5. tests/routes/edit/config-key.test.ts:7 (tag removed): "// @module-tag slow: every case takes 140 ms or more to write a setting through the route."; what is wrong: the slow tags of config-key and both config-value files are removed with the files' time unchanged (config-key tests 7.02 s on the worktree against 7.27 s on base, each case 526 ms to 1631 ms), so 7 s of waiting moves into `npm test`; item 24 asks that each file be "made fast where its time is waste" and the report does not say what a case spends its second on; failure scenario: `npm test` and every test:quick that selects these files grows by about 10 s with no change to what they check; verdict: item 24 violated.

## 2. Proof

- 1. tools/oculus/.scratch/migration/agents/reviews/O37-report.md, DONE rows 5, 6, 12, 17, 18, 20 and the cases' first run: "`node -e` notes/c5.js: \"link written: moved 0 of 47\" ...", "notes/place-time.js ...", "notes/c18.js after ...", "c17w after ..."; what is wrong: the runs that are the only evidence for items 5, 6, 12, 17, 18 and 20 cite script files whose text the report does not give, and `find` over .agents/worktrees finds none of them, so no run can be repeated; the brief allows "a `node -e` you quote"; the placement-time figures (item 6) and the concurrency claims (item 17, contradicted by Spec 1 and 2) rest on them; failure scenario: the orchestrator accepts "moved 0 of 47" and "types same" as checked when no reader can rerun them; verdict: cases 5, 6, 12, 18, 20 not verifiable, case 17 unmet.
- 2. O37-report.md, DONE row 24: "one earlier run of comment-width, straight after keys, \"1 failed\", tests 9.29s, its message not captured"; what is wrong: a red run of a file the step changed is recorded with no cause; spec.md "What every package obeys" has a red line in a changed file fixed and rerun; the reviewer's run passes in 3.44 s; failure scenario: if the failure was the default 5 s timeout of a lone `npx vitest run`, the tree row that took 9.29 s fails again under load wherever a timeout applies, and nobody knows; verdict: none.
- 3. O37-report.md, first line: "Everything in the brief is done."; what is wrong: item 24's 45 s limit is not met (Spec 4) and item 32's key is the constant the item asked to replace (Spec 3); the report moves both into "What in the brief was wrong" and "Judgment calls" instead of the first line; failure scenario: a reader of the first line books O37 complete; verdict: items 24 and 32 violated.

## 3. Standards

- 1. tools/oculus/DESIGN.md:754: "`agentId` is a field of `SessionAgent`, and `CACHE_VERSION` is 7 so every cached session is folded again with it"; what is wrong: cache.ts:31 is now 8, so the sentence is false; spec.md "What every package obeys" makes a document sentence a change makes false a defect of the change, and the brief's path list gives DESIGN.md for any paragraph an item makes false; failure scenario: a reader trusting DESIGN.md believes the cache version is 7 and judges a later raise against the wrong number; verdict: item 32 (with Spec 3).
- 2. registries/venues.yml:10-13: "# Schema: field -> type / options / required / help. Drives the fields ..." then "intro: \"Target venues: ...\"" then "schema:"; what is wrong: the new `intro:` is put between the schema's head comment and `schema:`, so the comment now heads the intro; a comment says what follows it (spec.md "What every package obeys", comments); failure scenario: a reader of the hub file takes the intro for a schema line or moves the comment with it; verdict: none.

## 4. Behaviour

- 1. src/lib/ui/frame/Modal.svelte:194: ".ground[data-level='palette'] > .scrim {" (background none); what is wrong: every palette-level overlay (Palette.svelte, QuickPick.svelte and the glyph picker built on it, CloneAsk.svelte, AppQuickBox.svelte) now dims nothing, where it covered the page at 0.72 before; the report's row "Modal (item 13)" says the page is "dimmed at half black" and does not name this; failure scenario: Axel opens the command palette and sees the page undimmed with no line telling him it is meant; verdict: none.
- 2. vite.config.ts:95 and :137: "const READERS_WAIT_MS = 15 * 60_000;" and "throw new Error(`the types are still read by ...`)"; what is wrong: `svelte-kit sync`, `npm run check` and `npm run build` now wait while any vitest process of the checkout runs (a watch-mode `npx vitest` until it exits), failing after 15 minutes, and a vitest start waits up to 90 s for the lock; the report's host-visible table has no row for item 17; failure scenario: an agent runs `npm run check` while `npm test` or a watch run is open and sees it hang with one stderr line, then fail after 15 minutes; verdict: none.
- 3. src/lib/server/machine/pty/channel.ts:589-591: "if (this.#attached.get(id)?.has(sink) !== true) { if (message.type === 'input') return true; this.#held.set(sink, ...add(id)); }"; what is wrong: a `resize` from a write-token socket not attached to the terminal now runs `resize-window` and holds the terminal for that socket, where base dropped it; the report's row for item 27 states only "drawn whole"; failure scenario: a page leaves a terminal while its grid's resize is in flight and the late resize sizes the terminal another page is viewing to the first page's grid; verdict: none.
- 4. src/lib/views/structure/map/Map.svelte and src/lib/views/sources/notes-graph/NotesGraph.svelte (the `{#key ...}` around `<Graph>` removed) with DESIGN.md:666; what is wrong: the Notes Graph no longer lays out anew when its node set changes (a new note is placed beside its links), and the same seed gives the same picture only in a pane of the same size; the report's table names the Map only; failure scenario: a reader expecting the Notes Graph's or the Map's old fixed picture for a seed after a resize or a new note sees a different one with no stated reason; verdict: none.
- 5. src/lib/views/sources/repositories/merge/MergeSide.svelte (style block, `.bar.open { border-top-color: var(--c-scm-conflict); }` and `:global(body.wall) .bar` removed): what is wrong: the conflict's choice line no longer marks an open conflict apart from a settled one (no conflict-colour border, no chip background), only the italic settled words; the report's row for item 3 does not say so; failure scenario: in a long merge, a reader scanning the lens lines cannot see at a glance which conflicts are still open other than by the editor tint; verdict: none.

## Declined to judge

- `sh utils/folder-check.sh`, since it runs git (`git rev-parse`, `git ls-files`), outside the three git commands this review may run; a `find` count finds no folder over 10.
- `npm run diagrams`, since it writes `docs/diagrams/`; whether every label fits its box in every diagram is the look.
- The builder's measurement and concurrency runs (notes/c5.js, notes/place-time.js, notes/c18.js and its files, the c17 runs, the createSaves and placeNames `node -e`), since their text is in neither the report nor the disk.
- Case 17's runs on a scratch copy with `.svelte-kit/types` removed, since a scratch copy writes files and this review changes nothing.
- Every case the brief marks the look, since only a page shows it; the orchestrator takes them on the TEST page.
- Whether each of the start patch table's 172 rows names the right outcome and item; only the count against the patch's 171 file diffs is checked.
- Whether pdf.js places any element outside `.oc-pdf` (a print container on `body`) that now loses its styles under `@scope`; not checked against the viewer code.
- Whether `npm run test:quick -- $(cat changed-paths.txt)` matches the report's run, since changed-paths.txt is not on disk; the reviewer ran `-- --base 0f04ce969` instead.

Reviewer usage: ad8a7f0497e2ae8be, claude-opus-5-5, 317492 tokens, 100 tool uses, 19.5 min.

## Repair round 1, refuted

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

All commands ran in `/Users/axelfaes/workspace/research-hub/.agents/worktrees/O37/tools/oculus` unless a line says otherwise. Base 0f04ce969. The round's delta was read from the snapshot `.agents/worktrees/O37-round-1` (its files.txt, 245 paths) against the worktree, and the change since base of every path files.txt does not list.

```
$ npm run test:quick -- --base 0f04ce969          (load 3.24 at the start)
test:quick: 580 changed file(s), from git since 0f04ce969
test:quick: 286 test file(s), 9 essential
ok      ASCII gate (0.9 s)
ok      prettier (1.0 s): All matched files use Prettier code style!
ok      svelte-kit sync (2.9 s)
ok      eslint (2.2 s)
ok      svelte-check (8.4 s): 1792209867504 COMPLETED 514 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (74.0 s): Duration  67.17s (transform 68.55s, setup 0ms, import 124.64s, tests 126.18s, environment 9.66s)
test:quick: 77.1 s (limit 45.0 s); every command passed
test:quick: over the time limit
(exit 0)

$ LC_ALL=C perl -ne '... spec.md ASCII gate ...' $(find src tests config utils docs -type f ! -name local.yml)
(no output) ascii exit 0
$ LC_ALL=C grep -h '[^ -~]' over registries/{venues,pillars,domains,career}.yml and tools/skills/catalog.yaml, lines not in the same grep over O37-base/hub/
venues new non-ASCII lines: 0 / pillars 0 / domains 0 / career 0 / catalog 0
$ sh utils/size-check.sh
size exit 0
$ sh utils/unused-exports.sh, compared by name with O37-base/unused-exports.txt
new names: (none) 0
$ for d in $(find src tests docs utils config -type d); do n=$(ls -A $d | wc -l); [ $n -gt 10 ] && echo "$d $n"; done
docs/diagrams 18
$ grep -rlw <name> src tests, for case 8's twenty names
holdTerminals, stubFetch, stubGated, stubHeld, noopAsync, ChildDouble, NO_CAREER, RESOURCES, feedsFixture, receiveTerminals, sessionsGit, listDeletes, HUB_GIT, deletesListed: 0 files; useClock, Copies, PersonalTarget, REPOSITORY_MANIFEST, RepositoryTarget, Planted: 1 file each, their own
$ npx vitest run tests/checks/source/comment-width.test.ts tests/checks/tree/duplication.test.ts tests/checks/source/history.test.ts   (and again with --testTimeout 0)
Test Files  3 passed (3)   Tests  23 passed (23)   (both runs)
$ npx vitest run <the 107 test files the round added or changed>
Test Files  107 passed (107)   Tests  530 passed (530)   Duration  60.70s
$ npx vitest run <the test files of guarded entries G5, G13, G29, G32, G33, G35, G40, G61>
Test Files  50 passed (50)   Tests  553 passed | 1 skipped (554)

Runs the round's report quotes, rerun:
$ node -e "import('./vite.config.ts').then(async (m) => { const c = await m.default({ mode: 'test', command: 'serve' }); console.log(c.define, globalThis.__SESSIONS_READER__); })"   (R3)
{ __SESSIONS_READER__: '"0686948c6247704c"' } 0686948c6247704c
$ node -e "import('./src/lib/data/sources/config.ts').then((m) => { ... cpSync ... loadConfig x3 ... })"   (R5)
cpSync ms 71.7 / loadConfig ms 212.6 / 165.8 / 165.1
$ python3 -c "import yaml,sys;[yaml.safe_load(open(p)) for p in sys.argv[1:]];print('yaml ok')" registries/venues.yml registries/pillars.yml registries/domains.yml registries/career.yml tools/oculus/config/catalogs/options.yml   (R9, from the worktree root)
yaml ok   exit 0
$ node -e '... L1 scan of build/client/_app/immutable/assets/*.css for ".dialog{" ...'   (L1; build 2026-10-16 20:36, pdf-styles.ts 2026-10-16 15:29)
2.D92qGRfl.css at 181435 inside "@scope(.oc-pdf){:scope" scope opens 13124 chars before
2.D92qGRfl.css at 182310 inside "@scope(.oc-pdf){:scope" scope opens 13999 chars before
2.D92qGRfl.css at 182666 inside "@scope(.oc-pdf){:scope" scope opens 14355 chars before
2.D92qGRfl.css .dialog{ count 3
$ node -e '... the same files, the stack of open blocks at each ".dialog" ...'   (the reviewer's check that each rule is still inside the scope, not only after it)
every ".dialog" occurrence, 181435 to 184880: enclosing ["@scope(.oc-pdf)"] (one also inside "@media screen and (forced-colo...")
$ grep -rln "level=\"palette\"\|level: 'palette'\|level=.palette" src   (R10)
QuickPick.svelte, Modal.svelte, Palette.svelte, CloneAsk.svelte, AppQuickBox.svelte
Case 17, the types lock, rerun as the report quotes it ($H the report's node -e digest of .svelte-kit/types):
  two vitest runs at once: before types b4d5b685b8dc, 0 marks; a2 printed "svelte-kit types: waiting for .../.svelte-kit/oculus-types.lock, held by process 97285"; both "Tests  2 passed (2)", a1 exit 0, a2 exit 0; after types b4d5b685b8dc, marks: 0
  a sync killed while it holds the lock (kill timed after the lock file appeared): lock before kill: YQ530VVFGK 3081 sync pid 3081; sync killed, status 137; its output "svelte-kit types: waiting for the vitest runs 2637"; the reader "Tests  1 passed (1)", reader exit 0; lock left: YQ530VVFGK 3081; next `npx vitest run tests/server/core/lock.test.ts`: next run exit 0, "svelte-kit types: took over .../.svelte-kit/oculus-types.lock, whose process has ended", "Tests  2 passed (2)", lock after: 0; types b4d5b685b8dc
  R11, an idle watch-mode vitest: no reader mark while it waited for a change; `npx svelte-kit sync` beside it exited 0 in 2 s with no waiting line; the watcher killed by its pid
Reviewer's own runs:
$ node -e "import('./src/lib/server/sessions/cache.ts').then((m)=>{try{console.log(JSON.stringify(m.loadCache('$T/none.json')))}catch(e){console.log('loadCache threw:',String(e))}})"
loadCache threw: ReferenceError: __SESSIONS_READER__ is not defined
$ node -e "import('./src/lib/server/sessions/stores/transcripts.ts').then((m)=>{try{const r=m.scan({stores:['$T/store'],codexStores:['$T/codex'],cachePath:'$T/cache.json',overridesPath:'$T/ov.json',registries:[]});console.log('scan ok',r.length)}catch(e){console.log('scan threw:',String(e))}})"
scan threw: ReferenceError: __SESSIONS_READER__ is not defined
(the same command in O37-base/tools/oculus)
base scan ok 0
$ a reader vitest in the background, a `svelte-kit sync` holding the lock, then `node node_modules/vitest/vitest.mjs run tests/server/core/lock.test.ts` waiting on it, sent SIGINT after 4 s
the waiting run printed "svelte-kit types: waiting for .../oculus-types.lock, held by process 6368" 3 times; third status 130
ls -a .svelte-kit | grep oculus-types, after every process ended:
oculus-types.lock.6603.2b468373-98ba-4842-9c23-97d28bb0513f
oculus-types.lock.6603.a09d67f8-4624-4291-a3ed-cbb0522a1cf0
oculus-types.lock.6603.e16c1b5e-dfc3-40ad-8871-4ae224007c28
$ grep -rnE "setTimeout\([^,]+, *[0-9]{3,}|sleep\(|pause\([0-9]{3,}|setTimeout\(r[a-z]*, *[0-9]{2,}" tests   (R4, every test file, not only the ten slowest)
git-failure.test.ts:214 (describe tagged slow), sessions.test.ts:40 (50 ms), svelte-trust.test.ts:60 (50 ms), tiers/landing.mjs:96, tiers/run.mjs:37; no wait of 100 ms or more in an untagged test
$ git status --short | grep '^??\|^A' | awk '{print $2}' | grep "tools/oculus/tests/.*\.test\.ts$", each checked by path and basename against agents/guarded.md and against the report's "Guarded rows"
65 new test files; named in guarded.md: 0; named in "Guarded rows": 0; under tests/views/: 9
```

### Verdicts

Items of the brief's "What to build", in its numbering, for the whole diff since the base. Where a verdict says "the first review's reading", that reading was not redone in this round and the evidence added here is the run named.

- 1: holds, `_one` keys and their readers (the first review's reading); keys.test.ts passed in this round's run of the round's files.
- 2: holds, the G33 row passed in the guarded run above.
- 3: holds, R14 restores the open conflict's mark: MergeSide.svelte:81 `class:open={said === ''}`, :160 `border-left: 2px solid transparent`, :167-168 `.lens.open { border-left-color: var(--c-scm-conflict) }`.
- 4: holds, the first review's reading of choices.ts and GlyphDialog.
- 5: holds, tests/state/boards/map-keeps-places.test.ts passed; DESIGN.md:666 says the behaviour for the Map and the Notes Graph (R13).
- 6: holds, tests/state/boards/map-placement.test.ts passed; the time is printed by the test.
- 7: holds, the first review's reading of Graph.svelte.
- 8: holds, case 8's greps above.
- 9: holds, the first review's reading.
- 10: holds, the first review's reading; row-armed.client.test.ts (L55) passed.
- 11: holds, the first review's reading.
- 12: holds, tests/state/sessions/terminal/latex-held-saves.test.ts passed.
- 13: holds, the built CSS scan above: every `.dialog` rule is inside `@scope(.oc-pdf)`; the computed style is the look (L1).
- 14 to 16: hold, the first review's reading; G29 passed.
- 17: partial, Spec 1 and Behaviour 2; the lock's takeover and waiting hold by case 17's reruns above.
- 18: holds, tests/routes/docs/picture-size.test.ts passed.
- 19: holds, files.yml.
- 20: holds, tests/views/shared/place-names.test.ts passed.
- 21: holds, the first review's reading.
- 22: not applicable, the orchestrator's.
- 23: holds, the first review's reading.
- 24: violated, handed back under R4: test:quick 77.1 s in this rerun; no waiting test remains untagged (the grep above), so the hand-back is right and the item stays unmet.
- 25 to 31: hold, the first review's reading; the G35 rows and the recover row passed in the guarded run.
- 32: violated, Behaviour 1 and Standards 1.
- 33 to 40: hold, the first review's reading; G5, G32, G61 passed; case 40's grep as the first review ran it.
- 41: not applicable for the builder, as in the first review.
- 42: holds for the count, as in the first review.
- 43: holds, the round's section gives a look for every R, O and L item that needs one.

Cases of the brief's "Cases":

- 1, 2: met for the words and the G33 row; the rest is the look.
- 3, 4: not verifiable, the look.
- 5: met for the test (map-keeps-places.test.ts, 5 rows passed); the look for the drawing.
- 6: met for the test (map-placement.test.ts passed); the look for the drawing.
- 7: not verifiable, the look.
- 8: met, the greps above.
- 9 to 11: not verifiable, the look.
- 12: met, latex-held-saves.test.ts passed.
- 13 to 15: not verifiable, the look.
- 16: met for the G29 row; the reload is the look.
- 17: partial, Spec 1 (the wait is said once per project, three times per vitest start) and Behaviour 2 (an interrupted start leaves files beside the lock); the takeover and the two-at-once runs are met (reruns above).
- 18: met, picture-size.test.ts passed.
- 19: met.
- 20: met for the naming (place-names.test.ts); the Kill and the Split composer are the look.
- 21: not verifiable, the look.
- 22: not applicable, the orchestrator's.
- 23: not verifiable, the look.
- 24: unmet, test:quick 77.1 s; handed back under R4 with the per-file times.
- 25, 26: not verifiable, the look.
- 27: met for the G35 rows; the app's tmux terminal is the look.
- 28: not verifiable, the look.
- 29: met for the recover row.
- 30: met for the greps and the G5 rows; R9's order holds (venues.yml:10 `intro:`, :12 `# Schema:`, :13 `schema:`).
- 31: not verifiable, the look.
- 32: partial, the cache row passes under vitest; outside Vite the reader digest is not defined and every scan throws (Behaviour 1).
- 33: not verifiable, the look.
- 34: met for the G61 and G32 rows.
- 35: met, as the first review read it; tab-view-failed.client.test.ts (L61) passed.
- 36: met for the G5 rows.
- 37 to 39: not verifiable, the look.
- 40: met.
- 41: met for the count of rows, as in the first review.

Round items:

- R1: partial, Spec 1. The lock is taken over only once its holder has ended (json.ts `ended`, staleMs null for the types lock) and a live holder is waited on (both reruns above); the schedule record keeps its 60 s age with its reason (record.ts:36-43), the only other caller. The "printing once" part does not hold.
- R2: holds, the two lock.test.ts rows passed and the two-at-once rerun left the types whole (b4d5b685b8dc before and after).
- R3: violated, Behaviour 1 and Standards 1.
- R4: hand-back accepted. The run is over 45 s (77.1 s here) and no untagged test waits 100 ms or more (the grep over every test file above); the builder's own grep covered only the ten slowest files, which the wider grep makes good.
- R5: holds, the three files carry their slow tags with comments that say what the time is; the node -e rerun gives loadConfig 165 to 213 ms a call.
- R6: holds, the runs are now tests (map-keeps-places, map-placement, latex-held-saves, picture-size, place-names, all passed) or node -e quoted whole (case 17, rerun above); no script file of the round is in its scratch folder (`find` over scratchpad/r1 for .js, .mjs, .ts, .sh, .py gives only copies of source files: block.ts, la-base.ts and basekeep*/).
- R7: holds, rerun above, 23 passed.
- R8: partial, Proof 1.
- R9: holds, venues.yml order read in the worktree and yaml ok.
- R10: holds, Modal.svelte:195-203 and the grep above; the before and after are in the report.
- R11: holds, the idle-watcher rerun above.
- R12: holds, channel.ts keeps `#asked` sizes for an unattached socket and applies them in `#attach`; tests/server/machine/pty/channel.test.ts:217-251, both rows read, passed.
- R13: holds, DESIGN.md:666 and map-keeps-places.test.ts.
- R14: holds, item 3 above; the look settles the themes.
- O1: holds, fold.ts `promptFields`, `HEADLESS_ENTRYPOINT = 'sdk-cli'`, `saidByHuman`; transcripts.test.ts passed (15 rows) in the round run.
- O2: holds, storage.ts head comment (:15-37) says what holds across processes; the crossed-save rule (`marksOf`, `marked`, `follow`, load.ts `takeSaved` with `again`) keeps both changes whichever save the browser applies last, by reading the two orders; layout-workspaces.test.ts passed.
- O3, O4, O5: not applicable, the round brief holds only O1 and O2 (`grep -oE "^O[0-9]+\." O37-round1.md` prints O1. and O2.).
- The digest, open item 123 (R3): violated, Behaviour 1 and Standards 1.

Look items. Every test file an L item cites (by path or by name) is among the 107 round files or the guarded files that passed above; no cited test is outside those runs. "Look" means the round's look stands as the remaining proof.

- L1: hand-back accepted. A computed style needs a page; the built CSS (rerun above, with the reviewer's check of the open blocks at each rule) has every `.dialog` rule inside `@scope(.oc-pdf)`. The look settles it.
- L2, L3, L4, L7, L9: hold, the catalogue lines read: files.yml:23 `cancel: Cancel`, :230 `remove_root: Remove`; hpc.yml:9 `cancel_ok: Cancel Job`; session-detail.yml:11 `clear_title: Clear Title` (the report says :10); statusbar.yml:91 and :93 `_one` forms; deposit.yml:50, 56, 62; radar.yml:26 backticks `{0}`. L2's node -e print is not quoted (Proof 2). Look.
- L5: holds by the report's reading; look.
- L6: holds, keys.test.ts passed.
- L8: holds, server.yml:516 and :521 are sentences (the report gives :515-520); look.
- L10: holds, Tooltip.svelte:268 `</Tooltip.Trigger><Tooltip.Portal>`; the compile run is not quoted (Proof 2). Look.
- L11 to L21, L23, L24, L27, L29 to L32, L34 to L37, L39, L40, L46, L47, L49, L54, L55, L57, L58, L60 to L62, L64 to L73, L75 to L88, L90, L91, L97, L99, L100, L105, L107 to L114: hold, each by its cited tests, which passed in this round's runs; the look for what a page shows.
- L22, L25, L26, L33, L38, L41 to L43, L45, L48, L50 to L53, L56, L59, L63, L94, L104: hold as changes with no test, each with the reason the report gives (no mount environment, stylesheet, drawing, one condition); none of these rulings asks for a test; the look settles each.
- L28: holds, Terminal.svelte:104 imports `terminalTabTitle` and its comment at :48 says so; look.
- L44: holds by the report's reading; its node -e walk is not quoted (Proof 2).
- L74: holds by the report's reading; its node -e compile is not quoted (Proof 2).
- L89: hand-back accepted on what can be checked here: the deck POST path adds a body read and a draft map to the GET's path, and src/hooks.server.ts does nothing per method; the node run it rests on is not quoted (Proof 2). The look settles where the 2130 ms goes.
- L92: holds for the change (trash-drops.client.test.ts passed); the measurements are not quoted runs (Proof 2).
- L93: holds for the change: vite.config.ts `WORKER_DEPS` in `optimizeDeps.include`; the dev-server look settles it.
- L95: holds, `files.picker_busy` at files.yml:177, read by explorer/acts/folders.ts:88 and Files.svelte:217; picker.test.ts and panel-busy.client.test.ts passed.
- L96: holds by its tests; see Standards 5 for the comment of CommandRows.svelte.
- L98: hand-back accepted: the premise is not found and program-pdf.client.test.ts passes on both trees; the cause of the look's missing entry stays unknown, which the look must settle.
- L101: holds for the dock floors; the empty message's case is Proof 3.
- L102: holds, src/lib/shell/status/one-row.ts exists, wrapped.ts is gone and `grep -rn "status/wrapped\|from './wrapped" src tests` prints nothing; drop-order.test.ts passed.
- L103: holds by its test.
- L106: holds by its test; see Standards 7 for its head comment.

### 1. Spec

- vite.config.ts:169-180 with :459-503 and json.ts:371: "} else if (waits.tellWait && !told) { console.error(`${owner}: waiting for ${lock}, held by process ${String(held.pid)}`); told = true; }"; what is wrong: `told` is per `takeLock` call, and one vitest start calls `lockTypes` once per test project in `syncTypesOnce`'s `configureServer` (the config has three projects, :536-544), so a start that waits prints the line up to three times: the SIGINT rerun above printed "svelte-kit types: waiting for .../oculus-types.lock, held by process 6368" three times from one vitest process; R1 rules "printing once whom it waits for"; failure scenario: an agent starts `npx vitest run` beside a sync and sees three identical waiting lines, and reads them as three waiting processes; verdict: R1 partial, case 17 partial.

### 2. Proof

- tools/oculus/.scratch/migration/agents/reviews/O37-report.md:1: "Everything in the brief is done. ... and item 32 keeps an explicit `CACHE_VERSION` ("Judgment calls")."; what is wrong: the round appended its not-done line at :635 but left the file's first line, which now claims every item done and names a `CACHE_VERSION` that the round removed (`grep -rn CACHE_VERSION src` finds nothing; cache.ts:25-35 reads `__SESSIONS_READER__`); R8 rules that the first line states what is not done before any result and that "Everything in the brief is done." is written only if true; R4, L1, L89 and L98 are handed back; failure scenario: the orchestrator or Axel reads the first line of the report, books O37 complete and believes the cache still has a hand-raised version; verdict: R8 partial.
- O37-report.md, L89 ("Run (a `node --input-type=module -e` over the demo deck ... three runs)"), L92 ("Measured (`node -e`): `runOps` trash ..."), L2 ("A `node -e` print over the catalogue"), L10 ("a `node -e` compile of the component"), L44 ("a `node -e` walk of every .svelte and .css"), L74 ("a `node -e` compile (dev) of Source.svelte counting `$.assign` lines"), L95 ("`osacompile -l JavaScript` of `pickerScript({ single: true })`"); what is wrong: each run is named and its output given, but the command text is not, so none can be rerun; R6's ruling and the brief's "a `node -e` you quote" ask for runs quoted whole; L89's hand-back ("the time is spent waiting before or after the POST") and L92's figures rest on these runs alone; failure scenario: the orchestrator accepts L89's hand-back and looks for the deck delay in the page, when an unrepeatable server timing taken on a warm process may have missed a cold-path cost; verdict: none (L89's hand-back stands on reading, not on the run).
- tests/shell/panes/dock-floor.test.ts:59-66: "const css = compile(source, { filename: 'Empty.svelte', css: 'external' }).css?.code ?? ''; ... expect(padding).toMatch(/^0 min\(20px, \d+%\) 1em$/);"; what is wrong: the case reads the compiled stylesheet text of ui/frame/Empty.svelte and matches the padding declaration with a regex; it passes for any `min(20px, N%)` whatever the message draws at a width, and fails on a reformatting that draws the same; the round's own L1 ruling says "a test that reads the transformed sheet is not that evidence"; failure scenario: the padding is overridden by a parent rule and the message still crowds a narrow dock while the case stays green; verdict: L101's empty-message part rests on the look only.

### 3. Standards

- vite.config.ts:480: "Object.assign(globalThis, { __SESSIONS_READER__: reader });" with src/lib/server/sessions/cache.ts:25 "declare const __SESSIONS_READER__: string;"; what is wrong: spec.md "What every package obeys", "No globals. No `globalThis`, ... no process-wide bridge ... A package that adds one is not landed."; the config writes a process-wide global so that the server code it loads natively reads it, and cache.ts reads that ambient name at run time wherever `define` did not replace it; tests/checks/tree/boundaries.test.ts:398 checks `globalThis` only under src, so the check passes over vite.config.ts; failure scenario: the package lands with a process-wide bridge the rules file says is never landed, and any other process that loads cache.ts unbundled meets the missing global (Behaviour 1); verdict: R3 violated, item 32 violated.
- tools/oculus/.scratch/migration/agents/guarded.md (head: "A test exists only as the test of one entry, named under it by file and title ... A new entry needs Axel's yes. Views have no entry: the look on TEST covers them.") against the step's 65 new test files; what is wrong: none of the 65 new test files (the `git status` count above) is named in guarded.md or in the report's "Guarded rows" (O37-report.md:563-575, which lists rows of existing files only), and 9 of them are under tests/views/, a layer that has no entry; the brief's report part "The text of each guarded entry row added, by entry, file and name" is how the orchestrator books them, and for these it has nothing to book; the round's rulings L96 to L114 asked for tests, which then need an entry named or Axel's yes for a new one; failure scenario: the orchestrator lands 65 test files that the guarded list does not hold, so the next step's "tests of the guarded entries" leaves them out and nothing says which guarantee each one is for; verdict: none (the rulings asked for the tests; the entry for each is what is missing).
- O37-report.md "The verify list after the last change": "`npm run test:checks`: exit 0, ..." and "The guarded tests, each of the 269 paths of guarded.md alone"; what is wrong: spec.md "What every package obeys" says never the whole suite while working and the list once after the last change; the round's "Verify before you report" names the three tree-check files, and the brief's verify item 4 asks for the guarded tests whose code the step changed; the round ran the whole tree-check suite and all 269 guarded paths; failure scenario: a later round copies the pattern and spends its budget on suites nobody asked for; verdict: none.
- src/lib/ui/html.ts:503-507: "/** What a document is drawn with beyond the document rule. */" directly above "/** What a document is drawn with beyond the document rule: a note's links, ... */" over `export type MarkdownExtras`; what is wrong: two doc comments for one declaration, the first a leftover of the second (spec.md, comments say what the code does, once); failure scenario: an editor's hover shows only the nearer one and a reader of the file sees the same sentence twice and wonders which is current; verdict: none.
- src/lib/shell/keys/rows/CommandRows.svelte:2-3: "The rows of the colon commands, as state/workbench/palette.ts `commandRows` matches them"; what is wrong: `commandRows` is defined at src/lib/shell/keys/palette-modes.ts:96 (`grep -rn "export function commandRows" src`), not in state/workbench/palette.ts; a comment names the thing it points at correctly (spec.md, comments); failure scenario: a reader opens palette.ts to find the matcher and it is not there; verdict: none.
- src/lib/views/sessions/terminal/bar/TerminalBar.svelte:6 ("server refused. The tab names a terminal on the bar"), src/lib/state/system/config/editors/writer.ts:14 ("says nothing and moves no state. It is a plain"), src/lib/views/sources/search/References.svelte:35 ("locations of the latest result from the source tab's editor"); what is wrong: each is a line broken short in the middle of a comment paragraph, the following line starting the rest of the sentence, which the comment-width rewrap left; comments wrap at 100 columns as one paragraph (spec.md, comments; the rules file's "No hard-wrapping" intent); failure scenario: none beyond the read; verdict: none.
- tests/state/client/coded-refusal.test.ts:3-6: "tells the page's notification nothing when the caller sends it `said`, ... and told for a caller that does not, the notification gets the sentence the file browser has for the code"; what is wrong: the sentence does not parse ("and told for a caller that does not, the notification gets"); a comment is plain prose (the rules file's "Writing docs"); failure scenario: a reader cannot tell what the second case asserts from the head comment; verdict: none.

### 4. Behaviour

- src/lib/server/sessions/cache.ts:25-35 ("declare const __SESSIONS_READER__: string; ... return __SESSIONS_READER__;"), reached from src/lib/server/sessions/stores/transcripts.ts:304 (`const previous = loadCache(cachePath);`), with src/desktop/app.ts:225 (`entry: join(checkout, 'src', 'server.ts')`) and src/server.ts:56 (`await import('./lib/server/root/context.ts')`), whose context starts `watchSessions` (src/lib/server/root/context.ts:135, :417); what is wrong: the digest reaches only code that Vite transforms (`define`) or that runs in the process that loaded vite.config.ts (the global above); the desktop app's server is src/server.ts run by Node unbuilt, and its server context imports the transcript store natively, so `__SESSIONS_READER__` is undefined there: the scan under plain Node threw "ReferenceError: __SESSIONS_READER__ is not defined" (rerun above) where the base copy's same scan printed "base scan ok 0"; watch/sessions.ts:191 and :210 catch it and print "sessions watch: rescan failed: ..." on every rescan, so the sessions channel is never published; the report's R3 section says the digest is "given to the server" and quotes only a run of the config process; R3's ruling itself assumed a build-time constant reaches the server, which is not true of this server, so the way the server gets the digest is a choice the ruling did not make (a premise of the ruling found wrong); failure scenario: Axel starts the desktop app (`npm run app`) after this lands: the Sessions view and every session list stay empty, the status bar counts no live session, and the server's log fills with "rescan failed" lines; tests pass because vitest defines the constant; verdict: R3 violated, item 32 violated, case 32 partial, the digest (open item 123) violated.
- src/lib/server/core/json.ts:288-292 (`namingFile`: "const file = `${path}.${String(process.pid)}.${randomUUID()}`; writeFileSync(file, lockText(), { flag: 'wx' });") with :350-351 and :391-392 (the `finally { removeFile(fresh); }`); what is wrong: every `takeLock` writes a naming file beside the lock for the whole of its wait (up to 17 minutes for the types lock) and removes it only in `finally`, which a SIGINT or a kill does not run; nothing removes such a file later (`grep -rn "\.lock\.\|namingFile" src utils vite.config.ts tests` outside json.ts prints nothing); the SIGINT rerun above left three `oculus-types.lock.6603.<uuid>` files in .svelte-kit after every process had ended; the same holds for the schedule record's lock (record.ts:141, `${file}.lock`) and for a claim file `replaceLeft` makes; the report's host-visible table does not say it; failure scenario: an agent presses Ctrl-C on a vitest start that waits on a sync, several times over a week: `.svelte-kit` collects naming files no process owns, and the folder of the schedule record collects `record.lock.<pid>.<uuid>` files after a server killed mid-change; nothing breaks, and nothing ever cleans them; verdict: case 17 partial.

### Declined to judge

- `sh utils/folder-check.sh`, since it runs git beyond the three commands this review may run; the `ls -A` count above shows only docs/diagrams over 10, as on base.
- Every look the round names (R10, R13, R14, O2 and the L items), since only a page shows it and this review opens no browser, app or GUI.
- A task start on a tmux older than 3.3: sessions.ts:646-647 puts `set-option ... remain-on-exit-format ''` last so the commands before it run, but tmux.ts:55-77 `run` rejects on a non-zero exit, so on such a tmux the start would be reported failed although its session exists; not run, since only tmux 3.7c is installed here and DESIGN.md:601 names 3.7c as the session backend.
- Whether the round's changes to the worktree's ledger copies (agents/briefs/O37.md, agents/reviews/owed-looks.md, both different from base and from the main checkout by `cmp`) are the orchestrator's or the builder's; the round snapshot's files.txt holds no `.scratch` path, so the round's own change to them cannot be told apart. The O37.md change reads as /spec's (absolute base paths, "The patch as applied").
- The start patch table's per-row outcomes, as in the first review.
- The L items' reading beyond what the verdicts name: for the items marked "by its cited tests", the verdict rests on those tests passing in this round's runs, not on a fresh reading of each change.

Files this review created outside the report, none deleted: working files under /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o37r/ (delta lists, test outputs, maps); three naming files left by the SIGINT run in /Users/axelfaes/workspace/research-hub/.agents/worktrees/O37/tools/oculus/.svelte-kit/ (oculus-types.lock.6603.2b468373-98ba-4842-9c23-97d28bb0513f, oculus-types.lock.6603.a09d67f8-4624-4291-a3ed-cbb0522a1cf0, oculus-types.lock.6603.e16c1b5e-dfc3-40ad-8871-4ae224007c28), which change no tracked file and which the next lock taker does not use; and two files in the system temporary folder, /var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/x (empty) and /var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/now-u.txt (the unused-exports names), written by a redirect in a check. The vitest runs and the svelte-kit syncs rewrote .svelte-kit/types to the same digest (b4d5b685b8dc before and after).

Reviewer usage: a46985fba3162d6a3, claude-opus-5-5, 230398 tokens, 174 tool uses, 31.6 min.
