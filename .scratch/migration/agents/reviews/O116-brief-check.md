# Brief check of O116, the transcript's first read

Tree read: oculus main at 4e4e1cc23 (`git rev-parse --short HEAD`). Nothing changed: `git status --short` lists the same three paths before and after this check. The case-run programs I wrote live only in the session scratchpad. They read two real session files, read-only, and print counts and timings. Neither port was touched and `config/local.yml` was not read.

Three findings stop the step or leave the goal unproved:
- F1: Cases 1, 4, 5, 6 and 7 cannot fail on the unchanged tree.
- F2: the doubling and every read with `from` above 0 stay synchronous.
- F3: the brief asks for tests that no `guarded.md` entry covers, so the builder must stop under the rules file.

## Names

Command: `grep -rnI --exclude=local.yml ... src tests config docs README.md bin utils`, under bash.

**FIRST_READ_TURNS**
- Three hits, all in `src/lib/server/sessions/transcript-routes.ts` (lines 27, 101, 105), which is on the write list. There are no hits elsewhere.
- `sh utils/unused-exports.sh` already lists it at the base: `transcript-routes.ts: FIRST_READ_TURNS, exportName`. So it has no importer today.

**FIRST_READ_BYTES** (new name)
- No exact hit. It matches as a substring `MAX_FIRST_READ_BYTES` at `src/lib/server/sessions/cache.ts:75` and `transcripts.ts:20,301`, and `maxFirstReadBytes` at `transcripts.ts:73`.
- That constant is a different limit (256 MiB, when the scan stops folding a file). The change makes nothing false, but "first read" then carries two meanings. The comment on the new constant should say which one it is.
- If it is exported and no test imports it, it adds a line to `unused-exports.sh`, a finding under the rules file. It should be local or imported by the test.

**handleTranscript becoming async**
- Hits: `transcript-routes.ts:72`, `src/routes/api/(sessions)/transcript/+server.ts:6,11`, `tests/server/sessions/transcript-routes.test.ts:15,176`. All are on the write list.
- `+server.ts` passes the value through, and SvelteKit's handler accepts `MaybePromise<Response>` (`node_modules/@sveltejs/kit/types/index.d.ts:921`).
- The test helper at line 176 reads `response.status` straight away, so it needs an `await`. It is the only caller, and that file is on the list.

**The route `/api/transcript`**
- Hits outside the write list: `src/lib/state/sessions/transcript.svelte.ts:4,174` and `src/lib/state/sessions/agents.svelte.ts:85`. The wire shape is unchanged, so none of these is made false.
- Two comments in that same state file are made false, and a third is misleading (F4).

**readTurns and foldFrom**
- `grep -rlE` gives `transcript-routes.ts`, `stores/turns.ts`, `stores/transcripts.ts`, `tests/server/sessions/transcripts.test.ts`, as the brief says. All are on the list.

**F4, a missing path on the write list.** These comments in `src/lib/state/sessions/transcript.svelte.ts` go wrong, and that file is not on "Paths this step writes":
- Line 198, "The first call for a session asks the server for the whole file": false after the step.
- Line 165, "or from the start when nothing is held": `from=0` then means the tail.
- Line 271, "fetches from the start again": same.

A sentence a change makes false is a defect of the change. Item 5 only asks about pages. The fix is a comment-only widening, so it is internal under ruling 374 (a).

**Docs.** A grep of `docs`, `README.md` and `config` finds no page that says a first read reads the whole file. Item 5 will change nothing in `docs/HELP.md`. Lines 341 and 454 to 459 stay true. `DESIGN.md` does not exist (`ls`).

## The step line

Every part is present in "What to build":
- The tail read, bounded in bytes: item 1.
- In place of the whole file, `transcript-routes.ts:100`: item 1 and the premises.
- The offset stays the file's end and a later read appends: item 1, Case 2.
- The export gives the thread back between pieces: item 4.

One part is present but not delivered. "opening a session of any size answers at once and no other request waits" is contradicted by the sync doubling in item 1 (F2). `plan.md` has no Goal section: `grep -n '^#'` gives Plan, Steps, Could run in parallel, Rulings, Agents, Blocked. I used the goal your prompt states. Ruling O116 is at `plan.md:3413`.

## Premises

