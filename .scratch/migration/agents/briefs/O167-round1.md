# O167 round 1: the review's findings

Rules: `agents/spec.md`, `agents/guarded.md`, the step's brief `agents/briefs/O167.md` and its round-0 rulings `agents/briefs/O167-cases.md`, which stay in force except where this file says otherwise. The findings are those of `agents/reviews/O167-refuter.md`; each is numbered here with its ruling. Every ruling stays inside the step's part.

Nothing is written outside the worktree, the session scratchpad included: no case-run program, config, log or backup lives outside `.agents/worktrees/migration-O167`. This round needs no case-run program; every check is a test file under the worktree's `tests/` or a command quoted in the report.

## Rulings

1. **A removed record is forgotten when the snapshot no longer holds it** (refuter, Spec S3 and Standards T5 and Behaviour B3; brief item 6). In `src/lib/state/forms/settled.svelte.ts` a removal stands until a snapshot that does not hold the record has arrived, and no longer: the two-build count (`BUILDS_KEPT`) no longer decides it. A removal answered after such a snapshot already arrived is not held at all. `context.ts` passes the store what it needs to ask whether the snapshot holds a record's key; it is on the path list for this. In `src/lib/state/system/machine/schedules/schedule.svelte.ts` a removal ends when a schedules payload that no longer holds the entry arrives, decided when the payload arrives and never inside `rows()` or `none()`, which only read. A schedule saved again under that name by another window, after that payload, is shown. Test rows in `tests/state/forms/page-entry.test.ts` and `tests/state/system/schedule-lines.test.ts`: a delete answered before the snapshot without the record arrives hides the row until that snapshot and not after; a delete answered after it holds nothing; a record put back by another hand in the next snapshot is shown; a schedule removed, then saved under the same name by another hand, shows once the payload holding it arrives. Each new row is run on the step's current tree before the change and its failing output quoted.
2. **Emptying a choice, path, file or folder row whose option takes the empty value** (refuter, Spec S4, Proof P3 and Behaviour B1; brief item 12, whose premise "a choice is refused silently" is corrected: on the base a choice and a path, file or folder box whose option carries `empty:` write `''`, `fields.ts:757-758`). In `commitValue` (`src/lib/state/system/config/editors/fields.ts`) the `unset` answer applies only when the empty text is not a value of the control (`emptyIsValue(spec)` false); a row whose option carries `empty:` writes `''` as on the base, whether or not the scope's file holds the key. The C12 table of `tests/state/system/settings/row-writer.test.ts` gains rows for a choice and a path whose entry carries `empty:`, with `own` false and true, each holding `{ value: '' }`; they are run on the step's current tree before the change and their failing output quoted. The report's before/after row for item 12 names every control kind, the `empty:` kinds among them.
3. **The card title never moves under the pointer** (refuter, Standards T4 and Behaviour B2; brief item 14). The room a card keeps on its title is set from the card's first draw, before any hover, so the title's words do not rewrap and the card does not change height when the pointer first comes onto it, and the head comments of `Card.svelte` and `CardActions.svelte` are true as written. The room is the width the controls take over the title, measured without drawing them visibly at rest. The report names the view and the state the look checks (a Career card with a long title, the first hover).
4. **The shared fallbacks** (refuter, Standards T1 and T2). `ANY_ROOM` in `src/lib/state/workbench/layout/open/landing.ts` is frozen, and `refusedFields` in `src/lib/state/workbench/ui.svelte.ts` hands a new empty set per read for an instance with no refused field.
5. **The rule form's scroll reads no other component's markup** (refuter, Standards T3; brief item 18). `RuleForm.svelte` no longer queries GroupHead's `section` and `h3` or repeats its 8 px: it reads the room the strip covers from a custom property GroupHead sets on its body (the existing `--group-strip`, plus the strip's own gap published the same way), or uses `scroll-margin-top` on the form and its labels from that property with `scrollIntoView({ block: 'nearest' })`. Either way the words stand under the strip as item 18 says, and GroupHead's head comment names the property and who reads it.
6. **The report names every path and the key of the widths** (refuter, Spec S5 and S7). The report's "Paths written outside" names `src/lib/state/workbench/layout.svelte.ts` (the `measurePane` lines) and says the widths are keyed by the page's id and the pane's path, since a pane has no id (`model.ts:62-72`), where ruling 6 said a pane id. The moves to `src/lib/state/sources/fs-parts/` and `src/lib/ui/frame/card/` are accepted: both folders hold ten items.
7. **The report's claims are the runs' output** (refuter, Proof P1 and P2). Item 10's row quotes what the catalog grep prints (44 lines, labels and the `settings_origin_*` fragments) and says none of the item's messages is among them. Each passing run on the unchanged tree the report states (row 'is said until it is withdrawn', nested-names rows 1 and 3, the C12 rows with a key held) is quoted with its output lines, or the sentence is removed.
8. **The programs that edited files** (refuter, Spec S2; the standing ruling "Unapproved builder scripts"). The report lists every command of this step, first build and this round, that changed a file by a program (`sed -i`, an inline `python3` or `node`, `perl`, `awk`, a shell redirect), each with the files it changed. This round changes files with the Edit and Write tools only.

