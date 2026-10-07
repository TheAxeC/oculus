# Brief check of PR4 (oculus/migration)

**Scope.** I read the brief on disk, `plan.md` (the PR4 line at :673, Z637 at :1409, Z680 at :1452), `agents/spec.md`, `agents/guarded.md` G47 (:31), G48 (:134) and G53 (:110), and the tree on main at `c0a4af9c` (`git rev-parse --short HEAD` prints `c0a4af9c`). I changed no file, ran only read-only git commands, and never opened `config/local.yml`.

## 1. Names

1. **`linkDecision` and its type `Where` (`src/desktop/decide/links.ts:13-14, 44-53`).**
   - It has one caller, `route()` in `src/desktop/windows/windows.ts:110-116`, found by `grep -rn "senderOf\|mayCall\|linkDecision\|printTarget\|placeWindow\|entryOf\|printPdf" src tests`.
   - `route` is an if-chain that ends in `else refuse(url)`. A new kind that `route` does not handle is refused silently. The type check would not catch it, because the chain is not an exhaustive switch.
   - `route` is also reached from `will-frame-navigate` (`windows.ts:195-201`) and from `follow()` (`:143`). So a main window that *navigates* to `/present/show` (a plain link, not only `window.open`) would also open an audience window. The brief only speaks of `window.open`.
   - The head comment of links.ts (`:6-10`, "That page at `/` opens in an app window ... Any other ... address, the server's own file addresses included, goes to the default browser") becomes false. The file is in the write list.
   - `tests/server/desktop/window-guard.test.ts:24-40` is in the write list.
   - `DESIGN.md:570` ("an address of another origin opens in the default browser") and `docs/window.md:7` ("A link to another site opens in the default browser") stay true.
2. **`senderOf`, `mayCall` and `Sender` (`sender.ts:17, 26-40`).**
   - The caller is `bridge.ts:101-113` (`callerOf`). `bridge.ts` is not in the write list.
   - It stays correct: `windows.entryOf(event.sender)` returns null for any window outside the windows list (`windows.ts:418-424`), so an audience window is refused before `senderOf` is consulted.
   - The head comment of sender.ts (`:1-7`) lists the senders and becomes incomplete. It is in the write list.
3. **`PRINT_CHANNELS` in `src/desktop/decide/channels.ts:37-38`.** This is the print window's pattern for "may call nothing" (`mayCall` at `sender.ts:39`). If the builder follows the pattern the brief names (print.ts and `printTarget`) and adds a list for the audience sender, `channels.ts` must change, and it is not in the write list. The brief should either add `channels.ts` or say that `mayCall` refuses the audience sender without a list.
4. **`placeWindow` (`place.ts:63`).**
   - Callers are `windows.ts:364, 368, 389`, all in the write list.
   - The head comment of place.ts (`:1-5`, "The main window's place and the places of popped-out windows are placed by the one function") becomes incomplete. It is in the write list.
5. **The windows list and `entryOf`, which decide permissions.**
   - `src/desktop/app.ts:143-155` grants permissions only when `windows.entryOf(contents)` is non-null, and `permissions.ts:7` grants `fullscreen` that way.
   - A window kept out of the list, as Z680 (7) and the brief require, is therefore **denied the `fullscreen` permission**.
   - In the desktop app with one display, part 2's Full Screen control and its F key in the audience window would be refused, so case 18 fails in the app.
   - `app.ts` is not in the write list, and the brief does not name the fix (for example, the permission handlers also asking the audience windows).
   - Giving the audience window its own session to escape this would break the `BroadcastChannel` sync, since a channel crosses only windows of one session. The brief should state that the audience window stays in the default session.
6. **`windows.focused()` and the menu.**
   - `app.ts` wires `closeWindow: () => windows.focused()?.win.close()`, and the menu gives it `Cmd+Shift+W` (`menu.ts:52-53`).
   - `focused()` (`windows.ts:427-430`) falls back to `lastMain()` when the focused window is not in the list.
   - So with the audience window focused, Close Window closes the presenter's **main** window. The zoom items (`app.ts`, `zoom`) also act on the main window.
   - `app.ts` and `menu.ts` are outside the write list, and the brief does not mention this.
