// Layer 2, client state. Pure Position Leads status, deadline, fit, ordering, search, and saved
// view state. The view receives ready-to-draw live and expired lists and owns no feed rules.

export type LeadEntry = Record<string, unknown>;
export type FitKey = 'strong' | 'moderate' | 'reach';
export type LeadsState = {
    search: string;
    expiredOpen: boolean;
    runlogOpen: boolean;
    /** Whether the add form is open, kept with the instance so a re-render does not close it. */
    adding: boolean;
};
export type SplitLeads = { live: LeadEntry[]; expired: LeadEntry[] };

export { localDate } from '../data/dates.ts';

const CLOSED = ['applied', 'declined', 'closed'];
const FITS: FitKey[] = ['strong', 'moderate', 'reach'];
const DATE = /\d{4}-\d{2}-\d{2}/;
const TONE = /^c-([a-z][a-z0-9-]*)$/;

function record(value: unknown): Record<string, unknown> | null {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : null;
}

function word(entry: LeadEntry, field: string): string {
    const value = entry[field];
    return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

/** Applied, declined, and closed statuses take a lead out of the live list. */
export function isClosed(status: unknown): boolean {
    return CLOSED.includes(
        String(status ?? '')
            .trim()
            .toLowerCase()
    );
}

/** The first ISO date inside deadline prose, or null when it contains none. */
export function deadlineOf(text: unknown): string | null {
    const found = DATE.exec(String(text ?? ''));
    return found === null ? null : found[0];
}

/** A closed lead or one whose ISO deadline precedes today belongs in the expired list. */
export function isExpired(lead: LeadEntry, today: string): boolean {
    const deadline = deadlineOf(lead.deadline);
    return isClosed(lead.status) || (deadline !== null && deadline < today);
}

/** The first fit vocabulary word found in the prose, in vocabulary priority order. */
export function fitKey(fit: unknown): FitKey | null {
    const text = String(fit ?? '').toLowerCase();
    return FITS.find((key) => text.includes(key)) ?? null;
}

/** Resolve a lead's fit colour through `leads_fit` and `palette` from vocab.yml. */
export function fitTone(fit: unknown, vocab: unknown): string {
    const key = fitKey(fit);
    const config = record(vocab);
    const colors = record(config?.leads_fit);
    const palette = record(config?.palette);
    if (key === null || colors === null || palette === null) return 'grey';
    const color = colors[key];
    if (typeof color !== 'string') return 'grey';
    const token = palette[color.toLowerCase()];
    if (typeof token !== 'string') return 'grey';
    return TONE.exec(token)?.[1] ?? 'grey';
}

/** Split and order live leads soonest first, and expired leads newest first, undated last. */
export function splitLeads(entries: LeadEntry[], today: string): SplitLeads {
    const live = entries.filter((entry) => !isExpired(entry, today));
    const expired = entries.filter((entry) => isExpired(entry, today));
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

/** Read the search and the two disclosure states from one view instance. */
export function parseLeadsState(raw: unknown): LeadsState {
    const held = record(raw);
    return {
        search: typeof held?.search === 'string' ? held.search : '',
        expiredOpen: held?.expiredOpen === true,
        runlogOpen: held?.runlogOpen === true,
        adding: held?.adding === true
    };
}
