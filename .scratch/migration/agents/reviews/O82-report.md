NOT DONE: verify 1 is red. `npm run test:quick` exited 1 because one slow test timed out in a file this step does not change (tests/data/hubs/hub-portfolio.test.ts, "resolves a reference of the second hub in the primary hub when the primary alone holds the key", timed out at 20000 ms). Run alone it passes 16 of 16. Every other item, case and check of the brief is done.

# O82 report: the HPC poll's three failures

## Open items of the state file, verbatim

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.
```

The list holds no entry.

## The cases' first run, on the unchanged tree

All of these were run before any change. Cases 1 to 11 come from the case-run program `cases.ts` (source below), run as `node cases.ts <worktree>`. Its output is quoted exactly as printed, with the poll's own `hpc publish:` console lines filtered out. Each case first runs a good poll, then the case's answer.

```
case 1 (good, then 255 no marker)
  status=ok hint=undefined jobs=1 lastOk=kept retryMin=2
  status=unreachable hint="ssh: connect to host x port 22: Operation timed out" jobs=1 lastOk=kept retryMin=2
case 2 (good, then marker, squeue rc 1, Slurm line in its own section)
  status=ok hint=undefined jobs=1 lastOk=kept retryMin=2
  status=unreachable hint="ssh exited 1" jobs=1 lastOk=kept retryMin=2
case 3 (good, then marker, squeue rc 124)
  status=ok hint=undefined jobs=1 lastOk=kept retryMin=2
  status=unreachable hint="ssh exited 1" jobs=1 lastOk=kept retryMin=2
case 4a (runner timeout, marker only in stdout)
  status=ok hint=undefined jobs=1 lastOk=kept retryMin=2
  status=unreachable hint="timeout" jobs=1 lastOk=kept retryMin=2
case 4b (runner timeout after SEC_SINFO, Recover section slow)
  status=ok hint=undefined jobs=1 lastOk=kept retryMin=2
  status=unreachable hint="timeout" jobs=1 lastOk=kept retryMin=2
case 5a (runner timeout, empty stdout)
  status=ok hint=undefined jobs=1 lastOk=kept retryMin=2
  status=unreachable hint="timeout" jobs=1 lastOk=kept retryMin=2
case 5b (plain new Error('timeout'))
  status=ok hint=undefined jobs=1 lastOk=kept retryMin=2
  status=unreachable hint="timeout" jobs=1 lastOk=kept retryMin=2
case 6 (spawn ssh ENOENT)
  status=ok hint=undefined jobs=1 lastOk=kept retryMin=2
  status=error hint="spawn ssh ENOENT" jobs=1 lastOk=kept retryMin=2
case 7 (code 0, rc 0, no SEC_SACCT)
  status=ok hint=undefined jobs=1 lastOk=kept retryMin=2
  status=unreachable hint="ssh exited 0" jobs=1 lastOk=kept retryMin=2
case 7 (code 255, marker, rc 1)
  status=ok hint=undefined jobs=1 lastOk=kept retryMin=2
  status=unreachable hint="Connection to x closed by remote host." jobs=1 lastOk=kept retryMin=2
case 7 (code 255, marker, rc 0)
  status=ok hint=undefined jobs=1 lastOk=kept retryMin=2
  status=ok hint=undefined jobs=1 lastOk=kept retryMin=2
case 7a (ssh warning on stderr before Slurm line)
  status=ok hint=undefined jobs=1 lastOk=kept retryMin=2
  status=unreachable hint="Warning: Permanently added 'x' (ED25519) to the list of known hosts.\nslurm_load_jobs error: Unable to contact slurm controller (connect failure)" jobs=1 lastOk=kept retryMin=2
case 7b (cancel, log with a runner timeout)
  cancel="rejected with message \"timeout\"" log={"status":"timeout","log":"","path":""}
case 7c (slurm_down answer after the host changed)
  published: starting@cluster, starting@other batch calls=2
case 8 (good, case 2, good)
  status=ok hint=undefined jobs=1 lastOk=kept retryMin=2
  status=unreachable hint="ssh exited 1" jobs=1 lastOk=kept retryMin=2
  status=ok hint=undefined jobs=1 lastOk=kept retryMin=2
case 9 (no host)
  status=unreachable hint="the cluster x has no host" jobs=0 lastOk=none retryMin=2
case 10 (recover() after case 2)
  status=ok hint=undefined jobs=1 lastOk=kept retryMin=2
  status=unreachable hint="ssh exited 1" jobs=1 lastOk=kept retryMin=2
  recover() sent 0 commands
case 11 batchCommand(7, "") with its date replaced:
squeue --me -h -o '%i|%j|%P|%T|%M|%l|%D|%C|%b|%m|%Q|%S|%R'
echo "@@oculus:squeue_rc=$?"
echo "@@oculus:sacct@@"
sacct -u "$USER" -S DATE -o JobID,JobName%60,State,ExitCode,Elapsed,End,ReqMem,MaxRSS,TotalCPU,AllocCPUS,NNodes,ElapsedRaw -Pn
echo "@@oculus:sinfo@@"
sinfo -h -o '%P|%a|%D|%t|%G'
case 11 recoverCommand('x'):
squeue --me -h -o '%i|%j|%P|%T|%M|%l|%D|%C|%b|%m|%Q|%S|%R'
echo "@@oculus:squeue_rc=$?"
echo "@@oculus:recover@@"
x
```

Case 12, from the program `client-cases.mjs` (source below) on the unchanged tree:

```
case 12 hpcWords(unreachable): short="unreachable" long="The cluster did not answer over ssh. Is this Mac on the UT network or on EduVPN?"
case 12 hpcWords(slurm_down): short="0 running, 0 pending" long="0 running | 0 pending | 0 total"
case 12 hpcWords(error): short="error" long="error"
```

Case 12, the views as they read on the unchanged tree:
- `Head.svelte:31` `failed` is `unreachable || error`.
- `Head.svelte:35-36` gives the pill `hpc.unreachable` or `hpc.error`.
- `Head.svelte:89` gives the `bad` class to those two only.
- `Hpc.svelte:62-67` `unreachable()` gives every status other than `ok` the sentence `hpc.unreachable_msg`, in the error box (`:96`) and in the Login node reason (`:111`, drawn by `Login.svelte:104-105`).

Case 13, `npx vitest run tests/server/machine/runs/recover/runs.test.ts --reporter=verbose` on the unchanged tree:

```
 <CHECK MARK> |unit| tests/server/machine/runs/recover/runs.test.ts > a Recover run on the cluster > runs Recover's section alone with the queue while Live HPC's last poll was answered, and nothing otherwise 3ms
 Test Files  1 passed (1)
      Tests  16 passed (16)
