# O59 landing

Position: plan migration (cockpit to oculus), step O59 (the status flag `terminal` becomes `closes_deadline`), landed 2026-10-22. Next: /spec O54; the run of /refute over O52's repair round 1; /land O58 and O62; O50's repair round 1 is building.

## Open items

None open.

## Not done

- A task card's Start Agent was not looked at: the hub's tasks collection holds no entry, and the look writes none.

## The check of Steps 1

The O59 builder (a07b44a7c7ba9e8e9), its brief check (a836f5a00ff244775) and its reviewer (a829b81915b79ee67) had all finished before the cherry-pick; none was running.

## What landed

From base cd00ebb1 (`git cherry-pick -n cd00ebb1..migration-O59`): the status flag is `closes_deadline` in `config/catalogs/vocab.yml` (25 status rows) and `data/shapes/catalog-files/vocab.ts`; its reader is `closesDeadline` in `state/boards/focus.ts`, called from `state/boards/ticker.ts` and `views/shared/forms/entry/task-card.ts`; the head comments of `rows.ts` and `task-card.ts` name it; the type flag keeps `terminal`.

## Fixes at landing

Main's own red lines and the two fixes the step's Step 0 names, in this commit:

- Format: `.prettierignore` names `.claude/settings.local.json`; prettier reflows of `server/content/wallpaper.ts` and `entry/edit/EntryForm.svelte`.
- `docs/templates.md`: the `followup` line reads `{ do, after }`.
- `themes/tokens.css` declares `--wall-editor` and `--wall-terminal` at 100% in `:root`, which the contrast check read as undefined.
- The comment width of `tests/checks/source/history.test.ts:21`.
- Boundaries: `followups()` and `subtasks()` moved from `data/snapshot/normalise-parts/plans.ts` (deleted) into `data/shapes/shapes.ts`; `normalise.ts` and `state/boards/collection.ts` import them from there; `Followups.svelte` takes the type `Followup` from `state/boards/collection`.
- Duplication: `views/shared/forms/dated/ListHead.svelte` draws the head and add form that `Subtasks.svelte` and `Followups.svelte` repeated; `answerWords` replaces the copies in `EntryCard.svelte`, `Lanes.svelte` and `ProjectCard.svelte`; `writeLine` in `state/client/writes.svelte.ts` serves `writeSubtask` and `writeFollowup`; two entries of `tests/checks/tree/allow-duplication.txt` removed.
- Sizes: `views/shared/forms/{Followups,Subtasks,LineForm}.svelte` moved to `views/shared/forms/dated/`; `ProjectCard.svelte` (491 lines) gives its ELI5 and next block to `views/shared/card/project/CardBrief.svelte`; `writes.svelte.ts` (883 lines) gives `unsavedAnswer` to `state/sessions/source/write-files.ts`.
- Lint: the unused `t` of `EntryCard.svelte`.
- Time-outs under load: `watch-no-primary.test.ts`, one describe of `window-guard.test.ts`, the two tables of `app-theme-start.test.ts` and the `PLACED_ROWS` table of `undo.test.ts` tagged slow, each 100 ms or more alone.
- The dev server no longer reloads on files under `.agents/worktrees/` (`vite.config.ts` `server.watch.ignored`, through `WORKTREES_DIR`).
- eslint no longer walks into the worktrees under `.agents/` (`eslint.config.js` ignores), which ran `npm run lint` out of memory.
- The diagrams regenerated with `npm run diagrams`.

## What was found

The review (`agents/reviews/O59-refuter.md`, no repair round) found two report findings that change no code, closed here: Spec 1, the report gives C6d's read after the change only, while the review's own read meets C6d; Standards 1, the report marked Verify 1 DONE over a red `boundaries.test.ts` run, which was red on the base for files outside the step and is closed by the boundary fix above. The builder's first report did not pass its bar: it called the brief done with a red row.

## Verification on main

`npm run test:landing`, 608.8 s, every command passed:

```
ok      ASCII gate (1.3 s)
ok      npm run format:check (19.8 s): All matched files use Prettier code style!
ok      npm run lint (44.7 s): > eslint . --cache --cache-location node_modules/.cache/eslint/
ok      npm run check, without its type sync (76.5 s): 1792677283764 COMPLETED 4256 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      npm run test:checks (175.1 s): Duration  153.30s (transform 67.39s, setup 0ms, import 210.41s, tests 345.13s, environment 6ms)
ok      npm test (305.3 s): Duration  283.32s (transform 62.53s, setup 0ms, import 773.92s, tests 254.86s, environment 32.84s)
ok      npm run test:slow (552.3 s): Duration  533.03s (transform 70.05s, setup 0ms, import 855.80s, tests 854.11s, environment 32.95s)
ok      npm run build (608.8 s): See https://rolldown.rs/reference/InputOptions.checks#plugintimings for more details.
```

No file of the tree changed after the gate started. A/B: none, `bench: []`.

## The look on TEST

- Focus board: the command center lists its deadlines by kind; the Tasks block lists five follow-ups with done buttons; the lanes draw their rows.
- FWO Senior entry card: the Follow-ups head with Add Follow-up; the row's done and edit on hover; the add form with what to do, the date, a disabled save and cancel.
- EEG-sAAD project card: the ELI5 and the next line cut at 130 characters (`CardBrief.svelte`); Add Subtask opens the add form with no head over it, as `Subtasks.svelte` lines 8-10 say for a card with no lines.
- Not looked at: a task card's Start Agent (the tasks collection holds no entry).
- The look left no write: `git diff --stat` over the hub's `.oculus/` and oculus's `config/` prints nothing.

## Agents

- Builder a07b44a7c7ba9e8e9, claude-opus-5-5: 188321 tokens, 68 tool uses, 10 min 24 s.
- Brief check a836f5a00ff244775, claude-opus-5-5: 189285 tokens, 66 tool uses, 7 min 13 s.
- Reviewer a829b81915b79ee67, claude-opus-5-5: 178609 tokens, 53 tool uses, 6 min 16 s.
