// Layer 2, server. The suggested commit message: the staged diff read by `claude -p` once, and the
// text it answers with handed to the page for Axel to edit. Nothing here commits anything.
//
// The instruction is the catalog's `git.message_prompt`, so the shape of a hub commit message (a
// capitalised imperative subject, a blank line, `- Verb ...` bullets, no attribution of any kind) is
// config rather than a string in a module. The model is `git.message_model` of config/behavior.yml,
// read the way server/hooks.ts reads `notify:`: defensively, with a default when the key is missing
// or malformed. Empty means the CLI's own default model, so nothing is passed.
//
// The diff and the subprocess are both options with real defaults, which is what lets
// tests/server/git-write.test.ts exercise this without a `claude` on the machine ever being run.

import { execFile } from 'node:child_process';
import { allowedRoots, MAX_OUTPUT, stagedDiff, type Outcome } from './git-write.ts';

/** The CLI this asks. */
export const CLAUDE = 'claude';

/** Milliseconds the CLI is given to answer. */
export const TIMEOUT_MS = 60000;

/** How a message is asked for: the instruction, the model or the empty string, the diff on stdin. */
export type Ask = (prompt: string, model: string, input: string) => Promise<Outcome>;

export type MessageOptions = {
    /** What is staged; server/git-write.ts's own reader when absent. */
    diff?: (root: string, roots: string[]) => Promise<Outcome>;
    /** How the CLI is asked; the real subprocess when absent. */
    ask?: Ask;
    /** The model to pass, or the empty string for the CLI's default. */
    model?: string;
};

/**
 * `git.message_model` of config/behavior.yml. A missing or malformed key answers the empty string,
 * which is the CLI's own default model.
 */
export function messageModel(config: Record<string, unknown>): string {
    const held = config.git;
    if (typeof held !== 'object' || held === null || Array.isArray(held)) return '';
    const raw = (held as Record<string, unknown>).message_model;
    return typeof raw === 'string' ? raw : '';
}

/**
 * A commit message for what is staged in one repository. An empty staged diff is refused before the
 * CLI is started, since there is nothing for it to read and a minute of waiting would say so.
 */
export async function suggestMessage(
    root: string,
    prompt: string,
    options: MessageOptions = {},
    roots: string[] = allowedRoots()
): Promise<Outcome> {
    const read = options.diff ?? stagedDiff;
    const asked = options.ask ?? run;
    const diff = await read(root, roots);
    if (!diff.ok) return diff;
    if (diff.output.trim() === '') {
        return {
            ok: false,
            output: '',
            error: 'nothing is staged, so there is nothing to describe'
        };
    }
    if (typeof prompt !== 'string' || prompt.trim() === '') {
        return {
            ok: false,
            output: '',
            error: 'the message instruction is missing from the catalog'
        };
    }
    const answer = await asked(prompt, options.model ?? '', diff.output);
    if (!answer.ok) return answer;
    return { ok: true, output: answer.output.trim(), error: '' };
}

/** The real subprocess: one non-interactive run, the diff on stdin, the text on stdout. */
function run(prompt: string, model: string, input: string): Promise<Outcome> {
    const args = model === '' ? ['-p', prompt] : ['--model', model, '-p', prompt];
    return new Promise((settle) => {
        const child = execFile(
            CLAUDE,
            args,
            { encoding: 'utf8', timeout: TIMEOUT_MS, maxBuffer: MAX_OUTPUT },
            (error, stdout, stderr) => {
                if (error !== null) {
                    const first = (stderr || error.message).trim().split('\n')[0];
                    settle({
                        ok: false,
                        output: '',
                        error: first.slice(0, 200) || 'claude failed'
                    });
                    return;
                }
                settle({ ok: true, output: typeof stdout === 'string' ? stdout : '', error: '' });
            }
        );
        child.stdin?.end(input);
    });
}
