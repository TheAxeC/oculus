// Layer 2, server test. The script an app loads as /apps/-/oculus.js
// (lib/server/machine/apps/serve/oculus.js) run against the page's real end of the bridge
// (lib/state/system/apps/frame/bridge.ts) on penpal: the app's `connect()` resolves, and each
// method it returns reaches the page's handler with its arguments and answers what the handler
// answers.
//
// The script is planted beside a copy of penpal's module, as the server serves them, and loaded
// from there. The page and the frame share one fake `window` that carries a message from one
// side to the other with the source the receiver checks, and penpal opens its own message channel
// after the handshake. The page's handlers are spies, one for every key of the object
// `createMethods` returns. What this does NOT cover: a browser's sandboxed frame, the page's
// judgment of each call (tests/state/system/apps/methods.test.ts) and the server's answer to the
// address `fs` fetches (tests/routes/apps/app-fs.test.ts).

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { afterEach, describe, expect, vi } from 'vitest';
import { connectFrame } from '../../../../src/lib/state/system/apps/frame/bridge.ts';
import {
    createMethods,
    type MethodsContext
} from '../../../../src/lib/state/system/apps/frame/methods.ts';
import { plantScratch, it } from '../../../fixtures/scratch.ts';

const FRAME_SCRIPT = new URL(
    '../../../../src/lib/server/machine/apps/serve/oculus.js',
    import.meta.url
);

/** The groups the script nests calls under. */
const NESTED = ['fs', 'commands', 'secrets', 'host', 'ui', 'settings', 'document'];

/** The page's methods an app reaches only through those groups. */
const NESTED_CALLS = [
    'fsAddress',
    'commandsRun',
    'secretsGet',
    'secretsStore',
    'secretsDelete',
    'hostRequest',
    'commandsExecute',
    'ui',
    'settingsGet',
    'documentRead',
    'documentSave',
    'documentDirty'
];

/** What the script hands an app, as far as the cases call it. */
type Oculus = {
    getTheme: () => Promise<unknown>;
    read: (channel: string) => Promise<unknown>;
    getStore: () => Promise<unknown>;
    write: (kind: string, body: unknown) => Promise<void>;
    fs: { readFile: (place: { root: string; path: string }) => Promise<Uint8Array> };
    commands: { run: (name: string) => Promise<void> };
    host: { request: (method: string, params?: unknown) => Promise<unknown> };
};

type Connect = (handlers?: object) => Promise<Oculus>;

/** The script as the server serves it: beside penpal's module, loaded from its own folder. */
function served(): Promise<{ connect: Connect }> {
    const dir = plantScratch('oculus-frame-', {
        'oculus.js': readFileSync(FRAME_SCRIPT, 'utf8'),
        'penpal.js': readFileSync(new URL(import.meta.resolve('penpal')), 'utf8').replace(
            /^\/\/# sourceMappingURL=.*$/m,
            ''
        )
    });
    return import(/* @vite-ignore */ pathToFileURL(`${dir}/oculus.js`).href);
}

/** The keys of the object the page builds for one frame. */
function pageKeys(): string[] {
    const settings = () => ({ writesPerMin: 1, opensPerMin: 1, keysPerS: 1 });
    return Object.keys(createMethods({ settings } as unknown as MethodsContext));
}

/** A window the other side posts to. */
type Fake = { postMessage: (data: unknown, options?: { transfer?: unknown[] }) => void };

