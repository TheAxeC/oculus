// Layer 3, view partial. The sentence a refused comparison of two files reads as in the diff pane:
// the server answers one word of data/file-ops.ts for a side that is outside every root, gone, a
// folder or over the size a comparison reads, and the pane says a sentence of files.yml for it.
//
// A word that is not one of those four is a failure the pane has no sentence for, and it says its
// own general one, so no word reaches the reader as it came.
//
// A Replace Preview is refused with the words of a replace (data/file-ops.ts OPS_REFUSALS), and the
// pane says the sentence the catalog holds for the word, or its general one for any other.
//
// A read of the change a commit made that fails says so with the commit's short form as git prints
// it, the one the pane's title shows, and none of git's words.

import { refusalSentence, refusalWord } from '$lib/state/shared/answers/answers';

/** The sentence a refused comparison reads as, or the pane's own failure sentence for any other. */
function compareSentence(word: unknown, t: (key: string) => string): string {
    switch (word) {
        case 'outside':
            return t('files.compare_outside');
        case 'missing':
            return t('files.compare_missing');
        case 'not_a_folder':
            return t('files.compare_not_a_file');
        case 'too_large':
            return t('files.compare_too_large');
        default:
            return t('repositories.diff_failed');
    }
}

/** The sentence a refused Replace Preview reads as, or the pane's own failure sentence. */
function previewSentence(word: unknown, t: (key: string) => string): string {
    const known = refusalWord(word);
    return known === null ? t('repositories.diff_failed') : refusalSentence(known, t);
}

/**
 * The sentence a failed read of a diff pane is told in: the preview's for a Replace Preview, the
 * comparison's for a comparison of two files or of a file with a copy, the commit's for the change
 * a commit made when the pane carries git's short form of the commit (naming it, with none of git's
 * words), else the server's own text.
 */
export function failureSentence(
    subject: {
        replace?: unknown;
        against?: unknown;
        save?: string;
        commit?: string;
        short?: string;
    },
    error: string | undefined,
    t: (key: string, ...args: string[]) => string
): string {
    if (subject.replace !== undefined) return previewSentence(error, t);
    if (subject.against !== undefined || (subject.save ?? '') !== '') {
        return compareSentence(error, t);
    }
    if ((subject.commit ?? '') !== '' && (subject.short ?? '') !== '') {
        return t('repositories.diff_commit_failed', subject.short ?? '');
    }
    return error ?? t('repositories.diff_failed');
}
