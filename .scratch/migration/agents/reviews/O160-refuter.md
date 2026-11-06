Review of O160 (Live HPC shows its refresh running). Worktree /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O160, base 9ce4937ed. I changed nothing.

## Verification lines (run from the worktree root)

1. `npm run test:quick` (run once):
```
ok      prettier (1.1 s): All matched files use Prettier code style!
ok      ASCII gate (1.2 s)
ok      svelte-kit sync (2.8 s)
ok      eslint (3.6 s)
ok      svelte-check (14.4 s): 1793992777659 COMPLETED 584 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest slow (54.3 s): Duration  37.18s (transform 18.50s, setup 0ms, import 24.39s, tests 12.59s, environment 0ms)
ok      vitest (59.9 s): Duration  43.40s (transform 78.21s, setup 0ms, import 127.19s, tests 3.02s, environment 335ms)
ok      vitest checks (77.9 s): Duration  61.23s (transform 20.75s, setup 0ms, import 42.52s, tests 132.11s, environment 3ms)
test:quick: 80.9 s; every command passed
```

2. `grep -rl "hpc.svelte.ts\|hpc\.svelte\|HELP.md" tests` printed:
```
tests/checks/source/history.test.ts
tests/server/git/git-scan-depth.test.ts
tests/server/git/clone-exclude.test.ts
tests/views/shared/prose/doc-link.test.ts
tests/routes/docs/docs.test.ts
```
No test file names `hpc.svelte`. `grep -rln "usage-refresh\|session-marks" tests` printed nothing.
- In the brief's form, `npx vitest run tests/checks/config/config-folder.test.ts tests/checks/tree/size.test.ts <the five files above> --reporter=dot` printed `Test Files  1 failed | 6 passed (7)` and `Tests  1 failed | 86 passed | 2 skipped (89)`. The one failure is `FAIL |unit| tests/checks/source/history.test.ts > no history in code > names no package id, date or session in any comment` / `Error: Test timed out in 5000ms.`
- The same three tree checks run with `--testTimeout 0 --hookTimeout 0`, the flags `tests/tiers/quick.mjs:285` and `package.json:16` give the checks, printed `Test Files  3 passed (3)` and `Tests  44 passed | 2 skipped (46)`.
- `npx vitest run tests/server/git/git-scan-depth.test.ts tests/server/git/clone-exclude.test.ts tests/views/shared/prose/doc-link.test.ts tests/routes/docs/docs.test.ts --reporter=dot` printed `Test Files  4 passed (4)` and `Tests  43 passed (43)`.
- The timeout comes from the brief's command form, which leaves the flags out. It is not caused by the step: the check scans the whole tree, and it passed inside the quick list.

3. ASCII gate, the rules file's perl form, over the eight changed source and doc files: printed nothing, `perl exit 0`. `LC_ALL=C grep -n '[^ -~]'` over those eight files and the three `.dot` diagrams: printed nothing, `grep exit 1`.

4. `wc -l`:
```
150 Head.svelte
213 Cluster.svelte
78 Log.svelte
180 hpc.svelte.ts
643 docs/HELP.md
32 waiting.svelte.ts
90 usage-refresh.svelte.ts
95 session-marks.svelte.ts
```
Every file is under 520 (component) or 880 (source).

5. `sh utils/unused-exports.sh`: `exit 0`, 334 lines. `diff` against `/Users/axelfaes/workspace/oculus/.agents/worktrees/O160-base/unused-exports.txt`: printed nothing, `diff exit 0`. The step adds no line.

6. History-word grep:
- Over the 51 comment lines the diff adds (from `git diff -U0 9ce4937ed -- src docs/HELP.md` plus the whole of the new `waiting.svelte.ts`), with `before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands|\bO[0-9]+\b|20[0-9][0-9]-`: `grep exit 1`, no hit.
- The added HELP sentence alone: no hit.

Other checks:
- `diff -rq` over config, src, tests and utils against the base copy lists exactly the seven src paths the report gives.
- `test -d docs/adr || echo "no docs/adr"` printed `no docs/adr`.

## Item verdicts

1. The head's Refresh now: holds.
   - `Head.svelte:110-115` carries `glyph="refresh"` and `turning={refreshing}`.
   - The prop `refreshing: boolean` is declared at `Head.svelte:35-44`. `Cluster.svelte:129` passes it as `refreshing={turning}`, and `turning` is `$derived(refreshing(data.resource))` (`:60`).
   - The store sets its count before its first await (`hpc.svelte.ts:110`), so the glyph turns at the press. It lowers the count in `finally` (`:115-117`), so the glyph stops at the answer.

