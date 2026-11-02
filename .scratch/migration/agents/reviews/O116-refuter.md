# O116 refutation report

Run from `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O116`. `git status --short` printed the same 9 lines before and after, so nothing changed.

Two items need a decision before landing:
- B1: the export's response head does not go out at once. The report and a code comment say it does, so the look on landing will see otherwise.
- Item 1's "no more than one piece" is not literally met (S1).

## Verification lines, verbatim

`npm run test:quick`:
```
ok      prettier (0.8 s): All matched files use Prettier code style!
ok      ASCII gate (0.9 s)
ok      svelte-kit sync (2.6 s)
ok      eslint (3.2 s)
ok      svelte-check (11.9 s): 1793620098302 COMPLETED 580 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (39.7 s): Duration  25.97s (transform 45.05s, setup 0ms, import 80.01s, tests 4.48s, environment 799ms)
ok      vitest slow (46.7 s): Duration  32.76s (transform 19.04s, setup 0ms, import 25.72s, tests 8.77s, environment 1ms)
ok      vitest checks (66.1 s): Duration  52.25s (transform 18.19s, setup 0ms, import 36.96s, tests 115.88s, environment 3ms)
test:quick: 69.0 s; every command passed
```

`npx vitest run tests/server/sessions/transcript-routes.test.ts tests/server/sessions/transcripts.test.ts --reporter=verbose`:
```
 Test Files  2 passed (2)
      Tests  39 passed (39)
   Start at  12:50:00
   Duration  1.30s (transform 333ms, setup 0ms, import 987ms, tests 1.29s, environment 1ms)
```
The longest of the added route tests took 139ms.

`node --no-warnings <my scratchpad>/o116-cases.mts <worktree>`, the source extracted from the report, on the built tree. Every line equals the report's:
```
1 big file: {"turns":["tail one","tail two"],"offset":41943040,"size":41943040,"ok":true}
2 next read: {"turns":["appended"],"offset":41943168,"size":41943168}
3 no line feed, small file: {"offsetIsLineBefore":true,"firstHolds":["finished"],"next":["being written"]}
3 no line feed, big file: {"offsetIsLineBefore":true,"firstHolds":["finished"],"next":["being written"]}
4 under 32 MiB: {"count":200,"first":"turn 50","last":["turn 249"],"offset":32216,"digest":"147d008f1d5f1d8b9024ea4ab0a58744dd63b977d20b4eb2803bef6fdda7bba7"}
5 doubled: {"turns":["forty from the end"],"offset":104857600,"size":104857600}
6 inside a line: {"turns":["after the cut"],"offset":41943040,"size":41943040}
7 subagent: {"turns":["agent tail"],"offset":41943040}
8 codex: {"turns":["rollout tail"],"offset":41943040}
9 empty: {"status":200,"turns":[],"offset":0,"results":{}}
9 missing: {"status":200,"turns":[],"offset":0,"results":{}}
10 results: {"status":200,"turns":[{"id":"toolu_later","name":"Bash","summary":"run toolu_later","ok":null}],"results":{"toolu_before":true},"nextStatus":200,"nextTurns":0,"nextResults":{"toolu_later":true}}
11 growth: {"appended":4,"firstOffsetPastStartSize":0,"firstEndedBeforeSizeAtEnd":true,"everyLineOnceInOrder":true}
12 export: {"status":200,"length":224,"digest":"67cafa258a57a43b62368598f7ef3cc9efa79b7184ab2360465805cc9a73de23","disposition":"attachment; filename=\"a-title.md\""}
13 macrotasks, 5 pieces, least 4: {"export":4,"fromOffset":4}
```

The same program on `.agents/worktrees/O116-base`: every line equals the report's first-run block. The lines that differ from built:
```
1 big file: {"turns":["MARKED","tail one","tail two"],"offset":41943040,"size":41943040,"ok":false}
5 doubled: {"turns":["MARKED","forty from the end"],"offset":104857600,"size":104857600}
6 inside a line: {"turns":["MARKED","cut by the start","after the cut"],"offset":41943040,"size":41943040}
7 subagent: {"turns":["MARKED","agent tail"],"offset":41943040}
8 codex: {"turns":["MARKED","rollout tail"],"offset":41943040}
10 results: {"status":200,"turns":[{"id":"toolu_before","name":"Bash","summary":"run toolu_before","ok":true},{"id":"toolu_later","name":"Bash","summary":"run toolu_later","ok":null}],"results":{},"nextStatus":200,"nextTurns":0,"nextResults":{"toolu_later":true}}
11 growth: {"appended":0,"firstOffsetPastStartSize":0,"firstEndedBeforeSizeAtEnd":true,"everyLineOnceInOrder":true}
13 macrotasks, 5 pieces, least 4: {"export":0,"fromOffset":0}
```

