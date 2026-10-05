# E4, repair round 2 (the plan's extra round)

The review over round 1 is the section "Repair round 1, refuted" of `agents/reviews/E4-refuter.md` (main checkout ledger); read it whole first. This round exists for one acceptance item too large for landing (Z599); the review's other findings are small and go in the same round so the run over it reviews them together. Your brief `agents/briefs/E4.md`, the round 1 brief `agents/briefs/E4-round1.md` and `agents/spec.md` still hold in full. Line numbers are the reviewer's; check each with `grep -n` before you change it.

Never use breakage testing of any kind: no mutation, no revert or removal of code to watch a test fail, no injected fault, no scratch copy with a block removed. A test is judged by reading it. You run no git command, read-only ones included (`git status` and `git diff` too). Never start an app window on Axel's screen or take focus: use the scratch oculus and headless Chrome on a scratch profile, as in round 1.

## Items

1. **Z599, an app opening an outside address.** `open` gains the target `{ url }`: an `http:` or `https:` address, at most 2048 characters, with no user name or password in it; any other value rejects with the existing `bad_target` word (or the word the section uses for a target it refuses; name it in the report). The page asks the reader with the app's Confirm, which shows the app's title and the whole address on its own line, before it opens the address as a browser tab with `noopener` and `noreferrer`; a no rejects `declined`. The rate limit of `open` counts it. `oculus.js` listens for a press on a link (`a[href]`) whose address is outside the app's own address and sends it through `open({ url })` instead of letting the frame navigate, so a link no longer kills the frame; any other navigation keeps `apps.load_failed` with Reload. The paths widen to `src/lib/server/machine/apps/oculus.js`, `methods.ts`, `apps.svelte.ts`, the Confirm's words in `config/views/apps/apps.yml` and `HELP.md`'s apps section. DESIGN.md's apps section (:327 and :337) states the target, the Confirm and that an app's address may carry what the app read, which is why the reader sees it whole. The methods table gains one row per outcome (accepted after a yes, declined, a refused scheme, an address with a password, over the length); the run in the report: a manual's outside link pressed in a scratch app, the Confirm's text, the tab opened after a yes, the frame's in-memory mark unchanged.
2. **Z593.** `color-scheme: dark` on the 13 dark theme classes of `src/lib/themes/themes.css` the review lists (`body.dark` :11 to `body.tokyoneon` :725); the light ones get none. The report quotes `getComputedStyle(document.body).colorScheme` in one dark and one light theme on the scratch oculus, and the frame's value after a theme change while the app stays mounted (C101).
3. **Z594.** A press inside a frame makes its pane active: an `onblur` on the `<svelte:window>` at `Workbench.svelte:299-303`, its handler in `shell/keys/workbench-keys.svelte.ts` beside `paneFocused`, dispatches a bubbling `focusin` on the frame's slot when `document.activeElement` is an `iframe[data-frame-of]`. The run: two panes, a press in the app frame of the inactive one, the active pane before and after.
4. **S1, E4.md item 3.** `+page.svelte` gains the second effect: it reads `data.apps` and, inside `untrack`, seeds and registers again, beside the token's effect, as DESIGN.md:278 says.
5. **S2.** DESIGN.md:335 cites the frame's sandbox at its place in `FrameLayer.svelte`, and :337 cites `svelte:window` at its line in `Workbench.svelte`.
6. **Z601.** The app-store table's title is 'answers a held row's store, and 400 or 404 for every other request'.
7. **Z600, the tables.** Each named table keeps every row that gives a different outcome of its unit, and drops a row that repeats an outcome another row already gives. The report lists, per table, each row dropped and why.
8. **P1, M4.** The frame-side measurement is settled by the net log (`URL_REQUEST` 0, request headers sent 0); state that in the report beside the probe's record, and do not rerun it.

## Verify before you report

The brief's list, once, after the last change: from the worktree's `tools/oculus`, `bash ~/.claude-work/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md`, the lines quoted; then `npm run test:checks` and `npm run diagrams`. While working, run only the test files you changed.

## Report

Append "# Repair round 2" to your report in the worktree's ledger copy: one row per item, DONE or NOT DONE with its command or run, NOT DONE first; the runs; the table rows dropped; every test title changed; the verify lines.
