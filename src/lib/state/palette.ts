// Layer 2, client state. Pure indexing, matching and command parsing for the shell palette. The
// source store adapter is beside this file; this module accepts plain values so every search and
// command rule is tested without a browser or a live socket.

import type { FeedEntry, FeedKind, Snapshot } from '../data/model.ts';

export type PaletteView = { id: string; label: string };

export type PaletteFeed = { entries: FeedEntry[] } | null;

export type PaletteFeeds = Partial<Record<FeedKind, PaletteFeed>>;

export type PaletteItem = {
    id: string;
    kind: 'view' | 'project' | 'collection' | 'feed';
    label: string;
    title: string;
    text: string;
    view: string;
    state?: Record<string, unknown>;
};

export type PaletteCommand = {
    name: 'theme' | 'crt' | 'accent' | 'tab' | 'goto' | 'help' | 'update';
    hint: string;
    available: boolean;
};

export type ParsedCommand = { name: string; argument: string };

/** Every string nested in a value, in property order. */
function strings(value: unknown): string[] {
    if (typeof value === 'string') return value === '' ? [] : [value];
    if (Array.isArray(value)) return value.flatMap(strings);
    if (typeof value !== 'object' || value === null) return [];
    return Object.values(value as Record<string, unknown>).flatMap(strings);
}

/** The identity one entry carries on its own, before the feed is asked whether it is unique. */
export function feedIdentity(kind: FeedKind, entry: object): string {
    const key = kind === 'linkedin' ? 'file' : 'title';
    const value = (entry as Record<string, unknown>)[key];
    if (typeof value === 'string' && value !== '') return value;
    return strings(entry)[0] ?? kind;
}

/** What a caller asks for the identity of one entry of the list it was built over. */
export type FeedIdent = (entry: object) => string;

/**
 * One distinct non-empty id per entry of a list. An entry whose own fields give an empty id, and
 * each of two entries whose fields give the same id, carries its position in the list as a suffix;
 * every other entry keeps the id its own fields give, so the ids stay readable and stable.
 */
export function uniqueIdents<T extends object>(
    entries: readonly T[],
    base: (entry: T) => string,
    fallback: string
): (entry: T) => string {
    const seen = new Map<string, number>();
    for (const entry of entries) seen.set(base(entry), (seen.get(base(entry)) ?? 0) + 1);
    const ids = new Map<T, string>();
    entries.forEach((entry, at) => {
        const own = base(entry);
        const shared = (seen.get(own) ?? 0) > 1;
        ids.set(entry, own === '' || own === fallback || shared ? `${own || fallback}#${at}` : own);
    });
    return (entry) => ids.get(entry) ?? base(entry);
}

/** The stable identity the feed view and the palette use for the same entry, over the whole feed. */
export function feedIdents(kind: FeedKind, entries: readonly object[]): FeedIdent {
    return uniqueIdents(entries, (entry) => feedIdentity(kind, entry), kind);
}

/**
 * The state a feed view is given to reveal one entry: the id, and the disclosure the entry may sit
 * behind opened, since a card that is not mounted cannot be scrolled to.
 */
function revealState(kind: FeedKind, id: string): Record<string, unknown> {
    if (kind === 'leads') return { reveal: id, expiredOpen: true };
    if (kind === 'radar') return { reveal: id, dismissedOpen: true };
    return { reveal: id };
}

/** Build the complete searchable index from the values currently held by the client stores. */
export function buildIndex(
    snapshot: Snapshot | null,
    feeds: PaletteFeeds,
    views: PaletteView[]
): PaletteItem[] {
    const found: PaletteItem[] = views.map((view) => ({
        id: `view:${view.id}`,
        kind: 'view',
        label: view.label,
        title: view.label,
        text: `${view.label} tab`,
        view: view.id
    }));
    if (snapshot !== null) {
        for (const project of Object.values(snapshot.entities.projects)) {
            const venue =
                project.venueId === undefined
                    ? project.venue
                    : snapshot.entities.venues[project.venueId];
            const fields = [
                project.title,
                project.short,
                project.eli5,
                project.results,
                project.ideas,
                project.next,
                project.latest,
                venue,
                project.chips
            ];
            found.push({
                id: `project:${project.id}`,
                kind: 'project',
                label: project.title,
                title: project.title,
                text: strings(fields).join(' '),
                view: 'project',
                state: { id: project.id, label: project.short ?? project.title }
            });
        }
        for (const collection of Object.values(snapshot.entities.collections)) {
            for (const entry of collection.entries) {
                found.push({
                    id: `collection:${collection.id}:${entry.id}`,
                    kind: 'collection',
                    label: entry.title || entry.id,
                    title: entry.title || entry.id,
                    text: strings(entry.fields).join(' '),
                    view: collection.id,
                    state: { reveal: entry.id }
                });
            }
        }
    }
    for (const kind of ['leads', 'radar', 'linkedin'] as const) {
        const entries = feeds[kind]?.entries ?? [];
        const identOf = feedIdents(kind, entries);
        for (const entry of entries) {
            const id = identOf(entry);
            const label =
                typeof entry.title === 'string' && entry.title !== ''
                    ? entry.title
                    : typeof entry.subject === 'string' && entry.subject !== ''
                      ? entry.subject
                      : id;
            found.push({
                id: `feed:${kind}:${id}`,
                kind: 'feed',
                label,
                title: label,
                text: strings(entry).join(' '),
                view: kind,
                state: revealState(kind, id)
            });
        }
    }
    return found;
}

/** AND-match query words across an item, with more title hits ranked first and stable ties. */
export function match(index: PaletteItem[], query: string): PaletteItem[] {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length === 0) return [...index];
    return index
        .map((item, order) => {
            const title = item.title.toLowerCase();
            const text = `${item.label} ${item.text}`.toLowerCase();
            return { item, order, hits: words.filter((word) => title.includes(word)).length, text };
        })
        .filter((ranked) => words.every((word) => ranked.text.includes(word)))
        .sort((left, right) => right.hits - left.hits || left.order - right.order)
        .map((ranked) => ranked.item);
}

/** Split a leading-colon query into the command-name prefix and its argument. */
export function parseCommand(query: string): ParsedCommand | null {
    if (!query.startsWith(':')) return null;
    const body = query.slice(1).trimStart();
    const space = body.search(/\s/);
    if (space < 0) return { name: body.toLowerCase(), argument: '' };
    return {
        name: body.slice(0, space).toLowerCase(),
        argument: body.slice(space).trim()
    };
}

/** The command vocabulary and its argument hints, over the current theme and view configuration. */
export function commands(config: Record<string, unknown>): PaletteCommand[] {
    const themes = Array.isArray(config.themes)
        ? config.themes.flatMap((row) => {
              if (typeof row !== 'object' || row === null || Array.isArray(row)) return [];
              const name = (row as Record<string, unknown>).name;
              return typeof name === 'string' && name !== '' ? [name] : [];
          })
        : [];
    return [
        { name: 'theme', hint: `<${themes.join(' | ')}>`, available: themes.length > 0 },
        { name: 'crt', hint: '', available: true },
        { name: 'accent', hint: '<name | #hex | reset>', available: false },
        { name: 'tab', hint: '<view id>', available: true },
        { name: 'goto', hint: '<project id>', available: true },
        { name: 'help', hint: '', available: false },
        { name: 'update', hint: '', available: true }
    ];
}
