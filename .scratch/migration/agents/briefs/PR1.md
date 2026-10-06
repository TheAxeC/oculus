# Brief: PR1, the Present view's full screen: a Present control and `F` put the slide on the whole monitor, in a browser tab and in the desktop app

Size: a full step

Read `tools/oculus/.scratch/migration/agents/spec.md` first; its rules govern this step unchanged. The configuration lists no standards pages beyond it, and no ADR touches the step: the plan's configuration names no ADR folder and `ls docs/adr` at the hub root prints "No such file or directory".

A design ruling decides what is built. It never exempts the code: every line is written to the standards pages, so that people can read, use and maintain it.

## What is on the tree (read on main at 01d928259)

- The step line, `plan.md:645` (`grep -n "^- PR1 " plan.md`): "a Present control in the Present view's toolbar and a key put the slide frame into full screen on the whole monitor, in a browser tab and in the desktop app, with no rail, tabs or toolbar; Esc leaves; the arrows, space and a click move through the slides; the pointer hides while it rests". Its rulings: Z637 (Axel, the four Present steps) and Z641 (the orchestrator, automode, `grep -n "^- Z641 " plan.md`), whose words are under "What to build".
- The Present view is `src/lib/views/academic/present/Present.svelte`, 288 lines (`wc -l`). Its toolbar is the snippet `bar` (`:155`), holding Previous, Next, the Overview chip, the Slides button and the counter; the pane is `<Pane title=... {bar}>` (`:189`); the deck box `div.present` (`:193-206`) is the focusable region the keys are bound to (`onkeydown={keys}`), and it holds the empty state, the overview grid or the scaled stage. `keys` (`:113-146`) takes ArrowRight and PageDown (next), ArrowLeft and PageUp (previous), Home, End, `o`/`O` (the grid) and Escape (closes the grid only when it is open), and returns on any event with Alt, Ctrl or Meta. The frame's scale is `fit(width, height)` from the box's `bind:clientWidth` and `bind:clientHeight` (`grep -n "fit(width, height)\|bind:clientWidth" src/lib/views/academic/present/Present.svelte`).
- The place in the deck and the grid's state are the instance's (`write` at `Present.svelte:84`, `parsePresentState` at `src/lib/state/life/present.ts:98`), so two panes on the deck hold two positions.
- The view's words are `config/text/views/academic/present.yml` (26 lines): `present.next`, `present.previous`, `present.overview`, `present.toolbar` and the rest.
- No code calls the Fullscreen API today: `grep -rn "requestFullscreen\|fullscreenElement\|fullscreenchange" src` prints nothing.
- The desktop app grants the page the `fullscreen` permission (`src/desktop/decide/permissions.ts:7`, `GRANTED` holds `'fullscreen'`), so `requestFullscreen()` works in its window.
- The desktop app keeps the main window's state in `~/.oculus/window.json`: `stateOf` (`src/desktop/windows/windows.ts:203-211`) writes `fullScreen: win.isFullScreen()`, `keepState` (`:218-233`) writes it on `enter-full-screen` and `leave-full-screen` and on `close`, and the start puts a window back into full screen when the file says so (`:336`, `if (saved?.fullScreen === true) entry.win.setFullScreen(true)`). Electron emits `enter-html-full-screen` and `leave-html-full-screen` for a full screen the page asked for (`grep -n "enter-html-full-screen\|leave-html-full-screen" node_modules/electron/electron.d.ts` prints the declarations from `:4417`). Electron's type file does not say whether the window itself goes full screen then; Electron's source at the installed tag v44.5.1 (`node_modules/electron/package.json`) does, read by the brief check from `https://raw.githubusercontent.com/electron/electron/v44.5.1/shell/browser/api/electron_api_web_contents.cc`:
  - `SetHtmlApiFullscreen` (`:5116-5143`) calls `owner_window_->SetFullScreen(enter_fullscreen)` unless the window is already full screen, in which case it leaves the window as it is; `UpdateHtmlApiFullscreen` (`:5162-5168`) emits `enter-html-full-screen` and `leave-html-full-screen` after that call. So during a page's full screen the window is in its own full screen: `isFullScreen()` is true, `enter-full-screen` fires, and today's `keepState` writes `fullScreen: true`.
  - On macOS `setFullScreen` is asynchronous (`electron.d.ts:3355-3358`; `isFullScreen` is to be read only after `enter-full-screen` or `leave-full-screen`, `:5758-5761`), so `enter-html-full-screen` comes before `enter-full-screen`, and `leave-html-full-screen` before `leave-full-screen`.
  - An unmodified Esc never reaches the page in full screen: `PreHandleKeyboardEvent` (`electron_api_web_contents.cc:1703-1707`) hands it to the exclusive-access manager first, which ends the page's full screen, as a browser tab does. Leaving the window's full screen from the menu ends the page's full screen too (`electron_api_browser_window.cc:222-227`).
  - Electron resizes the window to the screen for a page's full screen because `disableHtmlFullscreenWindowResize` is `false` by default (`electron.d.ts:19529-19532`); the step leaves that option as it is.