`o116-cases-export.mts`, source from the report:
```
unread body, descriptors over idle: 0 locked: false
left in flight, descriptors over idle during: 1 after: 0 read answered: {"done":true}
two presses equal: true length 145 digest a8d1d0f85ca1ed9d descriptors over idle: 0
```

`sh utils/unused-exports.sh` compared with `../O116-base/unused-exports.txt`:
```
< src/lib/server/sessions/stores/transcripts.ts: DEFAULT_WINDOW_DAYS, DEFAULT_MAX_SESSIONS, toolOf, readSession
> src/lib/server/sessions/stores/transcripts.ts: DEFAULT_WINDOW_DAYS, DEFAULT_MAX_SESSIONS, foldFrom, toolOf, readSession
```

Other reruns:
- The report's name grep gives the same line numbers: `transcript-routes.ts` 17 99 109 141 255; `turns.ts` 6 26 155 163 167 176; `transcripts.ts` 101 172 176 183 190 198 203 207 210 254; `+server.ts` 6 11.
- `wc -l` gives 277, 338, 442, 294, 568, 294, equal to the report.
- `diff -rq` over src, tests, utils and config (`--exclude=local.yml`) lists the six files of the report.
- `LC_ALL=C grep -n '[^ -~]'` over the six files printed nothing.
- `.scratch/migration/orchestrator-state.md:169` is open item 629.
- The history-word grep over added lines gives the report's six hits. Each is a position or a present state.

My own case-run programs, in the scratchpad, on a real `node:http` server through Kit's `setResponse`:

`/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o116-review.mts`:
```
A export over http, 1.5 GiB, ms to response head, first byte, end: {"head":781,"first":781,"end":781}
B socket closed in flight, descriptors over idle during: 2 after: -1
C heavy file bytes 42404300 a line 6329
C first read, heavy: {"mostMs":2020,"allMs":7452,"ticks":4}
  answer bytes 195724725
D read from offset 1, heavy (uncapped answer): {"mostMs":1928,"allMs":9838,"ticks":5}
```

`/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o116-review2.mts`:
```
E one line of 16 MiB, bytes 18591245, first read: {"mostMs":24,"ticks":2,"allMs":33,"answer":22393}
E one line of 64 MiB, bytes 74364160, first read: {"mostMs":78,"ticks":20,"allMs":115,"answer":22393}
E one line of 256 MiB, bytes 297455779, first read: {"mostMs":310,"ticks":95,"allMs":464,"answer":22394}
F file bytes 18920000 turns 40000
F export over http: {"headMs":1837,"endMs":2036,"bytes":15000091,"afterHead":{"mostMs":30,"ticks":22}}
```

## Item verdicts

1. Reads on the server yield: violated, narrowly, in one sentence only (S1). The rest of the item holds: `foldYielding`, shared `foldPieces`, async `readTurns` and `handleTranscript`, sync `foldFrom` kept for the scan, sync `readTurns` gone.
2. A bounded first read: holds. See T1 and T2 for two comments.
3. A read that starts inside a line: holds. See P1 for its proof.
4. Results of earlier calls: holds.
5. The export: violated (B1). The report's account of "in flight" is false on a real server. Bytes, the yielding read, leaving and two presses hold.
6. Comments of `transcript.svelte.ts`, HELP: holds. The diff of that file is comment lines only, and no line of `docs/HELP.md` says how much of a file is read.

## Case verdicts

- First read above 32 MiB, marked head: met.
- Next read after an append: met.
- Last line with no line feed: met. Preserved, under the round 0 ruling.
- Under 32 MiB, turn for turn: met. Digest 147d008f on both trees.
- No turn in the last 32 MiB, one 40 MiB back: met.
- Start inside a line: met. The assertions hold; P1 is about what they can see.
- Subagent over 32 MiB: met.
- Codex rollout over 32 MiB: met.
- Empty file, missing file: met.
- Result with no call, call with a later result: met. No throw, and `nextResults` carries the id. The patch itself is the unchanged `merged` at `transcript.svelte.ts:155-160`, read and not run.
- A file that grows during a read: met.
- Export of several pieces, same bytes: met. Digest 67cafa25 on both trees.
- Macrotasks, export and read from an offset: met. 4 and 4 on 5 pieces, 0 and 0 on the base.

## Spec

S1. `src/lib/server/sessions/stores/transcripts.ts:150-153` and `:219-220`, `transcript-routes.ts:97-101`.

