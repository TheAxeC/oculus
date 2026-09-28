# Step Q93 refuter report (on .agents/worktrees/Q93, base 7bb7d2bc)

## Verification (rerun by the reviewer)

```
$ uptime   (before)  1:52  up 2 days,  3:58, 1 user, load averages: 6.91 8.40 8.55
$ /usr/bin/time -p sh ~/.claude-work/skills/land/templates/verify.sh .../orchestrator-state.md   (from .agents/worktrees/Q93/tools/oculus)
 Test Files  339 passed (339)
      Tests  5300 passed (5300)
   Duration  76.99s (transform 11.08s, setup 0ms, import 63.52s, tests 215.28s, environment 73ms)
1790553261731 COMPLETED 1427 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
(npm run build: no RED line, so exit 0)
All matched files use Prettier code style!
(npm run lint: no RED line, so exit 0)
RED: LC_ALL=C grep -rna '[^ -~]' src tests
exit status: 1
real 149.98
$ uptime   (after)   1:55  up 2 days,  4:01, 1 user, load averages: 7.51 8.42 8.56

$ LC_ALL=C grep -rna '[^ -~]' src tests        -> no output, exit 1
$ spec.md's perl ASCII gate over src tests bin config -> no output, exit 0
Case 1: grep -rn -E '^[[:space:]]*// revert:' src tests bin | wc -l -> 0
Case 2: ls bin/revert-check tests/browser playwright.config.ts bin/migrations/revert-anchors.mjs
  ls: bin/migrations/revert-anchors.mjs: No such file or directory
  ls: bin/revert-check: No such file or directory
  ls: playwright.config.ts: No such file or directory
  ls: tests/browser: No such file or directory
Case 3: grep -rn -i -E 'playwright|revert-check|...|browser spec' src tests bin config DESIGN.md HELP.md README.md demo eslint.config.js vite.config.ts package.json .gitignore -> no output, exit 1
Case 4: grep -c -i playwright package-lock.json -> 2 (package-lock.json:4178 and :4198, vitest's "@vitest/browser-playwright" under peerDependencies / peerDependenciesMeta)
Case 5: grep -n 'revert' tests/checks/source/comment-width.test.ts -> no output, exit 1
Item 8: sh bin/scratch-count.sh
  uptime 1:55 load 6.66 8.18 8.48
  node before 0
  the node suite is red; the count below is still the count
  node after 0
  real 91.43 / exit 1
  uptime 1:57 load 10.28 9.23 8.86
  second run: uptime 1:58 load 8.85 -> node before 0 / the node suite is red; ... / node after 0 / exit 1 / uptime 2:00 load 19.08
  the same npm test under TMPDIR=/tmp/oculus-count-XXXXXX, output kept (load 18.75 -> 17.82):
   × cuts every list it publishes at the cap 9438ms          (tests/server/core/git.test.ts)
   FAIL  tests/server/git/git-ops.test.ts  Error: Hook timed out in 10000ms.
   Test Files  2 failed | 337 passed (339) / Tests  1 failed | 5299 passed (5300) / Duration 174.64s
  the same under npx vitest run --reporter=dot (load 9.62): Test Files 339 passed (339), Tests 5300 passed (5300), Duration 69.61s, exit 0
Sweep check: 184 files had directive lines at base (git grep -c over tests minus browser and revert-*), 1400 lines at base, 1400 directive lines removed by the diff; 138 files change only by removed directive lines (0 added, 0 other removed); the other 46 carry the comment edits read below.
Premise 5: git ls-tree -r 7bb7d2bc tools/oculus/tests/browser | wc -l -> 78; 78 deletions under tests/browser in git status.
```

Why the verify runner shows RED: `grep` exits 1 when it finds nothing, and the runner treats any non-zero exit as a failure. The last command in the verify list at `orchestrator-state.md:12` is therefore red whenever the tree is clean. This is a fault in the list, not in the step: the grep printed nothing. It will be red on main too until the list is written as `! LC_ALL=C grep -rna '[^ -~]' src tests`.

Why `scratch-count.sh` is red: two unit tests timed out while the machine was loaded (load average 9 to 19). Both files, `git.test.ts` and `git-ops.test.ts`, were only changed by the directive strip. A third run at load 9 passed. The builder's green `node before 0 / node after 0 / exit 0` did not reproduce on this shared machine. I cannot tell whether the step has anything to do with it.

