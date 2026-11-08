// Layer 2, client state. The sentences a replace says: the question before Replace All, what a
// replace came to, and why one stopped. The question and the result are VS Code's own sentences,
// with or without the replace text; a refusal is said in the catalog's words for the refusal word
// the server answered.
//
// A sentence about two counts (the hits and the files) is one sentence with a slot for each, and
// each slot is filled with the words of its own plural key in the form of its own count (`plural`),
// so "1 hit in 3 files" and "4 hits in 1 file" are both said by the one sentence.

import type { OpsRefusal } from '../../../data/file-ops.ts';
import { refusalSentence } from '../../shared/answers/answers.ts';
import { plural, t } from '../../shared/words/text.ts';

/** How many occurrences, how many files and the replace text a sentence is about. */
type ReplaceCount = { hits: number; files: number; text: string };

/** The words of a count of files, as each two-count sentence of the Search view says it. */
function filesWords(files: number): string {
    return plural('search.files', files, files);
}

/** The words of a count of occurrences, as the replace question and its result say it. */
function occurrenceWords(hits: number): string {
    return plural('search.occurrences', hits, hits);
}

/**
 * The count line over a search's results: how many hits in how many files and how long the search
 * took, as hits that would be replaced while a replace text is typed. Each count is said in the
 * form of its own number.
 */
export function countLine(hits: number, files: number, ms: number, replacing: boolean): string {
    const said = [plural('search.hits', hits, hits), filesWords(files), String(ms)];
    return replacing ? t('search.count_replacing', ...said) : t('search.count', ...said);
}

/** The question asked before Replace All. */
export function replaceQuestion(count: ReplaceCount, capped: number | null): string {
    const [hits, files] = [occurrenceWords(count.hits), filesWords(count.files)];
    const said =
        count.text === ''
            ? t('search.replace_ask_empty', hits, files)
            : t('search.replace_ask', hits, files, count.text);
    return capped === null ? said : `${said} ${t('search.replace_ask_capped', String(capped))}`;
}

/** What a replace that landed says it did. */
export function replaceDone(count: ReplaceCount): string {
    const [hits, files] = [occurrenceWords(count.hits), filesWords(count.files)];
    return count.text === ''
        ? t('search.replace_done_empty', hits, files)
        : t('search.replace_done', hits, files, count.text);
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
