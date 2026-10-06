# PR1 refuter report (worktree `.agents/worktrees/PR1`, base 7e464b956)

I changed no file. The only git commands I ran were `git diff 7e464b956` (with `--stat` and word-diff forms) and `git status --short`. I fetched Electron v44.5.1 source files from raw.githubusercontent.com into my scratchpad.

**Overall:** every item and every case is met by reading, and every check is green. The open problems are:
- **B1:** in full screen, keyboard focus can leave the deck box while the slide stays on screen.
- **St1:** `Recorded` is exported but nothing outside its own file imports it.
- **Proof gaps:** the report claims `windows.ts` imports `Recorded`, which it does not, and it leaves out three statements the rules file asks for.

## 1. The brief's "Verify before you report" checks (run from `tools/oculus` in the worktree)

1. **`npm run test:quick`:** exit 0 (captured with `; echo "exit=$?"`). First run:
   - `ok prettier`, `ok ASCII gate`, `ok eslint (30.4 s)`, `ok vitest (39.7 s)`, `ok svelte-check (43.2 s): ... 390 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
   - `test:quick: 51.2 s (limit 45.0 s); every command passed` / `test:quick: over the time limit`
   - The second run printed `test:quick: 13.6 s (limit 45.0 s); every command passed`.
2. **ASCII gate** (the rules file's perl command over `src tests config`): no output, `gate-exit=0`. `LC_ALL=C grep -n '[^ -~]'` over the six changed files printed nothing (`grep-exit=1`).
3. **`sh utils/unused-exports.sh`:** `ue-exit=0`. `diff` against `PR1-base/unused-exports.txt` printed nothing (`ue-diff=0`). See St1: knip does not list `Recorded`, but the rules file's grep rule does catch it.
4. **`wc -l`:**

   | File | Lines | Limit |
   |---|---|---|
   | `Present.svelte` | 435 | 520 |
   | `windows.ts` | 438 | 880 |
   | `window-file.ts` | 107 | 880 |
   | `present.yml` | 28 | - |
   | `HELP.md` | 375 | - |
   | `DESIGN.md` | 436 | - |

5. **No test added or changed:** `diff -rq PR1-base/tools/oculus/tests tests` printed nothing (`tests-diff=0`).
6. **The doc sentences:** `grep -n -i "sentence\|list item" agents/spec.md` finds no rule on sentence length or list items, only the comment rewrap rule (:43) and the grep-after-rename rule (:66). The report says the same.

**Diagrams:**
- `diff -rq` of main's `tools/oculus/docs` against the worktree's printed nothing.
- `npx vitest run tests/checks/diagrams/diagrams.test.ts`: the first run printed `1 failed | 44 passed`. I did not capture which test failed.
- Two reruns: exit 0, `Tests 45 passed (45)`, including "are what the source gives now, each file byte for byte". This test file is one the step does not change, so per the rules file this is named here and not counted as a finding.

## 2. The report's evidence commands, rerun

- **Base grep:** `grep -rn "requestFullscreen\|fullscreenElement\|fullscreenchange" src` printed nothing with `grep-exit=1`, as the report says.
- **Base Present grep:** matches the report (cases at 115-139, toolbar at 156-179, `onpointerdown` at 205).
- **Base windows.ts grep:** `208: fullScreen: win.isFullScreen()` and `336: if (saved?.fullScreen === true) ...`, as the report says.
- **Precedents:** `TOAST_MS` is at `Toast.svelte:19`. `windows.remember(entry)` is at `app.ts:180`.
- **Line numbers that differ from the report:**
  - `TabView.svelte:34-35` is cited for `hidden={!shown}`. The worktree has `provideTabState` at :36 and `hidden={!shown}` at :41.
  - The import of `windows.ts` is cited as lines 17-23. The diff hunk adds lines 16-22.
  - Case 12 cites `:289` for `disabled`. It is at `:291`.
- **Open items:** the report quotes `orchestrator-state.md:207`. That matches the worktree's copy, where Z644 is the only open item.

## 3. Verdicts

### Items of "What to build"

1. **Item 1: holds (by reading).**
   - `div.present` is the element passed to `requestFullscreen` (`:144`).
   - In full screen the box gets `background: var(--bg); overflow: auto; padding: 12px` (`:373-377`).
   - The framed slide gets `overflow: hidden; padding: 0` (`:379-382`), and the frame gets `border: none; border-radius: 0` (`:384-387`).
   - The box takes the focus on entering: `syncFull` runs `if (full) box?.focus()` (`:161`).
2. **Item 2: holds.** The `ToolButton` with `label={t('present.present')}` sits after the Chip and carries `pressed={full}` and `disabled={rows.length === 0}` (`:285-292`). `pressed` reaches `aria-pressed` (`ToolButton.svelte:77`).
3. **Item 3: holds.**
   - `f`/`F` (`:229-234`): `if (rows.length === 0) return;` comes before `preventDefault`, and the toggle is `if (!event.repeat) toggleFull()`.
   - Space (`:235-240`) returns for a control. Enter is never taken.
   - The arrows and Page keys are unchanged, and Escape is unchanged (`:241-245`).
4. **Item 4: holds.**
   - `advance` (`:251-255`): `if (!full || grid || shown === null || inControl(event.target)) return; if (window.getSelection()?.isCollapsed === false) return;`
   - `onclick={advance}` is on the box (`:327`).
5. **Item 5: holds.**
   - The timer is started on entering by the effect at `:173-180`, and restarted by `onpointermove={rouse}`.
   - The hide rule is `.present.resting, .present.resting :global(*) { cursor: none; }`, with specificity (0,3,0).
   - The cursor rules of descendants inside the box all lose to it: `Card .open` (0,2,0) and `Table th button` (0,2,2). `.chip.pressable` is never used inside a slide.
   - The timer is cleared in the effect's cleanup.
6. **Item 6: holds.** `<svelte:document onfullscreenchange={syncFull} />` (`:306`), and `full = box !== null && document.fullscreenElement === box` (`:160`).
7. **Item 7: holds.**
   - A refused request is caught: `.catch(ignore)` at `:144` and `:149`.
   - Leaving on a hidden tab or an empty deck: the effect `if (full && (!tabShown() || rows.length === 0)) leaveFull();` (`:183-185`).
   - Leaving on unmount: a teardown that captures `element` (`:187-193`).
8. **Item 8: holds on macOS (read against the Electron source, section 3.1).** One residual hazard is B2.
9. **Item 9: holds.** `HELP.md:139`, `DESIGN.md:382`, `DESIGN.md:436` and the head comment (`Present.svelte:15-50`) are all written. St3 is one imprecision.

**File limits: hold.** The counts are above, and no `.svelte.ts` module was needed.

### Cases

All cases are met by reading; none could be run here.

| Case | Verdict | Evidence |
|---|---|---|
| 1 | met | `toggleFull` from the control, `:290` |
| 2 | met | `:206-215`, `:235-240` |
| 3 | met | `:251-255` |
| 4 | met | `:165-169`, `:390-393` |
| 5 | met | Esc is taken before the page (`electron_api_web_contents.cc:1703-1707`, re-read); `:306` |
| 6 | met | `:229-234`, `:153-156` |
| 7 | met | `permissions.ts:7` |
| 8 | met | `:373-377`, `pick` at `:258-261` |
| 9 | met | per-instance `full`, `:160` |
| 10 | met | `:306`; the effect at `:176-177` clears `resting` |
| 11 | met | `inControl` at `:134-138`, `:236`, `:252-253` |
| 12 | met | `:231`, `:291` |
| 13 | met | `:204` |
| 14 | met | `:141-150` |
| 15 | met | section 3.1 |
| 16 | met | section 3.1 |
| 17 | met | Ctrl+Tab hides the tab, which `tabShown` feeds to `:184`; a digit or Cmd+W unmounts the view (`:187-193`). The listener and the timer are removed at unmount. |
| 18 | met | `:233` |
| 19 | met | `:184`, `:291` |
| 20 | met | `:173-174` |
| 21 | met | section 3.1 |
| 22 | met while the page is in full screen; see B2 for the exit animation | |

### 3.1 `recordWindow` and its wiring against Electron v44.5.1

- **The window is not yet full screen when `enter-html-full-screen` fires.**
  - `SetHtmlApiFullscreen` (`electron_api_web_contents.cc:5116-5143`) calls `owner_window_->SetFullScreen(true)` and then emits `enter-html-full-screen` in the same call.
  - `NativeWindowMac::SetFullScreen` (`native_window_mac.mm:691-724`) calls `toggleFullScreenMode:`, which for a visible window runs `[super performSelector:@selector(toggleFullScreen:) withObject:nil afterDelay:0]` (`electron_ns_window.mm:426-435`). The toggle therefore starts on a later run-loop turn.
  - So when the event fires, `IsFullscreen()` (`HasStyleMask(NSWindowStyleMaskFullScreen)`, `:726-728`) is still false, and `IsMaximized()` returns `[window_ isZoomed]` (`:605-619`).
  - The builder did not read these lines and took the premise as given. They confirm the capture at `page-enter` (`window-file.ts:97-99`) for case 15 and for case 21, which records `maximised: true` and `fullScreen: false`.
- **Enter order** (`enter-html` first, then `enter-full-screen` from `windowDidEnterFullScreen`, delegate `:330-339`): `page-enter` holds the state. Each later `other` change writes `{ ...hold.own, zoom }` (`:106`).
- **Leave by Esc or F** (`leave-html` first, while the window is still full screen, then `leave-full-screen`): `page-leave` with `own.fullScreen` false marks the hold as `leaving` (`:103`). The `leave-full-screen` that follows finds `now.fullScreen` false and releases the hold (`:105`).
- **Leave from the window menu** (`BrowserWindow::OnWindowLeaveFullScreen`, `electron_api_browser_window.cc:222-227`): it calls `ExitFullscreen` before emitting `leave-full-screen`, so `leave-html` comes first, when the window is already out. The hold is marked `leaving` and then released on `leave-full-screen`. Correct.
- **Case 16:** `SetHtmlApiFullscreen` takes the `native_fullscreen_` branch and does not touch the window. `own.fullScreen` is true, so `page-leave` releases the hold with `now` (`:102`).
  - If the reader instead leaves through the menu while the page is in full screen, `leave-full-screen` first writes the held state (full screen). Then `leave-html` releases the hold with `now`, which has `fullScreen: false`. The final write is correct.
- **Quit mid-transition:** `NativeWindowMac::Close` defers itself while a full-screen transition is running (`:400-403`), and `HandleDeferredClose` runs it after `NotifyWindowEnter/LeaveFullScreen` (delegate `:333-336`, `:364-367`).
  - So `close` arrives after the window's event. It writes the held state, or `now` once the hold is released.
  - `quitting` reaches `record` through `remember` (`windows.ts:231-233`, `:433`).
- **The form `isFullScreen() && !html` is not used.**
- **Other platforms:** where `SetFullScreen` is synchronous, `enter-full-screen` would come before `enter-html` and the window would be recorded as full screen. The packaging is darwin only (`src/desktop/package.ts:82`), and the report says so.

## 4. Findings

### Spec

None against the brief's items.

### Proof

- **P1. `Recorded` is not imported by `windows.ts`.**
  - The report's unused-exports row says: "the step adds no export beyond `recordWindow`, `PageFullScreen`, `WindowChange`, `Recorded`, which `windows.ts` imports".
  - `grep -rn "\bRecorded\b" src tests utils` hits only `window-file.ts:81` and `:96`, plus an unrelated local type in `state/boards/board/facets.ts`. The import block at `windows.ts:16-22` does not include it.
  - Failure scenario: the orchestrator accepts the claim, and an export with no importer lands (St1).
- **P2. Three statements the rules file asks for are missing from the report.**
  - There is no reuse grep for the new function and types (spec:65, "quoting that grep in the report").
  - There is no grep of changed names (spec:66). The report says `HELP.md:367` and `README.md:9` are still true but quotes no command.
  - There is no statement on the new catalog keys `present.present` and `present_tip` (whether either is empty, duplicated or colliding), and none on the asynchronous paths (spec:67):
    - `requestFullscreen` still pending when the view unmounts. The teardown's check `document.fullscreenElement === element` is false while the request is pending, so nothing exits it.
    - A second `F` pressed before `fullscreenchange`. `toggleFull` asks to enter again instead of leaving.
  - Failure scenario: these paths are never stated, so nobody checks them at the look.
- **P3. Wrong line references.** These are the ones listed in section 2: `TabView.svelte:34-35`, the import range given as 17-23, and `:289`.
- **P4. The Electron source was not re-read.** The report's "How item 8 follows" section says the source lines "were not re-read by this builder". The conclusion holds by my reading in 3.1, so this is not a defect in the code.

### Standards

- **St1. An exported type with no importer.**
  - Hunk at `window-file.ts:80-81`: `/** The hold after a change, and the state the file is to keep, null for none. */` `export type Recorded = { hold: PageFullScreen | null; state: WindowState | null };`
  - The rules file says an export with no importer outside its own file is removed or made local. Knip does not report it, so the tool check is green while the rule is broken.
  - Fix: drop `export`.
- **St2. Different padding in full screen.**
  - `.present:fullscreen { ... padding: 12px; }` (`:376`), while the pane body is `padding: 10px 12px` (`Pane.svelte:157`).
  - Item 1 says the grid and the empty state are drawn in full screen "as they are in the pane". The vertical padding differs by 2 px. This is minor.
- **St3. One DESIGN.md sentence is imprecise.**
  - `DESIGN.md:436` reads "...keeps the window's own state, taken when the page entered full screen, until the window is out of it...".
  - For a window the reader had put in full screen (case 16), the hold ends when the page leaves, while the window stays in full screen (`window-file.ts:102`). The file holds the same state either way, so the sentence is imprecise rather than false.
  - The head comment of `window-file.ts` ("until the window is out of the page's full screen") is accurate.
- **St4. `config/present.yml` `deck.meta.hint`** ("left / right to move | <b>O</b> for the overview | ...", drawn on the title slide, `Title.svelte:25-26`).
  - The change does not make it false. It names neither `F` nor Space.
  - The file is outside the write list, and PR2 converts and removes the portfolio content of `config/present.yml` (`plan.md:647`).
  - The builder reported it. This is for the orchestrator to note, not a defect.
- **St5. An extra catalog word.**
  - `present.present_tip: Show the deck on the whole screen. F does the same.` is not one of the brief's decision 3 words. The report discloses it as judgment call 1.
  - The disabled title uses `present.empty`, which follows `tool-button.ts` ("The reason belongs in `title`").
  - "F does the same" is true only while the deck box holds the focus. The orchestrator decides whether to keep the word.

### Behaviour

- **B1. In full screen, keyboard focus can leave the deck box while the slide stays on screen.**
  - `keys` is bound to the box (`:324`). Any unmodified key the deck does not take falls through to the shell (`keys.ts:224` skips only keys whose default was prevented). The shell keys involved:
    - `?` opens the key sheet (`keys.ts:231-232`). The sheet is a bits-ui Dialog whose ground "is moved to the body (`portal`)" (`Modal.svelte:10`). That is outside the full-screen element, so the sheet is not drawn, yet its focus trap takes the keyboard.
    - `/` opens search (`keys.ts:276`).
    - `n` opens the new-session composer (`:279`).
    - The chord letters `m`, `p` and `e` followed by a digit open a view.
    - Tab moves the focus to the next focusable element in document order, which can be outside the box.
  - Failure scenario: a presenter in full screen presses `?`.
    1. Nothing visible happens.
    2. The next Right, Space or PageDown goes to the hidden sheet, and the deck does not move.
    3. Only a click on the box (`onpointerdown` focus, `:325`) or Esc recovers. Esc first ends the full screen and then shows the sheet.
  - The brief check listed this implied input (`PR1-brief-check.md:141`). The brief's Closed section does not close it, and no case covers it.
  - Fix options:
    - While `full`, `keys` prevents the default of every unmodified key it does not own, Tab included, so the shell skips it.
    - Or leave full screen on a `focusout` from the box to an element outside it.
  - Not verified by a run: no browser may be started here.
- **B2. A popped-out window can send its full-screen size as its bounds while it leaves full screen.**
  - In `tellBounds`, the flag is cleared at `leave-html-full-screen`:
    `entry.win.on('leave-html-full-screen', () => { pageFullScreen = false; });` (`windows.ts:278-280`)
  - On macOS that event comes before the window finishes leaving its own full screen. On macOS `moved` is emitted on every `windowDidMove` (`electron_ns_window_delegate.mm:249-254`), and each one restarts the 500 ms timer. If 500 ms pass between two moves while the window is still in its full-screen frame, the timer sends the monitor's size as the float's bounds.
  - The main window's path guards against exactly this: the hold stays `leaving` until the window is out (judgment call 5). The float's path does not.
  - Fix:
    - Clear the flag on the window's own `leave-full-screen` when the window was not full screen before.
    - Or skip the send when `entry.win.isFullScreen()`.
  - Not verified: whether such a pause occurs during the macOS exit animation.

## 5. Declined to judge

- **Behaviours only a browser shows:**
  - whether Chromium dispatches `click` for a press on the `.frame` scrollbar (item 4);
  - whether Tab leaves a full-screen element in Chromium (part of B1);
  - whether `cursor: none` hides the pointer over a scrollbar;
  - the actual frame size under the user-agent `:fullscreen` rules.

  None may be run here. The landing look settles them.
- **The macOS exit-animation timing behind B2:** this needs the app run at the look with a popped-out pane.
- **Window event order on platforms other than macOS:** the app is packaged for darwin only.
- **Which diagrams test failed on the first run:** not captured. Two reruns passed 45/45.
- **Z644 (a guarded entry and a test for item 8):** this is Axel's ruling.

## Usage

aed7391d3da51eb81, claude-opus-5-5; tokens and minutes as the state file records them from the completion notice.

## Closed

- B1, B2, the two pending-request paths of P2, St1, St2, St3, St5, P1 to P3: sent to the builder in repair round 1, with G53's test (Z644 (a)).
- St4: closed in the same round, the title slide's key hint in `config/present.yml` names `F` (the write list widened by that one line).
- P4: closed by the reviewer's reading in 3.1.

## Repair round 1, refuted (PR1, worktree `.agents/worktrees/PR1`, base 7e464b956)

**What is not closed:** two behaviour findings and one gap in G53's test.
- **B3:** B1 is closed only for unmodified keys. Cmd+Shift+F or Cmd+Shift+H can still move the keyboard out of the full-screen box while the slide stays on screen. The builder's report names this hazard and leaves it: "This is stated, not fixed".
- **B4:** the B1 fix swallows more than B1 asked. In full screen, Tab, the overview grid's card-cursor keys (ArrowUp, ArrowDown, j, k, i) and Enter on the cursor tile now do nothing.
- **Pr1:** G53's table has no row for re-entering full screen while a hold is leaving. It covers case 16's window-menu exit only in the order macOS does not emit, and not in the order it does.

Everything else the round was sent to close is closed, and every check is green.

I changed no file. The only git commands I ran were `git diff 7e464b956` (with `--stat`, `--word-diff` and `-U0`) and `git status --short`. `git status --short` printed the same ten lines before and after my runs.

## 1. The brief's checks, rerun from `tools/oculus` in the worktree

1. **`npm run test:quick`**, output and exit status written to the scratchpad: `exit=0`.
   - `test:quick: 10 changed file(s), from git since HEAD`, `13 test file(s), 10 essential`
   - `ok prettier (6.1 s)`, `ok ASCII gate (6.5 s)`, `ok eslint (21.0 s)`, `ok vitest (34.0 s)`
   - `ok svelte-check (35.3 s): ... 390 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
   - `test:quick: 46.1 s (limit 45.0 s); every command passed` / `test:quick: over the time limit`
   - An earlier run in the same session printed the same `ok` lines and `115.6 s`. The selection lists `tests/server/desktop/window-file.test.ts: changed`, plus `options.test.ts` and `present.test.ts` "named for a changed file".
