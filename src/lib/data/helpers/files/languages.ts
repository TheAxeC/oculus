// Layer 1, data. The map from a file name to the language the editor colours it in, read from the
// `languages:` key of config/defaults/sources.yml: each language's name, as the editor and the
// status bar know it, with the file name endings it claims. An entry starting with a dot is an
// extension (`.py`), any other entry is a whole file name (`makefile`), and both are kept
// lowercased, which is how a name is compared.
//
// One rule, imported by both layers: the file browser, the source tab, the diff and the merge views
// read a name's language through it, and the server words the entries it drops as findings
// (data/sources/config/sections/languages.ts) from the same read, so the two cannot disagree about
// what was dropped. The page reads the map out of the configuration it was sent, which is empty
// until the config channel's first message lands, so every file is plain text until then.
//
// The names a language may take are the highlighter's registered names (data/prose/languages.ts),
// which are the ones the editor has a grammar for and the status bar has words for; a language the
// editor does not colour is dropped rather than named by a bar that cannot draw it. The answer is a
// Map so that a file called `constructor` or `__proto__` finds nothing an object would inherit.
//
// An app adds rules to the map (data/helpers/files/apps/tools/languages.ts): endings, whole names,
// globs over the path from the root and first-line expressions. The joined map is a
// `JoinedLanguages`, which `languageOf` reads in this order: the `languages:` map's whole name and
// extension, then the apps' globs, then the apps' whole names and extensions. A name rule decides
// before a first line does.

import { z } from 'zod';
import { isMap } from '../guards.ts';
import { registered } from '../../prose/languages.ts';
import { extensionOf } from './opens-in-program.ts';
import { nameOf } from './paths.ts';

/** A lowercased ending (an extension with its dot, or a whole file name) to its language. */
export type LanguageMap = ReadonlyMap<string, string>;

/** A path rule of a language: a glob over the path from the root. */
export type PatternRule = { glob: string; language: string; test: (path: string) => boolean };

/** A rule that reads a file's first line. */
export type FirstLineRule = { source: string; language: string; test: RegExp };

/**
 * The map with the rules apps add: the endings the map holds and the apps' own, the globs over a
 * path from the root and the regular expressions over a first line. `base` is the `languages:` map
 * alone, which decides before an app's glob does, and `added` holds the ids of the languages the
 * apps name, so a caller that checks a name against the highlighter's registered names accepts
 * them.
 */
export class JoinedLanguages extends Map<string, string> {
    readonly base: LanguageMap;
    readonly patterns: readonly PatternRule[];
    readonly firstLines: readonly FirstLineRule[];
    readonly added: ReadonlySet<string>;

    constructor(
        entries: Iterable<readonly [string, string]>,
        rules: {
            base: LanguageMap;
            patterns: readonly PatternRule[];
            firstLines: readonly FirstLineRule[];
            added: ReadonlySet<string>;
        }
    ) {
        super(entries);
        this.base = rules.base;
        this.patterns = rules.patterns;
        this.firstLines = rules.firstLines;
        this.added = rules.added;
    }
}

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

/** What the editor calls a file the map has no language for. */
export const PLAIN_LANGUAGE = 'plaintext';

/**
 * The name of the language a file opens in: the map's entry for its whole name lowercased, else for
 * its extension, else (for a map joined with apps) the first glob of an app that matches the path
 * and the apps' own whole names and extensions, else plain text. A name that starts with a dot has
 * no extension to read, so a dotfile is plain text, and the whole-name lookup leaves it alone for
 * the same reason: `.py` is a file called `.py`, not an extension.
 */
export function languageOf(name: string, map: LanguageMap): string {
    const bare = nameOf(name).toLowerCase();
    const ending = extensionOf(name);
    const entry = (from: LanguageMap): string | undefined =>
        (bare.startsWith('.') ? undefined : from.get(bare)) ?? from.get(ending);
    if (!(map instanceof JoinedLanguages)) return entry(map) ?? PLAIN_LANGUAGE;
    return entry(map.base) ?? patternLanguage(name, map) ?? entry(map) ?? PLAIN_LANGUAGE;
}

/** The language of the first glob of an app that matches the path from the root. */
function patternLanguage(path: string, map: JoinedLanguages): string | undefined {
    const from = path.replace(/^\/+/, '');
    return map.patterns.find((rule) => rule.test(from))?.language;
}

/** The first line of a text, without its line ending. */
function firstLineOf(text: string): string {
    const end = text.search(/\r?\n/);
    return end === -1 ? text : text.slice(0, end);
}

/**
 * The language a file opens in: the map's rules for its name, and for a file the name leaves plain
 * the first line of its text, which is read once for a text and decides only then.
 */
export function languageOfFile(name: string, text: string, map: LanguageMap): string {
    const byName = languageOf(name, map);
    if (byName !== PLAIN_LANGUAGE) return byName;
    return languageByFirstLine(firstLineOf(text), map) ?? byName;
}

/**
 * The language a file's first line decides, for a file no name rule decides: the first rule of an
 * app whose expression matches the line, or undefined.
 */
function languageByFirstLine(line: string, map: LanguageMap): string | undefined {
    if (!(map instanceof JoinedLanguages)) return undefined;
    return map.firstLines.find((rule) => rule.test.test(line))?.language;
}
