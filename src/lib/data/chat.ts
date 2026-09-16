// Layer 1, data. The `chat:` block of config/behavior.yml: the model a Claude session is started
// with, and whether oculus turns the CLI's permission prompts off.
//
// Both readers of the block are here because the two sides must give the same answer. The server
// builds the argv from it, and the update tray asks it whether the task a press is about to start
// will run unattended, which is the question the tray's confirmation exists to ask; a copy of the
// rule on each side could disagree, and the direction that matters is the one where the flag is on
// and nothing warns the reader.
//
// The block has no schema, so only `true` turns the flag on: a value of any other shape reads as
// off, which leaves the prompts to be answered in the terminal rather than guessing at what a
// mistyped line meant.

import { fields, str } from './guards.ts';

/** The configured chat model, or null when the CLI should choose. */
export function chatModel(config: Record<string, unknown>): string | null {
    const model = str(fields(config.chat).model)?.trim() ?? '';
    return model === '' ? null : model;
}

/**
 * Whether an update task carries `--dangerously-skip-permissions`. The chat terminal does not read
 * it: the reader is sitting in front of that one, and the key is here because both are the `chat:`
 * block that says how oculus starts a Claude CLI.
 */
export function chatSkipPermissions(config: Record<string, unknown>): boolean {
    return fields(config.chat).skip_permissions === true;
}
