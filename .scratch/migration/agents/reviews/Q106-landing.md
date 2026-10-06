# Q106 landing

Position: roadmap entry oculus/migration (the cockpit-to-oculus migration); step Q106, Close pane on a pane of two or more tabs closes it after Confirm. Next: S3a's builder into the freed slot; Q107 refuted over its repair round and landed; X3d's fix routed by Z129.

## Open items (verbatim)

- Z129 (raised 2026-10-01 00:30, from X3d's diagnosis). The Graph's commit press hangs the page on main, not only with X3d: a commit row pressed in the Repositories view sends the renderer to 100% of a core, and a commit kept open in the saved state hangs the page again on reload (the TEST tab crashed at 00:14 and hung again on reload; a new tab loaded at 00:22 with no commit open). The cause and a proven fix are in X3d's Step 0 (`ui/tree/virtual.ts`, `VirtualRows.svelte`, one test). (a) The fix is the first item of X3d's rebuild, as the no-tiny-steps demand says, since X3d touches the Repositories view. For: no new step. Against: the hang stays on main, on Axel's page as well as TEST, until the whole X3d rebuild lands, hours away with its parity inventory. (b) A step of its own for the fix and its test, prepared now and landing within the hour; X3d's brief then leaves it out. For: the page stops hanging today. Against: one small step, which the no-tiny-steps demand rules out when a step covers the files. Recommendation: (b), since a hang on every commit press is a defect on main that no rebuild should wait for; it is Axel's, since it departs from his standing demand. The lazy option is (a).

## Not done

Nothing inside the brief. `bench: []`, so no A/B.

## The check of Steps 1

The runner's agent listing (ListAgents) showed two subagents running (X3d's diagnosis a960e7fd2f6310fd5 and Q107's builder a47f5dbf141e5a482) and none of Q106's builder ac7f6a74e4b8bc420 or reviewers a441a918298825101 and ab5a9d2b6860166ba.

## What landed

Main at c30a504f plus the step, cherry-picked from base e5824e1b with no conflict (`Auto-merging tools/oculus/DESIGN.md`, `Auto-merging tools/oculus/HELP.md`): `src/lib/ui/frame/quiet-focus.ts` (`focusIsFree`, `giveBackQuietly`), `src/lib/ui/frame/Modal.svelte` (the give-back in its cleanup), `src/lib/ui/tabs/Tabs.svelte`, `src/lib/shell/rail/ActivityRail.svelte` and `src/lib/shell/status/NoticeCentre.svelte` (each through `focusIsFree`), `src/lib/shell/keys/Palette.svelte` (`landOn` for a result, `:tab` and `:goto`), `vite.config.ts` (the `unit` and `client` projects), `tests/ui/frame/client-runtime.ts`, `tests/ui/frame/give-back.svelte.ts`, `tests/ui/frame/give-back.client.test.ts`, `README.md`, `HELP.md` lines 90 and 296, `DESIGN.md` lines 218 and 402, and the regenerated `docs/diagrams/layer-shell`, `layer-ui` and `layers`. `agents/spec.md` gains the Z113 (a) sentence on `*.client.test.ts`.

The landing script's own check ran from the repository root and failed there (`npm error enoent Could not read package.json`), since the verify list's commands run in `tools/oculus`; the list was then run from `tools/oculus` on main with the step staged.

## Verification on main

```
$ npm run diagrams          exit 0
$ sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md
 Test Files  352 passed | 20 skipped (372)
      Tests  5406 passed | 572 skipped (5978)
 Test Files  27 passed | 2 skipped (29)
      Tests  365 passed | 9 skipped (374)
1790806611802 COMPLETED 2480 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
checks: 7 commands passed
```

After the fix at landing: `npx prettier --check src/lib/shell/keys/Palette.svelte` prints "All matched files use Prettier code style!" and `npx eslint src/lib/shell/keys/Palette.svelte` prints nothing.

## Fixes at landing

1. The round 1 refutation's Standards finding: `Palette.svelte:167-168` said an editor action leaves the keyboard "where the give-back puts it"; the editor takes it when it runs the action. The comment and the report's row "Cmd+K then an editor action" now read "an editor action shows no tab; the editor takes the keyboard when it runs the action, and the give-back then finds it held."

## The look (TEST, localhost:8790, a new tab 812136282 in a new tab group, since the old TEST tab had crashed on the Graph hang of Z129)

- Case 19, a tab of another pane: with the keyboard in the middle pane, Cmd+K, "Status", Enter: the left pane's Status tab is the active tab, `document.activeElement` is its head (`BUTTON`, `role=tab`, `aria-selected=true`), no tooltip.
- Case 19, a new tab: Cmd+K, "Status", Enter opened the project "Which representation clusters?" as a new tab ECG-Repr, the keyboard on its head, no tooltip. On that first try the typed query had not settled before Enter; typed again with a 2 s wait, the View row was selected (`aria-selected=true` on "View Status") and Enter opened Status as above.
- Case 10, Cmd+K then Escape: the keyboard back on the Status head, no dialog, no tooltip.
- Case 10, Close pane on the middle pane (History, Slides, ECG-Repr): the question reads "Close this pane and the 3 tabs in it?"; Escape and Cancel each leave three panes, the keyboard on the pane menu's opener "Pane", no tooltip; Confirm leaves two panes, and after a reload the page still has two.
- Case 10, a pane of one tab: Pages split out to the right, then Close pane on that pane: it closed at once, no question.
- The split left the middle pane showing the Config view, and one screenshot was taken with it on screen (the view's head and the `appearance.yml` and `behavior.yml` cards; the `local.yml` card not on screen); the pane was switched to Settings before the next screenshot.

## Agents' usage

- Brief check: claude-opus-5-5, 228,851 tokens, 70 tool uses, 17.5 min.
- Diagnosis: `agents/reviews/Q106-diagnosis.md`, cause found: Modal gave focus back inside an effect teardown, where Svelte reads `$state` from before the flush, so the old tree was written back.
- Builder ac7f6a74e4b8bc420 (claude-sonnet-5-5): 187,039 tokens, 45 tool uses, 25.2 min; repair round 1, 207,319 tokens, 9 tool uses, 7.2 min.
- Reviewer a441a918298825101 (claude-opus-5-5): 209,569 tokens, 59 tool uses, 17.0 min; round 1 reviewer ab5a9d2b6860166ba (claude-opus-5-5): 206,031 tokens, 58 tool uses, 15.9 min.
- The builder's first report did not pass its bar (the first review's Spec, Proof, Standards and Behaviour findings, closed in one round); one fix at landing.
