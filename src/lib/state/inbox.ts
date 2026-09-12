// Layer 2, client state. Pure Inbox kind grouping, tones, search, and saved view state.
// The view receives four ready-to-draw lists and owns no feed or write rules.

export type InboxEntry = Record<string, unknown>;
export type InboxKind = 'reply' | 'action' | 'info';
export type InboxState = {
    search: string;
    triagedOpen: boolean;
};
export type SplitInbox = {
    replies: InboxEntry[];
    actions: InboxEntry[];
    info: InboxEntry[];
    triaged: InboxEntry[];
};

function record(value: unknown): Record<string, unknown> | null {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : null;
}

function word(entry: InboxEntry, field: string): string {
    const value = entry[field];
    return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

/** Reply and action are explicit; every other kind is informational. */
export function kindOf(entry: InboxEntry): InboxKind {
    const kind = word(entry, 'kind').trim().toLowerCase();
    if (kind === 'reply' || kind === 'action') return kind;
    return 'info';
}

/** The fixed semantic tone of each inbox kind. */
export function kindTone(kind: InboxKind): string {
    if (kind === 'reply') return 'amber';
    if (kind === 'action') return 'red';
    return 'teal';
}

/** Split live entries by kind and keep every triaged entry in its own list. */
export function splitInbox(entries: InboxEntry[]): SplitInbox {
    const split: SplitInbox = { replies: [], actions: [], info: [], triaged: [] };
    for (const entry of entries) {
        if (entry.triaged === true) {
            split.triaged.push(entry);
        } else {
            const kind = kindOf(entry);
            if (kind === 'reply') split.replies.push(entry);
            else if (kind === 'action') split.actions.push(entry);
            else split.info.push(entry);
        }
    }
    return split;
}

/** Require every typed word across sender, subject, and description. */
export function inboxSearch(entries: InboxEntry[], search: string): InboxEntry[] {
    const needles = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (needles.length === 0) return entries;
    return entries.filter((entry) => {
        const text = ['sender', 'subject', 'what']
            .map((field) => word(entry, field))
            .join(' ')
            .toLowerCase();
        return needles.every((needle) => text.includes(needle));
    });
}

/** Read search and the triaged disclosure from one view instance. */
export function parseInboxState(raw: unknown): InboxState {
    const held = record(raw);
    return {
        search: typeof held?.search === 'string' ? held.search : '',
        triagedOpen: held?.triagedOpen === true
    };
}
