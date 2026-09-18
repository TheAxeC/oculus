# Report: Q52, one branch-state rule for the two git views

Builder a4d2d5b3b40564ca1, claude:opus through the Agent tool, launched 06:35, reported 06:59.

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

---

# Repair round 1 (builder a4d2d5b3b40564ca1, sent 07:20, reported 07:42)

All seven rulings built and verified. The review file was written to the main checkout after this worktree was cut, so the builder worked from the seven rulings, each of which names its probe.

| Ruling | State | Command and its output |
| --- | --- | --- |
| 1. The race between the directory check and git's answer | DONE | `src/lib/server/git.ts:129-136` sets `refused.present = exists(root)` at git's refusal; new case "says a root that went away between the two reads is not there, not that it is no repository", red under revert F |
| 2. A file, a dangling link and a walled folder keep `present` true | DONE | `git.ts:115-123` returns the gone shape only when `!directory(root) && !exists(root)`; new case red under revert E; the probe's output below |
| 3. Two reverts that left their own case green | DONE | `repositories.test.ts` now names the `rowLabel` revert, red under H; `changes.test.ts` names the repo-shape revert alone, red under C |
| 4. The doc lines carried, not described | DONE | both written out in full, with the current line beside each |
| 5. Two lines of prose | DONE | no line the builder authored is above 100 columns; the `changes.spec.ts` head comment is one sentence again |
| 6. Two catalog keys for one sentence | DONE | `grep -rn "repositories\.error" src tests config HELP.md DESIGN.md README.md` finds none; `tests/keys.test.ts` green in both directions |
| 7. Say why the four unreachable drawings stay | DONE | `Repo.svelte:16-19` |
| Node suite | DONE | 251 files, 4284 tests, all passed, no rerun needed |
| `npm run check` | DONE | `COMPLETED 1223 FILES 0 ERRORS 0 WARNINGS` |
| `build`, `format:check`, `lint`, the ASCII gate, both catalogs parse | DONE | exit 0; Prettier clean; eslint silent; the gate printed nothing; both YAML files parse |
| Browser specs | DONE | `npx playwright test repositories changes` -> 11 passed (22.2s) |

## What the server does now

```ts
    // A path with nothing at it is the one root git is never asked about. A path that is there and
    // is no directory, and one nothing may enter, are handed to git like any other, so the reader
    // gets git's own reason for them instead of being told the folder is gone.
    if (!directory(root) && !exists(root)) { ... }
    ...
    if (!gitDir.ok && gitDir.answered) {
        const refused = empty(gitDir.text || 'not a git repository');
        // The root may have gone between the check above and this answer, and then git refused it
        // for being gone rather than for being no repository. The path is read again here.
        refused.present = exists(root);
        return refused;
    }
```

`exists()` uses `lstatSync`, so a dangling symlink is a name that is there, and only `ENOENT` and `ENOTDIR` answer false; `EACCES`, `EPERM` and `ELOOP` are reads that could not tell, and a root is never called gone on one.

**The ruling-2 probe, rerun over all four paths** (the script makes them under the system temporary directory, calls `statusFor`, restores the mode and removes the folder, leaving none behind):

```
regular file        present=true  repository=false  error="cannot change to '.../a-file': Not a directory"
dangling symlink    present=true  repository=false  error="cannot change to '.../dangling': No such file or di"
parent denies walk  present=true  repository=false  error="cannot change to '.../walled/repo': Permission deni"
nothing at path     present=false repository=false  error="no such directory"
```

The three that exist read as `none` with git's own reason; only the fourth reads as `missing`. The reasons are cut at the module's own `short()` cap.

**How the race is made to happen on demand**: the test file's `spawnSync` mock gained a hook that fires once, on the first command carrying the argument it names, and then lets the command run for real against the changed tree. The case makes a repository, arms the hook on `--git-dir` to remove that folder, and calls `statusFor`; the recorded-command gates at the end of the file still pass.

## One key for one sentence

`config/text/views/repositories.yml` no longer carries `error`; `rowLabel` reads `sessions.ch_failed`, the key the Changes panel reads. The row's words are byte-identical, since the two keys held the same sentence.

## The clause in `Repo.svelte`'s head comment

```
    // All six shapes of views/shared/repo-shape.ts are drawn here while the picker offers two of
    // them: state/repositories.ts's repositoryRoots() keeps a root whose state is not a repository
    // out of the picker, so a reader reaches only the failed and the readable drawing. The other
    // four are what this file says if it is handed such a state, and they are not dead.
```

## Doc text, as the lines to put in the files

**`HELP.md:105`**, the `changes` row, gains "that the workspace folder is not there," after "no workspace folder,".

