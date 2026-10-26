# Step O82 brief check

All reads were made on main at `c8d5deba` (`git rev-parse --short HEAD`). I changed nothing, opened no ssh connection, and did not open, grep or hash `config/local.yml`: every grep over `config/` excluded it.

## 1. Names

`git grep -n "HpcStatus" -- . ':!config/local.yml' ':!.scratch'` found:
- `src/lib/data/model/index.ts:636` (the re-export). The change does not make it false.
- `src/lib/data/model/model-sessions.ts:619` and `:656` (`status: HpcStatus`). `:656` sits in the file the write list names, but outside its stated line (619). The comments at `:616-618` (`unconfigured`), `:666` ("When the cluster last answered") and `:669-672` (retryMin "while the cluster is not answering") stay true for `slurm_down`.

`git grep -n "unreachable" -- . ':!config/local.yml' ':!.scratch'` found these hits outside the write list:
- `config/text/views/sources/data.yml:83`, `refused_unreachable: The cluster did not answer over ssh.` This is the same sentence, but Recover's route refusal uses it (`src/lib/state/system/machine/recover-words.ts:69`, reached from `src/lib/server/machine/runs/recover/routes.ts:254` when `clusterDisk` returns null, which is a disk read over ssh and not Slurm). The change does not make it false, and it is out of the step's scope.
- These belong to other vocabularies (accounts, post failures, Recover access, pty, changes) and the change does not make any of them false:
  - `config/text/ui.yml:6`
  - `config/text/views/personal/account-setup.yml:94`
  - `config/text/views/sources/data.yml:25`
  - `config/text/views/system/status.yml:34`
  - `src/lib/data/model/machine/model-recover.ts:51-52`
  - `src/lib/server/core/changes.ts:286`
  - `src/lib/server/machine/hpc/submit.ts:274`
  - `src/lib/server/machine/pty/channel.ts:522,527`
  - `src/lib/server/machine/runs/recover/access.ts:28,30,52`
  - `src/lib/server/machine/runs/recover/routes.ts:254`
  - `src/lib/state/client/writes.svelte.ts:228`
  - `src/lib/state/feeds/inbox.svelte.ts:10,38`
  - `src/lib/state/life/accounts.svelte.ts:101-102,168`
  - `src/lib/state/life/calendar.svelte.ts:19,60`
  - `src/lib/state/sessions/terminal/commands.svelte.ts:75,340,418,776`
  - `src/lib/state/shared/answers/answers.ts:132-133`
  - `src/lib/state/shared/stores/shapes.ts:235`
  - `src/lib/state/system/lines.svelte.ts:152`
  - `src/lib/state/system/machine/debug/debug-io.ts:20,83,111`
  - `src/lib/state/system/machine/recover-words.ts:69,126`
  - `src/lib/state/system/machine/recover.svelte.ts:63`
  - `src/lib/state/system/machine/schedules/schedule.svelte.ts:31,595`
  - `src/lib/views/shared/explorer/tree/control/fixing.svelte.ts:15,129`
  - `src/lib/views/shared/explorer/tree/control/making.svelte.ts:28,135,137,186`
  - `src/lib/views/sources/data/recover/Recover.svelte:211`
  - `tests/routes/machine/recover.test.ts:168,194`
  - `tests/server/machine/runs/recover/access.test.ts:110,114,118,126`
  - `tests/state/sessions/served-roots.client.test.ts:159`
  - `tests/ui/frame/client-runtime.ts:4`

`unreachable_msg` hits:
- `config/text/views/system/machine/hpc.yml:90`
- `src/lib/state/workbench/navigation/status.ts:191`
- `src/lib/views/system/machine/hpc/Hpc.svelte:65-66`

All three are in the write list. One reader the brief does not name, inside a listed file: `Hpc.svelte:111`, `<Login reason={data.status === 'ok' ? '' : unreachable(data.hint, data.host)} />`. It feeds `Login.svelte:104-105` (`<Empty error message={reason} />`) with the ssh sentence for every status other than `ok`. If it is left as it is, the Login node section would say "did not answer over ssh" for `slurm_down` and `error`. Premise 4 cites only `Hpc.svelte:62-67`, and item 6 names only "the error box". Item 5's "unreachable_msg is said only for unreachable" and verify 4 do cover it, so this is a gap in naming, not a widening.

