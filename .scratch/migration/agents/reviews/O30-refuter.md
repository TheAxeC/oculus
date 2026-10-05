# O30 refuter report

O30 review (refute), native window. Worktree /Users/axelfaes/workspace/research-hub/.agents/worktrees/O30 at base b5299f4e5, the builder's work uncommitted on top. I changed nothing in the worktree or the ledger. The only git commands I ran were `git diff b5299f4e5` and `git status --short`, from inside the worktree. I never started the app and never took focus.

Summary: the step is not finished. Case 12's scroll clause is not built; Z592 rules option (a), so it goes into the repair round. The new code has one Behaviour defect (B1): after a port move, the app's own `origin` is not updated. Several "not verified" items are work left undone rather than real limits. Four added tests are named by no guarded.md entry. Every verify command I could run passed.

## The brief's "Verify before you report", run from the worktree's tools/oculus

1. `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md` exited 0. Its lines:
   - `ok      prettier (15.1 s): All matched files use Prettier code style!`
   - `ok      ASCII gate (16.0 s)`
   - `ok      svelte-kit sync (33.7 s)`
   - `ok      eslint (45.8 s)`
   - `ok      svelte-check (33.5 s): 1791239713778 COMPLETED 377 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
   - `ok      vitest (52.5 s): Duration  33.60s ...`
   - `test:quick: 68.4 s (limit 45.0 s); every command passed`
   - `test:quick: over the time limit`
   - `checks: 1 commands passed`

   The time is over the limit in my run; the report's run was 40.8 s. Two other builders were running on this machine at the time, so I do not read this as a defect of the step (not verified either way).
2. The picker, layout-saved, window-guard, text-menu, drag-outside, config-folder, boundaries and other tests/checks files, run together: `Test Files  16 passed (16)`, `Tests  163 passed (163)`.
   - G28's tests (tab-menu, form-drafts, manifest-draft, source, comment-draft.client): `Test Files  5 passed (5)`, `Tests  11 passed (11)`.
   - The other `createClientState` callers (keys, terminal-close, layout-unread and the fixtures/client users): `Test Files  9 passed (9)`, `Tests  55 passed (55)`.
   - `npx vitest run tests/checks`: `Test Files  16 passed (16)`, `Tests  229 passed (229)`, which matches the report.
   - start.test.ts alone: declined (see "Declined to judge").
3. `sh utils/folder-check.sh`: no output, exit 0.
4. `sh utils/unused-exports.sh`, diffed against `/Users/axelfaes/workspace/research-hub/.agents/worktrees/O30-base/unused-exports.txt`:
   - The count goes from 255 to 256.
   - Added: `src/lib/server/root/process/parent.ts: parentOf, askParentToPick` and the type `ParentPort`.
   - Gone: `engineDir` and `DEFAULT_PORT`.
   - The added lines are knip false positives. `src/server.ts:16` imports all three and lines 45 and 58 use them, but knip takes package.json `main` (now `src/desktop/main.ts`) as its entry and does not read `src/server.ts`. This agrees with the report.
5. `node --check src/desktop/preload.cjs`: exit 0. It is the only .cjs file.
6. The cases: see below.
7. The perl ASCII gate over `find src tests bin config -type f ! -name local.yml` prints `bfs: error: bin: No such file or directory.` and then nothing; perl exits 0. `LC_ALL=C grep -n '[^ -~]'` over DESIGN.md, HELP.md, README.md, package.json, utils/diagrams/graphs.mjs and assets/app-icon.svg finds nothing (exit 1).
8. `wc -l`:
   - The largest changed file is `src/lib/state/sessions/terminals.svelte.ts` at 839 lines, unchanged in count.
   - `layout.svelte.ts` is 830, under 880.
   - Components: `PaneView.svelte` 481 and `Workbench.svelte` 464, both under 520.
   - Others: `saved/load.ts` 132, `float/pages.ts` 422, `float/store.ts` 116, `pane-view.ts` 504.
9. Test runs: see 2.
10. The prose read: see the Standards findings.

Also:
- `ls tools/oculus/docs` prints `diagrams`, so there is no `docs/adr`.
- `node tools/oculus/utils/outside-paths.mjs <brief> b5299f4e5`, run from the worktree root, lists 28 paths. The report's file table names each source and test path among them with a reason (spec.md:34). The three `.scratch` paths in the list are the orchestrator's synced copies.
- I packaged the app with `node src/desktop/package.ts --out <scratch>/pkg` (exit 0):
  - `plutil` prints `local.research.oculus`, `oculus` and `electron.icns`.
  - `codesign --verify --deep --strict` exits 0.
  - The stub `main.cjs` is `import("file:///Users/axelfaes/workspace/research-hub/.agents/worktrees/O30/tools/oculus/src/desktop/main.ts");`.
  - The scratch bundle has been removed.

## Reruns of the report's quoted evidence

These match the report:
- `grep -c "Still undecided" DESIGN.md` prints 0.
- `grep -rn "context-menu" src/desktop` prints the one comment line, preload.cjs:8.
- The crash-switch grep prints nothing (exit 1).
- `grep -n "DEFAULT_PORT = "` prints `122:export const DEFAULT_PORT = 8790;`.
- `find src config tests utils -type f -newermt '2026-10-05 23:24:00' ! -name local.yml` prints only `src/desktop/app.ts`.
- Case 37's callers: 8 unchanged against the O30-base copy; `tests/checks/config/config-folder.test.ts` CHANGED.

These do not match:
- The report's location for the Restart fix (P1).
- The report's claim that the brief's doc paragraphs were each marked (P4).

## Verdicts per item of "What to build"

1. The app and its server: violated, by B1 and S2. The parts:
   - 1.1 (login environment): holds; report case 28.
   - 1.2 (port in use, health): holds; G48 rows and report cases 5 and 6.
   - 1.3 (switches): partially violated; S4.
2. One instance: holds, by reading app.ts and report case 4/33.
3. Window lifetimes: violated. Reopening after a port move goes to the stale origin (B1). The window options and permission decisions hold; G47 rows 3 and 4 pass in my run.
4. Window state: holds per report case 3. Not run by me.
5. Links and navigation: holds; G47 row 1 passes, and `will-frame-navigate` with isMainFrame covers navigation.
6. Application menu: holds, except the literal label (St6).
7. Keys: holds in code; the HELP row for Cmd+R is missing (S3).
8. A floating pane in its own window: violated. Case 12's scroll clause is not built (S1). The save turn passes null through as a write (B2).
9. Folder picker: holds by reading and report case 20 (answered by a stub).
10. Spelling: holds as the cases ruling item 1 rules.
11. Find: holds as the cases ruling item 2 rules (`src/routes/find/`).
12. Bridge: holds, with B2.
13. Words: violated in one place (St6, menu.ts:25).
14. macOS application: holds; my packaging run is above.
15. Icon: holds by file presence (`assets/app-icon.svg`, `.png`, favicon 18 lines). The drawing itself is for the look.
16. Documents and diagrams: violated (S3, S2's stale lines, P4).

## Verdicts per case

"Not verifiable" below means a run of the app's windows, which I may not do; the report's own run is cited.

| Case | Verdict | Basis |
| --- | --- | --- |
| 1 | not verifiable | report met; the brief's premise that the status bar says "connected" is wrong |
| 2 | partial | packaging verified by me; Terminal tab not verified (P5) |
| 3 | not verifiable | report met, earlier tree |
| 4 and 33 | not verifiable | report met; G48 row declined by me |
| 5 | not verifiable | report met, earlier tree |
| 6 | not verifiable | report met |
| 7 | not verifiable | G48 row declined |
| 8 | not verifiable | report met |
| 9 | partial | quit after the answer not run (P7) |
| 10 | not verifiable | report met |
| 11 | not verifiable | report met |
| 12 | unmet | scroll clause (S1) |
| 13 | not verifiable | report met |
| 14 | partial | unsaved text (P7) |
| 15 | not verifiable | report met |
| 16 | partial | restart not run (P7) |
| 17 | unmet | not run (P7) |
| 18 | met | G47 row 1 passes; links.ts read |
| 19 | partial | Repositories row's own item not driven |
| 20 | partial | stub sheet |
| 21 | partial | edit keys, full screen, DevTools not run (P7) |
| 22 | not verifiable | report met |
| 23 | not verifiable | report met; the wordAt rows pass in my run |
| 24 | partial | fix not run (P1); read below |
| 25 | met by reading | ruling; windows.ts:174-177 |
| 26 | not verifiable | report met; see B1 for New Window after the move |
| 27 | partial | popped-out target variant not shown (P7) |
| 28 | not verifiable | report met |
| 29 | met | G47 row 2 passes |
| 30 | met for the decision | G47 row 3; paste in a terminal not run |
| 31 | not verifiable | orchestrator's look |
| 32 | not verifiable | G48 row declined |
| 34 | not verifiable | report met |
| 35 | partial | P6 |
| 36 | not verifiable | report met |
| 37 | met | one catalog line in config-folder.test.ts, explained; callers green in my run |
| 38 | not verifiable | report met |
| 39 | partial | stub sheet |
| 40 | not verifiable | report met |
| 41 | partial | unsaved text (P7) |
| 42 | partial | default browser not recorded |
| 43 | not verifiable | report met |
| 44 | not verifiable | report met |

## Findings

### Spec

- **S1: case 12's scroll clause is not built.** The report's line 1 hands it back as an "open decision" between building it (a) and accepting that the copy opens at the top (b). Brief case 12 already requires it, so this was a smaller job than the brief. Z592 rules (a): a source tab's saved state gains its scroll position.
  - Failure: a copy of a source tab scrolled to line 3 opens at line 1 (report case 12, `"first":"1"` against `"first":"3"`).
- **S2: a new command-line flag for the server that the brief never names.** `src/lib/server/root/process/args.ts` (66 to 80 lines) and `port.ts:1-4` add `--default-port` to `node src/server.ts`. That is a user-visible shape. The report files it under "Judgment calls the brief left open" and does not raise it as a decision for Axel.
  - Two doc sentences are now false. HELP.md:352 says "its one argument is `--engine <dir>`" and README.md:11 says "The built server takes one argument, `--engine <dir>`".
  - Failure: a reader of either doc does not know the flag exists, and the shape was never put to Axel.
- **S3: HELP's keys table has no Cmd+R row.** Brief :189 lists Cmd+R among the app rows to add. `grep -n "Cmd+R" HELP.md` prints nothing. The menu does carry `Reload | acc=Cmd+R` (report case 21).
- **S4: only six Chromium switches are let through.** `src/desktop/decide/args.ts` lets through a fixed list: `--remote-debugging-port`, `--remote-allow-origins`, `--enable-logging`, `--log-level`, `--disable-gpu`, `--force-device-scale-factor`. Brief 1.3 says every argument is refused "except Chromium's own switches".
  - Failure: `npm run app -- --lang=nl`, or any other Chromium switch, gets the "unknown argument" dialog.
- **S5: three new modules in `process/` where the brief allowed one.** They are `parent.ts`, `port.ts` and `words.ts`. They are named in the report's file table but not given a reason the way the outside paths are. Low.

### Proof

- **P1: the Restart fix is not where the report says, and it was never run.** The report cites `src/desktop/app.ts:171` (lines 1 and 332, and the table row "Restart's second window fix"). The fix is at app.ts:234-235:
  ```ts
  // A restart finds its windows open: their pages reconnect on their own.
  if (windows.lastMain() === null) windows.openMain(origin);
  ```
  Line 171 is the end of the `activate` handler.
  - Judged by reading: correct for the defect the report saw (`ended()` -> `startServer(env)` -> `listening` opens a main window only when none is open, and `origin` is refreshed to the restarted port).
  - Not verified by any run. A run needs no more focus than case 24 already used, so it is work left undone.
- **P2: tests that no guarded.md entry names (spec.md:57).**
  - `tests/server/desktop/window-guard.test.ts:95`, 'starts a page in the app on the dark theme, keeps a saved choice and leaves a browser tab its own start'. Not named by G47. Line 99, `expect(WINDOW_BACKGROUND).toBe('#181818')`, is an assertion over a constant (spec.md:61).
  - `tests/ui/controls/text/text-menu.test.ts`, the six `wordAt` rows: ordered by the cases ruling item 1, but no guarded.md entry names the file.
  - The same file's 'makes one item per suggestion, labelled with the word and carrying it in its id': ordered by nothing.
  - `tests/state/workbench/drag-outside.client.test.ts`, three titles ('hands the host the screen point as plain data', 'becomes a window at that point when no other window takes it', 'is left where it is when another window takes it'): ordered by nothing. Its head comment, lines 6-7, says `tests/server/desktop/window-guard.test.ts reads its decision`, which is false: `grep -n -i drop tests/server/desktop/window-guard.test.ts` prints nothing, and no test imports `src/desktop/decide/drop.ts`.
  - The report lists these files but proposes no entry for them.
- **P3: start.test.ts (G48) waits on wall-clock time, which spec.md:64 forbids.**
  - `printed()` polls every 250 ms until a deadline (:136-143).
  - `Promise.race([second.ended, wait(15_000)])` at :186.
  - `Promise.race([running.ended, wait(5000)])` at :225.
  - The cleanup uses `wait(10_000)` at :112.
  - Failure: the Quit row allows 5000 ms, and the app's own server stop also waits `STOP_WAIT_MS = 5000` (app.ts:41). A server that uses its whole stop wait leaves `exitCode` null at the `expect(...).toBe(0)` on :226, so the row fails while the app is fine.
- **P4: the doc paragraphs are not marked.** Brief :71 asks the report to mark each listed paragraph of HELP, DESIGN and README 'still true' or 'rewritten'. `grep -c -i "still true\|rewritten" O30-report.md` prints 0.
- **P5: case 2's Terminal tab shows a failure that the report leaves as "not verified".** After the click, the report quotes `error connecting to /tmp/o30t/tmux-502/default (No such file or directory)`. No session existed after the click, and the report does not say why.
- **P6: case 35's split changed nothing on screen.** The report says "The main window's split changed no pane". The write record holds `splitInstance`, but the panes are unchanged. That is either a lost change under the save turn or a split that did nothing; the report does not settle which. Brief case 35 asks for both changes in the saved arrangement.
- **P7: the NOT DONE list, each item judged.**

  | Item | Judgment | Why |
  | --- | --- | --- |
  | Case 12 scroll | work left undone | S1 |
  | Cases 14, 17, 41, unsaved text | not shown to be impossible | the editor's text can be set over the debugging port the harness already drives, without OS focus (for example the Monaco model's value through Runtime.evaluate), which makes the tab dirty; not tried |
  | Case 21, edit keys | partly a real limit | the native menu roles need OS key events; `Input.dispatchKeyEvent` with editing commands was not tried |
  | Case 21, full screen and DevTools | work left undone | the roles can be invoked from the main through the inspector, as the other menu items were |
  | Case 16, start again | work left undone | it needs only a second start on the scratch HOME |
  | Case 27, into a popped-out window | work left undone | the windows can be moved apart with setBounds from the main |
  | Cases 20 and 39, real sheet | real limit | under the no-focus rule |
  | Case 9, quit after the answer | work left undone | the stub that answers dialogs from files exists in the later runs |
  | Case 2, Terminal tab | failure signal | P5 |
  | Restart fix | work left undone | P1 |

### Standards

- **St1:** `src/lib/state/workbench/layout.svelte.ts:85-87` stacks two doc comments. "What a reader given the id of a page the list does not hold is answered with." is orphaned above `MAX_TURNS`; it belongs to `GONE` at :89.
- **St2:** `src/desktop/decide/window-file.ts:4` cites `host/window-state.ts`; the file is `src/desktop/windows/window-state.ts`.
- **St3:** `src/lib/server/root/process/port.ts:4`, "A server started without the flag reads local.yml as it always has", is history wording.
- **St4:** `src/desktop/preload.cjs:4` is a comment of 106 columns, past the 100 of `.prettierrc` and `comment-width.test.ts`.
- **St5:** `utils/diagrams/graphs.mjs:37-38` (86, then 32 columns) and :155 (77 columns) are rewrapped short, so the comment is ragged.
- **St6:** `src/desktop/windows/menu.ts:25` has `label: 'oculus'`, a literal outside the catalog (item 13).
- **St7: duplicated constants.**
  - `HOST = '127.0.0.1'` in `src/desktop/app.ts:47` and `src/desktop/server/health.ts:9` beside the exported `LISTEN_HOST` in `src/lib/server/root/mover.ts:10`.
  - `ZOOM_LEAST` and `ZOOM_MOST` in both `app.ts:51-52` and `decide/window-file.ts:18-19`.
- **St8:** `src/routes/find/+page.ts` repeats the main `+page.ts` install body. `diff` shows only the comment and the return line differ.
- **St9:** the report's line 651 states that the builder ran a read-only `git status -- tools/oculus`. Agents run no git command.

### Behaviour

- **B1: the app's `origin` goes stale after a port move.** In `src/desktop/app.ts` the `origin` declared at :114 is set only at :233 (first listen) and :261 (Open a Window). A port move updates each window's `entry.origin` (`windows.ts:137`) but not this variable. After a move, File > New Window (:186), the Dock click and a second start (`showMain`, :164) all open the old port.
  - Failure 1: move 8817 to 8819 in Settings, close the windows, click the Dock icon. The window loads `http://127.0.0.1:8817/`, where nothing listens.
  - Failure 2: if another local program has taken 8817, the new window's `entry.origin` is that program's origin. `senderOf` (`decide/sender.ts`) then answers its top frame, and `permissionGranted` gives it `clipboard-read`.
  - Fix: subscribe to `server.onListening` and update `origin` on each move.
