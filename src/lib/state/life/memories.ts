// Layer 2, client state, pure. What a refused upload and a failed read of the wall read as, and the
// size the page checks a file against before it encodes one.
//
// The endpoint answers one word (`name`, `data`, `taken`, `unwritable`) or a sentence of its own
// for a request it would not read at all, and the page never draws either: DESIGN.md's rule for the
// deck write is that the view shows a sentence of its own per refusal, and this is that map for the
// wall. A word this does not know gets the general sentence.
//
// The limit is data/file-ops.ts's, which the server enforces in server/content/memories.ts and the
// file operations of the Files view enforce for an upload, so the page and the server hold one
// number; tests/state/life/memories-message.test.ts pins the two exports equal.

import { MAX_UPLOAD_BYTES } from '../../data/file-ops.ts';
import { t } from '../shared/words/text.ts';

/** What the upload endpoint answered, as much of it as the sentence depends on. */
export type UploadAnswer = {
    ok: boolean;
    /** The one word the endpoint refused with, absent when it wrote. */
    error?: string;
    /** True when the request never reached the server. */
    network?: boolean;
};

/**
 * The largest picture the wall takes, in bytes, which is what a chosen file's own size is measured
 * in.
 */
export { MAX_UPLOAD_BYTES };

/**
 * The same limit in whole megabytes, which is what the reader is told. The page refuses a larger
 * file before it reads one, so a picture that the server would refuse is never encoded or sent.
 */
export const MAX_UPLOAD_MB = MAX_UPLOAD_BYTES / (1024 * 1024);

/** The sentence one answer reads as, and the empty string for a picture that was written. */
export function uploadMessage(answer: UploadAnswer): string {
    if (answer.ok) return '';
    if (answer.network === true) return t('memories.failed_network');
    if (answer.error === 'name') return t('memories.failed_name');
    if (answer.error === 'data') return t('memories.failed_data', MAX_UPLOAD_MB);
    if (answer.error === 'taken') return t('memories.failed_taken');
    if (answer.error === 'unwritable') return t('memories.failed_file');
    return t('memories.failed_other');
}

/** Whether a chosen file is one the wall would take, by its size alone. */
export function tooLarge(size: number): boolean {
    return size > MAX_UPLOAD_BYTES;
}

/**
 * The sentence a failed read of the wall reads as. The store holds one word for an answer that is
 * not a list of pictures and the request's own reason for everything else, so a word this knows
 * becomes its sentence and anything else is carried into the general one as written.
 */
export function readMessage(error: string): string {
    if (error === '') return '';
    const known: Record<string, string> = {
        images_not_a_list: t('memories.read_not_a_list'),
        image_without_name: t('memories.read_without_name'),
        image_name_repeated: t('memories.read_name_repeated')
    };
    return t('memories.read_failed', known[error] ?? error);
}
