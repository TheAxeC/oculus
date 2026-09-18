# Q53, repair round 1: the instructions as sent

Three messages to the builder, each verbatim below with the time it was sent. Together they are the whole round: six rulings, the green `Ticker.svelte:231` revert directive, and the badge tones Axel ruled, eight items. The builder was stopped partway through, so its worktree holds some of these done and some not; a continuation builder reads this file, finds out which, and finishes the rest.

## Part 1, the six rulings of the review (sent 2026-09-18 11:34:11)

Repair round for Q53: six rulings. The review is on the main checkout at tools/oculus/.scratch/migration/agents/reviews/Q53-refuter.md; read it first, it names the probe behind each finding and every one was driven with `Input.dispatchTouchEvent` on an ordinary page.

Same worktree, same rules: no git command, nothing written under `.scratch/`. Your paths are unchanged.

1. **A tap that is not the pointer still leaves the pointer's row open, so two rows draw open at once.** `opened()` at `src/lib/ui/Ticker.svelte:155-160` answers `keyed`, then `pointed`, then `tapped`, and nothing clears `tapped` when the pointer moves into another row. Measured: open after the tap 1, open after the pointer moved to another row 2, buttons drawn across every open row 13. That contradicts the file's own head comment at `:10-11`, "only while the pointer is in the row or the keyboard is inside it". One row is open at a time, whichever way it was opened; a pointer entering another row clears the tapped one.

2. **`tapped` is an index into `list.children`, so it goes stale the moment the rows change.** After a tap opened one row and a second tap snoozed it out of the group, a different row is drawn open with its buttons in the page: open before the write `Review 2 papers for MLShift Workshop`, after the write `Stream-Anomaly deadline`. `pointed` and `keyed` are cleared by a leave or a focusout; `tapped` has no such event. Hold the row by something that survives the list changing, and say in the report what you held it by and what happens when the row it names is gone.

3. **A row with nothing to reveal costs two taps where a mouse costs one press.** `tap()` opens any row `rowAt` resolves and swallows the click, and the Focus board has such a row today (9 rows, 8 with buttons, 1 plain): the first tap opens a row that draws nothing and presses nothing, the second opens the tab. A row with no buttons to draw has nothing to open: let the click through.

4. **You removed a committed revert on a ground that does not reproduce.** Your report says the old `// revert: src/lib/ui/Ticker.svelte:358 => position: absolute; right: 0;` at `tests/browser/focus-buttons.spec.ts:400` left its test green. The reviewer applied it at the line your own correction table maps 358 to, `:398`, `.reveal .act:not(.kept) { display: none; }`, and got `Error: a button answers over the name at 480`, 1 failed, which is exactly what the comment described. Put that revert back at the line it now names and prove it red. If your new revert is also real, keep both, one per line; if you applied the old one somewhere else, say which line and why.

5. **The new menu case does not pin the wallpaper it needs.** `tests/browser/tabs.spec.ts:768-770` reads `.wallpaper`'s count only into the failure message. The committed page-strip case at `:463` asserts it: `await expect(page.locator('.wallpaper')).toHaveCount(1);`. Do the same, so the case cannot go quietly green over a tree where no wallpaper is drawn.

6. **The accent reading is ruled: yours stands.** One accent line over the pane strips, and the page strip's current tab keeps its own, because the two mark different things: the pane strip's line says where the rail opens a view, the page strip's says which page is shown. Say that in `shell/PaneView.svelte`'s head comment in one clause, and make the `HELP.md` and `DESIGN.md` replacements you carry say it too, so the next reader does not read "exactly one shown tab in the window" and count two.

