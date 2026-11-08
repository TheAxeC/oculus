Everything in the brief is done

# O170 report

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

**The orchestrator's ruling (`.scratch/migration/agents/briefs/O170-cases.md`).** Option (a) is taken; option (b) is the worse option and neither option is the lazy one. Item 6's first bullet reads word for word: "the candidates: `side` as `placeOf` places it, when every figure's box is at least its `least`; with text, and only when `side` as `placeOf` places it misses a `least`, `side` forced under the text (`wide`), when it has room of its own and every box is at least its `least`; and `stacked`, which has no neighbour beside it and takes no `least`;". The rest of item 6 stands. A figure with no `least` meets it. `slide-layout.ts`'s head comment states the rule as that bullet gives it. C27 and C28 are added: the inputs of C12 with no `least`, and with each `least` 0.3, each answering `side`, `tall`, each box 0.3492, the unchanged answer. C4's reading is accepted: "a search never asks it" is the case of a listing that answered, and after a failed listing item 3 applies and the route answers `no-key` without asking the outside source (`handler.ts:144-145`). C24 is not a case of the brief and has no row.

## The cases' first run, every case, on the unchanged tree, as handed back

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

The C12-row answer on the unchanged tree, for C27 and C28 as the coordinator named it, is the line `C12 {"arrangement":"side","shape":"tall","height":0.4,"boxes":[0.3492,0.3492]}` above.

## The cases after the build

The builder runs no page: a case only a page shows names its look, with the view, the state and what should be seen, and reading of the code is what is quoted before it.

- **C1.** `grep -rn "citation-js" config --exclude=local.yml` prints nothing, exit 1. `config/text/views/feeds/literature.yml:18` reads as dictated. Look: Literature, a paper no source serves a BibTeX entry for, Copy BibTeX, the line names no library.
- **C2.** Reading: `Literature.svelte` `onMount` no longer holds a call of `go()`; `go()` (`:155`) is reached from the Search button and Enter alone. Look: a Literature tab with a query held, reload, the network log shows no `/api/literature?source=`, the form shows the query, the list the idle line.
- **C3.** Reading: `sources` is `listed ?? form.listed ?? configuredSources(config()?.config ?? {})` and the listing is saved through `change({ listed })` when it differs. Look: reload of a tab that has listed once, the buttons stand in the first frame and do not move when `?sources` answers; a new tab shows the config's rows from its first frame.
- **C4.** As the ruling reads it. Reading: `Head.svelte` `disabled={!source.available}`, and a row before the listing has `available: true`. After a listing, `sourceOn` needs `available`, so a search does not ask the source. Look on a scratch hub: a source whose required `downloads` row is absent is pressable until the listing answers, then disabled with its tooltip.
- **C5.** Reading: `go()` returns at once while `settled` is false, ahead of the line that sets the "none on" state. A failed listing sets `settled` and leaves `listed` null, so the drawn rows stay and Search asks those on and available. After the tab closes, `onMount`'s body returns at `if (closed) return`. Look with the route held.
- **C6.** Reading: `exportTab` takes `clear` from `sayFor` at the press, and calls it after `await print.answered`; `clear` empties the line only while the object on show is its own, and every `say` makes a new object. `export_running` and `export_blocked` go through `say`, so they stay. Look: Present, Export to PDF in a browser tab, "Opening the print tab..." goes once the print tab has been answered.
- **C7.** Reading: `Bar.svelte:139` `.said` takes `flex: 1 1 auto`, `max-width: 100%`, `min-width: 0`, in a `Toolbar` that wraps. Look: a narrow Present pane, the line stands whole on its own row.
- **C8.** Reading: under `.meters` one `.slides` grid holds `.current` and `.side`, `.presenter` is the size container, `@container (min-width: 572px)` switches at a pane of 596 px. At that width and above columns are `3fr 1fr`, below it rows are `3fr 2fr`, so the next slide's cell is inside the side at every size. Look: the presenter screen at 2400, 1400, 900, 620, 596, 590 and 400 px, heights 800 and 300 px, `getBoundingClientRect` of the frames and the notes; past the last slide, the end-of-deck line and no next slide.
- **C9 to C13, C27, C28.** The Node run below.
- **C14.** Reading: `Slide.svelte` reads `leastOf` at pass 0 of the `under` loop and lays out once more with it. Look on a scratch deck: a caption word wider than the box side by side is drawn stacked or under the text, no caption over the next figure.
- **C15.** Reading: the Facts chip stands after Export (`Bar.svelte:113`, Present `:90`, Presenter `:98`, Export `:106`), so nothing it draws sits to the left of those. Look: the left offsets of Present, Presenter and Export on a project slide, a non-project slide, the Overview and while presenting, by `getBoundingClientRect`.
- **C16.** The quoted run below. The look: a hub whose remote is unreachable.
- **C17 to C23, C25.** The rows of G152, quoted below with their failing or passing run on the unchanged tree. On the C22 row in `tests/state/system/schedule-lines.test.ts`, 'a read at its number whose rows are the same ends it'.
- **C26.** Reading: `export_blocked` goes through `say`, which replaces the opening line and is not cleared by this press's `clear`, since `clear` is reached only after a granted hold; a print page that never asks ends with `print.answered` at the end of the hold; a second deck's press takes a new object, so the first's `clear` finds another line on show and does nothing. Look: a browser that blocks the tab, and the two decks.

