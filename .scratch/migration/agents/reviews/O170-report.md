NOT DONE: nothing is built. The first run found a case the brief's own rules get wrong (item 6's candidate rule against its sentence "A slide with no caption or explanation lays out exactly as today" and against C10), so the step stops here before any code changes and hands back the first run and that case for a ruling.

# O170 report (stop at the first run)

## Open items of the state file (verbatim)

`sed -n 191,195p .scratch/migration/orchestrator-state.md` prints:

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

None.
```

## The case the brief's rules get wrong

**The rule (brief, "What to build" item 6).** With two or more figures, `layOut` takes "the candidates: `side` as `placeOf` places it, when every figure's box is at least its `least`; with text, `side` forced under the text (`wide`), when it has room of its own and every box is at least its `least`; and `stacked`, which has no neighbour beside it and takes no `least`; of those, the one with the largest area, as today, a tie going to `side`."

**The sentences it breaks.** Item 6: "A slide with no caption or explanation lays out exactly as today." Case C10: "`layOut` with two figures whose boxes meet `least` side by side: `side`, unchanged from the unchanged tree's answer."

**What the rule gives.** The forced `wide` is a candidate on every slide with text where it has room of its own, also when `placeOf`'s `side` meets every `least` or there is no `least` at all, and it wins wherever its area is larger than `placeOf`'s `tall`. That happens whenever the text is short enough, because `tall` is held to the column `room.width - TEXT_LEAST - TEXT_GAP` and `wide` to the whole width. Two runs:

1. The inputs of C12 with no `least` (a slide with no caption or explanation). `layOut` on the unchanged tree answers `side`, `tall`, boxes 0.3492 (the run below, row C12). The rule's forced `wide` scales to `min(1/2, 0.4 - 0.02) = 0.38`, area 0.2888 against 0.2439, so the rule answers `side`, `wide`, boxes 0.38: a different layout from today, for a slide the brief says lays out exactly as today.
2. A room of a project slide's reading column, 0.8125 wide and 0.35 tall, two square figures, no caption, one line of text (0.03). Unchanged tree: `side`, `tall`, boxes 0.2555 (row no-caption-one-line-text below). The rule's forced `wide`: scale 0.32, area 0.2048 against 0.1305, so `wide` at 0.32.

The same holds with `least` present and met, which is C10: C12's inputs with each `least` 0.3 meet `least` as `tall` (0.3492), C10 says the answer is unchanged, and the rule answers the forced `wide` at 0.38.

The arithmetic is this run:

```
$ node -e "const text=.03, room={w:.8125,h:.35}, a=2; const wide=Math.min(room.w/a, room.h-text); const col=room.w-.28125-.0203125; const tall=Math.min(col/a, room.h); console.log('no caption, room .8125 x .35, text .03: tall scale', tall.toFixed(4), 'area', (2*tall*tall).toFixed(4), '| side forced under the text: scale', wide.toFixed(4), 'area', (2*wide*wide).toFixed(4)); const t2=.02,r2={w:1,h:.4}; const w2=Math.min(r2.w/2,r2.h-t2); const c2=r2.w-.28125-.0203125; const t3=Math.min(c2/2,r2.h); console.log('C12 inputs with no least: tall scale', t3.toFixed(4), 'area', (2*t3*t3).toFixed(4), '| forced wide: scale', w2.toFixed(4), 'area', (2*w2*w2).toFixed(4));"
no caption, room .8125 x .35, text .03: tall scale 0.2555 area 0.1305 | side forced under the text: scale 0.3200 area 0.2048
C12 inputs with no least: tall scale 0.3492 area 0.2439 | forced wide: scale 0.3800 area 0.2888
```

**The options, for the orchestrator's ruling.**

- (a), my recommendation: the forced `wide` is a candidate only when `placeOf`'s `side` misses a `least`. Every case stays as written, by the arithmetic above: C9 has no text, so no forced `wide` is tried and `side` at 0.16 misses 0.5, giving `stacked`; C10 and every slide with no caption keep `placeOf`'s `side`; C12 misses 0.36 at 0.3492 and takes the forced `wide` at 0.38; C13 misses 0.5 at both, giving `stacked`. Item 6's rule text would read "the forced `side` under the text, only when `side` as `placeOf` places it misses a `least`".
- (b): the candidate rule stands and the sentence and C10's "unchanged" go. A slide with no caption whose text is one line then moves its figures from a column beside the text to a block under it, a visible change to slides the step line does not name. The lazy option is neither; (b) changes more of the product than the step asks for.

Waiting on this ruling; nothing depends on it but item 6.

## The cases' first run, every case, on the unchanged tree

Tree state: `git status --short` printed nothing and `diff -rq` of `../O170-base/{src,tests,config,utils}` against the worktree printed nothing, taken after the case runs and before this report was written. The verify list was run 0 times.

The unit-level cases ran through one case-run program, quoted below with its output. Cases that only a page shows are checked by reading, with the look on landing as their proof.

- **C1.** `grep -rn "citation-js" config --exclude=local.yml` prints `config/text/views/feeds/literature.yml:18:        copied_citation_js: BibTeX copied, built by citation-js because no source served one` (the rule's target, unchanged). The look on landing shows the line after the change.
- **C2.** Reading: `Literature.svelte:161` calls `go()` at mount once the listing has answered when `form.q` is not empty and `sources` is not empty. A reload with a query held sends one search per source that is on. Proof after the change is the look, reading the network log.
- **C3.** Reading: `Literature.svelte:121-122`, `listed` is null until `?sources` answers and `sources` is `listed ?? []`, so `Head.svelte:48` draws no button in the first frame; a new tab likewise. The look on landing measures it.
- **C4.** Reading: `Head.svelte:55` `disabled={!source.available}` and `form.ts:75-77` `sourceOn` needs `source.available`; until the listing answers no button is drawn at all. A search never asks a listed unavailable source. Beside the case: in the failed-listing path of item 3 a row of the config is drawn `available: true`, and a Search asks it; the route answers it `no-key` and asks no outside source (`handler.ts:144-145`, the file's head comment at `:14`), so the case's "a search never asks it" stays true of the outside source, and the reading of the case is noted here. The look on a scratch hub is its proof.
- **C5.** Reading: `Literature.svelte:143-146` `go()` runs with `sources` empty before the listing answers, `run.svelte.ts:179-182` sets `noneOn`, and `Literature.svelte:229-230` draws "none on". A listing that fails: `Literature.svelte:160` leaves `listed` null and `:161` then calls `go()` with an empty list. A listing after the tab closed: `:159` returns. The look with the route held is its proof.
- **C6.** Reading: `export.ts:205` says `export_opened` once the lock is taken and nothing clears it (`acts.svelte.ts:96` `say`). A press while the lock is held says `export_running` (`export.ts:199-203`). The look is its proof.
- **C7.** Reading: `Bar.svelte:135-137` `.said` has `flex: 1 1 0; min-width: 0`, so the line takes what the controls leave and is cut. The look is its proof.
- **C8.** Reading: `Presenter.svelte:181-183, :188-191, :203-205`, a wrapping flex row with `.current` `flex: 3 1 320px`, `.side` `flex: 1 1 240px`, `.preview` `width: 100%`. Below the wrap point the side is the pane's width and the next slide wider than the current one; not measured, the look measures it at the seven widths and two heights.
- **C9.** Node run below: `side`, `alone`, boxes 0.16, height 0.4 (the brief's unchanged answer "side with boxes of 0.16").
- **C10.** Node run below, inputs chosen as two figures of ratio 1.2 in a room 0.9 by 0.4 with no text and each `least` 0.1: `side`, `alone`, boxes 0.45. Matches the case on these inputs; the case as worded fails under the candidate rule on the inputs above.
- **C11.** Node run below: one figure with `least` 5 answers the same layout as with none (`one`, `alone`, 0.48).
- **C12.** Node run below: `side`, `tall`, boxes 0.3492 (the brief's unchanged answer "tall with boxes of about 0.349").
- **C13.** Node run below: on the unchanged tree `least` is not read, so `side`, `tall`, 0.3492. Under item 6: `stacked`, by the arithmetic above.
- **C14.** Reading: `slide-layout.ts:262-264` chooses by area alone and no word width is read (`Slide.svelte:247-264`). The look on a scratch deck is its proof.
- **C15.** Reading: `Bar.svelte:89-96`, the Facts chip stands before Present, Presenter and Export and comes and goes with `facts !== null`, so those three move. The look measures it.
- **C16.** Case-run program below: every refused fetch, push, pull, sync and publish, and the commit, posts "A write was refused: <reason>"; no answer posts "A write got no answer: <reason>"; a list of field refusals joins them with "; ". The cancelled row's stubbed error is the sentence of `server.git.cancelled` (`config/text/server.yml:398`, `{0} was stopped by Cancel`, answered through `failureLine` of `src/lib/server/core/git/failure.ts`).
- **C17.** Case-run program below: the `delete-entry` answer is `{"ok":true,"changed":["entries"],"refused":[]}`, no `build`.
- **C18.** Case-run program below: delete, then a snapshot still holding the entry: `[true,true]`, the removal stays. The brief's unchanged answer.
- **C19.** Case-run program below: a snapshot holding it, then one without it: `[true,true,false]`. The numbers do not exist on the unchanged tree, so the removal ends by the entry's absence.
- **C20.** Case-run program below: a snapshot without the entry before the answer: `[false,false]`, nothing is held.
- **C21.** Case-run program below: held, reconnect, a lower version still holding the entry: `[true,true]`, the removal stays, the unchanged tree's answer.
- **C22.** Case-run program below: the watcher's version stays 1 across a read with the same rows, the payload carries no `read`, the route's delete answer is `{"ok":true}`, and the page's row stays out (`["two"]`): the brief's "nothing is published and it stays out".
- **C23.** Case-run program below: a refused collection delete holds nothing (`false`), a refused schedule delete keeps its row (`["one"]`).
- **C24.** The brief lists no case C24: its list goes from C23 to C25.
- **C25.** Case-run program below: two publishes with no read between: version stays 1, so one message.
- **C26.** Reading: `export.ts:189-193` a blocked tab says `export_blocked` and stops; no line is cleared at the hold's end today, since `export.ts:205` says the line and nothing clears it. The look is its proof.

### The Node run of C9 to C13 (and the rows beside them)

```
$ node --input-type=module -e "
import { layOut } from './src/lib/views/academic/present/screen/slide-layout.ts';
const p=(n,o)=>console.log(n, JSON.stringify(o===null?null:{arrangement:o.arrangement,shape:o.shape,height:o.height,boxes:o.figures.map(b=>+b.width.toFixed(4))}));
p('C9', layOut({room:{width:.9,height:.4},figures:[{ratio:.4},{ratio:.4}],text:null}));
p('C10', layOut({room:{width:.9,height:.4},figures:[{ratio:1.2,least:.1},{ratio:1.2,least:.1}],text:null}));
p('C11-none', layOut({room:{width:.9,height:.4},figures:[{ratio:1.2}],text:null}));
p('C11-least', layOut({room:{width:.9,height:.4},figures:[{ratio:1.2,least:5}],text:null}));
p('C12', layOut({room:{width:1,height:.4},figures:[{ratio:1},{ratio:1}],text:.02}));
p('C13', layOut({room:{width:1,height:.4},figures:[{ratio:1,least:.5},{ratio:1,least:.5}],text:.02}));
p('no-caption-one-line-text', layOut({room:{width:.8125,height:.35},figures:[{ratio:1},{ratio:1}],text:.03}));
"
C9 {"arrangement":"side","shape":"alone","height":0.4,"boxes":[0.16,0.16]}
C10 {"arrangement":"side","shape":"alone","height":0.4,"boxes":[0.45,0.45]}
C11-none {"arrangement":"one","shape":"alone","height":0.4,"boxes":[0.48]}
C11-least {"arrangement":"one","shape":"alone","height":0.4,"boxes":[0.48]}
C12 {"arrangement":"side","shape":"tall","height":0.4,"boxes":[0.3492,0.3492]}
C13 {"arrangement":"side","shape":"tall","height":0.4,"boxes":[0.3492,0.3492]}
no-caption-one-line-text {"arrangement":"side","shape":"tall","height":0.35,"boxes":[0.2555,0.2555]}
```

### The case-run program and its output (C16 to C23, C25)

It lived at `.agents/scratch/first-run.case.ts` and is gone. It ran with `TMPDIR` and `GIT_CEILING_DIRECTORIES` set to `.agents/scratch/tmp` through a vitest configuration at `.agents/scratch/v.config.ts` that loads the repository's own and points the include at that folder, and it asserts nothing.

```
The source of .agents/scratch/v.config.ts, its head comment left out:
import base from '../../vite.config.ts';

