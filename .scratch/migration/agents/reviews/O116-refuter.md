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

Reviewer usage: ac59e50ab136fc546, claude-opus-5-5, 208975 tokens, 23 tool uses, 11 min 27 s.


## Repair round 1, refuted

### Run over round 1

Run from `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O116`. `git status --short` compared with its copy from before the first run printed no difference, three times. My programs are in `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o116r2/`, outside any tree.

One item stands against landing: B1. The render moved out of the fold, so a turn the render cannot take now fails the whole request with a throw, where the base answers 200. Round item 2's "for any input stays byte-equal" does not hold, and the report's "All nine items are closed" is false for that item.

## Verification lines, verbatim

`npm run test:quick`:
```
ok      prettier (0.8 s): All matched files use Prettier code style!
ok      ASCII gate (0.9 s)
ok      svelte-kit sync (2.7 s)
ok      eslint (3.6 s)
ok      svelte-check (14.5 s): 1793621261366 COMPLETED 580 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (44.5 s): Duration  27.91s (transform 49.17s, setup 0ms, import 86.18s, tests 5.14s, environment 824ms)
ok      vitest slow (51.0 s): Duration  34.13s (transform 19.26s, setup 0ms, import 26.21s, tests 9.77s, environment 1ms)
ok      vitest checks (71.3 s): Duration  54.52s (transform 20.79s, setup 0ms, import 41.45s, tests 119.03s, environment 4ms)
test:quick: 74.2 s; every command passed
```

`npx vitest run tests/server/sessions/transcript-routes.test.ts tests/server/sessions/transcripts.test.ts --reporter=verbose`:
```
 Test Files  2 passed (2)
      Tests  43 passed (43)
```
The route file alone: `Tests  28 passed (28)`.

The programs quoted in the report were extracted from the report and run on the worktree. `o116-cases.mts` and `o116-cases-export.mts` equal the scratchpad files. `o116-round1.mts` differs from the scratchpad file only by a 3-line head comment (`diff`).

`o116-cases.mts`:
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
11 growth: {"appended":5,"firstOffsetPastStartSize":0,"firstEndedBeforeSizeAtEnd":true,"everyLineOnceInOrder":true}
12 export: {"status":200,"length":224,"digest":"67cafa258a57a43b62368598f7ef3cc9efa79b7184ab2360465805cc9a73de23","disposition":"attachment; filename=\"a-title.md\""}
13 macrotasks, 5 pieces, least 4: {"export":4,"fromOffset":4}
```

`o116-cases-export.mts` (the bytes of the value in line 2 elided by me; the report says this line now stops at the heading):
```
unread body, descriptors over idle: 0 locked: false
left in flight, descriptors over idle during: 0 after: 0 read answered: {"value":{"0":35,"1":32, ... },"done":false}
two presses equal: true length 145 digest a8d1d0f85ca1ed9d descriptors over idle: 0
```

`o116-round1.mts`, worktree:
```
rendered first read 120800 f0adfc0d2b837f48
rendered read from an offset 132902 01ee8776bd6d2504
rendered codex 292 77106f54606b4321
dense file bytes 42404300 a line 6329
dense, first read {"mostMs":14,"allMs":370}
dense, read from an offset {"mostMs":712,"allMs":9835}
dense, export {"mostMs":49,"allMs":102}
left in flight: head chunk 90 descriptors over idle after head 0 during the read 1 after leaving 0 pending read {"done":true}
```
The same program on `../O116-base`, first three lines:
```
rendered first read 120800 f0adfc0d2b837f48
rendered read from an offset 132902 01ee8776bd6d2504
rendered codex 292 77106f54606b4321
```

`o116-review.mts`, worktree:
```
A export over http, 1.5 GiB, ms to response head, first byte, end: {"head":18,"first":18,"end":574}
B socket closed in flight, descriptors over idle during: 2 after: -1
C heavy file bytes 42404300 a line 6329
C first read, heavy: {"mostMs":29,"allMs":397,"ticks":54}
  answer bytes 195724725
