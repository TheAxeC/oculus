# Q80 refuter report

Reviewer a59a84cb98d926c8b, a fresh agent, over `git diff 740ebd5e` in `.agents/worktrees/Q80`.

Q80 review (line counts on the Status view). Reviewer changed nothing.

1. Verify lines, verbatim

First run (log at /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/q80-verify.log), exit 1:
RED: npm test
 FAIL  tests/server/core/git.test.ts > the log, the branches and the worktrees > cuts every list it publishes at the cap
Error: Test timed out in 5000ms.
 Test Files  1 failed | 340 passed (341)
      Tests  1 failed | 5343 passed (5344)

The step does modify git.test.ts, but not this case, which the diff leaves unchanged. Rerun alone, `npx vitest run tests/server/core/git.test.ts` gave "Test Files  1 passed (1)", "Tests  42 passed (42)". The builder's first run hit the same timeout. It is load-related and not a finding.

Second full run (q80-verify2.log), exit 0:
 Test Files  341 passed (341)
      Tests  5344 passed (5344)
verify: 6 commands passed

Other reproductions:
- `npm ls cloc` prints `cloc@2.6.0-cloc`.
- The report's grep `grep -rn "twelve subcommands\|pinned six\|six subcommands" src tests config HELP.md DESIGN.md README.md` prints nothing (exit 1).
- `grep -rn "ls-files" src DESIGN.md` gives git.ts:25,36,48,221, DESIGN.md:128 and deposit-git.ts:9,79,192, as the report says.
- cloc 2.06 run by hand on the two fixture files gives a.ts TypeScript 1/2/1 and b.svelte Svelte 1/0/4, matching the report.
- cloc without `--skip-uniqueness` drops one of two byte-identical files (it answered only src/lib/y/b.svelte and a.ts); with the flag it answers all three. Confirmed.
- `md5 -r` over src tests bin config demo assets finds no duplicate files. Confirmed.
- A Perl scan with the TODO rule over src tests bin config demo assets, the three docs and the top-level files matches no line. Confirmed.
- The ASCII gate prints nothing. `bin/folder-check.sh` exits 0.
- `createRequire(<built lines chunk>).resolve('cloc/lib/cloc')` resolves to node_modules/cloc/lib/cloc, so the built server finds cloc.

2. Findings

**Spec**

- S1, a premise not reproduced and not reported. The brief asks for "the same-origin check the other machine GETs make". No such GET exists: `src/routes/api/(machine)/hpc/+server.ts` and `usage/refresh/+server.ts` are both POSTs gated by the write token. The tree also has two different `sameOrigin` functions:
  - `server/core/auth.ts:38` refuses a request that carries neither Origin nor Sec-Fetch-Site.
  - `server/content/images.ts:298`, which memories uses, admits such a request as "the command line's".
  - lines.ts:270 picked the auth.ts one. That is a defensible choice, but the report does not say the premise was wrong or that a choice was made. Judgment call 10 mentions only the 403 body.
  - Smallest fix: one line in the report naming the premise gap and why auth.ts's check was taken (it is stricter: a request with no header gets 403).
- S2, a failure case with no test. The brief's item 3 lists "git or perl missing" among the failures that answer `{ error }`. The perl-missing path (lines.ts:172-177, the `error` handler with `started = false`) has no test. The report books it as a limitation ("`perl` missing from the PATH is not exercised by a test"), which is the lazy option: it is inside the brief and can be done now.
  - Smallest fix: add `perl?: string` to `LinesOptions` (lines.ts:91), pass it to `spawn` in place of `PERL`, and add a case pointing it at a non-existent binary that asserts the sentence names perl and cloc.
