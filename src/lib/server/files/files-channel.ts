// Layer 2, server. The pending-message policy for the files channel preserves the two facts its
// payload can carry while a subscriber is behind: the newest root and any bookmark-file change.

import type { FilesPayload, Message } from '../../data/model.ts';
import type { Hub } from '../core/channels.ts';

/** Combine two pending files messages without dropping either kind of fact the payload can hold. */
export function mergeFiles(held: Message, next: Message): Message {
    const before = held.payload as FilesPayload;
    const after = next.payload as FilesPayload;
    const payload: FilesPayload = { root: after.root === '' ? before.root : after.root };
    if (before.bookmarks === true || after.bookmarks === true) payload.bookmarks = true;
    return { ...next, payload };
}

/** Register the files channel's pending-message policy on one process-owned hub. */
export function registerFilesChannel(hub: Hub): void {
    hub.merge('files', mergeFiles);
}
