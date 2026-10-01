// Layer 1, data. The map from a file name to the language the editor colours it in, read from the
// `languages:` key of config/sources.yml: each language's name, as the editor and the status bar
// know it, with the file name endings it claims. An entry starting with a dot is an extension
// (`.py`), any other entry is a whole file name (`makefile`), and both are kept lowercased, which
// is how a name is compared.
//
// One rule, imported by both layers: the file browser, the source tab, the diff and the merge views
// read a name's language through it, and the server words the entries it drops as findings
// (data/sources/config/languages.ts) from the same read, so the two cannot disagree about what was
// dropped. The page reads the map out of the configuration it was sent, which is empty until the
// config channel's first message lands, so every file is plain text until then.
//
// The names a language may take are the highlighter's registered names (data/prose/languages.ts),
// which are the ones the editor has a grammar for and the status bar has words for; a language the
// editor does not colour is dropped rather than named by a bar that cannot draw it. The answer is a
// Map so that a file called `constructor` or `__proto__` finds nothing an object would inherit.

import { z } from 'zod';
import { isMap } from '../guards.ts';
import { registered } from '../../prose/languages.ts';

/** A lowercased ending (an extension with its dot, or a whole file name) to its language. */
export type LanguageMap = ReadonlyMap<string, string>;

/** What the reader left out of a `languages:` value, in the order of the file. */
export type LanguageDrop =
    | { kind: 'not-a-map' }
    | { kind: 'unknown'; language: string }
    | { kind: 'not-a-list'; language: string }
    | { kind: 'ending'; language: string; entry: string }
    | { kind: 'claimed'; ending: string; first: string; second: string };

/** The map the config carries and what was left out of it. */
export type LanguageRead = { map: LanguageMap; drops: LanguageDrop[] };

/**
 * What an ending looks like: an extension (a dot and one segment with no dot or slash) or a whole
 * file name (no slash, and not starting with a dot, which would make it an extension).
 */
const ENDING = z.string().regex(/^(\.[^./]+|[^./][^/]*)$/);

/** The endings of one language: a list, whatever its entries hold. */
const endingsShape = z.array(z.unknown());

/** An entry as the finding words it: a string as it is, anything else as JSON. */
function shown(entry: unknown): string {
    return typeof entry === 'string' ? entry : JSON.stringify(entry);
}

/**
 * The map `languages:` holds, and each entry, language or ending it drops. An absent key is an
 * empty map with nothing dropped; a value that is not a map is an empty map and one drop. A
 * language that is not a registered name drops with all its endings, a value that is not a list
 * drops its language, and an entry that is not a file name ending drops alone. Two languages
 * claiming one ending, compared lowercased, keep the first in file order.
 */
export function readLanguages(config: Record<string, unknown>): LanguageRead {
    const map = new Map<string, string>();
    const drops: LanguageDrop[] = [];
    const held = config.languages;
    if (held === undefined) return { map, drops };
    if (!isMap(held)) return { map, drops: [{ kind: 'not-a-map' }] };
    const names = new Set(registered());
    const reported = new Set<string>();
    for (const [language, list] of Object.entries(held)) {
        if (!names.has(language)) {
            drops.push({ kind: 'unknown', language });
            continue;
        }
        const endings = endingsShape.safeParse(list);
        if (!endings.success) {
            drops.push({ kind: 'not-a-list', language });
            continue;
        }
        for (const entry of endings.data) {
            const ending = ENDING.safeParse(entry);
            if (!ending.success) {
                drops.push({ kind: 'ending', language, entry: shown(entry) });
                continue;
            }
            const key = ending.data.toLowerCase();
            const first = map.get(key);
            if (first === undefined) {
                map.set(key, language);
            } else if (first !== language && !reported.has(`${key}\n${language}`)) {
                reported.add(`${key}\n${language}`);
                drops.push({ kind: 'claimed', ending: key, first, second: language });
            }
        }
    }
    return { map, drops };
}

/** The map `languages:` holds; empty for a config that carries none. */
export function languageMap(config: Record<string, unknown>): LanguageMap {
    return readLanguages(config).map;
}
