// Layer 2, server. The suggested commit message: the staged diff read by `claude -p` once, and the
// text it answers with handed to the page for Axel to edit. Nothing here commits anything.
//
// The instruction is the catalog's `git.message_prompt`, so the shape of a hub commit message (a
// capitalised imperative subject, a blank line, `- Verb ...` bullets, no attribution of any kind)
// is config rather than a string in a module. The model is `git.message_model` of
// config/behavior.yml, read through a schema, with a default when the key is missing or malformed.
// Empty means the CLI's own default model, so nothing is passed.
//
// The diff and the subprocess are both options with real defaults.

import { execFile } from 'node:child_process';
import { z } from 'zod';
import { words } from '../core/words.ts';
import { allowedRoots, MAX_OUTPUT, stagedDiff, type Outcome } from './git-write.ts';

/** The CLI this asks. */
export const CLAUDE = 'claude';

/** Milliseconds the CLI is given to answer. */
export const TIMEOUT_MS = 60000;

/**
 * How a message is asked for: the instruction, the model or the empty string, the diff on stdin.
 */
export type Ask = (prompt: string, model: string, input: string) => Promise<Outcome>;

export type MessageOptions = {
    /** What is staged; server/git/git-write.ts's own reader when absent. */
    diff?: (root: string, text: Record<string, string>, roots: string[]) => Promise<Outcome>;
    /** How the CLI is asked; the real subprocess when absent. */
    ask?: Ask;
    /** The model to pass, or the empty string for the CLI's default. */
    model?: string;
};

/** The `git.message_model` text of a configuration, or the empty text when a part is missing. */
const messageModelShape = z
    .object({ git: z.object({ message_model: z.string() }) })
    .transform((config) => config.git.message_model);

/**
 * `git.message_model` of config/behavior.yml. A missing or malformed key answers the empty string,
 * which is the CLI's own default model.
 */
export function messageModel(config: Record<string, unknown>): string {
    const held = messageModelShape.safeParse(config);
    return held.success ? held.data : '';
}

/**
 * A commit message for what is staged in one repository. An empty staged diff is refused before the
 * CLI is started, since there is nothing for it to read and a minute of waiting would say so.
 */
export async function suggestMessage(
    root: string,
    prompt: string,
    text: Record<string, string>,
    options: MessageOptions = {},
    roots: string[] = allowedRoots()
): Promise<Outcome> {
    const read = options.diff ?? stagedDiff;
    const asked = options.ask ?? ((one, model, input) => run(one, model, input, text));
    const diff = await read(root, text, roots);
    if (!diff.ok) return diff;
    if (diff.output.trim() === '') {
        return {
            ok: false,
            output: '',
            error: words(text, 'server.git.nothing_staged')
        };
    }
    if (typeof prompt !== 'string' || prompt.trim() === '') {
        return {
            ok: false,
            output: '',
            error: words(text, 'server.git.no_message_instruction')
        };
    }
    const answer = await asked(prompt, options.model ?? '', diff.output);
    if (!answer.ok) return answer;
    return { ok: true, output: answer.output.trim(), error: '' };
}

/** The real subprocess: one non-interactive run, the diff on stdin, the text on stdout. */
function run(
    prompt: string,
    model: string,
    input: string,
    text: Record<string, string>
): Promise<Outcome> {
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
                        error: first.slice(0, 200) || words(text, 'server.git.claude_failed')
                    });
                    return;
                }
                settle({ ok: true, output: typeof stdout === 'string' ? stdout : '', error: '' });
            }
        );
        child.stdin?.end(input);
    });
}