2. The error box's refresh: holds.
   - `Cluster.svelte:138-144` gives the same glyph, `{turning}` from the same derived value and `onclick={refreshCluster}`. Both controls therefore read the store's per-resource count.

3. The log box's tail: holds.
   - `Log.svelte:39-46` adds `glyph="refresh"` and `turning={status === 'loading'}`, and keeps `disabled={!live}`. The disabled style is `opacity: 0.5` and `cursor: default` only (`ToolButton.svelte:211-214`), so the glyph keeps turning while the control is disabled.
   - `showLog` (`Cluster.svelte:105-120`) returns at once when the same job's log is loading.
   - It counts each read in `logAsk`, maps a rejected `jobLog` to `{ status: 'error', output: '' }` (shown as `hpc.fetch_failed`, `Log.svelte:29-30`), and drops an answer whose `ask !== logAsk`.
   - `closeLog` (`:121-124`) also counts, so an answer that lands after a close is dropped.
   - The log controls of Jobs and Recent are disabled when the cluster is not live (`Jobs.svelte:93-95`, `Recent.svelte:99-101`), so no read starts while `live` is false.

4. The state of a refresh: holds.
   - `hpc.svelte.ts:63` creates `const pressed = createWaiting();`.
   - `refreshing` is at `:99-101`. `refresh` (`:108-118`) returns early while the resource waits, counts in, awaits `command`, and counts out in `finally`.
   - The count is per resource string. The store is created once per client (`src/lib/state/client/context.ts:416`), so a view opened again reads the same count.
   - No `waiting` prop is passed to either control.

5. The words: holds.
   - The new head comment paragraphs are `Head.svelte:9-13`, `Cluster.svelte:17-23`, `Log.svelte:2-5`, `hpc.svelte.ts:4-10`, and the `showLog` doc comment `Cluster.svelte:100-104`. Each says what turns and for how long, and the history grep found nothing.
   - The claim in `hpc.svelte.ts:5-7` that "the route answers ... at once when it refuses the request or watches no such cluster" matches `routes.ts:28-38` and `+server.ts:30-32` (`server.hpc.watcher(resource)?.refresh()`).

6. The help page: holds.
   - `docs/HELP.md:363` gains the sentence "Refresh now, in a cluster's head and in its error box, and the tail of its log turn their glyph from the press until that request answers." It sits after the poll cadence sentence.
   - `:359` (the Inbox bullet) is unchanged and reads as the Inbox's own claim. This matches item 6's condition.

## Case verdicts

The cases were checked by reading. Whether the glyph visibly turns is the look at landing.

- C1: met. The count is set synchronously at the press and lowered in `finally` after `command` resolves. The route resolves after `poll()`, which publishes before it returns (`poll.ts:441-505`). There are also early returns without a publish at `poll.ts:452` and `:499` when the settings changed, which the builder's report names.
- C2: met. A rejected fetch is caught (`hpc.svelte.ts:113-114`). A route error answer is still JSON, so `command` resolves. Either way the `finally` lowers the count.
- C3: met. The error box's control reads the same `turning` (`Cluster.svelte:142`).
- C4: met by reading only. The count is keyed by `data.resource` and each `Cluster` is keyed by resource (`Hpc.svelte:62`). The hub lists one cluster.
- C5: met. `if (refreshing(resource)) return;` (`hpc.svelte.ts:109`). Nothing sets `waiting`.
- C6: met. The tail turns while `status === 'loading'`. With `live` false before the press, the tail and the row log controls are disabled, so no read starts. A read already in flight keeps `status` at `loading` until its answer, with the control disabled.
- C6b: met. The rejection becomes `{ status: 'error' }` (`Cluster.svelte:112-116`), which ends `loading`, and the box shows `hpc.fetch_failed`.
- C6c: met. B's `showLog` increments `logAsk`, so A's answer fails `ask !== logAsk` (`:117`) and is dropped. B's answer is written.
- C7: met. Only `refresh()` touches the count. The poll's own cadence never reaches the client store.
- C8: met. `Head.svelte:109` hides the control while `failed`. The error box (`Cluster.svelte:135-146`) draws with the same `turning`, which stays true until the HTTP answer. One timing point for the look: the failed state comes over the `hpc` channel and the answer over HTTP. If the HTTP answer reaches the page before the channel's publish, the error box appears already still. That is consistent with "stops when the request answers" and is not a defect.
- C9: met. The count lives in the client-wide store (`context.ts:416`), and the derived value in a freshly mounted `Cluster` reads it.

