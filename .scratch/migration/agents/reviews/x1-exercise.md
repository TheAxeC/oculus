# X1: the execution exercise of the plan-orchestration skill

Run on 2026-09-11 by the orchestrator (Claude Fable 5.1 under Claude Code) on a disposable repository under the session's scratch folder, `x1-repo`, with a Codex worker `gpt-5.6-sol` at effort high, `codex-cli 0.154.0`. The repository holds one tool, `tools/toy` (a Python module `toy.py`, `tests/test_toy.py`, `README.md`), and a ledger `tools/toy/.scratch/exercise/` created from the skill's four templates. Three trivial packages, one per scenario: T1 adds `slug(text)`, T2 adds `wrap(text, width)`, T3 adds `count_words(text)`. The verify list: `python3 -m unittest -q tests.test_toy` and `! LC_ALL=C grep -rna --exclude-dir=__pycache__ '[^ -~]' toy.py tests README.md`, from `tools/toy`. Every command below was run; every outcome is what the command printed.

## Scenario 1: a normal landing (T1)

Commands, in the skill's order:

```sh
git commit -q -m "Prepare T1" ...                              # brief by path; base dbe7820
git worktree add -q -b t1 .agents/worktrees/t1 dbe7820
git commit -q -m "Dispatch T1" ...                             # the dispatch block, pid none
nohup sh -c 'codex exec -C <worktree>/tools/toy -s workspace-write -c sandbox_workspace_write.network_access=true -c model_reasoning_effort="high" -m gpt-5.6-sol -o report.md --json - < prompt.md > events.jsonl 2> stderr.txt; echo "exit $?" > exit.txt' &
echo $! > pid.txt                                              # pid into the block, committed; thread id from events.jsonl into session_id, committed
(cd <worktree> && git add -A tools/toy && git commit -q -m wip)   # d8ab5b9, 3 files +27
git cherry-pick -n dbe7820..t1                                 # clean
(cd tools/toy && python3 -m unittest -q tests.test_toy)        # OK, 6 tests
git commit -q -m "Add slug to the toy tool" ...                # by path
git worktree remove .agents/worktrees/t1
git branch -d t1                                               # REFUSED: "the branch 't1' is not fully merged"
```

Outcome: the worker's report passed its bar on the first read (three files changed, `SlugTest` with five methods, the README bullet in form); 235 s, 276,343 input tokens of which 244,864 cached, 9,422 output; zero fixes at landing.

Two rules failed in the landing:

1. **Step 15, `git branch -d` cannot delete a cherry-picked branch.** The package lands as a new commit on main, so the worktree branch's wip commit is never an ancestor of main and git refuses `-d` as "not fully merged". The hub's own permission file already allows `git branch -D *`, which is how the hub's packages were deleted, but the skill never said `-D`. Corrected in the skill: step 15 names `git branch -D <package>` and says why.
2. **Step 14 has no check that the commit carried the ledger.** The orchestrator's `git add` of the path list failed (the orchestrator's shell did not split a variable holding the list, so git saw one path with newlines in it), the commit ran on the index the cherry-pick had left, and main's head then carried the package with its booking only in the working tree, the state the handoff section says never exists. The resumption rule covers a booking in the working tree with the package still staged, not a booking in the working tree with the package already at head. Corrected in the skill: step 14 lists the paths literally in the `git add` command (never through a shell variable) and, after the commit, checks `git status --short` for anything of the ledger's; a ledger file still modified means the commit missed the booking, and the head is amended with the ledger paths (`git commit --amend --no-edit`, safe since nothing is ever pushed) before anything else. The resumption rule names that shape too. Repaired in the exercise by that amend (head de9b862).

## Scenario 2: a repair round and a second landing attempt from the recorded base (T2)

The first report passed its bar (six items met, 11 tests, no `textwrap`, ASCII clean). The repair round was built on the one decision the worker had flagged as reversible, which the orchestrator reversed (the empty-string case shared a test method with the whitespace-only case), plus one thin test (the "width below 1" rule tested only at 0). Commands:

```sh
codex exec resume <thread id> -c 'sandbox_mode="workspace-write"' -c 'sandbox_workspace_write.network_access=true' -c 'model_reasoning_effort="high"' -m gpt-5.6-sol -o repair-report.md --json - < repair-prompt.md   # from inside <worktree>/tools/toy, detached the same way
(cd <worktree> && git add -A tools/toy && git commit -q -m wip)   # f9b8847, 3 files +45, one commit for both rounds
git cherry-pick -n ee269ff..t2                                 # first application, clean; verify on main: OK, 12 tests
ls .git/CHERRY_PICK_HEAD .git/sequencer                        # neither exists after a clean -n; git status reports no operation in progress
git restore --staged --worktree -- tools/toy/README.md tools/toy/tests/test_toy.py tools/toy/toy.py   # the step 12 take-out; index empty, 6 tests, the state file edit and the untracked T3 brief untouched
git cherry-pick -n ee269ff..t2                                 # second application from the recorded base, clean; verify on main: OK, 12 tests
git add -- <the three package paths> <plan.md> <orchestrator-state.md>; git commit ...   # cace8fb; git status --short shows only the untracked T3 brief
git worktree remove .agents/worktrees/t2 && git branch -D t2
```