2. **ASCII gate:** the rules file's perl command over `src tests config` printed nothing (`gate-exit=0`). The same command over `src tests bin config` printed 0 lines.
   - `LC_ALL=C grep -n '[^ -~]'` over HELP.md, DESIGN.md, `config/present.yml`, `options.yml` and the new test printed one line, `config/present.yml:252` "Linköping". That line is not in the diff and is allowed under `config/`.
3. **`sh utils/unused-exports.sh`:** `ue-exit=0`. `diff` against `PR1-base/unused-exports.txt` printed nothing (`ue-diff=0`).
4. **`wc -l`:**

   | File | Lines | Limit |
   |---|---|---|
   | `Present.svelte` | 458 | 520 |
   | `windows.ts` | 445 | 880 |
   | `window-file.ts` | 107 | 880 |
   | `present.yml` (text) | 28 | 880 |
   | `window-file.test.ts` | 131 | 880 |
   | `config/present.yml` | 273 | 880 |
   | `options.yml` | 1354 | not a source file |

5. **Tests:** `diff -rq PR1-base/tools/oculus/tests tests` printed `Only in tests/server/desktop: window-file.test.ts`. That is G53's test under Z644 (a), and no other test changed.
6. **Docs:** the rules file has no rule on list items or sentence length, as the first review found. The sentences are read in section 3.

