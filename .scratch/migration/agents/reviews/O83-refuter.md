# Step O83 refuter report (on .agents/worktrees/migration-O83, base 4614443b)

Every item of the brief holds and every case is met by reading and by the builder's logs, which equal the report's quoted blocks; the brief's verify checks 2 and 4 to 8 reproduce, and check 1 passes every line but `vitest slow`, whose one failure is in `tests/server/machine/apps/tools/languages.test.ts`, a file the step does not change. The findings: G115's new row cannot tell the new queue predicate from a gate on the word `slurm_down` (Proof 1); four doc comments in `poll.ts` say "a poll in which `squeue` answered" where the code takes only a good or partial poll (Standards 1); `docs/apps.md:421` does not say what a `null` in `stale` means (Standards 2); `docs/HELP.md:320` was changed with no item asking for it (Spec 1); the builder ran the whole unit suite twice and wrote eight scratchpad files by redirect that its report does not name (Spec 2); and two states the report's before and after do not describe, an empty kept queue saying "No jobs in the queue for you right now." under a failure and the empty tables under a stale heading, with the tooltip's double period carried into the new state (Behaviour 1 and 2).

## Verification (rerun by the reviewer)

```
# Verify 1, from the worktree root, PATH with node v24.21.0:
# (npm run diagrams && npm run test:quick -- --base 4614443b) | grep -E '^(ok|FAILED)|test:quick|Tests |Test Files|FAIL '
test:quick: 22 changed file(s), from git since 4614443b
test:quick: 273 test file(s)
ok      prettier (7.8 s): All matched files use Prettier code style!
ok      ASCII gate (8.5 s)
ok      svelte-kit sync (26.9 s)
ok      eslint (93.5 s)
ok      svelte-check (107.5 s): 1793013376375 COMPLETED 544 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (179.5 s): Duration  165.38s (transform 133.26s, setup 0ms, import 317.02s, tests 245.66s, environment 2ms)
ok      vitest (221.1 s): Duration  209.61s (transform 272.94s, setup 0ms, import 403.10s, tests 302.02s, environment 55.54s)
FAILED  vitest slow (274.7 s)
 FAIL  |unit| tests/server/machine/apps/tools/languages.test.ts > a root app with a language server in a workspace of two roots > is given only the documents of its own root
 Test Files  1 failed | 74 passed (75)
      Tests  1 failed | 681 passed | 215 skipped (897)
test:quick: 302.1 s; failed: vitest slow
(22 changed files: the 21 of `git diff 4614443b --stat` and the untracked report. `git status --short` after the run: the same 21 paths and the report, so `npm run diagrams` changed nothing. The red file is one the step does not change; per the rules file it is named and not counted.)

# Verify 2 (after the change only; see Declined to judge for the unchanged tree):
# npx vitest run tests/server/machine/runs/recover/runs.test.ts
 Test Files  1 passed (1)
      Tests  16 passed (16)

# Verify 3: the case-run program is gone (no `o83` folder in the scratchpad, `ls`); not rerun. The builder's
# logs, compared with the report's two quoted blocks (CASE 1 to the fifth CASE 17 line):
# diff <(o83-final-run.log block) <(report's after block)   -> diff exit 0
# diff <(o83-first-run.log block) <(report's first-run block) -> diff exit 0

# Verify 4: diff ../O83-base/unused-exports.txt <(sh utils/unused-exports.sh 2>&1)
diff exit 0
Unused exports (230)

# Verify 5: grep -rn "status === 'ok'\|status !== 'ok'" src/lib/state/system/machine/hpc src/lib/views/system/machine/hpc src/lib/server/machine/hpc/poll.ts
src/lib/state/system/machine/hpc/hpc.ts:52:    if (status === 'starting' || status === 'ok' || status === 'unconfigured') return null;
src/lib/views/system/machine/hpc/Head.svelte:49:        if (data?.status !== 'ok') return false;
src/lib/views/system/machine/hpc/Head.svelte:82:        if (data.status !== 'ok') return [];
src/lib/views/system/machine/hpc/Head.svelte:103:        <span class:ok={data?.status === 'ok'} class:bad={failed}>
src/lib/views/system/machine/hpc/Hpc.svelte:110:        {:else if data && data.status !== 'ok'}
(the same five hits the report names, each with a reason that reads true against the code)

# Verify 6: grep -n 'stale' src/lib/views/system/machine/hpc/Head.svelte
exit 1 (prints nothing)

# Verify 7: grep -rn 'Z10[0-9][0-9]\|ruling 4[0-9][0-9]\|\bO8[0-9]\b' src config docs tests --exclude=local.yml
exit 1 (prints nothing)

# Verify 8: LC_ALL=C grep -n '[^ -~]' $(git diff 4614443b --name-only) .scratch/migration/agents/reviews/O83-report.md
exit 1 (prints nothing)

# Commands the report quotes as evidence:
# grep -rn "slurm_partial_msg\|stale_from\|stale_never" config src --exclude=local.yml
config/text/views/system/machine/hpc.yml:91, :92, :93 (the three keys); src/lib/state/system/machine/hpc/hpc.ts:54 and :70 (the readers). As the report says.
# grep -rn "failureWords\|queueIsCurrent\|staleWords\|HpcStatus\|partialAnswer\|staleTables" src tests config docs README.md --exclude=local.yml
hits only under src: failureWords called at status.ts:193, Head.svelte:37, Hpc.svelte:78 with the payload; HpcStatus only at model-sessions.ts:621 and :658; no hit in docs, tests or README.md. As the report says.
# grep -rn "queueIsCurrent\|staleWords\|partialAnswer\|staleTables\|NO_TIMES" ../O83-base/src ../O83-base/tests
exit 1 (prints nothing). As the report says.
# grep -rn "^\s*stale" config/text --exclude=local.yml
hpc.yml:92 stale_from, hpc.yml:93 stale_never, project.yml:119 stale_behind, project.yml:120 stale_tip, projects.yml:76 stale_glyph. As the report says.
# The history-word grep, run as git diff 4614443b | grep '^+' | grep -v '^+++' | grep -i -E "<the report's pattern>"
three hits: docs/HELP.md (the existing "before it runs" of the Submit sentence), model-sessions.ts "is still older than the queue", poll.ts "A prewarm still running". As the report says.
# npx vitest run tests/server/machine/runs/recover/runs.test.ts --reporter verbose: run without --reporter, Tests 16 passed (16), as quoted.
# boundaries claim: tests/checks/tree/boundaries.test.ts:347 reads `server: ['server/**', 'data/**'],`. As the report says.
# The first verify list's red line: o83-verify.log:356-357 " FAIL  |unit| tests/server/machine/runs/recover/runs.test.ts > a Recover run on this Mac > finds a real detached fetch again ...", "Error: Test timed out in 30000ms."; o83-verify2.log:302-310 equal to the report's second-run block.
# Not run: the case-run program and `npx vitest list --filesOnly --config <scratchpad>/o83/cases.config.mts` (deleted); `git diff -U0` (a git form not allowed; run as git diff 4614443b above).
```

