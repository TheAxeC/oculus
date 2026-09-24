// Layer 2, server. The byte-offset cache that makes a rescan cost only what was appended.
//
// One entry per transcript path, holding the file's identity (inode, size, mtime), how far into it
// the fold has already read, and the accumulator at that point. An entry is reused when the inode
// still matches and the file has not shrunk; a shrunk or replaced file is read from zero, and a
// cache that does not parse, or that was written by an older shape of the accumulator, is thrown
// away whole. Both stores live in the one file, keyed by path.

import { existsSync } from 'node:fs';
import type { SessionTool } from '../../data/model.ts';
import type { TranscriptFile } from '../transcripts/stores.ts';
import { isMap, readJson, whole, writeJsonAtomic } from './stores/json.ts';
import { newAcc, type Acc } from './record.ts';

/**
 * One transcript on disk: its path, and the three facts that say whether a cache entry still fits.
 */
export type Found = TranscriptFile;

/**
 * Bumped by any change to the accumulator's shape, or to what a record reads out of it; a store
 * cached at an earlier version is folded again once, whole. The current version reads background
 * subagents and their completion notices, queued ones included.
 */
export const CACHE_VERSION = 4;
export const MAX_CACHE_ENTRIES = 200;
/** A first read of a file above this is not folded; the record says so and nothing is cached. */
export const MAX_FIRST_READ_BYTES = 256 * 1024 * 1024;

export type CacheEntry = {
    path: string;
    size: number;
    mtime: number;
    inode: number;
    offset: number;
    acc: Acc;
};

/** Every entry of the cache file, or nothing at all when it is missing, corrupt or out of date. */
export function loadCache(path: string): Record<string, CacheEntry> {
    const data = readJson(path);
    if (!isMap(data) || data.version !== CACHE_VERSION) return {};
    const entries = data.entries;
    if (!isMap(entries)) return {};
    const kept: Record<string, CacheEntry> = {};
    for (const [key, value] of Object.entries(entries)) {
        if (isMap(value) && isMap(value.acc)) kept[key] = value as unknown as CacheEntry;
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
        .filter((entry) => typeof entry.path === 'string' && entry.path && existsSync(entry.path))
        .sort((a, b) => whole(b.mtime) - whole(a.mtime))
        .slice(0, MAX_CACHE_ENTRIES);
    const entries: Record<string, CacheEntry> = {};
    for (const entry of keep) entries[entry.path] = entry;
    try {
        writeJsonAtomic(path, { version: CACHE_VERSION, entries });
    } catch {
        // A cache is an optimisation; a scan that cannot write one still returns its records.
    }
}

/** A cache entry survives an append. A file that shrank or was replaced is read from zero. */
export function usable(cached: CacheEntry | undefined, found: Found): boolean {
    if (cached === undefined || !isMap(cached.acc)) return false;
    return cached.inode === found.ino && found.size >= whole(cached.size);
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
    const stored = cached.acc as unknown as Record<string, unknown>;
    for (const key of Object.keys(acc) as (keyof Acc)[]) {
        if (key === 'id' || key === 'path' || key === 'slug' || key === 'tool') continue;
        if (key in stored) (acc as Record<string, unknown>)[key] = stored[key];
    }
    return acc;
}
