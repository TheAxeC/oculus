// Layer 2, client state. Pure Position Leads status, deadline, fit, ordering, search, and saved
// view state. The view receives ready-to-draw live and expired lists and owns no feed rules.

import { scalar } from '../../data/helpers/guards.ts';
import {
    APPLIED,
    DECLINED,
    OPEN,
    isLeadClosed,
    isLeadDeclined,
    isLeadOpen
} from '../../data/accounts/leads.ts';
import { uniqueIdents } from './idents.ts';

export type LeadEntry = Record<string, unknown>;
export type FitKey = 'strong' | 'moderate' | 'reach';
export type LeadsState = {
    search: string;
    expiredOpen: boolean;
    runlogOpen: boolean;
    /** Whether the run log shows every line rather than its first few. */
    logAll: boolean;
    /** Whether the add form is open, kept with the instance so a re-render does not close it. */
    adding: boolean;
    /** Whether the leads the reader declined are shown, so one can be reopened. */
    showDeclined: boolean;
    /** The palette destination, cleared by the view after it scrolls and flashes the card. */
    reveal?: string;
};
export type SplitLeads = { live: LeadEntry[]; expired: LeadEntry[] };

export { localDate } from '../../data/helpers/dates.ts';
export {
    APPLIED,
    DECLINED,
    OPEN,
    isLeadClosed as isClosed,
    isLeadDeclined as isDeclined,
    isLeadOpen as isOpen
};

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

/** A lead's stable id: its posting URL, or its title and institution, reduced to a slug. */
export function leadId(entry: LeadEntry): string {
    const url = word(entry, 'url');
    const source = url.startsWith('http') ? url : `${word(entry, 'title')}-${word(entry, 'inst')}`;
    return source
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-|-$/g, '');
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
export function visibleLeads(entries: LeadEntry[], showing: boolean): LeadEntry[] {
    if (showing) return entries;
    return entries.filter((entry) => !isLeadDeclined(entry.status));
}

/** How many entries of the feed the reader has declined, which is what the toggle offers. */
export function declinedCount(entries: readonly LeadEntry[]): number {
    return entries.filter((entry) => isLeadDeclined(entry.status)).length;
}

/** The first ISO date inside deadline prose, or null when it contains none. */
export function deadlineOf(text: unknown): string | null {
    const found = DATE.exec(scalar(text));
    return found === null ? null : found[0];
}

/** A closed lead or one whose ISO deadline precedes today belongs in the expired list. */
export function isExpired(lead: LeadEntry, today: string): boolean {
    const deadline = deadlineOf(lead.deadline);
    return isLeadClosed(lead.status) || (deadline !== null && deadline < today);
}

/** The first fit vocabulary word found in the prose, in vocabulary priority order. */
export function fitKey(fit: unknown): FitKey | null {
    const text = scalar(fit).toLowerCase();
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

/**
 * Read the search, the disclosures and the toggles from one view instance. A saved state holding
 * `showDismissed` in place of `showDeclined` is read as the same toggle.
 */
export function parseLeadsState(raw: unknown): LeadsState {
    const held = record(raw);
    const showing = held?.showDeclined ?? held?.showDismissed;
    const state: LeadsState = {
        search: typeof held?.search === 'string' ? held.search : '',
        expiredOpen: held?.expiredOpen === true,
        runlogOpen: held?.runlogOpen === true,
        logAll: held?.logAll === true,
        adding: held?.adding === true,
        showDeclined: showing === true
    };
    if (typeof held?.reveal === 'string' && held.reveal !== '') state.reveal = held.reveal;
    return state;
}

/** The run log the leads feed's `meta.log` carries, each line as text, newest first as written. */
export function runLog(meta: Record<string, unknown> | undefined): string[] {
    const log = meta?.log;
    if (!Array.isArray(log)) return [];
    return log
        .filter(
            (line): line is string | number => typeof line === 'string' || typeof line === 'number'
        )
        .map(String);
}
