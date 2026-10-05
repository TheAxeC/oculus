# D20 refuter report

Reviewer a4074e57a1552c160, claude-opus-5-5, ordo-high (stopped by the orchestrator by mistake and resumed): 167,719 tokens, 110 tool uses, 22.1 min (completion notice of the resumed run). Worktree `.agents/worktrees/D20`, base 16b31cef0.

Not done or not met, first: the tests of G38 to G41 are not written; Z515 (1)'s record of layout writes per browser tab is absent; five tree checks fail on D20's own lines (layer boundaries, import order, duplication, two comment-width rows), which `test:quick` does not run, so the landing list would be red; a clean-tree commit answers "On branch main"; a cancelled merge is left mid-merge with nothing on the page saying so.

## Verification

`npm run diagrams`, then `checks.sh`: `test:quick: 33.1 s (limit 45.0 s); every command passed`, `checks: 1 commands passed` (not covered: tests outside the selection, tests/checks, slow tests). Each named test file passes alone. Tree checks alone: comment-width FAIL (`running.ts:67`, `git-routes.ts:209`, `Terminal.svelte:23,29`, `start/Composer.svelte:10`, `tests/routes/git/git.test.ts:81`); boundaries FAIL (`composer.ts` imports `data/shapes/task-ref` and `data/sources/config/catalog/agent-confirm`; `Collection.svelte`, `task-card.ts`, `focus/rows.ts` import `data/model`); imports/order FAIL (`server/machine/seeds/task-seed.ts:25` imports `server/edit/writes/entries.ts`); duplication FAIL (`CommandCenter.svelte:241` and `Tasks.svelte:59`, new; `ChangesRepo.svelte:29` / `ChangeGroups.svelte:43` also at base); the other tree checks pass. `folder-check.sh` exit 0; ASCII scan clean. Seed builder over the real hub read-only, the terminal route over a scratch hub with a recording fake tmux, the git route over scratch repositories (case 47's seven classifier rows; a 12 s hook commits; Cancel during a `sleep 600` hook ends it, no `index.lock`; clean-tree commit `400 {"error":"On branch main"}`; a merge cancelled in its hook leaves `MERGE_HEAD` and `A  b` staged), the piecewise read (cases 29 to 35; a 629,146,085-byte file, 324,443 turns, 5035 ms, rss 276 to 736 MiB) and case 36 (300 random transcripts, 0 differ) were rerun.

## Verdicts

Items 1.1-1.8, 2.1-2.3, 3.1-3.2, 4.1-4.2, 5.1-5.2, 6.1, 7.2-7.5, 8.1-8.3, 9 hold (1.x with Standards 3.1 and 3.2); 7.1 holds with Spec 1.6 and Behaviour 4.1; 8.4 violated (Standards 3.7). Cases: 1-22, 24-27, 29-36, 40-42, 44-63 met (some on the builder's quotes, the probes under `$TMPDIR/d20build` being gone); 23 partial (the New half owed to Z515 (2)); 28a, 37-39, 43, 64 and the look halves not verifiable here.

## Findings

Spec
1.1-1.4. G38, G39, G40, G41: no test exists (`grep -n "seed\|confirm" tests/routes/sessions/compose.test.ts` prints nothing; `tests/server/sessions/transcripts.test.ts` does not exist; `grep -rn "classifyFailure\|shortReason" tests` prints nothing). G41's Code line names `run.ts`, but `shortReason` lives in `parse.ts`.
1.5. Z515 (1): no record of layout writes per browser tab in the diff.
1.6. `parse.ts:646-648` takes the last `fatal:` line where item 7.1 says stderr's first line; disclosed as a judgment call.

Proof
2.1. `tests/routes/git/git.test.ts:115,121` poll with a 500 ms wall-clock `vi.waitFor` against spec.md's Tests rule.
2.2. `D20-report.md:354` says `--abort` and `worktree remove` have no limit; `git-write.ts:691-692,811` keep 10 s.
2.3. `D20-report.md:369` says No "leaves the worktree made"; nothing is made before yes.
2.4. The report states no tree-check result, five of which are red.

Standards
3.1. Layer boundaries broken by five imports (above). 3.2. Import order: `task-seed.ts:25`. 3.3. Duplication: `CommandCenter.svelte:246-248` and `Tasks.svelte:64-66`. 3.4. Six comment lines over 100 columns. 3.5. `repo-menu.ts:5` paragraph not rewrapped. 3.6. `repositories.svelte.ts:43-47`: `BranchDeletion` lost its doc comment to `WorktreeStart`. 3.7. `DESIGN.md:122` "the size of the file bounds nothing" is false for memory. 3.8. `task-seed.ts:153` "does not holds it".

Behaviour
4.1. A clean-tree commit answers "On branch main"; git's reason is stdout's last line.
4.2. A cancelled merge or cherry-pick is left in progress and the answer says only "Git was stopped by Cancel"; the cherry-pick's in-progress check is skipped after a cancel.
4.3. `ToolButton.svelte:210-211,374-375`: the pressed bare rule's outline equals the focus ring.
4.4. `running.ts:53-65` `killWithDescendants`: Cancel, a timeout and an output-limit kill end every descendant of git and `gh`, beyond Z519's "Cancel ends oculus's own git process"; one `ps` read, a child started after it or detached by `setsid` is missed.

## Declined to judge

The look halves; the cases resting on the builder's gone probes; the 600 MB export and the route's 1508 MiB peak; the builder's breaches (two read-only `git status`, one `tmux ls` on the default socket that printed Axel's session names); the files outside the write list (judged acceptable); `readTurns` holding every turn (not a defect inside the brief, item 8.2 keeps it; DESIGN.md overstates it). The reviewer's own departures: one `git show`, git inside scratch repositories, `npm run diagrams`, probe scripts in its scratchpad, tree-check files run alone.
