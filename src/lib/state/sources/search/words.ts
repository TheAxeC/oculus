// Layer 2, client state. The sentences a replace says: the question before Replace All, what a
// replace came to, and why one stopped. The question and the result are VS Code's own sentences,
// in their singular and plural forms and with or without the replace text; a refusal is said in
// the catalog's words for the refusal word the server answered.

import type { OpsRefusal } from '../../../data/file-ops.ts';
import { refusalSentence } from '../../shared/answers/answers.ts';
import { t } from '../../shared/words/text.ts';

/** How many occurrences, how many files and the replace text a sentence is about. */
type ReplaceCount = { hits: number; files: number; text: string };

/** The question asked before Replace All. */
export function replaceQuestion(count: ReplaceCount, capped: number | null): string {
    const [hits, files] = [String(count.hits), String(count.files)];
    const one = count.hits === 1;
    const alone = count.files === 1;
    const empty = count.text === '';
    let said: string;
    if (one && alone) {
        said = empty
            ? t('search.replace_ask_1_1_empty', hits, files)
            : t('search.replace_ask_1_1', hits, files, count.text);
    } else if (one) {
        said = empty
            ? t('search.replace_ask_1_n_empty', hits, files)
            : t('search.replace_ask_1_n', hits, files, count.text);
    } else if (alone) {
        said = empty
            ? t('search.replace_ask_n_1_empty', hits, files)
            : t('search.replace_ask_n_1', hits, files, count.text);
    } else {
        said = empty
            ? t('search.replace_ask_n_n_empty', hits, files)
            : t('search.replace_ask_n_n', hits, files, count.text);
    }
    return capped === null ? said : `${said} ${t('search.replace_ask_capped', String(capped))}`;
}

/** What a replace that landed says it did. */
export function replaceDone(count: ReplaceCount): string {
    const [hits, files] = [String(count.hits), String(count.files)];
    const one = count.hits === 1;
    const alone = count.files === 1;
    const empty = count.text === '';
    if (one && alone) {
        return empty
            ? t('search.replace_done_1_1_empty', hits, files)
            : t('search.replace_done_1_1', hits, files, count.text);
    }
    if (one) {
        return empty
            ? t('search.replace_done_1_n_empty', hits, files)
            : t('search.replace_done_1_n', hits, files, count.text);
    }
    if (alone) {
        return empty
            ? t('search.replace_done_n_1_empty', hits, files)
            : t('search.replace_done_n_1', hits, files, count.text);
    }
    return empty
        ? t('search.replace_done_n_n_empty', hits, files)
        : t('search.replace_done_n_n', hits, files, count.text);
}

/**
 * Why a replace was refused, in the catalog's sentence for the refusal word the server answered.
 */
function replaceWhy(error: OpsRefusal | 'network'): string {
    return error === 'network' ? t('files.refused_network') : refusalSentence(error);
}

/** What a replace that stopped says: the file it stopped at, the files done before it, and why. */
export function replaceStopped(
    failed: string,
    done: number,
    error: OpsRefusal | 'network'
): string {
    const why = replaceWhy(error);
    return done === 0
        ? t('search.replace_stopped', failed, why)
        : t('search.replace_stopped_after', String(done), failed, why);
}
