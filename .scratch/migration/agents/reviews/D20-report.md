NOT DONE in repair round 1: (a) the layout-write record of item 5 and the `tree-keep.test.ts` of item 21 have a test (item 21) or a one-off check (item 5) but no entry in `agents/guarded.md`, and `agents/spec.md:57` allows a test only as the test of one entry; the entries are the orchestrator's to book (see "Open items for the orchestrator"). The record of item 5 was exercised by a throwaway test file that was deleted, so no standing test covers it. (b) Round 0's NOT DONE stands: the look halves listed under "The look" and case 23's Sessions-view New half (Z515 (2)). (c) The 460 MiB figure of item 14 is the refuter's measurement quoted from the brief; I did not measure it. (d) `test:quick` reads 115 changed files and selects 72 test files; the list passes inside its 45 s limit (22.6 s in the last run). Everything else in items 1 to 21 is built and has its command below.

# D20 repair round 1

Worktree `.agents/worktrees/D20`, tool root `tools/oculus`. No git and no tmux command was run in this round, and no server, browser or `config/local.yml` was touched. The full verify list (`npm run diagrams`, then `checks.sh` from `tools/oculus`) was run **three times**; the third run is the final state and is green. The four tree checks alone, after the last source change: `npx vitest run tests/checks/tree/boundaries.test.ts tests/checks/imports/order.test.ts tests/checks/tree/duplication.test.ts tests/checks/source/comment-width.test.ts` prints `Test Files  4 passed (4)` and `Tests  44 passed (44)`, with no rule of those checks changed.

Third list run, `$TMPDIR/d20r1/checks3.txt`: `ok ASCII gate`, `ok prettier`, `ok svelte-kit sync`, `ok eslint`, `ok svelte-check (0 ERRORS 0 WARNINGS)`, `ok vitest (17.62 s)`, `test:quick: 22.6 s (limit 45.0 s); every command passed`, `checks: 1 commands passed`. Also `sh utils/folder-check.sh` exit 0 and `sh utils/size-check.sh` exit 0. `sh utils/unused-exports.sh` diffed name by name against the `unused-exports.txt` of `.agents/worktrees/X3f-base` (the D20 base copy is not on this machine) adds no name; it drops `PROMPT_MAX`, `ShowInFiles` and `transcriptMarkdown`.

## Open items for the orchestrator

1. Guarded entries to book (Z514/Z468 shape). The tests of items 1 to 4, written under G38 to G41, are named for `guarded.md` as follows. G38: `tests/routes/sessions/compose.test.ts`, describe 'POST /api/terminal, a start with a task', rows 'asks for the approval of an unapproved seed and starts nothing', 'asks again when the seed changed', 'asks again when the agent is another', 'asks again when the folder is another'. G39: same file, describe 'POST /api/terminal, a start in a mode the catalog marks confirm: true', the table 'a %s start with %s and no confirm flag answers %s' (seven rows: five 400, two 200). G40: `tests/server/sessions/transcripts.test.ts`, 'applies every record whole and answers the bytes of the complete lines at a piece of N bytes' (N = 1, 2, 3, 5, 7, 16, 64, 100000), 'starts the next read where the last stopped, and takes a line finished since', 'answers every turn and the offset of the last complete line, and the next read starts there'. G41: `tests/server/core/git-failure.test.ts`, describe 'classifyFailure', 14 rows. New, needing an entry each: item 17 (a stopped merge, cherry-pick or rebase says it is left in progress: `tests/server/git/git-write.test.ts` 'names the merge a cancelled run left in progress, and nothing once it is aborted' and `tests/routes/git/git.test.ts` 'says the merge a cancelled run left in progress'); item 21 (`tests/state/workbench/layout/tree-keep.test.ts`, five rows); item 5 (the layout-write record, no standing test).
2. There was no existing tree test for `removeTab` (`grep -rln "removeTab\|keptPane" tests` prints only check fixtures), so item 21's test is a new file, `tests/state/workbench/layout/tree-keep.test.ts`.
3. The `checks.sh` run selects 72 test files because the round touches `data/shapes/shapes.ts`, `data/model/index.ts` and `core/git/parse.ts`, which many tests import; the runtime was 62.8 s in the first run and 22.6 s in the last.

## Items

**1 (G38 rows).** Four rows in `tests/routes/sessions/compose.test.ts` (a scratch hub with `tasks/tasks.yml`): a seeded start answers `{ approve: { seed, cwd, agent } }` and starts nothing until that exact seed, folder and agent are approved; an approval of one seed does not cover a changed seed, another agent or another folder. Seen failing with the approval check taken out of the start (`$TMPDIR/d20r1/g38-red.txt`): `Tests  4 failed | 12 passed (16)`, `AssertionError: expected { ok: true, terminal: { ...(16) } } to deeply equal { approve: { ...(3) } }`. Restored, green: `npx vitest run --project unit tests/routes/sessions/compose.test.ts` prints `Tests  16 passed (16)`.

**2 (G39 rows).** The table in the same file. Seen failing with the confirm refusal taken out (`g39-red.txt`): `Tests  5 failed | 11 passed (16)`, `AssertionError: expected 200 to be 400`. After: Bypass permissions, Accept edits, Auto (claude), Full access and Never (codex) answer `400 {"error":"needs-confirm","names":["<label>"]}` with no tmux call, then `200` with `confirm: true`; Plan and Workspace write start at once.

**3 (G40).** `tests/server/sessions/transcripts.test.ts`, 10 tests over `foldFrom` and `readTurns` with piece sizes 1, 2, 3, 5, 7, 16, 64 and 100000 bytes, a line split across pieces, a 3-byte and a 4-byte character split across pieces, and a follow-up read from the returned offset. Seen failing twice with the behaviour taken out: decode per line removed (`g40a-red.txt`) `Tests  8 failed | 2 passed (10)`, `AssertionError: expected [] to deeply equal [ 'one \u20ac euro', ...]`; offset accounting changed (`g40b-red.txt`) `Tests  10 failed (10)`, `AssertionError: expected 794 to be 795`. Green now: `Tests  10 passed (10)`.

**4 (G41).** `tests/server/core/git-failure.test.ts`, one row per outcome in the classifier's order (Cancel, time limit, output limit, signal, git's own text, exit status): timed out, signal, exit status with no output, too much output, Cancel, the order pairs, git's fatal line, the last fatal line, a stderr with no fatal line, an empty stderr read from stdout, git text before an exit status. Seen failing with the time-limit branch taken out (`g41a-red.txt`): `2 failed | 12 passed (14)`; with stdout read by its first line (`g41b-red.txt`): `AssertionError: expected { reason: 'On branch main' } to deeply equal { Object (reason) }`. Green: `Tests  14 passed (14)`.

**5 (Z515 (1), layout-write record).** Key `oculus.layout.writes.v1` in `localStorage`: a JSON list of the last 500 entries, newest last. Browser-tab id: `oculus.layout.tab` in `sessionStorage`, a 6-character base-36 string made on first use. Entry shape (`LayoutWrite`, `state/workbench/layout/saved/storage.ts`): `{ at: number (ms), tab: string, call: string, page: string, tabs: string[] }`; `call` is the name of the layout store operation the caller invoked (the outermost, via `named()` at the end of `layout.svelte.ts`), `page` the id of the page on screen, `tabs` every tab of every page and float as `<tab id>:<view id>`. One entry is appended by `storage.write` after each layout write; it reads and writes only those two keys; a refused or unparsable storage loses the record and never the layout write (the layout `setItem` is attempted first, in its own try). Throwaway test run, then deleted: two `openPage` calls produced `[{"at":1791193616164,"tab":"n63i8k","call":"openPage","page":"63975ce7-...","tabs":["e1dba54a-...:status","646b6832-...:status"]}, {... "tabs":[... 3 tabs]}]` with `sessionStorage` holding `{"oculus.layout.tab":"n63i8k"}`, the storage holding only `oculus.layout.v1` and `oculus.layout.writes.v1`, the list capped at 500 after 520 writes, and a `setItem` that throws for the record key leaving the layout write in place. Written in DESIGN.md's Pages paragraph ("Every write of the saved layout is also recorded").

**6 (last `fatal:` line).** Kept, in `gitsReason` of `parse.ts`, and stated in DESIGN.md's Git paragraph next to the classifier's order ("The reason of git's own text is the last line of stderr that begins `fatal: `"). Row 'the last fatal line wins over the progress lines before it'.

**7 (git.test.ts abort).** `tests/routes/git/git.test.ts` 'cancel ends the write in flight...' now waits on a promise settled when both writes are in flight and awaits the first write's own answer (which settles only after its signal aborted); `grep -n "waitFor\|vi\." tests/routes/git/git.test.ts` prints nothing.

**8 (report).** Corrected under "Git commands that run hooks" below: `--abort` of a merge, cherry-pick or rebase and `worktree remove` run no hook and keep the 10 s limit (`limitOf`, `git-write.ts:629`; `git-write.ts:748` `args[0] === 'add' ? NO_TIME_LIMIT : TIMEOUT_MS`); the worktree question's No runs nothing (`Repositories.svelte:319-330`, the worktree is made only in the callback `ask` runs on Yes).

**9 (layer boundaries).** `composer.ts` takes `taskRefOf` from `data/shapes/shapes.ts` and `confirmValues` from the `data/model` facade (moved there, `task-ref.ts` and `agent-confirm.ts` are gone); `task-card.ts`, `rows.ts` and `Collection.svelte` import `TaskRef` from `state/sessions/terminals.svelte`, which re-exports it. `boundaries.test.ts` passes unchanged (4 checks above).

**10 (task-seed import).** The read half of a collection (`collectionFile`, `identityField`, `readCollection`, `identityOf`, `entryOf`, the `Collection` type, `entryId`, `identityText`) is in `server/files/fs/collections.ts`; `entries.ts`, `subtasks.ts`, `undo.ts`, `writes.ts` and `task-seed.ts` import it from there. `order.test.ts` passes unchanged.

**11 (10 shared lines).** `act` of `views/boards/focus/rows.ts` takes the client (`writes`, `terminals`) and starts the composer itself; `CommandCenter.svelte` and `Tasks.svelte` call `act(client, view.index[id], action, now)`. `duplication.test.ts` passes. The two other copies it reported are also ended: `merge`'s parameter is `other` in place of the `name` it shared with `switchBranch`, and `ChangesRepo.svelte` and `ChangeGroups.svelte` take their six handlers from `ChangeActions` in `views/shared/changes/change-actions.ts`.

**12 (comment width).** `comment-width.test.ts` passes (`Tests  2 passed (2)`); `running.ts`, `git-routes.ts`, `Terminal.svelte` (two paragraphs), `start/Composer.svelte` and the `repo-menu.ts` head are rewrapped as one paragraph each.

**13.** `WorktreeStart` has its own doc comment and `BranchDeletion` its own, in `repositories.svelte.ts`.

**14.** DESIGN.md's transcript paragraph: "`readTurns` holds every turn of the file while it reads, which costs about 460 MiB more for a 629 MB transcript" (the refuter's figure, not measured here).

**15.** `task-seed.ts` head comment of `taskSeed`: "does not hold it". `grep -rn "does not holds" src DESIGN.md HELP.md` prints nothing.

**16 (empty stderr).** Before: a clean-tree commit answered `On branch main` (`g41b-red.txt`, the first line of stdout). After: `nothing to commit, working tree clean`, row 'an empty error stream gives the last non-empty line of the output stream'.

**17 (Cancel of a merge, cherry-pick or rebase).** Before: `Git was stopped by Cancel` and the view drew no in-progress state (`i17-red.txt`: `expected { error: 'Git was stopped by Cancel' } to deeply equal ...`; `expected undefined to be 'merge'`). After: `stoppedOn`, `cherryPick` and `continueRebase` (`git-index.ts`) read the repository for an unfinished merge, rebase or cherry-pick on any failure, including Cancel, and `failure.left` carries it; the route words it `Git was stopped by Cancel; the merge is left in progress` (`server.git.left_in_progress`, `kind_merge`, `kind_rebase`, `kind_cherry_pick` in `config/text/server.yml`). `merge`, `stoppedOn` and `unmergedPaths` moved from `git-write.ts` (870 lines before, 798 now) to `git-index.ts` (496).

**18 (pressed state).** Before: `.tool.bare[aria-pressed='true']` drew the accent fill and `outline: 1px solid var(--accent)`, the same outline as `.tool:focus-visible`, so a focused pressed button looked like an unfocused one. After: the pressed rule sets the fill and text colour only (`ToolButton.svelte`), the ring stays the focus rule's. Not looked at in a browser (forbidden); the page look is the orchestrator's.

**19.** DESIGN.md's Git paragraph states the two limits of `killWithDescendants` beside Cancel: one `ps -A -o pid= -o ppid=` read, so a child started after it is not reached, and a process detached by `setsid` has left the chain the read follows.

**20.** No git and no tmux command was run in this round.

