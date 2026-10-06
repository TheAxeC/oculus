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

# Repair round 2, refuted

**Repair round 2, refuted.** I changed nothing in the worktree or the ledger, invoked no skill and started no agent. The only git commands I ran were `git diff b5299f4e5` and `git status --short`, from inside the worktree. I never started the app and never took focus. I ran no curl, touched neither port 8787 nor port 8790, and never opened `config/local.yml`.

One command I meant to run in the foreground (a `find` over `/private/tmp/claude-502`) went over the 120 s limit and was moved to the background. I stopped it with TaskStop. Its partial output gave the builder's run folder, which sits in this session's scratchpad (`scratchpad/cases/r27.*`, `scratchpad/o30-look/app.log`). I read those files and did not change them.

## Summary
- **Item 5 (Source.svelte) is not met once the step lands.** The two files the builder split out, `save/LockedCode.svelte` and `save/locked-words.ts`, are byte for byte the files D44 already landed on main. A three-way merge of the file, computed in my scratchpad, gives 523 lines on main. The limit for a component is 520.
- **Z606 is built on the page side, with no bridge event.** The socket's reconnect re-runs the page load before it subscribes again, and `postTerminal` and `postCommand` re-run the load and retry once after a 403. A Chrome tab therefore recovers the same way the app's windows do.
- **Three behaviour defects come with Z606 (B2-1 to B2-3).**
  - Two token renewals that overlap can resolve without the new token being installed. The socket's subscription then carries the stale token, and the socket stays unable to write until the next reconnect.
  - Every reconnect now holds its subscription back for the length of a page load, so keys typed in that gap are lost without any sign.
  - After a Restart on another port, `moveTo` loads each window at the new address without carrying the arrangement or the unsaved text.
- **The typed line in an open terminal after a Restart is still unexplained.** The app's own log rules out the token check as the place it was dropped in run r27.
- **Two document sentences are now false.** One is at `appearance.ts:89`, the other at `DESIGN.md:396`.

## Verification (rerun by the reviewer, from the worktree's tools/oculus)

```
$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH bash ~/.claude-work/skills/land/templates/checks.sh .../orchestrator-state.md
ok      ASCII gate (0.6 s)
ok      prettier (1.4 s): All matched files use Prettier code style!
ok      svelte-kit sync (2.0 s)
ok      eslint (7.5 s)
ok      svelte-check (95.4 s): 1791247179507 COMPLETED 378 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (242.6 s): Duration  239.12s (...)
test:quick: 243.3 s (limit 45.0 s); every command passed
test:quick: over the time limit
checks: 1 commands passed
(uptime at the end: load averages 56.54 41.18 26.78; another agent's vitest and a diagnose tree were running)

$ npx vitest run tests/checks            (the round brief's form, default 5 s limit)
Test Files  4 failed | 12 passed (16) / Tests  7 failed | 222 passed (229)
every failure "Test timed out in 5000ms" (html-sites, size and order rows among them)

$ npx vitest run tests/checks --tagsFilter '!slow' --testTimeout 0 --hookTimeout 0   (test:checks' own flags)
Test Files  1 failed | 14 passed | 1 skipped (16) / Tests  2 failed | 224 passed | 3 skipped (229)
FAIL diagrams.test.ts > ... are named stale, every one at once ... : Test timed out in 60000ms
FAIL diagrams.test.ts > ... reads a label node by the box Graphviz drew ... : Test timed out in 30000ms

$ npx vitest run tests/checks/imports/order.test.ts tests/checks/diagrams/diagrams.test.ts --testTimeout 0 --hookTimeout 0
Test Files  1 failed | 1 passed (2) / Tests  2 failed | 56 passed (58); the same two diagrams rows, timed out at their own 60 s and 30 s limits; order.test.ts all 13 pass (load 28 to 46)

start.test.ts: not run (it starts Electron).
sh utils/folder-check.sh: no output, exit 0
node --check src/desktop/preload.cjs: exit 0
perl ASCII gate over src tests config: prints nothing, exit 0; LC_ALL=C grep over HELP/README/DESIGN/package.json/graphs.mjs/app-icon.svg: exit 1
awk 'length>100' src/desktop/decide/window-file.ts: nothing
sh utils/unused-exports.sh vs O30-base/unused-exports.txt: "Unused exports (256)" vs 255; added parent.ts: parentOf, askParentToPick and type ParentPort; engineDir and DEFAULT_PORT gone. Matches the report.
wc -l src/lib/views/sources/source/Source.svelte: 509 (worktree); main's: 520
```

The diagrams rows are in `diagrams.test.ts`, a file the step does not change. Under spec.md "Verify before you report" they are not counted against the step. Its other 43 rows, the committed-diagrams match among them, pass.

## Verdicts per round 2 item
1. **Z607, start.test.ts: holds, by reading.**
   - The harness (`app-harness.ts:16-25`) replaces `show`, `showInactive`, `focus` and `moveTop` on `BrowserWindow.prototype`, and replaces `dialog.showMessageBox` with a promise that never resolves.
   - Windows are made with `show: false` (`windows.ts:271`).
   - The cleanup waits on `exit`, then after `GRACE_MS` ends the servers and the app by their pids (`start.test.ts:132-146`).
   - The Quit row reads the server pid before Quit (`:274-276`) and checks `ESRCH` after `exit` (`:281`).
   - The `slow` tag is at `:13`.
   - I did not run the file.
2. **Z606: partial.**
   - What is built is the page-side mechanism, with no bridge event: `socket.svelte.ts:215-229`, `writes.svelte.ts:159-163,177-186,523`, `pty-io.ts:130-143`, and `app.ts:234-241`, which reloads no window.
   - The typed line is not shown (P2-1).
   - Defects B2-1, B2-2 and B2-3 come with it.
3. **S-a: holds, by reading.** `windows.ts:57-58,142`; `app.ts:123-125`. Not run.
4. **P-a: holds.** `window-file.ts` has no line over 100 columns; `state/shared/page/install.ts` exists; `order.ts:100-105`; the order check passes with test:checks' flags.
5. **St-a: violated.** See S2-1.
6. **B-a: holds.** `bridge.ts:142` uses `getContentBounds()`; the target answers through `DROP_TAKEN` (`bridge.ts:166-170`, `desktop-windows.svelte.ts:31`); the drop and the title-bar release are in r27.out. B2-4 remains.
7. **B-b: holds, by reading.** `commands.ts:68-113` uses a trailing timer of `SCROLL_REST_MS = 200`.
8. **St-c: holds.** HELP.md:353.
9. **P-c and P-d: holds as reported, for the part I checked.**
   - r27.out shows the punctuation outcome: `["receive","relieve",...]`.
   - The apostrophe and space outcomes are quoted from r28 and r29, which I did not open.
   - Cmd+X and Cmd+Z are reported as observed, not as a pass.
10. **P-e and P-f: partial.** The first line and the before/after row (report :639) are current. Two stale lines are left (P2-3).