Item 13 (refuter, Spec S1) is not in this round. On main's code (the gate at e93fe50e3's tree), on a scratch server, a staged Text size change with the focus on its row's More actions button and Cmd+S dispatched there was saved: the scope line read "Saved into .oculus/workspaces/research-hub.yml." and "No unsaved change". The browser half of the symptom does not reproduce; the look at landing checks it again, with the desktop app. Its report row stays as it is.

The extra verify runs of the first build (refuter, Spec S6) need no change. The red lines in files the step does not change (refuter, Proof P4) are run again at landing. `agents/guarded.md:363` (refuter, Standards T6) is fixed at landing. One run of the verify list after this round's last change.

## Paths this round writes, beyond the brief's list

- `src/lib/state/client/context.ts`
- `src/lib/state/forms/settled.svelte.ts`
- `src/lib/state/system/machine/schedules/schedule.svelte.ts`
- `src/lib/state/system/config/editors/fields.ts`
- `src/lib/ui/frame/card/Card.svelte`
- `src/lib/views/shared/card/record/CardActions.svelte`
- `src/lib/state/workbench/layout/open/landing.ts`
- `src/lib/state/workbench/ui.svelte.ts`
- `src/lib/views/academic/present/arrange/RuleForm.svelte`
- `src/lib/ui/controls/heads/GroupHead.svelte`
- `tests/state/forms/page-entry.test.ts` (the settled store's rows), `tests/state/system/schedule-lines.test.ts` (the schedules store's rows) and `tests/state/system/settings/row-writer.test.ts`

The brief's own list and the round-0 rulings' paths stay.

## Cases after the round

- C6 again, with ruling 1's rows.
- C12 again, with ruling 2's rows.
- C14 again: by reading, and the look at landing (ruling 3).
- C18 again: by reading, and the look at landing (ruling 5).
- Every other case keeps its result; the report says which it ran again.

## Verify

From the worktree root: `npm run diagrams` and `npm run docs:palette`, then `npm run test:quick` prints "every command passed", or each red line in a file the step does not change is run again alone and its passing output quoted; the ASCII gate over every changed file; `sh utils/unused-exports.sh` against `.agents/worktrees/O167-base/unused-exports.txt` adds no line; `node utils/outside-paths.mjs .scratch/migration/agents/briefs/O167.md 2d28fe2ac` prints only the brief's paths, the round-0 rulings' and this round's.

## Report

Append a section "Round 1" to `.scratch/migration/agents/reviews/O167-report.md` in the worktree's copy of the ledger: the first line (anything NOT done, or "Everything in the round is done"), each ruling above by number with what changed (file:line) and the check that shows it, the new rows' failing output before the change and passing output after, the verify lines as printed, and the files with line counts.