7. **`present.key_hint` (`present.yml:39`).**
   - Its only reader is `Slide.svelte:72-74`, which draws it in the foot of the deck's first slide whenever `first` is true. The print route passes `first={false}` (`+page.svelte:119`).
   - Part 7 has the hint name P. The brief does not say whether the audience window passes `first={false}`. If it does not, the audience reads the key hint on the projector.
8. **`present.present_tip` (`present.yml:51`).**
   - Its only reader is `Bar.svelte:63`, the tip of the Present (full screen) control, which names F.
   - Part 7 says this tip names P. P starts the *Presenter* control, and part 1 gives that control "a tip naming its key", which is a new key. Naming P in Present's tip looks wrong: it would describe a key the Present control does not take.
9. **`present.counter`.** It is reused for the presenter's counter (`Bar.svelte:77`). No conflict.
10. **The route `/present/show`, and `P`/`p` as names.**
    - `/present/show` has no hit anywhere (`grep -rn "/present/show\|presenter\|Presenter" src config tests docs HELP.md DESIGN.md README.md` prints nothing).
    - The shell has the chord keys `p1-p4` (`HELP.md:43`). `keys.ts:224` drops a key only when `event.defaultPrevented` is set, so the P handler must call `preventDefault`, as O and F do. Otherwise P arms the Projects chord.
    - F on an empty deck returns without `preventDefault` (`Present.svelte:293`). The brief's "P on an empty deck does nothing" does not say whether P should still be consumed there.
11. **`docs/window.md`.**
    - The sentence that lists the app's windows is `docs/window.md:7` (the section "The window and the app", which names "the PDF export ... printed by a hidden window").
    - The write list allows only lines 45-60, and the premise cites `:50-53`, which are Float, Drag, Show a page and the pane menu.
    - The sentence the step makes incomplete is outside the write list.
12. **Hits outside `tools/oculus`.** A repository-wide `grep -rln` for these names finds only ledger files under `.scratch/` (plan, briefs, reviews and patches). Those are history and nothing there becomes false.

## 2. The step line

1. **The PR4 line (`plan.md:673`).**
   - "the reader sees the current slide, the next, the slide's notes and a timer" maps to part 4.
   - "the audience sees the slide alone" maps to part 2.
   - "in a second window of the desktop app or a second browser window" maps to part 2.
   - "the two kept on the same slide" maps to part 3.
2. **Z680, item by item.**
   - (1) maps to part 1.
   - (2) maps to part 2: the route, `window.open` in both hosts, the browser's F and Full Screen control, and the desktop's full screen on another display or a window beside the main one.
   - (3) maps to part 3. Z680 says "a click move[s] both from either window". Part 3 lists a click only for the audience window, and part 4 says "The keys of part 3 move the slide there" without saying whether a click on the presenter's current slide moves it. PR1's `advance` acts only in full screen (`Present.svelte:332-336`).
   - (4) maps to part 4. (5) maps to part 5. (6) maps to part 6. (7) maps to part 2.
3. **No part of the line or of Z680 lacks a requirement.**
4. **The two records of Z680 disagree on Resume.** `choices.md:19` says "a timer with Pause and Reset". `plan.md:1452` and the brief say "Pause, Resume and Reset". The brief follows plan.md.
5. **Z637 (`plan.md:1409`).** "PR4 (the presenter screen with notes)" maps to part 4.

## 3. Premises

