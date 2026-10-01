// Layer 2, server. The reader of `git.autofetch_minutes` of config/behavior.yml: the minutes
// between two automatic fetches, 0 for none. It sits in server/core because two callers above it
// need the same rule: the timer in server/root/watch/autofetch.ts reads the key at every look, and
// the Settings write in server/edit/writes/config-key.ts refuses a value the start check would
// stop the server on.
//
// The configuration arrives as an unknown value, so the key is read through a schema and never
// cast; every shape that is not a whole number of minutes, 0 or more, answers null.

import { z } from 'zod';

/** The block and key as the configuration holds them. */
const periodShape = z.object({ git: z.object({ autofetch_minutes: z.number().int().min(0) }) });

/**
 * `git.autofetch_minutes` of a configuration, or null when it is missing or not a whole number of
 * 0 or more.
 */
export function autofetchMinutes(config: unknown): number | null {
    const held = periodShape.safeParse(config);
    return held.success ? held.data.git.autofetch_minutes : null;
}

/** The start check: the minutes, or one sentence naming the key when they cannot be read. */
export function requireAutofetch(config: unknown): number {
    const minutes = autofetchMinutes(config);
    if (minutes === null) {
        throw new Error(
            'config/behavior.yml: git.autofetch_minutes must be a whole number of minutes, 0 or more'
        );
    }
    return minutes;
}
