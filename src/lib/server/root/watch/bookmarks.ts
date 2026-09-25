// Layer 2, server. The bookmark message of the `files` channel: the reader's own bookmarks file,
// watched so a bookmark added or taken away outside oculus reaches an open page.
//
// The page holds the bookmarks for a round and asks for them again when a write from the page moves
// that round on (state/sources/fs.svelte.ts). A write from anywhere else moves nothing, so without
// this handle a bookmark added by hand, by another tool or by a second oculus page waits for the
// next write this page happens to make, and the Files view's close of a form over a bookmark that
// is gone waits with it.
//
// It is the `files` channel rather than one of its own because that channel already carries what
// has changed on the disk under the file browser: a message names a root when a write landed under
// it, and this one names the bookmarks, which lie under no root. A page reads the payload and asks
// again for that one thing, so a write inside a project folder does not re-read the bookmarks and a
// bookmark written by hand does not re-read a tree.
//
// The one file is polled rather than its directory watched. `watchFile` follows creation and
// replacement as well as edits without spending another native directory handle, and the other
// machine-state files beside it can never cause a publish.
//
// The folder is made when the machine has none, since there is nothing else to watch: a handle over
// a folder that is not there cannot be opened, and the first bookmark would then be written into a
// folder nothing is watching and reach no other page until the server was started again. It is
// oculus's own folder for this machine's state, and an empty directory is the whole of what is
// made; the bookmarks file itself is written by the first bookmark and not here.

import { existsSync, mkdirSync, unwatchFile, watchFile } from 'node:fs';
import { dirname } from 'node:path';
import type { FilesPayload } from '../../../data/model/index.ts';
import type { Hub } from '../../core/channels.ts';
import type { Watcher } from './portfolio.ts';

/**
 * Milliseconds of quiet after the last event before one message is published. It is the session
 * watcher's window rather than the portfolio's: a page that writes several bookmarks in a row is
 * one read on every other page instead of one per write, and half a second is no wait for a file
 * the reader edited by hand.
 */
export const DEBOUNCE = 500;

export type BookmarksWatchOptions = {
    /** The reader's own bookmarks file; the machine's own path is resolved by the caller. */
    file: string;
    /** Milliseconds of quiet after the last event before one message is published. */
    debounce?: number;
};

function reason(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/**
 * Watch the bookmarks file and publish one message on the `files` channel for each burst of writes
 * to it. The folder is made when the machine has none, so the first bookmark written is seen; a
 * folder that can be neither made nor watched is said once on stderr and the server runs without
 * this handle.
 */
export function watchBookmarks(hub: Hub, options: BookmarksWatchOptions): Watcher {
    const debounce = options.debounce ?? DEBOUNCE;
    const folder = dirname(options.file);
    let timer: ReturnType<typeof setTimeout> | null = null;
    let closed = false;
    let watching = false;

    const publish = (): void => {
        if (closed) return;
        hub.publish('files', { root: '', bookmarks: true } satisfies FilesPayload);
    };

    const queue = (): void => {
        if (closed) return;
        if (timer !== null) clearTimeout(timer);
        timer = setTimeout(() => {
            timer = null;
            publish();
        }, debounce);
    };

    try {
        if (!existsSync(folder)) mkdirSync(folder, { recursive: true });
        watchFile(
            options.file,
            { interval: Math.max(20, Math.floor(debounce / 4)), persistent: false },
            queue
        );
        watching = true;
    } catch (error) {
        console.error(`bookmarks watch: cannot watch ${options.file}: ${reason(error)}`);
    }

    return {
        close(): void {
            closed = true;
            if (timer !== null) clearTimeout(timer);
            timer = null;
            if (watching) unwatchFile(options.file, queue);
            watching = false;
        }
    };
}
