Everything in the brief is done

# O83 report: one Slurm table failing alone keeps the queue and Recover live

Two things outside it need the orchestrator's eye: the case-run program was first started with a `--dir` flag that ran the worktree's whole unit suite on the unchanged tree, twice, each stopped by hand (section "Verify list runs and whole-suite commands"); and files outside the write list (`src/lib/data/model/index.ts`, `docs/HELP.md`, six diagram files `npm run diagrams` writes) and lines outside the named ranges of `model-sessions.ts` and `status.ts` changed, each with its reason (section "Files").

## Open items of the state file, verbatim

From `.scratch/migration/orchestrator-state.md`, the list under "## Open items (only what Axel must rule on; ...)" (line 181):

```
- none.
```

## The cases' first run, on the unchanged tree

Every case was run on the unchanged worktree (the same tree as `.agents/worktrees/O83-base`) by the case-run program quoted at the end, with `npx vitest run --config <scratchpad>/o83/cases.config.mts --disableConsoleIntercept --testTimeout 60000` from the worktree's root. It printed (the `hpc publish:` lines the watcher logs are left out):

```
CASE 1
  t1 good: status=ok hint=absent stale=absent jobs=[101,102] running=1 pending=1 total=2 recent=[502,501] sinfo=[pa] quota=[] lastOk=t1 updated=t1 lastOk==updated=true
  t1: take=["section-A [101,102]"] prewarm=["501,502"]
  next: batches sent 1 min after: 0, 2 min after: 0
CASE 2
  t1: take=["section-A [101,102]"] prewarm=["501,502"]
  t2 sacct exit 1: status=slurm_down hint=sacct: error: Problem talking to the database: Connection refused stale=absent jobs=[101,102] running=1 pending=1 total=2 recent=[502,501] sinfo=[pa] quota=[] lastOk=t1 updated=t2 lastOk==updated=false
  t2: take=[] prewarm=[]
  next: batches sent 1 min after: 0, 2 min after: 1
  after the quota read (and the poll 2 min after t2): status=slurm_down hint=sacct: error: Problem talking to the database: Connection refused stale=absent jobs=[101,102] running=1 pending=1 total=2 recent=[502,501] sinfo=[pa] quota=[home] lastOk=t1 updated=t2 lastOk==updated=false
CASE 3
  t1: take=["section-A [101,102]"] prewarm=["501,502"]
  t2 sinfo 124: status=slurm_down hint=no answer within the time limit stale=absent jobs=[101,102] running=1 pending=1 total=2 recent=[502,501] sinfo=[pa] quota=[] lastOk=t1 updated=t2 lastOk==updated=false
  t2: take=[] prewarm=[]
CASE 4
  t2 sacct 1 and sinfo 124: status=slurm_down hint=sacct: error: Problem talking to the database: Connection refused stale=absent jobs=[101,102] running=1 pending=1 total=2 recent=[502,501] sinfo=[pa] quota=[] lastOk=t1 updated=t2 lastOk==updated=false
CASE 5
  t1 first poll, sacct exit 1: status=slurm_down hint=sacct: error: Problem talking to the database: Connection refused stale=absent jobs=[] running=0 pending=0 total=0 recent=[] sinfo=[] quota=[] lastOk=absent updated=t1 lastOk==updated=false
  t1: take=[] prewarm=[]
CASE 6
  t3 sacct exit 1 again: status=slurm_down hint=sacct: error: Problem talking to the database: Connection refused stale=absent jobs=[101,102] running=1 pending=1 total=2 recent=[502,501] sinfo=[pa] quota=[] lastOk=t1 updated=t3 lastOk==updated=false
CASE 7
  t2 sinfo 124: status=slurm_down hint=no answer within the time limit stale=absent jobs=[101,102] running=1 pending=1 total=2 recent=[502,501] sinfo=[pa] quota=[] lastOk=t1 updated=t2 lastOk==updated=false
  t3 sacct exit 1: status=slurm_down hint=sacct: error: Problem talking to the database: Connection refused stale=absent jobs=[101,102] running=1 pending=1 total=2 recent=[502,501] sinfo=[pa] quota=[] lastOk=t1 updated=t3 lastOk==updated=false
CASE 8
  t2: status=slurm_down hint=sacct: error: Problem talking to the database: Connection refused stale=absent jobs=[101,102] running=1 pending=1 total=2 recent=[502,501] sinfo=[pa] quota=[] lastOk=t1 updated=t2 lastOk==updated=false
  after the partial poll: recover() sent 0 command(s), take=[]
  t1 unreachable: status=unreachable hint=ssh: connect to host cluster port 22: No route to host stale=absent jobs=[] running=0 pending=0 total=0 recent=[] sinfo=[] quota=[] lastOk=absent updated=t1 lastOk==updated=false
  after the unreachable poll: recover() sent 0 command(s), take=[]
CASE 9
  t3 squeue exit 1: status=slurm_down hint=slurm_load_jobs error: Unable to contact slurm controller stale=absent jobs=[101,102] running=1 pending=1 total=2 recent=[502,501] sinfo=[pa] quota=[] lastOk=t1 updated=t3 lastOk==updated=false
  recover() sent 0 command(s), take=[]
  t3 good: status=ok hint=absent stale=absent jobs=[301] running=1 pending=0 total=1 recent=[701] sinfo=[pc] quota=[] lastOk=t3 updated=t3 lastOk==updated=true
  recover() sent 1 command(s) [squeue:true section:true sacct:false], take=["section-alone [201]"]
  t3 ssh 255 no marker: status=unreachable hint=ssh: connect to host cluster port 22: No route to host stale=absent jobs=[101,102] running=1 pending=1 total=2 recent=[502,501] sinfo=[pa] quota=[] lastOk=t1 updated=t3 lastOk==updated=false
  recover() sent 0 command(s), take=[]
CASE 10
  t1 partial answer, ssh 255 after the marker: status=slurm_down hint=sacct: error: Problem talking to the database: Connection refused stale=absent jobs=[] running=0 pending=0 total=0 recent=[] sinfo=[] quota=[] lastOk=absent updated=t1 lastOk==updated=false
  t1: take=[] prewarm=[]
CASE 11
  t1 partial: status=slurm_down hint=sacct: error: Problem talking to the database: Connection refused stale=absent jobs=[] running=0 pending=0 total=0 recent=[] sinfo=[] quota=[] lastOk=absent updated=t1 lastOk==updated=false
  right after set(host2): status=starting hint=absent stale=absent jobs=[] running=0 pending=0 total=0 recent=[] sinfo=[] quota=[] lastOk=absent updated=t2 lastOk==updated=false
  t2 partial on host2: status=slurm_down hint=sacct: error: Problem talking to the database: Connection refused stale=absent jobs=[] running=0 pending=0 total=0 recent=[] sinfo=[] quota=[] lastOk=absent updated=t2 lastOk==updated=false
  set(unconfigured): status=unconfigured hint=no cluster named stale=absent jobs=[] running=0 pending=0 total=0 recent=[] sinfo=[] quota=[] lastOk=absent updated=t1 lastOk==updated=false
  right after set back to the cluster: status=starting hint=absent stale=absent jobs=[] running=0 pending=0 total=0 recent=[] sinfo=[] quota=[] lastOk=absent updated=t2 lastOk==updated=false
  t2 partial after set back: status=slurm_down hint=sacct: error: Problem talking to the database: Connection refused stale=absent jobs=[] running=0 pending=0 total=0 recent=[] sinfo=[] quota=[] lastOk=absent updated=t2 lastOk==updated=false
  answer after close(): publishes after it=0 take=[] latest status=starting
  answer after a host change: statuses published after it=["unreachable@cluster2"] take=[]
CASE 12
  t3 partial after a window change: status=slurm_down hint=sacct: error: Problem talking to the database: Connection refused stale=absent jobs=[101,102] running=1 pending=1 total=2 recent=[502,501] sinfo=[pa] quota=[] lastOk=t1 updated=t3 lastOk==updated=false
CASE 13
  t1 runner timeout after squeue answered: status=slurm_down hint=no answer within the time limit stale=absent jobs=[] running=0 pending=0 total=0 recent=[] sinfo=[] quota=[] lastOk=absent updated=t1 lastOk==updated=false
  t1: take=[] prewarm=[]
  t2 the same after a good poll at t1: status=slurm_down hint=no answer within the time limit stale=absent jobs=[101,102] running=1 pending=1 total=2 recent=[502,501] sinfo=[pa] quota=[] lastOk=t1 updated=t2 lastOk==updated=false
  t2: take=["section-A [101,102]"] prewarm=["501,502"]
CASE 14
  t2 sacct 0 empty, sinfo 124: status=slurm_down hint=no answer within the time limit stale=absent jobs=[101,102] running=1 pending=1 total=2 recent=[502,501] sinfo=[pa] quota=[] lastOk=t1 updated=t2 lastOk==updated=false
CASE 15
  ok payload:
    head bar: "live | 1 running | 1 pending | 2 total | as of 11:00, the next poll is late | every 20m" | refresh control in the bar: true
    error boxes: []
    headings: ["Cluster capacity (1 partition)","sinfo table (1 row)","Recent (finished) - 2","Login node"]
    stale marks: []
    row controls: 0 disabled of 6 buttons
    login: "Login node Waiting for the next Live HPC answer from the login node..."
  case 2's payload:
    head bar: "Slurm down | last reached 11:00 | retrying every 2m" | refresh control in the bar: false
    error boxes: ["The cluster was reached over ssh, and Slurm did not answer. sacct: error: Problem talking to the database: Connection refused Refresh now","The cluster was reached over ssh, and Slurm did not answer. sacct: error: Problem talking to the database: Connection refused"]
    headings: ["Cluster capacity (1 partition)","sinfo table (1 row)","Recent (finished) - 2","Login node"]
    stale marks: []
    row controls: 5 disabled of 6 buttons
    login: "Login node The cluster was reached over ssh, and Slurm did not answer. sacct: error: Problem talking to the database: Connection refused"
  case 5's payload:
    head bar: "Slurm down | retrying every 2m" | refresh control in the bar: false
    error boxes: ["The cluster was reached over ssh, and Slurm did not answer. sacct: error: Problem talking to the database: Connection refused Refresh now","The cluster was reached over ssh, and Slurm did not answer. sacct: error: Problem talking to the database: Connection refused"]
    headings: ["Login node"]
    stale marks: []
    row controls: 0 disabled of 1 buttons
    login: "Login node The cluster was reached over ssh, and Slurm did not answer. sacct: error: Problem talking to the database: Connection refused"
  case 9's payload (squeue exit 1 after case 2):
    head bar: "Slurm down | last reached 11:00 | retrying every 2m" | refresh control in the bar: false
    error boxes: ["The cluster was reached over ssh, and Slurm did not answer. slurm_load_jobs error: Unable to contact slurm controller Refresh now","The cluster was reached over ssh, and Slurm did not answer. slurm_load_jobs error: Unable to contact slurm controller"]
    headings: ["Cluster capacity (1 partition)","sinfo table (1 row)","Recent (finished) - 2","Login node"]
    stale marks: []
    row controls: 5 disabled of 6 buttons
    login: "Login node The cluster was reached over ssh, and Slurm did not answer. slurm_load_jobs error: Unable to contact slurm controller"
CASE 16
  case 2's payload: hpcWords={"short":"Slurm down","long":"The cluster was reached over ssh, and Slurm did not answer."} counts={"running":0,"pending":0} pillText="" badgeText=""
  ok payload: hpcWords={"short":"1 running, 1 pending","long":"1 running | 1 pending | 2 total"} counts={"running":1,"pending":1} pillText="1 HPC job running | 1 pending" badgeText="1 1"
  case 9's first payload: hpcWords={"short":"Slurm down","long":"The cluster was reached over ssh, and Slurm did not answer."} counts={"running":0,"pending":0} pillText="" badgeText=""
  slurm_down with no stale (case 10): hpcWords={"short":"Slurm down","long":"The cluster was reached over ssh, and Slurm did not answer."} counts={"running":0,"pending":0} pillText="" badgeText=""
CASE 17
  stale: { recent: '2026-10-26T10:00:00.000Z' }: passes unchanged
  stale: { sinfo: null }: passes unchanged
  no stale: passes unchanged
  stale: 'x': passes unchanged
  stale: { recent: 5 }: passes unchanged

 Test Files  1 passed (1)
      Tests  2 passed (2)
```

Reading of the first run, per case: 1 holds on the base. 2, 3, 4, 6, 7, 12 and 14 publish `slurm_down` over the first poll's rows with no `stale`, `lastOk` the first poll's and `updated` later, `take` not called and no prewarm: the freeze the brief describes. 5 publishes no queue and no `stale`. 8: `recover()` sends nothing after a `slurm_down`. 9: the three variants give `slurm_down`, `ok` and `unreachable` with no `stale`. 10, 11 and 13 give what the base gives and what the brief keeps. 15 and 16: the view and the status bar show the failure only, with the queue's controls disabled. 17: every `stale` passes. Each case is what the brief says the base gives, and no case showed a rule of the brief giving a wrong result, so the work went on.