```

Not one of the brief's rules gives a wrong result on these inputs. Case 7b describes today's behaviour wrongly, and the section "Anything in the brief that was wrong" below gives the evidence. The rule the case checks is item 2's: the timeout rejection keeps the message `timeout`. That rule is right, and the case's "as today" holds.

## DONE / NOT DONE

| Item | State | Proof (command, output as printed) |
|---|---|---|
| 1. Three failures told apart | DONE | `node cases.ts <worktree>`, cases 1 to 10 below: `unreachable`, `slurm_down` and `error` exactly where the brief puts them; `lastOk=kept`, `jobs=1` and `retryMin=2` on every one. |
| 2. The poll ends before its own timeout | DONE | Case 11, after the change: `timeout 12 squeue ...`, `timeout 8 sacct ...` and `timeout 5 sinfo ...`, with the marker first and `echo "@@oculus:squeue_rc=$?"` directly after the timed `squeue`. `RunTimeout` (`ssh.ts:44`) carries stdout and has the message `timeout`. Case 7b: `cancel="rejected with message \"timeout\"" log={"status":"timeout",...}`. `node shell-cases.ts`: `timeout stops squeue (124): status=slurm_down hint="LATE"`. |
| 3. `recover()` and the quota read keep their behaviour | DONE | Case 10: `recover() sent 0 commands`. Case 13 is green. `publishQuota` (`poll.ts:273-288`) is unchanged; read from the diff. |
| 4. The status word | DONE | `model-sessions.ts:621` `'starting' \| 'ok' \| 'unreachable' \| 'slurm_down' \| 'error' \| 'unconfigured'`; `docs/apps.md:421` lists it with a clause on each failure word. |
| 5. The words | DONE | `hpc.yml`: `slurm_down: Slurm down`, `slurm_down_msg`, `error_msg`, and the three `hint_*` lines. `git grep -n "unreachable_msg" -- src` prints only `hpc.ts:41`, inside `status === 'unreachable'`. |
| 6. The readers | DONE (by reading and the case 12 program; the look on landing is the proof for the view) | `node client-cases.mjs <worktree>` after the change, quoted below. Head, Hpc and Login are read in case 12. |
| 7. Tests, and the one sentence | DONE | The G115 rows are unchanged and green (case 13). The sentence is under "Judgment calls". |
| Case 1 | DONE | `status=unreachable hint="ssh: connect to host x port 22: Operation timed out" jobs=1 lastOk=kept` |
| Case 2 | DONE | `status=slurm_down hint="slurm_load_jobs error: Unable to contact slurm controller (connect failure)" jobs=1 lastOk=kept` |
| Case 3 | DONE | `status=slurm_down hint="no answer within the time limit"` |
| Case 4 | DONE | 4a `status=slurm_down hint="no answer within the time limit"`; 4b `status=error hint="Slurm answered, and the rest of the poll ran past its time limit"` |
| Case 5 | DONE | 5a and 5b `status=unreachable hint="timeout"` |
| Case 6 | DONE | `status=error hint="spawn ssh ENOENT"` |
| Case 7 | DONE | `code 0, rc 0, no SEC_SACCT`: `status=error hint="ssh exited 0"`; `code 255, marker, rc 1`: `status=slurm_down`; `code 255, marker, rc 0`: `status=error hint="Connection to x closed by remote host."` |
| Case 7a | DONE | `status=slurm_down hint="slurm_load_jobs error: Unable to contact slurm controller (connect failure)"`. The ssh warning is not in the hint. |
| Case 7b | DONE (with the brief correction below) | `cancel="rejected with message \"timeout\"" log={"status":"timeout","log":"","path":""}`, the same as the first run. |
| Case 7c | DONE | `published: starting@cluster, starting@other batch calls=2`; no `slurm_down` was published for the old host. |
| Case 8 | DONE | `ok`, then `slurm_down ... jobs=1 lastOk=kept`, then `ok` |
| Case 9 | DONE | `status=unreachable hint="the cluster x has no host" jobs=0 lastOk=none` |
| Case 10 | DONE | `recover() sent 0 commands` |
| Case 11 | DONE | The command text after the change, quoted under the case-run programs |
| Case 12 | DONE (program and reading; the look on landing is the proof for the view) | `hpcWords(slurm_down): short="Slurm down" long="The cluster was reached over ssh, and Slurm did not answer."`; `hpcWords(error): short="error" long="The poll of the cluster failed."` |
| Case 13 | DONE | `npx vitest run tests/server/machine/runs/recover/runs.test.ts --reporter=verbose`: `Test Files  1 passed (1)` / `Tests  16 passed (16)` |
| Verify 1, `npm run test:quick` | NOT DONE (red in a file the step does not change) | `test:quick: 170.5 s; failed: vitest slow`; `FAIL  \|unit\| tests/data/hubs/hub-portfolio.test.ts > the portfolio of several hubs > resolves a reference of the second hub in the primary hub when the primary alone holds the key` / `Error: Test timed out in 20000ms.` Every other line: `ok      ASCII gate (1.6 s)`, `ok      prettier (2.8 s): All matched files use Prettier code style!`, `ok      eslint (114.7 s)`, `ok      svelte-check (135.6 s): 1793002276223 COMPLETED 544 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok      vitest (143.9 s)`, `ok      vitest checks (167.5 s)`. The file run alone, `npx vitest run tests/data/hubs/hub-portfolio.test.ts --tagsFilter slow --testTimeout 20000`: `Test Files  1 passed (1)` / `Tests  16 passed (16)`. |
| Verify 2, case-run programs before and after | DONE | Both runs are quoted in this report. |
| Verify 3, unused exports | DONE | `diff ../O82-base/unused-exports.txt <after>` prints only the removal of `HpcStatus` from two lines (it now has an importer, `hpc.ts:3`). No line was added. |
| Verify 4, `git grep -n "unreachable_msg" -- src` | DONE | `src/lib/state/system/machine/hpc/hpc.ts:41:        return { word: t('hpc.unreachable'), sentence: t('hpc.unreachable_msg') };`, reached only under `status === 'unreachable'` (`hpc.ts:40`). |
| Verify 5, history-word grep | DONE | `grep -rn 'Z10[0-9][0-9]\|ruling 4[0-9][0-9]\|\bO8[0-9]\b' src config docs tests --exclude=local.yml` printed nothing (`rc=1`). |
| ASCII over touched files | DONE | `LC_ALL=C grep -n '[^ -~]' <every changed file but the svg>` printed nothing (`rc=1`). `grep -c` over the four svg files gives 0 in each. |

One more line on a red check outside this step: run alone, `tests/checks/tree/duplication.test.ts` fails "is not held anywhere under tests" on `tests/data/sources/config/layers/language.test.ts:160 and tests/server/root/process/config-cache.test.ts:269 hold the same 9 lines (e246b55c4e52)`. The step changes neither file (`diff -rq ../O82-base/tests tests` lists only `allow-duplication.txt`). The `src` case of that file passes.

## Files with line counts

Measured with `wc -l` on the base copy (or `git show HEAD:<path>` where the base copy does not hold the path) and on the worktree.

| File | Lines | In the write list |
|---|---|---|
| `src/lib/server/machine/hpc/poll.ts` | 443 -> 534 | yes |
| `src/lib/server/machine/hpc/ssh.ts` | 86 -> 102 | yes |
| `src/lib/server/machine/hpc/parse.ts` | 200 -> 221 | yes (the marker, `squeue`'s stderr section and the return code are read there) |
| `src/lib/data/model/model-sessions.ts` | 844 -> 846 | line 619 is listed. The doc comment over it (`:615-620`) was rewritten as well, because it describes the vocabulary. |
| `src/lib/views/system/machine/hpc/Head.svelte` | 122 -> 120 | yes |
| `src/lib/views/system/machine/hpc/Hpc.svelte` | 141 -> 149 | yes |
| `src/lib/state/workbench/navigation/status.ts` | 605 -> 605 | `hpcWords` is listed. One import line (`:51`, `failureWords`) is outside lines 180-200, and the change needs it. |
| `config/text/views/system/machine/hpc.yml` | 95 -> 101 | yes |
| `docs/apps.md` | 847 -> 847 | yes (line 421) |
| `src/lib/server/machine/hpc/host.ts` | 138 -> 146 | NO. The poll's hint sentences come from the catalog. They reach the poll through `hostWordsOf` and `hpcSettingsOf`, which `live-settings.ts` already reads again on every config push (`attempt('hpc.words', ...)`, `live-settings.ts:197-202`), so an edit of the catalog reaches the running poll with no new wiring. |
| `src/lib/state/system/machine/hpc/hpc.ts` | 105 -> 122 | NO. `failureWords`, the one rule that maps a failure to its word and its sentence, is read by Head, Hpc and `hpcWords`. Without it the rule would be written three times. |
| `tests/checks/tree/allow-duplication.txt` | 21 -> 21 | NO. The reason of an existing entry names the lines its clone starts on. The clone moved from line 25 to 29 in `parse.ts` and from line 20 to 21 in `hpc.ts`. The mark is unchanged. |
| `docs/diagrams/layer-server.dot`, `.svg`; `layer-state.dot`, `.svg`; `layer-views.dot`, `.svg`; `layers.dot`, `.svg` | 159, 781, 173, 855, 189, 855, 101, 556, unchanged counts | NO. `npm run diagrams` wrote them before the verify list. Each changes one edge count label by 1, for the new imports (`server to data` 528 -> 529, `views to state` 1411 -> 1412, `state/workbench to state/system` 2 -> 3, `state/system to state/shared` 52 -> 53). |
| `.scratch/migration/agents/reviews/O82-report.md` | this file | yes |

The allow list edit, from `git diff tests/checks/tree/allow-duplication.txt`:
- before: `src/lib/server/machine/hpc/parse.ts src/lib/state/system/machine/hpc/hpc.ts 8ead1c0cdafe the same 7 lines at 25 and 20, to fold into one place`
- after: `src/lib/server/machine/hpc/parse.ts src/lib/state/system/machine/hpc/hpc.ts 8ead1c0cdafe the same 7 lines at 29 and 21, to fold into one place`

The step adds or changes no test.

## Judgment calls the brief left open (each one the orchestrator may reverse)

1. **The remote limits:** `squeue` 12 s, `sacct` 8 s, `sinfo` 5 s (`poll.ts:96-98`), as item 2 sets them. They are 25 s together, which leaves 15 s of the runner's 40 s for ssh's connect (`ConnectTimeout=8`) and Recover's section. No time of a healthy `squeue`, `sacct` or `sinfo` on the cluster is on file, and I ran nothing on the cluster. A controller that answers `squeue` in more than 12 s is therefore published `slurm_down`, which is not verified against real cluster times.
2. **Where `squeue`'s stderr goes:** to a temporary file on the login node, made by `mktemp` and removed right after it is printed into its own section (`poll.ts:111-116`). The brief asks for no pipe and no subshell around `squeue`. A redirect to a file is the one way to keep its stderr apart from both stdout and ssh's stderr. Where `mktemp` fails, the stderr goes to `/dev/null` and the hint is left out. A poll killed during those 12 s leaves the empty file in `/tmp`. The local run (`shell-cases.ts`) shows `tmp left=[]` on all three outcomes.
3. **Hint sentences come from the catalog, on the server:**
   - `hpc.hint_ssh_exited: ssh exited {0}` replaces the literal `` `ssh exited ${result.code}` `` the poll used to build. A literal string a reader sees is a defect under the rules file, and the step rewrote that line.
   - `hpc.hint_slurm_late: no answer within the time limit`.
   - `hpc.hint_overrun: Slurm answered, and the rest of the poll ran past its time limit`.

   They are new keys of the `hpc` group. They travel in `HpcSettings.words` (`PollWords`, `poll.ts:34`). `words` is optional there, because the G115 test (`runs.test.ts:487`) builds the settings without it and item 7 forbids changing that file. With no words the poll leaves out the hint made of a sentence and invents no fallback text. The client shows each hint in the existing `unreachable_detail` form (`{0} \`{1}\``), so the two sentence hints are drawn as code under the failure's sentence.
