// Layer 2, server. Read appended session files and fold each one into a current session record.
//
// Two stores answer to the same shape: ~/.claude/projects/<slug>/<id>.jsonl, written by Claude
// Code, and ~/.codex/sessions/YYYY/MM/DD/rollout-<stamp>-<uuid>.jsonl, written by the Codex CLI.
// Both are line-delimited JSON, so both are read the same way: from the byte offset the cache
// remembers, up to the last complete line, because a trailing line without a newline is a record
// still being written and waits for the next pass.
//
// Nothing here throws. A file that cannot be read is left out and the rest come back.

import { closeSync, fstatSync, openSync, readSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, join } from 'node:path';
import type { LiveEntry, SessionRecord, SessionTool } from '../../../data/model.ts';
import {
    MAX_FIRST_READ_BYTES,
    loadCache,
    rehydrate,
    saveCache,
    usable,
    type CacheEntry,
    type Found
} from '../cache.ts';
import {
    codexLive,
    codexRunning,
    codexState,
    defaultCodexStore,
    foldCodex,
    rolloutId,
    rolloutSlug,
    systemCodexProbe,
    type CodexProbe
} from './codex.ts';
import { claudeTranscripts, codexRollouts, isRollout } from '../../transcripts/stores.ts';
import { claudeState, foldClaude } from '../fold.ts';
import { whole } from './json.ts';
import { defaultOverridesPath, hiddenIds } from '../overrides.ts';
import { defaultRegistry, liveSessions, mergeLive, systemProbe, type Probe } from '../registry.ts';
import { finish, newAcc, prune, type Acc } from '../record.ts';

export const DEFAULT_WINDOW_DAYS = 2;
export const DEFAULT_MAX_SESSIONS = 40;

/** ~/.claude/projects, resolved at the call rather than at import. */
export function defaultStore(): string {
    return join(homedir(), '.claude', 'projects');
}

/** ~/.oculus/transcript-cache.json, resolved at the call rather than at import. */
export function defaultCachePath(): string {
    return join(homedir(), '.oculus', 'transcript-cache.json');
}

export type ScanOptions = {
    /** The Claude Code transcript store. */
    store?: string;
    /** The Codex CLI rollout store. */
    codexStore?: string;
    windowDays?: number;
    maxSessions?: number;
    cachePath?: string;
    /** Claude Code's session registry. */
    registry?: string;
    overridesPath?: string;
    /** What the liveness check asks of the system; stubbed by every test. */
    probe?: Probe;
    /** What the Codex liveness check asks of the system; stubbed by every test. */
    codexProbe?: CodexProbe;
    /** A first read above this is not folded and the record says so. */
    maxFirstReadBytes?: number;
    /** The moment to measure ages against, in milliseconds. */
    now?: number;
};

/**
 * Fold every complete line from `offset` and return the bytes consumed. The offset is in bytes,
 * and only the part of the file up to its last newline is decoded, so a multi-byte character
 * split across the end of a read is never cut in half.
 */
export function foldFrom(
    path: string,
    offset: number,
    apply: (record: Record<string, unknown>) => void
): number {
    let handle: number;
    try {
        handle = openSync(path, 'r');
    } catch {
        return 0;
    }
    try {
        const size = fstatSync(handle).size;
        if (size <= offset) return 0;
        const length = size - offset;
        const buffer = Buffer.allocUnsafe(length);
        let read = 0;
        while (read < length) {
            const got = readSync(handle, buffer, read, length - read, offset + read);
            if (got <= 0) break;
            read += got;
        }
        const end = buffer.subarray(0, read).lastIndexOf(0x0a);
        if (end < 0) return 0;
        const complete = buffer.subarray(0, end + 1);
        for (const line of complete.toString('utf8').split('\n')) {
            if (line.trim() === '') continue;
            let parsed: unknown;
            try {
                parsed = JSON.parse(line) as unknown;
            } catch {
                continue;
            }
            if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
                apply(parsed as Record<string, unknown>);
            }
        }
        return complete.length;
    } catch {
        return 0;
    } finally {
        closeSync(handle);
    }
}

/**
 * Which store a path belongs to, by its name. A rollout is the Codex one; everything else Claude.
 */
export function toolOf(path: string): SessionTool {
    return isRollout(path) ? 'codex' : 'claude';
}

function accFor(path: string, store: string | null, tool: SessionTool): Acc {
    if (tool === 'codex') {
        const slug = store === null ? basename(join(path, '..')) : rolloutSlug(store, path);
        return newAcc(rolloutId(path), path, slug, 'codex');
    }
    const id = basename(path).replace(/\.jsonl$/, '');
    return newAcc(id, path, basename(join(path, '..')), 'claude');
}

