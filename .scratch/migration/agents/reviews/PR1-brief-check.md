# Step PR1 brief check (on main at bc42cb101)

The fresh read-only agent of the `spec` skill's brief check, on `tools/oculus/.scratch/migration/agents/briefs/PR1.md` (uncommitted working copy). I edited no files and ran no git command other than `git rev-parse --short HEAD`, which printed `bc42cb101`. I also fetched Electron's and Chromium's source text with `curl` into my scratchpad, because the brief's item 8 premise could not be settled from `node_modules/electron`.

## 1. Names

- **`fullScreen`, the field of the window file.** Command: `grep -rn "stateOf\|keepState\|fullScreen" src tests config utils HELP.md DESIGN.md README.md docs --exclude=local.yml`. Hits outside the write list:
  - `src/desktop/decide/window-file.ts:13`, `:48`, `:49`, `:53`. These are the type and the parser. They stay true, since the field stays a boolean and the head comment ("whether the window is maximised or full screen") still holds once the field means the window's own full screen.
  - `src/desktop/windows/windows.ts:333` (`keepState(entry);`) and `:336` (`if (saved?.fullScreen === true) entry.win.setFullScreen(true);`). Both are outside the range 203-233 and stay true.
  - The other `stateOf` hits are unrelated functions: `src/lib/server/sessions/stores/transcripts.ts:190`, `src/lib/state/sessions/latex.svelte.ts:293`, `repositories.ts:570`, `RepoList.svelte`, `Repositories.svelte`. None is made false.
- **The window state in the docs.** Command: `grep -rn "window.json\|full screen\|full-screen\|Full screen" HELP.md DESIGN.md README.md docs --exclude-dir=diagrams`. Hits: `README.md:9` ("keeps its window state in `~/.oculus/window.json`"), `HELP.md:367` ("The window state is kept in `~/.oculus/window.json`"), and `DESIGN.md:436` (the native-window decision, "The window state (`~/.oculus/window.json`) ... are the app's"). All three stay true. Item 9 puts the window-file rule of item 8 into `DESIGN.md:382`, the Present decision. The decision that describes the window state is `:436`, and a reader looking for the window file's rule will look there.
- **`present.present`, the new catalog key.** Command: `grep -rn "present\.present\b\|'present.present'" src config tests`. Hits: `src/lib/data/index.ts:235` and `:248`, which are a data property (`present.present`), not the catalog key. No collision. The `present` group lives only in `config/text/views/academic/present.yml`; `views.present` belongs to another group.
- **The key `F`.** This is a reserved-key collision the brief does not name. `config/layout.yml:26` reads `focus: { label: "Focus", glyph: focus, chord: f }`, and `config/text/app.yml:12` lists "f1-f3 | open a view of the Focus page's group". `src/lib/shell/keys/keys.ts:224` skips a key whose default was prevented, so `f` taken by the deck ends the `f1` to `f3` chords while the deck holds the focus. This is the same as `o` already does to the card cursor's `o`.
- **The head comment, HELP.md:139 and DESIGN.md:382.** Command: `grep -rn "present/Present.svelte\|views/academic/present.yml\|overview grid" src tests config HELP.md DESIGN.md README.md --exclude=local.yml`. Hits: `tests/checks/config/config-folder.test.ts:233` (a file list, unaffected) and `src/lib/data/model/model-entities.ts:423` (unaffected). No key sheet lists the deck's keys (`config/text/app.yml:12` holds shell keys only).
- **`docs/diagrams`.** `grep -rln "keepState\|stateOf\|Present.svelte\|present.yml" docs/diagrams` printed nothing.

Findings:
- (a) The `f` chord collision (`config/layout.yml:26`) is a user-visible change the brief neither names nor decides. Two things need deciding: that `f1` to `f3` stop working while the deck has the focus, and whether `f` with an empty deck (case 12, "F does nothing") prevents the default. If it does not, `f` falls through and starts the shell's chord.
- (b) The window-file rule is placed in the Present decision (`DESIGN.md:382`), while the window state is described at `DESIGN.md:436`. Nothing is made false, but the placement is questionable.

