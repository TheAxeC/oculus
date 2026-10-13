// Layer 4, server test. A Markdown file created or moved on disk while the Markdown server runs is
// in the server's workspace answers (G72): references to a heading list the links of a file that no
// tab opened, whether the file was written new, moved from another place, or moved inside a folder
// that was renamed.
//
// The server is the real `vscode-markdown-languageserver` of oculus's own `node_modules`, started
// through the relay as the page starts it, over a scratch root; the page is a recording sink. The
// first references request makes the server read the root's files once, so the rows change the
// disk after it, then open the heading's file and ask references once. The relay answers the
// server's reads itself and never sends them to the page, so the spawn of the server is wrapped to
// record the messages both ways: a row waits for the server's `markdown/fs/readFile` of the file
// it created or moved and for the notice of that file (and, for a folder, of the old place) to be
// written to the server. The page never opens the file that holds the link.
//
// What this does not cover: the page's tabs and the Files view's move; the file events themselves
// are the root watch's own, whose debounce and matching are in lifetime.test.ts and
// markdown-requests.test.ts.
// @module-tag slow: starts the real Markdown language server.

import { mkdirSync, realpathSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { PassThrough } from 'node:stream';
import { pathToFileURL } from 'node:url';
import { StreamMessageReader } from 'vscode-jsonrpc/node';
import { afterEach, describe, expect } from 'vitest';
import { it, scratchDir } from '../../../../fixtures/scratch.ts';
import { ownFolder } from '../../../../../src/lib/server/machine/lsp/servers.ts';
import { spawnChild, type Spawn } from '../../../../../src/lib/server/machine/lsp/held/process.ts';
import type { Relay } from '../../../../../src/lib/server/machine/lsp/relay/relay.ts';
import { frame, makeRelay, pageFile, recordingSink } from '../lsp-fixture.ts';

const CHANNEL = 'lsp:markdown';
const DATA = '# Data\n\nText.\n\n## Intro\n\nMore.\n';
const WARM = '# Warm\n';

/** The line of `## Intro` in DATA. */
const INTRO_LINE = 4;

/** The types of change a `didChangeWatchedFiles` carries that the rows look for. */
const DELETED = 3;

/** A message of the protocol, as the wire carries it. */
type Wire = {
    id?: number | string;
    method?: string;
    params?: { uri?: string; changes?: { uri: string; type: number }[] };
};

/** Whether a message is one a test accepts, with whether it went to the server. */
type Accepts = (message: Wire, toServer: boolean) => boolean;

let live: Relay | null = null;

afterEach(async () => {
    await live?.close();
    live = null;
});

/** One file written under a scratch root, the folders on the way made. */
function put(root: string, path: string, text: string): void {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
}

/**
 * The spawn of the real server whose messages are recorded in both directions, and the wait for
 * the first message a test accepts at or after the position it names, whether it was sent earlier
 * or is sent later. The wait answers with the message and the position after it.
 */
function tapped(): {
    spawn: Spawn;
    arrival: (accepts: Accepts, from?: number) => Promise<{ message: Wire; next: number }>;
} {
    const seen: { message: Wire; toServer: boolean }[] = [];
    let waiting: {
        accepts: Accepts;
        from: number;
        resolve: (found: { message: Wire; next: number }) => void;
    }[] = [];
    const listen = (toServer: boolean): PassThrough => {
        const pipe = new PassThrough();
        new StreamMessageReader(pipe).listen((message) => {
            seen.push({ message: message as Wire, toServer });
            waiting = waiting.filter((one) => {
                if (seen.length <= one.from || !one.accepts(message as Wire, toServer)) return true;
                one.resolve({ message: message as Wire, next: seen.length });
                return false;
            });
        });
        return pipe;
    };
    return {
        spawn: (command, args, options) => {
            const child = spawnChild(command, args, options);
            const fromServer = listen(false);
            const toServer = listen(true);
            child.stdout.on('data', (chunk: Buffer) => fromServer.write(chunk));
            const write = child.stdin.write.bind(child.stdin) as (...rest: unknown[]) => boolean;
            (child.stdin as { write: unknown }).write = (chunk: unknown, ...rest: unknown[]) => {
                toServer.write(chunk);
                return write(chunk, ...rest);
            };
            return child;
        },
        arrival: (accepts, from = 0) => {
            for (let at = from; at < seen.length; at += 1) {
                if (accepts(seen[at].message, seen[at].toServer)) {
                    return Promise.resolve({ message: seen[at].message, next: at + 1 });
                }
            }
            return new Promise((resolve) => waiting.push({ accepts, from, resolve }));
        }
    };
}

/** The relay over the real server, a recording page, and the requests a page makes. */
function scene(root: string): {
    ask: (method: string, params: unknown) => Promise<unknown>;
    open: (path: string, text: string) => void;
    /** Wait until the server has read the file again, after being told of it, and has its bytes. */
    learned: (path: string, gone?: string) => Promise<void>;
} {
    const wire = tapped();
    const relay = makeRelay({
        roots: () => [{ key: 'hub', dir: root }],
        spawn: wire.spawn,
        own: { oculus: ownFolder(), node: process.execPath }
    });
    live = relay;
    const page = recordingSink();
    let ids = 1;
    const send = (payload: object): void => void relay.inbound(page.sink, frame(CHANNEL, payload));
    const ask = async (method: string, params: unknown): Promise<unknown> => {
        ids += 1;
        const id = ids;
        send({ jsonrpc: '2.0', id, method, params });
        await page.arrival((payload) => payload.id === id && payload.method === undefined);
        return page.frames.find((one) => one.payload.id === id)?.payload.result;
    };
    send({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: { capabilities: {} }
    });
    send({ jsonrpc: '2.0', method: 'initialized', params: {} });
    const href = (path: string): string => pathToFileURL(join(root, path)).href;
    const fromServer = (method: string, path: string): Accepts => {
        return (message, toServer) =>
            !toServer && message.method === method && message.params?.uri === href(path);
    };
    return {
        ask,
        learned: async (path, gone) => {
            const read = await wire.arrival(fromServer('markdown/fs/readFile', path));
            const told = await wire.arrival(
                (message, toServer) =>
                    toServer &&
                    message.method === 'workspace/didChangeWatchedFiles' &&
                    (message.params?.changes ?? []).some(
                        (one) =>
                            one.uri === href(path) ||
                            (gone !== undefined && one.uri === href(gone) && one.type === DELETED)
                    ),
                read.next
            );
            const again = await wire.arrival(fromServer('markdown/fs/readFile', path), told.next);
            await wire.arrival(
                (message, toServer) => toServer && message.id === again.message.id,
                again.next
            );
        },
        open: (path, text) =>
            send({
                jsonrpc: '2.0',
                method: 'textDocument/didOpen',
                params: {
                    textDocument: {
                        uri: pageFile('hub', path),
                        languageId: 'markdown',
                        version: 1,
                        text
                    }
                }
            })
    };
}

type Row = {
    title: string;
    /** The files of the root when the server starts. */
    start: Record<string, string>;
    /** What happens on disk after the first references. */
    change: (root: string) => void;
    /** The file whose link the references to `## Intro` must list. */
    listed: string;
    /** The place the references must not list, when the change took a file from it. */
    gone?: string;
};

const LINK = '[sec](docs/DATA.md#intro)\n';

const rows: Row[] = [
    {
        title: 'a file created after the first references is listed by references to its heading',
        start: { 'warm.md': WARM },
        change: (root) => {
            put(root, 'docs/DATA.md', DATA);
            put(root, 'README.md', LINK);
        },
        listed: 'README.md'
    },
    {
        title: 'a file moved after the first references is listed at its new path',
        start: { 'warm.md': WARM, 'docs/DATA.md': DATA, 'README.md': LINK },
        change: (root) => {
            mkdirSync(join(root, 'notes'));
            renameSync(join(root, 'README.md'), join(root, 'notes/README.md'));
            put(root, 'notes/README.md', '[sec](../docs/DATA.md#intro)\n');
        },
        listed: 'notes/README.md'
    },
    {
        title: 'a folder moved after the first references is listed at its new path, not its old',
        start: {
            'warm.md': WARM,
            'docs/DATA.md': DATA,
            'notes/README.md': '[sec](../docs/DATA.md#intro)\n'
        },
        change: (root) => renameSync(join(root, 'notes'), join(root, 'letters')),
        listed: 'letters/README.md',
        gone: 'notes/README.md'
    }
];

/** The addresses the references to a heading name, as the page is given them. */
function addresses(result: unknown): string[] {
    return Array.isArray(result) ? result.map((one: { uri: string }) => one.uri) : [];
}

describe('a Markdown file the server learns of from disk', () => {
    it.each(rows)(
        '$title',
        async ({ start, change, listed, gone }) => {
            const root = realpathSync(scratchDir('oculus-md-created-'));
            for (const [path, text] of Object.entries(start)) put(root, path, text);
            const page = scene(root);
            page.open('warm.md', WARM);
            await page.ask('textDocument/references', {
                textDocument: { uri: pageFile('hub', 'warm.md') },
                position: { line: 0, character: 3 },
                context: { includeDeclaration: true }
            });
            change(root);
            page.open('docs/DATA.md', DATA);
            await page.learned(listed, gone);
            const found = addresses(
                await page.ask('textDocument/references', {
                    textDocument: { uri: pageFile('hub', 'docs/DATA.md') },
                    position: { line: INTRO_LINE, character: 4 },
                    context: { includeDeclaration: false }
                })
            );
            expect(found).toContain(pageFile('hub', listed));
            if (gone !== undefined) expect(found).not.toContain(pageFile('hub', gone));
        },
        30_000
    );
});
