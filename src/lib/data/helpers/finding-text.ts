// Layer 1, data. The words a finding is written in, read out of the text catalog by key. Pure, so
// the readers under sources/, the rules of validate.ts and the audit scan of
// server/content/audit/scan.ts call it alike, and client-safe, because state/shared/words/text.ts's
// t() fills a catalog string with the same fillPlaceholders rather than a copy of it. `words` of
// server/machine/pty/start/chat.ts fills the terminal text (the chat instruction, its notes, the
// chat and LaTeX terminal names) with it too.
//
// A finding's sentence is config/text/findings.yml's, never a literal of the module that raises it,
// so a sentence is reworded in that file alone. The catalog is always an argument: nothing here
// holds one, and the server formats every finding before it goes on the wire as a plain `message`.
//
// The pick between the forms of a word that changes with a count is here too, and nowhere else: a
// plural key of config/text/ is a map of CLDR forms, and `pluralText` picks the form a count takes
// in the catalog's language by `Intl.PluralRules`. The page's `plural`
// (state/shared/words/text.ts), the server's `pluralWords` (server/core/words.ts) and
// `pluralFindingText`, which the audit's counted sentences are worded with, all read through it.

import { byKey } from './guards.ts';

/**
 * The flat text catalog, dotted key to sentence, as textCatalog() in sources/config.ts gives it.
 */
export type TextCatalog = Record<string, string>;

/**
 * A template with `{0}`, `{1}` and so on replaced by the arguments at those positions. A
 * placeholder with no argument is left as it is written, so a sentence missing an argument shows
 * the gap rather than an empty word.
 */
export function fillPlaceholders(template: string, args: readonly (string | number)[]): string {
    return template.replace(/\{(\d+)\}/g, (placeholder, index: string) => {
        const arg = args.at(Number(index));
        return arg === undefined ? placeholder : String(arg);
    });
}

/**
 * The six CLDR plural forms. A plural key of config/text/ is a map of some of them, `other` always
 * among them, which the catalog holds flattened as `<key>.<form>`; a row of `categories:` writes
 * its `label` the same way.
 */
export const PLURAL_FORMS = ['zero', 'one', 'two', 'few', 'many', 'other'] as const;

/** One of the six CLDR plural forms. */
export type PluralForm = (typeof PLURAL_FORMS)[number];

/**
 * The entry of the flat catalog that names the language its words are in, set by the display
 * language laid over the catalog (sources/config/merge/language.ts) and absent for oculus's own
 * English. No key of config/text/ is one word, so it is never a word of the interface; every
 * reader of the catalog picks a plural form by it, the server's and the page's alike, with no
 * locale handed round beside the catalog.
 */
export const LOCALE_ENTRY = 'locale';

/** The language whose plural rules a locale `Intl.PluralRules` refuses is read by. */
const ENGLISH = 'en';

/**
 * The CLDR form `count` takes in `locale`, by `Intl.PluralRules`; a locale it refuses, such as
 * `en_US` or the empty text, is read by the English rules, so a count is always said.
 */
function pluralForm(locale: string, count: number): PluralForm {
    let rules: Intl.PluralRules;
    try {
        rules = new Intl.PluralRules(locale);
    } catch {
        rules = new Intl.PluralRules(ENGLISH);
    }
    return rules.select(count);
}

/**
 * The words `count` takes among the forms `form` gives: the form of its CLDR category in `locale`,
 * else `other` where the words give none for that category, and nothing where they give no `other`.
 */
export function pluralPick(
    form: (name: PluralForm) => string | undefined,
    locale: string,
    count: number
): string | undefined {
    return form(pluralForm(locale, count)) ?? form('other');
}

/**
 * The language a catalog's words are in, whose rules pick a count's plural form: the catalog's
 * `LOCALE_ENTRY`, English when it names none. `pluralText` and the page's `pluralOf`
 * (state/shared/words/text.ts) read it alike.
 */
export function catalogLocale(catalog: Readonly<Record<string, string | undefined>>): string {
    return byKey(catalog, LOCALE_ENTRY) ?? ENGLISH;
}

/**
 * The words of the plural key `key` for `count`, with `args` in its placeholders: the catalog's
 * `<key>.<form>` for the form the count takes in the catalog's language (`catalogLocale`), else
 * `<key>.other`. Nothing when the catalog holds no form of the key. It is the one pick between a
 * singular and a plural: the page's `plural`, the server's `pluralWords` and `pluralFindingText`
 * read through it.
 */
export function pluralText(
    catalog: TextCatalog,
    key: string,
    count: number,
    ...args: (string | number)[]
): string | undefined {
    const locale = catalogLocale(catalog);
    const template = pluralPick((form) => byKey(catalog, `${key}.${form}`), locale, count);
    return template === undefined ? undefined : fillPlaceholders(template, args);
}

/**
 * The finding sentence of the plural key `key` for `count`, as `pluralText` picks it, or the key
 * followed by its arguments when the catalog holds no form of it; it never throws, as `findingText`
 * does not.
 */
export function pluralFindingText(
    catalog: TextCatalog,
    key: string,
    count: number,
    ...args: (string | number)[]
): string {
    return pluralText(catalog, key, count, ...args) ?? [key, ...args.map(String)].join(' ');
}

/**
 * Whether `key` is a plural form of a plural key `held` holds: its last segment one of the six
 * forms and the key before it holding an `other` form. A display language and a workspace's
 * `text:` may give such a form whether or not oculus's English words give it.
 */
export function isPluralForm(key: string, held: (key: string) => boolean): boolean {
    const at = key.lastIndexOf('.');
    if (at < 0) return false;
    return isFormName(key.slice(at + 1)) && held(`${key.slice(0, at)}.other`);
}

/**
 * Whether a map of config/text/ is a plural key: a map of texts alone that gives any of the forms
 * `zero`, `one`, `two`, `few` and `many`. A map that gives `other` alone is a group of words with a
 * key named `other` (`views.sources.file.other`), never a plural key.
 */
export function isPluralMap(node: Record<string, unknown>): boolean {
    const entries = Object.entries(node);
    return (
        entries.every(([, value]) => typeof value !== 'object' || value === null) &&
        entries.some(([form]) => form !== 'other' && isFormName(form))
    );
}

/** Whether a key is the name of one of the six CLDR plural forms. */
function isFormName(key: string): boolean {
    return (PLURAL_FORMS as readonly string[]).includes(key);
}

/**
 * What is wrong with a map of plural forms: whether it lacks the `other` form every such map holds,
 * and the keys it gives that are none of the six forms.
 */
export function pluralIssues(forms: Record<string, unknown>): {
    noOther: boolean;
    outside: string[];
} {
    return {
        noOther: !Object.hasOwn(forms, 'other'),
        outside: Object.keys(forms).filter((form) => !isFormName(form))
    };
}

/**
 * The sentence for a finding key, with its arguments in place, or the key followed by its arguments
 * when the catalog lacks the key. It never throws: a finding is reported while the files it is
 * about are broken, config/text/findings.yml among them, and a sentence file that does not parse
 * must not cost the portfolio, a document read or a write. A key misspelt in the code is caught by
 * tests/checks/source/keys.test.ts, which holds every `findings.` literal of the source to the file
 * and every `findingText` key that is not such a literal to a documented rule.
 */
export function findingText(
    catalog: TextCatalog,
    key: string,
    ...args: (string | number)[]
): string {
    const template = byKey(catalog, key);
    if (template === undefined) return [key, ...args.map(String)].join(' ');
    return fillPlaceholders(template, args);
}
