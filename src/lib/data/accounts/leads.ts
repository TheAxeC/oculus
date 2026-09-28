// Layer 1, data, pure. Which status words take a position lead off the radar, and which of them say
// the reader declined it, which are the leads the view's toggle holds back.
//
// The rule lives here rather than beside the view because readers on both sides need the same
// answer: the Position Leads view, its badge and the ticker the Focus board draws its dated
// lines from, on the client, and the summary the snapshot carries, on the server. A copy of the
// list beside each would let them disagree, and a disagreement means a lead the reader declined
// still counts on the board.
//
// Nothing here knows what a lead looks like. It answers over a status value; the ordering, the fit
// tone and the drawing are state/feeds/leads.ts's and the view's.

import { scalar } from '../helpers/guards.ts';

/** The status a lead on the radar carries, which is what a reopened one goes back to. */
export const OPEN = 'open' as const;

/** The status of a lead applied to. */
export const APPLIED = 'applied' as const;

/** The status of a lead turned down or withdrawn from. */
export const DECLINED = 'declined' as const;

/**
 * The status a file may still hold for a lead taken off the radar without applying to it. No
 * control writes it; it reads as a declined lead does.
 */
export const DISMISSED = 'dismissed' as const;

/** The statuses that take a lead out of the live list: an outcome, a withdrawal, or a dismissal. */
export const LEAD_CLOSED = [APPLIED, DECLINED, 'closed', DISMISSED] as const;

/** The status word of an entry, with its surrounding space and its case taken off. */
function statusWord(status: unknown): string {
    return scalar(status).trim().toLowerCase();
}

/** Applied, declined, closed, and dismissed statuses take a lead out of the live list. */
export function isLeadClosed(status: unknown): boolean {
    const word = statusWord(status);
    return LEAD_CLOSED.some((closed) => closed === word);
}

/** Whether the reader declined this lead, under either word a file holds for that. */
export function isLeadDeclined(status: unknown): boolean {
    const word = statusWord(status);
    return word === DECLINED || word === DISMISSED;
}

/** Whether the lead is on the radar, which is the one status the decline control may overwrite. */
export function isLeadOpen(status: unknown): boolean {
    return statusWord(status) === OPEN;
}
