# Diagnosis: an active tab left out of sight in its strip (Q78-look-1)

Every quoted command output carries `<REDACTED>` in place of the value of a secret in it, as the rules file's rule on secrets in quoted command output says. A diagnosis of the same step later is appended below under its own heading, which names its finding.

## Symptom

From `agents/reviews/owed-looks.md`, the Q78 look (2026-10-02, TEST, the rice palette "mocha" with its wallpaper, then back to "vscode dark modern"): "Q78-look-1: a tab activated while it is scrolled out of its strip stays out of sight: Processes shown in the left pane while the strip shows the inactive "Account setup" tab; VS Code scrolls the active tab into view. Booked into X3c (Z294)."

## Where the probes run

TEST at localhost:8790, tab 812136282, which serves main at 4bc8983b8 (X3c is not served). The probes are page scripts only: no source file is changed, so the step's worktree and main are untouched. The paths redirected under `$TMPDIR`: none. From 2026-10-03 23:00 the TEST window was in front (Z371 (a)): `document.visibilityState` `visible`, 121 frames in one second; at about 23:15 it went `hidden` again and the probes stopped there.

## Red command

The earlier runs on a hidden tab (16:11) do not count: no frame was drawn, so no resize observer ran.

With the window in front, the width change alone is green: `__diagRed5` (scroll the strip's tab list so its active tab rests at the start or at the end, set `--text-scale` to 1.3, read, set it back, read) kept the active tab whole in 12 of 12 runs on the second and third strips, since the list's own width changed with the scale and the reveal ran. Activating a tab out of sight is green too: `__diagAct` and `__diagRed6` (click "Pillars" while the Focus strip shows "Focus", with the list at full width, 40 px and 0 px, then widen) left the new active tab whole in 9 of 9 runs.

Red: `__diagRed7(2, 1.3, 'end')`. On the third strip (the Focus pane, 32 tabs), hold the tab list at its width (`style.width` 175 px, `flex: none`), scroll it so the active tab "Focus" rests whole at the list's right end, set `--text-scale` to 1.3 (the tabs grow, as with the Text size setting or a theme's font), read whether the active tab is whole. This is the state Q78-look-1 saw: the active tab out of sight while a neighbour is shown.

```
end: pre sl=271 cw=175 [104,175] V | scaled sl=271 cw=175 [208,298] X | back sl=271 cw=175 [104,175] V
end: pre sl=271 cw=175 [104,175] V | scaled sl=271 cw=175 [208,298] X | back sl=271 cw=175 [104,175] V
end: pre sl=271 cw=175 [104,175] V | scaled sl=271 cw=175 [208,298] X | back sl=271 cw=175 [104,175] V
```

The same with the active tab at the start goes green (`start: pre sl=375 [0,71] V | scaled sl=479 [0,90] V`, three of three).

Validity, checked 2026-10-03 about 23:40 in a new tab group Axel asked for (tab 812137202, the same page: strips of 9, 17, 32 and 2 tabs): the page was `visible` for an 8 s watch, then went `hidden` within the next minute. A batch of five runs with a frame counter per run (`__diagP`) drew one frame per run, and its results flipped against the earlier ones: the end case brought the tab back once and the start case left it out once. While the page is hidden the resize observer's callbacks wait for the next drawn frame, so a run read in that state does not show what the strip does. Only the runs known to be drawn count: the page observer of hypothesis 1 fired after the scale in an end-case run, the page's own observer, made earlier, runs first in that same frame, and the offset stayed at 271 (red). The other red and green runs above carry no frame count, so which of them were drawn is not known; each is taken again with a frame count before it is used.

## Shrunk case

- Scale 1.1 and 1.02 in place of 1.3: still red (`[139,216] X`, `[111,183] X`).
- The active tab 5 px and 20 px inside the right end in place of at it: still red (`[202.8,293.4] X`, `[187.8,278.4] X`), so the edge allowance is not what keeps it.
- The list's width held: needed. Without it the list narrows with the scale (175 to 144) and the reveal runs (green, `__diagRed5`).
- The second strip (17 tabs, 509 px, its active tab second) at the end: green (`sl` 0 to 426); there the end placement could not be reached, since the list was already at offset 0.
- Left: one strip with its list at a fixed width, a reader's scroll that brings the active tab whole somewhere other than where the strip already rested, then the tabs growing.

