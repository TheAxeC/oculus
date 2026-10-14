// Layer 4, test helper. A stub language server process and a relay over it for the lsp suites: the
// stub is a fake child whose streams answer `initialize`, `shutdown` and `exit` as each case asks,
// so no real server runs and a case on the fake clock runs in milliseconds. The relay is made
// over scratch folders and lets every socket write (the token gate has its own test); nothing here
// reads or writes the machine's own `~/.oculus`.

import { EventEmitter } from 'node:events';
import { chmodSync, mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PassThrough } from 'node:stream';
import {
    StreamMessageReader,
    StreamMessageWriter,
    type ResponseMessage
} from 'vscode-jsonrpc/node';
import { afterEach, beforeEach, vi } from 'vitest';
import type { Sink } from '../../../../src/lib/server/core/channels.ts';
import type { Root } from '../../../../src/lib/server/files/files.ts';
import type { LspRpc } from '../../../../src/lib/data/model/index.ts';
import type { AppServersFeed } from '../../../../src/lib/server/machine/lsp/relay/relay-apps.ts';
import type { LibraryRules } from '../../../../src/lib/server/machine/lsp/library/rules.ts';
import { Relay } from '../../../../src/lib/server/machine/lsp/relay/relay.ts';
import type { Spawn } from '../../../../src/lib/server/machine/lsp/held/process.ts';
import { createServers } from '../../../../src/lib/server/machine/lsp/servers.ts';
import {
    latexBuild,
    type LatexBuilding
} from '../../../../src/lib/data/sources/config/settings.ts';
import { engineDir, loadConfig } from '../../../../src/lib/data/sources/config.ts';
import { scratchDir } from '../../../fixtures/scratch.ts';

/** The LaTeX settings the shipped configuration gives. */
export function shippedLatex(): LatexBuilding {
    return latexBuild(loadConfig(engineDir()).config);
}

/**
 * A folder holding executable files named for the programs, and the environment whose PATH is that
 * folder alone: texlab and the TeX programs it is given by default.
 */
export function plantPrograms(names: string[] = ['texlab', 'latex', 'kpsewhich']): {
    bin: string;
    env: NodeJS.ProcessEnv;
} {
    const bin = realpathSync(scratchDir('oculus-programs-'));
    for (const name of names) {
        writeFileSync(join(bin, name), '#!/bin/sh\n');
        chmodSync(join(bin, name), 0o755);
    }
    return { bin, env: { PATH: bin } };
}

