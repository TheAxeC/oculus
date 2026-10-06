# PR1 refuter report (worktree `.agents/worktrees/PR1`, base 628ac4b01)

I changed no file. The only git commands I ran were `git diff 628ac4b01` (with `--stat` and word-diff forms) and `git status --short`. I fetched Electron v44.5.1 source files from raw.githubusercontent.com into my scratchpad.

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