4. **New user-visible words**, a vocabulary the orchestrator may reword:
   - the pill and status bar word `Slurm down`;
   - `slurm_down_msg: The cluster was reached over ssh, and Slurm did not answer.`;
   - `error_msg: The poll of the cluster failed.`
5. **`HostWords` keeps its name.** It gains `poll: PollWords`, and its doc comment now says it holds the sentences of the Live HPC settings. Renaming it would touch `context.ts` and `live-settings.ts` for a name alone.
6. **A resolved answer with a non-zero exit code other than 255 and the Slurm sections** is read as today (`ok`). An example is `sinfo` failing as the last command when Recover's section is empty. A code of 255 is a failure even when the sections are there (item 1: the marker, 255 and `SEC_RC` 0 give `error`).
7. **`slurm_down` with a `squeue` code that is neither 0 nor 124 and an empty stderr section** has no hint, so the box shows the `slurm_down` sentence alone. The brief names a hint for 124, for a runner timeout and for Slurm's message, and not for this input.
8. **The hint of `slurm_down` is the whole trimmed stderr section of `squeue`**, every line. This matches how `unreachable` shows ssh's whole stderr today.
9. **Item 7's sentence:** a `Permission denied (publickey).` or `Host key verification failed.` answer exits 255 without the marker, so it is `unreachable`. The sentence it gets then asks about the UT network and EduVPN, which is not the cause in that case. That is ruling 428's wording for `unreachable`.

