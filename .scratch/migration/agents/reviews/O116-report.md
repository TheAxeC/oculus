# O116 report: a transcript's first read takes only the end of the file

Everything in the brief is done

The look on landing is owed (see "User-visible changes"). `docs/HELP.md` and `src/routes/api/(sessions)/transcript/+server.ts` are on the write list and needed no change: no HELP line became false, and the route's arrow returns `handleTranscript`'s promise as it is (`svelte-check` in the list: 0 errors).

Round 0 ruling carried (`agents/briefs/O116-cases.md`): "The case "A file whose last line has no line feed" is preserved behaviour: it passes on the unchanged tree and on the built tree, and the test is kept." No assertion was added to make it fail. The per-test run on unchanged `src` is quoted below.

## Open items of the state file, verbatim

From `.scratch/migration/orchestrator-state.md:169` in the worktree:

- Open item 629 (2026-11-02, O115's look): the transcript and the terminal grid share one text size setting, and Axel's grid is 10.5 px, too small for proportional text, so the transcript now stops at 12 px and the smaller and larger buttons change nothing there until the size passes 12. (a) a key of its own, `terminal.transcript_font_px`, written by the buttons while the Transcript is showing, left out meaning 12 px: both sizes are then free, at the cost of one more setting. (b) keep the one setting and the 12 px floor, which adds no key and leaves the buttons without effect below 12 at his setting; this is the lazy option. Recommended: (a).

Correction: the round 0 hand-back said the state file holds no open item. That came from a position line of the main checkout's file; the section itself holds the item above.

## The cases' first run

Case-run program on the unchanged tree, source at the end of this report:

`node --no-warnings <scratchpad>/o116-cases.mts /Users/axelfaes/workspace/oculus/.agents/worktrees/O116-base`

```
1 big file: {"turns":["MARKED","tail one","tail two"],"offset":41943040,"size":41943040,"ok":false}
2 next read: {"turns":["appended"],"offset":41943168,"size":41943168}
3 no line feed, small file: {"offsetIsLineBefore":true,"firstHolds":["finished"],"next":["being written"]}
3 no line feed, big file: {"offsetIsLineBefore":true,"firstHolds":["finished"],"next":["being written"]}
4 under 32 MiB: {"count":200,"first":"turn 50","last":["turn 249"],"offset":32216,"digest":"147d008f1d5f1d8b9024ea4ab0a58744dd63b977d20b4eb2803bef6fdda7bba7"}
5 doubled: {"turns":["MARKED","forty from the end"],"offset":104857600,"size":104857600}
6 inside a line: {"turns":["MARKED","cut by the start","after the cut"],"offset":41943040,"size":41943040}
7 subagent: {"turns":["MARKED","agent tail"],"offset":41943040}
8 codex: {"turns":["MARKED","rollout tail"],"offset":41943040}
9 empty: {"status":200,"turns":[],"offset":0,"results":{}}
9 missing: {"status":200,"turns":[],"offset":0,"results":{}}
10 results: {"status":200,"turns":[{"id":"toolu_before","name":"Bash","summary":"run toolu_before","ok":true},{"id":"toolu_later","name":"Bash","summary":"run toolu_later","ok":null}],"results":{},"nextStatus":200,"nextTurns":0,"nextResults":{"toolu_later":true}}
11 growth: {"appended":0,"firstOffsetPastStartSize":0,"firstEndedBeforeSizeAtEnd":true,"everyLineOnceInOrder":true}
12 export: {"status":200,"length":224,"digest":"67cafa258a57a43b62368598f7ef3cc9efa79b7184ab2360465805cc9a73de23","disposition":"attachment; filename=\"a-title.md\""}
13 macrotasks, 5 pieces, least 4: {"export":0,"fromOffset":0}
```

The same program on the built tree, after the last change:

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

Every case by name, each test on unchanged `src` (`diff -rq ../O116-base/src src` printed nothing at that run) and after. The run was `npx vitest run tests/server/sessions/transcript-routes.test.ts tests/server/sessions/transcripts.test.ts`: on unchanged `src` "Tests 8 failed | 31 passed (39)", after "Tests 39 passed (39)".

| Case | Kept as | Unchanged tree | Built tree |
|---|---|---|---|
| First read above 32 MiB, marked head | test, row 'a file above the tail holds the turns of the tail in order' | fails: `AssertionError: expected { ...(3) } to deeply equal { ...(3) }` (MARKED present, case-run line 1) | passes |
| Next read after an append | test 'is followed by a next read of only the turn appended' | passes, preserved | passes |
| Last line with no line feed | test 'stops at the line feed of a last line being written, and the next read has it whole' | passes, preserved under the ruling | passes |
| Under 32 MiB, turn for turn | test, row 'a file below the tail holds its last 200 turns' | passes, preserved; the case-run's digest of the whole answer is 147d008f on both trees | passes |
| No turn in the last 32 MiB, one 40 MiB back | test, row 'a tail with no turn reads the doubled distance and no further' | fails: `AssertionError: expected { ...(3) } to deeply equal { ...(3) }` | passes |
| Start inside a line | test, row 'a start inside a line drops that line' | fails: `AssertionError: expected { ...(3) } to deeply equal { texts: [ 'after the cut' ], ...(2) }` | passes |
| Subagent over 32 MiB | test, row "a subagent's transcript above the tail holds the tail" | fails: `... to deeply equal { texts: [ 'the agent tail' ], ...(2) }` | passes |
| Codex rollout over 32 MiB | test, row 'a Codex rollout above the tail holds the tail' | fails: `... to deeply equal { texts: [ 'the rollout tail' ], ...(2) }` | passes |
| Empty file, missing file | test, rows 'an empty file holds nothing', 'a missing file holds nothing' | pass, preserved | pass |
| Result with no call, call with a later result | run, line 10 | no throw; the file was read whole, so `toolu_before` found its call | no throw; `toolu_before` travels in `results` and matches no turn; `toolu_later` arrives in `nextResults` and the client's `merged` patches it (`transcript.svelte.ts:158-160`) |
| A file that grows during a read | run, line 11 | `appended` 0: a sync read leaves no macrotask for the writer | four lines appended during the reads; the first read ended at the read's size, and every line arrived once, in order |
| Export of several pieces, same bytes | test 'exports every turn of the file, a call with its result' | passes, preserved; digest 67cafa25 | passes; same digest and length |
| Macrotasks, export and read from an offset | test, rows of 'gives the thread back between the pieces of $name' | fail: `AssertionError: expected 0 to be greater than or equal to 4` | pass; 4 and 4 on 5 pieces |

One row beyond the brief's cases, under G148: 'a start on the first byte of a line keeps that line'. It fails on unchanged `src` (`... to deeply equal { texts: [ ...(2) ], ...(2) }`, the marked head is present) and passes after. It holds the design choice of starting one byte early, where a plain drop of the first line would lose a whole turn.

## DONE / NOT DONE

| Item | State | Proof, as printed |
|---|---|---|
| 1. Reads yield; `handleTranscript` async; sync `readTurns` gone; `foldFrom` stays for the scan | DONE | `npm run test:quick`: "test:quick: 99.7 s; every command passed"; rows 'gives the thread back...' pass, 4 macrotasks on 5 pieces. `readTurns` is async in `stores/turns.ts:163`; `foldFrom` and `foldYielding` share `foldPieces` (`stores/transcripts.ts:101`) |
| 2. Bounded first read, doubling, one pass, capped | DONE | vitest "Tests 39 passed (39)"; case-run lines 1, 4, 5. `firstRead` in `transcript-routes.ts:95` |
| 3. A start inside a line drops the line | DONE | vitest, rows 'a start inside a line...' and 'a start on the first byte...'; case-run line 6 |
| 4. Results of earlier calls | DONE | case-run line 10 |
| 5. The export, every turn, same bytes, read through the yielding loop, stops when the client goes | DONE | test 'exports every turn...'; case-run line 12 digest equal on both trees; export program below |
| 6. Comments of `transcript.svelte.ts`, no code; HELP only if false | DONE | `diff` of that file shows comment lines only; HELP lines listed below, none false |
| Each case first-run | DONE | the section above |
| `npm run test:quick` | DONE | "test:quick: 99.7 s; every command passed" |
| ASCII over the changed files | DONE | `LC_ALL=C grep -n '[^ -~]'` over the six files printed nothing |

The list ran once, preceded by `npm run diagrams` once. No whole-suite command was run. The list's own "not covered" lines: tests that reach no changed file within the import depth, other than the checks under `tests/checks/source` and `tests/checks/tree`; the build; the lint of unchanged files. It does not cover a real server, a real 4.4 GB file or a real client leaving: no real session file was read, and no page was started.

## The export on leaving, in flight and on two presses (item 5)

Program source at the end of the report; run on a 200 MiB sparse file (25 pieces):

```
unread body, descriptors over idle: 0 locked: false
left in flight, descriptors over idle during: 1 after: 0 read answered: {"done":true}
two presses equal: true length 145 digest a8d1d0f85ca1ed9d descriptors over idle: 0
```

- In flight: the response goes out at once, and the first `pull` reads the file whole through `foldYielding`, because a tool turn's state comes from a result further on, so no turn can be streamed before the read ends. The turns are held in memory during the read, as on the unchanged tree. The stream then writes them a turn at a time.
- After the client leaves: SvelteKit's `setResponse` cancels the reader on the response's `close` (`node_modules/@sveltejs/kit/src/exports/node/index.js:202-213`, read). `cancel()` aborts, the read stops at its next piece, the generator's `finally` closes the file, and `pull` enqueues nothing. The program shows the one descriptor gone four macrotasks later and no unhandled rejection. No real socket was closed for this: that step is by reading, not verified on a server.
- Two presses: each `exported` call holds its own controller, generator and buffer. Both ran at once and gave equal bytes.
- A body nobody reads (`highWaterMark: 0`) opens no file.

## Files, from `diff -rq` against the base copy

| File | Lines | On write list |
|---|---|---|
| `src/lib/server/sessions/transcript-routes.ts` | 277 | yes |
| `src/lib/server/sessions/stores/turns.ts` | 338 | yes |
| `src/lib/server/sessions/stores/transcripts.ts` | 442 | yes |
| `src/lib/state/sessions/transcript.svelte.ts` | 294 | yes, comments only |
| `tests/server/sessions/transcript-routes.test.ts` | 568 | yes |
| `tests/server/sessions/transcripts.test.ts` | 294 | yes |
| `.scratch/migration/agents/reviews/O116-report.md` | this file | yes |

Edits to existing assertions and test helpers, from `diff` against the base copy:

| File, base line | Before | After |
|---|---|---|
| `transcripts.test.ts:133` and `:232`, `:250` | `it('...', () => {` | `it('...', async () => {` |
| `transcripts.test.ts:136`, `:140` | `readTurns(path, 'claude', ...)` | `await readTurns(path, 'claude', ...)` |
| `transcripts.test.ts:244-245` | `const turns = readTurns(path, 'claude', 0).turns.map((turn) => turn.text); expect(turns).toEqual([...two texts])` | `const { turns } = await readTurns(path, 'claude', 0); expect(turns.map((turn) => turn.text)).toEqual([...the same two texts])` |
| `transcripts.test.ts:262-263` | as above, `['Rename the helper', 'Renamed.']` | as above, same texts |
| `transcript-routes.test.ts:176` | `const response = handleTranscript(` | `const response = await handleTranscript(` |
| `transcript-routes.test.ts:11` | `import { mkdirSync, writeFileSync } from 'node:fs';` | the same file's import with the sparse helpers' calls |

No assertion's expected value changed, and no threshold or allow list was touched.

## Judgment calls, each reversible

1. `readTurns` keeps its name in async form and takes `{ cap, insideLine, signal }` as its fourth argument, replacing the `cap` number; G40's test title 'readTurns' stays right.
2. The shared logic is a sync generator, `foldPieces`, driven to its end by `foldFrom` and with a macrotask between steps by `foldYielding`. A piece is read with `readSync`, which holds the thread for one piece, which item 1 allows.
3. A first read starts one byte early and skips through the first line feed, so a start on a line's first byte loses nothing (`firstRead`).
4. The first-read loop and `FIRST_READ_BYTES` live in `transcript-routes.ts`, beside `FIRST_READ_TURNS`.
5. A size that cannot be read counts as 0, so a missing file makes one pass from the head and answers as it did.
6. A doubled pass reads again from its new start, including the bytes the last pass read, so the answer comes from one pass. A file with no turn at all costs about twice its size, yielding throughout.
7. The export reads inside the stream's first `pull`, with `highWaterMark: 0`, so the answer's headers go out before the read.
8. The route's tests hold a local catalog of the ten `server.export` lines, since `exported` needs one.
9. The 32 MiB and the 8 MiB of a piece are stated as numbers in the route's tests, since `FIRST_READ_BYTES` and `PIECE_BYTES` are local to their modules.

Asynchronous paths and ids: the step adds no id or key on the wire. In flight, a read holds its own file handle and buffer; superseded reads share nothing. After close, a first read and a read from an offset run to their own end, since they do not take a signal: the first is bounded and yields. The request's `signal` was left out because SvelteKit's `getRequest` aborts it only under `(errored || request.destroyed) && !end_emitted` (`node_modules/@sveltejs/kit/src/exports/node/index.js:143-145`), read and not run.

## Limitations

- The first read of a large file with no turn at all, after its client left, goes on with the doubled passes to the file's head. It gives the thread back between pieces throughout.
- A piece of JSON heavy with assistant turns holds the thread for that piece's parse and its Markdown rendering. The time of one piece on a real file was not measured.
- An older turn outside the tail is not shown and nothing says it exists (brief decisions 2 and 4).
- `foldFrom` has no importer in production outside its own file: see below.

## User-visible changes, before and after

- View: a Terminal tab on Transcript, on a session whose file is above 32 MiB and whose last 32 MiB hold fewer than 200 turns. Before: 200 turns, reaching back past those bytes. After: only the turns of the last 32 MiB. A session whose tail holds 200 or more shows the same 200.
- Press a session of a large file in the list while another view is updating. Before: the server's thread blocks while the whole file is parsed. After: the other requests answer during the read. To see: press the 111 MB or 4.4 GB session and look that the Transcript opens and other views go on answering.
- Export on a large file: the save starts at once, and other views answer during the read. The bytes saved are those of the unchanged tree.
- The look on landing is the proof of these three.

## Paragraphs that describe the behaviour

| Place | State |
|---|---|
| `transcript-routes.ts` comment on `FIRST_READ_TURNS` (base 21-26) | rewritten |
| `transcript-routes.ts` doc of `handleTranscript` (base 68-71) | rewritten |
| `transcript-routes.ts` comment in the handler (base 101-104) | rewritten |
| `transcript-routes.ts` doc of `exported` | rewritten |
| `transcript-routes.ts` head comment | still true |
| `stores/turns.ts` doc of `readTurns` (base 153-160) | rewritten |
| `stores/turns.ts` head comment | rewritten, it named `foldFrom`; the paragraph on `results` still true |
| `stores/transcripts.ts` doc of `foldFrom` (base 84-96) | rewritten, moved onto `foldPieces` |
| `stores/transcripts.ts` head comment | still true |
| `state/sessions/transcript.svelte.ts:4` | still true |
| `state/sessions/transcript.svelte.ts:165`, `:198`, `:271` (base) | rewritten |
| `docs/HELP.md:341`, `:454-459` | still true; none says how much of a file is read |
| `src/routes/api/(sessions)/transcript/+server.ts` head comment | still true |

## Greps the rules ask for

Names, `grep -rn 'foldFrom\|foldYielding\|foldPieces\|readTurns\|YieldingRead\|handleTranscript' src tests docs README.md`: outside `tests/server/sessions/`, the hits are `transcript-routes.ts` (17, 99, 109, 141, 255), `stores/turns.ts` (6, 26, 155, 163, 167, 176), `stores/transcripts.ts` (101, 172, 176, 183, 190, 198, 203, 207, 210, 254) and `+server.ts` (6, 11). Every caller awaits or returns the promise. For reuse, `grep -rn "timers/promises\|highWaterMark" src/lib/server` found only `setTimeout as delay` in `machine/usage/refresh.ts:6`, and no size helper of this module; the other `sizeOf` functions are local to their files.

History words over the added lines (`diff` against the base copy, then `grep -Ei "before|used to|no longer|still|always|previously|the step adds|after this"`):

```
7:>  * last whole line it read, so a line still being written reaches the next read whole. A later read
10:>  * How far before a file's end a first read starts. The distance doubles while it finds no turn.
25:>  * The end of a transcript: a read that starts `FIRST_READ_BYTES` before the end of the file, or at
27:>  * more, so a tail of one long line still answers with a turn. The answer is the one pass that found
28:>  * a turn, or the pass from the head. A pass starts one byte early, on the end of the line before,
src/lib/state/sessions/transcript.svelte.ts: >      * request still out for it is cancelled, so its answer is not held.
```

Each hit is a position in a file or a state now, and none compares with an earlier tree. The check `tests/checks/source/history.test.ts` ran in the list.

Unused exports, `sh utils/unused-exports.sh` against `unused-exports.txt`:

```
< src/lib/server/sessions/stores/transcripts.ts: DEFAULT_WINDOW_DAYS, DEFAULT_MAX_SESSIONS, toolOf, readSession
> src/lib/server/sessions/stores/transcripts.ts: DEFAULT_WINDOW_DAYS, DEFAULT_MAX_SESSIONS, foldFrom, toolOf, readSession
```

`foldFrom` is added to that line: the scan calls it inside its own file, and with `readTurns` on `foldYielding` only tests import it. It stays exported, because item 1 keeps it and G40's named 'foldFrom' tests import it. `FIRST_READ_TURNS` and `exportName` were on the base's list and are unchanged.

## Anything in the brief that was wrong

- The sentence listing the preserved cases left out the no-line-feed case; the round 0 ruling settled it. Evidence: case-run lines 3 on the unchanged tree.
- Item 1 says "the route module passes its answer through" as a change; the route already does, since its arrow returns what `handleTranscript` returns.

## Case-run programs

Both write only into a temporary folder they remove, and take the tree's root as their argument. They stand in the session's scratchpad, outside the worktree.

`o116-cases.mts`:

```ts
import { createHash } from 'node:crypto';
import { appendFileSync, closeSync, ftruncateSync, mkdirSync, mkdtempSync, openSync, rmSync, statSync, writeFileSync, writeSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = process.argv[2];
const { handleTranscript } = await import(`${root}/src/lib/server/sessions/transcript-routes.ts`);
const MIB = 1024 * 1024;
const dir = mkdtempSync(join(tmpdir(), 'o116-cases-'));
const at = (second: number) => new Date(1760000000000 + second * 1000).toISOString();

const said = (text: string, second = 0) =>
    JSON.stringify({ type: 'user', timestamp: at(second), origin: { kind: 'human' }, message: { role: 'user', content: text } });
const call = (id: string, second = 0) =>
    JSON.stringify({ type: 'assistant', timestamp: at(second), message: { role: 'assistant', content: [{ type: 'tool_use', id, name: 'Bash', input: { command: `run ${id}` } }] } });
const result = (id: string, second = 0) =>
    JSON.stringify({ type: 'user', timestamp: at(second), message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: id }] } });
const codex = (text: string, second = 0) =>
    JSON.stringify({ timestamp: at(second), type: 'event_msg', payload: { type: 'item_completed', item: { type: 'UserMessage', text } } });

/** A sparse file of `size` bytes holding each text at its position. */
function sparse(path: string, size: number, parts: [number, string][]): void {
    const handle = openSync(path, 'w');
    ftruncateSync(handle, size);
    for (const [position, text] of parts) writeSync(handle, text, position);
    closeSync(handle);
}

/** A file of `size` bytes: `head` at 0, zero lines of a MiB, and `tail` as its last bytes. */
function padded(path: string, size: number, head: string, tail: string): void {
    const parts: [number, string][] = [[0, head]];
    for (let at = MIB; at < size - tail.length - 1; at += MIB) parts.push([at, '\n']);
    parts.push([size - tail.length - 1, '\n']);
    parts.push([size - tail.length, tail]);
    sparse(path, size, parts);
}

const record = (path: string, tool = 'claude', agents: unknown[] = []) => ({ id: 'sess', path, tool, agents, title: 'a title', cwd: '/w', started: at(0) });
const CATALOG: Record<string, string> = {
    'server.export.agent': 'Agent: {0}', 'server.export.assistant': 'Agent', 'server.export.error': 'error',
    'server.export.folder': 'Folder: {0}', 'server.export.ok': 'ok', 'server.export.running': 'running',
    'server.export.session': 'Session: {0}', 'server.export.started': 'Started: {0}',
    'server.export.tool': '{0}: {1} ({2})', 'server.export.user': 'You'
};

async function ask(rec: unknown, query = ''): Promise<Response> {
    return handleTranscript(new Request(`http://oculus.test/api/transcript?id=sess${query}`), {
        recordFor: (id: string) => (id === 'sess' ? rec : null),
        catalogFor: () => CATALOG
    });
}
async function read(rec: unknown, query = '') {
    const response = await ask(rec, query);
    return { status: response.status, ...(await response.json()) };
}
const texts = (answer: { turns: { text: string }[] }) => answer.turns.map((one) => one.text);
const show = (name: string, value: unknown) => console.log(`${name}: ${JSON.stringify(value)}`);