`degraded`: `git grep -n "degraded" -- src tests docs config` finds only `poll.ts:154,175,222,232,268,425`, all in the write list.

`batchCommand` and `recoverCommand`: `git grep -n "batchCommand\|recoverCommand" -- src tests docs README.md` finds only `poll.ts:74,87,226,381`. No test names them.

`run` in `ssh.ts`: `git grep -n "from './ssh.ts'\|hpc/ssh'" -- src tests` finds these importers, all outside the write list:
- `src/lib/server/machine/hpc/actions.ts:3`
- `src/lib/server/machine/hpc/prewarm.ts:5`
- `src/lib/server/machine/hpc/submit.ts:31` (type only)
- `src/lib/server/machine/hpc/transfer.ts:15` (constants)
- `src/lib/server/machine/runs/recover/cluster.ts:26` (type only)
- `src/routes/api/(machine)/hpc/+server.ts:13`
- `src/routes/api/(machine)/recover/+server.ts:9`
- `tests/server/machine/runs/recover/harness.ts:24` (type)

One of them depends on the rejection's text: `actions.ts:73`, `error instanceof Error && error.message.includes('timeout') ? 'timeout' : 'error'`, on the same `run`. It stays true only if the timeout rejection that now carries stdout keeps a message containing `timeout`, and the brief does not say so. `ssh.ts:40-44` (the doc comment "The timeout rejects with `timeout`") is in the write list.

The words of `hpc.yml` and their readers outside the write list:
- `hpc.controls_offline`, read at `Jobs.svelte:86,94`, `Log.svelte:40` and `Recent.svelte:79`, through `live`, which `Hpc.svelte:107,108,116` sets to `status === 'ok'`. `slurm_down` therefore counts as offline with no change there, and "the cluster is not answering" stays true for it.
- `hpc.footer` ("Polls squeue, sacct, sinfo, and disk quota on {0}") stays true.
- `docs/HELP.md:320` ("It runs `squeue`, `sacct` and `sinfo` over ssh every `slurm.poll_min` minutes") stays true.

No test reads `hpcWords` or the HPC words: `git grep -n "hpcWords\|hpc.unreachable\|hpc_polling" -- tests` printed nothing.

## 2. The step line

`grep -n '^- \[ \] O82' .scratch/migration/plan.md` gives line 827. Each part maps as follows:
- "tells apart ssh not connecting (ssh's exit 255 or its connect timeout)" maps to item 1 (`unreachable`) and item 2 (a runner timeout before the marker). ssh's `ConnectTimeout=8` (`ssh.ts:25`) ends in exit 255, so the 255 rule covers it.
- "Slurm not answering (squeue's own error, or a timeout after the connection is made, worded with Slurm's message)" maps to item 1 (`slurm_down`, its hint) and item 2 (the remote `timeout`, the marker).
- "and any other error" maps to item 1 (`error`).
- "each with its own sentence in the HPC view" maps to items 5 and 6.
- "the last good poll kept on screen" maps to item 1's last sentence and case 8.
- "the sentence 'The cluster did not answer over ssh' only for the first" maps to item 5 and verify 4.
- "(ruling 428) (ruling Z1026)" maps to "The rule the step ends" and item 1. `plan.md:2800-2801` read as the brief quotes them.

No part is left without a requirement. Two notes:
- The status bar's long words for `slurm_down` and for `error` are not stated. Item 6 says only "the status bar's short and long words", and today `status.ts:193` gives `error` the word `error` as its long text.
- The line's own words "a timeout after the connection is made" put every post-marker timeout under Slurm. See check 5, case 4.

## 3. Premises

