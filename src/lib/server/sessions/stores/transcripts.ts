// Layer 2, server. Read appended session files and fold each one into a current session record.
//
// Two stores answer to the same shape, each read from every account the `accounts` of the hubs'
// `.oculus/local.yml` files name (sessions/folders.ts): `<dir>/projects/<slug>/<id>.jsonl` of every
// Claude account, written by Claude Code, and
// `<dir>/sessions/YYYY/MM/DD/rollout-<stamp>-<uuid>.jsonl` of every Codex account, written by the
// Codex CLI. Folders that resolve to one real path are read once. Both are line-delimited JSON, so
// both are read the same way: from the byte offset the cache remembers, up to the last complete
// line, because a trailing line without a newline is a record still being written and waits for the
// next pass.
//
// Nothing here throws. A file that cannot be read is left out and the rest come back.

import { constants } from 'node:buffer';
import { closeSync, fstatSync, openSync, readSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, join } from 'node:path';
import type { LiveEntry, SessionRecord, SessionTool } from '../../../data/model/index.ts';
import {
    MAX_FIRST_READ_BYTES,
    loadCache,
    readerDigest,
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
import { isMap } from '../../core/json.ts';
import { claudeTranscripts, codexRollouts, isRollout } from '../../transcripts/stores.ts';
import { claudeState, foldClaude } from '../fold.ts';
import { settleAgentFiles, settleBackground } from './background.ts';
import { createStamps, type Stamps } from './stamps.ts';
import { distinctFolders } from '../folders.ts';
import { defaultOverridesPath, hiddenIds } from '../overrides.ts';
import { liveFrom, mergeLive, registryCandidates, systemProbe, type Probe } from '../registry.ts';
import { finish, newAcc, prune, type Acc } from '../record.ts';
import { USAGE_PREFIX } from '../../transcripts/names.ts';

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
    /**
     * The latest record stamps of the subagents' transcripts, kept across the scans of one watch so
     * an unchanged file is not read again; a scan without them reads each file once.
     */
    stamps?: Stamps;
};

/** The bytes `foldFrom` reads at a time. */
const PIECE_BYTES = 8 * 1024 * 1024;

/**
 * Fold every complete line from `offset` and return the bytes consumed, up to the last line feed
 * read. The offset is in bytes. The file is read in pieces of `piece` bytes (`PIECE_BYTES`; a
 * caller passes a smaller size to read a short file in several), and each complete line is decoded
 * alone, so a multi-byte character split across the end of a piece is never cut in half and no
 * decode is larger than one line. A line longer than `limit` bytes (Node's longest string,
 * `buffer.constants.MAX_STRING_LENGTH`; a caller passes a smaller one to test the skip) cannot be
 * decoded: it is skipped and its bytes count as consumed, so the read goes past it. A failure
 * after some lines answers the bytes consumed up to it.
 */
export function foldFrom(
    path: string,
    offset: number,
    apply: (record: Record<string, unknown>) => void,
    piece: number = PIECE_BYTES,
    limit: number = constants.MAX_STRING_LENGTH
): number {
    let handle: number;
    try {
        handle = openSync(path, 'r');
    } catch {
        return 0;
    }
    let consumed = 0;
    try {
        const size = fstatSync(handle).size;
        if (size <= offset) return 0;
        const buffer = Buffer.allocUnsafe(Math.min(piece, size - offset));
        /** The start of the line being read, copied out of the earlier pieces. */
        let carry: Buffer[] = [];
        let carried = 0;
        /** Set once the line being read passes the longest decodable line; its bytes drop. */
        let skipping = false;
        let position = offset;
        while (position < size) {
            const got = readSync(
                handle,
                buffer,
                0,
                Math.min(buffer.length, size - position),
                position
            );
            if (got <= 0) break;
            const chunk = buffer.subarray(0, got);
            let start = 0;
            for (;;) {
                const end = chunk.indexOf(0x0a, start);
                if (end < 0) {
                    const rest = chunk.subarray(start);
                    carried += rest.length;
                    if (carried > limit) {
                        skipping = true;
                        carry = [];
                    } else if (!skipping) {
                        carry.push(Buffer.from(rest));
                    }
                    break;
                }
                const tail = chunk.subarray(start, end);
                if (!skipping && carried + tail.length <= limit) {
                    foldLine(carry.length === 0 ? tail : Buffer.concat([...carry, tail]), apply);
                }
                carry = [];
                carried = 0;
                skipping = false;
                consumed = position + end + 1 - offset;
                start = end + 1;
            }
            position += got;
        }
        return consumed;
    } catch {
        return consumed;
    } finally {
        closeSync(handle);
    }
}

/** Parse one line as JSON and hand it on when it is a map; a blank or broken line is skipped. */
function foldLine(bytes: Buffer, apply: (record: Record<string, unknown>) => void): void {
    const line = bytes.toString('utf8');
    if (line.trim() === '') return;
    let parsed: unknown;
    try {
        parsed = JSON.parse(line) as unknown;
    } catch {
        return;
    }
    if (isMap(parsed)) apply(parsed);
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
    settleBackground(acc, record, now, createStamps());
    settleAgentFiles(acc, record);
    return record;
}