**Hold**
- Line 11: `transcript-routes.ts:72`, `:100`, `:27` (value 200). `grep` confirms.
- Line 12, locations and mechanism: `turns.ts:161`, `transcripts.ts:97`, `openSync` and `readSync`.
- Line 13: `transcripts.ts:165` and `turns.ts:174`.
- Line 14: `transcript.svelte.ts:168-175`, and `open-session.ts:69`, `SessionList.svelte:241-243`, `HELP.md:455` for the selection. The client always sends `from`, so "no offset" on the wire is `from=0`. The brief's "from 0" is the correct form.
- Line 16: `exported`, line 200.
- Line 17: `grep -rl`, as above.
- Line 15, re-measured on the 112203055-byte session with `o116-longest.mjs`: `last 8 MiB: 1923 lines, ~184 user/assistant, longest 164539`; `last 32 MiB: 5353 lines, ~579 user/assistant, longest 1119979`. Exact.
- Decision 1, "well under a second", with `o116-tail.mjs` calling the real `readTurns`, load 4.5:
  - `size 4385681810 last 32 MiB: 724 turns (82 said), results 0, offset-size 0, 77 ms`
  - `size 112203055 last 32 MiB: 626 turns (98 said), results 1, offset-size 0, 68 ms`
  - The 4.4 GB tail also holds more than 200 turns, so the bound is good on the file that froze the server.

**F5, not reproduced: line 12, "the page got no answer for minutes".** The sync whole read does not account for minutes. With `/usr/bin/time -l node o116-export2.mjs` on the 4.4 GB file, whole `readTurns` with no cap:
- `{"size":4385681810,"seconds":10,"turns":105300,"chars":23537024,"heapHeldMiB":108,...}`, `10.46 real`, max RSS 575 MB, load 4.5.
- The 111 MB file takes under 1 s (`"seconds":0`), so that read could not freeze a page for a visible time.
- The cache is not the cause either: `~/.oculus/transcript-cache.json` is 403837 bytes, parse 2 ms, stringify 1 ms, 8 entries, with no entry for the 4.4 GB session (`o116-cache.mjs`).

My judgment is that the block is real but about 10 s here. The rest of the minutes came from machine load (15-minute load about 18 at the time of this check) or from something this step does not change. Only a run on a live server would settle that. The `sample` run cannot be repeated from here.

Consequence: the step's tests passing would not show the freeze is gone. At landing the orchestrator should open the 4.4 GB session on a scratch server while a loop pings another route, and quote the longest gap.

## Cases and checks

Read against `agents/spec.md`.

**F3, a stop for the builder.** The brief asks for eight kept tests. The rules file says a test exists only as the test of a `guarded.md` entry, and a step that needs a new entry stops and asks, writing no test until it is ruled.
- G84 (`guarded.md:64`) is about which file the route reads.
- G40 (`:116`) is about a transcript read whole in pieces and the next read's offset.
- The tail bound, the partial line, the doubling, the export's bytes and the yield are in neither text.

The orchestrator must extend an entry or add one, naming files and titles, before dispatch. Under automode this is a guarded entry's wording, which it closes itself. G40's "read whole in pieces" should also say the first read is the exception.

**Inconsistency with the brief's own rule.** Verify item 2 says a test of an added behaviour fails on the unchanged tree. Cases 1, 4 and 5 are added behaviours but pass there (next section). "When the first run finds a case the brief's own rules get wrong, the builder stops" would then trigger, so the wording should be fixed before dispatch.

**Case 4's fixture.** "One line that is not a turn" with a sparse hole is a broken line of NUL bytes, not a parseable record. Both give no turn, so it is acceptable. It should be chosen knowingly.

**F6, no base copy named.** `orchestrator-state.md:128` requires every brief to name, under "What is on the tree":
- a base copy `.agents/worktrees/<step>-base/` with `unused-exports.txt`
- the doc paragraphs and head comments that describe the behaviour

O116 names neither, nor a worktree, while the first task needs "the unchanged tree" and the builder may not run `git log` or `rev-parse`. O115's brief also names none (grep), so it may arrive in the builder prompt. It must arrive somewhere. The grep results above and F4 supply the paragraph list. The head comments are those at `transcript-routes.ts:21-26,68-71,101-104`, `turns.ts:153-160`, `transcripts.ts:84-96`.

**Asks about a place the step does not change:** none. Case 2 and Case 3 are preserved behaviour and say so implicitly. Verify item 1 is consistent with the rules file. Nothing asks for breakage testing.

## The question

Could it pass without the goal being reached?