### The Node run of C9 to C13, C27 and C28, after the build

```
$ node --input-type=module -e "
import { layOut } from './src/lib/views/academic/present/screen/slide-layout.ts';
const p=(n,o)=>console.log(n, JSON.stringify(o===null?null:{arrangement:o.arrangement,shape:o.shape,height:o.height,boxes:o.figures.map(b=>+b.width.toFixed(4))}));
p('C9', layOut({room:{width:.9,height:.4},figures:[{ratio:.4,least:.5},{ratio:.4,least:.5}],text:null}));
p('C10', layOut({room:{width:.9,height:.4},figures:[{ratio:1.2,least:.1},{ratio:1.2,least:.1}],text:null}));
p('C11-none', layOut({room:{width:.9,height:.4},figures:[{ratio:1.2}],text:null}));
p('C11-least', layOut({room:{width:.9,height:.4},figures:[{ratio:1.2,least:5}],text:null}));
p('C12', layOut({room:{width:1,height:.4},figures:[{ratio:1,least:.36},{ratio:1,least:.36}],text:.02}));
p('C13', layOut({room:{width:1,height:.4},figures:[{ratio:1,least:.5},{ratio:1,least:.5}],text:.02}));
p('C27', layOut({room:{width:1,height:.4},figures:[{ratio:1},{ratio:1}],text:.02}));
p('C28', layOut({room:{width:1,height:.4},figures:[{ratio:1,least:.3},{ratio:1,least:.3}],text:.02}));
p('no-caption-one-line-text', layOut({room:{width:.8125,height:.35},figures:[{ratio:1},{ratio:1}],text:.03}));
"
C9 {"arrangement":"stacked","shape":"alone","height":0.4,"boxes":[0.08,0.08]}
C10 {"arrangement":"side","shape":"alone","height":0.4,"boxes":[0.45,0.45]}
C11-none {"arrangement":"one","shape":"alone","height":0.4,"boxes":[0.48]}
C11-least {"arrangement":"one","shape":"alone","height":0.4,"boxes":[0.48]}
C12 {"arrangement":"side","shape":"wide","height":0.4,"boxes":[0.38,0.38]}
C13 {"arrangement":"stacked","shape":"tall","height":0.4,"boxes":[0.2,0.2]}
C27 {"arrangement":"side","shape":"tall","height":0.4,"boxes":[0.3492,0.3492]}
C28 {"arrangement":"side","shape":"tall","height":0.4,"boxes":[0.3492,0.3492]}
no-caption-one-line-text {"arrangement":"side","shape":"tall","height":0.35,"boxes":[0.2555,0.2555]}
```

