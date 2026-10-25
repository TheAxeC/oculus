// Layer 1, data. The display language of the merged config: the workspace's `locale` (an option of
// config/defaults/appearance.yml, `en` shipped) chooses a language an approved, enabled app
// contributes by its `localizations` point, and its words are laid over oculus's English catalog,
// key by key, under the words the workspace's own `settings: { text: }` set (workspace-layer.ts).
// A key the language lacks keeps oculus's English word, so the catalog always holds every key.
//
// The files of a language are YAML files nested as config/text/ is, under one top-level `text:`,
// and flattened the same way (text.ts). The server finds them (server/machine/apps/routes/,
// `languageSource`) and hands loadConfig the source; this module reads no disk. The lookup is
// written here by hand with oculus's own positional placeholders, so a translated word keeps
// `{0}` where oculus's has it.
//
// A `locale` no source gives (no approved, enabled app contributes it) is a finding naming the file
// `locale` was read from and its key there (`settings.locale` for the workspace file's), and the
// English catalog stands. A key of a language file that oculus's catalog lacks is a finding naming
// the file, the key, the language and the app, and the key is not used; a file that does not parse
// or holds no `text:` map is a finding naming the file, and its words are not used.

import { parse } from 'yaml';
import { findingText } from '../../../helpers/finding-text.ts';
import { isMap } from '../../../helpers/guards.ts';
import { flattenText, TEXT_KEY, type PendingFinding } from './text.ts';

/** The key of the merged config that names the display language. */
const LOCALE_KEY = 'locale';

/** The display language that is oculus's own catalog, with nothing laid over it. */
const ENGLISH = 'en';

/** One file of a display language: its path and its text, or why it could not be read. */
export type LanguageFile = { file: string; text: string } | { file: string; why: string };

/** A display language an app contributes: the app's title, and its files of oculus's words. */
export type Language = { app: string; files: LanguageFile[] };

/**
 * Where loadConfig finds the display language a `locale` names: null for one no approved, enabled
 * app contributes.
 */
export type LanguageSource = (locale: string) => Language | null;

/** Where a finding about the key `locale` is placed: its file and its key there. */
type Place = (key: string) => { file: string; key: string };

/**
 * The words of one language file, by dotted key; or the parser's reason it gives none, or null for
 * a file that parses and holds no `text:` map.
 */
function fileWords(text: string): Record<string, string> | string | null {
    let parsed: unknown;
    try {
        parsed = parse(text);
    } catch (error) {
        return error instanceof Error ? error.message : String(error);
    }
    if (!isMap(parsed) || !isMap(parsed[TEXT_KEY])) return null;
    try {
        return flattenText(parsed[TEXT_KEY]);
    } catch (error) {
        return error instanceof Error ? error.message : String(error);
    }
}

/**
 * Lay the display language `config.locale` names over the merged text catalog: each key of its
 * files that oculus's catalog holds and the workspace did not set takes the language's word, and
 * `from` names the language's file for it. `own` says whether the workspace set a text key (its
 * words win over the language), and `place` where a finding about `locale` is put.
 */
export function layLanguage(
    config: Record<string, unknown>,
    from: Record<string, string>,
    pending: PendingFinding[],
    source: LanguageSource | undefined,
    place: Place,
    own: (key: string) => boolean
): void {
    const locale = typeof config[LOCALE_KEY] === 'string' ? config[LOCALE_KEY] : ENGLISH;
    if (locale === ENGLISH) return;
    const language = source?.(locale) ?? null;
    if (language === null) {
        const at = place(LOCALE_KEY);
        pending.push({
            ...at,
            words: (catalog) =>
                findingText(catalog, 'findings.config.locale_unknown', at.key, locale)
        });
        return;
    }
    const catalog = isMap(config[TEXT_KEY]) ? config[TEXT_KEY] : {};
    for (const one of language.files) {
        const file = one.file;
        const words = 'why' in one ? one.why : fileWords(one.text);
        if (words === null || typeof words === 'string') {
            pending.push({
                file,
                key: TEXT_KEY,
                words: (said) =>
                    words === null
                        ? findingText(
                              said,
                              'findings.apps.localization_no_text',
                              locale,
                              language.app
                          )
                        : findingText(
                              said,
                              'findings.apps.localization_unread',
                              locale,
                              language.app,
                              words
                          )
            });
            continue;
        }
        for (const [key, word] of Object.entries(words)) {
            const dotted = `${TEXT_KEY}.${key}`;
            if (!Object.hasOwn(catalog, key)) {
                pending.push({
                    file,
                    key: dotted,
                    words: (said) =>
                        findingText(
                            said,
                            'findings.apps.localization_key',
                            dotted,
                            locale,
                            language.app
                        )
                });
            } else if (!own(key)) {
                catalog[key] = word;
                from[dotted] = file;
            }
        }
    }
}