export default async (env: Parameters<typeof base>[0]) => {
    const config = await base(env);
    return {
        ...config,
        test: {
            ...config.test,
            projects: undefined,
            environment: 'node',
            expect: { requireAssertions: false },
            include: ['.agents/scratch/*.case.ts']
        }
    };
};

The source of .agents/scratch/first-run.case.ts, with its layout compacted onto fewer lines and each row of the C16 table given without its unused third element (null):
import { writeFileSync } from 'node:fs';
import { it, vi } from 'vitest';
import { Hub } from '../../src/lib/server/core/channels.ts';
import { handleSchedules } from '../../src/lib/server/machine/runs/schedules/routes.ts';
import { handleWrite } from '../../src/lib/server/edit/writes.ts';
import { createPages } from '../../src/lib/state/forms/page-entry.ts';
import { createSettled } from '../../src/lib/state/forms/settled.svelte.ts';
import { createClientState } from '../../src/lib/state/client/context.ts';
import { createEntities } from '../../src/lib/state/client/entities.svelte.ts';
import { createSchedule } from '../../src/lib/state/system/machine/schedules/schedule.svelte.ts';
import { setCatalog } from '../../src/lib/state/shared/words/text.ts';
import { TEXT } from '../../tests/server/text.ts';
import { pagePost } from '../../tests/fixtures/doubles.ts';
import { tmux } from '../../tests/routes/sessions/terminal-fixture.ts';
import { TOKEN, changesOf, request, target } from '../../tests/routes/edit/write-fixture.ts';
import { entryText, plantSchedules, routeOptions, watcherOver, world } from '../../tests/server/machine/runs/schedules/schedules-fixture.ts';