- **B2: an unanswered save is written anyway.** `src/desktop/windows/bridge.ts:96` returns `null` to a caller it does not answer (or to invalid arguments), and `src/desktop/preload.cjs:28` maps `null` to `{ admitted: true }`. A refused or unanswered save therefore writes without taking the turn. Low.
- **B3: the write record's re-check is a timing guess.** `src/lib/state/workbench/layout/saved/storage.ts:56` (`CONFIRM_MS = 300`) and :222 look again after 300 ms. An entry is still lost when the other window's write lands after that. It affects the write record only, which is case 35's proof instrument. Low.

## Declined to judge

- `npx vitest run tests/server/desktop/start.test.ts` (G48, all five rows): it starts Electron, and its first row exists to bring the app's window forward. That is barred by the brief ("Never start the desktop app on Axel's screen, and never take focus"). The report's run is `Tests  5 passed (5)`.
- Every case that needs the app's windows (1, 3 to 11, 13 to 17, 19 to 24, 26 to 28, 34 to 36, 38 to 44), the Restart fix in a run, B1's failure scenario in a run, and the icon's drawing: the orchestrator checks them in the look.
- Whether `import()` of a `.ts` path from the packaged stub runs under Electron 44: it needs the app started.

## Usage

Served model claude-opus-5-5; tokens not known.