### The run of C16, after the build

`.agents/scratch/after.case.ts`, run through the vitest configuration quoted above, is the C16 test of the case-run program above with its last line printing `one.message`, and it asserts nothing. It and the configuration are removed.

```
$ TMPDIR=.agents/scratch/tmp GIT_CEILING_DIRECTORIES=.agents/scratch/tmp npx vitest run --config .agents/scratch/v.config.ts --reporter=dot --silent=false
C16 fetch refused: ["The fetch failed: no remote"]
C16 push refused: ["The push was refused: rejected"]
C16 pull refused: ["The pull failed: conflict"]
C16 sync refused: ["The sync failed: behind"]
C16 publish refused: ["The publish was refused: exists"]
C16 commit refused: ["A write was refused: nothing"]
C16 fetch no answer: ["A write got no answer: socket hung up"]
C16 fetch cancelled: ["The fetch failed: fetch was stopped by Cancel"]
C16 fetch refused with fields: ["The fetch failed: one; two"]
 Test Files  1 passed (1)
      Tests  1 passed (1)
```

### The new and changed tests: the unchanged tree, then the build

The tests were edited before any file under `src/` or `config/`, and run over the unchanged source. `<ellipsis>` stands for the character vitest prints where it shortens a title.

```
$ TMPDIR=.agents/scratch/tmp GIT_CEILING_DIRECTORIES=.agents/scratch/tmp npx vitest run tests/state/forms/page-entry.test.ts tests/state/system/schedule-lines.test.ts tests/routes/hubs/hub-writes.test.ts tests/routes/machine/schedules.test.ts tests/server/machine/runs/schedules/watch.test.ts -t "build|read|left out|schedule a delete took|removed|delete" --reporter=dot
Test Files  5 failed (5)
Tests  16 failed | 14 passed | 80 skipped (110)
```

| Test, on the unchanged tree | Result |
| --- | --- |
| schedules.test 'a delete names the read taken right a<ellipsis>' | `AssertionError: expected { ok: true } to deeply equal { ok: true, read: 7 }` |
| hub-writes, 'an entry of the primary hub' and 'an entry of the second hub' (rerun alone, 2 failed, 47 skipped) | `AssertionError: expected undefined to be 2 // Object.is equality` |
| page-entry 'a snapshot at the build that still ho<ellipsis>' | `expected [ true, true ] to deeply equal [ true, false ]` |
| page-entry 'an answer that names no build holds n<ellipsis>' | `expected [ true ] to deeply equal [ false ]` |
| page-entry 'a snapshot below what was seen at the<ellipsis>' | `expected [ false, true, true ] to deeply equal [ false, true, false ]` |
| page-entry 'a snapshot between what was seen and <ellipsis>' | `expected [ false, true, true, true ] to deeply equal [ false, true, true, false ]` |
| page-entry 'ends two removals each at its own build' | `expected [ Array(3) ] to deeply equal [ [ true, true ], <ellipsis>(2) ]` |
| page-entry "is left out until its build through the client's own wiring, a reconnect included" | `expected [ true, true, true, true, true ] to deeply equal [ true, true, false, true, false ]` |
| page-entry 'taken, its answer naming no build' | `expected true to be false // Object.is equality` |
| schedule-lines 'a read at its number whose rows are t<ellipsis>', 'an answer that names no read holds no<ellipsis>', 'a read below what was seen at the ans<ellipsis>' | `expected [ [ 'two' ] ] to deeply equal [ [ 'one', 'two' ] ]` |
| schedule-lines 'a read between what was seen and its <ellipsis>' | `expected [ [ 'two' ], [ 'two' ] ] to deeply equal [ [ 'two' ], [ 'one', 'two' ] ]` |
| schedule-lines 'ends two removals each at its own read' | `expected [ [], [], [] ] to deeply equal [ [], [ 'one' ], [ 'one', 'two' ] ]` |
| watch 'publishes every read with its number<ellipsis>' | `TypeError: made.nextRead is not a function` |

