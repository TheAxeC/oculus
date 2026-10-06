// Layer 2, server. One language server child process: its spawn, its `initialize` handshake, its
// stderr kept as output, and its ending.
//
// The child is made by a `spawn` function the relay hands in, with an argument array, so a
// test hands a stub whose streams answer `initialize`, `shutdown` and `exit`. The framing of the
// protocol's messages on stdin and stdout is vscode-jsonrpc's `StreamMessageReader` and
// `StreamMessageWriter`; the messages themselves are plain objects, and this module sends and reads
// only the three it makes itself (`initialize`, `shutdown`, `exit`) by ids no page can hold.
//
// A server that has been asked to end gets `shutdown` and `exit` at once, then SIGTERM two seconds
// after `exit` and SIGKILL five seconds after it, unless it exited first. A server that answers no
// `initialize` within thirty seconds is ended and reported with the code `no_answer`. Each
// failure of the process is a code of data/model's `LspCode`; the relay words it for the page.

import { spawn as nodeSpawn } from 'node:child_process';
import type { Readable, Writable } from 'node:stream';
import { StreamMessageReader, StreamMessageWriter } from 'vscode-jsonrpc/node';
import type { LspCode, LspRpc } from '../../../data/model/index.ts';
import type { Launch } from './servers.ts';

/** The milliseconds a server may take to answer `initialize`. */
const INITIALIZE_MS = 30_000;

/** The milliseconds after `exit` at which a running server gets SIGTERM, and then SIGKILL. */
const TERM_MS = 2_000;
const KILL_MS = 5_000;

/** The most lines of a server's output that are kept. */
export const OUTPUT_LINES = 2000;

/** What the process needs of a child: its streams, its pid, a kill and its two events. */
export type Child = {
    pid: number | undefined;
    stdin: Writable;
    stdout: Readable;
    stderr: Readable;
    kill(signal?: NodeJS.Signals): boolean;
    on(
        event: 'exit',
        listener: (code: number | null, signal: NodeJS.Signals | null) => void
    ): unknown;
    on(event: 'error', listener: (error: NodeJS.ErrnoException) => void): unknown;
};

/** How a child is made: the program, its argument array and the folder it runs in. */
export type Spawn = (command: string, args: readonly string[], options: { cwd: string }) => Child;

/** What a process tells its owner. */
type ProcessEvents = {
    /** A message the server sent, other than the answers this module reads itself. */
    message(message: LspRpc): void;
    /** Lines of the server's stderr, whole lines only. */
    output(lines: string[]): void;
    /** The server answered `initialize` with this result and was sent `initialized`. */
    ready(result: unknown): void;
    /** The process cannot serve: the code says why. It has been ended or is being ended. */
    failed(code: LspCode, program: string): void;
    /** The child is gone. `asked` is whether this module asked it to end. */
    exited(asked: boolean): void;
};

/** What a process is started with. */
export type ProcessOptions = {
    launch: Launch;
    spawn: Spawn;
    /** The `initialize` request's params. */
    initialize: Record<string, unknown>;
    events: ProcessEvents;
};

/** The ids of the three requests this module makes, which no page's id can equal. */
const INIT_ID = 'oculus-initialize';
const SHUTDOWN_ID = 'oculus-shutdown';

type Status = 'starting' | 'ready' | 'ending' | 'gone';

export class ServerProcess {
    #options: ProcessOptions;
    #child: Child | null = null;
    #writer: StreamMessageWriter | null = null;
    #status: Status = 'starting';
    #queue: LspRpc[] = [];
    #partial = '';
    #timers = new Set<ReturnType<typeof setTimeout>>();
    #gone: Promise<void>;
    #resolveGone: () => void = () => undefined;

