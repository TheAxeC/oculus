# Diagnosis: the Transcript view flickers (D77 part 1, premise)

Every quoted command output carries `<REDACTED>` in place of the value of a secret in it, as the rules file's rule on secrets in quoted command output says. No quoted output below held a secret. A diagnosis of the same step later is appended below under its own heading at the level of the title above, `# Diagnosis: <the symptom in a few words>`, which names its finding or quotes its part.

Diagnosis agent: aa071f530aa99f740, claude-opus-5-5, 299,541 tokens, 98 tool uses, 42.5 min.

## Symptom

From `tools/oculus/.scratch/migration/plan.md:792`, D77 part (1), quoted exactly:

"(1) the Transcript view flickers: find why and end it, the cause confirmed by a run before the fix (read, not run: `Transcript.svelte`'s `$effect(() => showing(record?.id ?? ''))` re-runs on every new session record and its cleanup `forget`s the held turns, so the whole transcript is fetched again) (open item 103)"

Axel's words: "session transcript flickers". The ruling the step's tags name for this part, `plan.md:1975`: "Open item 103 (2026-10-14): (a), the Transcript view's flicker fixed after a run confirms its cause, in a new step". D77 has no Step 0 (`plan.md:793` is D74's Step 0). The parenthesis in the step's text was treated as a lead. The red command below was built and run red before any hypothesis was formed.

## Where the probes run

The probes ran in a detached scratch worktree at main's head, made with `git worktree add --detach "$tmp/tree" HEAD` from `/Users/axelfaes/workspace/research-hub`:

- `$tmp=/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/diagnose.4Mr29x`.
- Commit `756940b594b3f8be5560c9bbea03437f68ae4778` (`git rev-parse HEAD`).
- Nothing was applied to the copy.
- `node_modules` was copied with `cp -c -R` from the main checkout's `tools/oculus`, then `npx svelte-kit sync` ran, with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`.
- The harness lived only in the scratch tree, under `tools/oculus/tests/diag/`.

The paths redirected under `$TMPDIR`:

- The runs quoted under "Red command" and "Probes" ran with the real `HOME`.
- Every vitest start of this repository reads the workspace state under `~/.oculus` when it loads its config. The project's `vite.config.ts:30-33` (`devPort`) reads `openWorkspace(defaultStateFolder())`, and `defaultStateFolder()` is `join(homedir(), '.oculus')` (`src/lib/server/files/workspace/state.ts:35-37`).
- The harness itself reads only the scratch tree's `config/`, through `loadConfig(engineDir())`. That function never merges `local.yml` (`src/lib/data/sources/config.ts:8-9`).
- The final pair of runs was repeated with `HOME=$tmp/home`, an empty folder under `$TMPDIR`. It gives the same results: green with the fix, red without it (quoted under "Fix and test"). Nothing was created in `$tmp/home`.

Git commands run:

- `git worktree add`.
- `git rev-parse HEAD`, in the scratch tree and in the main checkout.
- One `git status --short` read inside the scratch tree.
- `git worktree remove --force`.

## Red command

The red command mounts the real `Transcript.svelte` and drives it as the page does:

- It runs on a jsdom document in Svelte's client runtime: the `client` project of `vite.config.ts`, in a file named `*.client.test.ts`.
- The view sits inside the page's tooltip group and reads a real client state built by `createClientState()`.
- `fetch` is stubbed and records each `/api/transcript` request. A whole read answers two turns and offset 200. A tail read answers no turns.
- The sessions channel is handed a payload holding session `s1`, `s1` is selected, the first read lands, and then the case's push is made.

It asserts three things:

- what the view draws at the flush right after the push (`push:`);
- what it draws after the requests land (`push, settled:`);
- the list of transcript requests.

```
cd "$tmp/tree/tools/oculus" && PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npx vitest run tests/diag/flicker.client.test.ts --reporter=verbose --silent=false
```

The source of the red command, `tests/diag/flicker.client.test.ts`:

```ts
// Diagnosis harness. The real Transcript view mounted on a jsdom document in Svelte's client
// runtime, reading a real client state (createClientState): the sessions channel is handed a
// payload, the session is shown, and the payload is handed again as the server sends it.
import { JSDOM } from 'jsdom';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, expect, it, vi } from 'vitest';
import { createClientState } from '../../src/lib/state/client/context.ts';
import { SHOWN_KEY, STATE_KEY } from '../../src/lib/state/client/use.ts';
import { TIP_KEY, createTipIds } from '../../src/lib/ui/menu/tip-ids.ts';
import { area, payload, record, workspace } from '../fixtures/sessions-fixture.ts';
import { cell } from '../ui/frame/rooted.svelte.ts';
import TranscriptInGroup from './TranscriptInGroup.svelte';
import { engineDir, glyphCatalog, loadConfig, textCatalog } from '../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../src/lib/state/shared/words/text.ts';

const merged = loadConfig(engineDir()).config;
setCatalog(textCatalog(merged));
setGlyphs(glyphCatalog(merged));

afterEach(() => vi.unstubAllGlobals());

const TURNS = [
    { at: '2026-10-14T10:00:00Z', role: 'user', text: 'one', html: '', cut: false, tool: null },
    { at: '2026-10-14T10:00:01Z', role: 'assistant', text: 'two', html: '<p>two</p>', cut: false, tool: null }
];

// One document per file: Svelte's client runtime reads the node prototypes once, from the first
// document it meets.
const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });

function stubDom(): HTMLElement {
    dom.window.document.body.replaceChildren();
    const win = dom.window as unknown as Record<string, unknown>;
    const names = Object.getOwnPropertyNames(dom.window).filter((name) =>
        /^(HTML|SVG|Node|Element|Text$|Comment$|Document|DOM|Mutation|Range$|Selection$|ShadowRoot$|CharacterData$)|Event$/.test(name)
    );
    for (const name of [
        ...names, 'window', 'document', 'navigator', 'getComputedStyle', 'requestAnimationFrame',
        'cancelAnimationFrame', 'NodeFilter'
    ]) {
        vi.stubGlobal(name, win[name]);
    }
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
    return dom.window.document.body as unknown as HTMLElement;
}

function drawn(box: Element): string {
    const turns = box.querySelectorAll('.turn').length;
    const empty = box.querySelector('.chat')?.textContent?.trim() ?? '';
    return turns > 0 ? `${turns} turns` : `no turns: "${empty.slice(0, 40)}"`;
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

const STAMP = '2026-10-14T10:00:01Z';
const LATER = '2026-10-14T10:00:09Z';
const tree = (stamp: string, others: string[] = [], withS1 = true) =>
    payload([
        workspace('/ws', [
            area('/ws', [
                ...(withS1 ? [record('s1', { lastActivity: stamp })] : []),
                ...others.map((id) => record(id))
            ])
        ])
    ]);

type Client = ReturnType<typeof createClientState>;
type Options = { first?: ReturnType<typeof tree>; views?: number; pin?: boolean; tab?: boolean };
type Run = {
    client: Client;
    seen: string[];
    asked: string[];
    look: (label: string) => Promise<void>;
    shown: { get: () => boolean; set: (next: boolean) => void };
    stop: () => void;
};

/** Mount `views` Transcript views on s1 and let the first read land. */
async function open(options: Options = {}): Promise<Run> {
    const body = stubDom();
    const asked: string[] = [];
    vi.stubGlobal('fetch', (url: string) => {
        if (url.startsWith('/api/transcript')) asked.push(url);
        const whole = url.endsWith('from=0');
        return Promise.resolve(
            new Response(JSON.stringify({ turns: whole ? TURNS : [], offset: 200, results: {} }), {
                status: 200,
                headers: { 'content-type': 'application/json' }
            })
        );
    });
    const client = createClientState();
    client.ui.loadUi({ getItem: () => null, setItem: () => undefined });
    client.entities.receive({ channel: 'sessions', version: 1, payload: options.first ?? tree(STAMP) });
    const views = options.views ?? 1;
    const ids = Array.from({ length: views }, (_, at) => `i${String(at + 1)}`);
    if (options.pin === true) {
        client.layout.apply({
            root: {
                kind: 'pane',
                tabs: ids.map((id) => ({ id, view: 'transcript', state: { session: 's1' } })),
                active: ids[0]
            }
        } as never);
    } else {
        client.selection.select('s1');
    }
    const shown = cell(true);
    const mounted = ids.map((id) => {
        const box = dom.window.document.createElement('div');
        body.appendChild(box);
        const context = new Map<unknown, unknown>([
            [STATE_KEY, options.tab === true ? client.tabScope.wrap(client, () => shown.get()) : client],
            [TIP_KEY, createTipIds()]
        ]);
        if (options.tab === true) context.set(SHOWN_KEY, () => shown.get());
        const view = mount(TranscriptInGroup, {
            target: box as unknown as HTMLElement,
            props: { instance: { id, view: 'transcript', state: options.pin === true ? { session: 's1' } : null } as never },
            context
        });
        return { box, view };
    });
    const seen: string[] = [];
    const look = async (label: string) => {
        flushSync();
        seen.push(`${label}: ${mounted.map((one) => drawn(one.box)).join(' | ')}`);
        await settle();
        flushSync();
        seen.push(`${label}, settled: ${mounted.map((one) => drawn(one.box)).join(' | ')}`);
    };
    const stop = () => {
        for (const one of mounted) void unmount(one.view);
        flushSync();
    };
    flushSync();
    await settle();
    flushSync();
    seen.push(`loaded: ${mounted.map((one) => drawn(one.box)).join(' | ')}`);
    return { client, seen, asked, look, shown, stop };
}

function report(run: Run) {
    const result = { seen: run.seen, asked: run.asked };
    console.log(`DIAG-7e31 ${expect.getState().currentTestName}: ${JSON.stringify(result)}`);
    return result;
}

const push = (client: Client, payloadOf: ReturnType<typeof tree>, version = 2) =>
    client.entities.receive({ channel: 'sessions', version, payload: payloadOf });

const STEADY = ['loaded: 2 turns', 'push: 2 turns', 'push, settled: 2 turns'];
const WHOLE = '/api/transcript?id=s1&from=0';
const TAIL = '/api/transcript?id=s1&from=200';

it('original: s1 is written (its stamp moves) and another session appears', async () => {
    const run = await open();
    push(run.client, tree(LATER, ['s2']));
    await run.look('push');
    run.stop();
    expect(report(run)).toEqual({ seen: STEADY, asked: [WHOLE, TAIL] });
});

it('shrunk: the same session handed again, nothing changed', async () => {
    const run = await open();
    push(run.client, tree(STAMP));
    await run.look('push');
    run.stop();
    expect(report(run)).toEqual({ seen: STEADY, asked: [WHOLE] });
});

it('cut 1, the second session: s1 is written and nothing else changes', async () => {
    const run = await open();
    push(run.client, tree(LATER));
    await run.look('push');
    run.stop();
    expect(report(run)).toEqual({ seen: STEADY, asked: [WHOLE, TAIL] });
});

it('cut 3, the version bump: the same content at the same version', async () => {
    const run = await open();
    push(run.client, tree(STAMP), 1);
    await run.look('push');
    run.stop();
    expect(report(run)).toEqual({ seen: STEADY, asked: [WHOLE] });
});

it('cut 4, the fresh objects: the very payload object of the first message handed again', async () => {
    const first = tree(STAMP);
    const run = await open({ first });
    push(run.client, first);
    await run.look('push');
    run.stop();
    expect(report(run)).toEqual({ seen: STEADY, asked: [WHOLE] });
});

it('cut 5, the sessions channel: a message on another channel', async () => {
    const run = await open();
    run.client.entities.receive({ channel: 'processes', version: 1, payload: { rows: [] } as never });
    await run.look('push');
    run.stop();
    expect(report(run)).toEqual({ seen: STEADY, asked: [WHOLE] });
});

it('other 1, pinned: the instance pins s1 and the payload is handed again', async () => {
    const run = await open({ pin: true });
    push(run.client, tree(STAMP));
    await run.look('push');
    run.stop();
    expect(report(run)).toEqual({ seen: STEADY, asked: [WHOLE] });
});

it('other 2, two views of s1: the payload is handed again', async () => {
    const run = await open({ views: 2 });
    push(run.client, tree(STAMP));
    await run.look('push');
    run.stop();
    expect(report(run)).toEqual({
        seen: ['loaded: 2 turns | 2 turns', 'push: 2 turns | 2 turns', 'push, settled: 2 turns | 2 turns'],
        asked: [WHOLE]
    });
});

it('other 3, a hidden tab: the payload is handed again while the tab is hidden, then it is shown', async () => {
    const run = await open({ tab: true });
    run.shown.set(false);
    flushSync();
    push(run.client, tree(STAMP));
    await run.look('push');
    run.shown.set(true);
    await run.look('shown');
    run.stop();
    expect(report(run)).toEqual({
        seen: ['loaded: 2 turns', ...STEADY.slice(1), 'shown: 2 turns', 'shown, settled: 2 turns'],
        asked: [WHOLE]
    });
});

it('other 4, a change of session: s2 is selected, then s1 again', async () => {
    const run = await open({ first: tree(STAMP, ['s2']) });
    run.client.selection.select('s2');
    await run.look('s2');
    run.client.selection.select('s1');
    await run.look('s1');
    run.stop();
    expect(report(run)).toEqual({
        seen: ['loaded: 2 turns', 's2: no turns: "This session has no turns yet."', 's2, settled: 2 turns', 's1: no turns: "This session has no turns yet."', 's1, settled: 2 turns'],
        asked: [WHOLE, '/api/transcript?id=s2&from=0', WHOLE]
    });
});

it('other 5, the session leaves the payload and comes back', async () => {
    const run = await open();
    push(run.client, tree(STAMP, ['s2'], false));
    await run.look('gone');
    push(run.client, tree(STAMP), 3);
    await run.look('back');
    run.stop();
    expect(report(run).asked).toEqual([WHOLE, WHOLE]);
});

it('other 6, the view closes and opens again', async () => {
    const run = await open();
    run.stop();
    const again = await open();
    again.asked.unshift(...run.asked);
    again.stop();
    expect(report(again).asked).toEqual([WHOLE, WHOLE]);
});
```

and `tests/diag/TranscriptInGroup.svelte`:

```svelte
<script lang="ts">
    // Diagnosis harness: the real Transcript view inside the page's one tooltip group.
    import TooltipGroup from '../../src/lib/ui/menu/TooltipGroup.svelte';
    import Transcript from '../../src/lib/views/sessions/transcript/Transcript.svelte';
    import type { Instance } from '../../src/lib/state/workbench/layout/model.ts';

    let { instance }: { instance: Instance } = $props();
</script>

<TooltipGroup>
    <Transcript {instance} />
</TooltipGroup>
```

The runs, with the output of each quoted. The first three runs used the first form of the command:

- one case: the shrunk case's push, the payload handed again with `s1` unchanged at version 2;
- only the `/api/transcript` requests recorded;
- run as `npx vitest run tests/diag/flicker.client.test.ts`, with the output filtered to the result line, the case line and the count.

```
== run 1
{"seen":["loaded: 2 turns","after push: no turns: \"This session has no turns yet.\"","settled: 2 turns"],"asked":["/api/transcript?id=s1&from=0","/api/transcript?id=s1&from=0"]}
   x keeps the turns drawn when the sessions channel hands the same session again 153ms
      Tests  1 failed (1)
== run 2
{"seen":["loaded: 2 turns","after push: no turns: \"This session has no turns yet.\"","settled: 2 turns"],"asked":["/api/transcript?id=s1&from=0","/api/transcript?id=s1&from=0"]}
   x keeps the turns drawn when the sessions channel hands the same session again 160ms
      Tests  1 failed (1)
== run 3
{"seen":["loaded: 2 turns","after push: no turns: \"This session has no turns yet.\"","settled: 2 turns"],"asked":["/api/transcript?id=s1&from=0","/api/transcript?id=s1&from=0"]}
   x keeps the turns drawn when the sessions channel hands the same session again 160ms
      Tests  1 failed (1)
```

The expected value of each run was `{"seen":["loaded: 2 turns","after push: 2 turns","settled: 2 turns"],"asked":["/api/transcript?id=s1&from=0"]}`. The result was the same on three runs in a row.

Parts of the reported symptom, with whether the red command catches each:

| Part of the symptom | Caught by the red command | Lines read, for a part not caught | Reproduced |
|---|---|---|---|
| "the Transcript view flickers" | yes: the `seen` assertion is red on every run; the two turns drawn at `loaded` are replaced by the empty sentence "This session has no turns yet." at the flush after the push, and are drawn again once the read lands (`settled`) | not applicable | yes, caught |
| the lead's "so the whole transcript is fetched again" (a lead, not a part of the symptom; asserted because it is what the view does while it flickers) | yes: the `asked` assertion is red on every run, a second `from=0` request | not applicable | yes, caught |

Runs after the tightening. The command was tightened into the twelve-case file above:

- one document per file;
- one `open` helper;
- every case asserts what is drawn at each flush and every transcript request.

Its run on the unchanged tree (default reporter with `--silent=false`, which prints the result line of each failing case):

```
original: s1 is written (its stamp moves) and another session appears: {"seen":["loaded: 2 turns","push: no turns: \"This session has no turns yet.\"","push, settled: 2 turns"],"asked":["/api/transcript?id=s1&from=0","/api/transcript?id=s1&from=0"]}
shrunk: the same session handed again, nothing changed: {"seen":["loaded: 2 turns","push: no turns: \"This session has no turns yet.\"","push, settled: 2 turns"],"asked":["/api/transcript?id=s1&from=0","/api/transcript?id=s1&from=0"]}
cut 1, the second session: s1 is written and nothing else changes: {"seen":["loaded: 2 turns","push: no turns: \"This session has no turns yet.\"","push, settled: 2 turns"],"asked":["/api/transcript?id=s1&from=0","/api/transcript?id=s1&from=0"]}
cut 3, the version bump: the same content at the same version: {"seen":["loaded: 2 turns","push: no turns: \"This session has no turns yet.\"","push, settled: 2 turns"],"asked":["/api/transcript?id=s1&from=0","/api/transcript?id=s1&from=0"]}
cut 4, the fresh objects: the very payload object of the first message handed again: {"seen":["loaded: 2 turns","push: no turns: \"This session has no turns yet.\"","push, settled: 2 turns"],"asked":["/api/transcript?id=s1&from=0","/api/transcript?id=s1&from=0"]}
other 1, pinned: the instance pins s1 and the payload is handed again: {"seen":["loaded: 2 turns","push: no turns: \"This session has no turns yet.\"","push, settled: 2 turns"],"asked":["/api/transcript?id=s1&from=0","/api/transcript?id=s1&from=0"]}
other 3, a hidden tab: the payload is handed again while the tab is hidden, then it is shown: {"seen":["loaded: 2 turns","push: no turns: \"This session has no turns yet.\"","push, settled: no turns: \"This session has no turns yet.\"","shown: no turns: \"This session has no turns yet.\"","shown, settled: 2 turns"],"asked":["/api/transcript?id=s1&from=0","/api/transcript?id=s1&from=0"]}
      Tests  7 failed | 5 passed (12)
```

The output of the five passing cases on the unchanged tree (run with `-t 'other 2|other 4|other 5|other 6|cut 5'`):

```
cut 5, the sessions channel: a message on another channel: {"seen":["loaded: 2 turns","push: 2 turns","push, settled: 2 turns"],"asked":["/api/transcript?id=s1&from=0"]}
other 2, two views of s1: the payload is handed again: {"seen":["loaded: 2 turns | 2 turns","push: 2 turns | 2 turns","push, settled: 2 turns | 2 turns"],"asked":["/api/transcript?id=s1&from=0"]}
other 4, a change of session: s2 is selected, then s1 again: {"seen":["loaded: 2 turns","s2: no turns: \"This session has no turns yet.\"","s2, settled: 2 turns","s1: no turns: \"This session has no turns yet.\"","s1, settled: 2 turns"],"asked":["/api/transcript?id=s1&from=0","/api/transcript?id=s2&from=0","/api/transcript?id=s1&from=0"]}
other 5, the session leaves the payload and comes back: {"seen":["loaded: 2 turns","gone: no turns: \"No session is picked. Pick one with the \"","gone, settled: no turns: \"No session is picked. Pick one with the \"","back: no turns: \"This session has no turns yet.\"","back, settled: 2 turns"],"asked":["/api/transcript?id=s1&from=0","/api/transcript?id=s1&from=0"]}
other 6, the view closes and opens again: {"seen":["loaded: 2 turns"],"asked":["/api/transcript?id=s1&from=0","/api/transcript?id=s1&from=0"]}
      Tests  5 passed | 7 skipped (12)
```

The whole file runs in about 10 to 23 s, nearly all of it spent importing the client state. The cases themselves take 13 to 177 ms each.

## No red command

Not applicable.

## Shrunk case

| Cut | Result of the red command after it | Kept or put back |
|---|---|---|
| none: the original case, `s1`'s stamp moves (`lastActivity` 10:00:01 to 10:00:09) and a second session `s2` joins the payload, version 2 | red: `"push: no turns: \"This session has no turns yet.\""`, asked `from=0` twice (right: `from=0` then `from=200`) | the original case |
| 1, the second session `s2` | red: the same `push:` line, `from=0` twice | cut |
| 2, the move of `s1`'s stamp (the payload handed again with `s1` unchanged) | red: the same `push:` line, `from=0` twice | cut |
| 3, the version bump (the same content at version 1, the version held) | red: the same `push:` line, `from=0` twice | cut |
| 4, the fresh payload objects (the very payload object of the first message handed again in a new message) | red: the same `push:` line, `from=0` twice | cut |
| 5, the sessions channel (a message on the `processes` channel instead) | green: `"push: 2 turns"`, one request | put back |

The tooltip group around the view was not cut. It is the page's own wrapper, and `src/lib/ui/menu/TooltipGroup.svelte:5-7` says bits-ui refuses a tooltip drawn outside it.

The shrunk case, as it stands: one Transcript view on session `s1` with its turns drawn, and one message on the sessions channel whose payload names `s1` again, with any content and any version not below the one held. Each part is needed: without the sessions message the view stays steady (cut 5), and without a drawn transcript there is nothing to flicker.

## Hypotheses

The hypotheses were formed after the red command was red. They rest on:

- the red output: the empty sentence at the flush right after the push, and a second whole read;
- the shrunk case: any sessions message causes it, even the same raw object (cut 4);
- the code read along the path:
  - `Transcript.svelte:52` `const record = $derived(sessionFor(instance.id));`
  - `Transcript.svelte:80` `$effect(() => showing(record?.id ?? ''));`
  - `transcript.svelte.ts:191-209`: `showing`, whose release calls `forget(id)` when the count falls to zero (`:202-207`).
  - `transcript.svelte.ts:215-221`: `forget` calls `queries.forget(keyOf(id))`.
  - `transcript.svelte.ts:148-156`: `turnsFor` answers `PENDING`, `turns: []`, when nothing is held.
  - `entities.svelte.ts:28`: `messages` is `$state({})`; `:41`: `messages[message.channel] = message`.
  - `selectors.svelte.ts:460-466,482-485,492-495`: `sessionFor` finds the session in the payload's tree.

1. If the effect at `Transcript.svelte:80` re-runs whenever `record` is a new object, because it reads the whole record (a new proxy object at every sessions message) rather than the id, so its teardown releases the session's only hold and `forget` drops the turns before the re-run takes the hold again, then making the effect read a derived of the id alone turns the red command green. Falsified by: the red command stays red with that change.
2. If the store's release in `showing` (`transcript.svelte.ts:199-208`) drops the turns synchronously when the count reaches zero, before the same instance's re-run counts itself again, then deferring the drop to a microtask that drops only when no instance has taken the session again turns the red command green. Falsified by: the red command stays red with that change.
3. If the entities store hands the views a new sessions message even when its payload is equal to the one held (`entities.svelte.ts:37-43`), then dropping a sessions message whose payload equals the held one turns the red command green. Falsified by: a case whose payload differs (the original case, `s1`'s stamp moved) stays red with that change.
4. If the turns are still held after the push and the flicker is only the view drawing the empty sentence for a pending read (`Transcript.svelte:166`), then drawing that branch only when the read is not pending turns the red command green. Falsified by: the turns are not drawn after the push with that change, or a second whole read is still asked.

The reply to the hypotheses, or "none, no person present": none, no person present.

The second list, when every hypothesis was falsified: not needed.

## Probes

| Hypothesis rank | The one change, as a diff | The run | Result |
|---|---|---|---|
| 1 | `src/lib/views/sessions/transcript/Transcript.svelte`: `-    $effect(() => showing(record?.id ?? ''));` `+    const shownId = $derived(record?.id ?? '');` `+    $effect(() => showing(shownId));` | on the six-case file of that time: `Tests  6 passed (6)`; again on the twelve-case file: `Tests  12 passed (12)`, the original case `{"seen":["loaded: 2 turns","push: 2 turns","push, settled: 2 turns"],"asked":["/api/transcript?id=s1&from=0","/api/transcript?id=s1&from=200"]}` | still standing; no other input broken |
| 2 | `src/lib/state/sessions/transcript.svelte.ts`, the release of `showing`: `-            const left = (viewers[id] ?? 1) - 1;` `-            if (left > 0) {` `-                viewers[id] = left;` `-                return;` `-            }` `-            forget(id);` `+            viewers[id] = (viewers[id] ?? 1) - 1;` `+            queueMicrotask(() => {` `+                if ((viewers[id] ?? 0) <= 0) forget(id);` `+            });` | six-case file: `Tests  6 passed (6)`; twelve-case file: `Tests  12 passed (12)`, every case's output equal to probe 1's | still standing; no other input broken |
| 3 | `src/lib/state/client/entities.svelte.ts`, in `receive` after the version check: `+        if (held !== undefined && JSON.stringify(held.payload) === JSON.stringify(message.payload)) return;` | six-case file: `Tests  2 failed \| 4 passed (6)`; red: `original: ... {"seen":["loaded: 2 turns","push: no turns: \"This session has no turns yet.\"","push, settled: 2 turns"],"asked":["/api/transcript?id=s1&from=0","/api/transcript?id=s1&from=0"]}` and the same for cut 1 | falsified: a payload that differs (the stamp moved) still flickers |
| 4 | `src/lib/views/sessions/transcript/Transcript.svelte:166`: `-            {:else if turns.length === 0}` `+            {:else if turns.length === 0 && !held.pending}` | six-case file: `Tests  5 failed \| 1 passed (6)`; e.g. `shrunk: ... {"seen":["loaded: 2 turns","push: no turns: \"\"","push, settled: 2 turns"],"asked":["/api/transcript?id=s1&from=0","/api/transcript?id=s1&from=0"]}` | falsified: the turns are gone after the push (a blank column in place of the sentence) and the whole transcript is read again |

No probe added logging. The tag `DIAG-7e31` was on the harness's one result line. Each probe's change was undone after its run. After the last probe, `diff -rq` of the main checkout's `tools/oculus/src` against the scratch tree printed nothing.

## Cause

The cause is the effect that holds the session's turns, `$effect(() => showing(record?.id ?? ''))` at `src/lib/views/sessions/transcript/Transcript.svelte:80`. It reads the session record object, so it treats every new record object as a change of session. At every sessions message this happens in order:

1. Svelte re-runs the effect.
2. Its teardown, the release that `showing` returned (`src/lib/state/sessions/transcript.svelte.ts:199-208`), takes the count of the session's viewers to zero and calls `forget(id)` (`:215-221`, which calls `queries.forget` at `src/lib/state/client/queries.svelte.ts:292-302`).
3. The re-run counts the instance again, on a session that now holds nothing.
4. `turnsFor` answers `PENDING` with no turns (`transcript.svelte.ts:148-156`, `:46`).
5. The view draws "This session has no turns yet." (`Transcript.svelte:166-167`).
6. The whole transcript is read again from offset 0.

Why the record is a new object at every message:

- The channel's messages are held in `$state` (`src/lib/state/client/entities.svelte.ts:28`), and each message replaces the held one (`:41`).
- `sessionFor` returns the session found in that payload's tree (`src/lib/state/client/selectors.svelte.ts:460-466,482-485,492-495`).
- So the record is new with the same content, and even when the same raw payload object is handed again (cut 4).

The sessions channel sends a message whenever any transcript is written. While an agent runs, a Transcript view therefore flickers at each write of any session.

The rule, stated at the kind of value: a session record handed by the sessions channel is a new object at every message and is identified by its id. Whatever a view holds for a session (a hold on its turns, a subscription) is keyed by the id string, so a new record of the same session is no change.

The probe that shows it is probe 1: the red command is green with the change (`Tests  12 passed (12)`) and red without it (`Tests  7 failed | 5 passed (12)`). Probe 2 also turned the red command green, but it was set aside for the cause:

- It leaves the effect releasing and taking the hold again at every sessions message.
- It makes the store tolerate a release that should not happen.
- Hypothesis 1 names the operation that reads the wrong value for every form of the input.

Places of the defect the fix covers: `Transcript.svelte:80`, the one place. Each input and each place written as not fixed: none.

## Operation and other inputs

The operation that goes wrong: the dependency read of the effect `$effect(() => showing(record?.id ?? ''))` at `src/lib/views/sessions/transcript/Transcript.svelte:80`. It reads `record`, a derived holding the record object (`:52`). So at every new record object of the same session it re-runs, releasing the hold on the session's turns and taking it again.

The rule, stated at the kind of value: a session record handed by the sessions channel is identified by its id; a hold a view keeps on a session is keyed by the id string, never by the record object.

Places of the defect:

1. `src/lib/views/sessions/transcript/Transcript.svelte:80`: the hold on the session's turns (`showing`) is taken and released by an effect that depends on the record object.
2. None further. Every source of a session record that reaches an effect of the Sessions views was read forward:
   - `Transcript.svelte:72-75`, the follow effect, is not a place, since it holds and releases nothing. It re-runs at every new record object, but `follow` compares the record's `lastActivity` by value and returns when it is unchanged (`transcript.svelte.ts:165-174`, `:169`). So it asks nothing for a record of the same session with the same stamp, and asks once for a moved stamp. With the fix, the original case asks `from=200` once.
   - `Transcript.svelte:82-94`, the scroll effect, compares the id by value (`const fresh = id !== shown`, `:89`). Not a place.
   - `src/lib/views/sessions/timeline/Timeline.svelte:66-76` makes the same value comparison of the id (`const fresh = id !== shown`). Not a place.
   - The Session view, `src/lib/views/sessions/session-detail/SessionDetail.svelte`, has no `$effect`: a grep of `\$effect` over `src/lib/views/sessions` and `src/lib/views/shared/sessions` lists none in it.
   - The Changes panel, `src/lib/views/sessions/session-detail/ChangesRepository.svelte:33,46-58`, is not a place. Its effect reads `workspace = $derived(record.workspace)`, a string that compares equal across new records, and `repo = $derived(gitFor(workspace))` from the `git` channel. A sessions message changes neither, and the listing the effect starts is gated by `gate.due([state])`.
   - `src/lib/views/sessions/session-detail/AgentRows.svelte:42` is a timer keyed on the boolean `running`. Not a place.
   - The other one-line hold effects of the tree were listed with `grep -rn '\$effect(() => [a-zA-Z.]*(' src/lib`. `views/shared/sessions/CommandBar.svelte:57` (`watch(repo)`) and `shell/keys/Palette.svelte:182` (`projectCommands.watch(taskRepo)`) take a string. CommandBar is drawn by `views/shared/card/project/ProjectCard.svelte:389` and `views/sources/repositories/Repo.svelte:266`, not by a Sessions view.
   - `showing` has no caller but `Transcript.svelte:80`.

| Other input | Why it reaches a place of the defect | Right result | Place at which it is wrong | Result on the tree without the fix | Result with the change of the probe that shows the cause | Class | Result after the fix |
|---|---|---|---|---|---|---|---|
| original: `s1`'s stamp moves and a session `s2` joins | any sessions message makes a new record of `s1` (`entities.svelte.ts:41`) | 2 turns drawn throughout; requests `from=0`, then `from=200` | place 1 | wrong: `push: no turns: "This session has no turns yet."`, `from=0` twice | right: `push: 2 turns`, `from=0`, `from=200` | part of the defect | right |
| cut 1: `s1`'s stamp moves, nothing else | as above | 2 turns throughout; `from=0`, `from=200` | place 1 | wrong: the empty sentence, `from=0` twice | right | part of the defect | right |
| cut 3: the same content at the version held | `receive` takes an equal version (`entities.svelte.ts:40` drops only a lower one) | 2 turns throughout; `from=0` once | place 1 | wrong: the empty sentence, `from=0` twice | right | part of the defect | right |
| cut 4: the very payload object handed again in a new message | `$state` makes a new proxy of it (`entities.svelte.ts:28,41`) | 2 turns throughout; `from=0` once | place 1 | wrong: the empty sentence, `from=0` twice | right | part of the defect | right |
| other 1: the instance pins `s1` (instance state `{ session: 's1' }`) instead of the selection | `sessionFor` reads the pin first (`selectors.svelte.ts:492-495`) | 2 turns throughout; `from=0` once | place 1 | wrong: `push: no turns: "This session has no turns yet."`, `from=0` twice | right | part of the defect | right |
| other 3: the view in a tab that is hidden when the message comes, then shown | `forget` and `showing` do not look at the tab's scope (`queries.svelte.ts:21-24`) | 2 turns at every step; `from=0` once | place 1 | wrong: `push: no turns`, `push, settled: no turns` (dropped while hidden), `shown: no turns`, `shown, settled: 2 turns`, `from=0` twice | right: 2 turns at every step, `from=0` once | part of the defect | right |
| other 2: two Transcript views of `s1` | each view's effect re-runs; the count stays at one or more, since each instance's release is followed by its own re-run before the next instance's release (`transcript.svelte.ts:202-206`) | 2 turns in each view throughout; `from=0` once | none | right: `2 turns \| 2 turns` at every step, `from=0` once | right | not part of the defect | right |
| cut 5: a message on another channel (`processes`) | none: `record` does not read that channel | 2 turns throughout; `from=0` once | none | right | right | not part of the defect | right |
| other 4: a change of session, `s2` then `s1` | the hold must move with the id | `s1`'s turns dropped when `s2` is shown; requests `s1 from=0`, `s2 from=0`, `s1 from=0` | none | right | right | not part of the defect | right (the release on a change of id still drops) |
| other 5: `s1` leaves the payload, then comes back | the record becomes null, then a record again | the pick sentence while gone; `from=0` again when back | none | right: `gone: ... "No session is picked..."`, `back, settled: 2 turns`, `from=0` twice | right | not part of the defect | right |
| other 6: the view closes and opens again | the teardown releases the last hold | `from=0` again on the second open | none | right: `from=0` twice | right | not part of the defect | right |
| the first open of a session (`s2` in other 4, `s1` back in other 5) | `turnsFor` answers `PENDING` (`turns: []`, `pending: true`, `transcript.svelte.ts:46,155`) until the first read lands | a pending read is not drawn as a transcript with no turns | `Transcript.svelte:166-167` draws "This session has no turns yet." for any `turns.length === 0` and never reads `held.pending`: an operation of another rule | wrong: `s2: no turns: "This session has no turns yet."` before the read lands | wrong, the same | another defect | left out; it is left for a diagnosis of its own |

## Fix and test

Test, run on the tree without the fix: no test is written, for these reasons:

- The rules file allows a test only as the test of one entry of `agents/guarded.md`, and a new entry needs Axel (`agents/spec.md:58`).
- `agents/guarded.md:3` says "Views have no entry: the look on TEST covers them."
- No entry names `Transcript.svelte` or `src/lib/state/sessions/transcript.svelte.ts`. `grep -n 'transcript' agents/guarded.md` lists only G40 (`:107-109`) and G78 (`:218-220`), both about the server's transcript reads.
- The failure is a redraw of the column and a second whole read of the transcript. It loses no work, breaks no installation and accepts no wrong configuration, so under the rules file it costs nothing that a test guards.

The red command above shows the fix: it is red without the fix and green with it.

Places the fix covers: `src/lib/views/sessions/transcript/Transcript.svelte:80`, the hold effect. It now reads a derived of the session's id (`sessionId`, declared beside `record`), and the comment above the effect says why.

Fix:

```diff
--- a/tools/oculus/src/lib/views/sessions/transcript/Transcript.svelte
+++ b/tools/oculus/src/lib/views/sessions/transcript/Transcript.svelte
@@ -50,6 +50,12 @@
     let { instance }: ViewProps = $props();
 
     const record = $derived(sessionFor(instance.id));
+    /**
+     * The session on screen, by id. The sessions channel hands a new record object with every
+     * message, so the hold on the session's turns is keyed by this string, which a message naming
+     * the same session again leaves unchanged.
+     */
+    const sessionId = $derived(record?.id ?? '');
     const held = $derived(turnsFor(record?.id ?? ''));
     const turns = $derived(held.turns);
 
@@ -76,8 +82,8 @@
 
     // The store keeps a session's turns while an instance is showing it and drops them when the
     // last one stops; the effect's cleanup is that release, so a change of session or a teardown
-    // lets go.
-    $effect(() => showing(record?.id ?? ''));
+    // lets go. It reads the id alone, so a new record of the session on screen releases nothing.
+    $effect(() => showing(sessionId));
 
     $effect(() => {
         const id = record?.id ?? '';
```

For `premise`, the test's source as written: no test is written (see above). The red command's source, which the brief can carry as its check, is quoted whole under "Red command". It needs `jsdom`, which `node_modules` holds.

Runs after the fix: the fixed tree with the twelve-case red command, where the original case, the shrunk case and every other input are cases of the one file. Three runs, each `Tests  12 passed (12)`; run 1 quoted:

```
original: s1 is written (its stamp moves) and another session appears: {"seen":["loaded: 2 turns","push: 2 turns","push, settled: 2 turns"],"asked":["/api/transcript?id=s1&from=0","/api/transcript?id=s1&from=200"]}
shrunk: the same session handed again, nothing changed: {"seen":["loaded: 2 turns","push: 2 turns","push, settled: 2 turns"],"asked":["/api/transcript?id=s1&from=0"]}
cut 1, the second session: s1 is written and nothing else changes: {"seen":["loaded: 2 turns","push: 2 turns","push, settled: 2 turns"],"asked":["/api/transcript?id=s1&from=0","/api/transcript?id=s1&from=200"]}
cut 3, the version bump: the same content at the same version: {"seen":["loaded: 2 turns","push: 2 turns","push, settled: 2 turns"],"asked":["/api/transcript?id=s1&from=0"]}
cut 4, the fresh objects: the very payload object of the first message handed again: {"seen":["loaded: 2 turns","push: 2 turns","push, settled: 2 turns"],"asked":["/api/transcript?id=s1&from=0"]}
cut 5, the sessions channel: a message on another channel: {"seen":["loaded: 2 turns","push: 2 turns","push, settled: 2 turns"],"asked":["/api/transcript?id=s1&from=0"]}
other 1, pinned: the instance pins s1 and the payload is handed again: {"seen":["loaded: 2 turns","push: 2 turns","push, settled: 2 turns"],"asked":["/api/transcript?id=s1&from=0"]}
other 2, two views of s1: the payload is handed again: {"seen":["loaded: 2 turns | 2 turns","push: 2 turns | 2 turns","push, settled: 2 turns | 2 turns"],"asked":["/api/transcript?id=s1&from=0"]}
other 3, a hidden tab: the payload is handed again while the tab is hidden, then it is shown: {"seen":["loaded: 2 turns","push: 2 turns","push, settled: 2 turns","shown: 2 turns","shown, settled: 2 turns"],"asked":["/api/transcript?id=s1&from=0"]}
other 4, a change of session: s2 is selected, then s1 again: {"seen":["loaded: 2 turns","s2: no turns: \"This session has no turns yet.\"","s2, settled: 2 turns","s1: no turns: \"This session has no turns yet.\"","s1, settled: 2 turns"],"asked":["/api/transcript?id=s1&from=0","/api/transcript?id=s2&from=0","/api/transcript?id=s1&from=0"]}
other 5, the session leaves the payload and comes back: {"seen":["loaded: 2 turns","gone: no turns: \"No session is picked. Pick one with the \"","gone, settled: no turns: \"No session is picked. Pick one with the \"","back: no turns: \"This session has no turns yet.\"","back, settled: 2 turns"],"asked":["/api/transcript?id=s1&from=0","/api/transcript?id=s1&from=0"]}
other 6, the view closes and opens again: {"seen":["loaded: 2 turns"],"asked":["/api/transcript?id=s1&from=0","/api/transcript?id=s1&from=0"]}
      Tests  12 passed (12)
```

The same pair with `HOME` redirected to an empty folder under `$TMPDIR` (`HOME=$tmp/home ./node_modules/.bin/vitest run tests/diag/flicker.client.test.ts --reporter=verbose --silent=false`):

```
== with the fix, HOME=/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/diagnose.4Mr29x/home
      Tests  12 passed (12)
== without the fix, HOME=/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/diagnose.4Mr29x/home
 x |client| tests/diag/flicker.client.test.ts > original: s1 is written (its stamp moves) and another session appears 126ms
 x |client| tests/diag/flicker.client.test.ts > shrunk: the same session handed again, nothing changed 20ms
 x |client| tests/diag/flicker.client.test.ts > cut 1, the second session: s1 is written and nothing else changes 16ms
 x |client| tests/diag/flicker.client.test.ts > cut 3, the version bump: the same content at the same version 14ms
 x |client| tests/diag/flicker.client.test.ts > cut 4, the fresh objects: the very payload object of the first message handed again 16ms
 x |client| tests/diag/flicker.client.test.ts > other 1, pinned: the instance pins s1 and the payload is handed again 13ms
 x |client| tests/diag/flicker.client.test.ts > other 3, a hidden tab: the payload is handed again while the tab is hidden, then it is shown 14ms
      Tests  7 failed | 5 passed (12)
```

The fixed file was checked against the repository's format and lint in the scratch tree:

- `npx prettier --check src/lib/views/sessions/transcript/Transcript.svelte` printed "All matched files use Prettier code style!".
- `npx eslint src/lib/views/sessions/transcript/Transcript.svelte` exited 0 with no output.
- `LC_ALL=C grep -n '[^ -~]'` over the file printed nothing.
- The type check (`npm run check`) was not run.

The fix is not made on main; the step's builder makes it from the brief.

No test reaches it: not applicable. No test is written: the failure costs nothing under the rules file (`agents/spec.md:58`, `agents/guarded.md:3`). A test of the hold would need a new entry in `agents/guarded.md`, which only Axel can grant.

## Cleanup

```
grep -rn 'DIAG-7e31' "$tmp/tree" --exclude-dir=node_modules --exclude-dir=.svelte-kit --exclude=local.yml
(no output, exit 1)
```

- The harness folder `tests/diag/` was removed from the scratch tree before the grep.
- `diff -rq` of the main checkout's `tools/oculus/src` against the scratch tree printed nothing.
- The scratch copy was removed with `git worktree remove --force "$tmp/tree"` from `/Users/axelfaes/workspace/research-hub`, and `$tmp` was deleted together with `$tmp/home`.
- No credential or `.env` file was copied.
- The red command is carried by the brief as its check.
