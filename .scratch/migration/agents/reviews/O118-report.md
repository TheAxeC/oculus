Everything in the brief is done, except that the look cases are not seen: a builder runs no page, so each one stands by a read at file:line below and waits for the look on landing.

## Open items of the state file (verbatim)

`grep -n '^## ' .scratch/migration/orchestrator-state.md` gives "## Open items" at line 165, and that section holds only its heading sentence:

"An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own."

No item is listed there.

## The cases' first run, on the unchanged source

Command: `npx vitest run tests/server/sessions/transcript-routes.test.ts tests/state/sessions/transcript-follow.client.test.ts --reporter=verbose`, run with `diff -rq ../O118-base/src src` printing nothing. Last lines: `Tests  23 failed | 39 passed (62)`. The line numbers are those of that run. The run found no case the brief's rules get wrong.

| Case | First run | Failing line |
|---|---|---|
| Route, 500 turns chained | fails | `TypeError: actual value must be number or bigint, received "undefined"` at `:626` (`first.head`) |
| Route, seam inside an assistant line | fails | `expected [ Array(200) ] to have a length of 202 but got 200` at `:646` |
| Route, call among the dropped turns | fails | `expected {} to deeply equal { toolu_far: true }` at `:662` |
| Route, `before=0` | fails | `expected [ { ...(6) }, ... ] to deeply equal []` at `:669` |
| Route, `before=abc` | fails | `expected 200 to be 400` at `:677` |
| Route, `before=-1` | fails | `expected 200 to be 400` at `:677` |
| Route, `before` past the size | passes, as the brief says | |
| Route, 32 MiB with no turn, a turn 40 MiB ahead | fails | `expected [ 'at the byte' ] to deeply equal [ 'forty ahead' ]` at `:698` |
| Route, an agent's transcript | fails | `expected [ 'the agent asks', ...(1) ] to deeply equal [ 'the agent asks' ]` at `:720` |
| Route, a Codex rollout | fails | `expected [ 'the rollout asks', ...(1) ] to deeply equal [ 'the rollout asks' ]` at `:720` |
| Route, unknown agent | passes, as the brief says | |
| Route, several pieces | fails on the turn it asserts | `expected '{"turns":[{"at":"2025-10-09T08:53:24....' to contain 'the head turn'` at `:616` |
| Route, oldest kept line of 9 MiB | fails | `expected undefined to be 134` at `:736` |
| Route, first read that doubled | fails | `expected undefined to be 62914560` at `:744` |
| Route, keys of the answers | fails | `expected [ 'offset', 'results', 'turns' ] to deeply equal [ Array(4) ]` at `:755` |
| Route, `from` and `before` together; `before=` empty | fails | `expected [ Array(249) ] to deeply equal [ 'turn 0', 'turn 1', 'turn 2', ...(47) ]` at `:773` |
| Store, a call's outcome from an earlier read | fails | `TypeError: store.readOlder is not a function` at `:242` |
| Store, `readOlder` twice; head 0 | fails | the same at `:260` |
| Store, tail landing first | fails | the same at `:285` |
| Store, older landing first | fails | the same at `:285` |
| Store, `forget` while a read is out | fails | the same at `:315` |
| Store, a failed read | fails | the same at `:333` |
| Store, reads chained to the head | fails | the same at `:360` |
| Store, older out, `forget`, new first read, another head | fails | the same at `:382` |
| Store, older out, `forget`, new first read, the head it asked with | fails | the same at `:382` |

The two rows that existed and changed ('an export', 'a read from an offset' of the several-pieces table) pass on the unchanged source, and they gain the assertion on a turn the several-pieces row needs. The store row 'the head it asked with' is a row added to the brief's case: see judgment call 3.

First read of each look case on the unchanged tree:

| Look case | What the unchanged tree does |
|---|---|
| More than 600 turns scrolled to the top | Older turns exist nowhere on the page: `transcript-routes.ts:149` slices, and `TranscriptBody.svelte:180-182` only keeps `stuck` |
| Keys and Copy controls stand | `TranscriptBody.svelte:220` keys by `row.first`, an index into `turns`; `turn-rows.ts:138` holds documents in a WeakMap of the turn object |
| A pressed run keeps its choice | `turn-rows.ts:118`, `runKey` uses the same index |
| Two tabs; a hidden tab | `TabView.svelte:69`, `display: none`; `queries.svelte.ts:24`, `peek` and `hold` ignore the scope |
| Opening a long session reads nothing older | `TranscriptBody.svelte:160-174` sends a first draw to the foot |
| A failed read makes one request | `transcript.svelte.ts:188` is the tail's failure path; no older read exists |
| A pre-compaction stretch reads as ordinary turns | `turns.ts:198` asks `saidByHuman`, and `fold.ts:251` refuses `isCompactSummary`, so no summary turn is made in any read |
| A rollout with no line turns says no turns yet | `TranscriptBody.svelte:212-216` |
| A list shorter than the pane | Nothing tests the top |
| A turn appended while the reader is far up | `TranscriptBody.svelte:170` returns when the reader is not at the foot |
| 200 turns or fewer in a read of the whole file | No older read exists |

## DONE / NOT DONE

Each row's proof is the third run of `npm run test:quick`, whose line is `test:quick: 62.1 s; every command passed`, or the scoped run after it, whose lines are `Test Files  3 passed (3)` and `Tests  77 passed (77)` (`npx vitest run tests/server/sessions/transcript-routes.test.ts tests/state/sessions/transcript-follow.client.test.ts tests/server/sessions/transcripts.test.ts --reporter=verbose`).

| Item | State | Proof |
|---|---|---|
| 1. A line's place | DONE | `foldPieces` hands `at` (`transcripts.ts`, `foldLine(bytes, position + start - carried, apply)`) and stops at `Math.min(size, until)`; `readTurns` fills `lines`. 'answers the first byte of a kept line that spans two pieces' passes |
| 2. A read's start | DONE | 'keeps the turns of one line in one answer...', 'answers the outcome of a call among the turns it drops', 'names exactly the fields of each kind of answer' pass |
| 3. A read before a byte | DONE | 'joins three chained reads...', 'answers no turn and head 0 at byte 0', 'refuses the byte abc with 400', 'refuses the byte -1 with 400', 'answers as a first read does for a byte past the size', 'answers a turn 40 MiB ahead...', 'takes the byte over an offset, and an empty byte as none', and the several-pieces row pass |
| 4. The store | DONE | The nine store rows pass (`Tests  77 passed (77)`) |
| 5. Rows keep their keys | DONE by read; seen at the look | `groupTurns(turns, above)`, `movedRun`, `turnDocs` by HTML in `turn-rows.ts`; `TranscriptBody.svelte` `{#each rows as row (row.first)}`. svelte-check prints `0 ERRORS 0 WARNINGS` |
| 6. The view | DONE by read; seen at the look | `TranscriptBody.svelte` `askOlder`, `shownAgain`, the two effects; `reader-place.ts` |
| 7. Comments, words and pages | DONE | The table under "Paragraphs" below; `turns_older`, `turns_older_failed` in `transcript.yml`; one line in `docs/HELP.md` |
| The look cases | NOT SEEN by the builder | "The look on landing" below |
| Decision 5, the measure of one `before` read | DONE | "The measure" below: 39 ms |
| Decision 8, a file shrunk or rewritten | DONE | Stated under "Limitations" |

After the change every kept case passes. Quoted lines of the scoped run, `--reporter=verbose`:

```
a read of a file of several pieces > gives the thread back between the pieces of 'a read before a byte' 201ms
the reads of older turns > joins three chained reads of 500 turns into the whole file, none lost or repeated 13ms
the reads of older turns > keeps the turns of one line in one answer when the seam falls inside that line 8ms
the reads of older turns > answers the outcome of a call among the turns it drops 2ms
the reads of older turns > answers no turn and head 0 at byte 0 1ms
the reads of older turns > refuses the byte abc with 400 1ms
the reads of older turns > refuses the byte -1 with 400 1ms
the reads of older turns > answers as a first read does for a byte past the size 3ms
the reads of older turns > answers a turn 40 MiB ahead of the byte when the 32 MiB there hold none 32ms
the reads of older turns > reads 'a subagent\'s transcript' up to the byte 3ms
the reads of older turns > reads 'a Codex rollout' up to the byte 2ms
the reads of older turns > refuses an agent the record does not list 0ms
the reads of older turns > answers the first byte of a kept line that spans two pieces 22ms
the reads of older turns > goes on from the line of a first read that doubled its distance 62ms
the reads of older turns > names exactly the fields of each kind of answer 3ms
the reads of older turns > takes the byte over an offset, and an empty byte as none 3ms
the reads of older turns > gives a call the outcome an earlier read saw, its turn arriving in an older read 46ms
the reads of older turns > asks once while a read is out, and nothing at head 0 60ms
the reads of older turns > holds the turns of two reads out together, 'the tail read first' landing 62ms
the reads of older turns > holds the turns of two reads out together, 'the older read first' landing 59ms
the reads of older turns > holds nothing of an answer that lands after forget 46ms
the reads of older turns > keeps the turns of a failed read, says why, and asks again at the next call 58ms
the reads of older turns > holds every turn once, in order, through reads chained to the head 70ms
the reads of older turns > applies no old answer over a new first read of 'another head' 71ms
the reads of older turns > applies no old answer over a new first read of 'the head it asked with' 72ms
```

