# D48 landing: side projects with the research keys that apply, and smaller Focus rows

Position: the oculus migration (cockpit to oculus), D48 side projects with the research keys that apply, and smaller Focus rows; landed, with 330 of the 364 packages of `plan.md` ticked. Next: D46 and D53 land (each has its review over round 1, with findings to fix at landing); R2's brief check findings are closed in its brief before its preparation; D49 after D46, D56 after D53, D55 after D50.

## Open items

The state file's open items list holds no entry.

## The check of Steps 1

The builder a08cd36ac4b778a76, the brief check abe9a0d14115bbbde and the reviewers aeac87c877d84bfe3 and a5a9980f32b496ee0 had finished; ListAgents listed none of them running (it listed a6f74cd8e4f21015b, a62a3b17bb5c16834 and a57eea66538e91df5, the agents of D41, D50 and R2's brief check).

## NOT DONE

Nothing of the step is left undone. Focus shows no side project's deadline or task on this hub, because no side project of this hub sets one; the rows are read by the same code as a research project's.

## What landed

Side projects (`side-projects/*/project.yml` and `<repo>/.oculus/project.yml`) accept the research manifest's `deadline`, `subtasks`, `followup`, `snooze`, `priority`, `pin`, `short`, `latest`, `collaborators`, `waiting-on` and `related`, with the same names and shapes and read and written by the same code; Focus lists their deadlines and tasks beside the research projects'; the ticker rows are drawn at 11 px regular on an 18 px row and a 14 px line. 71 paths, one commit.

## What was found

- The review over round 1 found that the round had narrowed the research row of the G8 test 'ticks and reopens a line of a manifest' from the whole file to a `toContain`. Fixed at landing: every row asserts the whole file after the add (`toBe(original + row.added)`); `npx vitest run tests/server/edit/writes.test.ts`: 17 passed. The report's account of its assertion edits is corrected in the booking.
- The look on a scratch oculus (port 8796): Focus before, 13 px semibold names on a 22 px row with a 16 px line; after, 11 px regular on an 18 px row with a 14 px line; the headings unchanged.

## The gate

In `.agents/worktrees/gate` at cd31fd9a3: `npm run diagrams && npm run test:landing`: ok ASCII gate (32.0 s); ok npm run format:check (34.5 s); ok npm run lint (97.2 s); ok npm test (226.9 s); ok npm run test:checks (350.9 s); ok npm run check, then npm run build, then npm run test:slow (486.1 s); every command passed. Main's 71 staged blobs equal the gate's by `git rev-parse`.

## Agents

- Builder a08cd36ac4b778a76 (claude-sonnet-5-5): 178,779 tokens, 330 tool uses, 136.7 min; round 1 290,099 tokens, 195 tool uses, 109.7 min. The first report did not pass its bar; its review's findings went back in repair round 1.
- Brief check abe9a0d14115bbbde (claude-opus-5-5): 276,858 tokens, 122 tool uses, 14.0 min.
- Reviewer aeac87c877d84bfe3 (claude-opus-5-5): 348,330 tokens, 108 tool uses, 36.9 min.
- Reviewer over round 1 a5a9980f32b496ee0 (claude-opus-5-5): 263,029 tokens, 69 tool uses, 32.0 min.
- Fixes at landing: 1 (the G8 test above). The A/B: no `bench:` line, none run.
