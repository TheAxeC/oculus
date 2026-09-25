// Layer 2, client state. Pure Lit Watch grouping, searching, ordering, joins, and saved view state.
// The view receives ready-to-draw groups and seeds while this module names no component.

import type { Project } from '../../data/model/index.ts';
import { byKey } from '../../data/helpers/guards.ts';

export type { Project };

export type RadarEntry = Record<string, unknown>;
export type RadarBucket = { key: string; glyph: string; label: string; color: string };
export type RadarGroup = { bucket: RadarBucket; entries: RadarEntry[] };
export type RadarState = { search: string; dismissedOpen: boolean; reveal?: string };

/** Valid bucket rows from the merged vocabulary, preserving its order. */
export function radarBuckets(raw: unknown): RadarBucket[] {
    if (!Array.isArray(raw)) return [];
    return raw.flatMap((row) => {
        if (typeof row !== 'object' || row === null || Array.isArray(row)) return [];
        const item = row as Record<string, unknown>;
        if (
            typeof item.key !== 'string' ||
            typeof item.glyph !== 'string' ||
            typeof item.label !== 'string' ||
            typeof item.color !== 'string'
        ) {
            return [];
        }
        return [{ key: item.key, glyph: item.glyph, label: item.label, color: item.color }];
    });
}

function word(entry: RadarEntry, field: string): string {
    const value = entry[field];
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    return '';
}

/** Live entries grouped in vocabulary order, with unknown buckets counted as adjacent. */
export function bucketsOf(entries: RadarEntry[], buckets: RadarBucket[]): RadarGroup[] {
    return buckets.map((bucket) => ({
        bucket,
        entries: entries.filter((entry) => {
            const named = word(entry, 'bucket');
            return (
                named === bucket.key ||
                (bucket.key === 'adjacent' && !buckets.some((one) => one.key === named))
            );
        })
    }));
}

/** Newest discovery first, then high, medium, and low relevance. */
export function sortBucket(entries: RadarEntry[]): RadarEntry[] {
    const rank: Record<string, number> = { high: 3, med: 2, low: 1 };
    return [...entries].sort(
        (left, right) =>
            word(right, 'found').localeCompare(word(left, 'found')) ||
            (rank[word(right, 'relevance')] ?? 0) - (rank[word(left, 'relevance')] ?? 0)
    );
}

export function isNew(entry: RadarEntry, lastRun: unknown): boolean {
    const run = typeof lastRun === 'string' || typeof lastRun === 'number' ? String(lastRun) : '';
    return run !== '' && word(entry, 'found') === run;
}

/** Both YAML boolean true and a hand-edited string true put an entry in the dismissed section. */
export function isDismissed(entry: RadarEntry): boolean {
    return entry.dismissed === true || entry.dismissed === 'true';
}

export function relevanceTone(relevance: unknown): string {
    if (relevance === 'high') return 'red';
    if (relevance === 'med') return 'amber';
    return 'grey';
}

/** Match every typed word against all searchable radar fields. */
export function radarSearch(entries: RadarEntry[], search: string): RadarEntry[] {
    const needles = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (needles.length === 0) return entries;
    const fields = ['title', 'authors', 'venue', 'year', 'project', 'motif', 'why', 'threatens'];
    return entries.filter((entry) => {
        const text = fields
            .map((field) => word(entry, field))
            .join(' ')
            .toLowerCase();
        return needles.every((needle) => text.includes(needle));
    });
}

/** The fields used to pre-fill NewIdea from a Lit Watch spark. */
export function ideaSeed(entry: RadarEntry): { id: string; eli5: string } {
    // The motif seeds the id when it slugs to something; a motif of punctuation alone falls back
    // to the title, so a usable title never yields an empty id.
    const id = slugOf(word(entry, 'motif')) || slugOf(word(entry, 'title'));
    return { id, eli5: word(entry, 'idea_spark') || word(entry, 'why') };
}

function slugOf(source: string): string {
    return source
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 40)
        .replace(/^-+|-+$/g, '');
}

/** Existing project records named by project and maps_to, in that order without duplicates. */
export function crossLinksOf(entry: RadarEntry, projects: Record<string, Project>): Project[] {
    const ids = [word(entry, 'project'), word(entry, 'maps_to')].filter(Boolean);
    return [...new Set(ids)].flatMap((id) => {
        const found = byKey(projects, id);
        return found === undefined ? [] : [found];
    });
}

export function parseRadarState(raw: unknown): RadarState {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
        return { search: '', dismissedOpen: false };
    }
    const held = raw as Record<string, unknown>;
    const state: RadarState = {
        search: typeof held.search === 'string' ? held.search : '',
        dismissedOpen: held.dismissedOpen === true
    };
    if (typeof held.reveal === 'string' && held.reveal !== '') state.reveal = held.reveal;
    return state;
}

/** The live entries and the dismissed ones of the feed, each in the order given. */
export function dismissedSplit(entries: RadarEntry[]): {
    live: RadarEntry[];
    dismissed: RadarEntry[];
} {
    return {
        live: entries.filter((entry) => !isDismissed(entry)),
        dismissed: entries.filter(isDismissed)
    };
}

/** The buckets the entries fall into, a bucket that holds none of them left out. */
export function filledBuckets(entries: RadarEntry[], buckets: RadarBucket[]): RadarGroup[] {
    return bucketsOf(entries, buckets).filter((group) => group.entries.length > 0);
}
