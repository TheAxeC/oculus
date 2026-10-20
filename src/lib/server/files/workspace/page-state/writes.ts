// Layer 2, server. One write of the page state, as POST /api/state carries it, applied to the files
// of the state folder (files.ts), and the `state` message that tells the other pages of it.
//
// The server is the one save turn of the arrangement for every page and app window of it. A layout
// save carries the envelope to write and the stamp of the envelope it was made from, and is
// admitted only when that is the stamp of the envelope the workspace holds (or the workspace holds
// none); otherwise nothing is written and the answer carries the envelope held, which the page
// takes and runs its change again on, so two pages that change the layout within a second keep
// both changes. An admitted save adds its entry to the workspace's record of layout writes, the
// last WRITES_KEPT kept, and a write repeating the newest entry in all but its time is counted on
// it.
//
// A view state write sets and removes records by id, so two pages that change different records
// never take each other's away; the debugger's record is written whole. The copy of an envelope a
// page could not read is kept under its workspace and no save writes over it.
//
// Each write runs behind the process's write chain (routes.ts), so a read and the write it is
// checked against are never split by another write of this process.

import { z } from 'zod';
import type {
    LayoutWrite,
    PageStateAnswer,
    PageStateWrite,
    StatePayload
} from '../../../../data/model/index.ts';
import { isMap } from '../../../core/json.ts';
import {
    WRITES_KEPT,
    heldLayout,
    pageStateFile,
    readStateMap,
    stampOf,
    writeStateMap,
    writesOf,
    type PageStateFile
} from './files.ts';

/** The sentences a refusal is worded with, from `server.state` of the text catalog. */
export type StateWords = {
    /** A file that is there and does not read, named. */
    unreadable: (file: string) => string;
    /** A file that could not be written, named, with the reason. */
    unwritable: (file: string, reason: string) => string;
};

const layoutWriteShape = z.object({
    at: z.number(),
    tab: z.string(),
    call: z.string(),
    page: z.string(),
    tabs: z.array(z.string())
});

/** The writes a page may ask, each field of the type it must have. */
export const pageStateWriteShape: z.ZodType<PageStateWrite> = z.discriminatedUnion('kind', [
    z.object({
        kind: z.literal('layout'),
        identity: z.string().min(1),
        envelope: z.record(z.string(), z.unknown()),
        from: z.string().nullable(),
        write: layoutWriteShape,
        by: z.string()
    }),
    z.object({
        kind: z.literal('unread'),
        identity: z.string().min(1),
        value: z.unknown(),
        by: z.string()
    }),
    z.object({
        kind: z.literal('views'),
        set: z.record(z.string(), z.unknown()),
        remove: z.array(z.string()),
        by: z.string()
    }),
    z.object({ kind: z.literal('debug'), value: z.record(z.string(), z.unknown()), by: z.string() })
]);

/** What a write did: its answer, and the message the other pages are told, null for none. */
export type Applied = { answer: PageStateAnswer; told: StatePayload | null };

/** Whether two entries are one write repeated: the same page, call, page on screen and tabs. */
function repeated(one: LayoutWrite, other: LayoutWrite): boolean {
    return (
        one.tab === other.tab &&
        one.call === other.call &&
        one.page === other.page &&
        one.tabs.join(' ') === other.tabs.join(' ')
    );
}

/** A record with one entry added, or counted on the newest entry it repeats, cut to size. */
function withWrite(kept: readonly LayoutWrite[], entry: LayoutWrite): LayoutWrite[] {
    const newest = kept.at(-1);
    const list =
        newest !== undefined && repeated(newest, entry)
            ? [...kept.slice(0, -1), { ...newest, n: (newest.n ?? 1) + 1, last: entry.at }]
            : [...kept, entry];
    return list.slice(-WRITES_KEPT);
}

/**
 * Read a file for a write and change its map: the refusal when the file does not read, or when the
 * written map cannot be written; `change` answers the answer and what to tell, and leaves the map
 * unwritten by answering `write: false`.
 */