Passing on the unchanged tree, the behaviours the change preserves: watch 'sends one message for two publishes with no read between'; schedules 'a pause names none'; page-entry 'a snapshot below the build holds it a<ellipsis>', 'a removal answered with the channel a<ellipsis>', 'an entry put back by another hand aft<ellipsis>', 'refused', 'taken, its answer naming a build'; schedule-lines 'it is left out from the answer<ellipsis>', 'saved again by another hand<ellipsis>', 'a delete answered with the read at it<ellipsis>', 'a delete the server refused<ellipsis>'.

The same five files after the build, every row of G152 passing:

```
$ TMPDIR=.agents/scratch/tmp GIT_CEILING_DIRECTORIES=.agents/scratch/tmp npx vitest run tests/state/forms/page-entry.test.ts tests/state/system/schedule-lines.test.ts tests/routes/hubs/hub-writes.test.ts tests/routes/machine/schedules.test.ts tests/server/machine/runs/schedules/watch.test.ts --reporter=verbose
Test Files  5 passed (5)
Tests  110 passed (110)
```

### Every edit to an existing test

No threshold or predicate was loosened; each row below follows an item of the brief.

| File | Was | Is | Why |
| --- | --- | --- | --- |
| `tests/state/forms/page-entry.test.ts` | rows 'a delete answered before the snapshot without the entry arrives', 'a delete answered after the snapshot without the entry arrived', 'an entry put back by another hand in the next snapshot', each ended by the entry's absence | seven rows in `ROWS`, each with a numbered step, the three old stories among them as 'a snapshot below the build holds it and the one at the build ends it', 'a removal answered with the channel already at the build holds nothing', 'an entry put back by another hand after the build is shown' | item 9: a removal ends by its number |
| same | "is left out until a snapshot without it arrives through the client's own wiring" | "is left out until its build through the client's own wiring, a reconnect included" | item 9 and C21 |
| `tests/state/system/schedule-lines.test.ts` | three rows ended by a read without the entry; `readOf(names)`; payload without `read` | eight rows with numbers; `readOf(names, read)`; `read: 0` in `linesOver`'s payload | item 9 |
| `tests/routes/machine/schedules.test.ts`, `tests/server/machine/runs/schedules/file.test.ts`, `record.test.ts`, `tests/server/root/context-fixture.ts` | the fake of `SchedulesWatcher` | gains `nextRead: () => 1`, no assertion touched | `nextRead` joins the type |

The rows added beside these are `hub-writes.test.ts`, describe 'the build a delete-entry answer names'; `schedules.test.ts`, the `it.each` of 'a delete names the read taken right after its commit' and 'a pause names none'; `watch.test.ts`, describe 'the read number of the schedules payload'; page-entry's 'ends two removals each at its own build' and 'is held by the answer of the delete: $name'; schedule-lines' 'ends two removals each at its own read'.

## DONE / NOT DONE

| Row | State | Proof |
| --- | --- | --- |
| Items 1 to 10 | DONE | the sections above and the checks below; item 10's ledger text is under "Doc text" for the orchestrator |
| The first run of every case | DONE | the section above |
| The cases after the build | DONE where a run reaches them; C1 to C8, C14, C15 and C26, and C16's remote case, name their look on landing | the section above |
| `npm run diagrams` | DONE, exit 0 | 2 runs, one before each `npm run test:quick` |
| `npm run test:quick` | DONE, the last run prints `test:quick: 248.0 s; every command passed` | the lines below |
| The failed command, rerun alone | DONE | `npx vitest run tests/checks/source/comment-width.test.ts`: `Test Files  1 passed (1)`, `Tests  2 passed (2)` |
| The ASCII gate over every file the step changes | DONE, prints nothing, exit 0 | the perl line of the brief over the 38 paths |
| `grep -rn "citation-js" config --exclude=local.yml` | DONE, prints nothing, exit 1 | |
| `grep -rn "export_opened" config src tests --exclude=local.yml` | DONE, prints nothing, exit 1 | |
| `grep -n "shows()" src/lib/state/forms/settled.svelte.ts` | DONE, prints nothing, exit 1 | |
| `sh utils/unused-exports.sh` against the base's list | DONE, no line added | below |
| The guarded tests G8, G28, G46, G91, G117 | DONE | below |
| Each new or changed test on the unchanged tree, then after | DONE | the section above |
| Each new or changed sentence against the prose rule | DONE, by reading | the sentences read true; no departure to name |
| No history in added comments and titles | DONE | below |
| Size limits | DONE | every file in the list below is at or under 880 lines and every component at or under 520 |

