// Layer 2, server. The ESLint oculus holds for a repository. Starting a repository's ESLint loads
// its plugins and takes seconds (17 s measured for a type-aware configuration), so the first lint
// starts one child process per configuration folder and every later lint of a file of that folder
// asks the same child, which answers in the time of one file.
//
// The child is eslint-child.mjs under the node that runs oculus; this module speaks its protocol
// (one JSON request and one JSON answer a line) and keeps the child's life:
//
// - It ends after 15 minutes without a request (`IDLE_MS`), when no served root holds the folder
//   (`reconcile`), when the approval it started under is not the one now in force (`lint` with
//   another key, or `end`), and with the server (`close`).
// - A child that exits, hangs past the time of a request or writes what is not an answer is ended,
//   the lint it was answering is `failed` or `timeout`, and the next lint starts a new child.
// - A request whose signal fires is dropped by its id; the child finishes it and its answer is
//   ignored.
//
// Nothing here is a module variable: the server context makes one `HeldEslints` and passes it to
// the route.

import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { join } from 'node:path';
import { createInterface, type Interface } from 'node:readline';
import { systemClock, type Clock, type Timer } from '../../../core/file-poll.ts';
import { inside } from '../../../core/paths.ts';
import { ownFolder } from '../../lsp/servers.ts';

/** The milliseconds a child lives without a request. */
const IDLE_MS = 15 * 60 * 1000;

/** How the child is started: the program, its argument list, and the folder it runs in. */
type EslintLaunch = { command: string; args: string[]; cwd: string };

/** What a lint through the child came to. */
export type EslintRun =
    | { kind: 'done'; answer: unknown }
    | { kind: 'timeout' }
    | { kind: 'stopped' }
    | { kind: 'failed'; reason: string };

/** The child of oculus's own program for a configuration folder and its file. */
function launchOf(folder: string, configFile: string): EslintLaunch {
    return {
        command: process.execPath,
        args: [
            join(ownFolder(), 'src/lib/server/machine/runs/lint/eslint-child.mjs'),
            folder,
            configFile
        ],
        cwd: folder
    };
}

/** One request waiting for its answer. */
type Waiting = { settle: (run: EslintRun) => void };

/** The lines of standard error kept for the reason a child failed. */
const STDERR_LINES = 20;

/** One repository's ESLint child, started by its first lint. */
class HeldEslint {
    #launch: EslintLaunch;
    #clock: Clock;
    #exited: (pid: number) => void;
    #child: ChildProcessWithoutNullStreams | null = null;
    #lines: Interface | null = null;
    #waiting = new Map<number, Waiting>();
    #errors: string[] = [];
    #idle: Timer | null = null;
    #next = 1;

    constructor(launch: EslintLaunch, clock: Clock, exited: (pid: number) => void) {
        this.#launch = launch;
        this.#clock = clock;
        this.#exited = exited;
    }

    /** Whether a child is running. */
    get running(): boolean {
        return this.#child !== null;
    }