## Hypotheses

1. If the resize observer does not fire when only the tabs change width, then nothing calls `resized`. Falsified by a page observer on the same list and faces (`DIAG-4b2e`): one callback with all 33 entries, the active tab among them, on the scale.
2. If `wholeAt`'s one pixel edge allowance judges a tab at the exact right edge not whole, then `shownWhole` is false before the scale. Falsified: insets of 5 and 20 px stay red.
3. If the start case is green only through the browser's scroll anchoring and the strip's reveal never runs on a change of tab widths, then `overflow-anchor: none` turns the start case red. Falsified: with it the start case still moves to 478.5, and a wrapper on the list's `scrollTo` (`DIAG-4b2e`) records `scrollTo({"left":478.3})`, so the reveal runs there.
4. If `revealOffset` returns the current offset for this geometry, then the arithmetic on the live spans gives 290.5. Falsified: the same arithmetic computed in the page from the live spans gives 478.3 as the only resting offset that shows the tab, and in the red case the `scrollTo` wrapper records no call at all, so `reveal` is not reached.
5. Standing: `resized` reads `was` as false in the red case, so `shownWhole` is false after the reader's scroll. `scrolled` (`ui/tabs/tab-scroll.svelte.ts:100-105`) sets `shownWhole` only when `list.clientWidth === measuredWidth`. A probe that narrowed the list by 1 px after the scroll (so that `resized` runs and sets `measuredWidth` and `shownWhole` at the current width) still stayed red, so a stale `measuredWidth` alone does not explain it. The next probe was a scroll away and back by 50 px at the start position (`__diagSB2`), which separates "any scroll by the reader leaves the strip unable to reveal" from "the end position does"; it timed out when the window went hidden and has no result.

## Probes

All are page scripts on TEST; no source file was changed.

- Rank 1: page `ResizeObserver` on the list and its 32 faces during the scale: one callback, 33 entries, the active tab included. Falsified.
- Rank 2: insets 0, 5 and 20 px, two runs each: all red. Falsified.
- Rank 3: `overflow-anchor: none` on the list, start and end: start green (478.5), end red. Falsified.
- Rank 4: the reveal arithmetic recomputed from the live spans after the scale: target `[478.3,568.9]`, list 175 px, resting offsets showing it whole `478.3`; the list's `scrollTo` wrapped: start case one call to 478.3, end case none. Falsified.
- Rank 5: a 1 px narrowing of the held list after the reader's scroll, four runs alternating with and without: all red. Leaves the hypothesis standing in another form; the scroll-away-and-back probe has no result.

## Also seen

The left pane (97 px, nine tabs, "Changes" active, the pane Q78-look-1 named) draws a tab list 0 px wide: the history arrows and the strip's controls take the whole width, so no tab, active or not, is in sight there at any scroll. This holds at full scale with no change of width.

## Cause

Not yet found. Every run from here carries its own frame count and is dropped when it drew fewer than 30 frames. The red command, the shrunk case and four falsified hypotheses stand; the fifth needs the scroll-away-and-back probe, which needs the TEST window in front again for about five minutes.

## Fix and test

Not reached.

## Cleanup

Every inline style the probes set on the tab lists (`width`, `flex`, `max-width`, `overflow-anchor`) is removed, the `scrollTo` wrapper deleted, the page globals `__diag*` deleted and `--text-scale` set back to `1` (read back by a page script: the lists' `style` attributes empty or absent, no `__diag` global). The probes clicked "Pillars" and "Focus" in the Focus pane, and Focus is active again, so the page's title now names the Focus pane where it named the Changes pane before. `shasum ~/.oculus/changes.jsonl ~/.oculus/workspaces.json` prints `f3d06124`, `1bf5d57a`, as before; `ls ~/.oculus/history | wc -l` prints 3; `git diff --exit-code -- tools/oculus/config ':!tools/oculus/config/local.yml'` is clean.