**`DESIGN.md:340`**, replaced whole:

> - 2026-09-17, the Changes panel over the repository facts. `views/shared/repo-shape.ts` `repoShape(root, state)` answers which of six a root's git state is drawn as, and the Changes panel's markup, its branch listing and the Repositories view's `repositories/Repo.svelte` all read it: a session naming no workspace folder, a workspace the `git` channel has no state for yet, a workspace folder that is not there (`GitState.present` false, drawn as `sessions.ch_nofolder` with git's reason beside it), a root that is no repository, a repository whose read failed (drawn with git's reason in `sessions.ch_failed`, which is the one key both views read for that row) and a repository that reads, one with no commit yet included, which alone draws the branch, the change groups and the commit box and fetches `/api/git` for its branches. Each drawing writes its own name as `data-repo`, one spelling across both views; the Repositories view draws all six while `repositoryRoots` offers it the failed and the readable one. `GitState.present` is false only for a path with no such name at it, read by `exists()` of `server/git.ts` with `lstat` and set both where nothing is at the path and again where git answers that a root is no repository, so a folder that goes away while the read runs is told from one that never was a repository; a regular file, a dangling symbolic link and a folder under a parent nothing may enter are all there, and each carries git's own reason instead. A listing that answers after a newer one was asked for is dropped. The branch line's sentence is `views/shared/branch-state.ts` `branchState(state)`, read by both views: "in step with the upstream" is drawn only for a branch that has an upstream, so a branch with none, every repository with no commit among them, reads only the sentence saying there is nowhere to push. Packages Q47, Q52.

## Every revert, rerun on the final tree

A (`ch_insync` whenever the list is empty): 3 node red and, after a rebuild, 2 browser. B (drop the detached line): 1. C (drop the `missing` branch): 2 node and 1 browser. D (`gone.present = true`): 1 node and 1 browser. E (drop `&& !exists(root)`): 1. F (`refused.present = true`): 1. G (the bare `data-repo-failed`): 3 node and 1 browser. H (`rowLabel` returns the failed sentence for every shape): 1. The tree was restored after each and re-verified green.

## Before and after, as it stands now

1. **Repositories, a branch with no upstream**: the branch line's right end was `in step with the upstream` and is now empty.
2. **Changes panel, a workspace folder that has gone**: was `This workspace is not a git repository.`, now `This workspace folder is not there.` with git's reason in the title.
3. **Changes panel, a workspace that is a regular file, a dangling symlink, or a folder nothing may enter**: all three read `This workspace folder is not there.` after the first round and now read `This workspace is not a git repository.` with git's own reason in the title.
4. **Changes panel, a folder removed while the watcher is reading it**: was `This workspace is not a git repository.`, now `This workspace folder is not there.`
5. **Repositories, a failed read**: `data-repo="failed"`, same words from `sessions.ch_failed` instead of the deleted `repositories.error`.
6. No other change.

## Files changed in this round

`src/lib/server/git.ts` 419, `src/lib/data/model-sessions.ts` 494, `src/lib/views/repositories/Repo.svelte` 243, `config/text/views/repositories.yml` 53, `tests/server/git.test.ts` 708, `tests/views/repositories.test.ts` 511, `tests/views/changes.test.ts` 358, `tests/browser/changes.spec.ts` 265, `src/lib/views/shared/repo-shape.ts` 29.

## Things worth knowing

- `exists()` costs one `lstat` per root that is not a directory and one per root git refuses; it runs on no readable repository, so the watcher's ordinary path is unchanged. Not separately timed.
- The walled-folder case sets a parent to mode `0o000` and restores it in a `finally`; it would pass vacuously for a user who can traverse regardless of mode, that is, as root. The suite is not run as root here, and the case is red under revert E.
- Still open: the Repositories picker offers only `repository === true`, so the `missing` and `none` drawings are not reader-reachable; `DESIGN.md:334`'s "whose state has no error" is wrong and the orchestrator fixes it at the landing.

---

# Repair round 2 (builder a4d2d5b3b40564ca1, sent 08:35, reported 08:45)

All six rulings built and verified. The builder could not read the review's round-1 section: the file on the main checkout ended at the round-0 review when it looked, so it worked from the six rulings, each of which names its probe.

| Ruling | State | Command and its output |
| --- | --- | --- |
| 1. The picker offers every root, each row saying what its state is | DONE | `state/repositories.ts:93` is `pickerRoots`, filtering on `stateOf(root) !== null`; two new node cases in each of two files; browser cases at `repositories.spec.ts:97` and `:177`, both red under revert K |
| 2. Both DESIGN.md lines written out | DONE | four lines carried in full, each with the current text beside it |
| 3. `Repo.svelte`'s head comment | DONE | `:16-20` |
| 4. `ENAMETOOLONG` | DONE, as the third code that answers false | `server/git.ts:394`; new case red under revert G |
| 5. The comment in `server/watch/git.ts` | DONE | `:202-205` |
| 6. Two report claims | DONE | revert B rerun, reddening two cases; the rerun-alone line carried |
| Node suite | DONE | 251 files, 4287 tests, all passed |
| `npm run check` | DONE | `COMPLETED 1223 FILES 0 ERRORS 0 WARNINGS` |
| `build`, `format:check`, `lint`, the ASCII gate, both catalogs | DONE | exit 0; Prettier clean; eslint silent; the gate printed nothing; both parse |
| Browser specs | DONE | `npx playwright test repositories changes` -> 12 passed (29.2s) |

## What the picker does now

```ts
export function pickerRoots(roots: string[], stateOf: (root: string) => GitState | null): string[] {
    return roots.filter((root) => stateOf(root) !== null);
}
```

Renamed from `repositoryRoots`, because a name saying "repositories" over a list of every root is a false name and because `server/roots.ts:39` exports a different `repositoryRoots`. Each row carries its label, a badge of what its state comes to (`shapeBadge`: `gone`, `no repository`, `unreadable`, nothing for a repository that reads) and git's reason as the row's hover words.

**A hub with one repository and one deleted root**: two rows in channel order, the hub's with no badge and the deleted one badged `gone` with `no such directory` as its hover words; whichever the reader picked stays picked, and the view draws `This workspace folder is not there.` **Every root gone**: one row each, all badged `gone`; the empty line is drawn only when the channel carries no root at all.

Three user-visible choices the ruling needed, each reversible: the badge words (`pick_failed: unreadable`, `pick_missing: gone`, `pick_norepo: no repository`); no tone on the badge, since `--on-c-*` resolves to nothing in both theme files; and `repositories.empty` reworded to `Nothing is on the channel yet.`

The ruling also made reachable, and the round fixed, the round-0 review's Behaviour 6: git's reason is now the row's own `title`, the attribute the Changes panel carries it on, since `ui/TreeItem.svelte` draws its own tooltip only for a row that is pressed and this row is text.

## Every revert, rerun on the final tree

A 3 node + 2 browser; B 2 node (`tests/keys.test.ts` among them, as the ruling said); C 3 node + 2 browser; D 2 node + 2 browser; E 1; F 1; G 1; H 5 node + 2 browser; I 3; J 1; K 5 node + 2 browser; L 1 node + 2 browser. The tree was restored after each and re-verified green.

## Before and after, against the base

1. **The picker**: only the roots git reads as repositories, so a folder of notes was absent and a deleted root left the list silently; now every root the channel carries, badged, with the reader's pick surviving all of them.
2. **The empty line**: `No repository is on the channel yet.` whenever no root was a repository; now `Nothing is on the channel yet.`, only when the channel carries no root.
3. **The branch line for a branch with no upstream**: `in step with the upstream`; now nothing.
4. **A workspace folder that has gone**: `This workspace is not a git repository.`; now `This workspace folder is not there.`
5. **A regular file, a dangling symlink, a folder nothing may enter**: all three read as no repository at the base and still do; only the hover words change, from `no such directory` to git's own line.
6. **A workspace removed while the watcher reads it**: now the missing sentence.
7. **The Repositories row for a state with no repository**: the error-hue line for every such state with no hover words; now the sentence the state comes to, muted except the failed one, each with git's reason as hover words.
8. **A workspace whose path is longer than the system will carry**: now the missing sentence.
9. Markup only: `data-repo="failed"` for `data-repo-failed`.

## Files changed in this round

`state/repositories.ts` 233, `views/Repositories.svelte` 213, `views/shared/repo-shape.ts` 44, `views/repositories/Repo.svelte` 247, `config/text/views/repositories.yml` 56, `server/git.ts` 421, `server/watch/git.ts` 380, `tests/state/repositories.test.ts` 494, `tests/views/repositories.test.ts` 539, `tests/browser/repositories.spec.ts` 420, `tests/server/git.test.ts` 720.

## Things worth knowing

- The picker's rows cannot be checked in the node suite: a server rendering leaves the menu closed, so the badges are proven only in the browser.
- The new browser case deletes a watched folder and waits for the channel; the watcher noticed the deletion with no nudge.
- `pickerRoots` still drops a root the channel names with no state at all, which cannot arise today and is what keeps the function a rule rather than the identity.
