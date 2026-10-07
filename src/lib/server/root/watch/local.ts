// Layer 2, server. The watch on the machine's own config/local.yml. It carries every key: a write
// of the file, by hand or from the page, reaches the context, which reads the file again, holds
// every key at once and builds again the watchers made from a key that changed. This module is the
// watch itself and the two pure answers the context needs after a read: which keys differ from the
// ones in force, and which watchers those keys are the inputs of.
//
// It watches the config folder rather than the file: every write oculus makes replaces the file by
// a rename, and an editor saves the same way, so a watch on the file itself would be left on the
// file that was replaced. An event for any other name in the folder is not this watcher's; the
// portfolio watcher (watch/portfolio.ts) owns the config push. A burst of events is one call after
// a short quiet, since a save is several events on darwin; the quiet is lodash's `debounce`, which
// also calls at the maximum wait when events never leave a quiet.

import { existsSync, watch, type FSWatcher } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { debounce as debounced } from 'lodash-es';
import { LOCAL_NAME, configDir, type LocalConfig } from '../../../data/sources/config.ts';

export type LocalWatchOptions = {
    /**
     * Milliseconds of quiet after the last event before the call. A value longer than MAX_WAIT is
     * the wait, since lodash raises a maximum wait to at least the quiet.
     */
    debounce?: number;
};

export type LocalWatcher = { close(): void };

/** Milliseconds of quiet after the last event before the call. */
export const DEBOUNCE = 200;
/**
 * Milliseconds the first event of a burst waits at most for its call, however often events keep
 * coming. Each event restarts the quiet, so a config folder written without a pause would
 * otherwise hold a changed local.yml back for as long as it is written. Twice the quiet keeps a
 * burst that ends within one quiet to one call.
 */
export const MAX_WAIT = 2 * DEBOUNCE;

/** Watch the engine's config folder and call `changed` when local.yml was written or removed. */
export function watchLocal(
    engine: string,
    changed: () => void,
    options: LocalWatchOptions = {}
): LocalWatcher {
    const debounce = options.debounce ?? DEBOUNCE;
    const folder = configDir(engine);
    const queued = debounced(
        () => {
            changed();
        },
        debounce,
        { maxWait: MAX_WAIT }
    );
    let closed = false;
    let handle: FSWatcher | null = null;
    if (existsSync(folder)) {
        try {
            handle = watch(folder, { recursive: false }, (_event, filename) => {
                if (closed || filename !== LOCAL_NAME) return;
                queued();
            });
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            console.error(`local watch: cannot watch ${folder}: ${reason}`);
        }
    }
    return {
        close(): void {
            closed = true;
            queued.cancel();
            handle?.close();
            handle = null;
        }
    };
}

/** Every key of the machine's own values, as the context holds it. */
const FIELDS: (keyof LocalConfig)[] = [
    'hub',
    'port',
    'hpcHost',
    'sessionsCache',
    'sessionsOverrides',
    'workspaces',
    'bookmarks',
    'notes',
    'changes',
    'history',
    'approvals',
    'lsp',
    'schedules',
    'scheduleRecord',
    'claudeBin',
    'openBin',
    'riteDapBin',
    'accounts',
    'calendars',
    'calendarDir',
    'appsDir',
    'mail',
    'mailDir',
    'literature'
];

/** The keys whose value in `next` differs from the one in `held`. */
export function changedKeys(held: LocalConfig, next: LocalConfig): (keyof LocalConfig)[] {
    return FIELDS.filter((key) => !isDeepStrictEqual(held[key], next[key]));
}

/** The watchers the context builds from local.yml, in the order they are built. */
export const WATCHERS = [
    'portfolio',
    'sessions',
    'usageRefresh',
    'usage',
    'git',
    'autofetch',
    'bookmarks',
    'schedules'
] as const;
export type WatcherName = (typeof WATCHERS)[number];

/** The watchers built directly from a key; the ones built from those follow in `rebuiltBy`. */
const BUILT_FROM: Partial<Record<keyof LocalConfig, WatcherName[]>> = {
    hub: ['portfolio', 'usageRefresh', 'git'],
    accounts: ['sessions', 'usageRefresh'],
    sessionsCache: ['sessions'],
    sessionsOverrides: ['sessions'],
    workspaces: ['git'],
    bookmarks: ['bookmarks'],
    schedules: ['schedules'],
    scheduleRecord: ['schedules'],
    claudeBin: ['usageRefresh']
};

/**
 * The watchers to build again for these changed keys. The usage watcher holds the sessions
 * watcher's change signal and the usage refresh's state, and the auto fetch reads the git watcher's
 * channel when it starts, so each is built again with what it is built from.
 */
export function rebuiltBy(changed: readonly (keyof LocalConfig)[]): Record<WatcherName, boolean> {
    const direct = new Set(changed.flatMap((key) => BUILT_FROM[key] ?? []));
    return {
        portfolio: direct.has('portfolio'),
        sessions: direct.has('sessions'),
        usageRefresh: direct.has('usageRefresh'),
        usage: direct.has('usage') || direct.has('sessions') || direct.has('usageRefresh'),
        git: direct.has('git'),
        autofetch: direct.has('autofetch') || direct.has('git'),
        bookmarks: direct.has('bookmarks'),
        schedules: direct.has('schedules')
    };
}

/** The keys whose change builds this watcher again, directly or through its sources. */
export function keysBuilding(name: WatcherName): (keyof LocalConfig)[] {
    return FIELDS.filter((key) => rebuiltBy([key])[name]);
}