The verify list, third run, as printed:

```
ok      prettier (0.8 s): All matched files use Prettier code style!
ok      ASCII gate (1.0 s)
ok      svelte-kit sync (2.2 s)
ok      svelte-check (12.9 s): 1793634305240 COMPLETED 580 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (13.0 s)
ok      vitest (37.2 s): Duration  20.99s (transform 32.52s, setup 0ms, import 60.69s, tests 5.80s, environment 655ms)
ok      vitest slow (43.1 s): Duration  26.70s (transform 15.55s, setup 0ms, import 21.25s, tests 6.86s, environment 1ms)
ok      vitest checks (59.8 s): Duration  43.51s (transform 15.34s, setup 0ms, import 32.37s, tests 92.86s, environment 2ms)
test:quick: 62.1 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
```

Full-list runs: 3, each right after `npm run diagrams`, and no whole-suite command. Run 1 was red on `tests/checks/tree/size.test.ts` and `tests/checks/source/comment-width.test.ts` over files the step changed. Run 2 was green, and `utils/unused-exports.sh` then showed a new line, so the change it took needed run 3. Run 3 is after the last change to code. The spec's rule allows the second run; the third is beyond what its paragraph names, and it is reported as such.

`LC_ALL=C grep -n '[^ -~]'` over the source, test and catalog files the step wrote printed nothing (`ascii exit 1`).

`sh utils/unused-exports.sh` compared with `.agents/worktrees/O118-base/unused-exports.txt`: `diff` prints nothing, exit 0. The line it printed at run 2, `src/lib/server/sessions/stores/turns.ts: TurnsAnswer`, ended when the route's `EndKept` took its shape from `TurnsAnswer`.

Grep for a helper or a name before writing, and after changing one: `grep -rn 'ResizeObserver' src` found `src/lib/ui/shown.ts`, whose `onShown` the view uses. `grep -rn 'docOf\b\|firstRead\b\|groupTurns(\|turnDocs(\|takeWords\|holdWords\|moveColumn' src tests docs README.md` gives the two definitions and two calls of `groupTurns` and `turnDocs` and no other hit in the Transcript's code; the other lines are `#docOf` of `src/lib/ui/controls/editor/kit/lsp/transport.ts` and `takeWordsOf` of `src/lib/data/shapes/boards/takes.ts`, which are different names.

