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
