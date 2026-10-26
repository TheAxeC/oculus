# Brief check of O83 (`.scratch/migration/agents/briefs/O83.md`) on main at 95a85d5c

Head checked: `git log --oneline -3` prints `95a85d5c Book ruling 430 and step O83, and close open item 431 under self-rule` first. Nothing was changed anywhere.

Plan's Goal: `grep -n -i '^#* *goal\|^\*\*goal\|^goal' plan.md orchestrator-state.md` finds no Goal section in `plan.md`. The ledger's head paragraph (`plan.md:3`) names `tools/oculus/DESIGN.md` as what the ledger executes. I read O83's line (`plan.md:829`), the Rulings bullets 428, Z1026, 430 and 431 (`plan.md:2802-2805`), `choices.md:5258` Z1027, `agents/spec.md` whole and `agents/guarded.md` G115 (`:359-361`).

Standing demand "A brief check never widens a step" (`orchestrator-state.md`): each finding below is marked **[in scope]** when its fix stays inside the step's line, rulings and write list, and **[open item]** when it would change a ruling or add something visible beyond them.

## Names

Commands: `git grep -n -F <name> -- src tests docs utils 'config/*' ':!config/local.yml'` for each name, `git grep -n -w 'stale' -- <hpc files> docs tests/...`, and `git grep -n "HpcPayload\|entities.hpc()\|latest('hpc')" -- src tests docs utils`.

Hits outside "Paths this step writes":

