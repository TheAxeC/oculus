# O86 round 1: the review's findings

Rules: `agents/spec.md`, `agents/guarded.md` and the step's brief `agents/briefs/O86.md`, which stay in force except where this file says otherwise. The review is `agents/reviews/O86-refuter.md`. This round is built on the worktree as it stands. Ruling 466 (a) approves your two scratch case programs (`scratchpad/cases/first.case.ts` and `final.case.ts`) as programs that compute facts: you may extend `final.case.ts` with the cases of this round and run it, and its output counts as their run. You write no other script.

## What to change

1. **A hub's own snapshot carries `RawFeeds` (review Spec 1).** Item 6 of the brief holds as written: `sources/documents/feeds.ts`, `data/index.ts` and the `feeds` of `normalise.ts` read and give `RawFeeds`, and only the merged snapshot's summary is `Feeds` with `byHub`. A hub's own snapshot (`HubPart.snapshot` in `src/lib/data/snapshot/hubs/merge.ts:46`, the snapshot one hub's build gives) has no `byHub` field at all, so a reader that reaches for `byHub` on a hub's own snapshot does not type-check. Build this with the types: the snapshot a hub's build gives and the merged snapshot differ in their `entities.feeds`, and `feedsOf` reads `RawFeeds` from each part. The path list widens to every file the type change reaches; name each in the report. `byHub: []` in `normalise.ts` goes.

2. **The inbox notice names no hub (review Behaviour 1).** The inbox's date is the machine's one triage date, so its notice reads with the inbox task's label alone (`app.tasks.inbox_label`, as the refresh line `refresh_inbox_plain` names it), whichever hubs hold `inbox.md` and however many; it is posted while at least one hub offers the inbox task. Before: with A and B holding `inbox.md`, "Inbox (A) ran and has new results.". After: "Inbox ran and has new results.".

3. **A hub seen for the first time posts no notice (review Behaviour 2).** In `notice-sources.ts`, the first run dates the portfolio channel carries for a task of one hub (a `[task, hub]` pair never seen before since the page loaded) are remembered and post nothing, exactly as the channel's first reading does today; a later new date of that pair posts. This holds whichever of the `schedule` and `portfolio` messages arrives first, and for a hub added to the workspace or renamed while the page is open. Before: hub C added while the page is open, holding `litwatch.md` with a radar last run of 2026-08-01, posts "Lit Watch (C) ran and has new results." with no run. After: it posts nothing until C's radar date changes.

4. **A save keeps a `hub:` the entry names (review Behaviour 3).** This replaces the save rule of the brief's item 5 for one case. A task entry whose `runs` names a `hub` in the file keeps `hub` on every save from the dialog, the primary's name included; an entry whose `runs` names no `hub` and is saved with the primary's pair still writes no `hub`; a pair of another hub writes `hub`. Before: `runs: { task: litwatch, hub: A }` with A the primary, saved with a new time, becomes `runs: { task: litwatch }`. After: it stays `runs: { task: litwatch, hub: A }`. The dialog's draft carries whether the entry as read named a hub; `rawOf` writes by that.

5. **The report (review Proof 1, Proof 2, Proof 3).**
   - The G35 row 'a task whose root is no text' is a proof by reading: on the unchanged tree the table's world refused every task body with `bad-terminal` for another cause, so its failure there cannot be shown; with the `typeof root !== 'string'` check gone, `namedHub` would answer `hub-unknown` naming 3 and the row would fail. The report says this and stops calling the row an audit.
   - The character-set check is run in the form `agents/spec.md` gives over every changed file, and that run is quoted in place of the `perl ... $(git diff --name-only)` line.
   - The sentence "`grep -n -i "sentence length\|list item"` ... finds none" is corrected to what the grep prints (`CLAUDE.md:48`, the no-hard-wrap rule) and what follows from it.
   - Every behaviour this round changes is stated in "Host- and user-visible changes" with its before and after.

## Cases of this round

- R1. `npm run check` reports 0 errors, and a line that reads `.byHub` on a hub's own snapshot (`part.snapshot.entities.feeds.byHub` inside `feedsOf`) would not type-check; checked by reading the types, quoted in the report. `grep -n "byHub" src/lib/data/snapshot/normalise.ts` prints nothing.
- R2. Hubs A (primary) and B both hold `inbox.md`; the inbox date changes after the first reading: one notice, "Inbox ran and has new results.". With only B holding `inbox.md`: the same words. With no hub holding it: no notice.
- R3. A page that has read the portfolio once; hub C (holding `litwatch.md`, radar last run 2026-08-01) is added, the `schedule` message first, then the `portfolio` message: no notice. The same with the `portfolio` message first, then `schedule`: no notice. Then C's radar date becomes 2026-10-26: one notice, "Lit Watch (C) ran and has new results." (or "Lit Watch" when C is the only hub offering litwatch).
- R4. Hub B renamed to D while the page is open, its dates unchanged: no notice.
- R5. An entry `runs: { task: litwatch, hub: A }`, A the primary, opened in the dialog and saved with a new `when`: the file keeps `runs: { task: litwatch, hub: A }`. An entry `runs: { task: litwatch }` saved with a new `when`: the file keeps `runs: { task: litwatch }`. An entry `runs: { task: litwatch }` saved with the pair of B: `runs: { task: litwatch, hub: B }`. An entry `runs: { task: litwatch, hub: B }` saved with the primary's pair A: `runs: { task: litwatch, hub: A }`.
- R6. Every case of the brief's "Cases" still gives its expected result: the whole `final.case.ts` and the brief's tests run again after the change.

A case is a test only where the rules file's test rule calls for one; otherwise it is a run the report quotes. Each new or changed test is named in the report with its entry and its failing run on the tree before this round's change.

## Verify before you report

The brief's "Verify before you report" checks again, from the worktree root, over every file the step changes. The plan's whole verify list runs once, at landing on main.

## Paths this round writes

The brief's paths, and:
- every file the type change of item 1 reaches (each named in the report)
- `src/lib/state/workbench/navigation/notice-sources.ts`
- `src/lib/state/system/machine/schedules/schedule.svelte.ts`
- the tests of the notices and of the schedule store that the rules file's test rule calls for
- `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/cases/final.case.ts` and its output file
- `.scratch/migration/agents/reviews/O86-report.md` (the report, rewritten whole with this round in it)

## The report

The whole report again, with a section "Round 1" that gives, per numbered item above, what changed (file and line) and the run or reading that shows it, and each case R1 to R6 with its run before this round's change and after.