Premise 1 (`cat -n src/lib/server/machine/hpc/poll.ts`):
- `batchCommand` is at `:73-84` (doc at 73, function 74-84); the brief's `:73-85` includes the blank line 85. Holds.
- Timeout 40000 at `:131`. Holds.
- Unreachable on a missing `SEC_SACCT` or a non-zero `squeueCode`, with `stderr.trim() || "ssh exited ${code}"`, at `:230-238`. Holds.
- The rejection rule at `:264-271`. Holds.
- No host at `:220-224`. Holds.
- `degraded` at `:154-164`. Holds.
- `recoverCommand` is at `:86-94` (doc 86, function 87-94), not `:88-95`. The line numbers are off; the substance holds.
- The `recover()` read at `:381-385`, with `result.code !== 0 || parts.squeueCode !== 0` at `:384`. Holds.

There is one fact the brief leaves unstated: `splitSections` (`parse.ts:184-187`) gives `squeueCode` 0 when the `SEC_RC` line is absent.

Premise 2 (`cat -n src/lib/server/machine/hpc/ssh.ts`):
- The timer at `:69` calls `stop('timeout')`, which rejects `new Error(reason)` at `:67`; stdout is dropped; it resolves `{ stdout, stderr, code: code ?? 1 }` at `:81-84`. Holds.
- I did not run the ssh probe. It used `ConnectTimeout=2`; the poll's own option is `ConnectTimeout=8` (`ssh.ts:25`).

Premise 3:
- `model-sessions.ts:619` holds: `export type HpcStatus = 'starting' | 'ok' | 'unreachable' | 'error' | 'unconfigured';`.
- `sed -n 421p docs/apps.md` shows the `hpc` row with those five words. Holds.

Premise 4:
- `Head.svelte:31,35-36,51,89` holds.
- `Hpc.svelte:62-67` holds, but the function is also called at `:96` and `:111` (the Login reason, check 1).
- `hpcWords` is at `status.ts:183-198`, so the cited `:184-196` is inside it. Holds.
- The rerun grep `git grep -n "HpcStatus\|'unreachable'" -- src` lists no other reader of the HPC status. Holds.
- Some readers test only `status === 'ok'` and do not change: `hpc.svelte.ts:31,38,48`, `Hpc.svelte:102-116`, and Jobs, Recent and Log through `live`.

Premise 5 (`cat -n config/text/views/system/machine/hpc.yml`):
- `unreachable` `:88`, `unreachable_detail` `:89`, `unreachable_msg` `:90` and `error` `:39` hold.
- `controls_offline` is at `:36`, not `:37` (`grep -n controls_offline` printed `36:`).

Premise 6: I did not run the ssh command. The tree already runs a remote `timeout` in the same poll: `src/lib/server/machine/runs/recover/live/batch.ts:22` has `$(timeout 5 du -sb ...)` inside the batch's Recover section, and `prewarm.ts:100` has `timeout ${RUNG_SECS} sh -c ...`.

Premise 7:
- `grep -n "hpc/poll\|HpcStatus" .scratch/migration/agents/guarded.md` printed only `360:  Code: ... recover of src/lib/server/machine/hpc/poll.ts.`. Holds.
- In `runs.test.ts`, lines 531-534 are `const down = await ask(false);` and `expect(down.status).toBe('unreachable');` (532), followed by `sent` and `take` both equal to `[]`. Holds.
- The down fake is `{ stdout: '', stderr: 'no route', code: 255 }` (`:503`). It still reads as a failed connect under the new rule.

## 4. Cases and checks

