# Step PR4 refuter report (on .agents/worktrees/PR4, base 70b68cca)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

## Verification (rerun by the reviewer)

All commands were run from `tools/oculus` in the worktree, Node v24.21.0.

```
$ npm run diagrams            (the four changed diagram files are unchanged by it: `git diff 70b68cca --stat -- tools/oculus/docs/diagrams` gives the same 4 files, 19+/19-)
$ npm run test:quick -- --base 70b68cca
test:quick: 31 changed file(s), from git since 70b68cca
test:quick: 14 test file(s), 10 essential
ok      ASCII gate (0.4 s)
ok      prettier (0.5 s): All matched files use Prettier code style!
ok      svelte-kit sync (1.7 s)
ok      eslint (6.1 s)
ok      svelte-check (5.6 s): 1791342034694 COMPLETED 410 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (8.5 s): Duration  5.41s (transform 6.71s, setup 0ms, import 11.21s, tests 2.24s, environment 3ms)
test:quick: 9.0 s (limit 45.0 s); every command passed

$ npx vitest run tests/server/desktop/window-guard.test.ts tests/server/desktop/window-file.test.ts
 Test Files  2 passed (2)
      Tests  18 passed (18)

$ sh utils/folder-check.sh                      -> no output, exit 0
$ sh utils/unused-exports.sh, sorted, diffed against PR4-base/tools/oculus/unused-exports.txt -> no difference (exit 0)
$ wc -l: Present.svelte 514 (limit 520), present.ts 557, present.svelte.ts 384, windows.ts 476; every other changed or new file is under its limit
$ LC_ALL=C grep -n '[^ -~]' over DESIGN.md, HELP.md, docs/views.md, docs/window.md, present.yml and the new files -> nothing
```

The builder's case scripts were rerun from copies in my scratchpad (`rev-pr4/bin`, port changed from 8796 to 8798). They ran in a standalone hidden Electron (`show: false`, dock hidden) against my own scratch server on 127.0.0.1:8798, with a scratch HOME and a copy of the builder's scratch hub. The server was stopped by its pid afterwards: `lsof -iTCP:8798 -sTCP:LISTEN` prints nothing.

