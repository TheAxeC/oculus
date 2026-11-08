# O168 landing

Position: the oculus migration, step O168 (the boards and record lists drawn whole) landed. Next: send O151's repair round 1, then land O167 with G152 and its wiring row, then /spec O170.

Open items: none.

## Check of Steps 1

The builder a677fb3bffc90a54b and the reviewers ab8d40d30b37bea8a and a672d6d9bb5e4fe47 had ended before the landing; the runner's agent listing shows no subagent running.

## Not done

Nothing. Every state the brief and the reviews owe to the look was looked at.

## What landed

The whole range from base abebbb552 (the builder's work under the round-0 rulings and repair round 1, one wip commit e6999efac) with the fixes at landing, 172 paths counted without renames, 5250 insertions and 4534 deletions:

- List mode draws a group's column header once above its first row, and every scroller with a stuck section heading sets `--pane-pad-top` to its own top padding, so no row shows above the heading.
- New project on a second hub's board starts at that hub's `new_project_dir`.
- The Funding list drops a column empty in every row before it cuts the Title, and its headers share one casing.
- The record page's count row draws the Pillars strip's pills.
- One plural mechanism: the CLDR forms as YAML maps, read by one helper through `Intl.PluralRules`, in each category's `label:` and every former `_one` pair (ruling 716 (a)).
- People, Tasks and entry pages draw the project page's layout.
- A Markdown field keeps text in angle brackets; a tag the sanitiser drops is shown as text (before: drawn as the element; after: shown escaped, `src/lib/ui/html.ts:560-575`); a grep of the hub's data files for `<kbd>`, `<u>`, `<mark>`, `<s>`, `<q>`, `<cite>`, `<abbr>` and `<scp>` printed nothing.
- A failed fetch's toast and status line give ssh's cause.
- The compile database and launch configuration forms name the separator as "commas".
- The `source.test.ts` row settles on the whole answer.

Fixes at landing:

- Spec 1 of the review over round 1: `--pane-pad-top: 12px` on the `.tray` of `src/lib/shell/rail/UpdateTray.svelte`.
- Standards 1: one sentence in the head comments of `GroupHead.svelte`, `Pane.svelte` and `Table.svelte` saying that a scroller of its own sets `--pane-pad-top`.
- Proof 1: the report's round-0 lines marked superseded by its "Round 1".
- Ruling 726 (b): `fittedColumns` (`src/lib/ui/display/table/table-rows.ts`) takes `wanted`, the width the Title's longest text needs, and drops a column empty in every row, rightmost first, while the Title's share is narrower than that; `EntryList.svelte` measures its titles in the table's font. The case program run on the staged tree before the fix gave at 564 px Supervisors kept and the Title 173.5 px (fail); after it, 420 px Title 197.6, 564 px Supervisors dropped and Title 209.9, 1200 px every column kept and Title 369.2.

Accepted at landing: Spec 2 (the Catalogue scrolled, looked at); S4 of the first review (three paths outside the list, each inside a ruling); no workspace file holds an `audit_ignore:` list, so the renamed audit keys strand no stored mute.

## Verification

In the gate worktree with the range and the fixes, `npm run diagrams && npm run docs:palette && npm run test:quick` (`.agents/worktrees/gate-O168-2.log`, after the 726 fix): "172 changed file(s)", "310 test file(s)"; ok ASCII gate, ok prettier, ok svelte-kit sync, ok eslint, "ok svelte-check ... 589 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS", ok vitest checks. vitest failed 6 rows and vitest slow 2, each a timeout (20000 ms or 5000 ms) under a load of about 10 to 12, in `zenodo.test.ts`, `cpp.test.ts`, `manifests.test.ts`, `hub-portfolio.test.ts` and `self.test.ts`; run alone those files passed 92 of 92 and 33 of 33 at a load of 9.5.

The same range on main with the fixed files copied from the gate; `cmp` of the two `git diff --cached --binary --no-renames` printed SAME, 172 paths. The verify list equals the page's commands. No A/B: the configuration names no `bench:`.

## The look

On the scratch server on 8797 from the gate (scratch HOME, fake ssh):

- Settings, Keys, the Catalogue, the Projects board in cards and in list mode, and Focus draw their stuck headings at 0 px from the scroller's top with no row above; the Update tray's at 1 px, its border.
- The Funding list draws its one header row once above its first row, headers "Title", "Status", "Lead", "Collaborators". At 420 px both near-empty columns are dropped and the Title is 185 px; at 542 px Title 202, Status, Lead, Collaborators 113, Supervisors dropped.
- The ZonMw record page's count pills match the Pillars strip, which reads "1 publication", "1 released", "1 other output". The University of Twente page draws its pills, and the Resources cards read "1 publication" and "1 idea".
- The MSc supervision entry, a task and a person draw labelled fields; the person's counts read "1 idea", "1 publication", "1 other output".
- The UTwente HPC card reads `/local/<jobid>`, Local data `~/data/<dataset>`.
- A failed fetch shows ssh's cause.
- The compile database form reads "A list holds its parts split by commas", its placeholder "parts, split by commas"; the launch configuration form reads "A list holds its parts and a map its key=value entries, each split by commas.".

Pressing the Debug pane's Add Configuration wrote a new `.oculus/launch.yml` in the scratch copy; it was read and removed, and the copy's `git status` shows nothing under `.oculus`. Every form was cancelled; the copy's remote setting and last-fetch record were restored and compared with `cmp`.

## Found

Raised at the look and ruled: open item 726 (b), fixed above; open item 727 (a), a refused git action's toast names the action, folded into O170. O168 lands before O167: the paths the two share are in O167's dispatch entry and take the hand merge at its landing.

## Agents

The builder's first report did not pass its bar (repair round 1, `agents/briefs/O168-round1.md`); every first-review finding closed in the round or at landing.

- Builder a677fb3bffc90a54b, claude-opus-5-5: first run 276645 tokens, 90 tool uses, 16.3 min; build under the round-0 rulings 372946 tokens, 977 tool uses, 151.3 min; round 1 302412 tokens, 1212 tool uses, 231.2 min.
- Brief check ac49bd723d867d915, claude-opus-5-5: 271802 tokens, 112 tool uses, 14.5 min.
- Reviewer ab8d40d30b37bea8a, claude-opus-5-5: 342934 tokens, 104 tool uses, 18.3 min.
- Reviewer over round 1 a672d6d9bb5e4fe47, claude-opus-5-5: 262459 tokens, 82 tool uses, 22.2 min.

## Next

Send O151's repair round 1 to its builder; land O167 with G152 and its wiring row (ruling 721) and the hand merge of the shared paths; /spec O170 once O167 has landed.
