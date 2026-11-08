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

No threshold or predicate was loosened. The table has one row per changed line, 524 rows, made from `diff <base copy's file> <worktree's file>` of the eight changed test files, with the lines of each hunk paired in order. A dash is a line on neither side of that pair: a line added, or a line removed. The file is named by its base name; the columns give the line in the base copy, its text, the line in the worktree, its text. `hub-writes` base lines 47 to 75 are the helpers now in `tests/routes/hubs/hub-files-fixture.ts`, and base lines 774 to 859 are the describe and helper now in `tests/routes/hubs/hub-deck-writes.test.ts`; the "Repair round 1" section quotes the `diff` that shows those lines moved unchanged, an `export` added to each of the three functions apart.

| File | Base | Before | Worktree | After |
| --- | --- | --- | --- | --- |
| hub-writes | 11 | `` import { `` | 11 | `` import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'; `` |
| hub-writes | 12 | ``     existsSync, `` | 12 | `` import { isAbsolute, join } from 'node:path'; `` |
| hub-writes | 13 | ``     mkdirSync, `` | - | - |
| hub-writes | 14 | ``     readdirSync, `` | - | - |
| hub-writes | 15 | ``     readFileSync, `` | - | - |
| hub-writes | 16 | ``     realpathSync, `` | - | - |
| hub-writes | 17 | ``     statSync, `` | - | - |
| hub-writes | 18 | ``     writeFileSync `` | - | - |
| hub-writes | 19 | `` } from 'node:fs'; `` | - | - |
| hub-writes | 20 | `` import { isAbsolute, join, relative } from 'node:path'; `` | - | - |
| hub-writes | - | - | 17 | ``     carriedOf, `` |
| hub-writes | - | - | 19 | ``     target as serverTarget, `` |
| hub-writes | - | - | 23 | `` import { engineDir } from '../../../src/lib/data/sources/config.ts'; `` |
| hub-writes | - | - | 26 | `` import { contextFixture } from '../../server/root/context-fixture.ts'; `` |
| hub-writes | 32 | `` import { `` | 28 | `` import { TOKEN, changesOf, request, target, undone, warmConfig } from '../edit/write-fixture.ts'; `` |
| hub-writes | 33 | ``     DECK_ORDER, `` | 29 | `` import { differing, filesOf, heldBy } from './hub-files-fixture.ts'; `` |
| hub-writes | 34 | ``     DECK_PATH, `` | - | - |
| hub-writes | 35 | ``     TOKEN, `` | - | - |
| hub-writes | 36 | ``     changesOf, `` | - | - |
| hub-writes | 37 | ``     deckOf, `` | - | - |
| hub-writes | 38 | ``     deckTarget, `` | - | - |
| hub-writes | 39 | ``     request, `` | - | - |
| hub-writes | 40 | ``     target, `` | - | - |
| hub-writes | 41 | ``     undone, `` | - | - |
| hub-writes | 42 | ``     warmConfig `` | - | - |
| hub-writes | 43 | `` } from '../edit/write-fixture.ts'; `` | - | - |
| hub-writes | 46 | (blank) | - | - |
| hub-writes | 47 | `` /** The log, the overrides and the bookmarks are beside the hub's files and are not its content. */ `` | - | - |
| hub-writes | 48 | `` const BESIDE = new Set(['changes.jsonl', 'sessions.json', 'bookmarks.yml']); `` | - | - |
| hub-writes | 49 | (blank) | - | - |
| hub-writes | 50 | `` /** Every file under a hub by its path inside it, with its text. */ `` | - | - |
| hub-writes | 51 | `` function filesOf(dir: string, at = ''): Map<string, string> { `` | - | - |
| hub-writes | 52 | ``     const held = new Map<string, string>(); `` | - | - |
| hub-writes | 53 | ``     for (const name of readdirSync(join(dir, at))) { `` | - | - |
| hub-writes | 54 | ``         const path = join(at, name); `` | - | - |
| hub-writes | 55 | ``         if (at === '' && BESIDE.has(name)) continue; `` | - | - |
| hub-writes | 56 | ``         if (statSync(join(dir, path)).isDirectory()) { `` | - | - |
| hub-writes | 57 | ``             for (const [key, text] of filesOf(dir, path)) held.set(key, text); `` | - | - |
| hub-writes | 58 | ``         } else { `` | - | - |
| hub-writes | 59 | ``             held.set(path, readFileSync(join(dir, path), 'utf8')); `` | - | - |
| hub-writes | 60 | ``         } `` | - | - |
| hub-writes | 61 | ``     } `` | - | - |
| hub-writes | 62 | ``     return held; `` | - | - |
| hub-writes | 63 | `` } `` | - | - |
| hub-writes | 65 | `` /** The paths whose text differs between two readings, or that only one of them holds. */ `` | - | - |
| hub-writes | 66 | `` function differing(before: Map<string, string>, after: Map<string, string>): string[] { `` | - | - |
| hub-writes | 67 | ``     const paths = new Set([...before.keys(), ...after.keys()]); `` | - | - |
| hub-writes | 68 | ``     return [...paths].filter((path) => before.get(path) !== after.get(path)).sort(); `` | - | - |
| hub-writes | 69 | `` } `` | - | - |
| hub-writes | 70 | (blank) | - | - |
| hub-writes | 71 | `` /** Whether a file lies inside a hub's folder, the folder named by either of its two spellings. */ `` | - | - |
| hub-writes | 72 | `` function heldBy(dir: string, file: string): boolean { `` | - | - |
| hub-writes | 73 | ``     return [dir, realpathSync(dir)].some((one) => !relative(one, file).startsWith('..')); `` | - | - |
| hub-writes | 74 | `` } `` | - | - |
| hub-writes | 75 | (blank) | - | - |
| hub-writes | - | - | 216 | (blank) |
| hub-writes | - | - | 217 | `` describe('the build a delete-entry answer names', () => { `` |
| hub-writes | - | - | 218 | ``     it.each([ `` |
| hub-writes | - | - | 219 | ``         { name: 'an entry of the primary hub', id: 'hub:Another task' }, `` |
| hub-writes | - | - | 220 | ``         { name: 'an entry of the second hub', id: 'lab:Another task' } `` |
| hub-writes | - | - | 221 | ``     ])('is the version of the next portfolio message: $name', async ({ id }) => { `` |
| hub-writes | - | - | 222 | ``         const context = contextFixture({ engine: engineDir() }); `` |
| hub-writes | - | - | 223 | ``         const { nextBuild } = serverTarget( `` |
| hub-writes | - | - | 224 | ``             context.engine, `` |
| hub-writes | - | - | 225 | ``             context.configCache.read().config, `` |
| hub-writes | - | - | 226 | ``             carriedOf(context), `` |
| hub-writes | - | - | 227 | ``             context `` |
| hub-writes | - | - | 228 | ``         ); `` |
| hub-writes | - | - | 229 | ``         context.hub.publish('portfolio', { built: 'before the write' }); `` |
| hub-writes | - | - | 230 | ``         const { into } = twoHubs(); `` |
| hub-writes | - | - | 231 | ``         const response = await handleWrite( `` |
| hub-writes | - | - | 232 | ``             request({ kind: 'delete-entry', collection: 'tasks', id }), `` |
| hub-writes | - | - | 233 | ``             TOKEN, `` |
| hub-writes | - | - | 234 | ``             { ...into, nextBuild } `` |
| hub-writes | - | - | 235 | ``         ); `` |
| hub-writes | - | - | 236 | ``         expect(response.status).toBe(200); `` |
| hub-writes | - | - | 237 | ``         const { build } = (await response.json()) as { build?: number }; `` |
| hub-writes | - | - | 238 | ``         expect(build).toBe(2); `` |
| hub-writes | - | - | 239 | ``         expect(context.hub.publish('portfolio', { built: 'after the write' })).toBe(build); `` |
| hub-writes | - | - | 240 | ``         context.close(); `` |
| hub-writes | - | - | 241 | ``     }); `` |
| hub-writes | - | - | 242 | `` }); `` |
| hub-writes | 773 | (blank) | - | - |
| hub-writes | 774 | `` /** Two deck hubs: each holds the portfolio deck and the decks of its three projects. */ `` | - | - |
| hub-writes | 775 | `` function twoDeckHubs(): { into: PrimaryTarget; first: string; lab: string } { `` | - | - |
| hub-writes | 776 | ``     const first = deckTarget(); `` | - | - |
| hub-writes | 777 | ``     const second = deckTarget(); `` | - | - |
| hub-writes | 778 | ``     const labProjects = second.projects().map((project) => ({ `` | - | - |
| hub-writes | 779 | ``         ...project, `` | - | - |
| hub-writes | 780 | ``         id: `lab:${project.id}`, `` | - | - |
| hub-writes | 781 | ``         root: 'lab' `` | - | - |
| hub-writes | 782 | ``     })); `` | - | - |
| hub-writes | 783 | ``     const into: PrimaryTarget = { `` | - | - |
| hub-writes | 784 | ``         ...first, `` | - | - |
| hub-writes | 785 | ``         projects: () => [...first.projects(), ...labProjects], `` | - | - |
| hub-writes | 786 | ``         files: { `` | - | - |
| hub-writes | 787 | ``             roots: () => [ `` | - | - |
| hub-writes | 788 | ``                 { key: 'hub', dir: first.hub }, `` | - | - |
| hub-writes | 789 | ``                 { key: 'lab', dir: second.hub } `` | - | - |
| hub-writes | 790 | ``             ] `` | - | - |
| hub-writes | 791 | ``         }, `` | - | - |
| hub-writes | 792 | ``         hubs: [{ key: 'lab', hub: second.hub, config: second.config }] `` | - | - |
| hub-writes | 793 | ``     }; `` | - | - |
| hub-writes | 794 | ``     return { into, first: first.hub, lab: second.hub }; `` | - | - |
| hub-writes | 795 | `` } `` | - | - |
| hub-writes | 796 | (blank) | - | - |
| hub-writes | 797 | `` describe('a deck write to the second hub', () => { `` | - | - |
| hub-writes | 798 | ``     const MOVE = [ `` | - | - |
| hub-writes | 799 | ``         { group: 'pillars', base: ['alpha'], slides: ['beta'] }, `` | - | - |
| hub-writes | 800 | ``         { group: 'more', base: [], slides: ['alpha'] } `` | - | - |
| hub-writes | 801 | ``     ]; `` | - | - |
| hub-writes | 802 | ``     const send = (groups: unknown, over: Record<string, unknown> = {}): unknown => ({ `` | - | - |
| hub-writes | 803 | ``         kind: 'deck-slides', `` | - | - |
| hub-writes | 804 | ``         root: 'lab', `` | - | - |
| hub-writes | 805 | ``         path: DECK_PATH, `` | - | - |
| hub-writes | 806 | ``         groups, `` | - | - |
| hub-writes | 807 | ``         ...over `` | - | - |
| hub-writes | 808 | ``     }); `` | - | - |
| hub-writes | 809 | (blank) | - | - |
| hub-writes | 810 | ``     it('writes the deck file of the second hub, logs its path and undoes it', async () => { `` | - | - |
| hub-writes | 811 | ``         const { into, first, lab } = twoDeckHubs(); `` | - | - |
| hub-writes | 812 | ``         const before = { first: filesOf(first), lab: filesOf(lab) }; `` | - | - |
| hub-writes | 813 | ``         const response = await handleWrite(request(send(MOVE)), TOKEN, into); `` | - | - |
| hub-writes | 814 | ``         expect(response.status).toBe(200); `` | - | - |
| hub-writes | 815 | ``         expect(differing(before.first, filesOf(first))).toEqual([]); `` | - | - |
| hub-writes | 816 | ``         expect(differing(before.lab, filesOf(lab))).toEqual([DECK_PATH]); `` | - | - |
| hub-writes | 817 | ``         const records = changesOf(into); `` | - | - |
| hub-writes | 818 | ``         expect(records).toHaveLength(2); `` | - | - |
| hub-writes | 819 | ``         for (const record of records) { `` | - | - |
| hub-writes | 820 | ``             expect(heldBy(lab, record.file)).toBe(true); `` | - | - |
| hub-writes | 821 | ``             expect(record.file.endsWith(DECK_PATH)).toBe(true); `` | - | - |
| hub-writes | 822 | ``             expect((await undone(into, record)).status).toBe(200); `` | - | - |
| hub-writes | 823 | ``         } `` | - | - |
| hub-writes | 824 | ``         expect(differing(before.lab, filesOf(lab))).toEqual([]); `` | - | - |
| hub-writes | 825 | ``         expect(deckOf({ ...into, hub: lab })).toBe(before.lab.get(DECK_PATH)); `` | - | - |
| hub-writes | 826 | ``     }); `` | - | - |
| hub-writes | 827 | (blank) | - | - |
| hub-writes | 828 | ``     it('refuses a base the file of the second hub does not hold, and writes nothing', async () => { `` | - | - |
| hub-writes | 829 | ``         const { into, first, lab } = twoDeckHubs(); `` | - | - |
| hub-writes | 830 | ``         const before = { first: filesOf(first), lab: filesOf(lab) }; `` | - | - |
| hub-writes | 831 | ``         const response = await handleWrite( `` | - | - |
| hub-writes | 832 | ``             request(send([{ group: 'pillars', base: ['beta'], slides: ['alpha'] }])), `` | - | - |
| hub-writes | 833 | ``             TOKEN, `` | - | - |
| hub-writes | 834 | ``             into `` | - | - |
| hub-writes | 835 | ``         ); `` | - | - |
| hub-writes | 836 | ``         expect(response.status).toBe(200); `` | - | - |
| hub-writes | 837 | ``         const answer = (await response.json()) as { `` | - | - |
| hub-writes | 838 | ``             changed: string[]; `` | - | - |
| hub-writes | 839 | ``             refused: { reason: string }[]; `` | - | - |
| hub-writes | 840 | ``         }; `` | - | - |
| hub-writes | 841 | ``         expect(answer.changed).toEqual([]); `` | - | - |
| hub-writes | 842 | ``         expect(answer.refused.map((one) => one.reason)).toEqual([ `` | - | - |
| hub-writes | 843 | ``             "The group's slides list changed on disk while you were working. Read the deck again and make the change again." `` | - | - |
| hub-writes | 844 | ``         ]); `` | - | - |
| hub-writes | 845 | ``         expect(differing(before.first, filesOf(first))).toEqual([]); `` | - | - |
| hub-writes | 846 | ``         expect(differing(before.lab, filesOf(lab))).toEqual([]); `` | - | - |
| hub-writes | 847 | ``         expect(changesOf(into)).toEqual([]); `` | - | - |
| hub-writes | 848 | ``     }); `` | - | - |
| hub-writes | 849 | (blank) | - | - |
| hub-writes | 850 | ``     it('writes the order list of the second hub', async () => { `` | - | - |
| hub-writes | 851 | ``         const { into, first, lab } = twoDeckHubs(); `` | - | - |
| hub-writes | 852 | ``         const before = { first: filesOf(first), lab: filesOf(lab) }; `` | - | - |
| hub-writes | 853 | ``         const order = { base: DECK_ORDER, entries: ['slides:more', 'intro.md', 'slides:pillars'] }; `` | - | - |
| hub-writes | 854 | ``         const response = await handleWrite(request(send([], { order })), TOKEN, into); `` | - | - |
| hub-writes | 855 | ``         expect(response.status).toBe(200); `` | - | - |
| hub-writes | 856 | ``         expect(differing(before.first, filesOf(first))).toEqual([]); `` | - | - |
| hub-writes | 857 | ``         expect(differing(before.lab, filesOf(lab))).toEqual([DECK_PATH]); `` | - | - |
| hub-writes | 858 | ``     }); `` | - | - |
| hub-writes | 859 | `` }); `` | - | - |
| schedules | 29 | ``         const schedules: SchedulesWatcher = { reload, runNow, close: vi.fn() }; `` | 29 | ``         const schedules: SchedulesWatcher = { reload, runNow, nextRead: () => 1, close: vi.fn() }; `` |
| schedules | - | - | 67 | ``             nextRead: () => 1, `` |
| schedules | - | - | 100 | (blank) |
| schedules | - | - | 101 | ``     it.each([ `` |
| schedules | - | - | 102 | ``         { name: 'a delete names the read taken right after its commit', action: 'delete', read: 7 }, `` |
| schedules | - | - | 103 | ``         { name: 'a pause names none', action: 'pause', read: undefined } `` |
| schedules | - | - | 104 | ``     ])('$name', async ({ action, read }) => { `` |
| schedules | - | - | 105 | ``         const w = world(); `` |
| schedules | - | - | 106 | ``         const held = entryText(w, 'task'); `` |
| schedules | - | - | 107 | ``         writeFileSync(w.files.schedules, held); `` |
| schedules | - | - | 108 | ``         const holdsAtTheCall: boolean[] = []; `` |
| schedules | - | - | 109 | ``         const schedules: SchedulesWatcher = { `` |
| schedules | - | - | 110 | ``             reload: vi.fn(), `` |
| schedules | - | - | 111 | ``             runNow: vi.fn(), `` |
| schedules | - | - | 112 | ``             nextRead: () => { `` |
| schedules | - | - | 113 | ``                 holdsAtTheCall.push(readFileSync(w.files.schedules, 'utf8') === held); `` |
| schedules | - | - | 114 | ``                 return 7; `` |
| schedules | - | - | 115 | ``             }, `` |
| schedules | - | - | 116 | ``             close: vi.fn() `` |
| schedules | - | - | 117 | ``         }; `` |
| schedules | - | - | 118 | ``         const response = await handleSchedules( `` |
| schedules | - | - | 119 | ``             pagePost(`${HOST}/api/schedules`, { action, at: 0, name: 'Weekly radar' }, TOKEN), `` |
| schedules | - | - | 120 | ``             TOKEN, `` |
| schedules | - | - | 121 | ``             routeOptions(w, schedules) `` |
| schedules | - | - | 122 | ``         ); `` |
| schedules | - | - | 123 | ``         expect(response.status).toBe(200); `` |
| schedules | - | - | 124 | ``         expect(await response.json()).toEqual( `` |
| schedules | - | - | 125 | ``             read === undefined ? { ok: true } : { ok: true, read } `` |
| schedules | - | - | 126 | ``         ); `` |
| schedules | - | - | 127 | ``         expect(holdsAtTheCall).toEqual(read === undefined ? [] : [false]); `` |
| schedules | - | - | 128 | ``     }); `` |
| file | 45 | ``         const schedules: SchedulesWatcher = { reload, runNow: vi.fn(), close: vi.fn() }; `` | 45 | ``         const schedules: SchedulesWatcher = { `` |
| file | - | - | 46 | ``             reload, `` |
| file | - | - | 47 | ``             runNow: vi.fn(), `` |
| file | - | - | 48 | ``             nextRead: () => 1, `` |
| file | - | - | 49 | ``             close: vi.fn() `` |
| file | - | - | 50 | ``         }; `` |
| record | 90 | ``             const schedules: SchedulesWatcher = { reload, runNow: vi.fn(), close: vi.fn() }; `` | 90 | ``             const schedules: SchedulesWatcher = { `` |
| record | - | - | 91 | ``                 reload, `` |
| record | - | - | 92 | ``                 runNow: vi.fn(), `` |
| record | - | - | 93 | ``                 nextRead: () => 1, `` |
| record | - | - | 94 | ``                 close: vi.fn() `` |
| record | - | - | 95 | ``             }; `` |
| watch | - | - | 385 | ``         }); `` |
| watch | - | - | 386 | ``     }); `` |
| watch | - | - | 387 | `` }); `` |
| watch | - | - | 388 | (blank) |
| watch | - | - | 389 | `` describe('the read number of the schedules payload', () => { `` |
| watch | - | - | 390 | ``     /** The number of the last payload published. */ `` |
| watch | - | - | 391 | ``     function readNumber(hub: Hub): unknown { `` |
| watch | - | - | 392 | ``         return (hub.latest('schedule')?.payload as { read?: unknown }).read; `` |
| watch | - | - | 393 | ``     } `` |
| watch | - | - | 394 | (blank) |
| watch | - | - | 395 | ``     it('publishes every read with its number, also one whose rows equal the last', async () => { `` |
| watch | - | - | 396 | ``         const { w, hub, driver } = daily('task'); `` |
| watch | - | - | 397 | ``         const made = watch(w, hub, driver); `` |
| watch | - | - | 398 | ``         await settle(); `` |
| watch | - | - | 399 | ``         const version = hub.version('schedule'); `` |
| watch | - | - | 400 | ``         const read = readNumber(hub) as number; `` |
| watch | - | - | 401 | ``         expect(made.nextRead()).toBe(read + 1); `` |
| watch | - | - | 402 | ``         made.reload(); `` |
| watch | - | - | 403 | ``         expect(hub.version('schedule')).toBe(version + 1); `` |
| watch | - | - | 404 | ``         expect(readNumber(hub)).toBe(read + 1); `` |
| watch | - | - | 405 | ``         expect(made.nextRead()).toBe(read + 2); `` |
| watch | - | - | 406 | ``     }); `` |
| watch | - | - | 407 | (blank) |
| watch | - | - | 408 | ``     it('sends one message for two publishes with no read between', async () => { `` |
| watch | - | - | 409 | ``         const { w, hub, driver } = daily('task'); `` |
| watch | - | - | 410 | ``         let tell = (): void => undefined; `` |
| watch | - | - | 411 | ``         const made = watcherOver(w, hub, driver, undefined, { `` |
| watch | - | - | 412 | ``             unreadable: () => null, `` |
| watch | - | - | 413 | ``             onChange: (listener) => { `` |
| watch | - | - | 414 | ``                 tell = listener; `` |
| watch | - | - | 415 | ``                 return () => undefined; `` |
| watch | - | - | 416 | ``             } `` |
| watch | - | - | 418 | ``         open.push(made); `` |
| watch | - | - | 419 | ``         await settle(); `` |
| watch | - | - | 420 | ``         const version = hub.version('schedule'); `` |
| watch | - | - | 421 | ``         tell(); `` |
| watch | - | - | 422 | ``         tell(); `` |
| watch | - | - | 423 | ``         expect(hub.version('schedule')).toBe(version); `` |
| context-fixture | - | - | 154 | ``             nextRead: () => 1, `` |
| page-entry | 4 | `` // out of its list: until a snapshot that no longer holds it arrives, and no longer. The snapshot `` | 4 | `` // out of its list: until the first snapshot numbered at the build its answer named or later, or `` |
| page-entry | 5 | `` // and the feeds are synthetic and hold only what the page reads. `` | 5 | `` // below what was seen at the answer. The snapshot and the feeds are synthetic and hold only what `` |
| page-entry | - | - | 6 | `` // the page reads. `` |
| page-entry | 7 | `` import { describe, expect, it } from 'vitest'; `` | 8 | `` import { describe, expect, it, vi } from 'vitest'; `` |
| page-entry | 422 | ``     /** A delete of `hub:a` answered with success, or a snapshot arriving holding the keys given. */ `` | 423 | ``     /** `` |
| page-entry | 423 | ``     type Step = 'delete' \| string[]; `` | 424 | ``      * A delete of `hub:a` answered with the build given (undefined for an answer that names none), `` |
| page-entry | 424 | ``     /** The steps, and after each whether the Tasks list leaves `hub:a` out. */ `` | 425 | ``      * or a snapshot of the version given arriving, holding the keys given. `` |
| page-entry | - | - | 426 | ``      */ `` |
| page-entry | - | - | 427 | ``     type Step = { build: number \| undefined } \| { version: number; keys: string[] }; `` |
| page-entry | - | - | 428 | ``     /** The steps, the channel starting at version 1, and after each whether `hub:a` is left out. */ `` |
| page-entry | - | - | 431 | ``     const AB = ['a', 'b']; `` |
| page-entry | - | - | 432 | (blank) |
| page-entry | 429 | ``             name: 'a delete answered before the snapshot without the entry arrives', `` | 435 | ``             name: 'a snapshot below the build holds it and the one at the build ends it', `` |
| page-entry | 430 | ``             steps: ['delete', ['a', 'b'], ['a', 'b'], ['b'], ['b']], `` | 436 | ``             steps: [ `` |
| page-entry | 431 | ``             left: [true, true, true, false, false] `` | 437 | ``                 { build: 3 }, `` |
| page-entry | - | - | 438 | ``                 { version: 2, keys: AB }, `` |
| page-entry | - | - | 439 | ``                 { version: 3, keys: ['b'] }, `` |
| page-entry | - | - | 440 | ``                 { version: 4, keys: ['b'] } `` |
| page-entry | - | - | 441 | ``             ], `` |
| page-entry | - | - | 442 | ``             left: [true, true, false, false] `` |
| page-entry | 434 | ``             name: 'a delete answered after the snapshot without the entry arrived', `` | 445 | ``             name: 'a snapshot at the build that still holds the entry ends it', `` |
| page-entry | 435 | ``             steps: [['b'], 'delete', ['b']], `` | 446 | ``             steps: [{ build: 2 }, { version: 2, keys: AB }], `` |
| page-entry | 436 | ``             left: [false, false, false] `` | 447 | ``             left: [true, false] `` |
| page-entry | 439 | ``             name: 'an entry put back by another hand in the next snapshot', `` | 450 | ``             name: 'a removal answered with the channel already at the build holds nothing', `` |
| page-entry | 440 | ``             steps: ['delete', ['b'], ['a', 'b']], `` | 451 | ``             steps: [{ version: 2, keys: ['b'] }, { build: 2 }], `` |
| page-entry | - | - | 452 | ``             left: [false, false] `` |
| page-entry | - | - | 453 | ``         }, `` |
| page-entry | - | - | 454 | ``         { `` |
| page-entry | - | - | 455 | ``             name: 'an answer that names no build holds nothing', `` |
| page-entry | - | - | 456 | ``             steps: [{ build: undefined }], `` |
| page-entry | - | - | 457 | ``             left: [false] `` |
| page-entry | - | - | 458 | ``         }, `` |
| page-entry | - | - | 459 | ``         { `` |
| page-entry | - | - | 460 | ``             name: 'a snapshot below what was seen at the answer, a restarted server, ends it', `` |
| page-entry | - | - | 461 | ``             steps: [{ version: 3, keys: AB }, { build: 5 }, { version: 1, keys: AB }], `` |
| page-entry | - | - | 462 | ``             left: [false, true, false] `` |
| page-entry | - | - | 463 | ``         }, `` |
| page-entry | - | - | 464 | ``         { `` |
| page-entry | - | - | 465 | ``             name: 'a snapshot between what was seen and the build holds it until the build', `` |
| page-entry | - | - | 466 | ``             steps: [ `` |
| page-entry | - | - | 467 | ``                 { version: 3, keys: AB }, `` |
| page-entry | - | - | 468 | ``                 { build: 5 }, `` |
| page-entry | - | - | 469 | ``                 { version: 4, keys: AB }, `` |
| page-entry | - | - | 470 | ``                 { version: 5, keys: AB } `` |
| page-entry | - | - | 471 | ``             ], `` |
| page-entry | - | - | 472 | ``             left: [false, true, true, false] `` |
| page-entry | - | - | 473 | ``         }, `` |
| page-entry | - | - | 474 | ``         { `` |
| page-entry | - | - | 475 | ``             name: 'an entry put back by another hand after the build is shown', `` |
| page-entry | - | - | 476 | ``             steps: [{ build: 2 }, { version: 2, keys: ['b'] }, { version: 3, keys: AB }], `` |
| page-entry | 445 | ``     it.each(ROWS)('is left out only until a snapshot without it: $name', ({ steps, left }) => { `` | 481 | ``     it.each(ROWS)('is left out until its build: $name', ({ steps, left }) => { `` |
| page-entry | 446 | ``         let held = tasksOf(['a', 'b']); `` | 482 | ``         let held = tasksOf(AB); `` |
| page-entry | 451 | ``             if (step === 'delete') { `` | 487 | ``             if ('build' in step) { `` |
| page-entry | 452 | ``                 pages.settle.removed('tasks', 'hub:a', settled.begin()); `` | 488 | ``                 pages.settle.removed('tasks', 'hub:a', settled.begin(), step.build); `` |
| page-entry | 454 | ``                 held = tasksOf(step); `` | 490 | ``                 held = tasksOf(step.keys); `` |
| page-entry | 455 | ``                 version += 1; `` | 491 | ``                 version = step.version; `` |
| page-entry | 463 | ``     it("is left out until a snapshot without it arrives through the client's own wiring", () => { `` | 499 | ``     it('ends two removals each at its own build', () => { `` |
| page-entry | 464 | ``         const client = createClientState(); `` | - | - |
| page-entry | 466 | ``         const arrive = (keys: string[]): boolean => { `` | 501 | ``         const settled = createSettled(() => version); `` |
| page-entry | 467 | ``             client.entities.receive({ channel: 'portfolio', version, payload: tasksOf(keys) }); `` | 502 | ``         const pages = createPages({ snapshot: () => tasksOf(AB), feeds: () => null }, settled); `` |
| page-entry | 468 | ``             version += 1; `` | 503 | ``         pages.settle.removed('tasks', 'hub:a', settled.begin(), 2); `` |
| page-entry | - | - | 504 | ``         pages.settle.removed('tasks', 'hub:b', settled.begin(), 3); `` |
| page-entry | - | - | 505 | ``         const left = (): boolean[] => [ `` |
| page-entry | - | - | 506 | ``             pages.removed('tasks', 'hub:a'), `` |
| page-entry | - | - | 507 | ``             pages.removed('tasks', 'hub:b') `` |
| page-entry | - | - | 508 | ``         ]; `` |
| page-entry | - | - | 509 | ``         const seen = [left()]; `` |
| page-entry | - | - | 510 | ``         for (const next of [2, 3]) { `` |
| page-entry | - | - | 511 | ``             version = next; `` |
| page-entry | - | - | 512 | ``             settled.heard(); `` |
| page-entry | - | - | 513 | ``             seen.push(left()); `` |
| page-entry | - | - | 514 | ``         } `` |
| page-entry | - | - | 515 | ``         expect(seen).toEqual([ `` |
| page-entry | - | - | 516 | ``             [true, true], `` |
| page-entry | - | - | 517 | ``             [false, true], `` |
| page-entry | - | - | 518 | ``             [false, false] `` |
| page-entry | - | - | 519 | ``         ]); `` |
| page-entry | - | - | 520 | ``     }); `` |
| page-entry | - | - | 521 | (blank) |
| page-entry | - | - | 522 | ``     it("is left out until its build through the client's own wiring, a reconnect included", () => { `` |
| page-entry | - | - | 523 | ``         const client = createClientState(); `` |
| page-entry | - | - | 524 | ``         const arrive = (version: number): boolean => { `` |
| page-entry | - | - | 525 | ``             client.entities.receive({ channel: 'portfolio', version, payload: tasksOf(AB) }); `` |
| page-entry | 471 | ``         arrive(['a', 'b']); `` | 528 | ``         arrive(4); `` |
| page-entry | 472 | ``         client.pages.settle.removed('tasks', 'hub:a', client.settled.begin()); `` | 529 | ``         client.pages.settle.removed('tasks', 'hub:a', client.settled.begin(), 6); `` |
| page-entry | 473 | ``         const seen = [client.pages.removed('tasks', 'hub:a')]; `` | 530 | ``         const seen = [client.pages.removed('tasks', 'hub:a'), arrive(5), arrive(6)]; `` |
| page-entry | 474 | ``         for (const keys of [['a', 'b'], ['b'], ['a', 'b']]) seen.push(arrive(keys)); `` | 531 | ``         client.pages.settle.removed('tasks', 'hub:a', client.settled.begin(), 8); `` |
| page-entry | 475 | ``         expect(seen).toEqual([true, true, false, false]); `` | 532 | ``         seen.push(client.pages.removed('tasks', 'hub:a')); `` |
| page-entry | - | - | 533 | ``         client.entities.reconnected(); `` |
| page-entry | - | - | 534 | ``         seen.push(arrive(1)); `` |
| page-entry | - | - | 535 | ``         expect(seen).toEqual([true, true, false, true, false]); `` |
| page-entry | - | - | 537 | (blank) |
| page-entry | - | - | 538 | ``     it.each([ `` |
| page-entry | - | - | 539 | ``         { name: 'refused', status: 404, body: { error: 'no entry' }, left: false }, `` |
| page-entry | - | - | 540 | ``         { `` |
| page-entry | - | - | 541 | ``             name: 'taken, its answer naming a build', `` |
| page-entry | - | - | 542 | ``             status: 200, `` |
| page-entry | - | - | 543 | ``             body: { ok: true, changed: [], refused: [], build: 6 }, `` |
| page-entry | - | - | 544 | ``             left: true `` |
| page-entry | - | - | 545 | ``         }, `` |
| page-entry | - | - | 546 | ``         { `` |
| page-entry | - | - | 547 | ``             name: 'taken, its answer naming no build', `` |
| page-entry | - | - | 548 | ``             status: 200, `` |
| page-entry | - | - | 549 | ``             body: { ok: true, changed: [], refused: [] }, `` |
| page-entry | - | - | 550 | ``             left: false `` |
| page-entry | - | - | 551 | ``         } `` |
| page-entry | - | - | 552 | ``     ])('is held by the answer of the delete: $name', async ({ status, body, left }) => { `` |
| page-entry | - | - | 553 | ``         const client = createClientState(); `` |
| page-entry | - | - | 554 | ``         client.entities.receive({ channel: 'portfolio', version: 5, payload: tasksOf(AB) }); `` |
| page-entry | - | - | 555 | ``         vi.stubGlobal( `` |
| page-entry | - | - | 556 | ``             'fetch', `` |
| page-entry | - | - | 557 | ``             vi.fn(() => `` |
| page-entry | - | - | 558 | ``                 Promise.resolve( `` |
| page-entry | - | - | 559 | ``                     new Response(JSON.stringify(body), { `` |
| page-entry | - | - | 560 | ``                         status, `` |
| page-entry | - | - | 561 | ``                         headers: { 'content-type': 'application/json' } `` |
| page-entry | - | - | 562 | ``                     }) `` |
| page-entry | - | - | 563 | ``                 ) `` |
| page-entry | - | - | 564 | ``             ) `` |
| page-entry | - | - | 565 | ``         ); `` |
| page-entry | - | - | 566 | ``         await client.writes.deleteEntry('tasks', 'hub:a'); `` |
| page-entry | - | - | 567 | ``         vi.unstubAllGlobals(); `` |
| page-entry | - | - | 568 | ``         expect(client.pages.removed('tasks', 'hub:a')).toBe(left); `` |
| page-entry | - | - | 569 | ``     }); `` |
| schedule-lines | 6 | `` // answer until a read of the file that no longer holds it arrives, and no longer: an entry saved `` | 6 | `` // answer until the first read numbered at the read that answer named or later, or below what was `` |
| schedule-lines | 7 | `` // again under its name by another hand after that read is shown, and a delete answered after that `` | 7 | `` // seen at the answer: an entry saved again under its name by another hand after that read is shown, `` |
| schedule-lines | 8 | `` // read holds nothing. `` | 8 | `` // and a delete answered with that read already seen holds nothing. `` |
| schedule-lines | 33 | ``         waiting `` | 33 | ``         waiting, `` |
| schedule-lines | - | - | 34 | ``         read: 0 `` |
| schedule-lines | 58 | `` /** A read of the schedules file holding entries of the names given, in that order. */ `` | 59 | `` /** The read of the schedules file numbered `read`, holding entries of the names given, in order. */ `` |
| schedule-lines | 59 | `` function readOf(names: string[]): SchedulePayload { `` | 60 | `` function readOf(names: string[], read: number): SchedulePayload { `` |
| schedule-lines | 75 | ``         waiting: null `` | 76 | ``         waiting: null, `` |
| schedule-lines | - | - | 77 | ``         read `` |
| schedule-lines | - | - | 82 | ``     const BOTH = ['one', 'two']; `` |
| schedule-lines | - | - | 83 | (blank) |
| schedule-lines | 81 | ``      * A step: the delete of the entry `one` at position 0 sent, the server's success answering `` | 85 | ``      * A step: the delete of the entry `one` at position 0 sent, the server's success answering it `` |
| schedule-lines | 82 | ``      * it, a read of the schedules file arriving with the names given, or the rows read. `` | 86 | ``      * with the read given (undefined for an answer that names none), its refusal answering it, the `` |
| schedule-lines | - | - | 87 | ``      * socket reconnecting, a read of the schedules file arriving with its number and the names `` |
| schedule-lines | - | - | 88 | ``      * given, or the rows read. `` |
| schedule-lines | 84 | ``     type Step = 'delete' \| 'answer' \| 'read' \| string[]; `` | 90 | ``     type Step = `` |
| schedule-lines | 85 | ``     /** The steps, and the names of the rows at each read. */ `` | 91 | ``         \| 'delete' `` |
| schedule-lines | 86 | ``     type Row = { name: string; steps: Step[]; read: string[][] }; `` | 92 | ``         \| 'refused' `` |
| schedule-lines | - | - | 93 | ``         \| 'reconnect' `` |
| schedule-lines | - | - | 94 | ``         \| 'rows' `` |
| schedule-lines | - | - | 95 | ``         \| { answer: number \| undefined } `` |
| schedule-lines | - | - | 96 | ``         \| { read: number; names: string[] }; `` |
| schedule-lines | - | - | 97 | ``     /** The steps, the file read as number 1 at the start, and the rows' names at each read. */ `` |
| schedule-lines | - | - | 98 | ``     type Row = { name: string; steps: Step[]; rows: string[][] }; `` |
| schedule-lines | 90 | ``             name: 'it is left out from the answer, through a read that still holds it, until a read without it', `` | 102 | ``             name: 'it is left out from the answer, through a read below its number, until a read at it', `` |
| schedule-lines | 91 | ``             steps: ['delete', 'answer', 'read', ['one', 'two'], 'read', ['two'], 'read'], `` | 103 | ``             steps: [ `` |
| schedule-lines | 92 | ``             read: [['two'], ['two'], ['two']] `` | 104 | ``                 'delete', `` |
| schedule-lines | - | - | 105 | ``                 { answer: 3 }, `` |
| schedule-lines | - | - | 106 | ``                 'rows', `` |
| schedule-lines | - | - | 107 | ``                 { read: 2, names: BOTH }, `` |
| schedule-lines | - | - | 108 | ``                 'rows', `` |
| schedule-lines | - | - | 109 | ``                 { read: 3, names: ['two'] }, `` |
| schedule-lines | - | - | 110 | ``                 'rows' `` |
| schedule-lines | - | - | 111 | ``             ], `` |
| schedule-lines | - | - | 112 | ``             rows: [['two'], ['two'], ['two']] `` |
| schedule-lines | 95 | ``             name: 'saved again by another hand after the read without it, it shows with no read between', `` | 115 | ``             name: 'a read at its number whose rows are the same ends it', `` |
| schedule-lines | 96 | ``             steps: ['delete', 'answer', ['two'], ['one', 'two'], 'read'], `` | 116 | ``             steps: ['delete', { answer: 2 }, { read: 2, names: BOTH }, 'rows'], `` |
| schedule-lines | 97 | ``             read: [['one', 'two']] `` | 117 | ``             rows: [BOTH] `` |
| schedule-lines | 100 | ``             name: 'a delete answered after the read without it holds nothing', `` | 120 | ``             name: 'saved again by another hand after the read at its number, it shows with no read between', `` |
| schedule-lines | 101 | ``             steps: ['delete', ['two'], 'answer', 'read', ['one', 'two'], 'read'], `` | 121 | ``             steps: [ `` |
| schedule-lines | 102 | ``             read: [['two'], ['one', 'two']] `` | 122 | ``                 'delete', `` |
| schedule-lines | - | - | 123 | ``                 { answer: 2 }, `` |
| schedule-lines | - | - | 124 | ``                 { read: 2, names: ['two'] }, `` |
| schedule-lines | - | - | 125 | ``                 { read: 3, names: BOTH }, `` |
| schedule-lines | - | - | 126 | ``                 'rows' `` |
| schedule-lines | - | - | 127 | ``             ], `` |
| schedule-lines | - | - | 128 | ``             rows: [BOTH] `` |
| schedule-lines | - | - | 129 | ``         }, `` |
| schedule-lines | - | - | 130 | ``         { `` |
| schedule-lines | - | - | 131 | ``             name: 'a delete answered with the read at its number already seen holds nothing', `` |
| schedule-lines | - | - | 132 | ``             steps: [ `` |
| schedule-lines | - | - | 133 | ``                 'delete', `` |
| schedule-lines | - | - | 134 | ``                 { read: 2, names: ['two'] }, `` |
| schedule-lines | - | - | 135 | ``                 { answer: 2 }, `` |
| schedule-lines | - | - | 136 | ``                 'rows', `` |
| schedule-lines | - | - | 137 | ``                 { read: 3, names: BOTH }, `` |
| schedule-lines | - | - | 138 | ``                 'rows' `` |
| schedule-lines | - | - | 139 | ``             ], `` |
| schedule-lines | - | - | 140 | ``             rows: [['two'], BOTH] `` |
| schedule-lines | - | - | 141 | ``         }, `` |
| schedule-lines | - | - | 142 | ``         { `` |
| schedule-lines | - | - | 143 | ``             name: 'an answer that names no read holds nothing', `` |
| schedule-lines | - | - | 144 | ``             steps: ['delete', { answer: undefined }, 'rows'], `` |
| schedule-lines | - | - | 145 | ``             rows: [BOTH] `` |
| schedule-lines | - | - | 146 | ``         }, `` |
| schedule-lines | - | - | 147 | ``         { `` |
| schedule-lines | - | - | 148 | ``             name: 'a delete the server refused keeps its row and holds nothing', `` |
| schedule-lines | - | - | 149 | ``             steps: ['delete', 'refused', 'rows'], `` |
| schedule-lines | - | - | 150 | ``             rows: [BOTH] `` |
| schedule-lines | - | - | 151 | ``         }, `` |
| schedule-lines | - | - | 152 | ``         { `` |
| schedule-lines | - | - | 153 | ``             name: 'a read below what was seen at the answer, a restarted server, ends it', `` |
| schedule-lines | - | - | 154 | ``             steps: [ `` |
| schedule-lines | - | - | 155 | ``                 { read: 3, names: BOTH }, `` |
| schedule-lines | - | - | 156 | ``                 'delete', `` |
| schedule-lines | - | - | 157 | ``                 { answer: 5 }, `` |
| schedule-lines | - | - | 158 | ``                 'reconnect', `` |
| schedule-lines | - | - | 159 | ``                 { read: 1, names: BOTH }, `` |
| schedule-lines | - | - | 160 | ``                 'rows' `` |
| schedule-lines | - | - | 161 | ``             ], `` |
| schedule-lines | - | - | 162 | ``             rows: [BOTH] `` |
| schedule-lines | - | - | 163 | ``         }, `` |
| schedule-lines | - | - | 164 | ``         { `` |
| schedule-lines | - | - | 165 | ``             name: 'a read between what was seen and its number holds it until its number', `` |
| schedule-lines | - | - | 166 | ``             steps: [ `` |
| schedule-lines | - | - | 167 | ``                 { read: 3, names: BOTH }, `` |
| schedule-lines | - | - | 168 | ``                 'delete', `` |
| schedule-lines | - | - | 169 | ``                 { answer: 5 }, `` |
| schedule-lines | - | - | 170 | ``                 'reconnect', `` |
| schedule-lines | - | - | 171 | ``                 { read: 4, names: BOTH }, `` |
| schedule-lines | - | - | 172 | ``                 'rows', `` |
| schedule-lines | - | - | 173 | ``                 { read: 5, names: BOTH }, `` |
| schedule-lines | - | - | 174 | ``                 'rows' `` |
| schedule-lines | - | - | 175 | ``             ], `` |
| schedule-lines | - | - | 176 | ``             rows: [['two'], BOTH] `` |
| schedule-lines | 106 | ``     it.each(ROWS)('$name', async ({ steps, read }) => { `` | 180 | ``     /** A channel holding the file read as number 1, and how to hand it the next read. */ `` |
| schedule-lines | - | - | 181 | ``     function channelOf(): { `` |
| schedule-lines | - | - | 182 | ``         entities: EntitiesStore; `` |
| schedule-lines | - | - | 183 | ``         arrive: (names: string[], read: number) => void; `` |
| schedule-lines | - | - | 184 | ``     } { `` |
| schedule-lines | 109 | ``         const arrive = (names: string[]): void => { `` | 187 | ``         const arrive = (names: string[], read: number): void => { `` |
| schedule-lines | 110 | ``             entities.receive({ channel: 'schedule', version, payload: readOf(names) }); `` | 188 | ``             entities.receive({ channel: 'schedule', version, payload: readOf(names, read) }); `` |
| schedule-lines | 113 | ``         arrive(['one', 'two']); `` | 191 | ``         arrive(BOTH, 1); `` |
| schedule-lines | 114 | ``         let answer = (): void => undefined; `` | 192 | ``         return { entities, arrive }; `` |
| schedule-lines | - | - | 193 | ``     } `` |
| schedule-lines | - | - | 194 | (blank) |
| schedule-lines | - | - | 195 | ``     it.each(ROWS)('$name', async ({ steps, rows }) => { `` |
| schedule-lines | - | - | 196 | ``         const { entities, arrive } = channelOf(); `` |
| schedule-lines | - | - | 197 | ``         let answer = (_posted: unknown): void => undefined; `` |
| schedule-lines | 116 | ``             answer = () => resolve({ ok: true, status: 200, body: {} }); `` | 199 | ``             answer = resolve; `` |
| schedule-lines | 126 | ``             else if (step === 'answer') { `` | 209 | ``             else if (step === 'reconnect') entities.reconnected(); `` |
| schedule-lines | 127 | ``                 answer(); `` | 210 | ``             else if (step === 'rows') seen.push(store.rows().map((row) => row.name)); `` |
| schedule-lines | - | - | 211 | ``             else if (step === 'refused') { `` |
| schedule-lines | - | - | 212 | ``                 answer({ `` |
| schedule-lines | - | - | 213 | ``                     ok: false, `` |
| schedule-lines | - | - | 214 | ``                     status: 409, `` |
| schedule-lines | - | - | 215 | ``                     body: { error: 'entry-changed', names: [] }, `` |
| schedule-lines | - | - | 216 | ``                     failed: '' `` |
| schedule-lines | - | - | 217 | ``                 }); `` |
| schedule-lines | 129 | ``             } else if (step === 'read') seen.push(store.rows().map((row) => row.name)); `` | 219 | ``             } else if ('answer' in step) { `` |
| schedule-lines | 130 | ``             else arrive(step); `` | 220 | ``                 const body = step.answer === undefined ? {} : { read: step.answer }; `` |
| schedule-lines | - | - | 221 | ``                 answer({ ok: true, status: 200, body, failed: '' }); `` |
| schedule-lines | - | - | 222 | ``                 await deleting; `` |
| schedule-lines | - | - | 223 | ``             } else arrive(step.names, step.read); `` |
| schedule-lines | 132 | ``         expect(seen).toEqual(read); `` | 225 | ``         expect(seen).toEqual(rows); `` |
| schedule-lines | - | - | 227 | (blank) |
| schedule-lines | - | - | 228 | ``     it('ends two removals each at its own read', async () => { `` |
| schedule-lines | - | - | 229 | ``         const { entities, arrive } = channelOf(); `` |
| schedule-lines | - | - | 230 | ``         const answers = [2, 3].map((read) => ({ `` |
| schedule-lines | - | - | 231 | ``             ok: true, `` |
| schedule-lines | - | - | 232 | ``             status: 200, `` |
| schedule-lines | - | - | 233 | ``             body: { read }, `` |
| schedule-lines | - | - | 234 | ``             failed: '' `` |
| schedule-lines | - | - | 235 | ``         })); `` |
| schedule-lines | - | - | 236 | ``         const store = createSchedule(entities, { `` |
| schedule-lines | - | - | 237 | ``             terminalById: () => null, `` |
| schedule-lines | - | - | 238 | ``             writes: { `` |
| schedule-lines | - | - | 239 | ``                 postCommand: () => Promise.resolve(answers.shift()) `` |
| schedule-lines | - | - | 240 | ``             } as unknown as WritesStore `` |
| schedule-lines | - | - | 241 | ``         }); `` |
| schedule-lines | - | - | 242 | ``         await store.remove({ at: 0, name: 'one' }); `` |
| schedule-lines | - | - | 243 | ``         await store.remove({ at: 1, name: 'two' }); `` |
| schedule-lines | - | - | 244 | ``         const seen = [store.rows().map((row) => row.name)]; `` |
| schedule-lines | - | - | 245 | ``         for (const read of [2, 3]) { `` |
| schedule-lines | - | - | 246 | ``             arrive(BOTH, read); `` |
| schedule-lines | - | - | 247 | ``             seen.push(store.rows().map((row) => row.name)); `` |
| schedule-lines | - | - | 248 | ``         } `` |
| schedule-lines | - | - | 249 | ``         expect(seen).toEqual([[], ['one'], BOTH]); `` |
| schedule-lines | - | - | 250 | ``     }); `` |

The tests of the two new files, `tests/routes/hubs/hub-deck-writes.test.ts` and `tests/routes/hubs/hub-files-fixture.ts`, are the moved lines the "Repair round 1" section shows: no assertion is edited.

The rows the build adds are named in the table. The cases they cover are C17 to C23 and C25.

## Repair round 1

The round is `.scratch/migration/agents/briefs/O170-round-1.md`, over the review `.scratch/migration/agents/reviews/O170-refuter.md`. Standards S2 was not sent; `hub-writes.test.ts` carries `// @module-tag slow`, and the file run alone is quoted below.

**Item 1 (S1, P1).** `describe('a deck write to the second hub')` and `twoDeckHubs` are in `tests/routes/hubs/hub-deck-writes.test.ts`, with `// @module-tag slow` and a head comment of its own, the titles unchanged. `filesOf`, `differing` and `heldBy`, which both files need, with `BESIDE`, are in `tests/routes/hubs/hub-files-fixture.ts`, imported by both. `wc -l`:

```
     756 tests/routes/hubs/hub-writes.test.ts
     112 tests/routes/hubs/hub-deck-writes.test.ts
      35 tests/routes/hubs/hub-files-fixture.ts
```

The moved text against the base copy, where the deck describe lies at base lines 774 to 859 and the helpers at 47 to 74 (the three `<` and `>` pairs are the `export` added to each function):

```
$ diff <(sed -n 774,859p ../O170-base/tests/routes/hubs/hub-writes.test.ts) <(sed -n 27,112p tests/routes/hubs/hub-deck-writes.test.ts)
(prints nothing)
$ diff <(sed -n 47,74p ../O170-base/tests/routes/hubs/hub-writes.test.ts) <(sed -n 8,35p tests/routes/hubs/hub-files-fixture.ts)
5c5
< function filesOf(dir: string, at = ''): Map<string, string> {
---
> export function filesOf(dir: string, at = ''): Map<string, string> {
20c20
< function differing(before: Map<string, string>, after: Map<string, string>): string[] {
---
> export function differing(before: Map<string, string>, after: Map<string, string>): string[] {
26c26
< function heldBy(dir: string, file: string): boolean {
---
> export function heldBy(dir: string, file: string): boolean {
```

Each file alone, as a slow test is run:

```
$ TMPDIR=.agents/scratch/tmp GIT_CEILING_DIRECTORIES=.agents/scratch/tmp npx vitest run tests/routes/hubs/hub-writes.test.ts --reporter=dot
 Test Files  1 passed (1)
      Tests  46 passed (46)
$ TMPDIR=.agents/scratch/tmp GIT_CEILING_DIRECTORIES=.agents/scratch/tmp npx vitest run tests/routes/hubs/hub-deck-writes.test.ts --reporter=verbose
 Test Files  1 passed (1)
      Tests  3 passed (3)
```

The grep of `agents/guarded.md` for the moved titles:

```
$ grep -n "a deck write to the second hub\|writes the deck file of the second hub\|refuses a base the file of the second hub\|writes the order list of the second hub\|twoDeckHubs" .scratch/migration/agents/guarded.md
(prints nothing, exit 1)
```

No `Test:` line names a moved title, so none changes (see "Doc text"). The paths the round adds to the step's write list are `tests/routes/hubs/hub-deck-writes.test.ts` and `tests/routes/hubs/hub-files-fixture.ts`.

**Item 2 (P2).** `src/lib/views/academic/present/acts/acts.svelte.ts:58` reads `const SAID_NOTHING: Readonly<{ line: string }> = Object.freeze({ line: '' });`, and the identity comparison stays.

**Item 3 (S3).** The head comment of `src/lib/views/academic/present/Bar.svelte` is rewrapped as one paragraph at 100 columns.

**Item 4 (S4).** `Unwritten` in `src/lib/state/client/shapes/unwritten.ts:14` has lost its `export`; `grep -rn "\bUnwritten\b" src tests` prints only that file's lines 14 and 19, its own declaration and `createUnwritten`'s return type.

**Item 5, S5: the grep before each new name.** Each ran over `src` and `tests` of the base copy, the tree as it stood before these names were written, with `--include='*.ts' --include='*.svelte' --include='*.css'`.

| Name, key call | Hits on the base copy | Judged |
| --- | --- | --- |
| `configuredSources` | none | new |
| `literatureRows(` | `read.ts:47` (definition), `:114`, `:123`; `routes/api/(docs)/literature/+server.ts:22`; `tests/server/core/reader/rows.ts:39`; `reader.test.ts:171`, `:589` | the reader of the config rows, reused. The server's `sourceInfo` (`handler.ts:216`) needs `downloads`, which a page does not hold, so it cannot be reused for the rows drawn before a listing |
| `leastOf` | none | new |
| `min-content` | none | new |
| `sayFor` | none | new |
| `=== mine` | `src/lib/server/core/json.ts:378` (a lock file's name); `src/lib/state/sessions/terminal/pty/pty-subscribe.ts:122` (a tail's identity) | other concerns; the pattern is the same, the values are unrelated |
| `createUnwritten` | none | new |
| `onUnwritten` | `shapes.ts:484`; `notice-sources.ts:19`; `client/context.ts:716`; `writes.svelte.ts:11`, `:17`, `:23`, `:114`, `:875`; `tests/state/client/held-unsaved.test.ts:97` | the listeners this step moved into `shapes/unwritten.ts`, the same function |
| `nextRead` | `src/lib/state/sources/repositories/answers.ts:293`, `:298`, `:303` | a parameter handing out a read's freshness check in the repositories store, another concern |
| `nextBuild` | none | new |
| `nextVersion(` | `core/channels.ts:71`, `:158`; `machine/runs/recover/live/watch.ts:175`; `root/watch/portfolio/portfolio.ts:715` | the Hub's method, reused |
| `Candidate` | `server/sessions/registry.ts:44` and uses; `server/accounts/mail/plate.ts:44` and uses (`poll.ts`, `google.ts`, `microsoft.ts`); `data/snapshot/references/model.ts:33` | exported types of other modules; the one in `slide-layout.ts` is local and exports nothing |

**Item 5, S6: empty, duplicated, colliding.**

- `listed`, the saved key. Empty: a saved `listed: []` is what a tab keeps when its last listing answered no source. It is not nullish, so `sources` is `[]`. From the first paint until the listing answers no source button is drawn, the Search button is enabled (its `disabled` reads the running `listed`, which is null) and pressing it or Enter does nothing, since `settled` is false, and the list shows the idle line (`no_sources` reads the running `listed`). The answer replaces it: rows are drawn, or, for an empty answer, the `no_sources` line and a disabled Search. Absent, or not a list, or a row of the wrong type: `sourceList` answers null and the tab falls to the config's rows. Duplicated: the server's listing and the config's rows both come through `checkRows` (`check.ts:309`), which leaves out a row whose key an earlier row holds, so neither holds a repeat; a repeat could only be in a layout edited by hand, where `{#each sources as source (source.id)}` in `Head.svelte` would throw `each_key_duplicate` at first paint; `sourceList` reads a list that names a source twice as no list, so the tab falls to the config's rows. Colliding: `listed` is one field of Literature's own instance state, read only by `formShape`; no config key reaches it. A saved row whose `id` the config no longer names is drawn until the listing answers, and a press of Search is refused until then, so no request names it.
- `build`, the wire key. Empty: absent or not a number reads as undefined (`z.number().optional().catch(undefined)`), and no removal is held (row 'an answer that names no build holds nothing'); a server target with no `nextBuild` sends none. A 0 cannot be sent, the Hub's versions counting from 1. Duplicated: two deletes each carry their own number and are held per record key, each ending at its own (row 'ends two removals each at its own build'); a second delete of the same key replaces the first's `gone` entry; two records with the same number each end at it. Colliding: of the write answers only `delete-entry` carries `build` (`writes.ts`, `answer`), and `answerShape` reads it under that name alone. It is never compared with `read`.
- `read`, the wire key on the schedules answer and the `schedule` payload. Empty: the payload's `read` is required (`payloads.ts:81`, `z.number()`), the server always sends it, and `reads` is 1 at the first `publish` of `reload`; before any payload the page reads 0 (`entities.schedule()?.read ?? 0`). An answer with no number holds nothing (row 'an answer that names no read holds nothing'). Duplicated: two `publish` calls with no read between are one message (C25); two deletes answered with one number are each held until that read, and with two numbers each end at their own (row 'ends two removals each at its own read'). Colliding: the route's answer carries `read` for a delete alone, beside `{ ok }`, and no other key of the answer or of `SchedulePayload` has that name; the `read` field of a notification belongs to another shape on another channel.
- The asynchronous paths are C5, C6 and C26, above.

**Item 5, S7.** "Every edit to an existing test", above, is the table of 524 rows, one per changed line.

The cases, again through the real code, after the round's last change:

```
$ node --input-type=module -e "<the program quoted under 'The Node run of C9 to C13, C27 and C28, after the build'>"
C9 {"arrangement":"stacked","shape":"alone","height":0.4,"boxes":[0.08,0.08]}
C10 {"arrangement":"side","shape":"alone","height":0.4,"boxes":[0.45,0.45]}
C11-none {"arrangement":"one","shape":"alone","height":0.4,"boxes":[0.48]}
C11-least {"arrangement":"one","shape":"alone","height":0.4,"boxes":[0.48]}
C12 {"arrangement":"side","shape":"wide","height":0.4,"boxes":[0.38,0.38]}
C13 {"arrangement":"stacked","shape":"tall","height":0.4,"boxes":[0.2,0.2]}
C27 {"arrangement":"side","shape":"tall","height":0.4,"boxes":[0.3492,0.3492]}
C28 {"arrangement":"side","shape":"tall","height":0.4,"boxes":[0.3492,0.3492]}
no-caption-one-line-text {"arrangement":"side","shape":"tall","height":0.35,"boxes":[0.2555,0.2555]}
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
$ TMPDIR=.agents/scratch/tmp GIT_CEILING_DIRECTORIES=.agents/scratch/tmp npx vitest run tests/state/forms/page-entry.test.ts tests/state/system/schedule-lines.test.ts tests/routes/machine/schedules.test.ts tests/server/machine/runs/schedules/watch.test.ts tests/routes/hubs/hub-writes.test.ts tests/routes/hubs/hub-deck-writes.test.ts --reporter=dot
      Tests  110 passed (110)
```

`after.case.ts` and `v.config.ts` are as quoted above. A case that only a page shows is owed to the look, as above.

## DONE / NOT DONE

| Row | State | Proof |
| --- | --- | --- |
| Items 1 to 10 of the brief | DONE | the sections above and the checks below; item 10's ledger text is under "Doc text" for the orchestrator |
| Items 1 to 5 of the round | DONE | the section "Repair round 1" |
| The first run of every case | DONE | the section above |
| The cases after the build and after the round | DONE where a run reaches them; C1 to C8, C14, C15 and C26, and C16's remote case, name their look on landing | the sections above |
| `npm run diagrams` | DONE, exit 0 | run once in the round, before `npm run test:quick` |
| `npm run test:quick` | DONE, prints `test:quick: 240.9 s; every command passed` | the lines below |
| The ASCII gate over every file the step changes | DONE, prints nothing, exit 0 | the perl line of the brief over the 44 paths `git status` names outside `.scratch` |
| `grep -rn "citation-js" config --exclude=local.yml` | DONE, prints nothing, exit 1 | |
| `grep -rn "export_opened" config src tests --exclude=local.yml` | DONE, prints nothing, exit 1 | |
| `grep -n "shows()" src/lib/state/forms/settled.svelte.ts` | DONE, prints nothing, exit 1 | |
| `sh utils/unused-exports.sh` against the base's list | DONE, no line added | below |
| The guarded tests G8, G28, G46, G91, G117 | DONE | below |
| Each new or changed test on the unchanged tree, then after | DONE | the section above |
| Each new or changed sentence against the prose rule | DONE, by reading | the sentences read true; no departure to name |
| No history in added comments and titles | DONE | below |
| Size limits | DONE | `wc -l` prints 880 `src/lib/state/client/context.ts`, 859 `src/lib/server/root/context.ts`, 852 `src/lib/data/model/machine/model-machine.ts`, 845 `src/lib/state/client/writes.svelte.ts`, 811 `schedule.svelte.ts`, 805 `src/lib/server/edit/writes.ts`, 804 `watch.ts` and 756 `tests/routes/hubs/hub-writes.test.ts`, the largest of the step; the largest component is `Slide.svelte` at 493; the whole list is under "Files with line counts" |

**Full-list runs in the round: 1**, and it passed. The step's own build ran it twice.

The round's run, `npm run test:quick -- <the 44 paths>` with `TMPDIR` unset:

```
test:quick: 44 changed file(s), from the given paths
test:quick: 228 test file(s)
ok      prettier (1.0 s): All matched files use Prettier code style!
ok      ASCII gate (1.1 s)
ok      svelte-kit sync (2.2 s)
ok      eslint (11.1 s)
ok      svelte-check (13.1 s): 1794172697956 COMPLETED 590 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (111.7 s): Duration  97.60s (transform 44.93s, setup 0ms, import 101.97s, tests 246.41s, environment 4ms)
ok      vitest (138.7 s): Duration  125.69s (transform 81.15s, setup 0ms, import 209.37s, tests 271.08s, environment 9.33s)
ok      vitest slow (238.7 s): Duration  225.71s (transform 19.12s, setup 0ms, import 116.04s, tests 777.95s, environment 14ms)
test:quick: 240.9 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source and tests/checks/tree,
            which run for any change under src, tests or utils; the build, the lint
            of unchanged files
```

The guarded tests, the 60 files named on the `Test:` lines of G8, G28, G46, G91 and G117:

```
$ TMPDIR=.agents/scratch/tmp GIT_CEILING_DIRECTORIES=.agents/scratch/tmp npx vitest run <the 60 files> --reporter=dot
 Test Files  60 passed (60)
      Tests  792 passed (792)
```

The count is three below the build's 795 because the three deck tests left `hub-writes.test.ts`, one of the 60, for `hub-deck-writes.test.ts`.

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
| `tests/routes/hubs/hub-writes.test.ts` | 756 |
| `tests/routes/hubs/hub-deck-writes.test.ts` (new) | 112 |
| `tests/routes/hubs/hub-files-fixture.ts` (new) | 35 |
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
- **The name of the round's fixture**, `tests/routes/hubs/hub-files-fixture.ts`, by the `*-fixture.ts` files of the neighbouring folders.
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

No `Test:` line of `agents/guarded.md` names a title the round moved out of `tests/routes/hubs/hub-writes.test.ts` (the grep is under "Repair round 1"), so item 1 changes no line of that file and the file's other titles stay where its `Test:` lines name them; G152's replacement below names only `hub-writes.test.ts`'s describe 'the build a delete-entry answer names', which stays there.

Their replacements:

```
- G152. An entry of a collection or a schedule that a delete the server took removed stays out of its list from the answer on, until the first portfolio message or `schedule` payload numbered at the number its answer named or later, whether or not it holds the entry, or numbered below what was seen at the answer (a restarted server). A number between what was seen and the removal's holds it until the removal's. An entry put back by another hand is shown once that number has arrived, a removal answered with the number already reached or by an answer that names no number is not held, and a refused delete keeps the row. The `delete-entry` answer's `build` is the version of the next portfolio message, the schedules route's delete `read` is the number of the read after its commit, and the watcher publishes every read, also one whose rows equal the last.
  Code: `src/lib/state/forms/settled.svelte.ts` (`remove`, `heard`), `src/lib/state/forms/page-entry.ts` (`settle.removed`, `removed`), `src/lib/state/client/context.ts` (`entities.afterReceive(settled.heard)`), `src/lib/state/system/machine/schedules/schedule.svelte.ts` (`removed`, the `afterReceive` listener), `src/lib/server/edit/writes.ts` (`nextBuild`, the `delete-entry` branch), `src/lib/server/machine/runs/schedules/routes.ts` (the `read` of a delete in `commit`), `src/lib/server/machine/runs/schedules/watch.ts` (`reads`, `reload`, `nextRead`).
  Test: `tests/state/forms/page-entry.test.ts`, describe 'an entry of a collection a write removed', every row, among them "is left out until its build through the client's own wiring, a reconnect included"; `tests/state/system/schedule-lines.test.ts`, describe 'a schedule a delete took', every row; `tests/routes/hubs/hub-writes.test.ts`, describe 'the build a delete-entry answer names', every row; `tests/routes/machine/schedules.test.ts`, 'a delete names the read taken right after its commit', 'a pause names none'; `tests/server/machine/runs/schedules/watch.test.ts`, describe 'the read number of the schedules payload', every row.
```