```
c1.cjs:  case 1: windows created 1; audience url /present/show?root=hub&path=deck; presenter {"mode":"presenter","key":"title.md#0","cur":"title.md#0","next":"engine.md#0","notes":"No notes for this slide.","counter":"1 / 7","clock":"05:02","timer":"0:00:00",...,"hint":false,"toolbar":true}; audience {"mode":"audience","key":"title.md#0","ended":false,"hint":false,"toolbar":false,...}
         case 1: timer reads 0:00:00 then 0:00:02 after 1.3 s
         case 2: presenter key engine.md#0, next summary:pillars, notes "First note line of the engine slide.\nSecond note line, kept on its own line.\n", counter 2 / 7; audience key engine.md#0
         case 3: after Space in the audience: presenter key summary:pillars, audience key summary:pillars
         case 3: after a click on the current slide: transition.md#0 / transition.md#0; after a click on the notes and on the next slide: both still transition.md#0
         case 4: last slide: {"key":"closing.md#0","next":"End of the deck.","counter":"7 / 7"}; ArrowRight leaves both on closing.md#0
         case 20: {"scrollH":4752,"clientH":586,"overflowY":"auto","frameW":"1280px","frameH":"720px","stageH":349.875}
         case 5: Pause: timer 0:00:07 then 0:00:07 1.5 s later; Resume: 0:00:08 1.3 s later; Reset: 0:00:00, then 0:00:01 1.3 s later (still running)
         case 7: Presenter pressed again: windows 2 -> 2; focus asked of the audience window 1 time(s); presenter still presenter
         case 8: End: pane {"mode":"view","key":"title.md#0",...}; audience window destroyed true
c2.cjs:  case 8: End control: pane view at title.md#0; audience destroyed true | Esc in the presenter: pane view at summary:pillars; audience destroyed true | audience closed by hand: pane view at summary:pillars | presenter tab closed: audience destroyed true
c6.cjs:  case 6: p keydown on the toolbar select: mode view, windows 0 new; events [["p",false,false]] | Cmd+P on the deck: mode view, windows new 0; events [["p",false,true]] | p on the deck: mode presenter, windows new 1; events [["p",true,false]]
         (its empty-deck half failed to pick the deck by text, "choose Empty: none: ..."; c6b covers it)
c6b.cjs: case 6: p on an empty deck: mode view, new windows 0; events [["p",true,false]]; Presenter disabled true; Present view text: The deck in projects/ideas/deck-empty/present draws no slides. ...
c7.cjs:  case 7: pane 1 pressed Presenter: pane0 view@engine.md#0, pane1 presenter@title.md#0; audience windows 1; first audience window destroyed false; audience shows key title.md#0 | pane 1 moved once: audience engine.md#0 | later: audience window alive true; pane0 view; pane1 presenter
c9.cjs:  case 9: file saved with a changed title: presenter and audience "ALPHA TWO Alpha two RENAMED Body of Alpha two. a@b.c" | unsaved text in the source tab: both unchanged | control, after End the Present view draws "... UNSAVEDDRAFTTEXT a@b.c"
c9b.cjs: case 9: presenting at a2.md#0, counter 2 / 3; deleting a2.md | after the deletion: presenter a1.md#0, counter 1 / 2; audience a1.md#0, audience window alive true
c10.cjs: case 10: audience windows 2; urls ?root=hub&path=projects%2Fideas%2Fdeck-a%2Fpresent , ?root=hub&path=projects%2Fideas%2Fdeck-b%2Fpresent | moved pane 0: audience A a2.md#0; audience B b1.md#0 | Space in audience B: pane0 presenter@a2.md#0; pane1 presenter@b2.md#0; A a2.md#0; B b2.md#0
         case 21: page switched to Focus and back: timer 0:00:04 before, 0:00:08 after; audience windows 2 | deck switched in pane 0: pane0 view@, pane1 presenter@b2.md#0; audience A destroyed true, B destroyed false
c11.cjs: case 11: 11 bad messages ...; keys before title.md#0,title.md#0 after title.md#0,title.md#0; presenter mode presenter; audience ended false; page errors 0 / 0; console errors [] | control, a valid slide message: audience key engine.md#0
c12.cjs: case 12: presenter window hidden (visibility visible, throttling on) for 10 s: audience key engine.md#0 before, engine.md#0 after; ended false; timer 0:00:12
         case 12: presenter page reloaded: audience {"ended":true,"text":"The presenter screen has ended. Close","buttons":["Close"]}
c18.cjs: case 18: 0.3 s after load: {"buttons":["Full Screen"],"full":false} | 2.5 s after load: {"buttons":[],"full":false} | after the pointer moved: {"buttons":["Full Screen"],"full":false}
c21b.cjs: case 21: tab switched to Usage and back: mode presenter, timer 0:00:01 before and 0:00:05 after; audience alive true | Slides opened beside: panes 3; presenter presenter; timer 0:00:07; audience alive true
c22.cjs: case 22: {"ended":true,"text":"The presenter screen has ended. Close this tab to leave.","buttons":[],"opener":false,"bridge":"undefined"}, the same 2.9 s later
cprint.cjs: print: {"ready":true,"failed":false,"slides":14} | print of a missing deck: failed The deck could not be read: It is not inside a served root.
node --experimental-strip-types place-case.mjs (case 15):
  two displays, asking window on the first : {"kind":"display","area":{"x":1440,"y":0,"w":1920,"h":1055}}
  two displays, asking window on the second: {"kind":"display","area":{"x":0,"y":0,"w":1440,"h":875}}
  one display, room to the right           : {"kind":"beside","rect":{"x":440,"y":40,"w":960,"h":540}}
  one display, only room to the left       : {"kind":"beside","rect":{"x":40,"y":40,"w":960,"h":540}}
  one display, no room beside              : {"kind":"beside","rect":{"w":960,"h":540,"x":128,"y":108}}
```

Every quoted line of the builder's report that these scripts print was reproduced.

A side effect on the machine. A bare Electron script with no `userData` set writes its localStorage to `~/Library/Application Support/Electron`. The builder's runs used that folder, and so did my first runs (c1, c2, c22, cprint). My later runs set `userData` to folders under my scratchpad. oculus's own app uses `~/Library/Application Support/oculus` (`src/desktop/app.ts:63`), so its state was not touched.

## Verdicts

Items of the brief's "What to build":

- 1 (Start): violated in one state of the desktop app (Behaviour 1). In every other state it holds: Bar.svelte:74-81 adds the Presenter control, disabled on an empty deck; `Present.svelte` handles `p`/`P` with `preventDefault` before the empty-deck return; the takeover by a second pane is in `present.svelte.ts` `start`. Runs: c1, c6, c6b, c7.
- 2 (The audience window): holds. The route, the frame, no key hint, the reload once then the end sentence, the Full Screen control and its 2 s rest are checked by c1, c18 and c22. For the desktop, `linkDecision`'s audience kind, `route`'s own branch (`windows.ts:131`), `show.ts`, the permission lookup and `closeFocused` give by reading what the item says.
- 3 (Kept in step): holds (c1 cases 2 and 3, c10, c11). The added message kind `left` departs from the item's "end on pagehide"; see Spec 2.
- 4 (The presenter screen): holds (c1, c10, c21b; the Overview branch and Esc order in `Present.svelte` keys).
- 5 (The saved deck): holds (c9, c9b; `drafts: () => (presented ? [] : drafts)` and `deck = presented ? filesDeck : ...`).
- 6 (End): holds (c2, c12, c22). A reload of the audience window also ends the presentation, which the report does not state; see Behaviour 2.
- 7 (Text and docs): holds. Every new catalog key has a reader in `src`; key_hint, `docs/views.md`, `HELP.md:103`, `DESIGN.md:478`, the windows bullet and `docs/window.md:7` all name the presenter screen or the audience window.

Cases of the brief's "Cases":

