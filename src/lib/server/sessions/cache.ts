// Layer 2, server. The byte-offset cache that makes a rescan cost only what was appended.
//
// One entry per transcript path, holding the file's identity (inode, size, mtime), how far into it
// the fold has already read, and the accumulator at that point. An entry is reused when the inode
// still matches and the file has not shrunk; a shrunk or replaced file is read from zero, and a
// cache that does not parse, or that was written by another version of the code that reads a
// transcript, is thrown away whole, and an entry with a field of the wrong type is dropped alone,
// so its transcript is read from zero. Both stores live in the one file, keyed by path.
//
// The version is the digest of that code (`readerDigest`), so a change to it is never served from
// what an older reader cached, with no number raised by hand. It is read from the source files of
// the checkout the code runs from (data/places/engine-dir.ts), which every way of running the
// server has: the development server, the desktop app's unbuilt src/server.ts and the adapter-node
// build.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import type { SessionTool } from '../../data/model/index.ts';
import type { TranscriptFile } from '../transcripts/stores.ts';
import { z } from 'zod';
import { readJson, writeJsonAtomic } from '../core/json.ts';
import { mapShape, readAs, unchanged } from '../../data/shapes/shapes.ts';
import { engineDir } from '../../data/places/engine-dir.ts';
import { accShape, newAcc, type Acc } from './record.ts';

/**
 * The modules whose code folds a transcript into a session record, where the digest starts, and
 * the folders whose modules they import are hashed with them: the sessions folder and the
 * transcript readers it calls.
 */
const READER_FILES = [
    'src/lib/server/sessions/fold.ts',
    'src/lib/server/sessions/stores/turns.ts',
    'src/lib/server/sessions/stores/transcripts.ts',
    'src/lib/server/sessions/cache.ts'
];
const READER_FOLDERS = ['src/lib/server/sessions', 'src/lib/server/transcripts'];

/** The name a module is imported by, in an `import` or an `export` of this tree's formatting. */
const IMPORTED = /\bfrom\s+'([^']+)'/g;

/**
 * The digest of the reader under the checkout `root`: the modules READER_FILES names and every
 * module of READER_FOLDERS they import, directly or not, each hashed whole with its path, in the
 * order of the paths. A scan reads it once, for the cache it loads and the cache it writes.
 */
export function readerDigest(root: string = engineDir()): string {
    const folders = READER_FOLDERS.map((folder) => join(root, folder) + sep);
    const found = new Set<string>();
    const next = READER_FILES.map((file) => join(root, file));
    for (let file = next.pop(); file !== undefined; file = next.pop()) {
        if (found.has(file)) continue;
        found.add(file);
        for (const [, name = ''] of readFileSync(file, 'utf8').matchAll(IMPORTED)) {
            const target = resolve(dirname(file), name);
            if (name.startsWith('.') && folders.some((folder) => target.startsWith(folder))) {
                next.push(target);
            }
        }
    }
    const hash = createHash('sha256');
    for (const file of [...found].sort()) {
        hash.update(`${relative(root, file)}\0${readFileSync(file, 'utf8')}\0`);
    }
    return hash.digest('hex').slice(0, 16);
}

/**
 * One transcript on disk: its path, and the three facts that say whether a cache entry still fits.
 */
export type Found = TranscriptFile;

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

/** The cache file of the reader `version`: its digest and a map of entries, answered itself. */
function cacheFileShape(version: string) {
    return z.object({ version: z.literal(version), entries: mapShape });
}

/**
 * Every entry of the cache file, or none when it is missing, corrupt or written by a reader whose
 * digest is not `version`.
 */
export function loadCache(path: string, version: string): Record<string, CacheEntry> {
    const file = readAs(cacheFileShape(version), readJson(path));
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
 * error: the next scan simply pays for a full read. It is written under the reader's `version`.
 */
export function saveCache(
    path: string,
    version: string,
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
        writeJsonAtomic(path, { version, entries });
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
