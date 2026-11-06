# O164, repair round 1

The review (`agents/reviews/O164-refuter.md`) found one thing, Standards 1: the box a plain press sits in (a transparent 1 px frame with the small radius, the chip surface under the pointer) is written five times, `.crosslink` in `CardLinks.svelte:297-309`, `CardDetails.svelte:180-192` and `ProjectCard.svelte:446-458`, and `.press` in `CardFacts.svelte:161-172` and `LaneCard.svelte:324-334`, and the copies already differ (`LaneCard.svelte` has no `max-width: 100%` and no `text-align: left`, `CardFacts.svelte` no `text-align: left`). The rules file's principles say a rule exists once and is reused. This round makes it one.

1. **One press box.** Add one component under `src/lib/views/shared/card/` (the folder holds `card.ts` and the `project/` folder; `project/` holds 7 items, so the new file may go in either, the ten-item rule kept) that draws the box around its children: `display: inline-flex; align-items: center; min-width: 0; max-width: 100%; border: 1px solid transparent; border-radius: var(--radius-sm); text-align: left;` and `background: var(--chip)` on hover, with a head comment saying what it draws and who uses it, and a way for a caller to add its own class or width (the lane card's venue keeps its 14em cut, `LaneCard.svelte` `.cut`). Every one of the five places draws its press through it, and the five copies of the rule are removed. A caller that needs no `max-width: 100%` or `text-align: left` today gets them from the one rule; say in the report, per place, whether that changes what is drawn (a lane card's venue inside its 14em `.cut` box, a compute fact on the top row) and why it does not, or what changes.
2. **The comments.** The head comments and style comments of the five files that named their own box now point at the one component; no comment carries history.

Paths this round writes: the new component; `src/lib/views/shared/card/project/CardLinks.svelte`, `CardDetails.svelte`, `CardFacts.svelte`, `ProjectCard.svelte`; `src/lib/views/boards/focus/lanes/LaneCard.svelte`; `docs/diagrams/*` as `npm run diagrams` writes them; `.scratch/migration/agents/reviews/O164-report.md` (the round's section). No other path; a path the change needs beyond these is named in the report with the reason, before it is written.

Verify before you report, from the worktree's root:

1. `grep -rn -E 'border: 1px solid transparent' src/lib/views/shared/card src/lib/views/boards/focus/lanes` prints only the new component's line, quoted.
2. The ASCII gate of the rules file over the changed files prints nothing.
3. `wc -l` of each changed file, every component at or under 520 lines.
4. `sh utils/unused-exports.sh` into the scratchpad, `diff` against `.agents/worktrees/O164-base/unused-exports.txt`: no new line.
5. `npm run diagrams`, then `npm run test:quick`, once, after the last change; it prints `every command passed`.

Append to the report a section "Repair round 1" with the DONE / NOT DONE rows for items 1 and 2, the per-place account item 1 asks for, the files table of the round with line counts, and the checks' output as printed. Builder rules stay as the brief and `agents/spec.md` give them: no git command that changes state, no breakage testing, plain ASCII.
