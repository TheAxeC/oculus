// Layer 2, server. The server's readers of its text catalog: a key's sentence with its placeholders
// filled (`words`), and a plural key's form for a count (`pluralWords`). They sit in server/core,
// the bottom of the server's folder order, so every server module that words a line (the chat
// launcher, the transcript export) reads them from here.

import { fillPlaceholders, pluralText } from '../../data/helpers/finding-text.ts';
import { byKey } from '../../data/helpers/guards.ts';

/**
 * One flattened catalog entry with its positional placeholders filled by fillPlaceholders, the fill
 * t() and findingText use, so each placeholder of the template is replaced once and an argument
 * that itself holds braces or a `$` pattern (a project title, a path) is kept as written. A key the
 * catalog lacks throws: these keys are the server's own, so a missing one is a fault of the code
 * and never text a hub edit can break. tests/checks/source/keys.test.ts reads every `words` call
 * under lib/server, whatever its first argument is, and fails on a key that is not a literal of the
 * catalog; its argument split does not know a regular expression literal or a type argument inside
 * the first argument.
 */
export function words(
    catalog: Record<string, string>,
    key: string,
    ...args: (string | number)[]
): string {
    const template = byKey(catalog, key);
    if (template === undefined) throw new Error(`text key not in config: ${key}`);
    return fillPlaceholders(template, args);
}

/**
 * The words of the server's plural key `key` for `count`, with its placeholders filled by `args`:
 * the form the count takes in the catalog's language, else the key's `other` form, as the page's
 * `plural` picks it (finding-text.ts, `pluralText`). A key whose `other` form the catalog lacks
 * throws, as `words` does; keys.test.ts reads every `pluralWords` call beside the `words` calls.
 */
export function pluralWords(
    catalog: Record<string, string>,
    key: string,
    count: number,
    ...args: (string | number)[]
): string {
    const said = pluralText(catalog, key, count, ...args);
    if (said === undefined) throw new Error(`plural text key not in config: ${key}`);
    return said;
}
