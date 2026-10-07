# Brief: PR4, Present's presenter screen: the reader's slide, next slide, notes and timer, the audience's slide alone, kept in step

Size: a full step

Read `tools/oculus/.scratch/migration/agents/spec.md` first; its rules govern this step unchanged. Then, in full: `tools/oculus/.scratch/migration/agents/briefs/PR2-design.md` (the deck format, where a slide's `notes:` is its front matter key), and `tools/oculus/.scratch/migration/agents/guarded.md` entries G47 and G53 (this step touches the link decision, the sender check and the windows of the desktop host, and a window that must stay out of the window file), and runs each one's test. No ADR folder exists (`ls tools/oculus/docs/adr docs/adr` fails for both), so no ADR touches this step.

A design ruling decides what is built. It never exempts the code: every line is written to the standards pages, so that people can read, use and maintain it.

The worktree is `.agents/worktrees/PR4`. Its sparse checkout holds the plan's paths, which leave out the hub's `deck/`: the cases copy `/Users/axelfaes/workspace/research-hub/deck/` (read only) into a scratch root of the scratch server and never write a deck of the hub (closes brief check, Premises 19). The base copy is `.agents/worktrees/PR4-base/tools/oculus/`, unpacked by the orchestrator at preparation with `git archive`, with `unused-exports.txt` beside it, the output of `sh utils/unused-exports.sh` on main at the base (closes brief check, Premises 18). Your scratch server uses port 8796 with a scratch HOME and is stopped by its own pid before you report. You never start oculus's desktop app, by any route (not `npm run app`, not `npm run test:slow`, not `tests/server/desktop/start.test.ts`, not the harness, not `src/desktop/main.ts`): a second start brings Axel's window forward (G48). The browser cases run in a standalone Electron script of your own under `$TMPDIR` (it is not oculus's app, loads only the scratch server's `/` on port 8796, takes no single-instance lock), its windows created with `show: false` and `webPreferences.backgroundThrottling: false`, never shown and never focused; the popup is a real `window.open` child (`setWindowOpenHandler` answering allow), both windows read with `executeJavaScript`, keys sent with `sendInputEvent`, and a press needing a user gesture made with `executeJavaScript(code, true)`. Axel's browser is never opened. A case a hidden window cannot show (real full screen) is read against the code and goes to the look. The desktop host's cases are read against the code and are looks the orchestrator takes at landing (closes brief check, Cases and checks 2).

## What is on the tree (read on main at c0a4af9c)

- The Present view is `src/lib/views/academic/present/` (`Present.svelte` 497 lines, `Bar.svelte` 98, `Slide.svelte` 94, `Overview.svelte` 94, `Panel.svelte` 165, `fullscreen.svelte.ts` 112, `keys.ts` 30, `markup.ts` 101, and the folders `acts/` and `parts/`) (`wc -l`, `ls`). The folder holds 10 items, the limit of `utils/folder-check.sh`, so a new file goes into a new or existing subfolder that takes the place of moved items, never as an eleventh item.
- The view keeps the current slide's key, not an index, in the pane's instance state: `PresentState = { slide, overview, recent }` (`src/lib/state/life/present.ts:59-65`), read at `Present.svelte:124` and `:144-146`, written by `write()` (`:184-186`), stepped by `step(by)` (`:260-263`) through `stepKey` (`present.ts:220-223`, clamped at both ends). `indexOf` (`:209-212`) falls back to 0 on an unknown key.
- The deck drawn is `liveDeck() ?? filesDeck` (`Present.svelte:142`): a source tab's unsaved text of a slide file is drawn (`acts/live.svelte.ts`).
- Keys are handled by `keys()` on the view's box (`Present.svelte:265-323`, bound at `:386`): arrows and PageUp/PageDown move, Home/End jump, O toggles the overview, F toggles full screen, Space and Shift+Space move, Escape closes the grid; any Alt, Ctrl or Meta returns at once (`:266`). P is not bound (`grep -n "'p'" src/lib/views/academic/present/*.svelte` prints nothing).
- Full screen (PR1) is the box's own `requestFullscreen()` (`fullscreen.svelte.ts:47-60`); the browser's Esc leaves it and `fullscreenchange` is read back (`:75-79`); the pointer hides after `POINTER_REST_MS = 2000` (`:13`).
- The toolbar is `Bar.svelte`: the deck select, Previous, Next, Overview, Present (`:61-68`, `onpresent`), Slides, Export, the status words and the counter. Bar holds no state.
- A slide's notes: `SlideBase` has `notes?: string` (`src/lib/data/model/model-entities.ts:362-371`); `kinds.ts:232-234` copies the front matter's `notes:` onto every file-made slide; summary and grid slides (`deck/read.ts:400-430`) carry none. No view draws notes (`grep -rn "notes" src/lib/views/academic` prints nothing). Notes reach the page whole with the deck from `GET /api/deck?root=&path=`.
- No deck on the tree has notes: `grep -rln "^notes:" deck projects/*/*/present` prints nothing. The cases run over a copy of the hub's `deck/` folder in a scratch root of the scratch server, with `notes:` added to the front matter of its second slide (two lines) and of one later slide (a long text, case 20); no case writes into `deck/` or a project.
- The standalone route `/present/print` (`src/routes/present/print/+page.server.ts`, `+page.ts`, `+page.svelte` 154 lines) reads `root` and `path` from the address, fetches `/api/deck` with the page's token, draws every slide with `Slide.svelte` in a 1280x720 frame, and has no socket. Its address is built by `printAddress` (`present.ts:443-449`). `src/routes/present/` holds 1 item; `src/routes/` holds 10.
- No cross-window channel exists: `grep -rn "BroadcastChannel" src` prints nothing. Pane state already crosses windows through localStorage's storage event (`src/lib/state/workbench/ui.svelte.ts:414-419`), but only for the same instance id.
- The desktop host: a page's `window.open` and every navigation go through `guard()` (`src/desktop/windows/windows.ts:189-206`) to `route()` and `linkDecision` (`src/desktop/decide/links.ts:44-53`), which opens an app window only for `/` with nothing or `?float=<id>`; any other address of the server's origin, a `/present/show` address included, goes to the default browser. `senderOf` (`src/desktop/decide/sender.ts:26-30`) gives `'page'`, with every channel, to any top-frame path of the server's origin other than `/find` and `/present/print`. `printTarget` (`sender.ts:47-61`) is the pattern for checking an address of a route: the server's origin, the path, no hash, exactly the params `path,root`.
- Displays: `displays()` (`windows.ts:91-97`) reads Electron's `screen.getAllDisplays()` and the primary display's work area; `placeWindow` (`src/desktop/decide/place.ts:63-67`) places a saved window; nothing picks a display other than the main window's. The print window (`src/desktop/windows/print.ts`, 75 lines) is a window kept out of the windows list and the window file, the pattern for the audience window.
- Folder sizes: `src/desktop/decide/` holds 10 items, `src/desktop/windows/` 7, `src/lib/state/life/` 10, `tests/server/desktop/` 4, `config/text/views/academic/` 3 (`git ls-files <d> | cut | sort -u | wc -l`).
- Text: the Present strings are `config/text/views/academic/present.yml` (`present.present` `:50`, `present.present_tip` `:51`, `present.key_hint` `:39`).
- Sentences this step makes incomplete: `docs/views.md:95-107` (the Present section, no presenter screen), `HELP.md:103` (the `present` row), `DESIGN.md:478` (the Decks bullet), `DESIGN.md` near `:570-574` (the native window and the windows bullet, which list the app's windows), `docs/window.md:7` (the app's windows, the print window among them) (`grep -n`; closes brief check, Names 11). Head comments: `links.ts:6-10`, `sender.ts:1-7`, `place.ts:1-5` (closes brief check, Names 1, 2 and 4).
- The desktop host's other paths an audience window meets (closes brief check, Names 1, 3, 5 and 6): `route()` (`windows.ts:110-116`) is an if-chain ending in `refuse(url)`, reached from `setWindowOpenHandler` (`guard`, `windows.ts:189-206`, which always answers `{ action: 'deny' }`, so in the app the page's `window.open` returns null), from `will-frame-navigate` and from `follow()` (:143); `mayCall` (`sender.ts:36-40`) answers false for any sender but `page`, `find-bar` and `print`, so an audience sender is refused with no channel list and `channels.ts` is unchanged; the session's permission handlers (`app.ts:143-155`) grant only to windows `windows.entryOf` finds, so a window kept out of the list is refused `fullscreen` (`permissions.ts:7`); Close Window (`app.ts:192`, `menu.ts:52-53`) closes `windows.focused()`, which falls back to the last main window (`windows.ts:427-430`) when the focused window is no entry; `present.key_hint` (`present.yml:39`) is drawn only on the first slide by `Slide.svelte:72-74` when `first` is true (the print route passes `first={false}`, `+page.svelte:119`); `present.present_tip` (`:51`) is the tip of Present, which names F (`Bar.svelte:63`); the shell's chord keys `p1-p4` (`HELP.md:43`) start on a P whose event is not `defaultPrevented` (`keys.ts:224`). `deck/read.ts` here is `src/lib/data/sources/deck/read.ts`, whose grid and summary slides (:398-431) carry no notes.
- G47's test file is `tests/server/desktop/window-guard.test.ts` (`senderOf`, `mayCall`, `printTarget`, `linkDecision`); G53's is `tests/server/desktop/window-file.test.ts`.

