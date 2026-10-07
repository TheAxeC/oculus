# PR4 report: Present's presenter screen

NOT DONE: nothing inside the brief is left unbuilt. Four things were read against the code and not run, as the brief assigns them to the orchestrator's looks at landing: the desktop host's runtime (cases 16 and 17, because no desktop app may be started), the themes (case 19), and the real full-screen half of case 18. Case 12's "hidden presenter" was run as a hidden window with throttling on, where `document.visibilityState` still read "visible", so it is not a proof of a truly occluded page (see the cases).

## Open items of the state file, verbatim

- Z681 (2026-10-07, M8's /spec, a clash between a design rule and an automode ruling): `tools/oculus/DESIGN.md:24` says "Not a rewrite of the data. The YAML in the hub is the source of truth and its shape does not change for oculus." Z672, which the orchestrator closed in automode, changes the hub's YAML for M8 (the hub's YAML checked and completed in the editor): it renames `options_from` to `from` in the `schema:` blocks of 16 hub files, adds `when:` conditions and new `schema:` blocks (career, literature radar), and changes values in the data itself (`access: public` to `open`, new venue categories, a new event role). A clash between a written design rule and a ruling is Axel's, so M8 waits. Options: (a) recommended: the sentence is reworded so that the hub's `schema:` blocks, which describe the data, may change to serve the editor's checks, while the records themselves keep their shape and change only where a value breaks its own rule (the Z468 departures); Z672 stands. Pro: one name for one thing across every schema, and the editor and the Findings view check the same declarations. Con: 16 hub files and the cockpit's two readers (`tools/cockpit/src/cockpit/selftest.py:595-621`, `page.py:706-709`) change. (b) the sentence stands and the hub's YAML keeps its keys: oculus reads `options_from` and `from` as two spellings of one key, and only the data departures are settled. Pro: no hub file's keys change. Con: three names for one thing stay, which Z672 called the lazy option. (c) the sentence stands strictly: no hub file changes at all, the data departures included, and M8 only reads. Pro: the hub untouched. Con: the Z468 departures stay as findings forever. The lazy option is (b).

## Disclosures that change what you would do next

- A path outside the brief's write list was edited: `src/routes/present/print/+page.svelte` (its own `read()` is now a call of the new shared `readDeck`). Reason: the print route and the audience route would otherwise carry two copies of the deck read; one reader ends the cause. Its check: the print page was loaded against the scratch server and reached `data-ready` with the deck, and a missing deck reached `data-failed` ("The deck could not be read: It is not inside a served root."). Revert is deleting that one file's diff; the audience route then needs its own read.
- Two read-only git commands were run by mistake (`git -C . log -1` and `git -C . diff --stat`, output discarded). They changed nothing.
- `npx vitest run tests/checks/tree/duplication.test.ts` was run once on its own (18 passed), since `test:quick` does not cover tests/checks and the step adds a second reader of the deck route. Full-list runs: 1.
- The brief's case 6 says the toolbar's deck `<select>` is "a form control inside the box". It is not inside the box (`box.contains(select)` returned false on the unchanged tree). The result the case wants (P with focus there does nothing) holds either way and was checked.

## The cases

First run on the unchanged tree (worktree at the base, scratch server on 8796 over a scratch copy of the hub with notes added to slides 2 and 7; Electron script, hidden windows):

1. `first2.txt`: "case 1: toolbar buttons = Previous ; Next ; Overview ; Present ; Slides ; Export to PDF | Presenter control present = false".
2. to 5. Need the presenter screen, which does not exist on the unchanged tree; not reachable (case 1 and 6 above).
6. "case 6: P keydown (key, defaultPrevented) = [["p",false]] | pane shows presenter screen = false | windows created = 0"; no `p` handler in the box.
7. to 11. Not reachable on the unchanged tree. Primitive probes there: `BroadcastChannel`, `navigator.locks` and `isSecureContext` all present; two `window.open` calls with one name make one window; a `steal: true` lock request leaves a queued request waiting until the thief releases.
12. "case 12: window.open created windows = 1" (primitive probe only; no presenter page to reload).
13. vitest on the unchanged tree: `expected { kind: 'browser' } to deeply equal { kind: 'audience', root: 'hub', …(1) }`.
14. vitest on the unchanged tree: `expected 'page' to be 'audience' // Object.is equality`.
15. `src/desktop/decide/place.ts` exported only `placeWindow` and `rectOf`; no function picks a display.
16, 17, 19. Read against the code (below), landing looks.
18. Not reachable (no audience window).
20. "case 20 (notes drawn on slide 2): {"key":"engine.md#0","notesText":false,"counter":"2 / 7"}".
21. Not reachable.
22. "case 1/22: /present/show window text = "404\n\nNot Found"".

Rulings needed from the brief's own rules: none stops the step; the wrong premise is the toolbar select above.

After the change (scratch server on 8796; each line is printed by the script named; the deck is the 7-slide scratch copy, slide order title, engine, summary:pillars, transition, summary:more, grid:ideas, closing):

1. `c1.cjs`: "windows created 1; audience url /present/show?root=hub&path=deck; presenter {"mode":"presenter","key":"title.md#0","cur":"title.md#0","next":"engine.md#0","notes":"No notes for this slide.","counter":"1 / 7","clock":"04:52","timer":"0:00:00",...,"hint":false,"toolbar":true}; audience {"mode":"audience","key":"title.md#0","ended":false,"hint":false,"toolbar":false,...}"; "timer reads 0:00:00 then 0:00:02 after 1.3 s".
2. `c1.cjs`: presenter "engine.md#0", next "summary:pillars", notes "First note line of the engine slide.\nSecond note line, kept on its own line.\n", counter "2 / 7"; audience key "engine.md#0".
3. `c1.cjs`: after Space in the audience: presenter and audience "summary:pillars"; after a click on the current slide: both "transition.md#0"; after a click on the notes and on the next slide's preview: both still "transition.md#0".
4. `c1.cjs`: last slide: presenter key "closing.md#0", next "End of the deck.", counter "7 / 7", audience "closing.md#0"; ArrowRight leaves both on "closing.md#0".
5. `c1.cjs`: Pause "0:00:07 then 0:00:07 1.5 s later"; Resume "0:00:08 1.3 s later"; Reset "0:00:00, then 0:00:01 1.3 s later (still running)".
6. `c6.cjs` and `c6b.cjs`: a `p` keydown dispatched on the toolbar select: mode view, no window, event `["p",false,false]`; Cmd+P on the deck: mode view, no window, `["p",false,true]`; `p` on the deck: mode presenter, 1 new window, `["p",true,false]`; on `deck-empty` (0 slides): "p on an empty deck: mode view, new windows 0; events [["p",true,false]]; Presenter disabled true; Present view text: The deck in projects/ideas/deck-empty/present draws no slides."
7. `c1.cjs` and `c7.cjs`: Presenter pressed again: "windows 2 -> 2; focus asked of the audience window 1 time(s); presenter still presenter" (the window handle is stubbed to count `focus`, none is taken). Two panes over one deck: pane 1 pressed Presenter: "pane0 view@engine.md#0, pane1 presenter@title.md#0; audience windows 1; first audience window destroyed false"; a move in pane 1 moved that same window ("audience engine.md#0"); "later: audience window alive true; pane0 view; pane1 presenter".
8. `c2.cjs`: "End control: pane view at title.md#0; audience destroyed true"; "Esc in the presenter: pane view at summary:pillars; audience destroyed true"; "audience closed by hand: pane view at summary:pillars"; "presenter tab closed: audience destroyed true".
9. `c9.cjs`, `c9b.cjs`: a changed title saved to the file: presenter and audience both "ALPHA TWO Alpha two RENAMED Body of Alpha two. a@b.c" within 4 s; unsaved text typed into a source tab of the file: neither window changed, and after End the Present view drew it ("control, after End the Present view draws "ALPHA TWO Alpha two heading Body of Alpha two. UNSAVEDDRAFTTEXT a@b.c""); current slide file deleted (a2.md, at 2 / 3): "after the deletion: presenter a1.md#0, counter 1 / 2; audience a1.md#0, audience window alive true".
10. `c10.cjs`: panes seeded with two decks; "audience windows 2; urls ?root=hub&path=projects%2Fideas%2Fdeck-a%2Fpresent , ?root=hub&path=projects%2Fideas%2Fdeck-b%2Fpresent"; a move in pane 0: "audience A a2.md#0; audience B b1.md#0"; Space in audience B: "pane0 presenter@a2.md#0; pane1 presenter@b2.md#0; A a2.md#0; B b2.md#0". Names with `:` and `/` (the construction `'oculus-present-' + new URLSearchParams({root, path})`, run in node): `a:b|c` vs `a|b:c`, `a/b|c` vs `a|b/c`, `a|b&root=c` vs `a&path=b|root=c` give three different names ("equal: false" for each).
11. `c11.cjs`: twelve messages posted from a third channel object (5, 'slide', null, [], {}, {key}, {kind:'nonsense'}, {kind:'slide',key:5}, {kind:'slide'}, {kind:'move',key:7}, {kind:'move'}, and an `opened` with an extra field, which is a valid kind): "keys before title.md#0,title.md#0 after title.md#0,title.md#0; presenter mode presenter; audience ended false; page errors 0 / 0; console errors []"; a valid `slide` message then moved the audience to "engine.md#0".
12. `c12.cjs`: presenter window hidden with throttling on for 10 s: "audience key engine.md#0 before, engine.md#0 after; ... ended false; timer 0:00:12" (visibility read "visible", so this is not an occluded page); presenter page reloaded: "audience {"ended":true,"text":"The presenter screen has ended. Close","buttons":["Close"]}".
15. `place-case.mjs` under `node --experimental-strip-types`, `audiencePlace(from, areas)`: two displays, asking window on the first: `{"kind":"display","area":{"x":1440,"y":0,"w":1920,"h":1055}}` (the second); asking window on the second: `{"kind":"display","area":{"x":0,"y":0,"w":1440,"h":875}}` (the first); one display with room to the right: `{"kind":"beside","rect":{"x":440,"y":40,"w":960,"h":540}}`; room only to the left: `{"kind":"beside","rect":{"x":40,"y":40,"w":960,"h":540}}`; no room beside: `{"kind":"beside","rect":{"w":960,"h":540,"x":128,"y":108}}`.
13 and 14 after the change: both new titles pass (2 files, 18 tests, quoted below). `route` handles the audience kind in its own branch: `src/desktop/windows/windows.ts:131`.
16. Read against the code, a look at landing: Presenter's `window.open` is denied by the host's handler and answered by `audience.open` (`windows.ts:131`, `show.ts:104-112`); one window per deck by the key at `show.ts:106`, a second press brings it forward with `showInactive` and `moveTop` (`show.ts:63-64`); other display: `setSimpleFullScreen` (`show.ts:98`), beside the asking window with one display (`audiencePlace`); `fullscreen` granted to the audience's origin by `serverOriginOf` in the two permission handlers (`app.ts:144,151`); a slide's link goes through `route` to the default browser and `will-frame-navigate` keeps the window on its page (`show.ts:70-78`); Close Window closes a focused audience window first (`windows.ts:456-458`, `app.ts:190`) and the page's `pagehide` sends `closed`, which ends the presentation; closing the asking window closes it (`windows.ts:365`); it is no entry and no record of the window file, so a start restores none. The desktop app was not started.
17. Read against the code, a look at landing: the preload exposes `oculusDesktop` in every window, and `callerOf` (`windows/bridge.ts:101-113`) returns null because the audience contents is no entry (`entryOf` null) and `mayCall('audience', c)` is false for every channel (the new test covers `mayCall`).
18. `c18.cjs`: "0.3 s after load: {"buttons":["Full Screen"],"full":false}"; "2.5 s after load: {"buttons":[],"full":false}"; "after the pointer moved: {"buttons":["Full Screen"],"full":false}". F and the document's full screen are read at `show/+page.svelte:75-95,162`; the real full screen is a landing look.
19. Light and dark themes: a landing look (the presenter screen uses only theme tokens).
20. `c1.cjs`: notes of 79 sentences on the last slide: "{"scrollH":4752,"clientH":586,"overflowY":"auto","frameW":"1280px","frameH":"720px","stageH":349.875}".
21. `c21b.cjs`, `c10.cjs`: tab switched to Usage and back: "mode presenter, timer 0:00:01 before and 0:00:05 after (about 4 s apart); audience alive true"; a page switch to Focus and back: "timer 0:00:04 before, 0:00:08 after (about 4 s apart); audience windows 2"; the Slides button added a pane: "presenter presenter; timer 0:00:07; audience alive true"; the deck switched in the toolbar: "pane0 view@, pane1 presenter@b2.md#0; audience A destroyed true, B destroyed false".
22. `c22.cjs`: address loaded in a window with no opener: `{"ended":true,"text":"The presenter screen has ended. Close this tab to leave.","buttons":[],"opener":false,"bridge":"undefined"}`, and the same 2.9 s later.

## DONE / NOT DONE

All commands run from `tools/oculus` in the worktree.

| Check | Command | Output |
| --- | --- | --- |
| diagrams | `npm run diagrams` | regenerated `docs/diagrams/layer-views.*` and `layers.*` (the other files rewritten unchanged) |
| quick list, one full-list run | `npm run test:quick` | "test:quick: 30 changed file(s), from git since HEAD", "14 test file(s), 10 essential", "ok ASCII gate (0.5 s)", "ok prettier (0.5 s): All matched files use Prettier code style!", "ok svelte-kit sync (1.5 s)", "ok eslint (8.7 s)", "ok svelte-check (17.9 s): ... COMPLETED 410 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS", "ok vitest (24.6 s)", "test:quick: 25.2 s (limit 45.0 s); every command passed" |
| G47, G53 | `npx vitest run tests/server/desktop/window-guard.test.ts tests/server/desktop/window-file.test.ts` | "Test Files 2 passed (2)", "Tests 18 passed (18)" |
| tests on the unchanged tree | the same file with its two new tests, before the host change | 13: `expected { kind: 'browser' } to deeply equal { kind: 'audience', root: 'hub', …(1) }`; 14: `expected 'page' to be 'audience' // Object.is equality` |
| folder limit | `sh utils/folder-check.sh` | no output, exit 0 |
| unused exports | `sh utils/unused-exports.sh` against the base's `unused-exports.txt` (sorted diff) | no difference |
| ASCII gate | the perl command of `agents/spec.md:97` over `src tests config` | prints nothing |
| tree check | `npx vitest run tests/checks/tree/duplication.test.ts` | 18 passed |
| types and lint on the final tree | `npx svelte-check --tsconfig ./tsconfig.json --output machine`, `npx eslint` over the written files, `npx prettier --check` | 0 errors, 0 warnings; eslint silent; prettier clean |
| browser cases | Electron script per case against the scratch server on 8796 | the lines above |
| comments and titles against `agents/spec.md:42` | read | no history words; the hits of a search for "before / still / again / now" are state descriptions ("still paused", "read again") |
| scratch server stopped | `kill $(cat server.pid)`, then `lsof -iTCP:8796 -sTCP:LISTEN` and `ps aux | grep "[v]ite.js dev"` | nothing listening, no process |

Two comment and text edits followed the list run (the closing clause in `windows/show.ts`'s head comment and `DESIGN.md`'s audience sentence); both were checked by prettier and eslint alone.

NOT DONE: cases 16, 17, 19 and the full-screen half of 18 as runs (landing looks); the desktop host code (`show.ts`, the `route` branch, `closeFocused`, the permission lookup) has been type-checked, linted and read, and its decisions (`linkDecision`, `senderOf`, `mayCall`, `audiencePlace`) are run, but the host itself has not executed.

## Files (line counts)

New: `src/desktop/windows/show.ts` 126; `src/lib/views/academic/present/presenter/Presenter.svelte` 207; `src/lib/views/academic/present/screen/Stage.svelte` 87; `src/routes/present/show/+page.svelte` 287, `+page.ts` 9, `+page.server.ts` 17.

Moved into `screen/` (`mv`, content edited): `fullscreen.svelte.ts` 112, `keys.ts` 57.

Changed: `src/desktop/app.ts` 330; `src/desktop/decide/links.ts` 88; `place.ts` 118; `sender.ts` 68; `src/desktop/windows/windows.ts` 476; `src/lib/state/life/present.svelte.ts` 384; `present.ts` 557; `src/lib/views/academic/present/Present.svelte` 514 (limit 520); `Bar.svelte` 111; `src/routes/present/print/+page.svelte` 143 (outside the write list, see Disclosures); `tests/server/desktop/window-guard.test.ts` 169; `config/text/views/academic/present.yml` 82; `DESIGN.md` 574; `HELP.md` 160; `docs/views.md` 245; `docs/window.md` 82; `docs/diagrams/layer-views.{dot,svg}`, `layers.{dot,svg}`.

Folder `src/lib/views/academic/present/` holds 10 items: `acts/`, `parts/`, `presenter/`, `screen/`, `Bar.svelte`, `markup.ts`, `Overview.svelte`, `Panel.svelte`, `Present.svelte`, `Slide.svelte`.

## Judgment calls

- Message shapes (named as the brief asks): presenter to audience `slide{key}`, `changed`, `end`, `left`; audience to presenter `opened`, `move{key}`, `closed`. `end` is a deliberate end (the audience window closes itself when it can); `left` is the presenter's `pagehide` (the audience says the screen has ended and offers Close, as the lock does). The brief says "end" on `pagehide` and also says a reload leaves the audience with the sentence and Close (case 12), which an audience that closes itself on `end` cannot satisfy; two kinds satisfy both. In the desktop app `window.open` answers null, so the presenter cannot close the window by a handle, and the message is how the window closes there.
- Window name, channel name and lock name are the one string `presentName(ref)` (`oculus-present-` and the `URLSearchParams`).
- A second pane's Presenter over the same deck takes the lock with `steal: true` before the first pane lets go, takes over the audience handle and the heard flag, and sends no `end`; otherwise the audience's queued lock request would be granted on the first release and show the end sentence.
- The presenter ends on `closed` only after it has heard `opened`, so a reuse-navigation of the audience window does not end a fresh presenter.
- In a browser tab a second Presenter press calls `focus()` on the window handle (a re-open navigates the window and would send `closed`); in the app `window.open` is called again and the host brings the one window forward.
- The audience page releases the lock as soon as it is granted.
- A failed deck read reloads the audience page once (a `sessionStorage` flag under the deck's name, and a `leaving` flag so no `closed` is sent), then shows the end sentence.
- `Close` is shown when `window.opener !== null` or the desktop bridge exists; the audience is "full" when `document.fullscreenElement` is set or the window equals the screen within 1 px (the host's simple full screen).
- `linkDecision`'s audience kind needs a non-empty `root`; `path` may be empty.
- `readDeck` is the shared deck reader (`present.svelte.ts`); the print and audience routes use it.
- The slide of the print route and of the audience route is drawn with `first={false}`.
- Reset while running keeps counting from 0; Reset while paused stays paused at 0.
- The presenting store holds a `Timer` per instance in a `SvelteMap`; a tab-close liveness watch is an `$effect.root` per presentation reading `link.held()`; one `pagehide` listener per page ends all.
- Esc: closes the grid first, then ends the presentation; Space on a control in full screen is left to the control.
- The audience window is placed by the pure `audiencePlace(from, areas)`: first display other than the one the asking window mostly covers, else 960 by 540 right of the asking window, else left, else offset by 28 and cut to the work area.
- `permissionGranted` is unchanged; the audience's origin is looked up by `serverOriginOf`, so the audience window gets `fullscreen` and the two clipboard permissions the app's pages get.

## Host- or user-visible changes

- Toolbar: before, Previous, Next, Overview, Present, Slides, Export to PDF; after, a Presenter control between Present and Slides (disabled on a deck with no slides); the key `P` does the same and is `defaultPrevented` on an empty deck.
- The Present pane: before, only the slide; after, while presenting, the presenter screen (current slide, next slide or "End of the deck.", notes or "No notes for this slide.", `n / count`, `HH:MM` clock, `H:MM:SS` timer with Pause, Resume, Reset, End).
- New route `/present/show?root=&path=`: before 404; after the audience window page.
- Key hint: before "... | F shows it full screen"; after it ends with "| P opens the presenter screen".
- Desktop app: before a `window.open` of the server's address that was not a float or print address went to the default browser; after the audience address opens an app window, which is no entry of the windows list, is not saved in the window file, and gets no bridge channel.
- Close Window with an audience window focused: before it closed the last focused main window; after it closes the audience window, and the presentation ends.
- `docs/views.md`, `HELP.md`, `DESIGN.md`, `docs/window.md` name the presenter screen and the audience window.

## Wrong or impossible in the brief

- Case 6's parenthesis "a form control inside the box": the toolbar deck select is outside the box; the result the case states holds and was checked.
- Parts 3 and 6 against case 12 on `end` at `pagehide` (resolved by `left`, above).

## Doc text

G47's new Test line for `agents/guarded.md`:

`Test: written by O30, its file and titles named in `agents/briefs/O30.md` (Z518, Z556); the print window: `tests/server/desktop/window-guard.test.ts`, 'prints only the print route of its own server, named by a root and a path and nothing else'; the audience window, same file: 'sends the audience route of its own server, named by a root and a path and nothing else, to an app window of its own' and "answers no bridge channel to the audience window's page".`

## Repair round 1

Open items: unchanged (Z681 above). Nothing in this round is left undone. Not run, only read against the code: the host's `open` in `show.ts` (item 1), since no desktop app may be started; the same step was run in the hidden Electron script by loading the existing window's address from the script, which is the call `open` now makes.

1. Behaviour 1 (Z688 (1)). `src/desktop/windows/show.ts` `open`: when a window of that key exists it now calls `webContents.loadURL(url)` and then `bringForward`; a new window is made as before. The doc comment of `open` in the `Audience` type and the head comment say so; `DESIGN.md` (audience paragraph of the windows bullet) says it.
   - Check, `r1.cjs`: the presenter page was reloaded while presenting, the audience window then read `{"ended":true,"text":"The presenter screen has ended. Close"}`; with the window-open handler answering deny and loading the same address in that window (what `open` does), Presenter again gave `audience {"mode":"audience","key":"transition.md#0","ended":false,...}; presenter key transition.md#0` after one ArrowRight. The audience followed the slide. The host's call itself is a landing look.
2. Behaviour 2 (Z688 (2)). `src/lib/state/life/present.svelte.ts`: `RETURN_WAIT_MS = 3000`; `Held.returning` holds the wait. `hear` on `closed` (after `opened` was heard) starts the wait and ends the presentation when it runs out; `hear` on `opened` clears it; `finish` clears it. `src/routes/present/show/+page.svelte` head comment names the reload. Docs: `HELP.md` Present row, `docs/views.md` Present section (the sentence on reloading the audience window and on a closed window ending the presentation after 3 s) and `DESIGN.md` (message paragraph).
   - Check, `r1.cjs`: audience window reloaded: `presenter mode presenter, key engine.md#0; audience {"mode":"audience","key":"engine.md#0","ended":false,...}`; ArrowRight: `presenter key summary:pillars; audience key summary:pillars; windows alive 2`; 4 s later `presenter mode presenter; audience ended false`. Audience closed: `+1.0 s: presenter mode presenter`, then `pane back to the view after 3061 ms`.
   - Regression, `c2.cjs` (wait raised to 3.6 s for the by-hand close) and `c7.cjs`: End control, Esc and presenter tab closed still end at once with the audience window destroyed; audience closed by hand returns the pane to the view; the two-pane takeover is unchanged.
3. Standards. Comment paragraphs rewrapped whole at 100 columns in `present.ts` (message shapes), `Bar.svelte`, `present.svelte.ts` (the `Held` fields and the `finish` doc), `Present.svelte` (head comment), `show.ts` (head comment and `open`), `windows.ts` (`entryOf` doc), `Stage.svelte`, `show/+page.svelte`. `open`'s doc comment in `Present.svelte` now begins "End the pane's presentation if it runs, then point the pane at another deck...".
   - Check: `awk 'length($0)>100 && ($0 ~ /^[ ]*(\/\/|\*|\/\*\*)/)'` over `src/desktop`, `present.ts`, `present.svelte.ts`, `src/lib/views/academic/present`, `src/routes/present` and `window-guard.test.ts` prints nothing.
4. Proof, after the last change: `npm run diagrams`, then `npm run test:quick` once (31 changed files): ok prettier (0.5 s), ok ASCII gate (1.6 s), ok svelte-kit sync (1.7 s), ok eslint (7.2 s), ok svelte-check (11.9 s) "COMPLETED 410 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS", ok vitest (16.7 s), "test:quick: 17.3 s (limit 45.0 s); every command passed". `sh utils/folder-check.sh` exit 0; `sh utils/unused-exports.sh` sorted-diffed against the base list: no difference; ASCII gate (spec.md:97) prints nothing; `Present.svelte` 515 lines, `present.svelte.ts` 402, `show.ts` 136. The scratch server on 8796 was stopped by its pid: `lsof -iTCP:8796 -sTCP:LISTEN` and `ps aux | grep "[v]ite.js dev"` print nothing.
