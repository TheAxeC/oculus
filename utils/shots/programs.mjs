// Layer 4, tool. What every step of utils/shots/shots.mjs shares: the refusal a step stops the
// command with, and the runner of the programs it calls by name (npm, latexmk, git and tmux).
//
// A refusal carries the one sentence the terminal is given and the output of the program that
// failed, so the person who ran the command sees why without running the step again. The runner
// keeps standard output and standard error together, in the order they came, since latexmk writes
// TeX's errors to standard output and npm writes the build's to standard error. The runner of
// src/lib/server/core/program.ts (`run`) keeps standard error alone when a program fails, which is
// why the command has a runner of its own.

import { spawn } from 'node:child_process';

/** A step that cannot go on: the sentence the terminal is given, and the output behind it. */
export class Refusal extends Error {
    /**
     * @param {string} sentence what stopped the command and, where it can, how to fix it
     * @param {string} [output] what the program that failed printed
     */
    constructor(sentence, output = '') {
        super(sentence);
        this.name = 'Refusal';
        this.output = output;
    }
}

/**
 * What a program is run with: the folder it runs in, its environment, how long it may take, and
 * the signal that ends it when the command is interrupted.
 *
 * @typedef {{ cwd: string, env: NodeJS.ProcessEnv, limitMs: number, signal?: AbortSignal }}
 *     RunOptions
 */

/**
 * Run one program with no shell and its standard input closed, and answer its exit code with its
 * output. A program that is not found or is ended by `signal` answers the code null with Node's
 * reason after its output, and a run past `limitMs` is killed and answers the code null.
 *
 * @param {string} program
 * @param {string[]} args
 * @param {RunOptions} options
 * @returns {Promise<{ code: number | null, output: string }>}
 */
export function runProgram(program, args, { cwd, env, limitMs, signal }) {
    return new Promise((done) => {
        const child = spawn(program, args, {
            cwd,
            env,
            stdio: ['ignore', 'pipe', 'pipe'],
            ...(signal === undefined ? {} : { signal })
        });
        let output = '';
        const take = (chunk) => {
            output += String(chunk);
        };
        child.stdout.on('data', take);
        child.stderr.on('data', take);
        const limit = setTimeout(() => child.kill('SIGKILL'), limitMs);
        child.on('error', (error) => {
            clearTimeout(limit);
            done({ code: null, output: `${output}${error.message}\n` });
        });
        child.on('close', (code) => {
            clearTimeout(limit);
            done({ code, output });
        });
    });
}

/**
 * Run one program as `runProgram` does, and refuse with `sentence` and the program's output when
 * it does not exit 0.
 *
 * @param {string} program
 * @param {string[]} args
 * @param {RunOptions} options
 * @param {string} sentence
 * @returns {Promise<string>} the program's output
 */
export async function mustRun(program, args, options, sentence) {
    const ran = await runProgram(program, args, options);
    if (ran.code !== 0) throw new Refusal(sentence, ran.output);
    return ran.output;
}
