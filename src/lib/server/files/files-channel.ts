// Layer 2, server. The pending-message policy for the files channel preserves the facts its payload
// can carry while a subscriber is behind: the root and the folders written in it, the bookmark-file
// change and the workspaces change.

import type { FilesPayload, Message } from '../../data/model/index.ts';
import type { Hub } from '../core/channels.ts';

/**
 * The root and folders of two pending messages. A message with the empty root (a bookmarks or a
 * workspaces message) names none, so the other message's root and folders stand as they are. Two
 * messages naming one root union their folders, and name the whole root (no folders) when either
 * names none. Two messages naming different roots keep the newer message's root and folders, since
 * a subscriber that was behind reads the gap as a version it must catch up on.
 */
function placeOf(
    before: FilesPayload,
    after: FilesPayload
): Pick<FilesPayload, 'root' | 'folders'> {
    if (after.root === '') return { root: before.root, folders: before.folders };
    if (before.root === '') return { root: after.root, folders: after.folders };
    if (before.root !== after.root) return { root: after.root, folders: after.folders };
    if (before.folders === undefined || after.folders === undefined) return { root: after.root };
    return { root: after.root, folders: [...new Set([...before.folders, ...after.folders])] };
}

/** Combine two pending files messages without dropping any kind of fact the payload can hold. */
export function mergeFiles(held: Message, next: Message): Message {
    const before = held.payload as FilesPayload;
    const after = next.payload as FilesPayload;
    const place = placeOf(before, after);
    const payload: FilesPayload = { root: place.root };
    if (place.folders !== undefined) payload.folders = place.folders;
    if (before.bookmarks === true || after.bookmarks === true) payload.bookmarks = true;
    if (before.workspaces === true || after.workspaces === true) payload.workspaces = true;
    return { ...next, payload };
}

/** Register the files channel's pending-message policy on one process-owned hub. */
export function registerFilesChannel(hub: Hub): void {
    hub.merge('files', mergeFiles);
}