1. **Line 13 holds.** `wc -l` prints Present.svelte 497, Bar 98, Slide 94, Overview 94, Panel 165, fullscreen.svelte.ts 112, keys.ts 30, markup.ts 101. `ls` lists 10 items, and `utils/folder-check.sh` exits 0.
2. **Line 14 holds.** I read `present.ts:59-65, 209-212, 220-223` and `Present.svelte:124, 144-146, 184-186, 260-263`.
3. **Line 15 holds.** `Present.svelte:142` reads `const deck = $derived(liveDeck() ?? filesDeck);`.
4. **Line 16 holds.** The keys are at `:265-323` and bound at `:386`. `grep -n "'p'" src/lib/views/academic/present/*.svelte` prints nothing (exit 1).
5. **Line 17 holds.** I read `fullscreen.svelte.ts:13, 47-60, 75-79`.
6. **Line 18 holds.** `Bar.svelte:61-68`.
7. **Line 19 holds, with one imprecision.** `model-entities.ts:363-371` has `notes?: string`, and `kinds.ts:232-234` copies it. The "`deck/read.ts:400-430`" reference is ambiguous between two files of that name. It is `src/lib/data/sources/deck/read.ts`, whose grid and summary objects at `:398-431` carry no notes. `grep -rn "notes" src/lib/views/academic` prints nothing. `deckShape` is `unchangedAs` (`shapes.ts:31-33`), so notes survive the page's read.
8. **Line 20 holds.** `grep -rln "^notes:" deck projects/*/*/present` prints nothing.
9. **Line 21 holds.** The print route files are 17, 9 and 154 lines. `printAddress` is at `present.ts:443-449` and the path constant at `:444`. `src/routes/present` holds 1 item and `src/routes` holds 10.
10. **Line 22 holds.** `grep -rn "BroadcastChannel" src` prints nothing. `ui.svelte.ts:414-419` is `loadUi`, with `followKey` on the storage event.
11. **Line 23 holds.** `guard` is at `windows.ts:189-206`, `linkDecision` at `links.ts:44-53`, `senderOf` at `sender.ts:26-30` and `printTarget` at `:47-61`. One thing the premise does not say: `guard` always answers `{ action: 'deny' }` (`windows.ts:191-194`), so in the desktop app the page's `window.open` returns `null` (see section 4, finding 5).
12. **Line 24 holds.** `displays()` is at `windows.ts:91-97`, `placeWindow` at `place.ts:63-67`, and print.ts is 75 lines. `openFloat`'s default place is on the primary display (`:389-398`).
13. **Line 25 holds.** The folder item counts are decide 10, windows 7, `state/life` 10, `tests/server/desktop` 4, `config/text/views/academic` 3.
14. **Line 26 holds.** `present.yml` `:39`, `:50`, `:51`.
15. **Line 27 is wrong in one place.**
    - `docs/views.md:95-107`, `HELP.md:103`, `DESIGN.md:478`, and `DESIGN.md:570` and `:574` hold.
    - `docs/window.md:50-53` is not "the app's windows". That sentence is `docs/window.md:7`, which `sed -n 5,12p docs/window.md` shows (see section 1, finding 11).
16. **Line 28 holds.** G53's test file is confirmed by `PR1-landing.md:19`: `tests/server/desktop/window-file.test.ts`, 11 rows.
17. **"No ADR folder exists" holds.** See section 7.
18. **The brief names no base copy.** `spec.md:32` says "The brief names a base copy", and `spec.md:83` makes the builder compare `utils/unused-exports.sh` with "the base's, which the brief names". PR3's brief named `PR3-base`. PR4's line 9 names neither, yet case 0 ("first run ... on the unchanged tree") and verify item 4 need one. `ls -d .agents/worktrees/PR*` shows only `PR1-base` and `PR3-base`.
19. **The brief's sparse checkout lacks `deck`.** PR3's brief said "holds the plan's paths plus `deck`". PR4's line 9 says only "the plan's paths", and `worktree_paths` in `.agents/plan.yaml` holds no `deck`. The brief should say where the cases' copy of `deck/` is taken from.

## 4. Cases and checks

1. **Test choice.** Keeping only cases 13 and 14 as tests fits `spec.md:57`, which allows a test only as the test of a `guarded.md` entry.
   - G47 covers the link decision and the sender check.
   - The display choice (case 15), the channel's message check (case 11) and the view's behaviour fall under no entry (`grep -n "place\|display\|BroadcastChannel\|Present" agents/guarded.md` finds no such entry). A new entry would need Axel's yes.
   - G53's test is run because `windows.ts` changes (verify item 2), which `spec.md:57` requires.
