# Step Q79b refuter report (on .agents/worktrees/Q79b, base 89a83e3b)

A page this report cites is named with its section. A finding in code keeps its `file:line`.

## Verification (rerun by the reviewer)

```
$ sh ~/.claude/skills/land/templates/checks.sh .../orchestrator-state.md </dev/null     (load average 9.57 at start)
 FAIL  tests/server/git/git-ops.test.ts > through the endpoint, with the real operations > routes each action to its own operation with its own fields
Error: Test timed out in 5000ms.
 Test Files  1 failed | 356 passed (357)
      Tests  1 failed | 5719 passed | 1 skipped (5721)
checks: failed with exit 1: npm test

$ npx vitest run tests/server/git/git-ops.test.ts        (alone, load 8.71)
     x routes each action to its own operation with its own fields 6586ms
 Test Files  1 failed (1)
      Tests  1 failed | 36 passed (37)
$ npx vitest run tests/server/git/git-ops.test.ts --testTimeout=30000 --reporter=verbose   (load 14.22)
 ok routes each action to its own operation with its own fields 4245ms
 Test Files  1 passed (1)
      Tests  37 passed (37)
(The step's hunks in git-ops.test.ts are the import lines and the two deleted tmpdir assertions at base 138 and 155; none is on that case's path. checks.sh stopped at npm test, so the rest ran one by one:)

$ npm run check          exit 0   COMPLETED 2041 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build          exit 0
$ npm run format:check   exit 0   All matched files use Prettier code style!
$ npm run lint           exit 0
$ ! LC_ALL=C grep -rna '[^ -~]' src tests     exit 0, prints nothing

Brief verify 2: grep -rl "afterAll(sweepScratch)" tests          prints nothing
Brief verify 3: grep -rn "startsWith(resolve(tmpdir())" tests | wc -l     13
Brief verify 4: ls "$TMPDIR" | wc -l  1516 before checks.sh, 1516 after; comm -13 shows one new entry (mphMlJnSSRBYr6B7S3RSy, gone at the next ls), no oculus- entry; the parent of $TMPDIR has no new entry
Brief verify 5: grep -rn "readdirSync" tests   one-folder reads only: scratch.test.ts:257, claude-usage:45,49, config-folder:99,369-371, keys:152-153, imports/order.ts:120, dev-server:71, deposit:552, fixtures/real-hub.ts:18, help:193,324, terminal-actions:548,556, source:191,232
Brief verify 6 (npm run diagrams): not run, as instructed.

Claims rerun:
- 102 suites: the diff removes the line "afterAll(sweepScratch);" from 102 files (awk over git diff 89a83e3b); 103 with the helper's comment line.
- 104 deleted and 13 kept: git diff 89a83e3b | grep -c "^-.*startsWith(resolve(tmpdir())" prints 105 (104 assertions plus the helper's old if line); 117 - 104 = 13.
- Each deleted assertion: a parse of each deleted line's variable against its assignments in the current file; every one is the unchanged return of scratchDir, plantScratch or a local wrapper that returns scratchDir's value unchanged (memories.test.ts scratch(), images.test.ts scratch(), class fields in background, folders, codex, sessions, transcript-fixture).
- Reader time: commentText over 1072 files of src, tests and bin (.ts, .js, .mjs, .svelte, .sh, .css) took 2771 ms at load about 9 (report: 1073 files, 3030 ms). The one-file createProgram for syntax errors is 115 ms of it over 814 modules; the getChildren walk is 393 ms.
- 49 walker lists: not rerun from the builder's scripts. find src tests bin config -name ".*" and -type l print nothing, so a glob and a readdir walk see the same files on today's tree; the hub's project.yml count by find (code, attic and dot folders excluded) is 94, the sum of the report's six integrity lists (33+5+15+0+16+25); the 21 symlinks under projects/ are files (AGENTS.md).
```

## 1. Spec