- **Brief versus the rules file on the report path.** `spec.md:36` says "You never edit anything under `.scratch/`", while brief `:13` and "Report" have the builder write `.scratch/migration/agents/reviews/O82-report.md` in the worktree. `spec.md:3` says no brief overrides the rules file. `grep -ln "the one file you write under" briefs/*.md` gives 3 of 657 briefs, so this is a recent convention that the rules file does not yet allow.
- **Item 7's claim that no test is called for is consistent with `spec.md:59`.** That rule says a test exists only under a guarded entry, a new entry needs Axel, and a step that touches an entry's code runs that entry's test. No entry covers the poll's status (the premise 7 grep). G115 covers `recover` of `poll.ts`, which the step changes through `recoverCommand`. Case 13 and `npm run test:quick` run G115's test, since `runs.test.ts:24` imports `watchHpc` from `poll.ts`. A `slurm_down` poll gives the same outcome for `recover()` (nothing sent, `poll.ts:378`), so under "one row per input that gives a different outcome" no new row is owed. The cost reason (no lost work, no broken install, no wrong configuration accepted) matches the test rule.
- **Item 7 does not cover G115's good fake.** The good row's `batch` (`runs.test.ts:479`) is `${SEC_RC}0\n${SEC_SACCT}\n${SEC_SINFO}\n` and has no connected marker. If the builder requires the marker for an `ok` result, that row fails, and item 7 allows editing only the down fake. The brief should say that a resolved answer without the marker is read as today. The marker counts only on a runner timeout. See check 6.
- **The report shape lists "these parts in this order" but leaves out parts the rules file requires.** These still bind:
  - the name grep across `src`, `tests`, `config`, `docs` and `README.md`, with each head comment, doc comment and doc listed as still true or rewritten (`spec.md:71`);
  - the grep of the comment lines and test titles the builder adds or changes for 'before', 'still', 'no longer' and the like (`spec.md:44`); verify 5 is a different grep;
  - the before and after of each changed assertion or fixture line (`spec.md:61`), if the G115 fake is changed;
  - the one line on tests added or changed (`spec.md:68`);
  - the reuse grep before adding a helper or type, such as an error class carrying stdout (`spec.md:88`);
  - the statement on each async path in flight, after close and superseded (`spec.md:72`), since the catch path changes.
- **Case 9 and case 10 check code the step does not change.** Case 9 is the no-host path at `poll.ts:220-224`, which item 1 says stays unchanged. Case 10 is the gate `poll.ts:378`, `held?.status !== 'ok'`. Both are regression reads and harmless.
- **Case 12 should cover the Login node section** (`Hpc.svelte:111` to `Login.svelte:104-105`). Its view part should name the look on landing as its proof (`spec.md:64,66`).
- **The other cases are consistent with `spec.md:65`.** Each is a case-run program over `watchHpc` with an injected runner, which writes nothing into the diff.

## 5. The question

Could each pass without the goal being reached?

- **Step line.** Yes, in one place. Its words put "a timeout after the connection is made" under Slurm, but with every Slurm command bounded by item 2, a runner timeout after the marker can only come from something other than Slurm. The likely causes are Recover's section (`batch.ts:36-49`: `tmux ls`, then a `timeout 5 du` per session and per followed run, a count with no bound, then the log tails) or a slow transport. Such a poll would be published `slurm_down` with the false sentence "Slurm did not answer". Narrowing this departs from the line's text, so under the standing demand "a brief check never widens a step" it is for Axel or the orchestrator, not for the brief alone.
- **Item 1.** No, if items 5 and 6 hold. The order of the checks is not stated (exit 255 with the marker and a non-zero `SEC_RC`), so two correct builds could disagree. See check 6.
- **Item 2.** Yes:
  - The budget "summed, stays under 40 s with room for the connect" leaves out Recover's section, which runs after `sinfo` inside the same 40 s. Limits that meet the brief can still let the runner fire after the marker on a healthy Slurm.
  - Limits set too short turn a slow but answering controller into `slurm_down` where today's poll would succeed. No case and no measurement of normal `squeue` time bound this; the report only "states the numbers".