## 2. The step line

- "a Present control in the Present view's toolbar": item 2.
- "and a key": item 3 (`f`/`F`).
- "put the slide frame into full screen on the whole monitor": item 1. In the desktop app, "whole monitor" rests on Electron resizing the window for a page's full screen (`disableHtmlFullscreenWindowResize`, default `false`, `node_modules/electron/electron.d.ts:19529-19532`). The brief does not state this, and item 8 must not be met by setting that option.
- "in a browser tab and in the desktop app": items 1 and 8, plus the `permissions.ts:7` premise.
- "with no rail, tabs or toolbar": item 1.
- "Esc leaves": items 3 and 6.
- "the arrows, space and a click move through the slides": items 3 and 4.
- "the pointer hides while it rests": item 5.

Findings: none. Every part has a requirement.

## 3. Premises

- **The step line and its rulings.** `grep -n "^- PR1 " plan.md` prints `645:- PR1 Present full screen: ...`, matching the brief verbatim. `grep -n "^- Z641 " plan.md` prints `1388:`. Z637 is at `:1384`. Holds.
- **The size of the view.** `wc -l src/lib/views/academic/present/Present.svelte` prints `288`. Holds.
- **The places in `Present.svelte`.** The bar is at `:155`, the Pane at `:189`, and the box at `:193-206`. Holds.
- **The span of `keys`.** The function runs `:113-146`; `:148-152` is `pick`. The brief's `:113-150` is slightly off.
- **What `keys` does.** It returns on Alt, Ctrl or Meta (`:114`), and Escape only closes the grid (`:139-143`). Holds.
- **The scale.** `grep -n "fit(width, height)\|bind:clientWidth" ...` prints `71:` and `202:`. Holds.
- **The instance's state.** `write` is `Present.svelte:84`, not `present.ts`; `parsePresentState` is `src/lib/state/life/present.ts:98`. The substance holds; the brief's parenthetical puts `write` in the wrong file.
- **The catalog.** `wc -l config/text/views/academic/present.yml` prints `26`; the brief says 25. Its keys are as listed.
- **No Fullscreen API today.** `grep -rn "requestFullscreen\|fullscreenElement\|fullscreenchange\|exitFullscreen" src` printed nothing (exit 1). Holds.
- **The permission.** `src/desktop/decide/permissions.ts:7` reads `const GRANTED: readonly string[] = ['clipboard-read', 'clipboard-sanitized-write', 'fullscreen'];`. Holds.
- **The window file's writes.** `stateOf` is `windows.ts:203-211` (`fullScreen: win.isFullScreen()` at `:208`), `keepState` is `:218-233` (events at `:224-225`, close at `:230-233`), and the restore is `:336`. Holds. The first hit of `enter-html-full-screen` in `electron.d.ts` is `:4417`. Holds.
- **What Electron's documentation says about a page's full screen (item 8's hazard).**
  - Electron is version 44.5.1 (`node_modules/electron/package.json`). The package holds no docs folder: `ls node_modules/electron/` prints `abi_version checksums.json cli.js dist electron.d.ts index.js install.js LICENSE package.json path.txt README.md`.
  - The documentation lines are:
    - `electron.d.ts:4415`: "Emitted when the window enters a full-screen state triggered by HTML API."
    - `:2223`: "Emitted when the window enters a full-screen state."
    - `:2984`: "Whether the window is in fullscreen mode."
    - `:5758-5761`: on macOS, `isFullScreen` is to be read only after `enter-full-screen` or `leave-full-screen` was emitted.
    - `:19529`: "Whether to prevent the window from resizing when entering HTML Fullscreen. Default is `false`."
  - No line says whether `isFullScreen()` is true during a page's full screen, or whether `enter-full-screen` fires for it. The brief's instruction to state "the line that says so" cannot be met from `node_modules/electron/`.
  - Electron's source at the pinned tag settles both. Command: `curl -sL https://raw.githubusercontent.com/electron/electron/v44.5.1/shell/browser/api/electron_api_web_contents.cc`.
    - `:5116-5143`, `SetHtmlApiFullscreen`, calls `owner_window_->SetFullScreen(enter_fullscreen)` unless the window is already full screen, in which case it sets `native_fullscreen_ = true` and leaves the window as it is.
    - `:5162-5168`, `UpdateHtmlApiFullscreen`, emits `enter-html-full-screen` and `leave-html-full-screen` after that call.
  - So the window itself goes into its own full screen. `isFullScreen()` becomes true and `enter-full-screen` fires, and today's `keepState` writes `fullScreen: true`. The hazard is real.
  - On macOS, `setFullScreen` is asynchronous (`electron.d.ts:3355-3358`). So `enter-html-full-screen` comes before `enter-full-screen`, and `leave-html-full-screen` before `leave-full-screen`.
  - The requirement "a full screen entered through `enter-html-full-screen` is not the window's" closes the hazard only if two things hold. First, the window's own state must be captured when `enter-html-full-screen` fires; on macOS `isFullScreen()` is still false at that moment for case 15, and true for case 16. Second, it must not be written as `isFullScreen() && !html`, which breaks case 16. The brief does not give this order or these lines, and the builder, who never starts the app, cannot learn them from the docs it is pointed at.
- **Esc in the desktop app (item 3's reason).** The brief says "the desktop app's window does not leave a page's full screen by itself on Esc". This is false.
  - `electron_api_web_contents.cc:1703-1707`: `PreHandleKeyboardEvent` first calls `exclusive_access_manager_.HandleUserKeyEvent(event)` and returns `HANDLED` when it is true.
  - Chromium's `ExclusiveAccessManager::HandleUserKeyEvent` (fetched from Chromium's `main` branch, not the exact Chromium pinned by Electron 44.5.1, `:244-253`) hands an unmodified Esc to each controller's `HandleUserPressedEscape`. The full-screen controller ends the tab's full screen, and the key never reaches the page.
  - `electron_api_browser_window.cc:222-227` (v44.5.1): leaving the window's full screen from the menu ends the page's full screen on macOS. This supports item 6's "the window's menu" way out.
  - Consequence: in both a browser tab and the desktop app, the page never sees Esc while in full screen. Item 3's Escape branch never runs, and the reason the brief gives for it must not reach a comment or `DESIGN.md`.
- **The docs rows.** `grep -n "^| \`present\` \|^- The public deck is a live oculus view" HELP.md DESIGN.md` prints `HELP.md:139` and `DESIGN.md:382` with the quoted text. Holds.
- **No guarded entry.** `grep -n "window.json\|Present" agents/guarded.md` printed nothing (exit 1). The brief says it "prints only G52's 'full screen'"; G52 (`:104`) contains neither word. The conclusion (no entry) holds, but the quoted output is wrong.
  - G47 (`:31-32`) names `src/desktop/` as its code, specifically "the link decision, the window options and the sender check". `stateOf` and `keepState` are none of those, so the step touches no entry's code. The brief does not say this.
- **The base copy.** `ls -d .agents/worktrees/PR1-base/tools/oculus .agents/worktrees/PR1-base/unused-exports.txt` prints "No such file or directory" for both. This is not yet created; `spec` makes it after the check, and other bases (`D23-base/tools/oculus`, `D23-base/unused-exports.txt`) have the layout the brief names.
- **No browser in `node_modules`.** `ls node_modules/playwright-core` prints "No such file or directory". Holds.
- **No ADR folder.** `ls docs/adr` at the hub root and in `tools/oculus` both print "No such file or directory". `grep -n "adr" .agents/plan.yaml` prints nothing. Holds.

Findings:
- (c) Item 8's premise sends the builder to documentation that does not say what is needed. The answer is in Electron's source, as listed above, and the brief should quote those lines and the macOS event order.
- (d) Item 3's reason is false (Esc is taken by Electron before the page). The Escape branch is code that never runs in either host.
- (e) The guarded grep's quoted output is wrong, and G47's scope is not stated.
- (f) Small mismatches: `present.yml` is 26 lines, not 25; `keys` is `:113-146`; `write` is in `Present.svelte:84`.

## 4. Cases and checks

- **Cases 1-16 against the test rule.** No test is asked for, which is consistent with the rules file's test rule ("A test exists only as the test of one entry of `agents/guarded.md`"). Checking by a reading and by the look is consistent with "A behaviour that needs a DOM ... is seen at the look on landing".
- **Case 11.** "a slide the builder's scratch deck holds with one" asks for a scratch deck. No path in "Paths this step writes" holds one, and the rules file's write ban covers every path not listed. The builder also runs no page, so a scratch deck has no use in a reading. This conflicts with the "Where you work" write-list rule.
- **Case 14.** The "call made without a user gesture in the quoted run" form is impossible, since no run is available. Only the reading form is possible.
- **`npm run build`.** The "Cases" section cites "`npm run build` passing shows the view compiles", but the verify list does not name it. The rules file's landing list holds the build and is run "by no builder or reviewer". This is inconsistent: either list it, or rely on the type check inside `npm run test:quick`.
- **No case asks the builder to check a place the step does not change.** Case 13 reads the deck's own guard (`:114`).

**Is reading the code path adequate for cases 1 to 6 and 8 to 14?**
- It is adequate for the logic: the key switch, the guards on modifiers and on the empty deck, the `fullscreenchange` listener and its comparison with the box, the rejected promise caught, the timer cleared on leave and on unmount, and the click guard for links and controls.
- It is not adequate for anything the renderer or the user agent decides:
  - whether the box, as the full-screen element, gets the screen's size under `.present { min-height: 100% }` and `.framed { height: 100% }`, and so whether `fit` scales to the monitor;
  - whether `cursor: none` on the box survives a descendant's own cursor (a link's `cursor: pointer`, a tile's title button);
  - whether Esc reaches the page (it does not, see section 3);
  - what a full-screen element inside a `display: none` tab view draws.

  These rest on the look.
- Other checks the rules allow, with no browser installed, no focus taken and none of the forbidden ports:
  - reading Electron's source at tag v44.5.1 (as done above) for cases 5, 7, 15 and 16 and item 3;
  - reading Chromium's user-agent style for `:fullscreen` (in Chromium's `fullscreen.css`) for item 1's sizing and letterbox;
  - the type check in `npm run test:quick`.
