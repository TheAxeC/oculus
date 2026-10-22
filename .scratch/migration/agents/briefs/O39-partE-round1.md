# O39 part E, repair round 1

The rules file, `agents/briefs/O39-partE.md` and `agents/briefs/O39-partE-cases.md` still hold. This round closes the findings of `agents/reviews/O39-partE-refuter.md`, one ruling each below. A shortcut is a finding: a narrower reading of a ruling, or work inside it reported as outside it, is done or handed back with the reason before the report.

## Rulings

1. **T1 and P1, one reader of the looks.** The three options `crt.on`, `rice.brackets` and `rice.monospace` are read by one function, `configLooks` of `src/lib/data/helpers/editor/start-theme.ts`, with its defaults. The page's `lookShape` (`src/lib/state/shared/words/appearance.ts:328-370`) takes those three fields from `configLooks` over the same node rather than reading them again; `NO_LOOK`'s three values come from `configLooks({})`. The C11 rows of G118 compare the server's class with the class the page sets for the same config read the page's way (the config through the page's own reader, then `applyTheme`), not with looks given as a literal, and one row gives a non-boolean `rice.monospace`.

2. **T2.** The C6 rows of `tests/server/root/hooks-server.test.ts` are tagged slow as the file's head comment says, or made to run under 100 ms each in a run of their own; either way the report quotes each row's time run alone.

3. **T3.** The comment at `src/lib/themes/tokens.css:18-20` says what is true now: the first HTML carries the start theme's class, and these three derived colours are set when the page's script draws.

4. **T4.** The doc comment at `src/lib/ui/theme/app-theme.ts:160-162` says that the first paint comes from the HTML the server sent and that the draw replaces the element it sent.

5. **T5.** `RequestStart` in `src/lib/server/machine/apps/routes/theme.ts` is made local.

6. **T7.** The report states what happens when a browser's user agent carries the word `oculus-desktop`, and when a placeholder name is unknown, as the review reads it.

7. **B1.** Settle the claim by reading, before writing it: the report states, with the lines read (`app.html:12`, `+layout.svelte`, `appearance.svelte.ts:121-160` and Svelte's flush of a mount's effects), whether any frame can paint mounted content before the derived tokens are set. A frame that can is fixed in this round, the server's HTML carrying the derived tokens for the start theme through the derivation `ui/theme/theme.ts` uses; a frame that cannot leaves no limitation in the report. The look at landing records what it sees either way.

8. **P2 and T6.** No work. After this round's last change the verify list runs once, and the report says how many times it ran.

## Paths this round writes

Every path of `agents/briefs/O39-partE.md`'s "Paths this step writes", and:

- `src/lib/state/shared/words/appearance.ts`
- `src/lib/themes/tokens.css`
- any file ruling 7 needs, named in the report
- `.scratch/migration/agents/reviews/O39-partE-report.md` (rewritten whole)

## Report

Rewrite `.scratch/migration/agents/reviews/O39-partE-report.md` whole: each ruling with DONE or NOT DONE, its diff and the check that shows it; for the changed C11 rows their run on the tree before this round's change and after; the C6 times; the verify lines.