/** A page and a frame that share one window, and a spy for each method the page builds. */
function pair() {
    const handlers = Object.fromEntries(
        pageKeys().map((name) => [
            name,
            vi.fn((..._args: unknown[]): Promise<unknown> => Promise.resolve(name))
        ])
    );
    handlers.getTheme.mockResolvedValue({ name: 'dark', tokens: { '--ink': '#111' }, wall: false });
    handlers.fsAddress.mockResolvedValue('http://page.test/apps/notes/k/.fs/hub/a.md');
    const shared = new EventTarget();
    // Each end of the bridge listens on the shared window and lets go of it when it tears down,
    // the frame's end on the page's destroy message, a later turn of the event loop.
    let listening = 0;
    let letGo: () => void = () => undefined;
    const released = new Promise<void>((resolve) => {
        letGo = resolve;
    });
    const add = shared.addEventListener.bind(shared);
    const remove = shared.removeEventListener.bind(shared);
    shared.addEventListener = (...args: Parameters<EventTarget['addEventListener']>) => {
        if (args[0] === 'message') listening += 1;
        add(...args);
    };
    shared.removeEventListener = (...args: Parameters<EventTarget['removeEventListener']>) => {
        remove(...args);
        if (args[0] !== 'message') return;
        listening -= 1;
        if (listening === 0) letGo();
    };
    // A message posted to a window is seen on the shared window as coming from the other one.
    const deliver =
        (from: () => object) =>
        (data: unknown, options: { transfer?: unknown[] } = {}) =>
            queueMicrotask(() =>
                shared.dispatchEvent(
                    Object.assign(new Event('message'), {
                        source: from(),
                        origin: 'null',
                        ports: options.transfer ?? [],
                        data
                    })
                )
            );
    const pageWindow: Fake = { postMessage: deliver(() => frameWindow) };
    const frameWindow: Fake = { postMessage: deliver(() => pageWindow) };
    const window = Object.assign(shared, { parent: pageWindow, origin: 'null' });
    const root = { style: { setProperty: vi.fn() }, classList: { toggle: vi.fn() } };
    vi.stubGlobal('window', window);
    vi.stubGlobal('location', { href: 'https://page.test/apps/notes/k/index.html' });
    vi.stubGlobal('document', {
        documentElement: root,
        getElementById: () => null,
        createElement: () => ({}),
        head: { prepend: vi.fn() }
    });
    const link = connectFrame({
        frame: { contentWindow: frameWindow } as unknown as HTMLIFrameElement,
        methods: handlers as never,
        timeoutS: 5,
        failed: () => undefined,
        connected: () => undefined
    });
    /** Tear both ends down and take the stubs away once neither listens any more. */
    const finish = async (): Promise<void> => {
        link.destroy();
        await released;
        vi.unstubAllGlobals();
    };
    return { handlers, root, finish };
}

describe('oculus.js against the page end of the bridge', () => {
    // A case that fails before its `finish` leaves its stubs; they go here.
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('connects and paints the theme the page hands over', async () => {
        const { root, finish } = pair();
        const { connect } = await served();
        await connect();
        expect(root.style.setProperty).toHaveBeenCalledWith('--ink', '#111');
        await finish();
    });

    it('hands the app a function for every method the page builds, the nested ones in their groups', async () => {
        const { finish } = pair();
        const { connect } = await served();
        const oculus = await connect();
        const held = oculus as unknown as Record<string, unknown>;
        const flat = Object.keys(held).filter((name) => !NESTED.includes(name));
        expect(flat.sort()).toEqual(
            pageKeys()
                .filter((name) => !NESTED_CALLS.includes(name))
                .sort()
        );
        expect(
            pageKeys()
                .filter((name) => NESTED_CALLS.includes(name))
                .sort()
        ).toEqual([...NESTED_CALLS].sort());
        for (const name of flat) expect(typeof held[name]).toBe('function');
        await finish();
    });

    it('reaches the page with the arguments of the call and answers what the page answers', async () => {
        const { handlers, finish } = pair();
        const { connect } = await served();
        const oculus = await connect();
        handlers.read.mockResolvedValue({ version: 3, payload: 'p' });
        handlers.getStore.mockResolvedValue({ n: 1 });
        handlers.commandsRun.mockResolvedValue(undefined);
        handlers.hostRequest.mockResolvedValue({ answer: 42 });
        vi.stubGlobal(
            'fetch',
            vi.fn(() => Promise.resolve(new Response(new Uint8Array([7, 8, 9]))))
        );
        expect(await oculus.getTheme()).toEqual({
            name: 'dark',
            tokens: { '--ink': '#111' },
            wall: false
        });
        expect(await oculus.read('portfolio')).toEqual({ version: 3, payload: 'p' });
        expect(handlers.read).toHaveBeenCalledWith('portfolio');
        expect(await oculus.getStore()).toEqual({ n: 1 });
        expect(handlers.getStore).toHaveBeenCalledTimes(1);
        expect(await oculus.fs.readFile({ root: 'hub', path: 'a.md' })).toEqual(
            new Uint8Array([7, 8, 9])
        );
        expect(handlers.fsAddress).toHaveBeenCalledWith('read', 'hub', 'a.md');
        await oculus.commands.run('build');
        expect(handlers.commandsRun).toHaveBeenCalledWith('build');
        expect(await oculus.host.request('ping', { n: 1 })).toEqual({ answer: 42 });
        expect(handlers.hostRequest).toHaveBeenCalledWith('ping', { n: 1 });
        await finish();
    });

    it('rejects with the word the page refused with', async () => {
        const { handlers, finish } = pair();
        const { connect } = await served();
        const oculus = await connect();
        handlers.write.mockRejectedValue('declined');
        await expect(oculus.write('radar-add', { a: 1 })).rejects.toBe('declined');
        await finish();
    });
});
