// Layer 2, server. The `sessions` channel: scan the session stores at start, then rescan whenever
// one changes and publish what differs from what stands on the channel. It watches, for every
// account the `accounts` of the hubs' `.oculus/local.yml` files name, `<dir>/projects`
// (transcripts) and `<dir>/sessions` (the registry) of each Claude account and `<dir>/sessions`
// (the rollouts) of each Codex account, every folder once by its real path (sessions/folders.ts).
//
// Every scan runs in a worker thread held here (machine/threads/held.ts), at most one at a time and
// one waiting, so the server's thread reads no store, runs no `ps` and parses no cache file. The
// hooks and the terminals are put on its answer here, so a hook that arrives while a scan runs is
// on the record it publishes. A scan that fails is written to stderr and the previous payload
// stands.
//
// One debounce over every handle, lodash's `debounce` with a quiet (DEBOUNCE) and a maximum wait
// (MAX_WAIT). A transcript is appended to as a session works, so a change there is an ordinary
// .jsonl write, and a working session writes more often than the quiet, which every write restarts;
// the maximum wait is what still publishes a terminal started, renamed or ended, and the session's
// own records, while it works. A registry file appears when a session starts, changes when it goes
// from busy to idle, and vanishes when it ends; a rollout appends under YYYY/MM/DD, and a new day
// makes a new folder, which the recursive watch on the store's root sees. One more is a file no
// session writes: the overrides file, which is api/write's, and without it a dismissal or a pin
// made on one page would not reach another until a transcript happened to change. The byte-offset
// cache in sessions/cache.ts is what makes the rescan cost the appended bytes rather than the
// whole store, and the worker keeps the latest record stamp of each subagent's transcript
// (sessions/stores/stamps.ts), so such a file is read again only when its size or time moved.
//
// The 15 s liveness re-check covers the changes to the payload no file event announces. A process
// can die without its registry file changing, and a Codex rollout is live only while a codex
// process runs and the file is fresh (sessions/stores/codex.ts, codexLive), so a session goes from
// live to ended with nothing written anywhere. The re-check therefore rescans on a timer and
// publishes only when the set of live ids or one of their states changed, so a quiet machine sees
// no traffic on the channel.
//
// The slow clock beside it is a full rescan every few minutes whatever the events said. A write
// that lands while a watch is being opened is announced to nobody, and a re-check that sees the
// same live ids in the same states publishes nothing for it, so without the clock those bytes wait
// for the next write.

import { watch } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import type { FSWatcher } from 'node:fs';
import { debounce as debounced } from 'lodash-es';
import type { SessionRecord, SessionsPayload, Terminal } from '../../../data/model/index.ts';
import type { Hub } from '../../core/channels.ts';
import { ownFolder } from '../../machine/lsp/servers.ts';
import { HeldWorker } from '../../machine/threads/held.ts';
import { distinctFolders } from '../../sessions/folders.ts';
import { defaultOverridesPath } from '../../sessions/overrides.ts';
import type { ProjectFolder } from '../../sessions/group.ts';
import {
    samePayload,
    Scanned,
    sessionsDifference,
    type ScanAnswer,
    type ScanAsk
} from '../../sessions/stores/changes.ts';
import { HookStore } from '../../sessions/stores/hooks.ts';
import type { Watcher } from './portfolio/portfolio.ts';

/** Milliseconds of quiet after the last file event before one rescan runs. */
export const DEBOUNCE = 500;
/**
 * Milliseconds the first event of a burst waits at most for its rescan, however often events keep
 * coming. A session that is working appends to its transcript many times a second and each append
 * restarts the quiet, so without a maximum wait neither a terminal started, renamed or ended nor
 * the session's own records would be published for as long as it works. Twice the quiet keeps a
 * burst that ends within one quiet to one rescan, and writes that never stop cost about one rescan
 * a second.
 */
export const MAX_WAIT = 2 * DEBOUNCE;
/** Milliseconds between two liveness re-checks. */
export const LIVENESS = 15000;
/**
 * Milliseconds between two full rescans that run whether or not a file event came. fs.watch can
 * miss a write that lands in the moment a watch is being opened, and a store whose only change was
 * that write would then stay unread until the next one: the liveness re-check publishes nothing for
 * it, since a session that was already live with the same state has the same signature. Five
 * minutes is slow enough to cost nothing on a quiet machine and short enough that a missed event is
 * not what a page shows for the rest of the day.
 */
export const RESCAN = 300000;
export const WINDOW_DAYS = 2;
export const MAX_SESSIONS = 40;