- 1: met (c1).
- 2: met (c1).
- 3: met (c1).
- 4: met (c1).
- 5: met (c1).
- 6: met (c6, c6b). The case's premise is wrong: the deck `<select>` is in the Pane's bar outside the box, so a P there never reaches `keys()`. The result the case asks for holds. P has no in-control guard inside the box, which matches O and F.
- 7: met in a browser (c1, c7). In the desktop app the second press is read in `show.ts:106-110` and is a look. See Behaviour 1 for the press after a presenter reload.
- 8: met (c2). "The presenter's tab" is the workbench tab, which c2 closes.
- 9: met (c9, c9b).
- 10: met (c10). The `:` and `/` half holds by reading: `presentName` is `oculus-present-` plus `URLSearchParams({root, path})`, and that encoding escapes `=` and `&`, so two different (root, path) pairs never give one name.
- 11: met (c11).
- 12: met. The reload half is shown by c12. The hidden half was run, but the window still read `visibilityState` "visible", so the run did not reach a hidden page. By reading it holds: neither `present.svelte.ts` nor `show/+page.svelte` has any beat, silence timer or visibility handler (the only timers are the audience's 2 s pointer rest and the presenter's 250 ms clock tick). Only the lock, `left`, `end` and `closed` end the audience.
- 13: met (test, which fails on the base tree as quoted; `route` branch at `windows.ts:131`).
- 14: met (test).
- 15: met (place-case.mjs rerun above).
- 16: not verifiable here; it needs the desktop app, which is the landing look. By reading, opening, bringing forward, simple full screen, the permission, the link routing, Close Window, the close with the asking window and no restore are all present (`show.ts`, `windows.ts:131,365,456-460`, `app.ts:144,151,190`).
- 17: met by reading. `callerOf` (`windows/bridge.ts:101-113`) returns null because `windows.entryOf` does not know the audience contents, and `mayCall('audience', c)` is false for every channel (test). The runtime check is the look.
- 18: the rest half is met (c18). The real full-screen half is not verifiable in a hidden window; it is the look.
- 19: not verifiable here; it is a look in light and dark.
- 20: met (c1).
- 21: met (c10, c21b).
- 22: met (c22).

## 1. Spec

- `src/routes/present/print/+page.svelte:19-20,63-70`: "`import { readDeck } from '$lib/state/life/present.svelte';` ... `return readDeck({ root: ..., path: ... }, data.token);`".
  - What is wrong: the file is outside the brief's write list ("The step writes these paths and nothing else"). The report names it under Disclosures with its reason.
  - Judgement: the edit preserves behaviour. `deckOf` in `present.svelte.ts` is the old body verbatim (error text, `readAs(...) ?? 'deck'`, the catch), and cprint reruns green on a good and a missing deck. The edit is required by the rules file's principle that a parser or reader exists once. The alternative is a second copy of the deck read in the audience route.
  - Failure scenario: none in behaviour. A reader of the write list sees a path the brief did not grant.
  - Recommendation: accept at landing as named. Leaving the print route's own copy would be the lazy option.
  - Verdict: none.
- `src/lib/state/life/present.ts:480-498` and `present.svelte.ts:255-276`: "`z.object({ kind: z.literal('left') })` ... `function leave(instance) { ... finish(instance, held, 'left', true); }`".
  - What is wrong: item 3 and Z685 (2) name "end" as the message on `pagehide`. The diff sends a new kind `left` there instead, a substitute for a named shape.
  - Judgement: the brief contradicts itself. Item 6 says on "end" the audience window closes itself, and case 12 says a reload leaves it showing the sentence and Close. A literal "end" on `pagehide` would close a browser popup on a presenter reload and fail case 12. `left` gives exactly the state the lock gives, so both item 6 and case 12 hold. The report names the shapes as a decision, as item 3 asks, and lists the contradiction under "Wrong or impossible".
  - The builder found this while building, not on the first run, so the brief's hand-back rule did not bind it.
  - Failure scenario: none. Without `left`, a reload in a browser would close the audience window instead of showing the end sentence.
  - Recommendation: keep it, booked as the orchestrator's decision on the wire shape.
  - Verdict: none.

## 2. Proof

- `PR4-report.md`, DONE / NOT DONE, "quick list, one full-list run", and the paragraph under the table: "Two comment and text edits followed the list run ... both were checked by prettier and eslint alone".
  - What is wrong: the quoted `test:quick` run is not the final tree's, against the rules file's Report section ("Each DONE row quotes the last line of the final run").
  - My run on the final tree passes every command (above), so no decision rests on the gap.
  - Failure scenario: a reader takes the quoted lines as covering the two late edits, which they do not.
  - Verdict: none.
- The two new G47 tests, judged by reading: each would fail with its behaviour taken out.
  - 'sends the audience route ...': the three positive rows expect `{ kind: 'audience', ... }` from the real `linkDecision`, which gives `{ kind: 'browser' }` without `audienceDeck`.
  - "answers no bridge channel ...": it expects `senderOf(top)` to be `'audience'`, which is `'page'` without the new branch. It also asserts that the channel list holds `SAVE_LAYOUT`, so an empty list cannot pass it vacuously.
  - The negative rows and the `mayCall` loop cover behaviour that is preserved.
  - Not a finding.