- `HELP.md:139` is the Views table's row for `present` ("The public deck, one slide at a time as a 16:9 frame scaled to its pane, with an overview grid."); `DESIGN.md:382` is the Present decision ("... with the arrow keys, the on-screen controls and `O` for an overview grid; ..."). `grep -n "^| \`present\` \|^- The public deck is a live oculus view" HELP.md DESIGN.md` prints them.
- `agents/guarded.md` has no entry for the window file or the Present view (`grep -n "window.json\|Present" agents/guarded.md` prints nothing), so the step writes no test, and every case is a quoted run or a reading. G47 names `src/desktop/` for the link decision, the window options and the sender check; `stateOf` and `keepState` are none of those, so the step touches no entry's code. Whether item 8's rule gets a guarded entry and a test is Axel's ruling, open item Z644; the builder writes the rule as a pure function either way, and writes no test.
- `f` is the Focus page's chord letter (`config/layout.yml:26`, `chord: f`; `config/text/app.yml:12`, "f1-f3"), and the shell skips a key whose default a view prevented (`src/lib/shell/keys/keys.ts:224`), as it does for the deck's `o` today. Bits of the shell the deck lets through with Ctrl held (Ctrl+Tab, Ctrl+1 to 9, `keys.ts:198-214`) switch the pane's tab, which hides the tab view with `display: none` (`src/lib/shell/panes/TabView.svelte:16`).
- The frame is translucent over the wallpaper (`Present.svelte:276-279`), and the wallpaper is drawn by the Workbench (`Workbench.svelte:432`), outside the box. The pane body that scrolls a tall grid today (`Pane.svelte:153-157`, `overflow: auto`) is outside the box too.
- The base copy is `.agents/worktrees/PR1-base/tools/oculus/` with `unused-exports.txt` beside it, unpacked by the orchestrator at the base.

## What to build

When PR1 is done, a reader on the Present view presses the toolbar's Present control, or `F` while the deck holds the focus, and the slide fills the whole monitor: no rail, no tab strip, no toolbar, no pane border, in a browser tab and in the desktop app. Esc, `F` again or the browser's own way out leaves full screen, and the pane is as it was, on the slide the reader reached.

1. The full-screen element is the deck box `div.present`, so the toolbar (outside the box) and every part of the shell are hidden by the browser.
   - In full screen the box fills the screen and scrolls when its content is taller than the screen (a tall overview grid), its background is the page's opaque background colour (the wallpaper is not drawn in it, so the frame is drawn on that colour), and the frame is scaled by `fit` to the screen and centred, letterboxed, with no border and no corner radius on the frame. The overview grid and the empty state are drawn in full screen as they are in the pane.
   - The box takes the focus on entering, so the keys work at once.
2. The toolbar gets a control labelled Present (a word `present.present` in `present.yml`), placed after the Overview chip, pressed (`aria-pressed`) while this pane's box is in full screen. It is disabled while the deck holds no slides.
3. `keys` gains, with no Alt, Ctrl or Meta held and the key not a repeat (`event.repeat`):
   - `f` or `F`, while the deck holds slides: enter full screen, or leave it when this box is the full-screen element. With an empty deck the key is not taken, so it starts the Focus chord as it does today; with slides it is taken, so `f1` to `f3` do not run while the deck holds the focus, as `o` already does for the shell.
   - Space: the next slide; Shift+Space: the previous slide. When the focus is on a link, a button or another control inside the box, Space and Enter are left to that control.
   - The arrows, Page Up and Page Down keep their meaning, in and out of full screen. Escape keeps closing the grid as now; it adds nothing for full screen, since in both hosts the browser takes an unmodified Esc in full screen before the page and leaves full screen itself (premise above), which item 6's listener sees.
