// Layer 2, server. The injected ssh runner for Live HPC and the ssh options every ssh this module
// family starts is given, the copy's included. Its small result shape makes every caller testable
// without opening a connection.
import { spawn } from 'node:child_process';

export type RunResult = { stdout: string; stderr: string; code: number };
export type Runner = (
    host: string,
    remote: string,
    timeoutMs: number,
    signal?: AbortSignal
) => Promise<RunResult>;

/**
 * The options every ssh of this folder connects with: a poll, a command and the transport of a
 * copy. `ConnectTimeout` bounds the connect and `BatchMode` keeps a prompt from turning a poll into
 * a wait. `ControlMaster=no` with `ControlPath=none` opens the poll its own connection instead of a
 * shared master: a master whose route died keeps its socket file until its own TCP timeout, and a
 * client that joins it waits on the master rather than on `ConnectTimeout`, which governs a fresh
 * connect only. One connection per poll costs a round trip and is the difference between a poll
 * that fails and a poll that hangs.
 */
export const SSH_OPTIONS = [
    '-o',
    'ConnectTimeout=8',
    '-o',
    'BatchMode=yes',
    '-o',
    'ControlMaster=no',
    '-o',
    'ControlPath=none'
];

/** The ssh program, which rsync also starts for its transport. */
export const SSH_PROGRAM = 'ssh';

/** How long a child that ignored the polite signal is given before it is killed outright. */
export const KILL_GRACE_MS = 2000;

/**
 * Run one remote command. The timeout and the `signal` end the child the same way: SIGTERM, and
 * SIGKILL `KILL_GRACE_MS` later when it has not ended. A signal that is already aborted starts no
 * child. The timeout rejects with `timeout` and an abort with `aborted`.
 */
export function run(
    host: string,
    remote: string,
    timeoutMs: number,
    signal?: AbortSignal
): Promise<RunResult> {
    return new Promise((resolve, reject) => {
        if (signal?.aborted === true) {
            reject(new Error('aborted'));
            return;
        }
        const child = spawn(SSH_PROGRAM, [...SSH_OPTIONS, host, remote]);
        let stdout = '';
        let stderr = '';
        let force: ReturnType<typeof setTimeout> | null = null;
        child.stdout.on('data', (part) => (stdout += String(part)));
        child.stderr.on('data', (part) => (stderr += String(part)));
        const stop = (reason: string): void => {
            child.kill('SIGTERM');
            force = setTimeout(() => {
                if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
            }, KILL_GRACE_MS);
            reject(new Error(reason));
        };
        const timer = setTimeout(() => stop('timeout'), timeoutMs);
        const aborted = (): void => stop('aborted');
        signal?.addEventListener('abort', aborted, { once: true });
        const done = (): void => {
            clearTimeout(timer);
            if (force !== null) clearTimeout(force);
            signal?.removeEventListener('abort', aborted);
        };
        child.on('error', (error) => {
            done();
            reject(error);
        });
        child.on('close', (code) => {
            done();
            resolve({ stdout, stderr, code: code ?? 1 });
        });
    });
}