setCatalog(TEXT);

function snapshotOf(keys: string[]): unknown {
    const entries = keys.map((key, index) => ({ id: `hub:${key}`, title: key, fields: { key, title: key }, file: '/hub/tasks.yml', index, root: 'hub' }));
    const collection = { id: 'hub:tasks', title: 'Tasks', file: '/hub/tasks.yml', schema: [{ field: 'key', type: 'text', primary_key: true }], primary_key: 'key', entries, root: 'hub' };
    return { entities: { collections: { 'hub:tasks': collection }, career: null } };
}

function readOf(names: string[]): unknown {
    return { schedules: names.map((name, at) => ({ at, name, entry: null, problem: null, unchosen: [], next: null, runs: [] })), commands: [], folders: [], tasks: null, primary: null, unread: [], waiting: null };
}

function answerFor(status: number, body: unknown): Response {
    return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

it('C16', async () => {
    const rows: [string, () => Promise<unknown>][] = [
        ['fetch refused', () => Promise.resolve(answerFor(400, { error: 'no remote' }))],
        ['push refused', () => Promise.resolve(answerFor(400, { error: 'rejected' }))],
        ['pull refused', () => Promise.resolve(answerFor(400, { error: 'conflict' }))],
        ['sync refused', () => Promise.resolve(answerFor(400, { error: 'behind' }))],
        ['publish refused', () => Promise.resolve(answerFor(400, { error: 'exists' }))],
        ['commit refused', () => Promise.resolve(answerFor(400, { error: 'nothing' }))],
        ['fetch no answer', () => Promise.reject(new Error('socket hung up'))],
        ['fetch cancelled', () => Promise.resolve(answerFor(409, { error: 'fetch was stopped by Cancel' }))],
        ['fetch refused with fields', () => Promise.resolve(answerFor(400, { refused: [{ field: 'a', reason: 'one' }, { field: 'b', reason: 'two' }] }))]
    ];
    for (const [name, answer] of rows) {
        const client = createClientState();
        vi.stubGlobal('fetch', vi.fn(answer));
        const action = name.split(' ')[0];
        await client.writes.writeGit(action, '/repo');
        console.log(`C16 ${name}:`, JSON.stringify(client.notices.list().map((one) => one.text ?? one)));
    }
    vi.unstubAllGlobals();
});

it('C17', async () => {
    const into = target();
    const response = await handleWrite(request({ kind: 'delete-entry', collection: 'tasks', id: 'hub:Another task' }), TOKEN, into);
    console.log('C17 answer:', response.status, JSON.stringify(await response.json()));
    console.log('C17 log kind:', changesOf(into)[0]?.kind);
});

function collectionRow(name: string, steps: ('delete' | string[])[]): void {
    let held = snapshotOf(['a', 'b']);
    let version = 1;
    const settled = createSettled(() => version);
    const pages = createPages({ snapshot: () => held, feeds: () => null } as never, settled);
    const seen = steps.map((step) => {
        if (step === 'delete') pages.settle.removed('tasks', 'hub:a', settled.begin());
        else { held = snapshotOf(step); version += 1; settled.heard(); }
        return pages.removed('tasks', 'hub:a');
    });
    console.log(`${name}:`, JSON.stringify(seen));
}

it('C18 to C21', () => {
    collectionRow('C18 delete, next snapshot still holds the entry', ['delete', ['a', 'b']]);
    collectionRow('C19 delete, snapshot holding it, snapshot without it', ['delete', ['a', 'b'], ['b']]);
    collectionRow('C20 snapshot without it arrived before the answer', [['b'], 'delete']);
    const client = createClientState();
    client.entities.receive({ channel: 'portfolio', version: 5, payload: snapshotOf(['a', 'b']) });
    client.pages.settle.removed('tasks', 'hub:a', client.settled.begin());
    const first = client.pages.removed('tasks', 'hub:a');
    client.entities.reconnected();
    client.entities.receive({ channel: 'portfolio', version: 1, payload: snapshotOf(['a', 'b']) });
    console.log('C21 held, reconnect, lower version holding the entry:', JSON.stringify([first, client.pages.removed('tasks', 'hub:a')]));
});

it('C22 and C25', async () => {
    const w = world();
    plantSchedules(w, entryText(w, 'task'));
    const hub = new Hub();
    let tell = (): void => undefined;
    const watcher = watcherOver(w, hub, tmux(), undefined, { unreadable: () => null, onChange: (listener) => { tell = listener; return () => undefined; } });
    await new Promise((done) => setImmediate(done));
    const before = hub.version('schedule');
    watcher.reload();
    console.log('C22 watcher, a read with the same rows, versions:', before, hub.version('schedule'));
    console.log('C22 payload read:', JSON.stringify((hub.latest('schedule')?.payload as { read?: unknown }).read));
    const stale = hub.version('schedule');
    tell();
    tell();
    console.log('C25 two publishes with no read, versions:', stale, hub.version('schedule'));
    const response = await handleSchedules(pagePost('http://127.0.0.1:8791/api/schedules', { action: 'delete', at: 0, name: 'Weekly radar' }, TOKEN), TOKEN, routeOptions(w, watcher));
    console.log('C22 route delete answer:', response.status, JSON.stringify(await response.json()));
    watcher.close();
    writeFileSync(w.files.schedules, '');
    const entities = createEntities();
    entities.receive({ channel: 'schedule', version: 1, payload: readOf(['one', 'two']) as never });
    const store = createSchedule(entities, { terminalById: () => null, writes: { postCommand: () => Promise.resolve({ ok: true, status: 200, body: {}, failed: '' }) } as never });
    await store.remove({ at: 0, name: 'one' });
    entities.receive({ channel: 'schedule', version: 2, payload: readOf(['one', 'two']) as never });
    console.log('C22 page, delete answered, read with the same rows, rows:', JSON.stringify(store.rows().map((row) => row.name)));
});

it('C23', async () => {
    const client = createClientState();
    client.entities.receive({ channel: 'portfolio', version: 5, payload: snapshotOf(['a', 'b']) });
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(answerFor(404, { error: 'no entry' }))));
    await client.writes.deleteEntry('tasks', 'hub:a');
    console.log('C23 refused, removed:', client.pages.removed('tasks', 'hub:a'));
    vi.unstubAllGlobals();
    const entities = createEntities();
    entities.receive({ channel: 'schedule', version: 1, payload: readOf(['one']) as never });
    const store = createSchedule(entities, { terminalById: () => null, writes: { postCommand: () => Promise.resolve({ ok: false, status: 409, body: { error: 'entry-changed', names: [] }, failed: '' }) } as never });
    await store.remove({ at: 0, name: 'one' });
    console.log('C23 schedule refused, rows:', JSON.stringify(store.rows().map((row) => row.name)));
});