**F1: yes for Cases 1, 4, 5, 6, 7.** The unchanged tree gives each of them the same answer.
- Case 1: yes. The whole read answers the last 200 in order with `offset` equal to the size, so the test passes with no bound. Fix: a turn just before the start must be absent while the tail holds fewer than 200 turns (Decision 2), or an assertion on the bytes read.
- Case 2: yes, but it guards the offset, not the block. Needed as it stands.
- Case 3: yes, the same. Needed as a regression guard.
- Case 4: yes. The whole read also returns turns, so a build with no bound passes. Fix: a turn further back than the doubled start must be absent.
- Case 5: yes. "No broken turn, no throw" holds for a read that never starts inside a line. Fix: assert the cut line's turn is absent and the lines after it are present.
- Cases 6 and 7: yes, same as Case 1. "Bounded the same way" needs the same head turn.
- Case 8: yes, not goal-related; it guards the missing-file path (`statSync` throwing).
- Case 9: yes, by design. It guards the bytes.
- Case 10: yes.
  - It does fail on the unchanged tree: `o116-macro.mjs` prints `setImmediate fired before text() resolved: false`, and the same for `setTimeout0`, so a Response body alone yields no macrotask.
  - But one yield anywhere passes it, before the read or after it, while the thread is still held for the whole file.
  - Fix: count macrotask turns during the read and require at least pieces minus 1. Define "ends" as the body read to its end, since the read may move into the stream.

Items:
- Item 1: yes, see F2.
- Item 2: nothing to prove in code. `foldLine` already drops it (see below).
- Item 3: no case exists (see Implied inputs).
- Item 4: yes, as in Case 10.
- Item 5: no effect on the goal.

**F2: item 1 can leave the server blocked.** The doubling runs on the sync `readTurns`.
- A tail with no turn of size N costs 32 + 64 + ... + N MiB of sync parsing, about twice a whole read of N.
- On a large file with no turns at all it reads everything, twice over, on the thread. That is the failure the step exists to end.
- It did not fire on the real data: on the 4.4 GB file `maxGapBetweenTurnRecordsMiB: 2.1` (`o116-scan.mjs`). But "of any size" has no exception for it.

Fix inside the step's line: run the doubling on the yielding piece loop item 4 builds, reading only the new range or re-reading with yields. `handleTranscript` is already allowed to be async, so this adds no path. If every route read then uses it, `readTurns` keeps only test callers and the "keep their synchronous forms" sentence of item 4 changes.

**A read with `from` above 0 is sync and uncapped.** See Implied inputs. The brief says it is unchanged.

**Partial line claim in item 2 holds.** `o116-suffix.mjs` tried 494674 cuts of 442 lines, adversarial nested JSON lines and real ones, and printed `maps: 0, scalars: 0`. The reason is JSON, not `foldLine`: a suffix has unmatched closers, or an odd count of raw quotes. A start exactly on a line boundary keeps that whole line, which is correct.

**Export pieces.** On the 4.4 GB file `maxPieceMs: 35` (parse only), `maxLine: 2072529`, `linesOver10MB: 0`. So the per-piece yield leaves gaps of tens of ms. A single line near Node's string limit would still block for its own parse. That has not happened on this file and is outside Decision 3's scope. My concern that a whole-file export would run the heap out of memory is settled: 108 MiB held for this file against a heap limit of about 4.2 GiB.

## Implied inputs

**The client after a mid-file first read**
- **Results map.** An orphan result is real: the 111 MB tail gave `results 1`, 8 MiB gave `results 7`. Server: `turns.ts:196-199` puts it in `answer.results`, no throw. Client: `merged` in `transcript.svelte.ts:155-160` looks up only held turns, so nothing changes. A later result for a call before the start is the same. Expected: as today. Item 3 has no case and no test reads `results` from `readTurns` (`grep -rn` over the session tests). Add a run case, not necessarily a kept test: a result in the tail with no call, plus a call in the tail with its result in the next read.
- **Follow.** The first read lands at the last line feed. `follow` only notes the first mark (`:229`) and asks again when it lands, so nothing is lost. Correct if the offset is the one `readTurns` returns (next item).
- **Keep-alive.** The query client holds with `gcTime: Infinity`, `staleTime: Infinity` (`queries.svelte.ts:9,49`) while `showing` counts a viewer. When the last viewer closes, `forget` drops the offset and the next open is a bounded first read. Correct. The `tail` fetch sets no keepalive flag; there is no HTTP keep-alive concern.

**F7, a last line with no line feed.** The session being written always can end in a partial record, and the 4.4 GB file is live. Item 1 and Case 1 say `offset` is "the file's end" or "the file size", while premise line 13 says the end of the last whole line. If a builder takes `statSync(...).size`, the next read starts inside that record and a turn is silently lost. Expected: `offset` is the value `readTurns` returns, and the completed line arrives on the next read. Reword item 1 and add this input to Case 2 as a variation of an existing case.

