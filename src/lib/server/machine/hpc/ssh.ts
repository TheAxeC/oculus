// Layer 2, server. The injected ssh runner for Live HPC. Its small result shape makes every caller
// testable without opening a connection.
import { spawn } from 'node:child_process';

export type RunResult = { stdout: string; stderr: string; code: number };
export type Runner = (host: string, remote: string, timeoutMs: number) => Promise<RunResult>;

/**
 * The options every poll connects with. `ConnectTimeout` bounds the connect and `BatchMode` keeps a
 * prompt from turning a poll into a wait. `ControlMaster=no` with `ControlPath=none` opens the poll
 * its own connection instead of a shared master: a master whose route died keeps its socket file
 * until its own TCP timeout, and a client that joins it waits on the master rather than on
 * `ConnectTimeout`, which governs a fresh connect only. One connection per poll costs a round trip
 * and is the difference between a poll that fails and a poll that hangs.
 */
const OPTIONS = [
    '-o',
    'ConnectTimeout=8',
    '-o',
    'BatchMode=yes',
    '-o',
    'ControlMaster=no',
    '-o',
    'ControlPath=none'
];

/** How long a child that ignored the polite signal is given before it is killed outright. */
export const KILL_GRACE_MS = 2000;

export function run(host: string, remote: string, timeoutMs: number): Promise<RunResult> {
    return new Promise((resolve, reject) => {
        const child = spawn('ssh', [...OPTIONS, host, remote]);
        let stdout = '';
        let stderr = '';
        let force: ReturnType<typeof setTimeout> | null = null;
        child.stdout.on('data', (part) => (stdout += String(part)));
        child.stderr.on('data', (part) => (stderr += String(part)));
        const timer = setTimeout(() => {
            child.kill('SIGTERM');
            force = setTimeout(() => {
                if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
            }, KILL_GRACE_MS);
            reject(new Error('timeout'));
        }, timeoutMs);
        const done = (): void => {
            clearTimeout(timer);
            if (force !== null) clearTimeout(force);
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