$ TMPDIR=.agents/scratch/tmp GIT_CEILING_DIRECTORIES=.agents/scratch/tmp npx vitest run --config .agents/scratch/v.config.ts --reporter=dot --silent=false
C16 fetch refused: [{"id":1,"message":"A write was refused: no remote","tone":"error","at":1794167661620,"actions":[],"read":false,"toast":true,"progress":null}]
C16 push refused: [{"id":1,"message":"A write was refused: rejected","tone":"error","at":1794167661621,"actions":[],"read":false,"toast":true,"progress":null}]
C16 pull refused: [{"id":1,"message":"A write was refused: conflict","tone":"error","at":1794167661622,"actions":[],"read":false,"toast":true,"progress":null}]
C16 sync refused: [{"id":1,"message":"A write was refused: behind","tone":"error","at":1794167661622,"actions":[],"read":false,"toast":true,"progress":null}]
C16 publish refused: [{"id":1,"message":"A write was refused: exists","tone":"error","at":1794167661623,"actions":[],"read":false,"toast":true,"progress":null}]
C16 commit refused: [{"id":1,"message":"A write was refused: nothing","tone":"error","at":1794167661623,"actions":[],"read":false,"toast":true,"progress":null}]
C16 fetch no answer: [{"id":1,"message":"A write got no answer: socket hung up","tone":"error","at":1794167661624,"actions":[],"read":false,"toast":true,"progress":null}]
C16 fetch cancelled: [{"id":1,"message":"A write was refused: fetch was stopped by Cancel","tone":"error","at":1794167661624,"actions":[],"read":false,"toast":true,"progress":null}]
C16 fetch refused with fields: [{"id":1,"message":"A write was refused: one; two","tone":"error","at":1794167661625,"actions":[],"read":false,"toast":true,"progress":null}]
C17 answer: 200 {"ok":true,"changed":["entries"],"refused":[]}
C17 log kind: delete-entry
C18 delete, next snapshot still holds the entry: [true,true]
C19 delete, snapshot holding it, snapshot without it: [true,true,false]
C20 snapshot without it arrived before the answer: [false,false]
C21 held, reconnect, lower version holding the entry: [true,true]
C22 watcher, a read with the same rows, versions: 1 1
C22 payload read: undefined
C25 two publishes with no read, versions: 1 1
C22 route delete answer: 200 {"ok":true}
C22 page, delete answered, read with the same rows, rows: ["two"]
C23 refused, removed: false
C23 schedule refused, rows: ["one"]
 Test Files  1 passed (1)
      Tests  5 passed (5)