Usage: a566f8df9598698f1, claude-opus-5-5, 161,018 tokens, 101 tool uses, 16.2 min.

# Repair round 1, refuted

Worktree `/Users/axelfaes/workspace/research-hub/.agents/worktrees/O30`, base b5299f4e5, the work uncommitted. I changed nothing. The only git commands I ran were `git diff b5299f4e5` and `git status --short`, both from inside the worktree. I never started the app, never took focus, never touched ports 8787 or 8790, ran no curl, and never opened `config/local.yml`.

**Summary.**
- **Two tree checks are red.** Round 1 broke them: `comment-width` at `src/desktop/decide/window-file.ts:4` (the St2 fix) and `imports/order` on `state/shared/install.ts` (the St8 fix). `test:quick` does not run `tests/checks`, so the builder's list stayed green, but the landing list runs them. Both fixes are small enough for landing.
- **B1 holds for the app's own server only.** In the Open a Window case (a window onto an oculus the app did not start), `origin` still goes stale after that server moves its port.
- **Restart now reloads every window.** I give the facts on that choice below.
- **`Source.svelte` is still over 520 lines.** The builder handed this back as later work, which is a deferral.
- **`start.test.ts` has three problems by reading**, and it was never run after the rewrite.
- Every other round item closes.

## Verify list, rerun from the worktree's tools/oculus