function changing(
    folder: string,
    file: PageStateFile,
    said: StateWords,
    change: (map: Record<string, unknown>) => Applied & { write: boolean }
): Applied {
    const read = readStateMap(folder, file);
    const path = pageStateFile(folder, file);
    if (read.unreadable !== null) {
        return { answer: { ok: false, error: said.unreadable(path) }, told: null };
    }
    const done = change(read.map);
    if (!done.write) return { answer: done.answer, told: done.told };
    try {
        writeStateMap(folder, file, read.map);
    } catch (error) {
        const why = error instanceof Error ? error.message : String(error);
        return { answer: { ok: false, error: said.unwritable(path, why) }, told: null };
    }
    return { answer: done.answer, told: done.told };
}

/**
 * Add an admitted save's entry to its workspace's record. The save has been written already, so a
 * record that does not read or cannot be written loses the entry and nothing else; the file that
 * does not read is the finding a read of the page state gives.
 */
function recordWrite(folder: string, identity: string, entry: LayoutWrite): void {
    const read = readStateMap(folder, 'writes');
    if (read.unreadable !== null) return;
    read.map[identity] = withWrite(writesOf(read.map[identity]), entry);
    try {
        writeStateMap(folder, 'writes', read.map);
    } catch {
        // The record is lost with the file that could not be written.
    }
}

/** Apply one write to the page state of a state folder. */
export function applyStateWrite(folder: string, write: PageStateWrite, said: StateWords): Applied {
    const done: PageStateAnswer = { ok: true };
    if (write.kind === 'layout') {
        const { identity, envelope, from, by } = write;
        const applied = changing(folder, 'layouts', said, (map) => {
            const held = heldLayout(map[identity]);
            if (held.envelope !== undefined && stampOf(held.envelope) !== from) {
                return { answer: { ok: false, held: held.envelope }, told: null, write: false };
            }
            map[identity] = { ...held, envelope };
            return {
                answer: done,
                told: { layouts: { [identity]: { envelope, by } } },
                write: true
            };
        });
        if (applied.answer.ok) recordWrite(folder, identity, write.write);
        return applied;
    }
    if (write.kind === 'unread') {
        return changing(folder, 'layouts', said, (map) => {
            map[write.identity] = { ...heldLayout(map[write.identity]), unread: write.value };
            return { answer: done, told: null, write: true };
        });
    }
    if (write.kind === 'views') {
        const { set, remove, by } = write;
        return changing(folder, 'views', said, (map) => {
            for (const id of remove) Reflect.deleteProperty(map, id);
            for (const [id, value] of Object.entries(set)) {
                Object.defineProperty(map, id, {
                    value,
                    enumerable: true,
                    writable: true,
                    configurable: true
                });
            }
            return { answer: done, told: { views: [{ by, set, remove }] }, write: true };
        });
    }
    const { value, by } = write;
    return changing(folder, 'debug', said, (map) => {
        for (const key of Object.keys(map)) Reflect.deleteProperty(map, key);
        if (isMap(value)) Object.assign(map, value);
        return { answer: done, told: { debug: { value, by } }, write: true };
    });
}

/**
 * Combine two pending `state` messages for a page that is behind, so no save is lost: the newer
 * envelope of each workspace, the view batches of both in order, and the newer debugger record.
 */
export function mergeState(held: StatePayload, next: StatePayload): StatePayload {
    const merged: StatePayload = {};
    if (held.layouts !== undefined || next.layouts !== undefined) {
        merged.layouts = { ...held.layouts, ...next.layouts };
    }
    if (held.views !== undefined || next.views !== undefined) {
        merged.views = [...(held.views ?? []), ...(next.views ?? [])];
    }
    const debug = next.debug ?? held.debug;
    if (debug !== undefined) merged.debug = debug;
    return merged;
}
