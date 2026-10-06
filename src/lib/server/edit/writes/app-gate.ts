// Layer 2, server. The gate a write passes when it comes from an app's frame: the kind the body
// is, and whether that kind is one the app may send.
//
// The page sends an app's write to POST /api/write with two headers: `x-oculus-app`, the app's
// view id with the root key percent-encoded, and `x-oculus-write-kind`, the kind the app named.
// This module reads the body with the parsers handleWrite tries, in handleWrite's order, and
// answers with the kind the first one matches, and no writer is run. A write is refused 403
// `{ error: 'kind' }` when the header names no held row or holds a malformed escape; when the
// kind the body matches is not the kind the header names; when that kind is not open to apps; and
// when an entry kind names the collection `bookmarks`, which is the reader's own file. A body
// matching `{ store: <value> }` is the app's own store, which every app has and which only a
// request carrying the app header can send.

import {
    APP_HEADER,
    KIND_HEADER,
    appViewIdFromHeader,
    writeAccess
} from '../../../data/helpers/files/apps.ts';
import { isMap } from '../../../data/helpers/guards.ts';
import type { AppsHeld, HeldApp } from '../../machine/apps/held.ts';
import { appById } from '../../machine/apps/held.ts';
import {
    auditMuteWrite,
    configKeyWrite,
    configValueWrite,
    deckSlidesWrite,
    deleteEntryWrite,
    entryWrite,
    feedDeleteWrite,
    feedFieldWrite,
    hostWrite,
    leadAddWrite,
    linkedinIdeaWrite,
    linkedinPostWrite,
    manifestWrite,
    newEntry,
    newIdea,
    radarAddWrite,
    railWrite,
    reorderWrite,
    rootsWrite,
    sessionWrite,
    subtaskAdd,
    subtaskWrite,
    undoWrite
} from './bodies.ts';
import { APP_STORE } from './app-store.ts';

/** The body of a store write: exactly one key, `store`, whatever it holds. */
export type StoreWrite = { store: unknown };

/** The body as a store write, or null when it is not one. */
export function storeWrite(body: unknown): StoreWrite | null {
    if (!isMap(body)) return null;
    const keys = Object.keys(body);
    return keys.length === 1 && keys[0] === 'store' ? { store: body.store } : null;
}

/** The kind a body is, by the first parser of handleWrite's order that reads it, or null. */
function matchedKind(body: unknown): string | null {
    const tries: [string, (one: unknown) => unknown][] = [
        ['session', sessionWrite],
        ['manifest', manifestWrite],
        ['entry', entryWrite],
        ['subtask', subtaskWrite],
        ['subtask-add', subtaskAdd],
        ['host', hostWrite],
        ['new-entry', newEntry],
        ['reorder', reorderWrite],
        ['delete-entry', deleteEntryWrite],
        ['feed-field', feedFieldWrite],
        ['feed-delete', feedDeleteWrite],
        ['lead-add', leadAddWrite],
        ['radar-add', radarAddWrite],
        ['linkedin-idea', linkedinIdeaWrite],
        ['linkedin-post', linkedinPostWrite],
        ['deck-slides', deckSlidesWrite],
        ['audit-mute', auditMuteWrite],
        ['rail', railWrite],
        ['config-key', configKeyWrite],
        ['config-value', configValueWrite],
        ['roots', rootsWrite],
        ['new-idea', newIdea],
        ['undo', undoWrite],
        [APP_STORE, storeWrite]
    ];
    for (const [kind, read] of tries) if (read(body) !== null) return kind;
    return null;
}

/** Whether the body names the reader's own bookmarks through one of the four entry kinds. */
function namesBookmarks(body: unknown): boolean {
    const named = [entryWrite(body), newEntry(body), reorderWrite(body), deleteEntryWrite(body)];
    return named.some((one) => one !== null && one.collection === 'bookmarks');
}

/** What the gate decides: the app the write comes from, none for a page's own write, or a refusal.
 * */
export type Gate = { app: HeldApp | null } | { refused: true };

/**
 * Judge one write request. A request without the app header is the page's own: it is passed, but
 * for a store write, which has no meaning without an app. The held apps are read through a
 * function, since a target built without a server holds none.
 */
export function gateWrite(
    headers: Headers,
    body: unknown,
    held: (() => AppsHeld) | undefined
): Gate {
    const header = headers.get(APP_HEADER);
    const kind = matchedKind(body);
    if (header === null) return kind === APP_STORE ? { refused: true } : { app: null };
    const id = appViewIdFromHeader(header);
    if (id === null || held === undefined) return { refused: true };
    const app = appById(held(), id);
    if (app === undefined) return { refused: true };
    const named = headers.get(KIND_HEADER);
    if (kind === null || named !== kind) return { refused: true };
    if (kind !== APP_STORE && writeAccess(kind) !== 'open') return { refused: true };
    if (namesBookmarks(body)) return { refused: true };
    return { app };
}
