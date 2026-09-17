# Step Q44 refuter report (on .agents/worktrees/q44, base a05037a9)

## Verification (rerun by the reviewer)
All commands were run from `tools/oculus` in the worktree.
- `npx vitest run --reporter=dot`: `Test Files 241 passed (241)`, `Tests 4055 passed (4055)`. No timing test timed out.
- `npm run check`: `COMPLETED 1194 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
- `npm run lint`: no problems. `npm run format:check`: `All matched files use Prettier code style!`.
- ASCII gate (the perl command): printed nothing.
- `npm run build`: exit 0.
- `npx playwright test tests/browser/repositories.spec.ts tests/browser/files.spec.ts`, three runs:
  - First run: `1 failed, 29 passed`. The failure was `files.spec.ts:403` (the first bookmark), `nav button[data-bookmark=".../page.html"]` not found.
  - `files.spec.ts` alone: `23 passed`.
  - Both specs again: `30 passed (43.4s)`.
  - The failure did not come back. It is in a Files test, which runs before the Repositories spec. The machine's load average was about 19 at the time.
- `git status --short` shows the 11 modified files and nothing else.

## 1. Spec
- **`src/lib/server/git.ts:108-109`, a timed-out repository check.** A `rev-parse --git-dir` that fails or times out returns `empty(...)` with `repository: false`.
  - Brief item 1 says `repository` is "true for a repository whatever else failed". Item 3 says "a read that fails once no longer swaps the view to another repository".
  - A repository whose first read times out is dropped from the picker, and the view moves to the first other root. Probe below: with every root timing out, the picker is empty and the view draws `repositories.empty`.
  - The builder lists this as a limitation, but it falls short of items 1 and 3, and no test covers it. It needs a fix or a booking. An ETIMEDOUT on `--git-dir` is not evidence that the root is not a repository.
- **`src/lib/views/Repositories.svelte:155-158`, the row's tone.** The brief asks for "one muted error row". The builder uses `tone="error"` (red) and gives `files/Notes.svelte:76` as the precedent. This is a deviation the builder disclosed; the orchestrator should rule on it.
- **`Repositories.svelte:155-158`, what the row replaces.** The brief says the row goes "in place of the sections". The builder replaces all of `Repo.svelte`, so the branch line and the path line go too, although the state still carries `branch: 'main'`. The served probe shows only the picker and the red row. The brief's wording leaves this open; it is a user-visible choice the report does not name.
- **Tighter command gate (`tests/server/git.test.ts:43-61`, `:480-490`, `:505-518`).** No item asks for it. It is a test-only addition that makes a writing `symbolic-ref` fail, and my revert R6-style check confirmed that. I accept it, but see the false comments under Standards.
- **A failed branch read keeping `repository: true` (`git.ts:139-145`).** This decision is untested. Revert E below (`found.repository = false` when both HEAD reads fail) left all 5 relevant files green, 160/160.
- **Two files outside the brief's paths.**
  - `tests/server/watch/git.test.ts:346-350` and `:381-384`: the exact count goes from 7 to 8. This is needed and it is not a loosened threshold.
  - `tests/sessions-fixture.ts:117`: it gains `repository: true`, which `npm run check` needs. Setting the default to `true` has a consequence, covered under Proof.
- **Sessions view Changes panel: a booking, not this step.** Decision 3 forbids editing any other view, while item 4 asks every "error means not a repository" sentence to follow the new field. The two clash, so the panel belongs in a booking.
  - `src/lib/views/sessions/Changes.svelte:206-209` still draws `sessions.ch_norepo` ("This workspace is not a git repository.", `config/text/views/changes.yml:47`) whenever `error !== null`. That includes a repository whose read failed.
  - `Changes.svelte:70` also skips the branch fetch on any error.
  - The wrong sentence predates this step. Before, a repository whose status failed also carried `error`.
  - A no-commit repository now gets the full panel with its controls, where it used to be called "not a git repository". That is more correct, and I did not check it in a browser.
  - The booking should cover the panel, `changes.yml:47`, and the sessions test fixtures (next section).

## 2. Proof
I ran the reverts in my own copy (`scratchpad/q44-review/oculus`). Each file was restored and compared with `cmp` against the worktree afterwards. The node reverts ran over `tests/server/git.test.ts`, `tests/state/repositories.test.ts`, `tests/views/repositories.test.ts`, `tests/server/watch/git.test.ts` and `tests/views/sessions.test.ts`.

| Revert | Result |
|---|---|
| A: `symbolic-ref` result ignored | Red: "reads a repository with no commit in it..." (`expected 'ambiguous argument 'HEAD'...' to be null`). Browser, rebuilt: "lists a repository with no commit yet and switches to it" red at `getByText('start')`. |
| B: `return empty(reason)` when status fails | Red: "keeps a repository whose status cannot be read a repository" (`expected false to be true`). |
| C: `repositoryRoots` filters on `error === null` | Red: the state test (`[ '/hub', '/fresh' ]` vs `[..., '/broken']`) and the view test (`to contain 'data-root="/other"'`). |
| D: never draw the error row | Red: the view test (`expected +0 to be 1`). |
| E: `repository = false` when both HEAD reads fail | **Green, 160/160**: the builder's decision has no test. |
| F: no `--git-dir` read; `repository` taken from the HEAD reads | Red only on process counts: the source call count and both watch counts (`expected 7 to be 8`). No behaviour test tells the two designs apart. In my probes I found no real repository where they differ. |

- **`tests/views/sessions.test.ts:194` and `:588`, a test now asserting a known defect.** Both build `git({ error: 'not a git repository' })`, which through the new fixture default carries `repository: true`, so they describe a repository whose read failed.
  - The test at `:548-553`, "says a workspace is not a repository, with git own reason in the tooltip", therefore asserts that a repository whose read failed is drawn as `sessions.ch_norepo`.
  - Given the new field, that is the defect named above encoded as the expected result.
  - The minimum repair inside this step is `repository: false` on those two fixtures, which the brief allows ("a session view test only if the new field breaks a fixture").
- **`tests/browser/repositories.spec.ts:187`.** The new case's `mkdtempSync('oculus-repositories-fresh-')` is never removed. Six such folders are now in `$TMPDIR`. The file's older cases (`:125`, `:135`) leak the same way.
- The browser case proves that a no-commit repository is listed and drawn. It does not prove the picker filter change: under revert C the no-commit repository still has `error === null` and is still listed. The node view and state tests do prove the filter.

## 3. Standards
- **One call site.** `git.ts:325` holds the only `spawnSync`, with list arguments and a timeout. Nine `run(root, [...])` vectors match the head comment at `git.ts:9-17`.
- **Read-only gate.** `symbolic-ref` and `worktree` are pinned in the source and at run time. `branch` is not pinned at run time (`['branch', BRANCH_FORMAT]`), and `FORBIDDEN` only catches the literal `'branch -'`. Two comments are false as a result:
  - `tests/server/git.test.ts:8-11`: "must be nothing but the read-only commands, each subcommand with a writing form of its own only in its reading form". `branch` has writing forms (`branch <name>`, `branch -d`) and is not held to a reading form.
  - `tests/server/git.test.ts:50-52` (`PINNED` doc): "The one form each subcommand with a writing form of its own may take". It pins `rev-parse`, which has no writing form, and omits `branch`, which has several. The test title at `:481`, "each pinned to its reading form", has the same problem.
- **`src/lib/data/model-sessions.ts:348-351`.** "false for a folder that is none and a directory that does not exist" is incomplete: `repository` is also false for a repository whose `--git-dir` read timed out or failed (probe below).
- **No package ids or dates** in the changed comments. The fixture dates in `tests/views/repositories.test.ts:56,62` were there before this step.
- **File sizes.** The largest is `tests/server/watch/git.test.ts` at 710 lines; all are under 1000.
- **DESIGN.md.**
  - `DESIGN.md:165`, "Exactly seven read-only commands", is false after this change. That is expected under decision 2, so it needs a booking.
  - The builder's replacement, "Exactly nine read-only commands", matches `git.ts:9-17`. Those are nine command forms over eight subcommands, so the count is true as written.
  - `HELP.md:140` ("that git reads as a repository") and `HELP.md:86` stay true.
- **Wording now visible on a no-commit repository.** `config/text/views/repositories.yml:5`, `branches_empty: git named no branch here.`, is drawn there, although git did name a branch (`start`) that has no commit yet. The sentence was already in the catalog, but this step makes it reachable.

## 4. Behaviour
Every "Before" and "After" below comes from real scratch repositories, served through the browser layer's `serve.ts` on 8792, using my reviewer probe spec in scratch copies. The base build is the worktree diff reversed and rebuilt; the after build is the worktree tree. Both were run through `bash pw.sh ... zz-q44-probe.spec.ts`. Screenshots are in `scratchpad/q44-review/shots-{base,after}/`.
- **Picker, for the roots demo, pfresh, pcorrupt, pparent/psub, pplain and pvanish.**
  - Before: `["demo","psub","pvanish"]`.
  - After: `["demo","pfresh","pcorrupt","psub","pvanish"]`.
- **No-commit repository (`pfresh`: one staged and one untracked file).**
  - Before: not in the picker.
  - After: drawn with "branch start", "in step with the upstream", Staged `staged.txt A`, Untracked `loose.txt ?`, "No commit has been made here yet.", Branches 0 "git named no branch here.", the New branch control, and the .gitignore worktree warning.
  - New branch there fails in git (`fatal: not a valid object name: 'start'`, run in git directly). New worktree succeeds as an orphan branch ("No possible source branch, inferring '--orphan'"). I did not press either through the UI.
- **Corrupt index (`pcorrupt`).**
  - Before: not in the picker.
  - After: the picker names `pcorrupt` and the view draws one red row, "git could not read this repository: .git/index: index file smaller than expected", with no branch line.
  - After the index was rebuilt in the scratch repository (`git reset`), the view redrew its sections within 6 s while staying on `pcorrupt`.
- **Subfolder of a committed repository added as a root (`psub`).** The same before and after: listed as its own repository, showing the parent's untracked `top.txt`. A subfolder of a no-commit repository is now listed where it was not before (`fresh/sub`, node probe).
- **Plain folder.** Not listed, before and after.
- **A root that disappears (`pvanish`, deleted while shown).** The same before and after: after 6 s the picker drops it and the view shows `demo`.
- **Newly listed with a permanent error row (node probe `probe.mts` over `statusFor` and `repositoryRoots`).**
  - A bare repository root and a `.git` folder root now get `repository: true` with the error "this operation must be run in a work tree".
  - A HEAD pointing at a missing object gives `repository: true` with the error "bad object HEAD".
  - Before, all three were left out of the picker.
- **A `--git-dir` timeout.** I ran a git wrapper that sleeps on one argument, with `statusFor(roots, 500)`.
  - Sleeping on `--git-dir`: `{"repository":false,"error":"git timed out"}` for both repositories, the picker is `[]`, and the view kept on `full` shows nothing.
  - Sleeping on `--porcelain=v1`: `repository: true`, both stay in the picker, and the view stays on `full`.
- **Cost of the extra `rev-parse --git-dir`.** I timed `timing.mts`: the demo roots as the browser layer serves them (the committed demo copy plus the two configured roots, which do not exist there), base and Q44 interleaved, 5 warm-up reads.
  - 200 reads: base median 101.2 ms (mean 146.5) against Q44 median 113.8 ms (mean 149.6).
  - 300 reads: base median 107.2 ms (mean 149.0, p90 267.2) against Q44 median 121.2 ms (mean 162.7, p90 280.8).
  - One `rev-parse --git-dir` alone: median 6.63 ms, p90 8.41 (300 calls).
  - So each read of a repository root costs about 7 to 14 ms more, roughly 12% of the demo's read. The machine's load average was 16 to 19, so these numbers are noisy.

## Not checked
- The Sessions Changes panel over a no-commit repository or a repository whose read failed, in a served build. I read its code only.
- Pressing New branch or New worktree on a no-commit repository through the UI.
- Whether `files.spec.ts:403` also fails intermittently on main.
- Read cost on a large real repository or a slow mount.
- The browser probe made its scratch repositories under `$TMPDIR` rather than the scratch folder, because they are added through the served app's add-root form. They were removed afterwards.

Reviewer usage: about 45 tool uses, about 32 minutes.