- S3, store cases with no test. `lines.svelte.ts:128-135` (a non-ok answer without an `error` field, which uses `status.lines_bad_status`), `readCount`'s `lines_bad_total` and `lines_bad_counted` branches (lines.svelte.ts:82-86), and a rejected fetch (the catch at 142-144) have no case in tests/state/system/lines.test.ts. Smallest fix: one case each.
- `--skip-uniqueness` (lines.ts:162): justified. It is an argument, not a dependency. Without it cloc silently drops a byte-identical tracked file (verified above), which would break the brief's rule that every tracked path is counted. The report surfaces it as judgment call 1. Not a finding.
- `grouped()` plus `app.thousands_separator` (format.ts:44-55, app.yml:52): justified. `grep -rn "toLocaleString\|NumberFormat\|thousand" src` finds no existing grouping formatter, the brief allowed one to be written if none existed, and the separator is a character a reader sees, so it goes in the catalog. It is not a dependency. Not a finding, except the NaN branch noted under Proof P5.
- Paths outside the brief's list, each judged necessary:
  - `data/model/index.ts`: the type shared by the server and the client.
  - `state/shared/words/format.ts` and its test.
  - `config/text/app.yml`.
  - `tests/routes/machine/lines.test.ts`: the brief's route case.
  - `tests/server/machine/line-counts.ts`: a shared fixture. tests/fixtures already holds 10 items and cross-folder fixture imports are the tree's precedent.
  - `tests/state/client/client-state.test.ts`.
- Every DONE item otherwise matches its brief text:
  - `ls-files -z` goes through the one call site.
  - `folderOf`, `counted` and `todoLine` are exported. The TODO regex is a faithful port of cathedra's `TODO_PATTERN_MULTI` (metrics.py:23-28).
  - The answer has the shape `{rows,total,counted}`, and header and SUM are skipped.
  - The route, the store, the view and the four docs sentences are in place.

**Proof**

- P1, three tests stay green with their change reverted:
  - "answers an error naming cloc when cloc exits non-zero" (tests/server/machine/lines.test.ts:152). The report says treating a non-zero exit as success turns it red. It does not. With the `code !== 0` branch at lines.ts:184 removed, the run resolves `{ text: '' }`, `clocked('')` fails to parse, and the answer is "cloc's answer is not the JSON it writes.", which still matches `/\bcloc\b/`.
  - The timeout case (line 164) stays green in the same way when the `signal !== null` branch at lines.ts:180 is removed: the answer is "cloc exited with code null." or the not-JSON sentence, and both name cloc.
  - Smallest fix: assert the specific sentence in each case, `toContain('exited with code 1')` and `toContain('stopped by')`.
- P2, a report claim that does not hold. "Sending the fetch synchronously ... turns the one-fetch cases red" is false. Replace `queueMicrotask(() => void load())` at lines.svelte.ts:120 with `void load()`:
  - The test's `expect(asked).toEqual([])` at tests/state/system/lines.test.ts:46 runs before any read.
  - `store.lines()` still returns PENDING, since `held.lines` is written only after an await.
  - After `settle()`, `asked` is `['/api/lines']`, so the case stays green.
  - Nothing tests the deferral. Smallest fix: assert `asked` is `[]` immediately after the first `store.lines()` and before `settle()`.
- P3, a claim that holds only for one reading of the revert. "Throwing instead of answering when `trackedFiles` refuses turns it red" (the not-a-repository case, line 143) depends on what is thrown. The outer try/catch at lines.ts:256-259 turns any throw into "The count failed: <message>", and git's message "not a git repository ..." still matches `/\bgit\b/`. The case goes red only if the catch is removed as well. Smallest fix: assert the sentence starts "git could not list the tracked files".
- P4, the placement test does not prove the brief's "before the hooks block". "is drawn on the Status view after the git line" (tests/views/system/status.test.ts:681) only checks that the title comes after the git line. Hooks draws nothing in a server render (Status.svelte:62-64 gives `''` with no `location`, and Hooks.svelte:41 draws on `origin !== ''`), so moving `<LineCounts />` below `<Hooks>` at Status.svelte:87-88 leaves the test green. Smallest fix: `vi.stubGlobal('location', { origin: 'http://127.0.0.1:1' })` in that case and assert the lines title comes before `status.hooks_title`.
- P5, a minor fallback. `grouped()` draws NaN and Infinity as "0" (format.ts:49), and a test pins it. `readCount` already refuses any non-integer before a count reaches the view, so the branch hides nothing today but would draw a wrong 0 rather than show a defect. The store's validation makes it YAGNI. Consider dropping it.
- Not reproducible without editing or a git command: the first-run numbers ("Tests 6 failed | 36 passed (42)" and the quoted module-not-found errors), and the scratch-copy measurement (2900 ms, 1152 files, code 171441). Both are plausible: the brief's Decision 2 table sums to 1144 files and 170520 code lines, and the step adds 8 files.
- No test asserts a known defect, no threshold was widened, and nothing new holds mutable state at file scope in src. The LEFT_OUT arrays and TODO_LINE are constants that nothing mutates, and the regex has no `g` flag.

