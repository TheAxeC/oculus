// Layer 2, client state. Pure Position Leads status, deadline, fit, ordering, search, and saved
// view state. The view receives ready-to-draw live and expired lists and owns no feed rules.

import { z } from 'zod';
import { scalar } from '../../data/helpers/guards.ts';
import { hubId } from '../../data/helpers/hub-names.ts';
import {
    anyNumberShape,
    mapShape,
    readAs,
    rowsShape,
    searchRevealShape,
    textOrNumberShape
} from '../../data/shapes/shapes.ts';
import {
    appliedWord,
    declinedWord,
    isLeadApplied,
    isLeadClosed,
    isLeadDeclined,
    isLeadOpen,
    openWord
} from '../../data/accounts/leads.ts';
import { vocabKeys } from '../../data/shapes/vocab-keys.ts';
import { feedRoot, uniqueIdents } from '../shared/page/idents.ts';

export type LeadEntry = Record<string, unknown>;
export type LeadsState = {
    search: string;
    expiredOpen: boolean;
    runlogOpen: boolean;
    /** Whether the run log shows every line rather than its first few. */
    logAll: boolean;
    /** Whether the leads the reader declined are shown, so one can be reopened. */
    showDeclined: boolean;
    /** The palette destination, cleared by the view after it scrolls and flashes the card. */
    reveal?: string;
};
export type SplitLeads = { live: LeadEntry[]; expired: LeadEntry[] };

export { localDate } from '../../data/helpers/dates.ts';
export {
    appliedWord,
    declinedWord,
    openWord,
    isLeadApplied as isApplied,
    isLeadClosed as isClosed,
    isLeadDeclined as isDeclined,
    isLeadOpen as isOpen
};

/** The merged config a lead's status and fit are read through. */
type Config = Record<string, unknown>;

const DATE = /\d{4}-\d{2}-\d{2}/;
const TONE = /^c-([a-z][a-z0-9-]*)$/;

/** The vocabulary's two maps a lead's fit colour is read through. */
const fitVocabShape = z.object({ leads_fit: mapShape, palette: mapShape });

/** A colour word or a palette token: a string and nothing else. */
const colorWordShape = z.string();

/** The fields a view instance keeps of the leads, each read as absent when of the wrong type. */
const leadsStateShape = searchRevealShape.extend({
    expiredOpen: z.boolean().catch(false),
    runlogOpen: z.boolean().catch(false),
    logAll: z.boolean().catch(false),
    showDeclined: z.unknown().optional(),
    showDismissed: z.unknown().optional()
});

/** The lines of a run log: the text lines and the numbers, written out. */
const runLogShape = rowsShape(z.union([z.string(), anyNumberShape.transform(String)]));

/** A text of the lead's, or a number written out, and the empty text for anything else. */
function word(entry: LeadEntry, field: string): string {
    return readAs(textOrNumberShape, entry[field]) ?? '';
}

/**
 * A lead card's stable id in the lead view: its posting URL, or its title and institution, reduced
 * to a slug, under the name of the lead's hub (`hubId`), so two hubs' leads of one posting are two
 * cards. It names the card, not the record: a write names the lead by its internal id.
 */
export function leadId(entry: LeadEntry): string {
    const url = word(entry, 'url');
    const source = url.startsWith('http') ? url : `${word(entry, 'title')}-${word(entry, 'inst')}`;
    const slug = source
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-|-$/g, '');
    return slug === '' ? slug : hubId(feedRoot(entry), slug);
}

/**
 * One distinct non-empty id per lead of the feed. A lead whose title, institution and url are all
 * empty, and each of two leads whose fields slug to the same id, carries its position in the feed,
 * so no card is left with an id the cursor skips.
 */
export function leadIdents(entries: readonly LeadEntry[]): (entry: LeadEntry) => string {
    return uniqueIdents(entries, leadId, 'lead');
}

/** Hide the entries the reader declined, or show every entry while the toggle is on. */
export function visibleLeads(config: Config, entries: LeadEntry[], showing: boolean): LeadEntry[] {
    if (showing) return entries;
    return entries.filter((entry) => !isLeadDeclined(config, entry.status));
}

