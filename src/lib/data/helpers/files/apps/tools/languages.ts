// Layer 1, data. The languages the apps add joined to the map of `config/sources.yml`: the
// server's `onLanguage:` events and the page's tabs read the same join, so they cannot disagree
// about the language of a file. The order is the user's `languages:` first, then oculus's own
// (both are the merged configuration's map), then the apps' in the Views list's order. A language
// id an app names that exists adds its extensions, file names and globs to that language, as VS
// Code merges them; an ending or a glob two languages give is kept by the first, and the join
// reports each that lost with the id it lost to.

import { globTest } from '../../../search/glob.ts';
import { appActive, appViewId } from '../apps.ts';
import type { AppLanguage } from '../../../../model/index.ts';
import {
    JoinedLanguages,
    PLAIN_LANGUAGE,
    languageOf,
    type FirstLineRule,
    type LanguageMap,
    type PatternRule
} from '../../languages.ts';

/** The languages one acting app declares. */
export type AppLanguages = { app: string; languages: readonly AppLanguage[] };

/** A rule of an app that lost to an earlier one. */
export type LanguageLoss = {
    app: string;
    language: string;
    /** The ending or the glob. */
    rule: string;
    /** The id of the language that has it. */
    first: string;
};

/** A path rule of a language: the glob read as every other glob of oculus is (`globTest`). */
function globRule(glob: string, language: string): PatternRule {
    return { glob, language, test: globTest(glob) };
}

/** A first-line rule, or null for an expression that does not compile. */
function lineRule(source: string, language: string): FirstLineRule | null {
    try {
        return { source, language, test: new RegExp(source) };
    } catch {
        return null;
    }
}

/** The map joined with the apps' rules, and the rules that lost. */
export function joinLanguages(
    base: LanguageMap,
    apps: readonly AppLanguages[]
): { map: JoinedLanguages; lost: LanguageLoss[] } {
    const endings = new Map(base);
    const patterns: PatternRule[] = [];
    const firstLines: FirstLineRule[] = [];
    const added = new Set<string>();
    const lost: LanguageLoss[] = [];
    for (const { app, languages } of apps) {
        for (const language of languages) {
            added.add(language.id);
            for (const ending of [...language.extensions, ...language.filenames]) {
                const first = endings.get(ending);
                if (first === undefined) endings.set(ending, language.id);
                else if (first !== language.id) {
                    lost.push({ app, language: language.id, rule: ending, first });
                }
            }
            for (const glob of language.filenamePatterns) {
                const held = patterns.find((one) => one.glob === glob);
                if (held === undefined) patterns.push(globRule(glob, language.id));
                else if (held.language !== language.id) {
                    lost.push({ app, language: language.id, rule: glob, first: held.language });
                }
            }
            const line =
                language.firstLine === '' ? null : lineRule(language.firstLine, language.id);
            if (line !== null) firstLines.push(line);
        }
    }
    return { map: new JoinedLanguages(endings, { base, patterns, firstLines, added }), lost };
}

/** What the join reads of an app's row: its identity, whether it acts and its languages. */
export type LanguageRow = {
    root: string;
    name: string;
    disabled: boolean;
    hashApproved: boolean;
    contributes: { languages: readonly AppLanguage[] };
};

/** The map joined with the languages of the apps that act, given in the Views list's order. */
export function joinedFor(base: LanguageMap, rows: readonly LanguageRow[]): JoinedLanguages {
    const acting = rows
        .filter((row) => appActive(row))
        .map((row) => ({
            app: appViewId(row.root, row.name),
            languages: row.contributes.languages
        }));
    return joinLanguages(base, acting).map;
}

/** One entry of a document selector: a language id, a glob, or both. */
export type SelectorItem = { language: string; pattern: string };

/** The language a selector pattern stands for: the language of a file the pattern names. */
function patternLanguage(pattern: string, map: LanguageMap): string | null {
    const name = pattern.split('/').at(-1) ?? '';
    const probe = name.replace(/^\*+/, 'x').replace(/[{}[\]!?*]/g, '');
    if (probe === '' || probe === 'x') return null;
    const language = languageOf(probe, map);
    return language === PLAIN_LANGUAGE ? null : language;
}

/**
 * The languages a document selector names: the language ids it lists, and for an entry with a
 * glob and no language the language the map gives a file the glob names. The server's relay and the
 * page both read a server's languages through it.
 */
export function selectorLanguages(selector: readonly SelectorItem[], map: LanguageMap): string[] {
    const out = new Set<string>();
    for (const item of selector) {
        if (item.language !== '' && item.language !== '*') out.add(item.language);
        else if (item.pattern !== '') {
            const language = patternLanguage(item.pattern, map);
            if (language !== null) out.add(language);
        }
    }
    return [...out];
}