    constructor(options: ProcessOptions) {
        this.#options = options;
        this.#gone = new Promise((resolve) => {
            this.#resolveGone = resolve;
        });
    }

    /** The child's pid, undefined before it exists. */
    get pid(): number | undefined {
        return this.#child?.pid;
    }

    /** Whether the child has been spawned and is not gone. */
    get alive(): boolean {
        return this.#status !== 'gone';
    }

    /** Whether the server has answered `initialize`. */
    get ready(): boolean {
        return this.#status === 'ready';
    }

    /** Spawn the child and send `initialize`. */
    start(): void {
        const { launch, spawn, events } = this.#options;
        let child: Child;
        try {
            child = spawn(launch.command, launch.args, { cwd: launch.cwd });
        } catch (error) {
            this.#spawnFailed(error as NodeJS.ErrnoException);
            return;
        }
        this.#child = child;
        child.on('error', (error) => this.#spawnFailed(error));
        child.on('exit', () => this.#finish());
        child.stdin.on('error', () => undefined);
        child.stderr.on('data', (chunk: Buffer | string) => this.#text(String(chunk)));
        const reader = new StreamMessageReader(child.stdout);
        reader.onError(() => undefined);
        reader.listen((message) => this.#read(message as LspRpc));
        this.#writer = new StreamMessageWriter(child.stdin);
        this.#write({
            jsonrpc: '2.0',
            id: INIT_ID,
            method: 'initialize',
            params: this.#options.initialize
        });
        this.#later(INITIALIZE_MS, () => {
            if (this.#status !== 'starting') return;
            events.failed('no_answer', launch.program);
            void this.end();
        });
    }

    /** Send a message to the server, held until the server has answered `initialize`. */
    send(message: LspRpc): void {
        if (this.#status === 'starting') this.#queue.push(message);
        else if (this.#status === 'ready') this.#write(message);
    }

    /** Ask the server to end and resolve when it is gone. Asked twice, it is the same ending. */
    end(): Promise<void> {
        if (this.#status === 'gone' || this.#status === 'ending') return this.#gone;
        if (this.#child === null) {
            this.#finish();
            return this.#gone;
        }
        this.#status = 'ending';
        this.#write({ jsonrpc: '2.0', id: SHUTDOWN_ID, method: 'shutdown' });
        this.#write({ jsonrpc: '2.0', method: 'exit' });
        this.#later(TERM_MS, () => this.#child?.kill('SIGTERM'));
        this.#later(KILL_MS, () => this.#child?.kill('SIGKILL'));
        return this.#gone;
    }

    /** The server's own messages: the answer to `initialize`, and everything else to the owner. */
    #read(message: LspRpc): void {
        if (message.id === INIT_ID && message.method === undefined) {
            if (this.#status !== 'starting') return;
            if (message.error !== undefined) {
                this.#options.events.failed('refused', this.#options.launch.program);
                void this.end();
                return;
            }
            this.#status = 'ready';
            this.#write({ jsonrpc: '2.0', method: 'initialized', params: {} });
            for (const queued of this.#queue.splice(0)) this.#write(queued);
            this.#options.events.ready(message.result);
            return;
        }
        if (message.id === SHUTDOWN_ID && message.method === undefined) return;
        if (this.#status === 'ready' || this.#status === 'starting') {
            this.#options.events.message(message);
        }
    }

    /** Whole stderr lines out of a chunk, the unfinished one kept for the next chunk. */
    #text(chunk: string): void {
        const lines = (this.#partial + chunk).split(/\r?\n/);
        this.#partial = lines.pop() ?? '';
        if (lines.length > 0) this.#options.events.output(lines);
    }

    #write(message: LspRpc): void {
        void this.#writer?.write(message).catch(() => undefined);
    }

    /** The spawn itself failed: an unknown program is `not_found`, anything else is `exited`. */
    #spawnFailed(error: NodeJS.ErrnoException): void {
        const { events, launch } = this.#options;
        if (this.#status !== 'gone') {
            events.failed(error.code === 'ENOENT' ? 'not_found' : 'exited', launch.program);
        }
        this.#finish();
    }

    /** The child is gone: stop every timer and tell the owner whether it was asked to end. */
    #finish(): void {
        if (this.#status === 'gone') return;
        const asked = this.#status === 'ending';
        this.#status = 'gone';
        for (const timer of this.#timers) clearTimeout(timer);
        this.#timers.clear();
        if (this.#partial !== '') this.#options.events.output([this.#partial]);
        this.#partial = '';
        this.#options.events.exited(asked);
        this.#resolveGone();
    }

    /** A timer that does not keep the process alive and is cleared when the child is gone. */
    #later(ms: number, run: () => void): void {
        const timer = setTimeout(() => {
            this.#timers.delete(timer);
            run();
        }, ms);
        if (typeof timer === 'object' && typeof timer.unref === 'function') timer.unref();
        this.#timers.add(timer);
    }
}

/** The default child: the program with piped streams. */
export const spawnChild: Spawn = (command, args, options) =>
    nodeSpawn(command, [...args], {
        cwd: options.cwd,
        stdio: ['pipe', 'pipe', 'pipe']
    }) as unknown as Child;
