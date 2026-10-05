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