## What to build

Ruling Z680 decides the shape; Z637 asks for the presenter screen; Z685 settles what the brief check found open. Seven parts.

1. **Start.** A Presenter control in the Present view's toolbar, beside Present, with a tip naming its key P, and the key P (and p) while the deck has the focus, start the presenter screen; the P handler calls `preventDefault`, as O and F do, so the shell's `p1-p4` chord never arms, on an empty deck too. Both are disabled, or do nothing, while the deck has no slides. Starting opens the audience window (part 2) and turns the pane into the presenter screen (part 4) at the slide shown. Presenter on a second pane over a deck another pane presents takes the audience window over, and the first pane's presenter screen ends (Z685 (3)).
2. **The audience window.** A new route `/present/show?root=<root>&path=<path>` draws the deck's current slide alone, in the 1280x720 frame scaled to the window as the Present view scales it, on the slide background, with no toolbar, no rail, no counter and no key hint (`first={false}`, as the print route passes). It reads the deck from `/api/deck` with the page's token as the print route does, and reads it again when the presenter screen says the deck changed (part 3); a read that fails reloads the page once, then shows the end sentence (Z685 (9)). It has a Full Screen control and the key F, which put it in full screen (a browser enters full screen only from a press in that window); the control is hidden while the window is in full screen of either kind (the document's, or the desktop host's) and after 2 s of pointer rest from the page's load whether or not the pointer moved, as `fullscreen.svelte.ts:87-96` does; Esc leaves the document's full screen by the browser's own way.
   - In a browser the page opens it with `window.open(address, <the window name>, <a popup window's features>)`; the window name is a fixed prefix `oculus-present-` followed by the deck's root and path encoded with `URLSearchParams`, so it is never `_blank`, `_self`, `_top` or `_parent` and two decks never share it (closes brief check, Implied inputs 1); a second press brings the same window back.
   - In the desktop app the page's `window.open` reaches `guard` and `route(from, url)`, and answers null to the page. `linkDecision` recognises the route's address (the server's origin, the path `/present/show`, no hash, exactly the params `path,root`, checked as `printTarget` checks the print route) as a kind of its own, and `route` handles that kind with a branch of its own, so it is never refused by the chain's last `else` (closes brief check, Names 1). The host makes the window in `src/desktop/windows/show.ts`: an audience window already open for that address is brought forward and no second is made; the window is placed against `from` (the window that asked, a float window included): with simple full screen (`setSimpleFullScreen`, which makes no Space and leaves the other displays usable) on a display other than `from`'s when there is one, else as a normal window beside `from`; it closes when `from` closes and with the last main window, as floats do (`windows.ts:344-348`). It keeps G47's options (Node integration off, context isolation and the sandbox on), stays in the default session (a `BroadcastChannel` and a Web Lock cross only windows of one session), is no entry of the windows list, is never written to the window file (G53), and is not restored at the next start. Its own `window.open` and its main-frame navigations go through `linkDecision` as G47 says, so a slide's link goes to the default browser and never navigates the audience window (closes brief check, Cases and checks 6). `senderOf` gives its page a sender of its own, which `mayCall` refuses for every channel. The session's permission handlers grant it the `fullscreen` permission as they grant a window of the list (closes brief check, Names 5). Close Window with the audience window focused closes the audience window and so ends the presentation, never the main window behind it (closes brief check, Names 6). Any other address on that path (another param, a hash, another origin) keeps today's decision.
3. **Kept in step.** The presenter screen and the audience window keep one slide through a `BroadcastChannel` named as the window is. The presenter screen sends the slide key at every move and when the audience window says it has opened; the audience window draws the key it receives, and sends a move when its own keys or a click move it (arrows, Space, Shift+Space, PageUp, PageDown, Home, End, a click on the slide), so a clicker moves both whichever window has the focus. The presenter screen sends "the deck changed" when its deck is read again after a save, and "end" when it ends (part 6) and on `pagehide`. A message is read through a zod shape that checks its kind and every field's type; anything else is dropped, a known kind with a wrong field type included. Two decks presented at once do not cross. The message shapes are named in the report as a decision.
4. **The presenter screen.** In the pane, in place of the slide frame: the current slide large; the next slide smaller beside it, or the words "End of the deck." after the last; the current slide's notes under the next slide as plain text with their line breaks kept, scrolling when long, and "No notes for this slide." when it has none; the counter (`n / count`); the time of day as `HH:MM` on a 24-hour clock; a timer as `H:MM:SS` from `0:00:00`, counting from the Presenter press, with Pause, Resume and Reset. The keys of part 3 move the slide there; Previous and Next in the toolbar too; a click on the current slide moves to the next, and a click on the next slide's preview or on the notes does nothing (Z685 (8)). O and the Overview control open the grid over the presenter screen, and a press in it moves both windows; Esc closes the grid first. The toolbar's other controls stay usable; switching the deck in the toolbar ends the presentation of the old deck (Z685 (4)). Present (full screen of the pane) puts the presenter screen on the whole monitor as it does the slide; the pane leaving full screen (PR1's rules) leaves presenting on. Presenting is held in a page store keyed by the pane's instance id, never in the saved layout, so it survives a tab switch, a page switch and any redraw of the panes (Z685 (1)); `Present.svelte` reads it on mount.
5. **The saved deck.** While the presenter screen is on, both windows draw the deck as saved (`filesDeck`), never a source tab's unsaved text, so the audience sees the slide the presenter sees; a save redraws both. A deck removed or emptied while presenting ends the presentation, and the pane shows the Present view's own state for it; a current slide removed by a save falls back to slide 1 in both windows.
6. **End.** An End control in the presenter screen, Esc while the presenter screen has the focus (after the overview, which Esc closes first; in the pane's full screen the first Esc leaves full screen as the browser does, and the next ends), the audience window being closed, and the tab or the pane closed end it: the presenter screen sends "end", the audience window closes itself, and the pane is the Present view again at the slide shown. The presenter learns the audience window closed from a "closed" message the audience page sends on `pagehide`, which works in both hosts. While presenting the presenter page holds a Web Lock (`navigator.locks.request`) named as the channel; the audience page asks for the same lock, which it is granted only when the presenter page has gone (a reload, a closed ChromeTab, a crash); then, or on "end", it shows "The presenter screen has ended." with Close (Z685 (2)). Close is shown only when the page can close its own window (it was opened by `window.open`, or by the desktop host); otherwise the sentence is followed by "Close this tab to leave." (Z685 (10)).
7. **Text and docs.** Every string in `config/text/views/academic/present.yml` (the window title of the audience window, the controls, their tips, the two placeholders, the end sentences). `present.key_hint` names P beside the keys it names now; the Presenter control's tip names P; `present.present_tip` keeps naming F (Z685 (7)). `docs/views.md`'s Present section gets a paragraph on the presenter screen; `HELP.md:103`'s row names it; `DESIGN.md:478` names the audience route, the channel, the lock and the saved deck; DESIGN.md's windows bullet and `docs/window.md:7` name the audience window among the app's windows.

The file constraints: Svelte components at most 520 lines, other source files at most 880, comment lines at most 100 columns, no folder over 10 items. `Present.svelte` is at 497 lines: the presenter screen is a component of its own, and code moves out of `Present.svelte` rather than the file growing past 520. `src/desktop/decide/` holds 10 items, so nothing new goes there; `state/life/` holds 10, so the presenting store goes in the Present view's folder or a subfolder of `state/life` that takes moved items.

## Cases

1. The scratch copy of `deck/` with notes on its second slide, open in the Present view: press Presenter. The pane shows slide 1 large, slide 2 beside it, "No notes for this slide." (slide 1 has none), the counter 1 / n, the time of day and the timer at 0:00:00 counting. A window opens at `/present/show?root=...&path=...` showing slide 1 alone, with no key hint.
2. Case 1, then ArrowRight in the presenter pane: both windows show slide 2; the pane shows slide 2's notes with their line breaks, and slide 3 beside it.
3. Case 2, then Space in the audience window: both show slide 3. A click on the presenter's current slide: both show slide 4; a click on the notes: nothing moves.
4. The last slide in the presenter pane: the next slide's place reads "End of the deck."; ArrowRight leaves both on the last slide.
5. Pause stops the timer; Resume continues from the paused time; Reset sets it to 0:00:00.
6. P with the deck focused starts the presenter screen as the control does, and its event is `defaultPrevented`; P with focus in the toolbar's deck select (a form control inside the box) or with Cmd held does nothing; P on an empty deck does nothing and is `defaultPrevented`.
7. Presenter pressed again while presenting brings the same audience window forward; no second window opens. Presenter on a second pane over the same deck: one audience window, the first pane back to the Present view.
8. End: the audience window closes, the pane shows the Present view at the slide shown. The same for Esc in the presenter pane, for closing the audience window by hand, and for closing the presenter's tab.
9. A slide's file saved with a changed title while presenting: both windows redraw with the new title. Unsaved text in a source tab of that file: neither window changes until the save. The current slide's file deleted: both show slide 1.
10. Two decks presented from two panes at once: moving one moves only its own audience window. A deck whose root or path holds `:` or `/` beside another whose joined name would be the same gets a window and a channel of its own.
11. A message on the channel that is not one of the shapes (a number, an object without a kind, an unknown kind, a known kind with a field of the wrong type such as a number for the slide key): dropped, nothing moves, nothing thrown.
12. The presenter page reloaded while presenting: the audience window shows "The presenter screen has ended." and Close at once (the lock); the presenter page hidden in a background window for 10 s: the audience stays on its slide.
13. `linkDecision` over the audience address of the server's origin with exactly `path` and `root`: the audience kind. With an extra param, a hash, another origin, or `/present/show` with no `root`: not the audience kind (the server's page decisions stay as today: another origin goes to the browser for http, https, mailto). A test (G47). `route` handles the audience kind with its own branch, read against the code.
14. `senderOf` over the audience path: the audience sender, and `mayCall` for it is false for every channel in `channels.ts`. A test (G47).
15. The display chosen for the audience window: two displays, the asking window on the first: the second; the asking window on the second: the first; one display: none, a window beside the asking window. A run of the pure function the host calls (`node --experimental-strip-types` over a one-off script under `$TMPDIR`), quoted.
16. Desktop app (read against the code, then a look at landing): Presenter opens the audience window with simple full screen on the second display (with a second display) or beside the asking window (with one), as an app window, never the default browser; a second press brings it forward and makes no second window; F and the Full Screen control are granted; a slide's link in it goes to the default browser and the window stays on the slide; Close Window with it focused closes it and ends the presentation, the main window staying; closing the asking window closes it; after Quit and a start no audience window is restored.
17. Desktop app: the audience window's page calls the bridge (`window.oculusDesktop` is absent or every call refused). A look at landing.
18. The audience window's Full Screen control and F: full screen; the control hides in full screen and after 2 s at rest from load. Read against the code and seen at the look, since a hidden window shows no real full screen.
19. The presenter screen in light and dark themes: the notes, the counter, the timer and the next slide readable. A look at landing.
20. A slide whose `notes:` holds a long text: the notes scroll inside their place; the slides keep their size.
21. A tab switch, a page switch and a pane added while presenting: presenting stays on, the timer keeps counting, the audience window stays. The deck switched in the toolbar: the presentation ends.
22. The audience address opened by hand in a ChromeTab not opened by script: the end sentence with "Close this tab to leave." and no Close control.