// 1 and 2. Above 32 MiB with a marked head, then the next read after an append.
{
    const path = join(dir, 'big.jsonl');
    padded(path, 40 * MIB, `${said('MARKED')}\n`, `${said('tail one')}\n${said('tail two')}\n`);
    const answer = await read(record(path));
    show('1 big file', { turns: texts(answer), offset: answer.offset, size: statSync(path).size, ok: !texts(answer).includes('MARKED') && answer.offset === statSync(path).size });
    appendFileSync(path, `${said('appended')}\n`);
    const next = await read(record(path), `&from=${answer.offset}`);
    show('2 next read', { turns: texts(next), offset: next.offset, size: statSync(path).size });
}

// 3. A last line with no line feed, on a small file and on a file above 32 MiB.
for (const [name, big] of [['small', false], ['big', true]] as const) {
    const path = join(dir, `open-${name}.jsonl`);
    const finished = `${said('finished')}\n`;
    const open = said('being written');
    if (big) padded(path, 40 * MIB, `${said('MARKED')}\n`, finished + open.slice(0, 20));
    else writeFileSync(path, finished + open.slice(0, 20));
    const size = statSync(path).size;
    const answer = await read(record(path));
    appendFileSync(path, `${open.slice(20)}\n`);
    const next = await read(record(path), `&from=${answer.offset}`);
    show(`3 no line feed, ${name} file`, { offsetIsLineBefore: answer.offset === size - 20, firstHolds: texts(answer).slice(-1), next: texts(next) });
}

