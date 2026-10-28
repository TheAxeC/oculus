// Layer 2, server. The injected ssh runner for Live HPC and the ssh options every ssh this module
// family starts is given, the copy's included. A command runs on a cluster's connection: its host,
// and the user name and the key file of this machine's row for it, each its own argument, so no
// value of a hub's or a machine's file is read by ssh as an option or a second word. Its small
// result shape makes every caller testable without opening a connection.
import { spawn } from 'node:child_process';

export type RunResult = { stdout: string; stderr: string; code: number };

/**
 * What ssh connects with: the host (an ssh alias, a DNS name or an address, never starting with a
 * dash), and the user name and the absolute path of the key file when this machine names them.
 */
export type Connection = { host: string; user?: string; keyFile?: string };

export type Runner = (
    connection: Connection,
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

/**
 * The options that log in as this machine's account on a cluster: `-l` and the user name, and `-i`
 * with the key file and `IdentitiesOnly=yes`, so ssh offers that key and not every key its agent
 * holds; none of either when the connection names none.
 */
export function loginOptions(connection: Connection): string[] {
    return [
        ...(connection.user === undefined ? [] : ['-l', connection.user]),
        ...(connection.keyFile === undefined
            ? []
            : ['-i', connection.keyFile, '-o', 'IdentitiesOnly=yes'])
    ];
}

/** The arguments of an ssh of this folder up to the remote command: the options, then the host. */
export function sshArgs(connection: Connection): string[] {
    return [...SSH_OPTIONS, ...loginOptions(connection), connection.host];
}

/** How long a child that ignored the polite signal is given before it is killed outright. */
export const KILL_GRACE_MS = 2000;

/**
 * The rejection of a run whose timeout fired: its message is `timeout`, and it carries what the
 * remote command had printed by then, so a caller can tell how far the command got.
 */
export class RunTimeout extends Error {
    /** What the remote command had written to stdout when the timeout fired. */
    readonly stdout: string;

    constructor(stdout: string) {
        super('timeout');
        this.name = 'RunTimeout';
        this.stdout = stdout;
    }
}

/**
 * Run one remote command. The timeout and the `signal` end the child the same way: SIGTERM, and
 * SIGKILL `KILL_GRACE_MS` later when it has not ended. A signal that is already aborted starts no
 * child. The timeout rejects with a `RunTimeout`, whose message is `timeout`, and an abort with
 * `aborted`.
 */
export function run(
    connection: Connection,
    remote: string,
    timeoutMs: number,
    signal?: AbortSignal
): Promise<RunResult> {
    return new Promise((resolve, reject) => {
        if (signal?.aborted === true) {
            reject(new Error('aborted'));
            return;
        }
        const child = spawn(SSH_PROGRAM, [...sshArgs(connection), remote]);
        let stdout = '';
        let stderr = '';
        let force: ReturnType<typeof setTimeout> | null = null;
        child.stdout.on('data', (part) => (stdout += String(part)));
        child.stderr.on('data', (part) => (stderr += String(part)));
        const stop = (error: Error): void => {
            child.kill('SIGTERM');
            force = setTimeout(() => {
                if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
            }, KILL_GRACE_MS);
            reject(error);
        };
        const timer = setTimeout(() => stop(new RunTimeout(stdout)), timeoutMs);
        const aborted = (): void => stop(new Error('aborted'));
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