/** One file folded: its record, its cache entry, and whether a usage refresh started it. */
type Folded = { record: SessionRecord; entry: CacheEntry | null; usage: boolean };

/**
 * Whether a session was started by the usage refresher, which names its sessions with
 * `USAGE_PREFIX`; such a session is spend on the account and no session of the reader's.
 */
function startedByUsage(acc: Acc): boolean {
    return acc.agentName?.startsWith(USAGE_PREFIX) === true;
}

/** Fold one file, reusing the cache entry when it still describes the same file. */
function session(
    found: Found,
    store: string | null,
    cached: CacheEntry | undefined,
    limit: number,
    now: number,
    stamps: Stamps
): Folded {
    const tool = toolOf(found.path);
    const empty = accFor(found.path, store, tool);
    let acc: Acc;
    let offset = 0;
    if (cached !== undefined && usable(cached, found)) {
        acc = rehydrate(cached, empty.id, found.path, empty.slug, tool);
        offset = Math.trunc(cached.offset);
    } else if (found.size > limit) {
        // Too big to fold inside a scan, and there is no partial state to build on.
        const record = finish(empty, stateOf(empty, found.mtimeMs, now));
        record.truncated = true;
        return { record, entry: null, usage: false };
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
    settleBackground(acc, record, now, stamps);
    settleAgentFiles(acc, record);
    return { record, entry, usage: startedByUsage(acc) };
}

/** One transcript found in a store, with the store it was found in (a Codex slug needs it). */
type Located = { file: Found; store: string };

/** Every file of one kind across its folders, newest first; files of one mtime by path. */
function gather(folders: string[], list: (store: string) => Found[]): Located[] {
    const found: Located[] = [];
    for (const store of folders) for (const file of list(store)) found.push({ file, store });
    found.sort((a, b) => b.file.mtimeMs - a.file.mtimeMs || (a.file.path < b.file.path ? -1 : 1));
    return found;
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
    const stamps = options.stamps ?? createStamps();

    const version = readerDigest();
    const previous = loadCache(cachePath, version);
    const probe = options.probe ?? systemProbe;
    const candidates = registryCandidates(options.registries ?? [], probe);
    const starts = probe.starts(candidates.map((entry) => entry.pid));
    const live = liveFrom(candidates, starts);
    const dismissed = hiddenIds(options.overridesPath ?? defaultOverridesPath());
    const fresh: Record<string, CacheEntry> = {};
    const found: { record: SessionRecord; mtimeMs: number }[] = [];
    let running: boolean | null = null;

    /**
     * Fold one file, merge its liveness, and keep it; false for a file that could not be read and
     * for a session a usage refresh started, which the cache still remembers.
     */
    const take = (file: Found, store: string, tool: SessionTool): boolean => {
        const folded = fold(
            file,
            tool === 'codex' ? store : null,
            previous[file.path],
            limit,
            now,
            stamps
        );
        if (folded === null) return false;
        if (folded.entry !== null) fresh[file.path] = folded.entry;
        if (folded.usage) return false;
        let entry: LiveEntry | undefined;
        if (tool === 'codex') {
            running ??= codexRunning(options.codexProbe ?? systemCodexProbe);
            entry = codexLive(folded.record.state, file.mtimeMs / 1000, running, now);
        } else {
            entry = live.get(folded.record.id);
        }
        mergeLive(folded.record, entry, dismissed);
        found.push({ record: folded.record, mtimeMs: file.mtimeMs });
        return true;
    };

    /**
     * Take the newest files of one kind until `maxSessions` of them are kept. Each store is walked
     * once, every file in the window listed newest first, and the files are folded in that order,
     * so a session a usage refresh started or a file that could not be read is passed over without
     * another walk of the stores.
     */
    const takeNewest = (
        folders: string[],
        list: (store: string) => Found[],
        tool: SessionTool
    ): void => {
        let kept = 0;
        for (const { file, store } of gather(folders, list)) {
            if (take(file, store, tool)) kept += 1;
            if (maxSessions && kept >= maxSessions) return;
        }
    };

    takeNewest(stores, (store) => claudeTranscripts(store, windowDays, 0), 'claude');
    takeNewest(codexStores, (store) => codexRollouts(store, windowDays, 0), 'codex');

    saveCache(cachePath, version, previous, fresh);
    found.sort((a, b) => b.mtimeMs - a.mtimeMs);
    return found.map((item) => item.record);
}

/** One file folded, or null when it could not be read at all. */
function fold(
    file: Found,
    store: string | null,
    cached: CacheEntry | undefined,
    limit: number,
    now: number,
    stamps: Stamps
): Folded | null {
    try {
        return session(file, store, cached, limit, now, stamps);
    } catch {
        return null;
    }
}