The builder's first task, before any change, is the first run of every case above on the unchanged tree, with each case's result noted.

- A case of a code step (a script, or a product's code) becomes a test of the step only when the rules file's test rule calls for one: cases 13 and 14 (G47, an address that opens an app window with a page that must call nothing).
- A case kept as a test is run on the unchanged tree first.
- No prototype script stands in for such a test.
- Every other case is checked by a run the report quotes (the standalone Electron script against the scratch server on port 8796), and no test is kept for it; cases 16, 17 and 19, and the full-screen half of 18, are read against the code and are the orchestrator's looks at landing, and the report says so.

When the first run finds a case the brief's own rules get wrong, the builder stops there, before changing any code, and hands back the first run and that case, with the rule and the result it gives. The orchestrator rules on the case and resumes the builder with the ruling, and the final report carries it.

## Paths this step writes

- `tools/oculus/src/lib/views/academic/present/` any file, and any subfolder in it
- `tools/oculus/src/routes/present/show/` (new)
- `tools/oculus/src/lib/state/life/present.ts`
- `tools/oculus/src/lib/state/life/present.svelte.ts`
- `tools/oculus/src/desktop/decide/links.ts`
- `tools/oculus/src/desktop/decide/sender.ts`
- `tools/oculus/src/desktop/decide/place.ts`
- `tools/oculus/src/desktop/decide/window-options.ts`
- `tools/oculus/src/desktop/windows/windows.ts`
- `tools/oculus/src/desktop/windows/show.ts` (new)
- `tools/oculus/src/desktop/app.ts` (the permission handlers at :143-155 and Close Window at :192)
- `tools/oculus/src/desktop/bridge.ts` (only if the audience sender needs a line there)
- `tools/oculus/config/text/views/academic/present.yml`
- `tools/oculus/tests/server/desktop/window-guard.test.ts`
- `tools/oculus/docs/views.md` lines 95-107
- `tools/oculus/docs/window.md` line 7
- `tools/oculus/HELP.md` line 103
- `tools/oculus/DESIGN.md` line 478, and the windows bullet near lines 570-574
- `tools/oculus/docs/diagrams/*` (regenerated by `npm run diagrams`)
- `tools/oculus/.scratch/migration/agents/reviews/PR4-report.md`

The step writes these paths and nothing else. G47's Test line in `agents/guarded.md` gains the new test titles: the report's "Doc text" section gives the line, and the orchestrator applies it at landing.

## Decisions taken in this brief (each reversible, none silent)

1. The audience window is opened by `window.open` in both hosts and recognised by the desktop host's link decision, so no new bridge channel exists and the browser host needs nothing the desktop lacks (Z680 (2)).
2. The channel is a `BroadcastChannel`, which every same-origin window of one browser profile, and every window of the desktop app's one session, receives; the pane's saved state is not used, since it is keyed by one pane's id (Z680 (3)).
3. The timer starts at the Presenter press and is held with the presenting state in the page store; a reload resets it (Z685 (1)).
4. The window name and the channel name are `oculus-present-` and the deck's root and path encoded with `URLSearchParams`.
5. The presenter's end is heard through the Web Lock and the "end" message, with no beat (Z685 (2)).
6. "End of the deck." ends with a full stop, as "No notes for this slide." does; the clock is 24-hour `HH:MM` and the timer `H:MM:SS`.

## Libraries checked

Under `libraries: check`. The sync is the browser's `BroadcastChannel` and the display choice Electron's `screen`, both already available; a presenter-view library (reveal.js's speaker view, Slidev's presenter) would replace the slide drawing PR2 and PR3 built, which Z637 keeps. None found that covers the work without that.

The builder adds no dependency this brief does not name. A library the builder finds that would cover its work is reported, not installed.

## Read, with sections or line ranges

1. `tools/oculus/src/lib/views/academic/present/` whole: the view, its keys, its full screen, its toolbar.
2. `tools/oculus/src/lib/state/life/present.ts` and `present.svelte.ts` whole: the state, the helpers, the deck's staleness.
3. `tools/oculus/src/routes/present/print/` whole: the standalone route this step's route follows.
4. `tools/oculus/src/desktop/decide/links.ts`, `sender.ts`, `channels.ts`, `place.ts`, `window-options.ts`, and `src/desktop/windows/windows.ts`, `print.ts`, `src/desktop/app.ts:130-200`, `src/desktop/windows/menu.ts:40-60`, `src/desktop/bridge.ts:95-115` whole or in those ranges: the link decision, the sender check, the placement, the window that stays out of the windows list, the permissions and Close Window.
5. `tools/oculus/tests/server/desktop/window-guard.test.ts` whole: G47's rows, which the new rows join.
6. `tools/oculus/DESIGN.md:478` and `:565-580`, the sections this step is measured against and rewrites.

## Conventions

The rules file's. ASCII only in every file the step writes.

## Verify before you report

Run from `tools/oculus` in the worktree, each output piped through the filter the rules file names:

1. `npm run diagrams`, then `npm run test:quick` once, after the last change (`agents/spec.md:25`: diagrams right before each run of the list and at no other time). Its ASCII gate covers the files the step changes. The report quotes the lines it prints and the number of full-list runs. The plan's whole verify list runs once, at landing on main.
2. `npx vitest run tests/server/desktop/window-guard.test.ts tests/server/desktop/window-file.test.ts` passes, quoted (G47 and G53).
3. `sh utils/folder-check.sh` prints no refusal, `wc -l` of every changed `.svelte` and `.ts` file is within its limit, and `sh utils/unused-exports.sh` prints no name that `unused-exports.txt` in the base copy does not.
4. Each new or changed test is run on the unchanged tree and after the change.
   - A test of a behaviour the change adds or changes fails on the unchanged tree, in the form it has after its last change, and the report quotes that failure.
   - A test of a behaviour the change preserves passes after the change and, where it can run there, on the unchanged tree, and the report quotes those runs.
   - A case checked by a quoted run is no test and is not judged as one.
5. Cases 1 to 12, 15, 18, 20, 21 and 22 are run in the standalone Electron script against the scratch server on port 8796 and quoted (what was pressed, what each window showed).
6. The new comments and test titles are read against `agents/spec.md:42` (no history), and the report says so.

## Report

Write it to `tools/oculus/.scratch/migration/agents/reviews/PR4-report.md`, with these parts in this order.

- The first line: anything NOT done, or "Everything in the brief is done".
- The open items of the state file, verbatim, which hold only what the user must rule on.
- The cases' first run: every case of "Cases" by its number, none left out, each with the command or the reading that checked it and its output as printed, and each case the brief's rules got wrong with the rule, the result and the orchestrator's ruling.
- The DONE / NOT DONE table with the checks above and their output as printed, the ASCII gate's line included. A line shortened with "..." is not verbatim.
- The files with line counts.
- Every judgment call the brief left open.
- Every host- or user-visible change with its before and after.
- Anything in the brief that was wrong or impossible, with the evidence.
- A section "Doc text" with G47's new Test line for `agents/guarded.md`.