The first run used the program below without its line `events('t1', g);` in case 13, which is why case 13's `t2` line in this first run lists the `take` and prewarm of its `t1` poll; the program prints the events of a poll on the line after it, and the line was added so each poll's events print under it.

G115's row (item 7, case 8's first row), run on the unchanged source with the new row in the test file, `npx vitest run tests/server/machine/runs/recover/runs.test.ts -t "runs Recover's section alone"` (the expected/received diff lines are left out where `...` stands):

```
 FAIL  |unit| tests/server/machine/runs/recover/runs.test.ts > a Recover run on the cluster > runs Recover's section alone with the queue while Live HPC's last poll was answered, and nothing otherwise
AssertionError: expected [] to have a length of 1 but got +0
 ...
 <HEAVY RIGHT-POINTING ANGLE QUOTATION MARK ORNAMENT> tests/server/machine/runs/recover/runs.test.ts:531:31
    529|             const read = await ask(answer);
    530|             expect(read.status).toBe(status);
    531|             expect(read.sent).toHaveLength(1);
 Test Files  1 failed (1)
      Tests  1 failed | 15 skipped (16)
```

The partial row's `slurm_down` (`:530`) holds on the base and `recover()` sends nothing (`:531`), which is the failure the brief predicts.

## DONE / NOT DONE

| Item | State | Proof (command, output after the last change) |
|---|---|---|
| 1. The poll tells a partial answer apart (`poll.ts`) | DONE | Case-run program, cases 2 to 7, 10 to 14 below; `t2 sacct exit 1: status=slurm_down ... stale={"recent":"t1"} jobs=[201,202,203] ... recent=[502,501] sinfo=[pb] ... lastOk=t2 updated=t2`, `take=["section-B [201,202,203]"] prewarm=[]`, `next: batches sent 1 min after: 0, 2 min after: 1` |
| 2. The payload's `stale` (`model-sessions.ts`, `payloads.ts`, `docs/apps.md`) | DONE | Case 17: `stale: 'x': refused`, `stale: { recent: 5 }: refused`, the three others `passes unchanged`; `docs/apps.md:421` rewritten (diff hunk `@@ -421 +421 @@`) |
| 3. The page reads a live queue from `ok` or `lastOk` equal to `updated` | DONE | Case 16: case 2's payload `counts={"running":2,"pending":1} pillText="2 HPC jobs running \| 1 pending" badgeText="2 1"`; the other three payloads print what the first run printed |
| 4. The view | DONE (by render to a string and reading; the look on landing is the proof for what only a page shows) | Case 15 below; `svelte-check ... 0 ERRORS 0 WARNINGS` in the list |
| 5. The status bar | DONE | Case 16: `hpcWords={"short":"2 running, 1 pending","long":"2 running \| 1 pending \| 3 total \| The cluster answered for the queue, and Slurm did not answer for the tables marked stale."}` |
| 6. The words | DONE | `grep -rn "slurm_partial_msg\|stale_from\|stale_never" config src --exclude=local.yml`: the three keys at `hpc.yml:91-93`, each read once in `hpc.ts:54,70` |
| 7. Recover reads while the queue is live, G115's row | DONE | `npx vitest run tests/server/machine/runs/recover/runs.test.ts --reporter verbose`: `Test Files  1 passed (1)`, `Tests  16 passed (16)`; case 8 `after the partial poll: recover() sent 1 command(s) [squeue:true section:true sacct:false], take=["section-alone [201]"]` |
| Verify 1: `npm run diagrams && npm run test:quick -- --base 4614443b` | DONE | second run: `test:quick: 200.8 s; every command passed` (section "Verify list runs") |
| Verify 2: G115's row red on the base, green after | DONE | above and row 7 |
| Verify 3: the case-run program before and after | DONE | sections above and below |
| Verify 4: unused exports | DONE | `diff O83-base/unused-exports.txt <after>` exits 0, no line; `Unused exports (230)` both |
| Verify 5: `status === 'ok'` grep | DONE | five hits, each named below |
| Verify 6: `grep -n 'stale' Head.svelte` | DONE | prints nothing |
| Verify 7: history-word grep | DONE | prints nothing, exit 1 |
| Verify 8: character set | DONE | `LC_ALL=C grep -n '[^ -~]'` over the 21 changed files and this report prints nothing |

The cases after the change (the last run, after the last change, printed the same lines as the run before it: `diff` of the two logs without the timing lines exits 0):

```
CASE 1
  t1 good: status=ok hint=absent stale=absent jobs=[101,102] running=1 pending=1 total=2 recent=[502,501] sinfo=[pa] quota=[] lastOk=t1 updated=t1 lastOk==updated=true
  t1: take=["section-A [101,102]"] prewarm=["501,502"]
  next: batches sent 1 min after: 0, 2 min after: 0
CASE 2
  t1: take=["section-A [101,102]"] prewarm=["501,502"]
  t2 sacct exit 1: status=slurm_down hint=sacct: error: Problem talking to the database: Connection refused stale={"recent":"t1"} jobs=[201,202,203] running=2 pending=1 total=3 recent=[502,501] sinfo=[pb] quota=[] lastOk=t2 updated=t2 lastOk==updated=true
  t2: take=["section-B [201,202,203]"] prewarm=[]
  next: batches sent 1 min after: 0, 2 min after: 1
  after the quota read (and the poll 2 min after t2): status=slurm_down hint=sacct: error: Problem talking to the database: Connection refused stale={"recent":"t1"} jobs=[201,202,203] running=2 pending=1 total=3 recent=[502,501] sinfo=[pb] quota=[home] lastOk=t2 updated=t2 lastOk==updated=true
CASE 3
  t1: take=["section-A [101,102]"] prewarm=["501,502"]
  t2 sinfo 124: status=slurm_down hint=no answer within the time limit stale={"sinfo":"t1"} jobs=[201,202,203] running=2 pending=1 total=3 recent=[601] sinfo=[pa] quota=[] lastOk=t2 updated=t2 lastOk==updated=true
  t2: take=["section-B [201,202,203]"] prewarm=["601"]
CASE 4
  t2 sacct 1 and sinfo 124: status=slurm_down hint=sacct: error: Problem talking to the database: Connection refused stale={"recent":"t1","sinfo":"t1"} jobs=[201,202,203] running=2 pending=1 total=3 recent=[502,501] sinfo=[pa] quota=[] lastOk=t2 updated=t2 lastOk==updated=true
CASE 5
  t1 first poll, sacct exit 1: status=slurm_down hint=sacct: error: Problem talking to the database: Connection refused stale={"recent":null} jobs=[201,202,203] running=2 pending=1 total=3 recent=[] sinfo=[pb] quota=[] lastOk=t1 updated=t1 lastOk==updated=true
  t1: take=["section-B [201,202,203]"] prewarm=[]
CASE 6
  t3 sacct exit 1 again: status=slurm_down hint=sacct: error: Problem talking to the database: Connection refused stale={"recent":"t1"} jobs=[301] running=1 pending=0 total=1 recent=[502,501] sinfo=[pc] quota=[] lastOk=t3 updated=t3 lastOk==updated=true
CASE 7
  t2 sinfo 124: status=slurm_down hint=no answer within the time limit stale={"sinfo":"t1"} jobs=[201,202,203] running=2 pending=1 total=3 recent=[601] sinfo=[pa] quota=[] lastOk=t2 updated=t2 lastOk==updated=true
  t3 sacct exit 1: status=slurm_down hint=sacct: error: Problem talking to the database: Connection refused stale={"recent":"t2"} jobs=[301] running=1 pending=0 total=1 recent=[601] sinfo=[pc] quota=[] lastOk=t3 updated=t3 lastOk==updated=true
CASE 8
  t2: status=slurm_down hint=sacct: error: Problem talking to the database: Connection refused stale={"recent":"t1"} jobs=[201,202,203] running=2 pending=1 total=3 recent=[502,501] sinfo=[pb] quota=[] lastOk=t2 updated=t2 lastOk==updated=true
  after the partial poll: recover() sent 1 command(s) [squeue:true section:true sacct:false], take=["section-alone [201]"]
  t1 unreachable: status=unreachable hint=ssh: connect to host cluster port 22: No route to host stale=absent jobs=[] running=0 pending=0 total=0 recent=[] sinfo=[] quota=[] lastOk=absent updated=t1 lastOk==updated=false
  after the unreachable poll: recover() sent 0 command(s), take=[]
CASE 9
  t3 squeue exit 1: status=slurm_down hint=slurm_load_jobs error: Unable to contact slurm controller stale={"recent":"t1"} jobs=[201,202,203] running=2 pending=1 total=3 recent=[502,501] sinfo=[pb] quota=[] lastOk=t2 updated=t3 lastOk==updated=false
  recover() sent 0 command(s), take=[]
  t3 good: status=ok hint=absent stale=absent jobs=[301] running=1 pending=0 total=1 recent=[701] sinfo=[pc] quota=[] lastOk=t3 updated=t3 lastOk==updated=true
  recover() sent 1 command(s) [squeue:true section:true sacct:false], take=["section-alone [201]"]
  t3 ssh 255 no marker: status=unreachable hint=ssh: connect to host cluster port 22: No route to host stale={"recent":"t1"} jobs=[201,202,203] running=2 pending=1 total=3 recent=[502,501] sinfo=[pb] quota=[] lastOk=t2 updated=t3 lastOk==updated=false
  recover() sent 0 command(s), take=[]
CASE 10
  t1 partial answer, ssh 255 after the marker: status=slurm_down hint=sacct: error: Problem talking to the database: Connection refused stale=absent jobs=[] running=0 pending=0 total=0 recent=[] sinfo=[] quota=[] lastOk=absent updated=t1 lastOk==updated=false
  t1: take=[] prewarm=[]
CASE 11
  t1 partial: status=slurm_down hint=sacct: error: Problem talking to the database: Connection refused stale={"recent":null} jobs=[201,202,203] running=2 pending=1 total=3 recent=[] sinfo=[pb] quota=[] lastOk=t1 updated=t1 lastOk==updated=true
  right after set(host2): status=starting hint=absent stale=absent jobs=[] running=0 pending=0 total=0 recent=[] sinfo=[] quota=[] lastOk=absent updated=t2 lastOk==updated=false
  t2 partial on host2: status=slurm_down hint=sacct: error: Problem talking to the database: Connection refused stale={"recent":null} jobs=[301] running=1 pending=0 total=1 recent=[] sinfo=[pc] quota=[] lastOk=t2 updated=t2 lastOk==updated=true
  set(unconfigured): status=unconfigured hint=no cluster named stale=absent jobs=[] running=0 pending=0 total=0 recent=[] sinfo=[] quota=[] lastOk=absent updated=t1 lastOk==updated=false
  right after set back to the cluster: status=starting hint=absent stale=absent jobs=[] running=0 pending=0 total=0 recent=[] sinfo=[] quota=[] lastOk=absent updated=t2 lastOk==updated=false
  t2 partial after set back: status=slurm_down hint=sacct: error: Problem talking to the database: Connection refused stale={"recent":null} jobs=[301] running=1 pending=0 total=1 recent=[] sinfo=[pc] quota=[] lastOk=t2 updated=t2 lastOk==updated=true
  answer after close(): publishes after it=0 take=[] latest status=starting
  answer after a host change: statuses published after it=["unreachable@cluster2"] take=[]
CASE 12
  t3 partial after a window change: status=slurm_down hint=sacct: error: Problem talking to the database: Connection refused stale={"recent":"t1"} jobs=[301] running=1 pending=0 total=1 recent=[502,501] sinfo=[pc] quota=[] lastOk=t3 updated=t3 lastOk==updated=true
CASE 13
  t1 runner timeout after squeue answered: status=slurm_down hint=no answer within the time limit stale=absent jobs=[] running=0 pending=0 total=0 recent=[] sinfo=[] quota=[] lastOk=absent updated=t1 lastOk==updated=false
  t1: take=[] prewarm=[]
  t1: take=["section-A [101,102]"] prewarm=["501,502"]
  t2 the same after a good poll at t1: status=slurm_down hint=no answer within the time limit stale=absent jobs=[101,102] running=1 pending=1 total=2 recent=[502,501] sinfo=[pa] quota=[] lastOk=t1 updated=t2 lastOk==updated=false
  t2: take=[] prewarm=[]
CASE 14
  t2 sacct 0 empty, sinfo 124: status=slurm_down hint=no answer within the time limit stale={"sinfo":"t1"} jobs=[201,202,203] running=2 pending=1 total=3 recent=[] sinfo=[pa] quota=[] lastOk=t2 updated=t2 lastOk==updated=true
CASE 15
  ok payload:
    head bar: "live | 1 running | 1 pending | 2 total | as of 11:00, the next poll is late | every 20m" | refresh control in the bar: true
    error boxes: []
    headings: ["Cluster capacity (1 partition)","sinfo table (1 row)","Recent (finished) - 2","Login node"]
    stale marks: []
    row controls: 0 disabled of 6 buttons
    login: "Login node Waiting for the next Live HPC answer from the login node..."
  case 2's payload:
    head bar: "Slurm down | 2 running | 1 pending | 3 total | as of 11:01 | retrying every 2m" | refresh control in the bar: false
    error boxes: ["The cluster answered for the queue, and Slurm did not answer for the tables marked stale. sacct: error: Problem talking to the database: Connection refused Refresh now"]
    headings: ["Cluster capacity (1 partition)","sinfo table (1 row)","Recent (finished) - 2 stale, from 11:00","Login node"]
    stale marks: ["stale, from 11:00"]
    row controls: 0 disabled of 8 buttons
    login: "Login node Waiting for the next Live HPC answer from the login node..."
  case 5's payload:
    head bar: "Slurm down | 2 running | 1 pending | 3 total | as of 11:00 | retrying every 2m" | refresh control in the bar: false
    error boxes: ["The cluster answered for the queue, and Slurm did not answer for the tables marked stale. sacct: error: Problem talking to the database: Connection refused Refresh now"]
    headings: ["Cluster capacity (1 partition)","sinfo table (1 row)","Recent (finished) - 0 stale, not read since the server started","Login node"]
    stale marks: ["stale, not read since the server started"]
    row controls: 0 disabled of 6 buttons
    login: "Login node Waiting for the next Live HPC answer from the login node..."
  case 9's payload (squeue exit 1 after case 2):
    head bar: "Slurm down | last reached 11:01 | retrying every 2m" | refresh control in the bar: false
    error boxes: ["The cluster was reached over ssh, and Slurm did not answer. slurm_load_jobs error: Unable to contact slurm controller Refresh now","The cluster was reached over ssh, and Slurm did not answer. slurm_load_jobs error: Unable to contact slurm controller"]
    headings: ["Cluster capacity (1 partition)","sinfo table (1 row)","Recent (finished) - 2 stale, from 11:00","Login node"]
    stale marks: ["stale, from 11:00"]
    row controls: 7 disabled of 8 buttons
    login: "Login node The cluster was reached over ssh, and Slurm did not answer. slurm_load_jobs error: Unable to contact slurm controller"
CASE 16
  case 2's payload: hpcWords={"short":"2 running, 1 pending","long":"2 running | 1 pending | 3 total | The cluster answered for the queue, and Slurm did not answer for the tables marked stale."} counts={"running":2,"pending":1} pillText="2 HPC jobs running | 1 pending" badgeText="2 1"
  ok payload: hpcWords={"short":"1 running, 1 pending","long":"1 running | 1 pending | 2 total"} counts={"running":1,"pending":1} pillText="1 HPC job running | 1 pending" badgeText="1 1"
  case 9's first payload: hpcWords={"short":"Slurm down","long":"The cluster was reached over ssh, and Slurm did not answer."} counts={"running":0,"pending":0} pillText="" badgeText=""
  slurm_down with no stale (case 10): hpcWords={"short":"Slurm down","long":"The cluster was reached over ssh, and Slurm did not answer."} counts={"running":0,"pending":0} pillText="" badgeText=""
CASE 17
  stale: { recent: '2026-10-26T10:00:00.000Z' }: passes unchanged
  stale: { sinfo: null }: passes unchanged
  no stale: passes unchanged
  stale: 'x': refused
  stale: { recent: 5 }: refused

 Test Files  1 passed (1)
      Tests  2 passed (2)
```