4. A click in the box in full screen, on the frame or the letterbox around it, goes to the next slide. A click on a link, a button or any other control inside the slide does what that control does and does not move; a click that ends a text selection (the selection not empty) does not move. A click in the overview grid picks a slide as now.
5. In full screen the pointer hides after 2 s with no pointer movement over the box, the timer started on entering as well as on each movement, and shows again on the next movement. Hidden means hidden over every part of the box, a link or a control included (the box and its descendants get `cursor: none` while hidden). Out of full screen the pointer is never hidden by this. The timer is the instance's, cleared when the box leaves full screen or the view unmounts.
6. The pressed state follows `document.fullscreenElement === box` through the `fullscreenchange` event, so leaving by the browser's own way (its Esc in a browser tab, the window's menu in the desktop app) is seen; a pane whose box is not the full-screen element is never shown as pressed.
7. A refused `requestFullscreen()` (the promise rejects) leaves the pane as it was and the control unpressed; nothing is thrown into the console as an unhandled rejection.
   - The box leaves full screen when its tab view is hidden (another tab of the pane shown, by a click or a shell key such as Ctrl+Tab), when the view unmounts (the pane or tab closed, the page switched), and when the deck becomes empty while in full screen (a push that removes its slides), so a full screen is never left showing a hidden or empty box, and no listener or timer outlives the view.
8. The desktop app never keeps a page's full screen as the window's full screen: `~/.oculus/window.json` written while a deck is in full screen, on any event or on close, holds the window's own state, so the next start opens the window as it was before the deck went full screen.
   - On `enter-html-full-screen` the window's own state is captured (`fullScreen: win.isFullScreen()`, `maximised: win.isMaximized()` and the bounds, read at that event, which on macOS comes before `enter-full-screen`); until `leave-html-full-screen`, `stateOf` gives that captured state, and the `enter-full-screen` and `leave-full-screen` the page's full screen causes write nothing new. So a window not in full screen before (case 15) is written not in full screen, and a window the reader put in full screen first (case 16) is written in full screen. A test of the form `isFullScreen() && !html` is wrong for case 16 and is not used.
   - The rule from the event sequence to the recorded state is a pure function in `src/desktop/decide/window-file.ts` beside the parser, called by `keepState`; `windows.ts` holds only the wiring.
   - A float window's bounds (`tellBounds`, `windows.ts:236-247`) are not sent while a page in it is in full screen, so a popped-out Present pane does not keep the monitor's size as its bounds.
9. The docs say what the reader now can do: `HELP.md:139`'s row names full screen with Present or `F`; `DESIGN.md:382` names the full screen, its element and keys; `DESIGN.md:436`, the decision that describes the window state, gets the window file's rule of item 8. The head comment of `Present.svelte` names the full screen among the keys it takes.

