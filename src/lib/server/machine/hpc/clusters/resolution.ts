// Layer 2, server. What a cluster's connection resolves to, as ssh itself says it: `ssh -G` run
// with the options and the login the poll connects with and the host, which prints the
// configuration ssh would use and opens no connection. Its `hostname`, `user`, `port` and
// `identityfile` lines are what the Live HPC section and Account setup show under the cluster, so
// a reader sees which host, account and key a poll uses after the reader's own ssh configuration
// has been applied. The program is started with an argument vector and no shell, and the injected
// `Resolve` lets a test answer without starting ssh.

import { execFile } from 'node:child_process';
import type { ClusterResolution } from '../../../../data/model/index.ts';
import { SSH_PROGRAM, sshArgs, type Connection } from '../ssh.ts';

/** How long `ssh -G` is given; it reads configuration files and resolves nothing on the network. */
const RESOLVE_MS = 5000;

/** What `ssh -G` printed and how it ended, or the start's error as its standard error. */
export type ResolveRun = (
    args: string[]
) => Promise<{ stdout: string; stderr: string; ok: boolean }>;

/** The real run of `ssh` with an argument vector and no shell. */
export const runResolve: ResolveRun = (args) =>
    new Promise((resolve) => {
        execFile(SSH_PROGRAM, args, { timeout: RESOLVE_MS }, (error, stdout, stderr) => {
            resolve({
                stdout,
                stderr: stderr || (error === null ? '' : error.message),
                ok: error === null
            });
        });
    });

/** The words `ssh -G` prints a line of for each option the section shows. */
const SHOWN = ['hostname', 'user', 'port', 'identityfile'];

/** The section's lines out of what `ssh -G` printed: one value each, every identity file. */
function readResolution(printed: string): ClusterResolution {
    const found: Partial<Record<string, string[]>> = {};
    for (const line of printed.split('\n')) {
        const at = line.indexOf(' ');
        if (at < 0) continue;
        const word = line.slice(0, at).toLowerCase();
        if (SHOWN.includes(word)) (found[word] ??= []).push(line.slice(at + 1).trim());
    }
    return {
        hostname: found.hostname?.[0] ?? '',
        user: found.user?.[0] ?? '',
        port: found.port?.[0] ?? '',
        identityfile: found.identityfile ?? []
    };
}

/**
 * The resolution of a connection: `ssh -G` with the poll's options and login, then the host. A
 * connection with no host has none to resolve and answers null; a run ssh refuses answers its
 * first line of standard error.
 */
export async function resolveConnection(
    connection: Connection,
    run: ResolveRun = runResolve
): Promise<ClusterResolution | null> {
    if (connection.host === '') return null;
    const done = await run(['-G', ...sshArgs(connection)]);
    if (!done.ok) {
        const line = done.stderr.split('\n').find((one) => one.trim() !== '') ?? '';
        return { error: line.trim() };
    }
    return readResolution(done.stdout);
}