**Full-list runs: 2.** The first failed one check: `FAILED  vitest checks (187.2 s)`, `tests/checks/source/comment-width.test.ts`, `tests/state/system/schedule-lines.test.ts:97` over the hundredth column. That comment was shortened, the check rerun alone, the list run once more.

The last run, `npm run test:quick -- <the 38 paths>` with `TMPDIR` unset:

```
test:quick: 38 changed file(s), from the given paths
test:quick: 227 test file(s)
ok      prettier (1.0 s): All matched files use Prettier code style!
ok      ASCII gate (1.0 s)
ok      svelte-kit sync (2.7 s)
ok      svelte-check (13.3 s): 1794169573895 COMPLETED 590 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (13.5 s)
ok      vitest checks (122.5 s): Duration  105.29s (transform 47.64s, setup 0ms, import 113.25s, tests 257.86s, environment 4ms)
ok      vitest (142.8 s): Duration  126.69s (transform 77.79s, setup 0ms, import 208.64s, tests 271.84s, environment 15.38s)
ok      vitest slow (245.3 s): Duration  229.26s (transform 25.31s, setup 0ms, import 133.62s, tests 774.86s, environment 14ms)
test:quick: 248.0 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source and tests/checks/tree,
            which run for any change under src, tests or utils; the build, the lint
            of unchanged files
```

The guarded tests, the 60 files named on the `Test:` lines of G8, G28, G46, G91 and G117:

```
$ TMPDIR=.agents/scratch/tmp GIT_CEILING_DIRECTORIES=.agents/scratch/tmp npx vitest run <the 60 files> --reporter=dot
 FAIL  |unit| tests/routes/edit/undo/config-save.test.ts > the Save of a Settings scope, one write of its file and one record > writes 'two options of the workspace file' in one record, and the undo puts it back
Error: Test timed out in 5000ms.
 Test Files  1 failed | 59 passed (60)
      Tests  1 failed | 794 passed (795)
$ TMPDIR=.agents/scratch/tmp GIT_CEILING_DIRECTORIES=.agents/scratch/tmp npx vitest run tests/routes/edit/undo/config-save.test.ts --reporter=dot
 Test Files  1 passed (1)
      Tests  13 passed (13)
```

That test hit vitest's 5000 ms limit with 60 files running side by side, and the file passes alone; this step changes neither it nor the config writes it covers. Whether it was load alone is a judgment, and the look is not what would settle it: a run of the same 60 files on the base copy would.

`diff .agents/worktrees/O170-base/unused-exports.txt <(sh utils/unused-exports.sh)` prints only lines the base has and this tree has not, so the step adds no line:

```
1,2d0
< ERROR: Error loading vite.config.ts (File './.svelte-kit/tsconfig.json' not found.)
< ERROR: Please fix or visit https://knip.dev/reference/known-issues
337d334
< knip stopped with status 2
```

Those three lines are the base copy's own (it has no `.svelte-kit` folder).

History words in the added comment lines and test titles, `git diff -U0 -- src tests` filtered to comment lines, `it(`, `it.each`, `describe(` and `name: '` lines, then for "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands", and the two new files read for the same words. Each hit, judged:

| Hit | Judgment |
| --- | --- |
| `form.ts`: "null before its first"; "a tab draws before any listing" | order within a tab's life, no history of the code |
| `export.ts`: "when it is still the line on show"; "while it is still this line on show" | the state at the call |
| `Literature.svelte`: "before that both do nothing"; "before which a search sends nothing"; "it is drawn still" | order at run time; "still" is motionless |
| `page-entry.test.ts`: 'a snapshot at the build that still holds the entry ends it' | the entry's state in that snapshot |
| `due.ts`: "at or before", "before a moment", "before `now`", "still sees the one before it" (moved text) | clock order, the comment moved unchanged from `watch.ts` |

Comments re-read beside the changed code and true as they stand: `src/lib/views/feeds/literature/words.ts:104` (names citation-js as what built the entry; `src/lib/state/feeds/literature/bibtex.ts` still loads it), `Stage.svelte:3` and `src/lib/themes/slide.css:2` (`SLIDE_SHAPE`, which the Presenter no longer imports and they still use). Comments rewritten by the step: the heads of `Literature.svelte`, `Head.svelte`, `run.svelte.ts`, `form.ts`, `export.ts`, `Bar.svelte`, `Presenter.svelte`, `Slide.svelte` (its layout paragraph alone), `drawn-slide.ts`, `slide-layout.ts`, `notice-sources.ts`, `settled.svelte.ts`, `watch.ts`, `routes.ts`, `context.ts:170-171`, `page-entry.ts` at `Settle.removed` and `removed`, and `schedule.svelte.ts` at `Removal`, the listener and `removed`.

Greps of the names the step removes: `export_opened` and `shows()` as above; `unwrittenListeners` and `holds(one` (of the schedule store) find nothing in `src`, `tests` or `config` beyond the unrelated `holds` of `file-undo.ts`, `problems.svelte.ts`, `symbols.ts`, `keys.ts` and `collection-text.ts`.

`src/lib/views/academic/present/Slide.svelte` hunks, `git diff -U0`: base lines 20-21, 32-34, 61, 254, 258 and 261, all inside the three ranges the brief allows, and the paragraph "The slide's foot" is untouched.

`.agents/scratch` is removed.

## Files with line counts

`wc -l` after the build. The two new files are the splits the brief allows.

| File | Lines |
| --- | --- |
| `config/text/statusbar.yml` | 263 |
| `config/text/views/academic/present.yml` | 152 |
| `config/text/views/feeds/literature.yml` | 111 |
| `src/lib/data/model/machine/model-machine.ts` | 852 |
| `src/lib/server/edit/writes.ts` | 805 |
| `src/lib/server/machine/runs/schedules/due.ts` (new) | 85 |
| `src/lib/server/machine/runs/schedules/routes.ts` | 354 |
| `src/lib/server/machine/runs/schedules/watch.ts` | 804 |
| `src/lib/server/root/context.ts` | 859 |
| `src/lib/state/client/context.ts` | 880 |
| `src/lib/state/client/shapes/payloads.ts` | 287 |
| `src/lib/state/client/shapes/unwritten.ts` (new) | 55 |
| `src/lib/state/client/shapes/write-answer.ts` | 65 |
| `src/lib/state/client/writes.svelte.ts` | 845 |
| `src/lib/state/feeds/literature/form.ts` | 156 |
| `src/lib/state/feeds/literature/run.svelte.ts` | 233 |
| `src/lib/state/forms/page-entry.ts` | 529 |
| `src/lib/state/forms/settled.svelte.ts` | 180 |
| `src/lib/state/shared/stores/shapes.ts` | 572 |
| `src/lib/state/system/machine/schedules/schedule.svelte.ts` | 811 |
| `src/lib/state/workbench/navigation/notice-sources.ts` | 424 |
| `src/lib/views/academic/present/Bar.svelte` | 155 |
| `src/lib/views/academic/present/Slide.svelte` | 493 |
| `src/lib/views/academic/present/acts/acts.svelte.ts` | 160 |
| `src/lib/views/academic/present/acts/export.ts` | 250 |
| `src/lib/views/academic/present/presenter/Presenter.svelte` | 284 |
| `src/lib/views/academic/present/screen/drawn-slide.ts` | 95 |
| `src/lib/views/academic/present/screen/slide-layout.ts` | 303 |
| `src/lib/views/feeds/literature/Head.svelte` | 163 |
| `src/lib/views/feeds/literature/Literature.svelte` | 345 |
| `tests/routes/hubs/hub-writes.test.ts` | 890 |
| `tests/routes/machine/schedules.test.ts` | 129 |
| `tests/server/machine/runs/schedules/file.test.ts` | 87 |
| `tests/server/machine/runs/schedules/record.test.ts` | 117 |
| `tests/server/machine/runs/schedules/watch.test.ts` | 425 |
| `tests/server/root/context-fixture.ts` | 251 |
| `tests/state/forms/page-entry.test.ts` | 570 |
| `tests/state/system/schedule-lines.test.ts` | 251 |