Files and their limits: `Present.svelte` stays at or under 520 lines (the rules file's size rule); when the additions take it over, the full-screen behaviour (the state, the pointer timer, the listener) moves into a module of its own beside it under `views/academic/present/` (a `.svelte.ts` file, at most 880 lines), named in the report. `windows.ts` stays at or under 880 lines.

## Cases

The ruled examples:

1. A browser tab on the Present view, the deck holding slides: press the Present control. The slide fills the monitor with no rail, tabs or toolbar; the control's pane, after leaving, is on the same slide.
2. In full screen, press Right, Space, Page Down: three slides on. Press Left, Shift+Space, Page Up: back three.
3. In full screen, click on the slide's frame: the next slide.
4. In full screen, leave the pointer still for 3 s: the pointer is hidden; move it: it shows.
5. In full screen, press Esc: full screen ends, the pane is on the slide reached, the control unpressed.
6. The deck focused in its pane, press `F`: full screen; press `F` again: out.
7. The same in the desktop app (a scratch app, as the orchestrator's landing look runs it): the Present control and `F` fill the monitor; Esc leaves.

The implied inputs:

8. Full screen entered, the overview grid opened with `O`: the grid fills the screen and scrolls when taller than it; a click on a tile shows that slide, still in full screen.
9. Full screen entered from one of two Present panes on the page: only that pane's control is pressed; the other pane's position is unchanged by the keys pressed in full screen.
10. The browser's own way out (a browser tab's Esc, which the browser takes before the page): the control is unpressed and the pointer shows.
11. A slide holding a link: a click on it does not move the deck; a link or tile title focused, Space or Enter does that control's action and the deck does not move; a drag that selects slide text does not move the deck.
12. The deck empty: the Present control is disabled and `F` is not taken (it starts the Focus chord, as today).
13. A press with Cmd or Ctrl held (Cmd+F, the browser's find): not taken by the deck.
14. `requestFullscreen()` refused (a page in an iframe without the `allowfullscreen` permission, as a reading of the code path, or a call made without a user gesture in the quoted run): the pane unchanged, no unhandled rejection.
15. The desktop app quit while a deck is in full screen: `~/.oculus/window.json` (the scratch HOME's) holds the window's state from before the deck's full screen; the next start opens the window not in full screen when it was not before.
16. The desktop window put in full screen by the reader first (the green button or the menu), then a deck full screen entered and left: the window stays in its own full screen, and the file says so.
17. In full screen, Ctrl+Tab (or a click that shows another tab of the pane, or Cmd+W closing the tab, or a digit switching the page): full screen ends, the control is unpressed, the pointer shows, and no listener or timer is left.
18. In full screen, `F` held down: one toggle.
19. A push that empties the deck while it is in full screen: full screen ends and the control is shown disabled.
20. In full screen, the pointer never moved after entering by `F`: it hides after 2 s.
21. A maximised desktop window, a deck put in full screen, then the app quit: the file says `maximised: true` and `fullScreen: false`.
22. A Present pane popped out into its own window, put in full screen and left: the float's saved bounds are its bounds from before.

The builder's first task, before any change, is the first run of every case above on the unchanged tree, with each case's result noted (on the unchanged tree, cases 1 to 16 show that no full screen exists: the run or the reading that shows it is quoted).

- No case of this step is a test: no entry of `agents/guarded.md` covers the Present view or the window file, and the rules file's test rule allows a test only for an entry. Every case is checked by a run the report quotes or by reading the code path, and the report says which.
- Cases 1 to 6, 8 to 14 and 17 to 20 are checked by reading the code path, with the lines that give each result quoted, and the type check inside `npm run test:quick` passing shows the view compiles; no browser is installed in `node_modules` (`ls node_modules/playwright-core` prints "No such file or directory"), and the builder installs none, never takes focus on the screen and never opens Axel's browser. The orchestrator runs every case in a page at the landing look.
- Cases 7, 15, 16, 21 and 22 need the desktop app, which the builder never starts: each is checked by reading `windows.ts`, `window-file.ts` and the Electron source lines of the premise, with the lines quoted, and the orchestrator runs them at the landing look.
- Case 14 is checked by reading the rejected promise's path; no run is available.

When the first run finds a case the brief's own rules get wrong, the builder stops there, before changing any code, and hands back the first run and that case, with the rule and the result it gives. The orchestrator rules on the case and resumes the builder with the ruling, and the final report carries it.

## Paths this step writes

- `tools/oculus/src/lib/views/academic/present/Present.svelte`
- `tools/oculus/src/lib/views/academic/present/` a new `.svelte.ts` module only when item "Files and their limits" calls for it, named in the report
- `tools/oculus/config/text/views/academic/present.yml`
- `tools/oculus/src/desktop/windows/windows.ts` lines 203-247
- `tools/oculus/src/desktop/decide/window-file.ts`
- `tools/oculus/HELP.md` line 139
- `tools/oculus/DESIGN.md` lines 382 and 436
- `tools/oculus/docs/diagrams/` (whatever `npm run diagrams` rewrites, when the new module adds an import)
- `tools/oculus/.scratch/migration/agents/reviews/PR1-report.md`

One path per line: a whole file, or a range of lines of a shared document, numbered as on main at the base. The step writes these paths and nothing else.

## Decisions taken in this brief (each reversible, none silent)

1. The full-screen element is the deck box, not the whole page: the browser then hides the toolbar and the shell with no change to the shell, and leaving restores the pane by itself.
2. The frame in full screen has no border and no corner radius, and the letterbox is the page's background colour: a slide on a monitor is shown edge to edge as a slide program shows it.
3. The words: `present.present: Present` for the control. The key `F` and the 2 s are Z641's.
4. `F` with slides is taken by the deck, so the Focus chord's `f1` to `f3` do not run while the deck holds the focus; with an empty deck it is left to the chord. This follows from Z641's key and the shell's rule for a prevented key, as the deck's `o` already does.
5. The letterbox is opaque (the page's background colour) in full screen, with no wallpaper behind the frame.
6. A click on the letterbox counts as a click on the frame.

## Libraries checked

- `screenfull` 6.0.2 (MIT, Sindre Sorhus, last release 2022-06): a wrapper over the Fullscreen API that adds the vendor-prefixed forms of old browsers. The page runs in Chromium (the desktop app's Electron) and in current browsers that ship the unprefixed `Element.requestFullscreen`, `document.exitFullscreen`, `document.fullscreenElement` and `fullscreenchange`, so it would replace three direct calls and add nothing the step needs. Not added.
- None found for the pointer's idle hide, which is one timer.

The builder adds no dependency. A library the builder finds that would cover its work is reported, not installed.

## Read, with sections or line ranges

1. `agents/spec.md` whole: the rules.
2. `src/lib/views/academic/present/Present.svelte` whole: the view, its keys, its box and its toolbar.
3. `src/lib/views/academic/present/Slide.svelte` and `parts/*.svelte`: what a slide holds that a click must not move past (links, controls).
4. `src/lib/state/life/present.ts:1-80` and the functions `fit` and `parsePresentState`: the scale and the instance's state.
5. `config/text/views/academic/present.yml` whole.
6. `src/desktop/windows/windows.ts:180-340` and `src/desktop/decide/window-file.ts` whole: the window file and its writes; the Electron lines the premise quotes.
7. `HELP.md:139`, `DESIGN.md:382` and `DESIGN.md:436`.
8. `src/lib/shell/keys/keys.ts:190-230` and `src/lib/shell/panes/TabView.svelte`: the prevented-key rule and the hidden tab view.

## What it must do

As "What to build" gives it, items 1 to 9; every path, line and name there was checked on main at 01d928259.

## Conventions

- The rules file's, unchanged.
- Every user-facing word from the catalog through `t()`.
- No module-level mutable state: the pointer timer and the full-screen state are the component instance's (or the new module's, created per instance).

## Verify before you report

Run from `tools/oculus` in the worktree, each must hold, each output piped through the filter the rules file names:

1. `npm run test:quick` passes. The plan's whole verify list runs once, at landing on main.
2. The ASCII gate of the rules file, `LC_ALL=C perl -ne 'my $l = $_; $l =~ s/\xC3[\x80-\xBF]//g if $ARGV =~ m{^config/}; print "$ARGV:$.:$_" if $l =~ /[^\x20-\x7E\n]/; close ARGV if eof' $(find src tests config -type f ! -name local.yml)`, prints nothing.
3. `sh utils/unused-exports.sh` exits 0, and its output equals the base copy's `unused-exports.txt` but for lines the step's own change explains, each named.
4. `wc -l` over every file the step writes: each within the rules file's size rule.
5. The step adds or changes no test, and the report says so in one line.
6. Each new or changed sentence of HELP.md and DESIGN.md is read against the rules file's rules on list items and sentence length, and each place it departs from them is named in the report with why it needs its form.

## Report

Write it to `tools/oculus/.scratch/migration/agents/reviews/PR1-report.md`, with these parts in this order.

- The first line: anything NOT done, or "Everything in the brief is done".
- The open items of the state file, verbatim, which hold only what the user must rule on.
- The cases' first run: every case of "Cases" by its number, none left out, each with the command or the reading that checked it and its output as printed, and each case the brief's rules got wrong with the rule, the result and the orchestrator's ruling.
- The cases after the change, each the same way.
- The DONE / NOT DONE table with the checks above and their output as printed, the character-set check's line and its exit status included.
  - A line shortened with "..." is not verbatim.
- The files with line counts.
- Every judgment call the brief left open.
- Every host- or user-visible change with its before and after, naming the view, the state to put it in and what to see, for the landing look.
- How item 8's code follows the Electron source lines of the premise, for both macOS event orders.
- Anything in the brief that was wrong or impossible, with the evidence.