**G53's test:** `npx vitest run tests/server/desktop/window-file.test.ts --reporter=verbose` gave `g53-exit=0`, ten `✓ ... keeps the window own state: ...` lines, `Test Files 1 passed (1)` and `Tests 10 passed (10)`.

**Other checks:**
- `npx vitest run tests/checks/diagrams/diagrams.test.ts` gave `diag-exit=0` and `Tests 45 passed (45)`.
- `sh utils/folder-check.sh` gave `folder-exit=0` with no output.
- `diff -rq` against the base over `src` and `config`, excluding `local.yml`, lists only the six expected files.

## 2. The round's closures

The round's change set, from the whole diff read against the first report's quoted hunks:
- `export` was dropped from `Recorded`.
- `.present:fullscreen` padding is now `10px 12px`.
- The `default:` branch of `keys` now prevents every unowned key in full screen.
- New in `enterFull`: the `entering` and `unmounted` flags.
- New in `tellBounds`: `windowWasFull` and the `leave-full-screen` release.
- `DESIGN.md:436` was reworded, and `present_tip` reworded.
- The F hint was added in `config/present.yml:22` and `options.yml:1007`.
- The new test file.

| Closure | Verdict | Evidence |
|---|---|---|
| G53's test | closed, with gaps (Pr1, St6) | The file passes 10/10. See "Reading G53's test" below the table. |
| B1 | closed for unmodified keys; open for modified keys (B3); reaches beyond the finding (B4) | `Present.svelte:262-269`: `if (full && !(event.key === 'Enter' && inControl(event.target))) { event.preventDefault(); }`. The shell listens at `<svelte:window onkeydown={keyboard.keys}>` (`Workbench.svelte:317-318`), in the bubble phase after the box's handler, so the prevented default reaches `resolveKey`. |
| B2 | closed | `windows.ts:259-290`. `windowWasFull` is read at `enter-html-full-screen`; on macOS that is before the toggle starts (first report, 3.1), so it is false for a windowed float. `leave-html` releases the flag only when the window was full screen before or is already out; otherwise the window's own `leave-full-screen` releases it. `tell` returns early, and the timer callback checks again. |
| Pending paths (P2) | closed | Unmount while a request is pending: the teardown sets `unmounted` (`:206`), and the `.then` exits when the element became the full-screen element (`:153-157`). A second press while a request is pending: `if (box === null \|\| entering) return;` (`:148`), with `entering` cleared in `.finally` (`:159`). |
| St1 | closed | `type Recorded = ...` with no `export` (`window-file.ts:81`). |
| St2 | closed | `padding: 10px 12px;` in `.present:fullscreen`. |
| St3 | closed | `DESIGN.md:436`: "until the page has left full screen and, for a window that was not in full screen before, until the window is out of it too". This matches `recordWindow` (lines 102-105). |
| St4 | closed | `config/present.yml:22` names `<b>F</b> for full screen`. |
| St5 | closed | `present_tip: Show the deck on the whole screen (F, while the deck has the focus)`. |
| P1 | closed | The report's unused-exports row now says `Recorded` is local, and my `ue-diff=0` reproduces the export side. |
| P2 statements | closed | Reuse grep, changed-names grep, catalog keys and async paths are in report section 7. |
| P3 | closed | `TabView.svelte:36` holds `provideTabState(() => shown);` and `:41` holds `hidden={!shown}`, as the report now says. `disabled={rows.length === 0}` is at `Present.svelte:314`. The import is at `windows.ts:16-22`. |

