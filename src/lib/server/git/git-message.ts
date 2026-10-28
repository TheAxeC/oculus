// Layer 2, server. The suggested commit message: the staged diff read by `claude -p` once, and the
// text it answers with handed to the page for the user to edit. Nothing here commits anything. The
// program is the `claude_bin` of local.yml, which the route passes in, so one key names the Claude
// CLI for every caller.
//
// The instruction is the catalog's `git.message_prompt`, so the shape of a hub commit message (a
// capitalised imperative subject, a blank line, `- Verb ...` bullets, no attribution of any kind)
// is config rather than a string in a module. The model is `git.message_model` of
// the merged config, read through a schema, with a default when the key is missing or malformed.
// Empty means the CLI's own default model, so nothing is passed.
//
// The run writes no session (`--no-session-persistence`), so a suggestion never lists in the
// Sessions view. It runs under the account `commit_message_account` of local.yml names, applied as
// a terminal applies an account to an agent (`accountEnv` of server/machine/pty/start/compose.ts):
// the account's folder in CLAUDE_CONFIG_DIR over the server's environment, or `env -u
// CLAUDE_CONFIG_DIR` in front of the program for the default folder and for no account. No shell
// runs, so a label reaches nothing but the lookup.
//
// The diff and the subprocess are both options with real defaults.

import { execFile } from 'node:child_process';
import { z } from 'zod';
import type { AgentAccount } from '../../data/model/index.ts';
import { usageAccountLabel, type LocalConfig } from '../../data/sources/config.ts';
import { words } from '../core/words.ts';
import { accountEnv, agentAccounts } from '../machine/pty/start/compose.ts';
import { allowedRoots, MAX_OUTPUT, type GitAt, type Outcome } from './git-write.ts';
import { stagedDiff } from './git-diffs.ts';

/** Milliseconds the CLI is given to answer. */
export const TIMEOUT_MS = 60000;

/**
 * How a message is asked for: the instruction, the model or the empty string, the diff on stdin.
 */
export type Ask = (prompt: string, model: string, input: string) => Promise<Outcome>;

export type MessageOptions = {
    /** What is staged; server/git/git-diffs.ts's own reader when absent. */
    diff?: (at: GitAt, text: Record<string, string>, roots: string[]) => Promise<Outcome>;
    /** How the CLI is asked; the real subprocess when absent. */
    ask?: Ask;
    /** The model to pass, or the empty string for the CLI's default. */
    model?: string;
    /** The Claude account the run is under; the default folder when absent or null. */
    account?: AgentAccount | null;
};

/**
 * The Claude account `commit_message_account` names: the `claude` row of the joined accounts whose
 * label is the key's, compared reduced, or null for no key and for a label no row holds.
 */
export function messageAccount(local: LocalConfig): AgentAccount | null {
    const label = local.commitMessageAccount ?? '';
    if (label === '') return null;
    const reduced = usageAccountLabel(label);
    const found = agentAccounts(local).find(
        (one) => one.tool === 'claude' && usageAccountLabel(one.label) === reduced
    );
    return found ?? null;
}

/** The `git.message_model` text of a configuration, or the empty text when a part is missing. */
const messageModelShape = z
    .object({ git: z.object({ message_model: z.string() }) })
    .transform((config) => config.git.message_model);

/**
 * `git.message_model` of the merged config. A missing or malformed key answers the empty string,
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
    at: GitAt,
    prompt: string,
    text: Record<string, string>,
    claudeBin: string,
    options: MessageOptions = {},
    roots: string[] = allowedRoots()
): Promise<Outcome> {
    const read = options.diff ?? stagedDiff;
    const account = options.account ?? null;
    const asked =
        options.ask ?? ((one, model, input) => run(claudeBin, account, one, model, input, text));
    const diff = await read(at, text, roots);
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

/**
 * The real subprocess: one non-interactive run under the account, the diff on stdin, the text on
 * stdout. The account's prefix goes in front of the program, and its variable over the server's
 * environment.
 */
function run(
    claudeBin: string,
    account: AgentAccount | null,
    prompt: string,
    model: string,
    input: string,
    text: Record<string, string>
): Promise<Outcome> {
    const chosen = model === '' ? [] : ['--model', model];
    const args = ['--no-session-persistence', ...chosen, '-p', prompt];
    const { prefix, env } = accountEnv('claude', account);
    const [program, ...argv] = [...prefix, claudeBin, ...args];
    return new Promise((settle) => {
        const child = execFile(
            program,
            argv,
            {
                encoding: 'utf8',
                timeout: TIMEOUT_MS,
                maxBuffer: MAX_OUTPUT,
                env: { ...process.env, ...env }
            },
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
