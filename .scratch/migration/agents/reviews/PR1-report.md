# PR1 report: the Present view's full screen

Everything in the brief and in repair round 1 is done, and G53's test is written and passes. Cases that need a DOM or the desktop app are checked by reading the code path, as the brief assigns them; no case was run in a browser or in the app (none was started), so every behaviour below is "read, not run" and the orchestrator's landing look is what runs them.

## Open items of the state file (verbatim, `orchestrator-state.md:207`)

- Z644 (2026-10-06, raised from PR1's brief check): does the desktop app's window-file rule get a guarded entry and a test? PR1 makes the main window never keep a page's full screen as its own, so `~/.oculus/window.json` is written with the window's state from before a deck went full screen. If that rule is wrong, the window reopens in full screen at every start, or loses the full screen the reader set. PR1 writes the rule as a pure function in `src/desktop/decide/window-file.ts` (the event order to the recorded state), which a unit table can test for both macOS event orders. (a) A new entry G53 in `agents/guarded.md`: "The desktop app's window file keeps the window's own state: a full screen a page asked for is never written as the window's full screen, and a full screen the reader set before is kept." PR1 writes its test, a table over the event orders of cases 15, 16 and 21. Pros: the rule is checked on every run, and its failure is seen at every start of the app. Cons: one more test file. (b) No entry: the rule is checked by reading and at the landing look only. Pros: nothing added. Cons: a later change to `keepState` can break it unseen until a start opens the window wrong. (b) is the lazy option. Recommendation: (a). PR1 is dispatched with (b)'s scope and gains the test on a ruling of (a), at its landing or in a repair round.

The rule is the pure function `recordWindow` (`src/desktop/decide/window-file.ts:92-107`). Z644 is ruled (a): G53's test is `tests/server/desktop/window-file.test.ts` (see Repair round 1). The state file's text above is the copy in this worktree, taken before the ruling.

## The cases, first run on the unchanged tree

Base copy: `/Users/axelfaes/workspace/research-hub/.agents/worktrees/PR1-base/tools/oculus`. Command for the shared evidence:

```
cd $B && grep -rn "requestFullscreen\|fullscreenElement\|fullscreenchange" src ; echo "grep-exit=$?"
grep-exit=1            (no output)
grep -n "case '\|event.key\|onpointerdown\|onclick\|<ToolButton\|<Chip\|label=" src/lib/views/academic/present/Present.svelte
115: switch (event.key) {   116 ArrowRight  117 PageDown  121 ArrowLeft  122 PageUp  126 Home  130 End  134 'o'  135 'O'  139 'Escape'
156: <Toolbar ...   158 label={t('present.previous')}   163 label={t('present.next')}   168 label={t('present.overview')}   177 label={t('slides.open')}
205: onpointerdown={() => box?.focus()}
grep -n "html-full-screen\|isFullScreen\|fullScreen" src/desktop/windows/windows.ts
208:            fullScreen: win.isFullScreen(),
336:        if (saved?.fullScreen === true) entry.win.setFullScreen(true);
```

| Case | Check on the unchanged tree | Result |
|---|---|---|
| 1 | reading: the grep above prints nothing, and the toolbar (`Present.svelte:156-186`) holds Previous, Next, Overview, Slides, the counter | no full screen and no Present control exist |
| 2 | reading `keys` (`:115-143`): Right, PageDown, Left, PageUp are taken; no `' '` case | Right and Page Down move on, Left and Page Up back; Space and Shift+Space do nothing (the brief's change is absent) |
| 3 | reading: the box's only pointer handler is `onpointerdown` (focus), `:205`; no `onclick` | a click does not move the deck |
| 4 | reading: no `cursor` rule or timer in the view (`grep -n "cursor" Present.svelte` prints only the card cursor lines `:77-78`, `:210`) | the pointer never hides |
| 5 | reading `keys` `:139-142`: Escape returns unless the grid is open | no full screen to leave |
| 6 | reading: no `'f'`/`'F'` case in `keys` | `F` does nothing in the view; the shell's Focus chord gets it |
| 7 | reading: the grep above prints nothing for `src/desktop` and `src/lib`; `permissions.ts:7` grants `fullscreen` | no full screen to enter in the app either |
| 8 | reading: the grid (`Overview.svelte`) and `pick` (`:148-152`) exist; no full screen | grid and tile picking work in the pane only |
| 9 | reading: `held` comes from `instanceState(instance.id)` (`:73`) | two panes hold two positions; no full screen exists |
| 10 | reading: no `fullscreenchange` listener | nothing to leave |
| 11 | reading: no click handler, so a click on a link does what the link does; no Space case, so Space on a focused control does the control's action | holds already; the change must keep it |
| 12 | reading: no control exists; no `'f'` case, so `F` reaches the shell (`config/layout.yml:26`, `chord: f`) | `F` starts the Focus chord |
| 13 | reading `keys` `:114`: `if (event.altKey || event.ctrlKey || event.metaKey) return;` | holds; the change must keep it |
| 14 | reading: no `requestFullscreen` call | nothing to refuse |
| 15 | reading `windows.ts:203-211` and `:218-233` (base): `stateOf` writes `fullScreen: win.isFullScreen()`, `keepState` writes it on `enter-full-screen`, `leave-full-screen` and `close`; with the premise (`SetHtmlApiFullscreen` calls `SetFullScreen`) a page's full screen would be written as `fullScreen: true`. No page asks for full screen on this tree, so the file today is only what the window itself did | the rule of item 8 is absent; the defect would appear as soon as a page went full screen |
| 16 | same lines: a window the reader put in full screen is written `fullScreen: true` | holds today; the change must keep it |
| 17 | reading `TabView.svelte:41` (`hidden={!shown}`) and `:52-53` (`.tab-view[hidden] { display: none }`) and `Workbench.svelte:348` (`{#key page.id}`): no full screen exists | nothing to leave |
| 18 | reading: no `F` handling, so no repeat handling | nothing to toggle |
| 19 | reading: no full screen | nothing to end |
| 20 | reading: no timer | nothing to hide |
| 21 | reading `stateOf` `:207`: `maximised: win.isMaximized()` | a maximised window is written `maximised: true`; today `fullScreen` follows `isFullScreen()` |
| 22 | reading base `tellBounds` `:236-247`: after 500 ms it sends `rectOf(entry.win.getContentBounds())` with no check | a float in a page's full screen would send the monitor's size |

No case was found where the brief's own rules give a wrong result on the unchanged tree.

## The cases after the change

All read, with the lines in `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/pr1replay/tools/oculus`, taken after the last change. None was run.

| Case | Reading | Result |
|---|---|---|
| 1 | `Present.svelte:308-315` the control calls `toggleFull`; `:147-160` `enterFull` calls `element.requestFullscreen()`; the box is `div.present` (`:335-352`); entering does not touch the instance's slide | the box alone is drawn by the browser (no rail, tabs, toolbar); leaving returns to the same slide (state is `instanceState`, `:101`) |
| 2 | `:221-226` Right and Page Down; `:227-232` Left and Page Up; `:251-256` Space next, Shift+Space previous | three on, three back |
| 3 | `:274-279` `advance`, bound at `:350` `onclick={advance}` on the box, so a click on the frame or the letterbox reaches it; it writes `next(held.slide)` | next slide |
| 4 | `:180-185` `rouse` starts a 2000 ms timer (`:80`) that sets `resting`; `:349` `onpointermove={rouse}`; `:413-416` `.present.resting, .present.resting :global(*) { cursor: none }` | hidden after 2 s, shown on the next move |
| 5 | Esc is taken by the browser before the page (premise, `electron_api_web_contents.cc:1703-1707`); `:329` `<svelte:document onfullscreenchange={syncFull}>`, `:174-178` sets `full = false` | control unpressed, same slide |
| 6 | `:245-250` `F`/`f` with slides: `preventDefault`, `toggleFull` unless `event.repeat`; `toggleFull` `:168-171` leaves when `document.fullscreenElement === box` | full screen, `F` again out |
| 7 | the same code in the app; `permissions.ts:7` grants `fullscreen`; Esc as case 5 | the orchestrator runs it at the landing look |
| 8 | `:396-400` `.present:fullscreen { background: var(--bg); overflow: auto; padding: 10px 12px }` (the pane body's padding, `Pane.svelte:157`); `:402-405` `.present.framed:fullscreen` clears padding and hides overflow only for the framed slide; `pick` (`:281-284`) writes the slide and closes the grid and does not touch full screen; `advance` returns while `grid` (`:275`) | the grid fills the screen and scrolls; a tile click picks a slide and stays in full screen |
| 9 | `syncFull` `:174-178` compares `document.fullscreenElement === box` per instance; `pressed={full}` `:311`; keys go to the focused box, `held` is per instance | only the entered pane is pressed; the other pane's position is not written |
| 10 | `:329` the document-level `fullscreenchange` listener; the effect `:188-195` clears `resting` when `full` is false | unpressed, pointer shows |
| 11 | `:138-142` `inControl` (`a[href], button, input, select, textarea, summary, [contenteditable], [role=button], [role=link]` inside the box); `advance` returns for a control (`:275`) and for a non-collapsed selection (`:276`); the Space case returns for a control (`:252`); the default branch keeps Enter for a control (`:267`) | a link click, a focused tile title with Space or Enter, and a selecting drag do not move the deck |
| 12 | `:246` `if (rows.length === 0) return;` before `preventDefault`; `:314` `disabled={rows.length === 0}` | control disabled, `F` reaches the Focus chord |
| 13 | `:220` `if (event.altKey || event.ctrlKey || event.metaKey) return;` | Cmd+F and Ctrl+F not taken |
| 14 | `:147-160` and `:162-166`: `requestFullscreen()` and `exitFullscreen()` each end in `.catch(ignore)` with `const ignore = (): undefined => undefined` (`:145`); a rejection leaves `full` false because only `fullscreenchange` sets it | pane unchanged, no unhandled rejection; read, not run |
| 15 | `windows.ts:223-229` `record`, `:250-251` the html events; `window-file.ts:92-107` `recordWindow`: `page-enter` holds `now` (read before `enter-full-screen` on macOS), then each `other` change returns `{ ...hold.own, zoom: now.zoom }` (`:106`), including the `close` (`windows.ts:252-255`) and `quitting` (`remember`, `:231-233`); the table of `tests/server/desktop/window-file.test.ts` rows 1 to 5 | the file holds `fullScreen: false` when the window was not in full screen before |
| 16 | `recordWindow` `:98` holds `now` with `fullScreen: true`; on `page-leave` `:102` `hold.own.fullScreen` releases the hold and returns `now` (still full screen); test rows 6 and 7 | the file says `fullScreen: true` before, during and after |
| 17 | `:198-200` the effect `if (full && (!tabShown() || rows.length === 0)) leaveFull()`, where `tabShown` is `useShown()` (`:86`, TabView's `shown`); `:202-209` the unmount teardown exits when the box is the full-screen element; `:194` cleanup clears the timer; `:329` the document listener is removed by Svelte at unmount | full screen ends, control unpressed, pointer shows, no timer or listener left |
| 18 | `:248` `if (!event.repeat) toggleFull();` with `preventDefault` before it; `enterFull` returns while a request is pending (`:148`) | one toggle; the repeats do not reach the Focus chord |
| 19 | `:199` `rows.length === 0` in the same effect; `:314` disabled | full screen ends, control disabled |
| 20 | `:188-190` the effect calls `rouse()` when `full` becomes true, so the timer starts without a pointer move | hides after 2 s |
| 21 | `recordWindow` `:98`: `own` is the live state at `page-enter`, `maximised: true`, `fullScreen: false` on macOS (event before `enter-full-screen`); test row 8 | the file says `maximised: true`, `fullScreen: false` |
| 22 | `windows.ts:259-290` `tellBounds`: `pageFullScreen` set on `enter-html-full-screen` (clears the timer), checked in `tell` and again when the timer fires, cleared on `leave-html-full-screen` when the window was in full screen before or is already out, otherwise on its own `leave-full-screen` (`:285-287`) | no bounds sent while the page is in full screen or the window is still in the full screen the page caused |

## DONE / NOT DONE

| Row | Command | Output |
|---|---|---|
| `npm run diagrams` then `npm run test:quick` | `cd tools/oculus && npm run diagrams; npm run test:quick` | `ok vitest (102.5 s)`, `ok svelte-check (114.0 s): ... 390 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok eslint (129.4 s)`, `ok prettier`, `ok ASCII gate`; last lines: `test:quick: 144.1 s (limit 45.0 s); every command passed`, `test:quick: over the time limit` (several suites run on this machine; nothing failed). The selection ran 13 test files, `tests/server/desktop/window-file.test.ts` among them |
| ASCII gate of the rules file | `LC_ALL=C perl -ne '...' $(find src tests config -type f ! -name local.yml)` | no output, exit 0 |
| `HELP.md` and `DESIGN.md` ASCII | `LC_ALL=C grep -n '[^ -~]' HELP.md DESIGN.md` | no output |
| unused exports | `sh utils/unused-exports.sh > ue3.txt; echo $?; diff ue3.txt PR1-base/unused-exports.txt` | exit 0; `diff` prints nothing. The exports the step adds are `recordWindow`, `PageFullScreen` and `WindowChange`, all imported by `windows.ts:16-22` and the test; `Recorded` is a local type (`window-file.ts:81`) |
| line counts | `wc -l` | `Present.svelte` 458 (limit 520), `windows.ts` 445 (880), `window-file.ts` 107 (880), `window-file.test.ts` 131, `present.yml` 28 |
| tests | `diff -rq PR1-base/tools/oculus/tests tests` | `Only in tests/server/desktop: window-file.test.ts`; the step adds that one file (G53's test) and changes no other |
| docs | read below | done |
| all of items 1 to 9 | the tables above | done, read not run |

NOT DONE: nothing in the brief. Not verified (no browser, no app was started): every behaviour in the "after" table at runtime.

## Files

`diff -rq` against the base copy for `src`, `config` and `tests` (the base copy holds no `HELP.md`, `DESIGN.md` or `docs/`), and the edits to `HELP.md` and `DESIGN.md`:

| Path | Lines | Note |
|---|---|---|
| `src/lib/views/academic/present/Present.svelte` | 458 | in the write list |
| `config/text/views/academic/present.yml` | 28 | in the write list |
| `src/desktop/decide/window-file.ts` | 107 | in the write list |
| `src/desktop/windows/windows.ts` | 445 | in the write list for lines 203-247 (the edits are at `:219-256` and `:259-290`); also lines 16-22 (the import of `recordWindow`, `PageFullScreen`, `WindowChange`), outside the listed range and required by the wiring |
| `tests/server/desktop/window-file.test.ts` | 131 | new; G53's test (repair round 1, ruling Z644 (a)); outside the write list by the repair's order |
| `config/present.yml` | 273 | line 22 only (`deck.meta.hint` names `F`); added to the write list by the repair's order |
| `config/catalogs/options.yml` | 1354 | line 1007 only: the settings catalog's default of `deck.meta.hint`, the same sentence; outside the write list, needed so the default matches the file (see Repair round 1) |
| `HELP.md` | 375 | line 139 only |
| `DESIGN.md` | 436 | lines 382 and 436 only |
| `docs/diagrams/` | unchanged | `npm run diagrams` was run and `diff -rq /Users/axelfaes/workspace/research-hub/tools/oculus/docs docs` prints nothing; the base copy holds no `docs/`, so this is against main, not against the base |

No new `.svelte.ts` module: `Present.svelte` is 458 lines, under 520.

## Judgment calls (each reversible)

1. The control is a `ToolButton` (label `Present`, after the Overview chip), not a `Chip`: `Chip` has no `disabled`. It carries `pressed` and `active` (the pressed look) and a tooltip: `present.present_tip` ("Show the deck on the whole screen (F, while the deck has the focus)") when enabled, `present.empty` when the deck is empty (the ToolButton rule that a disabled button says why). `present.present_tip` is a word the brief did not list.
2. `F` and Space with `event.repeat` are taken (`preventDefault`) and do nothing, so a held `F` neither toggles again nor feeds repeats to the Focus chord (a pending `f` chord would otherwise swallow the next digit).
3. `POINTER_REST_MS = 2000` is a named constant in the view (`Present.svelte:80`). The step's rules read a cadence from config when a key exists; none exists for this, and adding one is a user-visible key the brief does not name. Precedent in the tree: `TOAST_MS` in `Toast.svelte:19`.
4. A click advances only when the frame is shown (not the grid, not the empty state), reading item 4's "a click in the overview grid picks a slide as now".
5. In `recordWindow`, a window that was not in full screen before keeps the hold until its own `leave-full-screen` (the first change that finds `fullScreen` false), not only until `leave-html-full-screen`: on macOS the page's event comes before the window finishes leaving, so a quit in that animation would otherwise write `fullScreen: true`. The brief's wording is "until `leave-html-full-screen`"; this holds slightly longer for that one window kind and nothing else differs.
6. The hold is a `WeakMap<Entry, PageFullScreen>` inside `createWindows` (`windows.ts:220`), so the exported `Entry` type (outside the listed range) is unchanged; `remember`, which `app.ts:180` and `quitting` call, goes through the same `record`, so a quit and a zoom change during a page's full screen also keep the held state (live zoom kept).
7. The tab-hidden exit reads `useShown()`, the value TabView provides (`TabView.svelte:36` (`provideTabState(() => shown)`)), and does not read `display: none` from the box's size.

## Visible changes (for the landing look; page TEST, Present view with slides)

| What | Before | After |
|---|---|---|
| Toolbar | Previous, Next, Overview, Slides, counter | the same with a `Present` button after Overview, pressed while the pane's box is in full screen, disabled with the empty deck |
| `F` with the deck focused and slides | the Focus chord starts | the slide fills the monitor; `F` again leaves; with an empty deck `F` still starts the chord; `f1` to `f3` do not run while the deck holds the focus and has slides |
| Space, Shift+Space | nothing | next, previous slide (a focused link, tile title or button keeps Space) |
| Any other unmodified key in full screen (`?`, `/`, `n`, `j`, `k`, `i`, the chord letters, Tab, ArrowUp, ArrowDown) | reaches the shell | taken and ignored; nothing opens outside the box and the focus stays on the slide |
| In full screen | n/a | no rail, tabs, toolbar or pane border; opaque page background; frame centred, edge to edge, no border or radius; grid scrolls; a click on the frame or letterbox goes to the next slide; a click on a link does not; a selecting drag does not; pointer hides after 2 s at rest, shows on a move; Esc, `F` or the browser's way out leaves |
| Ctrl+Tab, closing the tab, page switch, a push that empties the deck while in full screen | n/a | full screen ends, control unpressed |
| Desktop: quit during a deck's full screen | would write the window's `fullScreen: true` | `~/.oculus/window.json` keeps the window's own state (maximised stays `maximised: true`, `fullScreen: false`; a window the reader put in full screen first stays `fullScreen: true`) |
| Desktop: popped-out Present pane in full screen | would send the monitor's size as bounds | no bounds sent while the page is in full screen, nor while the window is still in the full screen the page caused |
| Title slide | hint line names `O` | hint line also names `F` for full screen (`config/present.yml:22`; the Settings catalog default at `config/catalogs/options.yml:1007` says the same) |

What to see in a browser tab: cases 1 to 6, 8 to 14, 17 to 20. In the desktop app (scratch HOME): 7, 15, 16, 21, 22.

## How item 8 follows the Electron premise, for both macOS event orders

Enter, per the premise (`SetHtmlApiFullscreen` then `UpdateHtmlApiFullscreen`, `isFullScreen` only valid after `enter-full-screen` on macOS): `enter-html-full-screen` arrives first. `windows.ts:250` calls `record(entry, 'page-enter')`; `stateOf` reads `isFullScreen()` false (window not yet full screen) and `isMaximized()` as it is, and `recordWindow` (`window-file.ts:97-99`) holds that state and writes nothing. The `enter-full-screen` the page caused is an `other` change: the hold is not leaving, so it returns `{ ...hold.own, zoom: now.zoom }` (`:106`), the held state again, and the file gets the window's state from before. Case 16 holds `fullScreen: true` from the start and keeps it.

Leave: `leave-html-full-screen` arrives first. `record(entry, 'page-leave')`: a window that was in full screen before (`hold.own.fullScreen`, `:102`) is released with `now` (still full screen, as the window stays); any other window is marked `leaving` and still writes nothing (`:103`). The following `leave-full-screen` is an `other` change with `now.fullScreen` false, which releases the hold and writes `now` (`:105`). A close or a quit between the two events writes the held state (`:106`). The brief's rule `isFullScreen() && !html` is not used.

This builder did not read the source lines of the premise (`electron_api_web_contents.cc`, `electron_api_browser_window.cc`); the premise is the brief's, and the reviewer's report (`agents/reviews/PR1-refuter.md`, section 3.1) reads them against v44.5.1 and finds the capture at `page-enter` and both leave orders as the code has them. On a platform where the window's own full screen is synchronous the order differs and `recordWindow` would hold the full-screen state; the app is packaged for macOS only (`src/desktop/package.ts:82`, `platform: 'darwin'`), so that order is not handled and not verified.

## Docs (each new or changed sentence)

- `HELP.md:139` (one table cell): one sentence added after the existing one; the sentence has three clauses joined by semicolons and commas because a table row is one line and the keys, the exit and the pointer belong in the same row.
- `DESIGN.md:382`: the key list in the existing sentence gains Space, `F` and the Present control; two sentences added at the end of the decision, each long because each states one decision with its reasons (element, listener, behaviours).
- `DESIGN.md:436`: one sentence added after "no native menu is drawn in a page."; it states the rule of item 8 for both kinds of window (held from the page's entry until the page has left and, for a window not in full screen before, until the window is out too) and the float's bounds over the same span.
- `agents/spec.md` has no rule on list items or sentence length (`grep -n -i "sentence\|list item" agents/spec.md` finds only the comment-wrapping and grep-after-rename rules), so the sentences were read against the hub's "Writing docs" rules instead: one line per paragraph, ASCII, no dashes, no history words. `npx prettier --check HELP.md DESIGN.md README.md` passes.
- `HELP.md:367` and `README.md:9` mention `~/.oculus/window.json`: still true.
- The head comments of `Present.svelte` and `window-file.ts` and the doc comments of `keepState` and `tellBounds` are rewritten for the change; the doc comments of `stateOf`, `remember` (`Windows` type, `windows.ts:81-82`) and `window-state.ts` are still true.

Comment words check, after the repair (`diff base file | grep '^>' | grep -n -i -w "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands|until|already|after"` over the five code files, the new test file read whole): hits in `Present.svelte` ("before it is hidden", a wait; "resolves after it leaves again", an order of events; "tab is hidden" line), `windows.ts` ("comes before the window has left", "was not in full screen before", event order and a state), `window-file.ts` ("until the window is out", "still on its way out", "read before the window starts", "already stays in it") and the test ("window already out first", "before the page does", "after every change"). Each describes an order of events or a state of the window; none compares with an earlier state of the code.

## Not in the brief, for the orchestrator

- `deck.meta.hint` names `O` and `F` and not Space; the repair added `F` only, as ordered.
- Browser behaviours the code relies on and nobody ran: that a `display: none` ancestor does not by itself end a page's full screen (the code ends it from `useShown()` instead), that `fullscreenchange` fires on the document for an Esc taken by the browser, and that `bind:clientWidth` of the box gives the screen's width in full screen. The landing look covers them.
- No library added (`screenfull` not used, per the brief).

## Repair round 1

First line updated: "Everything in the brief and in repair round 1 is done, and G53's test is written and passes." Every line number in this section is taken after the last change.

### 1. G53's test (Z644 (a))

File: `tests/server/desktop/window-file.test.ts` (beside `window-guard.test.ts` in `tests/server/desktop/`, which holds 4 files now). Title of the one `it.each`: `the window file during a page full screen > keeps the window own state: $title`, over 10 rows. Each row is a sequence of `[change, live state, state the file holds after it]`, folded through `recordWindow` from no hold, in the order macOS reports the events:

| Row (title after "a windowed window:" and so on) | Sequence | The file holds after each change |
|---|---|---|
| 1 page enters, leaves by F or Esc | page-enter(windowed), other(full), page-leave(full), other(windowed) | null, windowed, null, windowed |
| 2 page leaves from the window menu, window out first | page-enter(windowed), other(full), page-leave(windowed), other(windowed) | null, windowed, null, windowed |
| 3 window menu leaves its full screen before the page does | page-enter(windowed), other(full), other(windowed), page-leave(windowed), other(windowed) | null, windowed, windowed, null, windowed |
| 4 close while the page is in full screen | page-enter(windowed), other(full), other(full) | null, windowed, windowed |
| 5 close between the page leaving and the window leaving | page-enter(windowed), other(full), page-leave(full), other(full) | null, windowed, null, windowed |
| 6 reader's own full screen first, page enters and leaves | page-enter(full), other(full), page-leave(full), other(full) | null, full, full, full |
| 7 reader's own full screen, left by the window menu during the page | page-enter(full), other(windowed), page-leave(windowed) | null, full, windowed |
| 8 maximised window, page enters, quit | page-enter(maximised), other(maximised and full), other(maximised and full) | null, maximised and not full, the same |
| 9 no page in full screen | other(windowed), other(full), page-leave(full) | windowed, full, full |
| 10 zoom changed during the page | page-enter(windowed), other(full, zoom 1.5) | null, windowed with zoom 1.5 |

Run after the change: `npx vitest run tests/server/desktop/window-file.test.ts --reporter=verbose` printed ten passing lines `... keeps the window own state: ...` and `Test Files  1 passed (1)`, `Tests  10 passed (10)`. The same file ran inside `npm run test:quick` (it lists `tests/server/desktop/window-file.test.ts: changed`, `ok vitest`).

On the unchanged code, read from the base copy and not run (the base has no `recordWindow`, so the file cannot import it; no code was edited to see it fail): the base `keepState` (`windows.ts:218-233` of the base) calls `deps.store.keep(stateOf(entry))` on `moved`, `resized`, `maximize`, `unmaximize`, `enter-full-screen`, `leave-full-screen` and `close`, with `stateOf` reading `fullScreen: win.isFullScreen()` live (`:208`), and registers no handler for `enter-html-full-screen` or `leave-html-full-screen`. Row by row, what the base writes at the change the row expects something else:

| Row | Base writes | The row expects |
|---|---|---|
| 1, 2 | at `other(full)` the live state with `fullScreen: true` | windowed, `fullScreen: false` |
| 3 | same at the first `other(full)` | windowed |
| 4 | at both `other(full)` the live state with `fullScreen: true` (the close writes it too) | windowed |
| 5 | at `other(full)` and at the final `other(full)`, `fullScreen: true` | windowed both times |
| 6 | the live state, `fullScreen: true` | full: same result, the row guards the kept-full-screen half of G53 |
| 7 | at `other(windowed)` the live state, windowed | full (held), then windowed: differs at the middle change |
| 8 | at `other(maximised and full)` `maximised: true, fullScreen: true` | `maximised: true, fullScreen: false` |
| 9 | the live state | the live state: same result |
| 10 | `fullScreen: true`, zoom 1.5 | `fullScreen: false`, zoom 1.5 |

Rows 1 to 5, 7, 8 and 10 differ on the base and are what the change adds; rows 6 and 9 hold on the base and on the changed code.

### 2. B1: keys the deck does not own in full screen

`Present.svelte:262-269`: in the `default:` branch of `keys`, `if (full && !(event.key === 'Enter' && inControl(event.target))) event.preventDefault();`, so the shell (`keys.ts:224` skips a key whose default was prevented) never sees an unmodified key the deck does not own while the box is in full screen: `?`, `/`, `n`, `j`, `k`, `i`, `g`, `G`, the chord letters, Tab, ArrowUp, ArrowDown. Enter on a control inside the slide is left to the control; Space on a control is left at `:252`. Escape keeps its case (`:257-261`): an Escape outside the grid is not prevented, and the browser takes an unmodified Esc before the page anyway. The reader leaves by Esc, `F` or the browser's own way.

Keys that still reach the shell in full screen, because `keys` returns at `:220` for Alt, Ctrl or Meta: Ctrl+1 to 9 (tab of the pane, `keys.ts:160-162`), Ctrl+[ and Ctrl+] (`:212-222`), Ctrl+Tab and Ctrl+Shift+Tab in the app (`:196-209`), Cmd or Ctrl+Shift+F and +H (Search view, `:167-180`), Cmd/Ctrl+S, the default-command keys and the app keys (Cmd+W, Cmd+N, Cmd+F and the others `appKey` names). Ctrl+1 to 9, Ctrl+[ ], Ctrl+Tab and Cmd+W end the full screen at once by the tab-hidden or unmount path (`:198-200`, `:202-209`); Search, save and the other app keys act on a pane outside the box and are not stopped. This is stated, not fixed: the brief and the repair order name unmodified keys.

### 3. B2: float bounds

`windows.ts:259-290` `tellBounds`: `windowWasFull` records `entry.win.isFullScreen()` at `enter-html-full-screen` (`:279`); `leave-html-full-screen` clears `pageFullScreen` only when the window was in full screen before or is already out (`:282-284`); otherwise the window's own `leave-full-screen` clears it (`:285-287`). `tell` returns while `pageFullScreen` and the timer checks it again (`:269`, `:271`). Read, not run.

### 4. P2's pending paths

- A `requestFullscreen` pending at unmount: the unmount teardown sets `unmounted = true` (`Present.svelte:206`); the request's `.then` (`:153-157`) calls `document.exitFullscreen()` when `unmounted` and the element is the full-screen element once it resolves. A request rejected because the element is gone ends in `.catch(ignore)` (`:158`).
- A second `F` (or a second press of the control) before `fullscreenchange`: `enterFull` returns while `entering` is true (`:148`, set at `:150`, cleared in `.finally` at `:159`); `toggleFull` (`:168-171`) leaves when the box is already the full-screen element, otherwise calls `enterFull`. A press during a pending request does nothing.

### 5. St1, St2, St3, St5

- St1: `Recorded` is a local type, `window-file.ts:81` (`type Recorded = ...`); `grep -rn "\bRecorded\b" src tests utils` hits only `window-file.ts:81`, `:96` and the unrelated local type in `src/lib/state/boards/board/facets.ts`.
- St2: `.present:fullscreen` has `padding: 10px 12px` (`Present.svelte:396-400`), the pane body's (`Pane.svelte:158`); the framed slide keeps `padding: 0` (`:402-405`).
- St3: `DESIGN.md:436` now says the file keeps the window's own state, taken when the page entered full screen, "until the page has left full screen and, for a window that was not in full screen before, until the window is out of it too", and the float's bounds "over the same span".
- St5: `present.present_tip` is "Show the deck on the whole screen (F, while the deck has the focus)" (`config/text/views/academic/present.yml:21`); the disabled button still shows `present.empty`.

### 6. St4

`config/present.yml:22`: `deck.meta.hint` is `'left / right to move | <b>O</b> for the overview | <b>F</b> for full screen | each project slide: ...'`. The settings catalog holds the same sentence as the option's default (`config/catalogs/options.yml:1007`, `default:`), so that line carries the same change; `options.yml` is outside the write list and is named here for that reason. `grep -rn "for the overview" src tests config HELP.md DESIGN.md README.md` prints exactly these two lines. `tests/data/sources/config/catalog/options.test.ts` and `tests/data/sources/present.test.ts` ran in `test:quick` and passed.

### 7. P1 to P3 and the rules file's statements

- P1: `Recorded` is local; the unused-exports row of the table above no longer claims an import of it.
- P3: line references corrected: `TabView.svelte:41` and `:52-53`, the import at `windows.ts:16-22`, `disabled` at `Present.svelte:314`; every other line number of this report is taken after the last change.
- Reuse grep (spec: "grep `src` and `tests` for its name and its key call"): on the base copy, `grep -rn "recordWindow\|PageFullScreen\|WindowChange\|inControl\|toggleFull\|enterFull\|leaveFull\|syncFull\|POINTER_REST_MS\|requestFullscreen" src tests utils` prints nothing, so nothing existed to reuse. After the change the importers are `windows.ts:18-20` and `tests/server/desktop/window-file.test.ts:8-10` for the three exported names. A no-op `ignore` exists in `ActivityRail.svelte:79` as a local function with its own meaning; `Present.svelte:145` is a local one-line constant and is not shared.
- Changed-names grep: `grep -rn "window.json\|fullScreen" HELP.md DESIGN.md README.md src tests` outside `src/desktop`: `README.md:9`, `HELP.md:367` and `DESIGN.md:436` mention `window.json`; the first two are still true, the third is rewritten (item 5, St3). The changed hint text: the grep of section 6.
- Catalog keys: `present.present` ("Present") and `present.present_tip` are non-empty; `present.present` is declared once in group `present` (`present.yml:20`) and `present_tip` once (`:21`); `project.present_tip` (`config/text/views/boards/project.yml:79`) is another group's key and does not collide; both new keys have a reader (`Present.svelte:309-310`).
- Asynchronous paths (spec: in flight, after close, superseded): a pending request at unmount (section 4), a second press while pending (section 4), a request that resolves into a hidden tab or an empty deck (the effect at `:198-200` leaves once `full` is set by `fullscreenchange`), an exit that is refused (`.catch(ignore)` at `:164`), a `fullscreenchange` after unmount (the document listener is removed with the component; `syncFull` reads `box`, which is null then, so `full` is false), and a timer left running (cleared in the effect's cleanup, `:194`). Ids and keys: the step introduces no id or key beyond the two catalog keys.

### Verify, rerun after the last change

`npm run diagrams` exit 0, then `npm run test:quick`: `test:quick: 144.1 s (limit 45.0 s); every command passed` and `test:quick: over the time limit`; `ok prettier`, `ok ASCII gate`, `ok vitest`, `ok svelte-check (...) 0 ERRORS 0 WARNINGS`, `ok eslint`. The rules file's ASCII gate over `src tests config`: no output. `sh utils/unused-exports.sh`: exit 0, identical to the base copy's `unused-exports.txt`. `wc -l`: see the Files table. `LC_ALL=C grep -n '[^ -~]' HELP.md DESIGN.md`: no output. Not covered: nothing was run in a browser or in the app; `tests/checks`, the build and the slow tests are the landing list's.