## The points the brief asked me to check
- **Z606.**
  - The builder built the page-side form. `grep` of `src/desktop` finds no restart event.
  - A Chrome tab runs the same `socket.svelte.ts`, `writes.svelte.ts` and `pty-io.ts`, so by reading it recovers its token on any reconnect, with B2-1 and B2-2.
  - The new shapes: `renewToken` is an internal method of the writes store. `DROP_TAKEN` and `answerDrop` are a channel between the app's own preload and its host, as `SAVE_LAYOUT` is. `Windows.moveTo` and `WindowsDeps.followed` are internal to the host. None is a user-visible shape. The 200 ms rest and the harness, which the report lists as "wire shapes", are not shapes at all.
- **The typed line after a Restart.** P2-1 below gives what a read settles and what it does not.
- **start.test.ts.**
  - No window can show through any call the app makes in the five rows. `maximize` and `setFullScreen` (`windows.ts:326-327`) run only with a saved `window.json`, and the scratch HOME has none.
  - The cleanup has its fallback.
  - The Quit row checks the pid.
  - The `process.stderr.write` at `:156` prints the recorder's record once per app run and asserts nothing. It carries the record that item 1 asked the report to quote. It shows only which recorded calls were made; it cannot see a path the recorder does not replace.
  - Each app start runs `vite build` (`app.ts:284-294`), so the file rebuilds `build/` four times per run. That cost is known; I raise no finding on it.
- **The 200 ms timer.** It is product code, a trailing debounce of a scroll that has no "scroll ended" event. No test exists for it (`grep -rn followFirstLine tests` prints nothing), and no test waits on it. It is not the case spec.md's rule on test timing covers.
- **The Source.svelte split.** It is sound as a split: the derived value, the markup and the style moved together, and Svelte draws the two elements straight into the parent grid. In the worktree the file is 509 lines. On main the split already exists, so it removes nothing there (S2-1).
- **The order-check timeouts.**
  - No slow tag is needed.
  - `test:checks` and the landing list run `tests/checks` with `--testTimeout 0 --hookTimeout 0` (`package.json:14`).
  - `order.test.ts` passes under those flags in my run.
  - The 5 s timeouts come only from the round brief's own form, `npx vitest run tests/checks` without those flags.
  - The rule at `orchestrator-state.md:108` is for a red at landing, which this form never produces.
- **Breakage code.** I grepped every added line of the diff and every untracked file under src, tests and config for `mutat|revert|inject|sabotag|\bfault|break(ing)? (the|it)|remove(d)? the (code|check)`: 0 hits. The hits on `default` from a first, looser pattern were false.

## Verdicts per O30.md item (the whole diff)
- **1:** violated by B2-3 (Restart onto another port) and P2-1 (typing after a Restart unverified).
  - 1.1 holds: `login-env.ts`, `app.ts:300-306`.
  - 1.2 holds: `health.ts`, `app.ts:250-272`.
  - 1.3 holds: `args.ts:12-37` follows Z598.
- **2:** holds (`app.ts:64-68,161-167`).
- **3:** holds. G47's window options row; `windows.ts:174-191`.
- **4:** holds by reading.
- **5:** holds. G47 row 1; `windows.ts:104-110`.
- **6:** holds by reading; the full-screen role is not verified.
- **7:** holds.
- **8:** holds, with B2-4.
- **9:** holds by reading; the real sheet goes to the look.
- **10:** holds, as the cases ruling's item 1 rules.
- **11:** holds, as the cases ruling's item 2 rules.
- **12:** holds.
- **13:** holds.
- **14:** holds per the earlier packaging runs; not rerun this round.
- **15:** holds by the files being present; the drawing goes to the look.
- **16:** violated by St2-2 (DESIGN.md:396).

## Verdicts per case
- **Not verifiable without the app's windows** (the report's runs stand):
  - 1, 3, 6, 8, 10, 11, 13, 15, 22, 23, 26, 28, 34, 36, 38, 40, 42 to 44: the report's runs.
  - 4, 5, 7, 32, 33: G48 rows, read and not run by me; the report quotes 5 passed.
  - 20, 31, 39: the look.
- **Met:**
  - 2, 9, 12, 14, 16, 17, 35, 41: met per the earlier runs (unchanged this round).
  - 18, 29, 30: met (G47 rows, in the checks run).
  - 25: met by reading.
  - 27: met per r27.out (Search moved into the popped-out window; the title-bar release opened window 3).
  - 37: met (the callers are green in the checks run).
- **Partial:**
  - 19: as in the earlier reviews.
  - 21: Monaco's edit keys, full screen, and the terminal's Cmd+X and Cmd+Z are not shown.
  - 24: Restart is shown without a reload, but typing after it is not (P2-1).

## Findings

### Spec
- **S2-1. Source.svelte is 523 lines once the step lands; item 5 is unmet.**
  - **Where:** `src/lib/views/sources/source/Source.svelte:99-100,154,467-468` in the worktree, against main's `Source.svelte` at 520 lines.
  - **The hunks:** `+ import LockedCode from './save/LockedCode.svelte'; + import { lockedWords } from './save/locked-words';`, then `+ setSourceFirst,`, `+ first={draft.first}` and `+ onfirst=...`.
  - **The evidence:**
    - `diff` of main's `save/LockedCode.svelte` and `save/locked-words.ts` against the worktree's prints nothing; both came in with D44 (297349683).
    - `git merge-file -p` (ours = main, base = O30-base, theirs = worktree) gives one conflict, at those two imports, and 528 lines. Resolved to main's side, that is 523.
  - **What is wrong:** the round brief asked for "at or under 520 lines with this step's lines in it". Main is 520 before the step's three lines.
  - **Failure:** the size rule (spec.md, "What every package obeys") is broken on main.
  - **Size:** not small. At landing, one more concern has to move out of main's `Source.svelte`, by the orchestrator's judgment, or this is raised. Verdict: item 5 violated.

