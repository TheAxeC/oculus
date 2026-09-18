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

---

# The run over repair round 1 (reviewer ab831a51ce633f000, 07:44 to 08:11)

```
npx vitest run --reporter=dot   1 failed | 4283 passed (4284), 48.31s; the one red is
                                tests/server/hpc/ssh.test.ts, green alone (5 passed)
npm run check                   COMPLETED 1223 FILES 0 ERRORS 0 WARNINGS
npm run build                   exit 0
npm run format:check            All matched files use Prettier code style!
npm run lint                    no output, exit 0
the ASCII gate                  printed nothing, exit 0
both catalogs                   parse, exit 0
npx playwright test repositories changes   11 passed (25.0s)
git diff --stat 66e22825        14 files changed, 401 insertions(+), 79 deletions(-)
```

Nothing in the worktree was edited; every revert, probe and catalog experiment ran on a copy, and the two git readings are identical to the start.

## The question the round turns on

**`GitState.present` over the eight shapes, the reviewer's own probe:**

```
1 regular file             present=true  repository=false shape=none    "cannot change to ...: Not a directory"
2 dangling symlink         present=true  repository=false shape=none    "... No such file or directory"
3 .git is a file           present=true  repository=true  shape=readable
4 under unreadable parent  present=true  repository=false shape=none    "... Permission denied"
5 no permission of its own present=true  repository=false shape=none    "... Permission denied"
6 nothing at the path      present=false repository=false shape=missing "no such directory"
7 plain folder             present=true  repository=false shape=none    "not a git repository ..."
8 timeout (1 ms)           present=true  repository=true  shape=failed  "git timed out"
```

Only shape 6 is `missing`, and the three the first review named now carry git's own reason.

**`exists()` per errno**: `ENOENT` and `ENOTDIR` answer false; `EACCES`, `ELOOP` (which never reaches it, since `lstat` reads the link itself) and `ENAMETOOLONG` answer true. `lstat` rather than `stat` is right: a link to a real directory is followed by git anyway and reads `readable`, and the dangling link is what `stat` would get wrong. `EPERM` could not be produced on this machine.

**The race, reproduced with the reviewer's own mechanism** (a `git` of its own first on `PATH` that sleeps a second, with a detached shell removing the root inside that window, no test hook): `present=false repository=false shape=missing`, and the reader gets "This workspace folder is not there." with git's line in the title. **The reverse race is not open**: a root created inside the window reads `readable`.

**The `between` hook** fires exactly once and disarms itself, cannot pass vacuously (making its act throw reddens the case), and revert F reddens that case and only that case.

## Spec

None. Each of the seven rulings is in the diff at the line the report names.

## Proof

1. **Revert B's count does not reproduce**: dropping the detached line reddens two, not one, the second being `tests/keys.test.ts > has a reader for every catalog key` over the orphaned `sessions.ch_detached`. The revert is real and its case is red; the number is one short.
2. **"No test needed a rerun alone this round" did not reproduce**: `tests/server/hpc/ssh.test.ts` was red under load and green alone.
3. Every other revert reproduces, counted over the whole suite: A 3 node + 2 browser, B 2 node, C 2 + 1, D 1 + 1, E 1, F 1, G 3 + 1, H 1.
4. The other numbers reproduce: 4284 over 251 files, `COMPLETED 1223 FILES 0 ERRORS`, `11 passed`, every file line count, and `grep -rn "repositories\.error\|data-repo-failed"` finding none.

## Standards

1. **A comment the diff makes false, outside the brief's paths**: `src/lib/server/watch/git.ts:202-204` says a deleted workspace gets "the empty shape statusFor gives a directory that is not a repository"; it now gets the `missing` shape with `present` false.
2. **One clause of `exists()`'s comment is not true of one errno**: `ENAMETOOLONG` is not a read that could not tell, and a path of that kind reads `present=true`.
3. `DESIGN.md:340` and `HELP.md:105` are still the old text, which decision 2 reserves on the condition the report carries the lines; the report now carries both, and the replacement paragraph was read against the code and holds. `DESIGN.md:334` is still wrong and still the orchestrator's.
4. The deleted key is honest in both directions: adding `error:` back unread reddens the keys check, and making `rowLabel` read it reddens the other direction.
5. Clean: no history in any added line; no added comment above 100 columns and the 138-column line is gone; every file under its limit; one `data-repo` vocabulary.

## Behaviour

1. **The report's before-and-after item 3 gives the round's own earlier version as its "before".** At the base, a regular file, a dangling symlink and a walled folder all already read "This workspace is not a git repository."; the only reader-visible change for them is the tooltip, which was `no such directory` and is now git's own line. Not stated.
2. The round's first version was worse than the base for two of those three paths, but the step has never landed, so no reader could reach it.
3. **A sentence still false, unchanged from the base and covered by no ruling**: a directory nothing may enter, a repository whose `.git` may not be entered, one with a broken `.git` file and one with a bad `.git/config` all read "This workspace is not a git repository." `present` is truthful for each; `repository` is not.
4. `ENAMETOOLONG`: `present` true for a path at which no name can exist, reachable only through a workspace string no real `cwd` can hold.
5. Everything else in the before-and-after reproduces.

## Not checked

The look on the TEST page; the full browser suite; `EPERM` from `lstat`; a `safe.directory` refusal; a second full node run; the Repositories view against a root deleted mid-session in a browser; the reachability of `unplaced` and `reading`; the timing of `exists()`, which the report itself states as unmeasured.

Reviewer usage: 51 tool calls, 07:44 to 08:11.