    /** Ask the child to lint `file`, starting it when it is not running. */
    lint(file: string, signal: AbortSignal, limitMs: number): Promise<EslintRun> {
        if (signal.aborted) return Promise.resolve({ kind: 'stopped' });
        const child = this.#child ?? this.#start();
        if (child === null) return Promise.resolve({ kind: 'failed', reason: this.#reason() });
        this.#touch();
        const id = this.#next++;
        return new Promise((resolve) => {
            const timer = this.#clock.setTimeout(() => {
                settle({ kind: 'timeout' });
                this.end();
            }, limitMs);
            const onAbort = (): void => settle({ kind: 'stopped' });
            const settle = (run: EslintRun): void => {
                if (!this.#waiting.delete(id)) return;
                this.#clock.clearTimeout(timer);
                signal.removeEventListener('abort', onAbort);
                resolve(run);
            };
            this.#waiting.set(id, { settle });
            signal.addEventListener('abort', onAbort, { once: true });
            child.stdin.write(`${JSON.stringify({ id, file })}\n`);
        });
    }

    /** End the child; the lints it was answering are stopped. */
    end(): void {
        const child = this.#child;
        this.#forget();
        if (child !== null) child.kill();
        this.#settleAll({ kind: 'stopped' });
    }

    #start(): ChildProcessWithoutNullStreams | null {
        this.#errors = [];
        let child: ChildProcessWithoutNullStreams;
        try {
            child = spawn(this.#launch.command, this.#launch.args, {
                cwd: this.#launch.cwd,
                stdio: ['pipe', 'pipe', 'pipe']
            });
        } catch (error) {
            this.#errors = [error instanceof Error ? error.message : String(error)];
            return null;
        }
        this.#child = child;
        child.stdin.on('error', () => undefined);
        child.stderr.on('data', (chunk: Buffer) => {
            this.#errors.push(
                ...chunk
                    .toString()
                    .split('\n')
                    .filter((line) => line.trim() !== '')
            );
            this.#errors.splice(0, Math.max(0, this.#errors.length - STDERR_LINES));
        });
        child.on('error', (error) => {
            this.#errors.push(error.message);
            this.#lost(child);
        });
        child.on('exit', () => {
            this.#lost(child);
            if (child.pid !== undefined) this.#exited(child.pid);
        });
        this.#lines = createInterface({ input: child.stdout });
        this.#lines.on('line', (line) => this.#answer(line));
        return child;
    }

    /** One line of the child's standard output: an answer to a waiting request, or garbage. */
    #answer(line: string): void {
        let parsed: unknown;
        try {
            parsed = JSON.parse(line);
        } catch {
            this.#unreadable();
            return;
        }
        const id = (parsed as { id?: unknown } | null)?.id;
        if (typeof id !== 'number') {
            this.#unreadable();
            return;
        }
        const error = (parsed as { error?: unknown }).error;
        const run: EslintRun =
            typeof error === 'string'
                ? { kind: 'failed', reason: error }
                : { kind: 'done', answer: parsed };
        this.#waiting.get(id)?.settle(run);
        this.#touch();
    }

    /** The child wrote what is not an answer: it is ended and its lints fail. */
    #unreadable(): void {
        const child = this.#child;
        this.#forget();
        child?.kill();
        this.#settleAll({ kind: 'failed', reason: 'unreadable' });
    }

    /** The child exited by itself. */
    #lost(child: ChildProcessWithoutNullStreams): void {
        if (this.#child !== child) return;
        this.#forget();
        this.#settleAll({ kind: 'failed', reason: this.#reason() });
    }

    #reason(): string {
        return this.#errors[0]?.trim() ?? 'exited';
    }

    #settleAll(run: EslintRun): void {
        for (const waiting of [...this.#waiting.values()]) waiting.settle(run);
    }

    #forget(): void {
        this.#lines?.close();
        this.#lines = null;
        this.#child = null;
        if (this.#idle !== null) this.#clock.clearTimeout(this.#idle);
        this.#idle = null;
    }

    /** Restart the wait to end. */
    #touch(): void {
        if (this.#idle !== null) this.#clock.clearTimeout(this.#idle);
        this.#idle = this.#clock.setTimeout(() => this.end(), IDLE_MS);
    }
}

/** What the held children are made with. */
export type HeldEslintsOptions = {
    /** The real paths of the served roots now. */
    roots: () => string[];
    clock?: Clock;
    /** Told the process id of each child as it exits, however it came to. */
    exited?: (pid: number) => void;
};

/** The held children of the server, one per configuration folder. */
export class HeldEslints {
    #options: HeldEslintsOptions;
    #held = new Map<string, { key: string; eslint: HeldEslint }>();
    #closed = false;

    constructor(options: HeldEslintsOptions) {
        this.#options = options;
    }

    /**
     * Lint `file` through the child of `folder`, started under `configFile` and the approval `key`.
     * A child started under another key is ended and replaced.
     */
    lint(
        folder: string,
        configFile: string,
        key: string,
        file: string,
        signal: AbortSignal,
        limitMs: number
    ): Promise<EslintRun> {
        if (this.#closed) return Promise.resolve({ kind: 'stopped' });
        let held = this.#held.get(folder);
        if (held !== undefined && held.key !== key) {
            held.eslint.end();
            held = undefined;
        }
        if (held === undefined) {
            const launch = launchOf(folder, configFile);
            held = {
                key,
                eslint: new HeldEslint(
                    launch,
                    this.#options.clock ?? systemClock,
                    this.#options.exited ?? (() => undefined)
                )
            };
            this.#held.set(folder, held);
        }
        return held.eslint.lint(file, signal, limitMs);
    }

    /** End the child of a configuration folder, as its approval was taken back. */
    end(folder: string): void {
        this.#held.get(folder)?.eslint.end();
        this.#held.delete(folder);
    }

    /** End every child, as ESLint was switched off. */
    endAll(): void {
        for (const held of this.#held.values()) held.eslint.end();
        this.#held.clear();
    }

    /** The served roots moved: end the child of a folder that no root holds any more. */
    reconcile(): void {
        const roots = this.#options.roots();
        for (const folder of [...this.#held.keys()]) {
            if (!roots.some((root) => inside(folder, root))) this.end(folder);
        }
    }

    /** The folders with a running child. */
    running(): string[] {
        return [...this.#held].filter(([, held]) => held.eslint.running).map(([folder]) => folder);
    }

    /** End every child with the server. */
    close(): void {
        this.#closed = true;
        this.endAll();
    }
}
