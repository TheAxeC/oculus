# O56, landing

Position: roadmap entry O56, a new project, a new entry of a collection and Save to Literature ask which hub takes it (ruling 210), landed. Next in the plan: /land O61, /land O53; on O39, the desktop look C8 after `npm run app:package`, then the tick.

## Open items

- none.

## The check of Steps 1

The agent listing named no subagent: the builder a449c7dbd8ad9a6ed, the brief check a837bbfa456b7963d and the reviewers a11ec4587720951e0 and ab082e1a8e90c900f had all ended before the landing.

## NOT DONE

Nothing of the step. Not looked at: the dark theme, C11 with no primary, C12b's Folder change (the demo hubs name no `new_project_dir`).

## What landed, what was found

O56 landed on main from base 892189d7, the whole range (one wip commit fcb1f61a of the builder's work and repair round 1), 40 files, +1457 -943 with the fixes at landing (`git cherry-pick -n 892189d7..migration-O56` in the gate worktree, then the same range on main, `git diff --cached --binary` of main and the gate equal under `cmp`). Built: the hubs a new record can go to are `hubsTaking` (`src/lib/state/shared/page/hubs.ts`, `literatureHome` and `homeCollection` removed); New Project asks the hub when more than one could take it, the primary first, with the chosen hub's Folder and Domains (`NewIdeaForm.svelte`, `newIdeaShape` with `root`); Save to Literature opens a menu of the hubs holding Literature and saves to the one picked, or saves at once with one; Add Task in the palette asks the hub after the title (`addTask(..., hub)`, `task_hub_collection` for a chosen hub holding none); a lead's apply control is a menu of the hubs holding Applications (`lead-apply.ts`, `LeadCard.svelte`). Behaviour the round's report did not state with its before and after, stated here (review over round 1, R1-3 and R1-4): In Literature was a disabled button, skipped by Tab and with no tooltip on keyboard focus; it is now drawn waiting, a Tab stop on every card whose paper a hub holds, in the Literature search and on Lit Watch, which Enter and Space leave as it is and whose tooltip opens on keyboard focus; the one-hub Save keeps its place in the focus order while its save is out. A second press of Add Task's title while its write is out sent a second `new-entry` write and now does nothing (`CommandRows.svelte`, `adding`). Fixes at landing, from the review over round 1: In Literature takes the focus when the control taken off the page still holds it (`focusIsFree` of `ui/frame/quiet-focus.ts`, R1-1) and takes it without opening its tooltip over the saved line (`focusQuietly`, R1-2); a save that answered ok waits for one change of the Literature collections only, so a paper the answer does not match never takes the focus later (`landed`, R1-5); G8's Code and Test lines name `hubsTaking` and `tests/state/shared/hubs.test.ts` in place of `literatureHome` and `literature-home.test.ts`. R1-6, the case-run copy written into the worktree's `tests/` and removed before the report, left nothing (`git status --short`).

Review: `agents/reviews/O56-refuter.md`, one repair round and a run over it; every finding closed. The builder's first report did not pass its bar (the repair round).

Verification in the gate, after the fixes: `npm run diagrams && npm run test:quick`: `40 changed file(s)`, `117 test file(s)`; prettier, the ASCII gate, svelte-kit sync, eslint, svelte-check (537 files, 0 errors, 0 warnings), vitest, vitest checks and vitest slow ok; `test:quick: 107.7 s; every command passed`. The first gate run's eslint failure was in the landing fix itself (`no-meaningless-void-operator` on `void held`), closed with the tree's form for a read that is an effect's dependency (`views/shared/latex/Rows.svelte:31`). Not covered: tests that reach no changed file within the import depth. The verify list was not changed. A/B: none, `bench: []`.

## The look

The look, on a scratch dev server on 8797 with a scratch HOME and two hubs copied from `tests/fixtures/hubs/demo`, `research` (primary) and `lab`, headless Chromium: C6, Lit Watch's Save opened by Enter lists `research`, `lab`, ArrowDown and Enter wrote `lab`'s Literature (3 to 4 titles) and nothing in `research`; C7, both cards then read In Literature; C12 with the fixes, the focus on In Literature, no tooltip open, `Saved to Literature as osei2026certified` under it; C9, `:task-add Look task O56` asked 'Which hub takes the task Look task O56?' with `research` first, and `lab` wrote `lab`'s tasks file (4 to 5) alone; C10, the apply menu on a research lead lists `research`, `lab`, and `lab` opened `lab`'s `applications.yml` beside the leads with the entry placed and the cursor in its key, the lead turned applied; C2, New Project's Hub field lists `research`, `lab`, and with `lab` chosen and a Folder the manifest was written at `lab/projects/ideas/look-idea-o56/project.yml`, nothing in `research`; C12c, with no Folder the form said 'not saved: folder: the hub names no folder for new projects of the tier projects' and wrote nothing. The scratch server was stopped (`lsof` on 8797 prints nothing). Not looked at: the dark theme, C11 with no primary, C12b's Folder change (the demo hubs name no `new_project_dir`).

## Agents

Agents: builder a449c7dbd8ad9a6ed, claude-opus-5-5, before the pause no completion notice (stopped), after the resume 161697 tokens, 201 tool uses, 21 min 37 s, round 1 250368 tokens, 110 tool uses, 18 min 25 s; brief check a837bbfa456b7963d, claude-opus-5-5, 232172 tokens, 78 tool uses, 10 min 51 s; reviewer a11ec4587720951e0, claude-opus-5-5, 281356 tokens, 71 tool uses, 26 min 1 s; reviewer over round 1 ab082e1a8e90c900f, claude-opus-5-5, 226623 tokens, 57 tool uses, 14 min 21 s.
