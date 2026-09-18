# Report: Q52, one branch-state rule for the two git views

Builder a4d2d5b3b40564ca1, claude:opus through the Agent tool, launched 06:35, reported 07:0x.

Everything in the brief is done.

## Raised for the orchestrator

1. **The shared rule lives in `views/shared/`, not beside one view.** The brief said "a new `.ts` beside one of them", but `tests/boundaries.test.ts:70` lets a view import only `ui/**`, `state/**`, `views/registry` and `views/shared/**`, so `views/repositories/Repo.svelte` importing `views/sessions/branch-state.ts` is a boundary violation. `views/sessions/repo-shape.ts` moved to `src/lib/views/shared/repo-shape.ts`, and the sentence is the new `src/lib/views/shared/branch-state.ts`.
2. **The Repositories view cannot reach the `missing` and `none` drawings through its picker.** `src/lib/state/repositories.ts:97` filters by `repository === true`, and both a folder that is gone and a folder that is no repository carry `repository: false`. That file is outside the brief's paths, and widening it would contradict the decision its own doc comment states. The view draws the true sentence for those two states, proven by rendering the partial directly.
3. **A brief premise is wrong.** The brief says `tests/browser/repositories.spec.ts` reads `[data-repo-failed]`; it reads only `[data-repo-picker]`. The only reader of the old spelling was `tests/views/repositories.test.ts`. A browser case was added so the spec does now read `[data-repo="failed"]`.
4. **Pre-existing doc error, outside this step's paths**: `DESIGN.md:334` says Repositories picks among the roots "whose state has no error", while the code and `DESIGN.md:319` both say a failed read stays in the picker.

## DONE / NOT DONE

| Row | State | Command and its output |
| --- | --- | --- |
| One branch-state rule, one place, both views | DONE | `grep -rn branchState src` gives the definition at `views/shared/branch-state.ts:13` and two readers; no copy is left in a view |
| The rule is Q47's: in step only with an upstream | DONE | `npx vitest run tests/views/changes.test.ts tests/views/repositories.test.ts` -> 46 passed; revert A reddens 3 node cases and 2 browser cases |
| Repositories says nothing for a branch with no upstream | DONE | the browser case asserts `toHaveCount(0)` for `sessions.ch_insync`; red under revert A |
| `data-repo-failed` becomes `data-repo="failed"` | DONE | `grep -rn data-repo-failed src tests HELP.md DESIGN.md README.md` finds none |
| `GitState` says which of a missing directory and a folder that is no repository | DONE | `npx vitest run tests/server/git.test.ts` -> 35 passed, the new case included |
| The Changes panel draws the missing-folder sentence | DONE | `tests/views/changes.test.ts` and `tests/browser/changes.spec.ts:198` |
| Node suite | DONE | `npx vitest run --reporter=dot` -> 251 files, 4282 tests, 42.10s. An earlier run had `tests/server/mail/poll.test.ts` red, a watch-timing case unrelated to these paths, green alone |
| `npm run check` | DONE | `COMPLETED 1223 FILES 0 ERRORS 0 WARNINGS` |
| `npm run build`, `format:check`, `lint`, the ASCII gate, `changes.yml` parses | DONE | built; Prettier clean; eslint silent; the gate printed nothing; the YAML parses |
| Browser specs | DONE | `npx playwright test repositories changes` -> 11 passed (39.3s), after waiting for port 8792 |

## The shape the new fact was given

A new required boolean `present` on `GitState`, false only where the directory check fails, true everywhere else including a read that threw, since such a read says nothing about whether the folder is there. A field rather than a value of `repository` because `repository` is read as a boolean in three places and `DESIGN.md:319` pins its three-case meaning; the name because the tree already uses `present` for "this thing is there" on a project document.

## The new catalog key

One, in `config/text/views/changes.yml`, in the file's alphabetical order: `ch_nofolder: This workspace folder is not there.` No key was added to `repositories.yml`: `Repo.svelte` already reads five `sessions.ch_*` keys for its branch line.

## Every reader of the git state, and what each does now

`state/repositories.ts:97` filters the picker by `repository === true` (unchanged, open item 2); `:137` `noCommitYet` unchanged; `views/shared/repo-shape.ts:23` is the one place a state becomes a drawing and the only reader of `present`; `views/sessions/Changes.svelte:47,78` reads it for the markup and the branch-listing effect; `views/repositories/Repo.svelte:74` now reads it too, in place of its own `git.error !== null` test; `ChangesRepo.svelte:69` reads `upstream` and `error` for the push control and now imports `branchState`; `Branches.svelte:34` unchanged. Places that spell a repository's state as an attribute: three files, one vocabulary, no other spelling in the tree.

## The reverts, run

A (`branchState` pushes `ch_insync` whenever the list is empty): 3 node cases red, and after a rebuild 2 browser cases. B (drop the detached line): 1 red. C (`repoShape` without the `missing` branch): 2 red. D (`gone.present = true`): the server case red, and the browser case red. E (the bare `data-repo-failed` again): 3 node cases red and the new browser case red. F (draw the row for `git.error !== null`, the shape ignored): 1 red. After the last revert the tree was put back and re-verified green.

## Doc text (neither file edited)

`HELP.md:105`, the `changes` row, gains the fifth sentence the panel can say. `DESIGN.md:340`, the 2026-09-17 Changes decision, is replaced whole to name six shapes, `views/shared/repo-shape.ts`, `GitState.present`, the one `data-repo` spelling across both views, and `views/shared/branch-state.ts` as the one branch sentence. `DESIGN.md:319` needs no edit. `DESIGN.md:334`'s "whose state has no error" was already wrong; the correct clause is "that git reads as repositories".

## Before and after

1. **Repositories, a branch with no upstream** (the step's reachable visible fix): before, the branch line ended `in step with the upstream`; after, it ends after the branch name. A branch with an upstream and no distance still reads it.
2. **Changes panel, a session whose workspace folder has gone**: before `This workspace is not a git repository.`; after `This workspace folder is not there.`, with `no such directory` in the title.
3. **Repositories, a failed read**: `<div data-repo-failed>` becomes `<div data-repo="failed">`; same row, text and hue.
4. **Repositories, a missing folder or no repository** (not reachable through the picker): before one error-hue row reading git's reason; after a muted row with the true sentence.
5. Nothing else changes.

## Files changed

Source: `data/model-sessions.ts` 489, `server/git.ts` 393, `views/shared/repo-shape.ts` 29 (new, moved), `views/shared/branch-state.ts` 20 (new), `views/sessions/Changes.svelte` 303, `views/sessions/ChangesRepo.svelte` 198, `views/repositories/Repo.svelte` 237. Config: `config/text/views/changes.yml` 61. Tests: `sessions-fixture.ts` 127, `server/git.test.ts` 630, `views/changes.test.ts` 358, `views/repositories.test.ts` 507, `browser/changes.spec.ts` 265, `browser/repositories.spec.ts` 343. Deleted: `views/sessions/repo-shape.ts`. Per-file added and removed counts are not measured, since a worker runs no git command.

## Other things worth knowing

- The helper in `Repo.svelte` is named `rowLabel`, not `sentence`, because `tests/keys.test.ts`'s catalog scan reads `sentence(` as a catalog lookup. The check was not loosened; the helper was named away from the collision.
- `tests/views/repositories.test.ts` gained a `repo()` helper that renders the partial on its own, which is the only way a state the picker filters out reaches it.
- `npm run build` was re-run before each browser revert run.