## Spec

none.

The widened write list is justified:
- **The new helper.** Item 4 asks for "a pressed count per resource ... as `usage-refresh.svelte.ts` holds it". On the base copy, `grep -rn "held > 0" src tests` finds the count fold twice, at `usage-refresh.svelte.ts:56` and `session-marks.svelte.ts:76`. The rules file's reuse rule (`spec.md:89`: "a parser, a fold or a rule exists once and is reused") asks for one shared fold rather than a third copy. `waiting.svelte.ts` is that fold, and the report names each widened path with its reason, as `spec.md:35` asks.
- **The diagrams.** Regenerating them is `spec.md:26`'s `npm run diagrams` step. Only import counts move.
- **usage-refresh.svelte.ts behaves as before.** Its base `pressed` was already `$state.raw<Record<string, number>>`, read with `byKey`, and `hold` was the same code. The helper's `count`/`hold` are line for line the same logic.
- **session-marks.svelte.ts behaves as before.** It moved from a deep `$state({})` to the helper's `$state.raw`:
  - The base `hold` always reassigned `writing` wholesale (`Object.fromEntries(...)`) and never mutated it in place. So every reader, including the `$effect` through `uncarried`, depended on the variable's signal in both forms, and each `hold` triggers a rerun either way.
  - `!writing[k]` became `writing.count(k) === 0`. Stored counts are always above zero, and a missing key reads as 0 against `undefined`.
  - `writing[key] === 1` became `writing.count(key) === 1`, which is equivalent.
  - `byKey` adds an own-property check that `<field>:<id>` keys never needed.
- **Brief premises reproduce.** `grep -rln "views/system/machine/hpc" tests` lists only `tests/checks/config/config-folder.test.ts`. `grep -rn "action: 'refresh'" src` lists `calendar.svelte.ts:74`, `inbox.svelte.ts:98`, and now `hpc.svelte.ts:112`.
- **The report gives every case's first run.** C1 to C9, C6b and C6c are all present.

Note for landing (not a finding): `docs/diagrams/*` is also on the write lists of the briefs of O152, O155, O157 and O158, and `docs/diagrams/writes.*` on O156's. The counts are regenerated by `npm run diagrams`, so a clash resolves by rerunning it.

## Proof

- P1 (minor): `.scratch/migration/agents/reviews/O160-report.md:106` states that the fold "existed twice on the tree, `usage-refresh.svelte.ts:53-58` and `session-marks.svelte.ts:73-78`". It does not quote the grep `spec.md:89` asks for before a helper is written. The report quotes only the later grep of the new names (`:102`).
  - What is wrong: the reuse claim rests on an unquoted search.
  - Failure scenario: a third copy elsewhere in `src` would have gone unseen by the reader of the report.
  - Closed here: on the base copy, `grep -rn "held > 0" src tests` and `grep -rn "function hold(" src tests` find exactly the two copies and no other count fold. The claim holds.

No guard or fallback stands where a fix was asked. The `catch` in `hpc.svelte.ts:113-114` sits beside the `finally` the brief asks for. It keeps `void refresh(...)` from producing an unhandled rejection, and the report states it as judgment 5. No test was added. No `guarded.md` entry names these units (`grep -n -i "usage-refresh\|session-marks\|waiting.svelte\|hpc.svelte"` over it printed nothing), and views have no entry (line 3).

## Standards

- S1: `.scratch/migration/agents/reviews/O160-report.md:46` says "The verify list ran twice. The history grep, run after the first list, hit "still" in the new helper's head comment, which was reworded; the second run covers that edit."
  - What is wrong: `spec.md:26` allows the list once after the last change. A second run is allowed only after fixing a red line of the list in a changed file, and the history-grep hit is not a line of the list. The first run came before the last change, and the rules file calls such a run "a finding of the review".
  - Failure scenario: one extra full quick list, about 87 s by the report's own timing, spent for a one-word comment edit that the grep should have caught before the list ran.