## Host- and user-visible changes, for the look on landing

All of these are in the Live HPC view (float, `w` then `1`) and in the status bar's HPC item.
- **When ssh connects and Slurm does not answer:**
  - Before: the pill said `unreachable` in red. The error box and the Login node section said "The cluster did not answer over ssh. Is this Mac on the UT network or on EduVPN?", with `ssh exited 1` or `timeout` as code. The status bar said `unreachable`, with that sentence in its tooltip.
  - After: the pill says `Slurm down` in red (the `bad` class) and the bar's refresh control is hidden. The meta says `last reached HH:MM | retrying every 2m`. The error box and the Login node section (while it holds no reading) say "The cluster was reached over ssh, and Slurm did not answer." with Slurm's message as code (for example `slurm_load_jobs error: Unable to contact slurm controller (connect failure)`) or `no answer within the time limit`. The status bar shows `Slurm down`, with that sentence in its tooltip.
  - The last good queue, recent jobs and capacity stay under the box, as before.
  - How to reach the state: a cluster whose Slurm controller is down. Another way is an `hpc_host` in `local.yml` naming an ssh host that connects and has no `squeue`. The command then exits 127 with `timeout: failed to run command 'squeue'` (or `timeout: command not found`), which the poll publishes as `slurm_down` with that line as the hint.
- **`error`:**
  - Before: the pill said `error`, the status bar's tooltip said the bare word `error`, and the error box said the ssh sentence.
  - After: the error box and the Login node section say "The poll of the cluster failed." with the hint as code, and the status bar's tooltip says the same sentence.
  - How to reach the state: a poll whose Recover section runs past the 40 s limit after Slurm answered, or `ssh` missing from PATH.
- **`unreachable`** (off VPN): no change. It shows the same pill, sentence and tooltip.
- **The hint `ssh exited N`** now comes from the catalog, with the same words.

## Anything in the brief that was wrong or impossible

- **Case 7b names the wrong function.** It says `actions.ts`'s cancel "answers `timeout`, as today", but today `cancel` does not catch a rejection. On the unchanged tree it rejects with the message `timeout` (first run, case 7b: `cancel="rejected with message \"timeout\""`). The reader of the message at `actions.ts:73` is `log`, which answers `{"status":"timeout",...}`. Both behave exactly as they did before the change. The brief check's note "(cancel and log, on the same run)" is the source of the slip: `actions.ts:33-43` (`cancel`) has no try. A runner timeout on a cancel therefore reaches `handleHpc` (`routes.ts:63`) as a rejection. That is behaviour this step does not change.
- **Item 2 says "25 s together, which leaves 15 s".** That holds for the Slurm commands. The `mktemp`, `cat` and `rm` that carry `squeue`'s stderr are outside those 25 s and take milliseconds; the local run shows this. Recover's section has no bound of its own beyond what `batch.ts` gives each `du` (5 s). That is why case 4b's `error` exists.

## Limitations and sharp edges

- **A `sacct` or `sinfo` stopped by its new limit (8 s, 5 s) leaves its section empty, and the poll is `ok`** with an empty Recent or Capacity table, since neither code is recorded. Today a `sacct` that fails at once gives the same `ok` with an empty table. Before the limits, a `sacct` that hung held the poll to the 40 s runner timeout instead. Item 1 reads Slurm's state from `squeue` alone, so this is outside its rules. It is named here because the limits make it reachable by a hang.
- **A cluster without GNU `timeout` on the login node** answers every poll with exit 127 from the shell and is published `slurm_down`. Premise 6 shows that the UTwente cluster has it. Any other cluster named in `slurm.resource` is assumed to.
- **The hint sentences are shown as code** (judgment call 3).
- **The remote command assumes a POSIX shell on the login node**, as `$?`, `2>/dev/null` and Recover's section already did.

## The case-run programs

All of them live in `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o82-build/`, outside the worktree, and write nothing into the diff. `shell-cases.ts` writes its stand-in commands into a scratch folder of that directory, which was removed before this report.

### cases.ts (cases 1 to 11), run with `node cases.ts /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O82`