**Reading G53's test** (by reading, never by changing code):
- **If `recordWindow` were reduced to the base's live write (`{ hold: null, state: now }`):**
  - Rows 1 to 8 and row 10 fail at their first step: `page-enter` expects `null` and would get `now`.
  - Row 9 passes by design: it is the row with no page in full screen.
- **If a single branch were removed instead:**
  - Without the `hold.own.fullScreen` release (`:102`), row 6's `page-leave` would give `null` against the expected `FULL`.
  - Without `leaving` (`:103`, `:105`), row 5's `page-leave(FULL)` would write `FULL` against the expected `null`.
  - Without the zoom merge (`:106`), row 10 fails.
  - Removing `hold?.own ??` (`:98`) makes no row fail. See Pr1.
- **Coverage of the macOS orders in the first report's 3.1:**
  - Enter order: rows 1-5, 8 and 10.
  - Leave by Esc or F: row 1.
  - Windowed window, left from the menu with the window already out: row 2.
  - A close between the events: rows 4 and 5.
  - Case 16 by Esc: row 6.
  - Case 21: row 8.
  - Case 16 left from the window menu: the order macOS emits is not covered (Pr1).

## 3. The two things the builder added on its own

**`config/catalogs/options.yml:1007`.** The change is needed and correct.
- The catalog's head (`options.yml:3`) says `default` is "the value the Settings view's Reset writes and its Modified filter compares with".
- With `config/present.yml:22` changed and this default left as it was, Settings would list `deck.meta.hint` as Modified on a shipped file, and Reset would write the hint without `F`.
- The path is outside the write list. The round widened the list only by `config/present.yml`, per the first report's Closed section. The builder named the path in its report with the reason, as the rules file requires.
- For the orchestrator: PR2 converts `config/present.yml`'s portfolio content (`plan.md:647`), so PR2 has to carry both lines.