**21 (one empty pane per page).** Before (`i21-red.txt`, the old rule): with an empty documents pane on the page, closing the last Terminal tab of another pane left `['0/-', '0/terminals']`, and the converse left `['0/terminals', '0/-']`. After: `keptPane` (`state/workbench/layout/tree.ts`) keeps the pane only when the rule names its view and no other empty unlocked pane of any kind is in the tree; a locked pane is unchanged. Rows: an empty documents pane present, the terminals pane goes; an empty terminals pane present, the documents pane goes; no other empty pane, the pane stays; the only other empty pane locked, the pane stays; a tool view's pane goes. `Tests  5 passed (5)`. Head comment of `keptPane`, DESIGN.md's pane-keeping sentence and HELP.md's "Where an opened tab lands" sentence rewritten; `landing.ts` was read and its order (an empty documents pane, then an empty terminals pane) stays true for a saved tree that holds both.

Files with line counts changed in this round (`wc -l`): `git-write.ts` 798, `git-index.ts` 496, `git-routes.ts` 478, `parse.ts` 730, `collections.ts` 169, `entries.ts` 468, `storage.ts` 171, `layout.svelte.ts` 856, `tree.ts` 541, `change-actions.ts` 18, `rows.ts` 304; the line-count table further down is round 0's.

# D20 report (round 0)

NOT DONE by the builder: the look halves listed under "The look" (they need the page in a browser, which the brief forbids a builder to open), and case 23's Sessions-view New half, which is owed to Z515 (2). Every other item and case of the brief is built and has its quoted run below.

# D20 report: an agent started from a task or in a new worktree, with the terminal, graph, git and transcript defects booked on it

Worktree `.agents/worktrees/D20`, tool root `tools/oculus`, base 16b31cef0. Node 24.21.0.

## Open items of the state file (verbatim, `sed -n 158,178p .scratch/migration/orchestrator-state.md`)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

