// Layer 2, server. Running an outside program and finding where one is: the one runner the LaTeX
// endpoint's programs (texcount, the formatters, synctex, texdoc) and the linters share.
//
// A program runs with no shell and its arguments as a list, under a time limit and an output limit,
// with standard input fed. A run ends in one of six ways, each its own answer because the pages
// word each differently: `done` (the exit code, standard output and standard error), `missing` (no
// such program), `timeout`, `overflow` (more output than the limit), `stopped` (the caller's signal
// ended it) and `failed` (a non-zero exit, with the first line of standard error and all of it).
//
// A non-zero exit is `failed` unless its code is one the caller names as `findings`: a linter exits
// non-zero when it reports something, and its standard output is then the answer.
//
// `programPath` says where a program is: the path itself, made absolute, when it has a folder, else
// the first folder of PATH that holds a file this process may run. `onPath` says whether that
// lookup finds it.

import { execFile } from 'node:child_process';
import { accessSync, constants, statSync } from 'node:fs';
import { delimiter, isAbsolute, resolve } from 'node:path';

/** Milliseconds a program is given before it is stopped. */
export const TOOL_TIMEOUT_MS = 20000;

/** The most output a program may write before it is stopped. */
const MAX_OUTPUT = 16 * 1024 * 1024;

/** How a run is set up when a caller needs it other than the machine's own. */
export type Tools = { env?: NodeJS.ProcessEnv; timeoutMs?: number };

/** What one program run came to: its output, or the way it did not give one. */
export type Run =
    | { kind: 'done'; stdout: string; stderr: string; code: number }
    | { kind: 'missing' }
    | { kind: 'timeout' }
    | { kind: 'overflow' }
    | { kind: 'stopped' }
    | { kind: 'failed'; reason: string; stderr: string };

/**
 * What a run is given besides the program and its arguments: the folder it runs in, the text on
 * its standard input, the exit codes that carry the answer, and a signal that ends it.
 */
export type RunOptions = {
    cwd?: string;
    input?: string;
    findings?: readonly number[];
    signal?: AbortSignal;
};

/** Run one program with no shell, feeding it `input` on standard input when given. */
export function run(
    program: string,
    args: string[],
    options: RunOptions,
    tools: Tools = {}
): Promise<Run> {
    return new Promise((done) => {
        if (options.signal?.aborted === true) {
            done({ kind: 'stopped' });
            return;
        }
        const child = execFile(
            program,
            args,
            {
                cwd: options.cwd,
                env: tools.env,
                timeout: tools.timeoutMs ?? TOOL_TIMEOUT_MS,
                maxBuffer: MAX_OUTPUT,
                encoding: 'utf8',
                ...(options.signal === undefined ? {} : { signal: options.signal })
            },
            (error, stdout, stderr) => {
                if (error === null) {
                    done({ kind: 'done', stdout, stderr, code: 0 });
                    return;
                }
                const code: unknown = 'code' in error ? error.code : undefined;
                if (code === 'ENOENT') done({ kind: 'missing' });
                else if (error.name === 'AbortError') done({ kind: 'stopped' });
                else if (code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER') done({ kind: 'overflow' });
                else if ('killed' in error && error.killed === true) done({ kind: 'timeout' });
                else if (typeof code === 'number' && options.findings?.includes(code) === true) {
                    done({ kind: 'done', stdout, stderr, code });
                } else {
                    const said = stderr.split('\n').find((line) => line.trim() !== '');
                    done({ kind: 'failed', reason: said?.trim() ?? error.message, stderr });
                }
            }
        );
        // A program that exits before reading its input closes the pipe under the write.
        child.stdin?.on('error', () => undefined);
        child.stdin?.end(options.input ?? '');
    });
}

/** Whether a path is a file this process may run. */
function runnable(path: string): boolean {
    try {
        accessSync(path, constants.X_OK);
        return statSync(path).isFile();
    } catch {
        return false;
    }
}

/**
 * Where a program is: the path itself, made absolute, when it has a folder, else the first folder
 * of PATH that holds a file this process may run. Null when there is none.
 */
export function programPath(program: string, env: NodeJS.ProcessEnv = process.env): string | null {
    if (program.includes('/')) {
        const path = isAbsolute(program) ? program : resolve(program);
        return runnable(path) ? path : null;
    }
    for (const folder of (env.PATH ?? '').split(delimiter)) {
        const path = resolve(folder, program);
        if (folder !== '' && runnable(path)) return path;
    }
    return null;
}

/** Whether a program is found, by the lookup of `programPath`. */
export function onPath(program: string, env: NodeJS.ProcessEnv = process.env): boolean {
    return programPath(program, env) !== null;
}
