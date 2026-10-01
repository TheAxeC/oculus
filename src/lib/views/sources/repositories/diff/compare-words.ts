// Layer 3, view partial. The sentence a refused comparison of two files reads as in the diff pane:
// the server answers one word of data/file-ops.ts for a side that is outside every root, gone, a
// folder or over the size a comparison reads, and the pane says a sentence of files.yml for it.
//
// A word that is not one of those four is a failure the pane has no sentence for, and it says its
// own general one, so no word reaches the reader as it came.

/** The sentence a refused comparison reads as, or the pane's own failure sentence for any other. */
export function compareSentence(word: unknown, t: (key: string) => string): string {
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
