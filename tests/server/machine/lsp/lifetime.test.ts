// Layer 4, server test. How long a language server oculus started lives: it ends 60 s after
// the last tab of its root and language closed on a page, or the page closed, when no tab or page
// took it over; at once when its root stops being served; when the `lsp` key changes; and with the
// oculus server. None is started twice for one page and root.
//
// The relay runs on vitest's fake clock over stub child processes (lsp-fixture.ts). A row is one
// case of the table below: its `steps` function sets the world up, moves the clock to a deadline
// and asks whether the stub has ended, one millisecond before it and at it. Nothing starts a real
// server.

import { realpathSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, vi } from 'vitest';
import { it, scratchDir } from '../../../fixtures/scratch.ts';
import type { Relay } from '../../../../src/lib/server/machine/lsp/relay.ts';
import {
    advance,
    close,
    frame,
    makeRelay,
    open,
    pageFile,
    plantRoot,
    recordingSink,
    settle,
    stubSpawn,
    useClock,
    type Behaviour
} from './lsp-fixture.ts';

const PYTHON = 'lsp:python';
const MINUTE = 60_000;

type World = {
    relay: Relay;
    spawned: ReturnType<typeof stubSpawn>;
    page: ReturnType<typeof recordingSink>;
    served: { key: string; dir: string }[];
    /** The folder the `lsp` key names; a row sets it to change the key. */
    folder: { value: string };
};

function world(behave?: (call: number) => Behaviour, files?: string[]): World {
    const dir = plantRoot(files);
    const served = [{ key: 'repo', dir }];
    const spawned = stubSpawn(behave);
    const folder = { value: join(realpathSync(scratchDir('oculus-lsp-key-')), 'first') };
    const relay = makeRelay({
        roots: () => served,
        spawn: spawned.spawn,
        lspFolder: () => folder.value
    });
    return { relay, spawned, page: recordingSink(), served, folder };
}

let made: Relay[] = [];

beforeEach(() => {
    useClock();
});

afterEach(async () => {
    const closing = Promise.all(made.map((relay) => relay.close()));
    await advance(10_000);
    await closing;
    made = [];
    vi.useRealTimers();
});

/** Start a world and open `a.py` on its page, the server up. */
async function opened(
    behave?: (call: number) => Behaviour,
    tab: { channel: string; file: string; language: string; files?: string[] } = {
        channel: PYTHON,
        file: 'a.py',
        language: 'python'
    }
): Promise<World> {
    const w = world(behave, tab.files);
    made.push(w.relay);
    open(w.relay, w.page.sink, tab.channel, pageFile('repo', tab.file), tab.language);
    await settle();
    return w;
}

/** A hover request on `a.py` numbered `id`, sent by the page. */
function hover(relay: Relay, page: World['page'], id: number): void {
    relay.inbound(
        page.sink,
        frame(PYTHON, {
            jsonrpc: '2.0',
            id,
            method: 'textDocument/hover',
            params: {
                textDocument: { uri: pageFile('repo', 'a.py') },
                position: { line: 0, character: 0 }
            }
        })
    );
}

/** The error code the page was answered `id` with, or undefined when it got no answer. */
function errorOf(page: World['page'], id: number): number | undefined {
    return page.frames.find((one) => one.payload.id === id)?.payload.error?.code;
}

/** The state frames of a page, in order, as `state` or `state:code`. */
function states(page: World['page']): string[] {
    return page.frames
        .filter((one) => one.payload.oculus === 'state')
        .map((one) => {
            const { state, code } = one.payload as unknown as { state: string; code?: string };
            return code === undefined ? state : `${state}:${code}`;
        });
}

/** Two exits within three minutes, which leave the server failed until the reader's Restart. */
async function blocked(): Promise<World> {
    const w = await opened();
    w.spawned.children[0].kill('SIGKILL');
    await settle();
    hover(w.relay, w.page, 1);
    await settle();
    w.spawned.children[1].kill('SIGKILL');
    await settle();
    return w;
}

type Row = {
    name: string;
    behave?: (call: number) => Behaviour;
    /** The tab the row opens first, `a.py` on pyright by default. */
    tab?: Parameters<typeof opened>[1];
    steps: (w: World) => Promise<void>;
};