function foldInto(acc: Acc, path: string, offset: number): number {
    const fold = acc.tool === 'codex' ? foldCodex : foldClaude;
    return foldFrom(path, offset, (record) => fold(acc, record));
}

function stateOf(acc: Acc, mtimeMs: number | null, now: number): string {
    if (acc.tool === 'codex') return codexState(acc);
    return claudeState(acc, mtimeMs === null ? null : mtimeMs / 1000, now);
}

/**
 * Parse one session file completely and return its record. No cache and no registry lookup: the
 * record comes back with the not-live defaults and the transcript's own state guess.
 */
export function readSession(path: string, store: string | null = null): SessionRecord {
    const tool = toolOf(path);
    const acc = accFor(path, store, tool);
    foldInto(acc, path, 0);
    prune(acc);
    let mtimeMs: number | null;
    try {
        mtimeMs = statSync(path).mtimeMs;
    } catch {
        mtimeMs = null;
    }
    return finish(acc, stateOf(acc, mtimeMs, Date.now()));
}

/** Fold one file, reusing the cache entry when it still describes the same file. */
function session(
    found: Found,
    store: string | null,
    cached: CacheEntry | undefined,
    limit: number,
    now: number
): { record: SessionRecord; entry: CacheEntry | null } {
    const tool = toolOf(found.path);
    const empty = accFor(found.path, store, tool);
    let acc: Acc;
    let offset = 0;
    if (cached !== undefined && usable(cached, found)) {
        acc = rehydrate(cached, empty.id, found.path, empty.slug, tool);
        offset = whole(cached.offset);
    } else if (found.size > limit) {
        // Too big to fold inside a scan, and there is no partial state to build on.
        const record = finish(empty, stateOf(empty, found.mtimeMs, now));
        record.truncated = true;
        return { record, entry: null };
    } else {
        acc = empty;
    }
    const consumed = foldInto(acc, found.path, offset);
    prune(acc);
    const entry: CacheEntry = {
        path: found.path,
        size: found.size,
        mtime: found.mtimeMs,
        inode: found.ino,
        offset: offset + consumed,
        acc
    };
    return { record: finish(acc, stateOf(acc, found.mtimeMs, now)), entry };
}

/**
 * Both stores, folded into one list of records, newest activity first. The registry is read once
 * per scan rather than once per record, and so is the Codex process probe; the cache is read once
 * at the start and written once at the end, holding both kinds keyed by path.
 */
export function scan(options: ScanOptions = {}): SessionRecord[] {
    const store = options.store ?? defaultStore();
    const codexStore = options.codexStore ?? defaultCodexStore();
    const windowDays = options.windowDays ?? DEFAULT_WINDOW_DAYS;
    const maxSessions = options.maxSessions ?? DEFAULT_MAX_SESSIONS;
    const cachePath = options.cachePath ?? defaultCachePath();
    const limit = options.maxFirstReadBytes ?? MAX_FIRST_READ_BYTES;
    const now = options.now ?? Date.now();

    const previous = loadCache(cachePath);
    const live = liveSessions(options.registry ?? defaultRegistry(), options.probe ?? systemProbe);
    const dismissed = hiddenIds(options.overridesPath ?? defaultOverridesPath());
    const fresh: Record<string, CacheEntry> = {};
    const found: { record: SessionRecord; mtimeMs: number }[] = [];

    for (const file of claudeTranscripts(store, windowDays, maxSessions)) {
        const folded = fold(file, null, previous[file.path], limit, now);
        if (folded === null) continue;
        mergeLive(folded.record, live.get(folded.record.id), dismissed);
        if (folded.entry !== null) fresh[file.path] = folded.entry;
        found.push({ record: folded.record, mtimeMs: file.mtimeMs });
    }

    let running: boolean | null = null;
    for (const file of codexRollouts(codexStore, windowDays, maxSessions)) {
        const folded = fold(file, codexStore, previous[file.path], limit, now);
        if (folded === null) continue;
        running ??= codexRunning(options.codexProbe ?? systemCodexProbe);
        const entry: LiveEntry | undefined = codexLive(
            folded.record.state,
            file.mtimeMs / 1000,
            running,
            now
        );
        mergeLive(folded.record, entry, dismissed);
        if (folded.entry !== null) fresh[file.path] = folded.entry;
        found.push({ record: folded.record, mtimeMs: file.mtimeMs });
    }

    saveCache(cachePath, previous, fresh);
    found.sort((a, b) => b.mtimeMs - a.mtimeMs);
    return found.map((item) => item.record);
}

/** One file folded, or null when it could not be read at all. */
function fold(
    file: Found,
    store: string | null,
    cached: CacheEntry | undefined,
    limit: number,
    now: number
): { record: SessionRecord; entry: CacheEntry | null } | null {
    try {
        return session(file, store, cached, limit, now);
    } catch {
        return null;
    }
}
