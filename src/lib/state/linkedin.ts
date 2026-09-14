// Layer 2, client state. Pure LinkedIn cadence, ordering, snippets, search, and saved view state.
// The view receives ready-to-draw ideas and posts and owns no folder or calendar rules.

import { scalar } from '../data/guards.ts';

export { localDate } from '../data/dates.ts';
export type { SchemaField } from '../data/model.ts';

export type LinkedinEntry = {
    file: string;
    title: string;
    date: string;
    category: string;
    body: string;
    idea: boolean;
};

export type LinkedinState = {
    search: string;
    /** Whether the add-idea form is open, kept with the view instance. */
    adding: boolean;
    /** The palette destination, cleared by the view after it scrolls and flashes the card. */
    reveal?: string;
};

export type LinkedinCadence = 'no-dates' | 'overdue' | 'ontrack';
export type SplitLinkedin = { ideas: LinkedinEntry[]; posts: LinkedinEntry[] };

const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function record(value: unknown): Record<string, unknown> | null {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : null;
}

function text(entry: Record<string, unknown>, field: string): string {
    const value = entry[field];
    return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

/** One strict ISO calendar date as a UTC timestamp, or null when it is not a real date. */
function dateValue(value: unknown): number | null {
    const matched = DATE.exec(scalar(value));
    if (matched === null) return null;
    const year = Number(matched[1]);
    const month = Number(matched[2]);
    const day = Number(matched[3]);
    const stamp = Date.UTC(year, month - 1, day);
    const date = new Date(stamp);
    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
    ) {
        return null;
    }
    return stamp;
}

/** Days from the newest valid dated post to today, or null when neither provides a valid date. */
export function daysSince(posts: LinkedinEntry[], today: string): number | null {
    const now = dateValue(today);
    if (now === null) return null;
    const dates = posts
        .map((post) => dateValue(post.date))
        .filter((date): date is number => date !== null);
    if (dates.length === 0) return null;
    return Math.floor((now - Math.max(...dates)) / 86_400_000);
}

/** Classify the cadence against the configured interval. */
export function cadence(days: number | null, target: number): LinkedinCadence {
    if (days === null) return 'no-dates';
    return days > target ? 'overdue' : 'ontrack';
}

/** Pick one idea by the one-based day of the year modulo the current idea count. */
export function pickIdea(ideas: LinkedinEntry[], today: string): LinkedinEntry | null {
    if (ideas.length === 0) return null;
    const stamp = dateValue(today);
    if (stamp === null) return ideas[0];
    const date = new Date(stamp);
    const first = Date.UTC(date.getUTCFullYear(), 0, 1);
    const day = Math.floor((stamp - first) / 86_400_000) + 1;
    return ideas[day % ideas.length];
}

/** Collapse body whitespace and keep its first 160 characters with an ASCII ellipsis. */
export function snippet(body: unknown): string {
    const collapsed = scalar(body).replace(/\s+/g, ' ').trim();
    return `${Array.from(collapsed).slice(0, 160).join('')}...`;
}

/** Coerce the folder feed and split it into filename-ordered ideas and newest-first posts. */
export function splitPosts(entries: Record<string, unknown>[]): SplitLinkedin {
    const parsed = entries
        .map((entry): LinkedinEntry | null => {
            const file = text(entry, 'file');
            const idea = file.startsWith('xx-');
            if (!idea && !/^\d+-/.test(file)) return null;
            return {
                file,
                title: text(entry, 'title') || file,
                date: text(entry, 'date'),
                category: text(entry, 'category'),
                body: text(entry, 'body'),
                idea
            };
        })
        .filter((entry): entry is LinkedinEntry => entry !== null);
    const ideas = parsed
        .filter((entry) => entry.idea)
        .sort((left, right) => left.file.localeCompare(right.file));
    const posts = parsed
        .filter((entry) => !entry.idea)
        .sort((left, right) => {
            const a = dateValue(left.date);
            const b = dateValue(right.date);
            if (a === null) return b === null ? left.file.localeCompare(right.file) : 1;
            if (b === null) return -1;
            return b === a ? left.file.localeCompare(right.file) : b - a;
        });
    return { ideas, posts };
}

/** Require every typed word across title, category, and body. */
export function linkedinSearch(entries: LinkedinEntry[], search: string): LinkedinEntry[] {
    const needles = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (needles.length === 0) return entries;
    return entries.filter((entry) => {
        const haystack = `${entry.title} ${entry.category} ${entry.body}`.toLowerCase();
        return needles.every((needle) => haystack.includes(needle));
    });
}

/** Read search and add-form state from one view instance. */
export function parseLinkedinState(raw: unknown): LinkedinState {
    const held = record(raw);
    const state: LinkedinState = {
        search: typeof held?.search === 'string' ? held.search : '',
        adding: held?.adding === true
    };
    if (typeof held?.reveal === 'string' && held.reveal !== '') state.reveal = held.reveal;
    return state;
}