**The modified keys that still reach the shell in full screen.**
- `keys` returns at `:220` for Alt, Ctrl and Meta.
- These keys end the full screen through the tab-hidden or unmount path, so they are harmless:
  - Ctrl+1 to 9 (`resolveKey`, `keys.ts:160-162`)
  - Ctrl+[ and Ctrl+]
  - Ctrl+Tab in the app
  - Cmd+W
  - Cmd+N, which opens a text file in the focused pane, hiding the deck's tab
- Cmd+F in the app shows the find bar, a `WebContentsView` laid over the window (`find-bar.ts:1-5`), which finds in the page. That fits a slide.
- Cmd+S saves a source tab. That is the reader's intent, and focus stays put.
- Cmd+Shift+F and Cmd+Shift+H are the defect (B3). `workbench-keys.svelte.ts:193-197` runs `options.layout.openView('search', ...)` and then `options.focusSearchBox(id, ...)`, and `openView` "activates the instance already open" where it is (`opening.ts:63-64`).
- The builder's own text, report section 2: "Search, save and the other app keys act on a pane outside the box and are not stopped. This is stated, not fixed: the brief and the repair order name unmodified keys." B1's finding was that keyboard focus can leave the box while the slide stays on screen, whatever the key. Reading it as unmodified keys only is the narrower reading.