- **Item 3.** No.
- **Item 4.** No.
- **Item 5.** Yes, if the Login reason keeps `unreachable()`. Verify 4 catches this only if the builder judges the `:111` call site, which neither premise 4 nor item 6 names.
- **Item 6.** Yes, partly. The status bar's long text for `slurm_down` and `error` is unspecified, so `long: t('hpc.error')`, the bare word "error", would pass.
- **Item 7.** No.
- **Case 1.** No.
- **Case 2.** Yes, if ssh writes a line to stderr before Slurm's: the hint rule "the first line of stderr that is not empty" would then show it, and the case's input has no such line. See check 6.
- **Case 3.** No.
- **Case 4.** Yes. It expects `slurm_down` for any post-marker timeout, which by item 2's own construction arises only when something other than Slurm hangs (above). No case gives a timeout after `SEC_SINFO` (Slurm finished).
- **Case 5.** No for the status. Its hint is unspecified (today it is "timeout" under the ssh sentence).
- **Cases 6 and 7.** No.
- **Case 8.** No.
- **Case 9.** No (unchanged code).
- **Case 10.** No (unchanged gate).
- **Case 11.** Yes, it reads only the command text. Whether `echo "${SEC_RC}$?"` still records `squeue`'s (that is, `timeout`'s) code depends on how it is composed. A pipeline or subshell around `squeue` would change `$?`, and only a reading of the text checks that, since no case runs the command. The case should state that the `SEC_RC` echo follows the timed `squeue` directly.
- **Case 12.** Yes, if the Login section is not read (above). Otherwise it is a reading, and the look on landing is the proof.
- **Case 13.** Yes, if the good fake is edited to fit a marker requirement (above).

## 6. Implied inputs

Each input below is followed by its expected result.

