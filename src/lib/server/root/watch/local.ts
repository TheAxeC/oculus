// Layer 2, server. The watch on the machine's own config/local.yml, so an account row added or
// removed by hand reaches the routes and the pollers without a restart, as a row the Calendar or
// the Inbox adds does.
//
// It watches the config folder rather than the file: every write oculus makes replaces the file by
// a rename, and an editor saves the same way, so a watch on the file itself would be left on the
// file that was replaced. An event for any other name in the folder is not this watcher's; the
// portfolio watcher (watch/portfolio.ts) owns the config push. A burst of events is one call after
// a short quiet, since a save is several events on darwin; the quiet is lodash's `debounce`, which
// also calls at the maximum wait when events never leave a quiet.

import { existsSync, watch, type FSWatcher } from 'node:fs';
import { debounce as debounced } from 'lodash-es';
import { LOCAL_NAME, configDir } from '../../../data/sources/config.ts';

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