## Verdicts

Items of the brief's "What to build":

- 1. The poll tells a partial answer apart: holds. `partialAnswer` (`poll.ts:222-229`) is the brief's definition; the partial path runs after the drop check (`poll.ts:408`, `:411`); the queue, `take`, `lastOk` and `updated` are this poll's (`:418-437`, `:450`); a failed table keeps its rows and time (`:428-433`); the hint is `slurmHint`'s (`answerFailure`, `:199-212`); `stale` comes from `staleTables` (`:313-319`); `good` is false, so `schedule` gives `RETRY_MIN` (`:437`, `:462`); the prewarm is due only when `sacct` answered (`:438`); a change of host, of the sentence or of `unconfigured` drops `times` with the rows (`:593-601`); a window change keeps them (`:617-620`). The builder's logs show cases 2 to 7 and 10 to 14 as the brief asks. The doc comments are rewritten, with the imprecision of Standards 1.
- 2. The payload's `stale`: holds. `model-sessions.ts:668-681` (the `lastOk` doc and `stale` with its doc), `payloads.ts:65-70`, `docs/apps.md:421` with the brief's words. Standards 2 notes a gap in the brief's dictated words.
- 3. The page reads a live queue from `ok` or `lastOk` equal to `updated`: holds, at another place than the brief named. The predicate is defined once at `model-sessions.ts:691-701` and re-exported from `hpc.ts:13`, since `poll.ts` may import only `server/**` and `data/**` (`boundaries.test.ts:347`); `counts`, `pillText`, `badgeText` (`hpc.svelte.ts:32`, `:39`, `:49`) and `failureWords` (`hpc.ts:48-62`) read it.
- 4. The view: holds by reading. The head bar (`Head.svelte:63-91`: failure word, queue, `as_of` with `updated`, retry; refresh hidden at `:99-101`), the box with the partial sentence (`Hpc.svelte:110-115` with `failureMessage`), `live` for Jobs, Recent and Log and an empty Login reason (`Hpc.svelte:60`, `:121-134`), the mark in `--c-red-d-txt` and the heading drawn at 0 rows (`Recent.svelte:94-101`, `:123-128`; `Capacity.svelte:73-80`, `:164-169`), the late poll renamed `overdue` (`Head.svelte:8`, `:61`, `:83-90`). The screen is the look on landing.
- 5. The status bar: holds. `status.ts:193-198`; the builder's case 16 line gives "2 running, 1 pending" and the joined tooltip.
- 6. The words: holds. `hpc.yml:91-93`, the brief's words, in the file's order.
- 7. Recover reads while the queue is live: holds. `poll.ts:566`; G115's row at `runs.test.ts:485-541`, 16 of 16 passing in my run. See Proof 1 for what the row cannot catch.

Cases of the brief's "Cases" (each from reading the code and the builder's `o83-final-run.log`, which equals the report's quoted block; the program could not be rerun, see Declined to judge):