2. **How the builder runs the browser cases.**
   - Cases 1-12, 18 and 20 are to run "in a browser", and the brief does not say which one. No `playwright` or `puppeteer` is in `node_modules`; `ls node_modules | grep -x ...` prints only `electron`.
   - PR1's brief (`PR1.md:86`) forbade opening Axel's browser.
   - PR3's builder ran its page runs "in standalone hidden Electron windows against the scratch server" (`PR3-report.md:355`).
   - The brief bans starting the desktop app "by any route" without saying that a standalone Electron script (which is not oculus's app, does not run `src/desktop/main.ts` and so takes no oculus single-instance lock) is allowed.
   - With that route the builder can do the whole thing:
     - load `/` of port 8796 in a window;
     - let `setWindowOpenHandler` allow the popup, so the audience window is a real `window.open` child and `BroadcastChannel` crosses within the one session;
     - read both windows by `executeJavaScript`;
     - press keys by `sendInputEvent`;
     - press the Presenter control with `executeJavaScript(code, true)` (a user gesture, which `window.open` and `requestFullscreen` need).
   - Limits the brief should name:
     - Hidden windows throttle timers, which matters for the 2 s rest, the 2 s presenter beat and the 5 s silence; `backgroundThrottling: false` is needed.
     - Real full screen (case 18) in a hidden window is not reliable, so case 18 may have to be a look at landing.
   - Claude in Chrome, the other route, uses Axel's own Chrome. Its tab group does not reliably expose a popup window opened by the page.
3. **Case 15** asks for "a run of the pure function the host calls, quoted". That is consistent: it is no test, and a one-off `node --experimental-strip-types` or `tsx` run is no prototype standing in for a test. The brief could name the command.
4. **Case 16.** "`~/.oculus/window.json` holds no entry for it" checks a file that only ever holds one main window's state (`window-file.ts:1-5`, `record()` only for `kind === 'main'` at `windows.ts:224`). It cannot differ, so it proves nothing. Case 16 omits the desktop risks that do exist:
   - a second Presenter press opening a second app window (finding 5 below);
   - F or Full Screen refused (section 1, finding 5);
   - a slide link navigating the audience window (finding 6 below);
   - the audience window closing with the window that opened it.
5. **Case 7 and part 6 rest on browser-only behaviour.**
   - Named-window reuse, and seeing the audience window closed through the `window.open` handle, are browser behaviour.
   - In the desktop app, `guard` denies every `window.open` and the host makes the window itself, so the page gets `null`. The frame name is ignored and nothing dedupes.
   - Part 2 must say that the host brings an existing audience window for that address forward instead of making a second one.
   - Part 3 or 6 must say how the presenter learns the audience window closed when it holds no handle, for example a "closed" message the audience sends on `pagehide`.
   - Neither is stated, and no case covers either in the app.
6. **Part 2 omits the navigation guard.**
   - It lists only G47's web preferences for the audience window. print.ts, the pattern it names, also denies `window.open` and blocks navigation (`print.ts:49-52`).
   - G47 requires that "a navigation or a window opened to any other address goes to the default browser ... and never opens in an app window".
   - A slide's Markdown link clicked in the audience window would navigate an app window, which has the preload, to that address, because `guard()` is wired only for list entries (`windows.ts:335`).
   - The brief should require `show.ts` to route its window's `window.open` and its main-frame navigations through `linkDecision`, and should add the matching case.
7. **Verify item 6 cites a page that does not exist.** It reads changes "against the standards pages' rules on list items and sentence length". `.agents/plan.yaml` has `standards: []` and the state file names only `spec.md`, which holds no such rule. PR3's report said so (`PR3-report.md:356`).
8. **The verify order departs from `spec.md:25`.** Verify item 1 runs `npm run test:quick` and item 3 runs `npm run diagrams` afterwards. `spec.md:25` says diagrams "runs right before each run of the verify list and at no other time".
9. **Spec checks missing from the brief.**
   - The verify and report sections do not ask for the `utils/unused-exports.sh` comparison (`spec.md:83`), and the base output it needs is not given.
   - They do not ask for the history-words grep of new comments and titles (`spec.md:42`). Those rules still bind through "its rules govern this step unchanged".
10. **Read list.** It does not name the `DESIGN.md` sections the step is measured against (`spec.md:7`). It should name at least `:478`, `:570` and `:574`, which the step rewrites.
11. **Case 6.** "P while focus is in an input" names no input inside the deck's box. An input outside the box never reaches the box's `keys()`, so the case passes on any tree.
12. **Case 11** has no row for a known kind with a wrong field type, for example `{kind: <slide kind>, key: 5}`. See section 5, finding 11.

## 5. The question

1. **Case 1** cannot pass without parts 1, 2 and 4 working in a browser. It says nothing about the desktop host.
2. **Cases 2 and 3** could not pass without the sync working.
3. **Case 4** holds.
4. **Case 5** holds.
5. **Case 6** can pass without the goal in two ways. The input row passes trivially (section 4, finding 11). P not calling `preventDefault` would pass "does nothing" while arming the shell's `p1-p4` chord.
6. **Case 7** can pass in a browser while the desktop app opens a second audience window each press, since the host dedupes nothing.
7. **Case 8** can pass in a browser by polling `handle.closed`, while in the desktop app, where the handle is `null`, closing the audience window by hand ends nothing.
8. **Case 9** holds.
9. **Case 10** holds for two different decks. It does not cover one deck presented from two panes (section 6, finding 7).
10. **Case 11** can pass with a check that reads only `kind`. A well-kinded message with a wrong `key` then reaches `indexOf`, which falls back to slide 1 (`present.ts:209-212`), so the audience jumps.
11. **Case 12** holds for the reload. It does not catch the opposite error: the audience declaring the end while the presenter is alive but throttled (section 6, finding 4).
12. **Case 13** can pass while `route()` refuses the new kind, because the chain ends in `refuse`. Only look 16 would show it.
13. **Case 14** holds. The refusal in practice comes from `entryOf` returning null (`bridge.ts:103-104`).
14. **Case 15** can pass while the host passes the wrong window. The brief says "the main window"; the window that asked is `route(from, ...)`'s `from`, which may be a float window.
15. **Case 16** can pass without the goal: the `window.json` half cannot differ (section 4, finding 4).
16. **Case 17** holds.
17. **Case 18** can pass in a browser while the app refuses full screen to the audience window, because the permission handler checks `entryOf`.
18. **Case 19** holds, as a look.
19. **Case 20** holds.
20. **The step-line check (cases 1-3 and 16).** In a browser it could not pass without the goal. In the app it could pass, through cases 7, 8 and 18, without the audience window behaving.
21. **Part 1** holds, apart from P's `preventDefault`.
22. **Part 2** could be "done" with no navigation guard, no dedupe and no full-screen permission in the app (section 4, findings 5 and 6; section 1, finding 5).
23. **Part 3** holds in a browser.
24. **Part 4** contradicts part 6. Part 4 replaces "the slide frame and the overview", while part 6 says Esc closes the overview first, implying the overview can be open while presenting. It is unclear whether O or the Overview chip opens the grid over the presenter screen.
25. **Part 5** holds.
26. **Part 6.** "Closing the pane or its tab ends it the same way" has no case.
    - Views are drawn again on a layout change. `tab-frames.svelte.ts:3-4` says "a layout change (a pane added, a tab moved, a page switched) draws the panes of the page again", and `Present.svelte:236` notes the remount on a page switch.
    - A teardown therefore cannot tell a pane closed from a page switched.
    - If the presenter state lives only in the component, switching a page ends the presentation and closes the audience window. If it lives in the instance state, closing the tab ends nothing until the 5 s silence, and the audience shows "ended" instead of closing.
    - Decision 3 ("held in the pane only; a reload resets it") does not settle which.
27. **Part 7** needs `docs/window.md:7` (section 1, finding 11) and a correct tip key (section 1, finding 8).

## 6. Implied inputs

1. **A root or path with unusual characters.**
   - `BroadcastChannel` and `window.open` names accept any string, and the address is built by `URLSearchParams`, as `printAddress` builds the print address.
   - The risk is collision. A name made by joining root and path with a separator a folder name may hold (`:` or `/`) lets two decks share a window and a channel.
   - Expected: the name is an unambiguous encoding of both, such as `URLSearchParams` or a JSON pair, with a fixed prefix so it is never `_blank`, `_self`, `_top` or `_parent`.
   - The brief does not state it. `spec.md:67` asks for the collision check.
2. **The audience address opened by another page or a Markdown link.**
   - In the app, a link navigation in a main window reaches `route` through `will-frame-navigate`, so it opens an audience window too. In a browser it opens a tab.
   - Expected: after 5 s the page shows "The presenter screen has ended." with Close.
   - In a browser, a tab not opened by script cannot `window.close()` itself, so Close does nothing there. Expected: Close is shown only when it can close the window, or a sentence says to close the tab. The brief does not cover this.
3. **A deck removed, or emptied, while presenting.**
   - Expected: the presenter screen ends, the audience window closes, and the pane shows the Present view's empty or failed state. PR1's full screen already leaves when there are no rows (`fullscreen.svelte.ts:98-100`).
   - A removed current slide falls back to the first slide (`indexOf`). Expected: both windows show slide 1.
   - Not stated.
4. **The presenter hidden or throttled.**
   - Another tab of the same pane keeps the view mounted (`provideTabState(shown)`, `use.ts:30-37`). A page switch remounts it.
   - Expected: presenting survives a tab switch, a page switch and any layout redraw, and ends only on End, Esc, the audience window closing, or the tab or pane closing. This needs the presenting flag and the timer start outside the component, and if they go into `PresentState` that is a key of the layout saved under `~/.oculus` (`spec.md:18`, a user-visible shape).
   - Chrome throttles a hidden page's timers, down to one wake-up a minute after 5 minutes hidden. Electron throttles a minimised or occluded window. A 2 s beat against a 5 s silence then makes the audience show "ended" mid-talk.
   - Expected: the beat is not the only signal of an end. The presenter also sends "end" on `pagehide`, and an audience showing "ended" resumes when its presenter speaks again. The brief says neither.
5. **The desktop app's float windows, and the presenter in one.**
   - `route(from, url)` knows the window that asked, which may be a popped-out float.
   - Expected: the audience goes full screen on a display other than *that* window's, and closes when that window closes or with the last main window, as floats do (`windows.ts:344-348`). The brief says "the main window" in both places.
6. **Presenter full screen and PR1's auto-leave.**
   - The pane leaves full screen when its tab is hidden (`fullscreen.svelte.ts:98-100`). Expected: presenting continues out of full screen.
   - Esc in element full screen is taken by the browser to leave full screen. Expected: the first Esc leaves full screen, and a second ends presenting. Part 6 does not say.
   - In full screen, a click on the next-slide preview or on the notes reaches `advance` (`Present.svelte:332-336`) and moves both windows. Expected behaviour is not stated.
7. **One deck presented from two panes.**
   - The two panes share one channel name and one window name. A second Presenter press opens no new window, since the name is the same, and both presenters answer the audience's moves from their own positions.
   - Expected: one presenter per deck. A second press on another pane either takes the audience over and ends the first, or is refused with a sentence. Not stated.
8. **The deck switched in the toolbar while presenting.** Part 4 keeps "the toolbar's other controls usable", the deck menu included. Expected: presenting the old deck ends (its audience gets "end") or the presenter screen stays on the old deck. Not stated.
9. **A server restart while presenting.**
   - The audience page has no socket, and its token comes from its load. After a restart main pages "take its new write token" (`docs/window.md:7`); the audience keeps the old one, so its re-read after "deck changed" fails.
   - On a port move, `moveTo` tells only list entries (`windows.ts:158-167`), so the audience stays on the old origin, which a `BroadcastChannel` does not cross.
   - Expected: the audience reloads itself when a read fails, or shows "ended". Not stated.
10. **The desktop app's full screen on a second display.**
    - `setFullScreen(true)` is macOS native full screen, which opens a Space. With macOS's "Displays have separate Spaces" off, a native full-screen window blanks the other displays, the presenter's included.
    - Expected: the audience covers the second display and the presenter's display stays usable, for example through `simpleFullScreen` or a window sized to the display's bounds.
    - In the host's full screen the page is not in the document's full screen, so the Full Screen control "hides itself in full screen" would not hide on the projector. Expected: it is hidden in both kinds of full screen, and the 2 s rest starts at load whether or not the pointer moves (as `fullscreen.svelte.ts:87-96` does).
11. **The key hint on the first slide** in the audience window and in the presenter's views (section 1, finding 7). Expected: the audience draws `first={false}`, as print does.
12. **Close Window (`Cmd+Shift+W`) with the audience window focused** closes the presenter's main window (section 1, finding 6). Expected: it closes the audience window and ends the presentation.
13. **P while presenting in full screen.** Brought forward with `window.open`, the window takes the focus. Expected behaviour (a second press while presenting) is not stated for full screen.
14. **The time-of-day and timer formats** (12- or 24-hour; the timer's unpadded hours as in "0:00:00") are reader-visible and unspecified. The builder should report its choice.

## 7. ADRs

1. None exist. `ls tools/oculus/docs/adr docs/adr` prints "No such file or directory" for both.

## 8. Dictated text

1. **"End of the deck"** (`grep -n "End of the deck" agents/briefs/PR4.md` gives :37) holds: ASCII, plain. It has no full stop where "No notes for this slide." has one. Both are placeholders in the presenter screen, so the builder should make them consistent or report why not.
2. **"No notes for this slide."** (:37) holds.
3. **"The presenter screen has ended."** (:39) holds.
4. **"the deck changed" and "end"** (:36) are message meanings, not reader text. The message shapes are a wire format the brief does not name, so `spec.md:18` makes the builder report them as a decision.
5. **The control labels "Presenter", "End", "Full Screen", "Pause", "Resume", "Reset" and "Close"** (:34, :35, :37, :39) hold against `spec.md:20`. "Full Screen" matches `desktop.yml:37` ("Toggle Full Screen"). "Present" and "Presenter" stand side by side in the toolbar, and each tip must tell them apart.
6. **"`present.key_hint` and `present.present_tip` name P"** (:40) breaks the rule that a string describes its own control. `present_tip` is the tip of Present, the full-screen control, and P does not act on it. The Presenter control's tip (part 1) is the place for P. A key hint naming P on the first slide is shown to the audience unless the audience passes `first={false}`.
7. **Verify item 6 (:137)** cites "the standards pages' rules on list items and sentence length", which do not exist (section 4, finding 7).

## Declined to judge

- Whether Chrome brings an existing named popup to the front on `window.open`, and whether it leaves element full screen when a page opens a popup, are not verified. Settling them needs a run in Chrome.
- Whether native full screen on macOS blanks the other displays depends on the system setting, which I did not read.
- Whether the orchestrator can take the desktop looks (cases 16 and 17) without G48's second-start effect depends on how the landing look sets HOME and the app's data folder, which this brief does not govern.
- That `GET /api/deck` sends each slide's `notes` I read from the code (`kinds.ts:232-234`, `deckShape` unchanged); I did not check it with a request.

Usage: agent id not known, claude-opus-5-5, about 218,000 tokens, about 61 tool uses, minutes not measured.

Agent: adc90b337fe7ebaaa, claude-opus-5-5, 229,636 tokens, 65 tool uses, 10.4 min.
