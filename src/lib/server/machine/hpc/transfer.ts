// Layer 2, server. The copy of Submit: rsync run with an argument vector and no shell (the program
// from PATH, a list of arguments, so a path with a space or a quote reaches it as one argument),
// from the code folder, with the files to send on its standard input NUL-separated. The injected
// `Copier` is what the planner's callers pass, so a test hands in one that records its call and no
// test starts rsync or ssh.
//
// rsync's transport is the same ssh the poll and the commands use, with the same options
// (ssh.ts's SSH_OPTIONS), joined into the one word rsync's `-e` takes: rsync splits it on spaces.
// There is no `--delete`: the cluster folder also holds the jobs' results, logs and data, and a
// copy only adds and updates. `--timeout` is rsync's own idle limit on its input and output, so a
// large first copy over a slow link is not cut by a wall-clock limit and a link that has gone quiet
// is.

import { spawn } from 'node:child_process';
import { KILL_GRACE_MS, SSH_OPTIONS, SSH_PROGRAM, type RunResult } from './ssh.ts';

/** Seconds of silence on rsync's input and output before it gives up. */
const COPY_IDLE_S = 60;

/** What one copy is given: the folder it runs in, the arguments, the files and the run's signal. */
type CopyInput = {
    cwd: string;
    vector: string[];
    files: string[];
    signal: AbortSignal;
};

/** Run one copy and say what it came to. A program that cannot start comes back as code 1. */
export type Copier = (input: CopyInput) => Promise<RunResult>;

/** The arguments of the copy of a code folder to `target` (`<host>:<folder>/`). */
export function copyVector(target: string): string[] {
    return [
        '-a',
        '-0',
        '--files-from=-',
        `--timeout=${COPY_IDLE_S}`,
        '-e',
        [SSH_PROGRAM, ...SSH_OPTIONS].join(' '),
        './',
        target
    ];
}

/**
 * The real copy. The signal ends rsync as it ends the ssh runner's child: SIGTERM, and SIGKILL
 * `KILL_GRACE_MS` later when it has not ended, and the copy answers code 1 with `aborted` at once,
 * without waiting for the child's streams to close. A signal already aborted starts nothing.
 */
export const copy: Copier = ({ cwd, vector, files, signal }) =>
    new Promise((resolve) => {
        if (signal.aborted) {
            resolve({ stdout: '', stderr: 'aborted', code: 1 });
            return;
        }
        const child = spawn('rsync', vector, { cwd, stdio: ['pipe', 'ignore', 'pipe'] });
        let stderr = '';
        let force: ReturnType<typeof setTimeout> | null = null;
        child.stderr.on('data', (part) => (stderr += String(part)));
        // A child that ends before it reads its input leaves the write to fail; the exit says why.
        child.stdin.on('error', () => undefined);
        child.stdin.end(files.map((file) => `${file}\0`).join(''));
        const stop = (): void => {
            child.kill('SIGTERM');
            force = setTimeout(() => {
                if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
            }, KILL_GRACE_MS);
            resolve({ stdout: '', stderr: 'aborted', code: 1 });
        };
        signal.addEventListener('abort', stop, { once: true });
        const done = (): void => {
            signal.removeEventListener('abort', stop);
            if (force !== null) clearTimeout(force);
        };
        child.on('error', (error) => {
            done();
            resolve({ stdout: '', stderr: error.message, code: 1 });
        });
        child.on('close', (code) => {
            done();
            resolve({ stdout: '', stderr, code: code ?? 1 });
        });
    });