const ROWS: Row[] = [
    {
        name: 'ends 60 s after the last tab of its root and language closed, and not at 59.999 s',
        steps: async ({ relay, spawned, page }) => {
            expect(spawned.children).toHaveLength(1);
            close(relay, page.sink, PYTHON, pageFile('repo', 'a.py'));
            await advance(MINUTE - 1);
            expect(spawned.children[0].ended).toBe(false);
            await advance(1);
            expect(spawned.children[0].ended).toBe(true);
            expect(relay.pids()).toEqual([]);
        }
    },
    {
        name: 'is kept by a tab reopened at 30 s, and ends 60 s after the next close',
        steps: async ({ relay, spawned, page }) => {
            close(relay, page.sink, PYTHON, pageFile('repo', 'a.py'));
            await advance(30_000);
            open(relay, page.sink, PYTHON, pageFile('repo', 'a.py'), 'python');
            await advance(MINUTE * 3);
            expect(spawned.children).toHaveLength(1);
            expect(spawned.children[0].ended).toBe(false);
            close(relay, page.sink, PYTHON, pageFile('repo', 'a.py'));
            await advance(MINUTE);
            expect(spawned.children[0].ended).toBe(true);
        }
    },
    {
        name: 'is started again by a tab reopened at 70 s, the first having ended at 60 s',
        steps: async ({ relay, spawned, page }) => {
            close(relay, page.sink, PYTHON, pageFile('repo', 'a.py'));
            await advance(70_000);
            expect(spawned.children[0].ended).toBe(true);
            open(relay, page.sink, PYTHON, pageFile('repo', 'a.py'), 'python');
            await advance(0);
            expect(spawned.children).toHaveLength(2);
            expect(spawned.children[1].ended).toBe(false);
        }
    },
    {
        name: 'is not ended while another tab of its root and language stays open',
        steps: async ({ relay, spawned, page }) => {
            open(relay, page.sink, PYTHON, pageFile('repo', 'b.py'), 'python');
            close(relay, page.sink, PYTHON, pageFile('repo', 'a.py'));
            await advance(MINUTE * 2);
            expect(spawned.children).toHaveLength(1);
            expect(spawned.children[0].ended).toBe(false);
        }
    },
    {
        name: 'ends 60 s after the page closed, and not at 59.999 s',
        steps: async ({ relay, spawned, page }) => {
            relay.remove(page.sink);
            await advance(MINUTE - 1);
            expect(spawned.children[0].ended).toBe(false);
            await advance(1);
            expect(spawned.children[0].ended).toBe(true);
        }
    },
    {
        name: 'is taken over by another page that opens its root and language at 30 s, with one spawn',
        steps: async ({ relay, spawned, page }) => {
            relay.remove(page.sink);
            await advance(30_000);
            const second = recordingSink();
            open(relay, second.sink, PYTHON, pageFile('repo', 'b.py'), 'python');
            await advance(MINUTE * 3);
            expect(spawned.children).toHaveLength(1);
            expect(spawned.children[0].ended).toBe(false);
            expect(spawned.children[0].received).toContain('textDocument/didClose');
        }
    },
    {
        name: 'ends at once when its root stops being served, and the page is told root_gone',
        steps: async ({ relay, spawned, page, served }) => {
            served.splice(0);
            relay.reconcile();
            await settle();
            expect(spawned.children[0].ended).toBe(true);
            expect(states(page).at(-1)).toBe('failed:root_gone');
        }
    },
    {
        name: 'serves a tab still open again when its root is served again and the page opens its documents again',
        steps: async ({ relay, spawned, page, served }) => {
            const root = served[0];
            served.splice(0);
            relay.reconcile();
            await settle();
            served.push(root);
            relay.reconcile();
            await settle();
            expect(states(page).slice(-2)).toEqual(['failed:root_gone', 'starting']);
            expect(spawned.children).toHaveLength(1);
            open(relay, page.sink, PYTHON, pageFile('repo', 'a.py'), 'python');
            await settle();
            expect(spawned.children).toHaveLength(2);
            expect(spawned.children[1].received).toContain('textDocument/didOpen');
            hover(relay, page, 41);
            await settle();
            const asked = spawned.children[1].messages.find(
                (one) => one.method === 'textDocument/hover'
            );
            expect(asked).toBeDefined();
            spawned.children[1].say({
                jsonrpc: '2.0',
                id: asked?.id,
                result: { contents: 'hover text' }
            });
            await settle();
            expect(page.frames.find((one) => one.payload.id === 41)?.payload.result).toEqual({
                contents: 'hover text'
            });
        }
    },
    {
        name: 'serves a tab again when its root is served again while the ended server is still stopping',
        behave: (call) => (call === 0 ? { shutdown: 'silent', diesOn: 'SIGKILL' } : {}),
        steps: async ({ relay, spawned, page, served }) => {
            const root = served[0];
            served.splice(0);
            relay.reconcile();
            await settle();
            expect(spawned.children[0].ended).toBe(false);
            served.push(root);
            relay.reconcile();
            open(relay, page.sink, PYTHON, pageFile('repo', 'a.py'), 'python');
            await settle();
            expect(spawned.children).toHaveLength(2);
            expect(spawned.children[1].received).toContain('textDocument/didOpen');
        }
    },
    {
        name: 'ends with the oculus server',
        steps: async ({ relay, spawned }) => {
            const closing = relay.close();
            await settle();
            await closing;
            expect(spawned.children[0].ended).toBe(true);
            expect(relay.pids()).toEqual([]);
        }
    },
    {
        name: 'is one clangd for a c tab and a cpp tab of one root on one page',
        steps: async ({ relay, spawned, page }) => {
            open(relay, page.sink, 'lsp:c', pageFile('repo', 'x.c'), 'c');
            open(relay, page.sink, 'lsp:cpp', pageFile('repo', 'y.cpp'), 'cpp');
            await settle();
            expect(spawned.calls.map((call) => call.command)).toEqual(['/node', 'clangd']);
        }
    },
    {
        name: 'is one TypeScript server for a ts tab and a js tab of one root on one page, and one Svelte server for two svelte tabs',
        steps: async ({ relay, spawned, page }) => {
            open(relay, page.sink, 'lsp:typescript', pageFile('repo', 'a.ts'), 'typescript');
            open(relay, page.sink, 'lsp:javascript', pageFile('repo', 'b.js'), 'javascript');
            open(relay, page.sink, 'lsp:svelte', pageFile('repo', 'a.svelte'), 'svelte');
            open(relay, page.sink, 'lsp:svelte', pageFile('repo', 'b.svelte'), 'svelte');
            const scripts = () =>
                spawned.calls
                    .filter((call) => call.command === '/node')
                    .map((call) => /node_modules\/([^/]+)\//.exec(call.args[0])?.[1]);
            // The Svelte server starts after its adapter reads the root's config files from disk,
            // which a fixed number of turns does not wait for under load; a fourth start would
            // still show, since the turns go on until three are seen and then once more.
            for (let turn = 0; turn < 500 && scripts().length < 3; turn += 1) await settle();
            await settle();
            expect(scripts().sort()).toEqual([
                'pyright',
                'svelte-language-server',
                'typescript-language-server'
            ]);
        }
    },
    {
        name: 'is one YAML server for a yml tab and a yaml tab of one root on one page, which ends 60 s after the last closed',
        tab: {
            channel: 'lsp:yaml',
            file: 'a.yml',
            language: 'yaml',
            files: ['a.yml', 'b.yaml']
        },
        steps: async ({ relay, spawned, page }) => {
            open(relay, page.sink, 'lsp:yaml', pageFile('repo', 'b.yaml'), 'yaml');
            await advance(0);
            expect(spawned.children).toHaveLength(1);
            expect(spawned.calls[0].args).toContain('--permission');
            close(relay, page.sink, 'lsp:yaml', pageFile('repo', 'a.yml'));
            await advance(MINUTE * 2);
            expect(spawned.children[0].ended).toBe(false);
            close(relay, page.sink, 'lsp:yaml', pageFile('repo', 'b.yaml'));
            await advance(MINUTE - 1);
            expect(spawned.children[0].ended).toBe(false);
            await advance(1);
            expect(spawned.children[0].ended).toBe(true);
            expect(relay.pids()).toEqual([]);
        }
    },
    {
        name: 'is one pyright for two Python tabs of one root on one page',
        steps: async ({ relay, spawned, page }) => {
            open(relay, page.sink, PYTHON, pageFile('repo', 'b.py'), 'python');
            await advance(0);
            expect(spawned.children).toHaveLength(1);
        }
    },
    {
        name: 'is sent SIGTERM at 2 s and SIGKILL at 5 s when it answers no shutdown',
        behave: () => ({ shutdown: 'silent', diesOn: 'SIGKILL' }),
        steps: async ({ relay, spawned, page }) => {
            relay.remove(page.sink);
            await advance(MINUTE);
            const child = spawned.children[0];
            expect(child.received).toContain('exit');
            expect(child.signals).toEqual([]);
            await advance(1_999);
            expect(child.signals).toEqual([]);
            await advance(1);
            expect(child.signals).toEqual(['SIGTERM']);
            await advance(2_999);
            expect(child.signals).toEqual(['SIGTERM']);
            expect(child.ended).toBe(false);
            await advance(1);
            expect(child.signals).toEqual(['SIGTERM', 'SIGKILL']);
            expect(child.ended).toBe(true);
        }
    },
    {
        name: 'is ended at 30 s when it answers no initialize, and the page is told no_answer',
        behave: () => ({ initialize: 'silent' }),
        steps: async ({ spawned, page }) => {
            await advance(29_999);
            expect(spawned.children[0].ended).toBe(false);
            expect(states(page)).not.toContain('failed:no_answer');
            await advance(1);
            expect(spawned.children[0].ended).toBe(true);
            expect(states(page)).toContain('failed:no_answer');
        }
    },
    {
        name: 'answers a request that waited on an initialize never answered with an error when it ends',
        behave: () => ({ initialize: 'silent' }),
        steps: async ({ relay, spawned, page }) => {
            hover(relay, page, 9);
            await advance(29_999);
            expect(page.frames.some((one) => one.payload.id === 9)).toBe(false);
            await advance(1);
            const answers = page.frames.filter((one) => one.payload.id === 9);
            expect(answers).toHaveLength(1);
            expect(answers[0].payload.error?.code).toBe(-32800);
            expect(spawned.children[0].ended).toBe(true);
        }
    },
    {
        name: 'is started again on the next request after it exits by itself, and stays failed after a second exit within 3 minutes',
        steps: async ({ relay, spawned, page }) => {
            spawned.children[0].kill('SIGKILL');
            await settle();
            expect(states(page)).toContain('failed:exited');
            hover(relay, page, 21);
            await settle();
            expect(spawned.children).toHaveLength(2);
            spawned.children[1].kill('SIGKILL');
            await settle();
            hover(relay, page, 22);
            await advance(MINUTE * 10);
            hover(relay, page, 23);
            await settle();
            expect(errorOf(page, 22)).toBe(-32800);
            expect(errorOf(page, 23)).toBe(-32800);
            expect(spawned.children).toHaveLength(2);
            relay.inbound(page.sink, frame(PYTHON, { oculus: 'restart', root: 'repo' }));
            await settle();
            expect(spawned.children).toHaveLength(3);
            expect(spawned.children[2].ended).toBe(false);
        }
    },
    {
        name: 'is started again after an exit that comes 3 minutes or more after the one before',
        steps: async ({ relay, spawned, page }) => {
            spawned.children[0].kill('SIGKILL');
            await settle();
            hover(relay, page, 31);
            await settle();
            expect(spawned.children).toHaveLength(2);
            await advance(MINUTE * 60);
            spawned.children[1].kill('SIGKILL');
            await settle();
            hover(relay, page, 32);
            await settle();
            expect(spawned.children).toHaveLength(3);
            expect(errorOf(page, 32)).toBeUndefined();
        }
    },
    {
        name: 'ends a server that was being started when its page closed',
        steps: async ({ relay, spawned, page }) => {
            const second = recordingSink();
            open(relay, second.sink, 'lsp:c', pageFile('repo', 'x.c'), 'c');
            relay.remove(second.sink);
            await advance(MINUTE + 1000);
            expect(spawned.children).toHaveLength(2);
            expect(spawned.children[1].ended).toBe(true);
            expect(spawned.children[0].ended).toBe(false);
            expect(page.frames.length).toBeGreaterThan(0);
        }
    },
    {
        name: 'is ended and started again at once under the new folder when the lsp key changes with a tab open, and only once',
        tab: {
            channel: 'lsp:c',
            file: 'x.c',
            language: 'c',
            files: ['x.c', 'compile_commands.json']
        },
        steps: async ({ relay, spawned, page, folder }) => {
            const database = (call: number): string | undefined =>
                spawned.calls[call]?.args.find((one) => one.startsWith('--compile-commands-dir='));
            const first = folder.value;
            expect(database(0)?.startsWith(`--compile-commands-dir=${first}`)).toBe(true);
            folder.value = join(realpathSync(scratchDir('oculus-lsp-key-')), 'second');
            relay.reload();
            await settle();
            expect(spawned.children[0].ended).toBe(true);
            expect(spawned.children).toHaveLength(2);
            expect(database(1)?.startsWith(`--compile-commands-dir=${folder.value}`)).toBe(true);
            expect(spawned.children[1].received).toContain('textDocument/didOpen');
            await advance(MINUTE * 3);
            expect(spawned.children).toHaveLength(2);
            expect(spawned.children[1].ended).toBe(false);
            expect(states(page).at(-1)).toBe('ready');
        }
    },
    {
        name: 'leaves no process when the lsp key changes while a server only waits to end, and the next tab starts one',
        steps: async ({ relay, spawned, page }) => {
            close(relay, page.sink, PYTHON, pageFile('repo', 'a.py'));
            await advance(30_000);
            relay.reload();
            await settle();
            expect(spawned.children[0].ended).toBe(true);
            expect(relay.pids()).toEqual([]);
            await advance(MINUTE * 3);
            expect(spawned.children).toHaveLength(1);
            open(relay, page.sink, PYTHON, pageFile('repo', 'b.py'), 'python');
            await settle();
            expect(spawned.children).toHaveLength(2);
        }
    },
    {
        name: 'leaves no process when the lsp key changes while a server waits to be taken over, and the next page starts one',
        steps: async ({ relay, spawned, page }) => {
            relay.remove(page.sink);
            await advance(30_000);
            relay.reload();
            await settle();
            expect(spawned.children[0].ended).toBe(true);
            expect(relay.pids()).toEqual([]);
            await advance(MINUTE * 3);
            expect(spawned.children).toHaveLength(1);
            open(relay, recordingSink().sink, PYTHON, pageFile('repo', 'a.py'), 'python');
            await settle();
            expect(spawned.children).toHaveLength(2);
        }
    },
    {
        name: 'starts on its next document, not at once, when the lsp key changes and it was stopped after two exits',
        steps: async () => {
            const { relay, spawned, page } = await blocked();
            relay.reload();
            await settle();
            expect(spawned.children).toHaveLength(2);
            expect(relay.pids()).toEqual([]);
            open(relay, page.sink, PYTHON, pageFile('repo', 'b.py'), 'python');
            await settle();
            expect(spawned.children).toHaveLength(3);
            expect(spawned.children[2].ended).toBe(false);
        }
    },
    {
        name: 'starts on its next document, not at once, when the lsp key changes and its program was not found',
        behave: (call) => ({ missing: call === 0 }),
        steps: async ({ relay, spawned, page }) => {
            expect(states(page).at(-1)).toBe('not_found:not_found');
            relay.reload();
            await settle();
            expect(states(page).at(-1)).toBe('starting');
            expect(spawned.calls).toHaveLength(1);
            open(relay, page.sink, PYTHON, pageFile('repo', 'b.py'), 'python');
            await settle();
            expect(spawned.calls).toHaveLength(2);
            expect(spawned.children).toHaveLength(1);
        }
    }
];

describe('the life of a language server', () => {
    it.each(ROWS)('$name', async ({ behave, tab, steps }) => {
        await steps(await opened(behave, tab));
    });
});
