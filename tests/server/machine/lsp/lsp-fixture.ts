// Layer 4, test helper. A stub language server process and a relay over it for the lsp suites: the
// stub is a fake child whose streams answer `initialize`, `shutdown` and `exit` as each case asks,
// so no real server runs and a case on the fake clock runs in milliseconds. The relay is made
// over scratch folders and lets every socket write (the token gate has its own test); nothing here
// reads or writes the machine's own `~/.oculus`.

import { EventEmitter } from 'node:events';
import { mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PassThrough } from 'node:stream';
import {
    StreamMessageReader,
    StreamMessageWriter,
    type ResponseMessage
} from 'vscode-jsonrpc/node';
import { vi } from 'vitest';
import type { Sink } from '../../../../src/lib/server/core/channels.ts';
import type { LspRpc } from '../../../../src/lib/data/model/index.ts';
import type { LibraryRules } from '../../../../src/lib/server/machine/lsp/library/rules.ts';
import { Relay } from '../../../../src/lib/server/machine/lsp/relay.ts';
import type { Spawn } from '../../../../src/lib/server/machine/lsp/process.ts';
import { createServers } from '../../../../src/lib/server/machine/lsp/servers.ts';
import { scratchDir } from '../../../fixtures/scratch.ts';

/** How a stub answers: `initialize`, `shutdown`, and what ends it. */
export type Behaviour = {
    initialize?: 'answer' | 'silent' | 'error';
    shutdown?: 'answer' | 'silent';
    /** What makes the child exit: the `exit` notification, SIGTERM or only SIGKILL. */
    diesOn?: 'exit' | 'SIGTERM' | 'SIGKILL';
    /** The program is not there: the spawn itself fails with ENOENT. */
    missing?: boolean;
};

/** One stub child and what it was sent. */
export class Stub extends EventEmitter {
    pid: number;
    stdin = new PassThrough();
    stdout = new PassThrough();
    stderr = new PassThrough();
    /** The methods it was sent, in order; a response is `response`. */
    received: string[] = [];
    /** The messages it was sent, in order. */
    messages: LspRpc[] = [];
    signals: NodeJS.Signals[] = [];
    ended = false;
    #writer = new StreamMessageWriter(this.stdout);
    #behaviour: Required<Omit<Behaviour, 'missing'>>;

    constructor(pid: number, behaviour: Behaviour) {
        super();
        this.pid = pid;
        this.#behaviour = {
            initialize: 'answer',
            shutdown: 'answer',
            diesOn: 'exit',
            ...behaviour
        };
        const reader = new StreamMessageReader(this.stdin);
        reader.listen((message) => this.#read(message as LspRpc));
    }

    #read(message: LspRpc): void {
        this.messages.push(message);
        this.received.push(message.method ?? 'response');
        const { initialize, shutdown, diesOn } = this.#behaviour;
        const id = message.id ?? null;
        if (message.method === 'initialize' && initialize !== 'silent') {
            this.#answer(
                initialize === 'answer'
                    ? { jsonrpc: '2.0', id, result: { capabilities: {} } }
                    : { jsonrpc: '2.0', id, error: { code: -1, message: 'no' } }
            );
        } else if (message.method === 'shutdown' && shutdown === 'answer') {
            this.#answer({ jsonrpc: '2.0', id, result: null });
        } else if (message.method === 'exit' && diesOn === 'exit') {
            this.#die();
        }
    }

    /** Send the relay a message as the server. */
    say(message: LspRpc): void {
        void this.#writer.write(message);
    }

    #answer(message: ResponseMessage): void {
        void this.#writer.write(message);
    }

    kill(signal: NodeJS.Signals = 'SIGTERM'): boolean {
        this.signals.push(signal);
        if (signal === 'SIGKILL' || signal === this.#behaviour.diesOn) this.#die();
        return true;
    }

    #die(): void {
        if (this.ended) return;
        this.ended = true;
        this.emit('exit', 0, null);
    }
}

/**
 * A spawn that makes a stub per call and keeps what it was called with; `behave` is told the
 * number of the call, from 0.
 */