**Standards**

- St1, a known sharp edge not reported. `trackedFiles` runs through git.ts's synchronous `spawnSync` call site (git.ts:735), which blocks the event loop for the length of `ls-files`. Brief item 2 names that call site and item 3's "async" applies to cloc, so the step follows the brief, and report judgment call 2 says so without a measurement. The unreported part: `spawnSync`'s default 1 MiB maxBuffer would fail `ls-files` on a large engine tree with ENOBUFS. That cannot happen on oculus's own tree (about 1700 paths, roughly 80 KB). Not a defect today; one line in the report would cover it.
- St2, the asynchronous rule in spec.md ("in flight, after close, and superseded") is only half covered on the server:
  - GET /api/lines does not honour `request.signal`. A page closed or reloaded mid-count leaves perl/cloc running for up to 60 s.
  - Every Status view in another tab or window starts its own cloc, since the in-flight guard is per page store.
  - No test covers the after-close path.
  - Smallest fix: pass `request.signal` into `countLines`, kill the child on abort, and add a case that aborts and asserts the child is gone.
- St3, a JavaScript-engine message reaches the reader. When the body is not JSON (a SvelteKit HTML 500 page, or a 404 from an older server), `response.json()` throws and the view shows "The line count failed: Unexpected token '<', ..." (lines.svelte.ts:127 and 142-144). The spec says every reader-visible string comes from the catalog. Smallest fix: parse the body in its own try, and on failure hold `t('status.lines_bad_status', response.status)`.
- The server's English error sentences in lines.ts: `grep -rn "error: \`\|error: '" src/lib/server` finds 217 hits elsewhere, so this is precedent and not a finding.
- No history in comments. The ASCII gate is clean. No file is over the size limit: lines.ts 275, git.ts 818, index.ts 473, LineCounts.svelte 164. `src/lib/state/system` now holds exactly 10 items, at the cap, so the next store there must split the folder.
- Docs: the DESIGN.md:128 count is right (ALLOWED in git.test.ts now lists 13 subcommands, and the pinned list is seven). The HELP.md:128, README.md:5 and README.md:13 sentences are true. `grep -in "status view"` across HELP, DESIGN, README and src finds no sentence made false. No doc lists the API routes, so /api/lines needs no further page.
- The CSS tokens follow Hooks.svelte's own usage: `--muted-txt, --muted`, `--line`, `--c-red-txt` as used by other views.

**Behaviour**

- B1, a visible change the report does not state. When the server runs over an engine folder that is not a git checkout (README's `--engine` copy), the Status view now shows "The line count failed: git could not list the tracked files: not a git repository (or any of the parent directories): .git." in red with Count again. The report's before and after covers only the normal case. The same holds for a machine without perl.
- B2, a visible change the report does not state. A failed Count again after a successful count clears the table (lines.svelte.ts:130-134 and 140 set `count: null`). The report states only that the old table stays up while counting.
- The main before and after (the new section between the git line and the hooks block, the table, "Counting lines...", "Counted at", Count again, the three docs sentences) is stated in full.

3. What I did not check

- Nothing was looked at on screen. Right alignment, tabular figures, the indent and muted colour, the bold total and sideways scrolling are only seen at the look on the TEST page.
- No git command was run beyond `git diff` and `git status`, so the brief's premise of 1690 tracked paths (497 under .scratch/) and a live `countLines` over the real worktree were not reproduced.
- The builder's first run on the unchanged tree was not re-run, since that needs a revert.
- package-lock.json was not read beyond the diff stat (+10 lines).
- The regenerated docs/diagrams svg and dot files were read only as count deltas. The diagrams check passes inside the suite.
- A path containing a directory entry (a submodule or a symlinked folder), which cloc's --list-file would recurse into, was not exercised. The tree has none of either, but that was not verified by a command.

4. Usage: 34 tool calls, about 13 minutes (the two verify runs took about 1.5 minutes each).