Per case against the brief: 1 met. 2 met (hint the stderr line, `stale` `{ recent: t1 }`, `jobs` and `sinfo` the second answer's, `recent` the first's, `lastOk` and `updated` both `t2`, `take` with the second answer's section and jobs, the next poll 2 minutes on and not 1, no prewarm from the second poll; the quota read keeps `stale`, `lastOk` and `updated` and carries the quota). 3 met (the prewarm asked once, about job 601, the second answer's Recent row). 4 met. 5 met. 6 met (`t1`, not `t2`). 7 met (`{ recent: t2 }`, Recent the second answer's, Capacity the third's). 8 met; "after case 9's second poll" is read as the poll case 9 adds (the `squeue` exit 1), after which it sends nothing, and the other two variants of case 9 are printed too (judgment call 7). 9 met. 10 met. 11 met. 12 met. 13 met (no `stale` with no earlier poll, and none after a good poll, since every table is as old as the queue). 14 met. 15 met (in the HTML the server renders; the look on landing is the proof for the screen). 16 met. 17 met. In case 15 the ok payload's "the next poll is late" is the program's doing: the page's minute clock is the real one and the payload's time is the program's fixed `t1`.

The five hits of verify 5, `grep -rn "status === 'ok'\|status !== 'ok'" src/lib/state/system/machine/hpc src/lib/views/system/machine/hpc src/lib/server/machine/hpc/poll.ts`:

```
src/lib/state/system/machine/hpc/hpc.ts:52:    if (status === 'starting' || status === 'ok' || status === 'unconfigured') return null;
src/lib/views/system/machine/hpc/Hpc.svelte:110:        {:else if data && data.status !== 'ok'}
src/lib/views/system/machine/hpc/Head.svelte:49:        if (data?.status !== 'ok') return false;
src/lib/views/system/machine/hpc/Head.svelte:82:        if (data.status !== 'ok') return [];
src/lib/views/system/machine/hpc/Head.svelte:103:        <span class:ok={data?.status === 'ok'} class:bad={failed}>
```

- `hpc.ts:52`: `failureWords` gives no failure words for a status that is not a failure; `ok` is one of three such statuses.
- `Head.svelte:49` (`late()`): the overdue mark is for a good poll only; a failed poll runs on the retry cadence and the brief gives its bar plain `hpc.as_of`.
- `Head.svelte:82` (`parts()`): reached only after the failed branch, so the statuses left are `starting` and `unconfigured`, which have no parts.
- `Head.svelte:103`: the green tone of the state word is a good poll's; a failed poll whose queue is live is still a failure and takes `.bad`.
- `Hpc.svelte:110`: the error box is drawn for every failure, a live-queue `slurm_down` included (item 4).

## Files

From `diff -rq --exclude=local.yml O83-base/<d> migration-O83/<d>` over `src tests utils config`, and `git diff --stat` for `docs`; line counts from `wc -l` after the last change.

| File | Lines now | In the write list |
|---|---|---|
| `src/lib/server/machine/hpc/poll.ts` | 632 | yes |
| `src/lib/data/model/model-sessions.ts` | 869 | lines 655-677 named, changed at base lines 668-669 (`lastOk`, `stale`); also base line 621 (`HpcStatus` made local) and after base line 678 (`queueIsCurrent`, now `:691-701`), which judgment calls 1 and 2 need |
| `src/lib/data/model/index.ts` | 873 | no: exports `queueIsCurrent` (`:663`) and drops `HpcStatus` (`:636`), which judgment calls 1 and 2 need |
| `src/lib/state/client/shapes/payloads.ts` | 305 | yes, hunk at 65-70 inside `hpcShape` |
| `src/lib/state/system/machine/hpc/hpc.ts` | 145 | yes |
| `src/lib/state/system/machine/hpc/hpc.svelte.ts` | 93 | yes |
| `src/lib/state/workbench/navigation/status.ts` | 606 | lines 179-198 named; also the import line 51 (`queueIsCurrent`), far from O80's 394-430 |
| `src/lib/views/system/machine/hpc/Head.svelte` | 135 | yes |
| `src/lib/views/system/machine/hpc/Hpc.svelte` | 156 | yes |
| `src/lib/views/system/machine/hpc/Recent.svelte` | 158 | yes |
| `src/lib/views/system/machine/hpc/Capacity.svelte` | 179 | yes |
| `config/text/views/system/machine/hpc.yml` | 104 | yes |
| `docs/apps.md` | 847 | yes, line 421 only |
| `docs/HELP.md` | 570 | no: one sentence added to the Live HPC bullet, line 320, since the rules file asks what a user sees to be written there; O80 changes line 316 of this file, three unchanged lines apart |
| `docs/diagrams/layers.dot`, `layers.svg`, `layer-server.dot`, `layer-server.svg`, `layer-state.dot`, `layer-state.svg` | (generated) | no: written by `npm run diagrams`, which the verify command runs, for the new imports (`poll.ts` of `data/model`, `hpc.svelte.ts` of `hpc.ts`) |
| `tests/server/machine/runs/recover/runs.test.ts` | 545 | yes: base lines 18-23 (two imports) and 476-537 (the row), now 478-545 |
| `.scratch/migration/agents/reviews/O83-report.md` | this file | yes |

Edits to existing assertions, from `git diff -- tests/server/machine/runs/recover/runs.test.ts` (no allow list or predicate changed):

| Before | After |
|---|---|
| `const good = await ask(true);` and eight `expect(good...)` lines | the same eight `expect` lines over `read`, in a loop over `[batch, 'ok']` and `[partial, 'slurm_down']`; the status asserted is the row's |
| `const down = await ask(false);` | `const down = await ask(unreachable);`, its three `expect` lines unchanged |
| `ask(answered: boolean)` choosing between two answers | `ask(answer)` returning the answer given; `batch` became the whole result `{ stdout, stderr: '', code: 0 }` it was wrapped in |

The test the step changes, its failing line on the unchanged tree: `tests/server/machine/runs/recover/runs.test.ts:531:31`, `expect(read.sent).toHaveLength(1)`, "expected [] to have a length of 1 but got +0" (quoted above).

## Judgment calls the brief left open (each reversible)

1. The predicate `queueIsCurrent` is defined once in `src/lib/data/model/model-sessions.ts` beside `HpcPayload`, exported through `data/model/index.ts`, and re-exported from `hpc.ts`, which the view, `hpc.svelte.ts` and `status.ts` import it from. The brief puts it in `hpc.ts`, and `recover()` in `poll.ts` needs the same rule; server code may import only `server/**` and `data/**` (`tests/checks/tree/boundaries.test.ts:347`, `server: ['server/**', 'data/**']`), and `hpc.ts` reads the text catalog, so a definition in `hpc.ts` would have put a second copy of the rule in `poll.ts`.
2. `HpcStatus` lost its one importer (`failureWords` now takes the payload), and `sh utils/unused-exports.sh` then listed it as a new unused export of `index.ts` and `model-sessions.ts`; it is now a local type of `model-sessions.ts` and leaves `index.ts`'s export list.
3. `failureWords` takes `Pick<HpcPayload, 'status' | 'lastOk' | 'updated'>`, so its three callers pass the payload.
4. The stale mark sits in the heading after its words, `margin-inline-start: 6px`, in `--c-red-d-txt` and with `text-transform: none`, so it reads "stale, from 11:00" in its own case inside the capital heading. The brief names the tone and the place, not the case.
5. One helper `staleWords(time)` in `hpc.ts` gives the mark's words for Recent and Capacity.
6. The status bar's tooltip joins the queue summary and the sentence with `sessions.meta_sep` between spaces (`' | '`), as `views/shared/changes/branch-state.ts:19` joins it; the catalog's separator is `'|'` alone.
7. Case 8's "after case 9's second poll" is read as the poll case 9 adds after case 2's two (the `squeue` exit 1); the program prints `recover()` after each of case 9's three variants.
8. `Hpc.svelte` draws Capacity and Quota when the queue is live, when there are rows or quota, or when `stale` names `sinfo`; and Jobs and Recent when the queue is live, when there are rows, or when `stale` names `recent`; so a table `stale` names is drawn with its mark on a failed payload whose queue is not live too (item 4, "whatever its status").
9. The `poll.ts` rows of the poll body are this poll's when `sacct`'s or `sinfo`'s code is 0, which counts a code line that is absent as 0, as `splitSections` does; on a partial answer a failing table's code line is present by construction.

## Host- or user-visible changes, for the look on landing