The brief says "no read of a transcript holds the thread for more than one piece". That is not true in two places.
- **A line longer than a piece.** It is decoded and parsed in one stretch:
  ```
  foldLine(carry.length === 0 ? tail : Buffer.concat([...carry, tail]), apply);
  ```
  Measured stall: 78 ms on a 64 MiB line and 310 ms on a 256 MiB line (run E). It grows with the line, up to `MAX_STRING_LENGTH`.
- **The pass boundary in the doubling.** `foldYielding` returns with no macrotask after its last step, so the next pass's first piece runs in the same macrotask, across `await readTurns` microtasks. On a file that does not grow, the last piece of a pass is 1 byte, because `size - start` is `distance + 1`. With growth it is that growth plus 1 byte.

Failure scenario: a tool output of hundreds of MiB on one line holds the thread for about 0.3 s or more. The pass boundary costs next to nothing. The report lists neither under Limitations. A line stall cannot end without a streaming parser, so I judge this a limitation to state, not a defect to repair.

No other spec finding. There is no dependency, every changed file is on the write list, and `guarded.md` in the worktree equals the main checkout's (`diff` printed nothing).

## Proof

P1. `tests/server/sessions/transcript-routes.test.ts:359-369`, row 'a start inside a line drops that line'. The title and hunk:
```
name: 'a start inside a line drops that line',
```
By reading, this row and every other row would pass with `insideLine` taken out.
- A cut JSON line does not parse, and `foldLine` skips it ("a blank or broken line is skipped"). The brief's own 494674 cuts gave no parseable suffix.
- The row fails on the unchanged tree only because MARKED is present (base case-run line 6), so its quoted failure says nothing about the drop.
- 'a start on the first byte...' guards the one-byte-early start, and with `insideLine` gone it would still pass.

Failure scenario: `skipping = insideLine` at `transcripts.ts:124` could be lost and every test stays green. A line whose whole does not parse but whose end does, such as `xxx{record}`, with the start inside `xxx`, is the only input that separates the two.

P2. Report judgment call 7 ("so the answer's headers go out before the read") and "In flight: the response goes out at once" do not reproduce (B1). The report's export program reads a `Response` object with no socket, so it could not fail on this risk.

P3. A file-scope mutable. `tests/server/sessions/transcript-routes.test.ts:132-133`:
```
/** The folder of the session records' files. */
let STORE = '';
```
It is written in `test.beforeAll` and read at `:292`. The spec's no-globals line holds in test helpers too. The folder can be derived from `held(SESSION).path`. `tests/server/sessions/transcripts.test.ts:25` has `let DIR = ''` on the base, so the pattern is not new; this one is added by the step.

No widened threshold, no null guard or fallback standing where a fix was asked for, and no failure claim without a quoted line.

## Standards

T1. `src/lib/server/sessions/transcript-routes.ts:105-106`:
```
 * GET /api/transcript: the turns of one session from a byte offset, and the offset to ask next, the
 * end of the file when no offset is asked; with `format=markdown`, the whole conversation as a
```
False while the last line is being written. The answer is the end of the last whole line, as `FIRST_READ_TURNS`'s comment says at `:26-27` and as the test 'stops at the line feed...' asserts with `ABOVE - part`. A reader of the doc would take the offset for the file's size.

T2. `transcript-routes.ts:34`:
```
 * This bounds what one request reads of a transcript whatever its size;
```
False for a file with no turn. The doubling reads about twice the file (report judgment call 6), and `:33` says the distance doubles.

T3. `tests/server/sessions/transcript-routes.test.ts:12-14`:
```
// every read gives the thread back between pieces. The files above the 32 MiB a first read takes
// are sparse, so a case writes only the bytes it asks about, and their zero bytes are broken into
// lines of a MiB so that no case decodes one long line of them.
```
False for the three rows that use `planted` directly (`:348`, `:361`, `:374`). In `:361`, for example, about 32 MiB of zero bytes before the last line is one line, carried and decoded. Only `padded` breaks the zeros.

T4. `transcript-routes.ts:234`, "The answer goes out at once": see B1.

T5. `src/lib/server/sessions/stores/transcripts.ts:176`, `export function foldFrom(`. The step adds it to the unused-exports line, so it now has no importer outside its own file and its tests. The spec's rule is "removed or made local". The report quotes the line and keeps the export because G40's tests import it. The rule was not followed literally, for a stated reason; the orchestrator decides, and the report's reason looks sound to me, since the `piece` and `limit` arguments the G40 tests need exist only on `foldFrom`.