## 4. Verdicts over the whole diff

### Items of "What to build"

1. **Item 1: holds.** `requestFullscreen` is called on `div.present` (`:147-160`, `:335`). `.present:fullscreen` sets `background: var(--bg); overflow: auto; padding: 10px 12px`. `.framed` sets `overflow: hidden; padding: 0`. The frame has `border: none; border-radius: 0`. `syncFull` focuses the box (`:174-177`).
2. **Item 2: holds.** The control is a `ToolButton` after the Chip (`:308-315`), with `pressed={full}` and `disabled={rows.length === 0}`.
3. **Item 3: violated in part (B4).**
   - `f`/`F`, Space with Shift, the repeat guard, the control guard, Escape and the deck's own arrows and Page keys hold (`:219-261`).
   - The up and down arrows do not "keep their meaning, in and out of full screen". In the pane they reach the shell's card cursor over the grid (`keys.ts`: `ArrowUp` gives cursor up, `ArrowDown` gives cursor down). In full screen they are now swallowed.
4. **Item 4: holds.** `advance` (`:274-278`) skips the grid, controls and a selection, and is bound on the box (`:350`).
5. **Item 5: holds.** `rouse` and the effect (`:180-195`), and `.present.resting :global(*) { cursor: none; }`.
6. **Item 6: holds.** `<svelte:document onfullscreenchange={syncFull} />` (`:329`).
7. **Item 7: holds.** `.catch(ignore)` on both promises, the hidden-tab and empty-deck effect (`:198-200`), and the unmount teardown (`:202-209`).
8. **Item 8: holds.** `recordWindow` (`window-file.ts:92-107`) is wired in `record` (`windows.ts:223-229`). `enter-html-full-screen` and `leave-html-full-screen` are registered on the `BrowserWindow`, which declares them (`electron.d.ts:4216`, `:4417`, `:4473`). `remember` goes through `record`, and the float bounds through `tellBounds`.
9. **Item 9: holds.** `HELP.md:139`, `DESIGN.md:382`, `DESIGN.md:436` and the head comment (`Present.svelte:15-50`) are all written.