All on the Live HPC view (float tab w1), the status bar's HPC item, the Focus command center's HPC pill and the rail badge. The state to put the view in: a cluster where `squeue` answers and `sacct` fails (for example Slurm's accounting database down); on the real cluster this cannot be arranged at will, so the look reads the states against these lines.

- Head bar, failed poll whose queue is this poll's. Before: "Slurm down | last reached HH:MM | retrying every 2m". After: "Slurm down | 2 running | 1 pending | 3 total | as of HH:MM | retrying every 2m", the state word in the failure tone, no refresh control in the bar.
- Error box, same state. Before: "The cluster was reached over ssh, and Slurm did not answer. `<hint>`". After: "The cluster answered for the queue, and Slurm did not answer for the tables marked stale. `<hint>`", with Refresh now.
- Jobs and Recent, same state. Before: Cancel and log disabled with the tip "the cluster is not answering". After: pressable.
- Login node section, same state. Before: the error sentence as its reason. After: no reason; it shows the sessions or "Waiting for the next Live HPC answer from the login node...".
- Recent heading with `stale.recent` a time: "RECENT (FINISHED) - 2" followed by "stale, from HH:MM" in red, lower case. With `null`: "RECENT (FINISHED) - 0" and "stale, not read since the server started", the section drawn with no rows. Capacity the same with "CLUSTER CAPACITY (n PARTITIONS)" and `stale.sinfo`.
- A later failed poll (ssh down, or `squeue` failing) while a table is older than the queue: the box says the failure's own sentence as before, the controls disabled as before, and the table keeps its red mark.
- Status bar HPC item, same state. Before: "Slurm down", tooltip "The cluster was reached over ssh, and Slurm did not answer.. Open Live HPC.". After: "2 running, 1 pending", tooltip "2 running | 1 pending | 3 total | The cluster answered for the queue, and Slurm did not answer for the tables marked stale.. Open Live HPC.".
- Focus command center pill and rail badge, same state. Before: hidden. After: "2 HPC jobs running | 1 pending" and the counts.
- Recover view and the Login node section on the cluster, same state, while a run on the cluster is followed: `recover()` now reads the section between polls (case 8: 1 command sent and `take` called, against 0 on the base), so bytes and rate keep updating; on the base they stay at the last good poll's reading.

## Wrong or impossible in the brief

- The brief places the one predicate in `hpc.ts`; the layer rule forbids the server from importing it there (judgment call 1). Built as one definition in the data model, re-exported from `hpc.ts`.
- Nothing else found wrong.

## Limitations and sharp edges

- The status bar tooltip `statusbar.hpc_tip` is `'{0}. Open Live HPC.'` (`config/text/statusbar.yml:71`), and every failure sentence ends with a period, so the tooltip reads "...did not answer.. Open Live HPC." on the base for every failure, and now "...marked stale.. Open Live HPC." for the partial one. It is outside the step's paths and was not changed.
- `src/lib/data/model/model-sessions.ts` is at 869 lines, 11 under the 880 the rules file sets.
- The view's checks are a render to a string (case 15) and reading; focus, the tone and the capitals are for the look on landing.
- The run of `runs.test.ts` in the first verify list timed out in the row "finds a real detached fetch again from a server that has just started, and stops it, pushing its bytes and its end" (`Error: Test timed out in 30000ms`, `runs.test.ts:233`), a row the step does not change, which starts a real process; alone it passed in 528 ms and the second list passed.

## The case-run program

Two files in the scratchpad `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o83/`, with `node_modules` there a symbolic link to the worktree's `node_modules`. Run from the worktree's root: `npx vitest run --config <that folder>/cases.config.mts --disableConsoleIntercept --testTimeout 60000`. `npx vitest list --filesOnly --config <that folder>/cases.config.mts` printed only `[cases] .../scratchpad/o83/tests/cases.test.ts`. It reads the catalog from `config/text` alone. It is deleted from the scratchpad before this report is handed back.

`cases.config.mts`:

```ts
// O83 case-run program's config: the worktree's own config with one project that holds only the
// case file of this folder.
import base from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O83/vite.config.ts';

const DIR = '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o83';

export default (env: { mode: string; command: 'build' | 'serve' }) => {
    const config = base(env as never) as Record<string, any>;
    const { projects: _projects, ...test } = config.test;
    return {
        ...config,
        root: '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O83',
        test: { ...test, name: 'cases', environment: 'node', dir: DIR, include: ['tests/cases.test.ts'] }
    };
};
```

`tests/cases.test.ts`:

```ts
// O83 case-run program. It prints the result of each case of the brief and asserts nothing about
// them. Run from the worktree's root:
//   npx vitest run --dir <this folder> --project unit --disableConsoleIntercept
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import { parse } from 'yaml';
import { Hub } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O83/src/lib/server/core/channels.ts';
import * as P from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O83/src/lib/server/machine/hpc/parse.ts';
import { watchHpc, type HpcSettings } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O83/src/lib/server/machine/hpc/poll.ts';
import { RunTimeout, type RunResult } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O83/src/lib/server/machine/hpc/ssh.ts';
import type { HpcPayload } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O83/src/lib/data/model/index.ts';
import { setCatalog } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O83/src/lib/state/shared/words/text.ts';
import { flattenText } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O83/src/lib/data/sources/config/merge/text.ts';
import { hpcWords } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O83/src/lib/state/workbench/navigation/status.ts';
import { payloadShapes } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O83/src/lib/state/client/shapes/payloads.ts';
import { emptyClient, clientContext } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O83/tests/fixtures/client.ts';
import Hpc from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O83/src/lib/views/system/machine/hpc/Hpc.svelte';

const WT = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O83';

// The text catalog, read from config/text alone (no other config file is read).
function textFiles(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
        const path = join(dir, name);
        return statSync(path).isDirectory() ? textFiles(path) : name.endsWith('.yml') ? [path] : [];
    });
}
const catalog: Record<string, string> = {};
for (const file of textFiles(join(WT, 'config/text'))) {
    Object.assign(catalog, flattenText((parse(readFileSync(file, 'utf8')) as { text: unknown }).text));
}
setCatalog(catalog);

const T1 = '2026-10-26T10:00:00.000Z';
const T2 = '2026-10-26T10:01:00.000Z';
const T3 = '2026-10-26T10:02:00.000Z';
const NAMES: Record<string, string> = { [T1]: 't1', [T2]: 't2', [T3]: 't3' };
const at = (iso: string | null | undefined): string =>
    iso === undefined ? 'absent' : iso === null ? 'null' : (NAMES[iso] ?? iso);

const DB = 'sacct: error: Problem talking to the database: Connection refused';
const JOB = (id: number, state: string): string =>
    `${id}|job${id}|main|${state}|0:10|1:00:00|1|1|N/A|4G|100|N/A|node1`;
const REC = (id: number): string =>
    `${id}|run${id}|COMPLETED|0:0|00:01:00|2026-10-26T09:${String(id % 60).padStart(2, '0')}:00|4G||00:00:30|1|1|60`;
const PART = (name: string, state: string, nodes: number): string => `${name}|up|${nodes}|${state}|gpu:1`;

type Cmd = { code?: number; rows?: string[]; err?: string };
function answer(o: {
    squeue?: Cmd;
    sacct?: Cmd;
    sinfo?: Cmd;
    recover?: string;
    ssh?: number;
}): RunResult {
    const sq = { code: 0, rows: [], err: '', ...o.squeue };
    const sa = { code: 0, rows: [], err: '', ...o.sacct };
    const si = { code: 0, rows: [], err: '', ...o.sinfo };
    const lines = [
        P.SEC_CONNECTED,
        ...sq.rows,
        `${P.SEC_RC}${sq.code}`,
        P.SEC_SQUEUE_ERR,
        ...(sq.err ? [sq.err] : []),
        P.SEC_SACCT,
        ...sa.rows,
        `${P.SEC_SACCT_RC}${sa.code}`,
        P.SEC_SACCT_ERR,
        ...(sa.err ? [sa.err] : []),
        P.SEC_SINFO,
        ...si.rows,
        `${P.SEC_SINFO_RC}${si.code}`,
        P.SEC_SINFO_ERR,
        ...(si.err ? [si.err] : []),
        P.SEC_RECOVER,
        o.recover ?? 'section'
    ];
    return { stdout: `${lines.join('\n')}\n`, stderr: '', code: o.ssh ?? 0 };
}

const Q_A = [JOB(101, 'RUNNING'), JOB(102, 'PENDING')];
const Q_B = [JOB(201, 'RUNNING'), JOB(202, 'RUNNING'), JOB(203, 'PENDING')];
const Q_C = [JOB(301, 'RUNNING')];
const GOOD_A = answer({ squeue: { rows: Q_A }, sacct: { rows: [REC(501), REC(502)] }, sinfo: { rows: [PART('pa', 'idle', 4)] }, recover: 'section-A' });
const SACCT_FAIL_B = answer({ squeue: { rows: Q_B }, sacct: { code: 1, err: DB }, sinfo: { rows: [PART('pb', 'mix', 8)] }, recover: 'section-B' });
const SINFO_LATE_B = answer({ squeue: { rows: Q_B }, sacct: { rows: [REC(601)] }, sinfo: { code: 124 }, recover: 'section-B' });
const BOTH_FAIL_B = answer({ squeue: { rows: Q_B }, sacct: { code: 1, err: DB }, sinfo: { code: 124 }, recover: 'section-B' });
const SACCT_FAIL_C = answer({ squeue: { rows: Q_C }, sacct: { code: 1, err: DB }, sinfo: { rows: [PART('pc', 'alloc', 2)] }, recover: 'section-C' });
const GOOD_C = answer({ squeue: { rows: Q_C }, sacct: { rows: [REC(701)] }, sinfo: { rows: [PART('pc', 'alloc', 2)] }, recover: 'section-C' });
const SQUEUE_FAIL = answer({
    squeue: { code: 1, err: 'slurm_load_jobs error: Unable to contact slurm controller' },
    sacct: { code: 1, err: DB },
    sinfo: { code: 1, err: 'slurm_load_partitions: Unable to contact slurm controller' },
    recover: 'section-X'
});
const SACCT_EMPTY_SINFO_LATE_B = answer({ squeue: { rows: Q_B }, sacct: { rows: [] }, sinfo: { code: 124 }, recover: 'section-B' });
const UNREACH: RunResult = { stdout: '', stderr: 'ssh: connect to host cluster port 22: No route to host', code: 255 };
const BROKE = { ...SACCT_FAIL_B, code: 255 };
const TIMEOUT_STDOUT = [P.SEC_CONNECTED, ...Q_B, `${P.SEC_RC}0`, P.SEC_SQUEUE_ERR, P.SEC_SACCT, ''].join('\n');

type Step = RunResult | { reject: unknown } | 'defer';
const WORDS = { sshExited: 'ssh exited {0}', slurmLate: 'no answer within the time limit', overrun: 'overrun' };
const SETTINGS: HpcSettings = { host: 'cluster', days: 1, pollMin: 20, quotaMin: 60, prewarm: true, words: WORDS };

function harness(steps: Step[]) {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    vi.setSystemTime(new Date(T1));
    const hub = new Hub();
    const seen: HpcPayload[] = [];
    const publish = hub.publish.bind(hub);
    hub.publish = (channel: string, payload: unknown): number => {
        if (channel === 'hpc') seen.push(payload as HpcPayload);
        return publish(channel, payload);
    };
    const log = { batch: 0, recover: [] as string[], take: [] as string[], prewarm: [] as string[] };
    const deferred: ((value: RunResult) => void)[] = [];
    let quota: RunResult = { stdout: '', stderr: '', code: 1 };
    const runner = (_host: string, command: string): Promise<RunResult> => {
        if (command.startsWith('quota')) return Promise.resolve(quota);
        if (command.includes(P.SEC_SACCT)) {
            log.batch += 1;
            const step = steps.shift() ?? UNREACH;
            if (step === 'defer') return new Promise((resolve) => deferred.push(resolve));
            if ('reject' in step) return Promise.reject(step.reject);
            return Promise.resolve(step);
        }
        if (command.includes(P.SEC_RECOVER)) {
            log.recover.push(command);
            return Promise.resolve({ stdout: `${JOB(201, 'RUNNING')}\n${P.SEC_RC}0\n${P.SEC_RECOVER}\nsection-alone\n`, stderr: '', code: 0 });
        }
        if (command.startsWith('sacct -X')) {
            const ids = [501, 502, 601, 701];
            return Promise.resolve({ stdout: ids.map((id) => `${id}|/home/u/w${id}`).join('\n'), stderr: '', code: 0 });
        }
        log.prewarm.push([...command.matchAll(/\/home\/u\/w(\d+)/g)].map((m) => m[1]).filter((v, i, a) => a.indexOf(v) === i).join(','));
        return Promise.resolve({ stdout: '', stderr: '', code: 1 });
    };
    const watcher = watchHpc(hub, {
        ...SETTINGS,
        logPaths: new Map(),
        recover: { command: () => 'echo section', take: (section, jobs) => log.take.push(`${section.trim()} [${jobs.map((j) => j.id).join(',')}]`) },
        runner
    });
    return {
        hub,
        seen,
        log,
        watcher,
        setQuota: (next: RunResult) => (quota = next),
        resolve: (value: RunResult) => deferred.shift()?.(value),
        latest: () => hub.latest('hpc')?.payload as HpcPayload,
        end: () => {
            watcher.close();
            vi.useRealTimers();
        }
    };
}

const flush = async (): Promise<void> => {
    for (let i = 0; i < 5; i += 1) await new Promise((resolve) => setImmediate(resolve));
};

function show(label: string, p: HpcPayload): void {
    const stale = 'stale' in p ? JSON.stringify((p as { stale?: unknown }).stale, (_k, v) => (typeof v === 'string' ? at(v) : v)) : 'absent';
    console.log(
        `  ${label}: status=${p.status} hint=${p.hint ?? 'absent'} stale=${stale} jobs=[${p.jobs.map((j) => j.id).join(',')}] running=${p.running} pending=${p.pending} total=${p.total} recent=[${p.recent.map((r) => r.id).join(',')}] sinfo=[${p.sinfo.map((s) => s.partition).join(',')}] quota=[${p.quota.map((q) => q.name).join(',')}] lastOk=${at(p.lastOk)} updated=${at(p.updated)} lastOk==updated=${p.lastOk === p.updated}`
    );
}
function events(label: string, h: ReturnType<typeof harness>): void {
    console.log(`  ${label}: take=${JSON.stringify(h.log.take)} prewarm=${JSON.stringify(h.log.prewarm)}`);
    h.log.take.length = 0;
    h.log.prewarm.length = 0;
}
async function poll(h: ReturnType<typeof harness>, time: string): Promise<void> {
    vi.setSystemTime(new Date(time));
    await h.watcher.refresh();
    await flush();
}
async function nextPoll(h: ReturnType<typeof harness>): Promise<string> {
    const before = h.log.batch;
    await vi.advanceTimersByTimeAsync(60000);
    await flush();
    const atOne = h.log.batch - before;
    await vi.advanceTimersByTimeAsync(60000);
    await flush();
    return `batches sent 1 min after: ${atOne}, 2 min after: ${h.log.batch - before}`;
}
async function recoverRun(h: ReturnType<typeof harness>): Promise<string> {
    h.log.take.length = 0;
    const before = h.log.recover.length;
    await h.watcher.recover();
    const sent = h.log.recover.slice(before);
    return `recover() sent ${sent.length} command(s)${sent.map((c) => ` [squeue:${c.includes('squeue --me')} section:${c.includes('echo section')} sacct:${c.includes('sacct')}]`).join('')}, take=${JSON.stringify(h.log.take)}`;
}
/** Case 2's two polls: a good answer at t1 (the constructor's poll), then sacct failing at t2. */
async function caseTwo(rest: Step[]): Promise<ReturnType<typeof harness>> {
    const h = harness([GOOD_A, SACCT_FAIL_B, ...rest]);
    await flush();
    await poll(h, T2);
    return h;
}

const payloads: Record<string, HpcPayload> = {};

it('cases 1 to 14', async () => {
    console.log('CASE 1');
    {
        const h = harness([GOOD_A]);
        await flush();
        show('t1 good', h.latest());
        events('t1', h);
        console.log(`  next: ${await nextPoll(h)}`);
        payloads.ok = structuredClone(h.latest());
        h.end();
    }
    console.log('CASE 2');
    {
        const h = harness([GOOD_A, SACCT_FAIL_B]);
        await flush();
        events('t1', h);
        await poll(h, T2);
        show('t2 sacct exit 1', h.latest());
        events('t2', h);
        payloads.case2 = structuredClone(h.latest());
        h.setQuota({ stdout: '/home 1G 2G 4G\n', stderr: '', code: 0 });
        h.watcher.set({ ...SETTINGS, quotaMin: 1 });
        console.log(`  next: ${await nextPoll(h)}`);
        show('after the quota read (and the poll 2 min after t2)', h.seen.find((p) => p.quota.length > 0) ?? h.latest());
        h.end();
    }
    console.log('CASE 3');
    {
        const h = harness([GOOD_A, SINFO_LATE_B]);
        await flush();
        events('t1', h);
        await poll(h, T2);
        show('t2 sinfo 124', h.latest());
        events('t2', h);
        h.end();
    }
    console.log('CASE 4');
    {
        const h = harness([GOOD_A, BOTH_FAIL_B]);
        await flush();
        await poll(h, T2);
        show('t2 sacct 1 and sinfo 124', h.latest());
        h.end();
    }
    console.log('CASE 5');
    {
        const h = harness([SACCT_FAIL_B]);
        await flush();
        show('t1 first poll, sacct exit 1', h.latest());
        events('t1', h);
        payloads.case5 = structuredClone(h.latest());
        h.end();
    }
    console.log('CASE 6');
    {
        const h = await caseTwo([SACCT_FAIL_C]);
        await poll(h, T3);
        show('t3 sacct exit 1 again', h.latest());
        h.end();
    }
    console.log('CASE 7');
    {
        const h = harness([GOOD_A, SINFO_LATE_B, SACCT_FAIL_C]);
        await flush();
        await poll(h, T2);
        show('t2 sinfo 124', h.latest());
        await poll(h, T3);
        show('t3 sacct exit 1', h.latest());
        h.end();
    }
    console.log('CASE 8');
    {
        const h = await caseTwo([]);
        show('t2', h.latest());
        console.log(`  after the partial poll: ${await recoverRun(h)}`);
        h.end();
        const u = harness([UNREACH]);
        await flush();
        show('t1 unreachable', u.latest());
        console.log(`  after the unreachable poll: ${await recoverRun(u)}`);
        u.end();
    }
    console.log('CASE 9');
    {
        const h = await caseTwo([SQUEUE_FAIL]);
        await poll(h, T3);
        show('t3 squeue exit 1', h.latest());
        console.log(`  ${await recoverRun(h)}`);
        payloads.case9 = structuredClone(h.latest());
        h.end();
        const g = await caseTwo([GOOD_C]);
        await poll(g, T3);
        show('t3 good', g.latest());
        console.log(`  ${await recoverRun(g)}`);
        g.end();
        const u = await caseTwo([UNREACH]);
        await poll(u, T3);
        show('t3 ssh 255 no marker', u.latest());
        console.log(`  ${await recoverRun(u)}`);
        u.end();
    }
    console.log('CASE 10');
    {
        const h = harness([BROKE]);
        await flush();
        show('t1 partial answer, ssh 255 after the marker', h.latest());
        events('t1', h);
        payloads.case10 = structuredClone(h.latest());
        h.end();
    }
    console.log('CASE 11');
    {
        const h = harness([SACCT_FAIL_B, SACCT_FAIL_C]);
        await flush();
        show('t1 partial', h.latest());
        vi.setSystemTime(new Date(T2));
        h.watcher.set({ ...SETTINGS, host: 'cluster2' });
        show('right after set(host2)', h.seen.at(-1)!);
        await flush();
        show('t2 partial on host2', h.latest());
        h.end();
        const u = harness([SACCT_FAIL_B, SACCT_FAIL_C]);
        await flush();
        u.watcher.set({ ...SETTINGS, host: '', missing: 'no cluster named', unconfigured: true });
        show('set(unconfigured)', u.latest());
        vi.setSystemTime(new Date(T2));
        u.watcher.set({ ...SETTINGS });
        show('right after set back to the cluster', u.seen.at(-1)!);
        await flush();
        show('t2 partial after set back', u.latest());
        u.end();
        const c = harness(['defer']);
        const versionBefore = c.hub.version('hpc');
        c.watcher.close();
        c.resolve(SACCT_FAIL_B);
        await flush();
        console.log(`  answer after close(): publishes after it=${c.hub.version('hpc') - versionBefore} take=${JSON.stringify(c.log.take)} latest status=${c.latest().status}`);
        c.end();
        const d = harness(['defer', UNREACH]);
        d.watcher.set({ ...SETTINGS, host: 'cluster2' });
        const seenBefore = d.seen.length;
        d.resolve(SACCT_FAIL_B);
        await flush();
        console.log(`  answer after a host change: statuses published after it=${JSON.stringify(d.seen.slice(seenBefore).map((p) => `${p.status}@${p.host}`))} take=${JSON.stringify(d.log.take)}`);
        d.end();
    }
    console.log('CASE 12');
    {
        const h = await caseTwo([SACCT_FAIL_C]);
        vi.setSystemTime(new Date(T3));
        h.watcher.set({ ...SETTINGS, days: 2 });
        await flush();
        show('t3 partial after a window change', h.latest());
        h.end();
    }
    console.log('CASE 13');
    {
        const h = harness([{ reject: new RunTimeout(TIMEOUT_STDOUT) }]);
        await flush();
        show('t1 runner timeout after squeue answered', h.latest());
        events('t1', h);
        h.end();
        const g = harness([GOOD_A, { reject: new RunTimeout(TIMEOUT_STDOUT) }]);
        await flush();
        events('t1', g);
        await poll(g, T2);
        show('t2 the same after a good poll at t1', g.latest());
        events('t2', g);
        g.end();
    }
    console.log('CASE 14');
    {
        const h = harness([GOOD_A, SACCT_EMPTY_SINFO_LATE_B]);
        await flush();
        await poll(h, T2);
        show('t2 sacct 0 empty, sinfo 124', h.latest());
        h.end();
    }
    expect(true).toBe(true);
});

function strip(html: string): string {
    return html.replace(/<!--[^]*?-->/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
function page(label: string, payload: HpcPayload): void {
    const client = emptyClient();
    client.entities.receive({ channel: 'hpc', version: 1, payload });
    const html = render(Hpc, {
        props: { instance: { id: 'hpc-1', view: 'hpc', state: null } },
        context: clientContext(client)
    }).body;
    const meta = /<p class="meta[^"]*">([^]*?)<\/p>/.exec(html)?.[1] ?? '';
    const bar = html.slice(0, html.indexOf('<p class="meta'));
    const login = /<details class="login[^]*?<\/details>/.exec(html)?.[0] ?? '';
    const summaries = [...html.matchAll(/<summary[^>]*>([^]*?)<\/summary>/g)].map((m) => strip(m[1]));
    const buttons = [...html.matchAll(/<button[^>]*>/g)].map((m) => m[0]);
    console.log(`  ${label}:`);
    console.log(`    head bar: "${strip(meta)}" | refresh control in the bar: ${bar.includes(catalog['hpc.refresh_now'])}`);
    const boxes = [...html.matchAll(/<p class="empty[^"]*error[^"]*"[^>]*>([^]*?)<\/p>/g)].map((m) => strip(m[1]));
    console.log(`    error boxes: ${JSON.stringify(boxes)}`);
    console.log(`    headings: ${JSON.stringify(summaries)}`);
    console.log(`    stale marks: ${JSON.stringify([...html.matchAll(/class="[^"]*stale[^"]*"[^>]*>([^<]*)</g)].map((m) => m[1]))}`);
    console.log(`    row controls: ${buttons.filter((b) => /disabled/.test(b)).length} disabled of ${buttons.length} buttons`);
    console.log(`    login: "${strip(login)}"`);
}

it('cases 15 to 17', () => {
    console.log('CASE 15');
    page('ok payload', payloads.ok);
    page("case 2's payload", payloads.case2);
    page("case 5's payload", payloads.case5);
    page("case 9's payload (squeue exit 1 after case 2)", payloads.case9);
    console.log('CASE 16');
    for (const [label, payload] of [
        ["case 2's payload", payloads.case2],
        ['ok payload', payloads.ok],
        ["case 9's first payload", payloads.case9],
        ['slurm_down with no stale (case 10)', payloads.case10]
    ] as const) {
        const client = emptyClient();
        client.entities.receive({ channel: 'hpc', version: 1, payload });
        console.log(`  ${label}: hpcWords=${JSON.stringify(hpcWords(payload))} counts=${JSON.stringify(client.hpc.counts())} pillText=${JSON.stringify(client.hpc.pillText())} badgeText=${JSON.stringify(client.hpc.badgeText())}`);
    }
    console.log('CASE 17');
    const base = payloads.ok;
    for (const [label, stale] of [
        ["stale: { recent: '2026-10-26T10:00:00.000Z' }", { recent: '2026-10-26T10:00:00.000Z' }],
        ['stale: { sinfo: null }', { sinfo: null }],
        ['no stale', undefined],
        ["stale: 'x'", 'x'],
        ['stale: { recent: 5 }', { recent: 5 }]
    ] as const) {
        const payload = stale === undefined ? { ...base } : { ...base, stale };
        const read = payloadShapes.hpc.safeParse(payload);
        console.log(`  ${label}: ${read.success ? (read.data === payload ? 'passes unchanged' : 'passes changed') : 'refused'}`);
    }
    expect(true).toBe(true);
});
```

The head comment's run line (`--dir ... --project unit`) is the command that does not scope the run (next section); the config above is how it was run. What it printed is quoted in the two case sections above.

## Verify list runs and whole-suite commands

- Whole-suite commands, both on the unchanged tree and before any change: `npx vitest run --dir <scratchpad>/o83 --project unit --disableConsoleIntercept` was started twice (once piped to `tail`, once with its output to a scratchpad log). The `unit` project's own `include` (`tests/**/*.test.ts`) applied under the worktree's root, so each started the worktree's whole unit suite; each was stopped by hand before it finished, and neither output was used for anything. That output showed one failing row of a file the step does not change, `tests/checks/tree/duplication.test.ts (18 tests | 1 failed)`, row "is not held anywhere under tests", on the unchanged tree; it was not looked into, and the verify list's `vitest checks` passed on the changed tree. The case program was then given its own config, its scope checked with `vitest list --filesOnly` before it ran.
- The verify list ran twice. The first, `npm run diagrams && npm run test:quick -- --base 4614443b`: prettier, ASCII gate, svelte-kit sync, eslint, svelte-check, vitest checks and vitest `ok`; `FAILED  vitest slow (256.1 s)`, the one failure `tests/server/machine/runs/recover/runs.test.ts > a Recover run on this Mac > finds a real detached fetch again from a server that has just started, and stops it, pushing its bytes and its end`, `Error: Test timed out in 30000ms.` That file is one the step changes, so it was rerun alone (`Test Files  1 passed (1)`, `Tests  16 passed (16)`, that row 528 ms), with no change made, and the list ran once more:

```
test:quick: 21 changed file(s), from git since 4614443b
test:quick: 273 test file(s)
ok      prettier (0.5 s): All matched files use Prettier code style!
ok      ASCII gate (0.6 s)
ok      svelte-kit sync (1.8 s)
ok      svelte-check (10.4 s): 1793011493199 COMPLETED 544 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (39.2 s)
ok      vitest checks (125.8 s): Duration  117.06s (transform 59.53s, setup 0ms, import 214.23s, tests 188.15s, environment 3ms)
ok      vitest (142.4 s): Duration  134.50s (transform 113.30s, setup 0ms, import 227.04s, tests 245.28s, environment 14.10s)
ok      vitest slow (198.7 s): Duration  190.52s (transform 15.47s, setup 0ms, import 148.13s, tests 600.63s, environment 17ms)
test:quick: 200.8 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
```

## The other parts the rules file asks for

Name grep, `grep -rn "failureWords\|queueIsCurrent\|staleWords\|HpcStatus\|partialAnswer\|staleTables" src tests config docs README.md --exclude=local.yml`: every hit is in the files above; `failureWords` has three callers (`status.ts:193`, `Head.svelte:37`, `Hpc.svelte:78`), each passing the payload; `HpcStatus` is read only in `model-sessions.ts:658`; no doc or README names any of them.

Comments and docs describing the behaviour, each read after the change:

- `poll.ts` head comment: rewritten. `HpcWatcher.recover`: rewritten. `HpcWatcher.set`: rewritten (a window change keeps the rows and their times). `answerFailure`: rewritten. `Rows`: rewritten. `Times`, `partialAnswer`, `staleTables`: new. `degraded`: rewritten. `lastOk`: new doc. `prewarmDue`: rewritten. `startPrewarm`: rewritten. `RETRY_MIN`, `refresh`'s gate, `slurmHint`, `rejectionFailure`, `prewarmStep`: still true.
- `model-sessions.ts` `HpcStatus` doc, `lastOk`, `stale`, `queueIsCurrent`: still true, rewritten, new, new.
- `hpc.ts` head comment: still true; `failureWords`: rewritten; `staleWords`: new. `hpc.svelte.ts` head comment: still true. `status.ts` `hpcWords`: rewritten. `payloads.ts` head comment: still true.
- `Head.svelte` head comment: rewritten; `parts()`: rewritten ("overdue"); `late()`: still true. `Hpc.svelte` head comment: rewritten; `failureMessage`: still true. `Recent.svelte`, `Capacity.svelte` head comments: rewritten. `Jobs.svelte` `live` doc ("Whether the cluster is answering"): still true. `Login.svelte` head comment ("while Live HPC's last poll had no answer, the section shows Live HPC's reason"): still true, the reason now empty while the queue answered.
- `runs/recover/live/watch.ts` head comment ("it reads what each Live HPC poll answered of Recover's section"): still true. `root/context.ts:462-469`: still true. The test file's head comment: still true.
- `docs/apps.md:421`: rewritten. `docs/HELP.md:320`: a sentence added.

History-word grep of the added lines, `git diff -U0 | grep '^+' | grep -v '^+++' | grep -i -E "\b(before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package|O[0-9]{2}\b|Z[0-9]{3,4}|ruling)"`, after the last change gives three hits: `docs/HELP.md:320` ("before it runs", the Submit sentence of the bullet, not added text); `model-sessions.ts` "is still older than the queue" (the table remains older than the queue now, the words the brief gives for the doc); `poll.ts` "A prewarm still running" (the existing `startPrewarm` sentence, rewrapped). None names an earlier state of the code. Verify 7's grep prints nothing.

Reuse grep for the new helpers, over the unchanged base copy: `grep -rn "queueIsCurrent\|staleWords\|partialAnswer\|staleTables\|NO_TIMES" ../O83-base/src ../O83-base/tests` prints nothing (exit 1), so none existed under another file; `clock` (`state/shared/words/format.ts:95`) and `failureMessage` (`Hpc.svelte`) are reused, and `sessions.meta_sep` joins as `branch-state.ts:19` does.

Keys introduced: the payload key `stale` with `recent` and `sinfo`; none is empty or duplicated, and `HpcPayload` had no key of those names. The catalog keys `hpc.slurm_partial_msg`, `hpc.stale_from`, `hpc.stale_never`: each once, at `hpc.yml:91-93`, each read in `hpc.ts:54,70`; `grep -rn "^\s*stale" config/text --exclude=local.yml` finds the two new ones and three keys of other groups with other names (`stale_behind`, `stale_tip` in `project.yml`, `stale_glyph` in `projects.yml`).

Asynchronous paths (case 11 runs each):

- A poll in flight when `close()` is called: the answer lands after `stopped()` and is dropped; nothing is published, `take` is not called, `times` and `lastOk` are not touched (`answer after close(): publishes after it=0 take=[]`).
- A poll in flight when the host changes: `began !== asking` drops it; the queued poll runs on the new host (`statuses published after it=["unreachable@cluster2"] take=[]`).
- A poll superseded by a window change: dropped the same way; the rows and their times stay, and the next poll's `stale` names the kept table with its first time (case 12).
- `recover()` in flight: its own `stopped() || began !== asking` check after the await is unchanged.
- The quota read and a `pollMin` change republish the payload last published (`poll.ts:588`, `{ ...held, pollMin }`), so `stale`, `lastOk` and `updated` carry over (case 2's quota line).

# Repair round 1

Everything in the round is done. Line numbers in the sections above are those of the first build; after this round `poll.ts` is 7 lines longer above `:588` (now `:595`), and `runs.test.ts`'s row is at `:480-556`.

Two things for the orchestrator. The verify list ran twice in this round: the first run was red in `vitest checks` on this round's own key (fixed, below) and in `vitest slow` on two time-outs in `tests/data/hubs/hub-portfolio.test.ts`, a file the step does not change. And two places outside the round's widened list changed: `status.ts:200-208` (a blank line and the new `hpcTip` at `:201-208`, right after `hpcWords`, far from O80's 394-430) and `config/text/statusbar.yml:72` (the new key beside `:71`), which item 7 needs.

## Items

| Item | State | Proof (command, output after the last change) |
|---|---|---|
| 1. Commands and files outside the brief | DONE | section "Commands and files outside the brief" below, from the transcript's commands and `ls -la` of the scratchpad |
| 2. G115's row for a `slurm_down` whose `squeue` exited 1 | DONE | base copy: the new row passes and the run stops at the partial row, `:548`; after: `Tests  16 passed (16)` (both quoted below) |
| 3. The poll's doc comments | DONE | `poll.ts:255-260` (`Rows`), `:295-298` (`lastOk`), `:301-306` (`prewarmDue`), `:326-332` (`degraded`); `awk 'length > 100'` over `poll.ts` prints only `:129` (188), a code line that is 188 wide on the base too (`O83-base/.../poll.ts:122: 188`) |
| 4. `docs/apps.md:421` and `null` | DONE | `git diff -U0 -- docs/apps.md`: one hunk, `@@ -421 +421 @@`, ending "...with the time its rows came from, or `null` when none of its polls has answered since the server started)" |
| 5. `docs/HELP.md:320` completed | DONE | one hunk `@@ -320 +320 @@`; the sentence now ends "...or "stale, not read since the server started"; the mark stays on that table through later failed polls while the table is older than the queue." |
| 6 (a). No empty queue or empty table while the queue is not this poll's | DONE | case program, item 6 (a), before and after below |
| 6 (b). A table at 0 rows under its mark draws no body | DONE | case program, item 6 (b), before and after below |
| 7. One full stop per sentence in the tooltip | DONE | case program, item 7, before and after below; `npx vitest run tests/checks/source/keys.test.ts`: `Tests  11 passed (11)` |

What changed, by item:

- Item 2: `tests/server/machine/runs/recover/runs.test.ts` gains the answer `squeueFailed` (`SEC_CONNECTED`, `SEC_RC` 1, `sacct` exit 1, no `sinfo` code) and a table of the answers Recover is not read after: `[squeueFailed, 'slurm_down']` and `[unreachable, 'unreachable']`, each asserting the status, `sent` equal to `[]` and `take` equal to `[]`. The `unreachable` row's three assertions moved into that table unchanged. The table stands before the `ok` and partial table, so on the base copy, where the partial row fails, the new row runs first. The test's title is unchanged, so G115's entry still names it.
- Item 3: the four doc comments say "the last good or partial poll (`partialAnswer`)", that a poll in which `squeue` answered but whose ssh exit says the cluster was not reached keeps the old queue (`Rows`) and gets the time of the publish (`degraded`), and that `prewarmDue` is set "while `prewarm` is on". Each paragraph is rewrapped whole.
- Item 6 (a): `Hpc.svelte` draws Capacity, Quota, Jobs and Recent each on its own gate: while the queue is this poll's always, and otherwise only when that section has kept rows (`data.sinfo.length`, `data.quota.length`, `data.jobs.length`, `data.recent.length`). The gate on the `stale` names is gone, so a failure with no kept queue draws no "No jobs in the queue for you right now." and no empty Recent. Capacity is gated the same way as Recent (a judgment call: the item names Recent, and Capacity at 0 rows under a failure is the same empty table). Jobs and Quota draw what they drew. `Jobs.svelte` needs no change.
- Item 6 (b): `Recent.svelte` draws its table only when it has rows; `Capacity.svelte` draws its meters grid and its sinfo fold only when it has rows. Both keep the heading and the mark at 0 rows. Head comments of the three views say so.
- Item 7: `status.ts` exports `hpcTip(long)`. It returns `statusbar.hpc_tip` ("{0}. Open Live HPC.") for words that end in no sentence mark (the queue summary, a hub's reason for naming no cluster), and the new `statusbar.hpc_tip_ended` ("{0} Open Live HPC.") for words that end in `.`, `?` or `!` (a failure's sentence, the partial sentence, "polling cluster..."). `StatusBar.svelte:292` uses it. Each key is read by a literal `t(...)`, as `tests/checks/source/keys.test.ts` asks.

## The test row, on the base copy and after

On the base copy's source: the worktree's test file run with a config that reads every `src/lib/...` import of the test from `.agents/worktrees/O83-base/src/lib/` (`base.config.mts`, quoted below). Command, from the worktree's root: `npx vitest run --config <scratchpad>/o83/base.config.mts tests/server/machine/runs/recover/runs.test.ts -t "runs Recover's section alone"`. Output, with the `hpc publish` lines, the `stdout |` headers, the empty lines, vitest's box-drawing separators, the caret line under `:548`, the two source lines after it and the start and duration lines left out:

```
 RUN  v4.1.11 /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O83
 <HEAVY RIGHT-POINTING ANGLE QUOTATION MARK ORNAMENT> |base| tests/server/machine/runs/recover/runs.test.ts (16 tests | 1 failed | 15 skipped) 9ms
     <MULTIPLICATION SIGN> runs Recover's section alone with the queue while Live HPC's last poll was answered, and nothing otherwise 8ms
 FAIL  |base| tests/server/machine/runs/recover/runs.test.ts > a Recover run on the cluster > runs Recover's section alone with the queue while Live HPC's last poll was answered, and nothing otherwise
AssertionError: expected [] to have a length of 1 but got +0
- Expected
+ Received
- 1
+ 0
 <HEAVY RIGHT-POINTING ANGLE QUOTATION MARK ORNAMENT> tests/server/machine/runs/recover/runs.test.ts:548:31
    546|             const read = await ask(answer);
    547|             expect(read.status).toBe(status);
    548|             expect(read.sent).toHaveLength(1);
 Test Files  1 failed (1)
      Tests  1 failed | 15 skipped (16)
```

The new table (`:532-540`) runs first and every assertion of it holds on the base, where `recover()` returns on any status other than `ok`. The run stops at `:548`, the partial row, which is the base's known failure of item 7. A gate `held.status !== 'ok' && held.status !== 'slurm_down'` would send on `squeueFailed` and fail at `:538`, `expect(read.sent).toEqual([])`. This is a judgment from reading; no such gate was written.

After the change, `npx vitest run tests/server/machine/runs/recover/runs.test.ts`:

```
 Test Files  1 passed (1)
      Tests  16 passed (16)
```

## The case-run program, before and after

Three files in `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o83/`, with `node_modules` there a symbolic link to the worktree's `node_modules` (made with `ln -s`). The link lets the program's bare imports resolve. They are deleted before this report is handed back. Command, from the worktree's root: `npx vitest run --config <that folder>/cases.config.mts cases.test.ts --disableConsoleIntercept --testTimeout 60000`, its output piped through `grep -v "^hpc publish"` and written to no file.

`cases.config.mts`:

```ts
// O83 round 1 case-run program's config: the worktree's own config with one project that holds
// only the case file of this folder.
import base from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O83/vite.config.ts';

const DIR = '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o83';

export default (env: { mode: string; command: 'build' | 'serve' }) => {
    const config = base(env as never) as Record<string, any>;
    const { projects: _projects, ...test } = config.test;
    return {
        ...config,
        root: '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O83',
        test: { ...test, name: 'cases', environment: 'node', dir: DIR, include: ['tests/cases.test.ts'] }
    };
};
```

`base.config.mts`:

```ts
// O83 round 1: runs the worktree's tests/server/machine/runs/recover/runs.test.ts against the
// source of the base copy (.agents/worktrees/O83-base): every import of the test that names
// `src/lib/...` by a relative path is read from the base copy's src/lib instead.
import base from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O83/vite.config.ts';

const BASE_LIB = '/Users/axelfaes/workspace/oculus/.agents/worktrees/O83-base/src/lib/';

export default (env: { mode: string; command: 'build' | 'serve' }) => {
    const config = base(env as never) as Record<string, any>;
    const { projects: _projects, ...test } = config.test;
    return {
        ...config,
        root: '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O83',
        resolve: {
            ...(config.resolve ?? {}),
            alias: [{ find: /^(\.\.\/)+src\/lib\//, replacement: BASE_LIB }]
        },
        test: {
            ...test,
            name: 'base',
            environment: 'node',
            include: ['tests/server/machine/runs/recover/runs.test.ts']
        }
    };
};
```

`tests/cases.test.ts`:

```ts
// O83 round 1 case-run program. It prints, for items 6 and 7 of the round, the Live HPC page's
// sections drawn from each payload and the status bar's HPC tooltip, and asserts nothing about
// them. Run from the worktree's root:
//   npx vitest run --config <this folder>/cases.config.mts cases.test.ts --disableConsoleIntercept
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import { parse } from 'yaml';
import { Hub } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O83/src/lib/server/core/channels.ts';
import * as P from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O83/src/lib/server/machine/hpc/parse.ts';
import { watchHpc, type HpcSettings } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O83/src/lib/server/machine/hpc/poll.ts';
import type { RunResult } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O83/src/lib/server/machine/hpc/ssh.ts';
import type { HpcPayload } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O83/src/lib/data/model/index.ts';
import { setCatalog, t } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O83/src/lib/state/shared/words/text.ts';
import { flattenText } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O83/src/lib/data/sources/config/merge/text.ts';
import * as status from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O83/src/lib/state/workbench/navigation/status.ts';
import { emptyClient, clientContext } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O83/tests/fixtures/client.ts';
import Hpc from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O83/src/lib/views/system/machine/hpc/Hpc.svelte';

const WT = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O83';

// The text catalog, read from config/text alone (no other config file is read).
function textFiles(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
        const path = join(dir, name);
        return statSync(path).isDirectory() ? textFiles(path) : name.endsWith('.yml') ? [path] : [];
    });
}
const catalog: Record<string, string> = {};
for (const file of textFiles(join(WT, 'config/text'))) {
    Object.assign(catalog, flattenText((parse(readFileSync(file, 'utf8')) as { text: unknown }).text));
}
setCatalog(catalog);

const T1 = '2026-10-26T10:00:00.000Z';
const T2 = '2026-10-26T10:01:00.000Z';
const DB = 'sacct: error: Problem talking to the database: Connection refused';
const JOB = (id: number, state: string): string =>
    `${id}|job${id}|main|${state}|0:10|1:00:00|1|1|N/A|4G|100|N/A|node1`;
const REC = (id: number): string =>
    `${id}|run${id}|COMPLETED|0:0|00:01:00|2026-10-26T09:${String(id % 60).padStart(2, '0')}:00|4G||00:00:30|1|1|60`;
const PART = (name: string, state: string, nodes: number): string => `${name}|up|${nodes}|${state}|gpu:1`;

type Cmd = { code?: number; rows?: string[]; err?: string };
function answer(o: { squeue?: Cmd; sacct?: Cmd; sinfo?: Cmd }): RunResult {
    const sq = { code: 0, rows: [], err: '', ...o.squeue };
    const sa = { code: 0, rows: [], err: '', ...o.sacct };
    const si = { code: 0, rows: [], err: '', ...o.sinfo };
    const lines = [
        P.SEC_CONNECTED,
        ...sq.rows,
        `${P.SEC_RC}${sq.code}`,
        P.SEC_SQUEUE_ERR,
        ...(sq.err ? [sq.err] : []),
        P.SEC_SACCT,
        ...sa.rows,
        `${P.SEC_SACCT_RC}${sa.code}`,
        P.SEC_SACCT_ERR,
        ...(sa.err ? [sa.err] : []),
        P.SEC_SINFO,
        ...si.rows,
        `${P.SEC_SINFO_RC}${si.code}`,
        P.SEC_SINFO_ERR,
        ...(si.err ? [si.err] : []),
        P.SEC_RECOVER,
        'section'
    ];
    return { stdout: `${lines.join('\n')}\n`, stderr: '', code: 0 };
}

const Q_B = [JOB(201, 'RUNNING'), JOB(202, 'RUNNING'), JOB(203, 'PENDING')];
const GOOD = answer({ squeue: { rows: Q_B }, sacct: { rows: [REC(501), REC(502)] }, sinfo: { rows: [PART('pa', 'idle', 4)] } });
const SACCT_FAIL = answer({ squeue: { rows: Q_B }, sacct: { code: 1, err: DB }, sinfo: { rows: [PART('pb', 'mix', 8)] } });
const NO_JOBS_SACCT_FAIL = answer({ squeue: { rows: [] }, sacct: { code: 1, err: DB }, sinfo: { rows: [PART('pb', 'mix', 8)] } });
const SINFO_LATE = answer({ squeue: { rows: Q_B }, sacct: { rows: [REC(601)] }, sinfo: { code: 124 } });
const SQUEUE_FAIL = answer({
    squeue: { code: 1, err: 'slurm_load_jobs error: Unable to contact slurm controller' },
    sacct: { code: 1, err: DB },
    sinfo: { code: 1, err: 'slurm_load_partitions: Unable to contact slurm controller' }
});
const UNREACH: RunResult = { stdout: '', stderr: 'ssh: connect to host cluster port 22: No route to host', code: 255 };
const ERROR: RunResult = { stdout: '', stderr: 'bash: squeue: command not found', code: 127 };

const WORDS = { sshExited: 'ssh exited {0}', slurmLate: 'no answer within the time limit', overrun: 'overrun' };
const SETTINGS: HpcSettings = { host: 'cluster', days: 1, pollMin: 20, quotaMin: 60, prewarm: false, words: WORDS };

/** The payloads the watcher publishes for these answers, one poll at T1 and the next at T2. */
async function payloadAfter(answers: (RunResult | 'defer')[], settings: HpcSettings = SETTINGS): Promise<HpcPayload> {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    vi.setSystemTime(new Date(T1));
    const hub = new Hub();
    const runner = (_host: string, command: string): Promise<RunResult> => {
        if (command.includes(P.SEC_SACCT)) {
            const next = answers.shift() ?? UNREACH;
            return next === 'defer' ? new Promise(() => undefined) : Promise.resolve(next);
        }
        return Promise.resolve({ stdout: '', stderr: '', code: 1 });
    };
    const watcher = watchHpc(hub, { ...settings, logPaths: new Map(), runner });
    for (let i = 0; i < 5; i += 1) await new Promise((resolve) => setImmediate(resolve));
    if (answers.length > 0) {
        vi.setSystemTime(new Date(T2));
        await watcher.refresh();
        for (let i = 0; i < 5; i += 1) await new Promise((resolve) => setImmediate(resolve));
    }
    const payload = structuredClone(hub.latest('hpc')?.payload as HpcPayload);
    watcher.close();
    vi.useRealTimers();
    return payload;
}

function strip(html: string): string {
    return html.replace(/<!--[^]*?-->/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function page(label: string, p: HpcPayload): void {
    const client = emptyClient();
    client.entities.receive({ channel: 'hpc', version: 1, payload: p });
    const html = render(Hpc, {
        props: { instance: { id: 'hpc-1', view: 'hpc', state: null } },
        context: clientContext(client)
    }).body;
    // Recent's fold holds no other fold; Capacity's ends at the second closing tag after its start
    // when the sinfo fold opens inside it, and at the first otherwise.
    const recentAt = html.indexOf('Recent (finished)');
    const recent =
        recentAt < 0
            ? ''
            : html.slice(html.lastIndexOf('<details', recentAt), html.indexOf('</details>', recentAt));
    const capacityAt = html.indexOf('class="capacity');
    const firstClose = html.indexOf('</details>', capacityAt);
    const inner = html.indexOf('class="sinfo', capacityAt);
    const capacity =
        capacityAt < 0
            ? ''
            : html.slice(
                  html.lastIndexOf('<details', capacityAt),
                  inner >= 0 && inner < firstClose
                      ? html.indexOf('</details>', firstClose + 1)
                      : firstClose
              );
    const stale = JSON.stringify(p.stale ?? null);
    console.log(`  ${label}: status=${p.status} jobs=${p.jobs.length} recent=${p.recent.length} sinfo=${p.sinfo.length} stale=${stale} lastOk==updated=${p.lastOk === p.updated}`);
    console.log(`    headings: ${JSON.stringify([...html.matchAll(/<summary[^>]*>([^]*?)<\/summary>/g)].map((m) => strip(m[1])))}`);
    console.log(`    empty-queue sentence: ${html.includes(t('hpc.no_jobs'))}`);
    console.log(`    Recent section: ${recent !== ''}, tables in it: ${(recent.match(/<table/g) ?? []).length}`);
    console.log(`    Capacity section: ${capacity !== ''}, meters grid: ${capacity.includes('class="meters')}, sinfo fold: ${capacity.includes('class="sinfo')}, tables in it: ${(capacity.match(/<table/g) ?? []).length}`);
}

/** The status bar's HPC tooltip as StatusBar.svelte builds it on this tree. */
function tooltip(p: HpcPayload | null): string {
    const words = status.hpcWords(p);
    const built = (status as Record<string, unknown>).hpcTip as ((long: string) => string) | undefined;
    return built === undefined ? t('statusbar.hpc_tip', words.long) : built(words.long);
}

it('round 1, items 6 and 7', async () => {
    console.log('ITEM 6 (a): the first poll answers squeue with no jobs and sacct exit 1, then ssh drops');
    page('t2 unreachable', await payloadAfter([NO_JOBS_SACCT_FAIL, UNREACH]));
    console.log('ITEM 6 (a): the same with jobs kept, then ssh drops');
    page('t2 unreachable', await payloadAfter([SACCT_FAIL, UNREACH]));
    console.log('ITEM 6 (b): the queue current, a table at 0 rows under its mark');
    page("case 5's payload", await payloadAfter([SACCT_FAIL]));
    page('stale sinfo null, sinfo []', await payloadAfter([SINFO_LATE]));
    console.log('ITEM 7: the status bar tooltip');
    const states: [string, HpcPayload | null][] = [
        ['ok', await payloadAfter([GOOD])],
        ['partial (case 2)', await payloadAfter([GOOD, SACCT_FAIL])],
        ['slurm_down', await payloadAfter([SQUEUE_FAIL])],
        ['unreachable', await payloadAfter([UNREACH])],
        ['error', await payloadAfter([ERROR])],
        ['starting', await payloadAfter(['defer'])],
        [
            'unconfigured',
            await payloadAfter([], { ...SETTINGS, host: '', missing: t('hpc.host_no_cluster'), unconfigured: true })
        ],
        ['no payload yet', null]
    ];
    for (const [label, p] of states) console.log(`  ${label} (${p?.status ?? 'null'}): ${JSON.stringify(tooltip(p))}`);
    expect(true).toBe(true);
});
```

The tooltip function picks the new `hpcTip` when `status.ts` has it, which is what `StatusBar.svelte` calls on each tree. "Before" is the tree as the first build left it. The same program ran once with an earlier way of finding the Recent and Capacity folds, whose Recent search found none; that output is not used. Before:

```
ITEM 6 (a): the first poll answers squeue with no jobs and sacct exit 1, then ssh drops
  t2 unreachable: status=unreachable jobs=0 recent=0 sinfo=1 stale={"recent":null} lastOk==updated=false
    headings: ["Cluster capacity (1 partition)","sinfo table (1 row)","Recent (finished) - 0 stale, not read since the server started","Login node"]
    empty-queue sentence: true
    Recent section: true, tables in it: 1
    Capacity section: true, meters grid: true, sinfo fold: true, tables in it: 1
ITEM 6 (a): the same with jobs kept, then ssh drops
  t2 unreachable: status=unreachable jobs=3 recent=0 sinfo=1 stale={"recent":null} lastOk==updated=false
    headings: ["Cluster capacity (1 partition)","sinfo table (1 row)","Recent (finished) - 0 stale, not read since the server started","Login node"]
    empty-queue sentence: false
    Recent section: true, tables in it: 1
    Capacity section: true, meters grid: true, sinfo fold: true, tables in it: 1
ITEM 6 (b): the queue current, a table at 0 rows under its mark
  case 5's payload: status=slurm_down jobs=3 recent=0 sinfo=1 stale={"recent":null} lastOk==updated=true
    headings: ["Cluster capacity (1 partition)","sinfo table (1 row)","Recent (finished) - 0 stale, not read since the server started","Login node"]
    empty-queue sentence: false
    Recent section: true, tables in it: 1
    Capacity section: true, meters grid: true, sinfo fold: true, tables in it: 1
  stale sinfo null, sinfo []: status=slurm_down jobs=3 recent=1 sinfo=0 stale={"sinfo":null} lastOk==updated=true
    headings: ["Cluster capacity (0 partitions) stale, not read since the server started","sinfo table (0 rows)","Recent (finished) - 1","Login node"]
    empty-queue sentence: false
    Recent section: true, tables in it: 1
    Capacity section: true, meters grid: true, sinfo fold: true, tables in it: 1
ITEM 7: the status bar tooltip
  ok (ok): "2 running | 1 pending | 3 total. Open Live HPC."
  partial (case 2) (slurm_down): "2 running | 1 pending | 3 total | The cluster answered for the queue, and Slurm did not answer for the tables marked stale.. Open Live HPC."
  slurm_down (slurm_down): "The cluster was reached over ssh, and Slurm did not answer.. Open Live HPC."
  unreachable (unreachable): "The cluster did not answer over ssh. Is this Mac on the UT network or on EduVPN?. Open Live HPC."
  error (error): "The poll of the cluster failed.. Open Live HPC."
  starting (starting): "polling cluster.... Open Live HPC."
  unconfigured (unconfigured): "the settings of this hub name no cluster (slurm.resource in .oculus/config.yml). Open Live HPC."
  no payload yet (null): "polling cluster.... Open Live HPC."

 Test Files  1 passed (1)
      Tests  1 passed (1)
```

After (the run after the last change):

```
ITEM 6 (a): the first poll answers squeue with no jobs and sacct exit 1, then ssh drops
  t2 unreachable: status=unreachable jobs=0 recent=0 sinfo=1 stale={"recent":null} lastOk==updated=false
    headings: ["Cluster capacity (1 partition)","sinfo table (1 row)","Login node"]
    empty-queue sentence: false
    Recent section: false, tables in it: 0
    Capacity section: true, meters grid: true, sinfo fold: true, tables in it: 1
ITEM 6 (a): the same with jobs kept, then ssh drops
  t2 unreachable: status=unreachable jobs=3 recent=0 sinfo=1 stale={"recent":null} lastOk==updated=false
    headings: ["Cluster capacity (1 partition)","sinfo table (1 row)","Login node"]
    empty-queue sentence: false
    Recent section: false, tables in it: 0
    Capacity section: true, meters grid: true, sinfo fold: true, tables in it: 1
ITEM 6 (b): the queue current, a table at 0 rows under its mark
  case 5's payload: status=slurm_down jobs=3 recent=0 sinfo=1 stale={"recent":null} lastOk==updated=true
    headings: ["Cluster capacity (1 partition)","sinfo table (1 row)","Recent (finished) - 0 stale, not read since the server started","Login node"]
    empty-queue sentence: false
    Recent section: true, tables in it: 0
    Capacity section: true, meters grid: true, sinfo fold: true, tables in it: 1
  stale sinfo null, sinfo []: status=slurm_down jobs=3 recent=1 sinfo=0 stale={"sinfo":null} lastOk==updated=true
    headings: ["Cluster capacity (0 partitions) stale, not read since the server started","Recent (finished) - 1","Login node"]
    empty-queue sentence: false
    Recent section: true, tables in it: 1
    Capacity section: true, meters grid: false, sinfo fold: false, tables in it: 0
ITEM 7: the status bar tooltip
  ok (ok): "2 running | 1 pending | 3 total. Open Live HPC."
  partial (case 2) (slurm_down): "2 running | 1 pending | 3 total | The cluster answered for the queue, and Slurm did not answer for the tables marked stale. Open Live HPC."
  slurm_down (slurm_down): "The cluster was reached over ssh, and Slurm did not answer. Open Live HPC."
  unreachable (unreachable): "The cluster did not answer over ssh. Is this Mac on the UT network or on EduVPN? Open Live HPC."
  error (error): "The poll of the cluster failed. Open Live HPC."
  starting (starting): "polling cluster... Open Live HPC."
  unconfigured (unconfigured): "the settings of this hub name no cluster (slurm.resource in .oculus/config.yml). Open Live HPC."
  no payload yet (null): "polling cluster... Open Live HPC."

 Test Files  1 passed (1)
      Tests  1 passed (1)
```

Reading of the two runs:
- Item 6 (a):
  - The reviewer's scenario lost the empty-queue sentence and the Recent heading at 0 under the `unreachable` box.
  - With a kept queue and no Recent rows, Jobs stays and Recent goes.
  - Capacity, which has a kept row, stays.
- Item 6 (b):
  - Recent at 0 rows under its mark keeps its heading and mark, and its table count goes from 1 to 0.
  - Capacity at 0 rows under its mark keeps its heading and mark; the meters grid, the "sinfo table (0 rows)" fold and the table go.
- Item 7: every state reads one sentence mark before "Open Live HPC.", and no word of a sentence changed.

## Commands and files outside the brief (item 1)

Times are local (UTC+1), from the first build's transcript timestamps and `ls -la` of the scratchpad.

- The first build's case-run program, deleted from the scratchpad after its source was quoted in the report:
  - `scratchpad/o83/cases.config.mts`, the vitest config that limits the run to the one case file;
  - `scratchpad/o83/tests/cases.test.ts`, the case program;
  - `scratchpad/o83/node_modules`, a symbolic link to the worktree's `node_modules`, which resolves the program's bare imports.
- The two whole-suite runs, both on the unchanged tree, before any change, each stopped by hand. Their output was not used.
  - About 11:17: `npx vitest run --dir <scratchpad>/o83 --project unit --disableConsoleIntercept 2>&1 | tail -150`. It ran the worktree's whole `unit` project, whose `include` applies under the worktree's root.
  - About 11:22: the same command with `--testTimeout 60000`, its output written to `o83-run1.log` (file time 11:27).
- Files written by shell redirect, all in the scratchpad:
  - `o83-run1.log` (11:27): the second whole-suite run.
  - `o83-first-run.log` (11:29): the cases' first run, `npx vitest run --config <scratchpad>/o83/cases.config.mts --disableConsoleIntercept --testTimeout 60000`.
  - `o83-after-run.log` (11:37): the cases after the change, the same command.
  - `o83-unused-after.txt` (11:37): `sh utils/unused-exports.sh`, compared with the base's list.
  - `o83-verify.log` (11:43): the first verify list, `npm run diagrams` then `npm run test:quick -- --base 4614443b`.
  - `o83-verify2.log` (11:48): the second verify list, the same commands.
  - `o83-final-run.log` (11:48): the cases after the last change.
  - `o83-unused-final.txt` (11:48): `sh utils/unused-exports.sh` after the last change.
- This round:
  - It writes no file by redirect. Every command's output reached the transcript through a pipe.
  - It made `scratchpad/o83/` with `mkdir -p`, the `node_modules` link with `ln -s`, and the three program files with the Write and Edit tools; all are deleted before the report is handed back.
  - It ran no whole-suite command. Each `npx vitest run` named one file, or `cases.test.ts` under a config whose `include` names that one file.
- Other scratchpad files: `o83-brief-v1.md` (11:03) is named in the orchestrator's prompt as its own draft. `o83-diff.txt` (12:09) is dated after the first report and is not in the first build's commands. Neither is the builder's.

## Files this round changes, with line counts (`wc -l`)

| File | Lines | In the round's list |
|---|---|---|
| `src/lib/server/machine/hpc/poll.ts` | 639 | yes (item 3) |
| `src/lib/state/workbench/navigation/status.ts` | 615 | `:200-208`, after the brief's 179-198, for item 7 |
| `src/lib/shell/status/StatusBar.svelte` | 452 | yes (item 7), `:67` and `:292` |
| `config/text/statusbar.yml` | 247 | `:72` added beside `:71` (item 7) |
| `src/lib/views/system/machine/hpc/Hpc.svelte` | 162 | yes |
| `src/lib/views/system/machine/hpc/Recent.svelte` | 160 | yes |
| `src/lib/views/system/machine/hpc/Capacity.svelte` | 181 | yes |
| `tests/server/machine/runs/recover/runs.test.ts` | 557 | yes |
| `docs/apps.md` | 847 | yes, `:421` |
| `docs/HELP.md` | 570 | yes, `:320` |
| `src/lib/views/system/machine/hpc/Jobs.svelte` | 155 | widened for the round, unchanged |

## Verify list runs and other checks

The verify list ran twice in this round. No whole-suite command was run.

First run, `(npm run diagrams && npm run test:quick -- --base 4614443b) 2>&1 | grep -E '^(ok|FAILED)|test:quick|Tests |Test Files| FAIL |Error:'`:

```
ok      prettier (0.6 s): All matched files use Prettier code style!
ok      ASCII gate (0.7 s)
ok      svelte-kit sync (2.4 s)
ok      svelte-check (148.8 s): 1793014919497 COMPLETED 544 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (152.1 s)
FAILED  vitest checks (189.7 s)
<BOX DRAWINGS rule> Failed Tests 2 <BOX DRAWINGS rule>
 FAIL  |unit| tests/checks/source/keys.test.ts > text keys > uses literals except at the documented computed prefixes
AssertionError: expected [ Array(1) ] to deeply equal []
 FAIL  |unit| tests/checks/source/keys.test.ts > text keys > has a reader for every catalog key
AssertionError: expected [ 'statusbar.hpc_tip', <HORIZONTAL ELLIPSIS>(1) ] to deeply equal []
 Test Files  1 failed | 8 passed (9)
      Tests  2 failed | 195 passed | 9 skipped (206)
ok      vitest (247.5 s): Duration  237.44s (transform 196.09s, setup 0ms, import 491.34s, tests 340.04s, environment 53.10s)
FAILED  vitest slow (285.2 s)
<BOX DRAWINGS rule> Failed Tests 2 <BOX DRAWINGS rule>
 FAIL  |unit| tests/data/hubs/hub-portfolio.test.ts > the portfolio of several hubs > resolves a value its hub cannot resolve in the primary hub that holds it, the field keeping the key its file holds (G32)
Error: Test timed out in 20000ms.
 FAIL  |unit| tests/data/hubs/hub-portfolio.test.ts > the portfolio of several hubs > keeps a primary-hub id that begins with the name of a hub folder and a colon as a record of the primary, with no finding
Error: Test timed out in 20000ms.
 Test Files  1 failed | 74 passed (75)
      Tests  2 failed | 680 passed | 215 skipped (897)
test:quick: 287.9 s; failed: vitest checks, vitest slow
test:quick: not covered: tests that reach no changed file within the import depth,
```

The `<BOX DRAWINGS rule>` lines stand for vitest's separator of box-drawing characters. The first three lines the grep printed, `> oculus@0.1.0 test:quick`, `test:quick: 25 changed file(s), from git since 4614443b` and `test:quick: 273 test file(s)`, are the same in both runs.

- The keys check is this round's defect: `hpcTip` chose its key by a ternary inside one `t(...)`, and the check reads only literal keys. It now calls `t('statusbar.hpc_tip_ended', long)` and `t('statusbar.hpc_tip', long)` in the two branches. `npx vitest run tests/checks/source/keys.test.ts` then gives `Tests  11 passed (11)`.
- `tests/data/hubs/hub-portfolio.test.ts` is a file the step does not change. Run alone (`npx vitest run tests/data/hubs/hub-portfolio.test.ts`), it gives `Tests  16 passed (16)`.

Second run, after the last change, same command:

```
test:quick: 25 changed file(s), from git since 4614443b
test:quick: 273 test file(s)
ok      prettier (1.2 s): All matched files use Prettier code style!
ok      ASCII gate (1.3 s)
ok      svelte-kit sync (2.9 s)
ok      eslint (16.7 s)
ok      svelte-check (17.7 s): 1793015199990 COMPLETED 544 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (180.7 s): Duration  167.55s (transform 77.56s, setup 0ms, import 300.20s, tests 316.51s, environment 3ms)
ok      vitest (208.2 s): Duration  197.73s (transform 140.41s, setup 0ms, import 319.92s, tests 404.41s, environment 14.18s)
ok      vitest slow (275.3 s): Duration  264.84s (transform 20.44s, setup 0ms, import 260.71s, tests 782.34s, environment 17ms)
test:quick: 278.4 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
```

The brief's checks 4 to 8 after the last change:
- Check 4: `diff ../O83-base/unused-exports.txt <(sh utils/unused-exports.sh 2>&1)` gives "diff exit 0", with `Unused exports (230)`.
- Check 5: the five hits are the same as before, with `Hpc.svelte:110` now at `:112`. Each reads `ok` for the reason given above.
- Check 6: `grep -n 'stale' Head.svelte` gives exit 1.
- Check 7: the history-id grep gives exit 1.
- Check 8: `LC_ALL=C grep -n '[^ -~]'` over every changed file and this report gives exit 1.

Other greps:
- The history-word grep of the added lines gives the same three hits as before, none of them added by this round.
- Reuse grep: `grep -rn "hpcTip\|hpc_tip_ended" O83-base/src O83-base/tests O83-base/config --exclude=local.yml` gives exit 1.
- After the change, `hpcTip` is read at `StatusBar.svelte:67,292`, and `hpc_tip_ended` at `status.ts:207`.

Async paths: this round changes none. The poll edits are comments, and the views read the payload they are given.