- One more option would need Axel's ruling for a `guarded.md` entry. Item 8's failure costs something: the window reopens in full screen at every start. The rule could be a pure function, for example in `src/desktop/decide/window-file.ts`, from the event sequence to the recorded `fullScreen`, with a unit table covering cases 15 and 16 and both event orders. Under the test rule that needs a new entry, which is Axel's to grant. The brief does not raise it.

Findings: (g) case 11's scratch deck has no path in the write list; (h) `npm run build` is cited but not listed (and is a landing-list command); (i) the brief does not raise the option of a guarded entry for item 8, whose failure costs something and whose rule could be a pure function.

## 5. The question

Could each pass without the goal being reached?

- **Case 1:** yes, as a reading. Code that calls `requestFullscreen()` on the box reads correctly even if the frame does not scale to the screen. Only the look closes this.
- **Case 2:** yes. It passes while Space, taken by `keys` with `preventDefault`, swallows the press of a focused tile title button or link inside the box.
- **Case 3:** yes. It passes while a drag-select of slide text, or a press on the frame's own scrollbar (`.frame` is `overflow-y: auto`, `Present.svelte:266`), moves the deck.
- **Case 4:** yes, for two reasons:
  - `cursor: none` on the box passes the case while the pointer rests over a link or control and stays visible;
  - a timer started only on movement passes a case run by moving first, while a pointer left still since entering never hides.