Sample of the mechanical sweep, read in full. Each file's hunks remove only `// revert:` lines, with no neighbouring line touched:
1. `tests/checks/bin/cited-lines.test.ts`
2. `tests/checks/tree/audits.test.ts`
3. `tests/routes/page.test.ts`
4. `tests/server/files/ignored.test.ts`
5. `tests/server/root/watch/local.test.ts`
6. `tests/state/boards/board/board-docs.test.ts`
7. `tests/state/feeds/radar.test.ts`
8. `tests/state/sources/follow.test.ts`
9. `tests/state/workbench/layout/nested.test.ts`
10. `tests/views/boards/focus.test.ts`

## 1. Spec

- **`demo/hpc/batch.txt`, `demo/hpc/quota.txt`, `demo/sessions/claude/projects/demo-hub/0f2c1a64-....jsonl` deleted, and the paragraph at `demo/README.md:9` deleted with them.**
  - This is outside the brief's paths, and no item asks for it. The report names it as decision 3.
  - Reachability check, which passes. At base, only three test files and the README named these files: `git grep 'demo/hpc|demo/sessions|batch\.txt|quota\.txt|sessions/claude|0f2c1a64' 7bb7d2bc` finds only `tests/browser/helpers/serve.ts:16,225-229`, `tests/browser/views/hpc.spec.ts:2-3,13`, `tests/browser/workbench/sanitise.spec.ts:8` and `demo/README.md:9`.
  - After the step, nothing in `src`, `tests`, `bin`, `config`, `vite.config.ts`, `HELP.md`, `DESIGN.md`, `README.md` or `demo` names them.
  - No config key builds a path into the hub that could reach them:
    - Session stores take `account.dir` from `local.yml` or from home (`src/lib/data/sources/config/local.ts:120-131`), joined with `projects` or `sessions` (`src/lib/server/sessions/folders.ts:56-58`).
    - The HPC poller runs `spawn('ssh', ...)` on PATH (`src/lib/server/machine/hpc/ssh.ts:32`).
  - Nothing reaches these files. The deletion still needs the orchestrator's yes, since it is outside the brief.
- **`tests/fixtures/scratch.ts:6-7` rewritten**, outside the path list. The edit is correct: the old sentence "a browser spec calls test.afterAll(sweepScratch)" is false after the step. It is out of scope only.
- **`tests/ui/colours.test.ts:577-607`: the case's `write` closure became `plantScratch(...)`.** No item asks for this.
  - Check that it plants the same files and expects the same findings, which passes. I pulled out every string literal of the case before and after the change: the eight planted paths and their bodies are identical, and the expected `findColourViolations` list has no hunk in the diff.
  - The per-file "inside the directory" assertion is now the refusal inside `plantScratch` (`tests/fixtures/scratch.ts:36-38`).
  - The `tmpdir` assertion now comes after the writes. No write can precede that check, because `scratchDir` throws before returning a directory outside tmpdir (`tests/fixtures/scratch.ts:20-22`).
  - The change is sound, but out of scope.

## 2. Proof

- **Report, point 4, "Deleting the directives uncovered a real duplicate".** The report quotes no failing output from `tests/checks/tree/duplication.test.ts`. The claim that the check went red before the colours fold is unreproduced.
  - What I could reproduce: at base, `tests/checks/tree/boundaries.test.ts:397` held a directive with `'views/shared/**'`.
  - `meaningful()` at `tests/checks/tree/duplication.test.ts:102-106` opens a block comment at any `/*`, including one inside a `//` comment or a string.
- **Report DONE row for `sh bin/scratch-count.sh` ("node before 0, node after 0, exit 0").** Not reproduced: exit 1 twice under load, as shown above.
- **Report, "The exact 80-test difference is not reconciled".** The builder left an unexplained count, and I could not reconcile it either. Counting `it(` / `test(` lines at base in the four deleted vitest files gives 41 + 17 + 7 + 14 = 79.
- **Report DONE row 5, lock file.** The brief expected `0`; the result is `2`. The two lines are vitest's own optional peer metadata (`package-lock.json:4178`, `:4198`), and the diff removed `@playwright/test`, `playwright` and `playwright-core`. The brief's expected value was wrong; the step is right.

## 3. Standards

- **Head comments made false by the strip (spec.md:57).** Several cases stated their revert only in the deleted `// revert:` line and carry no prose `Revert:`. I counted, at base, cases with a directive and no prose `Revert:`:
  - `tests/views/sources/repositories/repositories.test.ts:4`, "Each case names the change that turns it red.": 37 cases now name nothing.
  - `tests/state/sources/repositories/repositories.test.ts:109-110`, "Each case names the change to state/sources/repositories/repositories.ts that turns it red.": 47 such cases in the file.
  - `tests/state/sources/fs.test.ts:544-546`, "Each case names the line of state/sources/fs.svelte.ts that turns it red.": the cases that were at base lines 551, 570, 586, 604 and 618 now name nothing.
  - `tests/state/sources/explorer.test.ts:73`, "Each case names the change to state/sources/fs.ts that turns it red.": 'closes only the folders under the followed folder...' and 'reads the two toggles an instance keeps...' now name nothing.
  - `tests/views/sources/files/files.test.ts:8`, "Each case written for the explorer names the change that turns it red.": three cases lost their only statement, 'says why the workspaces could not be read...', 'draws no workspace row at all over a read that failed...' and 'carries the control that reads it again...'.
  - Either each case gets a prose `Revert:` (the Decision 1 form), or the sentence goes.
