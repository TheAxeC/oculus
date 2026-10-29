// Layer 2, client state. The lines the Settings view says under the `editor.languages` row about
// where a language's values can also come from: a workspace folder's `.oculus/settings.yml`
// overrides the row per language, so the row says which folders set a language, which folder has
// no file that reads as text, which folder's file does not parse and why, and which entries of a
// read file were skipped. An empty file and a file that sets no language say nothing. The texts
// come with the folder list (`settings` of each folder), so nothing here asks the server.
//
// Each sentence is one catalog entry. It is cut at the root's place in it into `lead`, `label` and
// `tail`, so the view draws the root as a link inside the sentence.

import { REPO_SETTINGS } from '../../../../data/helpers/editor/editor.ts';
import type { RepoProblem, RepoSettings } from '../../../../data/sources/config/editor-options.ts';
import { t } from '../../../shared/words/text.ts';
import type { FsRoot } from '../../../sources/explorer/view/place.ts';

/** What one line says: a root's languages, no file read, a file not read, or an entry skipped. */
export type Origin = {
    kind: 'also' | 'none' | 'unread' | 'skipped';
    /** The root the line is about, which the label opens the settings file of. */
    root: string;
    /** The words before, the name of, and the words after the root in the sentence. */
    lead: string;
    label: string;
    tail: string;
};

/** Stands in for the root while the sentence is filled, and is where the sentence is cut. */
const ROOT = '\u0001';

/** A catalog sentence cut at the root. */
function cutAtRoot(root: string, filled: string): Pick<Origin, 'lead' | 'label' | 'tail'> {
    const at = filled.indexOf(ROOT);
    return { lead: filled.slice(0, at), label: root, tail: filled.slice(at + ROOT.length) };
}

/** The words for why an entry was skipped: a value outside what the field takes, or a name. */
function skippedReason(where: RepoProblem['where']): string {
    switch (where) {
        case 'unknown-key':
            return t('workbench.settings_origin_key');
        case 'value':
        case 'entry':
        case 'field':
        case 'block':
        case 'family':
        case 'this-mac':
        case 'row':
            return t('workbench.settings_origin_value');
        case 'unknown-language':
            return t('workbench.settings_origin_language');
        case 'unknown-field':
            return t('workbench.settings_origin_field');
        case 'not-a-map':
            return t('workbench.settings_origin_map');
        case 'repeat':
            return t('workbench.settings_origin_repeat');
        case 'unnamed':
            return t('workbench.settings_origin_unnamed');
    }
}

/** The dotted key of a skipped entry as the file spells it, below the `languages` map. */
function entryName(problem: RepoProblem): string {
    return problem.key.replace(/^languages\./, '');
}

/** The lines about one root, none for a root with nothing to say. */
function originsOf(
    root: string,
    text: string | null,
    parse: (text: string) => RepoSettings
): Origin[] {
    if (text === null) {
        const none = t('workbench.settings_origin_none', ROOT, REPO_SETTINGS);
        return [{ kind: 'none', root, ...cutAtRoot(root, none) }];
    }
    const unread = (reason: string): Origin[] => [
        {
            kind: 'unread',
            root,
            ...cutAtRoot(root, t('workbench.settings_origin_unread', ROOT, REPO_SETTINGS, reason))
        }
    ];
    const parsed = parse(text);
    if (parsed.kind === 'unparsed') return unread(parsed.line);
    if (parsed.kind === 'not-a-map') return unread(t('workbench.settings_origin_not_a_map'));
    const names = Object.keys(parsed.languages).sort();
    const lines: Origin[] = [];
    if (names.length > 0) {
        lines.push({
            kind: 'also',
            root,
            ...cutAtRoot(root, t('workbench.settings_origin_also', ROOT, names.join(', ')))
        });
    }
    for (const problem of parsed.skipped) {
        lines.push({
            kind: 'skipped',
            root,
            ...cutAtRoot(
                root,
                t(
                    'workbench.settings_origin_skipped',
                    ROOT,
                    entryName(problem),
                    skippedReason(problem.where)
                )
            )
        });
    }
    return lines;
}

/**
 * The lines under the `editor.languages` row: for each folder once, in the order given, what its
 * settings file sets or why it was not read. `parse` reads a file's text by the rule of the catalog
 * the page holds (`repoSettings` of the selectors).
 */
export function repoOrigins(
    folders: readonly Pick<FsRoot, 'key' | 'settings'>[],
    parse: (text: string) => RepoSettings
): Origin[] {
    const seen = new Set<string>();
    return folders.flatMap((one) => {
        if (seen.has(one.key)) return [];
        seen.add(one.key);
        return originsOf(one.key, one.settings ?? null, parse);
    });
}