- **Case 5:** yes. Both hosts take Esc before the page (section 3), so case 5 passes whatever item 3's Escape branch does. It is the same check as case 10.
- **Case 6:** no.
- **Case 7:** yes, as a reading. It cannot show the monitor is filled. The look closes it.
- **Case 8:** yes. It passes while a grid taller than the screen is clipped. The box in full screen has no `overflow` rule, and the pane body (`Pane.svelte:153-157`, `overflow: auto`) that scrolls it today is outside the full-screen element.
- **Cases 9 to 14:** no, for the reading each asks.
- **Case 15:** yes. A reading cannot tell whether the builder's flag is right for macOS's actual order (`enter-html-full-screen` before `enter-full-screen`) without the source lines in section 3.
- **Case 16:** yes, for the same reason. It also fails with an `isFullScreen() && !html` design that a reading against `electron.d.ts` alone would accept.
- **The step-line check (cases plus look):** yes. Ctrl+Tab or Ctrl+1-9 (shell keys the deck lets through because Ctrl is held, `keys.ts:198-214`) cycles the pane's tab while the deck is in full screen. That makes the full-screen element's tab view `display: none` (`shell/panes/TabView.svelte:16`). The likely result is a blank full screen; this is not verified, since no browser was run. No case presses a shell key in full screen.
- **Item 1:** yes, as a reading (sizing and background are only seen at the look).
- **Item 2:** no.
- **Item 3:** its Escape branch is never exercised (section 3), and its Space rule takes a focused control's press.
- **Item 4:** yes, for drag-select and the scrollbar.
- **Item 5:** yes, for descendants' own cursors.
- **Item 6:** no.
- **Item 7:** no.
- **Item 8:** yes, see cases 15 and 16. Also, `maximised: win.isMaximized()` is written during the page's full screen. Whether a maximised window reads as maximised while full screen is not verified.
- **Item 9:** no.