**File limits: hold** (section 1).

### Cases

None of the cases can be run here, so every verdict is by reading.

| Case | Verdict | Evidence |
|---|---|---|
| 1 | met | `:313` calls `toggleFull`, which calls `requestFullscreen` on the box |
| 2 | met | `:222-231`, `:251-256` |
| 3 | met | `:274-278`, `:350` |
| 4 | met | `:180-184`, the `resting` CSS |
| 5 | met | Esc is taken by the browser (premise); `:329` |
| 6 | met | `:245-250`, `:168-171` |
| 7 | met | `permissions.ts:7`; same code path as cases 1-6 |
| 8 | met | the `:fullscreen` CSS; `pick` (`:281-284`). Keyboard use of the grid is lost in full screen (B4) |
| 9 | met | `full` is per instance (`:175`) |
| 10 | met | `:329`; the effect clears `resting` |
| 11 | met | `inControl` (`:138-142`), `:252`, `:267`, `:275-276` |
| 12 | met | `:247`, `:314` |
| 13 | met | `:220` |
| 14 | met | `.catch(ignore)` (`:158`, `:164`) |
| 15 | met | `recordWindow`; test rows 1-5 |
| 16 | met | `:98`, `:102`; test row 6. The menu-exit order is not in the table (Pr1) |
| 17 | met | `:198-200`, `:202-209` |
| 18 | met | `:249`, `:148` |
| 19 | met | `:199`, `:314` |
| 20 | met | `:188-189` |
| 21 | met | `:98`; test row 8 |
| 22 | met | `windows.ts:259-290` |

## 5. Findings

### Spec

None against the brief's items beyond B4's effect on item 3, which is listed under Behaviour.

### Proof

- **Pr1. G53's table leaves one branch of the rule and one macOS order without a row.**
  - **The re-entry branch.** The hunk at `window-file.ts:97-99`:
    `if (change === 'page-enter') { return { hold: { own: hold?.own ?? now, leaving: false }, state: null }; }`
    - No row has a second `page-enter` while a hold exists, so `hold?.own ??` could be dropped without a row failing.
    - The rules file asks for "one row per input that gives a different outcome".
    - Failure scenario: a presenter presses F out and F in again during macOS's exit animation, giving `page-leave(FULL)`, then `page-enter(FULL)`. A later change that holds `now` there writes `fullScreen: true`, the next start opens the window in full screen, and the test stays green.
  - **Case 16 left from the window menu.**
    - Electron v44.5.1 `electron_api_browser_window.cc:221-227` (fetched with curl, `curl=0`) reads: `void BrowserWindow::OnWindowLeaveFullScreen() { #if BUILDFLAG(IS_MAC) if (web_contents()->IsFullscreen()) web_contents()->ExitFullscreen(true); #endif BaseWindow::OnWindowLeaveFullScreen(); }`.
    - So on macOS the page's exit runs before `leave-full-screen` is emitted, with the window already out. Row 7 encodes the reverse: `['other', WINDOWED, FULL], ['page-leave', WINDOWED, WINDOWED]`.
    - The order that does occur, `page-leave(WINDOWED)` with `hold.own.fullScreen` true followed by `other(WINDOWED)`, has no row.
    - By reading `recordWindow`, that order gives `WINDOWED`, `WINDOWED`, which is correct. The gap is in the proof, not the code.
    - This also corrects the first report's 3.1, which gave the reverse order for this path.
    - I did not trace whether `ExitFullscreen` emits `leave-html-full-screen` synchronously inside that call.
  - Fix: add the two rows.