/** How a stub answers: `initialize`, `shutdown`, and what ends it. */
export type Behaviour = {
    initialize?: 'answer' | 'silent' | 'error';
    shutdown?: 'answer' | 'silent';
    /** What makes the child exit: the `exit` notification, SIGTERM or only SIGKILL. */
    diesOn?: 'exit' | 'SIGTERM' | 'SIGKILL';
    /** The program is not there: the spawn itself fails with ENOENT. */
    missing?: boolean;
    /** The capabilities its `initialize` answer declares; none by default. */
    capabilities?: Record<string, unknown>;
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
    #waiting: { method: string; resolve: (message: LspRpc) => void }[] = [];
    #behaviour: Required<Omit<Behaviour, 'missing' | 'capabilities'>> &
        Pick<Behaviour, 'capabilities'>;

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

    /** The first message of a method it was sent, whether it was sent before or is sent later. */
    sentOf(method: string): Promise<LspRpc> {
        const found = this.messages.find((one) => one.method === method);
        if (found !== undefined) return Promise.resolve(found);
        return new Promise((resolve) => this.#waiting.push({ method, resolve }));
    }

    #read(message: LspRpc): void {
        this.messages.push(message);
        this.received.push(message.method ?? 'response');
        this.#waiting = this.#waiting.filter((one) => {
            if (one.method !== message.method) return true;
            one.resolve(message);
            return false;
        });
        const { initialize, shutdown, diesOn } = this.#behaviour;
        const id = message.id ?? null;
        if (message.method === 'initialize' && initialize !== 'silent') {
            this.#answer(
                initialize === 'answer'
                    ? {
                          jsonrpc: '2.0',
                          id,
                          result: { capabilities: this.#behaviour.capabilities ?? {} }
                      }
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
    /** The child the spawn made as call number `index`, whether it is made already or later. */
    childOf: (index: number) => Promise<Stub>;
    calls: { command: string; args: readonly string[]; cwd: string; env?: NodeJS.ProcessEnv }[];
} {
    const children: Stub[] = [];
    const starts = new Map<number, (child: Stub) => void>();
    const calls: {
        command: string;
        args: readonly string[];
        cwd: string;
        env?: NodeJS.ProcessEnv;
    }[] = [];
    const spawn: Spawn = (command, args, options) => {
        calls.push({ command, args, cwd: options.cwd, env: options.env });
        const behaviour = behave(calls.length - 1, command);
        if (behaviour.missing === true) {
            throw Object.assign(new Error(`spawn ${command} ENOENT`), { code: 'ENOENT' });
        }
        const child = new Stub(4000 + children.length, behaviour);
        children.push(child);
        starts.get(children.length - 1)?.(child);
        return child;
    };
    const childOf = (index: number): Promise<Stub> => {
        if (index < children.length) return Promise.resolve(children[index]);
        return new Promise((resolve) => void starts.set(index, resolve));
    };
    return { spawn, children, childOf, calls };
}

/** A sink that keeps each frame it was sent, parsed, in order. */
export function recordingSink(): {
    sink: Sink;
    frames: { channel: string; payload: LspRpc & Record<string, unknown> }[];
    /** The first frame a test accepts, whether it was sent before or is sent later. */
    arrival: (accepts: (payload: LspRpc & Record<string, unknown>) => boolean) => Promise<void>;
} {
    type Frame = { channel: string; payload: LspRpc & Record<string, unknown> };
    const frames: Frame[] = [];
    let waiting: { accepts: (payload: Frame['payload']) => boolean; resolve: () => void }[] = [];
    return {
        frames,
        arrival: (accepts) => {
            if (frames.some((one) => accepts(one.payload))) return Promise.resolve();
            return new Promise((resolve) => waiting.push({ accepts, resolve }));
        },
        sink: {
            send: (text) => {
                const sent = JSON.parse(text) as Frame;
                frames.push(sent);
                waiting = waiting.filter((one) => {
                    if (!one.accepts(sent.payload)) return true;
                    one.resolve();
                    return false;
                });
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
export function plantRoot(
    files: string[] = ['a.py', 'b.py', 'x.c', 'y.cpp', 'a.ts', 'b.js', 'a.svelte', 'b.svelte']
): string {
    const dir = realpathSync(scratchDir('oculus-lsp-root-'));
    for (const file of files) {
        mkdirSync(join(dir, file, '..'), { recursive: true });
        writeFileSync(join(dir, file), 'x = 1\n');
    }
    return dir;
}

/** A relay over stub processes, its roots handed in by a function so a case can change them. */
export function makeRelay(options: {
    roots: () => Root[];
    spawn: Spawn;
    run?: (command: string, args: string[]) => Promise<string | null>;
    exists?: (path: string) => boolean;
    /** The folder the `lsp` key names, read at each use; a folder of the relay's own by default. */
    lspFolder?: () => string;
    /** What decides which files outside every root may be named to a page; none by default. */
    library?: () => LibraryRules;
    /** The oculus folder and the node program the servers are found under; stubs by default. */
    own?: { oculus: string; node: string };
    /** The LaTeX settings; the shipped ones by default. */
    latex?: () => LatexBuilding;
    /** oculus's own environment, whose PATH finds a server's program; empty by default. */
    env?: NodeJS.ProcessEnv;
    /** The servers the apps' hosts register; none by default. */
    appServers?: AppServersFeed;
}): Relay {
    const latex = options.latex ?? (() => shippedLatex());
    const home = realpathSync(scratchDir('oculus-lsp-home-'));
    const relay = new Relay({
        oculus: options.own?.oculus ?? '/oculus',
        node: options.own?.node ?? '/node',
        roots: options.roots,
        lspFolder: options.lspFolder ?? (() => join(home, 'lsp')),
        approvals: () => join(home, 'approvals.json'),
        spawn: options.spawn,
        latex,
        env: options.env ?? {},
        servers: createServers({
            oculus: options.own?.oculus ?? '/oculus',
            node: options.own?.node ?? '/node',
            exists: () => true,
            latex
        }),
        run: options.run ?? (() => Promise.resolve(null)),
        exists: options.exists ?? (() => false),
        library: options.library,
        appServers: options.appServers
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

/**
 * Start the fake clock before each test and close, after each, the relays a test pushed on the
 * returned list. Called once at the top of a suite file.
 */
export function relaysMade(): Relay[] {
    const made: Relay[] = [];
    beforeEach(() => {
        useClock();
    });
    afterEach(async () => {
        const closing = Promise.all(made.map((relay) => relay.close()));
        await advance(10_000);
        await closing;
        made.length = 0;
        vi.useRealTimers();
    });
    return made;
}

/** The state frames of a page, in order, as `state` or `state:code`. */
export function states(page: ReturnType<typeof recordingSink>): string[] {
    return page.frames
        .filter((one) => one.payload.oculus === 'state')
        .map((one) => {
            const { state, code } = one.payload as unknown as { state: string; code?: string };
            return code === undefined ? state : `${state}:${code}`;
        });
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
