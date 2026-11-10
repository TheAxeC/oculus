// Layer 2, client state. Pure Lit Watch grouping, searching, ordering, joins, and saved view state.
// The view receives ready-to-draw groups and seeds while this module names no component. The
// bucket an unknown bucket is drawn under, the buckets that offer the Idea form, the order and the
// tone of a relevance are the flags, the order and the colours of `radar_buckets` and
// `radar_relevance` of config/catalogs/vocab.yml in the words the caller passes; the tone is taken
// through state/shared/words/tones.ts `wordsTone`, whose module reads the configuration's
// generation, a Svelte rune.

import { z } from 'zod';
import type { Project } from '../../data/model/index.ts';
import { byKey, slugOf } from '../../data/helpers/guards.ts';
import { holdersOf, resolvedId, type Holders } from '../../data/helpers/hub-names.ts';
import { feedRoot } from '../shared/page/idents.ts';
import type { ReadMemo } from '../shared/stores/shapes.ts';
import { instanceFolded } from '../shared/page/folds.ts';
import { UNKNOWN_TONE, wordsTone } from '../shared/words/tones.ts';
import {
    mapShape,
    readAs,
    rowsShape,
    searchRevealShape,
    textOrNumberShape
} from '../../data/shapes/shapes.ts';
import { hasWord, oneWordWith, vocabKeys } from '../../data/shapes/vocab-keys.ts';

export type { Project };

/** How many characters of the title or motif a project id seeded from a spark keeps. */
const SLUG_MAX = 40;

export type RadarEntry = Record<string, unknown>;
export type RadarBucket = { key: string; glyph: string; label: string; color: string };
export type RadarGroup = { bucket: RadarBucket; entries: RadarEntry[] };
export type RadarState = {
    search: string;
    dismissedOpen: boolean;
    /** The keys of the folded buckets, the empty key for a bucket row whose key is empty. */
    folded: string[];
    reveal?: string;
};

/** One bucket row of the vocabulary: four texts, and nothing else of the row. */
const radarBucketShape = z.object({
    key: z.string(),
    glyph: z.string(),
    label: z.string(),
    color: z.string()
}) satisfies z.ZodType<RadarBucket>;

/** The fields a view instance keeps of the radar, each read as absent when of the wrong type. */
const radarStateShape = searchRevealShape.extend({ dismissedOpen: z.boolean().catch(false) });

const radarBucketsShape = rowsShape(radarBucketShape);

/** Valid bucket rows from the merged vocabulary, preserving its order. */
export function radarBuckets(raw: unknown): RadarBucket[] {
    return readAs(radarBucketsShape, raw) ?? [];
}

/** A text of the entry's, or a number written out, and the empty text for anything else. */
function word(entry: RadarEntry, field: string): string {
    return readAs(textOrNumberShape, entry[field]) ?? '';
}

/**
 * The bucket of `radar_buckets` of the words given that carries `default: true`: the one an entry
 * whose bucket no row names is drawn under, and the one a Literature card's Add form preselects.
 * None when no row carries it, or when two do, which is a finding of the vocabulary.
 */
export function defaultBucket(words: Record<string, unknown>): string | undefined {
    return oneWordWith(words, 'radar_buckets', 'default');
}

/** Whether a paper's `maps_to` is `new-idea-candidate`, the radar format's word for no project. */
export function isCandidate(entry: RadarEntry): boolean {
    return word(entry, 'maps_to') === 'new-idea-candidate';
}

/**
 * Whether a paper offers the card's Idea form: its bucket is one `radar_buckets` of the words given
 * marks `spark: true`, or it is a candidate (`isCandidate`).
 */
export function sparks(entry: RadarEntry, words: Record<string, unknown>): boolean {
    return hasWord(words, 'radar_buckets', 'spark', word(entry, 'bucket')) || isCandidate(entry);
}

/**
 * Live entries grouped in vocabulary order, an entry whose bucket no row names counted in the
 * bucket `fallback` (`defaultBucket`), and in none when no bucket is given.
 */
export function bucketsOf(
    entries: RadarEntry[],
    buckets: RadarBucket[],
    fallback: string | undefined
): RadarGroup[] {
    return buckets.map((bucket) => ({
        bucket,
        entries: entries.filter((entry) => {
            const named = word(entry, 'bucket');
            return (
                named === bucket.key ||
                (bucket.key === fallback && !buckets.some((one) => one.key === named))
            );
        })
    }));
}