- **Pr2. The report's open items are the worktree's copy from before the ruling.**
  - Main's `orchestrator-state.md:219-225` "Open items" list is now empty (`awk` over the section).
  - The report quotes Z644 as open and says so itself (report line 9).
  - The round order (state file :201) says to "Copy the open items from the state file at the moment you write it". This is minor and changes nothing at landing.

### Standards

- **St6. The test head comment names a ledger id, and its title drops the possessive.**
  - `tests/server/desktop/window-file.test.ts:1-2`: `// Layer 4, server test. What ~/.oculus/window.json keeps of the main window while a page in it is` / `// in full screen (G53): ...`.
  - A grep over `src` and `tests` for `\bG[0-9][0-9]?\b` outside this file printed nothing, so no other file names a guarded entry. `guarded.md` names the test, not the reverse, and the rules file treats a plan id in a comment as a defect.
  - Title `:128`: `'keeps the window own state: $title'` should read "the window's own state". The `title` field quoting needs care if the apostrophe is added.
  - The test must still be named in `agents/guarded.md` under G53 by file and title. That is the orchestrator's booking.
- History words: `git diff 7e464b956 -U0 | grep '^+'` over `src` and `config`, plus the test file, hit "before" and "still" five times. Each describes an order of events or a state, so none is a finding.

### Behaviour

- **B3. Cmd+Shift+F or Cmd+Shift+H moves the keyboard out of the full-screen box.**
  - Place: `Present.svelte:220`, `if (event.altKey || event.ctrlKey || event.metaKey) return;`, with the shell's `find-in-files` branch (`workbench-keys.svelte.ts:193-197`).
  - Failure scenario: a Search view is open in another pane of the page, and the presenter in full screen presses Cmd+Shift+F.
    1. `openView` activates that Search view where it is (`opening.ts:63-64`), so the deck's tab stays shown and full screen stays.
    2. `focusSearchBox` focuses an input outside the full-screen element, so nothing visible changes.
    3. The next Right, Space or PageDown types into the hidden search box, and the deck does not move until a click on the slide.
  - Cmd+Shift+B and Cmd+Alt+T (`runDefault`) may move focus the same way. Not verified.
  - Fix, ending the cause for every path including programmatic focus: while `full`, a `focusout` from the box whose `relatedTarget` is a non-null element outside the box leaves full screen. Or `keys` prevents the default of modified keys in full screen except those that already end it.
- **B4. The B1 fix makes the full-screen grid and the slide's links unreachable by keyboard.**
  - Place: `Present.svelte:262-269`, the `default:` branch quoted above.
  - Failure scenarios:
    - In full screen the presenter opens the grid with `O` and presses ArrowDown or `j` to move the card cursor, then Enter. Nothing happens. In the pane the same keys reach `resolveKey` (cursor up, down, left, right, and `activate` on Enter with `cursorActive`, `keys.ts`) and work.
    - Tab and Shift+Tab are swallowed, so neither a tile title nor a link in a slide can be reached by keyboard in full screen. Enter and Space are kept for a focused control (`:252`, `:267`), but that focus can only come from a pointer.
    - Item 3's "the arrows ... keep their meaning, in and out of full screen" fails for the up and down arrows over the grid.
  - The fix is the one the first report proposed, so the overreach is in the finding's suggestion as well as the build.
  - Fix:
    - In full screen, let through the card-cursor keys (`j`, `k`, `i`, `J`, `K`, ArrowUp, ArrowDown, and Enter while the cursor is active) when the grid is open, since they act on cards inside the box.
    - Keep Tab inside the box: wrap from the last focusable element to the first, instead of swallowing it.
  - Not verified by a run.

## 6. Declined to judge

- **Behaviours only a browser or the app shows:** focus, `cursor: none` over a scrollbar, the frame size under `:fullscreen`, the B2 timing during the macOS exit animation, and whether `runDefault` moves focus. None may be run here; the landing look settles them.
- **Whether `ExitFullscreen(true)` emits `leave-html-full-screen` synchronously** inside `OnWindowLeaveFullScreen`: not traced past the quoted function.
- **Event order on platforms other than macOS:** the app is packaged for darwin only.

## Usage

Reviewer over round 1: a99e636de1d29873b (per `orchestrator-state.md:82`), claude-opus-5-5. Tokens and minutes are not known to me; use the completion notice's figures.

### Closed (round 1 was the last round; fixed at landing, inside the brief)

- B3: fixed at landing, while `full` a `focusout` from the box to an element outside it leaves full screen.
- B4: fixed at landing, the card-cursor keys pass while the grid is open and Tab stays inside the box.
- Pr1: fixed at landing, the two rows added to G53's table.
- St6: fixed at landing, the ledger id out of the test's head comment and the title's possessive.
- Pr2: closed, the open item Z644 was ruled before the round's report; nothing to change.
