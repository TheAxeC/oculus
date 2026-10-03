// Layer 2, server. The process table of the machine from one run of `ps` that oculus starts itself.
//
// This module has one subprocess call site for the table, as server/files/search.ts has for
// ripgrep: one list argument vector and no shell, an environment whose `LC_ALL` is `C` so `lstart`
// is in its fixed English form, a time limit, and a read that is bounded and folded as the output
// arrives. At the limit, on abort and when the output passes the bound the child is killed, so no
// `ps` outlives its read; a read that fails says why through a ReadFailure and starts nothing else.
// One call starts one child, and the watcher starts a call only when none is unsettled.

import { spawn } from 'node:child_process';
import { ReadFailure } from './failure.ts';
import { entryOf, type Entry } from './table.ts';

/** How long `ps` is given before it is killed and the read fails. */
const PS_TIMEOUT_MS = 10000;

/** Every process (`-ax`), whole command lines (`-ww`), and no header (each column named `=`). */
const PS_ARGS = ['-axww', '-o', 'pid=,ppid=,user=,pcpu=,rss=,lstart=,command='];

/**
 * How much output is read, counted in characters of the decoded stream. A table is a few hundred
 * kilobytes; this ends a run that prints without end.
 */
const MAX_OUTPUT = 32 * 1024 * 1024;

/** The child of one run: what the call reads of it and the kill. */
type PsChild = {
    stdout: {
        setEncoding(encoding: 'utf8'): unknown;
        on(event: 'data', listener: (chunk: string) => void): unknown;
        on(event: 'error', listener: () => void): unknown;
    };
    on(event: 'error', listener: () => void): unknown;
    on(event: 'close', listener: (code: number | null, signal: string | null) => void): unknown;
    kill(signal: 'SIGKILL'): boolean;
};

/** Starts the program with an argument list, never through a shell. */
type PsStart = (file: string, args: string[], env: NodeJS.ProcessEnv) => PsChild;

const startChild: PsStart = (file, args, env) =>
    spawn(file, args, { env, stdio: ['ignore', 'pipe', 'ignore'] });

type PsOptions = {
    /** How the child is started; the real `ps` when absent. */
    start?: PsStart;
    /** The environment the child inherits, with `LC_ALL` set to `C`; this process's when absent. */
    env?: NodeJS.ProcessEnv;
    /** Milliseconds the child is given. */
    timeoutMs?: number;
    /** The most characters of output read. */
    maxOutput?: number;
    /** Aborting kills the child and fails the read. */
    signal?: AbortSignal;
};

/** The table of one `ps` run, or a ReadFailure saying why there is none. */
export function readTable(options: PsOptions = {}): Promise<Entry[]> {
    const { signal, timeoutMs = PS_TIMEOUT_MS, maxOutput = MAX_OUTPUT } = options;
    return new Promise<Entry[]>((resolve, reject) => {
        if (signal?.aborted === true) {
            reject(new ReadFailure('cancelled'));
            return;
        }
        const env = { ...(options.env ?? process.env), LC_ALL: 'C' };
        let child: PsChild;
        try {
            child = (options.start ?? startChild)('ps', PS_ARGS, env);
        } catch {
            reject(new ReadFailure('start'));
            return;
        }
        // Settles when the child has gone, which a SIGKILL sent to a child stuck in the kernel can
        // outlast; a failure carries it so no second child starts before this one has closed.
        let gone = (): void => undefined;
        const ended = new Promise<void>((done) => {
            gone = done;
        });
        const entries: Entry[] = [];
        let rest = '';
        let read = 0;
        let settled = false;
        const finish = (settle: () => void): void => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            signal?.removeEventListener('abort', cancel);
            settle();
        };
        const fail = (failure: ReadFailure): void =>
            finish(() => {
                child.kill('SIGKILL');
                failure.ended = ended;
                reject(failure);
            });
        const cancel = (): void => fail(new ReadFailure('cancelled'));
        const timer = setTimeout(
            () => fail(new ReadFailure('timeout', timeoutMs / 1000)),
            timeoutMs
        );
        signal?.addEventListener('abort', cancel);
        const fold = (line: string): void => {
            const entry = entryOf(line);
            if (entry !== null) entries.push(entry);
        };

        child.stdout.setEncoding('utf8');
        child.stdout.on('data', (chunk: string) => {
            read += chunk.length;
            rest += chunk;
            for (let at = rest.indexOf('\n'); at !== -1; at = rest.indexOf('\n')) {
                fold(rest.slice(0, at));
                rest = rest.slice(at + 1);
            }
            // The tail is a line being written; a tail past the bound is a line nobody sent.
            if (read > maxOutput) fail(new ReadFailure('output'));
        });
        child.stdout.on('error', () => fail(new ReadFailure('output')));
        child.on('error', () => {
            fail(new ReadFailure('start'));
            gone();
        });
        child.on('close', (code, stop) => {
            gone();
            if (rest !== '') fold(rest);
            if (code !== 0) fail(new ReadFailure('status', code ?? stop ?? 'unknown'));
            else if (entries.length === 0 && read > 0) fail(new ReadFailure('output'));
            else finish(() => resolve(entries));
        });
    });
}