Findings: cases 1, 2, 3, 4, 5, 7, 8, 15 and 16, the step-line check, and items 1, 3, 4, 5 and 8, each for the reason given above.

## 6. Implied inputs

Missing from "Cases":
- **A shell key pressed in full screen.**
  - Ctrl+Tab or Ctrl+1-9 in the desktop app: expected, full screen ends, or the deck takes the key, so the full-screen element is never hidden.
  - A digit: switches the page. Expected: full screen ends cleanly, the control is unpressed, the pointer shows, and no listener is left behind.
  - `?`, `:`, `/`, `n`, or `j`/`k` over the grid's cards: expected, nothing opens out of sight under the full-screen element and takes the focus. Whether bits-ui's dialogs draw above the full-screen element is not verified.
- **`f` against the Focus chord** (section 1): expected, the decision named; and `f` on an empty deck either prevents the default or is stated to start the chord.
- **The page switched, or the pane or tab closed (Cmd+W), while in full screen:** expected, the browser exits full screen because the element is removed, the desktop window returns to its own state, and the timer and listener are gone.
- **A Present pane popped out into its own window going full screen:** expected, the float's saved bounds are not the monitor's. `tellBounds` (`windows.ts:236-247`) sends `getContentBounds()` on `moved` and `resized`; whether those fire on a macOS full-screen transition is not verified.
- **A maximised window, deck full screen, then quit:** expected, the file says `maximised: true`.
- **The wallpaper on:** the frame is translucent (`Present.svelte:276-279`), and the wallpaper is a Workbench element (`Workbench.svelte:432`) that is not drawn under the full-screen box. Expected: a stated letterbox and frame surface, either opaque, or the wallpaper drawn in the box.
- **A slide taller than the frame:** expected, wheel scrolling inside the frame works in full screen, a press on its scrollbar does not move the deck, and Space moves the deck.
- **A grid taller than the screen:** expected, it scrolls in full screen.
- **Focus on a control inside the box (a grid tile's title, a slide link) and Space or Enter pressed:** expected, the control's own action, and the deck does not move.
- **A drag that selects slide text:** expected, no move.
- **`F` held down (auto-repeat):** expected, one toggle (`event.repeat` ignored).
- **A push that empties or changes the deck while in full screen:** expected, F and Esc still leave, and the control is shown unpressed and disabled after leaving.
- **Entering by `F` with the pointer never moved:** expected, it hides after 2 s (the timer starts on entering).
- **A click on the letterbox outside the frame:** expected result unstated (item 4 says "on the slide frame").

Already covered or no hazard:
- The text size: `--text-scale` reaches the frame by DOM inheritance, which the top layer keeps.
- The Slides view or another pane beside: hidden by the browser under item 1, no hazard.
- Two Present panes: case 9.

Findings: each item in the "Missing from Cases" list above.

## 7. ADRs

No record: `ls docs/adr` at the hub root and in `tools/oculus` both print "No such file or directory", and `.agents/plan.yaml` names no `adr` folder.

Findings: none.

## 8. Dictated text

- `present.present: Present` (`grep -n "present.present" agents/briefs/PR1.md` finds `:29` and `:92`): holds. It is ASCII, it is Z641's word, the key joins its group's one file, and nothing collides in the group. One user-visible note, not a rule break: the region (`aria-label`), the pane title and the control would all be named "Present".
- The ASCII gate command (`:126`): it holds in effect, but differs from the rules file's text by leaving out `bin`. `ls -d bin` prints "No such file or directory", so the two print the same thing.
- Item 3's reason clause ("since the desktop app's window does not leave a page's full screen by itself on Esc", `:33`): it is not dictated output text, but if the builder carries it into a comment or `DESIGN.md` it is a false statement. It breaks the rules file's "Verify before asserting" rule (section 3).

Findings: item 3's reason clause must not be carried into a comment or `DESIGN.md`.

## Declined to judge

- Whether a full-screen element inside a `display: none` ancestor draws nothing, and whether bits-ui's dialogs draw above the full-screen element. A browser run would settle both, and none may be run.
- Whether `isMaximized()` is false during a macOS full screen, and whether `moved` or `resized` fire on the transition. Electron's `native_window_mac` source or the look would settle these; I did not fetch it.
- The Chromium Esc lines were read from Chromium's `main` branch, not from the Chromium version pinned by Electron 44.5.1. The Electron lines are from the exact tag.
- Whether the orchestrator's landing look can run full screen in Axel's own Chrome without taking his monitor. That look is the orchestrator's procedure, not the brief's.
- Whether to grant a `guarded.md` entry for item 8. That is Axel's ruling.

Agent usage: a6a8c0abc5e9e3d71, claude-opus-5-5, 176,558 tokens, 48 tool uses, 9.3 min.

## Closed
- Names (a), the `f` chord: closed in the brief, item 3 and decision 4 (`f` taken only with slides; the Focus chord's `f1` to `f3` do not run while the deck holds the focus, as `o` today), case 12 changed.
- Names (b): closed, item 9 puts the window-file rule at `DESIGN.md:436`; the write list names line 436.
- Premises (c): closed, the premise quotes the Electron v44.5.1 source lines and both macOS event orders; item 8 states the capture at `enter-html-full-screen` and forbids `isFullScreen() && !html`.
- Premises (d): closed, item 3 drops the Escape branch and its false reason; Esc is left to the host, seen by item 6's listener.
- Premises (e): closed, the guarded grep's output corrected, G47's scope stated.
- Premises (f): closed, 26 lines, `:113-146`, `write` at `Present.svelte:84`.
- Cases (g): closed, case 11 needs no scratch deck.
- Cases (h): closed, `npm run build` removed; the type check in `npm run test:quick` stands.
- Cases (i): raised to Axel as open item Z644 (a guarded entry for item 8); the brief makes the rule a pure function in `window-file.ts` either way.
- The question: closed in the brief. Item 1 (the box scrolls a tall grid, an opaque letterbox), item 3 (Space and Enter left to a focused control, `event.repeat` ignored), item 4 (a click ending a selection does not move; the letterbox counts as the frame), item 5 (the timer starts on entering; `cursor: none` over descendants), item 7 (full screen ends when the tab view is hidden, the view unmounts or the deck empties), item 8 (the captured state; `tellBounds` not sent during a page's full screen); cases 17 to 22 added for the implied inputs.
- Dictated text: holds; item 3's false reason removed.