`npm run diagrams`, the first command of the verify list, also regenerates four files the brief's list does not name: `docs/diagrams/layer-state.dot` and `.svg` (the count `state/feeds to layer data` 41 to 42) and `docs/diagrams/layers.dot` and `.svg` (`state to data` 564 to 565), from the import of `literatureRows` in `form.ts`. They are left as generated, for the landing commit.

## Judgment calls the brief left open

- **The clearing of the export line** is `sayFor(line)`, which answers a function that clears the line only while the same object is on show; `said` is held as a `$state.raw` object so two lines of equal words are told apart. The alternative, comparing the words, would clear a later act's identical line.
- **The name `nextBuild`** on `WriteTarget`, optional since `target()`'s callers without a server have none to ask; such a removal answers with no `build` and holds nothing.
- **The two splits.** `shapes/unwritten.ts` holds the listeners and `tell`, since `writes.svelte.ts` stood at 877 lines of 880; `schedules/due.ts` holds the due-time helpers, since `watch.ts` stood at 873. `src/lib/state/client` is left at 10 items.
- **`Removal`'s shape** on the page: `{ seq, build, seen }` for an entry and `{ at, name, read, seen }` for a schedule.
- **`configuredSources`** is the name of the rows from the config, `keyed` being true when an `auth` row is required, and `key`, `help` and `bibtex` null, no listing having said them.
- **`least` is read at pass 0 of the `under` loop** at each factor tried, and the loop's break also waits for a figure with a `least` above 0, so a slide with no caption or explanation runs no extra layout.
- **`reload` adds to its count before the check that the watcher is closed**, the brief's "as its first statement"; a closed watcher publishes nothing, so the number has no reader then.

## Host- or user-visible changes

| View, state | Before | After |
| --- | --- | --- |
| Literature, Copy BibTeX of a paper no source serves | "BibTeX copied, built by citation-js because no source served one" | "BibTeX copied, built from the paper's fields because no source served one" |
| Literature, a tab with a query held, reload | a search goes to every source that is on | no request; the form holds the query, the list shows the idle line until Search or Enter |
| Literature, reload of a tab that has listed | no button until `?sources` answers | the last listing's buttons from the first frame, in its order |
| Literature, a new tab | no button until `?sources` answers | one button per row of the config, pressable, replaced when the listing answers |
| Literature, Search before the listing answers | a "none on" line | nothing happens |
| Literature, a listing that fails | no button, Search says none on | the rows stay, Search asks those on and available |
| Present, Export to PDF in a browser tab | "The deck opened in a new tab; the browser's print dialog saves it as a PDF.", kept | "Opening the print tab..." from the press, gone once the print tab is answered or the hold ends |
| Present, a narrow pane, a long status line | cut beside the controls | whole on its own row of the toolbar, cut only where wider than the pane |
| Present, presenter screen | below the wrap point the side is the pane's width and the next slide wider than the current | the current slide's frame at least as wide and tall as the next's at every pane size; below 596 px the slide over the side, the next slide and the notes as two equal columns |
| Present, a slide of figures side by side with a caption word wider than the box | the word runs over the next figure | drawn under the text or stacked, no word over a neighbour |
| Present, toolbar on a project slide against any other | Present, Presenter and Export move as the Facts chip comes and goes | those three stand still; the chip stands after Export |
| Status bar, a refused fetch, push, pull, sync or publish | "A write was refused: <reason>" | "The fetch failed: <reason>", "The push was refused: <reason>", "The pull failed: <reason>", "The sync failed: <reason>", "The publish was refused: <reason>" |
| A collection entry deleted and put back inside the portfolio's quiet window | the row stays out | the row comes back at the build the answer named |
| A schedule deleted and saved again by another window inside the wait | the row stays out | the row comes back at the read the answer named |

