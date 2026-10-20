// Layer 2, server. The four files of the page state in the state folder (`~/.oculus`, the folder
// `workspace.json` lies in, passed in by the caller): `layouts.json`, each workspace's arrangement
// envelope by the real path of its file or `unsaved`, with the copy of an envelope the page could
// not read; `layout-writes.json`, the record of layout writes of each workspace, the last 500;
// `views.json`, each tab's view state by instance id; and `debug.json`, the debugger's
// breakpoints, watches, chosen configurations and toolbar place.
//
// Oculus alone writes them, each whole and atomically. A file that is not there holds nothing. A
// file that is there and does not read (not JSON, not readable, or not a map of keys) is a finding,
// reads as holding nothing, and is never written over: a write that would change it is refused
// with the sentence that names it, so what the reader had in it can be recovered by hand.

import { join } from 'node:path';
import type { Finding, HeldLayout, LayoutWrite, PageState } from '../../../../data/model/index.ts';
import { isMap, readJsonChecked, writeJsonAtomic } from '../../../core/json.ts';

/** The files of the page state, by what each holds. */
const PAGE_STATE_FILES = {
    layouts: 'layouts.json',
    writes: 'layout-writes.json',
    views: 'views.json',
    debug: 'debug.json'
} as const;

/** One of the four files, by what it holds. */
export type PageStateFile = keyof typeof PAGE_STATE_FILES;

/** How many entries the record of layout writes keeps for one workspace. */
export const WRITES_KEPT = 500;

/** The path of one file of the page state in a state folder. */
export function pageStateFile(folder: string, file: PageStateFile): string {
    return join(folder, PAGE_STATE_FILES[file]);
}

/**
 * What a read of one file found: its top map (empty for a file that is not there), or, for a file
 * that is there and does not read, the reason, which a write refuses with.
 */
export type FileRead = { map: Record<string, unknown>; unreadable: string | null };

/** The top map of one file of the page state. */
export function readStateMap(folder: string, file: PageStateFile): FileRead {
    const read = readJsonChecked(pageStateFile(folder, file));
    if (!read.ok) return { map: {}, unreadable: read.reason };
    if (read.value === undefined) return { map: {}, unreadable: null };
    if (!isMap(read.value)) return { map: {}, unreadable: 'is not a map of keys' };
    return { map: { ...read.value }, unreadable: null };
}

/** Write one file's top map whole. Throws when the file cannot be written. */
export function writeStateMap(
    folder: string,
    file: PageStateFile,
    map: Record<string, unknown>
): void {
    writeJsonAtomic(pageStateFile(folder, file), map);
}

/** A workspace's entry of `layouts.json`, with only the keys it takes. */
export function heldLayout(value: unknown): HeldLayout {
    if (!isMap(value)) return {};
    return {
        ...(value.envelope === undefined ? {} : { envelope: value.envelope }),
        ...(value.unread === undefined ? {} : { unread: value.unread })
    };
}

/** The stamp an envelope carries, or null for one with none. */
export function stampOf(envelope: unknown): string | null {
    return isMap(envelope) && typeof envelope.stamp === 'string' ? envelope.stamp : null;
}

/** The entries of the record of one workspace, none when the value is no list. */
export function writesOf(value: unknown): LayoutWrite[] {
    return Array.isArray(value) ? (value as LayoutWrite[]) : [];
}

/** The page state of a state folder, and a finding for each file that does not read. */
export function readPageState(
    folder: string,
    unreadable: (file: string, reason: string) => Finding
): { state: PageState; findings: Finding[] } {
    const findings: Finding[] = [];
    const read = (file: PageStateFile): Record<string, unknown> => {
        const held = readStateMap(folder, file);
        if (held.unreadable !== null) {
            findings.push(unreadable(pageStateFile(folder, file), held.unreadable));
        }
        return held.map;
    };
    const layouts = Object.fromEntries(
        Object.entries(read('layouts')).map(([identity, value]) => [identity, heldLayout(value)])
    );
    const views = read('views');
    const debug = read('debug');
    // The record of layout writes is read here for its finding alone; no page reads it.
    read('writes');
    return {
        state: { layouts, views, debug: Object.keys(debug).length === 0 ? null : debug },
        findings
    };
}