### Proof
- **P2-1. The typed line after a Restart is not shown, and the run cannot tell where it was lost.**
  - **The run:** `cases/r27.sh` pastes with `keys.mjs ... "cmd+v=paste"` after the Restart. r27.out shows `pane:  words|kept words|axelfaes@YQ530VVFGK hub %|`. The `kept words` line came from `tmux send-keys`, not from the page.
  - **The control exists from round 1.** r12.out shows the same paste route putting `hello world` in a pane, on the round 1 tree.
  - **What a read settles: the drop was not at the token check.**
    - A keystroke from a socket that never carried the token is dropped at `channel.ts:497-499`, which prints `pty: input on <channel> from a socket without the write token`.
    - Server stderr reaches the app's log (`process.ts:94`, and the log's `[server] sessions watch` lines are stderr).
    - `grep -c "pty" scratchpad/o30-look/app.log` prints 1, a build line. No such refusal follows the second `[server] oculus on http://127.0.0.1:8819` line.
  - **The places that remain.** The keystroke was either:
    - never sent by the page: `socket.send` returning false (`socket.svelte.ts:163-166`), `order.hold` holding it behind a grid attach (`pty-wire.ts:39-40`), or xterm producing no `onData`; or
    - dropped without a log at `channel.ts:501`, because the new socket was not attached to that terminal's channel. That happens when the channel left `channels` through `unsubscribePty` on a grid close (`TerminalGrid.svelte:386`).
  - **A lead in the run's own output.** The page's shell tabs read `["7d3624-shell"]` before the Restart and `["44e39f-shell"]` after New Terminal, while tmux still lists `oculus-7d3624-shell`. Whether the focused `.xterm-helper-textarea` at the paste belonged to 7d3624's grid is not recorded.
  - **The probe that settles it**, in one start:
    1. After the Restart, read in the page which terminal the focused grid shows, its `pty:` channel, and `socket.status()`.
    2. Paste once.
    3. grep the app log for `pty: input on`.
    4. If nothing is logged, compare the server's attached set for that terminal, or read whether the page's reconnect subscription named that channel.
  - **Size:** cause unknown, so not a landing fix. HELP.md:13 says the open windows keep "their running terminals" after a Restart, and a reader will take that to include typing into them.
  - **Verdict:** item 2 partial, case 24 partial.
- **P2-3. Two report lines contradict the end state.**
  - `O30-report.md:645` still marks cases 14, 17, 21 and 41 "not verified". Rounds 1 and 2 ran 14, 17 and 41, and parts of 21.
  - `:649` still says "Case 12's scroll clause cannot be met ... (open decision, first line)".
  - **Failure:** a reader of the "wrong or impossible" section takes S1 as open.
  - **Size:** small; fix when the orchestrator saves the report. Verdict: item 10 partial.

### Standards
- **St2-1. A doc comment names a test that no longer exists.**
  - **Where:** `src/lib/state/shared/words/appearance.ts:89`: " * function of its arguments; tests/server/desktop/window-guard.test.ts reads it through `themeFor`."
  - **What is wrong:** that test was deleted under Z597. `grep -rn themeFor tests` prints nothing, and window-guard's four `it(` titles do not touch it.
  - **Failure:** a reader believes the app's dark start is guarded by a test.
  - **Size:** small, landing fix: drop the clause.
- **St2-2. DESIGN.md:396 says something false about the built server's arguments.**
  - **Where:** DESIGN.md:396: "the built server takes `--engine <dir>` ... and any other argument is refused naming it."
  - **What is wrong:** `--default-port` is accepted (`process/args.ts:19,52`). Z596 named it in HELP.md:353 and README.md:11, and this paragraph, which the step itself rewrote, still says otherwise.
  - **Failure:** a reader of DESIGN thinks `--default-port` is refused.
  - **Size:** small, landing fix: one clause naming `--default-port <n>`. Verdict: item 16 violated.

### Behaviour
- **B2-1. Two overlapping token renewals can leave the socket unable to write.**
  - **Where:** `socket.svelte.ts:223-229` and `writes.svelte.ts:159-163`.
  - **What is wrong:**
    - `renewToken` is `invalidateAll(); tick()`.
    - Kit's `_invalidate` (`node_modules/@sveltejs/kit/src/runtime/client/client.js:417-423`) returns at once for a second call batched into the same microtask.
    - At `:453` it returns without applying the data when a later invalidation took the token.
    - In both cases the caller resolves with the old token still installed. The `.catch(() => undefined)` path does the same.
  - **The consequence:**
    - The socket's subscription then carries the stale token, and the server never adds that socket to `#writable` (`channel.ts:482`).
    - Every keystroke is refused with the log line until the next reconnect.
    - Nothing sends the subscription again when the token changes later: only `+page.svelte:84-86` sets it.
  - **Failure:** the server restarts while the page also renews from a 403, for example New Terminal or a `capture` posted as the `sessions` push arrives. New Terminal works, but typing into every open terminal of that page is refused. This is not the cause in r27 (P2-1).
  - **Size:** small, landing fix. The socket sends its subscription again whenever the token it last sent differs from `writes.writeToken()`, after any `setToken`. That is about ten lines in `socket.svelte.ts`, with the run at the look. Verdict: item 2 partial.
- **B2-2. Every reconnect holds its subscription back for a page load, and keys typed meanwhile are lost.**
  - **Where:** `socket.svelte.ts:211` sets `status = 'open'`; the subscription goes out only after `renewToken` (`:223-229`), and `send` returns true in between (`:163-166`).
  - **Before:** the subscription went out in the `open` handler itself.
  - **The consequence:**
    - Every reconnect, a reconnect to the same server process included (dev reload, sleep and wake), now waits a whole page-data load before subscribing.
    - Keystrokes in that gap reach a socket the server has not admitted, and are refused with a log line while the page shows nothing.
    - Each reconnect also re-runs `installPageConfig`, which raises the config generation, so every catalog reader draws again.
    - Z606 asks for the renewal "on reconnecting to a new server process".
  - **Failure:** the laptop wakes, the reader types at once into a terminal, and the first characters are gone.
  - **Size:** small, landing fix: send the subscription in the `open` handler as before, and send it again after the renewal only when the token changed. That is the same change as B2-1. Verdict: item 2 partial.
- **B2-3. A Restart onto another port loads windows without their arrangement and unsaved text.**
  - **Where:** `windows.ts:146-152` (`moveTo`) and `app.ts:239`: `void entry.win.webContents.loadURL(\`${origin}/${searchOf(entry)}\`)`.
  - **What is wrong:**
    - Storage is per origin. A page that follows a port move itself writes `LAYOUT_KEY` and `UI_KEY` into `window.name` first (`carry.ts:1-24`, `socket.svelte.ts:275-287`).
    - `moveTo` loads the new origin from the host, so nothing is carried.
    - HELP.md:13 says the windows keep "their unsaved text" and that a window on another port "loads its page from the new one".
  - **Failure:** the server dies, the port changes (a `local.yml` edit, or `local.yml` removed so the default port applies), and the reader presses Restart.
    - The main window opens on the new origin's empty storage: the shipped arrangement, with no unsaved drafts shown.
    - Each popped-out `?float=<id>` window finds no float and asks to be closed.
  - **Size:** medium. The host would send the page an event so the page carries its storage and then goes there, or the page follows on its own. Not a one-line landing fix; raise it or fix it at landing as the orchestrator judges. Verdict: item 1 violated.
- **B2-4. A drop handed to a window that does not answer is never settled.**
  - **Where:** `bridge.ts:152-163`. The promise settles only on `DROP_TAKEN` or on the target's `closed`.
  - **Failure:** a target page that is still loading has no `drop-here` listener yet (`desktop-windows.svelte.ts:28-33`), and a page that reloads or crashes never answers either. A tab released over such a window stays where it was, no new window opens, and the `waiting` entry is held until the target closes. Round 2's item 6 said the tab is never left where it was.
  - **Size:** small, landing fix: settle `false` when `webContents.isLoading()` at send time, and on the target's `did-start-navigation` and `render-process-gone`. Verdict: item 8 holds with this finding.

