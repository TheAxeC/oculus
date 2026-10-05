# Step D44 refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/D44, base 6044d753c)

A page this report cites is named by its section. A finding in code keeps its `file:line`. Paths are under `tools/oculus/` unless they say otherwise.

**Where the commands ran.** The caller asked for the verify list from the root of the worktree. The worktree root has no `package.json` (`ls .agents/worktrees/D44/package.json` prints "No such file or directory"), so I ran it from `tools/oculus` in the worktree. That is where the brief ("Verify before you report") and the state file put it.

**Edits made by this review.** I edited no file in the worktree. `git status --short` lists the same 47 entries before and after the review (36 modified, 11 untracked). `npm run diagrams` left every diagram byte-identical (an `md5` comparison taken before and after, then `cmp`). All my probes ran on a copy in my scratchpad (`scratchpad/refuter/mut`).

## Verification (rerun by the reviewer)

```
$ npm run diagrams                      (from tools/oculus)
diagrams unchanged by the rerun          (md5 of docs/diagrams/* before and after)

$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh /Users/axelfaes/.claude-work/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md
$ npm run test:quick
ok      prettier (3.0 s): All matched files use Prettier code style!
ok      ASCII gate (3.6 s)
ok      svelte-kit sync (13.3 s)
ok      eslint (46.8 s)
ok      svelte-check (46.9 s): 1791214515249 COMPLETED 373 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (57.9 s): Duration  46.82s (transform 133.69s, setup 0ms, import 161.71s, tests 16.49s, environment 44ms)
test:quick: 61.1 s (limit 45.0 s); every command passed
test:quick: over the time limit
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
            build, lint of unchanged files; npm run test:landing runs them
checks: 1 commands passed
exit: 0

Verify 2: npx vitest run tests/server/machine/hpc/ tests/routes/machine/hpc.test.ts tests/server/core/auth.test.ts tests/ui/tabs/tab-actions.client.test.ts tests/views/sources/bar-actions.test.ts --reporter=verbose
 Test Files  6 passed (6)
      Tests  45 passed (45)
 (submit.test.ts rows took 96 ms to 1739 ms each; 'ends when two files source each other' 1739ms)

Verify 3: node -e "import('sh-syntax')...print('# c\necho /local/\$SLURM_JOB_ID', { minify: true })..."
"echo /local/$SLURM_JOB_ID\n"
npm run build -> build exit 0
grep -rlE "(from |import\()'sh-syntax'" build/server --include='*.js'
build/server/chunks/chunks/submit.js-BCIWcykt.js        (grep exit 0)

Verify 4: node scratchpad/d44/hubrun.mts <177 paths of find projects side-projects -name '*.slurm'>  (the builder's script; the list equals the builder's slurm-paths.txt, cmp)
names it 99 warned 78
{"linfoot-estimator":[32,0],"glassbox-decision-pipelines":[13,0],"hccnet-fl":[0,8],"engram":[3,1],"btfno":[0,14],"bttn-incident-af":[0,3],"covert-applied":[0,6],"ecg-readable-substrate":[5,1],"hccnet-revision":[21,13],"raw-pls":[1,31],"ward-bttr-crosssubject":[24,1]}
(the eight rows of section 2 print as the brief's table: ward, ecg, hccnet-revision, glassbox named; engram named with "\"$CODE/slurm/env_guard.sh\"" unread; btfno warned with env/bin/activate; raw-pls and bttn warned)

Verify 5: ASCII perl gate of agents/spec.md over src tests bin config (! -name local.yml): prints nothing, exit 0
LC_ALL=C grep -n '[^ -~]' HELP.md DESIGN.md: prints nothing
sh utils/folder-check.sh: exit 0
wc -l: Source.svelte 514, BarActions.svelte 140, LockedCode.svelte 43, validate.ts 863, model-sessions.ts 876, context.ts 743
ls src/lib/server/machine/hpc | wc -l: 10; views/sources/source holds 10 items

Verify 6: sh utils/unused-exports.sh, diff against .agents/worktrees/D44-base/unused-exports.txt (379 lines)
1c1
< Unused exports (255)
---
> Unused exports (254)
92d91
< src/lib/server/machine/hpc/ssh.ts: KILL_GRACE_MS

Verify 7: the six mutations of the report, rerun on a scratch copy, npx vitest run tests/server/machine/hpc/submit.test.ts
none       Tests  23 passed (23)
equality   4 failed | 19 passed: host, target, remote, files rows; AssertionError: expected { status: 'ok', job: '12345' } to deeply equal { Object (status, reason) }
confirm    2 failed | 21 passed: 'refuses a press with no confirm', 'refuses a confirm that is the string ...'
busy       1 failed | 22 passed: expected { status: 'ok', job: '12345' } to deeply equal { status: 'refused', reason: 'busy' }
copyfail   2 failed | 21 passed: both copy-failed rows, case 22's included (the pattern in mutate.py no longer matches after prettier; applied by sed to `if (copied.code !== 0)` at submit.ts:287)
comments   2 failed | 21 passed: 'does not count a comment that names it', 'lists a script that does not parse ...'
sources    3 failed | 20 passed: the three 'follows a source' rows

Report evidence rerun: the builder's three scratch tests (after-server.test.ts, flow.client.test.ts, barsubmit.test.ts), copied into my scratch copy
Tests  3 passed (3); cases-after.txt, flow.txt and case16.txt are identical to the builder's, once temp paths, rsync pids and millisecond counts are masked

Reviewer probes (scratchpad/refuter/mut/tests/scratch/refuter-probe.test.ts and refuter-finding.test.ts)
P1a slurm link to project file outside code: {"status":"refused","reason":"outside-code"}
P1b code/ linked to another project in the hub: {"status":"ok","plan":{...,"path":"projects/p/code/hpc/a.slurm","project":"q",...,"target":"utwente:~/projects/q/",...,"remote":"cd ~/'projects/q' && sbatch --parsable 'hpc/a.slurm'",...}}
P1c code/ linked to a hub folder in no project: {"status":"refused","reason":"no-project"}
P2 close during the plan's recompute: {"status":"ok","job":"12345"} copies=1 sshes=1
P2b a run after close(): {"status":"ok","job":"12345"} copies=2
P3 p held, q pressed: q={"status":"ok","job":"12345"} p={"status":"ok","job":"12345"}
P4 unreachable: code=255 stderr="ssh: connect to host utwente port 22: Operation timed out\nrsync(55985): error: unexpected end of file\n"
PROBE [["a/project.yml","paths.cluster must be ~/ or / followed by folder names of letters, digits, . _ and -, not \"~/a b\""],["c/project.yml","... not \"~/a;rm\""]]
PROBE projects ["a","b","c"]
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- **1 (the server): violated.**
  - Spec 3: a `code/` that is a symbolic link out of the project folder is never refused `outside-code`.
  - Behaviour 2: a run that is computing its plan when the submit state closes, or that arrives after the close, still starts rsync and ssh.
  - The rest holds. The order of refusals, the deep-equal check, the busy key, the `finally`, the console line and `refresh` all hold (the table run, the mutations, P3).
- **2 (the scratch rule): holds.** Verify 4 gives 99 named and 78 warned, and the eight rows match the brief's table. The scratch table passes, and both mutations fail it.
- **3 (the commands): violated, minor.** Spec 2: the confirm's remote line does not use the `ssh <host> '<remote>'` shape the brief named. The rsync vector, the missing `--delete`, `COPY_IDLE_S`, the `-e` built from `SSH_OPTIONS`, and the quoting of the remote command hold (case 1, case 11).
- **4 (`paths.cluster`): holds.**
  - `clusterFolder` passes case 20.
  - The snapshot finding appears and the project stays listed (the PROBE run).
  - The `manifest-schema.yml` help text is changed.
  - The eight manifest values match premise 2, and none of the eight manifests has a `paths:` key (`grep -c '^paths:'` prints 0 for each).
- **5 (the client): violated.**
  - Spec 1: the rewrite of `DESIGN.md:128` does not say what checks the vectors.
  - Standards 1: a new sentence in `DESIGN.md:135` is false.
  - The control, the palette row, the flow, the confirm and the disabled state hold (flow.txt, case16.txt).
- **6 (the tests): holds.**
  - The two tables are written.
  - They fail on the unchanged tree ("Cannot find module").
  - All six mutations fail them (rerun above).
  - Standards 3 is about the file's speed.

Cases of the brief's "Cases":

- **1: met.** case 1 of cases-after.txt, rerun: target `utwente:~/projects/ward/code/`, the remote command as the brief writes it, `named: true`.
- **2: met** for the fixture: the confirm opens with the warning, then "Not read: env/bin/activate.", and the yes reads "Submit Anyway" (flow.txt). The real btfno plan belongs to the look.
- **3: met.** flow.txt: "cancelled -> asking=null ... submitJob calls=0".
- **4: met.** `no-project`, and its sentence is said under the editor (flow.txt).
- **5: met.**
- **6: met.** Three host sentences come from runs. The fourth, by reading: `submit.ts:189` passes on the resolver's `missing` for any empty host.
- **7: partial.**
  - Exit 23 and a missing program give `copy-failed` with the right line.
  - Exit 255 with ssh's line: the reader gets rsync's last line, not ssh's (P4). Behaviour 4.
- **8: met.** `submit-failed` with sbatch's line, `refresh calls=0`.
- **9: partial.**
  - The line said is rsync's, not ssh's (P4, Behaviour 4).
  - The timing against a real unreachable host cannot be verified here.
- **10: met.**
  - The control is disabled while a Submit runs (case16.txt).
  - The busy row passes.
  - Another project's submit runs while the first is held (P3).
- **11: met.** The plan under `my hub`; `bad-cluster` for `~/a b`; and the snapshot finding (the PROBE run). The report's own evidence for the finding is weak (Proof 1).
- **12: met.**
- **13: met.**
- **14: met.**
- **15: met.**
- **16: met.** By the scratch run (the drawn label, `isJobScript`, the palette list) and by reading `status/tab-file.svelte.ts:65`: `onDisk` is false at HEAD, in the index, and on an untitled tab. The drawn control itself belongs to the look.
- **17: met.**
- **18: met.**
- **19: not verifiable here.** It is settled by the orchestrator's look (Z539 (a)). The page's half is met (flow.txt).
- **20: met.**
- **21: met.**
- **22: met, against the ruling.**
  - First half: `code=0 copied=true`, rerun.
  - Second half: the table row passes, fails under the copyfail mutation, and fails on the unchanged tree.
- **23: partial.**
  - Met: a `.slurm` link inside the root to a file outside `code/` gives `outside-code` (P1a), and a link inside `code/` plans as its target.
  - Missing: a `code/` that links out of the project folder never gives `outside-code`. It gives `outside` when the target leaves the root, the other project's plan when it points into another project (P1b), and `no-project` otherwise (P1c). Spec 3.
- **24: met.** `files=2 bytes=5242919`.
- **25: partial.**
  - Met: a close during the copy or during sbatch ends the child and releases the key, and no sbatch starts after a copy the close ended.
  - Missing: a run that is computing when the close comes, or that starts after it, still spawns both children (P2, P2b). Behaviour 2.
- **26: met.**

## 1. Spec

- **Spec 1: the rewrite of `DESIGN.md:128` says too little.**
  - Hunk: "`rev-parse`, `check-ignore`, `ls-files`, `for-each-ref` and `check-attr` are held to their exact vectors in the source." and "the list and the absence of `--force` are held in the source."
  - What is wrong: section 5 asked the sentence to say what checks those vectors (the list in `run.ts`'s head comment and in this paragraph, read at review) and that no test pins them. The new text says only "held ... in the source", so a reader still cannot tell what enforces it.
  - Failure scenario: a later step adds a git read form without adding it to `run.ts`'s list. A reader of DESIGN.md has no way to know the review of that list is the only guard.
  - Verdict: item 5.
- **Spec 2: the confirm's remote line has a different shape.**
  - Place: `config/text/views/sources/source.yml`, `submit_detail_remote: 'Then runs on {0}: {1}'`.
  - What is wrong: section 3 named the shape `ssh <host> '<remote>'`. The builder reported the change as a judgment call. The reason holds: wrapping a command that already holds single quotes in more single quotes shows a different command.
  - Failure scenario: none for correctness, since the line shows the exact remote string. The orchestrator accepts or reverses it at landing.
  - Verdict: item 3, minor.
- **Spec 3: a `code/` link is decided by where it leads.**
  - Place: `src/lib/server/machine/hpc/submit.ts:175-185`: `const file = realPath(found.path, true); ... const project = projectOf(file, deps);`.
  - What is wrong: the project is chosen from the file's real path. The `inside(code, home)` check never sees a `code/` that links into another project, since that project is chosen instead.
  - Failure scenario: `projects/p/code` is a link to `projects/q/code`. Submit on `projects/p/code/hpc/a.slurm` plans project `q`, copies q's code to `~/projects/q/` and runs there (P1b). The brief's case 23 says `outside-code`. A `code/` linked to a hub folder in no project answers `no-project` (P1c), and one linked out of the root answers `outside`. The confirm does name `q`, so the reader can see it.
  - Expected fix: choose the project from the asked path (`found.path` before real-path resolution), then require the real code folder to lie under that project's real folder.
  - Verdict: item 1, case 23.
- **Spec 4: a case-rule conflict was not handed back.**
  - Place: `agents/reviews/D44-report.md`, "The cases' first run", case 7: "The vector against a fake ssh: exit 255, `rsync(36638): error: unexpected end of file`".
  - What is wrong: the first run already showed that cases 7 and 9 (ssh's line) conflict with item 4's "last non-empty line". The brief's "When the first run finds a case the brief's own rules get wrong, the builder stops there" required handing it back with case 22. It is carried instead as "Open for a decision" after the build.
  - Failure scenario: the defect reaches review instead of being ruled at round 0. See Behaviour 4.

## 2. Proof

- **Proof 1: the evidence for case 11's finding does not exercise it.**
  - Hunk: report case 11, "the snapshot finding is the `findings.validate.bad_cluster` sentence (`tests/data` suites in the verify list pass)".
  - What is wrong: no `tests/data` suite builds a manifest with `paths.cluster`, so the quoted evidence does not reach the claim. My PROBE run shows the claim holds.
  - Failure scenario: none now. The DONE row rests on a run that does not reach it.
- **Proof 2: a stated outcome for `code/` links was never run.**
  - Hunk: report, "Brief wrong", "a link whose target is inside the root but outside `code/` would be `outside-code`".
  - What is wrong: no run backs it. It is true for a `.slurm` link (P1a) and false for a `code/` link (P1b, P1c).
  - Failure scenario: the orchestrator closes case 23 as "brief wrong" while the `code/`-link half is a defect (Spec 3).
- **Proof 3: the report leaves out items the rules file requires.**
  - The "still true" or "rewritten" mark for each paragraph and head comment the brief lists under "Paragraphs and head comments that describe what this step changes".
  - The grep of each changed name (`OPTIONS` to `SSH_OPTIONS`, `projectOf` to `deepestHolding`, the `HpcTarget` shape) across `src`, `tests`, `config` and the docs.
  - The reuse grep before writing a helper.
  - What the code does for each new key or id when it is empty, duplicated or colliding (`paths.cluster`, `oculus.submit`, `submit_job`, the `plan` and `submit` actions).
  - Failure scenario: the false head comments in Standards 4 went unnoticed, because nobody walked the list. My own greps:
    - `grep -rn "projectOf\b"` finds no stale reference.
    - `oculus.submit` and `submit_job` each appear once.
    - `clusterFolder('')` and `'~/'` are refused, by reading `shapes.ts:208-221`.
- **Proof 4: the history-word grep is incomplete.**
  - Hunk: report verify 8, `grep -nEi "previously\|used to\|no longer\|reverted\|formerly\|originally\|earlier\|D44\|step "`.
  - What is wrong: it leaves out words on the rules file's list ("before", "still", "always has been", "always had", "as before", "the step adds", "after this package lands"), and it judges no hits.
  - My grep over the added comment lines and test titles finds nine hits. None is history (for example "a warning before the reader submits it", "a word that still holds a `$`").
  - Failure scenario: none this time. The check as written could miss a history comment.

## 3. Standards

- **Standards 1: a new sentence in `DESIGN.md:135` is false.**
  - Hunk: "**Submit Job** (`server/machine/hpc/submit.ts`) is the one write the view's host receives".
  - What is wrong: Live HPC's cancel runs `scancel <id>` on the same host through the same route (`src/lib/server/machine/hpc/actions.ts:39`). So Submit is not the only write the cluster receives.
  - Failure scenario: a reader auditing which oculus actions change cluster state misses cancel.
  - Verdict: item 5.
- **Standards 2: an edited comment is not rewrapped.**
  - Place: `src/lib/server/machine/hpc/ssh.ts:16`, " * copy. `ConnectTimeout` bounds the connect and `BatchMode` keeps a" (68 columns), followed by line 17 at 100 columns.
  - What is wrong: the rules file says an edited comment is rewrapped as a whole paragraph, so no line inside a sentence ends short.
  - Failure scenario: a cosmetic defect that the landing would carry.
- **Standards 3: the test file is slow and not tagged slow.**
  - Place: `tests/server/machine/hpc/submit.test.ts:24,35`, `isolateGit(); ... git(code, 'init', '-q');` with `kept: keptFiles`.
  - What is wrong: the rules file says a test runs well under a second, and one that cannot (a real process) is tagged slow. Every row here starts real `git` processes, and the rows took 96 ms to 1739 ms. Every other test file that calls `isolateGit()` carries `@module-tag slow`: `tests/server/git/untracked/ignore.test.ts`, `trash.test.ts`, `refs/delete-branch.test.ts`, `refs/detached.test.ts`, `refs/cherry-pick.test.ts` and `tests/routes/git/untracked.test.ts`. This file does not.
  - `kept` is already injectable. A `kept` that lists the fixture folder from disk would make the tables fast, with no git.
  - Failure scenario: under load, a row passes vitest's 5000 ms default and fails `test:quick` for every later step that touches `submit.ts`.
- **Standards 4: head comments describe `said` as refusals only.**
  - Places: `src/lib/views/sources/source/save/SourceNote.svelte:2-5,14,51` ("what a refused first Save or a refused LaTeX action said") and `Source.svelte:177`, `/** What a refused LaTeX action or untitled save said, or the empty string. */`.
  - What is wrong: `said` now also carries Submit's progress line and its success line. These comments are now false, and the step did not reread them.
  - Failure scenario: a later reader styles or routes `said` as a refusal-only slot. That is already the visible defect in Behaviour 1.
- **Standards 5: an existing helper is rewritten instead of reused.**
  - Place: `src/lib/views/sources/source/Source.svelte:259`, `unsaved: () => draft.text !== draft.saved,`.
  - What is wrong: this re-derives `sourceDirty` of `src/lib/state/sessions/source.svelte.ts:270` (`draft.loaded && draft.text !== draft.saved`) instead of reusing it (the DRY rule of agents/spec.md).
  - Failure scenario: if the store's notion of unsaved changes, Submit's save-first test drifts from the close question's.

## 4. Behaviour

- **Behaviour 1: the success line is drawn as an alert.**
  - Place: `src/lib/views/sources/source/actions/submit-job.svelte.ts:85,92`: `deps.said(t('source.submit_running'))` and `deps.said(t('source.submit_done', done.job))`.
  - What is wrong: `said` is drawn by `save/SourceNote.svelte:31` as `<span class="refused" role="alert">`, in red (`color: var(--c-red-txt)`). So "Copying the code and submitting the job..." and "Submitted batch job 12345" show in the refusal colour and are announced as alerts.
  - The report's "Host- or user-visible changes" names the words and not their style.
  - Failure scenario: a reader submits a job, sees "Submitted batch job 12345" in red and thinks it failed. A screen reader announces success as an alert.
- **Behaviour 2: the close does not stop every run.**
  - Place: `src/lib/server/machine/hpc/submit.ts:62-70` (`submitState` keeps no closed flag) and `:264-271`.
  - What is wrong: `close()` aborts only the controllers already registered. A run still computing its plan registers a new controller afterwards and spawns rsync and ssh. A request after the close does the same (P2, P2b).
  - The report states the close only for runs in flight. The rules file asks for each asynchronous path in flight, after close and superseded.
  - Failure scenario: a dev-server reload closes the context while a Submit is in `scratchRule`'s `await print`. The copy and sbatch then run, held by no live state, and no later close ends them.
  - Expected fix: a `closed` flag set by `close()`, checked after `compute` and before the key is taken, refusing the run.
- **Behaviour 3: a path outside the served roots is refused without a reason.**
  - Places: `submit.ts:174`, `if ('error' in found) return refuse('outside');`, and `state/system/machine/submit.ts:63` mapping an unknown word to `failed`.
  - What is wrong: a `.slurm` whose real path leaves the served root (the case 23 link) is said as "Submit failed." with no reason.
  - Failure scenario: the reader cannot tell why Submit refused a script that sits in their code folder.
- **Behaviour 4: an unreachable host is reported with rsync's line, not ssh's.**
  - Place: `submit.ts:231-235,287-288`, `lastLine(copied.stderr, ...)`.
  - What is wrong: off the VPN, openrsync's last line is "rsync(55985): error: unexpected end of file" (P4), so the page says "The copy failed: rsync(...): error: unexpected end of file".
  - Failure scenario: the most common failure, being off the VPN, reads as an rsync fault.
  - Verdict: cases 7 and 9.

**The report's "Open for a decision".**

- **The copy-failed line defeats the brief's goal.** Cases 7 and 9 say the reader gets ssh's line ("connect to host ... timed out"). The reader of "rsync(66905): error: unexpected end of file" does not learn that the host did not answer.
- **This is not a decision for the user.** The brief's cases already require ssh's line. The case 22 ruling only restates item 4 for case 22's missing folder. The fix belongs to the repair round.
- **Expected fix:** when stderr holds a line that begins `ssh:`, carry that line; otherwise carry the last non-empty line. This names the cause for both openrsync (ssh's line first, then rsync's) and GNU rsync (ssh's line, then "connection unexpectedly closed" and "error in rsync protocol data stream (code 255)"). It also keeps a single line under the editor.
- **The builder's options.** Its option (2), up to three lines, also shows ssh's line. Joined by a newline, though, it would collapse into one run of words in `SourceNote`'s span. Its option (3), the first line on exit 255, also works, but it ties the rule to an exit code rsync reuses. Option (1) is the lazy one.
- **A test row to add.** A row in table 1: the copy exits 255 with ssh's line, then rsync's. Expected: `copy-failed` with ssh's line, and the ssh runner called 0 times.

**Changes outside the write list.**

- **The `SubmitPlan` type** in `data/model/model-sessions.ts` and `index.ts`: needed and correctly placed. The server and the page's state module both read the wire shape. The server may not import state, and `HpcPayload` already lives in `model-sessions.ts`. That file is now 876 lines of the 880 limit (`wc -l`), so the next step that adds a type there must split it.
- **The four files of the `Source.svelte` split** (`status/tab-file.svelte.ts`, `save/LockedCode.svelte`, `save/locked-words.ts`, `save/tab-save.svelte.ts`): inside the brief's allowance. Each holds one named concern, the folder stays at 10 items, `Source.svelte` is 514 lines, and the G37 tests pass (verify 2).
- **The confirm's wording:** see Spec 2. It is accurate and should be kept.
- **Copy's abort** (`transfer.ts:63-69` resolves code 1 "aborted" at once): consistent with how `ssh.ts`'s `run` rejects on its timeout. The key is released up to `KILL_GRACE_MS` (2 s) before a stubborn rsync has died, so a run superseding it on the same folder could overlap that dying child. Only a close aborts a run, so this matters only together with Behaviour 2.

## Declined to judge

- Case 19, and the real ward and btfno plans at the confirm. They are the orchestrator's look on TEST (Z539 (a)), and no ssh, rsync to a host or sbatch may run here.
- Case 9's timing against a real unreachable host (the 8 s connect bound). Settling it needs the network.
- Whether GNU rsync on the cluster expands `~/` in the unquoted target and creates the last missing level (the cluster side of case 22's ruling). This cannot be checked without the cluster.
- The visual placement of Submit among the bar's actions, and its `[>]` and `play` glyph. That is the look's, and the brief leaves the order to the builder.
- The plan line numbers in the brief's authority paragraph each drifted by one (`grep -n` prints Z347 at 1076, Z488 at 1219, Z536 at 1257, Z538 at 1270, Z539 at 1271). The plan moved after the brief was written. Nothing in the diff rests on them.

Reviewer usage:
- Agent id: not visible to the reviewer.
- Served model: claude-opus-5-5.
- Tokens: not visible to the reviewer.
- Tool uses: about 50.
- Time: about 18 minutes, from 17:31 (the state file's record of the start) to 17:49 (`date`).

Usage from the completion notice: aa5a6d5c963790bee, claude-opus-5-5, 315,905 tokens, 75 tool uses, 19.9 min.

## Closed

Every finding is sent to the builder in repair round 1 (`agents/briefs/D44-round1.md`), with its ruling there; Spec 2 is accepted as built (ruling 2 of the round).

## Repair round 1, refuted

Reviewer over round 1: a023b1cea1940a333, claude-opus-5-5. Worktree `.agents/worktrees/D44`, base 6044d753c; the round's delta read against the round-0 diff (`scratchpad/d44.diff`) and the whole diff since the base.

### Verification

```
$ npm run diagrams            (from tools/oculus)
diagrams-unchanged            (md5 of docs/diagrams/* before and after)

$ sh /Users/axelfaes/.claude-work/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md
        tests/server/machine/hpc/submit-files.test.ts: changed, run by npm run test:checks or test:slow
ok      prettier (6.7 s): All matched files use Prettier code style!
ok      ASCII gate (7.4 s)
ok      svelte-kit sync (10.6 s)
ok      eslint (18.2 s)
ok      svelte-check (47.1 s): 1791218490293 COMPLETED 373 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (80.0 s): Duration  62.76s (transform 124.95s, setup 0ms, import 183.88s, tests 47.90s, environment 1.24s)
test:quick: 88.0 s (limit 45.0 s); every command passed
test:quick: over the time limit
checks: 1 commands passed
```

`checks.sh` takes only the state file, so `-- --base 6044d753c` is not passed; the quick tier's default base is HEAD, which is the base. The 45 s limit was run with four other agents on the machine; whether the step alone stays under it is not verified.

Brief verify 2 (as written): 7 files, 55 tests passed; with the round's new files: 11 files, 72 tests. `submit.test.ts` 29 passed, 1.92 s; `submit-files.test.ts` 4 passed, 1.52 s. Verify 3: `sh-syntax` prints `echo /local/$SLURM_JOB_ID`, the build exits 0 and `build/server/chunks/chunks/submit.js-DovpnpQa.js` imports it. Verify 4: 177 scripts, named 99, warned 78, the eight rows of section 2's table. Verify 5: the ASCII gate and `LC_ALL=C grep` print nothing; `folder-check.sh` exits 0; `Source.svelte` 520 of 520. Verify 6: unused exports 255 to 254, only `KILL_GRACE_MS` leaving. Tree checks: 15 passed, 1 skipped; 226 tests passed, 3 skipped.

Round 1 mutations on a scratch copy, each failing its row: M1 copyFailureLine as lastLine (1 failed); M2 project from the real path (2 failed); M3 and M4 the two `closed` checks (1 failed each); M5 and M6 the `closed` and `outside` sentences (1 failed each); M7a progress as refusal (2 failed); M7b SourceNote ignoring the tone (1 failed); M8 checkClusterFolder removed (5 failed). Round 0's equality (4 failed) and busy (1 failed) mutations still fail. `submit-files.test.ts`: results/logs filter removed, `expected { files: 5, bytes: 83 } to deeply equal { files: 3, bytes: 81 }`; missing-path filter removed, `expected { files: 3, bytes: 70 } to deeply equal { files: 2, bytes: 70 }`.

### The 14 rulings

1 closed (`submit.ts:266-269`, `:330`; M1). 2 accepted as built. 3 closed (`submit.ts:166-169`, `:206-210`; P1b, P1c; M2). 4 closed (`:72-85`, `:303`, `:308`; state `submit.ts:46`; M3 to M5); a `plan` request after the close still runs `git ls-files`, outside the ruling's rows. 5 closed (state `submit.ts:45`; M6); the comment at `submit.ts:36` is now false (Standards 2). 6 closed (`SourceNote.svelte:34-40`, `tab-said.svelte.ts`, `submit-job.svelte.ts:86,93,108`; M7a, M7b). 7 closed by reading. 8 closed (`Source.svelte:260`). 9 closed for the read vectors; the git-writes sentence is false (Spec 1). 10 closed; the paragraph contradicts itself (Standards 1). 11 closed. 12 closed by moving rows, no check deleted. 13 closed (seven rows, M8 fails five). 14 partly closed (Proof 1, Proof 2).

The builder's `deepestHolding` choice: both callers (`processes/read.ts:120`, `submit.ts:157`) import `deepestHolding` from `src/lib/data/helpers/files/paths.ts:56`; round 0's second copy under `src/lib/server/core/paths.ts` is gone. It does not match the brief's literal location (`D44.md:272`) and meets decision 13's purpose (the rule exists once). The boundary table allows `server` to import `data/**` (`boundaries.test.ts:185`). The rule is the same on a POSIX host over `realPath` output; it differs only on a host whose separator is not `/` and for an empty holder, which `realPath` never returns.

### Verdicts, for the whole diff since the base

Items: 1 holds; 2 holds; 3 holds; 4 holds; 5 violated (Spec 1, Standards 1); 6 holds for G43's two tables (Standards 3, Proof 2 for the rest).

Cases: 1 to 8 met; 9 not verifiable for the 8 s bound against an unreachable host (the look, off the VPN); 10 to 18 met; 19 not verifiable here (the orchestrator's look, Z539 (a)); 20 to 26 met.

### Spec

- Spec 1. `DESIGN.md:128`: "the list and the absence of `--force` are held by the same two lists, read at review": the two lists are the head comment of `run.ts` and the paragraph, and `run.ts:10-43` lists only read forms; the write forms are in the head comment of `server/git/git-write.ts`. A reader adding a write form looks in the wrong module. Item 5.

### Proof

- Proof 1. `agents/reviews/D44-report.md` keeps round-0 text: "Doc text" (`:187-195`) quotes round-0 DESIGN.md:128 sentences and proposes G43's Test line without `submit-files.test.ts`; case 7's row (`:32`) says rsync's line is shown; verify 2 (`:58`) says 6 files and 45 tests; the Files table (`:85-116`) omits `said-tone.ts`, `tab-said.svelte.ts`, `submit-world.ts`, `submit-files.test.ts`, `cluster-folder.test.ts`, the state `submit.test.ts`, `source-note.test.ts`, `submit-job.client.test.ts`, and keeps round-0 counts; the history-word section (`:272`) judges `core/paths.ts`. A G43 Test line written from "Doc text" would leave `submit-files.test.ts` guarding nothing. Ruling 14.
- Proof 2. `tests/server/machine/hpc/submit-files.test.ts` has no quoted run with its behaviour removed, which `agents/spec.md:62` requires; the reviewer's two mutation runs above show it fails without the behaviour.

### Standards

- Standards 1. `DESIGN.md:135`: "(`copy-failed` carries rsync's last line, ...)" contradicts the sentence added later in the paragraph, "A failed copy carries one line of rsync's stderr: the first line that begins `ssh:` when there is one, else the last." A reader trusting the first clause reverts `copyFailureLine`. Item 5.
- Standards 2. `src/lib/server/machine/hpc/submit.ts:36`: "`outside` is the page's `failed`" is false after ruling 5; a maintainer removes the `outside` sentence as redundant.
- Standards 3. New test files no `agents/guarded.md` entry names: `tests/server/machine/hpc/submit-files.test.ts` (G43's Test line names only `submit.test.ts`; its Code line lacks `keptFiles`), `tests/data/snapshot/cluster-folder.test.ts` (G15 names `resources.test.ts`), `tests/state/system/machine/submit.test.ts` (no entry), `tests/views/sources/source-note.test.ts` and `tests/views/sources/submit-job.client.test.ts` (`guarded.md:3`: views have no entry). The round ordered these rows; the disposition is the orchestrator's at landing.
- Standards 4. `src/lib/data/helpers/files/paths.ts:1-11`: the head comment gives a page-only reason for the `/` rules and does not name the server's two callers, so a change for the page's sake would silently change the processes read and Submit's project.

### Behaviour

None: each visible change of the round is stated with its before and after in the report's "Repair round 1".

### Declined to judge

- Case 19 and the real ward and btfno plans at the confirm (the orchestrator's look, Z539 (a)).
- Case 9's 8 s bound against a real unreachable host.
- Whether GNU rsync on the cluster expands `~/` in the unquoted target and creates the last missing level.
- Submit's place among the bar's actions and its glyph (the look).
- A path spelling a project folder in another letter case would now plan as `no-project`; the page sends paths from the file browser's listing.
- The 45 s limit of the quick list.

Usage from the completion notice: a023b1cea1940a333, claude-opus-5-5, 321,296 tokens, 75 tool uses, 18.5 min.

### Closed

None of this run's findings is sent to the builder (the run over the last round).
- Spec 1: fixed at landing; DESIGN.md:128 now says the write forms are held by the head comment of `server/git/git-write.ts` and the paragraph.
- Standards 1: fixed at landing; DESIGN.md:135's first clause now says `copy-failed` carries one line of rsync's stderr, which the later sentence defines.
- Standards 2: fixed at landing; `submit.ts:36` reads "`outside`: the path is no file under a served root."
- Standards 4: fixed at landing; the head comment of `src/lib/data/helpers/files/paths.ts` names the server's two readers of `deepestHolding`.
- Standards 3: `submit-files.test.ts` named under G43 with `keptFiles` in its Code line (Z564); `cluster-folder.test.ts` named under G15 (Z565); the state test and the two view tests raised to Axel as Z566.
- Proof 1: the landing reads the tree, never the report's stale sections: G43's Test line is written from the tree (Z564), DESIGN.md:128 is read at landing, and the changed paths are compared with the write list from `git diff --name-only`.
- Proof 2: closed by this run's two mutation runs of `submit-files.test.ts`, quoted above, which the booking carries.
- The `deepestHolding` choice: accepted; it meets decision 13's purpose (one copy of the rule) inside the boundary table.
