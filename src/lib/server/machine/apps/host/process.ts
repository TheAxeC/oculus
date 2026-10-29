// Layer 2, server. One host process: the runner started under oculus's own node, its connection and
// the sequence that stops it.
//
// The program is `process.execPath` with `ELECTRON_RUN_AS_NODE=1` added to oculus's own
// environment, started with an argument array and never a shell (a path holding spaces or `$(x)`
// reaches the runner as one argument), in the app's real folder. Its standard error is the host's
// output, kept by the caller's `HostOutput`; its standard input and output are the connection.
//
// `ready` settles when the host's `activate` answered, and rejects when the host failed to load or
// ended first. `stop` asks the host to `deactivate`, gives it `stopSeconds` to settle, then sends
// SIGTERM, and SIGKILL `KILL_AFTER_MS` later; it resolves once the process has ended, and the same
// promise answers a second call. The runner ends itself after `deactivate` answers, and ends when
// its standard input closes, so a server that is killed leaves no host running.
//
// The host is the leader of a process group of its own. When it has ended, whatever is left in the
// group is killed, so no program the host started outlives it.

import { spawn as nodeSpawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import type { Clock, Timer } from '../../../core/files/file-poll.ts';
import type { ActivationEvent } from '../read/activation.ts';
import {
    connectHost,
    Refused,
    type HostCall,
    type HostHandler,
    type HostLink,
    type HostNotice
} from './connection.ts';
import type { HostOutput } from './output.ts';

/** Milliseconds between SIGTERM and SIGKILL. */
const KILL_AFTER_MS = 2000;

/** Milliseconds a process that has exited is waited for to close its streams. */
const CLOSE_GRACE_MS = 1000;

/** How a host ended: its exit code, or the signal that ended it. */
export type HostEnd = { code: number | null; signal: string };

/** What a host process is started with. */
export type HostProcessOptions = {
    /** The program, its argument array and the folder it runs in. */
    command: string;
    args: string[];
    cwd: string;
    env: NodeJS.ProcessEnv;
    /** The recorded files of the app as real paths: the only files the host may load. */
    files: string[];
    /** The sentences the runner writes to the host's output. */
    texts: Record<string, string>;
    /** The app's `name`, the prefix of the ids and settings it owns. */
    name: string;
    /** The folders of the app's scope, which the host's workspace starts with. */
    folders: { uri: string; name: string }[];
    /** The resolved values of the settings the app declares, which the host reads at once. */
    settings: Record<string, unknown>;
    event: ActivationEvent;
    output: HostOutput;
    /** The handlers of the requests a host makes of oculus. */
    handlers: Record<string, HostHandler>;
    /** The handlers of the notifications a host sends oculus. */
    notices?: Record<string, HostNotice>;
    stopSeconds: () => number;
    clock: Clock;
    spawn?: typeof nodeSpawn;
    /** The output or the state moved: the rows are published again. */
    changed: () => void;
    /** The line that says the host broke its message stream, written to its output. */
    streamBroken: (reason: string) => string;
    /** Called once, when the process has ended. */
    ended: (end: HostEnd) => void;
};

/** One host process. */
export class HostProcess {
    readonly pid: number;
    readonly started: string;
    /** Settles when `activate` answered; rejects when the host failed to load or ended first. */
    readonly ready: Promise<void>;
    #options: HostProcessOptions;
    #child: ChildProcessWithoutNullStreams;
    #link: HostLink;
    #exited: Promise<HostEnd>;
    #stopping: Promise<HostEnd> | null = null;
    #over = false;
    #kill: Timer | null = null;

    constructor(options: HostProcessOptions) {
        this.#options = options;
        const spawn = options.spawn ?? nodeSpawn;
        const child = spawn(options.command, options.args, {
            cwd: options.cwd,
            env: { ...options.env, ELECTRON_RUN_AS_NODE: '1' },
            stdio: ['pipe', 'pipe', 'pipe'],
            detached: options.spawn === undefined
        });
        this.#child = child;
        this.pid = child.pid ?? 0;
        this.started = new Date().toISOString();
        child.stdin.on('error', () => undefined);
        child.stderr.setEncoding('utf8');
        child.stderr.on('data', (chunk: string) => {
            options.output.write(chunk);
            options.changed();
        });
        this.#link = connectHost({
            input: child.stdout,
            output: child.stdin,
            handlers: options.handlers,
            notices: options.notices,
            broken: (reason) => {
                options.output.note(options.streamBroken(reason));
                void this.stop();
            }
        });
        this.#exited = new Promise((settle) => {
            let ended = false;
            let waiting: Timer | null = null;
            const finish = (code: number | null, signal: string): void => {
                if (ended) return;
                ended = true;
                if (waiting !== null) options.clock.clearTimeout(waiting);
                this.#over = true;
                if (this.#kill !== null) options.clock.clearTimeout(this.#kill);
                this.#link.dispose();
                this.#endGroup();
                const end = { code, signal };
                options.ended(end);
                settle(end);
            };
            child.on('error', (error) => {
                options.output.note(error.message);
                finish(null, '');
            });
            child.on('exit', (code, signal) => {
                waiting = options.clock.setTimeout(
                    () => finish(code, signal ?? ''),
                    CLOSE_GRACE_MS
                );
            });
            child.on('close', (code, signal) => finish(code, signal ?? ''));
        });
        this.ready = this.#activate();
        this.ready.catch(() => undefined);
    }

    /**
     * The host runs in a process group of its own, which holds every program it started: whatever
     * of the group is left once the host has ended is killed. A scripted spawn has no group.
     */
    #endGroup(): void {
        if (this.#options.spawn !== undefined || this.pid <= 0) return;
        try {
            process.kill(-this.pid, 'SIGKILL');
        } catch {
            // The group is empty.
        }
    }

    /** Send the first activation; rejects with the host's refusal or when the host ended. */
    async #activate(): Promise<void> {
        const options = this.#options;
        const lost = this.#exited.then(() => {
            throw new Refused('host_down');
        });
        await Promise.race([
            this.#link.request('oculus/activate', {
                event: options.event,
                files: options.files,
                texts: options.texts,
                name: options.name,
                folders: options.folders,
                settings: options.settings
            }),
            lost
        ]);
    }

    /** Whether the process has ended. */
    get over(): boolean {
        return this.#over;
    }

    /** The promise of the end of the process. */
    get exited(): Promise<HostEnd> {
        return this.#exited;
    }

    /** A request to the host; rejects `host_down` once the process has ended. */
    request(method: string, params: unknown, call?: HostCall): Promise<unknown> {
        if (this.#over) return Promise.reject(new Refused('host_down'));
        return Promise.race([
            this.#link.request(method, params, call),
            this.#exited.then((): never => {
                throw new Refused('host_down');
            })
        ]);
    }

    notify(method: string, params: unknown): void {
        if (!this.#over) this.#link.notify(method, params);
    }

    /** Stop the process by deactivate, SIGTERM, SIGKILL; resolves when the process has ended. */
    stop(): Promise<HostEnd> {
        if (this.#stopping !== null) return this.#stopping;
        const { clock } = this.#options;
        const term = clock.setTimeout(() => {
            this.#child.kill('SIGTERM');
            this.#kill = clock.setTimeout(() => this.#child.kill('SIGKILL'), KILL_AFTER_MS);
        }, this.#options.stopSeconds() * 1000);
        this.#stopping = (async () => {
            if (!this.#over) {
                await Promise.race([
                    this.#link.request('oculus/deactivate', null).catch(() => undefined),
                    this.#exited
                ]);
                this.#child.stdin.end();
            }
            const end = await this.#exited;
            clock.clearTimeout(term);
            return end;
        })();
        return this.#stopping;
    }
}
