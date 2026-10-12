// Layer 2, server. The watch on the machine's own `.oculus/local.yml` of every hub the open
// workspace lists. It carries every key: a write of a file, by hand or from the page, reaches the
// context, which reads the files again, holds every key at once and builds again the watchers made
// from a key that changed. This module is the watch itself and the two pure answers the context
// needs after a read: which keys differ from the ones in force, and which watchers those keys are
// the inputs of. A move of the primary hub is a key of its own (`workspace`), so the watchers built
// from the primary hub's files (the bookmarks, the schedules and the usage refresh) are built again
// with the keys that name them; the portfolio, the git watch and the other parts that read the
// folders follow the workspace through their own subscription.
//
// It watches each hub's `.oculus` folder rather than the file: every write oculus makes replaces
// the file by a rename, and an editor saves the same way, so a watch on the file itself would be
// left on the file that was replaced. An event for any other name in the folder is not this
// watcher's. A burst of events is one call after a short quiet, since a save is several events on
// darwin; the quiet is lodash's `debounce`, which also calls at the maximum wait when events never
// leave a quiet. The context closes the watch and makes another when the workspace moves.

import { existsSync, watch, type FSWatcher } from 'node:fs';
import { join } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { debounce as debounced } from 'lodash-es';
import { ROOT_FOLDER } from '../../../data/helpers/hub-names.ts';
import { LOCAL_NAME, type LocalConfig } from '../../../data/sources/config.ts';

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

/**
 * Watch the `.oculus` folder of each hub and call `changed` when a local.yml was written or
 * removed.
 */
export function watchLocal(
    hubs: readonly string[],
    changed: () => void,
    options: LocalWatchOptions = {}
): LocalWatcher {
    const debounce = options.debounce ?? DEBOUNCE;
    const queued = debounced(
        () => {
            changed();
        },
        debounce,
        { maxWait: MAX_WAIT }
    );
    let closed = false;
    const handles: FSWatcher[] = [];
    for (const hub of hubs) {
        const folder = join(hub, ROOT_FOLDER);
        if (!existsSync(folder)) continue;
        try {
            handles.push(
                watch(folder, { recursive: false }, (_event, filename) => {
                    if (closed || filename !== LOCAL_NAME) return;
                    queued();
                })
            );
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            console.error(`local watch: cannot watch ${folder}: ${reason}`);
        }
    }
    return {
        close(): void {
            closed = true;
            queued.cancel();
            for (const handle of handles) handle.close();
            handles.length = 0;
        }
    };
}

/**
 * A key a change can name: a key of the machine's own values, or `workspace`, a move of the open
 * workspace's primary hub, which is no key of any file.
 */
export type ChangedKey = keyof LocalConfig | 'workspace';

/** Every key of the machine's own values, as the context holds it. */
const FIELDS: (keyof LocalConfig)[] = [
    'port',
    'hpcHost',
    'sessionsCache',
    'sessionsOverrides',
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

/** Every key a change can name. */
const ALL_KEYS: ChangedKey[] = [...FIELDS, 'workspace'];

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
const BUILT_FROM: Partial<Record<ChangedKey, WatcherName[]>> = {
    workspace: ['usageRefresh', 'bookmarks', 'schedules'],
    accounts: ['sessions', 'usageRefresh'],
    sessionsCache: ['sessions'],
    sessionsOverrides: ['sessions'],
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
export function rebuiltBy(changed: readonly ChangedKey[]): Record<WatcherName, boolean> {
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
export function keysBuilding(name: WatcherName): ChangedKey[] {
    return ALL_KEYS.filter((key) => rebuiltBy([key])[name]);
}
