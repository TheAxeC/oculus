// Layer 1, data. The `tasks:` block of config/behavior.yml: whether the four update tasks turn the
// CLI's permission prompts off.
//
// It is its own module because both sides must give the same answer. The server builds the argv
// from it, and the update tray asks it whether the task a press is about to start will run
// unattended, which is the question the tray's confirmation exists to ask; a copy of the rule on
// each side could disagree, and the direction that matters is the one where the flag is on and
// nothing warns the reader.
//
// The block has no schema, so only `true` turns the flag on: a value of any other shape reads as
// off, which leaves the prompts to be answered in the terminal rather than guessing at what a
// mistyped line meant.

import { fields } from './guards.ts';

/**
 * Whether an update task carries `--dangerously-skip-permissions`. The chat terminal does not read
 * it: the reader is sitting in front of that one.
 */
export function taskSkipPermissions(config: Record<string, unknown>): boolean {
    return fields(config.tasks).skip_permissions === true;
}