**1. `checks.sh`** (`PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH bash ~/.claude-work/skills/land/templates/checks.sh .../orchestrator-state.md`) exited 0:
- `test:quick: 113 changed file(s), from git since HEAD`
- `test:quick: 57 test file(s), 10 essential`
- `ok      ASCII gate (0.3 s)`
- `ok      prettier (0.3 s): All matched files use Prettier code style!`
- `ok      svelte-kit sync (1.6 s)`
- `ok      eslint (1.6 s)`
- `ok      svelte-check (5.9 s): 1791244176190 COMPLETED 377 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
- `ok      vitest (11.4 s): Duration  8.77s (...)`
- `test:quick: 11.8 s (limit 45.0 s); every command passed`
- `test:quick: not covered: tests outside the selection, tests/checks, slow tests, build, lint of unchanged files; npm run test:landing runs them`
- `checks: 1 commands passed`
- An earlier run printed the same, at `test:quick: 38.3 s`. It also listed `tests/checks/config/config-folder.test.ts`, `tests/checks/tree/boundaries.test.ts` and `tests/server/desktop/start.test.ts` as `changed, run by npm run test:checks or test:slow`.

**2. `npx vitest run tests/checks`: RED.** `Test Files  2 failed | 14 passed (16)`, `Tests  3 failed | 226 passed (229)`:
- `tests/checks/source/comment-width.test.ts > ... ends by the hundredth column everywhere under src, tests and utils`: `+   "src/desktop/decide/window-file.ts:4",`. The line is 109 columns (`awk 'length>100'`).
- `tests/checks/imports/order.test.ts > holds the state folders` and `> places every folder of every layer ...`: `+   "state/shared is not placed in the state/shared order",`. The cause is `src/lib/state/shared/install.ts`, a module sitting directly in `state/shared`. `INNER` in `tests/checks/imports/order.ts:100` places only `answers`, `words` and `stores`.
- The first review's run of `tests/checks` was 229 passed, so round 1 introduced these three.

**3. The guarded and caller tests pass:**
- Picker, `layout/saved`, `window-guard`, `source`, `tab-menu`, `tests/state/forms` and `comment-draft.client`: `Test Files  9 passed (9)`, `Tests  20 passed (20)`.
- Every `createClientState` caller and fixture user (`tab-menu`, `config-folder`, `keys`, `tests/state/forms`, `source`, `layout-unread`, `terminal-close`, `bar-actions`, plus the users of `fixtures/client`): `Test Files  9 passed (9)`, `Tests  55 passed (55)`.

**4. Other checks:**
- `sh utils/folder-check.sh`: no output, exit 0.
- `node --check src/desktop/preload.cjs`: exit 0. It is the only `.cjs` file.
- The `perl` ASCII gate over `src tests config`: prints nothing, exit 0. `LC_ALL=C grep -n '[^ -~]'` over `HELP.md README.md DESIGN.md package.json utils/diagrams/graphs.mjs assets/app-icon.svg`: exit 1, no hit.
- `sh utils/unused-exports.sh` diffed against the base list: `256` against `255`. The added lines are `parent.ts: parentOf, askParentToPick` and the type `ParentPort`. `engineDir` and `DEFAULT_PORT` are gone. This matches the report.
- Size: the only changed file over a limit is `src/lib/views/sources/source/Source.svelte` at 531 lines. The base has 528 and main has 520 (`wc -l`).

**Reruns of the report's evidence.** These match the report:
- `CONFIRM_MS` and `setTimeout` are gone from `saved/`.
- `app.ts:224` holds `forked.onListening(...)`.
- `REFUSED` is at `bridge.ts:29`, and `preload.cjs:29` reads `answer ?? { admitted: false, held: null }`.
- `preload.cjs` has no line over 100 columns.
- `menu.ts:25` reads `t('desktop.menu.app')`.
- `HELP.md:68` holds the Cmd+R row.
- `HELP.md:353` and `README.md:11` name `--default-port`.
- The doc comment at `layout.svelte.ts:90` sits on `GONE`.
- `hubRoot()` (`selectors.svelte.ts:237`) derives the hub from the first project.
- `workbench.ts:61` returns early for a pane's only tab split onto its own pane (P6's cause).
- The `wc -l` figures match, except `commands.ts`, which is 94 lines where the report says 96. No decision rests on that.

## Verdicts per round item

| Item | Verdict | Basis |
| --- | --- | --- |
| 1 S1 | holds | `first` added to the draft, `followFirstLine` in `commands.ts`, `startLine`. Run r25 not rerun. See Behaviour B-b and Proof P-f. |
| 2 B1 | partially holds | Own server: `app.ts:224`. A window onto another oculus: violated, Spec S-a. |
| 3 B2 | holds | `bridge.ts:97-103`, `preload.cjs:27-30`, `storage.ts:176-185`. |
| 4 B3 | holds | No timer remains in `saved/` (grep). `putBack` runs on the `storage` event for `WRITES_KEY` (`storage.ts:296-302`). |
| 5 P6 | holds | Cause verified at `workbench.ts:61`. Run r03 not rerun. |
| 6 S4 | holds | `args.ts:12-37` matches Z598. |
| 7 S2 | holds | `HELP.md:353`, `README.md:11`. |
| 8 S3 | holds | `HELP.md:68`, `desktop.yml:26`. |
| 9 P2 | holds | Every added test is named by G47 or G48 (list below). |
| 10 P3 | holds in its letter | Signals only, but it was never run and it has defects; see Proof P-b. |
| 11 P1 | holds, beyond its finding | The cite is correct. The reload of every window is a new behaviour, raised as an open item. |
| 12 P5 | holds | The cause is outside the step (no project in the scratch hub). |
| 13 P7 | partial | Full screen, Monaco's edit keys and the terminal's Cmd+A/C/X/Z are not verified. Case 27 had one unexplained failure. |
| 14 P4 | holds | The table covers every HELP, DESIGN and README paragraph that brief :71 lists. |
| 15 S5 | holds | Report lines 753-755. |
| 16 Standards | violated | St1, St3 to St7 hold. St2 and St8 turned two tree checks red. St9 was broken again (`git -C . rev-parse`). |

**Check of every closure.** No check was removed or loosened in place of a fix. The changed test lists, `CATALOG_FILES` and `SHELL_STORES`, are additions the first report already listed. Two fixes reach beyond their finding:
- **P1:** the reload of every window on Restart, a user-visible change.
- **St8:** a new module in a folder that the order check does not place.

## The items in particular

### Restart reloads every window (`app.ts:232-235`): the facts for the orchestrator's choice

**What a reload loses, by reading:**
- **Unsaved editor text is kept.** Each change writes the draft at once, through `source.svelte.ts:283-287` `updateDraft` to `ui.setInstanceState` (`ui.svelte.ts:609-611`) to `save` (`:517-525`, `localStorage.setItem`, no debounce). G28 covers it, and case 17's run shows the same text surviving a quit.
- **Form, manifest and review-comment drafts are kept.** Their G28 tests pass in my run.
- **Scroll:**
  - A source tab keeps its first line (S1).
  - Every other view's scroll goes to the top. I did not verify this view by view.
- **Lost:**
  - Monaco's undo history: the model is made again.
  - Any open dialog, menu, palette, key sheet, Confirm or close question. It goes unanswered and nothing is done.
  - An in-progress drag.
- **Terminals:**
  - The page attaches again and receives the pane's capture, `SCROLLBACK_LINES = 2000` lines (`sessions.ts:49`, `:701`, sent at `channel.ts:600-620`).
  - The screen and up to 2000 lines of history come back, and the program keeps running in tmux.
  - A selection in the grid and the grid's lines beyond 2000 are lost.
- **The find bar is not reloaded.** It is a separate `WebContentsView` (`find-bar.ts`), so it stays up showing the old document's count until the next find.
- **The reload goes to each window's old URL.** If the restarted server listens on another port (`local.yml` changed while the server was down), every window reloads onto the dead port. See Spec S-b.

**What exists without a reload:**
- The token reaches the page as page data, and `writes.setToken` installs it on every load (`writes.svelte.ts:139-142`).
- `exchange` already recovers from a stale token. On a 403 with no field refusal it runs `invalidateAll()`, waits a `tick()`, and retries once (`writes.svelte.ts:497-509`).

**Where the stale token still breaks things:**
- `postTerminal` (`pty-io.ts:125-131`) and `postCommand` (`writes.svelte.ts:158-176`) send the token and never retry. This is the 403 the builder saw on a terminal start.
- The socket sends the token it holds when it subscribes (`socket.svelte.ts:151-155`). After a reconnect to a new server process the socket "writes to none", so typing in a terminal is refused.
- All of this also happens in a Chrome tab after any restart of `node src/server.ts`, which the app's reload does not cover.

**What handing the new token over without a reload would touch:**
- The main sends each page a bridge event when the restarted server listens. This touches `app.ts:234` and `DesktopEvents` in `state/shared/stores/desktop.ts`.
- The page runs `invalidateAll()` and then sends its subscription again (`desktop-windows.svelte.ts` or `+page.svelte`, plus `socket.svelte.ts` to send the subscription again after the token changes).
- **Is it sound?** Yes: the token travels by the same route as the page load and the existing 403 retry, from the same origin only.
- **Cost:** `invalidateAll` runs `+page.ts` again, so `installPageConfig` raises the configuration generation once (`install.ts:27`) and every catalog reader re-renders once.

**A page-side form that also covers Chrome:** reconnect, or a 403 in `postTerminal` or `postCommand`, re-runs the load first. That is `socket.svelte.ts`, `pty-io.ts` and `writes.svelte.ts`, all outside O30's write list. By scope it is a different concern: browser tabs after any server restart.

### B1
`origin` follows every listen of the app's own server: `app.ts:224`, registered before `await forked.started`, so it is set before `:235` reads it. With no own server (after Open a Window, `app.ts:261`), `follow()` updates only `entry.origin` (`windows.ts:137`), and `origin` keeps the first port. This is Spec S-a.

### B2
- **The shape:** `{ admitted: false, held: null }` is answered for a sender the bridge refuses or for invalid arguments (`bridge.ts:99-102`), and for no answer at all (`preload.cjs:29`).
- **What the page does with it:** writes nothing, records nothing and runs nothing again (`storage.ts:178-185`). The change stays in memory and is written by the next admitted save, because `known` is unchanged.
- **My judgment:** it is an internal shape between the app's own preload and its own page, with no other reader. It is the right refusal for item 3. I found no path where a legitimate page gets it.

### B3
- No fixed time is left: `grep setTimeout|CONFIRM|setInterval` over `saved/`, `layout.svelte.ts` and `open/float/` prints only `Date.now()` stamps.
- **How a lost entry comes back:** `putBack` is driven by the `storage` event for `WRITES_KEY`. A window's entry can only be lost through another window's write, and that write fires the event in the window that lost it. So every loss is followed by the signal that repairs it.

### `start.test.ts` (P3)
- **It waits on signals only:**
  - `printed` uses the streams' `data` and the child's `close` (`:139-164`).
  - `ended` is the `exit` event (`:117`).
  - The Quit row reads the code from `await running.ended` (`:245`).
  - There is no `wait()` and no polling.
  - The `slow` tag is at `:10`.
- Its defects are under Proof P-b.

### Item 9, every added test by file and title
- **`tests/server/desktop/window-guard.test.ts` (G47):**
  - 'sends each address where the link decision says'
  - "answers the bridge only from the top frame of the server's page"
  - "grants clipboard and full screen to the server's page alone and denies every other ask"
  - 'makes every window with Node integration off and isolation and the sandbox on, subframes included'
- **`tests/server/desktop/start.test.ts` (G48):**
  - 'brings the running app forward on a second start and starts no server'
  - 'starts no server when another program holds the port, and names the port'
  - 'stops the server process on Quit and leaves every tmux session running'
  - 'prints the port in use and exits 1 when the server cannot listen'
  - 'asks the default port, passed as a held scratch port, whether an oculus answers there when no local.yml names a port, and starts no second server'
- `tests/server/desktop/app-harness.ts` is a support module and holds no test.
- `git status --short -- tools/oculus/tests` lists no other untracked test, and the changed existing test files add no test.
- `tests/ui/controls/text/text-menu.test.ts` and `tests/state/workbench/drag-outside.client.test.ts` are gone (`ls`: No such file).
- Every title matches the brief exactly.

### `Source.svelte` at 531 lines
It was over the limit at the base (528). The spec requires a step that changes such a file to split it by concern; the builder deferred that, which is a deferral (Standards St-a). Main is now 520 after D44 rewrote the file, and O30 adds three lines (`:154`, `:468-469`), so main reaches about 523. I did not run the cherry-pick, and the hunks may conflict with D44's rewrite.

### The case 27 drag
I found no race in the message order. `receive` in the target runs synchronously:
- it sets the drag state;
- it dispatches a `pointermove` on `document.elementFromPoint`, and `bodyHover` (`PaneBody.svelte:246-262`) reads the state synchronously;
- it then calls `end()`.

The fault is in the answer. `DROP_OUTSIDE` answers `true` as soon as the main has sent `drop-here` (`bridge.ts:128-147`), before the target has done anything. The source then does nothing (`drag.svelte.ts:200-206`). When the point maps to no pane handler in the target, nothing moves and no window opens: the target's title bar, its border, or a point the conversion places outside the viewport (`desktop-windows.svelte.ts:16-19,29`). That fits the one drag that "left Search in main". See Behaviour B-a.

### Breakage code
I grepped every added line of the diff and every untracked file under `tools/oculus/src` and `tools/oculus/tests` (5134 lines) for `mutat|revert|inject|fault|sabotag|break(ing)? (the|it)|remove(d)? the (code|check)`. Nothing matched.

## Verdicts per O30.md item, the whole diff

| Item | Verdict | Basis |
| --- | --- | --- |
| 1 (with 1.1 to 1.3) | holds, except S-a and S-b | 1.1 `login-env.ts`, `app.ts:294-300`; 1.2 `health.ts`, `app.ts:244-266`; 1.3 `args.ts`. G48 rows not run. |
| 2 | holds | `app.ts:64-68`, `:164` |
| 3 | holds | `windows.ts:161-178`, `:275-285`; G47 rows 3 and 4 pass |
| 4 | holds by reading | `windows.ts:180-211`, `:297-320` |
| 5 | holds | G47 row 1; `windows.ts:163-173` |
| 6 | holds | The full screen role is not verified |
| 7 | holds | `desktop.yml:26`, `HELP.md:63-68,103` |
| 8 | holds | With B-a and B-b |
| 9 | holds by reading | The real sheet is for the look |
| 10 | holds | As the cases ruling item 1 rules |
| 11 | holds | As the cases ruling item 2 rules |
| 12 | holds | |
| 13 | holds | |
| 14 | holds per run r21 | I did not package this round |
| 15 | holds by file presence | The look judges the drawing |
| 16 | holds | With Standards St-c; G25's diagrams test passes in my `tests/checks` run |

## Verdicts per case

Cases marked "not verifiable" need the app's windows, so they cite the report's run.

| Case | Verdict | Basis |
| --- | --- | --- |
| 1 | not verifiable | report run |
| 2 | met per run r21 | not verifiable by me |
| 3, 5, 6, 8, 10, 11, 13, 15, 22, 23, 26, 28, 34, 36, 38, 40, 42, 43, 44 | not verifiable | report runs |
| 4, 7, 32, 33 | not verifiable | G48 rows not run after the rewrite |
| 9 | met per run | case 9 stub run |
| 12 | met per run r25 | holds by reading |
| 14, 16, 17, 41 | met per runs | r06 to r08, r14 to r16, r22 to r24 |
| 18, 29, 30 | met | G47 rows pass |
| 19 | partial | as in the first review |
| 20, 39 | not verifiable | the look |
| 21 | partial | full screen, Monaco's edit keys and the terminal's keys not shown |
| 24 | met per run r19 | |
| 25 | met by reading | `windows.ts:174-177` |
| 27 | partial | one failed drag, unsettled; B-a |
| 31 | not verifiable | the look |
| 35 | met per run r03 | |
| 37 | met | callers green in my run |

## Findings

### Spec

**S-a. `origin` is stale after a port move of a server the app did not start.** Size: small, landing fix.
- **Where:** `src/desktop/app.ts:111`, `:158-162`, `:182-184`, `:261`, with `src/desktop/windows/windows.ts:131-139`.
- **The hunk:** `origin = \`http://${LISTEN_HOST}:${port}\`` is set at `:261` and only updated by the own server's `onListening` (`:224`). `follow()` sets `entry.origin` alone.
- **Failure:** do case 6's Open a Window, then case 42's move to 8798. Close every window, then click the Dock or choose File > New Window. The window loads `http://127.0.0.1:8797/`, where nothing listens or another program now does; that second state is the B1 failure 2 the first review described.
- **Fix:** add a `followed(origin)` dependency to `WindowsDeps`, called in `follow()` for a main entry. App.ts sets `origin` when `server === null`. This is `windows.ts:49-57,131-139` and `app.ts:117-123`.

