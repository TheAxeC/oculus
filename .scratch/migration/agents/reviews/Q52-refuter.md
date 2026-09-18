# Review: Q52, one branch-state rule for the two git views

Reviewer a966a73bca89c9035, claude:opus, read-only, 07:00 to 07:16. Worktree `.agents/worktrees/q52`, base `66e22825`. Nothing in the worktree was edited; every revert, the boundary experiment, the naming experiment and the probe ran on a copy, restored to byte-identity after each, and `git status --short` with `git diff --stat 66e22825` (13 files, 272 insertions, 68 deletions) is identical to the reading at the start.

## Verification, rerun

```
npx vitest run --reporter=dot     Test Files 251 passed (251) / Tests 4282 passed (4282) / 38.43s
npm run check                     COMPLETED 1223 FILES 0 ERRORS 0 WARNINGS
npm run build                     exit 0, built in 9.03s
npm run format:check              All matched files use Prettier code style!
npm run lint                      no output
the ASCII gate                    printed nothing, exit 0
python3 yaml.safe_load changes.yml  exit 0
npx playwright test repositories changes   11 passed (45.0s)
npx vitest run tests/server/git.test.ts    35 passed (35)
```

All four numbers the report names reproduce.

**The six reverts**: A gives 3 node and 2 browser red; B 1; C 2; D the server case and the browser case, with `tests/views/changes.test.ts` staying green; E 3 node and the new browser case; **F green** (see Proof 1).

**The boundary check**, run to test the report's item 1: with `branch-state.ts` at `views/sessions/` and imported by `Repo.svelte`, `tests/boundaries.test.ts` fails with `views/repositories/Repo.svelte imports views/sessions/branch-state`. The rule does forbid the brief's own instruction. `views/shared/` already holds five `.ts` rules, and no importer of the deleted path is left.

**The naming check**: renaming `rowLabel` to `sentence` makes `tests/keys.test.ts` fail with `lib/views/repositories/Repo.svelte: sentence(shape, git)}`. The claim holds, no check was loosened, and the rename hides no finding.

**`GitState.present` for every path, probed against `statusFor` and `repoShape` on real scratch paths:**

```
a regular file:                    present=false repository=false error="no such directory"   shape=missing
a dangling symlink:                present=false repository=false error="no such directory"   shape=missing
.git is a file (a worktree):       present=true  repository=true  error=null                  shape=readable
a dir under an unreadable parent:  present=false repository=false error="no such directory"   shape=missing
a dir with no permission:          present=true  repository=false error="cannot change to ... Permission denied"  shape=none
gone:                              present=false repository=false error="no such directory"   shape=missing
a plain folder:                    present=true  repository=false error="not a git repository ..."  shape=none
a timeout (1 ms):                  present=true  repository=true  error="git timed out"       shape=failed
```

## Spec

1. **The brief's item "the Repositories view follows the same fact" reaches no reader.** `src/lib/state/repositories.ts:97` filters by `repository === true`, and `present` is false only where `repository` is false, so `repoShape` inside `Repo.svelte` can answer only `failed` or `readable`. The two new branches of `rowLabel`, the muted half of the tone and the `data-repo="missing"` and `"none"` spellings are unreachable in the shipped app, and `tests/views/repositories.test.ts:203-219` asserts over a state the view cannot produce. What a reader sees for a root that goes away while it is the picked one: it drops out of `repositoryRoots`, `shownRoot` hands the view to `roots[0]`, and with no other repository the view draws "No repository is on the channel yet." The brief forbade `src/lib/state/`, so the step as briefed cannot close it. **Not booked anywhere.**
2. **The server sets the new fact at one of the two places the brief named.** `git.ts:121` takes `empty()`'s default; behaviourally identical except for the race under Behaviour 1.
3. No item marked DONE is absent from the diff, and the move of `repo-shape.ts` is forced by the boundary rule rather than a taken decision.

## Proof

1. **`tests/views/repositories.test.ts:606` names a revert that leaves its own case green.** Making exactly the change the comment names gives `27 passed`; the case reddens only when `rowLabel` and the tone go back too, because for every producible state `shape !== 'readable'` and `git.error !== null` are the same predicate.
2. **`tests/views/changes.test.ts:192-193` offers two reverts and the second leaves it green**: that test builds its state from the fixture, so the server is not in its path.
3. **The report describes the two document edits instead of carrying them.** Brief decision 2 reserves `HELP.md` and `DESIGN.md` on the condition that the report carries the exact lines; neither sentence is given, so the landing has nothing to paste.
4. Everything else reproduces, including `grep -rn data-repo-failed` finding none and `grep -rn branchState src` giving one definition and two readers.

## Standards

1. `src/lib/server/git.ts:92` is 138 columns in a file whose comment block wraps at 100; Prettier does not reflow a comment, so `format:check` passes over it.
2. `tests/browser/changes.spec.ts:1-5` is a head comment left half-rewrapped, with a sentence orphaned mid-line.
3. **`DESIGN.md:340` is made false in three ways** and is the only stale hit of the deleted path: it names `views/sessions/repo-shape.ts`, says the panel draws five, and says the Repositories view's second copy of the branch line is Q52. `HELP.md:105` lists four sentences and not the new one.
4. **Two catalog keys spell one sentence**: `config/text/views/repositories.yml:25` `error` and `config/text/views/changes.yml:45` `ch_failed` are byte-identical, while the Repositories view reads `sessions.ch_nofolder` and `sessions.ch_norepo` for its other two sentences. One vocabulary holds for the attribute and not for the sentence.
5. `DESIGN.md:334` contradicts both `state/repositories.ts:97` and `DESIGN.md:319`. Pre-existing, raised by the report, not booked.
6. Clean: the ASCII gate, no history in any added comment, both new modules' head comments, and every file under its limit.

## Behaviour

1. **A root that goes away between the directory check and git's answer is drawn as "This workspace is not a git repository."** `statSync` succeeds, `rev-parse` prints `fatal: cannot change to '<path>': No such file or directory` and exits 128, which `run()` classes as answered, so `git.ts:121` returns `empty(text)` with `present` true. The window is short and it is the exact confusion the step exists to end. Not in the report.
2. **Three paths that exist read as "This workspace folder is not there."**: a regular file, a dangling symlink, and a directory whose parent denies traverse. For the third the folder is there and the sentence is false. Not in the report's before-and-after.
3. A directory the reader has no permission on reads `ch_norepo` with the permission error only in the title. Unchanged by the step, not stated.
4. A worktree whose `.git` is a file, and a timed-out check, are unaffected.
5. The Repositories view's reachable behaviour changes in two ways only, the branch line and the attribute name.
6. **A sentence-for-sentence difference remains**: for `missing` and `none` the Changes panel puts git's reason in the title and the Repositories row carries no tooltip. Unreachable today; real the moment Spec 1 is closed.

## Not checked

The look on the TEST page (the orchestrator's); the full Playwright suite; a second full node run for flakiness; per-file added and removed counts; the Repositories view against a root deleted mid-session in a browser; the reachability of the `unplaced` and `reading` shapes inside `Repo.svelte`.

Reviewer usage: 25 tool calls, 07:00 to 07:16.