- 1: met. `ok`, no `stale`, `lastOk==updated=true`.
- 2: met. `stale={"recent":"t1"}`, jobs and sinfo the second answer's, recent the first's, `lastOk=t2 updated=t2`, `take` with section-B, no prewarm, the next batch at 2 minutes; the quota read keeps `stale`, `lastOk`, `updated`.
- 3: met. `stale={"sinfo":"t1"}`, recent `[601]`, `prewarm=["601"]` once.
- 4: met. `stale={"recent":"t1","sinfo":"t1"}`, hint `sacct`'s line.
- 5: met. `stale={"recent":null}`, recent empty, the answer's queue, `lastOk==updated=true`.
- 6: met. `stale={"recent":"t1"}` at t3.
- 7: met. `stale={"recent":"t2"}`, recent `[601]`, sinfo `[pc]`.
- 8: met. The first row by my run of G115's test (passing); the other two by the log ("recover() sent 0 command(s)" after unreachable and after case 9's `squeue` exit 1).
- 9: met. `squeue` exit 1 gives `slurm_down` with `stale={"recent":"t1"}`, `lastOk=t2 updated=t3`; good gives `ok` with no `stale`; ssh 255 gives `unreachable` with `stale={"recent":"t1"}`; the page lines (box with `slurm_down_msg`, 7 of 8 controls disabled, "stale, from 11:00") by the render.
- 10: met. `slurm_down`, `sacct`'s line, `take=[]`, `lastOk=absent`, no `stale`.
- 11: met. `starting` and `unconfigured` with no `stale`; `stale={"recent":null}` after each; nothing published or taken from an answer after `close()` or a host change.
- 12: met. `stale={"recent":"t1"}` after the window change.
- 13: met. `slurm_down`, no `stale`, `take=[]` for the rejection.
- 14: met. `recent=[]`, `stale={"sinfo":"t1"}`.
- 15: met by the string render and reading (head bar parts, no refresh control, one box with the partial sentence and the hint, 0 of 8 controls disabled, Recent's mark, no Capacity mark, empty Login reason; case 5's heading at 0 with "stale, not read since the server started"). The screen, with the Focus pill and the rail badge, is the look.
- 16: met. Case 2's payload gives the live counts, pill and badge and the joined tooltip; the other three payloads print the same lines as on the base.
- 17: met. Two `passes unchanged` and one `passes unchanged` for no `stale`; `stale: 'x'` and `stale: { recent: 5 }` `refused` after, `passes unchanged` on the base.

## 1. Spec

- Spec 1. `docs/HELP.md:320`, outside the write list, with no item asking for it. Hunk: `+- **Live HPC.** ... When \`squeue\` answers and \`sacct\` or \`sinfo\` does not, the head says Slurm down with this poll's queue and its time, the queue's controls, the log and the Login node section stay live, and the Recent or Capacity table whose command failed keeps its last rows with "stale, from" and their time in its heading, or "stale, not read since the server started".` The brief says a file outside the list "that no item requires is not touched", and the brief check judged that HELP needs no bullet. The report's reason is the rules file's HELP rule, which asks for "what a user does ... as short bullets"; the addition is a 60-word sentence on what the view shows, appended to an existing bullet. It also leaves out ruling 432's rule that the mark stays through later failed polls while the table is older than the queue. Failure scenario: a reader of HELP whose ssh drops after a partial poll sees the mark under an "unreachable" box and finds no word for it. The orchestrator keeps it (completing it with the later-failure sentence) or drops it. The other files outside the list are each required and accepted: `src/lib/data/model/index.ts:636` and `:663` and `model-sessions.ts:621` (exporting the predicate and making `HpcStatus` local, which `sh utils/unused-exports.sh` would otherwise list as a new unused export); `model-sessions.ts:691-701` (the predicate, Item 3); `status.ts:51` (the import); the six diagram files (written by `npm run diagrams`, the verify command).
- Spec 2. Programs and command files the builder wrote, and its whole-suite runs. (a) The case-run program, `scratchpad/o83/cases.config.mts` and `scratchpad/o83/tests/cases.test.ts`, with a `node_modules` symbolic link beside them: allowed by the rules file, source quoted, folder gone (`ls` of the scratchpad shows no `o83`). Its quoted head comment still gives `npx vitest run --dir <this folder> --project unit --disableConsoleIntercept` as the run line, the command that runs the whole suite. (b) That command was run twice, before any change, a whole-suite command the rules file makes a finding; `o83-run1.log` (11:27) holds one of them (" <HEAVY RIGHT-POINTING ANGLE QUOTATION MARK ORNAMENT> |unit| tests/checks/tree/duplication.test.ts (18 tests | 1 failed)"); the report says so and used neither output. (c) Eight scratchpad files written by shell redirect that the report does not name: `o83-run1.log`, `o83-first-run.log`, `o83-after-run.log`, `o83-final-run.log`, `o83-verify.log`, `o83-verify2.log`, `o83-unused-after.txt`, `o83-unused-final.txt` (times 11:27 to 11:48, before the report at 11:59). None writes the worktree, and their contents equal what the report quotes (Verification). The standing ruling "Unapproved builder scripts" (`plan.md:2722`) and O75's booking list scratchpad redirects; here they are unnamed, so the booking should name them.
- No dependency added. No decision reserved for Axel taken; the lower-case mark (`text-transform: none`, judgment call 4) is a visible choice the report lists for the orchestrator. Every premise of "What is on the tree" reproduces on `../O83-base` (`grep -n` of premise 1 prints 113, 165, 188, 214, 236, 281, 374, 375, 377, 397; `poll.ts` 565 lines, `model-sessions.ts` 846, `runs.test.ts` 537; `poll.ts:500` is `if (held?.status !== 'ok') return;`), except that item 3's place cannot hold item 7's need, which the report states. No ADR: `docs/adr` does not exist and `.agents/plan.yaml` names none (`grep -c -i adr` prints 0). Every case's first run is given.