/**
 * What the watcher needs of server/machine/pty/channel.ts's Terminals: the list, null until tmux
 * has answered once, and when it changed.
 */
export type TerminalSource = {
    list(): Terminal[] | null;
    onChange: (listener: () => void) => () => void;
};

export type SessionsWatchOptions = {
    /**
     * The Claude Code transcript folders, `<dir>/projects` of every Claude account
     * (sessions/folders.ts's sessionFolders); none read when absent.
     */
    stores?: string[];
    /** The Codex CLI rollout folders, `<dir>/sessions` of every Codex account. */
    codexStores?: string[];
    /** Claude Code's session registries, `<dir>/sessions` of every Claude account. */
    registries?: string[];
    /** The byte-offset cache file; `defaultCachePath()` when absent. */
    cache?: string;
    /** The per-session overrides file; `defaultOverridesPath()` when absent. */
    overrides?: string;
    /**
     * The folders a workspace is looked for under, the machine's `sessions_roots`; none when it is
     * absent.
     */
    roots?: readonly string[];
    /**
     * Every project folder with its title, read again at every rescan. It is a function rather than
     * a list so the watcher follows the portfolio's latest snapshot without importing the portfolio
     * watcher: the two meet on the hub, not on each other.
     */
    projectFolders?: () => ProjectFolder[];
    windowDays?: number;
    maxSessions?: number;
    debounce?: number;
    /** Milliseconds between liveness re-checks; 0 turns the re-check off. */
    liveness?: number;
    /** Milliseconds between full rescans that no event asked for; 0 turns the clock off. */
    rescanEvery?: number;
    /**
     * The tmux terminals. The list is read here at every rescan and the watcher republishes
     * whenever the source says it moved, so a terminal started anywhere appears on the page without
     * the page asking. When this option is absent (a process with no terminals), and while the
     * source has read no list yet, the payload carries no `terminals` field at all.
     */
    terminals?: TerminalSource;
    /** The request hook store owned by ServerContext. */
    hooks?: HookStore;
};

export type SessionsWatcher = Watcher & {
    /** Subscribe to the rescans of this watcher that published a change. */
    onChange: (listener: () => void) => () => void;
};

/**
 * Why a scan was asked for: a file event or the start (`rescan`), the slow clock, or the liveness
 * re-check.
 */
type ScanKind = 'rescan' | 'clock' | 'recheck';

/** The kinds from the weakest rule to the strongest, which a scan asked for by several runs by. */
const KINDS: ScanKind[] = ['recheck', 'clock', 'rescan'];

/** What the liveness re-check compares: every live session's id and the state it is in. */
export function liveSignature(records: SessionRecord[]): string {
    const parts: string[] = [];
    for (const record of records) {
        if (!record.live) continue;
        parts.push(`${record.id}:${record.state}:${record.liveStatus ?? ''}`);
    }
    return parts.sort().join('|');
}