History words in added comments and test titles: `grep -nEi "\b(before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package)\b"` over the added lines and `reader-place.ts` gives 24 lines, holding 20 of the word `before` and 9 of `still` and none of the others. Each was judged: `before` names the query parameter, or an order in a read or a draw ("the line before", "before a draw", "a read before a byte", "was at the foot before", which stands in the base's own comment); `still` says a line is still being written, a read is still out, a list still stands. None compares with an earlier state of the code.

## Files

From `diff -rq` against `.agents/worktrees/O118-base/` over `src tests config utils`, and `git status --short` for `docs`. Lines added and removed by `git diff --numstat`, and the size by `wc -l`.

| File | + / - | Lines | On the write list |
|---|---|---|---|
| `src/lib/server/sessions/stores/transcripts.ts` | 26 / 15 | 453 | yes |
| `src/lib/server/sessions/stores/turns.ts` | 18 / 11 | 362 | yes |
| `src/lib/server/sessions/transcript-routes.ts` | 88 / 35 | 333 | yes |
| `src/lib/state/sessions/transcript.svelte.ts` | 158 / 59 | 393 | yes |
| `src/lib/views/sessions/terminal/transcript/TranscriptBody.svelte` | 120 / 21 | 502 | yes |
| `src/lib/views/sessions/terminal/transcript/turn-rows.ts` | 57 / 25 | 176 | yes |
| `src/lib/views/sessions/terminal/transcript/reader-place.ts` | new | 102 | NO: the view passed 520 lines (557 at the first list, refused by `tests/checks/tree/size.test.ts`), and `spec.md` says such a file is split by concern in the step |
| `config/text/views/sessions/transcript.yml` | 2 / 0 | 21 | yes |
| `docs/HELP.md` | 1 / 0 | 614 | yes |
| `tests/server/sessions/transcript-routes.test.ts` | 223 / 14 | 838 | yes |
| `tests/state/sessions/transcript-follow.client.test.ts` | 229 / 1 | 398 | yes |
| `docs/diagrams/layer-views.dot`, `.svg`, `layers.dot`, `.svg` | 1 / 1 each | | NO: `npm run diagrams` rewrites them, since the view's new import of `$lib/ui/shown` takes the count of `views/sessions` to `ui` from 89 to 90 |
| `.scratch/migration/agents/reviews/O118-report.md` | new | | yes |

`tests/server/sessions/transcripts.test.ts` and `tests/state/sessions/transcript-tab.svelte.ts` are on the write list and did not need a change: no kept case names them, and the case helper in the client test makes its tab through `transcriptTab` as it stands.

Edits to existing assertions, from `diff` of each changed test file against the base copy:

| File | Before | After |
|---|---|---|
| `transcript-routes.test.ts` | `await response.arrayBuffer();` | `const text = await response.text();`, and `expect(text).toContain(turn);` added after the macrotask count, which is unchanged at `toBeGreaterThanOrEqual(4)` |
| `transcript-routes.test.ts` | the table row's `write: (path: string) => { ... planted(...) }` | `write: doubled`, the same writes in a function the new case shares |
| `transcript-routes.test.ts` | the `TAIL` text inline in `several()` | a const `TAIL` beside `TAIL_LINES`, the same text |
| `transcript-routes.test.ts` | `import type { TurnsAnswer }` | `import { readTurns, type TurnsAnswer }` |
| `transcript-follow.client.test.ts` | `import { afterEach, expect, it, vi }` | `import { afterEach, describe, expect, it, vi }` |

No threshold or allow list changed.

## Paragraphs

| Place on the base | State |
|---|---|
| `transcript-routes.ts:21-29` | rewritten |
| `transcript-routes.ts:32-37` | rewritten |
| `transcript-routes.ts:88-95` | rewritten, on `endPass` |
| `transcript-routes.ts:105-108` | rewritten, and it documents `before` |
| `transcript-routes.ts:145-147` | rewritten |
| `stores/turns.ts:10-13` | still true |
| `stores/turns.ts:42-45` | still true |
| `stores/turns.ts:156-165` | rewritten |
| `stores/turns.ts:296-303` | rewritten |
| `stores/transcripts.ts:88-100` | rewritten |
| `stores/transcripts.ts:171-175` | still true |
| `stores/transcripts.ts:197-202` | still true |
| `transcript.svelte.ts:1-14` | rewritten |
| `transcript.svelte.ts:43-44` | still true |
| `transcript.svelte.ts:76-79` | rewritten |
| `transcript.svelte.ts:164-168` | rewritten |
| `transcript.svelte.ts:198-202` | rewritten |
| `transcript.svelte.ts:215-222` | still true |
| `transcript.svelte.ts:242-250` | rewritten: a session keeps every turn read of it |
| `transcript.svelte.ts:272-275` | rewritten |
| `TranscriptBody.svelte:2-21` | rewritten, with two paragraphs added |
| `TranscriptBody.svelte:160-165` | rewritten |
| `turn-rows.ts:1-16` | rewritten |
| `turn-rows.ts:117` | still true |

`grep -rn 'first read\|last turns\|older turn' docs README.md` printed nothing, so no other page describes this. `TurnRun.svelte`'s head comment names `runKey` and stays true.

## The measure

A case-run program in the scratchpad, gone since. It writes a sparse 4400 MiB file holding a turn every MiB through the 32 MiB ahead of the byte, and times one read through `handleTranscript`. Run with `node --disable-warning=ExperimentalWarning before-read.mts <scratchpad>`.

```ts
const MIB = 1024 * 1024;
const dir = mkdtempSync(join(process.argv[2], 'before-read-'));
const path = join(dir, 'session.jsonl');
const size = 4400 * MIB;
const said = (text: string, at: number): string =>
    `${JSON.stringify({ type: 'user', timestamp: new Date(1760000000000 + at).toISOString(), origin: { kind: 'human' }, message: { role: 'user', content: text } })}\n`;
const handle = openSync(path, 'w');
ftruncateSync(handle, size);
const before = size - 32 * MIB;
for (let at = before - 32 * MIB, n = 0; at < before; at += MIB, n += 1) {
    writeSync(handle, `\n${said(`turn ${n}`, n)}`, at - 1);
}
writeSync(handle, '\n', before - 1);
writeSync(handle, '\n', size - 1);
closeSync(handle);
const record = { id: 's', path, tool: 'claude', agents: [] };
const started = performance.now();
const response = await handleTranscript(
    new Request(`http://oculus.test/api/transcript?id=s&before=${before}`),
    { recordFor: () => record as never }
);
const body = (await response.json()) as { turns: unknown[]; head: number };
const ms = performance.now() - started;
console.log({ file: statSync(path).size, before, turns: body.turns.length, head: body.head, ms: Math.round(ms), bytesRead: 32 * MIB });
rmSync(dir, { recursive: true });
```

```
{ file: 4613734400, before: 4580179968, turns: 32, head: 4546625536, ms: 39, bytesRead: 33554432 }
```

`bytesRead` is the program's constant for the distance, one pass since that pass found turns; the pass reads that and one byte more (`endPass`, `start = end - distance - 1`). The 39 ms is of a sparse file and of user turns, which render nothing, so a real file of answers costs more: not measured.

Decision 5 stands as the brief says it: a reader who scrolls a 4.4 GB session to its head holds all its turns until the tab stops showing it.

## Judgment calls, each reversible

1. `reader-place.ts`, the split the size rule asks for. It holds the anchor, its take and its hold, and the write of `scrollTop`. No guarded entry covers a view, so it has no test.
2. The anchor departs from the brief's letter in one case. The brief says the first row on screen. A read can change the rows at the top of the list: the first said turn can lose its head or the `.user:first-child` look, and a run above it can grow at its head and take a new key. All of that happens at the top of those rows, so I take the row after the first said turn whenever the first row on screen lies above it. Then every word of those rows stays still as well. If the row taken were the changed row itself, its box top would hold and its words would shift by the 17 px of `.user`'s border and padding, or by a head's height. The result for the look: when the first row of the list is a person's turn and stops being first, its `.turn` box top moves up 17 px while its words do not move, so the look measures `.body`, `.said` or `.answer` for that row, or any other row's box. With no row below (a list of one row, or a run and a said turn), the distance to the list's foot is what is kept, which is exact for a read of older turns.
3. `readOlder` applies an answer only when the held state has `older` true as well as the `head` it asked with. The brief names the head alone. A new first read of a file that has not grown 200 turns answers the same `head`, and the brief's case says the old answer is not applied, so the flag is what holds it out; the store's row 'the head it asked with' is that case.
4. The scroll event of the view's own write of `scrollTop` asks nothing (`place.moved`). Without this the correction after a failed read fires a scroll near the top, which would ask again and make the loop the brief rules out. A write by the End tool is the same.
5. A press on a run notes the reader through `noteReader` and asks nothing, so a press near the top during a failed read does not ask again.
6. A tab shown again runs the same test as a draw: to the foot or back to the words, then the test for older turns, through `onShown` of `ui/shown.ts`. That also sends a tab first drawn while hidden to its foot when it shows, since `stuck` is true.
7. The muted line stands in `.chat` above `.turns`, in a box with the same `zoom`, so it never takes `.user:first-child` from the first row.
8. `turnDocs` answers `{ of, clear }`, and the view clears it with the choices at a change of target: a map keyed by HTML would otherwise hold the text of every session a tab has shown, against what `showing` drops.
9. The `before` refusal uses the words of `from`'s: `not a byte offset: <value>`.
10. `PENDING`, `NOTHING` and the new `NO_OLDER` are frozen, since a shared fallback now carries a `results` map.
11. A row whose top run grows has a new key, so that one row is drawn anew; its choice moves with it (`movedRun`), as the brief says.

## Every id, key and asynchronous path

- `before`: an empty value reads as absent; `abc` and `-1` answer 400; `0` reads no byte (`until` 0, `foldPieces` returns at `size <= offset`); past the size it ends at the size; on a non-integer 400; inside a line, the part line is left out as a line being written is.
- A row's key is `at - above`, one per turn, so unique among rows; negative for an older row.
- A `results` id comes from the file. `tool.id` empty goes nowhere. `__proto__` as an id assigns a boolean, which does nothing, and the client reads with `byKey`; `{...}` of parsed JSON copies it as an own key.
- `readOlder` in flight: the second call does nothing, by `older`. After `forget`: `peek` answers undefined and nothing is held. Superseded by a new first read: `older` is false, so nothing is held. A tail read out at the same time: each merges into what is held as it lands.

## Before and after, for the look

- Transcript, any session of more than 200 turns. Before: the list ends at the 200th turn from the end. After: scrolling up within a column of the top reads 200 more, a muted "Reading older turns" stands above the rows while the read is out, and at the file's head nothing is drawn.
- A failed read, with `/api/transcript?...before=` refused. Before: not reachable. After: "Older turns could not be read: <reason>" stands at the top of the list, one request is made, and a scroll asks again. If the reader is at the very top that line is drawn above the screen, as the muted line is, since the words do not move: scroll up to see it.
- A pressed run, a Copy control and its "Copied" across a read: unchanged by the read, in the states the brief's look lists.
- Two tabs on one session, and two tabs in one pane: as the brief's look lists them.
- Help, the Transcript list: one new line.

## The look on landing, what each case should show

| Case | State to put it in | Read at | What should be seen |
|---|---|---|---|
| 600 turns to the head | scroll to the top until `head` is 0 | `askOlder`, `reader-place.ts` `take`, `hold` | turns counted equal the file's; a row's top does not move, with judgment call 2 for the first row |
| Keys and Copy | press Copy, then read older turns | `{#each rows as row (row.first)}`, `turnDocs` | the row and "Copied" stand |
| Pressed run | press a run, read older; a run at the very top that older calls extend | `runKey`, `movedRun` | it keeps its choice |
| Two tabs | one session in two panes; two tabs in one pane | `$effect.pre`, `shownAgain` | the other's words do not move; the hidden one asks nothing and its words stand when shown |
| Opening | a long session | the after-draw effect: `toFoot`, then `askOlder` | no `before` request for a list taller than two columns |
| Failed read | refuse the route | `failed === ''`, `place.moved` | one request and no loop |
| Pre-compaction; rollout | `fold.ts:251`; `TranscriptBody` `turns_empty` | | ordinary turns; "This session has no turns yet." |
| Short list | a list shorter than the pane with `head` above 0 | the after-draw effect | fills with no scroll |
| An append | far up; at the foot | `place.hold`; `stuck` | the words do not move; the column follows |
| 200 turns or fewer | a small session | `kept`, `head` 0 | no `before` request |

## Limitations and sharp edges

- Decision 8: a file shrunk or rewritten between reads throws nothing and may repeat turns until the tab reopens. Not guarded.
- A read's answer writes through the query's own path a few microtasks after `tail` returns (`query.ts:755,767`, `await retryer.start()` then `setData`). A read of older turns landing inside those microtasks would be written over, and `older` would stand true. Both answers come off separate `fetch` body tasks, so that order cannot arise in a browser; this is a read of the code and not verified by a run.
- When the row taken is below an open top run and a call in that run fails and opens further, the run's own words shift by that growth. It takes a run open at the very top with a call still running.
- The anchor scan reads a rect per row from the top of the list on each scroll and each draw, so a long held list costs more per scroll. Not measured.
- An extended top run is one row drawn anew, as judgment call 11 says.
- Reader at the top when a read goes out: the muted line lands above the screen, as the brief's rule of words not moving gives.
- The look cases are unproven until the look.

## Anything in the brief that was wrong

- The base copy sits at `/Users/axelfaes/workspace/oculus/.agents/worktrees/O118-base/`, the main checkout's folder and not the worktree's: `ls .agents/worktrees/O118-base/` from the worktree prints "No such file or directory", and `ls ../O118-base/` lists it.
- "The step writes these paths and nothing else" cannot hold together with the size rule of `spec.md`: the rule needs `reader-place.ts`. `spec.md` says nothing in a brief overrides it, so the file is in the diff, named above. The four diagram files are the same, since `npm run diagrams` writes them.
- No library is added.
