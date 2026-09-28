// Layer 2, server. Read appended session files and fold each one into a current session record.
//
// Two stores answer to the same shape, each read from every account config/local.yml's `accounts`
// names (sessions/folders.ts): `<dir>/projects/<slug>/<id>.jsonl` of every Claude account, written
// by Claude Code, and `<dir>/sessions/YYYY/MM/DD/rollout-<stamp>-<uuid>.jsonl` of every Codex
// account, written by the Codex CLI. Folders that resolve to one real path are read once. Both are
// line-delimited JSON, so both are read the same way: from the byte offset the cache remembers, up
// to the last complete line, because a trailing line without a newline is a record still being
// written and waits for the next pass.
//
// Nothing here throws. A file that cannot be read is left out and the rest come back.

import { closeSync, fstatSync, openSync, readSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, join } from 'node:path';
import type { LiveEntry, SessionRecord, SessionTool } from '../../../data/model/index.ts';
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
    foldCodex,
    rolloutId,
    rolloutSlug,
    systemCodexProbe,
    type CodexProbe
} from './codex.ts';
import { claudeTranscripts, codexRollouts, isRollout } from '../../transcripts/stores.ts';
import { claudeState, foldClaude } from '../fold.ts';
import { settleBackground } from './background.ts';
import { whole } from '../../core/json.ts';
import { distinctFolders } from '../folders.ts';
import { defaultOverridesPath, hiddenIds } from '../overrides.ts';
import { liveFrom, mergeLive, registryCandidates, systemProbe, type Probe } from '../registry.ts';
import { finish, newAcc, prune, type Acc } from '../record.ts';

export const DEFAULT_WINDOW_DAYS = 2;
export const DEFAULT_MAX_SESSIONS = 40;

/** ~/.oculus/transcript-cache.json, resolved at the call rather than at import. */
export function defaultCachePath(): string {
    return join(homedir(), '.oculus', 'transcript-cache.json');
}

export type ScanOptions = {
    /** The Claude Code transcript folders, `<dir>/projects` of every Claude account. */
    stores?: string[];
    /** The Codex CLI rollout folders, `<dir>/sessions` of every Codex account. */
    codexStores?: string[];
    windowDays?: number;
    maxSessions?: number;
    cachePath?: string;
    /** Claude Code's session registries, `<dir>/sessions` of every Claude account. */
    registries?: string[];
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
    const now = Date.now();
    const record = finish(acc, stateOf(acc, mtimeMs, now));
    settleBackground(acc, record, mtimeMs, now);
    return record;
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
    const record = finish(acc, stateOf(acc, found.mtimeMs, now));
    settleBackground(acc, record, found.mtimeMs, now);
    return { record, entry };
}

/** One transcript found in a store, with the store it was found in (a Codex slug needs it). */
type Located = { file: Found; store: string };

/** Every file of one kind across its folders, newest first, capped as one store is. */
function gather(
    folders: string[],
    list: (store: string) => Found[],
    maxSessions: number
): Located[] {
    const found: Located[] = [];
    for (const store of folders) for (const file of list(store)) found.push({ file, store });
    found.sort((a, b) => b.file.mtimeMs - a.file.mtimeMs);
    return maxSessions ? found.slice(0, maxSessions) : found;
}

/**
 * Every store of every account, folded into one list of records, newest activity first. The
 * registries are read once per scan rather than once per record, and so is the Codex process probe;
 * the cache is read once at the start and written once at the end, holding both kinds keyed by
 * path. With no folders given nothing is read: the folders come from the accounts, never from a
 * home path held here.
 */
export function scan(options: ScanOptions = {}): SessionRecord[] {
    const stores = distinctFolders(options.stores ?? []);
    const codexStores = distinctFolders(options.codexStores ?? []);
    const windowDays = options.windowDays ?? DEFAULT_WINDOW_DAYS;
    const maxSessions = options.maxSessions ?? DEFAULT_MAX_SESSIONS;
    const cachePath = options.cachePath ?? defaultCachePath();
    const limit = options.maxFirstReadBytes ?? MAX_FIRST_READ_BYTES;
    const now = options.now ?? Date.now();

    const previous = loadCache(cachePath);
    const probe = options.probe ?? systemProbe;
    const candidates = registryCandidates(options.registries ?? [], probe);
    const starts = probe.starts(candidates.map((entry) => entry.pid));
    const live = liveFrom(candidates, starts);
    const dismissed = hiddenIds(options.overridesPath ?? defaultOverridesPath());
    const fresh: Record<string, CacheEntry> = {};
    const found: { record: SessionRecord; mtimeMs: number }[] = [];
    let running: boolean | null = null;

    /** Fold one file, merge its liveness, and keep it. */
    const take = (file: Found, store: string, tool: SessionTool): void => {
        const folded = fold(file, tool === 'codex' ? store : null, previous[file.path], limit, now);
        if (folded === null) return;
        let entry: LiveEntry | undefined;
        if (tool === 'codex') {
            running ??= codexRunning(options.codexProbe ?? systemCodexProbe);
            entry = codexLive(folded.record.state, file.mtimeMs / 1000, running, now);
        } else {
            entry = live.get(folded.record.id);
        }
        mergeLive(folded.record, entry, dismissed);
        if (folded.entry !== null) fresh[file.path] = folded.entry;
        found.push({ record: folded.record, mtimeMs: file.mtimeMs });
    };

    const claude = (store: string): Found[] => claudeTranscripts(store, windowDays, maxSessions);
    for (const { file, store } of gather(stores, claude, maxSessions)) take(file, store, 'claude');
    const codex = (store: string): Found[] => codexRollouts(store, windowDays, maxSessions);
    for (const { file, store } of gather(codexStores, codex, maxSessions)) {
        take(file, store, 'codex');
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
