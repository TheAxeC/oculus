# L7 repair round 1 (sent 2026-09-28)

The round starts at the worktree commit `fa6b3a97` (the step's work as you left it, committed by the orchestrator). The findings are those of `agents/reviews/L7-refuter.md`, plus Axel's ruling on open item Z18. Every item below is a known change: nothing here asks you to find a cause, reproduce a fault or measure. You work in `/Users/axelfaes/workspace/research-hub/.agents/worktrees/L7` and nowhere else, run no git command, and write nothing under `.scratch/`. The rules file (`tools/oculus/.scratch/migration/agents/spec.md`) and the brief (`agents/briefs/L7.md`) still hold: no browser test, nothing under `tests/browser/` changed, and no `// revert:` line; one unit case per fix; strings in `config/text`; ASCII only; a comment says what and why, never history.

## Change

1. **Z18, ruled by Axel: a Help group.** Help, Memories, Research approach, Agent approach and HPC how-to form their own catalogue group, key `help`, labelled `Help`, chord `h` (nothing in `src/lib` or `config` binds `h`). It is a group that is no page: it adds no rail button and no arrangement, and its entries stay where the System page's arrangement puts them (`config/layout.yml`, arrangement `info`, unchanged). The System group (`info`) keeps Status, Findings, Audit, History, Config and Gallery. So `help` and `memories` register `group: 'help'`, and the three `docs:` entries take `group: help`. The catalogue draws the group with the `h` chord; its heading glyph is a name already in `config/catalogs/glyphs.yml`, carried by no view of the group. HELP.md's key table gets the `h1`-`h5` row and the System row reads `y1`-`y6`. Every entry of every group now has a key.
2. **The test that asserts the keyless entries.** `tests/views/system/workbench/catalogue.test.ts:63-71` asserts that the last two System entries carry no key. Replace it with a case that every entry of every catalogue group carries a key, and that the System group draws `y1` to `y6` and the Help group `h1` to `h5`. Update the group list in `tests/state/workbench/navigation/catalogue.test.ts` (about `:315`) to match.
3. **A reset asks about each unsaved tab.** Brief item 6: a tab holding unsaved text on a page being reset is asked about as closing it would be. `state/workbench/navigation/pages.ts:126-149` (`resetAsk`) folds this into one line, `workbench.reset_unsaved`, in the reset confirm. Make the reset (per page and Reset all) ask each such tab the same question closing that tab asks (`ui.tab_close_dirty`, through the function the tab close uses), one tab at a time, after the reset confirm; a cancel on any of them ends the reset with nothing changed. Remove `workbench.reset_unsaved` from the text catalog. Unit cases: two unsaved tabs are each asked; a cancel on the second leaves every page as it was.
4. **The Leads-to-Applications flow gets its cases.** `toApplication` and `prefill` in `src/lib/views/feeds/leads/Leads.svelte:113-156`, and `leadAdd` with the clearing of `lead` in `src/lib/views/boards/collection/Collection.svelte:144-152`, are state work inside components. Move them into a state module beside the leads state (the components call it), and cover them with unit cases:
   - the prefill clears the form drafts, sets each field by its schema kind, sets `adding`, and names the lead;
   - an add write that answers with the entry written writes the lead's `status` `applied` and clears `lead`;
   - a refused write, and a cancel, write nothing to the lead.
5. **Comments made false.**
   - `tests/state/workbench/navigation/rail.test.ts:6-7`: delete "and its revert names the line that makes it red".
   - `src/lib/shell/Workbench.svelte:84-86`: the direct chord no longer counts "the catalogue's small groups". Say what it counts now: the views no group holds.
   - `tests/views/whole/type-scale.test.ts:338-339`: delete the reference to `bin/revert-check/revert-check.mjs`, which Q93 removes.
6. **Kept as you built them, no change:** the landing order of your judgment call 1 (its steps 2 and 4 are inside the brief's rule), the prefill in the form drafts (judgment call 2), and the other judgment calls.

## Report corrections

- `tests/state/workbench/layout/open/landing.test.ts` has 14 cases, not 13.
- 159 `// revert:` lines were deleted, over 15 files, not 227 over 20.
- The before and after, for the look, also states:
  - a page already saved in the browser keeps its layout until its Reset or Reset all is pressed, so a browser with saved pages sees the table only after a reset;
  - an applied lead no longer offers decline;
  - declined leads are hidden by default, behind the toggle;
  - `applied` is shown on declined and expired leads too, and saving its form sets them `applied`.

## Verify, once, at the end of the round

While you work, run only the unit files your change touches. At the end, once, from `/Users/axelfaes/workspace/research-hub/.agents/worktrees/L7/tools/oculus`:

```
sh /Users/axelfaes/.claude-work/skills/land/templates/verify.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md
```

It must end with `verify: 6 commands passed`. Quote the lines it prints. Also: `grep -rn -E '^[[:space:]]*// revert:'` over every file this step changes or adds prints nothing; `diff -r /Users/axelfaes/workspace/research-hub/.agents/worktrees/L7-base/tools/oculus/tests/browser tests/browser` prints nothing; `sh bin/size-check.sh` and `sh bin/folder-check.sh` exit 0; `npm run diagrams` run twice changes nothing the second time.

## Report

Return it as your final message. First line: anything NOT done, or "Everything in the round is done". Then one row per item above (DONE / NOT DONE, the file and line, the command that proves it), then the verify lines verbatim.