T6. Ledger text, the orchestrator's.
- G148's Test line names a file and no title, while the spec has an entry name its test "by file and title". The titles are the describes 'a first read of the transcript route' and 'a read of a file of several pieces'.
- G148 says "never holds the server's thread for the whole file" while sync `foldFrom` stays for the scan, which folds a file up to `MAX_FIRST_READ_BYTES` in one go.

Size limits, comment width, history words, ASCII and the head comments hold.

## Behaviour

B1. The export's head does not go out before the read.

Places:
- `src/lib/server/sessions/transcript-routes.ts:254-255`, the read inside the first `pull`:
  ```
  if (pieces === null) {
      const { turns } = await readTurns(source.path, source.tool, 0, whole);
  ```
- The comment at `:234`: "The answer goes out at once and the file is read when the body is first asked for".
- The report: "Export on a large file: the save starts at once", and judgment call 7.

Kit's `setResponse` calls `res.writeHead(response.status)` (`node_modules/@sveltejs/kit/src/exports/node/index.js:180`). Node sends nothing until the first `res.write`, and the first `res.write` follows the first `pull`, so the head waits for the whole read. adapter-node (`handler.js:164`) and Kit's dev server both use this `setResponse`. Runs A and F show it: head, first byte and end all at 781 ms for the 1.5 GiB sparse file, and head at 1837 ms of 2036 ms on the 40000-turn file.

Failure scenario: a press of Export on the 4.4 GB session shows no download for the whole read, as on the base. The look on landing, read against the report's before and after, will not see "the save starts at once". A reader who sees nothing happen presses again. That now starts a second whole read beside the first, each holding every turn in memory, where the base ran them one after the other.

The heading uses only the record and the catalog, so writing it to the stream before the read would make the statement true. Otherwise the comment and the report must be corrected.

B2. A piece can hold the thread for seconds, and the report's limitation has no figure ("The time of one piece on a real file was not measured").

Run C: a synthetic 42 MiB file of assistant turns of 6329 bytes each, with code fences, gave `mostMs` 2020 and `allMs` 7452 on a first read. The cost is the Markdown render in `saidTurn` (`stores/turns.ts:295`). It runs for every turn of the tail, and `transcript-routes.ts:147` then keeps 200.

Failure scenario: a tail of mostly assistant text answers in seconds and holds other requests for about 2 s per piece, where the plan's text says "answers at once and no other request waits". This file is a worst case: the brief's real tails hold 724 and 626 turns in 32 MiB in 77 and 68 ms (the brief's figures, not rerun, since I read no real session file). Item 1 is met on this point. It is a measurement the before and after lacks, and rendering only the kept turns would end it.

Asked points, read or run, with no finding:
- **A read answering turns from a tail while `results` patches.** The results of a pass with no turn are dropped with that pass, and the answering pass, a wider read, holds them again. `merged` maps them over the turns, and an id with no turn changes nothing (case line 10).
- **`start` from a size read before the pass.** The first pass runs in the same macrotask as `sizeOf`. On later passes a stale size only widens the read. `foldPieces` takes its own `fstatSync`, so the offset is that read's own. A file that shrank gives `size <= offset`, no turn and another pass, ending at start 0.
- **The 1-byte-early start and `insideLine`.** A start on the line feed before a line drops an empty first line and keeps the line. `start === 0` sets `insideLine` false. A size of `distance + 1` starts at 0. A tail with no line feed consumes 0 and goes on to the next pass, so no answered offset falls inside a line.
- **An abort answering offset 0.** Only `exported` passes `signal`, and `:256` discards the answer.
- **Every route read yields.** The `from > 0` read, `firstRead` and the export all go through `readTurns`, and `readTurns` through `foldYielding` (`grep` of callers).
- **`foldPieces` closes the handle on an early return.** `steps.return(0)` runs the `finally` at `:166-168`, since every `yield` sits in that `try`. Run B on a real socket: after the close, descriptors are at -1 over idle.
- **`transcriptPieces` and `markdownStream`.** After the head, 15 MB and 40000 turns went out with `mostMs` 30 over http (run F). The bound comes from the socket's backpressure (`res.once('drain', next)`). With no socket, one `pull` per turn is microtasks only.

## Declined to judge

- The report's per-test run on unchanged `src` ("Tests 8 failed | 31 passed (39)"). It would mean putting base code under the new tests, and the no-breakage rule forbids a revert of the code under test to watch a test go red. The case-run on `O116-base` above is the evidence I took instead, and it agrees.
- A real 4.4 GB or 111 MB session, and the browser's download UI. I read no real session file and started no page. B1 is measured on the wire, and what the browser draws is for the look.
- How often a real tail reaches B2's density.

Reviewer usage: ac59e50ab136fc546, claude-opus-5-5, usage from the completion notice to follow.
