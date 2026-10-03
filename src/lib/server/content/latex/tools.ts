// Layer 2, server. The programs the LaTeX endpoint runs besides latexmk: `texcount`, which counts
// the words of a main file and the files it includes, and the formatter `latex.formatter` chooses
// (latexindent, tex-fmt or badness), which formats a text.
//
// Each runs with no shell and its arguments as a list, in the folder of the main file for texcount,
// and under a time limit. A program that is not installed, a program that runs out of time and a
// program that fails are three answers of their own, because the page words each differently.
//
// `texcount` reports its own failures on standard output and exits 0, so its output is read for
// them: a line starting `!!!` carries the reason between the marks, and `(errors:N)` with N above
// zero marks a count that did not complete. The words are the first line that is only a number.

import { execFile } from 'node:child_process';

/** Milliseconds a program is given before it is stopped. */
export const TOOL_TIMEOUT_MS = 20000;

/** The most output a program may write before it is stopped. */
const MAX_OUTPUT = 16 * 1024 * 1024;

/** How a run is set up when a caller needs it other than the machine's own. */
export type Tools = { env?: NodeJS.ProcessEnv; timeoutMs?: number };

/** What one program run came to: its output, or the way it did not give one. */
export type Run =
    | { kind: 'done'; stdout: string }
    | { kind: 'missing' }
    | { kind: 'timeout' }
    | { kind: 'failed'; reason: string };

/** Run one program with no shell, feeding it `input` on standard input when given. */
export function run(
    program: string,
    args: string[],
    options: { cwd?: string; input?: string },
    tools: Tools = {}
): Promise<Run> {
    return new Promise((done) => {
        const child = execFile(
            program,
            args,
            {
                cwd: options.cwd,
                env: tools.env,
                timeout: tools.timeoutMs ?? TOOL_TIMEOUT_MS,
                maxBuffer: MAX_OUTPUT,
                encoding: 'utf8'
            },
            (error, stdout, stderr) => {
                if (error === null) {
                    done({ kind: 'done', stdout });
                } else if ('code' in error && error.code === 'ENOENT') {
                    done({ kind: 'missing' });
                } else if ('killed' in error && error.killed === true) {
                    done({ kind: 'timeout' });
                } else {
                    const said = stderr.split('\n').find((line) => line.trim() !== '');
                    done({ kind: 'failed', reason: said?.trim() ?? error.message });
                }
            }
        );
        // A program that exits before reading its input closes the pipe under the write.
        child.stdin?.on('error', () => undefined);
        child.stdin?.end(options.input ?? '');
    });
}

/** What the words of a count came to: the number, or the reason texcount gave for not counting. */
export type Counted = { words: number } | { failure: string };

const MARKS = /^!!!\s*|\s*!!!\s*$/g;
const ERRORS = /\(errors:(\d+)\)/;
const NUMBER = /^\s*(\d+)\s*$/;

/** The words of a texcount output, or the reason it did not count; empty when it gave none. */
export function readCount(stdout: string): Counted {
    const lines = stdout.split(/\r?\n/);
    const marked = lines.find((line) => line.startsWith('!!!'));
    if (marked !== undefined) return { failure: marked.replace(MARKS, '').trim() };
    if (lines.some((line) => Number(ERRORS.exec(line)?.[1] ?? 0) > 0)) return { failure: '' };
    const number = lines.map((line) => NUMBER.exec(line)).find((found) => found !== null);
    return number === undefined ? { failure: '' } : { words: Number(number[1]) };
}
