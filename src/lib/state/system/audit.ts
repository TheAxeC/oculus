// Layer 2, client state, pure. What a refused mute reads as, the findings a search keeps and a
// section of the view holds, and the card id of each row.
//
// The endpoint answers one word (`invalid`, `unwritable`) and the page never draws it: the view
// shows a sentence of its own for each, and this is the map from word to sentence for the audit's
// mute. A word this does not know gets the general sentence, so a refusal the endpoint grows later
// reads as a refusal rather than as a word out of the wire.

import type { AuditFinding } from '../../data/model/index.ts';
import { t } from '../shared/words/text.ts';

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

/** The findings a search keeps: every one whose scope, place or message holds it, case aside. */
export function auditSearch(findings: AuditFinding[], search: string): AuditFinding[] {
    const wanted = search.trim().toLowerCase();
    if (wanted === '') return findings;
    return findings.filter((finding) =>
        `${finding.scope} ${finding.where} ${finding.message}`.toLowerCase().includes(wanted)
    );
}

/** The findings of one kind, in the order the scan reported them. */
export function findingsOfKind(findings: AuditFinding[], kind: string): AuditFinding[] {
    return findings.filter((finding) => finding.kind === kind);
}

/**
 * The card id of each finding of a list, in the list's order: the signature for the first finding
 * that has it and `<signature>:<n>` for the n-th (from 2). Two findings of one signature are two
 * rows, and the keyboard's cursor and the arrow keys name a row, so each row needs an id of its
 * own; the mute control sends the signature, which is what the mute list holds.
 */
export function cardIds(findings: readonly Pick<AuditFinding, 'signature'>[]): string[] {
    const seen = new Map<string, number>();
    return findings.map(({ signature }) => {
        const count = (seen.get(signature) ?? 0) + 1;
        seen.set(signature, count);
        return count === 1 ? signature : `${signature}:${String(count)}`;
    });
}
