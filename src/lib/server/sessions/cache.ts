// Layer 2, server. The byte-offset cache that makes a rescan cost only what was appended.
//
// One entry per transcript path, holding the file's identity (inode, size, mtime), how far into it
// the fold has already read, and the accumulator at that point. An entry is reused when the inode
// still matches and the file has not shrunk; a shrunk or replaced file is read from zero, and a
// cache that does not parse, or that was written by an older shape of the accumulator, is thrown
// away whole, and an entry with a field of the wrong type is dropped alone, so its transcript is
// read from zero. Both stores live in the one file, keyed by path.

import { existsSync } from 'node:fs';
import type { SessionTool } from '../../data/model/index.ts';
import type { TranscriptFile } from '../transcripts/stores.ts';
import { z } from 'zod';
import { readJson, writeJsonAtomic } from '../core/json.ts';
import { mapShape, readAs, unchanged } from '../core/shapes.ts';
import { accShape, newAcc, type Acc } from './record.ts';

/**
 * One transcript on disk: its path, and the three facts that say whether a cache entry still fits.
 */
export type Found = TranscriptFile;

/**
 * Bumped by any change to the accumulator's shape, or to what a record reads out of it; a store
 * cached at an earlier version is folded again once, whole. The current version reads background
 * subagents and their completion notices, queued ones included, and the tokens an Agent call's
 * result says its subagent spent.
 */
export const CACHE_VERSION = 5;
export const MAX_CACHE_ENTRIES = 200;
/** A first read of a file above this is not folded; the record says so and nothing is cached. */
export const MAX_FIRST_READ_BYTES = 256 * 1024 * 1024;

/** What a stored entry holds: the file's identity, how far the fold read, and its accumulator. */
export type CacheEntry = {
    path: string;
    size: number;
    mtime: number;
    inode: number;
    offset: number;
    acc: Partial<Acc>;
};

/**
 * An entry of the cache file, its numbers finite. An entry that fails is dropped, so its
 * transcript is folded from zero.
 */
const cacheEntryShape = unchanged(
    z.object({
        path: z.string(),
        size: z.number(),
        mtime: z.number(),
        inode: z.number(),
        offset: z.number(),
        acc: accShape
    }) satisfies z.ZodType<CacheEntry>
);

/** The cache file: the current version and a map of entries, which is answered itself. */
const cacheFileShape = z.object({ version: z.literal(CACHE_VERSION), entries: mapShape });

/** Every entry of the cache file, or nothing at all when it is missing, corrupt or out of date. */
export function loadCache(path: string): Record<string, CacheEntry> {
    const file = readAs(cacheFileShape, readJson(path));
    if (file === null) return {};
    const kept: Record<string, CacheEntry> = {};
    for (const [key, value] of Object.entries(file.entries)) {
        const entry = readAs(cacheEntryShape, value);
        if (entry !== null) kept[key] = entry;
    }
    return kept;
}

/**
 * Write the cache back: what was there, updated with what this scan folded, dropping entries whose
 * file is gone and keeping the newest MAX_CACHE_ENTRIES. A cache that cannot be written is not an
 * error: the next scan simply pays for a full read.
 */
export function saveCache(
    path: string,
    previous: Record<string, CacheEntry>,
    fresh: Record<string, CacheEntry>
): void {
    const merged: Record<string, CacheEntry> = { ...previous, ...fresh };
    const keep = Object.values(merged)
        .filter((entry) => entry.path && existsSync(entry.path))
        .sort((a, b) => b.mtime - a.mtime)
        .slice(0, MAX_CACHE_ENTRIES);
    const entries: Record<string, CacheEntry> = {};
    for (const entry of keep) entries[entry.path] = entry;
    try {
        writeJsonAtomic(path, { version: CACHE_VERSION, entries });
    } catch {
        // A cache is an optimisation; a scan that cannot write one still returns its records.
    }
}

/**
 * A cache entry survives an append. A file that shrank or was replaced is read from zero. The
 * entry's size and offset are byte counts, read as whole numbers.
 */
export function usable(cached: CacheEntry | undefined, found: Found): boolean {
    return cached?.inode === found.ino && found.size >= Math.trunc(cached.size);
}

/**
 * Rebuild an accumulator from a cache entry, filling in whatever an older entry lacks. Identity
 * comes from the file being read now, never from the entry, so a cache keyed by a path that was
 * replaced cannot rename the session.
 */
export function rehydrate(
    cached: CacheEntry,
    id: string,
    path: string,
    slug: string,
    tool: SessionTool
): Acc {
    const acc = newAcc(id, path, slug, tool);
    const stored = cached.acc;
    for (const key of Object.keys(acc) as (keyof Acc)[]) {
        if (key === 'id' || key === 'path' || key === 'slug' || key === 'tool') continue;
        if (key in stored) (acc as Record<string, unknown>)[key] = stored[key];
    }
    return acc;
}