// 4. Under 32 MiB: more turns than a first read keeps, with a call and its result.
{
    const path = join(dir, 'small.jsonl');
    const lines = [call('toolu_a', 0), result('toolu_a', 1)];
    for (let index = 0; index < 250; index++) lines.push(said(`turn ${index}`, index + 2));
    writeFileSync(path, `${lines.join('\n')}\n`);
    const answer = await read(record(path));
    show('4 under 32 MiB', { count: answer.turns.length, first: texts(answer)[0], last: texts(answer).slice(-1), offset: answer.offset, digest: createHash('sha256').update(JSON.stringify(answer)).digest('hex') });
}

// 5. A last 32 MiB with no turn, a turn 40 MiB from the end, a marked turn past the doubled start.
{
    const path = join(dir, 'doubled.jsonl');
    const size = 100 * MIB;
    sparse(path, size, [[0, `${said('MARKED')}\n`], [size - 40 * MIB - 1, `\n${said('forty from the end')}\n`], [size - 1, '\n']]);
    const answer = await read(record(path));
    show('5 doubled', { turns: texts(answer), offset: answer.offset, size });
}

// 6. A start that falls inside a line.
{
    const path = join(dir, 'inside.jsonl');
    const size = 40 * MIB;
    const after = `${said('after the cut')}\n`;
    sparse(path, size, [[0, `${said('MARKED')}\n`], [size - 32 * MIB - 10, `\n${said('cut by the start')}\n`], [size - after.length - 1, `\n${after}`]]);
    const answer = await read(record(path));
    show('6 inside a line', { turns: texts(answer), offset: answer.offset, size });
}

