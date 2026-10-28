// Layer 2, server. How git is run for a clone and for the exclude block of a hub: the real git, one
// argument vector at a time, never a shell. A clone runs in a folder the reader picked, so unlike
// the deposit's runner (server/git/deposit/deposit-git.ts, which is held to the mirrors folder)
// this one takes the `-C` its caller puts at the head of the vector and applies no folder rule of
// its own. A command that fails answers `{ ok: false, error }` with the program's own sentence, or
// with the code `classifyFailure` names when it gave none, and never throws. The GitHub CLI is run
// the same way. git is given the `-c` arguments of the server context's credentials before the
// caller's (server/core/git/credentials.ts).

import { execFile } from 'node:child_process';
import type { GitCredentials } from '../../core/git/credentials.ts';
import { endWith } from '../../core/git/running.ts';
import { GIT } from '../../core/git/run.ts';
import { classifyFailure } from '../../core/git/parse.ts';
import type { GhRun, Outcome } from '../deposit/deposit-git.ts';

/** Milliseconds one command that stays on this machine is given. */
export const LOCAL_TIMEOUT_MS = 10000;

/** Milliseconds a command that reaches the network is given. */
export const REMOTE_TIMEOUT_MS = 120000;

/** How much output one command may produce. */
const MAX_OUTPUT = 8 * 1024 * 1024;

/** How many characters of a failed command's reason the page is given. */
const REASON_WIDTH = 200;

/** How git is run when the command reads a text from its standard input. */
export type InputRunner = (
    args: string[],
    timeout: number,
    signal?: AbortSignal,
    input?: string
) => Promise<Outcome>;

/**
 * Run `program` with these arguments, ended by the signal when Cancel aborts the run. The `input`
 * is written to the program's standard input, which is closed after it.
 */
function execute(
    program: string,
    args: string[],
    timeout: number,
    signal?: AbortSignal,
    input?: string
): Promise<Outcome> {
    return new Promise<Outcome>((settle) => {
        const child = execFile(
            program,
            args,
            { encoding: 'utf8', timeout, maxBuffer: MAX_OUTPUT },
            (error, stdout, stderr) => {
                if (error === null) {
                    settle({
                        ok: true,
                        output: typeof stdout === 'string' ? stdout : '',
                        error: ''
                    });
                    return;
                }
                const said = classifyFailure(
                    ended(error),
                    stdout,
                    stderr,
                    { timeoutMs: timeout, maxBytes: MAX_OUTPUT },
                    REASON_WIDTH,
                    program
                );
                settle({
                    ok: false,
                    output: '',
                    error: said.reason,
                    ...(said.failure === undefined ? {} : { failure: said.failure })
                });
            }
        );
        const ended = endWith(child, signal);
        if (input !== undefined) child.stdin?.end(input);
    });
}

/** The real git, given these credentials' arguments before the caller's. */
export function cloneGit(credentials: GitCredentials): InputRunner {
    return (args, timeout, signal, input) =>
        execute(GIT, [...credentials.args(), ...args], timeout, signal, input);
}

/** The real GitHub CLI, which the list of the account's repositories is read with. */
export const cloneGh: GhRun = (args, timeout, signal) => execute('gh', args, timeout, signal);