## Anything in the brief that was wrong or impossible

- Item 6's candidate rule against its sentence and C10, the section "The case the brief's rules get wrong" above, ruled by option (a).
- C24 does not exist in the brief's list of cases (C23 is followed by C25); the ruling needs no row.
- The list "Paths this step writes" leaves out the four `docs/diagrams` files that `npm run diagrams`, on the verify list, regenerates, named under "Files with line counts".

## Doc text

G152's three lines of `agents/guarded.md` as `grep -n` prints them:

```
237:- G152. An entry of a collection or a schedule that a delete the server took removed stays out of its list from the answer on, until a snapshot of the portfolio, or a read of the schedules, that no longer holds it arrives, and no longer: an entry put back by another hand in a later snapshot or read is shown again, a removal answered once such a snapshot or read has arrived is not held, and a refused delete keeps the row.
238:  Code: `src/lib/state/forms/settled.svelte.ts` (`remove`, `heard`), `src/lib/state/forms/page-entry.ts` (`settle.removed`, `removed`), `src/lib/state/client/context.ts` (`entities.afterReceive(settled.heard)`), `src/lib/state/system/machine/schedules/schedule.svelte.ts` (`removed`, the `afterReceive` listener).
239:  Test: `tests/state/forms/page-entry.test.ts`, describe 'an entry of a collection a write removed', every row, among them "is left out until a snapshot without it arrives through the client's own wiring"; `tests/state/system/schedule-lines.test.ts`, describe 'a schedule a delete took', every row.
```

Their replacements:

```
- G152. An entry of a collection or a schedule that a delete the server took removed stays out of its list from the answer on, until the first portfolio message or `schedule` payload numbered at the number its answer named or later, whether or not it holds the entry, or numbered below what was seen at the answer (a restarted server). A number between what was seen and the removal's holds it until the removal's. An entry put back by another hand is shown once that number has arrived, a removal answered with the number already reached or by an answer that names no number is not held, and a refused delete keeps the row. The `delete-entry` answer's `build` is the version of the next portfolio message, the schedules route's delete `read` is the number of the read after its commit, and the watcher publishes every read, also one whose rows equal the last.
  Code: `src/lib/state/forms/settled.svelte.ts` (`remove`, `heard`), `src/lib/state/forms/page-entry.ts` (`settle.removed`, `removed`), `src/lib/state/client/context.ts` (`entities.afterReceive(settled.heard)`), `src/lib/state/system/machine/schedules/schedule.svelte.ts` (`removed`, the `afterReceive` listener), `src/lib/server/edit/writes.ts` (`nextBuild`, the `delete-entry` branch), `src/lib/server/machine/runs/schedules/routes.ts` (the `read` of a delete in `commit`), `src/lib/server/machine/runs/schedules/watch.ts` (`reads`, `reload`, `nextRead`).
  Test: `tests/state/forms/page-entry.test.ts`, describe 'an entry of a collection a write removed', every row, among them "is left out until its build through the client's own wiring, a reconnect included"; `tests/state/system/schedule-lines.test.ts`, describe 'a schedule a delete took', every row; `tests/routes/hubs/hub-writes.test.ts`, describe 'the build a delete-entry answer names', every row; `tests/routes/machine/schedules.test.ts`, 'a delete names the read taken right after its commit', 'a pause names none'; `tests/server/machine/runs/schedules/watch.test.ts`, describe 'the read number of the schedules payload', every row.
```