```

A notice has no `text` field, so each row of C16 prints the notice whole.

## DONE / NOT DONE

| Row | State | Proof |
| --- | --- | --- |
| Items 1 to 10 | NOT DONE, not started | `diff -rq` of the four folders against the base copy printed nothing |
| The first run of every case | DONE | the section above |
| `npm run diagrams`, `npm run test:quick` | NOT RUN, 0 runs | the stop comes before any change |
| The ASCII gate over changed files | NOT RUN | no file of the step is changed |
| The grep and unused-exports checks of "Verify before you report" | NOT RUN | no file of the step is changed |
| The guarded tests G8, G28, G46, G91, G117 | NOT RUN | no file of the step is changed |
| No test added or changed | none | no test file is changed |

Run counts: `npm run test:quick` 0, `npm run diagrams` 0, any whole-suite command 0, the case-run program 1.

## Files with line counts

None changed. This report is the one file written (`.scratch/migration/agents/reviews/O170-report.md`); the case-run program and its folder under `.agents/scratch/` are removed.

## Judgment calls the brief left open

None were taken: nothing is built.

## Host- or user-visible changes

None: no code changed.

## Anything in the brief that was wrong or impossible

- Item 6's candidate rule against its sentence and C10, the section "The case the brief's rules get wrong" above. Everything else in the brief read true against the tree on this read.
- C24 does not exist in the brief's list of cases (C23 is followed by C25).

## Doc text

G152's three lines of `agents/guarded.md` as `grep -n` prints them:

```
237:- G152. An entry of a collection or a schedule that a delete the server took removed stays out of its list from the answer on, until a snapshot of the portfolio, or a read of the schedules, that no longer holds it arrives, and no longer: an entry put back by another hand in a later snapshot or read is shown again, a removal answered once such a snapshot or read has arrived is not held, and a refused delete keeps the row.
238:  Code: `src/lib/state/forms/settled.svelte.ts` (`remove`, `heard`), `src/lib/state/forms/page-entry.ts` (`settle.removed`, `removed`), `src/lib/state/client/context.ts` (`entities.afterReceive(settled.heard)`), `src/lib/state/system/machine/schedules/schedule.svelte.ts` (`removed`, the `afterReceive` listener).
239:  Test: `tests/state/forms/page-entry.test.ts`, describe 'an entry of a collection a write removed', every row, among them "is left out until a snapshot without it arrives through the client's own wiring"; `tests/state/system/schedule-lines.test.ts`, describe 'a schedule a delete took', every row.
```

Their replacements are written once the step is built, at the resume.