**S-b. Restart reloads each window at its old address.** Size: small, landing fix.
- **Where:** `src/desktop/app.ts:234`.
- **The hunk:** `for (const entry of windows.entries()) entry.win.webContents.reload();`
- **Failure:** the server dies, the reader changes `port` in `local.yml`, then presses Restart. The new server listens on the new port and every window reloads the old one, showing an error page, while `entry.origin` stays old.
- **Fix:** load `${origin}/` plus each window's `?float=` query, and set `entry.origin`. For example, a `reloadAt(origin)` in `windows.ts` beside `searchOf` (`:142-144`), with `app.ts:234` calling it.
- **Also:** the reload itself is the open item above, which goes to Axel.

**S-c. `context.ts` writes inside the range the brief kept for A3.** Size: small; merge note only.
- **Where:** `src/lib/state/client/context.ts`, base `:458-459`. The hunk `return {` + `desktop,` falls inside `:458-504`, which the brief kept off-limits.
- **Failure:** a conflict at the landing of whichever of O30 and A3 lands second, if A3 also inserts at the top of the returned object. The resolution is to keep both lines.

### Proof

**P-a. Two tree checks are red, and the report says every command passed.** Size: small, landing fix.
- **Where:** `src/desktop/decide/window-file.ts:3-4`, and `src/lib/state/shared/install.ts` with its importers `src/routes/+page.ts:1` and `src/routes/find/+page.ts:1`.
- **What is wrong:** the round's verify ran only `test:quick`, which leaves out `tests/checks`. `npm run test:landing` fails on `comment-width` and on `order` (two rows).
- **The width fix:** rewrap `window-file.ts:1-4` as a paragraph at 100 columns.
- **Options for placing `install.ts`:**
  - (1) A folder of its own, such as `state/shared/page/install.ts`, with `'state/shared/page'` added to `INNER` above `words` (`tests/checks/imports/order.ts:100`). This is the registration of a new folder, not a loosening.
  - (2) Move `installPageConfig` into `words/appearance.ts`. That module imports `text.ts` and `generation.svelte.ts` already, and `tones.ts` imports neither of them back, so there is no cycle; but the concern fits poorly.
  - Putting it in `words/` as its own file makes 11 items there, and `folder-check` refuses that.
  - I recommend (1).