**F8, a hidden tab shown after long growth.** A tab that keeps its held offset asks once when shown (`transcript.svelte.ts:218-219`). A read with `from` above 0 is sync and uncapped, so the gap blocks the thread at about 2.3 ms per MiB (10 s for 4.4 GB), and it can answer tens of thousands of turns. This is "opening a session" in the reader's sense. It adds a case beyond the line's "appends as it does today", so it goes through automode as an open item. Recommended: use the yielding loop for all route reads. Leaving it sync is the lazy option.

**The Timeline section and other readers of the same turns**
- Unaffected. `SessionDetail.svelte:68` reads `record?.timeline` from the sessions channel, never `/api/transcript`.
- The only client of the turns is `TranscriptBody.svelte:83` (`turnsFor`). The only other user of the route is `exportSession` (`agents.svelte.ts:149`).
- Separate concern, no action here: the 4.4 GB session has no cache entry and `transcripts.ts:253-257` gives it an unfolded record. So its Timeline and agent list are empty with or without this step, and no view reads `truncated` (`grep`).

**A file that grows during the read.** Expected:
- `foldFrom` fixes `size` once per read, so the answer ends at the last line feed before that size and the next read continues with no gap or duplicate.
- Each doubling pass is self-contained, so the answer takes turns, results and offset from one pass only and never mixes them.
- The export keeps its size from the start, or at least never breaks on growth. A shrink ends at `got <= 0`.

**A client that goes away, and two presses of export.**
- The rules file requires in-flight, after-close and superseded to be stated.
- If the read is awaited in the handler, it runs to the file's end for a gone client, and the browser sees nothing until then, as it does today.
- If the read runs in the stream's `pull`, a cancel stops it and the headers go at once.
- Two presses run two loops with no shared state, provided the buffer stays local.
- The report must state these. I recommend the `pull` form, but that is an internal choice.

**Boundaries.** A file of exactly 32 MiB starts at 0. At 32 MiB plus 1 byte it starts at 1 and drops the first line (Decision 2). A `format` other than `markdown` is a normal first read, as now. An empty tail after the start and a missing file must not throw on the stat (Case 8).

**Decision 2 is user-visible.** A session with a thin tail shows few turns with no sign of older ones. The real tails hold 724 and 626 turns, so it is rare. It belongs in the report's before-and-after.

**Reader digest.** `turns.ts` and `transcripts.ts` are in `READER_FILES` (`cache.ts:31-36`), so the step discards `transcript-cache.json` on the next start and re-folds it once. With 8 entries this is cheap, and it is expected of any change to those files.

## ADRs

`ls docs/adr` prints `No such file or directory`. Confirmed, and the brief says the same.

## Dictated text

None. The brief dictates no file text. "This session has no turns yet." quotes the catalog line `sessions.turns_empty` (`config/text/views/sessions/transcript.yml:18`), and the comment on `FIRST_READ_TURNS` is described, not given.

## Declined to judge

- Why the page gave no answer for minutes beyond the roughly 10 s read: that needs a run on a live server (F5).
- Which findings the orchestrator closes into the brief and which go to Axel. My reading under the standing demand "A brief check never widens a step":
  - F1, F2, F6, F7 and the Case 10 wording are inside the line.
  - F4 is an internal widening under ruling 374 (a).
  - F3 is a guarded entry's wording for automode.
  - F8 adds a case, so it is an open item.
- Codex rollouts over 32 MiB: none exists on this machine above 60 MB (`find ~/.codex/sessions -size +60M` lists none), so Case 7 was read, not measured.

Usage: a688991a207f1775e, claude-opus-5-5, 190927 tokens, 20 tool uses, 9 min 34 s.

## Closed

- F1: cases 1, 4, 5, 6, 7 and 10 rewritten so that each fails on the unchanged tree.
- F2 and F8: item 1 now puts every route read on the yielding loop, the doubling and a read from an offset included. Closed in the brief as Z1105.
- F3: G40 widened and G148 added in `agents/guarded.md`; the brief names them. The brief's rule on tests of added behaviour now matches its cases.
- F4: `src/lib/state/sessions/transcript.svelte.ts` added to the paths, comments only.
- F5: the brief's premise reworded to the measured 10 s and machine load; a look at landing added.
- F6: base copy named, paragraphs and head comments listed.
- F7: item 1 and case 2 say the offset is the one the read returns, with the no-line-feed input added.
- Names: the new constant is local and its comment says how it differs from MAX_FIRST_READ_BYTES.
- Implied inputs: orphan result, growth, client gone, two exports added to the cases.
