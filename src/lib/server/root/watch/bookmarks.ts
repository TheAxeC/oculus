// Layer 2, server. The bookmark message of the `files` channel: the reader's own bookmarks file,
// watched so a bookmark added or taken away outside oculus reaches an open page.
//
// The page holds the bookmarks as a query answer and marks it stale when a write from the page
// changes them (state/sources/fs.svelte.ts). A write from anywhere else marks nothing, so without
// this handle a bookmark added by hand, by another tool or by a second oculus page waits for the
// next write this page happens to make.
//
// It is the `files` channel rather than one of its own because that channel already carries what
// has changed on the disk under the file browser: a message names a root when a write landed under
// it, and this one names the bookmarks, whatever root their file lies under. A page reads the
// payload and asks again for that one thing, so a write inside a project folder does not re-read
// the bookmarks and a bookmark written by hand does not re-read a tree.
//
// The one file is polled rather than its directory watched. `watchFile` follows creation and
// replacement as well as edits without spending another native directory handle, and the other
// machine-state files beside it can never cause a publish.
//
// The folder is made when it is not there, since there is nothing else to watch: a handle over a
// folder that is not there cannot be opened, and the first bookmark would then be written into a
// folder nothing is watching and reach no other page until the server was started again. It is the
// primary hub's own `.oculus` folder unless the hub's config.yml moves the file, and an empty
// directory is the whole of what is made; the bookmarks file itself is written by the first
// bookmark and not here. A workspace with no primary has no bookmarks file, and nothing is watched.

import { existsSync, mkdirSync, unwatchFile, watchFile } from 'node:fs';
import { dirname } from 'node:path';
import { debounce as debounced } from 'lodash-es';
import type { FilesPayload } from '../../../data/model/index.ts';
import type { Hub } from '../../core/channels.ts';
import type { Watcher } from './portfolio/portfolio.ts';

/**
 * Milliseconds of quiet after the last event before one message is published, the wait of
 * lodash's `debounce`. It is the session watcher's window rather than the portfolio's: a page that
 * writes several bookmarks in a row is one read on every other page instead of one per write, and
 * half a second is no wait for a file the reader edited by hand.
 */
export const DEBOUNCE = 500;
/**
 * Milliseconds the first event of a burst waits at most for its message, lodash's `maxWait`. Each
 * event restarts the quiet, so a file written more often than the quiet (a script rewriting it)
 * would otherwise hold its message back for as long as it is written. Twice the quiet keeps a
 * burst that ends within one quiet to one message.
 */
export const MAX_WAIT = 2 * DEBOUNCE;

export type BookmarksWatchOptions = {
    /**
     * The reader's own bookmarks file, resolved by the caller from the primary hub; null while the
     * workspace has no primary, and then nothing is watched.
     */
    file: string | null;
    /**
     * Milliseconds of quiet after the last event before one message is published. A value longer
     * than MAX_WAIT is the wait, since lodash raises a maximum wait to at least the quiet.
     */
    debounce?: number;
};

function reason(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/**
 * Watch the bookmarks file and publish one message on the `files` channel for each burst of writes
 * to it. The folder is made when it is not there, so the first bookmark written is seen; a folder
 * that can be neither made nor watched is said once on stderr and the server runs without this
 * handle.
 */
export function watchBookmarks(hub: Hub, options: BookmarksWatchOptions): Watcher {
    const { file } = options;
    if (file === null) return { close: () => undefined };
    const debounce = options.debounce ?? DEBOUNCE;
    const folder = dirname(file);
    let closed = false;
    let watching = false;

    const publish = (): void => {
        if (closed) return;
        hub.publish('files', { root: '', bookmarks: true } satisfies FilesPayload);
    };

    const queued = debounced(
        () => {
            publish();
        },
        debounce,
        { maxWait: MAX_WAIT }
    );

    const queue = (): void => {
        if (closed) return;
        queued();
    };

    try {
        if (!existsSync(folder)) mkdirSync(folder, { recursive: true });
        watchFile(
            file,
            { interval: Math.max(20, Math.floor(debounce / 4)), persistent: false },
            queue
        );
        watching = true;
    } catch (error) {
        console.error(`bookmarks watch: cannot watch ${file}: ${reason(error)}`);
    }

    return {
        close(): void {
            closed = true;
            queued.cancel();
            if (watching) unwatchFile(file, queue);
            watching = false;
        }
    };
}