On finding 5 of the review, the second tap pressing a button that arrived under a stationary finger: that is the shape Axel ruled and it stays. What is owed is that your report says it plainly, with the measurement (`elementFromPoint` at the name's centre answers `BUTTON.name` closed and `BUTTON.act` open), and that the `HELP.md` line you carry tells a reader the buttons are drawn at the row's end and the name is cut there.

Report in the same shape, with every revert rerun on the final tree and every revert comment's line number re-read after your last edit.

## Part 2, the green Ticker revert directive (sent 2026-09-18 12:16:33)

One more item for your round, inside your paths: a committed revert directive on `src/lib/ui/Ticker.svelte` does not redden its own case.

`node bin/revert-check.mjs tests/ui/primitives.test.ts` on main prints:

```
GREEN     tests/ui/primitives.test.ts :: draws a row action as a button only when the caller says what one means (revert src/lib/ui/Ticker.svelte:231)
```

GREEN means the case still passes with the directive's replacement applied, so the directive proves nothing. It is pre-existing, not something your round caused, but `src/lib/ui/Ticker.svelte` is in your path list and no other step has it, so it is yours to close.

Do one of these two, whichever is true, and say in your report which and why:

1. The directive names the wrong line, or a replacement that does not change behaviour. Re-point it at a line whose replacement actually breaks what that case asserts, and prove it: apply it, run the case, quote the failure, restore the file and show it is byte-identical.
2. The case does not actually test what the directive claims. Then the case is the problem, not the directive: make the case assert the behaviour, and give it a directive that reddens it.

Do not delete the directive and do not weaken the case. Re-run `node bin/revert-check.mjs` over every test file you touched and report `0 unproven` with no GREEN line, quoting the output.

## Part 3, Axel's ruling on the picker badge tones (sent 2026-09-18 12:35:42)

Axel has ruled on the repository picker's badge colour, and it is yours to build in this round. It widens your paths by one file: `src/lib/views/Repositories.svelte`, which landed in Q52 at `521c938c` and is no longer held by another step.

The ruling: the three picker badge words get their own tones. Today `Repositories.svelte` passes no `badgeTone` at all, so "gone", "no repository" and "unreadable" draw in the same neutral pair (`--accent-txt` on `--chip`), and a reader scanning a list of roots cannot tell the three apart before reading the word. Leaving them neutral because the contrast passes was the lazy option and was rejected.

Note before you start: Q52's report claimed the `--on-c-*` family resolves to nothing in the built CSS, which is why no tone was passed. That claim is false. `src/lib/themes/derive.ts` computes the family and `src/lib/ui/theme.ts` sets it on the document; `getComputedStyle(document.documentElement).getPropertyValue('--on-c-red')` returns `#ffffff` in the running page. Do not repeat that reasoning.

What to build:

1. `src/lib/views/Repositories.svelte` passes `badgeTone` beside `badge` for each picker row: `missing` takes `red`, `failed` takes `amber`, `none` takes `blue`. A repository that reads has no badge and so no tone. Those three hues are in `src/lib/themes/tokens.css` (`--c-red`, `--c-amber`, `--c-blue`) and the tree already uses red for a fault and amber for a warning elsewhere.
2. The mapping belongs beside the word it colours, not inline at the call site: `shapeBadge` in `src/lib/views/shared/repo-shape.ts` answers the word, so add a sibling that answers the tone for a shape, so the two cannot drift apart. `ui/Menu.svelte`'s `badgeStyle(tone)` at line 175 builds the pair as `--badge-bg: var(--c-<tone>); --badge-fg: var(--on-c-<tone>)`; you pass the hue name, nothing more.
3. A node test that each shape maps to its tone and that a readable row passes none, and a browser case that the three rows carry the tone in the page, read from the rendered `style` attribute or the computed colour, not from the source.
4. Each new case gets a machine-readable revert directive (`// revert: <path>:<line> => <replacement>` inside the case body) that actually reddens it, proven with `node bin/revert-check.mjs`.
5. `tests/contrast.test.ts` must stay green: it holds every `-txt` family readable across themes, and `--on-c-*` is the family you are now using. Quote its result.

Do not change any hue's value in `tokens.css` and do not add a hue. If one of the three pairs fails the contrast gate, that is a finding to report with the measured ratio, not a reason to pick a different hue quietly.

This is in addition to the seven rulings and the Ticker revert already sent. Report it as its own row in your DONE / NOT DONE table.