D read from offset 1, heavy (uncapped answer): {"mostMs":18,"allMs":9607,"ticks":1679}
E giant line of 100 MiB, first read: {"mostMs":24,"allMs":123,"ticks":24}
E giant line of 400 MiB, first read: {"mostMs":20,"allMs":474,"ticks":110}
```

`o116-review2.mts`, worktree:
```
E one line of 16 MiB, bytes 18591245, first read: {"mostMs":23,"ticks":2,"allMs":34,"answer":22393}
E one line of 64 MiB, bytes 74364160, first read: {"mostMs":74,"ticks":20,"allMs":107,"answer":22393}
E one line of 256 MiB, bytes 297455779, first read: {"mostMs":296,"ticks":95,"allMs":450,"answer":22394}
F file bytes 18920000 turns 40000
F export over http: {"headMs":78,"endMs":201,"bytes":15000091,"afterHead":{"mostMs":12,"ticks":23}}
```

`sh utils/unused-exports.sh` against `../O116-base/unused-exports.txt`:
```
114c114
< src/lib/server/sessions/stores/transcripts.ts: DEFAULT_WINDOW_DAYS, DEFAULT_MAX_SESSIONS, toolOf, readSession
---
> src/lib/server/sessions/stores/transcripts.ts: DEFAULT_WINDOW_DAYS, DEFAULT_MAX_SESSIONS, foldFrom, toolOf, readSession
```

Other reruns:
- `grep -n 'STORE' tests/server/sessions/transcript-routes.test.ts` printed nothing.
- `LC_ALL=C grep -n '[^ -~]'` over the six files printed nothing.
- `wc -l`: 442, 350, 280, 294, 620, 294, equal to the report.
- The report's name grep and its `file:line` citations (`turns.ts:168`, `:304`, `transcripts.ts:101`, `transcript-routes.ts:96`, `:143`, `:149`) match.
- The history-word grep over the round's added lines gives three hits, each a position in a file.

My programs:

`probe.mts`, both trees. The corpus holds a reference definition in one turn with its use in the next, fences of three languages, a turn cut at 20000 inside a fence, a cut through a surrogate pair, a table, raw HTML, a blank turn and a NUL.
```
corpus first read status 200 turns 19 offset 57956 bytes 206784 94c9f0779b4431e7
corpus from offset status 200 turns 18 offset 57956 bytes 206687 bbbb634f279797b5
corpus codex status 200 turns 9 offset 56786 bytes 205814 370ca84e2a8ff967
```
The Markdown that recursion does not survive, base then worktree:
```
base:      deep gt status 200 turns 1 offset 126 bytes 135 f5a4ad5b7e4c215d
worktree:  deep gt THROW RangeError: Maximum call stack size exceeded
```
The same for `gt space`, `dash`, `star` and `one dot`. `bracket`, `bang`, `stars`, `under` and `nested indent` gave equal digests on both trees.

`depth.mts`:
```
worktree: depth of "> ": fine at 2495, fails at 2500
worktree: depth of "- ": fine at 1245, fails at 1250
worktree: depth of "1. ": fine at 1660, fails at 1667
worktree: first read: THROW RangeError: Maximum call stack size exceeded
worktree: read from offset 1: THROW RangeError: Maximum call stack size exceeded
base: depth of "> ": fine at 2495, fails at 2500
base: depth of "- ": fine at 1245, fails at 1250
base: depth of "1. ": fine at 2479, fails at 2486
base: first read: status 200 turns 1 offset 126
base: read from offset 1: status 200 turns 0 offset 126
```

`last.mts`:
```
worktree: export of a file holding a turn the render cannot take: length 18200 holds after: true
base:     export of a file holding a turn the render cannot take: length 107 holds after: false
worktree: four turns of *a repeated, first read: mostMs 9949 bytes 160447
```

`slow.mts`, one render on the worktree: `star a 2218 ms`, `under 239 ms`, `link 91 ms`; the other nine patterns 14 ms or less.

`p1.mts`, on the fixture of the row 'a start inside a line drops that line though its end alone parses':
```
first read (drop on): ["after the cut"]
read from the same byte 8388607, no drop: ["the end of a line","after the cut"]
```

## Verdicts: What to build

1. Reads on the server yield: holds. "No more than one piece" is subject to the limits the round ruled stated (a long line, the pass boundary, `JSON.stringify`), and to B2, which the report does not state.
2. A bounded first read: violated, for one input class (B1). The tail, doubling, single pass, cap and offset hold.
3. A read that starts inside a line: holds.
4. Results of earlier calls: holds.
5. The export: holds. On the case the bytes are equal (67cafa25). On B1's input they differ from the base because the base truncates at that turn, so "every turn" and "the same bytes" cannot both hold there, and the tree takes "every turn".
6. Comments of `transcript.svelte.ts`, HELP: holds. That file has no delta in the round.

## Verdicts: Cases

- First read above 32 MiB, marked head: met.
- Next read after an append: met.
- Last line with no line feed: met (preserved, under the round 0 ruling).
- Under 32 MiB, turn for turn: partial. Met on the case's input and on my corpus. A file under 32 MiB holding a turn at B1's depth gives a throw where the base gives 200.
- No turn in the last 32 MiB, one 40 MiB back: met.
- Start inside a line: met. The proof is now separating (see `p1.mts`).
- Subagent over 32 MiB: met.
- Codex rollout over 32 MiB: met.
- Empty file, missing file: met.
- Result with no call, call with a later result: met. The patch itself is `merged`, read and not run.
- A file that grows during a read: met (`appended` 5).
- Export of several pieces, same bytes: met.
- Macrotasks, export and read from an offset: met (4 and 4).

## Verdicts: Round items

1. B1, P2, T4 (head before the read): closed. Run A gives head 18, end 574; run F gives head 78, end 201; digest 67cafa25. The test 'sends the heading of an export and only then reads the file' reads as a proof of the order.
2. B2 (render after the cap): partial. `mostMs` 14 and 29 and the digests reproduce. "For any input stays byte-equal" is false (B1).
3. P1: closed. The row's form differs from the one the round named, and the report says so. Its reason is right: with the read beginning on an `x`, the rest does not parse. `p1.mts` shows the same byte read with no drop answers the turn, so the row separates `insideLine` from the broken-line skip.
4. P3: closed.
5. T1: closed.
6. T2: closed.
7. T3: closed.
8. S1: closed. My rerun gives 74 and 296 against the report's 77 and 311.
9. T5: closed.

## Spec

S1. `tests/server/sessions/transcript-routes.test.ts:479-487`, the extra test table:
```
it.each([
    { name: 'a first read', query: () => '' },
    { name: 'a read from an offset', query: () => `&from=${MARKED.length}` }
])('renders the Markdown of an assistant turn $name answers', async ({ query }) => {
```
- It is outside the nine items, and no entry of `guarded.md` states this guarantee.
  - It sits in a describe that G148 names, but G148 says what a read does to the thread.
  - G40 is about pieces, and G84 about which file is read.
  - G148's Code line does not name `stores/turns.ts`, where `renderTurns` lives.
- The spec says a builder writes no other test, and that a step needing a new entry stops and asks Axel.
- The report discloses the table under "Repair round 1" but does not raise it as a decision, and it is not in "Judgment calls".
- The test itself is sound: it would fail if a route forgot `renderTurns`, a loss that otherwise yields empty HTML silently. The decision for the orchestrator is to widen an entry or delete the table.

Failure scenario: a table no entry names stays in the suite with no guarantee to judge it against, and the render it guards can move again with no entry saying it must hold.

## Proof

P1. Round item 2's "any input" is proved by digests over benign Markdown only (report, "The digests of answers with rendered turns are equal"). No row or run holds a text the render cannot take, and the render's failure is the one path that changed. The fold's `catch` covered it, and nothing covers `renderTurns`. See B1.

P2. The report's "All nine items are closed" does not reproduce for item 2.

No widened threshold, no removed assertion in the round's delta (its `-` lines are the head comment, `let STORE`, `STORE = store` and the subagent path), and no finding closed by removing a check. The case program's "left in flight" line lost its reach, the report says so, and `o116-round1.mts` holds the case with descriptors.

## Standards

T1. Judgment call 10's reason is false as a bound: "a turn is cut at 20000 characters, so four turns are a short stretch". See B2.

T2. Comments rewrapped with a line that ends one word short, against "no line inside a sentence ends short". Line length plus the next word fits 100 in each:
- `stores/turns.ts:19`, 74 columns, next word `(data/prose/languages.ts,`.
- `transcript-routes.ts:34`, 96 columns, next word `and`.
- `transcript-routes.test.ts:391`, 95 columns, next word `the`.

`tests/checks/source/comment-width.test.ts` passes over them.

T3. `transcript-routes.test.ts:391`:
```
// The line as a whole does not parse, and read from the start it would: JSON takes
```
"The start" here means where the read starts, right after a clause about the line as a whole. A reader takes "it would" for a contradiction. Naming the read's start (`START - 1`) says it.

T4. `transcript-routes.test.ts:480-481`, `query: () => ''`. The thunks do nothing: `MARKED` is a module constant, and the table below at `:548-549` uses plain strings for the same query.

T5. `src/lib/data/model/model-sessions.ts:72-73`, "`html` is the rendered Markdown of an assistant turn and the empty string on every other role". An assistant turn from `readTurns` now holds `''` until `renderTurns`, and those of an export always do. The report's paragraph table does not list this comment. It stays true of what the page draws, and the file is outside the write list. The sentence is still inaccurate of the type it documents.

## Behaviour

B1. A turn the render cannot take fails the whole read.

Place: `src/lib/server/sessions/stores/turns.ts:304-311`, reached from `transcript-routes.ts:143` and `:149`:
```
if (turn.role === 'assistant') turn.html = marked.parse(turn.text, { async: false });
```
What is wrong:
- At the base and at round 0, `saidTurn` ran inside `apply`, so a throw reached the `catch` of `foldPieces` (`stores/transcripts.ts:164-165`, "A failure after some lines answers the bytes consumed up to it").
- `renderTurns` has no such guard, so a `RangeError` from marked's recursion rejects `handleTranscript`.
- `depth.mts` shows it at `"> "` 2500 times (5000 characters), `"- "` 1250 times (2500 characters) and `"1. "` 1667 times, all below the 20000 cap.
- The `"1. "` depth is lower on the worktree (1667) than on the base (2486), so the render's stack is not the same either.
- The route and Kit's error handling were not run; the client path is by reading.

Failure scenario: an assistant turn with such nesting among the last 200 turns of a session.
- First read: the rejection becomes a failed answer, and `tail` in `transcript.svelte.ts` keeps nothing, so the Transcript shows an error and no turns. The base shows the turns before that line with status 200.
- A read from an offset whose bytes hold the turn fails the same way on each sessions message, since the offset does not move.
- The base has its own defect here: its read stops at that line and the later turns never arrive.
- Byte-equality with that behaviour would mean keeping the stop. A guard in `renderTurns` ends the failed answer but gives a different answer from the base, so what the turn shows is a choice to rule on.

B2. A render stretch can hold the thread for seconds, and the report states no such limit.

Place: `stores/turns.ts:39` and `:308`:
```
const RENDER_TURNS = 4;
if ((index + 1) % RENDER_TURNS === 0) await nextMacrotask();
```
One render of `'*a '.repeat(6666)` took 2218 ms, and a first read of four such turns gave `mostMs` 9949. The stretch is bounded by marked's cost on the text and not by the 20000 cap. The base held the thread as long or longer, and the input is contrived, so this is no regression. A macrotask after every turn costs next to nothing and divides the stretch by four.

Failure scenario: a tail with several turns of that shape holds every other request for about 10 s, where the report's Limitations state a figure of 14 for this path.

Asked points, read or run, with no finding:
- **Byte-equal in every route, a cut turn included.**
  - `renderTurns` reads `turn.text`, which `saidTurn` set to the cut text, and nothing writes `text` after that (`turns.ts` read whole).
  - Every assistant turn comes from `saidTurn`; `toolTurn` is role `tool`.
  - Digests are equal on both trees for the report's three files and my corpus, which has a cut inside a fence and through a surrogate pair. The exception is B1.
- **Other readers of `html` or `saidTurn`.**
  - `readTurns` has the two callers of `transcript-routes.ts` plus `transcripts.test.ts`, and that test file holds no `html` assertion (`grep`).
  - `saidTurn` is local.
  - Subagent reads take the same branches of `handleTranscript`.
  - The only reader of a turn's `.html` under `src/lib/views`, `src/lib/state` and `src/lib/server/sessions` is `views/sessions/terminal/transcript/turn-rows.ts:140`, fed by the route.
  - `agents.svelte.ts` only forms the export's URL.
- **`new Marked` per call.** There is no state across parses: my corpus has a definition in one turn and its use in the next, with equal digests. The instance is per call, so no module state is added.
- **Async generators on cancel.**
  - `cancel()` aborts, the read ends at its next piece and `foldPieces`'s `finally` closes the file (run B, `left in flight`).
  - `pieces.return()` is not called, and neither generator holds a resource. The suspended generators hold only memory until the stream is dropped (read, not run).
  - `left.signal.aborted` sits after the `await`, so no `enqueue` or `close` reaches a cancelled stream.
- **A client gone during `renderTurns`.** Nothing stops the render. It does not matter: the work is at most 200 turns on a first read, it gives the thread back, and it holds no file. The dense case took 370 ms in all.
- **`hooks.server.ts`.** It calls `resolve` with `transformPageChunk` only; no `.text()`, `.clone()` or `new Response` around a body (`grep`). I read this and did not run the real server.
- **Fix beyond its finding.** Only S1.

## Declined to judge

- How often a real assistant turn reaches B1's depth or B2's shape. I read no real session file.
- The real route's 500 and what the Transcript draws for it. I started no server and no page; the throw is measured at `handleTranscript`.
- The report's "Tests 1 failed | 27 passed (28)" on the code before items 1 and 2, and the render table passing before item 2. They would mean putting old code under the new tests. The 28 agrees with the file's count now.
- Whether a real 4.4 GB or 111 MB session behaves as the synthetic files do.
- Whether the render table is kept under an entry: that is the decision in S1.

Reviewer usage over round 1: a74ddb16d4ae292b0, claude-opus-5-5, 218691 tokens, 26 tool uses, 11 min 9 s.

## Closed

First run: S1, P1 to P3, T1 to T6, B1, B2 closed in repair round 1, T5 and T6 at the orchestrator's read (`foldFrom` stays exported; G148's text corrected).

Run over round 1, fixed at landing: B1 and P1 (a turn the render cannot take keeps its text as plain preformatted HTML, with a test row); B2 and T1 (a macrotask after every turn); S1 (G148 widened to the render, its Code line naming `stores/turns.ts`); T2 to T4 (comment wrap, wording, plain query strings); T5 (`model-sessions.ts` comment). P2 closed by these fixes.
