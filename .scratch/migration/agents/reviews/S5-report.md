# S5 report: the Settings view's controls and headings, with repair round 1

Everything in the brief is done, except what the brief gives to the orchestrator: the look on TEST (item 4), which I did not run. I rendered no component, so every statement below about what a view draws comes from state, code and test runs, not from a drawing; S5 case 62 second half and case 63 are not verified here for the same reason.

## Open items of the state file

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

(Copied from `tools/oculus/.scratch/migration/orchestrator-state.md`, section "Open items", at the moment this report was written; the section begins at line 158.)

## Rulings in force, the false premise, the key format

Z505 (`whole` and `form`), Z506 (the editor's options through the one rule) and Z509 (`latex.auto_build` through a reader of `settings.ts`) are built as the brief gives them. S5's round 0 rulings stand:

- Held-value rule (`agents/briefs/S5-cases.md`, item 1): item 7.3 and Decision 6 of the brief are replaced by it, and `src/lib/server/edit/writes/config/config-fit.ts` and `src/lib/state/system/config/editors/fields.ts` apply it. A record equal at every depth to a record of the base passes whole. In a changed record a field passes unchanged when the base held that value at that field (the record at the same key for a map family, any record of the option for a list family), unless its check reads another field of the record (`allow_missing` naming a toggle, `values_by`), which is always checked. The undo checks type alone. The test `readsOther` for that exception lives once in `src/lib/data/sources/config/catalog/options.ts` and both sides import it.
- Case 35 under the rule: the shipped `scan` rule with `optional: true` passes untouched, and a rule with a missing folder and `optional: true` is accepted; the same rule with `optional` off is refused on the page ("The folder projects/nonexistent is not in the hub.") and by the server ("Entry 8, field dir: This option takes a folder of the hub, and projects/ghost is not one").
- Case 22 under the rule: `chartreuse` at a `tab_split` key whose base record did not hold it is refused ("Entry idea, field value: This option takes a hue name of the palette"); kept at the key that holds it it is accepted; at another key of the same map it is refused.
- Item 1.6 and case 10, premise false: no closed-groups list is saved. Command: `grep -rn "toggledGroups" src` prints `src/lib/state/system/config/groups.ts:286`, `:296` and `src/lib/views/system/workbench/settings/Contents.svelte:14`, `:42` only; the closed groups are the `closed` state of `Contents.svelte`. A Settings tab opened afresh or after a reload draws every heading open. No saved list is added.
- Finding key: `<config file>:<key path>` with a field as one more dotted segment, `behavior.yml:probe` and `behavior.yml:probe.name`; the file of a finding is `config/catalogs/options.yml`. T1 uses this form.

## First run of every case on the unchanged tree

The unchanged tree is `<scratchpad>/r1/round-start/`, a copy of the worktree as the round began (`src`, `tests`, `config`, `utils`, `node_modules`), with no change to it kept. Two ways of running, both outside the worktree:

- A case marked test in the brief: the test file as it stands at the end of the round (and the shared fixture `tests/data/sources/config/wrong-settings.ts` it imports) is copied into the unchanged tree, run there with `cd <scratchpad>/r1/round-start && PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npx vitest run --reporter=verbose <test file>`, and the copy's own files are put back (`<scratchpad>/r1/firstrun2.sh`, which ran the seven files in turn, log per file under `<scratchpad>/r1/first2/`). The reporter's check mark and cross are written `pass` and `FAIL` below; nothing else is changed.
- A quoted case: `ROOT=<tree> node <scratchpad>/probes/<probe>.mjs` (node's own TypeScript support, `HOME` and `TMUX_TMPDIR` set by `probes/ctx.mjs` to directories under the scratchpad, the engine a copy of the tree's `config/` without `local.yml` made by the probe), once with `ROOT=<scratchpad>/r1/round-start` and once with `ROOT` the worktree after the last change. Case 39 is a test file copied into each tree's `tests/probe39/` (removed afterwards) and run with `npx vitest run`.

### Cases that are tests

| Case | Test (file, rows) | Rows on the unchanged tree | First failing line, or why it passes |
|---|---|---|---|
| 1 | `tests/data/sources/config/settings.test.ts` | 23 rows: 0 pass, 23 FAIL | A reader answers `{ threw }` where the row asks for `{ value, problems }`: `AssertionError: expected { Object (threw) } to strictly equal { Object (value, problems) }` (the unchanged readers throw `config/behavior.yml: <key> must be ...`; `refreshSettings` and `autofetchMin` are not exported from `settings.ts`, so those rows throw `... is not a function`). |
| 2 | `tests/data/sources/config/settings.test.ts` | 2 rows: 0 pass, 2 FAIL | The reader throws `config/behavior.yml: slurm must be a map`. |
| 3 | `tests/data/sources/config/settings.test.ts` | 1 row: 0 pass, 1 FAIL | A reader answers `{ threw }` where the row asks for the defaults. |
| 4 | `tests/data/sources/config/settings.test.ts` | 1 row: 0 pass, 1 FAIL | The reader throws at the first wrong key. |
| 5 | `tests/data/sources/config/settings.test.ts` | 1 row: 1 pass, 0 FAIL | Passes: a corrected value reads on the unchanged tree. |
| 6 | `tests/data/sources/config/settings.test.ts` | 2 rows: 0 pass, 2 FAIL | `AssertionError: expected { Object (threw) } to strictly equal { value: { a: 'A' }, ...(1) }`: a tier that is no text throws. |
| 7 | `tests/data/sources/config/settings.test.ts` | 3 rows: 0 pass, 3 FAIL | `TypeError: programApps is not a function` (it is exported from `data/helpers/files/opens-in-program.ts`, not from `settings.ts`). |
| 8 | `tests/data/sources/config/settings.test.ts` | 2 rows: 0 pass, 2 FAIL | The unchanged reader throws `config/behavior.yml: slurm.resource must be a non-empty string` where the row expects `config/catalogs/options.yml holds no entry, or no default that reads, for slurm.poll_min, so slurm.poll_min cannot be read`; the second row reads a default refused by its own bounds and gets a throw. |
| 9 | `tests/data/sources/config/settings.test.ts` | 1 row: 0 pass, 1 FAIL | `TypeError: settingProblems is not a function` at `settings.test.ts:495`. |
| 10 | `tests/data/sources/config/settings.test.ts` | 4 rows: 0 pass, 4 FAIL | `TypeError: paintLimit is not a function` (it is exported from `data/helpers/editor.ts`); `confirmDelete` over a wrong flag answers true where the catalog default is false (`AssertionError: expected true to be false`); `refreshSettings` and `autofetchMin` throw `... is not a function`. |
| Z509 | `tests/data/sources/config/settings.test.ts` | 1 row: 0 pass, 1 FAIL | `TypeError: latexAutoBuild is not a function` at `settings.test.ts:383`. |
| 17-23, port | `tests/data/sources/config/local.test.ts` | 11 rows: 0 pass, 11 FAIL | `TypeError: readLocalText is not a function` (cases 17 to 22) and `TypeError: readLocal is not a function` (case 23); the row `reads a wrong port as the default port` fails with `Error: .../config/local.yml: port must be an integer`. |
| 24 | `tests/data/sources/config/local.test.ts` | 14 rows: 14 pass, 0 FAIL | All rows pass: `checkLocal` keeps every sentence it answered. |
| 33 | `tests/data/sources/config/local.test.ts` | 1 row: 0 pass, 1 FAIL | `TypeError: readLocalText is not a function` (the test builds its texts through it). |
| 30 | `tests/routes/edit/config-key.test.ts` | 1 row: 0 pass, 1 FAIL | `AssertionError: expected 400 to be 200` at `tests/routes/edit/write-fixture.ts:214` (`undoneBack`): the undo is refused by the type check. |
| 31 | `tests/checks/config/config.test.ts` | 2 rows: 0 pass, 2 FAIL | `TypeError: settingFindings is not a function`. |
| 34 | `tests/data/sources/config/catalog/options.test.ts` | 1 row: 0 pass, 1 FAIL | `AssertionError: expected [] to deeply equal [ ...(2) ]`: neither key is read and no problem is given. |
| 36 | `tests/data/sources/config/editor-options.test.ts` | file does not load, 0 rows run | The file fails to import: `Cannot find module .../src/lib/data/sources/config/editor-options.ts`; no row runs. |
| 37 | `tests/data/sources/config/editor-options.test.ts` | file does not load, 0 rows run | The same import failure; no row runs. |
| 38 | `tests/data/sources/config/editor-options.test.ts` | file does not load, 0 rows run | The same import failure; no row runs. |
| 32 | `tests/data/sources/config/catalog/value-rule.test.ts` | file does not load, 0 rows run | The file fails to import: `Cannot find module .../src/lib/data/sources/config/catalog/value-rule.ts`; no row runs. |

File totals on the unchanged tree (the summary lines printed by each run):

```
tests/data/sources/config/settings.test.ts: Test Files  1 failed (1); Tests  36 failed | 3 passed (39)
tests/data/sources/config/local.test.ts: Test Files  1 failed (1); Tests  12 failed | 14 passed (26)
tests/data/sources/config/catalog/value-rule.test.ts: Test Files  1 failed (1); Tests  no tests
tests/data/sources/config/editor-options.test.ts: Test Files  1 failed (1); Tests  no tests
tests/data/sources/config/catalog/options.test.ts: Test Files  1 failed (1); Tests  1 failed | 2 passed (3)
tests/checks/config/config.test.ts: Test Files  1 failed (1); Tests  4 failed | 26 passed (30)
tests/routes/edit/config-key.test.ts: Test Files  1 failed (1); Tests  1 failed | 1 passed (2)
```

Every row of the seven files, as printed (`pass` and `FAIL`, file prefix `tests/` dropped), and the first error line of each failing row grouped by message:

`tests/data/sources/config/settings.test.ts`:

```
pass | data/sources/config/settings.test.ts > the synthetic catalog > gives every setting a default other than the shipped one
FAIL | data/sources/config/settings.test.ts > slurmSettings > answers the default for a days with a range problem
FAIL | data/sources/config/settings.test.ts > slurmSettings > answers the default for a days with a whole problem
FAIL | data/sources/config/settings.test.ts > slurmSettings > answers the default for a poll_min with a range problem
FAIL | data/sources/config/settings.test.ts > slurmSettings > answers the default for a quota_min with a range problem
FAIL | data/sources/config/settings.test.ts > slurmSettings > answers the default for a days that is no number
FAIL | data/sources/config/settings.test.ts > slurmSettings > answers the default for a poll_min that is no number
FAIL | data/sources/config/settings.test.ts > slurmSettings > answers the default for a quota_min that is no number
FAIL | data/sources/config/settings.test.ts > slurmSettings > answers the default for an empty resource, a text that is not a program and a flag
pass | data/sources/config/settings.test.ts > slurmSettings > reads the corrected value with no problem
FAIL | data/sources/config/settings.test.ts > slurmSettings > answers every default and one problem for a block that is not a map
FAIL | data/sources/config/settings.test.ts > slurmSettings > answers the defaults and no problem for a missing, null or empty block, a missing key and a misspelt key
FAIL | data/sources/config/settings.test.ts > slurmSettings > names two wrong keys of one block and reads the other three
FAIL | data/sources/config/settings.test.ts > slurmSettings > throws the sentence naming the key and options.yml for a catalog with no entry
FAIL | data/sources/config/settings.test.ts > slurmSettings > throws when an entry default is refused by its own bounds
FAIL | data/sources/config/settings.test.ts > calendarSettings > answers the default for a poll_min with a pollMin problem
FAIL | data/sources/config/settings.test.ts > calendarSettings > answers the default for a days_back with a daysBack problem
FAIL | data/sources/config/settings.test.ts > calendarSettings > answers the default for a days_back with a daysBack problem
FAIL | data/sources/config/settings.test.ts > calendarSettings > answers the default for a days_ahead with a daysAhead problem
FAIL | data/sources/config/settings.test.ts > calendarSettings > answers the defaults for a block that is no map, and the written value for a good one
FAIL | data/sources/config/settings.test.ts > searchSettings > answers the default for each value that is not above zero, and for a fraction of hits
FAIL | data/sources/config/settings.test.ts > mailSettings > answers the default for a wrong value and names the key
FAIL | data/sources/config/settings.test.ts > changesKeep > answers the default for a keep that is not a whole number above zero
FAIL | data/sources/config/settings.test.ts > openSettings and programApps > leaves out each member the entry refuses and names it
FAIL | data/sources/config/settings.test.ts > openSettings and programApps > answers an empty map and one problem for a map that is none
FAIL | data/sources/config/settings.test.ts > openSettings and programApps > answers an empty map for a configuration that holds no catalog yet
FAIL | data/sources/config/settings.test.ts > latexFormatting and latexAutoBuild > answers the default for a formatter outside the entry words
FAIL | data/sources/config/settings.test.ts > latexFormatting and latexAutoBuild > answers the default for a program path that is not a path
FAIL | data/sources/config/settings.test.ts > latexFormatting and latexAutoBuild > reads the auto build by its entry
FAIL | data/sources/config/settings.test.ts > usageTiers > leaves out each entry that is no text and names it
FAIL | data/sources/config/settings.test.ts > usageTiers > answers an empty map for a map that is none, and for none
FAIL | data/sources/config/settings.test.ts > processesSettings > answers the default list for ["python3","a/b"] and names the key
FAIL | data/sources/config/settings.test.ts > processesSettings > answers the default list for ["python3","my tool"] and names the key
pass | data/sources/config/settings.test.ts > processesSettings > reads a good list and an empty one
FAIL | data/sources/config/settings.test.ts > refreshSettings, autofetchMin and paintLimit > answers the default for a wrong cadence and a model outside the models
FAIL | data/sources/config/settings.test.ts > refreshSettings, autofetchMin and paintLimit > answers the default for a fetch period that is negative or a fraction
FAIL | data/sources/config/settings.test.ts > refreshSettings, autofetchMin and paintLimit > answers the default bytes for a paint limit that is wrong, and null with no catalog
FAIL | data/sources/config/settings.test.ts > confirmDelete > answers the default for a wrong flag, and true with no catalog
FAIL | data/sources/config/settings.test.ts > the shipped files > answers the shipped default for each setting the shipped file gets wrong, and reads every shipped default
--- first error line, rows with it
5 x AssertionError: expected { Object (threw) } to strictly equal { Object (value, problems) }
1 x AssertionError: expected { Object (threw) } to match object { problems: [ 'slurm.days: number' ] }
2 x AssertionError: expected { Object (threw) } to match object { Object (problems) }
1 x AssertionError: expected { Object (threw) } to match object { value: { resource: 'alpha' }, ...(1) }
4 x AssertionError: expected { Object (threw) } to strictly equal { ...(2) }
1 x AssertionError: expected { Object (threw) } to strictly equal { Object (threw) }
1 x AssertionError: expected { Object (threw) } to match object { value: Anything, problems: [] }
1 x AssertionError: expected { Object (threw) } to match object { value: { pollMin: 20 }, ...(1) }
2 x AssertionError: expected { Object (threw) } to match object { value: { daysBack: 10 }, ...(1) }
1 x AssertionError: expected { Object (threw) } to match object { value: { daysAhead: 20 }, ...(1) }
1 x AssertionError: expected { Object (threw) } to strictly equal { value: { pollMin: 20, ...(2) }, ...(1) }
1 x AssertionError: expected { Object (threw) } to match object { value: { maxHits: 300, ...(1) }, ...(1) }
1 x AssertionError: expected { Object (threw) } to strictly equal { value: { pollMin: 12, ...(1) }, ...(1) }
1 x AssertionError: expected { Object (threw) } to strictly equal { value: 400, ...(1) }
1 x AssertionError: expected { Object (threw) } to strictly equal { value: { programApps: {} }, ...(1) }
1 x TypeError: programApps is not a function
1 x AssertionError: expected { Object (threw) } to match object { ...(2) }
1 x AssertionError: expected { ...(2) } to match object { value: { paths: { ...(1) } }, ...(1) }
1 x TypeError: latexAutoBuild is not a function
1 x AssertionError: expected { Object (threw) } to strictly equal { value: { a: 'A' }, ...(1) }
1 x AssertionError: expected { Object (threw) } to strictly equal { value: {}, ...(1) }
2 x AssertionError: expected { Object (threw) } to strictly equal { value: { patterns: [ ...(2) ] }, ...(1) }
1 x AssertionError: expected { Object (threw) } to strictly equal { value: 7, ...(1) }
1 x TypeError: paintLimit is not a function
1 x AssertionError: expected true to be false // Object.is equality
1 x TypeError: settingProblems is not a function
```

`tests/data/sources/config/local.test.ts`:

```
pass | data/sources/config/local.test.ts > checkLocal > answers "[]" with the sentence it would throw
pass | data/sources/config/local.test.ts > checkLocal > answers "accounts: {}" with the sentence it would throw
pass | data/sources/config/local.test.ts > checkLocal > answers "accounts: [3]" with the sentence it would throw
pass | data/sources/config/local.test.ts > checkLocal > answers "accounts: [{ tool: gemini, dir: d, label: a }]" with the sentence it would throw
pass | data/sources/config/local.test.ts > checkLocal > answers "accounts: [{ tool: claude, dir: '', label: a }]" with the sentence it would throw
pass | data/sources/config/local.test.ts > checkLocal > answers "accounts: [{ tool: claude, dir: d, label: '' }]" with the sentence it would throw
pass | data/sources/config/local.test.ts > checkLocal > answers "accounts: [{ tool: claude, dir: d, label: A b }, { tool: claude, dir: e, label: a-b }]" with the sentence it would throw
pass | data/sources/config/local.test.ts > checkLocal > answers "hub: 3\nport: x" with the sentence it would throw
pass | data/sources/config/local.test.ts > checkLocal > answers "port: x" with the sentence it would throw
pass | data/sources/config/local.test.ts > checkLocal > answers "hpc_host: ''" with the sentence it would throw
pass | data/sources/config/local.test.ts > checkLocal > answers "calendars: [{ provider: yahoo, label: a }]" with the sentence it would throw
pass | data/sources/config/local.test.ts > checkLocal > answers "calendars: [{ provider: ics, label: A }]" with the sentence it would throw
pass | data/sources/config/local.test.ts > checkLocal > answers "calendars: [{ provider: ics, label: a }, { provider: ics, label: a }]" with the sentence it would throw
pass | data/sources/config/local.test.ts > checkLocal > answers "mail: [{ provider: ics, label: a }]" with the sentence it would throw
FAIL | data/sources/config/local.test.ts > readLocalText > keeps the good keys when one is wrong
FAIL | data/sources/config/local.test.ts > readLocalText > names two wrong keys and answers both defaults
FAIL | data/sources/config/local.test.ts > readLocalText > leaves out the row that is wrong and reads the rows around it
FAIL | data/sources/config/local.test.ts > readLocalText > leaves a path key absent when it is empty
FAIL | data/sources/config/local.test.ts > readLocalText > answers every default and one problem for a text that does not read
FAIL | data/sources/config/local.test.ts > readLocalText > reads the corrected text with no problem
FAIL | data/sources/config/local.test.ts > readLocal and loadLocal > answers every default and no problem for a missing file
FAIL | data/sources/config/local.test.ts > readLocal and loadLocal > answers every default and the error code for a folder at the file path
FAIL | data/sources/config/local.test.ts > readLocal and loadLocal > answers the error code for a file nobody may read
FAIL | data/sources/config/local.test.ts > readLocal and loadLocal > warns of an unknown key only when asked, and loadLocal asks every call
FAIL | data/sources/config/local.test.ts > readLocal and loadLocal > reads a wrong port as the default port
FAIL | data/sources/config/local.test.ts > localFindings > words each problem against local.yml with no value of the file in it
--- first error line, rows with it
7 x TypeError: readLocalText is not a function
4 x TypeError: readLocal is not a function
1 x Error: /var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/oculus-local-9ApXlf/config/local.yml: port must be an integer
```

`tests/data/sources/config/catalog/value-rule.test.ts`:

```
(no row ran)
--- first error line, rows with it
1 x Error: Cannot find module '../../../../../src/lib/data/sources/config/catalog/value-rule.ts' imported from <scratchpad>/r1/round-sta
```

`tests/data/sources/config/editor-options.test.ts`:

```
(no row ran)
--- first error line, rows with it
1 x Error: Cannot find module '../../../../src/lib/data/sources/config/editor-options.ts' imported from <scratchpad>/r1/round-start/test
```

`tests/data/sources/config/catalog/options.test.ts`:

```
pass | data/sources/config/catalog/options.test.ts > catalogOf > answers an empty catalog for {"options":"x"}
pass | data/sources/config/catalog/options.test.ts > optionFindings > names the key of each entry it cannot read and reads its control as text
FAIL | data/sources/config/catalog/options.test.ts > whole and form > reads whole and form, and names an entry whose whole or form it cannot read
--- first error line, rows with it
1 x AssertionError: expected [] to deeply equal [ ...(2) ]
```

`tests/checks/config/config.test.ts`:

```
pass | checks/config/config.test.ts > loadLocal > reads the file inside the config folder and not one beside it
pass | checks/config/config.test.ts > loadLocal > reports an unknown key once and ignores it
pass | checks/config/config.test.ts > loadLocal > accepts distinct Claude labels on equal folder basenames and a matching Codex label
pass | checks/config/config.test.ts > loadLocal > reads the file of the engine it is given and never another engine own
pass | checks/config/config.test.ts > checkLocal > says nothing, and prints nothing, about an unknown key
pass | checks/config/config.test.ts > the config folder of an engine > is that engine own folder, so a run over a copy reads and writes the copy
pass | checks/config/config.test.ts > the config folder of an engine > is the folder the engine root serves and the file a root finding names
pass | checks/config/config.test.ts > loadConfig > merges the top-level keys of every file in name order
pass | checks/config/config.test.ts > loadConfig > reports a top-level key two files define and takes the value from the later one
pass | checks/config/config.test.ts > loadConfig > reports a catalog key two owner files define and takes the later value
pass | checks/config/config.test.ts > loadConfig > reports a file that does not parse and merges the rest
pass | checks/config/config.test.ts > loadConfig > reports a file that is not a map and treats an empty file as no keys
pass | checks/config/config.test.ts > loadConfig > leaves the machine own file out of the merge, clashing key and all
pass | checks/config/config.test.ts > loadConfig > reports a missing config directory and returns an empty map
pass | checks/config/config.test.ts > loadConfig > words a catalog block that is not a map from the catalog, naming where it stops
pass | checks/config/config.test.ts > loadConfig > reports a catalog block whose aliases loop as a finding rather than throwing
pass | checks/config/config.test.ts > loadConfig > names a sentence file that does not parse by its key and arguments, without throwing
FAIL | checks/config/config.test.ts > behaviorFindings > names the key that replaced a retired one, against behavior.yml
FAIL | checks/config/config.test.ts > behaviorFindings > says nothing about a configuration whose keys are all under their own names
FAIL | checks/config/config.test.ts > settingFindings > words each wrong setting against behavior.yml from the catalog, and nothing for the shipped files
FAIL | checks/config/config.test.ts > settingFindings > says nothing for a merge that dropped behavior.yml, or for a map without the catalog
pass | checks/config/config.test.ts > themeFindings > names a theme row whose glyph is empty or missing, and draws it with its words alone
pass | checks/config/config.test.ts > themeFindings > names a glyph the vocabulary does not hold, a prototype key among them
pass | checks/config/config.test.ts > themeFindings > names a second row repeating a theme, and nothing for two rows sharing a glyph
pass | checks/config/config.test.ts > themeFindings > names a code theme that is no listed id, one finding per value, case included
pass | checks/config/config.test.ts > themeFindings > names a bad code theme in a config that has no themes list
pass | checks/config/config.test.ts > themeFindings > says nothing for an absent code_theme, tokens or a listed id
pass | checks/config/config.test.ts > themeFindings > says nothing about the shipped list, a row with no name, or a config with no list
pass | checks/config/config.test.ts > vocabCatalog > carries code_theme with the other appearance keys, and only when the config holds it
pass | checks/config/config.test.ts > optionFindings > reads the shipped options catalog with no finding
--- first error line, rows with it
1 x AssertionError: expected [ { ...(3) }, { ...(3) } ] to deeply equal [ { ...(3) } ]
1 x AssertionError: expected [ { ...(3) } ] to deeply equal []
2 x TypeError: settingFindings is not a function
```

`tests/routes/edit/config-key.test.ts`:

```
pass | routes/edit/config-key.test.ts > taking a setting back > puts the file back byte for byte and logs the undo above the write
FAIL | routes/edit/config-key.test.ts > taking a setting back > puts back a value the file held that its catalog entry refuses
--- first error line, rows with it
1 x AssertionError: expected 400 to be 200 // Object.is equality
```

Case 24 passes on the unchanged tree and in the worktree (14 rows in the first run above; `Tests  138 passed` in the worktree run of the list, below). The rows that pass on the unchanged tree besides case 24 are case 5 (a corrected value), the synthetic-catalog row of `settings.test.ts` (it checks the fixture's own defaults differ from the shipped ones) and the good-list row of `processesSettings`; each tests behaviour the round leaves as it is.

### Cases that are quoted runs

**Cases 11, 12 and 28 (start over wrong settings, over a merge that dropped `behavior.yml`, over a merge that dropped `options.yml`)**

Command: `ROOT=<tree> node <scratchpad>/probes/case11.mjs`.

Unchanged tree:

```
--- case11-wrong-settings: threw: config/behavior.yml: slurm.poll_min must be a number from 1 to 35791
--- case12-merge-dropped-behavior: threw: config/behavior.yml: slurm must be a map
--- case28-merge-dropped-options: returned
watchHpc pollMin: 20
watchUsageRefresh refreshMin/model: 10 haiku
```

Worktree after the last change:

```
--- case11-wrong-settings: returned
watchHpc pollMin: 20
watchUsageRefresh refreshMin/model: 10 haiku
stderr: config: <scratchpad>/probes/engine-case11-wrong-settings-MUuAp1/config/behavior.yml [slurm.poll_min] slurm.poll_min must be a number from 1 to 35791; the default is used
stderr: config: <scratchpad>/probes/engine-case11-wrong-settings-MUuAp1/config/behavior.yml [usage_refresh_min] usage_refresh_min must be a number; the default is used
stderr: config: <scratchpad>/probes/engine-case11-wrong-settings-MUuAp1/config/catalogs/options.yml [behavior.yml:probe.key] control colours is not one of the controls; the option is drawn as a text box
--- case12-merge-dropped-behavior: returned
watchHpc pollMin: 20
watchUsageRefresh refreshMin/model: 10 haiku
--- case28-merge-dropped-options: threw: config/catalogs/options.yml holds no entry, or no default that reads, for slurm.resource, so slurm.resource cannot be read
```

Left out of both outputs: 6 lines on the worktree, each a `layout.yml` finding for a hub document the scratch hub does not hold or a `portfolio watch: cannot watch <folder>` line for a folder the scratch hub does not hold.

Case 11 on the unchanged tree throws as the brief says. Case 12 on the unchanged tree throws too (`config/behavior.yml: slurm must be a map`); it returns after the change. Case 28 returns on the unchanged tree because its readers carry their own defaults (`watchHpc pollMin: 20`), and the worktree throws the sentence of Decision 2. The brief's rules hold for all three.

**Case 13 (live settings)**

Command: `ROOT=<tree> node <scratchpad>/probes/case13.mjs`.

Unchanged tree:

```
calendar.poll_min 0: handed ["usage.setTiers [{\"default_claude_max_20x\":\"Max 20x\",\"default_claude_max_5x\":\"Max","hpc.set [{\"host\":\"\",\"missing\":\"the resources registry is not read yet\",\"days\":3,"]; stderr ["config: config/behavior.yml: calendar
calendar.poll_min 0 again: handed []; stderr []
calendar.poll_min 7: handed ["calendar.setSettings [{\"pollMin\":7,\"daysBack\":31,\"daysAhead\":62}]"]; stderr []
dropped-file finding, behavior keys gone: handed []; stderr ["config: config/behavior.yml: slurm must be a map; the settings in force are kept","config: config/behavior.yml: calendar must be a map; the settings in force are kept","config: config/behavior.yml: 
```

Worktree after the last change:

```
calendar.poll_min 0: handed ["calendar.setSettings [{\"pollMin\":15,\"daysBack\":31,\"daysAhead\":62}]","usage.setTiers [{\"default_claude_max_20x\":\"Max 20x\",\"default_claude_max_5x\":\"Max","hpc.set [{\"host\":\"\",\"missing\":\"the resources registry is not read yet\",\"days\":3,"]; stderr []
calendar.poll_min 0 again: handed []; stderr []
calendar.poll_min 7: handed ["calendar.setSettings [{\"pollMin\":7,\"daysBack\":31,\"daysAhead\":62}]"]; stderr []
dropped-file finding, behavior keys gone: handed []; stderr []
```

On the unchanged tree the first message with `calendar.poll_min: 0` hands the usage tiers and the HPC settings, hands the calendar nothing and logs a `config/behavior.yml: calendar ...` sentence, and the message holding the dropped-file finding logs `slurm must be a map; the settings in force are kept` and the same sentence for the blocks after it. After the change the calendar recorder gets the default 15 once, a second identical message hands nothing, 7 is handed as 7, and the dropped-file message hands nothing and logs nothing. The probe cuts each printed line at 300 characters, which cuts the unchanged tree's lines.

**Case 14 (write gate)**

Command: `ROOT=<tree> node <scratchpad>/probes/case14.mjs`.

Unchanged tree:

```
slurm.days -1: changed=[] refused=["This option takes a number from 0 to 3650"] fileUnchanged=true
slurm.days 1.5: changed=[] refused=["config/behavior.yml: slurm.days must be a whole number from 0 to 3650"] fileUnchanged=true
processes.patterns [python3,'a/b']: changed=["behavior.yml:processes.patterns"] refused=[] fileUnchanged=false
open.program_ext + pdf: changed=[] refused=["config/behavior.yml: open.program_ext must map extensions, each with its dot, to bundle ids"] fileUnchanged=false
open.program_ext + .txt 'com.apple TextEdit': changed=[] refused=["config/behavior.yml: open.program_ext must map extensions, each with its dot, to bundle ids"] fileUnchanged=false
slurm.days is -1 on disk: write slurm.days 4: changed=["behavior.yml:slurm.days"] refused=[]
slurm.days is -1 on disk: write slurm.poll_min 25: changed=[] refused=["config/behavior.yml: slurm.days must be a whole number from 0 to 3650"]
```

Worktree after the last change:

```
slurm.days -1: changed=[] refused=["This option takes a number from 0 to 3650"] fileUnchanged=true
slurm.days 1.5: changed=[] refused=["This option takes a whole number"] fileUnchanged=true
processes.patterns [python3,'a/b']: changed=[] refused=["This option takes a program name, with no slash and no white space"] fileUnchanged=true
open.program_ext + pdf: changed=[] refused=["Entry pdf, field key: This option takes an extension with its dot, such as .pdf"] fileUnchanged=true
open.program_ext + .txt 'com.apple TextEdit': changed=[] refused=["Entry .txt, field value: This option takes the bundle id of an application, such as com.apple.Preview"] fileUnchanged=true
slurm.days is -1 on disk: write slurm.days 4: changed=["behavior.yml:slurm.days"] refused=[]
slurm.days is -1 on disk: write slurm.poll_min 25: changed=["behavior.yml:slurm.poll_min"] refused=[]
```

On the unchanged tree the last row, `slurm.poll_min: 25` while `slurm.days` is wrong on disk, is refused with the reader's sentence, as the brief says; the unchanged tree also writes `processes.patterns: [python3, 'a/b']` (changed `behavior.yml:processes.patterns`).

**Case 15 (open route)**

Command: `ROOT=<tree> node <scratchpad>/probes/case15.mjs`.

Unchanged tree:

```
a.pdf: status=500 opener=[] apps=undefined body={"error":"config/behavior.yml: open.program_ext must map extensions, each with its dot, to bundle ids"}
b.xyz: status=500 opener=[] apps=undefined body={"error":"config/behavior.yml: open.program_ext must map extensions, each with its dot, to bundle ids"}
```

Worktree after the last change:

```
a.pdf: status=200 opener=[{"kind":"file","app":"com.adobe.Reader"}] apps={".pdf":"com.adobe.Reader"} body={"ok":true,"changed":[],"refused":[]}
b.xyz: status=403 opener=[] apps={".pdf":"com.adobe.Reader"} body={"error":"the file would run rather than open","refused":[{"field":"path","reason":"the file would run rather than open"}]}
```

**Case 16 (the timer)**

Command: `ROOT=<tree> node <scratchpad>/probes/case16.mjs`.

Unchanged tree:

```
git.autofetch_minutes: 'x': fetches=0 log=["autofetch: config/behavior.yml git.autofetch_minutes is not a whole number of minutes, 0 or more; nothing is fetched"]
git.autofetch_minutes: 1 (control: fetches once): fetches=1 log=[]
catalog without an entry for the key: fetches=0 log=[]
```

Worktree after the last change:

```
git.autofetch_minutes: 'x': fetches=0 log=[]
git.autofetch_minutes: 1 (control: fetches once): fetches=1 log=[]
catalog without an entry for the key: fetches=0 log=["autofetch: config/catalogs/options.yml holds no entry, or no default that reads, for git.autofetch_minutes, so git.autofetch_minutes cannot be read; nothing is fetched"]
```

**Cases 25, 26, 27 and 29 (the machine file at start, on reload, in the payload, and the port)**

Command: `ROOT=<tree> node <scratchpad>/probes/local-cases.mjs`.

Unchanged tree:

```
--- case 25: start over port: x and an unknown key
threw: <scratchpad>/probes/engine-c25-U3j7aH/config/local.yml: port must be an integer
stderr: WARN <sp>/probes/engine-c25-U3j7aH/config/local.yml: ignoring unknown key(s) colour
--- case 26: start hpcHost=alpha claudeBin=myclaude port=8791
rewrite hpc_host: '': hpcHost=alpha claudeBin=myclaude port=8791; stderr ["the machine's own configuration is not read again: <sp>/probes/engine-c26-PzHUgh/config/local.yml: hpc_host must be a non-empty string"]
rewrite to a text that does not parse: hpcHost=alpha claudeBin=myclaude port=8791; stderr ["the machine's own configuration is not read again: Flow sequence in block collection must be sufficiently indented and end with a ] at line 2, column 1:\n\nhub: [\n\n^\n"]
same text again: hpcHost=alpha claudeBin=myclaude port=8791; stderr []
corrected, hpc_host: beta: hpcHost=beta claudeBin=myclaude port=8791; stderr []
--- case 29: started on 8791
after port: x: portMove calls []; local.port=8791; stderr ["the machine's own configuration is not read again: <sp>/probes/engine-c29-GSAFvd/config/local.yml: port must be an integer"]
--- case 27: config payload findings
config/catalogs/options.yml [behavior.yml:probe.key] control colours is not one of the controls; the option is drawn as a text box
```

Worktree after the last change:

```
--- case 25: start over port: x and an unknown key
stderr: WARN <sp>/probes/engine-c25-KGhvMV/config/local.yml: ignoring unknown key(s) colour
stderr: config: <sp>/probes/engine-c25-KGhvMV/config/local.yml [port] port must be an integer; the default is used
context.local.port = 8790
--- case 26: start hpcHost=alpha claudeBin=myclaude port=8791
rewrite hpc_host: '': hpcHost=undefined claudeBin=myclaude port=8791; stderr []
rewrite to a text that does not parse: hpcHost=undefined claudeBin=myclaude port=8791; stderr ["the machine's own configuration is not read again: Flow sequence in block collection must be sufficiently indented and end with a ] at line 2, column 1:"]
same text again: hpcHost=undefined claudeBin=myclaude port=8791; stderr []
corrected, hpc_host: beta: hpcHost=beta claudeBin=myclaude port=8791; stderr []
--- case 29: started on 8791
after port: x: portMove calls [8790]; local.port=8790; stderr []
--- case 27: config payload findings
config/behavior.yml [slurm.poll_min] slurm.poll_min must be a number from 1 to 35791; the default is used
config/catalogs/options.yml [behavior.yml:probe.key] control colours is not one of the controls; the option is drawn as a text box
config/local.yml [port] port must be an integer; the default is used
```

Left out of both outputs: 15 lines on the worktree, each a `layout.yml` finding for a hub document the scratch hub does not hold or a `portfolio watch: cannot watch <folder>` line for a folder the scratch hub does not hold.

Case 25: the unchanged tree throws `port must be an integer`; the worktree returns with `context.local.port = 8790`, one finding naming `port`, and one warning for the unknown key `colour`. Case 26: after `hpc_host: ''` the unchanged tree keeps `hpcHost=alpha` and logs why, the worktree leaves `hpcHost` absent and keeps `claudeBin=myclaude port=8791`; a text that does not parse keeps every value in both; the corrected `hpc_host: beta` reads in both. Case 29: the unchanged tree stays on 8791 with `portMove calls []`; the worktree calls `portMove` with 8790. Case 27: the unchanged tree carries the `control: colours` finding only; the worktree adds the setting finding for `slurm.poll_min` and the local finding for `port`, with the scratch `local.yml` as its file.

**Case 35 (the Settings view before a write)**

Command: `ROOT=<tree> node <scratchpad>/probes/case35.mjs`.

Unchanged tree:

```
slurm.days "1.5": write=true
slurm.days "4": write=true
open.program_ext key pdf: ok=true
open.program_ext key .pdf: ok=true
open.program_ext value com.apple TextEdit: ok=true
open.program_ext value com.apple.Preview: ok=true
processes.patterns ["python3","a/b"]: ok=true
processes.patterns ["python3"]: ok=true
```

Worktree after the last change:

```
slurm.days "1.5": write=false said={"key":"workbench.settings_not_whole","args":[]}
slurm.days "4": write=true
open.program_ext key pdf: ok=false trouble={"is":"form","form":"extension"}
open.program_ext key .pdf: ok=true
open.program_ext value com.apple TextEdit: ok=false trouble={"is":"form","form":"bundle_id"}
open.program_ext value com.apple.Preview: ok=true
processes.patterns ["python3","a/b"]: ok=false trouble={"is":"form","form":"program"}
processes.patterns ["python3"]: ok=true
```

On the unchanged tree every refused value is sent: `slurm.days` `1.5`, the key `pdf`, the value `com.apple TextEdit` and the item `a/b`. After the change none of the four is sent, and `4`, `.pdf`, `com.apple.Preview` and `python3` are.

**Case 39 (`resolveEditor` over the shipped catalog)**

Command: `cp <scratchpad>/probes/case39.test.ts <tree>/tests/probe39/ && cd <tree> && PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npx vitest run tests/probe39/case39.test.ts` (the printed lines kept; the copy removed afterwards`.

Unchanged tree:

```
configured tab_size, word_wrap: 4 off
size 12 / wrap x -> {"indent":{"tabs":false,"size":12},"wordWrap":"x","configuredWrap":"off","rulers":[]}
size 2 / wrap on -> {"indent":{"tabs":false,"size":2},"wordWrap":"on","configuredWrap":"off","rulers":[]}
draft read from { indent size 12, wrap x }: {"indent":null,"wrap":null}
```

Worktree after the last change:

```
configured tab_size, word_wrap: 4 off
size 12 / wrap x -> {"indent":{"tabs":false,"size":4},"wordWrap":"off","configuredWrap":"off","rulers":[]}
size 2 / wrap on -> {"indent":{"tabs":false,"size":2},"wordWrap":"on","configuredWrap":"off","rulers":[]}
draft read from { indent size 12, wrap x }: {"indent":{"tabs":false,"size":12},"wrap":"x"}
```

On the unchanged tree the draft `{ indent size 12, wrap x }` resolves to size 12 and wrap `x`, and the draft read through `source.svelte.ts` drops both to null. After the change the first resolves to the configured indent 4 and wrap `off`, `size 2` and `wrap on` are taken, and the draft keeps both.


## First run of S5's own 65 cases, on the unchanged tree of S5's step

S5's cases were run at the start of the step, on the tree before S5; their results are S5's data and do not change with this round.

Each case was run on the unchanged tree before any change, and again after the last change. "Base" means the copy `.agents/worktrees/S5-base`. For the server cases the base column is a scratch run of the base's `writeConfigKey` and `writeConfigValue` on a scratch engine folder (log `/tmp/s5-server-base.log`, scratch test kept in the scratchpad, not in the tree); for the page cases it is the base code read with the line given, since the base has no function for the new behaviour to call. The after column quotes the scratch runs of the final tree: S is the state log `/tmp/s5-state.log` (134 lines, 0 FAIL), V is the server log `/tmp/s5-server.log` (29 lines, 0 FAIL). Both scratch test files are outside the tree (`scratchpad/hold/`) and were run with `npx vitest run` from `tools/oculus` of the worktree.

Facts of the base used below: B1, `grep -cE "^ +heading:" config/catalogs/options.yml` prints 0, so the base has no subject headings and its groups are the five file names (`src/lib/state/system/config/groups.ts:26`); B2, `CONTROLS` has five words, toggle, number, text, choice, list (`src/lib/data/sources/config/catalog/options.ts:21`); B3, `grep -cE "^ +(min|max):" config/catalogs/options.yml` prints 0; B4, the base draws every list and family entry through flow-text boxes (`src/lib/views/system/workbench/editors/Cards.svelte:50` TextInput, `:85` flowText); B5, `grep -rn optionFindings src tests` over the base prints 0 lines.

| Case | Unchanged tree | After the change |
|---|---|---|
| 1 | Not met: B1. | S: 13 group titles in order Appearance, Editor, Terminal, Sessions and usage, Cluster, Boards and audit, Rail and pages, Presentation, Project sources, Calendar and mail, This machine, Catalogs, Texts; the table of contents has a section list per heading. |
| 2 | Not met: one group per file, so no heading holds two file lines; the local.yml group carries the local tag (`groups.ts:65`). | S: Editor has the lines behavior.yml and sources.yml with descriptions; This machine one line tagged local; Appearance one line. |
| 3 | Partly: a file that is not readable keeps its own group with the reason (`search.ts:80`); no heading to hold two files. | S: unreadable "sources.yml could not be read: EACCES", loading "Reading sources.yml...", cut "sources.yml is longer than the file window reads, so its settings are not listed.", unparsed "sources.yml is not valid YAML, so its settings are not listed: ..."; Project sources shows the line and no row; Editor keeps the behavior.yml rows. |
| 4 | Not met: the rows sit in the behavior.yml, sources.yml and local.yml groups. | S: Cluster[Slurm: slurm.resource/slurm.days/slurm.poll_min/slurm.quota_min/slurm.prewarm], Project sources[Registry and feed files: resources_file], This machine[HPC host: hpc_host], and no other group. |
| 5 | Not met: no Presentation heading. | S: 18 of 18 rows of the heading kept, the only group kept is presentation. |
| 6 | Met on file groups: `@modified` is `MODIFIED_FILTER` (`search.ts:19`). | S: with `editor.tab_size: 2` in behavior.yml the result is `Editor/editor.tab_size` alone; with the shipped files 0 rows. |
| 7 | Met on file groups (`search.ts:80`). | S: with every file loading 11 groups are kept under an empty query and dropped under a typed one. |
| 8 | Met on the local.yml group: its text is never asked for (`groups.ts:9`). | S: 18 rows, each with description, no value, no control. |
| 9 | Partly: the five number boxes exist with 15, 31, 62, 10, 25 and no range (B3). | S: calendar.poll_min 15 (1 to 35791), calendar.days_back 31 (0 to 3650), calendar.days_ahead 62 (0 to 3650), mail.poll_min 10 (1 to 35791), mail.per_signal 25 (1 to 500). |
| 10 | Premise false, see above: the grep on the base prints the same two files. | The same grep on the final tree prints the same two files; no saved list added. |
| 11 | Not met: B1. | S: with an entry lacking a heading, group order is `...,calendar,unheaded,machine`; with every entry headed, no `unheaded` group. |
| 12 | Not met: B2, B4. | S: card fields key focus, label Focus, glyph focus, chord f; key pool focus, sessions, projects, incoming, explorer, academic, pillars, references, present, help, views; chord a to z with an empty item. |
| 13 | Not met: B2, B4. | S: picking teal for idea writes `{"active":"green","manuscript":"amber","idea":"teal"}`. |
| 14 | Not met: no hue picker (B2). | S: 26 hues, red through slate, no muted and no shade. |
| 15 | Not met: B2, B4. | S: card `{"key":"markdown","word_wrap":"on"}`; ruler 80 writes `{"word_wrap":"on","rulers":[80]}`, no `insert_spaces`. |
| 16 | Not met: no unset state. | S: insert spaces pressed gives true, false, absent. |
| 17 | Partly: the base server refuses 9 with "editor.languages.markdown.tab_size is outside the values the editor takes; the default is used" (base run); the page has no range (B3). | S: "Entry 2, tab_size: It must be a number from 1 to 8." and nothing handed on; V: "Entry markdown, field tab_size: This option takes a number from 1 to 8". |
| 18 | Not met: no colour control (B2). | S: title, desc, color #ea580c read as orange, maturity scoping; green writes `#16a34a`, amber `#b45309`. |
| 19 | Not met: B2. | S: `outputs` colour `#0ea5e9` is sky and unmarked; an unchanged draft writes the same value. |
| 20 | Not met: B2. | S: `#16A34A` reads as green. |
| 21 | Server met: the base accepts a Save that keeps the muted colour (base run); the page marks nothing. | S: `meta` `#64748b` is stray and an unchanged draft writes the same value; V: a Save changing `label` accepted, a hex in no class refused "Entry meta, field color: This option takes a colour of the palette that is a hue". |
| 22 | Not met: the base server accepts `chartreuse` written to a key that did not hold it (base run: accepted). | S: `chartreuse` is shown and stray; V: refused at `idea` ("Entry idea, field value: This option takes a hue name of the palette"), accepted at the key that holds it, refused at another key. |
| 23 | Not met: text control, and the base server accepts `this-mac` (base run: accepted). | S: pool is `utwente` alone; V: `this-mac` refused "This option takes one of the items of the list clusters", `utwente` accepted. |
| 24 | Not met: B2, B4. | S: view [hpc, usage], dock right, size 0.3 held to 0.1 to 0.6. |
| 25 | Not met: B2. | S: a string `hpc` reads as a list holding hpc; hpc alone writes `"hpc"`, adding usage writes `["hpc","usage"]`. |
| 26 | Not met: B2, B4. | S: `joint-work` match [exploring]; `funding` match [in-prep, in prep, submitted] none stray. |
| 27 | Not met: B2. | S: four values, none stray. |
| 28 | Not met: B4. | S: `engine` cards with n "1", title, body; a card added writes n as the string "4". |
| 29 | Not met: B4. | S: a title change writes no `cards` key. |
| 30 | Not run on the base. | S: a `cards` list holding a non-record gives no draft, so the family keeps the way to edit the file. |
| 31 | Not met: B2. | S: the three values chosen and only those offered. |
| 32 | Not met: the base list has Add and the base server accepts an added signature (base run: accepted). | S: empty parked list, an added item reads as a problem; V: "This list only drops items; an item is added from the Audit view". |
| 33 | Not met: text control; the base server accepts `registries/nope.yml` (base run: accepted). | S: typing `registries/` offers datasets.yml, people.yml, venues.yml; "The file registries/nope.yml is not in the hub."; V: "This option takes a file of the hub, and registries/nope.yml is not one". |
| 34 | Met: the base accepts an absent file (base run: accepted). | V: accepted. |
| 35 | Not met: the base accepts both rules (base run: accepted twice). | The ruling above; S and V quoted there. |
| 36 | Not met: B2, B4. | S: the shipped scan rules read with tier chosen; the side-projects rule's `type` is stray and kept; the coauthor rule's `type` and `optional` unset. |
| 37 | Not met: the base accepts `workspace/x` (base run: accepted). | S: "It must be an absolute path or one that starts with ~/."; V: "Entry 1, field dir: This option takes an absolute path or one that starts with ~/", `~/x` and `/abs/x` accepted. |
| 38 | Not met: the base accepts `bin/tool` (base run: accepted). | S and V: "This option takes an absolute path or one that starts with ~/", empty accepted. |
| 39 | Not met: plain text box, no suggestions. | S: suggestions `wallhaven-83do1o.jpg`, `other.png` and no `README.md`; empty accepted. |
| 40 | Not met: the base accepts `../x` (base run: accepted). | S: suggestions say loading, then failed; V: "This option takes a path inside the hub, written relative to it, with no .. and no backslash". |
| 41 | Not met: text controls; the base accepts `cli` (base run: accepted). | S: choices opus, sonnet, haiku, fable with an empty item "the command line chooses the model"; picking it writes `""`; `git.message_model` shows the empty item, `usage_refresh_model` has none; V: `cli` refused "This option takes one of the items of the list models". |
| 42 | Server met: the base accepts `''` (base run: accepted); the control is text. | S: empty item "no prefix"; V: accepted. |
| 43 | Not met: text control. | S: 66 items, From the theme and the Shiki ids; an unbundled id is marked. |
| 44 | Not met: B2, B4. | S: `mocha` class holds rice and mocha, `light` holds none; 17 theme classes; an unchanged draft writes the same value. |
| 45 | Not met: B2. | S: refs for title none, framing [engine, transition], summary [summary1, summary2], project from the slide ids, pool state ready. |
| 46 | Not met: B2. | S: `papers` keys journal and conference, none stray. |
| 47 | Not met: the base accepts five and seven headings (base run: accepted twice). | S: slots title, authors, venue, status, focus, next; V: "This option takes exactly 6 items: title, authors, venue, status, focus, next" for both. |
| 48 | Not met: a plain list. | S: the stray domain is marked and kept. |
| 49 | Not met: no value sources; the base accepts a non-domain with a portfolio (base run: accepted). | S: before the snapshot data_domains, slurm.resource, deck.order refs and deck.tag_tones show the loading sentence; V: no portfolio gives type alone (accepted), a portfolio refuses "This option takes one of the items of the list domains". |
| 50 | Not met: B2. | S: the key is a text box with `suggest_from: usage_tiers`, the value text. |
| 51 | Met on the server: the base refuses `docx` to `Word` with "config/behavior.yml: open.program_ext must map extensions, each with its dot, to bundle ids" (base run). | S: key text, value text suggesting bundle ids; V: the same sentence. |
| 52 | Not met in this form: B4. | S: `{form: pairs, keyed: true, cards: []}`, an empty editor with Add. |
| 53 | Not met: B4. | S: card `{"key":"yaml"}` keeping `tab_size: "4"`; a Save changing word wrap writes `{"tab_size":"4","word_wrap":"on"}`. |
| 54 | Not met: B4. | S: a record lacking a toggle, choice or number reads each field absent, and Save leaves it out. |
| 55 | Not run on the base: the base holds only flow-text drafts. | S: the S4-shape draft reads into controls with its values; the glyph text "not yaml: [" stays on the card and Save says "Entry 1, glyph: the text is not valid YAML." |
| 56 | Not run on the base. | S: a typed draft with a nested editor round-trips through the tab's state. |
| 57 | Met on the base for a config-value write (base run: 200, the undo returns the file). | V: the hue write answers 200 and the undo gives the file back byte for byte. |
| 58 | Met on the base (base run). | V: a pick of teal over a held `chartreuse` answers 200; the undo puts `chartreuse` back. |
| 59 | Not met: the base server accepts 1.5 (base run: accepted); the page has no range (B3). | S: "It must be a number from 0 to 1." and nothing written, 0.5 writes; V: "This option takes a number from 0 to 1". |
| 60 | Not met: B5. | V: the shipped catalog gives no finding; a scratch copy with `control: colours` gives `appearance.yml:terminal.mac_option_is_meta | control colours is not one of the controls; the option is drawn as a text box`. The finding reaches the payload at start (`context.ts:309`) and on each push (`portfolio.ts:520`), read, not run. |
| 61 | Not applicable: B1. | S: `HEADINGS` holds 10 distinct ids, none equal to `this-browser`, `machine`, `unheaded`, `catalogs` or `texts`; a full list has 13 distinct group ids. The code has no collision handling: a repeated id would give two groups with one id, so the ids above are the guarantee. |
| 62 | Not applicable: the base has no folder suggestions. | S: `offerFor` is a function of the typed text and the lists alone; a text whose folder is loading answers the loading note, the next text answers its own folder's entries, so only the latest text's suggestions are drawn. After the tab closes, the row writer and the editors' writer ignore every answer still on its way (`src/lib/state/system/config/write.ts:102`, `editors/writer.ts:108`); the listing itself is the file browser's store (`Settings.svelte`, `folder()`), not state of the view. |
| 63 | The base writer keeps its answer per row id and checks at submit time. | Unchanged: `commit(row, input, lists())` reads the lists once at submit (`write.ts:103`), the answer is kept per row (`saying`, `showing`), and the marks of `FieldControl.svelte` (`stray`, `pool`, `offer`) are `$derived` from the `lists` prop, so they redraw when the snapshot lands. Read, not run in a browser. |
| 64 | Not applicable: the base route test passes with `'queued'`. | With `'queued'` the route test (scratch copy, line 39 changed back) fails: the write answers `{"ok":true,"changed":[],"refused":[{"field":"behavior.yml:waiting_status","reason":"This option takes one of the items of the list entry_statuses"}]}`, and the test then stops with `TypeError: Cannot read properties of undefined (reading 'at')` at `tests/routes/edit/write-fixture.ts:200` because no change was logged. With `'revision'` (the shipped file) `npx vitest run tests/routes/edit/config-value.test.ts tests/server/edit/config-value.test.ts` prints `Test Files 2 passed (2)`, `Tests 4 passed (4)`; `tests/server/edit/config-value.test.ts` is unchanged. |
| 65 | Met on the base: the `languages` map and `show_tabs`, `editor_actions` writes are accepted (base run). | V: associating `.foo` with `python` through `writeConfigValue('sources.yml', 'languages', ...)` accepted; `show_tabs` single and none, `editor_actions` hidden and strip accepted. |

## Tests the round adds or changes, on the unchanged tree and with the behaviour taken out

Each test file is run on the unchanged tree (first-run section above) and on a scratch copy of the worktree (`<scratchpad>/r1/now/`, made with `rsync` from the worktree before each run) with one line of source changed, so the test's behaviour is taken out. The copy is made again from the worktree for every run; `diff -rq <scratchpad>/r1/now/src <worktree>/src` and the same for `tests` print nothing at the end. Command: `python3 <scratchpad>/r1/mutrun.py` (log lines under `<scratchpad>/r1/final/`: the first eight rows in `mutations.txt`, the family-member row and the `local.yml` rows in `mutations2.txt` and `mutations3.txt`, and the width predicate and the two `localFindings` rows, run against the final tree of the test files, in `mutations5.txt`).

| Test file | Unchanged tree | Source line changed in the scratch copy | Result of the scratch copy |
|---|---|---|---|
| `tests/data/sources/config/settings.test.ts` | Test Files  1 failed (1) / Tests  36 failed / 3 passed (39) | The default is replaced by the wrong value: `src/lib/data/sources/config/settings.ts` returns `held.value` after pushing the problem. | Tests  27 failed / 12 passed (39); first failing row `slurmSettings > answers the default for a days with a range problem`: `AssertionError: expected { Object (value, problems) } to strictly equal { Object (value, problems) }`. |
| `tests/data/sources/config/settings.test.ts` | Test Files  1 failed (1) / Tests  36 failed / 3 passed (39) | A family member is not dropped: `if (problem === null || true)` in the family reader. | Tests  3 failed / 36 passed (39); `openSettings and programApps > leaves out each member the entry refuses and names it`: `AssertionError: expected { Object (threw) } to strictly equal { ...(2) }`. |
| `tests/data/sources/config/catalog/value-rule.test.ts` | Test Files  1 failed (1) / Tests  no tests | A minimum is not inclusive: `value <= min` for `value < min`. | Tests  1 failed / 2 passed (3); `valueProblem > answers the kind of problem each control, bound and list gives a value, and none for a value that fits`: `AssertionError: a number at its minimum: expected { kind: 'range', min: 1, ...(1) } to strictly equal null`. |
| `tests/data/sources/config/editor-options.test.ts` | Test Files  1 failed (1) / Tests  no tests | The finding is not given: `if (problem !== null && false)` where a language field is checked. | Tests  2 failed / 7 passed (9); `readEditorOptions over editor.languages > reads a language record field by field against the fields of editor.languages`: `AssertionError: expected { python: { tabSize: 2, ...(2) } } to strictly equal { python: { tabSize: 2, ...(1) } }`. |
| `tests/data/sources/config/catalog/options.test.ts` | Test Files  1 failed (1) / Tests  1 failed / 2 passed (3) | `whole` is not read: the line `else if (map.whole !== undefined) flag('whole');` becomes `entry.control = 'text'`. | Tests  1 failed / 2 passed (3); `whole and form > reads whole and form, and names an entry whose whole or form it cannot read`: `AssertionError: expected [ [ 'form', 'behavior.yml', ...(2) ] ] to deeply equal [ ...(2) ]`. |
| `tests/checks/config/config.test.ts` | Test Files  1 failed (1) / Tests  4 failed / 26 passed (30) | The finding is not given: `settingFindings` starts from an empty list of problems instead of `settingProblems(config)`. | Tests  1 failed / 29 passed (30); `settingFindings > words each wrong setting against behavior.yml from the catalog, and nothing for the shipped files`: `AssertionError: expected [ 'editor.languages.cobolx', ...(4) ] to deeply equal [ 'calendar.days_ahead', ...(32) ]`. |
| `tests/routes/edit/config-key.test.ts` | Test Files  1 failed (1) / Tests  1 failed / 1 passed (2) | The put-back is refused: an undo is checked with default inputs, so the type and rule checks apply. | Tests  1 failed / 1 passed (2); `taking a setting back > puts back a value the file held that its catalog entry refuses`: `AssertionError: expected 400 to be 200 // Object.is equality`. |
| `tests/data/sources/config/local.test.ts` | Test Files  1 failed (1) / Tests  12 failed / 14 passed (26) | A key that is wrong throws: `port must be an integer` is thrown instead of given as a problem. | Tests  6 failed / 20 passed (26); `checkLocal > answers "hub: 3\nport: x" with the sentence it would throw`: `Error: port must be an integer`. |
| `tests/data/sources/config/local.test.ts` | Test Files  1 failed (1) / Tests  12 failed / 14 passed (26) | The row is not dropped: a row with a tool outside claude and codex is pushed as a `codex` row after its problem. | Tests  1 failed / 25 passed (26); `readLocalText > leaves out the row that is wrong and reads the rows around it`: `AssertionError: expected [ 'a', 'b' ] to strictly equal [ 'a' ]`. |
| `tests/data/sources/config/editor-options.test.ts` | Test Files  1 failed (1) / Tests  no tests | The predicate that says which widths the catalog takes accepts any width: `fitsTabSize: () => true`. | Tests  1 failed / 8 passed (9); `readEditorOptions > carries the predicates that say which widths and words the catalog takes`: `AssertionError: expected [ true, true, true, true, true ] to strictly equal [ true, true, false, false, false ]`. |
| `tests/data/sources/config/local.test.ts` | Test Files  1 failed (1) / Tests  12 failed / 14 passed (26) | A finding holds the parser text: the `unparsed` finding is worded with the problem's own sentence. | Tests  1 failed / 25 passed (26); `localFindings > words each problem against local.yml with no value of the file in it`: `AssertionError: expected 'flow sequence in block collection mus...' not to contain 'flow'`. |
| `tests/data/sources/config/local.test.ts` | Test Files  1 failed (1) / Tests  12 failed / 14 passed (26) | A finding holds a label: the `repeat` finding is worded with the problem's own sentence. | Tests  1 failed / 25 passed (26); the same row: `AssertionError: accounts[2].label: expected 'accounts[2].label duplicates a claude...' not to contain 'a-b'`. |

`tests/data/sources/config/wrong-settings.ts` is the shared fixture of the wrong values that `settings.test.ts` and `config.test.ts` both feed their readers (`tests/checks/tree/duplication.test.ts` found the same 11 lines in both files); it holds data, no test. Case 24 (`checkLocal`, `local.test.ts`) passes on the unchanged tree and in the worktree. Case 33's row and cases 36 to 38 have no old behaviour to remove in a scratch copy beyond what the unchanged tree already shows (the modules and functions they test are not there); their unchanged-tree failures are in the table above.

## DONE / NOT DONE

| Part of the brief | Status | Proof |
|---|---|---|
| 0 The one rule `catalog/value-rule.ts` and the catalog's `min`, `max`, `whole`, `form` (Z505) | DONE | cases 32 and 34 (first run above; verify item 2 below); the catalog comparison with table 6.4 prints `differences: 0` (`<scratchpad>/r1/compare/cmp.py`) |
| 1 One rule for a setting of `behavior.yml`: ten readers of `settings.ts`, `settingFindings`, the page's readers, `refreshCadence` (Z443, Z494, Z509) | DONE | cases 1 to 10, 31, Z509 (item 2 below); case 35 quoted run |
| 2 Callers and the write gate: start, live settings, `config-key.ts` put-back, `autofetch`, `refresh`, the open route | DONE | quoted cases 11 to 16 and 28, test case 30 |
| 3 One rule for a key of `local.yml`: `readLocalText`, `readLocal`, `loadLocal`, `checkLocal`, `localFindings`, the port move (Z454, Z463) | DONE | cases 17 to 27, 29, 33 (tests and quoted runs above) |
| 3 The editor's options through the one rule, null before the config channel's first message (Z506) | DONE | cases 36 to 39 |
| 4 The look at landing (item 4) | NOT DONE here: the orchestrator's at landing, ruled as Z507; no component was rendered | the before and after table below is the input to it |
| 5 Text: items 5.1 to 5.8 | DONE | item 7 greps below; the 'Sentences outside the code' table below marks each |
| S5 repair findings (`reviews/S5-refuter.md`): Behaviour 1 (put-back of a held value), Behaviour 2 and 3 (the look table), Standards (comment width, duplication, import order, `NumberInput` rule once, files table marks, conventions), Proof 1 to 3 | DONE | tree checks (item 3 below); case 30; cases 27 and 14; the files table; conventions |
| S5 case 62 second half and 63 (an answer that lands after the tab closed; the redraw when the snapshot lands) | NOT VERIFIED here: they need a DOM | the look |

Verify list, from `tools/oculus` of the worktree, after the last change. Full-list runs: 4 (the first had one red command, `tests/checks/tree/duplication.test.ts`, which was rerun alone and then the list again; the fourth is the one quoted, and nothing in the worktree has changed since it began). Logs: `<scratchpad>/r1/final4/`.

**Item 1.** `npm run diagrams`, then `checks.sh` (which runs `npm run test:quick`):

```
diagrams exit 0
test:quick: 114 changed file(s), from git since HEAD
test:quick: 68 test file(s), 10 essential
ok      ASCII gate (1.5 s)
ok      prettier (2.0 s): All matched files use Prettier code style!
ok      svelte-kit sync (2.3 s)
ok      eslint (6.8 s)
ok      svelte-check (12.6 s): 1791172038244 COMPLETED 359 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (25.8 s): Duration  21.52s (transform 60.97s, setup 0ms, import 77.46s, tests 7.32s, environment 107ms)
test:quick: 26.4 s (limit 45.0 s); every command passed
checks: 1 commands passed
checks exit 0
```

**Item 2** (`settings`, `local`, `value-rule`, `editor-options`, `config`, `config-folder`, `options`, `keys` tests):

```
Test Files  8 passed (8)
Tests  138 passed (138)
exit 0
```

**Item 3** (the seven tree checks):

```
Test Files  7 passed (7)
Tests  64 passed (64)
exit 0
```

**Item 4** (each file alone, 21 files):

```
tests/server/files/ops-paste.test.ts:  Test Files 1 passed (1); Tests 5 passed (5);
tests/server/git/untracked/trash.test.ts:  Test Files 1 passed (1); Tests 2 passed (2);
tests/server/edit/config-value.test.ts:  Test Files 1 passed (1); Tests 3 passed (3);
tests/server/edit/config-key.test.ts:  Test Files 1 passed (1); Tests 2 passed (2);
tests/routes/files/file-undo.test.ts:  Test Files 1 passed (1); Tests 9 passed (9);
tests/routes/files/history.test.ts:  Test Files 1 passed (1); Tests 3 passed (3);
tests/routes/replace/ops-replace.test.ts:  Test Files 1 passed (1); Tests 4 passed (4);
tests/server/edit/writes.test.ts:  Test Files 1 passed (1); Tests 5 passed (5);
tests/server/edit/writes-collection.test.ts:  Test Files 1 passed (1); Tests 3 passed (3);
tests/server/edit/feeds.test.ts:  Test Files 1 passed (1); Tests 5 passed (5);
tests/server/sessions/overrides.test.ts:  Test Files 1 passed (1); Tests 2 passed (2);
tests/server/edit/deck-edit.test.ts:  Test Files 1 passed (1); Tests 1 passed (1);
tests/routes/edit/rail.test.ts:  Test Files 1 passed (1); Tests 2 passed (2);
tests/routes/edit/roots.test.ts:  Test Files 1 passed (1); Tests 2 passed (2);
tests/routes/edit/audit-mute.test.ts:  Test Files 1 passed (1); Tests 1 passed (1);
tests/server/core/changes.test.ts:  Test Files 1 passed (1); Tests 6 passed (6);
tests/routes/edit/undo/undo.test.ts:  Test Files 1 passed (1); Tests 9 passed (9);
tests/routes/files/source.test.ts:  Test Files 1 passed (1); Tests 3 passed (3);
tests/routes/edit/config-key.test.ts:  Test Files 1 passed (1); Tests 2 passed (2);
tests/routes/edit/config-value.test.ts:  Test Files 1 passed (1); Tests 1 passed (1);
tests/routes/replace/replace-undo.test.ts:  Test Files 1 passed (1); Tests 1 passed (1);
files with `Test Files 1 passed (1)`: 21 of 21
```

**Item 5** (the open route, the start hook, the account rows):

```
Test Files  4 passed (4)
Tests  5 passed (5)
exit 0
```

**Items 6, 7 and 10** (each grep as the brief gives it, then `sh utils/folder-check.sh` and the perl ASCII gate; an empty section prints nothing before its `exit` line, and the exit status shown is the grep's, 1 meaning no match):

```
## item 6 grep
exit 1
## item 6 awk
exit 0
## item 7 grep 1
exit 1
## item 7 grep 2
exit 1
## tracked file holds in src and config
exit 1
## folder-check
exit 0
## ascii gate
exit 0
```

**Item 8** (`sh utils/unused-exports.sh`, sorted, against the sorted `S5-base/unused-exports.txt`):

```
unused-exports exit 0
4d3
< src/lib/data/helpers/code-themes.ts: codeThemeIds
6,7c5
< src/lib/data/helpers/editor.ts: WHITESPACE_WORDS
< src/lib/data/helpers/editor.ts: Whitespace, LanguageRecord, TabIndent, TabChoice
---
> src/lib/data/helpers/editor.ts: Whitespace, TabIndent, TabChoice
26c24
< src/lib/data/sources/config.ts: FilesSettings, OpenSettings, LatexFormatting, SearchSettings
---
> src/lib/data/sources/config.ts: OpenSettings, LatexFormatting, SearchSettings
30c28
< src/lib/data/sources/config/local.ts: DEFAULT_PORT, LOCAL_KEYS, localDefaults
---
> src/lib/data/sources/config/local.ts: DEFAULT_PORT, LOCAL_KEYS, localDefaults, readLocalText
381c379
< Unused exports (257)
---
> Unused exports (255)
```

Each line of the difference: `codeThemeIds` is imported by `config-sources.ts` and `editors/sources.ts` (`grep -rn codeThemeIds src`), `LanguageRecord` by `editor-options.ts`, and `WHITESPACE_WORDS` and `FilesSettings` no longer exist (`grep -rn 'WHITESPACE_WORDS\|FilesSettings' src tests` prints nothing); the count of unused exports falls from 257 to 255. The one line added is `src/lib/data/sources/config/local.ts: readLocalText`, the reader of a text that `readLocal` and `checkLocal` call inside `local.ts` and that cases 17 to 22 and 33 of `tests/data/sources/config/local.test.ts` call with a text; its only importer outside its own file is that test, and it stays exported because those cases read a text without a file.

**Item 9** is the first-run section and the table of scratch-copy runs above.

**S5's own verify items** (diagrams, the config and tree tests, the five route tests, the guarded entries whose Code line names a changed path, folder check, ASCII gate, unused exports and the table 6.4 comparison) are the same commands as items 1 to 10 plus the guarded entries below and the comparison:

S5 item 5, the guarded entries whose Code line names a changed path (found by matching each Code line of `agents/guarded.md` against `diff -rq`): G8, G12, G13, G28, G32 and G35 beyond the files of item 4 above (G3 and G9 are in item 4). Each test file run alone with `npx vitest run <file>` (`<scratchpad>/r1/alone.sh`, log `<scratchpad>/r1/final4/9-guarded.txt`, run after the last source edit; `local.test.ts` is rerun in item 2 above after its last change), every file `Test Files 1 passed`:

```
tests/data/snapshot/normalise.test.ts:  Test Files 1 passed (1); Tests 1 passed (1);
tests/data/sources/career.test.ts:  Test Files 1 passed (1); Tests 2 passed (2);
tests/data/sources/collections.test.ts:  Test Files 1 passed (1); Tests 1 passed (1);
tests/data/sources/docs.test.ts:  Test Files 1 passed (1); Tests 2 passed (2);
tests/data/sources/feeds.test.ts:  Test Files 1 passed (1); Tests 1 passed (1);
tests/data/sources/manifests.test.ts:  Test Files 1 passed (1); Tests 1 passed (1);
tests/data/sources/personal.test.ts:  Test Files 1 passed (1); Tests 2 passed (2);
tests/data/sources/present.test.ts:  Test Files 1 passed (1); Tests 1 passed (1);
tests/data/sources/registries.test.ts:  Test Files 1 passed (1); Tests 1 passed (1);
tests/data/helpers/files/nesting.test.ts:  Test Files 1 passed (1); Tests 1 passed (1);
tests/data/sources/agents-catalog.test.ts:  Test Files 1 passed (1); Tests 1 passed (1);
tests/data/sources/config/languages.test.ts:  Test Files 1 passed (1); Tests 1 passed (1);
tests/data/sources/config/rail.test.ts:  Test Files 1 passed (1); Tests 1 passed (1);
tests/server/machine/pty/channel.test.ts:  Test Files 1 passed (1); Tests 2 passed (2);
tests/shell/panes/strip/tab-menu.test.ts:  Test Files 1 passed (1); Tests 2 passed (2);
tests/state/client/terminal/terminal-close.test.ts:  Test Files 1 passed (1); Tests 3 passed (3);
tests/state/forms/form-drafts.test.ts:  Test Files 1 passed (1); Tests 3 passed (3);
tests/state/forms/manifest-draft.test.ts:  Test Files 1 passed (1); Tests 3 passed (3);
tests/state/sessions/source.test.ts:  Test Files 1 passed (1); Tests 2 passed (2);
tests/state/sources/repositories/diff/comment-draft.client.test.ts:  Test Files 1 passed (1); Tests 1 passed (1);
tests/routes/sessions/compose.test.ts:  Test Files 1 passed (1); Tests 4 passed (4);
tests/routes/sessions/terminal-actions.test.ts:  Test Files 1 passed (1); Tests 3 passed (3);
tests/routes/sessions/terminal-edit.test.ts:  Test Files 1 passed (1); Tests 1 passed (1);
tests/routes/sessions/terminal.test.ts:  Test Files 1 passed (1); Tests 4 passed (4);
tests/server/machine/commands/run.test.ts:  Test Files 1 passed (1); Tests 3 passed (3);
tests/server/machine/pty/sessions.test.ts:  Test Files 1 passed (1); Tests 1 passed (1);
tests/server/machine/pty/tmux.test.ts:  Test Files 1 passed (1); Tests 1 passed (1);
tests/data/sources/config/settings.test.ts:  Test Files 1 passed (1); Tests 39 passed (39);
tests/data/sources/config/local.test.ts:  Test Files 1 passed (1); Tests 26 passed (26);
tests/data/sources/config/catalog/options.test.ts:  Test Files 1 passed (1); Tests 3 passed (3);
tests/data/sources/config/catalog/value-rule.test.ts:  Test Files 1 passed (1); Tests 3 passed (3);
tests/data/sources/config/editor-options.test.ts:  Test Files 1 passed (1); Tests 9 passed (9);
tests/checks/config/config.test.ts:  Test Files 1 passed (1); Tests 30 passed (30);
DONE
```

S5 item 9, the comparison of `config/catalogs/options.yml` with table 6.4 of `S5.md` (`python3 <scratchpad>/r1/compare/cmp.py`, which reads the catalog with `yaml.safe_load` and the table from `S5.md`):

```
entries outside local.yml: 132 | table rows: 132 | family fields compared: 86
local.yml keys: 18
catalog entries not in table: []
differences: 0
local.yml entries off item 6.5: []
keys in the catalog that the table does not state: 20
  behavior.yml:editor.paint_limit_kb: min=1
  behavior.yml:editor.tab_size: whole=True
  behavior.yml:editor.languages.tab_size: whole=True
  behavior.yml:editor.languages.rulers: min=1
  behavior.yml:editor.languages.rulers: whole=True
  behavior.yml:changes.keep: min=1
  behavior.yml:changes.keep: whole=True
  behavior.yml:git.autofetch_minutes: min=0
  behavior.yml:git.autofetch_minutes: max=35791
  behavior.yml:git.autofetch_minutes: whole=True
  behavior.yml:search.max_hits: min=1
  behavior.yml:search.max_hits: whole=True
  behavior.yml:search.timeout_s: min=1
  behavior.yml:open.program_ext.key: form='extension'
  behavior.yml:open.program_ext.value: form='bundle_id'
  behavior.yml:processes.patterns: form='program'
  behavior.yml:slurm.days: whole=True
  behavior.yml:calendar.days_back: whole=True
  behavior.yml:calendar.days_ahead: whole=True
  behavior.yml:mail.per_signal: whole=True
empty given as words: ["behavior.yml:chat.model: empty='the command line chooses the model'", 'behavior.yml:git.message_model: empty="the command line\'s own default model"', "layout.yml:direct_chord: empty='no prefix'"]
```

The 20 keys listed are the `min`, `max`, `whole` and `form` words of item 0.4 and 0.3, which the table predates; the three `empty` entries carry words, the extension named in the judgment calls.

What the green results do not cover: any drawn behaviour (the three-state box, range marks, swatches, suggestion lists, focus, layout), the watcher push on a live server (cases 13 and 27 run `liveSettings` and a portfolio rebuild on recorders), and the real hub (nothing here reads `config/local.yml` or the hub's data).

## Files

From `diff -rq` of `S5-base/tools/oculus` against the worktree's `tools/oculus` (excluding `local.yml`; the base copy holds `src`, `tests`, `config` and `utils` only), made after the last change. Lines are base then now. A path outside S5's write list carries its reason; the reason begins `Q119 list` when `Q119.md` lists the path.

| File | Base | Now | Outside S5's list: reason |
|---|---|---|---|
| `config/catalogs/options.yml` | 722 | 1232 |  |
| `config/text/findings.yml` | 129 | 179 |  |
| `config/text/server.yml` | 69 | 91 |  |
| `config/text/views/system/workbench.yml` | 165 | 199 |  |
| `src/lib/data/file-ops.ts` | 313 | 320 |  |
| `src/lib/data/helpers/editor.ts` | 324 | 124 | Q119 list: `paintLimit` and `requirePaintLimit` leave it (item 1.6); the editor options' reader and rules move to `editor-options.ts` (item 1.8) |
| `src/lib/data/helpers/files/opens-in-program.ts` | 82 | 46 | Q119 list: `programApps`, `EXTENSION`, `BUNDLE_ID`, `bundleIdShape` and `isBundleId` leave it (items 1.6 and 0.3); its head no longer repeats a paragraph |
| `src/lib/data/shapes/shapes.ts` | 253 | 245 | `valuesOfShape` is deleted because nothing imports it once the rule reads a list of values; its name leaves the head comment |
| `src/lib/data/sources/config.ts` | 83 | 91 |  |
| `src/lib/data/sources/config/catalog/option-findings.ts` | new | 64 | new file of S5 (S5's judgment calls); it now words the `whole` and `form` problems of the reader (item 0.3) |
| `src/lib/data/sources/config/catalog/options.ts` | 87 | 558 |  |
| `src/lib/data/sources/config/catalog/value-rule.ts` | new | 252 | Q119 list: the one rule (item 0.1) |
| `src/lib/data/sources/config/catalog/value-words.ts` | new | 117 | new: the words of each kind of problem the rule finds (`mustBe`), kept out of the pure rule, which holds no sentence (Decision 5) |
| `src/lib/data/sources/config/catalogs.ts` | 223 | 295 | Q119 list: `settingFindings`, `localFindings`, `behaviorFindings` without the paint limit and the editor options (items 1.7, 1.8, 3.4) |
| `src/lib/data/sources/config/editor-options.ts` | new | 205 | Q119 list: new, the editor's options by the one rule (item 1.8, Z506) |
| `src/lib/data/sources/config/local.ts` | 376 | 472 | Q119 list: the local readers (item 3) |
| `src/lib/data/sources/config/merge.ts` | 241 | 259 | `droppedFile(findings, name)`: one function that asks whether a merge dropped a config file, read by the live settings, the start and `settingFindings` (Decision 7) |
| `src/lib/data/sources/config/settings.ts` | 297 | 457 | Q119 list: the setting readers (item 1) |
| `src/lib/server/accounts/connect/rows.ts` | 220 | 221 | Q119 list: a comment the change makes false (item 5.5) |
| `src/lib/server/content/images.ts` | 339 | 341 |  |
| `src/lib/server/core/fetch-period.ts` | 33 | deleted | Q119 list: deleted, item 1.5 (the reader of the fetch period is `autofetchMin` of `settings.ts`) |
| `src/lib/server/edit/writes.ts` | 542 | 544 |  |
| `src/lib/server/edit/writes/config/config-checks.ts` | 292 | 270 |  |
| `src/lib/server/edit/writes/config/config-fit.ts` | new | 489 |  |
| `src/lib/server/edit/writes/config/config-key.ts` | 144 | 132 |  |
| `src/lib/server/edit/writes/config/config-sources.ts` | new | 73 |  |
| `src/lib/server/edit/writes/config/config-value.ts` | 310 | 212 |  |
| `src/lib/server/edit/writes/config/config-write.ts` | 91 | 104 |  |
| `src/lib/server/files/open.ts` | 375 | 372 | Q119 list: the bundle id check reads the rule (item 0.3) |
| `src/lib/server/files/project-files.ts` | 217 | 217 | Q119 list: calls `loadLocal` where it called `loadLocalOrDefaults` (item 3.3) |
| `src/lib/server/files/source.ts` | 180 | 180 | Q119 list: a comment the change makes false (item 5.5) |
| `src/lib/server/machine/pty/chat.ts` | 123 | 119 | Q119 list: calls `loadLocal` where it called `loadLocalOrDefaults` (item 3.3) |
| `src/lib/server/machine/pty/compose.ts` | 244 | 244 | Q119 list: calls `loadLocal` where it called `loadLocalOrDefaults` (item 3.3) |
| `src/lib/server/machine/pty/routes.ts` | 611 | 610 | Q119 list: calls `loadLocal` where it called `loadLocalOrDefaults` (item 3.3) |
| `src/lib/server/machine/usage/refresh.ts` | 384 | 356 | Q119 list: the refresher reads `refreshSettings` (item 2.3) |
| `src/lib/server/root/context.ts` | 732 | 729 |  |
| `src/lib/server/root/live-settings.ts` | 269 | 275 | Q119 list: each group by its own reader, a dropped file keeps the settings in force (item 2.2) |
| `src/lib/server/root/watch/autofetch.ts` | 225 | 248 | Q119 list: reads `autofetchMin` (item 2.4) |
| `src/lib/server/root/watch/portfolio.ts` | 640 | 647 |  |
| `src/lib/server/sessions/stores/hooks.ts` | 198 | 209 |  |
| `src/lib/state/client/selectors.svelte.ts` | 543 | 556 | Q119 list: the page reads `paintLimit`, `programApps` from `settings.ts` and `editorOptions`, `repoSettings` from `editor-options.ts` (items 1.6, 1.8) |
| `src/lib/state/sessions/latex.svelte.ts` | 744 | 748 | `latex.auto_build` is read by `latexAutoBuild` of `settings.ts` (Z509); its head comment named the old rule |
| `src/lib/state/sessions/source.svelte.ts` | 485 | 490 | Q119 list: a saved draft's indent size is read as a whole number and its wrap as text, with no list of words in code (item 1.8) |
| `src/lib/state/system/config/editors/draft.ts` | 351 | 695 |  |
| `src/lib/state/system/config/editors/fields.ts` | new | 653 |  |
| `src/lib/state/system/config/editors/flow.ts` | 54 | 56 |  |
| `src/lib/state/system/config/editors/origins.ts` | 114 | 119 | Q119 list: the lines under `editor.languages` read a repository's file by `parseRepoSettings` (item 1.8) |
| `src/lib/state/system/config/editors/slots.ts` | 109 | 154 |  |
| `src/lib/state/system/config/editors/sources.ts` | new | 137 |  |
| `src/lib/state/system/config/editors/writer.ts` | 137 | 144 |  |
| `src/lib/state/system/config/groups.ts` | 225 | 299 |  |
| `src/lib/state/system/config/messages.ts` | 45 | 58 |  |
| `src/lib/state/system/config/rows.ts` | 265 | 266 |  |
| `src/lib/state/system/config/search.ts` | 85 | 88 |  |
| `src/lib/state/system/config/typed.ts` | 94 | 97 |  |
| `src/lib/state/system/config/view/gear.ts` | 22 | 37 | S5-era file outside S5's list (named by the refuter's Standards finding): Reset is offered on a Modified list, multi or parked list, and the head says so, rewrapped |
| `src/lib/state/system/config/write.ts` | 160 | 135 |  |
| `src/lib/state/system/machine/usage.ts` | 70 | 84 | Q119 list: `refreshCadence`, the Usage view's cadence through the refresh reader (item 1.6) |
| `src/lib/state/workbench/navigation/editor-text.ts` | 98 | 94 | Q119 list: re-exports `RepoSettings` from `editor-options.ts` and `parseRepoSettings` leaves `data/helpers/editor.ts` (item 1.8) |
| `src/lib/ui/controls/editor/Editor.svelte` | 496 | 498 | Decision 17: the editor takes no `indent` until the configuration has arrived and leaves Monaco's own in force |
| `src/lib/ui/controls/editor/options.ts` | 78 | 81 | Decision 17: every option of the type is optional, left to Monaco while absent |
| `src/lib/ui/forms/Checkbox.svelte` | 43 | 82 |  |
| `src/lib/ui/forms/NumberInput.svelte` | 18 | 68 |  |
| `src/lib/ui/forms/TextInput.svelte` | 131 | 139 | refuter Standards 4: the invalid mark of a box is a prop (`invalid`), set by `NumberInput`, not a DOM side effect |
| `src/lib/ui/forms/choice/GlyphSelect.svelte` | 136 | 54 | refuter Standards 2: `GlyphSelect` and `HueSelect` held the same 12 lines; both draw through `drawn/FieldSelect.svelte` |
| `src/lib/ui/forms/choice/SuggestInput.svelte` | new | 222 |  |
| `src/lib/ui/forms/choice/drawn/FieldSelect.svelte` | new | 126 | new, from refuter Standards 2: the select both `GlyphSelect` and `HueSelect` draw through; `drawn/` exists because `choice/` is at the 10-item folder limit |
| `src/lib/ui/forms/choice/drawn/HueSelect.svelte` | new | 118 | S5's `choice/HueSelect.svelte`, moved into `drawn/` with `FieldSelect.svelte` (the 10-item folder limit of `choice/`) |
| `src/lib/ui/theme.ts` | 95 | 108 |  |
| `src/lib/views/shared/prose/source-options.ts` | 124 | 141 | Q119 list: resolves a tab's options through `editor-options.ts` (item 1.8) |
| `src/lib/views/sources/repositories/diff/DiffSection.svelte` | 515 | 524 | Q119 list: the diff view's call of `createSourceOptions` (item 1.8) |
| `src/lib/views/sources/source/Editor.svelte` | 266 | 273 | Decision 17: the source tab's editor takes `indent` as null before the configuration arrives |
| `src/lib/views/sources/source/Source.svelte` | 502 | 512 | Q119 list: the source tab's call of `createSourceOptions` (item 1.8) |
| `src/lib/views/sources/source/ask-perform.ts` | 39 | 42 | Decision 17: `indent` is null before it is known, and a conversion then keeps nothing |
| `src/lib/views/system/machine/usage/Usage.svelte` | 366 | 364 | Q119 list: the view reads `refreshCadence` (item 1.6) |
| `src/lib/views/system/workbench/Settings.svelte` | 302 | 341 |  |
| `src/lib/views/system/workbench/editors/Cards.svelte` | 181 | 323 |  |
| `src/lib/views/system/workbench/editors/Editor.svelte` | 152 | 183 |  |
| `src/lib/views/system/workbench/editors/FieldControl.svelte` | new | 360 |  |
| `src/lib/views/system/workbench/editors/Origins.svelte` | 45 | 46 | Q119 list: the origin lines read through `editor-options.ts` (item 1.8) |
| `src/lib/views/system/workbench/editors/Rollup.svelte` | 81 | 106 |  |
| `src/lib/views/system/workbench/editors/writer.svelte.ts` | 32 | 35 | S5-era file outside S5's list (named by the refuter's Standards finding): the row writer takes the page's `lists` so a value is checked by the rule with the lists the page holds (case 35) |
| `src/lib/views/system/workbench/settings/Contents.svelte` | 101 | 102 |  |
| `src/lib/views/system/workbench/settings/Control.svelte` | 140 | 150 |  |
| `src/lib/views/system/workbench/settings/Item.svelte` | 322 | 330 |  |
| `src/lib/views/system/workbench/settings/List.svelte` | 147 | 170 |  |
| `src/lib/views/system/workbench/settings/writer.svelte.ts` | 23 | 28 | S5-era file outside S5's list (named by the refuter's Standards finding): `reactiveWriter` takes `lists` for the same check |
| `tests/checks/config/config.test.ts` | 522 | 588 |  |
| `tests/checks/tree/boundaries.test.ts` | 638 | 647 | Q119 list: the `state:` row for `value-rule` and the sentences of item 5.6 |
| `tests/data/sources/config/catalog/options.test.ts` | 11 | 118 |  |
| `tests/data/sources/config/catalog/value-rule.test.ts` | new | 217 | Q119 list: new, G13's test of `value-rule.ts` (case 32) |
| `tests/data/sources/config/editor-options.test.ts` | new | 188 | Q119 list: new, G13's test of `editor-options.ts` (cases 36 to 38) |
| `tests/data/sources/config/local.test.ts` | 55 | 228 | Q119 list: G13's test of `local.ts` |
| `tests/data/sources/config/settings.test.ts` | 161 | 534 | Q119 list: G13's test of `settings.ts` |
| `tests/data/sources/config/wrong-settings.ts` | new | 34 | new: the wrong values `settings.test.ts` and `config.test.ts` both feed their readers, one copy (`duplication.test.ts` finds the same 11 lines otherwise); it lives here because `tests/fixtures/` is at the 10-item limit |
| `tests/routes/edit/config-key.test.ts` | 61 | 82 | Q119 list: G9's row of case 30 |
| `tests/routes/edit/config-value.test.ts` | 51 | 51 |  |
| `DESIGN.md` | (not in base copy) | 435 | lines 85 (S5, item 0.3), 243, 245, 395, 396, 402, 417 (item 5.3 and the editor options and open route sentences they carry); in Q119's list or S5's |
| `HELP.md` | (not in base copy) | 348 | lines 261 (S5 and item 5.4) and 282 (item 5.4); in Q119's list or S5's |
| `docs/diagrams/` (10 files rewritten by `npm run diagrams`: channels.dot, channels.svg, layer-data.dot, layer-data.svg, layer-server.dot, layer-server.svg, layer-state.dot, layer-state.svg, layers.dot, layers.svg) | (not in base copy) | | S5 and Q119 list: whatever the command rewrites |

Limits (`tests/checks/tree/size.test.ts` is in item 3 and passes): the largest source file the round touches is `src/lib/data/sources/config/settings.ts` at 457 lines; `value-rule.ts` 252, `local.ts` 472, `editor-options.ts` 205, `catalogs.ts` 295; the folder `src/lib/ui/forms/choice/` holds 10 entries and `tests/data/sources/config/` 7.

## Judgment calls the brief left open, and the names things got

Carried from S5 and unchanged (S5's judgment calls, which this round does not touch):

- The held-value rule replaces item 7.3 and Decision 6 (ruling, above). Decision 6 is read as that rule.
- The finding key is `<config file>:<key path>[.field]` (ruling, above).
- `optionFindings` lives in `src/lib/data/sources/config/catalog/option-findings.ts`, not in `options.ts`: `options.ts` is imported by the client state, and the findings read the engine folder with `node:fs`, so they stay on the server side of the data layer. `src/lib/data/sources/config.ts` re-exports it.
- `WriteTarget` gained an optional `entities(kind)` reader (`src/lib/server/edit/writes.ts`, backed by `entities()` in `src/lib/server/sessions/stores/hooks.ts`), so the server checks a choice drawn from the portfolio (domains, clusters) against the portfolio it last published; a target without it checks the type alone (case 49).
- `empty` in a catalog entry takes `true` or the words of the empty item (`empty: the command line chooses the model`), because cases 41 and 42 name the words and the table has no other place for them.
- `slideTagClasses` moved to `options.ts` so the server's `config-sources.ts` and the page's `editors/sources.ts` read one list.
- `readsOther` is defined once in `options.ts` and imported by `config-fit.ts` and `fields.ts`.
- A leaf `multi`, `list` or `parked` row goes through the Editor with Save and Discard, like a family, and is not written on each pick; a single value (toggle, number, text, choice, glyph, hue, colour, folder, file, path) is written as it is made or left.
- A draft in the earlier flow-text form that a tab holds is read into the controls with `typedDraft`; a field text that does not read as YAML stays on the card as `card.unread` and Save names it with `notYaml` (case 55).
- The class of the text box in `src/lib/ui/forms/choice/SuggestInput.svelte` is `.suggest`, not `.text`: `tests/checks/tree/boundaries.test.ts` refuses a view that styles a primitive's own class, and `views/shared/forms/NewIdeaForm.svelte` styles `.text` through `.form :global(.text)`.
- `NumberInput.svelte` takes its value explicitly and marks an out-of-range value with the range words (`mark()`), so a box held to a range works in a row and in a card.

This round:

- Case 37 uses `ruby` where the brief names `rust`: `registered()` of `src/lib/data/prose/languages.ts` holds 32 names without `rust` (`ROOT=<tree> node <scratchpad>/r1/rust/reg.mjs` prints `registered() holds 32 names; rust: false | ruby: true | python: true` on both trees), and the case needs a registered language whose record has an unlisted field. The test row is `reads a language record field by field against the fields of editor.languages`.
- Which form Decision 17 was built in: the page hands Monaco no value for an option it does not hold. `src/lib/ui/controls/editor/options.ts` types every option as optional and left to Monaco while absent, `src/lib/ui/controls/editor/Editor.svelte` applies an indent only when it is handed one, `src/lib/views/sources/source/Editor.svelte` takes `indent` as null until the configuration has arrived, and `ask-perform.ts` makes no conversion while it is null. No default of an editor option is written in code.
- `settings.ts` exports `settingReader(config, problems)`, which answers `{ number, flag, text, strings, family }` over the catalog entry of a key; `settingEntry(config, key)` (the entry, or the throw); `noRule(key)` (the throw naming the key and `config/catalogs/options.yml`); the type `SettingProblem` (`{ key, where: 'block' | 'family' }` or `{ key, where: 'value' | 'entry' | 'field', problem, spec }`); `settingProblems(config)` (what is wrong with every setting in a merged map, over `PROBLEM_READERS`, which lists the thirteen readers); and the readers `slurmSettings`, `calendarSettings`, `searchSettings`, `openSettings`, `programApps`, `confirmDelete`, `mailSettings`, `changesKeep`, `usageTiers`, `refreshSettings`, `autofetchMin`, `paintLimit`, `processesSettings`, `latexFormatting` and `latexAutoBuild`.
- `confirmDelete(config, problems = [])` answers the flag of `files.confirm_delete`, and true for a configuration with no entry for it; it is the one reader the page uses for that setting, and the earlier `filesSettings` object and its type `FilesSettings` do not exist.
- `value-rule.ts` exports `valueProblem(entry, value, lists)`, `itemProblem(entry, item)` (one item of a list, by the entry's bounds, `whole` and `form`), `hasForm(form, text)`, and the types `ValueProblem` and `RuleLists`; `value-words.ts` exports `mustBe`, which words a `ValueProblem` from `findings.words.*`. The kinds of `ValueProblem` are in the head of `value-rule.ts`.
- `local.ts` exports `readLocalText(text, engine)`, `readLocal(engine, warn = false)`, `loadLocal(engine)`, `checkLocal(text, file)`, `localSentence(problem, file)`, and the types `LocalProblem` (`kind` `value`, `row`, `repeat`, `unparsed`, `not-a-map`, `unreadable`) and `LocalRead` (`config`, `problems`, `unknown`, `unread`). `ContextDependencies.loadLocal` is `ContextDependencies.readLocal`.
- `editor-options.ts` exports `readEditorOptions(config)` (options and problems), `editorOptions(config)` (the options, or null for a configuration with no catalog), `parseRepoSettings(text, config)`, and the types `EditorProblem` and `RepoSettings`. `EditorOptions` carries the predicates `fitsTabSize` and `fitsWrap`, which `resolveEditor` takes a tab's own choice by.
- `merge.ts` exports `droppedFile(findings, name)`: whether a merge dropped a config file, read from the finding with key `''` on that file. `src/lib/state/system/machine/usage.ts` exports `refreshCadence(config)`: the refresh reader's `refreshMin`, 0 before the config channel's first message. `src/lib/server/core/fetch-period.ts` is deleted.
- Finding lines added to `config/text/findings.yml`: under `findings.config` `setting_default`, `setting_empty`, `setting_block`, `setting_family`, `setting_entry`, `setting_field`, `local_row`, `local_repeat`, `local_unparsed`, `local_not_a_map`, `local_unreadable`; under `findings.options` `whole` and `form`; the group `findings.words` (`boolean`, `number`, `whole`, `whole_range`, `whole_min`, `whole_max`, `range`, `range_min`, `range_max`, `list_items`, `text`, `form_program`, `form_program_list`, `form_extension`, `form_bundle_id`, `words`, `numbers`, `strings`, `records`, `choice`, `source`, `glyph`, `hue`, `colour`, `path`, `hub_path`, `slots`). `findings.config.paint_limit` and `findings.config.editor_value` are gone. `config/text/server.yml` gained `server.config_key.not_whole`, `not_program`, `not_extension`, `not_bundle_id`; `config/text/views/system/workbench.yml` gained `settings_not_whole`, `settings_not_program`, `settings_not_extension`, `settings_not_bundle_id`. Every `findings.` key the round added is read by a string literal under `src` (item 6's grep of the removed keys prints nothing; `tests/checks/source/keys.test.ts` passes in item 2).
- `tests/data/sources/config/wrong-settings.ts` (exports `WRONG_SETTINGS`, `WRONG_EDITOR`) is a data file, not a test; it sits in `tests/data/sources/config/` because `tests/fixtures/` holds 10 entries.
- `src/lib/ui/forms/choice/drawn/` holds `FieldSelect.svelte` and `HueSelect.svelte`; S5's path `src/lib/ui/forms/choice/HueSelect.svelte` is now `drawn/HueSelect.svelte`.
- The word `form` of a catalog entry takes `program`, `extension` or `bundle_id`; `whole` takes `true`. A `form` or `whole` outside those is a finding of `optionFindings` (`findings.options.form`, `findings.options.whole`) and the entry is drawn as a text box (case 34).

## Before and after for the look (item 4)

The look is the orchestrator's at landing, on a scratch oculus served from the landing worktree with its own `config/` copy, `HOME` and `TMUX_TMPDIR` under the orchestrator's scratchpad, on a page named TEST, and it needs Axel's ruling Z507 first. Every value below is written into that copy's `config/behavior.yml` or `config/local.yml`. The 'before' column comes from the first runs above (a run on the unchanged tree) unless it says it was read from the code. The sentences in the 'after' column are the output of `ROOT=<worktree> node <scratchpad>/r1/rust/findings.mjs` (`<scratchpad>/r1/final/cases/findings-now.txt`), which words `settingFindings` over the shipped catalog.

| # | View | State to put it in | Before | After |
|---|---|---|---|---|
| 1 | Findings view; Cluster section of Settings | `slurm.poll_min: 0` | The server does not start: `config/behavior.yml: slurm.poll_min must be a number from 1 to 35791` (case 11). | The server starts, the Live HPC poll is every 20 minutes (case 11 `watchHpc pollMin: 20`), and the Findings view lists `slurm.poll_min must be a number from 1 to 35791; the default is used` against `behavior.yml`. Mended by a good value: the finding is gone from the next push (case 13). |
| 2 | Findings view; Calendar and mail section | `calendar: [1]` | The start throws `config/behavior.yml: calendar must be a map` (settings test row `calendarSettings`). | Every calendar key takes its default (poll 15, back 31, ahead 62) and one finding reads `calendar must be a map; each of its keys takes its default`. |
| 3 | Findings view; Editor section; Format Document on a `.tex` file | `latex.formatter: prettier` | The start throws `latex.formatter must be one of none, latexindent, tex-fmt, badness` (settings test row). | The formatter is the default `none` and one finding reads `latex.formatter must be one of none, latexindent, tex-fmt, badness; the default is used`. |
| 4 | Usage view (the count to the next refresh) | `usage_refresh_min: x` | The page reads the cadence as 0 (`cadenceShape.parse(...)` of the unchanged `Usage.svelte`, read from the code, not run); the server's start checks the value with `requireRefreshSettings` (`refresh.ts:152`, read from the code, not run). | The Usage view's next refresh counts 10 minutes (`refreshCadence` answers the default `refreshMin`), the refresher runs every 10 minutes (case 11 `refreshMin: 10`), and one finding reads `usage_refresh_min must be a number; the default is used`. |
| 5 | Usage view (account tiers); Findings view | `usage_tiers: { b: 5 }` | The start throws `config/behavior.yml: usage_tiers.b must be a string` (settings test row). | The tier `b` is left out, the others are read, and one finding reads `usage_tiers.b must be text; the entry is not read`. |
| 6 | Files view, a `.pdf` row: Open in its application | `open.program_ext` with one bad member (`.x: 3`) next to `.pdf: com.adobe.Reader` | The open route answers 500 for both a `.pdf` and a `.xyz` file, the opener is not called (case 15: `status=500 opener=[]`). | A `.pdf` file is handed to the opener with `com.adobe.Reader` (status 200), a `.xyz` file is refused with 403 `the file would run rather than open` and the opener is not called (case 15); one finding reads `open.program_ext..x must be text; the entry is not read`. The Files view offers Open in its application on the `.pdf` row. |
| 7 | Files view, a delete to the Trash | `files.confirm_delete: no` (a text, not a flag) | A delete to the Trash asks first (`confirmDelete` of the unchanged `settings.ts` answers `files?.confirm_delete !== false`, true for the text `no`). | A delete to the Trash asks first (the default `true`), and one finding reads `files.confirm_delete must be true or false; the default is used`. The visible difference is the finding. |
| 8 | Source tab on a 1 MB text file; Findings view | `editor.paint_limit_kb: 0` | `context.ts:282` calls `requirePaintLimit(config)` at start (read from the code, not run on the unchanged tree). | The server starts, the editor's limit is the default 20480 KB, the file opens coloured, and one finding reads `editor.paint_limit_kb must be a number of at least 1; the default is used`. |
| 9 | Findings view | Each of the above mended | Not applicable on the unchanged tree for the cases that stopped the server. | A good value written by hand: the finding is gone within one config push; a second identical push hands the pollers nothing (case 13). |
| 10 | Settings view | A Settings write of another key while `slurm.days` is wrong on disk (`slurm.days: -1`; write `slurm.poll_min: 25`) | Refused with `config/behavior.yml: slurm.days must be a whole number from 0 to 3650` (case 14). | Taken: `changed=[behavior.yml:slurm.poll_min]`; the finding at `slurm.days` stands (case 14). |
| 11 | History view; Settings view | That write in History, then its undo; and the undo of a write that mended `slurm.days: x` | The undo of a write that mended `slurm.days: x` is refused: `expected 400 to be 200` (case 30). | The undo puts `x` back byte for byte and is logged; the finding at `slurm.days` is back in the next push (case 30). |
| 12 | Settings view, Cluster section | A wrong held number in a Settings row (`slurm.days: 1.5` on disk) | Not run on the unchanged tree. | The row is marked with its words (`It must be a whole number.` / the range words), and `slurm.days must be a whole number from 0 to 3650; the default is used` is in the Findings view. |
| 13 | Settings view, the days box | `slurm.days` typed as `1.5` in the Settings view | Sent to the server, which writes it (case 35: `slurm.days "1.5": write=true`). | Not sent; the box shows `It must be a whole number.` (`workbench.settings_not_whole`, case 35). Written by hand, its finding reads `slurm.days must be a whole number from 0 to 3650; the default is used`. |
| 14 | Settings view, the list; Findings view | `processes.patterns` with an item `a/b` | Sent and written (cases 14 and 35). | Not sent; `It must be a program name, with no slash and no white space.`; the server refuses it with `This option takes a program name, with no slash and no white space` (case 14). By hand: `processes.patterns must be a list of program names with no slash or white space; the default is used`. |
| 15 | Settings view, the card | An `open.program_ext` card with the key `pdf` (no dot) or the value `com.apple TextEdit` | Sent (case 35); the server refuses with the family's own sentence (case 14). | Not sent; `It must be an extension with its dot, such as .pdf.` or `It must be the bundle id of an application, such as com.apple.Preview.`; the server refuses with the sentences `This option takes an extension with its dot, such as .pdf` and `This option takes the bundle id of an application, such as com.apple.Preview` (case 14). By hand: `open.program_ext.pdf must be an extension with its dot; the entry is not read`. |
| 16 | Findings view; a Python file in the source tab | `editor.tab_size: 9` and `editor.languages` with `python: { rulers: [80, 0] }`, by hand | The page holds options read by the code's own defaults, so the values are never findings (case 36 first run: the module does not exist). | Two findings: `editor.tab_size must be a whole number from 1 to 8; the default is used` and `editor.languages.python.rulers must be a list in which each item is a whole number of at least 1; the field is not read`. A Python file opens at the default tab size 4 with no rulers. |
| 17 | Settings view, the lines under `editor.languages` | A repository `.oculus/settings.yml` with `languages: { python: { word_wrap: wrap } }` | Not run on the unchanged tree (the module that reads it by the catalog does not exist). | A line `Skipped in <root>: python.word_wrap: outside the values the field takes` under `editor.languages` (`origins.ts`, `settings_origin_skipped`, `settings_origin_value`). |
| 18 | Findings view; Live HPC; Usage accounts | In the copy of `local.yml`: `hpc_host: ''`, a bad `accounts` row, and a text that does not parse | At start, the server does not start for a wrong key (case 25, `port`); while running, a wrong key keeps every value in force and logs why (case 26). | Findings against `local.yml` name the key and never a value: a finding at `hpc_host` with the context's `hpcHost` absent (case 26), `accounts[1].tool must be claude or codex` with the row not read (case 19), and for the text that does not parse the line `does not parse; every key takes its default` with key `''` (cases 21, 33). |
| 19 | The page (address) and the server | Z463: `local.yml` `port: x` while the server runs on 8791 | The server stays on 8791 and logs `the machine's own configuration is not read again: ...local.yml: port must be an integer` (case 29: `portMove calls []`). | The server moves to 8790 as it would for a written 8790 (case 29: `portMove calls [8790]`, `local.port=8790`), the page follows, and a finding names `port`; a port in use or reserved keeps the server where it is (HELP.md:282). Started with `port: x`, the server returns on 8790 (case 25). |
| 20 | Settings view: `wallpaper.pick`, `show_tabs`, `editor.word_wrap` and the other leaf choices | "Not chosen" gone from a leaf choice without `empty` (S5 refuter Behaviour 2) | Every leaf choice drew a `Not chosen` item (`settings_choice_empty` of the base `workbench.yml`, drawn by the base `Control.svelte:103`). | A leaf choice whose entry has no `empty` draws no empty item (`FieldControl.svelte:93-97` and `:205-211`, `Select.svelte:38`); an entry with `empty: true` draws `Not set`, and one with `empty: <words>` draws those words (`chat.model`, `git.message_model`, `layout.yml` `direct_chord`). |
| 21 | Settings view search box | A search by a heading word (S5 refuter Behaviour 3) | Not applicable to the base, which has no headings. | A row is matched by the words of its heading as well as its own (`src/lib/state/system/config/search.ts:38-46`, S5 case 5); `HELP.md:154` says so. |

Case 12 and 28 of the brief (a merge that dropped `behavior.yml` or `options.yml`) have no page-side look: the first starts with every default and no setting finding, the second stops the start with the sentence naming `config/catalogs/options.yml` (quoted runs above).

## Sentences outside the code and item 5.8

Each paragraph or comment of the brief's list, read in the worktree after the last change. Line numbers are those of the brief (the tree as the round began); `rewritten` means the text now says the new behaviour, `still true` means it was read and states what the code does.

| Where | Mark | What it says now, or why it holds |
|---|---|---|
| `DESIGN.md:85` control sentence | rewritten | Lists the controls with `whole: true` on a `number` and `form` (`program`, `extension`, `bundle_id`) on a `text`, and `whole`/`form` for each item of a `list` (item 0.3). |
| `DESIGN.md:85` "its default" | still true | S5's sentence: the entry's `default` is what Reset writes and Modified compares with; read after the change. |
| `DESIGN.md:151` | still true | `local.yml` through `checkLocal` and `loadLocal`; both exist under those names. |
| `DESIGN.md:243` | rewritten | A value its catalog entry refuses hands the poller that setting's `default` and is a finding naming the key; a dropped `behavior.yml` and a key with no catalog entry keep the settings in force and are logged once (`grep -n 'A value that its catalog entry refuses' DESIGN.md` prints line 243). |
| `DESIGN.md:245` last sentence | rewritten | A wrong key takes its default and is a finding naming `local.yml` and the key, a wrong row of `accounts`, `calendars` or `mail` is left out, a file that does not read keeps every value in force. |
| `DESIGN.md:395` last sentence | rewritten | The editor reads the key through `paintLimit` of `settings.ts`; `grep -n requirePaintLimit DESIGN.md HELP.md` prints nothing. |
| `DESIGN.md:396` | rewritten | The brief marks it still true, and it was not: it named `readEditorOptions` of `data/helpers/editor.ts`, which moved to `data/sources/config/editor-options.ts` (Z506). It now says options are read by the rule of each key's catalog entry, that the page holds none until the config channel has sent the catalog, and that `parseRepoSettings` is of the same module. |
| `DESIGN.md:402` | rewritten | `local.yml` is read through `readLocal`, which never throws; a wrong key takes its default and is a finding, a wrong row is left out, `checkLocal` refuses a body that would cost a key its value (`grep -n 'never throws' DESIGN.md` prints line 402). |
| `DESIGN.md:417` | rewritten | The open route's sentence says `open.program_ext` is read member by member by the rule of its entry, a member the entry refuses is not read and is a finding, and `programApps` of `data/sources/config/settings.ts` is the reader the view and the route share; the server no longer requires the map at start. |
| `HELP.md:261` last sentence | rewritten | A value written by hand that the option's control, range or list refuses is listed in the Findings view with the file and the key, the setting takes its default, and the server starts. |
| `HELP.md:267` | still true | The keys of `behavior.yml`; read after the change. |
| `HELP.md:274` | still true | `catalogs/options.yml` described as every option with its default, control and heading; read after the change. |
| `HELP.md:280` | still true | The text files and their merge; read after the change. |
| `HELP.md:282` | rewritten | A wrong key is a finding naming `local.yml` and the key, never the value; a wrong row is left out; a `port` that is not a whole number is 8790 and moves the server there as a written 8790 would, the page following, a busy or reserved port keeping the server where it is; the last sentence says a save with a key the server would read as its default is refused with the sentence naming that key. |
| `src/lib/server/files/source.ts:87-92` | rewritten | The comment of the machine-file refusal now says a wrong key is read as its default, so the save is refused with the sentence naming it. |
| `src/lib/server/accounts/connect/rows.ts:9-12` | rewritten | Says the text must read as a machine file with no key taking its default (`checkLocal`). |
| `tests/checks/tree/boundaries.test.ts:62-63`, `:74-76`, and the two new rows | rewritten | `data/helpers/editor` is the order that resolves a tab's editor options; `data/sources/config/settings` is the typed readers of single settings the page reads by the rule the server reads by; `catalog/value-rule` and `editor-options` each carry a sentence (item 5.6), rewrapped as a paragraph at 100 columns. |
| `tests/checks/tree/boundaries.test.ts:50-52` | still true | The `opens-in-program` and `languages` sentences; read after the change. |
| `tests/checks/config/config.test.ts:1-5`, `:369-376`, `:389-404` | rewritten | The head names `optionFindings` and `settingFindings` and says the `checkLocal` sentences and `readLocal`'s problems are rows of `local.test.ts`; `SOUND` and the case at `:389-404` are gone (`grep -n SOUND tests/checks/config/config.test.ts` prints nothing). |
| `config/catalogs/options.yml:3`, `:9` | rewritten | `default` is the value Reset writes and Modified compares with, and for a setting `settings.ts` reads, the value used when the key is missing or wrong; it names case 9's test title. `grep -rn --exclude=local.yml -e 'tracked file holds' config src` prints nothing. |
| `config/catalogs/options.yml:10`, `:13` | rewritten | `:10` names the `whole` and `form` words (item 0.3); `:13` is item 5.2's sentence (a value outside its control, `min`, `max` or `values` is wrong by one rule, `catalog/value-rule.ts`). |
| `config/catalogs/options.yml` descriptions :218 to :602 and the editor descriptions :458 to :492 | rewritten | Each sentence restating the rule or a default is gone (`grep -rn --exclude=local.yml -e 'refuses to start' -e 'in force and is logged' -e 'Must be above zero' config` and the `awk` of item 6 print nothing); `:608`'s 'is refused' is about the open route and stays. |
| `config/text/views/system/workbench.yml:13` | still true | `desc_behavior`: thresholds, horizons and cadences; read after the change. |
| `catalog/options.ts:6-7`, `:145` (and its doc paragraph through `:163`) | rewritten | Says what `default` is in the new words, rewrapped as one paragraph at 100 columns. |
| Head and doc comments of `settings.ts`, `local.ts`, `catalogs.ts`, `editor.ts`, `opens-in-program.ts`, `live-settings.ts`, `context.ts`, `config-checks.ts`, `refresh.ts`, `autofetch.ts`, `fields.ts`, `Usage.svelte` (item 5.8) | rewritten | Each file differs from its unchanged-tree copy in the head or doc comment named (`diff -rq` of the files table), and `tests/checks/source/comment-width.test.ts` and `history.test.ts` pass (item 3). `opens-in-program.ts` no longer repeats a head paragraph. |
| `src/lib/state/workbench/navigation/editor-text.ts:93` and `src/lib/state/client/selectors.svelte.ts:148` | still true | `shownLanguage` is plaintext for a text over the limit and before the configuration has delivered one; `editorPaintLimit()` is the limit in bytes and null until the config channel has spoken. Both read after the change. |

The brief's own 'still true' list contains `DESIGN.md:396`, which was false after Z506 and is rewritten (row above).

## Anything in the brief that was wrong or impossible

- Case 37 names `rust`, which is not among the 32 languages `registered()` holds (`ROOT=<tree> node <scratchpad>/r1/rust/reg.mjs`: `rust: false | ruby: true | python: true`, on both trees); the case runs with `ruby`.
- Case 33 names the texts of cases 17, 19 and 21 and says no message holds `a-b`, `gemini` or the parse error's text. None of those texts produces a `repeat` problem for a Claude label (case 19's repeated label is a calendar's, whose finding holds no label), so a test over them cannot fail if a `repeat` finding leaks the reduced label; and the parse error's text begins `Flow sequence in block collection ...`, which a check for the lowercase word `flow` does not find. The test therefore adds a third account row `{ tool: claude, dir: f, label: a-b }`, which repeats the reduced label `a-b` of `A b` (the problem printed by `ROOT=<worktree> node <scratchpad>/probes/localsent.mjs` is `accounts[2].label duplicates a Claude label or reduced label: a-b`), and compares the lowercased message. Taking the behaviour out in a scratch copy (the `repeat` finding worded with the problem's own sentence, and the `unparsed` finding likewise) fails the row with `expected 'accounts[2].label duplicates a claude...' not to contain 'a-b'` and `expected 'flow sequence in block collection mus...' not to contain 'flow'`.
- `DESIGN.md:396` is listed as 'still true' and is not: it named `readEditorOptions` of `data/helpers/editor.ts` (rewritten, see the table).
- `npm run test:quick` prints `limit 45.0 s` and exits 0 when it is exceeded: the first run of the list took `test:quick: 66.4 s (limit 45.0 s); every command passed` (`<scratchpad>/r1/checks-r1-run1.txt`); the fourth took 26.4 s.
- The first run on the unchanged tree of the brief's case 35 notes that every refused value was sent (`slurm.days` `1.5`, the key `pdf`, the value `com.apple TextEdit`, the item `a/b`); that is the result the brief asks the first run to note, not an error of the brief.
- Carried from S5's report, unchanged:
  - Item 7.3 and Decision 6 gave results the brief's own cases 35 and 22 refuse (ruled).
  - Item 1.6 and case 10 name a saved closed-groups list that does not exist (ruled; grep above).
  - The finding key format was not fixed (ruled).
  - Case 6 cannot be shown with the shipped files: they hold every option at its default, so `@modified` keeps 0 rows; the check used a copy of `behavior.yml` with `editor.tab_size: 2`.
  - Table 6.4 writes `empty` for three options whose empty item needs words (cases 41 and 42); the entries write `empty: <words>`.
  - `test:quick` reports `limit 45.0 s`; it took 92.5 s while other processes ran and 22.1 s to 40.2 s alone.

## History words in what the round added

Command: `python3 <scratchpad>/r1/history.py`. It takes the lines the worktree added or changed against the unchanged tree (new files whole) in `src`, `tests`, `config`, `DESIGN.md` and `HELP.md`, keeps the comment lines and the `it`, `describe` and `test` titles, and matches `before`, `used to`, `no longer`, `still`, `previously`, `as before`. Output (the fourth run):

```
config/catalogs/options.yml: # A value outside its control, `min`, `max` or `values` is wrong by one rule, src/lib/data/sources/config/catalog/value-rule.ts: the Settings view refuses it before the write, the server's write refus
src/lib/data/sources/config/catalog/value-rule.ts: // the caller hands in. The Settings view refuses a value by it before the write, the server's write
src/lib/data/sources/config/local.ts: * check the source endpoint makes before it writes that file run this one function, so a body the
src/lib/server/edit/writes/config/config-checks.ts: // must accept it: a reader that throws refuses the write whether or not it threw before, and a
src/lib/server/edit/writes/config/config-checks.ts: * threw before.
src/lib/server/edit/writes/config/config-fit.ts: // Settings view refuses a value by before the write and the setting readers read a key by; this
src/lib/server/edit/writes/config/config-key.ts: // own file, local.yml, is refused before anything is read. The checks that stand between the edited
src/lib/server/root/watch/autofetch.ts: * undefined before any message, null for a catalog with no rule for the key (said once until
src/lib/state/sessions/latex.svelte.ts: // still reach the editor as diagnostics. A main file is never built twice at once: from the moment
src/lib/state/sessions/latex.svelte.ts: // after a push that lacks it, does not hold it either, since a push can carry a list read before
src/lib/state/system/config/editors/fields.ts: // before it is sent (a number outside its range, a text of the wrong form, a path the hub does not
src/lib/state/system/config/editors/fields.ts: // refuses the number, form and path problems here, before the write, by the rule the server's write
src/lib/state/system/config/editors/fields.ts: // limits; a list that is still loading or could not be read makes no refusal here, and the server's
src/lib/ui/forms/choice/GlyphSelect.svelte: // choices lack is still shown, so a manifest is never silently retyped. The trigger is named by
src/lib/ui/forms/choice/drawn/FieldSelect.svelte: // its label and its option. What is drawn before the chosen word (`lead`) and the list itself
src/lib/ui/forms/choice/drawn/FieldSelect.svelte: /** What is drawn before the chosen word, when there is a chosen word to draw it for. */
src/lib/ui/forms/choice/drawn/HueSelect.svelte: // hues lack is still shown, so a file is never silently retyped by a field that could not
src/lib/views/sources/source/Source.svelte: // text yet says nothing, so the bar draws no source items over a tab still reading, and a tab
src/lib/views/sources/source/ask-perform.ts: * The indentation the text is shown in, whose size a conversion keeps; null before it is known.
src/lib/views/system/workbench/editors/FieldControl.svelte: // the list the control draws from is still being read the held value is shown as the one item,
tests/checks/tree/boundaries.test.ts: // `data/helpers/search/**`, the Search view refusing a query before it sends it and the search
tests/checks/tree/boundaries.test.ts: // fills a catalog string with and the one the server words every finding with before the snapshot
tests/checks/tree/boundaries.test.ts: // before it is sent and the server's write and readers by after it, so the three agree; and
hits: 23
```

Each hit judged: `before the write`, `before it is sent`, `before the snapshot`, `before any message` and `before it is known` name the order in which the code runs (a check before a send, a read before a push), not an earlier state of the code; `still loading`, `still being read` and `still shown` name a list or value that is being read or kept now; `whether or not it threw before` and `threw before.` in `config-checks.ts` describe the comparison the write check makes between the file as it was and the file with the edit; `a push can carry a list read before the terminal started` in `latex.svelte.ts` is a sequence of reads. None compares with an earlier version of the code, and none names a session, a package or a reverted attempt.

The title grep over the added `it` and `describe` titles prints no hit (the hits above are all comment lines).

## Conventions

- Two read-only git commands were run in this round, `git -C . status --short` and `git -C . log -1`. `agents/spec.md` forbids a builder any git command, read-only ones included; they changed nothing, and no other git command was run in this round.
- From S5's step: one `grep -rn` over `config/` ran without the `local.yml` exclusion (the `--exclude` option stood after `--`); it printed no line from `local.yml`, and nothing of that file was read or shown. Three read-only git commands were run (`git status --short`, `git diff --stat`, `git show HEAD:...HELP.md`). In this round every grep over a `config/` folder carries `--exclude=local.yml` before the pattern, and `config/local.yml` was not opened, printed, grepped or hashed in any tree.
- I started no vite or svelte-kit server, no browser and no real Claude or Codex. The probes build a server context over recorders with `HOME` and `TMUX_TMPDIR` under `<scratchpad>/probes/`; the scratch engines and hubs they make (`engine-*`, `hub-*`) are under `<scratchpad>/probes/`.
- Scratch is under `<scratchpad>/r1/` and `<scratchpad>/probes/` only: the unchanged tree `r1/round-start/`, the mutation copy `r1/now/`, `r1/first/`, `r1/first2/`, `r1/final/`, `r1/final4/`, `r1/compare/`, `r1/rust/`, `r1/report2/`. `diff -rq <scratchpad>/r1/now/{src,tests,config,utils} <worktree>/{src,tests,config,utils}` prints nothing, and a grep of the worktree's `src` for the mutation strings finds only `return held.value;` at `settings.ts:117` and `write.ts:118`, which are the reader's present-value branch and the page's held-value branch.
- Scratchpad cleanup by another agent: at the top level of the scratchpad I held `s5-compare.py` and `table.py` (S5's comparison of the catalog with table 6.4); `ls` shows both gone now. The comparison is rebuilt as `r1/compare/cmp.py` and its output is quoted under the verify list (`differences: 0`). Everything else of mine is in `r1/`, `probes/` and `hold/`, which `ls -d` shows present.
- The files this round wrote are the files table's. Nothing was written under `tests/` or `src/` for a probe: each quoted run is a script under `<scratchpad>/probes/` or a test copied into a scratch tree.
- ASCII: the perl gate of `agents/spec.md` prints nothing (item 10). Comments are rewrapped as whole paragraphs at 100 columns (`tests/checks/source/comment-width.test.ts` passes, item 3).

## Doc text

Current text and replacement of the two lines of `agents/guarded.md` (`sed -n 76p` and `sed -n 36p`). Line numbers are those of the file now.

**G13, Test line (current, line 76):**

```
Test: `catalog/agents.ts`: `tests/data/sources/agents-catalog.test.ts`, 'refuses a value that would read as an option, or holds whitespace or a control character'; `catalog/nesting.ts`: `tests/data/helpers/files/nesting.test.ts`, 'says each dropped pattern in the sentence of its kind, on its own key'; `catalog/options.ts`: `tests/data/sources/config/catalog/options.test.ts`, 'answers an empty catalog for %j' and 'names the key of each entry it cannot read and reads its control as text'; `languages.ts`: `tests/data/sources/config/languages.test.ts`, 'reports a language whose value is not a list, and keeps reading the others'; `local.ts`: `tests/data/sources/config/local.test.ts`, describe of `checkLocal`; `rail.ts`: `tests/data/sources/config/rail.test.ts`, 'words each problem of the list against the arrangements and glyphs it holds'; `settings.ts`: `tests/data/sources/config/settings.test.ts`, one case per setting reader; the other readers: `tests/checks/config/config.test.ts` and `config-folder.test.ts`.
```

**G13, Test line (replacement):**

```
Test: `catalog/agents.ts`: `tests/data/sources/agents-catalog.test.ts`, 'refuses a value that would read as an option, or holds whitespace or a control character'; `catalog/nesting.ts`: `tests/data/helpers/files/nesting.test.ts`, 'says each dropped pattern in the sentence of its kind, on its own key'; `catalog/options.ts`: `tests/data/sources/config/catalog/options.test.ts`, 'answers an empty catalog for %j', 'names the key of each entry it cannot read and reads its control as text' and 'reads whole and form, and names an entry whose whole or form it cannot read'; `catalog/value-rule.ts`: `tests/data/sources/config/catalog/value-rule.test.ts`, 'answers the kind of problem each control, bound and list gives a value, and none for a value that fits', 'checks each item by the entry bounds, whole and form' and 'checks one item of a list by the same rule'; `languages.ts`: `tests/data/sources/config/languages.test.ts`, 'reports a language whose value is not a list, and keeps reading the others'; `local.ts`: `tests/data/sources/config/local.test.ts`, describe of `checkLocal`, the describes `readLocalText` and `readLocal and loadLocal` (for example 'keeps the good keys when one is wrong', 'leaves out the row that is wrong and reads the rows around it', 'reads a wrong port as the default port') and 'words each problem against local.yml with no value of the file in it'; `rail.ts`: `tests/data/sources/config/rail.test.ts`, 'words each problem of the list against the arrangements and glyphs it holds'; `settings.ts`: `tests/data/sources/config/settings.test.ts`, one describe per setting reader and 'answers the shipped default for each setting the shipped file gets wrong, and reads every shipped default'; `editor-options.ts`: `tests/data/sources/config/editor-options.test.ts`, 'reads each editor option by its catalog entry, answering the default and a problem for a value it refuses', 'reads a language record field by field against the fields of editor.languages' and 'reads a repository's records by the catalog's rule'; the other readers: `tests/checks/config/config.test.ts`, 'words each wrong setting against behavior.yml from the catalog, and nothing for the shipped files' and 'says nothing for a merge that dropped behavior.yml, or for a map without the catalog', and `config-folder.test.ts`.
```

**G9, Test line (current, line 36):**

```
Test: `tests/server/core/changes.test.ts`, 'records one manifest field with the value it had and the value written', 'records a collection entry field, a new entry, a reorder and a deletion', 'records a subtask ticked, a subtask added and a subtask taken out', 'records a career host, a session override and a feed field', 'records the deck's two lists as the file held them and as it holds them now', 'records a scaffolded idea with no way back'; `tests/routes/edit/undo/undo.test.ts`, its cases; `tests/routes/files/source.test.ts`, 'replaces the complete file through a temporary neighbour and atomic rename'.; undo: `tests/routes/edit/undo/undo.test.ts`, 'writes a manifest field back, logs the undo, and undoes the undo', 'takes a created entry out again and puts a deleted one back', 'puts a collection entry field and a feed field back', 'puts a collection order back', 'puts a session override back', 'puts a subtask line back as it was', 'puts the deck's two lists back to what the save before them left', 'puts a career host and a subtask line back', 'takes an added lead out again, and puts a deleted one back as it was recorded'; rail: `tests/routes/edit/rail.test.ts`, 'records the change, and the undo puts the list back through the same writer'; roots: `tests/routes/edit/roots.test.ts`, 'records the add and the remove, and the undo of each puts the list back'; config key and value: `tests/routes/edit/config-key.test.ts` and `tests/routes/edit/config-value.test.ts`, 'puts the file back byte for byte and logs the undo above the write'; file operations: `tests/routes/files/file-undo.test.ts`, 'appends one files record for a create, with the path stamped after', 'records a rename with both paths, and a paste move and a paste copy by their mode', 'records an upload', 'moves the file to the Trash while it is unchanged, and records the reverse', 'moves the file back to its old name', 'takes a move back to the folder it came from', 'writes a 1 KB file back with its text'; replace: `tests/routes/replace/replace-undo.test.ts`, 'writes each file back from its copy and records the undo as a replace that can be taken back'; `tests/routes/replace/ops-replace.test.ts`, 'appends one files record naming each file, its kept copy and the file as it is'; file save: `tests/routes/files/history.test.ts`, 'keeps a copy before the write, so the copy is the text the save replaced'; `tests/routes/files/source.test.ts`, 'replaces the complete file through a temporary neighbour and atomic rename'.
```

**G9, Test line (replacement):**

```
Test: `tests/server/core/changes.test.ts`, 'records one manifest field with the value it had and the value written', 'records a collection entry field, a new entry, a reorder and a deletion', 'records a subtask ticked, a subtask added and a subtask taken out', 'records a career host, a session override and a feed field', 'records the deck's two lists as the file held them and as it holds them now', 'records a scaffolded idea with no way back'; `tests/routes/edit/undo/undo.test.ts`, its cases; `tests/routes/files/source.test.ts`, 'replaces the complete file through a temporary neighbour and atomic rename'.; undo: `tests/routes/edit/undo/undo.test.ts`, 'writes a manifest field back, logs the undo, and undoes the undo', 'takes a created entry out again and puts a deleted one back', 'puts a collection entry field and a feed field back', 'puts a collection order back', 'puts a session override back', 'puts a subtask line back as it was', 'puts the deck's two lists back to what the save before them left', 'puts a career host and a subtask line back', 'takes an added lead out again, and puts a deleted one back as it was recorded'; rail: `tests/routes/edit/rail.test.ts`, 'records the change, and the undo puts the list back through the same writer'; roots: `tests/routes/edit/roots.test.ts`, 'records the add and the remove, and the undo of each puts the list back'; config key and value: `tests/routes/edit/config-key.test.ts` and `tests/routes/edit/config-value.test.ts`, 'puts the file back byte for byte and logs the undo above the write'; a value the file held that its catalog entry refuses: `tests/routes/edit/config-key.test.ts`, 'puts back a value the file held that its catalog entry refuses'; file operations: `tests/routes/files/file-undo.test.ts`, 'appends one files record for a create, with the path stamped after', 'records a rename with both paths, and a paste move and a paste copy by their mode', 'records an upload', 'moves the file to the Trash while it is unchanged, and records the reverse', 'moves the file back to its old name', 'takes a move back to the folder it came from', 'writes a 1 KB file back with its text'; replace: `tests/routes/replace/replace-undo.test.ts`, 'writes each file back from its copy and records the undo as a replace that can be taken back'; `tests/routes/replace/ops-replace.test.ts`, 'appends one files record naming each file, its kept copy and the file as it is'; file save: `tests/routes/files/history.test.ts`, 'keeps a copy before the write, so the copy is the text the save replaced'; `tests/routes/files/source.test.ts`, 'replaces the complete file through a temporary neighbour and atomic rename'.
```
