// Layer 1, data, pure. Which status words take a position lead off the radar, which of them say the
// reader declined it, which are the leads the view's toggle holds back, and which word each of the
// lead's controls writes. Every answer is a flag of the word in `statuses` of
// config/catalogs/vocab.yml: `lead_closed`, `lead_declined`, `lead_applied` and `default_lead`.
//
// The rule lives here rather than beside the view because readers on both sides need the same
// answer: the Position Leads view, its badge and the ticker the Focus board draws its dated
// lines from, on the client, and the summary the snapshot carries, on the server. A copy of the
// rule beside each would let them disagree, and a disagreement means a lead the reader declined
// still counts on the board.
//
// Nothing here knows what a lead looks like. It answers over a status value and the merged config;
// the ordering, the fit tone and the drawing are state/feeds/leads.ts's and the view's.

import { wordFlag, wordsWith } from '../shapes/vocab-keys.ts';
import { scalar } from '../helpers/guards.ts';

/** The merged config a lead's status is read through. */
type Config = Record<string, unknown>;

/** Whether a lead's status carries a flag, read trimmed and in lower case. */
function leadFlag(config: Config, status: unknown, flag: string): boolean {
    return wordFlag(config, 'statuses', scalar(status), flag);
}

/** The first word of `statuses` carrying a flag, the word a control writes, or the empty text. */
function wordOf(config: Config, flag: string): string {
    return wordsWith(config, 'statuses', flag).at(0) ?? '';
}

/** The status a new lead gets and a reopened one goes back to: the word carrying `default_lead`. */
export function openWord(config: Config): string {
    return wordOf(config, 'default_lead');
}

/** The status the apply control writes: the first word carrying `lead_applied`. */
export function appliedWord(config: Config): string {
    return wordOf(config, 'lead_applied');
}

/** The status the decline control writes: the first word carrying `lead_declined`. */
export function declinedWord(config: Config): string {
    return wordOf(config, 'lead_declined');
}

/** Whether a status takes a lead out of the live list: a word carrying `lead_closed`. */
export function isLeadClosed(config: Config, status: unknown): boolean {
    return leadFlag(config, status, 'lead_closed');
}

/** Whether the reader declined this lead: a word carrying `lead_declined`. */
export function isLeadDeclined(config: Config, status: unknown): boolean {
    return leadFlag(config, status, 'lead_declined');
}

/** Whether the reader applied to this lead: a word carrying `lead_applied`. */
export function isLeadApplied(config: Config, status: unknown): boolean {
    return leadFlag(config, status, 'lead_applied');
}

/** Whether the lead is on the radar, which is the one status the decline control may overwrite. */
export function isLeadOpen(config: Config, status: unknown): boolean {
    return leadFlag(config, status, 'default_lead');
}