- `src/lib/views/boards/focus/CommandCenterView.svelte:23,131,132,206` reads `pillText`. No code change is needed there, but the change becomes visible there: during a partial poll the Focus command center shows the HPC pill ("2 HPC jobs running | 1 pending"); on the base it shows none. Case 12 and the look list do not name the Focus board. **[in scope]**: add it to the look list.
- `src/lib/state/workbench/rail-badges/rail-badges.svelte.ts:326` (`queueCells`, which feeds `queueBadgeTitle` and `queuePart`) reads `hpc.counts()`. `src/lib/views/system/machine/hpc/Hpc.svelte:13` reads `badgeText` for the rail badge. Both become visible during a partial poll: the badge and its cells show counts. Neither is named for the look. **[in scope]**. O80 also writes `rail-badges.svelte.ts` (O80's brief, "Paths this step writes"); O83 does not need to change it.
- `src/lib/state/workbench/navigation/registry.ts:33` is `Pick<HpcStore,'badgeText'>`. Unchanged and still true.
- `src/lib/data/model/model-sessions.ts:614-620` is the doc of `HpcStatus`: "`slurm_down` (ssh connected and Slurm did not answer)". It is outside the range 655-677. It stays roughly true, since Slurm did not answer one command. Not false.
- `src/lib/server/machine/hpc/routes.ts:64` and `submit.ts:295` read `answer.status === 'ok'`. That `answer` is an action's answer, not the payload. Unaffected.
- `docs/HELP.md:320`, the Live HPC bullet, says nothing about failures and stays true.
- `slurm_partial_msg`, `stale_from`, `stale_never`: no hits, so no collision. `slurm_down_msg` keeps its reader at `hpc.ts:44` for a `slurm_down` without `stale`. `answerFailure`, `slurmHint` and `prewarmDue` have hits in `poll.ts` only. `hpcWords` has hits only in `status.ts:185` and `:439`. `failureWords` has hits only in `hpc.ts`, `status.ts`, `Head.svelte` and `Hpc.svelte`, all in the write list.

Hits inside the write list that the change makes false. The brief names none of them explicitly, apart from "doc comments of the functions the item changes" for `poll.ts`:

- `src/lib/server/machine/hpc/poll.ts:264-268`, the `prewarmDue` doc: "A poll that failed clears it, so the prewarm only ever runs against the rows of the poll that set it". This becomes false: a partial poll whose `sacct` answered is published as failed and still sets it.
- `poll.ts:232-235`, the `Rows` doc: "The rows of one good answer". This becomes false: the rows now mix polls.
- `poll.ts:440-446`, the `startPrewarm` doc: "The prewarm the last good poll asked for". This becomes false.
- `poll.ts:75-79`, `HpcWatcher.recover`'s doc: "It runs only while the last poll had the cluster's answer". It needs rewording to cover a live queue. Item 7 does not name it.
- `poll.ts:1-7` (the head comment) and `:180-187` (`answerFailure`) are named by item 1.
- `src/lib/data/model/model-sessions.ts:668`, the `lastOk` doc: "so a failed poll can say how old the rows under it are". This becomes false with `stale` present: `lastOk` is this poll's time while a kept table is older. It is inside the range 655-677. **[in scope]**
- `docs/apps.md:421`: "...`error` for anything else, each with the last good rows". This becomes false for a `slurm_down` carrying `stale`, whose queue is live. Item 2 only asks to add a sentence, not to amend this clause. **[in scope]**
- `src/lib/views/system/machine/hpc/Head.svelte:3-7`, the head comment: "While a poll fails ... the bar holds the status words alone". This becomes false: the partial bar holds the queue summary and the time.
- `Head.svelte:7` "no stale mark", `:49` "the stale one carries the failure tone", and the local `const stale = late()` (`:62`, used at `:72` and `:75`): here "stale" means a late poll. After the step, "stale" also names the payload key and the table mark. The same word would then mean two things in one file. **[in scope]**: rename the late meaning (for example `overdue`).
- `src/lib/views/system/machine/hpc/Hpc.svelte:22-27`, the head comment: "the box says which of the three failures it is". The partial sentence is a fourth sentence. This needs rewording.
- `src/lib/state/system/machine/hpc/hpc.ts:34-38`, the `failureWords` doc: "one pair per failure". It is covered by item 3 ("Its callers pass what it then needs"), but the doc rewrite is not named.
- Still true: `Recent.svelte:17-20` (`live` "Whether the cluster is answering"), `Login.svelte:2-11`, `hpc.svelte.ts:1-2`, and `poll.ts:227` ("a stale page").

## The step line

O83's line (`plan.md:829`) and the item that serves each part:

- "when `squeue` answers and only `sacct` or `sinfo` fails": item 1 (the definition of a partial answer).
- "the queue ... stay live from that poll": item 1 bullet 1, item 3, item 4 (Jobs and Recent live), item 5.
- "Recover's reading of the cluster stay live": item 1 bullet 1 (`take` on the partial poll) and item 7 (`recover()`).
- "only the table whose command failed is kept from the last good poll": item 1 bullet 2. The brief reads this as "from the last poll in which that command answered", which can be a partial poll. That matches Z1027 ("the time of the poll its rows came from") but differs from the line's literal "last good poll". It is stated nowhere as a reading or decision. Decision 1 covers only the time. **[in scope]**: state it as a decision.
- "marked as stale with its own time": item 1 (per-table times), item 2 (`stale`), item 4 (heading mark), item 6 (words).
- "status `slurm_down` with the failing command's message": item 1 bullet 4.

Ruling 430 (a): the same parts. The prewarm, named in "The rule the step ends", is served by item 1 bullet 7.

Ruling 431 (a) / Z1027:

- The `stale?` shape and "present only on" the partial poll: item 2, item 1 bullet 5.
- `null` when no poll has answered for the table since the server started: items 1 and 2, case 5.
- Queue fields and `lastOk` are this poll's: item 1 bullets 1 and 3.
- Recover's reading runs as on `ok`: item 7.
- Head bar: item 4 bullet 1. Failure box with the sentence and the hint: item 4 bullet 2 and item 3. Jobs and Recent keep live controls: item 4 bullet 3.
- Recent and Capacity carry the "stale, from HH:MM" or "not read since the server started" mark: item 4 bullet 5 and item 6. This item cannot be met for `null` as written (see Cases and checks, finding 2).
- Status bar: item 5. `docs/apps.md`: item 2.

No part of the line or the rulings is without an item. The `null` mark is the one part whose item cannot be met as written.

## Premises

Rerun commands and their results:

- `grep -n 'export function batchCommand\|function slurmHint\|...\|schedule(good' src/lib/server/machine/hpc/poll.ts` printed `113`, `165`, `188`, `214`, `236`, `281`, `374`, `375`, `377`, `397`. All match the brief. `wc -l` gives `poll.ts` 565 (matches).
- Reading `poll.ts:188-206`: `answerFailure` is as the brief says, `:199` matches, and `:202-204` returns `slurm_down` whenever the marker was printed and a code is not 0, whether or not ssh exited 255.
- `parse.ts:215` `splitSections`: the codes are 0 when a line is absent (`codeOf` at `:205`, initial values). Matches.
- `poll.ts:496`, `:500` `if (held?.status !== 'ok') return;`: matches. `context.ts:469` `readCluster: () => void polled.hpc.recover()`: matches. The G115 test spans `runs.test.ts:476-537` (file 537 lines). Its good and unreachable rows are as the brief says. Matches.
- `model-sessions.ts:657-677` `HpcPayload`, 846 lines, `lastOk` doc at `:668`: matches. `payloads.ts:52-68` `hpcShape`: matches. `docs/apps.md:421`: matches.
- `grep -n "status === 'ok'\|status !== 'ok'" ...hpc.svelte.ts ...hpc/*.svelte .../status.ts` printed hits at `hpc.svelte.ts:31,38,48`, `Head.svelte:44,61,88`, and `Hpc.svelte:103,110,114,115,116,119,124`. It printed **no hit in `status.ts`**. The brief lists `hpcWords` among the readers "each keyed on `status === 'ok'`", but `hpcWords` (`status.ts:192-193`) is keyed on `failureWords(data.status)`. Minor wording error. The conclusion that it must change stands.
- `failureWords` is at `hpc.ts:39-48`, `Recent.svelte:89` and `Capacity.svelte:66`: matches. The words in `hpc.yml` are at `:85`, `:47`, `:89`, `:90`: match. `meta_sep` is at `config/text/views/sessions/session-list.yml:37`. `statusbar.yml:70` is `hpc_live`: matches.
- `grep -n -i 'hpc\|slurm' .scratch/migration/agents/guarded.md` hits lines 8-9 (G1), 26-27 (G7), 86-88 (G34), 119-121 (G43) and 360-361 (G115). The brief names only G34, G43 and G115. G1 (token guard on the `hpc` route) and G7 (argument array on the `hpc` route) are left out. Neither covers the poll's status or the view, so the conclusion "no entry covers the poll's status or the HPC view" holds. `grep -n 'payloads\|hpcShape\|status\.ts\|hpcWords\|...' guarded.md` hits only G82 (`debugShape`), G34 and G43.
- Premise 7 (O80). `diff .agents/worktrees/O80-base/<f> .agents/worktrees/migration-O80/<f>`:
  - `payloads.ts` `38c38,39`: matches 35-40.
  - `status.ts` `397,399c397,400 ... 418c422,427`: within 394-430. Matches.
  - `docs/apps.md`: `diff docs/apps.md .agents/worktrees/migration-O80/docs/apps.md` shows O80's change at **line 452** (the `new-idea` row), not 449. On main, `sed -n 449p docs/apps.md` is the `radar-add` row. The brief's "line 449" is wrong. The two steps still merge by hunks apart (421 against 452).
  - `model-sessions.ts`, `hpc.yml`, `poll.ts`, `Head.svelte`, `Hpc.svelte` and `hpc.svelte.ts` have no O80 change.

## Cases and checks

1. **Case 9 contradicts the tree and item 1.** It says: "A partial answer with ssh exiting 255 after the marker: `error`, as now, no `stale`." `poll.ts:193-204`: with the marker printed (`parts.connected`) and `sacct`'s code 1, `failed` is not empty, so line 202 returns `slurm_down` whatever `broke` is. The base therefore gives `slurm_down` with `sacct`'s line as hint, not `error`. Item 1 says such a failure "publishes as O82 does", which is `slurm_down`. Expected result: `slurm_down`, hint `sacct`'s stderr line, no `stale`, rows as they stand. **[in scope]**: correct the case.
2. **Case 12's `null` half, and item 4's `stale_never` mark, cannot be drawn as the brief specifies.** `Recent.svelte:87` draws nothing unless `rows.length`, and `Capacity.svelte:64` draws nothing unless `meters.length`. Z1027 has a `null` table's rows empty, so for case 5's payload Recent draws no heading to carry "not read since the server started". The same holds for a table kept from a poll that answered with zero rows (`sacct` answering an empty window, then failing): `stale.recent` is a time, the rows are empty, and no mark shows. Item 4 does not say that Recent and Capacity draw their heading when `stale` names them and the rows are empty. **[in scope]**: Z1027 rules the mark, and both files are in the write list. Item 4 must say that a table `stale` names draws its heading with the mark even with no rows. The words of an empty Capacity heading ("Cluster capacity (0 partitions)") are a choice the brief should then make.
3. Case 14 is consistent with item 2, but see The question.
4. No case asks the builder to check or quote a place the step does not change. Case 12's "by reading and by `svelte-check`" and its look are consistent with the rules file ("A builder runs no page"; a DOM behaviour is seen at the look).
5. The rules file's test rule: case 8 is G115's row, and G115's Code line names `recover` of `poll.ts` (`guarded.md:360`). Consistent. The new row needs `SEC_CONNECTED` and `SEC_SACCT_RC`, which the test file does not import (`runs.test.ts:18-23` imports `SEC_RC`, `SEC_RECOVER`, `SEC_SACCT`, `SEC_SINFO`). The existing `batch` fixture has no marker, so the partial row needs its own answer. This is a note for the builder, not a defect.
6. Verify item 6, `grep -rn 'Z10[0-9][0-9]\|ruling 4[0-9][0-9]\|\bO8[0-9]\b' src config docs tests --exclude=local.yml`, printed nothing on main, and `\b` works in this grep (`echo 'xO83y O83 ' | grep -n '\bO8[0-9]\b'` matched). The check is usable as written.

## The question

Could each check pass without the goal being reached?

- **Case 1**: yes. It passes on the base, so it guards against regression and is not evidence of the goal. Acceptable.
- **Case 2**: no. It fixes `stale.recent`, the source of each table, `lastOk`, `take` and the schedule, all of which the base gets wrong. But its prewarm clause ("not started") also holds on the base.
- **Item 1 bullet 7, the positive half**: yes, it could pass without the goal. No case has `sinfo` failing with `sacct` answering and checks that the prewarm runs against this poll's Recent rows. A build that never prewarms on a partial poll passes every case, yet ruling 430's "the log prewarm stops" would remain. **[in scope]**: add to case 3 "the prewarm started once, against the second answer's Recent rows". The case-run must pass `logPaths` and `prewarm: true`, since `prewarmStep` returns at once without `logPaths` (`poll.ts:415-416`).
- **Case 3**: no, as above, with that addition.
- **Case 4**: no.
- **Case 5**: no, for the payload. Its page half fails (see Cases and checks, finding 2).
- **Case 6**: partly. A build that stamps a table's time only on a fully good poll passes case 6, which repeats the same failure, yet would give the wrong time when the failures alternate. See Implied inputs, alternating failures.
- **Case 7**: no.
- **Case 8**: no. It fails on the base (`recover()` sends nothing after a `slurm_down`), and its unreachable row stops a build that drops the gate.
- **Case 9**: as written it expects a wrong result (see Cases and checks, finding 1).
- **Case 10**: no.
- **Case 11**: yes, it passes on the base. It is a guard on decision 2. Acceptable.
- **Case 12**: the `ok` half and the `stale` time half no. The `null` half cannot pass at all.
- **Case 13**: no. On the base, `counts`, `pillText` and `badgeText` give zeros and '' for a `slurm_down` payload, and `hpcWords` gives the failure word.
- **Case 14**: **yes**. `unchangedAs` (`src/lib/data/shapes/shapes.ts:37-39`) wraps a non-strict `z.object`, so on the base `hpcShape` already passes any payload carrying `stale` unchanged. Every row of case 14 passes before the change, and item 2's `hpcShape` requirement could be skipped unnoticed. **[in scope]**: add a row with a malformed `stale` (for example `stale: 'x'`, or `stale: { recent: 5 }`) that `hpcShape` refuses after the change, which the base passes.
- **Item 2** (doc comment, `docs/apps.md`): checked by reading only. Acceptable for prose.
- **Items 3 to 6**: as cases 12 and 13 above.
- **Item 7**: case 8, no.
- **Step line as a whole**: a poll with `squeue` answering and `sacct` failing (case 2) and with `sinfo` failing (case 3), plus case 8, cover "the queue and Recover's reading live, only the failed table stale with its own time".

The remaining ways to pass without the goal are:

- the prewarm's positive half;
- case 14;
- the alternating-failure time;
- the `null` mark, which cannot be drawn.

## Implied inputs

- **Alternating failures**: a good poll at `t1`, then `sinfo` fails at `t2`, then `sacct` fails at `t3`. Expected: `stale` `{ recent: t2 }`, Recent the second answer's rows, Capacity the third's. This is missing, and a wrong answer shows a wrong time on the mark. **[in scope]**: add it as a case.
- **A window change by `set` with `days` while Recent is kept**: missing. `poll.ts:550-553` raises `asking` and polls but keeps `rows`, although `set`'s own doc (`:82-84`) says "a changed window drops what the old one answered". A partial poll after the change, with `sacct` failing, would mark the old window's Recent as "stale, from t1". Expected, as a judgment: keep Recent and its time, as a full failure keeps it on the base, and state that as a decision. The alternative is to drop it to `null`. Either way it needs a decision and a case. Cost: low, since the mark already says the table is old. **[in scope]**
- **`set` to `unconfigured` and back**: item 1 names "a change of host or of the sentence for having none" as dropping the tables' times. The code drops rows on a third condition too, `next.unconfigured !== before.unconfigured` (`poll.ts:530`). Expected: the times drop with the rows, the `unconfigured` payload carries no `stale`, and a partial poll after naming the cluster again gives `stale` `{ recent: null }`. Missing from item 1's wording and from the cases. A build that drops times only on the two named conditions would publish `stale.recent` as an old time over empty rows. **[in scope]**
- **A failure that is not partial, after a partial poll** (case 7's second half, or ssh unreachable after a partial poll): by Z1027 the payload carries no `stale`. Recent's rows are from `t1` while `lastOk` and the head bar's "last reached" say `t2`, so the reader is told Recent is as of `t2`. The brief follows the ruling, which leaves this. **[open item]**: the fix (carrying `stale`, or the per-table times, on every failure while a table is older than `lastOk`) changes Z1027's "present only on a poll whose `squeue` answered".
- **The quota read after a partial poll**: `publishQuota` publishes `{ ...held, quota }` (`poll.ts:313-314`), so `stale` and its times are kept. The same holds for a `pollMin` change (`:521-522`). Expected: `stale` unchanged. Missing as a case, but the cost is low since the code path is unchanged. A row in case 2 would confirm it.
- **A partial poll while a Refresh press is queued**: the queued poll runs after it (`poll.ts:476`). Expected: no difference from a timed poll. Not needed as a case.
- **A partial poll whose answer lands after `close()`, or after a host change (`began !== asking`)**: expected that nothing is published and `take` is not called, so on the partial path `take` must come after the check at `:355`, as on the good path. Missing. The cost is a `take` for a dropped host. **[in scope]**: add one line to item 1 or to case 10.
- **`sacct` answering code 0 with an empty section, then `sinfo` failing**: Recent is this poll's (empty), `stale` `{ sinfo: t1 }`. Expected: not partial for Recent. The page half falls under Cases and checks, finding 2 (an empty Capacity kept from `t1` shows no mark).
- **`recover()` while the held payload carries `stale` and then `set` changes host**: `degraded('starting')` carries no `stale`, so nothing is sent. Covered by the code.
- **The time printed in the head bar**: item 4 says "the poll's time", without saying whether that is `updated` or `lastOk`. `degraded` stamps `updated` with its own `new Date()` (`poll.ts:286`), so the two can differ by milliseconds. A note only.

## ADRs

`ls /Users/axelfaes/workspace/oculus/docs/adr` prints "No such file or directory". `grep -c -i 'adr' .agents/plan.yaml` prints `0`. The configuration names no `adr` and no ADR folder exists, as the brief says (`O83.md:5`).

## Dictated text

`grep -n 'slurm_partial_msg\|stale_from\|stale_never\|The cluster answered for the queue' .scratch/migration/agents/briefs/O83.md` finds the dictated lines at `:52`, `:53` and `:54`, with case 12 (`:72`) quoting `:52`'s sentence. Each was read against `agents/spec.md` "The working rules that bind every package" (the Prose bullet: plain, ASCII, no em dashes, no quips, no 'not X but Y') and "What every package obeys" (ASCII; catalog keys; a group in one file).

- `:52` `slurm_partial_msg: The cluster answered for the queue, and Slurm did not answer for the tables marked stale.` Holds. Note: for a `null` table the mark reads "not read since the server started" and does not contain the word "stale". The sentence's "tables marked stale" then points at a mark that does not say "stale". The wording is fixed by Z1027, so any change is **[open item]**.
- `:53` `stale_from: stale, from {0}` Holds. It is a valid YAML plain scalar, since `{` is not at its start. Both headings it joins carry `text-transform: uppercase` (`Recent.svelte:102`, `Capacity.svelte:147`), so the mark is drawn "STALE, FROM 10:42" unless it is styled apart. That is a matter for the look, not a prose rule.
- `:54` `stale_never: not read since the server started` Holds. It is not a 'not X but Y' construction.
- Placement: the keys sort after `slurm_down_msg` (`hpc.yml:90`) and before `tail` (`:91`), in the file's alphabetical order, in the `hpc` group's one file. Holds.

## Declined to judge

- I ran no vitest, `npm`, `svelte-check` or case-run program (forbidden by the task). Every claim about runtime results is read from the code: `poll.ts:193-204` for case 9, and `shapes.ts:37-39` for case 14.
- Whether O80's round-1 worktree is O80's final state: I compared both `migration-O80` and `migration-O80-round-1`. They agree on `payloads.ts`, `status.ts` and `docs/apps.md`. I did not check later rounds.
- Whether `docs/HELP.md` needs a bullet: the rules file asks HELP for "what a user does". The step adds nothing a user does, so I judged no bullet is needed and did not treat it as a finding.
- The design merit of decisions 2 to 5 beyond their consistency with the rulings and the code: not judged.
- `config/local.yml` and the hub's `.oculus/local.yml`: not opened, by instruction.

Usage: af3b2b2dbfcd20aec, claude-opus-5-5, 200846 tokens, 49 tool uses, 8 min 15 s.

## Closed (each finding's change to the brief, by the session)

- Names, the readers outside the write list (the Focus command center's pill, the rail badge): named in premise 5 and in case 15's look; no change to their files.
- Names, the comments the change makes false (`poll.ts:75-79`, `:232-235`, `:264-268`, `:440-446`; `model-sessions.ts:668`; `docs/apps.md:421`'s "each with the last good rows"; `Head.svelte:2-7` and `Hpc.svelte:21-26`; `failureWords`'s doc): premises 2, 4 and 5 name them, and items 1 to 4 ask each rewritten.
- Names, "stale" meaning a late poll in `Head.svelte`: item 4 renames it `overdue`; verify 6 checks it.
- The step line, "the last good poll" read per table: decision 1.
- Premises, `hpcWords` keyed on `failureWords` and not on `status === 'ok'`: premise 5 rewritten.
- Premises, O80's line of `docs/apps.md` is 452: premise 8 corrected.
- Cases and checks 1, case 9 of the old brief: now case 10, expecting `slurm_down` with `sacct`'s line, not partial.
- Cases and checks 2, the mark of an empty table cannot be drawn: item 4 draws a table `stale` names with its heading at 0 rows; decision 6 gives the heading's words; case 15 checks case 5's payload.
- Cases and checks 5, the test's imports and fixture: premise 3 names them; the path list widens to `runs.test.ts:18-23`.
- The question, the prewarm's positive half: case 3 asks the prewarm started once against the second answer's Recent rows, with `logPaths` and `prewarm: true`.
- The question, case 14 of the old brief passes on the base: case 17 adds two malformed `stale` rows the change refuses.
- Implied inputs, alternating failures: case 7.
- Implied inputs, a window change while Recent is kept: decision 3 and case 12.
- Implied inputs, `unconfigured` and back: item 1 names the third condition; case 11.
- Implied inputs, a full failure after a partial poll: raised as open item 432, ruled Part 1 (a) by Axel; item 2 and case 9. The liveness of the queue that ruling then needs: open item 433, closed under self-rule as Z1028 (a); items 1, 3, 5 and 7.
- Implied inputs, the quota read after a partial poll: case 2's last sentence.
- Implied inputs, an answer after `close()` or a host change: item 1 places the partial path after the drop check; case 11.
- Implied inputs, `sacct` answering empty then `sinfo` failing: case 14.
- Implied inputs, the head bar's time: item 4 names `updated`, equal to `lastOk` on such a poll by ruling 433.
- Dictated text, the never-read mark without "stale": raised as open item 432, ruled Part 2 (a) by Axel; item 6 dictates `stale_never: stale, not read since the server started`, held line by line: ASCII, plain, no dash, no 'not X but Y' construction, a YAML plain scalar.