## 3. Standards

- Comment lines over 100 columns, against the brief's file constraints ("comment lines at most 100 columns") and the rules file's rule that an edited comment is rewrapped as a whole paragraph at 100 columns:
  - `src/lib/state/life/present.ts:488` (121): " * it does when the lock tells it). The audience window says that it opened, which slide its reader moved to (`move`) and"
  - `src/lib/views/academic/present/Bar.svelte:5` (105): "// place in the deck. It holds no state of its own; Present.svelte owns the deck and the position and". Line 6 is then left short, "// hands each action in.", so the paragraph was not rewrapped.
  - `src/lib/state/life/present.svelte.ts:256` (108) and `:107` (101).
  - `src/lib/views/academic/present/Present.svelte:41` (102).
  - `src/desktop/windows/show.ts:17` and `:47` (101).
  - `src/desktop/windows/windows.ts:433` (101).
  - `src/lib/views/academic/present/screen/Stage.svelte:2` (101).
  - `src/routes/present/show/+page.svelte:18` (101).
  - Found by an awk over the changed files for comment lines longer than 100.
  - Failure scenario: the next editor meets paragraphs whose lines break mid-sentence at uneven widths, which the rule exists to prevent; `present.ts:488` reads as a broken paragraph.
  - Verdict: none (a file constraint, not an item). Small, fixable at landing.
- `src/lib/views/academic/present/Present.svelte:223-226`: "Point the pane at another deck, remembering the one it leaves, or bring forward the tab that already shows it."
  - What is wrong: `open` now starts with `presenting.end(instance.id)`, and its doc comment does not say so, against the rules file's rule to re-read the doc comment of every function touched. The end also happens when `pointInstance` only brings another tab forward and the pane keeps its deck.
  - Failure scenario: a maintainer calling `open` from a new place does not learn that it ends a running presentation.
  - Verdict: none.
- `PR4-report.md`, Disclosures: "Two read-only git commands were run by mistake (`git -C . log -1` and `git -C . diff --stat` ...)".
  - What is wrong: the rules file's "Where you work" says a builder runs no git command, read-only ones and `git -C` included.
  - The diff is unaffected.
  - Failure scenario: none in the tree. It is a breach of the builder rule, disclosed.
  - Verdict: none.

## 4. Behaviour

- `src/desktop/windows/show.ts:106-110` with `src/routes/present/show/+page.svelte:118-121,138-148`: "`if (open === undefined) make(from, url, key); else bringForward(open.win);`" and "`function finish(): void { ended = true; channel?.close(); }`".
  - What a user sees: in the desktop app, after the presenter page is reloaded (Cmd+R on the main window) or crashes, the audience window shows "The presenter screen has ended." with Close and stays open. On `left` or the lock it does not close itself, and its channel is closed.
  - Pressing Presenter again reaches the host's `open`, which finds the window by its key and only brings it forward. The page stays ended with its channel closed. The new presenter screen runs while the audience window keeps showing the end sentence and never follows a slide.
  - When the reader then presses Close, `closed()` sends nothing because `ended` is true, so the presenter screen does not learn the window went. Recovery is Close, then End, then Presenter again.
  - In a browser the same press calls `window.open` with the window's name, which navigates the popup to a fresh page, so only the desktop host has this defect.
  - The report does not state this state. Its case 7 and case 16 lines cover only a press while the audience is live.
  - Failure scenario: a speaker on the app reloads the window mid-talk, presses Presenter again, and the projector keeps showing "The presenter screen has ended."
  - Fix direction, the builder's or the landing's choice: the host loads the address again when it brings forward a window whose page has ended, or the ended audience page re-arms (channel and lock) on a new presenter's `slide` message.
  - Verdict: item 1 violated in this state; case 16 is the look that would show it.