// 7. A subagent's transcript over 32 MiB.
{
    const store = join(dir, 'store');
    mkdirSync(join(store, 'sess', 'subagents'), { recursive: true });
    const own = join(store, 'sess.jsonl');
    writeFileSync(own, `${said('the session')}\n`);
    padded(join(store, 'sess', 'subagents', 'agent-abig1.jsonl'), 40 * MIB, `${said('MARKED')}\n`, `${said('agent tail')}\n`);
    const answer = await read(record(own, 'claude', [{ id: 'toolu_big', agentId: 'abig1' }]), '&agent=toolu_big');
    show('7 subagent', { turns: texts(answer), offset: answer.offset });
}

// 8. A Codex rollout over 32 MiB.
{
    const path = join(dir, 'rollout.jsonl');
    padded(path, 40 * MIB, `${codex('MARKED')}\n`, `${codex('rollout tail')}\n`);
    const answer = await read(record(path, 'codex'));
    show('8 codex', { turns: texts(answer), offset: answer.offset });
}

// 9. An empty file and a missing file.
{
    const empty = join(dir, 'empty.jsonl');
    writeFileSync(empty, '');
    show('9 empty', await read(record(empty)));
    show('9 missing', await read(record(join(dir, 'missing.jsonl'))));
}

// 10. A result in the tail with no call, and a call whose result comes in the next read.
{
    const path = join(dir, 'results.jsonl');
    padded(path, 40 * MIB, `${call('toolu_before')}\n`, `${result('toolu_before')}\n${call('toolu_later')}\n`);
    const answer = await read(record(path));
    appendFileSync(path, `${result('toolu_later')}\n`);
    const next = await read(record(path), `&from=${answer.offset}`);
    show('10 results', { status: answer.status, turns: answer.turns.map((one) => one.tool), results: answer.results, nextStatus: next.status, nextTurns: next.turns.length, nextResults: next.results });
}