## Declined to judge
- `npx vitest run tests/server/desktop/start.test.ts`: it starts Electron. Whether macOS activates an Electron process that hides its Dock icon at `app-harness.ts:27` before `ready` can only be seen with the app running.
- Whether `process.kill(pid, 0)` can see a not-yet-reaped zombie of the server after the main exits (start.test.ts:281). That needs runs.
- Every case that needs the app's windows (listed above), the zoom conversion of a drop point, the full-screen role, Monaco's edit keys, and the real folder sheet.
- Why window 3 opened at 912,382 for a release at 980,282 (r27.out). It is likely the work-area clamp of `placeWindow`; settling it needs the display's work area.
- The two `diagrams.test.ts` timeouts. The file is unchanged by the step, and the load stayed between 28 and 56 throughout.
- Whether the time a test takes counts as cost under the rule that a test exists only where its failure costs something. That is the user's call.

Reviewer usage: agent id not known to me, claude-opus-5-5, tokens, tool uses and minutes not known to me.

# The brief prepared again after the back-out, refuted

## Step O30 refuter report (on .agents/worktrees/O30, base a977b2448)

Scope: items 17 to 20 and their cases, as the dispatch asked. Items 1 to 16 were not judged again.

## Verification (rerun by the reviewer)

```
$ (tools/oculus) PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude-work/skills/land/templates/checks.sh .../orchestrator-state.md
$ npm run test:quick
        tests/server/desktop/window-guard.test.ts: changed
        tests/server/desktop/start.test.ts: changed, run by npm run test:checks or test:slow
ok      prettier (0.3 s): All matched files use Prettier code style!
ok      ASCII gate (0.3 s)
ok      svelte-kit sync (1.2 s)
ok      eslint (1.5 s)
ok      svelte-check (4.9 s): 1791263055137 COMPLETED 379 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (10.3 s): Duration  7.78s (transform 14.47s, setup 0ms, import 21.92s, tests 7.17s, environment 82ms)
checks: 1 commands passed          (exit 0)
(start.test.ts is tagged slow; quick.mjs isSlow() and --tagsFilter !slow leave it out, so no app started)

$ npx prettier --check tests/tiers/landing.mjs tests/server/desktop/start.test.ts src/desktop/server/build.ts src/desktop/server/process.ts src/desktop/server/error-line.ts src/desktop/app.ts
All matched files use Prettier code style!     (exit 0)
$ npx eslint <the same six files>              (no output, exit 0)
$ LC_ALL=C grep -n '[^ -~]' <the same six files>   (no output, exit 1)
$ LC_ALL=C grep -c '[^ -~]' HELP.md DESIGN.md terminal.yml ReadAgainButton.svelte actions/read-again.ts sessions.ts channel.ts   (0 for each)
$ npx vitest run tests/checks/source/comment-width.test.ts tests/checks/source/history.test.ts
 Test Files  2 passed (2) / Tests  5 passed (5)

Commands the builder's report quotes as evidence:
$ grep -rn '^<<<<<<<\|^>>>>>>>' tools/oculus --include='*.ts' --include='*.svelte' --include='*.json' --include='*.md' --include='*.yml' --exclude=local.yml --exclude-dir=node_modules   (from the worktree root; no output, exit 1)
$ grep -rln '^<<<<<<<\|^>>>>>>>' tools/oculus/docs tools/oculus/package-lock.json   (no output, exit 1); find for *.orig / *.rej: none
$ npm install --offline --dry-run      up to date in 458ms; cmp package-lock.json against a copy taken before: identical
$ npx vitest run tests/checks/tree tests/checks/imports tests/checks/source tests/checks/diagrams tests/checks/config/config-folder.test.ts tests/checks/config/config.test.ts --tagsFilter '!slow' --testTimeout 0 --hookTimeout 0
 Test Files  13 passed (13) / Tests  195 passed (195)
$ sh utils/unused-exports.sh, diffed against .agents/worktrees/O30-base/unused-exports.txt
> src/lib/server/root/process/parent.ts: parentOf, askParentToPick
> src/lib/server/root/process/parent.ts: ParentPort
(config.ts and local.ts lose engineDir/DEFAULT_PORT, ssh.ts loses KILL_GRACE_MS; no line for error-line.ts; matches the report)

Item 20 against the landing's state (read only):
$ diff -rq --exclude=local.yml gate-O30/tools/oculus/{src,tests,config,docs/diagrams} O30/tools/oculus/{...}
Files .../src/desktop/app.ts ... differ
Files .../src/desktop/server/build.ts ... differ
Only in .../O30/tools/oculus/src/desktop/server: error-line.ts
Files .../src/desktop/server/process.ts ... differ
Files .../tests/server/desktop/start.test.ts ... differ
Files .../tests/tiers/landing.mjs ... differ
$ diff -q for package.json, package-lock.json, HELP.md, DESIGN.md, README.md; diff -rq utils, assets: all identical

Case 17.2 (the lane's line copied out of landing.mjs:29-30 with sed, a scratch npm first on PATH, removed after):
line: npm run check; c=$?; npm run build; b=$?; npm run test:slow; s=$?; [ $c -eq 0 ] && [ $b -eq 0 ] && [ $s -eq 0 ]
FAIL=[run test:slow] exit 1   calls: run check, run build, run test:slow
FAIL=[none]          exit 0   calls: run check, run build, run test:slow
FAIL=[run check]     exit 1   calls: run check, run build, run test:slow

Cases 18.x (scratch module under $TMPDIR: start.test.ts:41-46 and :173-209 copied verbatim with sed, a node -e child, lines collected as run() collects them; removed after):
18.1: rejected after 25 ms (0 ms after the dialog line): a dialog before "oculus on http://127.0.0.1:8817"; the output was: / [screen] dialog /
18.2: settled after 32 ms
18.3: settled after 25 ms
18.4: rejected after 27 ms: no line with "oculus on http://127.0.0.1:8817"; the output was: / something else /
one chunk, dialog first ('[screen] dialog\n<text>\n' in one write): settled after 25 ms
two chunks, dialog first (the text 300 ms later): rejected after 26 ms

Cases 19.x (node --experimental-strip-types on a scratch module importing src/desktop/server/error-line.ts; removed after):
19.1: "Error: Could not load /x/.svelte-kit/output/server/manifest.js: ENOENT: no such file or directory, open '/x/.svelte-kit/output/server/manifest.js'"
19.2: "Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'x' imported from /y.js"
19.3: "SyntaxError: Unexpected token '}'"
19.4: "done"      (and 'listen EADDRINUSE: ...' then 'done': "done")
19.5: "Error: b"

End state: ps -ax shows no Electron, src/server.ts, vitest or knip process of this review (only VS Code's crashpad handler); no o30rev* scratch left in $TMPDIR; git status --short still 127 lines, git diff a977b2448 --stat still "124 files changed, 6465 insertions(+), 1876 deletions(-)".
```

## Verdicts

Items of the brief's "What to build":

