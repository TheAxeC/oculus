# Q49 report

Everything in the brief is done.

## DONE / NOT DONE

| Deliverable | State | Command and output |
| --- | --- | --- |
| 1. A hidden button takes no room | DONE | `npx playwright test tests/browser/focus-buttons.spec.ts`: case "a row's hidden buttons take no room, and are drawn over the row's end" passes; it asserts the name's drawn width equals its width with `.rest` removed from the page, within 0.5px |
| 2. They draw over the row's end when they appear | DONE | same case: on hover `under === drawn` (the name's box does not change), every revealed button's right edge is at or inside the row's right edge (`<= 0.5px`) and its left edge inside the row (`> 0`) |
| 3. The keyboard still reaches them | DONE | same file, case "the keyboard reaches a row's hidden buttons in turn, and a press writes": from the row's name, Tab focuses each `.act` in drawn order, opacity 0 before the focus arrives and 1 after, Enter on the 1w button writes `snooze:` and the manifest is byte-restored |
| 4. A touch device keeps them drawn, taking their room | DONE | same file, describe "on a device with no pointer" (`isMobile: true`): every hidden button at opacity 1, `.rest` width `> 0`, first button drawn to the right of the name rather than over it |
| Node: the marks of a row are unchanged | DONE | `npx vitest run tests/ui/primitives.test.ts`: case "marks the button a row keeps and puts the rest in the group a row hides" (kept carries `kept` and is outside the group; the hidden one carries `>1w<` and `title="snooze 1w"`) |
| Verification set | DONE | `npx vitest run --reporter=dot` 251 files / 4248 tests passed; `npm run check` 0 errors 0 warnings; `npm run build` ok; `npm run format:check` clean; `npm run lint` clean; ASCII gate prints nothing; `npx playwright test tests/browser/focus-buttons.spec.ts tests/browser/focus-look.spec.ts tests/browser/cards.spec.ts` 24 passed |
| Extra browser check (not asked for) | DONE | `npx playwright test tests/browser/focus-drag.spec.ts tests/browser/layout.spec.ts tests/browser/pages.spec.ts tests/browser/shell-defects.spec.ts tests/browser/tabs.spec.ts` 46 passed (every other spec that opens the Focus view) |

One flake, not mine: in two of six full `npx vitest run` runs, `tests/server/git.test.ts > the log, the branches and the worktrees > carries the newest commits, newest first, capped at the constant` timed out at 5000ms while another worktree's browser suite was running. Alone: `npx vitest run tests/server/git.test.ts` 34 passed. It builds commits in a temporary repository and touches nothing this step changed.

## The measurement at a narrow pane

Same row, same window (760px wide, the Focus command centre column 600px, row "Poster: robust embeddings under shift" with seven hidden buttons):

