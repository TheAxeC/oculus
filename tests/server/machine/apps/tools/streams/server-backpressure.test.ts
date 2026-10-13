// Layer 4, server test. The page's messages to the server of an app while the host does not take
// them: the relay (lsp/relay/) over the real stream hub (apps/tools/streams.ts) with small
// windows, and a host that is a script in this process. The host takes no message and grants no
// credit until the case lets it, so the relay's messages for the server wait and the relay pauses
// the page's socket, and oculus holds no more than the window and the bound of what the page sent
// and the host was not given (a stream with more is closed with a line in the output). This is the
// app-server row of G75.
//
// No process runs, and the page's socket is a sink whose pause the case honours as a socket does.
// What this does NOT cover: the stream over a real host (languages.test.ts).

import { describe, expect } from 'vitest';
import type { AppServerInfo } from '../../../../../../src/lib/server/machine/lsp/adapters/entry.ts';
import type { AppServersFeed } from '../../../../../../src/lib/server/machine/lsp/relay/relay-apps.ts';
import {
    StreamHub,
    type AppStream
} from '../../../../../../src/lib/server/machine/apps/tools/streams.ts';
import {
    engineDir,
    loadConfig,
    textCatalog
} from '../../../../../../src/lib/data/sources/config.ts';
import { it } from '../../../../../fixtures/scratch.ts';
import {
    frame,
    makeRelay,
    open,
    pageFile,
    plantRoot,
    recordingSink,
    stubSpawn
} from '../../../lsp/lsp-fixture.ts';

const CHANNEL = 'lsp:notes';
const WINDOW = 16;
const HELD_MESSAGES = 4096;
const TOTAL = 10_000;

const INFO: AppServerInfo = {
    app: 'app:one',
    root: '',
    id: 's1',
    name: 'one',
    selector: [{ language: 'notes', pattern: '' }],
    sections: [],
    initializationOptions: null
};

/** A turn of the event loop, after every promise already queued has run. */
const turn = (): Promise<void> => new Promise((resolve) => setImmediate(resolve));

describe('a page that sends an app server more than the host takes', { tags: ['slow'] }, () => {
    it("pauses the page's socket, holds no more than the window and the bound, loses no message, and the server gets them all in order once the host takes them", async () => {
        const notes: string[] = [];
        let granting = false;
        const versions: number[] = [];
        let all: () => void = () => undefined;
        const everything = new Promise<void>((resolve) => {
            all = resolve;
        });
        let hub: StreamHub | null = null;
        const toHost = (method: string, params: unknown): void => {
            if (method !== 'oculus/stream/data' || hub === null) return;
            const body = params as { id: string; message?: Record<string, unknown> };
            const message = body.message ?? {};
            if (message.method === 'initialize') {
                hub.notices()['oculus/stream/data']({
                    id: body.id,
                    message: { jsonrpc: '2.0', id: message.id, result: { capabilities: {} } }
                });
            }
            if (message.method === 'textDocument/didChange') {
                versions.push(
                    (message.params as { textDocument: { version: number } }).textDocument.version
                );
                if (versions.length === TOTAL) all();
            }
            if (granting) hub.notices()['oculus/stream/control']({ id: body.id, credit: 1 });
        };
        hub = new StreamHub({
            note: (line) => notes.push(line),
            catalog: () => textCatalog(loadConfig(engineDir()).config),
            notify: toHost,
            messageWindow: WINDOW
        });
        const opened: AppStream[] = [];
        const feed: AppServersFeed = {
            servers: () => [INFO],
            open: async () => {
                const expected = hub.expect(5000);
                const handlers = hub.handlers();
                void handlers['oculus/stream/open'](
                    { id: 'one', kind: 'languageServer', purpose: { token: expected.token } },
                    { id: 0 } as never
                );
                const stream = await expected.stream;
                opened.push(stream);
                return stream;
            },
            configuration: () => null,
            languages: () => new Map(),
            onChange: () => () => undefined,
            collections: () => [],
            onDiagnostics: () => () => undefined
        };
        const dir = plantRoot(['a.note']);
        const relay = makeRelay({
            roots: () => [{ key: 'repo', dir }],
            spawn: stubSpawn().spawn,
            appServers: feed
        });
        const page = recordingSink();
        // The page's socket as the relay sees it: paused, it sends nothing until it is resumed.
        let paused = false;
        let pauses = 0;
        let resumed: () => void = () => undefined;
        /** Read through a call, since the sink's two callbacks change it while the test awaits. */
        const isPaused = (): boolean => paused;
        const sink = {
            ...page.sink,
            pause: () => {
                paused = true;
                pauses += 1;
            },
            resume: () => {
                paused = false;
                resumed();
            }
        };
        const uri = pageFile('repo', 'a.note');
        open(relay, sink, CHANNEL, uri, 'notes');
        // The host takes the first messages of the window and grants no credit for them.
        for (let at = 0; at < 20; at += 1) await turn();
        let sent = 0;
        let peak = 0;
        /** Send the next message, as a socket does: not while it is paused. */
        const next = async (): Promise<void> => {
            const version = sent + 2;
            relay.inbound(
                sink,
                frame(CHANNEL, {
                    jsonrpc: '2.0',
                    method: 'textDocument/didChange',
                    params: {
                        textDocument: { uri, version },
                        contentChanges: [{ text: `text ${version}\n` }]
                    }
                })
            );
            sent += 1;
            await turn();
            // What oculus holds: what the page sent that the host has not been given.
            peak = Math.max(peak, sent - versions.length);
        };
        while (sent < TOTAL && !isPaused()) await next();
        for (let at = 0; at < 20; at += 1) await turn();
        peak = Math.max(peak, sent - versions.length);
        const sentWhilePaused = sent;
        const closedWhileHeld = opened[0].closed;
        // The host takes what it was sent and grants credit for each message as it goes.
        granting = true;
        hub.notices()['oculus/stream/control']({ id: 'one', credit: WINDOW });
        while (sent < TOTAL) {
            if (isPaused()) {
                await new Promise<void>((resolve) => {
                    resumed = resolve;
                });
            }
            await next();
        }
        await everything;
        await relay.close();
        console.info(
            `measured: the page's socket was paused after ${sentWhilePaused} of ${TOTAL} didChange messages; oculus held at most ${peak} the host had not been given (window ${WINDOW}, bound ${HELD_MESSAGES}); paused ${pauses} times; ${versions.length} arrived`
        );
        expect([
            pauses > 0,
            sentWhilePaused < TOTAL,
            closedWhileHeld,
            notes.length,
            peak <= WINDOW + HELD_MESSAGES,
            versions.length,
            versions.every((one, at) => at === 0 || one > versions[at - 1])
        ]).toEqual([true, true, false, 0, true, TOTAL, true]);
    }, 60000);
});