```ts
// O82 case-run program: runs watchHpc with an injected runner for each case and prints what is
// published. Writes nothing. Run: node cases.ts <tree root>
import { readFileSync } from 'node:fs';

const ROOT = process.argv[2];
const poll = await import(`${ROOT}/src/lib/server/machine/hpc/poll.ts`);
const parse = await import(`${ROOT}/src/lib/server/machine/hpc/parse.ts`);
const ssh = await import(`${ROOT}/src/lib/server/machine/hpc/ssh.ts`);
const actions = await import(`${ROOT}/src/lib/server/machine/hpc/actions.ts`);
const { Hub } = await import(`${ROOT}/src/lib/server/core/channels.ts`);
const { parse: yaml } = await import(`${ROOT}/node_modules/yaml/dist/index.js`);

const hpcText = yaml(readFileSync(`${ROOT}/config/text/views/system/machine/hpc.yml`, 'utf8')).text
    .hpc as Record<string, string>;
const words = {
    sshExited: hpcText.hint_ssh_exited,
    slurmLate: hpcText.hint_slurm_late,
    overrun: hpcText.hint_overrun
};

const { SEC_RC, SEC_SACCT, SEC_SINFO, SEC_RECOVER } = parse;
const MARK = '@@oculus:connected@@';
const ERR = '@@oculus:squeue_err@@';
const JOB = '123|job-a|main|RUNNING|0:10|1:00:00|1|1|N/A|4G|100|N/A|node1';
const SLURM = 'slurm_load_jobs error: Unable to contact slurm controller (connect failure)';
const GOOD = `${MARK}\n${JOB}\n${SEC_RC}0\n${ERR}\n${SEC_SACCT}\n${SEC_SINFO}\nmain|up|4|idle|gpu:1\n${SEC_RECOVER}\n`;

type Answer = { stdout: string; stderr: string; code: number };
/** The runner's own timeout rejection carrying what stdout held. */
function timedOut(stdout: string): Error {
    return typeof ssh.RunTimeout === 'function'
        ? new ssh.RunTimeout(stdout, '')
        : Object.assign(new Error('timeout'), { stdout });
}

type Step = () => Promise<Answer>;
function settings(host = 'cluster', missing?: string) {
    return {
        host,
        ...(missing === undefined ? {} : { missing }),
        days: 7,
        pollMin: 20,
        quotaMin: 60,
        prewarm: false,
        words
    };
}

/** A watcher whose batch answers come from `steps`, one per poll; prints each publish's fields. */
async function scenario(label: string, steps: Step[], extra?: (w: any, calls: string[]) => Promise<void>) {
    const hub = new Hub();
    const calls: string[] = [];
    let at = 0;
    const watcher = poll.watchHpc(hub, {
        ...settings(),
        recover: { command: () => 'echo section', take: () => {} },
        runner: (_host: string, command: string) => {
            calls.push(command);
            if (command.startsWith('quota')) return Promise.resolve({ stdout: '', stderr: '', code: 1 });
            const step = steps[Math.min(at, steps.length - 1)];
            at += 1;
            return step();
        }
    });
    const lines: string[] = [];
    try {
        // The watcher polls once as it starts; its runner answers at once, so a turn of the loop
        // lets that first poll land.
        await new Promise((r) => setTimeout(r, 0));
        for (let i = 1; i < steps.length; i += 1) {
            const p = hub.latest('hpc')?.payload;
            lines.push(show(p));
            await watcher.refresh();
        }
        lines.push(show(hub.latest('hpc')?.payload));
        console.log(`${label}\n  ${lines.join('\n  ')}`);
        if (extra) await extra(watcher, calls);
    } finally {
        watcher.close();
    }
}
function show(p: any): string {
    return `status=${p.status} hint=${JSON.stringify(p.hint)} jobs=${p.jobs.length} lastOk=${p.lastOk ? 'kept' : 'none'} retryMin=${p.retryMin}`;
}
const ok: Step = () => Promise.resolve({ stdout: GOOD, stderr: '', code: 0 });
const resolved = (a: Answer): Step => () => Promise.resolve(a);
const rejected = (e: Error): Step => () => Promise.reject(e);

await scenario('case 1 (good, then 255 no marker)', [
    ok,
    resolved({ code: 255, stdout: '', stderr: 'ssh: connect to host x port 22: Operation timed out\n' })
]);
const case2: Answer = {
    code: 1,
    stdout: `${MARK}\n${SEC_RC}1\n${ERR}\n${SLURM}\n${SEC_SACCT}\n${SEC_SINFO}\n`,
    stderr: ''
};
await scenario('case 2 (good, then marker, squeue rc 1, Slurm line in its own section)', [ok, resolved(case2)]);
await scenario('case 3 (good, then marker, squeue rc 124)', [
    ok,
    resolved({ code: 1, stdout: `${MARK}\n${SEC_RC}124\n${ERR}\n${SEC_SACCT}\n${SEC_SINFO}\n`, stderr: '' })
]);
await scenario('case 4a (runner timeout, marker only in stdout)', [ok, rejected(timedOut(`${MARK}\n`))]);
await scenario('case 4b (runner timeout after SEC_SINFO, Recover section slow)', [
    ok,
    rejected(timedOut(`${MARK}\n${JOB}\n${SEC_RC}0\n${ERR}\n${SEC_SACCT}\n${SEC_SINFO}\nmain|up|4|idle|gpu:1\n${SEC_RECOVER}\n@@oculus:session a\n`))
]);
await scenario('case 5a (runner timeout, empty stdout)', [ok, rejected(timedOut(''))]);
await scenario("case 5b (plain new Error('timeout'))", [ok, rejected(new Error('timeout'))]);
await scenario('case 6 (spawn ssh ENOENT)', [ok, rejected(new Error('spawn ssh ENOENT'))]);
await scenario('case 7 (code 0, rc 0, no SEC_SACCT)', [ok, resolved({ code: 0, stdout: `${MARK}\n${SEC_RC}0\n${ERR}\n`, stderr: '' })]);
await scenario('case 7 (code 255, marker, rc 1)', [
    ok,
    resolved({ code: 255, stdout: `${MARK}\n${SEC_RC}1\n${ERR}\n${SLURM}\n`, stderr: 'Connection to x closed by remote host.\n' })
]);
await scenario('case 7 (code 255, marker, rc 0)', [
    ok,
    resolved({ code: 255, stdout: `${MARK}\n${JOB}\n${SEC_RC}0\n${ERR}\n${SEC_SACCT}\n`, stderr: 'Connection to x closed by remote host.\n' })
]);
await scenario('case 7a (ssh warning on stderr before Slurm line)', [
    ok,
    resolved({
        code: 1,
        stdout: `${MARK}\n${SEC_RC}1\n${ERR}\n${SLURM}\n${SEC_SACCT}\n${SEC_SINFO}\n`,
        stderr: "Warning: Permanently added 'x' (ED25519) to the list of known hosts.\n" + SLURM + '\n'
    })
]);

// 7b: actions.ts cancel with a runner that times out the way run() does.
{
    const answer = await actions
        .cancel('cluster', '123', () => Promise.reject(timedOut('')))
        .catch((error: Error) => `rejected with message ${JSON.stringify(error.message)}`);
    const logAnswer = await actions.log('cluster', '123', new Map(), () => Promise.reject(timedOut('partial')));
    console.log(`case 7b (cancel, log with a runner timeout)\n  cancel=${JSON.stringify(answer)} log=${JSON.stringify(logAnswer)}`);
}

// 7c: a slurm_down answer that lands after set() changed the host.
{
    const hub = new Hub();
    const seen: string[] = [];
    const publish = hub.publish.bind(hub);
    hub.publish = (channel: string, payload: any) => {
        if (channel === 'hpc') seen.push(`${payload.status}@${payload.host}`);
        return publish(channel, payload);
    };
    let release: (a: Answer) => void = () => {};
    let calls = 0;
    const watcher = poll.watchHpc(hub, {
        ...settings(),
        runner: (host: string, command: string) => {
            if (command.startsWith('quota')) return Promise.resolve({ stdout: '', stderr: '', code: 1 });
            calls += 1;
            if (host === 'cluster') return new Promise<Answer>((resolve) => (release = resolve));
            return new Promise<Answer>(() => {});
        }
    });
    await Promise.resolve();
    watcher.set({ ...settings('other') });
    release(case2);
    await new Promise((r) => setTimeout(r, 20));
    watcher.close();
    console.log(`case 7c (slurm_down answer after the host changed)\n  published: ${seen.join(', ')} batch calls=${calls}`);
}

await scenario('case 8 (good, case 2, good)', [ok, resolved(case2), ok]);

{
    const hub = new Hub();
    const watcher = poll.watchHpc(hub, { ...settings('', 'the cluster x has no host'), runner: () => Promise.reject(new Error('no call')) });
    await watcher.refresh();
    watcher.close();
    console.log(`case 9 (no host)\n  ${show(hub.latest('hpc')?.payload)}`);
}

await scenario('case 10 (recover() after case 2)', [ok, resolved(case2)], async (w, calls) => {
    const before = calls.length;
    await w.recover();
    console.log(`  recover() sent ${calls.length - before} commands`);
});

console.log('case 11 batchCommand(7, "") with its date replaced:');
console.log(poll.batchCommand(7).replace(/\d{4}-\d{2}-\d{2}/, 'DATE'));
console.log("case 11 recoverCommand('x'):");
console.log(poll.recoverCommand('x'));
```