// 11. A file that grows during a read: a line appended on each macrotask while the reads run.
{
    const path = join(dir, 'growing.jsonl');
    padded(path, 40 * MIB, `${said('head')}\n`, `${said('tail')}\n`);
    const before = statSync(path).size;
    let appended = 0;
    let growing = true;
    const grow = () => {
        if (!growing) return;
        appendFileSync(path, `${said(`line ${appended}`)}\n`);
        appended += 1;
        setImmediate(grow);
    };
    setImmediate(grow);
    const seen: string[] = [];
    const first = await read(record(path));
    const sizeAtEnd = statSync(path).size;
    seen.push(...texts(first));
    const firstOffset = first.offset;
    let offset = first.offset;
    for (let pass = 0; pass < 3; pass++) {
        const next = await read(record(path), `&from=${offset}`);
        seen.push(...texts(next));
        offset = next.offset;
    }
    growing = false;
    await new Promise((resolve) => setImmediate(resolve));
    const last = await read(record(path), `&from=${offset}`);
    seen.push(...texts(last));
    const lines = seen.filter((text) => text.startsWith('line '));
    const expected = Array.from({ length: appended }, (_, index) => `line ${index}`);
    show('11 growth', { appended, firstOffsetPastStartSize: firstOffset - before, firstEndedBeforeSizeAtEnd: firstOffset <= sizeAtEnd, everyLineOnceInOrder: JSON.stringify(lines) === JSON.stringify(expected) });
}

