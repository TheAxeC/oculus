# O103, repair round 1

Read with `agents/briefs/O103.md` and the review `agents/reviews/O103-refuter.md`. Each item says what to change. The rules of your first message stand: no state-changing git, work only in the worktree, no breakage testing, no script beyond the case-run program `spec.md:65` allows, a shortcut is a finding.

Paths this round writes: those of the brief, and the report.

1. The `Ticker` type's comment (review, Standards 1). `src/lib/state/boards/ticker.ts:140`, "Each list is already in the order it is shown in.", is false for `tasks` once `taskGroups` moves a task's subtasks under it. Reword it so it says what is true: each list is in the order its lines are drawn within the group `taskGroups` sorts them into, a task's subtasks drawn under their task.
2. One name for the command center (review, Standards 3). `ticker.ts:355` writes "Command Center"; the file writes "command center" everywhere else. Write it in lower case.
3. The Doc text for `docs/HELP.md:295` (review, Standards 4). The replacement says a task "with open subtasks" is drawn as a subheading; a task whose open subtasks are all snoozed stays a plain row. Reword it to say a task with open subtasks that are not snoozed, and keep the rest of your replacement.
4. The key check (review, Standards 2). Add to the report the check `spec.md` asks of every id or key the step introduces (empty, duplicated, colliding with a configured or reserved key, and what the code does in each case), for the word `lead`, the text keys `dlcat_lead`, `glyph_lead`, `word_lead_deadline`, and the row fields `heading` and `under`, each with the command that shows it.
5. The report's count (review, Proof). Correct "the five `focus.yml` keys" to the seven lines the name grep prints (42, 44, 54, 57, 100, 105, 107).
6. The visible changes (review, Behaviour 1 and 2). State in the report, with before and after: a subtask row under a heading shows its `do` text alone in its hover words where its name is cut (before: "Main Tasks: Oculus ..."); a heading that is the first row of the Tasks group stands 4px lower under the group label than a first plain row does.
7. The scripts (review, Spec 2 and 3). The breach is closed under the ruling "Unapproved builder scripts": in the report, list every command you ran that wrote a file or ran tests outside the brief's checks (the two `npx vitest run --project unit --dir ...` probes, the case-run program and the temporary-folder hub copies and workspace-state folders it made), each with the files it wrote and that they are gone. Write no new script in this round.

The `under` field (review, Spec 1) stays: ruling 546 (2) (a) gives the subtasks "as rows under it", and the set-in shows which rows are the task's; the option not chosen, (b), kept the task row unchanged. Change nothing for it.

After the changes, run `npm run test:quick` once and the character-set check over the files you changed, and quote their lines. Append to `.scratch/migration/agents/reviews/O103-report.md` a section "Repair round 1" with each item's change and the checks; correct the "Doc text" section in place.