The program passes `(stdout, '')` to `RunTimeout`, whose constructor takes `stdout` alone, so the second argument is ignored. On the unchanged tree it used the `Object.assign` branch, since `RunTimeout` did not exist yet.

Output after the change (with the `hpc publish:` lines filtered out):

```
case 1 (good, then 255 no marker)
  status=ok hint=undefined jobs=1 lastOk=kept retryMin=2
  status=unreachable hint="ssh: connect to host x port 22: Operation timed out" jobs=1 lastOk=kept retryMin=2
case 2 (good, then marker, squeue rc 1, Slurm line in its own section)
  status=ok hint=undefined jobs=1 lastOk=kept retryMin=2
  status=slurm_down hint="slurm_load_jobs error: Unable to contact slurm controller (connect failure)" jobs=1 lastOk=kept retryMin=2
case 3 (good, then marker, squeue rc 124)
  status=ok hint=undefined jobs=1 lastOk=kept retryMin=2
  status=slurm_down hint="no answer within the time limit" jobs=1 lastOk=kept retryMin=2
case 4a (runner timeout, marker only in stdout)
  status=ok hint=undefined jobs=1 lastOk=kept retryMin=2
  status=slurm_down hint="no answer within the time limit" jobs=1 lastOk=kept retryMin=2
case 4b (runner timeout after SEC_SINFO, Recover section slow)
  status=ok hint=undefined jobs=1 lastOk=kept retryMin=2
  status=error hint="Slurm answered, and the rest of the poll ran past its time limit" jobs=1 lastOk=kept retryMin=2
case 5a (runner timeout, empty stdout)
  status=ok hint=undefined jobs=1 lastOk=kept retryMin=2
  status=unreachable hint="timeout" jobs=1 lastOk=kept retryMin=2
case 5b (plain new Error('timeout'))
  status=ok hint=undefined jobs=1 lastOk=kept retryMin=2
  status=unreachable hint="timeout" jobs=1 lastOk=kept retryMin=2
case 6 (spawn ssh ENOENT)
  status=ok hint=undefined jobs=1 lastOk=kept retryMin=2
  status=error hint="spawn ssh ENOENT" jobs=1 lastOk=kept retryMin=2
case 7 (code 0, rc 0, no SEC_SACCT)
  status=ok hint=undefined jobs=1 lastOk=kept retryMin=2
  status=error hint="ssh exited 0" jobs=1 lastOk=kept retryMin=2
case 7 (code 255, marker, rc 1)
  status=ok hint=undefined jobs=1 lastOk=kept retryMin=2
  status=slurm_down hint="slurm_load_jobs error: Unable to contact slurm controller (connect failure)" jobs=1 lastOk=kept retryMin=2
case 7 (code 255, marker, rc 0)
  status=ok hint=undefined jobs=1 lastOk=kept retryMin=2
  status=error hint="Connection to x closed by remote host." jobs=1 lastOk=kept retryMin=2
case 7a (ssh warning on stderr before Slurm line)
  status=ok hint=undefined jobs=1 lastOk=kept retryMin=2
  status=slurm_down hint="slurm_load_jobs error: Unable to contact slurm controller (connect failure)" jobs=1 lastOk=kept retryMin=2
case 7b (cancel, log with a runner timeout)
  cancel="rejected with message \"timeout\"" log={"status":"timeout","log":"","path":""}
case 7c (slurm_down answer after the host changed)
  published: starting@cluster, starting@other batch calls=2
case 8 (good, case 2, good)
  status=ok hint=undefined jobs=1 lastOk=kept retryMin=2
  status=slurm_down hint="slurm_load_jobs error: Unable to contact slurm controller (connect failure)" jobs=1 lastOk=kept retryMin=2
  status=ok hint=undefined jobs=1 lastOk=kept retryMin=2
case 9 (no host)
  status=unreachable hint="the cluster x has no host" jobs=0 lastOk=none retryMin=2
case 10 (recover() after case 2)
  status=ok hint=undefined jobs=1 lastOk=kept retryMin=2
  status=slurm_down hint="slurm_load_jobs error: Unable to contact slurm controller (connect failure)" jobs=1 lastOk=kept retryMin=2
  recover() sent 0 commands
case 11 batchCommand(7, "") with its date replaced:
echo "@@oculus:connected@@"
oculus_err=$(mktemp 2>/dev/null) || oculus_err=/dev/null
timeout 12 squeue --me -h -o '%i|%j|%P|%T|%M|%l|%D|%C|%b|%m|%Q|%S|%R' 2>"$oculus_err"
echo "@@oculus:squeue_rc=$?"
echo "@@oculus:squeue_err@@"
cat "$oculus_err"
[ "$oculus_err" = /dev/null ] || rm -f "$oculus_err"
echo "@@oculus:sacct@@"
timeout 8 sacct -u "$USER" -S DATE -o JobID,JobName%60,State,ExitCode,Elapsed,End,ReqMem,MaxRSS,TotalCPU,AllocCPUS,NNodes,ElapsedRaw -Pn
echo "@@oculus:sinfo@@"
timeout 5 sinfo -h -o '%P|%a|%D|%t|%G'
case 11 recoverCommand('x'):
echo "@@oculus:connected@@"
timeout 12 squeue --me -h -o '%i|%j|%P|%T|%M|%l|%D|%C|%b|%m|%Q|%S|%R'
echo "@@oculus:squeue_rc=$?"
echo "@@oculus:recover@@"
x
```

### client-cases.mjs (case 12), run with `node client-cases.mjs /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O82`

It loads modules through the worktree's own Vite config in middleware mode, which opens no port.

