// Layer 1, data. The `chat:` block of config/behavior.yml: the model a Claude session is started
// with.
//
// The block has no schema, so a value of any other shape than a name reads as no model at all, which
// leaves the choice to the CLI rather than guessing at what a mistyped line meant. How an update task
// is started is the `tasks:` block, in data/tasks.ts.

import { fields, str } from './guards.ts';

/** The configured chat model, or null when the CLI should choose. */
export function chatModel(config: Record<string, unknown>): string | null {
    const model = str(fields(config.chat).model)?.trim() ?? '';
    return model === '' ? null : model;
}