| | Name's drawn width |
| --- | --- |
| Before (hidden buttons in the row's flow) | 158.30px |
| After | 301.09px, equal to the width with the buttons taken out of the page |

Both from the same assertion message, printed by the test under the revert and passing without it.

## Reverts run

| Test | Revert | Result |
| --- | --- | --- |
| "take no room" (browser) | drop `width: 0` and the negative margin from `.reveal .rest` | red: "the name is 158.296875px wide and 301.09375px with the hidden buttons taken out" |
| "keyboard reaches" (browser) | hide the group with `display: none`, restored on `li:hover` only | red: first `.act` "inactive" instead of focused after Tab |
| "no pointer" (browser) | take the layout rules out of `@media (hover: hover)` | red: `.rest` width 0 on the emulated device |
| "marks the button a row keeps" (node) | one `{#each}` over `row.actions`, no `.rest` group | red: expected '' to contain '>1w<' |

## Doc text (not edited here, per decision 2)

`DESIGN.md:336`, replacing "A ticker row's buttons are revealed the same way by `ui/Ticker.svelte`'s `reveal`, the button the row exists for (`kept`: a subtask's or follow-up's done, a task's `done` status) always drawn.":

"A ticker row's buttons are revealed the same way by `ui/Ticker.svelte`'s `reveal`, the button the row exists for (`kept`: a subtask's or follow-up's done, a task's `done` status) always drawn and holding its width at the row's end; under a pointer the ones a row hides take no width at all, in a box of no width that packs them against that end, so a name is cut by the row's width alone and the buttons are drawn over the row's end when the pointer or the keyboard arrives, a device with no pointer drawing them all in the row's flow."

`HELP.md:75`, replacing "A ticker line's buttons appear under the pointer or the keyboard; a subtask's, a follow-up's and a task's done is always shown.":

"A ticker line's buttons appear under the pointer or the keyboard, drawn over the end of the line and taking none of its room while they wait, so a long name has the whole line; a subtask's, a follow-up's and a task's done is always shown, at the line's end."

## What a reader sees change

| | Before | After |
| --- | --- | --- |
| A row's name | cut where the hidden buttons began, with no ellipsis room in a narrow pane | has the whole row less the glyph, the tail and the kept button; cut by the row's own ellipsis rule |
| The hidden buttons, waiting | transparent, holding about 40px each of the row | no width at all |
| The hidden buttons, revealed | in the flow, right after the tail | over the right end of the row, ending 6px before the kept button; the name behind them does not move |
| The kept button | right after the tail | at the row's end, its width held (it moves right in a row with spare width) |
| Order of the buttons | markup order, so a subtask's done came first | the hidden ones first, the kept one last, in the drawn order and in the Tab order |
| A device with no pointer | all buttons drawn, in the flow | unchanged |

## Files changed

| File | Lines |
| --- | --- |
| `src/lib/ui/Ticker.svelte` | +74 / -15 |
| `tests/browser/focus-buttons.spec.ts` | +173 / -2 |
| `tests/ui/primitives.test.ts` | +14 / 0 |

`tests/ui/wall.test.ts` is untouched: no new surface is painted, so its `src/lib/ui/Ticker.svelte .act` entry still covers the component. `git status` in the worktree lists those three files and nothing else.

How it is built: the buttons now sit in `<span class="acts">`, with the ones a row hides in `<span class="rest">` inside it and the `kept` one after that group; both are drawn by one `{#snippet control(id, action, keep)}`, so the button exists once. Under `@media (hover: hover)`, `.acts` takes `margin-left: auto` and `.rest` becomes `width: 0; justify-content: flex-end; margin-left: calc(var(--act-gap) * -1)`, so its buttons overflow to the left of the point where the group sits and cost the row nothing. The opacity rules are untouched, which is why `tests/browser/cards.spec.ts` still reads 0 and 1 off each button.

## Judgment calls the brief did not cover (each reversible)

1. **The kept button moves to the row's end** in a row with spare width. The auto margin is what puts the revealed buttons at the row's end rather than over the middle of a short name, and the kept button rides with it. Brief item 1 says the kept button "keeps its place as it does today": in the narrow case it is the same place, in a wide row it is not. Reversing it means dropping `.reveal .acts { margin-left: auto }`, and then the revealed buttons appear over the name wherever the name happens to end.
2. **Both browser cases live in `tests/browser/focus-buttons.spec.ts`**, whose head comment now names them, rather than in a new file.
3. **The hidden buttons come before the kept one** in the DOM, so the Tab order and the drawn order match each other but no longer match `row.actions`.
4. `--act-gap` is a local custom property on `.acts`, because the gap between the buttons and the negative margin that cancels it must be the same number.
5. The touch case uses Playwright's `isMobile`, since Chrome answers `hover: none` from device emulation; `Emulation.setEmulatedMedia` with a `hover` feature does nothing (tried, the buttons stayed at opacity 0).

## Limitations and sharp edges

- **The revealed buttons cover the end of the name, and take the press there.** While the row is under the pointer, a click on the covered stretch presses the button drawn over it, not the name. `pointer-events: none` on the waiting group would not help a real reader (the pointer is inside the row before any click, so the buttons are already live) and it made `tests/browser/focus-buttons.spec.ts`'s existing snooze click unclickable, so it is not there.
- **Slivers of the name show in the 6px gaps between the revealed buttons.** Seen in a screenshot of the hovered row. Masking the strip would need a surface token behind it, and under a wallpaper that strip would have to be translucent and would show the name through it anyway, so nothing is painted.
- **In a pane narrower than the button group, the revealed buttons overflow past the row's left edge.** Measured at a 480px window (row 320px, group 424px): the leftmost button starts 104.20px left of the row's left edge. Before this step the same case cut the name away to nothing instead. There is no More menu on a ticker row to fold them into, and building one is not in this brief.
- The test's row selection adds a literal 6px per button when it works out whether a row's name and buttons can share; that is `--act-gap`, read from the component by eye rather than from the page.
- `tests/browser/focus-look.spec.ts`, `tests/browser/cards.spec.ts` and the five focus-adjacent specs were run; the rest of the browser suite was not (it is the orchestrator's after this report).

---

# Repair round 1 (builder ab29cfa8299cdf7f4, sent 01:21, reported 04:11)

Every ruling done. The overlay is gone: a row's buttons are drawn on the line, at the row's end, and what a row is not drawing is `display: none`, so it holds no width, no press and no Tab stop, and the board around the row is the same whether the row is open or not.

| Ruling | State | Command and output |
| --- | --- | --- |
| 1. The buttons never leave the row | DONE | `npx playwright test tests/browser/focus-buttons.spec.ts` case "a row keeps its name while its buttons wait...": spill 0 px and 0 unpointable buttons at 1600, 900, 760 and 480, in light and in mocha. A row with no room draws the buttons that fit and leaves the rest out (7/7 at 1600 and 760 light, 3/7 at 900 and 480 light, 4/7 at 900 mocha) |
| 2. The name is never covered by a button | DONE | same case: cover 0 px at all eight width and theme pairs; the name at rest is exactly the room the row gives it (301.1 of 301.0 at 1600 light, 294.5 of 294.5 at 480 light), and while the row is open the name is cut at the group's left edge by the row's own ellipsis |
| 3. The kept button keeps its place | DONE | `npx vitest run tests/ui/primitives.test.ts -t "lists the buttons"`: the markup lists `1w` then `hide` with `kept` on the first, which is the order `row.actions` gives; in the browser, "the keyboard walks the buttons a row draws" asserts the DOM order is the same at rest and open, and walks it |
| 4. No press at the end of a name reaches a button | DONE | case "a press at the end of a name reaches the name...": `elementFromPoint` every 8 px along the name, at all four widths, reaches no `.act`; then a CDP `Input.dispatchTouchEvent` at the name's last point on a context that answers `matchMedia('(hover: hover)').matches === true` produces a click whose target is not an `.act` |
| 5. The comment and the doc text say what the code does | DONE | `src/lib/ui/Ticker.svelte:10-25` and `:348-351` rewritten |
| 6. The cases run at more than one width | DONE | `WIDTHS = [1600, 900, 760, 480]`; the measured case runs all four in light and in mocha, the keyboard and press cases all four; each case carries `// revert: <path>:<line> => <replacement>` |
| 7. The four reproductions | DONE | the table below, from the same case; the tab walk from the keyboard case |

## The measurements, at four widths and both themes

The row is the board's seven-button row ("Poster: robust embeddings under shift"). `cover` is the overlap of a drawn button with the name's box, `spill` the furthest a drawn button reaches past the row's edge, `unpointable` the drawn buttons whose own centre answers to something else.

| theme, width | row | name at rest | cover | spill | drawn | unpointable |
| --- | --- | --- | --- | --- | --- | --- |
| light 1600 | 707.0 | 301.1 of 301.0 | 0 | 0 | 7/7 | 0 |
| light 900 | 357.0 | 301.1 of 301.0 | 0 | 0 | 3/7 | 0 |
| light 760 | 600.0 | 301.1 of 301.0 | 0 | 0 | 7/7 | 0 |
| light 480 | 320.0 | 294.5 of 294.5 | 0 | 0 | 3/7 | 0 |
| mocha 1600 | 707.0 | 322.4 of 322.0 | 0 | 0 | 7/7 | 0 |
| mocha 900 | 357.0 | 322.4 of 322.0 | 0 | 0 | 4/7 | 0 |
| mocha 760 | 287.0 | 256.0 of 256.0 | 0 | 0 | 3/7 | 0 |
| mocha 480 | 320.0 | 289.0 of 289.0 | 0 | 0 | 3/7 | 0 |

Row height, closed then open, at the same eight pairs: 17.25 and 17.25 in light, 15.75 and 15.75 in mocha; the case asserts the two are equal.

Tab walk, from the row's name, each stop asserted inside the row and on top at its own centre:

| width | the row lists | the keyboard walks |
| --- | --- | --- |
| 1600 | planned, completed, cancelled, not-attending, 1w, 1mo, hide | the same seven |
| 900 | the same seven | planned, completed, cancelled, hide |
| 760 | the same seven | the same seven |
| 480 | the same seven | planned, completed, hide |

At 900 and 480 the walk is the buttons the row has room for: the first that fit, plus the one holding the keyboard, which a row never takes back.

## The reverts

| case | revert | result |
| --- | --- | --- |
| a row keeps its name | `Ticker.svelte:358 => display: inline-block;` | red: "the waiting buttons hold width, light at 1600" |
| the same case's height | `Ticker.svelte:312 => align-self: baseline;` | red: "the row's height changed under the pointer, light at 1600" |
| the keyboard walks | `Ticker.svelte:374 => display: inline-block;` | red: "the focus is outside the row at 900" |
| a button the keyboard reaches writes | `Ticker.svelte:362 => display: none;` | red: "the keyboard never reached 1w" |
| a press at the end of a name | `Ticker.svelte:358 => position: absolute; right: 0;` | red: "a button answers over the name at 900" |
| on a device with no pointer | `Ticker.svelte:348 => @media (hover: none) {` | red: "the buttons hold no room on a device that always draws them" |

## Verification on the final tree

| command | output |
| --- | --- |
| `npx playwright test tests/browser/focus-buttons.spec.ts tests/browser/focus-look.spec.ts tests/browser/cards.spec.ts tests/browser/focus-drag.spec.ts` | 27 passed |
| `npm run check` | COMPLETED 1222 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS |
| `npm run build` | built, twice (client and server) |
| `npm run format:check` | All matched files use Prettier code style! |
| `npm run lint` | no output |
| the ASCII gate | prints nothing |
| `npx vitest run --reporter=dot` | 4246 of 4248 passed; `tests/server/git.test.ts > carries the newest commits...` and `tests/server/hpc/ssh.test.ts > rejects a command that never returns at the budget...` failed |
| `npx vitest run tests/server/git.test.ts tests/server/hpc/ssh.test.ts --reporter=dot` | 2 files, 39 tests, all passed |

## Doc text (not edited in the step)

`DESIGN.md:336`, replacing "A ticker row's buttons are revealed the same way by `ui/Ticker.svelte`'s `reveal`, the button the row exists for (`kept`: a subtask's or follow-up's done, a task's `done` status) always drawn.":

"A ticker row's buttons are revealed the same way by `ui/Ticker.svelte`'s `reveal`, the button the row exists for (`kept`: a subtask's or follow-up's done, a task's `done` status) always drawn, where `row.actions` lists it. What a row is not drawing is out of the page, so it holds no width, no press and no Tab stop and the board around the row does not move; an open row draws its buttons on the line at the row's end and its name is cut there by the row's own ellipsis, and a row too narrow for all of them draws the ones it measured room for, keeping the one it exists for and the one holding the keyboard. Only a pointer opens a row, since a tap on a hybrid would land on a button drawn where the name was."

`HELP.md:75`, replacing "A ticker line's buttons appear under the pointer or the keyboard; a subtask's, a follow-up's and a task's done is always shown.":

"A ticker line's buttons appear under the pointer or the keyboard, at the end of the line, and take none of its room while they wait, so a long name has the whole line and is cut where the buttons begin; a line too narrow for all of them shows the ones that fit. A subtask's, a follow-up's and a task's done is always shown."

## What a reader sees, before this round and now

| | the round before | now |
| --- | --- | --- |
| A hovered or focused row | the buttons over the row's end, covering up to 100% of the name, out past the row into the rail | the buttons on the line at the row's end, the name cut where they begin |
| A press at the end of a name | reached a button that was not drawn | reaches the name; a tap on a hybrid reaches the name |
| The Tab order | the kept button last | `row.actions` order, the kept button where the caller lists it |
| A narrow pane | every button drawn, some unpointable | the buttons that fit, each pointable at its own centre |
| The row's height | grew by 0.5 px when the buttons appeared, which moved the board's columns | the same open or closed |

## Files changed

| File | Lines |
| --- | --- |
| `src/lib/ui/Ticker.svelte` | +214 / -20 |
| `tests/browser/focus-buttons.spec.ts` | +373 / -2 |
| `tests/ui/primitives.test.ts` | +21 / 0 |

## Sharp edges and decisions, each reversible

- The clamp lands one frame after a row opens: a row draws every button first, since a button that is not drawn has no width to measure. In that frame `.acts` is `max-width: 100%; overflow: hidden`, so nothing is drawn outside the row, but a button may be half drawn at the clip edge for one frame while the group fades in.
- A touch never opens a row on a device that also has a pointer (`over()` returns unless `event.pointerType === 'mouse'`), so a hybrid's touchscreen cannot reach a ticker button at all; its trackpad can, and a device with no pointer draws them all.
- The button group sits at the row's end (`margin-left: auto`) rather than following the tail.
- The button box sits on the middle of the line (`align-self: center`), which keeps the row's height the same open or closed; rows carrying buttons are 0.5 px shorter in light than on main.
- Two existing cases now put the pointer on the row before they press a button, and point at the row's name rather than its centre, because a Snoozed row is split across the board's two columns.
- `NAME_FLOOR = 5` (em of the row's own text) is the stretch of name a row keeps whatever its buttons ask for; the buttons get what is left. A `ResizeObserver` on the list asks for the measurement again when the pane resizes.
