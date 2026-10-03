// Layer 2, client state. The lines the Settings view says under the `editor.languages` row about
// where a language's values can also come from: a served root's `.oculus/settings.yml` overrides
// the row per language, so the row says which roots set a language, which root's file was not read
// and why, and which entries of a read file were skipped. A root with no file, a file still being
// read, an empty file and a file that sets no language say nothing.
//
// Each sentence is one catalog entry. It is cut at the root's place in it into `lead`, `label` and
// `tail`, so the view draws the root as a link inside the sentence.

import {
    parseRepoSettings,
    REPO_SETTINGS,
    type EditorProblem,
    type ProblemReason
} from '../../../../data/helpers/editor.ts';
import { refusedAnswer } from '../../../shared/answers/answers.ts';
import { t } from '../../../shared/words/text.ts';
import type { FileText } from '../../../sources/fs-transport.ts';

/** What one line says: a root's languages, a file not read, or an entry skipped. */
export type Origin = {
    kind: 'also' | 'unread' | 'skipped';
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

/** The words for why an entry was skipped. */
function skippedReason(reason: ProblemReason): string {
    switch (reason) {
        case 'value':
            return t('workbench.settings_origin_value');
        case 'unknown-language':
            return t('workbench.settings_origin_language');
        case 'unknown-field':
            return t('workbench.settings_origin_field');
        case 'not-a-map':
            return t('workbench.settings_origin_map');
    }
}

/** The dotted key of a skipped entry as the file spells it, below the `languages` map. */
function entryName(problem: EditorProblem): string {
    return problem.key.replace(/^languages\./, '');
}

/** The lines about one root, none for a root with nothing to say. */
function originsOf(root: string, file: FileText): Origin[] {
    if (file.loading) return [];
    const unread = (reason: string): Origin[] => [
        {
            kind: 'unread',
            root,
            ...cutAtRoot(root, t('workbench.settings_origin_unread', ROOT, REPO_SETTINGS, reason))
        }
    ];
    if (file.error !== '') {
        // A file that is not there is a root that sets nothing; any other failure is said.
        return file.error === refusedAnswer(404) ? [] : unread(file.error);
    }
    if (file.truncated) return unread(t('workbench.settings_origin_cut'));
    const parsed = parseRepoSettings(file.text);
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
                    skippedReason(problem.reason)
                )
            )
        });
    }
    return lines;
}

/**
 * The lines under the `editor.languages` row: for each root once, in the order given, what its
 * settings file sets or why it was not read. `fileText` is the file store's read.
 */
export function repoOrigins(
    roots: { key: string }[],
    fileText: (root: string, path: string) => FileText
): Origin[] {
    const keys = [...new Set(roots.map((one) => one.key))];
    return keys.flatMap((key) => originsOf(key, fileText(key, REPO_SETTINGS)));
}
