# Step Q93 refuter report (on .agents/worktrees/Q93, base 6cf0b497)

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
Premise 5: git ls-tree -r 6cf0b497 tools/oculus/tests/browser | wc -l -> 78; 78 deletions under tests/browser in git status.
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
  - Reachability check, which passes. At base, only three test files and the README named these files: `git grep 'demo/hpc|demo/sessions|batch\.txt|quota\.txt|sessions/claude|0f2c1a64' 6cf0b497` finds only `tests/browser/helpers/serve.ts:16,225-229`, `tests/browser/views/hpc.spec.ts:2-3,13`, `tests/browser/workbench/sanitise.spec.ts:8` and `demo/README.md:9`.
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


## Repair round 1, refuted (reviewer claude:opus, a fresh agent, 2026-09-28)

## Verification (rerun by the reviewer)
- uptime before: `3:09 up 2 days, 5:15, 1 user, load averages: 14.22 12.64 9.28`
- `sh /Users/axelfaes/.claude-work/skills/land/templates/verify.sh .../orchestrator-state.md` from `.agents/worktrees/Q93/tools/oculus`, under `/usr/bin/time -p`, exit 0:
  - ` Test Files  339 passed (339)`
  - `      Tests  5301 passed (5301)`
  - `   Duration  95.63s (transform 24.86s, setup 0ms, import 80.16s, tests 260.46s, environment 70ms)`
  - `1790557901299 COMPLETED 1427 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
  - `built in 2.03s` / `built in 9.27s`
  - `All matched files use Prettier code style!`
  - no RED line
  - `verify: 6 commands passed`
  - `real 221.62`
- uptime after: `3:13 up 2 days, 5:19, 1 user, load averages: 6.83 10.99 9.47`
- The builder's report says command 6 was RED. That was true when it ran. The state file's verify item now reads `- "! LC_ALL=C grep -rna '[^ -~]' src tests"` (orchestrator-state.md:12), so the list passes on this tree. The report's NOT-done line is out of date. It is not a defect in the round.
- `npx vitest run tests/checks/tree/duplication.test.ts`: `Test Files 1 passed (1)`, `Tests 10 passed (10)`. This matches the report.
- `grep -rn -E '^[[:space:]]*// revert:' src tests bin`: no output, exit 1. This matches the report.
- Old logic in `node` (a copy of `meaningful()` with `line.indexOf('/*')`) over the new case's four lines: `old []`. With `blockOpens`: lines 2, 3 and 4. So the case fails without the fix, as the report says. With the comment line removed, the old logic still truncates line 2 at `'views/shared`, so the string half also discriminates.
- Same case, with only the `//` branch of `blockOpens` removed (`else if (one === '/' && line[at + 1] === '/') return -1;`): the result is the same lines 2 to 4, so the case stays green. On its own, `blockOpens` without that branch returns 13 for `// ending in /**`. See Proof.
- allow-duplication.txt, recomputed by a node port of `meaningful`/`copies`/`markOf` (scratchpad `dup.mjs`, allow list empty, first offset of each run) over every entry:
  - Round's list against the current tree: `ok 597 off 66 missing 0 noNum 3`.
  - The list at 98100b22 against the current tree: `ok 304 off 359`. 359 - 66 = 293, the builder's count.
  - All 293 renumbered entries touch a file changed since 6cf0b497 (`git diff 6cf0b497 --name-only`, 327 files). A loop over the 293 finds 0 whose two files are both unchanged.
  - None of the 66 stale entries touches a changed file.
  - The 66 are the same set under the old `indexOf('/*')` logic, so the round's item 7 moved no window start.
  - Main (c0624648), old logic: `ok 291 off 375 noNum 4`. This reproduces the builder's "375 off on main".
  - The builder's 293 reproduces. The round's 82 does not, by this method: 293 entries were off and are now right.
- allow-duplication.txt shape: `git diff 98100b22 --numstat` gives `293 293`. `diff` of the 98100b22 list and the current list, with ` at N and N,` masked, prints nothing. So no path, mark, entry or other reason text changed: 678 lines before and after, no trailing newline, as before.
- Sample of 10 renumbered entries checked by hand (`sed -n` at the listed lines in both files, leading whitespace stripped). Each window starts on identical lines:
  1. normalise.test.ts:290 / board-fixture.ts:161 (a5fd3d4fec95)
  2. audit.test.ts:52 / portfolio.test.ts:84 (a9d64f176f1b)
  3. board-software.test.ts:22 / focus-lanes.test.ts:64 (3538d24336d3)
  4. collection.test.ts:512 / life/present.test.ts:36 (b402b19dc6c1)
  5. focus-lanes.test.ts:25 / state/boards/focus.test.ts:79 (964ac956944f)
  6. focus-lanes.test.ts:25 / views/sessions/sessions.test.ts:576 (964ac956944f)
  7. state/boards/focus.test.ts:79 / views/academic/present.test.ts:73 (964ac956944f)
  8. structure/lines.test.ts:33 / collection-fixture.ts:113 (b402b19dc6c1)
  9. forms/schema.test.ts:139 / views/sources/venues.test.ts:54 (3538d24336d3)
  10. card.test.ts:22 / views/boards/projects.test.ts:82 (964ac956944f)