- **Runner timeout after the marker with `SEC_RC=0`, `SEC_SACCT`, `SEC_SINFO` and part of Recover's section in stdout** (Slurm answered, Recover's `du` or log tails slow). Expected: not `slurm_down`. In my judgment it should be `error`, with a hint saying the poll ran past its limit after Slurm answered. Either way the brief should state the result. This departs from the step line's wording (check 5).
- **A resolved answer with code 0, `SEC_RC=0`, `SEC_SACCT` and `SEC_SINFO` but no connected marker** (this is G115's good fake at `runs.test.ts:479`). Expected: `ok`. The marker is read only on a runner timeout.
- **A resolved answer with code 255 whose stdout holds the marker and `SEC_RC` non-zero** (the connection dropped after Slurm failed). Expected: the brief should give the order of checks. In my judgment it should be `slurm_down`, since the marker proves ssh connected.
- **A resolved answer with code 255, the marker and `SEC_RC=0`** (the connection dropped mid-poll). Expected: unstated. In my judgment it should be `error`.
- **A resolved answer with code 255, empty stdout and stderr `Permission denied (publickey).` or `Host key verification failed.`** Expected under the ruling: `unreachable`, with that line as the hint. The sentence's question about the UT network or EduVPN is then wrong for this cause. That follows from the ruling as written and is not a brief defect, but it is worth a sentence in the report.
- **`slurm_down` where ssh writes a warning (`Warning: Permanently added ...`) or a login banner to stderr before `squeue`'s line.** Expected: the hint is Slurm's line (`slurm_load_jobs error: ...`). This needs `squeue`'s stderr read on its own, for example redirected into its own section, rather than the first line of the merged stderr.
- **A runner rejecting with plain `new Error('timeout')` that carries no stdout** (every injected runner in the tree today). Expected: `unreachable`.
- **The timeout rejection of `run` as `actions.ts:73` reads it.** Expected: its message still contains `timeout`, so cancel and log keep answering `timeout`.
- **A `slurm_down` poll whose rejection lands after `set()` changed the host or window.** Expected: dropped, nothing published (`poll.ts:228,266`, unchanged).
- **A controller that answers `squeue` slower than the chosen limit but within 40 s.** Expected: the brief should require limits that do not turn a slow but answering controller into `slurm_down`, and the report should state the limits with the reason for each.
- **On `slurm_down`, ssh reached the login node, so Recover's section answered but is discarded** (`take` is not called, `poll.ts:249`). Expected: unchanged by this step (not in the step line). I name it because the Login node section then shows the `slurm_down` sentence while its own data was available.

## 7. ADRs

- `ls docs/adr` printed `ls: docs/adr: No such file or directory`.
- `grep -n "^adr" .agents/plan.yaml` printed nothing (rc=1).

No record is touched. The brief's line 5 holds.

## 8. Dictated text

The brief dictates no line of a file word for word. The one dictated token is the status word `slurm_down` (Z1026, item 4). `git grep -n "slurm_down" -- . ':!config/local.yml'` finds it only in `.scratch/migration/choices.md:5253`, `orchestrator-state.md:182` and `plan.md:2801`. It is ASCII and matches the ruling, so it holds. The catalog sentences of item 5 are described but not dictated, so there is nothing to grep. Verify 5's grep, `grep -rn 'Z10[0-9][0-9]\|ruling 4[0-9][0-9]\|\bO8[0-9]\b' src config docs tests --exclude=local.yml`, printed nothing on main, so the base it is compared against is empty.

## Declined to judge

- Whether `docs/HELP.md:320` should gain a bullet on the three failure messages. `spec.md:71` asks for what a user does, and the step adds no new action, so I did not count it as owed.
- The right numeric remote limits. No measurement of normal `squeue`, `sacct` or `sinfo` times on the cluster is on file, and I ran no ssh.
- Whether the sentence for `unreachable` should drop its VPN question for authentication failures. That is wording under ruling 428, not a brief defect.

Agent usage: ae57906ed63a7f9f2, claude-opus-5-5, 171305 tokens, 41 tool uses, 6 min 43 s

## Closed

Each finding is closed in `agents/briefs/O82.md`, or in O82's line of `plan.md`.

- Section 1, names: `HpcStatus` at `model-sessions.ts:656` and the comments at `:616-618`, `:666`, `:669-672` stay true; `refused_unreachable` (`config/text/views/sources/data.yml:83`) is under "Not changed" as Recover's disk read over ssh.
- Section 2, the step line: O82's line in `plan.md` now says "a timeout after the connection is made while a Slurm command runs"; a runner timeout after Slurm answered is `error` with its own hint (item 1, case 4). This narrows the line to ruling 428's own words, "Slurm not answering": a timeout in Recover's section after Slurm answered is not Slurm not answering. Recover's section discarded on `slurm_down` (`poll.ts:249`) is under "Not changed".
- Section 3, premises: `recoverCommand` is `:86-94` and `controls_offline` `:36`, read through `live` (`Hpc.svelte:107-116`); the Login node reason at `Hpc.svelte:111`, drawn by `Login.svelte:104-105`, is in premise 4, item 6 and case 12; `actions.ts:73` reads a rejection by its `timeout` message and item 2 keeps that message; `splitSections` gives `squeueCode` 0 without `SEC_RC` (premise 2).
- Section 4, the report path: kept. The plan-orchestration skill's Steps 4 has the builder write its report, and only its report, at the path the brief names in the worktree's copy of the ledger, which the landing script leaves out of main.
- Section 4, cases and checks: the order of checks is written in item 1 (marker and `SEC_RC` decide between `slurm_down` and `error`; 255 without the marker is `unreachable`); the marker is read only to tell failures apart, so G115's good fake (`runs.test.ts:479`) and down fake (`:503`) keep their meaning (item 7); case 5 gives its hint; case 11 asks that the `SEC_RC` echo follow the timed `squeue` directly.
- Section 5, the question: Slurm's stderr is captured in its own section so an ssh warning is never the hint (item 1, case 7a); the remote limits are set (squeue 12 s, sacct 8 s, sinfo 5 s, 25 s of the 40 s) with the reason, and the report says no healthy time is on file (item 2); `error` and `slurm_down` each get their own long status-bar sentence (item 6).
- Section 6, implied inputs: cases 7, 7a, 7b and 7c add exit 255 with the marker, an ssh warning before Slurm's line, the cancel action's timeout, and an answer that lands after the host changed.
- Section 7, ADRs: no change.
- Section 8, dictated text: no change.
- Declined to judge: `docs/HELP.md:320` gains nothing, the step adds no action; the limits are set in item 2 without a measurement, said in the report; an authentication failure under `unreachable` is ruling 428's wording, and the report says so in one sentence (item 7). The report shape now asks for every part the rules file names (the name grep, the history grep, the reuse grep, the asynchronous paths).