```js
// O82 case-run program for case 12: loads the status bar's hpcWords through the worktree's own Vite
// config (so the .svelte.ts modules compile), installs the hpc text catalog, and prints the short
// and long words for each failure status. Writes nothing. Run: node client-cases.mjs <tree root>
import { readFileSync } from 'node:fs';

const ROOT = process.argv[2];
process.chdir(ROOT);
const { createServer } = await import(`${ROOT}/node_modules/vite/dist/node/index.js`);
const { parse: yaml } = await import(`${ROOT}/node_modules/yaml/dist/index.js`);

const server = await createServer({
    root: ROOT,
    configFile: `${ROOT}/vite.config.ts`,
    server: { middlewareMode: true, hmr: false, port: 8798, strictPort: true, watch: null },
    appType: 'custom',
    logLevel: 'error'
});
try {
    const text = await server.ssrLoadModule('/src/lib/state/shared/words/text.ts');
    const status = await server.ssrLoadModule('/src/lib/state/workbench/navigation/status.ts');
    const flat = {};
    for (const file of [
        'config/text/views/system/machine/hpc.yml',
        'config/text/statusbar.yml'
    ]) {
        const groups = yaml(readFileSync(`${ROOT}/${file}`, 'utf8')).text;
        for (const [group, keys] of Object.entries(groups)) {
            for (const [key, value] of Object.entries(keys)) flat[`${group}.${key}`] = value;
        }
    }
    text.setCatalog(flat);
    const base = {
        jobs: [],
        running: 0,
        pending: 0,
        total: 0,
        recent: [],
        sinfo: [],
        quota: [],
        updated: '2026-10-26T10:00:00Z',
        lastOk: '2026-10-26T09:40:00Z',
        pollMin: 20,
        retryMin: 2,
        host: 'utwente'
    };
    for (const [statusWord, hint] of [
        ['unreachable', 'ssh: connect to host x port 22: Operation timed out'],
        ['slurm_down', 'slurm_load_jobs error: Unable to contact slurm controller (connect failure)'],
        ['error', 'spawn ssh ENOENT']
    ]) {
        const words = status.hpcWords({ ...base, status: statusWord, hint });
        console.log(`case 12 hpcWords(${statusWord}): short=${JSON.stringify(words.short)} long=${JSON.stringify(words.long)}`);
    }
} finally {
    await server.close();
}
```

Output after the change:

```
case 12 hpcWords(unreachable): short="unreachable" long="The cluster did not answer over ssh. Is this Mac on the UT network or on EduVPN?"
case 12 hpcWords(slurm_down): short="Slurm down" long="The cluster was reached over ssh, and Slurm did not answer."
case 12 hpcWords(error): short="error" long="The poll of the cluster failed."
```

Case 12, the views read after the change:
- `Head.svelte:32-33`: `failure = failureWords(data.status)` and `failed = failure !== null`.
- `:37`: the pill shows `failure.word`.
- `:52`: the meta shows last reached and retrying for every failure.
- `:84`: the refresh control is hidden on every failure.
- `:88`: `class:bad={failed}`.
- `Hpc.svelte:68-75` `failureMessage(payload)`: the hint alone when there is no host, otherwise the failure's own sentence, with the hint in the `unreachable_detail` form. It is used by the error box (`:104`) and the Login node reason (`:119`, drawn by `Login.svelte:104-105`).

### shell-cases.ts (a local `sh` run of `batchCommand`, no ssh), run with `node shell-cases.ts <worktree> <scratch>/shell`

It checks that `$?` holds `squeue`'s or `timeout`'s code, that `squeue`'s stderr lands in its own section, and that the temporary file is removed.

```ts
// O82 case-run program: runs the poll's own batchCommand in a local `sh` (no ssh) with stand-ins
// for squeue, sacct, sinfo and timeout in a scratch bin folder, through watchHpc's injected runner,
// and prints what is published and what the scratch tmp folder holds afterwards.
// Run: node shell-cases.ts <tree root> <scratch dir>
import { spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, rmSync, writeFileSync, chmodSync } from 'node:fs';
import { join } from 'node:path';

const [ROOT, SCRATCH] = process.argv.slice(2);
const poll = await import(`${ROOT}/src/lib/server/machine/hpc/poll.ts`);
const { Hub } = await import(`${ROOT}/src/lib/server/core/channels.ts`);

const words = { sshExited: 'ssh exited {0}', slurmLate: 'LATE', overrun: 'OVERRUN' };

function stub(bin: string, name: string, body: string): void {
    writeFileSync(join(bin, name), `#!/bin/sh\n${body}\n`);
    chmodSync(join(bin, name), 0o755);
}

async function run(label: string, squeue: string, timeout: string): Promise<void> {
    const dir = join(SCRATCH, label.replace(/\W+/g, '-'));
    rmSync(dir, { recursive: true, force: true });
    const bin = join(dir, 'bin');
    const tmp = join(dir, 'tmp');
    mkdirSync(bin, { recursive: true });
    mkdirSync(tmp, { recursive: true });
    stub(bin, 'squeue', squeue);
    stub(bin, 'timeout', timeout);
    stub(bin, 'sacct', 'echo "1|a|COMPLETED|0:0|00:01|2026-10-26T10:00:00|4G|1G|00:01|1|1|60"');
    stub(bin, 'sinfo', 'echo "main|up|4|idle|gpu:1"');
    const hub = new Hub();
    const watcher = poll.watchHpc(hub, {
        host: 'local',
        days: 7,
        pollMin: 20,
        quotaMin: 60,
        prewarm: false,
        words,
        runner: (_host: string, command: string) => {
            if (command.startsWith('quota')) return Promise.resolve({ stdout: '', stderr: '', code: 1 });
            const done = spawnSync('/bin/sh', ['-c', command], {
                env: { PATH: `${bin}:/usr/bin:/bin`, TMPDIR: tmp, USER: 'me' },
                encoding: 'utf8'
            });
            return Promise.resolve({ stdout: done.stdout, stderr: done.stderr, code: done.status ?? 1 });
        }
    });
    await new Promise((r) => setTimeout(r, 50));
    watcher.close();
    const p = hub.latest('hpc')?.payload as { status: string; hint?: string; jobs: unknown[]; recent: unknown[] };
    console.log(
        `${label}: status=${p.status} hint=${JSON.stringify(p.hint)} jobs=${p.jobs.length} recent=${p.recent.length} tmp left=${JSON.stringify(readdirSync(tmp))}`
    );
}