Outcome: the repair round resumed on the same thread (its event log opens with the same `thread_id`), changed only the test file, and passed both checks; the resumed session cost 416,558 input tokens of which 394,368 cached and 7,762 output against 294,000 / 276,096 / 6,468 for the first run, so a repair round on Codex costs more than the first run in input (the whole transcript is replayed) and about as much in output.

Rules that failed or were missing:

3. **Step 10 has no recipe for going back to the same worker.** The launch section covers only a first dispatch. Corrected in the skill: a Codex worker is resumed with `codex exec resume <session_id> ... - < <repair prompt>` from inside the worktree's tool folder, with the sandbox and effort passed as `-c` overrides since the resume form takes neither `-C` nor `-s`; a native Claude worker is resumed with the runner's message tool on the agent id in `session_id`; a `claude -p` worker with `--resume <session_id>`. The repair round's own prompt, event log, report, exit file and pid go into the dispatch block under a `round` entry, so a resumption can tell a first run from a repair in flight.
4. **Step 10 does not name a reversed judgment call as a repair.** The spec's report shape asks the worker for every judgment call the brief left open "as a decision the orchestrator may reverse", but the repair list (an acceptance item not built, a test not written, a convention not met, a red check) has no entry for the orchestrator reversing one, and a test that covers a stated rule only at its boundary is not named either. Corrected in the skill: both are in the list, and both stay inside the brief.
5. **Step 12's take-out is the only way back after a clean `cherry-pick -n`.** A clean `-n` leaves no `CHERRY_PICK_HEAD` and no sequencer state, so `git cherry-pick --abort` has nothing to abort and `git status` shows no operation in progress; the only sign of a landing in flight is the staged package files plus `landing: cherry-picking` in the working-tree state file. The skill's `restore --staged --worktree` and `rm --cached` commands are right and were run; the skill now says why `--abort` does not apply here and what the resumption rule reads instead.
6. **Step 11's "a repair round adds a second such commit" holds only after a landing attempt.** A repair before the first wip commit (the order of steps 10 and 11) lands as one wip commit; the sentence now says so. The range `<base>..<package>` was exercised with one commit on the branch in every scenario; a two-commit range was not exercised.

## Scenario 3: a landing interrupted before its commit, and the resumption (T3)

The first report passed its bar (four test methods with the empty case on its own, 16 tests, ASCII clean). The landing ran through step 13 and stopped before step 14, which left: the three package files staged, `plan.md` and the state file modified in the working tree (the checkmark, the landing note, the usage row, the dispatch block cleared), the head at the session-id commit. The resumption then ran from the files alone:

```sh
git show HEAD:<state file> | sed -n '/^dispatch:/,/^```/p'     # the committed block: T3, worktree .agents/worktrees/t3, base eb36ae7, pid 86371, session id, landing: not-started
grep -n '^dispatch' <state file>                               # the working-tree copy: dispatch: none, the position note says T3 landed and the commit follows
cat <exit file>; ps -p 86371                                   # exit 0; the process gone: the worker finished
git status --short; git diff --cached --name-only              # the three package files staged, the two ledger files modified, no operation in progress
git diff -- plan.md                                            # the T3 checkmark, uncommitted
(cd tools/toy && python3 -m unittest -q tests.test_toy)        # OK, 16 tests, the checks re-run
git add -- <the three package paths> <plan.md> <orchestrator-state.md>; git commit ...   # 84cc2d9; git status --short empty
git worktree remove .agents/worktrees/t3 && git branch -D t3   # the path and the branch from the committed block, the working-tree block being cleared
```

Outcome: the rule for a landing interrupted between step 13 and step 14 identified the state correctly and the landing was finished without applying anything twice; 186 s for the worker, 134,834 input tokens of which 119,680 cached, 6,613 output; zero fixes.

Rules that failed or were missing:

7. **The resumption rule did not say which copy of the state file holds `landing`.** The marks of steps 11 and 13 are working-tree writes, so the committed block always reads `not-started`; a resumer reading `landing` from the committed copy and finding the exit file would resume at step 7 and land again onto an index that already holds the package. The working-tree copy holds the current `landing`, or the cleared block beside the booking once step 13 has run; the committed copy holds the identity, the worktree and the base, and is where the worktree path for step 15 comes from once the working-tree block is cleared. Corrected in the skill's resumption paragraph.

## What the exercise did not cover

- A red check on main after a landing (step 12's failure path): every check was green in every scenario, so the take-out was run as an exercise of its commands, not on a failure.
- A range of more than one wip commit on a branch; a conflict at the cherry-pick; a dead worker; a native Claude worker; the reviewer stage; a worker on `claude -p`; the `academic-paper` executor.
- The permission prompt on `git restore`: the command ran in this session without a prompt; whether the hub's ask list prompts for it under a different permission mode was not observed.

## Summary

Seven corrections to `.agents/skills/plan-orchestration/SKILL.md`, all in the dispatch block, the resumption paragraph and steps 10 to 15; the launch recipe, the brief shape and the ledger shape held as written. The Codex facts observed: `codex-cli 0.154.0`; `codex exec` runs in an untrusted directory without a prompt and loads only `~/.codex/AGENTS.md`; `codex exec resume <thread id>` continues a worker in place with the sandbox passed through `-c`; a `-s workspace-write` worker never ran a git command or wrote outside its worktree in three runs. The scratch repository with the three landed packages and its ledger is at the session's scratch folder under `x1-repo`, and the workers' prompt, event, report and exit files under `x1-runs/`; both are disposable.
