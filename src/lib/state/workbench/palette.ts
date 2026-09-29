// Layer 2, client state. Pure indexing, fuzzy matching and command parsing for the shell palette.
// The source store adapter is beside this file; this module accepts plain values so every search
// and command rule is tested without a browser or a live socket.

import type { FeedEntry, FeedKind, Snapshot } from '../../data/model/index.ts';
import { feedIdents, nestedStrings } from '../feeds/idents.ts';
import {
    byScore,
    fuzzyMatches,
    keyMatched,
    textParts,
    type TextPart
} from '../shared/words/fuzzy.ts';

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
    name: 'theme' | 'crt' | 'accent' | 'tab' | 'goto' | 'language' | 'help' | 'update';
    hint: string;
    available: boolean;
};

export type ParsedCommand = { name: string; argument: string };

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
                text: nestedStrings(fields).join(' '),
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
                    text: nestedStrings(entry.fields).join(' '),
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
                text: nestedStrings(entry).join(' '),
                view: kind,
                state: revealState(kind, id)
            });
        }
    }
    return found;
}

export type { TextPart };

/** One result the palette draws: the item, and its title in matched and unmatched runs. */
export type PaletteMatch = { item: PaletteItem; title: TextPart[] };

/**
 * The items every query word matches, fuzzily over each item's title, label and text, as VS
 * Code's Quick Open matches: an item whose title the query matched ranks above one it matched only
 * elsewhere, then the better score, and ties keep index order. With no word the list is the views
 * alone: every project, collection entry and feed entry together is a list no reader scans, and a
 * word is what narrows them to the one wanted.
 */
export function ranked(index: PaletteItem[], query: string): PaletteMatch[] {
    if (query.trim() === '') {
        return index
            .filter((item) => item.kind === 'view')
            .map((item) => ({ item, title: [{ text: item.title, hit: false }] }));
    }
    return fuzzyMatches(query, index, [
        (item) => item.title,
        (item) => item.label,
        (item) => item.text
    ])
        .map((found) => ({ found, titled: keyMatched(found.keys[0]) }))
        .sort(
            (left, right) =>
                Number(right.titled) - Number(left.titled) || byScore(left.found, right.found)
        )
        .map(({ found }) => ({
            item: found.row,
            title: textParts(found.keys[0], found.row.title)
        }));
}

/** The word a result row draws for what it is, from the catalog. */
export function kindWord(
    kind: PaletteItem['kind'],
    t: (key: string, ...args: (string | number)[]) => string
): string {
    if (kind === 'view') return t('app.palette.kind_view');
    if (kind === 'project') return t('app.palette.kind_project');
    if (kind === 'collection') return t('app.palette.kind_collection');
    return t('app.palette.kind_feed');
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

/**
 * The line a go-to-line query names: a colon and a whole number, as VS Code's quick input reads
 * one, or null for any other query.
 */
export function lineQuery(parsed: ParsedCommand | null): number | null {
    if (parsed?.argument !== '' || !/^\d+$/.test(parsed.name)) return null;
    const line = Number(parsed.name);
    return Number.isSafeInteger(line) && line > 0 ? line : null;
}

/**
 * The command vocabulary and its argument hints, over the current theme and view configuration and
 * whether a source tab is on screen, which is what `language` changes.
 */
export function commands(config: Record<string, unknown>, source = false): PaletteCommand[] {
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
        { name: 'language', hint: '<language>', available: source },
        { name: 'help', hint: '', available: false },
        { name: 'update', hint: '', available: true }
    ];
}