/**
 * The words of `radar_relevance` of the words given, in its order, the closest relevance first: the
 * words an entry's `relevance` takes.
 */
export function relevanceWords(words: Record<string, unknown>): string[] {
    return vocabKeys(words.radar_relevance);
}

/**
 * The word of `radar_relevance` that carries `default: true`, the relevance a Literature card's Add
 * form preselects; none when no word carries it, or when two do.
 */
export function defaultRelevance(words: Record<string, unknown>): string | undefined {
    return oneWordWith(words, 'radar_relevance', 'default');
}

/**
 * Newest discovery first, then by relevance in the order of `ranks` (`relevanceWords`), the first
 * word highest, an entry whose relevance it does not hold after every word it holds.
 */
export function sortBucket(entries: (RadarEntry | null)[], ranks: string[]): RadarEntry[] {
    const rank = (entry: RadarEntry): number => {
        const at = ranks.indexOf(word(entry, 'relevance'));
        return at < 0 ? 0 : ranks.length - at;
    };
    return entries
        .filter((entry): entry is RadarEntry => entry !== null)
        .sort(
            (left, right) =>
                word(right, 'found').localeCompare(word(left, 'found')) || rank(right) - rank(left)
        );
}

export function isNew(entry: RadarEntry, lastRun: unknown): boolean {
    const run = readAs(textOrNumberShape, lastRun) ?? '';
    return run !== '' && word(entry, 'found') === run;
}

/** Both YAML boolean true and a hand-edited string true put an entry in the dismissed section. */
export function isDismissed(entry: RadarEntry): boolean {
    return entry.dismissed === true || entry.dismissed === 'true';
}

/**
 * The tone of an entry's relevance: the hue the `palette` of the words given maps the `color` of
 * its word of `radar_relevance` to, and the unknown tone for a word with no such colour.
 */
export function relevanceTone(relevance: unknown, words: Record<string, unknown>): string {
    const rows = readAs(mapShape, words.radar_relevance) ?? {};
    const row = typeof relevance === 'string' ? readAs(mapShape, byKey(rows, relevance)) : null;
    return wordsTone(row?.color, words) ?? UNKNOWN_TONE;
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
    const id = slugOf(word(entry, 'motif'), SLUG_MAX) || slugOf(word(entry, 'title'), SLUG_MAX);
    return { id, eli5: word(entry, 'idea_spark') || word(entry, 'why') };
}

/**
 * The hubs that hold each key of `projects`. Every paper's card resolves its keys over the same
 * map, which a new portfolio message replaces with a new one, so with the client's memo (`reads`)
 * the holders of a map are read once for that map and let go with it.
 */
function projectHolders(projects: Record<string, Project>, reads?: ReadMemo): Holders {
    const read = (): Holders => holdersOf(Object.values(projects));
    return reads === undefined ? read() : reads.held(projects, 'project holders', read);
}

/**
 * Existing project records named by project and maps_to, in that order without duplicates. Each
 * names a project by its key, which resolves in the entry's own hub first, then in the others
 * (`resolvedId`), over the holders of the map (`projectHolders`, through the client's `reads`).
 */
export function crossLinksOf(
    entry: RadarEntry,
    projects: Record<string, Project>,
    reads?: ReadMemo
): Project[] {
    const keys = [word(entry, 'project'), word(entry, 'maps_to')].filter(Boolean);
    const held = projectHolders(projects, reads);
    const ids = keys.map((key) => resolvedId(held, feedRoot(entry), key));
    return [...new Set(ids)].flatMap((id) => {
        const found = id === null ? undefined : byKey(projects, id);
        return found === undefined ? [] : [found];
    });
}

export function parseRadarState(raw: unknown): RadarState {
    const held = readAs(radarStateShape, raw);
    const state: RadarState = {
        search: held?.search ?? '',
        dismissedOpen: held?.dismissedOpen ?? false,
        folded: instanceFolded(raw)
    };
    if (held?.reveal !== undefined) state.reveal = held.reveal;
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

/** The buckets the entries fall into (`bucketsOf`), a bucket that holds none of them left out. */
export function filledBuckets(
    entries: RadarEntry[],
    buckets: RadarBucket[],
    fallback: string | undefined
): RadarGroup[] {
    return bucketsOf(entries, buckets, fallback).filter((group) => group.entries.length > 0);
}