- The brief's "What is on the tree", the list after "Other checks decide by their own pattern what a comment is": it names five readers, and my grep finds more checks that strip comments from source by their own pattern and that the step leaves as they are: `tests/ui/wall.test.ts:58`, `tests/ui/colours.test.ts:240`, `tests/ui/controls/tag.test.ts:32,44`, `tests/ui/display/glyph.test.ts:41`, `tests/views/whole/tinted.test.ts:60,107`, `tests/views/whole/type-scale.test.ts:22`, `tests/views/personal/calendar.test.ts:243,272`. Each is `.replace(/\/\*[\s\S]*?\*\//g, ' ')` over a style block's source (tinted:60 also removes `//.*$` over a script). The plan's Q79b line asks for "the one code reader of the checks". The builder followed the brief. The premise, and so the scope, needs the orchestrator's ruling. wall.test.ts and colours.test.ts are Q96's moves.
- Out-of-brief item (a), module-level scratch directories on a filtered run. This is inside the brief's aim: the helper's head comment (`tests/fixtures/scratch.ts:4-5`) and the brief both say a run leaves the temporary directory with the count it found, and `npm run test:slow` (`package.json:13`, `vitest run --tagsFilter slow`) is such a run. Only `tests/server/core/git.test.ts` carries a slow tag, so every other file is skipped whole under that script and its module-level calls stay behind. It is not a regression: vitest skips a skipped file's `afterAll` too (the builder's probe, and `@vitest/runner` `chunk-artifact.js:985` marks a suite skip when every task is). `$TMPDIR` holds leftovers of that shape from before this step, dated Sep 28 23:50: `oculus-pillar-`, `oculus-custom-account-`, `oculus-custom-root-`, `oculus-chat-context-`, `oculus-compose-`, `oculus-account-`, `oculus-latex-route-`, `oculus-second-account-`, and `oculus-task-route-` twice.
  - The module-level calls, found by a TypeScript parse of every file under tests that finds calls outside function and class bodies, local wrappers followed:
    - `tests/checks/bin/rename-pillar.test.ts:21`
    - `tests/server/sessions/stores/customizations.test.ts:38,53`
    - `tests/server/machine/pty/context.test.ts:12`
    - `tests/server/machine/pty/compose.test.ts:44,45`
    - `tests/server/machine/pty/sessions.test.ts:56`
    - `tests/routes/sessions/latex.test.ts:17`
    - `tests/routes/sessions/compose.test.ts:45`
    - `tests/routes/sessions/terminal-fixture.ts:44` (`TASK_CONFIG`, made once by each of `terminal.test.ts`, `terminal-actions.test.ts` and `compose.test.ts`)
    - `tests/data/real-hub.probe.ts:99`, the hand-run script with its own `process.on('exit')`, which needs no change.
  - What closes it: move those ten calls into `test.beforeAll` (or a lazily called function), since a skipped file runs no hook and then makes nothing. Also make the scratch check refuse a module-level `scratchDir` or `plantScratch` call in a file a suite reaches, so it cannot come back. Registering `process.on('exit', sweepScratch)` in the helper would work only while each file runs in a process of its own that exits normally (vitest 4's forks pool), and it adds one listener per imported file. It is the weaker option.
- Out-of-brief item (b), `tests/checks/tree/allow-duplication.txt`: re-keys and removals only. Of the 12 added entries, 11 are the same file pairs with shifted line numbers and new marks. The new pair `poll.test.ts` / `oauth.test.ts` 004604cd33d4 is the `made` / `afterEach` / `scratch()` block (`poll.test.ts:37-50`, `oauth.test.ts:33-46`) that both files shared under d994e70e0372 on the base. The step made no new clone. The six entries removed without a replacement are clones the globSync conversions and the deleted assertions ended.

## 2. Proof

- `tests/checks/source/code.test.ts:30-33`, case 8 ("reads a url() in a style block as no comment"): it asserts only `commentLines(...) == []`, which looks at the first non-space character of each line. It stays green under the defect the brief names (a mid-line `//` inside `url(http://...)` read as a comment). The builder's own first run shows this: "8 | Passes (the `//` is mid-line)" on the old scanner, which had that defect. The revert named in its comment (the style block through markScript) turns it red only by throwing. An assertion that `commentText('a.svelte', text)`'s third line is blank would pin the behaviour.
- The report's Verify 4 row says DONE on counts that differ (1519 before, 1521 after). My rerun gives 1516 and 1516, with no `oculus-` entry added to `$TMPDIR` or its parent, so the item holds. No decision rests on the builder's numbers.
- The two `{ timeout: 30000 }` (`history.test.ts:131`, `comment-width.test.ts:57`): these are not a widened predicate. The work per run changed from a character scan to a parse of every file under the roots, measured at 2771 ms at load about 9. Both assertions are unchanged (`toBe('')`, `toEqual([])`). No finding.
- Every file fed to the reader parses. The full run's history audit reads every file under src, tests, bin and config (config holds only `.yml`, read by the YAML rule; the three `.txt` files are read whole). My probe of `commentText` over all 1072 code files threw nothing. `code('a { color: red; }')` throws `one.ts does not parse`, but its one caller (`audits.test.ts`) feeds it only test files.

## 3. Standards

- `tests/checks/source/code.ts:216`: `/** The same as fileCode for a module, a script or a stylesheet, read as TypeScript. */`. A stylesheet does not parse as TypeScript and throws (probe above), so the comment is false for a stylesheet.
- `tests/checks/tree/scratch.test.ts:9`: "so a file that still registers the sweep with afterAll is refused too". "still" describes the tree's earlier state (spec.md, "What every package obeys": no history in comments). Line 57's "which the fixture holds instead" reads the same way.
- `tests/server/root/watch/local.test.ts:6-7`: "Every file is inside a directory of the case's own, asserted to be under the system temporary directory before anything is written". The file's one assertion was deleted, so the file asserts nothing (the grep count of `startsWith(resolve(` in it is 0). The check is now `scratchDir`'s throw. The builder reworded this sentence in six other files (report item 11) but not here. `tests/server/accounts/mail/poll.test.ts:5-6` has the same wording, but it still holds through `mail/fixture.ts`'s per-file assertions.
- `tools/oculus/.scratch/migration/agents/reviews/Q79b-report.md` is untracked in the worktree (`git status --short`), although the brief's decision 6 says the builder writes nothing under `.scratch/`. It is byte-identical to the main checkout's copy (`diff` prints nothing). It will be swept into the wip commit at /land unless it is left out.

## 4. Behaviour

- A red plain `beforeAll` now leaves its scratch directories, where `afterAll(sweepScratch)` removed them. A planted pair run with vitest from my scratch folder, each file making a directory in `beforeAll` and then throwing, gave "old swept" for the file on `afterAll(sweepScratch)` and "fixture left: .../T/oculus-refute-hook-HcE82D" for the file on the fixture's `it`. The same probe with a red `beforeEach`, a red `test.beforeAll` taken from the fixture, and a red case all swept. The helper's head comment ("sweeps once the file's cases are done, red ones included", `scratch.ts:7`) does not hold for a red plain `beforeAll`, and the report does not state it. The files that make scratch directories in vitest's own `beforeAll` (a parse of each hook body, local wrappers followed):
  - `tests/server/git/deposit.test.ts:168`
  - `tests/server/git/git-ops.test.ts:134`
  - `tests/server/git/git-write.test.ts:94`
  - What closes it: those hooks written as `test.beforeAll` from the fixture (the brief's section 1 already names `test.beforeAll`), and the scratch check refusing a vitest `beforeAll` or `afterAll` import in a file that reaches the helper, or at least a vitest `beforeAll` whose body makes a scratch directory.
- The converted walkers no longer see dot-files and dot-folders. `fs.globSync('**/*', ...)` skips them: a probe on `.x` and `.h/y.ts` returned `[]`. The readdir walks they replace read them. This covers history's `files()`, contrast's and config-folder's recursive reads, shape's `filesUnder`, the paths test, size, comment-width, keys, graph `sourceFiles` (so the boundary and import checks), and the scratch check's own `testFiles`. On today's tree the lists are equal because src, tests, bin and config hold no dot entry. A later `src/lib/.x.ts` or `config/.y.yml` would go unread by those checks. The report's "every list equal" does not state this. integrity's `countManifests` skipped dot entries before, so it is unchanged.

## Not checked

- The builder's 22 revert runs were not rerun. Each new or changed test was judged from the code instead. Each turns red under its stated revert except case 8 (above); the division case and the clean-file case are marked as audits.
- Whether any of the 13 tests in `tests/checks/tree/scratch.test.ts` other than case 1 depends on vitest's default pool (the planted child run uses `--root` in a scratch directory with no config).
- Hunks of Q79b in Q96's files, for the second landing:
  - `tests/ui/colours.test.ts`: the import block at base lines 37-49 (`globSync` in, `tmpdir`, `sep`, `readdirSync` and `afterAll` out, `it` from `../fixtures/scratch.ts`, `afterAll(sweepScratch)` removed); `svelteFiles` at base 387-394, now one `globSync('**/*.svelte', { cwd: root }).sort()`; the deleted `expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);` at base 604, in the colour rule's planted case. After Q96's move to `tests/ui/theme/`, the fixture import becomes `../../fixtures/scratch.ts`, and the file must keep `it` from the fixture or the scratch check refuses it.
  - `tests/ui/wall.test.ts`: the import at base line 10 (`globSync, readFileSync`); `files()` at base 48-53, on `globSync`. `allow-duplication.txt` keeps `tests/ui/controls/tag.test.ts tests/ui/wall.test.ts 6a052e828733`, whose path the move changes.
  - `tests/views/whole/type-scale.test.ts`: the import at base line 4, and `files()` at base 11-16 on `globSync`. Q96's size-table edits are further down.
  - `tests/ui/theme.test.ts` and `tests/views/system/help.test.ts`: no hunk of Q79b.

Reviewer usage: 279972 tokens, 84 tool uses, 25 min (completion notice).