function reason(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/**
 * Watch every account's session stores and registry, and publish on the `sessions` channel, whose
 * messages it has the hub send as what changed. The first publish comes when the first scan has
 * answered. A store that cannot be watched (it does not exist on this machine, say) is said once on
 * stderr and the others are watched anyway.
 */
export function watchSessions(hub: Hub, options: SessionsWatchOptions = {}): SessionsWatcher {
    const debounce = options.debounce ?? DEBOUNCE;
    const liveness = options.liveness ?? LIVENESS;
    const rescanEvery = options.rescanEvery ?? RESCAN;
    const handles: FSWatcher[] = [];
    const changeListeners = new Set<() => void>();
    let ticker: ReturnType<typeof setInterval> | null = null;
    let clock: ReturnType<typeof setInterval> | null = null;
    const hooks = options.hooks ?? new HookStore();
    let signature: string | null = null;
    let closed = false;

    const standing = (): SessionsPayload | undefined =>
        hub.latest('sessions')?.payload as SessionsPayload | undefined;
    const scanned = new Scanned(standing());

    const request = (): ScanAsk => ({
        stores: options.stores,
        codexStores: options.codexStores,
        registries: options.registries,
        cachePath: options.cache,
        overridesPath: options.overrides,
        roots: [...(options.roots ?? [])],
        projectFolders: options.projectFolders?.() ?? [],
        windowDays: options.windowDays ?? WINDOW_DAYS,
        maxSessions: options.maxSessions ?? MAX_SESSIONS
    });

    /**
     * Publish what a scan found. A rescan, whatever asked for it, publishes what is not what stands
     * on the channel and tells the listeners; a re-check publishes when a session started, ended or
     * changed state and tells nobody. So a quiet machine sees no traffic.
     */
    const answered = (answer: ScanAnswer, kind: ScanKind): void => {
        scanned.take(answer);
        const before = standing();
        const terminals = options.terminals === undefined ? null : options.terminals.list();
        const payload = scanned.payload(before, hooks, Date.now(), terminals);
        const live = liveSignature(payload.records);
        if (kind === 'recheck') {
            if (live === signature) return;
            signature = live;
            hub.publish('sessions', payload);
            return;
        }
        signature = live;
        if (before !== undefined && samePayload(before, payload)) return;
        hub.publish('sessions', payload);
        for (const listener of changeListeners) listener();
    };

    const scans = new HeldWorker<ScanKind, ScanAsk, ScanAnswer>({
        file: join(ownFolder(), 'src/lib/server/machine/threads/scan-worker.ts'),
        request,
        join: (waiting, next) => (KINDS.indexOf(next) > KINDS.indexOf(waiting) ? next : waiting),
        answered,
        failed: (why, kind) => {
            const what = kind === 'recheck' ? 'liveness re-check' : 'rescan';
            console.error(`sessions watch: ${what} failed: ${why}`);
        }
    });
    hub.difference('sessions', sessionsDifference);

    const queued = debounced(
        () => {
            void scans.ask('rescan');
        },
        debounce,
        { maxWait: MAX_WAIT }
    );

    const queue = (): void => {
        if (closed) return;
        queued();
    };

    const open = (dir: string | undefined): void => {
        if (dir === undefined || dir === '') return;
        try {
            handles.push(watch(dir, { recursive: true }, () => queue()));
        } catch (error) {
            console.error(`sessions watch: cannot watch ${dir}: ${reason(error)}`);
        }
    };

    /**
     * The overrides file, watched through its own directory: fs.watch on a file that is replaced
     * by a rename, which is how server/core/json.ts writes it, stops seeing the new inode. One
     * watch per directory, not recursive, firing only for the names asked for, because the
     * transcript cache sits beside it in ~/.oculus and a scan that read something writes it, so
     * watching the directory as a whole would make each such scan cause the next one.
     */
    const openFiles = (files: string[]): void => {
        const names = new Map<string, Set<string>>();
        for (const file of files) {
            const folder = dirname(file);
            const held = names.get(folder) ?? new Set<string>();
            held.add(basename(file));
            names.set(folder, held);
        }
        for (const [folder, wanted] of names) {
            try {
                handles.push(
                    watch(folder, { recursive: false }, (_event, changed) => {
                        if (changed !== null && wanted.has(changed)) queue();
                    })
                );
            } catch (error) {
                console.error(`sessions watch: cannot watch ${folder}: ${reason(error)}`);
            }
        }
    };

    void scans.ask('rescan');
    // A terminal starting, stopping or being renamed is a change to the payload and nothing under
    // the stores moved, so this handle is what carries it to every open page.
    const offTerminals = options.terminals?.onChange(() => queue()) ?? null;
    // Every account's folders, each once by its real path, so two accounts sharing a folder through
    // a symlink do not make one write announce itself twice.
    for (const folder of distinctFolders([
        ...(options.stores ?? []),
        ...(options.registries ?? []),
        ...(options.codexStores ?? [])
    ])) {
        open(folder);
    }
    // A dismissal or a pin is written by something other than a session, so nothing under the
    // stores changes and only this handle carries the write to every open page. The default path is
    // resolved at the call, so a process whose home directory differs sees its own.
    openFiles([options.overrides ?? defaultOverridesPath()]);
    if (liveness > 0) {
        ticker = setInterval(() => {
            void scans.ask('recheck');
        }, liveness);
        // The re-check must not be the reason a process stays up.
        if (typeof ticker === 'object' && typeof ticker.unref === 'function') ticker.unref();
    }
    if (rescanEvery > 0) {
        clock = setInterval(() => {
            void scans.ask('clock');
        }, rescanEvery);
        if (typeof clock === 'object' && typeof clock.unref === 'function') clock.unref();
    }

    return {
        onChange(listener: () => void): () => void {
            changeListeners.add(listener);
            return () => changeListeners.delete(listener);
        },
        close(): void {
            closed = true;
            if (offTerminals !== null) offTerminals();
            queued.cancel();
            if (ticker !== null) clearInterval(ticker);
            ticker = null;
            if (clock !== null) clearInterval(clock);
            clock = null;
            for (const handle of handles) handle.close();
            handles.length = 0;
            scans.close();
            changeListeners.clear();
        }
    };
}
