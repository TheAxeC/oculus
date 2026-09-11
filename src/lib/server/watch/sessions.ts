// Layer 2, server. The `sessions` channel: scan both session stores at start, then rescan and
// publish whenever either store changes. DESIGN.md, "Watchers": sessions watches ~/.claude/projects
// (transcripts), ~/.claude/sessions (the registry) and ~/.codex/sessions (the rollouts).
//
// Four handles, one debounce. A transcript is appended to as a session works, so a change there is
// an ordinary .jsonl write; a registry file appears when a session starts, changes when it goes from
// busy to idle, and vanishes when it ends; a rollout appends under YYYY/MM/DD, and a new day makes a
// new folder, which the recursive watch on the store's root sees. The fourth is the overrides file,
// which no session writes: it is api/write's, and without it a dismissal or a pin made on one page
// would not reach another until a transcript happened to change. The byte-offset cache in
// sessions/cache.ts is what makes the rescan cost the appended bytes rather than the whole store.
//
// The 15 s liveness re-check is the fourth thing that can change the payload and the only one no
// file event announces. A process can die without its registry file changing, and a Codex rollout is
// live only while a codex process runs and the file is fresh (sessions/codex.ts, codexLive), so a
// session goes from live to ended with nothing written anywhere. The re-check therefore rescans on a
// timer and publishes only when the set of live ids or one of their states changed, so a quiet
// machine sees no traffic on the channel.

import { watch } from 'node:fs';
import { basename, dirname } from 'node:path';
import type { FSWatcher } from 'node:fs';
import type { SessionRecord, SessionsPayload, Terminal } from '../../data/model.ts';
import type { Hub } from '../channels.ts';
import { sessions } from '../sessions/index.ts';
import { defaultStore } from '../sessions/transcripts.ts';
import { defaultCodexStore, type CodexProbe } from '../sessions/codex.ts';
import { defaultRegistry, type Probe } from '../sessions/registry.ts';
import { defaultOverridesPath } from '../sessions/overrides.ts';
import type { ProjectFolder } from '../sessions/group.ts';
import type { Watcher } from './portfolio.ts';

/** Milliseconds of quiet after the last file event before one rescan runs. */
export const DEBOUNCE = 500;
/** Milliseconds between two liveness re-checks. */
export const LIVENESS = 15000;
export const WINDOW_DAYS = 2;
export const MAX_SESSIONS = 40;

/** What the watcher needs of server/pty/channel.ts's Terminals: the list, and when it changed. */
export type TerminalSource = {
    list(): Terminal[];
    onChange(listener: () => void): () => void;
};

export type SessionsWatchOptions = {
    /** The Claude Code transcript store; O12's default when absent. */
    store?: string;
    /** The Codex CLI rollout store; O12's default when absent. */
    codexStore?: string;
    /** Claude Code's session registry; O12's default when absent. */
    registry?: string;
    /** The byte-offset cache file; O12's default when absent. */
    cache?: string;
    /** The per-session overrides file; O12's default when absent. */
    overrides?: string;
    /** The roots a workspace is looked for under; O12's default when absent. */
    roots?: string[];
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
    /**
     * The tmux terminals of O17. The list is read here at every rescan and the watcher republishes
     * whenever the source says it moved, so a terminal started anywhere appears on the page without
     * the page asking. Absent in a process that has no terminals, where the payload carries none.
     */
    terminals?: TerminalSource;
    /** What the Claude liveness check asks of the system; stubbed by every test. */
    probe?: Probe;
    /** What the Codex liveness check asks of the system; stubbed by every test. */
    codexProbe?: CodexProbe;
};

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
 * Watch both session stores and the registry, and publish on the `sessions` channel. A rescan that
 * throws is written to stderr and the previous payload stands. A store that cannot be watched (it
 * does not exist on this machine, say) is said once on stderr and the others are watched anyway.
 */
export function watchSessions(hub: Hub, options: SessionsWatchOptions = {}): Watcher {
    const debounce = options.debounce ?? DEBOUNCE;
    const liveness = options.liveness ?? LIVENESS;
    const handles: FSWatcher[] = [];
    let timer: ReturnType<typeof setTimeout> | null = null;
    let ticker: ReturnType<typeof setInterval> | null = null;
    let signature: string | null = null;
    let closed = false;

    const read = (): SessionsPayload =>
        sessions({
            store: options.store,
            codexStore: options.codexStore,
            registry: options.registry,
            cachePath: options.cache,
            overridesPath: options.overrides,
            roots: options.roots,
            projectFolders: options.projectFolders?.() ?? [],
            windowDays: options.windowDays ?? WINDOW_DAYS,
            maxSessions: options.maxSessions ?? MAX_SESSIONS,
            probe: options.probe,
            codexProbe: options.codexProbe,
            terminals: options.terminals?.list() ?? []
        });

    const publish = (payload: SessionsPayload): void => {
        signature = liveSignature(payload.records);
        hub.publish('sessions', payload);
    };

    const rescan = (): void => {
        try {
            publish(read());
        } catch (error) {
            console.error(`sessions watch: rescan failed: ${reason(error)}`);
        }
    };

    /** A rescan whose result is published only when a session started, ended or changed state. */
    const recheck = (): void => {
        try {
            const payload = read();
            if (liveSignature(payload.records) === signature) return;
            publish(payload);
        } catch (error) {
            console.error(`sessions watch: liveness re-check failed: ${reason(error)}`);
        }
    };

    const queue = (): void => {
        if (closed) return;
        if (timer !== null) clearTimeout(timer);
        timer = setTimeout(() => {
            timer = null;
            rescan();
        }, debounce);
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
     * The overrides file, watched through its own directory: fs.watch on a file that is replaced by
     * a rename, which is how server/sessions/json.ts writes it, stops seeing the new inode. The
     * watch is not recursive and fires only for that one name, because the transcript cache sits
     * beside it in ~/.oculus and every scan rewrites it, so watching the directory as a whole would
     * make each scan cause the next one.
     */
    const openOverrides = (file: string): void => {
        const name = basename(file);
        try {
            handles.push(
                watch(dirname(file), { recursive: false }, (_event, changed) => {
                    if (changed !== null && String(changed) === name) queue();
                })
            );
        } catch (error) {
            console.error(`sessions watch: cannot watch ${file}: ${reason(error)}`);
        }
    };

    rescan();
    // A terminal starting, stopping or being renamed is a change to the payload and nothing under
    // the three stores moved, so this handle is what carries it to every open page.
    const offTerminals = options.terminals?.onChange(() => queue()) ?? null;
    // The default paths are resolved here rather than held as constants because O12 resolves them
    // at the call, so a process whose home directory differs sees its own three directories.
    open(options.store ?? defaultStore());
    open(options.registry ?? defaultRegistry());
    open(options.codexStore ?? defaultCodexStore());
    // A dismissal or a pin is written by api/write, not by a session, so nothing under the three
    // stores changes and only this handle carries the write to every open page.
    openOverrides(options.overrides ?? defaultOverridesPath());
    if (liveness > 0) {
        ticker = setInterval(recheck, liveness);
        // The re-check must not be the reason a process stays up.
        if (typeof ticker === 'object' && typeof ticker.unref === 'function') ticker.unref();
    }

    return {
        close(): void {
            closed = true;
            if (offTerminals !== null) offTerminals();
            if (timer !== null) clearTimeout(timer);
            timer = null;
            if (ticker !== null) clearInterval(ticker);
            ticker = null;
            for (const handle of handles) handle.close();
            handles.length = 0;
        }
    };
}