export function stubSpawn(behave: (call: number, command: string) => Behaviour = () => ({})): {
    spawn: Spawn;
    children: Stub[];
    calls: { command: string; args: readonly string[]; cwd: string }[];
} {
    const children: Stub[] = [];
    const calls: { command: string; args: readonly string[]; cwd: string }[] = [];
    const spawn: Spawn = (command, args, options) => {
        calls.push({ command, args, cwd: options.cwd });
        const behaviour = behave(calls.length - 1, command);
        if (behaviour.missing === true) {
            throw Object.assign(new Error(`spawn ${command} ENOENT`), { code: 'ENOENT' });
        }
        const child = new Stub(4000 + children.length, behaviour);
        children.push(child);
        return child;
    };
    return { spawn, children, calls };
}

/** A sink that keeps each frame it was sent, parsed, in order. */
export function recordingSink(): {
    sink: Sink;
    frames: { channel: string; payload: LspRpc & Record<string, unknown> }[];
} {
    const frames: { channel: string; payload: LspRpc & Record<string, unknown> }[] = [];
    return {
        frames,
        sink: {
            send: (text) => {
                frames.push(JSON.parse(text) as (typeof frames)[number]);
                return Promise.resolve();
            },
            close: () => undefined
        }
    };
}

/** A frame a page sends. */
export function frame(channel: string, payload: object): string {
    return JSON.stringify({ channel, payload });
}

/** The scratch root of the suites: a folder, real, holding the files given. */
export function plantRoot(files: string[] = ['a.py', 'b.py', 'x.c', 'y.cpp']): string {
    const dir = realpathSync(scratchDir('oculus-lsp-root-'));
    for (const file of files) {
        mkdirSync(join(dir, file, '..'), { recursive: true });
        writeFileSync(join(dir, file), 'x = 1\n');
    }
    return dir;
}

/** A relay over stub processes, its roots handed in by a function so a case can change them. */
export function makeRelay(options: {
    roots: () => { key: string; dir: string }[];
    spawn: Spawn;
    run?: (command: string, args: string[]) => Promise<string | null>;
    exists?: (path: string) => boolean;
    /** The folder the `lsp` key names, read at each use; a folder of the relay's own by default. */
    lspFolder?: () => string;
    /** What decides which files outside every root may be named to a page; none by default. */
    library?: () => LibraryRules;
}): Relay {
    const home = realpathSync(scratchDir('oculus-lsp-home-'));
    const relay = new Relay({
        oculus: '/oculus',
        node: '/node',
        roots: options.roots,
        lspFolder: options.lspFolder ?? (() => join(home, 'lsp')),
        approvals: () => join(home, 'approvals.json'),
        spawn: options.spawn,
        servers: createServers({ oculus: '/oculus', node: '/node', exists: () => true }),
        run: options.run ?? (() => Promise.resolve(null)),
        exists: options.exists ?? (() => false),
        library: options.library
    });
    relay.gate(() => true);
    return relay;
}

/**
 * The fake clock of the suites: timeouts and the date, and nothing else. The message readers and
 * writers of vscode-jsonrpc hand each message on through `setImmediate`, which stays real so the
 * streams of the stubs run as they do in the server.
 */
export function useClock(): void {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
}

/** Let the promises and the streams of the stubs run, without moving the fake clock. */
export async function settle(): Promise<void> {
    for (let turn = 0; turn < 12; turn += 1) {
        await new Promise<void>((resolve) => setImmediate(resolve));
    }
}

/** Move the fake clock on by `ms` and let what that sets going run. */
export async function advance(ms: number): Promise<void> {
    await vi.advanceTimersByTimeAsync(ms);
    await settle();
}

/** The page's address of a file of the root `key`. */
export function pageFile(key: string, path: string): string {
    return `oculus-file:///${key}/${path}`;
}

/** `initialize` and the `didOpen` of one file, on the channel of its language. */
export function open(
    relay: Relay,
    sink: Sink,
    channel: string,
    uri: string,
    languageId: string
): void {
    relay.inbound(
        sink,
        frame(channel, {
            jsonrpc: '2.0',
            id: 1,
            method: 'initialize',
            params: { capabilities: {} }
        })
    );
    relay.inbound(
        sink,
        frame(channel, {
            jsonrpc: '2.0',
            method: 'textDocument/didOpen',
            params: { textDocument: { uri, languageId, version: 1, text: 'x = 1\n' } }
        })
    );
}

/** The `didClose` of one file. */
export function close(relay: Relay, sink: Sink, channel: string, uri: string): void {
    relay.inbound(
        sink,
        frame(channel, {
            jsonrpc: '2.0',
            method: 'textDocument/didClose',
            params: { textDocument: { uri } }
        })
    );
}