- Phrase grep for `checked in (a|the) browser|browser suite|browser spec|turns it red|chrome check|in a browser|browser check`, including the forms broken across two lines, over src tests bin config DESIGN.md HELP.md README.md .prettierignore: no browser-suite pointer is left.
  - The remaining "in a browser" hits describe the runtime, not a check. `drag.svelte.ts:320`, `workbench-keys.test.ts:5`, `config.test.ts:149` and `doc.test.ts:8` also mean a real browser at runtime.
  - The remaining "Each case names the change that turns it red" sentences hold on the tree. For each file, it( cases against `// Revert:` prose lines: tree.test.ts 10/10, tree-keys.test.ts 7/7, layout-parts.test.ts 16/16, show-in-files.test.ts 33/33.
- Added lines of the round: `git diff 98100b22 | grep '^+' | LC_ALL=C grep '[^ -~]'` gives no output. No added line outside allow-duplication.txt is over 100 columns.

## 1. Spec
- Items 1 to 5: every file and line the round brief lists is changed as asked. The diff of the 18 files other than allow-duplication.txt was read in full. No change outside the round brief.
- Item 6: done for every entry whose files the step changed. The count differs from the round's 82 because the round's count was wrong, not the renumbering (see Verification).
- Item 7: the round asked for a case with "a `//` comment holding `/*`". The case's comment line, `"// a glob such as 'ui/**' in a comment"` (duplication.test.ts:368), holds the `/*` only inside quotes. That tests the string branch twice and never a bare `/*` after `//`. This is the Proof finding below.

## 2. Proof
- tests/checks/tree/duplication.test.ts:366-378, the new case `opens no block comment at a /* inside a line comment or a string`. It stays green with the line-comment branch of `blockOpens` (`:86`, `else if (one === '/' && line[at + 1] === '/') return -1;`) deleted, as reproduced in node.
  - The quote in the comment text closes around `ui/**`, so the quote branch alone returns -1.
  - That branch is the one that stops `// ending in /**` (the boundaries.test.ts:24 form the refuter named) from opening a block. No case holds it.
  - Fix: a comment line with an unquoted `/*`, for example `// a folder ending in /**`, followed by a code line that must be returned.
- No other Proof finding. Every count in the round report reproduces:
  - 293 renumbered, 66 stale, 359 off before, 375 off on main
  - 10 tests in duplication.test.ts
  - 5301 = 5300 + 1

## 3. Standards
- None against the round.
- Outside the round's limit, for the record: 66 reasons in allow-duplication.txt still give line numbers that are not where the window starts. All of them are in entries whose files the step did not change, and they were stale on main already (375 off there). The file's header (`:5-6`, "The reason says where the first shared window sits") is false for those 66. Item 6 limited the fix to changed files, so this is for the orchestrator to fix at landing or book.

## 4. Behaviour
- None. The only src hunks are comment rewrites: `src/lib/server/machine/pty/channel.ts:370-371` and `src/lib/views/sessions/terminal/Terminal.svelte:301`.
- The duplication check now reads lines it skipped before. The run shows no new duplicate and no moved window start.

## Not checked
- Whether the whole unit suite is green under the load that made `scratch-count.sh` red in the first review. Not rerun: the round changes no test outside the files above, and the verify run passed.
- `sh bin/scratch-count.sh` was not rerun.
- Whether `blockOpens` misreads a line where a regex literal holds a quote character (for example `/'/`) followed by a real `/*` on the same line. No such line was searched for in the tree.
- The step's diff before 98100b22 was not re-read beyond what the round's findings name. The first refuter covered it.

Reviewer usage: about 22 tool uses, about 9 minutes; tokens not measured.

## Closed (the orchestrator's disposition of every finding above, 2026-09-28)

First review:
- demo/hpc and demo/sessions deleted, the scratch.ts comment, the colours fold: kept, the path list widened to them (round 1 item 8).
- The duplicate claim unproven: nothing to change; the fold stands on the check passing.
- scratch-count.sh red under load: two unit timeouts at load 9 to 19 in git.test.ts and git-ops.test.ts, green at load 9; not sent, since the cause is the machine's load; the whole suite passed on main at landing.
- The 80-case drop: diagnosed by the orchestrator, all in the four deleted test files; written into the report by round 1.
- The lock file's 2 playwright lines: the brief's expected value was wrong; vitest's optional peer entries.
- Head comments made false, the two split pointers, .prettierignore, drag.test.ts, the "checked in a browser" phrases: round 1 items 1 to 4.
- allow-duplication.txt reasons: round 1 item 6 for the files the step changed; the rest at landing (below).
- The duplication-check defect: round 1 item 7.
- The two history comments in channel.ts and Terminal.svelte: round 1 item 5.

Repair round 1, refuted:
- The new duplication case did not hold the line-comment branch: fixed at landing, its comment line now `// a folder ending in /**`; with the branch removed, `blockOpens` returns 22 on that line and the case fails.
- 66 stale reasons outside the round's limit: fixed at landing by a copy of the check's own finder over main's tree, 67 corrected, 0 left, only the numbers changed.