/** How many entries of the feed the reader has declined, which is what the toggle offers. */
export function declinedCount(config: Config, entries: readonly LeadEntry[]): number {
    return entries.filter((entry) => isLeadDeclined(config, entry.status)).length;
}

/** The first ISO date inside deadline prose, or null when it contains none. */
export function deadlineOf(text: unknown): string | null {
    const found = DATE.exec(scalar(text));
    return found === null ? null : found[0];
}

/** A closed lead or one whose ISO deadline precedes today belongs in the expired list. */
export function isExpired(config: Config, lead: LeadEntry, today: string): boolean {
    const deadline = deadlineOf(lead.deadline);
    return isLeadClosed(config, lead.status) || (deadline !== null && deadline < today);
}

/**
 * The first fit word found in the prose, in the order of the hub's `leads_fit` (its
 * `.oculus/config.yml`), each matched in lower case. A hub with no `leads_fit` has no fit words.
 */
export function fitKey(fit: unknown, config: Config): string | null {
    const text = scalar(fit).toLowerCase();
    return vocabKeys(config.leads_fit).find((key) => text.includes(key.toLowerCase())) ?? null;
}

/** Resolve a lead's fit colour through the hub's `leads_fit` and vocab.yml's `palette`. */
export function fitTone(fit: unknown, vocab: unknown): string {
    const config = readAs(fitVocabShape, vocab);
    const key = config === null ? null : fitKey(fit, config);
    if (key === null || config === null) return 'grey';
    const color = readAs(colorWordShape, config.leads_fit[key]);
    if (color === null) return 'grey';
    const token = readAs(colorWordShape, config.palette[color.toLowerCase()]);
    if (token === null) return 'grey';
    return TONE.exec(token)?.[1] ?? 'grey';
}

/** Split and order live leads soonest first, and expired leads newest first, undated last. */
export function splitLeads(config: Config, entries: LeadEntry[], today: string): SplitLeads {
    const live = entries.filter((entry) => !isExpired(config, entry, today));
    const expired = entries.filter((entry) => isExpired(config, entry, today));
    live.sort((left, right) => {
        const a = deadlineOf(left.deadline);
        const b = deadlineOf(right.deadline);
        if (a === null) return b === null ? 0 : 1;
        if (b === null) return -1;
        return a.localeCompare(b);
    });
    expired.sort((left, right) => {
        const a = deadlineOf(left.deadline);
        const b = deadlineOf(right.deadline);
        if (a === null) return b === null ? 0 : 1;
        if (b === null) return -1;
        return b.localeCompare(a);
    });
    return { live, expired };
}

/** Require every typed word across the seven searchable lead fields. */
export function leadsSearch(entries: LeadEntry[], search: string): LeadEntry[] {
    const needles = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (needles.length === 0) return entries;
    const fields = ['title', 'inst', 'country', 'typ', 'focus', 'fit', 'status'];
    return entries.filter((entry) => {
        const text = fields
            .map((field) => word(entry, field))
            .join(' ')
            .toLowerCase();
        return needles.every((needle) => text.includes(needle));
    });
}

/**
 * Read the search, the disclosures and the toggles from one view instance. A saved state holding
 * `showDismissed` in place of `showDeclined` is read as the same toggle.
 */
export function parseLeadsState(raw: unknown): LeadsState {
    const held = readAs(leadsStateShape, raw);
    const showing = held?.showDeclined ?? held?.showDismissed;
    const state: LeadsState = {
        search: held?.search ?? '',
        expiredOpen: held?.expiredOpen ?? false,
        runlogOpen: held?.runlogOpen ?? false,
        logAll: held?.logAll ?? false,
        showDeclined: showing === true
    };
    if (held?.reveal !== undefined) state.reveal = held.reveal;
    return state;
}

/** The run log the leads feed's `meta.log` carries, each line as text, newest first as written. */
export function runLog(meta: Record<string, unknown> | undefined): string[] {
    return readAs(runLogShape, meta?.log) ?? [];
}
