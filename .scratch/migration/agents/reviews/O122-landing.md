# O122 landing

Position: roadmap entry "migration (cockpit to oculus)"; step O122, a Transcript draws only what is in view, landed. Next: O123, sessions move into the Explorer, to review; O124, the System page's merges, in repair round 1.

## Open items

None.

## The check of Steps 1

`ListAgents` shows neither O122's builder nor a reviewer of it.

## NOT DONE

Nothing in the brief. The cases not seen on a page are named under the look.

## What landed

A Transcript keeps only the rows near the view in the page, through `turn-window.svelte.ts` on `@tanstack/virtual-core`; a selection, a caret, the focus and the reader's place keep their rows; the reader's words hold by row key; `following` holds the true foot.

## What was found

One defect at the look, fixed at landing: an unmeasured row at the window's edge sent the column between two places 30 px apart inside one draw, 1026 writes, a 24 s freeze and `effect_update_depth_exceeded`. `turn-window.svelte.ts` now measures each row as it is drawn. No test covers it, since jsdom has no layout. Two report errors from the review over the round, closed at landing.

## The look

Scratch server on port 8797, from the gate. Fixtures of 20000 turns, 960 turns and a run of 500 calls.

| Case | Seen |
|---|---|
| 20000 turns, opened | At the foot, 10 rows in the page |
| Scrolled to the head, 196 reads of older turns | All 20000 turns held, at most 17 rows in the page, no long task over 100 ms in the runs after the fix |
| Slow scroll up, 60 px at a time, 150 steps through rows never drawn | Row at the view's top within 1 px at every step |
| Scroll position set to 0 repeatedly, for dragging the bar | Rows draw, older turns load, at the head `Q0` |
| PageUp, PageDown | 550 px a press, rows drawn |
| Home, End | Head and true foot, over 6.2 million px |
| Fragment link from the last turn to a raw `<h2 id>` in the second | Heading at the view's top, 0 px off |
| Open `details`, sideways code block, leaving and returning | Open again; 69.875 of 70 px |
| Focus on a Copy button, scrolled 20000 px away | Focus stays, row stays drawn, and goes once focus leaves |
| Caret, then shift-click 120 turns on over rows never drawn | 128 rows kept, every turn in the selection, stands while scrolling; cleared, back to 14 |
| Cmd+A in 960 turns | All 960 rows kept, every question in the selection; the selection is the whole page, as the browser gives it; cleared, 13 rows |
| Right-click on selected text | Copy |
| Run of 500 calls opened | Column grows, at most 39 rows through the run, choice stands after scrolling out and back |
| Another session taken and back | At the foot; the choice emptied, as ruling 2 says |
| Pane narrowed 540 to 434 px | Row at the top stays, 0 px |
| Text size up | Row at the top moved 1 px; sum of 960 rows equals the list's height to 0.1 px |
| Append 5465 px tall | Reader at the foot: foot within 1 px; reader above: 0 px |
| Tab 12 forward, 6 back | Each stop reached in order, rows 23 to 107 and back to 65 |
| Failed read of older turns | One request, Try again; pressed, the turns arrive and the line goes |
| Hidden tab, shown again, in the middle | 0 px, twice |
| Spacer | Computed background transparent |

Not seen on a page: a real switch of application with focus on a Copy button, since a look takes no focus from Axel's screen, so `document.hasFocus()` in that order rests on reading and the stubbed program; an image loading above the view (J4); a drag of the real scroll bar; a right-click on a spacer with a selection standing; sessions of one turn and of none; a transient `held.error`; a wallpaper theme on screen; Cmd+A in 20000 turns, which draws all of them. PageUp, PageDown and Home fell short nowhere, which closes ruling 4.

Console: no error after the fix.

## Verification

- Gate, the landing list: `test:quick: 97.6 s; every command passed`.
- Gate, after the fix: `test:quick: 77.5 s; every command passed`.
- `cmp` of the staged diffs of main and the gate: equal.

## Agents

- Builder a8555bc19a9c7b86a: first run 243522 tokens, 32 tool uses, 12 min 2 s; build 153718 tokens, 104 tool uses, 27 min 53 s; round 1 239848 tokens, 30 tool uses, 9 min 4 s.
- Brief check a8777c66a67dd93a3: 220297 tokens, 30 tool uses, 9 min 31 s.
- Reviewer a76c4d45596f25340: 318699 tokens, 45 tool uses, 23 min 14 s.
- Reviewer over round 1 a33da2c31118fccb2: 257021 tokens, 34 tool uses, 10 min 33 s.
- First report did not pass its bar. One fix at landing, two report corrections.

## Next

O123 to /refute; O124's round to its review, then landings.