**P-b. `start.test.ts` was rewritten and never run. By reading it has three defects.** Size: medium; raise it.
- **The cleanup can hang.** It sends SIGTERM and awaits `exit` with no fallback (`:119-124`). Rows 2 and 5 end with a dialog of no window still on screen, and `dialogs.ts:16-17` itself says such a dialog "holds the whole app's event loop until it is answered". If it does, the SIGTERM handler (`app.ts:71`) never runs and the cleanup hangs until `afterEach`'s 60 s limit (`:45-47`), leaving Electron and its dialog on screen. Not verified; the round 0 cleanup had a fallback.
- **One Quit check cannot fail.** The Quit row's `expect(serversOf(main)).toHaveLength(0)` (`:247`) runs after the main process has exited. An orphaned utility process then has parent 1, so `serversOf(main)` finds nothing whether or not the server still runs; only the port check (`:246`) tests anything. Small fix: read the server's pid at `:242`, then after `exit` check that `process.kill(pid, 0)` throws `ESRCH`.
- **It shows windows on the screen.** Every row that starts the app shows its window (`windows.ts:274`), and row 1's second start calls `show()`, which calls `win.focus()` (`app.ts:151-155,164`). `npm run test:landing` runs `test:slow` (`tests/tiers/landing.mjs:33`), so the landing run on Axel's machine will open oculus windows and take focus.
- These are for the orchestrator to settle before running the landing list.

