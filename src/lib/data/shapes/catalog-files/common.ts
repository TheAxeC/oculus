// Layer 1, data. The pieces every whole-file shape of oculus's own config files is built from: a
// text, a map of texts, a colour, a flag of a vocabulary word with its description, and the
// predicate that tells a key a file's own reader words itself.

import { z } from 'zod';

/** A text. */
export const text = z.string();

/** A map from a word to a text. */
export const textMap = z.record(z.string(), text);

/** A colour written as a hex string, or any other text a stylesheet takes. */
export const colour = text;

/**
 * A flag of a vocabulary word, true where the word carries it and absent where it does not, with
 * the help sentence the editor shows for it on hover and in the suggest list.
 */
export const flag = (help: string) => z.boolean().optional().describe(help);

/** Whether a dotted key of a file is one its own reader already words when it refuses it. */
export type Owned = (key: string) => boolean;

/** The keys at or under any of these paths. */
export function under(...paths: string[]): Owned {
    return (key) => paths.some((path) => key === path || key.startsWith(`${path}.`));
}
