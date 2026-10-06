# Step Q101 refuter report (reviewer a1c2f1a2de69bc190, on .agents/worktrees/Q101, base a6f61d7e)

## Verification

`uptime` before: `1:12 up 3 days, 3:18, load averages: 7.40 8.56 9.46`; after: `1:14 ..., load averages: 12.94 10.33 10.03`.

`checks.sh .../orchestrator-state.md` from the worktree's tools/oculus:

```
 FAIL  tests/checks/source/comment-width.test.ts > ... ends by the hundredth column ...
+   "src/lib/views/personal/calendar/Calendar.svelte:355",
+   "tests/views/whole/tinted.test.ts:13",
+   "tests/views/whole/tinted.test.ts:44",
 FAIL  tests/views/whole/type-scale.test.ts > the view type scale > sets every local role in personal/calendar/Calendar.svelte
 Test Files  2 failed | 346 passed (348)
      Tests  2 failed | 5600 passed | 1 skipped (5603)
checks: failed with exit 1: npm test
```

Both are the defects fixed on main at 414d27fa; Q101 changes neither file, and its `type-scale.test.ts` change is the Terminal and TerminalGrid lines only. The rest of the list by hand: `npm run check` `COMPLETED 1486 FILES 0 ERRORS`, build, format, lint and the ASCII check exit 0. The report's greps, line counts, `folder-check.sh`, `npm run diagrams` and the step's 8 test files (`Tests 237 passed`) reproduce. Reverts R1 to R6 and R9 to R16 turn their tests red; R7 and R8 stay green (Proof 1 and 2). The reviewer ran one `git -C . diff`, read-only, outside the allowed set.

## 1. Spec

1. `state/workbench/layout.svelte.ts:91-93, :253-262, :631-632` (`pageViewState`, `setPageViewState`) and `layout/model.ts:69-72` (`views?:`), with `layout/saved/saved.ts:307-308`, are the removed page-wide order's store and saved field; nothing in `src` reads them, only `tests/state/workbench/layout/pages.test.ts:630-706`.
2. `shell/keys/workbench-keys.svelte.ts:173-184` (`newSession`) writes the store's `composeIn` rule a second time, fed by the re-export block `terminals.svelte.ts:91-93`.
3. The report's file table lists `tests/checks/config/config-folder.test.ts` as changed; the diff does not touch it.

## 2. Proof

1. Revert R8 (`'terminal'` back in `SESSION_VIEWS`, `CardSessions.svelte:27-33`) leaves every test green; the ruled change has no test.
2. Revert R7 (`terminals.svelte.ts:343`, the selected terminal held) leaves every test green.
3. R2 turns one case red, not "the cases" the report names.
4. `TerminalRows.svelte` is 197 lines at the base, not 192.
5. The report's "before" of a tab's last terminal ending is incomplete: at the base a following tab closed only when the selection still showed that terminal, a terminal selection was cleared and a session selection kept, and a composer tab New had put there stayed with its typed text.

## 3. Standards

1. `views/sessions/terminal/Composer.svelte:5` ("draws it while a tab has no terminal") and `:9-11` ("A tab opened by a terminal's Split") are false after the diff.
2. `state/workbench/layout/model.ts:69` "(the Terminal view's row order)" is false.
3. `state/sessions/folds.ts:245-247` (`TerminalChoice` "the id a press selects", `created` "orders the list") is false.
4. History in two test texts: the title `'draws the composer in a tab saved by New before tabs owned their terminals'` in `tests/views/sessions/sessions.test.ts`, and the comment `// the saved pin now reads as ownership, which has no control of its own`.

## 4. Behaviour

1. A composer New showed alone in a tab, with typed text, closes with the tab when the tab's last terminal ends or is dragged away; at the base it stayed. Not stated in the report.
2. Pressing a session on a project card while the page's only session view is a Terminal tab now opens a `session-detail` tab; at the base it opened nothing. Not stated.
3. The Repositories view's shell lands in the page's Terminal tab instead of a tab of its own. Not stated.
4. After a Split, the tab's composer record keeps `split` and the row's folder and kind, so a later New in that tab opens in the split row's folder. Not stated.