**P-c. Z597 asked for a run per deleted behaviour; some have none.** Size: small; goes to the look.
- `wordAt`'s outcomes for punctuation, an apostrophe inside a word and the pointer on a space have no quoted run. Case 23 shows a word at the start and a correctly spelt word at the end.

**P-d. Case 21's terminal keys were not run.** Size: small; goes to the look. Run r26 reached no terminal, while r12 typed into a terminal in the same harness, so this is a missed run, not a limit.

**P-e. The report's opening lines are stale.** Size: small, landing fix. Lines 1 and 3 of `O30-report.md` still say that case 12's scroll clause is NOT met and hold the open decision. The repair round section after line 653 contradicts both, and a report's first line must state the current end state. The orchestrator fixes this when saving the report.

**P-f. A visible change of S1 is missing from the before/after section.** A source tab now reopens at its saved first line after a reload or a remount, in Chrome too. Before, it opened at the top. The look should be told.

### Standards

**St-a. `Source.svelte` is 531 lines, over 520.** Size: medium; raise it.
- The report gives "belongs to the work that splits it on main" as its reason, which is a deferral.
- On main the file is 520, so the landing adds three lines over the limit. Not run.
- Options: split one concern out of main's `Source.svelte` at landing, or have this step's lines reach the editor another way. Moving its props onto one line is not an option, because the spec forbids compacting code to get under the limit.