## 2. Proof

- Proof 1. G115's row cannot tell the queue predicate from a gate on the status word. `tests/server/machine/runs/recover/runs.test.ts:525-540`: `for (const [answer, status] of [[batch, 'ok'], [partial, 'slurm_down']] as const) { ... expect(read.sent).toHaveLength(1); ...` and the `unreachable` row after it. By reading: with `poll.ts:566` written as `if (held === undefined || (held.status !== 'ok' && held.status !== 'slurm_down')) return;` every assertion still holds, yet after case 9's poll (`squeue` exit 1, status `slurm_down`, queue kept) such a gate sends Recover's command to a Slurm that does not answer, which Z1028 names as the reason for the predicate. The rules file's test rule asks one row per input that gives a different outcome; a `slurm_down` whose `squeue` failed gives "nothing sent" and has no row. Brief item 7 named only the partial row, so item 7 holds as written; the row to add is a `slurm_down` answer with `squeue` exit 1 after the marker, expecting `sent` empty and `take` empty.
- Proof 2. The cases the test rule might cover: the partial answer, the tables' times, `hpcShape`'s `stale`, `failureWords`, the head bar, the status bar, the pill and the badge have no test. This matches the rules file: `grep -n "payloads\|hpcShape\|status\.ts\|hpcWords\|hpc\.svelte\|hpc/hpc\|poll\.ts\|Hpc" agents/guarded.md` hits G82 (`debugShape` only, `guarded.md:59`) and G115 (`recover` of `poll.ts`, `:360`), so no entry covers them and brief decision 7 holds. The poll's partial path therefore has no kept test; a new entry is Axel's to rule.
- Proof 3. The G115 row's failure on the unchanged tree is quoted (`runs.test.ts:531:31`, "expected [] to have a length of 1 but got +0", "Tests  1 failed | 15 skipped (16)"); by reading the base copy (`poll.ts:500`, `held?.status !== 'ok'` returns on the partial `slurm_down`) the row fails there at `:531` after `:530` holds, as quoted. The preserved `ok` and `unreachable` rows pass in my run. The assertion edits the report tables match `git diff 4614443b -- tests/...`: the eight `expect` lines kept, moved into the loop; `ask(answered: boolean)` became `ask(answer)`; no threshold or predicate widened. No test asserts a known defect; no file-scope mutable added (`times` is a local of `watchHpc`, `NO_TIMES` a constant).

## 3. Standards

- Standards 1. Four doc comments in `src/lib/server/machine/hpc/poll.ts` say the rows and times come from a poll in which a command answered, where the code takes them only from a good or a partial poll. `poll.ts:256-257`: "The queue of the last poll in which `squeue` answered, and each table of the last poll in which its own command answered"; `:293`: "When the cluster last answered for the queue"; `:297-298`: "A poll whose `sacct` answered sets it and every other poll clears it"; `:322-323`: "`updated` is the time a poll in which `squeue` answered gives, its `lastOk`". With the marker, `squeue` 0, `sacct` 1 and ssh's 255 (case 10's input), `squeue` and here `sinfo` answered, yet `partialAnswer` is false (`:225`), the poll goes the failure path at `:411-417` with its own `updated`, keeps the old queue and clears `prewarmDue`; and `prewarmDue` is set only when `current.prewarm` too (`:438`). Failure scenario: a maintainer reading `Rows` takes a broken-ssh answer with `squeue` 0 as refreshing the queue and writes a reader that trusts `lastOk` after it. The fix is to say "the last good or partial poll (`partialAnswer`)" in each.
- Standards 2. `docs/apps.md:421`: "`stale` names each table older than the queue with the time its rows came from". The type (`model-sessions.ts:672-681`) and ruling 432 allow `null` for a table no poll has read since the server started; the apps guide does not say so. Failure scenario: an app builder reads `stale: { recent: null }` and, with no meaning given, treats `null` as "not stale" and shows the empty Recent as current. The words were dictated by brief item 2, so the builder followed them; the fix at landing is "..., or `null` when none has answered since the server started".
- Checked and clean: ASCII (verify 8); no history in added comments (verify 7, the history-word grep above); every comment the step edits rewrapped as a whole paragraph (`git diff 4614443b -- src tests | grep '^+'` over comment lines shorter than 85 columns gives only paragraph ends); head comments of the four views, `hpc.ts` and `status.ts` true against the code; `Login.svelte:9-11`, `Jobs.svelte:27-30` and `Log.svelte:17-19` still true; sizes `poll.ts` 632, `model-sessions.ts` 869 (11 under 880), components 135 to 179; the re-export at `hpc.ts:13` has precedent (`state/shared/stores/desktop.ts:33`, `state/life/calendar.ts:20`); the catalog keys in the `hpc` group's one file; colours from tokens; no raw control.