- 17: holds. `tests/tiers/landing.mjs:24-32` is one lane `'npm run check, then npm run build, then npm run test:slow'` running the three with `;` and red when any is red (case 17.2's runs); the separate `test:slow` entry is gone (`grep -n test:slow` hits only :25 and :29); the head comment (:3-12) gives the reason and lists the slow tests in the lane; nothing else in the file changed (diff against gate-O30).
- 18: violated. The code fails at once on a dialog line in the cases the brief names, but it settles on the text when a dialog line comes first and the text arrives in the same chunk (Spec 1), and the report does not quote the lines that show a dialog's message is printed before the recorder's line (Spec 2). No row's title or assertion changed (diff against gate-O30 touches `printed()` and its doc comment only).
- 19: holds. `src/desktop/server/error-line.ts` holds the rule once (`ERROR_LINE`, :10) behind one export, `errorReason()`. `build.ts:9,25,33,46` and `process.ts:13,80,95,115,117` use it. Cases 19.1 to 19.5 give the expected lines.
- 20: holds. The worktree equals gate-O30 in every compared path except the six files items 17 to 19 change. Each hunk of `O30-landing-fixes.diff` answers what item 20 names: terminal.yml, TerminalGrid.svelte and terminal-list.ts answer Z612; DESIGN.md:374 and HELP.md's terminal row answer Z619 and Z612; sessions.ts and channel.ts answer Z619; DESIGN.md:396 answers St2-2; appearance.ts answers St2-1; HELP.md:13, windows.ts `moveTo`, desktop-windows.svelte.ts, desktop.ts `'move-to'` and layout/index.ts `carryWorkbench` answer B2-3; bridge.ts answers B2-4; writes.svelte.ts, shapes.ts and socket.svelte.ts answer B2-1 and B2-2; the read-again move, ReadAgainButton.svelte and Source.svelte answer S2-1 and its merge, with `LockedCode` and `lockedWords` kept at Source.svelte:106,108; package.json and the lockfile keep both dependencies. The diagram hunks resolve the conflicts, and layer-shell's 8 to 9 is the new shell-to-state import that B2-3 brings. Source.svelte is 513 lines.

Cases of the brief's "Cases":

- 17.1: met. Reading `landing.mjs:21-40`: one entry runs check, build, test:slow in that order, and no other entry names `test:slow`.
- 17.2: met. The three runs above give exit 1, exit 0 and exit 1, each with all three calls.
- 18.1: met. Rejected 0 ms after the dialog line; the error holds the awaited text and the lines.
- 18.2: met. Settled.
- 18.3: met. Settled on the message printed before `[screen] dialog`.
- 18.4: met. The "no line with" error.
- 19.1: met. The `Error: Could not load ...` line.
- 19.2: met. The `Error [ERR_MODULE_NOT_FOUND]: ...` line.
- 19.3: met. The `SyntaxError: ...` line.
- 19.4: met. `done`.
- 19.5: met. `Error: b`.
- 20.1: met. The marker grep prints nothing, and there is no `.orig` or `.rej` file. The dry run's output cannot be rerun on the applied tree; the equality with gate-O30 stands in for it.
- 20.2: met. The `diff -rq` above lists only the files of items 17 to 19.

## 1. Spec

- `tests/server/desktop/start.test.ts:175-196`, quoted:
  ```ts
  const seen = (): boolean => lines.some((line) => line.includes(text));
  const asked = (): boolean => lines.some((line) => line.startsWith('[screen] dialog'));
  ... if (seen()) { stop(); done(); } else if (asked()) { stop(); fail(refused()); }
  ```
  - What is wrong: item 18 says the wait fails at once "when the app has asked for a dialog ... before the awaited text is printed", and the head comment (:167-169) says the same. The code checks only whether each line is present, never their order, and `seen()` wins.
    - When `[screen] dialog` and the awaited text arrive in one `data` chunk with the dialog first, or are both already in `lines` when `printed()` is called, the wait settles on the text.
    - The scratch run shows it: "one chunk, dialog first: settled after 25 ms" against "two chunks, dialog first: rejected after 26 ms".
    - The fix: compare the index of the first line holding `text` with the index of the first `[screen] dialog` line, and settle only when the text's index is lower. Case 18.3 still settles on that rule, since the message is printed first on the same stream.
  - Failure scenario: an app that hits an unexpected dialog while the server's relayed line is flushed in the same pipe write passes or fails the same row depending on how the pipe split the bytes. A row that should go red goes green on some runs.
  - Verdict: item 18 violated.
- `O30-report.md`, "The cases' first run" and the DONE table row 18: the line "18, `printed()` fails at once on a dialog | DONE | `tests/server/desktop/start.test.ts:165-209`, the head comment (:165-172) says both rules".
  - What is wrong: item 18's first bullet asks the builder to find where a dialog's message is printed and quote the lines that show it comes before the recorder's line. The report quotes none; only the head comment asserts it.
  - My read confirms the order, so the quote is missing and the order itself is right:
    - `src/desktop/dialogs.ts:24` `log(\`dialog: ${options.message}\`)` runs before `:32-35` `dialog.showMessageBox(...)`;
    - `app.ts:107-108` passes `print`, and `app.ts:51-53` prints a non-error line with `console.log`, which is stdout;
    - `tests/server/desktop/app-harness.ts:12-14,22-24` records `[screen] dialog` with `process.stdout.write`;
    - so both lines go on the one stream, in that order.
  - Failure scenario: the orchestrator at landing has no evidence for the premise that rows 2 and 5 rely on. If the message were printed on stderr, the order across two pipes would not hold, and those rows could fail at once on their own expected dialog.
  - Verdict: item 18 violated (the report part).
- `O30-report.md`, "Files changed": "why the tool reports them is not investigated" (the knip lines for `parent.ts: parentOf, askParentToPick` and `ParentPort`).
  - What is wrong: `agents/spec.md`, "The principles every package is judged on", asks the report to give, for each line the step added, what was done with it. The cause is known. knip takes package.json `main` (`src/desktop/main.ts`) as its entry and does not read `src/server.ts`, which imports all three at :16 and uses them at :45 and :58. The base list confirms it: it already flagged `engineDir`, which `src/server.ts` imported at the base. `agents/reviews/O30-refuter.md` (its verification item 4) says the same.
  - Failure scenario: a later cleanup reads "not investigated" as possibly dead code and removes `parentOf`. The server then stops reporting `listening` to the app.
  - Verdict: none (it concerns items 1 to 16's lines).

## 2. Proof

- None. Every command the report quotes reproduced, apart from the stubbed-electron run named under "Declined to judge". The report's timing for `test:quick` (31.7 s) differs from mine (12.0 s), and no decision rests on it.

## 3. Standards

- `O30-report.md` as a whole.
  - What is wrong: `agents/spec.md`, "What every package obeys", asks for two greps to be quoted in the report:
    - the history-word grep over the comment lines and test titles the step added or changed, with each hit judged;
    - after a rename, a grep of the name across `src`, `tests`, `config` and the three documents.
  - Neither is quoted. V4 runs `history.test.ts` only, and the documents grep covers `stderr|error line|last line`, not the renamed `last` field.
  - My greps:
    - three hits of "before" in `start.test.ts:169,171,179`, all the order of output lines and none history;
    - no stale `last` use of the renamed fields in src, tests, HELP.md, DESIGN.md or README.md.
  - Failure scenario: the orchestrator cannot check from the report that the rule was applied, and has to rerun both greps.
  - Verdict: none.
- `tests/server/desktop/start.test.ts:167` and `tests/tiers/landing.mjs:11`.
  - What is wrong: `agents/spec.md`, "What every package obeys", says an edited comment is rewrapped as a whole paragraph at 100 columns, so no line inside a sentence ends short.
    - `start.test.ts:167` ends at column 96 although the next word "(a" fits (99).
    - `landing.mjs:11` ends at column 95 although "this" fits (100).
  - Failure scenario: a reader sees a ragged comment, and a later rewrap of the paragraph shows up as an unrelated diff. A landing fix.
  - Verdict: none.

## 4. Behaviour

- None found beyond Spec 1. The report states before and after for both dialogs, the landing lane and the slow rows, and the lane time as added, not measured.

## Declined to judge

- Z627, whether the app's checkout build should write into folders of its own: it is Axel's open item. Item 17 removes only the landing's own collision.
- The report's run of `process.ts` under plain Node with `electron` stubbed by a resolve hook was not reproduced: it needs a scratch loader hook and a stub of `utilityProcess`. My judgment of the server side rests on reading `process.ts:80,95,115-117` and on running `errorReason()` directly with the 19.2 and EADDRINUSE streams.
- The slow rows of `start.test.ts`, the dialogs' look and the landing lane's wall time (826 s, added in the brief): each needs the app started, which the review may not do. They are the orchestrator's at landing.
- `patch -p1 -E --dry-run` output: it cannot be rerun on the applied tree. The `diff -rq` against gate-O30 shows the result.
- Items 1 to 16: outside this review's scope by the dispatch.

Reviewer usage: a1f7cd3cd58643a76, claude-opus-5-5, 260,959 tokens, 61 tool uses, 9.6 minutes.

## Repair round 1, refuted (the brief prepared again)

All five findings the round was sent with are closed. No fix goes beyond its finding, and no check was removed or loosened. This run raises two small findings about the report and none about the code. Both have verdict none and can be closed at landing by citing the reruns below.

The round's delta is this:
- It changed only `tests/server/desktop/start.test.ts` (`printed()` and its doc comment) and the head comment of `tests/tiers/landing.mjs`. Both files have mtime 07:11:25. `app.ts`, `build.ts`, `process.ts` and `error-line.ts` have mtimes from 06:39 to 06:41, before the round (`ls -l -T`).
- `diff -u` against gate-O30 shows the whole of items 17 and 18 after the round.

```
$ (worktree root) git status --short | wc -l            127
$ git diff a977b2448 --stat | tail -1                   124 files changed, 6562 insertions(+), 1844 deletions(-)
  (the same before and after this review)

$ diff -rq -x node_modules -x .svelte-kit -x build -x .git -x .scratch -x local.yml -x .DS_Store gate-O30/tools/oculus O30/tools/oculus
Files .../src/desktop/app.ts differ
Files .../src/desktop/server/build.ts differ
Only in O30/tools/oculus/src/desktop/server: error-line.ts
Files .../src/desktop/server/process.ts differ
Files .../tests/server/desktop/start.test.ts differ
Files .../tests/tiers/landing.mjs differ
(cmp of package.json, package-lock.json, HELP.md, DESIGN.md, README.md, vite.config.ts, tsconfig.json, .gitignore: identical)

From the worktree's tools/oculus, node at $HOME/.nvm/versions/node/v24.21.0/bin:
$ npx prettier --check tests/server/desktop/start.test.ts tests/tiers/landing.mjs src/desktop/app.ts src/desktop/server/build.ts src/desktop/server/process.ts src/desktop/server/error-line.ts
All matched files use Prettier code style!      prettier exit 0
$ npx eslint <the same six files>               (no output) eslint exit 0
$ LC_ALL=C grep -n '[^ -~]' <the same six files>  (no output) grep exit 1
$ npx vitest run tests/checks/source/comment-width.test.ts tests/checks/source/history.test.ts
 Test Files  2 passed (2)
      Tests  5 passed (5)
$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude-work/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md
        tests/server/desktop/start.test.ts: changed, run by npm run test:checks or test:slow
ok      ASCII gate (0.4 s)
ok      prettier (1.4 s): All matched files use Prettier code style!
ok      svelte-kit sync (1.8 s)
ok      eslint (1.7 s)
ok      svelte-check (4.9 s): 1791263827024 COMPLETED 379 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (10.4 s): Duration  7.60s (transform 13.93s, setup 0ms, import 21.51s, tests 6.85s, environment 74ms)
test:quick: 10.9 s (limit 45.0 s); every command passed
checks: 1 commands passed                        exit 0

Comment wrapping. A python3 probe compared each comment line with the first word of the next line:
landing.mjs:1-15 widths 95 97 95 94 97 95 9 | 2 | 97 100 100 13 | 2 | 96 76
start.test.ts:165-172 widths 3 100 94 95 99 100 10 3
no line inside a paragraph ends where the next word would fit within 100 columns

Cases 18.1 to 18.7:
- Scratch module under $TMPDIR/o30rr1-review: start.test.ts:41-46 (Running) and :173-204 (printed()) copied with sed.
- `diff <(sed -n 173,204p start.test.ts) <(sed -n 9,40p printed.ts)` printed nothing, so the copy is verbatim.
- Lines were collected as run() collects them (start.test.ts:119-121), with a `node -e` child per case.
- The scratch was removed afterwards.
18.1 dialog line, then nothing for 30 s: rejected after 24 ms (0 ms after the dialog line): a dialog before "oculus on http://127.0.0.1:8817"; the output was: // [screen] dialog //     child ended
18.1b dialog line, the text 300 ms later (two chunks): rejected after 22 ms (0 ms after the dialog line)
18.2 text, then a dialog line: settled after 25 ms
18.3 a dialog message, then its recorder line: settled after 22 ms
18.4 neither, child exits: rejected after 23 ms: no line with "oculus on http://127.0.0.1:8817"; the output was: // something else //
18.5 one write, dialog line then the text: rejected after 23 ms: a dialog before "oculus on ..."; the output was: // [screen] dialog // oculus on http://127.0.0.1:8817 //
18.6 both printed before the call, dialog first (lines at the call: ["[screen] dialog","","oculus on http://127.0.0.1:8817",""]): rejected after 0 ms
18.7 one write, the text then the dialog line: settled after 30 ms
extra: text on stderr, dialog on stdout 200 ms later: settled after 26 ms
extra: both before the call, text first: settled after 0 ms

Case 17.2:
- The lane's line was read from landing.mjs:29-30 as text. landing.mjs was not imported.
- A scratch npm was put first on PATH, and the scratch was removed afterwards.
line: npm run check; c=$?; npm run build; b=$?; npm run test:slow; s=$?; [ $c -eq 0 ] && [ $b -eq 0 ] && [ $s -eq 0 ]
FAIL=[run test:slow] exit 1 calls: run check,run build,run test:slow
FAIL=[none]          exit 0 calls: run check,run build,run test:slow
FAIL=[run check]     exit 1 calls: run check,run build,run test:slow

Cases 19.x (node on a scratch module importing src/desktop/server/error-line.ts, removed after):
19.1: "Error: Could not load /x/.svelte-kit/output/server/manifest.js: ENOENT: no such file or directory, open '/x/.svelte-kit/output/server/manifest.js'"
19.2: "Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'x' imported from /y.js"
19.3: "SyntaxError: Unexpected token '}'"
19.4: "done"   (and 'listen EADDRINUSE: ...' then 'done': "done")
19.5: "Error: b"

Case 20.1, from the worktree root:
$ grep -rn '^<<<<<<<\|^>>>>>>>' tools/oculus --include='*.ts' --include='*.svelte' --include='*.json' --include='*.md' --include='*.yml' --exclude=local.yml --exclude-dir=node_modules
  (no output) exit 1
$ find for *.orig / *.rej        none

The commands the round's report section quotes:
$ grep -n "log(\`dialog\|showMessageBox" src/desktop/dialogs.ts
24:    log(`dialog: ${options.message}`);
34:            ? await dialog.showMessageBox(box)
35:            : await dialog.showMessageBox(options.window, box);
$ sed -n 51,54p src/desktop/app.ts            function print(...) { if (error) console.error(line); else console.log(line); }   (as quoted)
$ sed -n 107,108p src/desktop/app.ts          const say = ... showDialog({ message, buttons }, print);   (as quoted)
$ sed -n 12,14p tests/server/desktop/app-harness.ts    process.stdout.write(`[screen] ${what}\n`);   (as quoted)
$ sed -n 22,25p tests/server/desktop/app-harness.ts    dialog.showMessageBox = ... record('dialog') ...   (as quoted)
$ grep -n '"main"' package.json               6:    "main": "src/desktop/main.ts",
$ sed -n 23p utils/unused-exports.sh          status=$?        (the report quotes the knip line here; it is :22, see Proof)
$ grep -n "parentOf\|askParentToPick\|ParentPort" src/server.ts
16:import { askParentToPick, parentOf, type ParentPort } from './lib/server/root/process/parent.ts';
45:const parent = parentOf((process as { parentPort?: ParentPort }).parentPort);
58:if (parent !== null) context.folderPicker.ask = askParentToPick(parent);
$ ls -a | grep -i knip                         (nothing)
$ grep -n knip package.json                    41:        "knip": "6.39.0",
$ grep -n '"<script>"' package.json:6-25: no script names src/server.ts (read)
History-word grep, over the 94 lines added in the six files against gate-O30 (error-line.ts whole):
29: start.test.ts: * fail at once when a line opening `[screen] dialog` comes before it, ...
31: start.test.ts: * limit. The app prints a dialog's message before the recorder's line, ...
43: start.test.ts: fail(new Error(`a dialog before "${text}"; ...`));
(the same 94 lines and the same three hits as the report)
$ grep -rn -E "\.last\b|\blast:|started\.last|built\.last" src/desktop tests/server/desktop tests/tiers config HELP.md DESIGN.md README.md --exclude=local.yml
HELP.md:202: ... a tab whose editor had the focus last ...   (as quoted)
$ the same grep over all of src and tests: hits only in UpdateTray.svelte, sessions/group.ts, yaml-edit.ts, sessions/record.ts, present.svelte.ts, viewport.ts, storage.ts, tree.ts, editor-status.svelte.ts, headings.svelte.ts, change-tree.ts, use.ts, model-sessions.ts, pointer.ts; none in src/desktop and none in tests
$ wc -l tests/server/desktop/start.test.ts tests/tiers/landing.mjs     333, 54

End state:
- `pgrep -fl 'Electron|src/server.ts'` printed only Visual Studio Code's crashpad handler, pid 943, which this review did not start.
- `ps -ax` showed no vitest, knip or scratch process.
- No o30rr1* scratch was left in $TMPDIR.
```

### The five findings, closed or not

- **Spec 1, `printed()` reads presence, not order: closed.**
  - `start.test.ts:178-188`: `decided()` compares `said = lines.findIndex(...includes(text))` with `asked = lines.findIndex(...startsWith('[screen] dialog'))`. It settles only when `said !== -1 && (asked === -1 || said < asked)` and fails otherwise once a dialog line is present.
  - It runs at the call (`:200`, before the listeners are added) and on each chunk (`:189-191`).
  - The doc comment (`:166-171`) states the rule by order.
  - Cases 18.5 (one write, dialog first) and 18.6 (both lines present at the call, dialog first) now reject. 18.1 to 18.4 and 18.7 keep their results.
  - The rule does not flip a row that should pass:
    - The two rows that wait for a dialog (`start.test.ts:264`, `:327`) wait for the first dialog the app asks for.
    - A failed first listen raises no second dialog: `process.ts:115-117` calls `onLost` only when `port !== null`, and `refused()` has no port.
    - No row waits for text after an expected dialog. The harness's dialog never answers (`app-harness.ts:22-25`).
- **Spec 2, the report did not quote the message-before-recorder lines: closed.**
  - The report quotes `dialogs.ts:24,34-35`, `app.ts:51-54,107-108` and `app-harness.ts:12-14,22-25`, and each reruns as quoted.
  - Every dialog of the app goes through `showDialog(..., print)`. `grep -rn -e dialogs.ts -e showMessageBox ... src tests` finds the one import at `app.ts:25`, and the calls at `app.ts:92,108,319` all pass `print`.
  - `print` writes a non-error line on stdout, which is the stream the recorder writes to, so the order holds.
- **Spec 3, the cause of the knip lines for `parent.ts`: closed.**
  - The stated cause reproduces. The entry is package.json `main` (`src/desktop/main.ts`), there is no knip configuration, no script names `src/server.ts`, and `src/server.ts:16,45,58` imports and uses the three names.
  - The quoted line number of the knip call is off by one (Proof below).
- **Standards 1, the two greps: closed in substance.**
  - The history-word grep reproduces exactly: 94 lines and the same three hits, each about the order of output lines.
  - The renamed-field grep is quoted over narrower paths than the ruling names (Spec finding 1 below). My grep over all of `src` and `tests` finds no stale use.
- **Standards 2, comment wrapping: closed.**
  - The probe above finds no short line inside a paragraph in either comment.
  - The longest lines are 100 columns (`landing.mjs:10,11`, `start.test.ts:166,170`), and the comment-width test passes.

Nothing reaches beyond the findings. The round's diff in `start.test.ts` is `printed()`'s body and doc comment only. No `it` title and no `expect` changed (`diff -u` against gate-O30). In `landing.mjs` the round touched the head comment. The `LIST` hunk (:21-40) matches the first review's quote of :24-32 and of the line at :29-30.

Nothing was removed or loosened:
- The rule is stricter: it now also fails on the two inputs that settled before.
- The `close` path is kept (`:192-195`, the "no line with" error, case 18.4).
- The 10-minute `MINUTES` limit is unchanged.

### Verdicts

Items of the brief's "What to build", the whole diff since the base:

- 17: holds.
  - `landing.mjs:24-32` is one lane, `'npm run check, then npm run build, then npm run test:slow'`, each command run to its end and the lane red when any is red (case 17.2 rerun).
  - `grep -n test:slow` hits only :25 and :29, so no entry of its own names it.
  - The head comment (:3-7, :9-12) gives the reason and lists the slow tests in the lane.
  - The rest of the file equals gate-O30.
- 18: holds.
  - The wait settles or fails by the order of the first text line and the first dialog line, at the call and on each chunk (`start.test.ts:173-204`).
  - Its error holds the awaited text and every line.
  - A dialog's own message is printed before the recorder's line on the same stream, and the report now quotes the lines that show it.
  - The doc comment states both rules.
  - No row's title or assertion changed.
- 19: holds.
  - `src/desktop/server/error-line.ts` holds the rule once (`ERROR_LINE`, :10) behind one export, `errorReason()`, used by `build.ts:9,25,33,46` and `process.ts:13,80,95,115,117`.
  - None of these files changed in the round (mtime 06:39 to 06:41).
- 20: holds. The worktree equals gate-O30 in every path except the six files items 17 to 19 change (`diff -rq` above).

Cases of the brief's "Cases", with the round's 18.5 to 18.7:

- 17.1: met. Reading `landing.mjs:21-40`: one entry runs check, build and test:slow in that order, and no other entry names `test:slow`.
- 17.2: met. Exit 1, exit 0 and exit 1, each run with all three calls, rerun above.
- 18.1: met. Rejected 0 ms after the dialog line, with the text and the lines; the child was ended after.
- 18.2: met. Settled.
- 18.3: met. Settled on the message printed before `[screen] dialog`.
- 18.4: met. The "no line with" error.
- 18.5: met. Rejected; one write with the dialog line first.
- 18.6: met. Rejected at the call, with both lines present and the dialog first.
- 18.7: met. Settled; one write with the text first.
- 19.1: met. The `Error: Could not load ...` line.
- 19.2: met. The `Error [ERR_MODULE_NOT_FOUND]: ...` line.
- 19.3: met. The `SyntaxError: ...` line.
- 19.4: met. `done`, also with `listen EADDRINUSE: ...` before it.
- 19.5: met. `Error: b`.
- 20.1: met. The marker grep prints nothing, and there is no `.orig` or `.rej` file. The dry run cannot be rerun on the applied tree; the equality with gate-O30 stands for it.
- 20.2: met. The `diff -rq` above lists only the files of items 17 to 19.

### Findings

#### 1. Spec

- `O30-report.md`, "Repair round 1", "Finding 4: the two greps".
  - The quoted hunk: `$ grep -rn -E "\.last\b|\blast:|started\.last|built\.last" src/desktop tests/server/desktop tests/tiers config HELP.md DESIGN.md README.md --exclude=local.yml`, followed by "Over the whole `src` the same grep also finds only unrelated `last` fields ..."
  - What is wrong:
    - The round's ruling 4 asks for this grep quoted across `src`, `tests`, `config`, `HELP.md`, `DESIGN.md` and `README.md`.
    - The quoted command covers `src/desktop`, `tests/server/desktop` and `tests/tiers` only.
    - The whole-`src` result is stated without its output, and the rest of `tests` is not covered.
    - My grep over all of `src` and `tests` (above) finds no stale use: no hit in `src/desktop` and none in `tests`. The code is right, and only the report's evidence is narrower than the ruling.
  - Failure scenario: an orchestrator checking the report against ruling 4 cannot confirm from it that no test outside `tests/server/desktop` reads `.last` of a build result or a server start. It has to rerun the grep. The rerun above supplies it.
  - Verdict: none.
- `O30-report.md`, "Repair round 1", "Finding 1".
  - The quoted hunk: the case lines 18.5 to 18.7, given after the change only.
  - What is wrong:
    - The refute skill's Spec heading asks for each case's first run on the unchanged tree. The report gives none for the round's new cases.
    - 18.5's first run is in the first review ("one chunk, dialog first: settled after 25 ms").
    - 18.6's first run exists nowhere. Reading the pre-round code the first review quotes (`seen()` checked before `asked()`, and an early `done()` when `seen()` holds at the call), it settled.
    - 18.7 is behaviour that the change keeps, and its run after the change is quoted.
  - Failure scenario: a reader of the report alone cannot see that 18.6 was a defect before the round. The first review and the reading above show it.
  - Verdict: none.

#### 2. Proof

- None. Two small differences from the report are not findings, since no decision rests on either:
  - `O30-report.md`, "Finding 3": `$ sed -n 23p utils/unused-exports.sh` is shown printing the knip call. That line prints `status=$?`, and the knip call is :22. The stated cause still holds.
  - The round's quote of `checks.sh` leaves out the `ok ASCII gate` line, which my run prints. The gate passes.

#### 3. Standards

- None.
  - The six files are ASCII.
  - Prettier and eslint pass.
  - The comment widths are within 100 with no short line.
  - The three hits of "before" are about order, not history.
  - `start.test.ts` has 333 lines.

#### 4. Behaviour

- None. The report's table states the change for a slow row that meets a dialog it did not wait for. "Repair round 1" states the rule by order, which now also fails a row whose dialog line comes first in the same pipe write.

### Declined to judge

- The slow rows of `start.test.ts` and the landing lane's wall time were not judged, because each needs the Electron app started, which this review may not do. They are the orchestrator's at landing.
- The quoted `patch -p1 -E --dry-run` output was not rerun, because it cannot run on the applied tree. The `diff -rq` against gate-O30 stands for it.
- `sh utils/unused-exports.sh` was not rerun, because the round's section quotes no run of it. The first review's run stands, and the round changed none of the files it reads for `parent.ts`.
- Items 1 to 16 were outside this review's scope by the dispatch.
- Z627 (the checkout build's own output folders) was not judged, because it is Axel's open item.

Reviewer usage: a5128dba9664ee455, claude-opus-5-5, 214,865 tokens, 52 tool uses, 6.7 minutes.

### Closed

- Spec 1 (the renamed-field grep quoted over narrower paths than ruling 4): closed at landing by this run's grep over all of `src` and `tests`, quoted above, which finds no stale use; no code change.
- Spec 2 (no first run quoted for the round's cases 18.5 to 18.7): closed at landing by the first review's run of 18.5 ("one chunk, dialog first: settled after 25 ms") and this run's reading of the pre-round code for 18.6; 18.7 is kept behaviour, its run after the change quoted; no code change.