- S2 (minor): `spec.md:45` asks that an edited comment be rewrapped as a whole paragraph at 100 columns, so no line inside a sentence ends short. Four new comment lines end where the next word still fits within 100 columns:
  - `hpc.svelte.ts:5`, 95 columns, `// The store also holds the clusters whose Refresh now the reader pressed, from the press until`. The next word "that" would reach exactly 100.
  - `hpc.svelte.ts:7`, 96 columns, `// refuses the request or watches no such cluster), so the cluster's refresh control turns while`. The next word "it" would reach 99.
  - `Cluster.svelte:101`, 96 columns, `* Read one job's log into the box. A press while that log is read sends nothing; the answer`. The next word "of" would reach 99.
  - `Cluster.svelte:102`, 97 columns, `* of a read that a later read or a close superseded is dropped; a read that rejects is shown`. The next word "as" would reach 100.
  - Failure scenario: none at run time. The comment-width check only bounds the upper width, so this passes the tree checks and stands against the rules file's wrap rule.

The other standards hold:
- **ASCII and comments.** No non-ASCII and no history words.
- **Sizes and folders.** Every file is within its size limit. `src/lib/state/shared/stores/` holds 8 items.
- **Head comment and globals.** The new module opens with a Layer 2 head comment, and `createWaiting` builds its state per call, so no global is added.
- **Layer boundaries.** `views/sessions` importing `state/shared/stores` and `state` importing `data` are allowed, and `boundaries.test.ts` passed in the list.
- **Docs and comments still true.** For each changed name (`createWaiting`, `waiting.svelte`, `refreshCluster`, `closeLog`, `logAsk`, `refreshing`, `refresh`), I grepped `src`, `tests`, `docs`, `README.md` and `config` (`--exclude=local.yml`), plus `docs` for "Live HPC" and "Refresh now". None of the hits is made false by the diff:
  - `docs/HELP.md:359` (Inbox) and `:365` (Usage) remain true.
  - `Usage.svelte:28` ("the usage-refresh store's `refreshing`") and `SessionList.svelte:63` remain true.
  - No document lists the files of `state/shared/stores`.

## Behaviour

none. The report's before and after section (`.scratch/migration/agents/reviews/O160-report.md:73-86`) states every user-visible change the diff makes:
- the glyph on the head's Refresh now, on the error box's Refresh now and on the log's tail, with the span each turns;
- a second press of Refresh now sends no request;
- a tail or row-log press for a log that is loading sends no second read;
- a failed read now says the fetch failed, where it stayed at loading before;
- a superseded or closed read's answer is dropped;
- the tail is still and disabled when the cluster is not live;
- no visible change in Usage and the Sessions list.

The swallowed rejection of a failed refresh request shows no change on screen. Before, it was an unhandled rejection in the console; this is stated as the report's judgment 5.

## Declined to judge

- That the glyph visibly turns, stops, and keeps its look in each of C1 to C9, and the layout of the two controls with the glyph added: these are the look at landing. I started no server and opened no page.
- Report evidence that runs a git command outside my three permitted forms, so I did not run it as quoted:
  - `git diff --numstat docs` (report lines 38 and 54). My `git diff 9ce4937ed -- docs/HELP.md` shows the one changed line 363.
  - `git diff -U0 -- src docs/HELP.md` (report line 48). I ran my own form against `9ce4937ed`.
  - `git show HEAD:docs/HELP.md | sed -n 363p` (report line 48). My `git show 9ce4937ed:docs/HELP.md | sed -n 363p` shows the two "before" hits the report names: "the hub's own rows before them" and "the `sbatch` command) before it runs".
- That the channel publish reaches the page before the HTTP answer in C8: transport ordering, not verifiable by reading.
- Whether reduced motion and the terminal palette keep the glyph still: this is the brief's decision 4 and `Glyph.svelte`'s existing behaviour (`Glyph.svelte:77-91`), which the step does not change. I read it but did not exercise it.

Usage: a954d5be2d7b092c9, claude-opus-5-5, 179166 tokens, 61 tool uses, 12.6 min

## Closed

- P1: closed by the review's own grep on the base copy (two copies of the fold, no third).
- S1: recorded in the booking as a breach of `spec.md:26`; nothing of it is in the diff.
- S2: fixed at landing, the four comment lines rewrapped as whole paragraphs at 100 columns.
- The added sentence of `docs/HELP.md:363`: removed at landing under the ruling "Help redesigned" (no step in flight adds a sentence to `docs/HELP.md` beyond what Axel ruled); `docs/HELP.md` lands as on main.