- Z511 (2026-10-05, A3's choice 5, unattended runs and permissions): with `tasks.skip_permissions: true`, a scheduled Update run starts a Claude session with no person present. (a) it starts with `--dangerously-skip-permissions`, the written schedule standing as the yes. For: VS Code's Automations run with the agent's configured permissions; a scheduled run actually runs. Against: an agent edits and runs commands with nobody asked, on a timer. (b) a scheduled run is held in the tray until a press starts it. For: nothing runs unasked. Against: no unattended run, which is what A3 is for. (c) scheduled runs always start with prompts on, whatever `skip_permissions` says. For: nothing skips a prompt unasked. Against: the run stops at its first prompt with nobody there, so it rarely finishes. Recommendation: (a), the risk stated in HELP.md and the option's description. Yours, since it decides what runs on your machine without you.
- Z512 (2026-10-05, A3's guarded entries): (1) a new entry: "A scheduled update task starts once per due time: a due time missed while the server was down starts one catch-up run at the next start, a due time while that task's earlier run is going starts nothing and is recorded as skipped, a due time already recorded as handled never starts again, and close() leaves no timer and starts nothing." Code: `src/lib/server/machine/tasks/schedule.ts`, `src/lib/server/machine/tasks/start.ts`. For: a run started twice, or never, costs a Claude run or a missed one. Against: one more guarded test. (2) G31 widened: `~/.oculus/schedule.json` joins its files and `src/lib/server/machine/tasks/record.ts` its Code line. Recommendation: yes to both. Without them, those cases are runs the report quotes and nothing guards them later.
- Z514 (2026-10-05, D20's guarded entries): four new entries, each with its test: (1) "A seeded agent runs only after its exact seed, folder and agent are approved; a changed seed asks again." (rows in `tests/routes/sessions/compose.test.ts`); (2) "A start in a mode the agents catalog marks `confirm: true` is refused without the confirmation." (a row there); (3) "A transcript above Node's string limit is read whole in pieces, and the next read asks from where the last one stopped." (a new `tests/server/sessions/transcripts.test.ts`, a small piece size); (4) "A git command that fails says why: timed out, ended by a signal, an exit status with no output, or too much output." (a table beside `shortReason`). For: an agent run without approval, a transcript that shows no turns and a failure with no reason each cost real work. Against: four more guarded tests. Recommendation: yes to all four.
- Z515 (2026-10-05, D20's causes not found read-only): (1) Z307's Terminal tab dropping out of the layout: tried the server list paths, the path with no server, cut rows, `survivorsShape`, `takeSaved` across browser tabs, the control client's lifetime, `endedTerminals` on the first `sessions` message; settled by a log of the layout writes per browser tab or the server's stderr of 2026-10-03 20:12 to 20:15. (2) Z313's Sessions New button opening nothing: the button and the `n` key reach the same `composeIn`; settled on TEST by `document.elementFromPoint` at the button and whether its `onclick` runs. (3) Z312's pill opening nothing while a write is in flight: the commit's menu answers four items while busy; settled by ContextMenu's state during a write on TEST. Recommendation: the orchestrator takes (2) and (3) on TEST before D20's builder starts and writes what it finds into the brief; (1) stays out of D20 until it recurs with the log in place. Yours, since a cause not found leaves part of a ruling unbuilt.
- Z517 (2026-10-05, O30's libraries, yours by standing rule): (D1) the packager: (a) `@electron/packager` 20.3.0 (BSD-2-Clause, Electron's own, makes and signs the `.app` only); (b) `electron-builder` 26.15.3; (c) `@electron-forge/cli` 8.0.1, both bringing installers and updaters this step does not need; (d) none, leaving "Electron" in the menu bar. (D2) the login shell's environment for a Dock start: (a) `shell-env` 4.0.3 (MIT, sindresorhus), the whole environment; (b) `fix-path` 5.0.0, PATH only; (c) by hand; (d) none, so a Dock start finds no tmux, git or claude (`/opt/homebrew/bin` comes from `~/.zprofile`). (D3) a text field's right-click menu: (a) `electron-context-menu` 5.1.0 (MIT, needs node 24, which Electron 44.5.1 carries); (b) by hand; (c) none, so a plain field has no Paste on right-click. Electron itself is 44.5.1 (O30 ruling). Recommendation: (a) for each. The lazy option is (d), (d) and (c).
- Z518 (2026-10-05, O30's guarded entries): (1) under "Never happens": "An app window shows only its own server's page: a navigation or a window opened to any other address goes to the default browser and never into an app window, the bridge answers only the top frame of the server's page, and every app window keeps Node integration off and context isolation and the sandbox on, subframes included." Code: `src/desktop/`. (2) under "It starts, and configuration is checked": "The app runs one server and ends it: a second start brings the first forward and starts nothing, a port in use starts no second server and says so with the port, and Quit stops the server process and leaves every tmux session running." Code: `src/desktop/`, `src/server.ts`. For: (1) is the app's security boundary, (2) loses terminals if wrong. Recommendation: yes to both.
- Z521 (2026-10-05, E4's `closed_paths`, a rule clash): DESIGN.md's apps section and Z107 (b2) say a `closed_paths` that is missing or wrong gives a finding and closes every file target to apps; Z443, Z454, Z494 and G13 say a wrong setting takes its default with a finding, here `[secrets]`. (a) close every file target (fails closed). For: a mistyped security list never opens a folder. Against: one setting behaves unlike all others. (b) take the default `[secrets]` with a finding. For: one rule for every setting. Against: a mistyped list leaves every other private folder open to apps. Recommendation: (a). The lazy option is (b), which reuses the value rule unchanged.
- Z522 (2026-10-05, E4's libraries, yours by standing rule): `penpal` 8.0.1 (MIT, aaronius, 2026-08-14, ruled by LA18) pinned exactly. Candidates that would replace hand-written code, each a few lines replaced by glue of the same size: `helmet` 8.3.0 (Express middleware the SvelteKit route cannot use), `csp-header` 6.4.0 (one policy string), `limiter` 4.1.0 (three sliding counts), `fdir` 6.5.0 (the app folder walk; already a transitive dependency). Recommendation: none of the four.
- Z523 (2026-10-05, E4's guarded entries): (GA, under "Never happens") "An app reaches only what its approval names: its files are served only while it is approved, under its current address key, and only from its recorded list inside its real folder; `open` never reaches the engine root, oculus's own config folder, a dot path or a `closed_paths` folder by any root key or link; a write it sends is refused unless the kind its body matched is the open kind its header names; an approval is taken only for the hash the reader was shown; a manifest asking for a closed channel or write is refused before approval." (GC, under "Your work is not lost or misplaced") "An app's tab never receives a store value older than one the page has seen pushed: an answer a later push contradicts is dropped and fetched again." And G1's Code line naming the new `approve` route. Recommendation: yes to all three; GA is the apps' security boundary.
- Z524 (2026-10-05, X3e's diagnoses, a guarded entry): the 5 s Delete and the hub Graph's 10 s first read have one cause: the git watcher reads each written root with about a dozen synchronous git commands (`spawnSync`, `core/git/run.ts:145-179`, from `root/watch/git.ts:233-277` and `:419-447`), and while builders write in `.agents/worktrees/*` those reads hold the server's one event loop for seconds (`agents/reviews/X3e-diagnosis-delete.md`, `X3e-diagnosis-graph.md`). The fix runs the reads through `execFile`, one read per root at a time; the Delete went from a 6405 ms mean to 158 ms, a Graph request's wait from up to 13369 ms to 3 ms. Each diagnosis wrote a test that is red without the fix (`expected 'git' to be 'timer'`; `expected 1097.5 to be less than 250`), and spec.md:57 allows a test only under a guarded entry. (a) a new entry, "A request is answered while the git watcher reads a root." Code: `src/lib/server/root/watch/git.ts`, `src/lib/server/core/git/state.ts`, `src/lib/server/core/git/run.ts`. For: the stall comes back unseen if a later change runs git synchronously again. Against: a slow answer loses no work, breaks no installation and accepts no wrong configuration, which is the bar `scripts-compute-facts.md` sets for a test. (b) no test; the diagnoses' red commands are the step's checks, quoted in its report. Recommendation: (b), by that rule. The lazy option does not apply: both build the fix.
- Z527 (2026-10-05, X3e's folder panel, a guarded entry): the panel diagnosis wrote five tests (`tests/server/files/picker.test.ts`, four red without the fix) for the cause it proved (the osascript a press starts is never ended, so a reload or a dev-server restart leaves an orphaned panel, and a -128 cancel is answered `failed`). No entry covers them: G1 covers only the picker's token row. (a) a new entry, "A folder panel lives no longer than the request that opened it, and a cancel adds no folder and says no failure." Code: `src/lib/server/files/fs/picker.ts`, `src/routes/api/(files)/folders/pick/+server.ts`. For: a panel left open after a reload is a native window the reader has to find and close, and a second press opens a second one. Against: one more guarded unit. (b) no tests; the panel's red command is X3e's gate (brief item H3). Recommendation: (a), since an orphaned native window is a broken use the suite should keep closed. X3e's brief holds either way.
- Z529 (2026-10-05, D28's libraries): D28 (saving a file as VS Code does) checked libraries for each capability it builds, all MIT or BSD unless said: a whole-file UTF-8 test (`utf-8-validate` 6.0.6, native; `isutf8` 4.0.4; `chardet` 2.2.0; `iconv-lite` 0.7.3), a hash (`js-sha256` 1.0.0; `hash-wasm` 4.12.0), watching the disk (`chokidar` 5.0.0; `@parcel/watcher` 2.6.0, native), the compare (`diff` 9.0.0, BSD-3-Clause). Recommendation: none of them; the fatal `TextDecoder` and `buffer.isUtf8` are built in, `node:crypto` and Web Crypto hash, `server/core/file-poll.ts` already polls a file, and Monaco's diff editor is in use. `write-file-atomic` 8.0.0 is already a dependency and stays.
- Z530 (2026-10-05, D28's guarded entries): N1, G8's Code line gains `src/lib/server/files/source.ts` (a save refused when the file's bytes moved since the read). N2, new: "A save never replaces a file whose bytes an editor could not have read: a file that holds a NUL byte or is not UTF-8 throughout is refused, and a file that starts with the UTF-8 byte order mark keeps it." N3, new: "A save changes only what the reader typed and what the save keys name: trimming takes only spaces and tabs at a line's end and never a line ending, the final newline adds or takes only line endings at the end of the file in the file's own form, and an automatic save keeps the whitespace on the caret's line." N4, new: "An automatic save writes only a tab that holds unsaved text, is writable and read whole, names a file on disk, and has heard of no change of that file since it read it, and it sends the base it read." N5, G28's text widened: "An unsaved edit survives a tab switch, a reload and a change of its file on disk, and closing a tab ... asks first, except under `editor.autosave` `on_focus_change` or `after_delay` of 1000 ms or less, where the close saves it." N6, G2's Code line gains `server/files/fs/open-files.ts`, so a `source:` channel naming a path outside the roots is never polled. Recommendation: yes to each; every one guards lost or damaged file content. Without them D28 lands those behaviours with no test.
- Z531 (2026-10-05, X3f's case 17, from the review over its round 2): the round-2 brief's case 17 says a read-only Markdown tab over a file at HEAD or in the index (Open File (HEAD)) lists only the Blame row in the palette; the landed code lists no row, since `Source.svelte:230` gives such a tab no repository and `blameOf` (`server/core/git/reads.ts:294`) runs `git blame --porcelain -- <path>` over the worktree file only. (a) blame offered on those tabs: `blameOf` takes the revision (`HEAD`, or the index blob given with `--contents`), the `blame=` read on `/api/git` names it, the gutter asks with it; added as a widening of a queued step. For: the case as written, and the lines of a file at HEAD say who wrote them. Against: one server read and its route widened. (b) the case ruled wrong: Blame stays a working-file action. For: nothing to build. Against: a HEAD tab shows text with no way to see its authors. Recommendation: (a); (b) is the lazy option. Not verified which of the two VS Code's own blame decoration does on a `git:` document.
- Z507 (2026-10-05, S5's look with Q119, an exception to the looks rule): the round moves oculus's port default (8791 to 8790) and makes a wrong value take its default with a finding at start; showing that needs a server started with a wrong value, which Axel's server on 8790 never is. (a) the look runs on a scratch oculus with its own config, HOME and TMUX_TMPDIR, as D35's port move was looked at. For: the look is taken before the commit (Z467); Axel's server is never restarted. Against: a second exception to "looks only on TEST". (b) the look on Axel's server after he restarts it with a wrong value. For: the TEST page. Against: the look is owed, which Z494 forbids, and it needs Axel's hands. Recommendation: (a).
- Z504 (2026-10-05, D45's choice 8, a feature dropped): LaTeX Workshop runs its tools in a Docker image when `docker.enabled` is on (off by default; three keys: `docker.enabled`, `docker.image.latex`, `docker.path`) and shares its viewer over Live Share. `command -v docker` prints nothing on this machine, and oculus has no shared-session layer, so Live Share cannot be built under either option. (a) the Docker wrapper built (three `latex.docker_*` keys, the tools looked up as `docker`, SyncTeX paths translated from the container), Live Share left out. For: one of the two features kept. Against: no case or look can run it here, so every Docker claim stays not verified. (b) both left out. For: nothing built that cannot be tried. Against: two LaTeX Workshop features dropped, which needs your yes (Z468). Recommendation: (b), with Docker added when a machine with Docker is in use.

## Boundaries

- Two read-only `git status` calls were run in the worktree and one `tmux ls` on the default socket (it printed the names of two of Axel's oculus shell sessions: `oculus-0d6021-shell`, `oculus-2ab8f4-shell`). Nothing was written through either; no git command ran otherwise and no tmux command was run by any probe (the compose cases use the fake runner of `tests/routes/sessions/terminal-fixture.ts`; `grep -n "execFile.*'tmux'\|spawn.*'tmux'"` over every probe prints nothing).
- Ports 8787 and 8790 were not contacted, no browser was opened, no real Claude or Codex was started, `config/local.yml` was not opened, and the real `~/.oculus/approvals.json` was not touched (every approval case ran over a scratch file).
- Files changed outside the brief's "Paths this step writes", each because the named thing is more than the listed file: `src/lib/data/model/index.ts` (exports `TaskRef`), `src/lib/data/shapes/shapes.ts` (gains `taskRefOf`, the zod shape of a task reference), `src/lib/data/model/model-agents.ts` (gains `confirmValues`, the `confirm` reading), `src/lib/server/machine/seeds/task-start.ts` (new, the start-side checks beside `task-seed.ts`), `src/lib/server/git/git-index.ts` and `git-remote.ts` (the signal of a run passes through `cherryPick`, `rebaseContinue`, `pull` and `sync`), `src/lib/state/sessions/terminal/pty/pty-io.ts` (the approval and seed types of a start's answer), `src/lib/views/sessions/terminal/terminal-list.ts`, `src/lib/views/shared/sessions/SteerBox.svelte` and `src/lib/views/sessions/session-list/Customizations.svelte` (the import path of the moved `composer.ts`), and `tests/server/root/context-fixture.ts` (the server context the git routes read gains `gitRunning`).

## The cases' first run on the unchanged tree

The unchanged tree is `$TMPDIR/d20build/base` (the base copy with `node_modules` linked); the probes ran there with `vitest.base.config.mjs`. A case whose feature does not exist on that tree has the command that shows the absence. Quoted results are the printed lines, shortened only where a path or a JSON body was long.

- 1-5 (Focus and command-center `agent`, the Tasks card): `grep -c "'agent'" src/lib/views/boards/focus/rows.ts` prints 0; `ls src/lib/views/boards/collection/` prints Collection.svelte, Coverage.svelte, EntryCard.svelte, Software.svelte (no task-card.ts); `POST action: seed` answers `400 {"error":"not-an-action"}`.
- 6, 7, 7a, 8, 59, 60, 61, 62 (the seed): `ls src/lib/server/machine/` prints approvals, commands, hpc, lines.ts, processes, pty, usage (no seeds folder); `grep -rln "taskSeed\|task-seed" src` prints nothing; the `seed` action is `not-an-action` as above.
- 9: `seed` answers `400 {"error":"not-an-action"}`, so neither `task-unknown` nor `task-changed` exists.
- 10, 11, 63: `grep -n task src/lib/state/sessions/terminal/composer.ts` prints nothing and `ComposeStart` (`model-agents.ts`) holds no `task`; `compose` with `task` and `seed` answers `200` and starts at once (tmux calls 2).
- 12-17: `approve-seed` answers `400 {"error":"not-an-action"}`; `compose` with a task starts at once with no approval (`200`, tmux calls 2), so first start, same seed again, another folder, Codex, twice, unwritable file and changed seed have no behaviour to run.
- 18: `seed` without the token answers `403 {"error":"the write token is missing or stale"}` (the token gate is the same on the unchanged tree).
- 19, 20, 23: `grep -rln -i bypass src config --exclude=local.yml` prints `src/lib/data/sources/config/catalog/agents.ts` and `config/catalogs/agents.yml` only: no confirmation for any pick exists.
- 21: `compose` with `picks: { mode: 'bypassPermissions' }` and no confirm answers `200` and starts (tmux calls 2); Codex with `sandbox: 'danger-full-access'` also `200`, tmux calls 2.
- 22 (kept test, G13 row): the row in its final form fails on the unchanged tree: `AssertionError: expected [ [ 11, 'value' ], ...(6) ] to deeply equal [ [ 11, 'value' ], ...(4) ]`, the received list adding `[15, 'unknown_key']`, `[16, 'unknown_key']`, `[17, 'unknown_key']` in place of `[15, 'shape']`, at `tests/data/sources/agents-catalog.test.ts:42`.
- 24, 28: `createWorktree` over a scratch repository: `{"ok":true,"output":"HEAD is now at 5a7f076 init\n"}`, directory present, branch `look-a2`; main checkout porcelain `" M a\n?? .agents/\n?? dirty\n"`, worktree porcelain empty; detached HEAD: ok. The Create control draws one shell start; no `composeAt` exists (`grep -rn composeAt src` prints nothing).
- 25, 27, 28a: `grep -n -i "claude\|codex" src/lib/views/sources/repositories/menus/repo-menu.ts src/lib/views/sources/repositories/refs/Worktrees.svelte` prints nothing: no agent control on the new-worktree row or the worktree row's menu.
- 26: a taken name answers `{"ok":false,"error":"there is already something at <root>/.agents/worktrees/look-a2"}` (the words oculus's own check says; the same on the unchanged tree).
- 29-33 (`foldFrom`): the unchanged tree is green on all five, because it takes no piece argument and reads the whole range in one buffer: 29 applied [0..11] answer 998; 30 euro sign decoded whole, answer 91; 31 applied [1,2] answer 1037; 32 offset beyond size 0, missing file 0; 33 first [1,2] 38, next [3] 19. These cases state invariants of the new piecewise read and do not fail before the change.
- 34: a 566,231,096-byte file with a 540 MiB line between two small ones: `applied [] answer 0 in 368 ms` (the whole-file decode throws, the read answers 0).
- 35: a 629,146,085-byte transcript: `readTurns(path,'claude',0)`: `turns 0, offset 0 (file size 629146085) in 284 ms`; the route's first read: `turns 0 offset 0 status 200`.
- 36: the export of that file answers `200` with a 62-character body, `"# Big\n\n- Session: a\n- Agent: claude\n- Folder: /x\n- Started: z\n"`; fixtures A (10 turns, 501 bytes) and B (4 turns, 268 bytes) were run through the base copy's `transcriptMarkdown` and written as `fixture-A.base.md` and `fixture-B.base.md`, the references of the final `cmp`.
- 37, 38: `grep -n "aria-pressed\|\.pressed" src/lib/ui/controls/ToolButton.svelte` prints only `193:        aria-pressed={pressed}`: no rule styles a pressed bare button.
- 39, 40, 41, 53: `grep -rn "startingIn\|terminal_starting" src config --exclude=local.yml` prints nothing.
- 42: the arguments of a shell start before `--`: `["new-session","-d","-s","oculus-81a31e-shell","-c","<hub>","-x","80","-y","24"]`, `has CLAUDE_CODE_DISABLE_ALTERNATE_SCREEN: false`; a Claude start `has the variable: false`; the usage refresh's own start (`startArgs('usage-x', { kind: 'claude', cwd: '/hub', cols: 120, rows: 40 }, 'claude --model m --name n')`, as `refresh.ts:96` calls it) carries no `-e` pair on the unchanged tree: `-e pairs [] | carries CLAUDE_CODE_DISABLE_ALTERNATE_SCREEN: false`.
- 43: a look case; no first run applies.
- 44: idle, `refMenu(look-branch, none)` answers `[]`; `other` Checkout and Delete Branch enabled; `origin/remote-branch` Checkout (Detached); `v-look` Delete Tag; `commitMenu` lists Checkout[other]. In flight every `refMenu` answers `[]` and `commitMenu` answers Open Changes, Copy Commit ID, Copy Commit Message, Compare with.... The current branch's pill has no menu.
- 45: a pre-commit hook of 25 s: `10 s {"ok":false,..."error":"Command failed: git -C <scratch>/c45a commit -F <tmp>/message.txt"}`; of 35 s: the same at 10 s.
- 46: a hook exiting 1 with no output: `1.5 s {"ok":false,"error":"Command failed: git -C <scratch>/c46 commit -F <tmp>/message.txt"}`.
- 47, 50 (classifier): `grep -c classifyFailure src/lib/server/core/git/parse.ts` prints 0; a timed-out commit says `Command failed: git -C ... commit -F ...` (case 45), so none of the six sentences can be produced. Case 50: a fetch against a helper that sleeps 100 s: `60 s 400 {"error":"Command failed: git -C <scratch>/c50 fetch --prune"}`.
- 48: `gh(['--version'], 2000)` with an executable `gh` whose body is `exec sleep 30`: `2 s {"ok":false,"output":"","error":"Command failed: gh --version"}`; the deposit's `commitFile` with a 25 s hook: `10 s {"ok":false,..."error":"Command failed: git -C <scratch>/c48-mirrors/m commit -F <scratch>/c48-msg.txt"}`.
- 49: `writeGit('stage')` with a fetch that never answers returned after `30006 ms` with `"no answer came in time, so the write was given up and may not have landed"`.
- 51, 52, 55: `compose` over a Codex default `approval: never` with no pick: `200`, tmux calls 2; over `confirm: 'yes'` on `acceptEdits` with no confirm sent: `200`, tmux calls 2 (the key is `unknown_key` to the reader, case 22); a task of 99,970 characters plus 20 typed: `200`, tmux calls 2 (the task is ignored).
- 54: `compose` with `agent: 'shell'` and a task: `200`, tmux calls 2.
- 56: `POST {action: 'cancel'}` answers `400 {"error":"the body is not a git action"}`.
- 57: the 70 s `pre-push`: `60 s {"ok":false,..."error":"Command failed: git -C <scratch>/c57push push"}`; the 15 s `post-checkout`: switch `10 s {"ok":false,"error":"Switched to branch 'other'"}`, `worktree add` `10 s {"ok":false,"error":"Preparing worktree (new branch 'look-wt')"}`; the 65 s `post-merge` pull: `60.0 s {"ok":false,"output":"","error":"From <scratch>/c57p65-bare"}` (the same pull with a 15 s hook completes at 15.3 s, so the 65 s row is the one that fails); `rebaseIn --abort` and `worktree remove` use `TIMEOUT_MS` (10 s) on the unchanged tree and keep it.
- 58: `composeAt` does not exist (`grep -rn composeAt src` prints nothing).
- 64: a look case; no first run applies.
- Kept test, G33 (`cancel`): the test file imports `src/lib/server/core/git/running.ts`, which the unchanged tree lacks, so the suite fails to load: `Error: Cannot find module '../../../src/lib/server/core/git/running.ts' imported from <base>/tests/routes/git/git.test.ts`.

## DONE / NOT DONE

| Item | State | Proof |
|---|---|---|
| 1 A task's agent through the composer | DONE | `seed`, `approve-seed`, `task` on `compose`; cases 1-18, 54, 55, 58-63 quoted below; run `seed.probe.ts`, `route.probe.ts`, `client.probe.ts`, `c59.probe.ts` |
| 2 Claude or Codex in a fresh worktree | DONE | cases 24-28 quoted below; `wt.probe.ts` over a scratch repository, `client.probe.ts` over fake writes |
| 3 Armed Kill and every pressed bare button | DONE (look half owed) | `ToolButton.svelte:204-212`; look: cases 37, 38 |
| 4 The Terminal tab while New Terminal starts | DONE (look half owed) | cases 40, 41, 53 quoted; look: case 39 |
| 5 The Claude grid keeps its scrollback | DONE (look half owed) | case 42 quoted; look: case 43 |
| 6 The Graph's pill menus | DONE (look half owed) | case 44 quoted; look: case 44 idle |
| 7 Git hooks complete, Cancel, a failed command says why | DONE (look halves owed) | cases 45-50, 56, 57 quoted; look: 45 at 35 s, 46, 56 |
| 8 A transcript above the string limit | DONE (look half owed) | cases 29-36 quoted; look: the 634 MB session |
| 9 The documents | DONE | `HELP.md` and `DESIGN.md` lines marked below |
| Verify 1, the verify list | DONE | `checks: 1 commands passed`, exit 0, quoted below |
| Verify 2, token discipline | DONE | 5 full-list runs, the 5th after the last change; the named test files each alone, quoted below |
| Verify 3, sizes | DONE | `wc -l` table below; `sh utils/folder-check.sh` exit 0; `unused-exports.sh` diff quoted |
| Verify 4, ASCII gate | DONE | the gate of `agents/spec.md:97` prints nothing |
| Verify 5, the two kept tests | DONE | failing lines quoted below |
| Verify 6, each case's run | DONE | every case 1-64 has a quoted run or a stated look half |
| Verify 7, the greps | DONE | quoted below |
| The look halves | NOT DONE by the builder | listed under "The look" |
| Case 23, the Sessions-view New half | NOT DONE, owed to Z515 (2) | the `n` key half is built and quoted |

Full-list runs: 5 (`npm run diagrams` then `checks.sh`); the output quoted is the fifth, run after the last source change.

## The verify list, verbatim

```
$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run diagrams   # exit 0
$ sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md   # exit 0
$ npm run test:quick

> oculus@0.0.1 test:quick
> node tests/tiers/quick.mjs

test:quick: 94 changed file(s), from git since HEAD
test:quick: 65 test file(s), 10 essential
        tests/data/sources/agents-catalog.test.ts: changed
        tests/data/snapshot/normalise.test.ts: imports at depth 1
        tests/data/snapshot/resources.test.ts: imports at depth 1
        tests/data/sources/docs.test.ts: imports at depth 1
        tests/data/sources/feeds.test.ts: imports at depth 1
        tests/data/sources/manifests.test.ts: imports at depth 1
        tests/data/sources/personal.test.ts: imports at depth 1
        tests/routes/git/deposit.test.ts: imports at depth 1
        tests/routes/machine/hpc.test.ts: imports at depth 1
        tests/routes/sessions/compose.test.ts: imports at depth 1
        tests/routes/sessions/terminal-actions.test.ts: imports at depth 1
        tests/routes/sessions/terminal-edit.test.ts: imports at depth 1
        tests/routes/sessions/terminal.test.ts: imports at depth 1
        tests/server/accounts/connect/oauth.test.ts: imports at depth 1
        tests/server/accounts/mail/routes.test.ts: imports at depth 1
        tests/server/edit/feeds.test.ts: imports at depth 1
        tests/server/machine/commands/placeholders.test.ts: imports at depth 1
        tests/server/machine/commands/run.test.ts: imports at depth 1
        tests/server/machine/pty/channel.test.ts: imports at depth 1
        tests/server/machine/pty/sessions.test.ts: imports at depth 1
        tests/server/machine/usage/refresh.test.ts: imports at depth 1
        tests/server/root/hooks-server.test.ts: imports at depth 1
        tests/state/client/terminal/terminal-close.test.ts: imports at depth 1
        tests/state/forms/form-drafts.test.ts: imports at depth 1
        tests/state/forms/manifest-draft.test.ts: imports at depth 1
        tests/data/sources/career.test.ts: imports at depth 2
        tests/data/sources/collections.test.ts: imports at depth 2
        tests/data/sources/config/rail.test.ts: imports at depth 2
        tests/data/sources/present.test.ts: imports at depth 2
        tests/data/sources/registries.test.ts: imports at depth 2
        tests/routes/docs/memories.test.ts: imports at depth 2
        tests/routes/edit/audit-mute.test.ts: imports at depth 2
        tests/routes/edit/rail.test.ts: imports at depth 2
        tests/routes/edit/roots.test.ts: imports at depth 2
        tests/routes/edit/undo/undo.test.ts: imports at depth 2
        tests/routes/files/file-undo.test.ts: imports at depth 2
        tests/routes/files/file.test.ts: imports at depth 2
        tests/routes/files/fs.test.ts: imports at depth 2
        tests/routes/files/history.test.ts: imports at depth 2
        tests/routes/files/project-files.test.ts: imports at depth 2
        tests/routes/files/search.test.ts: imports at depth 2
        tests/routes/files/source.test.ts: imports at depth 2
        tests/routes/machine/commands.test.ts: imports at depth 2
        tests/routes/replace/ops-replace.test.ts: imports at depth 2
        tests/routes/sessions/latex.test.ts: imports at depth 2
        tests/server/accounts/connect/accounts.test.ts: imports at depth 2
        tests/server/core/changes.test.ts: imports at depth 2
        tests/server/edit/config-key.test.ts: imports at depth 2
        tests/server/edit/writes-collection.test.ts: imports at depth 2
        tests/server/files/search.test.ts: imports at depth 2
        tests/server/machine/approvals/approvals.test.ts: imports at depth 2
        tests/state/sessions/source.test.ts: imports at depth 2
        tests/state/sources/repositories/diff/comment-draft.client.test.ts: imports at depth 2
        tests/state/workbench/layout/saved/layout-unread.test.ts: imports at depth 2
        tests/state/workbench/navigation/pages.test.ts: imports at depth 2
ok      ASCII gate (0.4 s)
ok      prettier (1.6 s): All matched files use Prettier code style!
ok      svelte-kit sync (1.8 s)
ok      eslint (7.2 s)
ok      svelte-check (7.5 s): 1791176331145 COMPLETED 360 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (11.1 s): Duration  8.21s (transform 13.78s, setup 0ms, import 22.07s, tests 9.10s, environment 74ms)
test:quick: 11.6 s (limit 45.0 s); every command passed
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
            build, lint of unchanged files; npm run test:landing runs them
checks: 1 commands passed
```

The state file's path is given as an absolute path because the worktree holds no copy of `orchestrator-state.md`; the brief's relative path names the same file from `tools/oculus` of the main checkout.

- `sh utils/folder-check.sh` exit 0.
- `sh utils/unused-exports.sh`, sorted and diffed against `unused-exports.txt` of the base: three lines differ and none adds a name. `compose.ts` loses `PROMPT_MAX` from its unused list (it is used by `task-seed.ts` and `task-start.ts`), `transcript-routes.ts` loses `transcriptMarkdown` (now private), and `state/sessions/terminal/composer/composer.ts` has the base's `composer.ts` list under its new path.
- ASCII gate (`LC_ALL=C perl -ne ... $(find src tests config -type f ! -name local.yml)`, `bin` does not exist in this tree): prints nothing; `LC_ALL=C grep -n '[^ -~]' HELP.md DESIGN.md README.md` prints nothing.
- No source file passes 880 lines and no component 520: the largest are `model-sessions.ts` 859, `git-write.ts` 870, `terminals.svelte.ts` 839, `deposit.ts` 835, `sessions.ts` 810; `ToolButton.svelte` 437, `Terminal.svelte` 513, `Composer.svelte` 504, `EntryCard.svelte` 507 (`awk` over the table below prints no row over the limit).
- Comment lines of every added or changed file are at most 100 columns (`awk 'length>100 && /^\s*(\/\/|\*)/'` over the files in the table prints nothing).

### The named test files, each run alone (`npx vitest run --project unit <file>`)

```
tests/routes/sessions/compose.test.ts:  Test Files 1 passed (1)  Tests 4 passed (4) 
tests/routes/sessions/terminal.test.ts:  Test Files 1 passed (1)  Tests 4 passed (4) 
tests/routes/sessions/terminal-actions.test.ts:  Test Files 1 passed (1)  Tests 13 passed (13) 
tests/routes/sessions/terminal-edit.test.ts:  Test Files 1 passed (1)  Tests 1 passed (1) 
tests/server/machine/pty/sessions.test.ts:  Test Files 1 passed (1)  Tests 1 passed (1) 
tests/server/machine/pty/channel.test.ts:  Test Files 1 passed (1)  Tests 3 passed (3) 
tests/server/machine/pty/tmux.test.ts:  Test Files 1 passed (1)  Tests 1 passed (1) 
tests/server/machine/commands/run.test.ts:  Test Files 1 passed (1)  Tests 6 passed (6) 
tests/routes/git/git.test.ts:  Test Files 1 passed (1)  Tests 5 passed (5) 
tests/routes/git/untracked.test.ts:  Test Files 1 passed (1)  Tests 1 passed (1) 
tests/routes/git/deposit.test.ts:  Test Files 1 passed (1)  Tests 2 passed (2) 
tests/server/git/git-write.test.ts:  Test Files 1 passed (1)  Tests 9 passed (9) 
tests/server/git/git-ops.test.ts:  Test Files 1 passed (1)  Tests 16 passed (16) 
tests/server/git/refs/cherry-pick.test.ts:  Test Files 1 passed (1)  Tests 1 passed (1) 
tests/server/git/refs/delete-branch.test.ts:  Test Files 1 passed (1)  Tests 2 passed (2) 
tests/server/git/refs/detached.test.ts:  Test Files 1 passed (1)  Tests 1 passed (1) 
tests/server/git/untracked/ignore.test.ts:  Test Files 1 passed (1)  Tests 1 passed (1) 
tests/server/git/untracked/trash.test.ts:  Test Files 1 passed (1)  Tests 2 passed (2) 
tests/server/machine/approvals/approvals.test.ts:  Test Files 1 passed (1)  Tests 1 passed (1) 
```

### The two kept tests

- Case 22, `tests/data/sources/agents-catalog.test.ts`, on the unchanged tree: quoted above. With the small change "`confirmOf` in `data/sources/config/catalog/agents.ts` no longer reports a `confirm` that is neither true nor false" (the `say(held, 'shape', 'confirm')` line removed) the row fails: `AssertionError: expected [ [ 11, 'value' ], ...(3) ] to deeply equal [ [ 11, 'value' ], ...(4) ]` at `tests/data/sources/agents-catalog.test.ts:42`; with the line back, the file passes.
- G33, `tests/routes/git/git.test.ts`, 'cancel ends the write in flight on the root it names, and no other': on the unchanged tree the suite does not load (quoted above). With the small change "`handleGit` no longer calls `running.cancel(root)` in the `cancel` branch" (`git-routes.ts`) the row fails: `AssertionError: expected [] to deeply equal [ '/hub' ]` at `tests/routes/git/git.test.ts:115` (`await vi.waitFor(() => expect(ended).toEqual([ROOT]), { timeout: 500 })`); with the line back, the file passes (5 tests).

Both source files were restored byte for byte after these runs (`cmp` against the copies made before the change printed nothing).

### Doc text for `guarded.md` (the two new titles)

- Doc text: `refuses a value that would read as an option, or holds whitespace or a control character, or a confirm that is neither true nor false`
- Doc text: `cancel ends the write in flight on the root it names, and no other`

### The greps of verify 7 (`grep -rn --exclude=local.yml -F <construct> src tests config HELP.md DESIGN.md README.md`)

Hit counts: `Segment.svelte` 5, `segment-items` 3, `Composer.svelte` 1, `AttachPicker.svelte` 1, `refKind` 4, `RefKind` 5, `foldFrom` 7, `TIMEOUT_MS` 88, `ETIMEDOUT` 2, `startArgs` 5, `ShellStarter` 4, `createWorktree` 16. Judged:

- `Segment.svelte`: the four views import `$lib/ui/controls/segment/Segment.svelte` (the moved file); `ToolButton.svelte:7` names `Segment.svelte` as the component that uses `checked`, still true.
- `segment-items`: `Segment.svelte:6`, `Projects.svelte:45`, `Project.svelte:43` import the moved file.
- `Composer.svelte`: one hit, `start/TerminalStart.svelte:11` imports `./Composer.svelte`, the moved file. `AttachPicker.svelte`: one hit, `start/Composer.svelte:30` imports `./AttachPicker.svelte`, the moved file.
- `refKind`, `RefKind`: `graph-menu.ts:60` declares the view's `RefKind` (now `'branch' | 'current' | 'remote' | 'tag' | 'none'`), `CommitRow.svelte:104` and `graph-menu.ts:90,136` use it; `server/core/git/compare.ts:50` declares its own `RefKind = 'branch' | 'remote' | 'tag'`, unchanged (`cmp` against the base prints nothing), still true.
- `foldFrom`: `transcripts.ts:87` (the function), `:185` (the snapshot fold), `turns.ts:145` (`readTurns`), `turns.ts:6` (its head comment), `DESIGN.md:122`; all describe the piecewise read.
- `TIMEOUT_MS`: 88 hits in 21 files. `git-write.ts` (18), `deposit-git.ts` (5) and `deposit.ts` (7) keep it for every command that runs no hook and pass `NO_TIME_LIMIT` for the ones that do (`grep -n NO_TIME_LIMIT` prints `commitWith` :669, `limitOf` :692 for cherry-pick :687, merge :820 and rebase (the `--abort` form keeps 10 s), `pushTo` :700, `pullIn` :708, `switchTo` :772, `worktree` :811 (`add` only), and in `deposit-git.ts` `commitFile` :250, `switchCmd` :268, `pushCmd` :291); the other 58 hits (`core/git/reads.ts`, `compare.ts`, `files.ts`, `state.ts`, `run.ts`, `machine/*`, `accounts/*`, `content/latex/tools.ts`, `root/*`) and `DESIGN.md`'s 3 are reads and unrelated processes, outside the write list, unchanged and still true.
- `ETIMEDOUT`: `server/core/git/run.ts:164-165` (a `spawnSync` read, where a timeout's `code` is `ETIMEDOUT`); the file is unchanged (`cmp` prints nothing), still true. `server/root/watch/autofetch.ts:77` (`'git timed out, did not run or exited with an error'`), `server/files/search.ts:52` (`'the search timed out'`), and the comments of `server/core/git/files.ts:24` and `:48`: each file is unchanged (`cmp` against the base prints nothing), still true.
- `startArgs`: `sessions.ts:536` (the function), `:633` (`startTerminal`), `usage/refresh.ts:11,96` (the usage refresh's own Claude, which passes no extra environment and keeps its renderer), `DESIGN.md:372`.
- `ShellStarter`: `state/shared/stores/shell.ts:15,24,28,34`, the type the repositories store takes.
- `createWorktree`: `git-write.ts:520` (gains an optional `signal`), `git-routes.ts:39,99,159,323-324`, `repositories.svelte.ts:124,460-462`, `Repositories.svelte:319,327,442`, `tests/server/git/git-write.test.ts:18,151` and `tests/routes/git/git.test.ts:142` (the server function's tests, which pass unchanged), `DESIGN.md:404`.

The history-word grep of `agents/spec.md:42` over the 718 comment lines and test titles the step added or changed (words `before`, `used to`, `no longer`, `still`, `always has been`, `always had`, `as before`, `previously`, `the step adds`, `after this package lands`) has six hits, judged: `composer.ts:180` and `:203` and `Composer.svelte:204` are the base's own text, moved with its file (the same words are in `composer.ts:149`, `:172` and `Composer.svelte:165` of the base), and describe runtime state (a catalog that still offers a choice), not an earlier version of the code; `composer.ts:309` ("the question a start asks before it runs") and `opening.svelte.ts:8` ("asks the server for the seed before anything opens") use `before` for order of events; `DESIGN.md:328` is the base's own Approval paragraph. The same scan for a package id (a letter and digits) or a date in those lines prints nothing.

## Files with line counts

`new` or `changed` against the base copy, and the line count in the worktree; the five `removed` rows are the moved files, whose new locations are the `new` rows (`composer/composer.ts`, `ui/controls/segment/*`, `terminal/start/*`).

```
changed    521  src/lib/data/model/index.ts
changed    141  src/lib/data/model/model-agents.ts
changed    859  src/lib/data/model/model-sessions.ts
changed    326  src/lib/data/sources/config/catalog/agents.ts
changed    713  src/lib/server/core/git/parse.ts
new         88  src/lib/server/core/git/running.ts
changed    360  src/lib/server/git/deposit-git.ts
changed    243  src/lib/server/git/deposit-routes.ts
changed    835  src/lib/server/git/deposit.ts
changed    409  src/lib/server/git/git-index.ts
changed    109  src/lib/server/git/git-remote.ts
changed    461  src/lib/server/git/git-routes.ts
changed    870  src/lib/server/git/git-write.ts
changed    279  src/lib/server/machine/pty/compose.ts
changed    687  src/lib/server/machine/pty/routes.ts
changed    810  src/lib/server/machine/pty/sessions.ts
new        204  src/lib/server/machine/seeds/task-seed.ts
new         94  src/lib/server/machine/seeds/task-start.ts
changed    736  src/lib/server/root/context.ts
changed    334  src/lib/server/sessions/stores/transcripts.ts
changed    160  src/lib/server/sessions/transcript-routes.ts
changed    638  src/lib/state/boards/ticker.ts
changed    589  src/lib/state/client/writes.svelte.ts
removed      0  src/lib/state/sessions/terminal/composer.ts
new        423  src/lib/state/sessions/terminal/composer/composer.ts
new        201  src/lib/state/sessions/terminal/composer/opening.svelte.ts
changed    224  src/lib/state/sessions/terminal/pty/pty-io.ts
changed    839  src/lib/state/sessions/terminals.svelte.ts
changed     67  src/lib/state/shared/answers/terminal-words.ts
changed     42  src/lib/state/shared/stores/shell.ts
changed    528  src/lib/state/sources/repositories/repositories.svelte.ts
removed      0  src/lib/ui/controls/Segment.svelte
changed    437  src/lib/ui/controls/ToolButton.svelte
removed      0  src/lib/ui/controls/segment-items.ts
new         40  src/lib/ui/controls/segment/Segment.svelte
new          5  src/lib/ui/controls/segment/segment-items.ts
new        122  src/lib/ui/controls/tool-button.ts
changed    430  src/lib/views/boards/collection/Collection.svelte
changed    507  src/lib/views/boards/collection/EntryCard.svelte
new         39  src/lib/views/boards/collection/task-card.ts
changed    497  src/lib/views/boards/deposit/Deposit.svelte
changed    263  src/lib/views/boards/focus/CommandCenter.svelte
changed    153  src/lib/views/boards/focus/Tasks.svelte
changed    305  src/lib/views/boards/focus/rows.ts
changed    288  src/lib/views/boards/project/Project.svelte
changed    394  src/lib/views/boards/projects/Projects.svelte
changed    432  src/lib/views/personal/calendar/Calendar.svelte
changed    239  src/lib/views/sessions/changes/Changes.svelte
changed    174  src/lib/views/sessions/changes/ChangesRepo.svelte
changed    248  src/lib/views/sessions/session-list/Customizations.svelte
removed      0  src/lib/views/sessions/terminal/AttachPicker.svelte
removed      0  src/lib/views/sessions/terminal/Composer.svelte
changed    513  src/lib/views/sessions/terminal/Terminal.svelte
new         44  src/lib/views/sessions/terminal/start/AgentFindings.svelte
new        154  src/lib/views/sessions/terminal/start/AttachPicker.svelte
new        504  src/lib/views/sessions/terminal/start/Composer.svelte
new         90  src/lib/views/sessions/terminal/start/SeedApproval.svelte
new         65  src/lib/views/sessions/terminal/start/TaskBlock.svelte
new         52  src/lib/views/sessions/terminal/start/TerminalStart.svelte
changed    730  src/lib/views/sessions/terminal/terminal-list.ts
changed    170  src/lib/views/shared/sessions/SteerBox.svelte
changed    377  src/lib/views/sources/repositories/Repo.svelte
changed    489  src/lib/views/sources/repositories/Repositories.svelte
changed    241  src/lib/views/sources/repositories/graph/CommitRow.svelte
changed    262  src/lib/views/sources/repositories/menus/graph-menu.ts
changed    106  src/lib/views/sources/repositories/menus/repo-menu.ts
changed    262  src/lib/views/sources/repositories/refs/Worktrees.svelte
changed    301  src/lib/views/system/gallery/Gallery.svelte
changed     25  src/routes/api/(git)/deposit/+server.ts
changed     41  src/routes/api/(git)/git/+server.ts
changed     60  tests/data/sources/agents-catalog.test.ts
changed    190  tests/routes/git/git.test.ts
changed    122  tests/server/root/context-fixture.ts
changed     86  config/catalogs/agents.yml
changed     80  config/text/server.yml
changed     71  config/text/views/boards/collection.yml
changed     61  config/text/views/boards/deposit.yml
changed    128  config/text/views/boards/project.yml
changed    100  config/text/views/sessions/changes.yml
changed     54  config/text/views/sessions/composer.yml
changed    103  config/text/views/sessions/terminal.yml
changed    285  config/text/views/sources/repositories.yml
changed    348  HELP.md
changed    435  DESIGN.md
```

## Judgment calls the brief left open

- A command ended by Cancel or by its time limit ends the processes it started first. `execFile` ends a timed-out or aborted command with `child.kill`, which signals git alone, so a hook (the `sleep` under a hook's shell) would live on after Cancel. `killWithDescendants` in `server/core/git/running.ts` replaces `child.kill` of each git and `gh` run with a function that reads the process table once (`ps -A -o pid= -o ppid=`), signals every descendant of the child with SIGTERM, then the child. It is used by `git-write.ts` `run` and `deposit-git.ts` `execute`. The alternative, a process group of its own for the command (`detached`), is not accepted by the typings of `execFile` with the string encoding the module uses. What it does not reach: a process the hook started after the table was read, and one that detached itself from the command with `setsid` (the table lists it under its original parent only until it does). The read is a synchronous `ps` of a few milliseconds on Cancel and on a timeout only. Case 56 shows the effect.
- Which text git's own reason is: when stderr holds a line starting `fatal: `, the last such line; otherwise stderr's first line; where stderr is empty, stdout's (a merge that stopped on conflicts). A worktree refused for another reason than a taken folder then reads `a branch named 'taken-branch' already exists` (git's `fatal:` line), not the `Preparing worktree (new branch ...)` progress line that came first.
- `Outcome.failure` (`{ code, detail, program }`) is a field of its own beside the page-acted `Outcome.code`, and the route words it from `server.git.*` with `failureText`; the deposit route does the same for `gh` (`program_gh`).
- `NO_TIME_LIMIT` is `0`, the value `execFile` takes for no limit; the commands that run hooks pass it, every other command keeps `TIMEOUT_MS` or `PUSH_TIMEOUT_MS`.
- The page's git and deposit writes wait for the server's answer with no limit of their own (`exchange(..., limited = false)` in `writes.svelte.ts`); `cancel` keeps `writes.timeout_seconds` (30), and `/api/write` saves keep it too (case 49).
- The composer's saved record holds the task reference only; the seed is held per tab in the opening module (`composer/opening.svelte.ts`), so a reload posts `seed` again and a task that vanished meanwhile says `sessions.refused_task_unknown` and drops the reference (case 63).
- `foldFrom` reads in pieces of 8 MiB (`PIECE_BYTES`), decodes each complete line alone, skips a line longer than `MAX_STRING_LENGTH` and counts it as read, and answers the bytes consumed, also when a read fails after some lines. The export is streamed a turn at a time (`markdownStream`); its trailing-blank-line and trim rules are the base's, checked by `cmp` (case 36).
- `confirmValues` (the `confirm` reading of the agents catalog) is in `data/model/model-agents.ts` and `taskRefOf` in `data/shapes/shapes.ts`, the two places the state layer and the views may import (round 1, item 9).
- The Cancel button is not drawn while a commit message is being suggested (`Repo.svelte:181`, `repositories.suggesting(root)`): the suggestion runs `claude`, which is not registered with the git runs and has nothing for Cancel to end.
- A test file `tests/routes/git/git.test.ts` builds its server context from `tests/server/root/context-fixture.ts`, which gained `gitRunning` (outside the brief's write list).

## What the reader sees, before and after, and the look

- **Focus board and Tasks view.** Before: a task or subtask line carried done, snooze and delete; a Tasks card carried no agent control. After: a task entry line, a subtask line (of a manifest, a funding scheme or an entry) and a Tasks card carry `agent` / Start Agent, drawn under the pointer with the line's other buttons; a done or dropped entry, a snoozed line, a follow-up, a lead, a venue and a project's deadline line have none (`actionsFor`, case 4; `task-card.ts`, case 5). It opens the composer in the task's folder, seeded.
- **The composer with a task.** After: a Task block shows the seed (`composer.task_label`), the agent list offers Claude and Codex only, the placeholder reads `composer.prompt_more` ("Anything to add to the task"), Remove drops the seed and restores the placeholder, every list starts at the catalog default (Manual permissions). The reader's own words follow the seed after a blank line as one argument after `--`.
- **The approval panel.** After: a first start of a seed, folder and agent draws `composer.approve_title` ("Approve this task for the agent") with the seed, `Folder: <path>`, `Agent: <agent>`, Approve and Start / Cancel; the approval is one `command:` entry in the approvals file; a changed seed, another folder or Codex asks again.
- **The confirmation of a skipping mode.** After: Start with Claude's Bypass permissions, Accept edits or Auto, or Codex's Full access or Approvals Never, asks "Start Claude with Bypass permissions?" (and the others) with that mode's sentence ("With Bypass permissions, Claude asks no further permission for anything it does. This is asked at every start."); Manual, Plan and Don't ask start without a question; the server answers `needs-confirm` to a `compose` that did not confirm. The `n` key's composer asks the same.
- **Create with Claude or Codex, and the worktree menu.** Before: the new-worktree row had one Create control, which made the worktree and opened a shell. After: Create (a shell, as before), Create with Claude and Create with Codex; the question names `<root>/.agents/worktrees/<name>` and yes opens the composer there; a worktree row's right-click menu gains Start Claude Here and Start Codex Here. A taken name says oculus's words and opens nothing. The question's No runs nothing: `createWorktree` of `Repositories.svelte:319-330` makes the worktree and opens the composer only in the callback `ask` runs on Yes, so a No makes no worktree and opens no composer.
- **The armed Kill and every pressed bare button.** Before: a pressed bare button drew no different. After: fill `--accent-bg`, glyph `--on-accent-bg`, a 1 px `--accent` outline inside the box, for Kill (armed) and the 12 other bare buttons that pass `pressed`.
- **New Terminal.** Before: the new tab drew the composer while the shell started. After: it draws `Starting Shell...` (`sessions.terminal_starting`) until the shell is listed, then the grid; a refusal shows on the bar and ends the line; before the portfolio arrives it waits on `hubReady()`.
- **The Claude grid.** Before: the grid had xterm's 1000-line scrollback and Claude drew in the alternate screen. After: every terminal oculus starts carries `-e CLAUDE_CODE_DISABLE_ALTERNATE_SCREEN=1`, so a reply longer than the grid scrolls (`.xterm-viewport` `scrollHeight` above `clientHeight`); the usage refresh's own Claude keeps its renderer.
- **The Graph's pills.** Before: the checked-out branch's pill had no menu. After: it has Checkout and Delete Branch drawn disabled with "This branch is checked out already" and "The checked-out branch cannot be deleted; switch to another branch first"; while a write runs no pill menu has an item and the commit menu keeps Open Changes, Copy Commit ID, Copy Commit Message and Compare with....
- **Git commands that run hooks.** Before: a commit with a 25 s hook failed at 10 s with `Command failed: git -C ... commit -F ...`; a push past 60 s likewise. After: commit, cherry-pick, push, pull, merge, rebase continue, switch, worktree add, and the deposit's commit, switch and push have no limit, while the `--abort` of a merge, cherry-pick or rebase and `worktree remove` run no hook and keep the 10 s limit (`limitOf`, `git-write.ts:629`; `worktree` at `git-write.ts:748`); the Working line carries a Cancel button (Repo, Changes and the deposit panel), which stops the command and the hooks it started; a failure says its reason ("Git stopped with exit status 1 and gave no reason", "Git did not finish within 10 seconds, so it was stopped", and the four others).
- **A transcript above the string limit.** Before: a 566 MB log with one 540 MiB line answered no turns, offset 0. After: it reads in pieces, skips the line, answers the turns around it and the file's size; the Markdown export streams.

### The look (for the orchestrator's landing look on TEST)

Each half needs the page, so none was seen by the builder. View, state and what should differ:

- Case 1: Focus view, the tasks section, hover the "Submission" line: `agent` appears; pressing it opens the composer in the hub folder with the seed block.
- Case 2: Focus view, command center, hover the "EEG-sAAD: Register" line: `agent`; the composer opens in `projects/active/eeg-saad-challenge`.
- Case 5: Tasks view: three cards draw Start Agent, an `events` card none.
- Case 9: change the task's note in the file while the composer is open, press Start: the composer redraws the new seed and says `sessions.refused_task_changed`.
- Cases 10, 11: Remove drops the seed block and the placeholder returns; text typed under a seed shows the placeholder "Anything to add to the task".
- Case 12: first Start of a scratch task: the approval panel replaces the composer with seed, folder, agent; Approve and Start starts the terminal named "Task: <title>". Use a scratch task and a scratch approvals file (the brief's approval paragraph).
- Cases 19, 20: a seeded composer in a tab whose last start used Bypass permissions shows "Manual permissions"; picking Bypass permissions, Accept edits and Auto each asks the confirmation with its sentence, Cancel starts nothing, Start starts.
- Case 23: the `n` key's composer asks the same confirmation. The Sessions view's New half is owed to Z515 (2).
- Cases 24, 25, 26, 27, 28a: Repositories view, a scratch repository named `look-a2`: Create with Claude asks with `<root>/.agents/worktrees/look-a2`, yes opens the composer in that folder with Claude and Manual, no makes no worktree and opens nothing, since the question comes before the worktree is made (`Repositories.svelte`, `createWorktree`); Create with Codex likewise; a repository whose `.gitignore` lacks `/.agents/worktrees/` still draws the warning; the worktree row's menu has Start Claude Here and Start Codex Here; with two Claude accounts in `local.yml` the account picker offers both, the tab's last account preselected.
- Cases 37, 38: a row's right-click Kill Terminal draws pressed (fill, glyph, 1 px outline) under the default palette, each of the 16 palettes, with `rice` and with `crt`; the second press kills; a press elsewhere disarms; the 12 other bare pressed buttons draw the same, a non-bare pressed button as before.
- Case 39: New Terminal from a pane's tab menu on a page with no Terminal tab: "Starting Shell..." with no composer, then the grid.
- Case 43: a Claude started from the composer, a reply longer than the grid: the wheel and the scrollbar reach the reply's first line.
- Case 44, idle: the pills of a scratch repository with `look-branch` (checked out), `other`, a remote branch and a tag: `look-branch` has its own menu with Checkout and Delete Branch disabled and their reasons on hover; `other` offers both; the remote branch Checkout (Detached); the tag Delete Tag.
- Case 45 at 35 s: a pre-commit hook of 35 s in a scratch repository: the commit box shows it done after 35 s, past the 30 s write limit.
- Case 46: a pre-commit hook that exits 1 and prints nothing: the commit box says "Git stopped with exit status 1 and gave no reason".
- Case 54: a seeded composer's agent list offers Claude and Codex only.
- Case 56: a commit whose hook sleeps: the Working line carries Cancel; pressing it ends the command and shows "Git was stopped by Cancel".
- Case 63: a seeded composer open, reload the page: the seed redraws.
- Case 64 (Z467): the approval and agent paragraph of "The look" in the brief, on a scratch server whose HOME is a scratch folder.
- The 634,850,633-byte log is not on disk (`find ~/.claude/projects ~/.claude-work/projects ~/.codex -type f -size 634850633c` prints nothing). The look regenerates case 35's file with this generator, as a session the scratch server lists, opens its Transcript, and deletes the file after: `node gen-transcript.cjs <out.jsonl> 629146085`, whose source is:

```js
// Writes a Claude-format transcript of about <bytes> bytes: alternating human user turns and assistant turns, each line one JSON record.
const fs = require('node:fs');
const out = process.argv[2];
const target = Number(process.argv[3]);
const fd = fs.openSync(out, 'w');
const filler = 'The quick brown fox jumps over the lazy dog. '.repeat(40);
let written = 0;
let n = 0;
const chunk = [];
while (written < target) {
    const at = new Date(1760000000000 + n * 1000).toISOString();
    const user = n % 2 === 0;
    const record = user
        ? { type: 'user', timestamp: at, origin: { kind: 'human' }, message: { role: 'user', content: `question ${n} ${filler}` } }
        : { type: 'assistant', timestamp: at, message: { role: 'assistant', content: [{ type: 'text', text: `answer ${n} ${filler}` }] } };
    const line = JSON.stringify(record) + '\n';
    chunk.push(line);
    written += Buffer.byteLength(line);
    n += 1;
    if (chunk.length === 2000) { fs.writeSync(fd, chunk.join('')); chunk.length = 0; }
}
if (chunk.length > 0) fs.writeSync(fd, chunk.join(''));
fs.closeSync(fd);
console.log(`wrote ${written} bytes, ${n} records to ${out}`);
```

## Measurements of the large-file cases (the 600 MB file was deleted after its run)

```
case 35 file 629146085 bytes; rss before 141 MiB
case 35 readTurns(path, 'claude', 0): 324443 turns, offset 629146085, equals size: true, 4804 ms, rss after 858 MiB
case 35 readTurns from 629146085: 0 turns, offset 629146085, 0 ms
case 35 route first read: status 200, 200 turns, offset 629146085, 5149 ms, peak RSS of the whole test process 1508 MiB (resourceUsage maxRSS)
case 36 export of the 600 MB file: status 200, content-type text/markdown; charset=utf-8, content-disposition attachment; filename="Big.md", 600595186 bytes written (file 600595186) in 6210 ms, peak RSS 1544 MiB
```

The 566 MB file of case 34, final run: `applied [1,3] answer 566231096 (equals the size: true) in 211 ms; peak RSS 558 MiB`.

## Quoted runs on the new tree

Cases 1-8, 59-62 over the real hub (read only) and fixture hubs, `seed.probe.ts`:

```
case 1 Submission: list=tasks label="Submission: Readable-ECG (ASAP)" target={"kind":"entry","id":"Submission","collection":"tasks","subtask":"0"} subtaskDo="Readable-ECG (ASAP)" snoozed=false actions=[done,agent,snooze:7,snooze:30,snooze:hide,del]
case 1 Submission: list=tasks label="Submission: RAW-PLS (ASAP)" target={"kind":"entry","id":"Submission","collection":"tasks","subtask":"1"} subtaskDo="RAW-PLS (ASAP)" snoozed=false actions=[done,agent,snooze:7,snooze:30,snooze:hide,del]
case 1 Submission: list=tasks label="Submission: BTTN (ASAP)" target={"kind":"entry","id":"Submission","collection":"tasks","subtask":"2"} subtaskDo="BTTN (ASAP)" snoozed=false actions=[done,agent,snooze:7,snooze:30,snooze:hide,del]
case 1 Submission: list=tasks label="Submission: BTTR (ASAP)" target={"kind":"entry","id":"Submission","collection":"tasks","subtask":"3"} subtaskDo="BTTR (ASAP)" snoozed=false actions=[done,agent,snooze:7,snooze:30,snooze:hide,del]
case 1 Submission: list=tasks label="Submission: Cirrhosis (ASAP)" target={"kind":"entry","id":"Submission","collection":"tasks","subtask":"4"} subtaskDo="Cirrhosis (ASAP)" snoozed=false actions=[done,agent,snooze:7,snooze:30,snooze:hide,del]
case 1 Submission: list=tasks label="Submission" target={"kind":"entry","id":"Submission","collection":"tasks","statuses":["todo","doing","done","dropped"]} subtaskDo=undefined snoozed=false actions=[status:doing,status:done,status:dropped,agent,snooze:7,snooze:30,snooze:hide]
case 2 Register: list=subtasks label="EEG-sAAD: Register" target={"kind":"manifest","id":"eeg-saad-challenge","subtask":"0"} subtaskDo="Register" snoozed=false actions=[done,agent,snooze:7,snooze:30,snooze:hide,del]
case 2 Register: list=tasks label="HCCNet-FL - Register for FLTA 2026" target={"kind":"followup","id":"hccnet-fl"} subtaskDo=undefined snoozed=false actions=[done]
case 3 ECG FAIR: list=tasks label="Investigation: ECG FAIR" target={"kind":"entry","id":"Investigation","collection":"tasks","subtask":"0"} subtaskDo="ECG FAIR" snoozed=false actions=[done,agent,snooze:7,snooze:30,snooze:hide,del]
case 1 seed over the real hub: {"ok":true,"cwd":"<hub>","name":"Task: Submission","seed":["Task: Submission","Note: ASAP - all 5 to be submitted as soon as possible.","Open subtasks: Readable-ECG (ASAP); RAW-PLS (ASAP); BTTN (ASAP); BTTR (ASAP); Cirrhosis (ASAP)","Written in tasks/tasks.yml; read that file for its context."]}
case 2 seed: {"ok":true,"cwd":"<hub>/projects/active/eeg-saad-challenge","name":"Task: Register","seed":["Task: Register","Part of: Cross-Dataset Selective Auditory Attention Decoding (ICASSP 2027 Grand Challenge)","Deadline: 2026-09-20","Written in projects/active/eeg-saad-challenge/project.yml; read that file for its context."
case 3 seed: {"ok":true,"cwd":"<hub>","name":"Task: ECG FAIR","seed":["Task: ECG FAIR","Part of: Investigation","Written in tasks/tasks.yml; read that file for its context."]}
case 4 kind manifest: first line "EEG-sAAD" actions=[snooze:7,snooze:30,snooze:hide]
case 4 kind funding: first line "FWO Senior Postdoctoral Fellowship 2026" actions=[snooze:7,snooze:30,snooze:hide]
case 4 kind entry: first line "FLTA 2026" actions=[status:planned,status:completed,status:cancelled,status:not-attending,snooze:7,snooze:30,snooze:hide]
case 4 kind lead: first line "Postdoctoral Researcher in multimodal AI for sudden cardiac death prediction" actions=[]
case 4 kind none: first line "HCIN" actions=[]
case 4 kind followup: first line "Finger Abduction - update the outcome from 'accepted / to appear' to **Published** once presented" actions=[done]
case 4 kind entry-snoozed: first line "Research visit - Linköping (Sweden)" actions=[unsnooze]
case 5 task entry "Submission" status=todo: card actions=["Start Agent"]
case 5 task entry "Investigation" status=todo: card actions=["Start Agent"]
case 5 task entry "A second person in the hub" status=todo: card actions=["Start Agent"]
case 5 events entry "AAAI 2027": card actions=0
case 5 fixture tasks entry status done: card actions=0
case 5 fixture tasks entry status dropped: card actions=0
case 6 one related: {"ok":true,"cwd":"<hub>/projects/manuscripts/alpha","name":"Task: One related","seed":["Task: One related","Written in tasks/tasks.yml; read that file for its context."]}
case 6 two related: {"ok":true,"cwd":"<hub>","name":"Task: Two related","seed":["Task: Two related","Written in tasks/tasks.yml; read that file for its context."]}
case 6 unknown related: {"ok":true,"cwd":"<hub>","name":"Task: Unknown related","seed":["Task: Unknown related","Written in tasks/tasks.yml; read that file for its context."]}
case 7 120-char title: name length 80 name "Task: AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" first seed line length 126
case 7 control characters: name "Task: tab here line escape" seed first line "Task: tab here line escape"
case 7a blank-title entry: name "Task: blank-one" first line "Task: blank-one"
case 7a blank subtask at key 2: {"name":"Task: 2","first":"Task: 2"}
case 8 note of 100,001 characters: {"ok":false,"word":"task-too-long"}
case 60 block-style subtask: {"ok":true,"cwd":"<hub>","name":"Task: X block","seed":["Task: X block","Part of: Block","Deadline: 2026-12-01","Written in tasks/tasks.yml; read that file for its context."]}
case 59 C at key 2: {"ok":true,"cwd":"<hub>","name":"Task: C","seed":["Task: C","Part of: ABC","Written in tasks/tasks.yml; read that file for its context."]}
case 59 ref for a C that moved (key 1, do C): {"ok":false,"word":"task-unknown"}
case 59 ref with changed text (key 2, do "C old"): {"ok":false,"word":"task-unknown"}
case 9 task removed from the file: {"ok":false,"word":"task-unknown"}
case 62 emoji pair at title units 73-74: name length 80 lone surrogate false ends with the pair true
case 62 emoji pair at title units 74-75: name length 79 lone surrogate false ends with the pair false
case 61 link funding/scheme: cwd "<hub>/funding/scheme"
case 61 link funding/scheme/OVERVIEW.md: cwd "<hub>/funding/scheme"
case 61 link https://example.org/call: cwd "<hub>"
case 61 link /etc: cwd "<hub>"
case 61 link funding/missing: cwd "<hub>"
```

Case 42, the usage refresh's own start arguments, `usage42.probe.ts`, after the change: `case 42 usage refresh startArgs: -e pairs [] | carries CLAUDE_CODE_DISABLE_ALTERNATE_SCREEN: false`.

Cases 9-18, 20, 21, 42, 51, 52, 54, 55, 58 over the terminal route with the fake runner, `route.probe.ts`:

```
case 12 first start of a seed: 200 {"approve":{"seed":"Task: Submission\nNote: first note\nOpen subtasks: A; B; C\nWritten in tasks/tasks.yml; read that file for its context.","cwd":"/private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/d20build/fix/ro tmux calls 0 | approvals file exists: false
case 12 approve-seed: 200 {"ok":true} tmux calls 0 | entries 1 kinds ["command"] label starts "{\n \"agent\": \"claude\",\n \"cwd\": \"/private/var/folders/7r/49ks4"
case 12 start after approval: 200 {"ok":true,"terminal":{"resumes":null,"task":false,"exit":null,"job":null,"foreign":false,"id":"eba479-claude","name":"T name option ["Task: Submission\nNote: first note\nOpen subtasks: A; B; C\nWritten in tasks/tasks.yml; read that file for its context.","Task: Sub
case 13 same seed, folder and agent again: 200 {"ok":true,"terminal":{"resumes":null,"task":false,"exit":null,"job":null,"foreign":false,"id":"fd57c8-claude","name":"T tmux calls 2
case 14 same seed, another folder: 200 {"approve":{"seed":"Task: Submission\nNote: first note\nOpen subtasks: A; B; C\nWritten in tasks/tasks.yml; read that file for its context.","cwd":"/private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp","agent":"claude" tmux calls 0
case 14 same seed, Codex: 200 {"approve":{"seed":"Task: Submission\nNote: first note\nOpen subtasks: A; B; C\nWritten in tasks/tasks.yml; read that file for its context.","cwd":"/private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/d20build/fix/ro tmux calls 0
case 15 approve-seed sent twice: entries 1
case 16 not JSON: 400 {"error":"approvals-unwritable","names":["/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/d20build/fix/approvals16-oOVX | path named: true | bytes unchanged (compare): true
case 16 JSON of another shape: 400 {"error":"approvals-unwritable","names":["/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/d20build/fix/approvals16-bcgG | path named: true | bytes unchanged (compare): true
case 17 approve-seed with another seed: 400 {"error":"task-changed"} | file written: false
case 18 seed with a wrong token: 403 {"error":"the write token is missing or stale"} tmux calls 0
case 18 compose with a wrong token: 403 {"error":"the write token is missing or stale"} tmux calls 0
case 18 approve-seed with a wrong token: 403 {"error":"the write token is missing or stale"} tmux calls 0
case 9 note changed since shown: 400 {"error":"task-changed"} tmux calls 0
case 9 task removed from the file: 400 {"error":"task-unknown"} tmux calls 0
case 10 no task, prompt hello: 200 {"ok":true,"terminal":{"resumes":null,"task":false,"exit":null,"job":null,"foreign":false,"id":"caae43-claude","name":"c tmux calls 2 argv tail ["hello"]
case 11 seed plus words, one argv word after --: 200 {"ok":true,"terminal":{"resumes":null,"task":false,"exit":null,"job":null,"foreign":false,"id":"a8b75e-claude","name":"T | last word is seed + blank line + words: true | words after -- count 1
case 54 task with agent shell: 400 {"error":"task-needs-agent"} tmux calls 0
case 55 seed of the large task: length 99977 200
case 55 seed + words past a prompt: 400 {"error":"task-too-long"} tmux calls 0
case 58 Codex start asks the approval: {"agent":"codex","cwd":false}
case 58 approval texts name the agent: ["claude","codex"]
case 21 claude bypassPermissions, no confirm: 400 {"error":"needs-confirm","names":["Bypass permissions"]} tmux calls 0
case 21 claude acceptEdits, no confirm: 400 {"error":"needs-confirm","names":["Accept edits"]} tmux calls 0
case 21 claude auto, no confirm: 400 {"error":"needs-confirm","names":["Auto"]} tmux calls 0
case 20 bypassPermissions with confirm true starts: 200 {"ok":true,"terminal":{"resumes":null,"task":false,"exit":null,"job":null,"foreign":false,"id":"dc2b49-claude","name":"d tmux calls 2
case 20 claude manual, no confirm: 200 {"ok":true,"terminal":{"resumes":null,"task":false,"exit":null,"job":null,"foreign":false,"id":"def850-claude","name":"d
case 20 claude plan, no confirm: 200 {"ok":true,"terminal":{"resumes":null,"task":false,"exit":null,"job":null,"foreign":false,"id":"40ec23-claude","name":"4
case 20 claude dontAsk, no confirm: 200 {"ok":true,"terminal":{"resumes":null,"task":false,"exit":null,"job":null,"foreign":false,"id":"4e48f8-claude","name":"4
case 21 codex sandbox danger-full-access: 400 {"error":"needs-confirm","names":["Full access"]} tmux calls 0
case 21 codex approval never: 400 {"error":"needs-confirm","names":["Never"]} tmux calls 0
case 51 fixture default never, no approval pick: 400 {"error":"needs-confirm","names":["Never"]} tmux calls 0 | differs from shipped: true
case 52 confirm: yes on acceptEdits, no confirm sent: 400 {"error":"needs-confirm","names":["Accept edits"]} tmux calls 0 | differs from shipped: true
case 42 claude start: -e pairs before --: ["CLAUDE_CODE_DISABLE_ALTERNATE_SCREEN=1"]
case 42 codex start: -e pairs before --: ["CLAUDE_CODE_DISABLE_ALTERNATE_SCREEN=1"]
case 42 shell start: -e pairs before --: ["CLAUDE_CODE_DISABLE_ALTERNATE_SCREEN=1"]
```

Cases 1, 8-10, 19-21, 23-28, 51, 52, 58, 63 over the page's stores with fake posts, `client.probe.ts`:

```
case 1/58 composeAt({ task }) answered "" | posts ["seed"] | record {"workspace":"/hub/root","agent":"claude"} workspace agent claude task {"id":"Submission","collection":"tasks"} picks {"claude":{},"codex":{}}
case 1 held seed for the tab: {"ref":{"id":"Submission","collection":"tasks"},"seed":"Task: Submission\nNote: n","cwd":"/hub/root","name":"Task: Submission"}
case 63 saved record keys: ["workspace","agent","accounts","picks","split","task"] | saved storage contains the seed text: false | saved storage contains the reference: true
case 9 loadTask(fresh) after task-changed answered "" | held seed now "Task: Submission\nNote: changed"
case 10 record before Remove: {"workspace":"/hub/root","task":{"id":"Submission","collection":"tasks"}}
case 10 record after Remove: {"workspace":"/hub/root"}
case 10 after Remove: record.task undefined | composeStart {"agent":"claude","cwd":"/hub/root","account":"","picks":{},"prompt":"hello","images":[],"seed":"","confirm":false}
case 63 reloaded: record task {"id":"Submission","collection":"tasks"} | held seed before load null
case 63 loadTask posts ["seed"] answered "" | seed now "Task: Submission\nNote: n"
case 63 task removed meanwhile: loadTask answered "That task is no longer in the hub, so nothing was started." | expected sentence "That task is no longer in the hub, so nothing was started." | record task after undefined
case 8 composeAt with a too-long note answered "The task's text, with the words added to it, is longer than a prompt may be, so nothing was started." | equals sessions.refused_task_too_long: true | tabs opened 0
case 19 before: picks {"claude":{"mode":"bypassPermissions"},"codex":{}}
case 19 after composeAt: picks {"claude":{},"codex":{}} (the claude list is empty, so each list shows the catalog default: mode default = manual)
case 20 skipQuestion(Claude, bypassPermissions): {"message":"Start Claude with Bypass permissions?","detail":"With Bypass permissions, Claude asks no further permission for anything it does. This is asked at every start."}
case 20 skipQuestion(Claude, acceptEdits): {"message":"Start Claude with Accept edits?","detail":"With Accept edits, Claude approves file edits and common file commands on its own. This is asked at every start."}
case 20 skipQuestion(Claude, auto): {"message":"Start Claude with Auto?","detail":"With Auto, Claude asks no routine questions, and a reviewer model screens its actions. This is asked at every start."}
case 20 skipQuestion(Claude, manual): null
case 20 skipQuestion(Claude, plan): null
case 20 skipQuestion(Claude, dontAsk): null
case 20 skipQuestion(Claude, default picks): null
case 21/20 skipQuestion(Codex, {"sandbox":"danger-full-access"} ): {"message":"Start Codex with Full access?","detail":"With Full access, Codex can edit files outside this workspace and access the internet without asking for approval. This is asked at every start."}
case 21/20 skipQuestion(Codex, {"approval":"never"} ): {"message":"Start Codex with Never?","detail":"With approvals set to Never, Codex never asks for your approval, and a failed command goes back to the model. This is asked at every start."}
case 21/20 skipQuestion(Codex, {} ): null
case 21/20 skipQuestion(Codex, {"sandbox":"workspace-write"} ): null
case 51 fixture default never, no approval pick: skipQuestion {"message":"Start Codex with Never?","detail":"With approvals set to Never, Codex never asks for your approval, and a failed command goes back to the model. This is asked at every start."}
case 52 confirm: yes: skipQuestion {"message":"Start Claude with Accept edits?","detail":"With Accept edits, Claude approves file edits and common file commands on its own. This is asked at every start."}
case 23 composeIn (the n key) opened a composer record: {"agent":"claude"} | its Start calls skipQuestion (views/sessions/terminal/start/Composer.svelte start())
case 24 Create with Claude: posted [["createWorktree",{"name":"look-a2","confirm":true}]] | composeAt [{"cwd":"/repo/.agents/worktrees/look-a2","agent":"claude"}] | shells []
case 25 Create with Codex: composeAt [{"cwd":"/repo/.agents/worktrees/look-a2","agent":"codex"}]
case 25 Create (shell): shells [{"kind":"shell","cwd":"/repo/.agents/worktrees/look-a2"}] | composeAt []
case 26 name taken: composeAt calls 0 shell starts 0 | outcome said: "there is already something at /repo/.agents/worktrees/look-a2"
case 27 worktree menu labels: ["Open in Integrated Terminal","Start Claude Here","Start Codex Here","Open Worktree","Open Worktree in New Window","Delete Worktree"]
case 27 worktreePick answers: ["REPO_TERMINAL","WORKTREE_CLAUDE"] claude id -> ""
case 27 agentIn (the handler of the two items): [{"cwd":"/repo/.agents/worktrees/x","agent":"claude"},{"cwd":"/repo/.agents/worktrees/x","agent":"codex"}]
case 28/26 composer refusal said on the root line: "there is already something at /repo/.agents/worktrees/look-a2 Composer refused"
```

Cases 24, 26, 28 over a scratch repository, `wt.probe.ts`; case 59, `c59.probe.ts`; cases 39-41 and 53, `starting.probe.ts`:

```
case 24 POST createWorktree look-a2: {"status":200,"body":{"ok":true,"output":"HEAD is now at 623b115 init\n"}} | worktree dir exists true | branch look-a2
case 28 dirty main checkout, porcelain of the main checkout: " M a\n?? .agents/\n?? dirty\n" | porcelain of the worktree: "" | worktree HEAD equals main HEAD: true
case 26 same name again: {"status":400,"body":{"error":"there is already something at /var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/d20build/scratch/c24n/.agents/worktrees/look-a2"}}
case 26 a branch of that name exists (git refuses for another reason): {"status":400,"body":{"error":"a branch named 'taken-branch' already exists"}}
case 28 detached HEAD, POST createWorktree: {"status":200,"body":{"ok":true,"output":"HEAD is now at 623b115 init\n"}} | worktree exists true | worktree HEAD equals main HEAD: true | branch look-det
case 59 file holds A, B, C; reference {key 2, do C}: {"ok":true,"first":"Task: C"}
case 59 B removed (file now A, C); same reference: {"ok":false,"word":"task-unknown"}
case 59 C text changed (file now A, B, "C changed"); same reference: {"ok":false,"word":"task-unknown"}
case 59 file restored to A, B, C: {"ok":true,"first":"Task: C"}
case 40 while the hub is unknown: startingIn = "shell" | posts []
case 40 after the portfolio arrived and the post answered: startingIn = null | answer ok true | posts ["start"]
case 53 during: "shell" | after the portfolio named no folder: startingIn = null | refusal on the tab: "No folder to start the terminal in" | equals sessions.terminal_no_folder: true | posts []
case 41 refused: during "shell" | after startingIn = null | refusal on the bar: "The terminal could not do that."
case 41 tab closed while starting: during "shell" | after startingIn = null | refusal said: "" | posts (start then stop ends the terminal) ["start","stop"]
```

Case 44, `menus.probe.ts`:

```
case 44 scratch repository: local ["look-branch","other"] current look-branch remote branches ["origin/remote-branch"] tags ["v-look"] on one commit 03ac9f5
case 44 write idle:
  refMenu(look-branch, current) -> [{"label":"Checkout","disabled":true,"title":"This branch is checked out already"},{"label":"Delete Branch","disabled":true,"title":"The checked-out branch cannot be deleted; switch to another branch first"}]
  refMenu(other, branch) -> [{"label":"Checkout","disabled":false,"title":null},{"label":"Delete Branch","disabled":false,"title":null}]
  refMenu(origin/remote-branch, remote) -> [{"label":"Checkout (Detached)","disabled":false,"title":null}]
  refMenu(v-look, tag) -> [{"label":"Delete Tag","disabled":false,"title":null}]
  commitMenu -> ["Open Changes","Copy Commit ID","Copy Commit Message","Checkout[other]","Checkout (Detached)","Create Branch...","Create Tag...","Delete Tag[v-look]","Cherry Pick","Compare with..."]
case 44 write IN FLIGHT:
  refMenu(look-branch, current) -> []
  refMenu(other, branch) -> []
  refMenu(origin/remote-branch, remote) -> []
  refMenu(v-look, tag) -> []
  commitMenu -> ["Open Changes","Copy Commit ID","Copy Commit Message","Compare with..."]
```

Cases 29-34, `fold.probe.ts`; case 36, `cmp36.probe.ts` and `cmp`:

```
case 29 piece 64: 12 lines of which 10 cross a 64-byte boundary; applied [0,1,2,3,4,5,6,7,8,9,10,11]; answer 998; bytes of the complete lines 998; file size 1010 (an unfinished line of 12 bytes follows)
case 30 euro sign (3 bytes) at bytes 62-64, boundary after byte 63: decoded whole = true; text has no U+FFFD = true; answer 78 of 78
case 30 euro sign (3 bytes) at bytes 63-65, boundary after byte 63: decoded whole = true; text has no U+FFFD = true; answer 79 of 79
case 31 line of 1000 bytes, piece 64: applied [1,2] answer 1019 of 1019
case 32 offset 99999 beyond a file of 1019 bytes: 0 | offset equal to the size: 0 | missing file: 0
case 33 two lines then two appended during the first apply: first read applied [1,2] answer 38 (size it saw 38); next read from 38 applied [3,4] answer 38 (file now 76)
case 34 file 566231096 bytes (one line of 540 MiB between two small ones; MAX_STRING_LENGTH 536870888): applied [1,3] answer 566231096 (equals the size: true) in 211 ms; peak RSS 558 MiB
case 36 fixture A: cmp fixture-A.base.md fixture-A.new.md prints nothing (501 bytes, 10 turns [tool,user,assistant,user,assistant,tool,assistant,user,assistant,tool])
case 36 fixture B: cmp fixture-B.base.md fixture-B.new.md prints nothing (268 bytes, 4 turns [user,assistant,user,assistant])
```

Cases 45-48, 50, 56, 57, `git.probe.ts`; case 48 `gh` and `commitFile`, `deposit.probe.ts`; case 49, `writes49.probe.ts`:

```
case 46 (pre-commit exit 1, no output) POST commit: 0.6 s, status 400, {"error":"Git stopped with exit status 1 and gave no reason"}
case 45 (25 s pre-commit) POST commit: 25.7 s, status 200, {"ok":true,"output":"[main 85cedf4] m\n 1 file changed, 1 insertion(+), 1 deletion(-)\n"}
case 45 (25 s) commits before 1 after 2; log: m | init
case 45 (35 s pre-commit) POST commit: 35.8 s, status 200, {"ok":true,"output":"[main 37a3252] m\n 1 file changed, 1 insertion(+), 1 deletion(-)\n"}
case 45 (35 s) commits before 1 after 2; log: m | init
case 47/50 killed: true, signal SIGTERM, code null (10 s) -> {"reason":"timed-out","failure":{"code":"timed-out","detail":"10","program":"git"}} -> said: "Git did not finish within 10 seconds, so it was stopped"
case 47/50 code 1, both streams empty -> {"reason":"exit-status","failure":{"code":"exit-status","detail":"1","program":"git"}} -> said: "Git stopped with exit status 1 and gave no reason"
case 47/50 signal SIGKILL, killed false -> {"reason":"signal","failure":{"code":"signal","detail":"SIGKILL","program":"git"}} -> said: "Git was ended by the signal SIGKILL"
case 47/50 ERR_CHILD_PROCESS_STDIO_MAXBUFFER -> {"reason":"too-much-output","failure":{"code":"too-much-output","detail":"8","program":"git"}} -> said: "Git wrote more than 8 MB of output, so it was stopped"
case 47/50 ABORT_ERR (AbortError) -> {"reason":"cancelled","failure":{"code":"cancelled","detail":"","program":"git"}} -> said: "Git was stopped by Cancel"
case 47/50 stderr "fatal: not a git repository" -> {"reason":"not a git repository"} -> said: "not a git repository"
case 47/50 stdout-only "nothing to commit, working tree clean" -> {"reason":"nothing to commit, working tree clean"} -> said: "nothing to commit, working tree clean"
case 47/50 fetch: killed: true, limit PUSH_TIMEOUT_MS 60000 -> {"reason":"timed-out","failure":{"code":"timed-out","detail":"60","program":"git"}} -> said: "Git did not finish within 60 seconds, so it was stopped"
case 56 marker seen after 1054 ms, hook pid 42637; index.lock while it runs: false
case 56b before Cancel: hook shell pid 42772 alive true, its child (sleep) pids [42809] alive [true]
case 48 gh(['--version'], 2000): 2.1 s {"ok":false,"output":"","error":"timed-out","failure":{"code":"timed-out","detail":"2","program":"gh"}} -> deposit route wording: "The gh command did not finish within 2 seconds, so it was stopped"
case 48 pgrep -f /var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/d20build/scratch/c48-bin/gh after the call: status 1 output "" (status 1 and empty output: no such process)
case 56b after Cancel: commit answered 400 {"error":"Git was stopped by Cancel"}; hook shell alive false, sleep alive [false]; .git/index.lock false; commits 1
case 56 cancel on the second root answered {"ok":true,"output":""}; the first commit still running: true; hook alive: true
case 56 cancel on the first root: status 200 {"ok":true,"output":""}
case 56 the commit answered after 46 ms of the cancel: status 400 {"error":"Git was stopped by Cancel"}
case 56 commits before 1, after 1; .git/index.lock left: false
case 56 hook process after Cancel: pid 42637 alive = false; pgrep -f /var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/d20build/scratch/c56/.git/hooks/pre-commit: status 1 ""
case 57 switch (15 s post-checkout) POST: 15.6 s, status 200, {"ok":true,"output":""}
case 57 worktree add (15 s post-checkout) POST: 15.7 s, status 200, {"ok":true,"output":"HEAD is now at 61eefac init\n"}
case 48 commitFile with 25 s pre-commit: 25.3 s {"ok":true,"output":"[main 96d5844] m\n 1 file changed, 1 insertion(+), 1 deletion(-)\n","error":""}; commits 2
case 57 pull (65 s post-merge) POST: 65.9 s, status 200, {"ok":true,"output":"Updating 61eefac..ffa9c66\nFast-forward\n c | 1 +\n 1 file changed, 1 insertion(+)\n create mode 100644 c\n"}
case 57 push (70 s pre-push) POST: 70.6 s, status 200, {"ok":true,"output":""}
case 57 remote head after push: equals the local HEAD (push landed) | pulled file c exists: true | switched to: other | worktree exists: true
case 48 gh(['--version'], 2000): 2 s {"ok":false,"output":"","error":"timed-out","failure":{"code":"timed-out","detail":"2","program":"gh"}}
case 48 commitFile with 25 s pre-commit: 25.4 s {"ok":true,"output":"[main 3a229db] m\n 1 file changed, 1 insertion(+), 1 deletion(-)\n","error":""}
case 49 writeTimeout(config) = 30000 ms (config/behavior.yml writes.timeout_seconds: 30)
case 49 writeManifest with no answer: returned after 30008 ms: {"ok":false,"changed":[],"refused":[],"error":"no answer came in time, so the write was given up and may not have landed"}; aborted fetches {"/api/git cancel":30007,"/api/write manifest":30008}
case 49 at that moment: writeGit('stage') settled = false (waits for the server), writeGit('cancel') settled = true
```

Case 47 and 50 (the classifier rows) are in the `git.probe.ts` block above (`case 47/50 ...`); case 50's fetch after the change, `misc.probe.ts`: `case 50 POST fetch with a remote helper that sleeps 100 s: 60.1 s 400 {"error":"Git did not finish within 60 seconds, so it was stopped"}`, and `grep -n PUSH_TIMEOUT_MS src/lib/server/git/git-write.ts` shows `fetchIn` under it.

Case 56, the hook's own process: before Cancel `hook shell pid alive true, its child (sleep) alive [true]`; after Cancel `hook shell alive false, sleep alive [false]; .git/index.lock false; commits 1`; `pgrep -f <hook path>` status 1 with empty output. A Cancel on a second root answered `{"ok":true,"output":""}` while the first commit kept running.

## The documents and head comments of "What is on the tree"

`HELP.md`: 108 rewritten, 128 rewritten, 136 rewritten, 205 rewritten, 227 rewritten, 231 rewritten, 253 rewritten, 255 rewritten, 265 rewritten (`diff` of the base and the worktree lists exactly these nine changed lines). `DESIGN.md`: 122 rewritten, 153 still true (it already says an agent seeded with a task runs only after approval of the exact text), 328 rewritten, 366 rewritten, 372 rewritten, 380 rewritten. `README.md`: still true (unchanged; its lines 19, 30 and 36 are about the two accounts sharing transcripts).

Head comments: `compose.ts` rewritten; `composer.ts` rewritten (now `composer/composer.ts`); `Composer.svelte` rewritten (now `start/Composer.svelte`); `Terminal.svelte` still true (the head is the view registration; the composer left the file); `ToolButton.svelte` still true; `graph-menu.ts` rewritten; `CommitRow.svelte` rewritten; `git-write.ts` rewritten; `deposit-git.ts` rewritten; `git-routes.ts` rewritten; `transcripts.ts` still true; `turns.ts` still true; `transcript-routes.ts` still true; `rows.ts` still true; `Tasks.svelte` still true; `EntryCard.svelte` rewritten (the `extra` controls); `Worktrees.svelte` rewritten; `sessions.ts` rewritten (the `GRID_ENV` pair); `shell.ts` rewritten (the worktree starter). Each `still true` file's head was read against the built behaviour.

## Anything in the brief that was wrong or impossible

- Case 62 gave one row; the ruling replaced it with two (80 units with the pair whole, 79 units with no lone surrogate), run and quoted above.
- Cases 29 to 33 pass on the unchanged tree (quoted above): they check invariants of the piecewise read and cannot fail before the change. Only case 34 (and 35, 36) fail there.
- Case 56 asks whether the hook survives Cancel, expecting that Cancel ends oculus's git process only. `execFile`'s kill signals git alone, so a hook would outlive it; the build ends the hook too (judgment call 1), and case 56 shows it gone.
- The brief's sizes (`ToolButton.svelte` 539, `Terminal.svelte` 524, `Composer.svelte` 424) are the base's; the worktree's are 437, 513 and 504.

## Problems and observations not fixed

- A first read of a 600 MB transcript takes 4.8 s in `readTurns` and about 720 MiB more resident memory (141 MiB to 858 MiB), because every turn of the file is held and the route then keeps the last 200; the whole test process peaked at 1508 MiB, the export at 1544 MiB. Before the step the same file answered no turns. The tail-first read that would avoid holding the turns is a different design (a reverse scan for the last 200 turns) and is not in this step; it needs Axel's ruling on whether a first read of a huge file should read the tail only.
- `killWithDescendants` does not reach a process the hook detaches (`setsid`) or starts after the table was read (judgment call 1).
- A real `git commit` of a clean tree answers "On branch main" as its reason, because git writes `On branch main / nothing to commit` to stdout and `shortReason` takes the first line; this is the base's behaviour, unchanged, and the classifier is not reached since git exits 1 with text.
- `server/core/git/run.ts` (the read side) still says "git timed out" for a read past its limit; it is a `spawnSync` read outside the step.
- Case 23's Sessions-view New half is owed to Z515 (2).

## Next

The orchestrator reads the diff, runs the landing list and the look halves on TEST, rules on Z514's four entries (the two tests kept here are the first two), and settles Z515 (2) for case 23's New half.