## 4. Behaviour

- Behaviour 1. Two states the report's before and after do not describe. (a) `Hpc.svelte:121-124` draws Jobs and Recent together whenever `stale.recent` is named. A server starts, its first poll answers `squeue` with no jobs and `sacct` exit 1 (`stale: { recent: null }`), then ssh drops: the payload is `unreachable` with `jobs: []`, `recent: []`, `stale: { recent: null }`. The view shows the ssh box, "last reached HH:MM", then Jobs' "No jobs in the queue for you right now." (`hpc.yml:76`, `Jobs.svelte:104-105`) about a queue from the earlier poll, and Recent "RECENT (FINISHED) - 0" with "stale, not read since the server started". On the base a failure with no kept rows draws neither section. A reader is told the queue is empty "right now" while the cluster is not reached. (b) A table drawn at 0 rows draws its body too: Recent an empty `Table` under its heading (`Recent.svelte:102-104`), Capacity an empty meters grid and the inner fold "sinfo table (0 rows)" (`hpc.capacity_summary`) with an empty `Table` (`Capacity.svelte:81-102`). The report's look list names only the headings. Both belong in the look's before and after; (a) is a defect of words to fix (the Jobs section kept off, or its empty sentence, while the queue is not this poll's).
- Behaviour 2. The status bar tooltip of the new state reads "2 running | 1 pending | 3 total | The cluster answered for the queue, and Slurm did not answer for the tables marked stale.. Open Live HPC." with two periods: `config/text/statusbar.yml:71` is `hpc_tip: '{0}. Open Live HPC.'` and every failure sentence ends in a period. The report lists it under limitations as on the base for every failure and outside its paths; the step adds a new sentence to it. A one-key fix at landing ends it for every failure.
- The rest of the visible change is stated with before and after in the report's look list: the head bar, the box's sentence, the live controls, the Login reason, the marks in lower case, the status bar, the Focus pill and the rail badge, and Recover's reading during a partial outage.

## Declined to judge

- The cases' rerun: the case-run program was deleted (no `o83` folder in the scratchpad), and this review writes no file but its report; the cases are judged by reading the code and by the builder's logs `o83-first-run.log` and `o83-final-run.log`, whose blocks equal the report's (diff exit 0 each).
- G115's row on the unchanged tree: running it needs a tree with the base source and the new test, which this review may not write; judged by reading `../O83-base/src/lib/server/machine/hpc/poll.ts:500`.
- `npx vitest list --filesOnly --config <scratchpad>/o83/cases.config.mts`: the config is gone.
- That the first case run preceded every code change: only file times (`o83-first-run.log` 11:29:33) speak to it; the builder's transcript would settle it.
- That the eight scratchpad files of Spec 2 are the builder's: judged by their names and times; the transcript would settle it.
- How O83 merges with main, where O80 has landed: `git merge-tree` or a cherry-pick would settle it. A plain `diff` of main's files against the worktree's shows O80's hunks at `docs/HELP.md:316`, `docs/apps.md:452`, `status.ts:396-427`, `payloads.ts:38-39` and `index.ts:261-281`, apart from O83's lines.
- The screen (tone, capitals, focus, the Focus pill and the rail badge): the look on landing.
- `tests/server/machine/apps/tools/languages.test.ts`'s red line in verify 1: a file the step does not change; not rerun, per the rules file.

Reviewer usage: ab4bfee70ce043d23, claude-opus-5-5, 289742 tokens, 64 tool uses, 17 min 33 s.

# Repair round 1, refuted

This review wrote one file, contrary to its brief: the round delta at /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/delta.txt, made by a shell redirect. It is outside the worktree and the ledger. No other file was written, and no git command was run except `git diff 4614443b`, `git status --short` and `git show`.

```
# Verify 1, from the worktree root, PATH with node v24.21.0:
# (npm run diagrams && npm run test:quick -- --base 4614443b) 2>&1 | grep -E '^(ok|FAILED)|test:quick|Tests |Test Files| FAIL |Error:'
> oculus@0.1.0 test:quick
test:quick: 25 changed file(s), from git since 4614443b
test:quick: 273 test file(s)
ok      ASCII gate (0.6 s)
ok      prettier (0.7 s): All matched files use Prettier code style!
ok      svelte-kit sync (2.6 s)
ok      eslint (54.7 s)
ok      svelte-check (70.6 s): 1793016042199 COMPLETED 544 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (144.8 s): Duration  133.59s (transform 93.37s, setup 0ms, import 251.24s, tests 225.41s, environment 3ms)
ok      vitest (197.6 s): Duration  188.56s (transform 197.10s, setup 0ms, import 361.96s, tests 299.29s, environment 36.56s)
ok      vitest slow (240.7 s): Duration  231.81s (transform 15.63s, setup 0ms, import 181.83s, tests 731.54s, environment 23ms)
test:quick: 243.5 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
(25 files: the 23 tracked paths of `git status --short` and two untracked ledger files, the round brief and the report; `git status --short | wc -l` after the run gives 25, so `npm run diagrams` changed nothing)

# npx vitest run tests/server/machine/runs/recover/runs.test.ts
 Test Files  1 passed (1)
      Tests  16 passed (16)

# Check 4: diff ../O83-base/unused-exports.txt <(sh utils/unused-exports.sh 2>&1)
diff exit 0
Unused exports (230)

# Check 5: grep -rn "status === 'ok'\|status !== 'ok'" src/lib/state/system/machine/hpc src/lib/views/system/machine/hpc src/lib/server/machine/hpc/poll.ts
src/lib/state/system/machine/hpc/hpc.ts:52:    if (status === 'starting' || status === 'ok' || status === 'unconfigured') return null;
src/lib/views/system/machine/hpc/Hpc.svelte:112:        {:else if data && data.status !== 'ok'}
src/lib/views/system/machine/hpc/Head.svelte:49:        if (data?.status !== 'ok') return false;
src/lib/views/system/machine/hpc/Head.svelte:82:        if (data.status !== 'ok') return [];
src/lib/views/system/machine/hpc/Head.svelte:103:        <span class:ok={data?.status === 'ok'} class:bad={failed}>

# Check 6: grep -n 'stale' src/lib/views/system/machine/hpc/Head.svelte
exit 1

# Check 7: grep -rn 'Z10[0-9][0-9]\|ruling 4[0-9][0-9]\|\bO8[0-9]\b' src config docs tests --exclude=local.yml
exit 1

# Check 8: LC_ALL=C grep -n '[^ -~]' $(git diff 4614443b --name-only) .scratch/migration/agents/reviews/O83-report.md
exit 1

# Commands the round's report quotes as evidence:
# npx vitest run tests/checks/source/keys.test.ts
 Test Files  1 passed (1)
      Tests  11 passed (11)
# awk 'length > 100' over poll.ts, worktree and base copy
src/lib/server/machine/hpc/poll.ts:129: 188
../O83-base/src/lib/server/machine/hpc/poll.ts:122: 188
# git diff 4614443b -- docs/apps.md docs/HELP.md | grep '^@@'   (in place of the quoted `git diff -U0`, a form this review may not run)
@@ -317,7 +317,7 @@ Views opened for one thing, and not in the catalogue: ...
@@ -418,7 +418,7 @@ Every record carries `root`, the name of its hub, and has the id `<hub>:<key>`, ...
# grep -rn "hpcTip\|hpc_tip_ended" ../O83-base/src ../O83-base/tests ../O83-base/config --exclude=local.yml
exit 1
# wc -l of the files the round changes
     639 src/lib/server/machine/hpc/poll.ts
     615 src/lib/state/workbench/navigation/status.ts
     452 src/lib/shell/status/StatusBar.svelte
     247 config/text/statusbar.yml
     162 src/lib/views/system/machine/hpc/Hpc.svelte
     160 src/lib/views/system/machine/hpc/Recent.svelte
     181 src/lib/views/system/machine/hpc/Capacity.svelte
     557 tests/server/machine/runs/recover/runs.test.ts
     847 docs/apps.md
     570 docs/HELP.md
     155 src/lib/views/system/machine/hpc/Jobs.svelte
(as the report's table)
# The history-word grep over the round's added lines (grep '^+' of the delta | grep -i -E "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands|O8[0-9]|Z10|ruling")
one hit: the HELP.md Live HPC line, whose "before it runs" is the existing Submit sentence. As the report says.
# Not run: the case-run program (`cases.config.mts`, `tests/cases.test.ts`) and `base.config.mts`, deleted (no `o83` folder in the scratchpad, `ls -la`); `npx vitest run tests/data/hubs/hub-portfolio.test.ts`, a file the step does not change.
```

### Verdicts

Items of the brief's "What to build":

- 1: holds. In `poll.ts` the round changes only comments: the delta's hunks are at `:256-259`, `:296-297`, `:302-305` and `:327-331`. `partialAnswer` (`:222-229`) and the poll body (`:412-465`), read in full, do what the item says, as the first run found.
- 2: holds. `docs/apps.md:421` now gives the meaning of `null`. `model-sessions.ts` and `payloads.ts` are not changed by the round.
- 3: holds. `queueIsCurrent` (`model-sessions.ts:696-700`) is read by `hpc.svelte.ts:32,39,49`, `failureWords` (`hpc.ts:53`), `status.ts:197`, `Hpc.svelte:62` and `Head.svelte:69`.
- 4: violated in one state, see Spec R1. Elsewhere it holds as round item 6 amends it. The head bar is unchanged. Jobs, Recent and Log get `live` (`Hpc.svelte:126,129,137`). Login gets no reason while the queue is live (`:132`). A heading drawn at 0 rows under its mark has no body (`Recent.svelte:102-106`, `Capacity.svelte:81-104`).
- 5: holds. `hpcWords` (`status.ts:186-199`) is not changed by the round. The tooltip now goes through `hpcTip` (`status.ts:206-208`, `StatusBar.svelte:292`).
- 6: holds. `hpc.yml:91-93` is not changed by the round.
- 7: holds. `recover()` returns unless `queueIsCurrent(held)` (`poll.ts:573`). G115's rows are at `runs.test.ts:532-555`, and my run passes 16 of 16. Proof R1 names what the rows still cannot tell apart.

Cases:

- 1 to 7 and 10 to 14: met. The round changes no code these cases run, since its `poll.ts` hunks are comments only. The evidence of the first run stands: the builder's `o83-final-run.log`, whose block the first review found equal to the report's.
- 8: met. For the first row, my run of G115's test passes. By reading, the `squeueFailed` and `unreachable` rows assert that nothing is sent and nothing is taken (`:532-540`), and `poll.ts:573` gives that result.
- 9: met. The Recent rows of case 9 come from t1 and are not empty, so `Hpc.svelte:128` still draws Recent, with "stale, from" and t1, under the `slurm_down_msg` box.
- 15: met, by reading and by the builder's string render after the round ("case 5's payload": `Recent (finished) - 0 stale, not read since the server started`, with 0 tables in the section). The screen is the look on landing.
- 16: met. `hpcWords` is unchanged by the round.
- 17: met. `payloads.ts` is unchanged by the round.

Items of the round's brief:

- 1: holds. The section "Commands and files outside the brief (item 1)" (report lines 1269-1293) names the program, its config, the `node_modules` link, the eight files written by redirect and the two whole-suite runs, each with its time.
- 2: holds. The `squeueFailed` row is at `runs.test.ts:491-497`, and the rows that expect nothing are at `:532-540`. My run after the change passes 16 of 16. The quoted run on the base copy fails at `:548`, the partial row, which comes after the new rows. By reading, base `poll.ts:500` (`if (held?.status !== 'ok') return;`) sends nothing on `slurm_down`. The base run's alias stays faithful: `grep -ln '\$lib'` over the base copy's `server/machine/hpc/*.ts`, `server/core/channels.ts` and `data/model/*.ts` exits 1. Proof R1 applies to this item.
- 3: holds. The four comments are at `poll.ts:256-259`, `:296-297`, `:302-305` and `:327-331`, each rewrapped as a whole paragraph, with inner lines 96 to 100 columns wide (awk).
- 4: holds. See `docs/apps.md:421`.
- 5: holds. `docs/HELP.md:320` gains the clause, and nothing else on the line changes (delta). See Standards R2.
- 6: (a) holds for Jobs and Recent. `Hpc.svelte:125-130` draws each of them only when `live` is true or the section has rows. The builder's render after the round shows no empty-queue sentence and no Recent section in the scenario of the first review. Capacity and Quota go further than the item asks: Spec R1. (b) holds. See `Recent.svelte:102-106` and `Capacity.svelte:81-104`. The render shows case 5's Recent with 0 tables, and `stale: { sinfo: null }` with no meters grid, no sinfo fold and no table.
- 7: holds. `hpcTip` uses `hpc_tip` for words that end in no sentence mark and `hpc_tip_ended` (`statusbar.yml:72`, `'{0} Open Live HPC.'`) for words that do. By reading the catalog, each state reads one mark before "Open Live HPC.":
  - `queue_summary` and `host_no_cluster` end in no mark;
  - `slurm_down_msg`, `slurm_partial_msg` and `error_msg` end in ".";
  - `unreachable_msg` ends in "?";
  - `polling` ends in "...".

  No sentence in the catalog changed.

### 1. Spec

- Spec R1. The gates in `src/lib/views/system/machine/hpc/Hpc.svelte:119-124` go further than item 6 asks, and in one state they break brief item 4.

  ```
  {#if data && (live || data.sinfo.length > 0)}
      <Capacity rows={data.sinfo} stale={data.stale?.sinfo} {held} onheld={keepHeld} />
  {/if}
  {#if data && (live || data.quota.length > 0)}
      <Quota rows={data.quota} />
  {/if}
  ```

  - **What is wrong.** Round item 6(a) changes the gate for Jobs and for Recent, and names no other section. Brief item 4 says that "for every payload carrying `stale`, whatever its status", each table `stale` names is drawn with its heading even with no rows. The round also drops the `stale.sinfo` gate from Capacity, and splits Quota from Capacity. As a result, Capacity with `stale.sinfo` set and 0 rows is no longer drawn when the queue is not current. The builder names the Capacity change as a judgment call (report line 903). The Quota split is stated only as "Jobs and Quota draw what they drew". That sentence is true of the components but not of their gates: under a failure with sinfo rows and no quota, the base drew an empty Quota section and the tree now draws none.
  - **Failure scenario.** The first poll after start answers with `sinfo` code 124, which gives `stale: { sinfo: null }` and `sinfo: []`. Then ssh drops. Before the round the page showed "CLUSTER CAPACITY (0 PARTITIONS) stale, not read since the server started" under the `unreachable` box, and now it shows no Capacity section, against item 4 as written.
  - **For the orchestrator.** It rules either way at landing: extend 6(a)'s ruling to Capacity (the same shape as Recent) and record that, or restore the `stale.sinfo` gate for Capacity.
  - **Verdict.** Item 4 is violated (one state), and round item 6(a) goes beyond its finding.

### 2. Proof

- Proof R1. G115's rows still cannot tell `lastOk === updated` apart from "`lastOk` is present". The rows are at `tests/server/machine/runs/recover/runs.test.ts:532-540`, inside `ask` (`:498-529`):

  ```
  [squeueFailed, 'slurm_down'],
  [unreachable, 'unreachable']
  ...
  await watcher.refresh();
  ```

  - **What is wrong.** Each `ask` builds a new watcher and runs one poll. In the `squeueFailed` row `lastOk` is therefore absent, so the row tells the predicate apart from a gate on the status word, as round item 2 asked. Read the four rows against `queueIsCurrent` written as `payload.status === 'ok' || payload.lastOk !== undefined`, and every assertion still holds. The case the first review named has no row: case 9, a good poll and then `squeue` exit 1, where `lastOk` comes from the earlier poll and `updated` is later.
  - **Failure scenario.** With such a predicate, after a good poll and a second poll whose `squeue` exits 1, `recover()` sends Recover's command to a Slurm that does not answer, and G115's test stays green.
  - **Fix at landing.** One more row whose `ask` runs `batch`, then `squeueFailed`, and expects `sent` and `take` to be empty.
  - **Verdict.** None: round item 2 and brief item 7 hold as written.

### 3. Standards

- Standards R1. The head comment at `src/lib/views/system/machine/hpc/Hpc.svelte:28-30` reads: "While the queue is not this poll's, each section is drawn only when it holds kept rows, so no empty queue or empty table is shown for a cluster that did not answer."
  - **What is wrong.** The Login node section is drawn under every failure with its reason (`:131-133`), and so is the Log (`:134`). Neither depends on kept rows, so "each section" is false for them. The rule is the rules file's "What every package obeys": a sentence in a head comment that the change makes false.
  - **Failure scenario.** A maintainer applies the stated rule to Login and hides the failure reason when there are no rows.
  - **Fix at landing.** Write "Capacity, Quota, Jobs and Recent are each drawn only when ...".
  - **Verdict.** None.
- Standards R2. The clause added at `docs/HELP.md:320` reads: "...or "stale, not read since the server started"; the mark stays on that table through later failed polls while the table is older than the queue."
  - **What is wrong.** With round item 6(a), a table that has no rows is not drawn while the queue is not this poll's (`Hpc.svelte:125-130`). The "not read since the server started" table is such a table, so its mark disappears at the next failed poll. The clause holds only for a table that has rows. Round items 5 and 6(a) both asked for what they produce, and their meeting point is what makes the sentence false.
  - **Failure scenario.** A reader's first poll fails `sacct`, then ssh drops. The guide says the mark stays, and the page shows no Recent section.
  - **Fix at landing.** Add "while it has rows".
  - **Verdict.** None.

### 4. Behaviour

- Behaviour R1. The report's look list and judgment call 8 still describe the tree before the round, and one change from the base is given without its before.
  - **What is wrong.** Four places in the report's first part are no longer true. The round section says only that "Line numbers in the sections above are those of the first build":
    - Judgment call 8 (report line 329) says a table `stale` names "is drawn with its mark on a failed payload whose queue is not live too".
    - The look bullets say the Recent table under `null` is "the section drawn with no rows", and that after a later failed poll "the table keeps its red mark" (lines 340-341).
    - The status-bar bullet gives the After tooltip as "...marked stale.. Open Live HPC." (line 342).
    - The first item under Limitations describes the double full stop as unchanged (line 353).

    In addition, the base drew Jobs whenever it kept Recent rows, through its gate `data.jobs.length > 0 || data.recent.length > 0`, so a failure with Recent rows kept and no kept jobs showed "No jobs in the queue for you right now." That Jobs section is now gone. The round brief's "as on the base" does not hold for that state. The round's before-and-after has the first build as its before, not the base, and does not show this state.
  - **Failure scenario.** At the look on landing, the orchestrator reads the screen against the old lines. It expects ".." in the tooltip and a 0-row Recent heading under an `unreachable` box. It judges a correct screen wrong, or misses the removed Jobs section, which it was never told about.
  - **Fix.** Rewrite those lines of the look list at landing.
  - **Verdict.** None.

### Declined to judge

- **The case-run program and `base.config.mts` were not rerun.** The builder deleted them, and this review writes no file. They are judged by reading their quoted source, by reading the code they reach, and by the quoted output.
- **The times of the two whole-suite runs (about 11:17 and 11:22) and of the `o83-diff.txt` file.** These are the builder's statements. Its transcript would settle them.
- **The red lines of `tests/data/hubs/hub-portfolio.test.ts` in the round's first verify run.** The step does not change that file, so under the rules file it was not rerun.
- **What the screen shows: the tone, the capitals, the Focus pill, the rail badge and the tooltip as drawn.** The look on landing settles these.

Reviewer usage: a6221f55f7830ecdd, claude-opus-5-5, 211425 tokens, 41 tool uses, 11 min 40 s.