## Not checked

- Anything needing a DOM (drags between tabs, the Sash, focus in a split half, the xterm remount); the look covers these.
- The report's "ownership filter" revert, which would need an invented filter.
- The builder's `git.test.ts` timeout, which did not recur.

Reviewer usage: 65 tool uses, 242k tokens, 15 min (from the completion notice).

## Repair round 1, refuted (reviewer a2ac385aa42417d1e, round delta `git diff 55bea404`)

### Verification

`checks.sh` from the worktree's tools/oculus: `Test Files  3 failed | 345 passed (348)`, `Tests  3 failed | 5603 passed | 1 skipped (5607)`, `checks: failed with exit 1: npm test`. The three: comment-width (`Calendar.svelte:355`, `tinted.test.ts:13`, `:44`) and type-scale's Calendar entry, both fixed on main in 414d27fa, and `tests/checks/tree/scratch.test.ts`, failing on a stray `$TMPDIR/out.txt` no step wrote. Run one by one after it, each exit 0: `npm run check` (`COMPLETED 1486 FILES 0 ERRORS 0 WARNINGS`), `npm run build`, `npm run format:check`, `npm run lint`, `! LC_ALL=C grep -rna '[^ -~]' src tests`. The round's 10 test files: `Test Files 10 passed (10)`, `Tests 269 passed (269)`. The grep of the removed names prints nothing. R1 to R9 judged by reading: each red but R6, which only an audit catches. The round's item 5 premise was wrong: the first message clears a selected terminal it does not list (`terminals.svelte.ts:343-346`, `:198-208`); the builder's test asserts what the code does.

### 1. Spec

1. `views/sessions/terminal/Terminal.svelte:128-135` `composeHere` writes New's rule a second time beside the store's `composeIn` (`terminals.svelte.ts:426-437`); round item 2 exists to give New one copy.

### 2. Proof

1. `tests/views/sessions/sessions.test.ts:359-363`: the bar's New has only a source-text audit.
2. The report's R6 run quotes a source that carries the 55bea404 head comment, so it is not a run of the named revert alone.
3. The report's "before" line counts for `folds.ts` (282, base 303), `folds.test.ts` (352, base 374), `layout/model.ts` (163, base 168), `saved/saved.ts` (447, base 445), `type-scale.test.ts` (348, base 347) are not the base's.

### 3. Standards

1. `DESIGN.md:208` still describes the saved `views` field, read back only under a registered view id; round item 1 removed it.
2. Made false by round item 4 (`freshComposer`): `state/sessions/terminal/composer.ts:7-8` ("a tab's next composer opens on what its last start used"), `views/sessions/terminal/Composer.svelte:8-9` ("What each picker last chose ... so the tab's next composer opens on it") and `Composer.svelte:190` ("What the start used seeds the tab's next composer"), true now of the accounts and picks only.

### 4. Behaviour

none

### Not checked

`npm run diagrams` (it writes; three counts sampled); R1 to R9 by run; anything needing a DOM (the look covers it).

Reviewer usage: 36 tool uses, 179k tokens, 9 min (from the completion notice).

## Closed

The round was the step's last (`repair_rounds: 1`); each finding of the round's review is small and inside the brief, and is fixed on main at landing:
- Spec 1 and Proof 1: the bar's New calls the terminals store's rule for its own tab, so New has one copy, and the store's case covers it.
- Proof 2 and 3: corrected in the landing booking (R6 judged by reading; the base line counts from `git diff a6f61d7e --numstat`).
- Standards 1: `DESIGN.md:208` rewritten to the saved arrangement without `views`.
- Standards 2: the three sentences reworded to what a start keeps (the accounts and picks) and what New and Split set (the folder and kind).