- **Two-line browser-suite pointers missed.** Case 3's grep passes only because the phrase is broken across two lines:
  - `tests/state/sources/files.test.ts:6-7`: "and the view drawing the rows, which is the browser / suite's."
  - `tests/routes/page.test.ts:6-7`: "What it does on screen is the browser / suite's."
  - Both are Decision 2 cases and are unchanged.
- **`.prettierignore:10-12`:** "...which is what tests/data/demo-hub.test.ts and the browser specs read." This is false after the step. `.prettierignore` is outside the brief's grep and its path list, but spec.md:57 makes it the change's defect.
- **`tests/state/workbench/drag.test.ts:9`:** "A drag is exercised in a browser after this package lands." This is history ("after this package lands") and a pointer to a browser run that no longer exists. The builder kept it under its decision 4.
- **"Checked in a browser" phrases kept under the builder's decision 4.** Before the step these meant the browser suite; after it, no automated check runs them:
  - `tests/ui/primitives.test.ts:7`, "the interactions are checked in a browser"
  - `tests/shell/panes/splitview.test.ts:8`
  - `tests/shell/workbench.test.ts:10`
  - `tests/views/boards/focus.test.ts:219`
  - `tests/views/boards/projects.test.ts:9`
  - The look at landing is an orchestrator's look, not a check. Rewording them in the Decision 2 form ("needs a DOM and is not run here") would match the rest of the step. This needs the orchestrator's ruling.
- **`tests/checks/tree/allow-duplication.txt`, 82 of 663 reasons now point at wrong lines.** The file's own header (`:5-6`) says "The reason says where the first shared window sits, so a reader can go to it."
  - I counted entries whose "at X and Y" falls after a hunk the strip removed.
  - Example: the `tests/views/sessions/sessions.test.ts` side of several entries is off by 14 lines.
  - The file is in the step's paths, and the report names this as a sharp edge left unfixed. That is a shortcut.
- **Duplication-check defect, named and left unfixed** (`tests/checks/tree/duplication.test.ts:102-106`).
  - Any `/*` in a line opens a block, including inside a `//` comment or a glob string. It is still live, for example at `tests/checks/tree/boundaries.test.ts:24` ("ending in /**") and `:87` (`'ui/**'`), so parts of files are unread by the check.
  - The defect predates the step and is a different concern, but the step's verification relies on this check. It needs a disposition: a fix at landing, or booked.
- **Pre-existing history comments.** `src/lib/server/machine/pty/channel.ts:371` and `src/lib/views/sessions/terminal/Terminal.svelte:301` ("the first Chrome check") were not touched by the step. They are not a finding against it and are listed for the record.

## 4. Behaviour

- None. The `src` hunks are comment-only (`html.ts`, `newest.ts`, `args.ts`, `folder.ts`, `MenuList.svelte`, read in full), and `channel.ts` is unchanged.
- The report states both reader-visible changes: `npm run test:browser` is gone, and the demo hub no longer carries the `hpc/` and `sessions/` fixtures.

Nothing else reaches Playwright or `tests/browser` (passes):
- A grep for `playwright|tests/browser|test:browser|revert-check` over `package.json`, `vite.config.ts`, `tsconfig.json`, `.prettierignore`, `eslint.config.js` and every script under `bin` prints nothing.
- A whole-worktree `git grep` outside `.scratch` and the lock file prints nothing.
- `vite.config.ts:32` includes `tests/**/*.test.ts` only.

## Not checked

- Why the unit count dropped by 80 tests. Reconciling it needs the base suite run, which I did not do.
- Whether the duplication check was red before the colours fold. I did not revert the fold, as a reviewer makes no edit.
- Whether `npx prettier --write` over the stripped files changed nothing, as the report says. `format:check` passes on the result.
- Whether `scratch-count.sh` is green on an idle machine.
- Unrelated to the step: the full run left `outside.md` and `node-compile-cache` at the root of the private TMPDIR. `scratch-count.sh` counts only `oculus-*` folders, so it does not see them. I did not trace which test writes `outside.md`.

Reviewer usage: tokens not measured, about 45 tool uses, about 25 minutes.