**St-b. The round brief's process was broken.** The builder ran a git command again (`git -C . rev-parse`, round report St9 row) and started the app seven times where the brief said once. Both are already recorded in the state file.

**St-c. One clause in HELP.md:353 is imprecise.** Size: small, landing fix.
- "the app hands it the environment of the login shell" holds only for a start from the Dock.
- `DESIGN.md:396` says it correctly: the inherited environment from a terminal, and on a timeout.
- Add one clause.

### Behaviour

**B-a. A drop handed to another window is answered before it lands.** Size: medium.
- **Where:** `src/desktop/windows/bridge.ts:128-147`, `src/lib/shell/desktop-windows.svelte.ts:16-19,27-31`, `drag.svelte.ts:200-206` and `receive`.
- **What is wrong:** `true` is returned once `drop-here` is sent. `windowAt` reads `win.getBounds()`, which includes the title bar.
- **Failure:** release a tab over another oculus window's title bar or border. Nothing moves and no window opens. This is the probable cause of case 27's failed drag.
- **Smallest landing fix:** use `getContentBounds()` at `bridge.ts:136`, so a point on the title bar or border counts as no window and the source opens a new window there.
- **What stays:** the target never says whether it took the drop. Fixing that is a round trip from the target page and is not a landing fix.
- **Zoom (not verified):** the conversion mixes `window.outerHeight` (device points) with `innerHeight` (CSS pixels, `:18`). With a window zoom other than 1, the drop point may land off target.

**B-b. S1 writes the whole UI record on every line a scroll passes.** Size: small, landing fix.
- **The path:** `commands.ts:68-93` (`followFirstLine`) feeds `Source.svelte:469`, then `source.svelte.ts:424-426`, then `updateDraft`, then `ui.setInstanceState`, then a synchronous `JSON.stringify` and `setItem` of the UI record (`ui.svelte.ts:517-525`).
- The record holds every source draft's text and its saved copy, and each write fires a `storage` event that every other page of the origin parses (`takeSavedInstances`), Chrome tabs included.
- **Failure:** a fast scroll through a long file causes tens of record writes a second in every window. Not measured.
- **Fix:** in `followFirstLine`, say the line once the scroll has rested (a trailing timer) instead of on each change.

## Declined to judge
- **`npx vitest run tests/server/desktop/start.test.ts`:** it starts Electron and row 1 brings a window forward.
- **The cases that need the app's windows.** These are:
  - 1, 3 to 11, 13 to 17, 19 to 24, 26 to 28, 34 to 36 and 38 to 44;
  - the runs r02 to r26;
  - the icon's drawing;
  - the full screen role;
  - the real folder sheet.
- **Electron's behaviour, which needs the app running:**
  - whether SIGTERM ends the app while a dialog of no window is up;
  - whether `MouseEvent.screenX` is scaled by the page zoom.

## Usage
Served model claude-opus-5-5; my tokens, tool uses and time are not known to me.