- `src/routes/present/show/+page.svelte:195-198` with `present.svelte.ts` `hear`: "`if (!leaving && !ended) channel?.postMessage({ kind: 'closed' });`".
  - What a user sees: a reload of the audience window sends `closed` (Cmd+R with the audience window focused, since the menu's `role: 'reload'` reloads the focused window, `menu.ts:76`, or F5 in a browser popup). The presenter, having heard `opened`, ends the presentation. The reloaded audience page is then granted the freed lock and shows the end sentence.
  - The brief lists the audience window being closed as an end and does not name a reload. The report's "Host- or user-visible changes" does not state it.
  - Failure scenario: the projector's page hiccups, the speaker reloads the audience window, and the presenter screen falls back to the Present view, which ends the talk.
  - Verdict: none (not a listed item or case). For the orchestrator: state it as decided, or have the reload kept apart from a close.

## Declined to judge

- Esc in the pane's full screen: the brief says the first Esc leaves full screen and the next ends the presentation. The code ends the presentation on any Escape keydown that reaches the box, so the result depends on whether the browser and Electron deliver the Escape keydown that exits element full screen. A hidden window shows no real full screen; this needs the landing look.
- The desktop host's runtime (cases 16 and 17, the full-screen half of 18) and the themes (case 19): these are the orchestrator's looks under the brief. Only reading was done here, and Behaviour 1 came from it.
- The permission lookup grants the audience page the two clipboard permissions as well as `fullscreen`. The report states it (judgment calls). It sits inside the existing rule "the server's page" (`permissions.ts` head comment), so it is not raised.
- The orchestrator's `node utils/outside-paths.mjs` run was not run, since it is the orchestrator's. By my read of `git diff 70b68cca` and `git status --short`, the only path outside the write list is `src/routes/present/print/+page.svelte` (Spec 1).
- The brief's DESIGN.md target size and the Q126 reduction of DESIGN.md to its decisions: the added Decks and windows sentences are long. Whether they fit that reduction is the orchestrator's call.

Reviewer usage: agent id not known to me (read it from the runner's record), claude-opus-5-5, tokens not known to me (read them from the completion notice), about 55 tool uses, about 20 minutes (not verified).

Agent: a65731dee140e3b13, claude-opus-5-5.

## Repair round 1, refuted

Every command below was run from `tools/oculus` in `.agents/worktrees/PR4`, on Node v24.21.0. The browser cases ran in a standalone Electron process with every window created `show: false`. That process loaded only my own scratch server on 127.0.0.1:8798, which had a scratch HOME and a scratch hub under `scratchpad/rev-pr4-r1/`, and `userData` was set to a folder under the scratchpad for each run. The scripts were the builder's own, unchanged apart from the port and the `userData` line. After the runs the server was stopped by its pid: `lsof -iTCP:8798 -sTCP:LISTEN` prints nothing, and `ps -p 75748` shows no process. No tree state was recorded when the round was sent, so the round's delta is the set of files and hunks its report section names, each read against `git diff 70b68cca`.

```
$ npm run diagrams   (afterwards `git diff 70b68cca --stat -- tools/oculus/docs/diagrams` still lists the same 4 files, 19+/19-)
$ npm run test:quick -- --base 70b68cca
test:quick: 31 changed file(s), from git since 70b68cca
test:quick: 14 test file(s), 10 essential
ok      prettier (0.4 s): All matched files use Prettier code style!
ok      ASCII gate (0.4 s)
ok      svelte-kit sync (1.7 s)
ok      eslint (1.6 s)
ok      svelte-check (10.3 s): 1791343310167 COMPLETED 410 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (14.0 s): Duration  9.60s (transform 18.47s, setup 0ms, import 22.90s, tests 1.56s, environment 5ms)
test:quick: 14.5 s (limit 45.0 s); every command passed

$ npx vitest run tests/server/desktop/window-guard.test.ts tests/server/desktop/window-file.test.ts
 Test Files  2 passed (2)
      Tests  18 passed (18)
$ sh utils/folder-check.sh                                   -> no output, exit 0
$ sh utils/unused-exports.sh | sort, diffed with the sorted PR4-base unused-exports.txt -> no difference, exit 0
$ the ASCII gate of agents/spec.md over src tests config     -> prints nothing
$ LC_ALL=C grep -n '[^ -~]' DESIGN.md HELP.md docs/views.md docs/window.md -> nothing (exit 1)
$ wc -l: Present.svelte 515, present.svelte.ts 402, present.ts 557, show.ts 136, windows.ts 476, show/+page.svelte 288, Presenter.svelte 207
$ awk 'length($0)>100 && ($0 ~ /^[ ]*(\/\/|\*|\/\*\*|<!--)/)' over src/desktop, present.ts, present.svelte.ts, src/lib/views/academic/present, src/routes/present, window-guard.test.ts
  Panel.svelte:36, parts/Equation.svelte:47, parts/Words.svelte:27 and :30 (none of these files is in the diff),
  routes/present/show/+page.svelte:236 (101; the `<!-- svelte-ignore ... -->` directive, which must stay on one line)
$ grep over the added comment lines and test titles for before|used to|no longer|still|always has|always had|as before|previously|now|PRn|Znnn|dates
  -> 10 hits, each a description of present behaviour ("still in the layout", "taken before any other holder lets go", "at `now`"); none is history

r1.cjs (the round's own script):
repair 2: audience reloaded (+1504 ms): presenter mode presenter, key engine.md#0; audience {"mode":"audience","key":"engine.md#0","ended":false,...}
repair 2: next slide after the reload: presenter key summary:pillars; audience key summary:pillars; windows alive 2
repair 2: 4 s later: presenter mode presenter; audience ended false
repair 2: audience closed (+1.0 s): presenter mode presenter
repair 2: audience closed: pane back to the view after 3047 ms
repair 1: presenter page reloaded: audience "{\"ended\":true,\"text\":\"The presenter screen has ended. Close\"}"
repair 1: Presenter again, the existing window's address loaded again (what show.ts open does): audience {"mode":"audience","key":"transition.md#0","ended":false,...}; presenter key transition.md#0
c2.cjs:
case 8: End control: pane view at title.md#0; audience destroyed true
case 8: Esc in the presenter: pane view at summary:pillars; audience destroyed true
case 8: audience closed by hand: pane view at summary:pillars
case 8: presenter tab closed: audience destroyed true
c7.cjs:
case 7: pane 1 pressed Presenter: pane0 view@engine.md#0, pane1 presenter@title.md#0; audience windows 1; first audience window destroyed false; audience shows {"mode":"audience","key":"title.md#0",...}
case 7: pane 1 moved once: pane1 presenter@engine.md#0; audience engine.md#0
case 7: later: audience window alive true; pane0 view@engine.md#0; pane1 presenter@engine.md#0
c1.cjs, c10.cjs, c12.cjs, c22.cjs (rerun for the verdicts over the whole diff): every line matches the first review's quotes, e.g.
case 7: Presenter pressed again: windows 2 -> 2; focus asked of the audience window 1 time(s); presenter still presenter
case 21: after the switch: pane0 view@, pane1 presenter@b2.md#0; audience A destroyed true, B destroyed false
case 12: presenter page reloaded: audience {"ended":true,"text":"The presenter screen has ended. Close","buttons":["Close"]}
case 22: address opened directly (no opener): {"ended":true,"text":"The presenter screen has ended. Close this tab to leave.","buttons":[],"opener":false,"bridge":"undefined"}
p1.cjs (my probe: the desktop host emulated. Every window.open is answered deny, so the page gets null. The first address makes a hidden window, and a later address is loaded again into that window, which is what show.ts `open` does. The second Presenter press comes while the audience is live):
probe: before the second press: loads 1; audience buttons []; audience key engine.md#0
probe: 0.7 s after the second press: loads 2; presenter mode presenter; audience {"mode":"audience","key":"engine.md#0","ended":false,...}; audience buttons ["Full Screen"]
probe: 4.7 s after: presenter mode presenter key engine.md#0; audience key engine.md#0 ended false
probe: messages the presenter's page heard, ms from the press: [[75,"closed"],[286,"opened"],[286,"slide"]]
```

Closures the round claims:
- **Behaviour 1 (Z688 (1)): closed.**
  - In `show.ts:109-120`, `open` calls `loadURL` on an existing window and then `bringForward`.
  - r1 reproduces the result: after a presenter reload, the ended audience page comes back live and follows the slide.
  - The host's own call is still a landing look.
  - The fix does more than the finding needed; see Finding 1.
- **Behaviour 2 (Z688 (2)): closed.**
  - In `present.svelte.ts:298-310`, a `closed` heard after `opened` starts the 3 s wait.
  - `opened` clears the wait (:301-304), and `finish` clears it too (:279).
  - r1 reproduces both halves: the reload keeps the talk, and a close ends it after 3047 ms.
- **The comment lines over 100 columns: closed.** The awk above finds no comment line over 100 columns in a file of the diff, except the svelte-ignore directive.
- **`open`'s doc comment: closed.** `Present.svelte:224-228` now begins "End the pane's presentation if it runs, then point the pane at another deck".
- **Final test:quick on the last tree: closed.** My rerun above passes.

No closure was made by removing a check.

The questions put to this run:
- **Can the 3 s wait leave a presentation running with no audience window forever?** No path through the wait does.
  - `held.returning` is cleared only by an `opened` (:301-304) and by `finish` (:279), and `finish` ends the presentation.
  - So a wait that started always ends the presentation, unless some page with that channel name posts `opened`.
  - The paths that leave the presenter with no window do not go through the wait. They are Finding 5 below, which the first round's code already had.
- **Does a real close still end?** Yes: r1 shows the pane back to the view after 3047 ms.
- **Do End, Esc and the presenter tab closed still end at once?** Yes.
  - c2 shows the audience window destroyed within 1.5 s for each of the three.
  - End and Esc call `presenting.end`, and the closed tab calls `end` through the `link.held()` effect. None of the three goes through the wait.
- **Can `loadURL` then `bringForward` race the old page's `pagehide` `closed` into ending the new presentation?** Not in the state Z688 (1) is for.
  - After a presenter reload, the old audience page is already `ended`, so its `pagehide` sends nothing (`show/+page.svelte:197`).
  - Even if it did send `closed`, the new presenter's `heard` is false and it would ignore it (:307).
  - When the audience is live (a second press, or a takeover from another pane or window), `closed` starts the wait and the reloaded page's `opened` clears it. p1 measured `closed` at 75 ms and `opened` at 286 ms.
  - The presentation ends only if the reloaded page takes more than 3 s to post `opened`. That message is posted in `onMount`, before the deck read (:194).
  - Not measured in the packaged app.

### Verdicts

Items of the brief's "What to build":

- 1 (Start): holds.
  - Behaviour 1 is closed: r1 item 1, and `show.ts:116-119`.
  - Evidence: c1, c7 and r1, plus the first review's c6 and c6b, whose code the round does not touch.
  - Finding 1 states the visible cost of the fix.
- 2 (The audience window): violated in one state of the desktop app (Finding 4). Otherwise it holds: c1, c22 and r1 rerun, c18 from the first review, and the desktop half read in `show.ts`, `windows.ts` and `app.ts`.
- 3 (Kept in step): holds. c1 cases 2 and 3 and c10 rerun, c11 from the first review; `parseMessage` is unchanged in the round.
- 4 (The presenter screen): holds (c1, and c10's case 21 lines, rerun).
- 5 (The saved deck): holds. c9 and c9b from the first review; the round does not touch `drafts` or `deck` in `Present.svelte:142-146`.
- 6 (End): holds.
  - c2, r1 and c12 rerun.
  - A close by hand, and Close Window in the app, now end after 3 s, as Z688 rules.
  - HELP, docs/views.md and DESIGN.md state the delay.
- 7 (Text and docs): violated in one sentence of docs/views.md (Finding 2). Otherwise it holds: HELP.md:103, DESIGN.md:478, the windows bullet and docs/window.md:7 are true of the tree.

Cases of the brief's "Cases":

- 1: met (c1 rerun).
- 2: met (c1 rerun).
- 3: met (c1 rerun).
- 4: met (c1 rerun).
- 5: met (c1 rerun).
- 6: met. c6 and c6b from the first review; the key handling is not in the round's delta.
- 7: met in a browser (c1 and c7 rerun). In the app, by reading and the p1 emulation: one window, brought forward, its page loaded again (Finding 1).
- 8: met. c1 and c2 rerun; a close by hand ends after about 3 s (r1, 3047 ms).
- 9: met (first review's c9 and c9b; not in the round's delta).
- 10: met (c10 rerun).
- 11: met (first review's c11; the message shapes are unchanged in the round).
- 12: met (c12 rerun). The hidden half has the first review's caveat: the window still reads `visibilityState` "visible".
- 13: met (the window-guard test run above).
- 14: met (the window-guard test run above).
- 15: met by the first review's `place-case.mjs` run. Not rerun this round: the round section names no change to `place.ts`.
- 16: not verifiable here. It is the landing look, which should also cover a second press while presenting (Finding 1) and a takeover from a second window (Finding 4).
- 17: met by reading (first review); the look at landing.
- 18: the rest half met (first review's c18); the full-screen half is the look.
- 19: not verifiable here; the look in light and dark.
- 20: met (c1 rerun).
- 21: met (c10 rerun, its case 21 lines).
- 22: met (c22 rerun).

### Findings

1. **Behaviour.** `src/desktop/windows/show.ts:116-119`: "`void open.win.webContents.loadURL(url); bringForward(open.win);`".
   - **What is wrong.** Every Presenter press that finds an existing audience window in the app now reloads its page. That includes a second press during a live presentation, where nothing had ended.
     - The finding only needed an ended page reloaded. Z688 (1) ruled the reload for every existing window, and the builder followed that ruling.
     - In a browser, a second press during a live presentation only calls `focus()` on the handle (`present.svelte.ts:313-314`, and c1 "focus asked ... 1 time(s)"), so the two hosts now differ.
   - **What the reader sees in the app.** p1 shows these (loads 1 to 2, buttons [] to ["Full Screen"]):
     - the projector's page reloads, and the slide is replaced by the loading line until the deck arrives;
     - the Full Screen control comes back for 2 s whenever the window does not fill the screen (the one-display case);
     - the talk passes through `closed` and then `opened`, so it ends if the reloaded page takes more than 3 s to post `opened`;
     - a document full screen the reader entered with F in a one-display audience window is left on the reload (read from the code, not run, since a hidden window shows no real full screen).
   - **Where it should have been stated.** The round's report gives no before and after for this.
   - **Failure scenario.** A speaker on one display has put the audience window in full screen with F. They press Presenter to bring the window back in front. The projector reloads, leaves full screen, and shows the Full Screen control.
   - **Fix direction.** Reload only an ended page: the host reads `[data-ended]` through `executeJavaScript` before `loadURL`. Alternatively, the ended audience page keeps its channel and re-arms on a new presenter's `slide`. Either one reverses part of Z688 (1), so it is the orchestrator's to rule. Stating the reload as accepted would be the lazy option.
   - **Verdict:** none (cases 7 and 16 hold as written).
2. **Standards.** docs/views.md, the Present section, the new paragraph: "Presenter pressed again loads the audience window's page again and brings it forward".
   - **What is wrong.** The sentence is true in the app. In a browser it is false for a live presentation: `raise` (`present.svelte.ts:313-321`) focuses the open handle, and c1 shows "windows 2 -> 2; focus asked of the audience window 1 time(s)" with no load. The page describes both hosts.
   - **Failure scenario.** A reader in a browser expects a second press to refresh the audience page, and it does not.
   - **Fix.** Small, at landing: "in the desktop app it loads the audience window's page again; in a browser it brings it forward".
   - **Verdict:** item 7 violated in this sentence.
3. **Standards.** `src/lib/views/academic/present/Present.svelte:48`: "Full screen is the box's own (fullscreen.svelte.ts):".
   - **What is wrong.** The diff moved the file to `screen/fullscreen.svelte.ts` (the import at :74). The same head comment names `screen/Stage.svelte` and `presenter/Presenter.svelte` with their folders. The round rewrapped this head comment and left the path as it was.
   - **Failure scenario.** A maintainer looks for `present/fullscreen.svelte.ts` and does not find it.
   - **Fix.** Small, at landing.
   - **Verdict:** none.
4. **Behaviour.** This is in the whole diff, not the round's delta. `src/desktop/windows/show.ts:109-119`: "`const open = list.find((one) => one.key === key); ... bringForward(open.win);`".
   - **What is wrong.** When another window asks for an existing audience window, `Shown.from` stays the first window. Brief item 2 and Z685 (6) say the audience window is placed against the window that asked and closes with it.
   - **Failure scenario.** In the app, with two main windows (Cmd+N), window B's pane takes over a deck that window A presented. The lock is stolen, A's presentation ends quietly, and the host reuses the window. When the reader closes window A, `closeFor(A)` closes the audience window, and B's presentation ends 3 s later. The audience window's links are also routed from A.
   - **Fix.** Small, at landing: set `open.from = from` on reuse (the key already pins the origin).
   - **Verdict:** item 2 violated in this state. Read against the code only; it is a look at landing.
5. **Behaviour.** This is in the whole diff, from the first round's code, and it answers the "forever" question. `src/routes/present/show/+page.svelte:119-136` and `:196-198`: "`} else if (reloaded()) { finish(); }`" and "`if (!leaving && !ended) channel?.postMessage({ kind: 'closed' });`".
   - **What is wrong.** An audience page whose deck read fails twice ends itself without telling the presenter screen.
     - It shows "The presenter screen has ended." while the presenter screen is still running.
     - Its Close then sends no `closed`, because `ended` is true and the channel is closed.
     - The presenter screen goes on presenting to no window until End.
     - A crashed audience renderer, which fires no `pagehide`, leaves the presenter in the same state. After this round, a Presenter press recovers that state in the app.
   - **Failure scenario.** A read fails twice in a row while presenting, for example across a server restart. The speaker reads "The presenter screen has ended." on the projector, presses Close, and the presenter screen keeps counting with nothing on the projector.
   - **Fix.** Small: post `closed` before `finish` on that path. The presenter then ends after the 3 s wait.
   - **Verdict:** none. Item 2's "reloads once, then shows the end sentence" holds as written.

Proof: none. Spec: none, beyond Finding 1, where the fix does more than the finding needed but stays inside Z688 (1)'s text.

### Declined to judge

- **The host's runtime of `open`, not checked.** This covers `loadURL` on a real audience window, simple full screen kept across the reload, a document full screen lost on it, and how long a reloaded page takes to post `opened` in the packaged app compared with 3 s. These need the desktop app, which may not be started; they are the landing look. p1 only emulates the host in a plain Electron process.
- **The round's delta, not cut exactly.** No tree state was recorded when the round was sent. I read the files the round section names against the whole diff, so a change in another file during the round would show only in the whole-diff verdicts.
- **Cases 6, 9, 11, 15 and 18, not rerun this round.** Their code is outside what the round section names. Their verdicts rest on the first review's runs.
- **The builder's case harness sets no `userData`.** So its round runs (r1, c2, c7) used Electron's default folder `~/Library/Application Support/Electron`, as the first review noted. The brief binds the builder to no such rule; my runs set `userData` under my scratchpad.
- **Esc in the pane's full screen (the first Esc leaves, the next ends).** Unchanged from the first review: a hidden window shows no real full screen, so this is the landing look.

Reviewer usage: agent id not known to me (read it from the runner's record), claude-opus-5-5, tokens not known to me (read them from the completion notice), about 40 tool uses, about 25 minutes (not verified).

Usage: a2951440a5a116e09, claude-opus-5-5, 212,724 tokens, 53 tool uses, 13.2 min.

## Closed

- First review, Spec 1 (the print page outside the write list): accepted, the deck read kept in one place.
- First review, Spec 2 (the message kind `left`): accepted as the orchestrator's decision on the wire shape; the brief contradicted itself between item 6 and case 12.
- First review, Proof 1 (the quoted run not the final tree's): closed in round 1, the final run quoted, rerun green by the round's reviewer.
- First review, Standards 1 and 2 (comment lines, `open`'s doc comment): closed in round 1.
- First review, Standards 3 (two read-only git commands by the builder): noted, no change to the tree.
- First review, Behaviour 1 and 2: closed in round 1 under Z688.
- Round 1, Finding 1 (every press reloads the audience page in the app): fixed at landing under Z689, the host loads the address again only when the page shows `data-ended`.
- Round 1, Finding 2 (docs/views.md's sentence on a second press): fixed at landing, both hosts named.
- Round 1, Finding 3 (`Present.svelte`'s head comment path): fixed at landing, `screen/fullscreen.svelte.ts`.
- Round 1, Finding 4 (`Shown.from` kept on reuse): fixed at landing, `open.from = from` on reuse.
- Round 1, Finding 5 (an audience page that ends after two failed reads tells no one): fixed at landing, `closed` posted before `finish` on that path.

