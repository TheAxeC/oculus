// Layer 2, server. The working folder of each listed process, from one `lsof` call over exactly
// those pids. `lsof` exits 1 when one pid has gone but prints the others, so its answer is read
// whatever its exit; a failure to run it, a timeout and an abort give no folder at all.

import { spawn } from 'node:child_process';

/** How long `lsof` is given before it is killed. */
const LSOF_TIMEOUT_MS = 5000;

type ExecOptions = { timeout: number; signal?: AbortSignal };

/** What a child printed and the status it exited with. */
type ExecResult = { stdout: string; code: number | null };

/** Runs a program with an argument list, never through a shell. */
type Exec = (file: string, args: string[], options: ExecOptions) => Promise<ExecResult>;

/**
 * Run a program with an argument list and answer its output and exit status whatever the status.
 * It rejects when the program cannot run, when it passes the timeout (the child is killed) and when
 * the signal is aborted (the child is killed).
 */
const execute: Exec = (file, args, options) =>
    new Promise((resolve, reject) => {
        const child = spawn(file, args, {
            stdio: ['ignore', 'pipe', 'ignore'],
            timeout: options.timeout,
            ...(options.signal === undefined ? {} : { signal: options.signal })
        });
        let stdout = '';
        child.stdout.setEncoding('utf8');
        child.stdout.on('data', (chunk: string) => (stdout += chunk));
        child.on('error', reject);
        child.on('exit', (_code, killedBy) => {
            if (killedBy !== null) reject(new Error(`${file} was stopped by ${killedBy}`));
        });
        child.on('close', (code) => resolve({ stdout, code }));
    });

/** The arguments of the one call: the current working directory of exactly these pids. */
function lsofArgs(pids: readonly number[]): string[] {
    return ['-a', '-d', 'cwd', '-Fn', '-p', pids.join(',')];
}

/**
 * The folder of each pid of `lsof -Fn` output: a `p<pid>` line opens a process and the `n<path>`
 * line after it names the folder. A pid with no `n` line has no entry.
 */
function parseFolders(text: string): Map<number, string> {
    const folders = new Map<number, string>();
    let pid: number | null = null;
    for (const line of text.split('\n')) {
        if (/^p\d+$/.test(line)) pid = Number(line.slice(1));
        else if (line.startsWith('n') && pid !== null && !folders.has(pid)) {
            folders.set(pid, line.slice(1));
        }
    }
    return folders;
}

type FolderOptions = {
    /** The program that is run; `lsof` when absent. */
    program?: string;
    /** How the program is run; a child with an argument list, no shell, when absent. */
    exec?: Exec;
    /** Milliseconds the program is given before it is killed. */
    timeoutMs?: number;
    signal?: AbortSignal;
};

/** The folder of each whole positive pid given, each asked once; empty when `lsof` fails. */
export async function lsofFolders(
    pids: readonly number[],
    options: FolderOptions = {}
): Promise<Map<number, string>> {
    const asked = [...new Set(pids)].filter((pid) => Number.isSafeInteger(pid) && pid > 0);
    if (asked.length === 0) return new Map();
    try {
        const answer = await (options.exec ?? execute)(options.program ?? 'lsof', lsofArgs(asked), {
            timeout: options.timeoutMs ?? LSOF_TIMEOUT_MS,
            ...(options.signal === undefined ? {} : { signal: options.signal })
        });
        return parseFolders(answer.stdout);
    } catch {
        return new Map();
    }
}
