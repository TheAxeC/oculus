// Layer 2, client state, pure. What a refused mute reads as.
//
// The endpoint answers one word (`invalid`, `unwritable`) and the page never draws it: DESIGN.md's
// rule for the deck write is that the view shows a sentence of its own for each, and this is that
// map for the audit's mute. A word this does not know gets the general sentence, so a refusal the
// endpoint grows later reads as a refusal rather than as a word out of the wire.

import { t } from './text.ts';

/** What the write endpoint answered, as much of it as the sentence depends on. */
export type MuteAnswer = {
    ok: boolean;
    /** The one word the endpoint refused with, absent when it wrote. */
    error?: string;
    /** True when the request never reached the server. */
    network?: boolean;
};

/** The sentence one answer reads as, and the empty string for a mute that was written. */
export function muteMessage(answer: MuteAnswer): string {
    if (answer.ok) return '';
    if (answer.network === true) return t('audit.failed_network');
    if (answer.error === 'invalid') return t('audit.failed_invalid');
    if (answer.error === 'unwritable') return t('audit.failed_file');
    return t('audit.failed_other');
}