const passThrough = 'shift; exec "$@"';
await run('squeue answers', 'echo "123|job-a|main|RUNNING|0:10|1:00:00|1|1|N/A|4G|100|N/A|node1"; echo "squeue: warning: a note" >&2', passThrough);
await run('squeue fails with Slurm message', 'echo "slurm_load_jobs error: Unable to contact slurm controller (connect failure)" >&2; exit 1', passThrough);
await run('timeout stops squeue (124)', 'echo never', 'case "$2" in squeue) exit 124;; esac; shift; exec "$@"');
```

Output after the change:

```
squeue answers: status=ok hint=undefined jobs=1 recent=1 tmp left=[]
squeue fails with Slurm message: status=slurm_down hint="slurm_load_jobs error: Unable to contact slurm controller (connect failure)" jobs=0 recent=0 tmp left=[]
timeout stops squeue (124): status=slurm_down hint="LATE" jobs=0 recent=0 tmp left=[]
```

## Runs of the verify list and of whole suites

- **`npm run test:quick`:** run once, after the last code change, with the changed paths as its arguments. `npm run diagrams` ran right before it.
- **Whole-suite commands:** none.
- **Single test files run on their own:**
  - `tests/server/machine/runs/recover/runs.test.ts`, twice (before and after).
  - `tests/checks/tree/duplication.test.ts` with `tests/checks/source/keys.test.ts`, twice, the second time only to read the output of the failure under tests. `keys.test.ts` passed.
  - `tests/data/hubs/hub-portfolio.test.ts` with `--tagsFilter slow`, once, the rerun of the red line.
- **Formatting:** prettier ran once with `--write` on the ten files written by hand. It changed one of them, `Head.svelte`, by joining the `<span>`'s two class attributes onto one line.
- **Edits after the verify list:** none, apart from this report.

## Other parts the rules file asks for

**The name grep:**

```
grep -rn --exclude=local.yml "<name>" src tests config docs README.md
```

It was run for `slurm_down`, `HpcStatus`, `unreachable_msg`, `RunTimeout`, `failureWords`, `PollWords`, `SEC_CONNECTED`, `SEC_SQUEUE_ERR`, `hint_ssh_exited`, `hint_slurm_late`, `hint_overrun` and `error_msg`.
- Every hit is in a changed file, except `src/lib/data/model/index.ts:636` (the re-export of `HpcStatus`, still true).
- The catalog keys each have one reader: `hpc.ts:41-46` for `slurm_down`, `slurm_down_msg` and `error_msg`, and `host.ts:135-137` for the three `hint_*` keys.
- `README.md` has no hit.

**Head comments, doc comments and docs, re-read after the change:**
- `poll.ts` head comment: rewritten (the three failures).
- `HpcSettings`: rewritten.
- `batchCommand` and `recoverCommand`: rewritten.
- `degraded`: rewritten (an "off-VPN page" is one case of three).
- `RETRY_MIN` ("while the cluster is not answering"): still true; Slurm is part of the cluster.
- `HpcWatcher.recover` ("a cluster that does not answer gets no command but the polls' own"): still true.
- `ssh.ts` head comment: still true.
- `ssh.ts` doc comment of `run`: rewritten (it now names `RunTimeout`).
- `parse.ts` head comment: still true.
- `parse.ts` doc comment of `splitSections`: rewritten.
- `host.ts` head comment: still true.
- `host.ts` doc comments of `HostWords`, `hpcSettingsOf` and `hostWordsOf`: rewritten. `hostWordsOf` said "The five sentences" while it returned six; it now says "The sentences".
- `model-sessions.ts:615-620`: rewritten.
- `model-sessions.ts:666` ("When the cluster last answered") and `:669-672` ("while the cluster is not answering"): still true.
- `Head.svelte` head comment: rewritten.
- `Hpc.svelte` head comment: rewritten, as one paragraph at 100 columns.
- `hpc.ts` head comment: rewritten (it now serves the status bar too).
- `status.ts` doc comment of `hpcWords`: rewritten.
- `docs/apps.md:421`: rewritten.
- `docs/HELP.md:320` ("It runs `squeue`, `sacct` and `sinfo` over ssh every `slurm.poll_min` minutes"): still true. The brief adds nothing there, since the step adds no action.
- `config/text/views/sources/data.yml:83` `refused_unreachable`: still true (Recover's disk read; "Not changed").
- `hpc.footer` and `hpc.controls_offline`: still true.

**The history-word grep of added comment lines and test titles:**

```
git diff -U0 | grep '^+' | grep -v '^+++' | grep -n -i -w "before\|still\|no longer\|used to\|always has been\|always had\|as before\|previously\|the step adds\|after this package lands\|now"
```

It printed two hits, both in the doc comment of `rejectionFailure` (`poll.ts:178-182`): "A timeout before the connected marker" and "after the marker and before the last Slurm section began". Both say where in the command's output the timeout fell. Neither compares the code with an earlier state. No test title was added or changed.

**The reuse grep before the new helpers and types:**

```
grep -rn "RunTimeout\|PollWords\|failureWords\|SEC_CONNECTED\|SEC_SQUEUE_ERR" src tests
grep -rln "readonly stdout" src
```

Both were run in the base copy and printed nothing (`rc=1`). `grep -rn "extends Error" src/lib/server` lists 10 error classes, and none carries the stdout of an ssh child. `fillPlaceholders` (`data/helpers/finding-text.ts:24`) is reused for `{0}`, and so is the existing `unreachable_detail` form. No new file was added; the server folder `src/lib/server/machine/hpc` already holds ten items.

**The asynchronous paths of the poll:**
- **In flight:** the resolve path and the reject path each check `stopped() || began !== asking` (`poll.ts:324`, `:360`) before they classify anything, as before.
- **After close:** `stopped()` is true and nothing is published.
- **Superseded by `set()` (host, sentence or window changed):** the late answer is dropped. Case 7c shows this: only `starting@cluster, starting@other` are published.
- **`RunTimeout` in `ssh.ts`:** it captures `stdout` at the moment the timer fires. Data that arrives later is not added, and a `close` after the rejection resolves a promise that has already settled. When the child closes first, `done()` clears the timer, so the timer never fires.

**New ids and keys**, each checked for empty, duplicate and colliding values:
- `SEC_CONNECTED` and `SEC_SQUEUE_ERR` are distinct from the four existing markers. Neither contains `sacct`, which the G115 runner and assertion read (`runs.test.ts:499`, `:526`).
- The six catalog keys are new in the group `hpc` (`grep` above).
- The shell variable `oculus_err` is not used by Recover's section (`batch.ts`, which uses `s`).
- Values from the cluster reach the page only as hint text, which `Empty` draws through `CodeText` as characters.