// 12. The export of a file of several pieces, with a call patched by its result across pieces.
const several = join(dir, 'several.jsonl');
{
    padded(several, 40 * MIB, [said('head turn\nsecond line'), call('toolu_x', 1)].join('\n') + '\n', [result('toolu_x', 2), said('tail turn', 3)].join('\n') + '\n');
    const response = await ask(record(several), '&format=markdown');
    const bytes = Buffer.from(await response.arrayBuffer());
    show('12 export', { status: response.status, length: bytes.length, digest: createHash('sha256').update(bytes).digest('hex'), disposition: response.headers.get('content-disposition') });
    console.log(bytes.toString('utf8'));
}

// 13. The macrotasks counted during a read, the body read to its end.
async function counted(query: string): Promise<number> {
    let count = 0;
    let going = true;
    const tick = () => {
        if (!going) return;
        count += 1;
        setImmediate(tick);
    };
    setImmediate(tick);
    const response = await ask(record(several), query);
    await response.arrayBuffer();
    going = false;
    return count;
}
show('13 macrotasks, 5 pieces, least 4', { export: await counted('&format=markdown'), fromOffset: await counted('&from=1') });

rmSync(dir, { recursive: true, force: true });
```

This quoted text, copied out of this report and run on the built tree, printed the same lines as the outputs above (`diff` of the two outputs printed nothing).

`o116-cases-export.mts`:

```ts
import { createHash } from 'node:crypto';
import { closeSync, ftruncateSync, mkdtempSync, openSync, readdirSync, rmSync, writeSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = process.argv[2];
const { handleTranscript } = await import(`${root}/src/lib/server/sessions/transcript-routes.ts`);
const MIB = 1024 * 1024;
const dir = mkdtempSync(join(tmpdir(), 'o116-export-'));
const path = join(dir, 'big.jsonl');
const said = (text: string) =>
    JSON.stringify({ type: 'user', timestamp: '2026-01-01T00:00:00.000Z', origin: { kind: 'human' }, message: { role: 'user', content: text } });
const handle = openSync(path, 'w');
ftruncateSync(handle, 200 * MIB);
writeSync(handle, `${said('head')}\n`, 0);
for (let at = MIB; at < 200 * MIB; at += MIB) writeSync(handle, '\n', at - 1);
writeSync(handle, `${said('tail')}\n`, 200 * MIB - said('tail').length - 1);
closeSync(handle);

const CATALOG = Object.fromEntries(
    ['agent', 'assistant', 'error', 'folder', 'ok', 'running', 'session', 'started', 'tool', 'user'].map((key) => [`server.export.${key}`, `${key} {0} {1} {2}`])
);
const record = { id: 'sess', path, tool: 'claude', agents: [], title: 't', cwd: '/w', started: 's' };
const press = async () =>
    handleTranscript(new Request('http://oculus.test/api/transcript?id=sess&format=markdown'), {
        recordFor: () => record,
        catalogFor: () => CATALOG
    });
const descriptors = () => readdirSync('/dev/fd').length;
const macrotask = () => new Promise((resolve) => setImmediate(resolve));
process.on('unhandledRejection', (reason) => console.log('unhandled rejection', reason));

const idle = descriptors();
const unread = await press();
await macrotask();
console.log('unread body, descriptors over idle:', descriptors() - idle, 'locked:', unread.body?.locked);

const leaving = await press();
const reader = leaving.body!.getReader();
const pending = reader.read();
await macrotask();
await macrotask();
const during = descriptors() - idle;
await reader.cancel();
for (let tick = 0; tick < 4; tick++) await macrotask();
console.log('left in flight, descriptors over idle during:', during, 'after:', descriptors() - idle, 'read answered:', JSON.stringify(await pending));

const twice = await Promise.all([press(), press()]);
const bytes = await Promise.all(twice.map(async (one) => Buffer.from(await one.arrayBuffer())));
console.log('two presses equal:', bytes[0].equals(bytes[1]), 'length', bytes[0].length, 'digest', createHash('sha256').update(bytes[0]).digest('hex').slice(0, 16), 'descriptors over idle:', descriptors() - idle);
rmSync(dir, { recursive: true, force: true });
```
