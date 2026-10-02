// Layer 2, server. The default workspace's folders, written into the `roots:` list of
// config/sources.yml by the Files view's Add Folder to Workspace and Remove Folder from Workspace.
//
// The default workspace shows the hub, the engine's config folder and the roots of sources.yml, so
// its folders are that list, and adding or removing one edits it. The edit is over the bytes
// through server/edit/list-edit.ts: every other line of the file is kept, the items already in the
// list keep the text they were written with, and the result is read back and compared with the
// original before anything is written. A named workspace keeps its folders in workspaces.json
// instead, through POST /api/fs.
//
// A new root is filed under a key made from the folder's name, taken against every key in force
// (the hub, the engine's config folder, the configured roots and every saved workspace's roots), so
// switching workspaces never meets a second root under one key. Its dir is written as `~/...` when
// the folder is under the home folder, since the tracked file carries no user path. The hub and the
// engine's config folder are not in the list and are never removed.
//
// The watcher watches `config/`, so the file this writes is pushed on the `config` channel within
// a second and the tree redraws from it.

import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { relative, sep } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { isMap as isYamlMap, isSeq, parse, parseDocument } from 'yaml';
import { z } from 'zod';
import { ENGINE_ROOT, HUB_ROOT, expandHome, type Root } from '../../../files/files.ts';
import {
    defaultWorkspacesPath,
    folderToAdd,
    readSaved,
    rootKey,
    type FolderRefusal
} from '../../../files/fs.ts';
import { browserRoots } from '../../../files/roots.ts';
import { writeTextAtomic } from '../../../core/json.ts';
import { othersThan, readBack, setItems } from '../../list-edit.ts';
import type { ChangeRecord } from '../../../core/changes.ts';

/** The top-level key of config/sources.yml the roots live under. */
export const ROOTS = 'roots';

/** What the roots in force are, which an add is checked against. */
export type RootsHeld = {
    /** Every key in force: the fixed roots, the configured ones and every saved workspace's. */
    keys: () => string[];
    /** The roots the file browser serves now, whose folders a new root may not repeat. */
    served: () => Root[];
};

/**
 * What a roots write answers with: what it changed and the key it made, or the word refusing it.
 */
export type RootsOutcome =
    | { changed: string[]; refused: []; records?: ChangeRecord[]; id?: string }
    | { error: FolderRefusal | 'root-fixed' | 'no-such-root' | 'invalid' | 'unwritable' };

/** One entry of the list: a key and the dir as the file writes it. */
export type RootItem = { key: string; dir: string };

/** The one key of config/sources.yml this write reads. */
const sourcesShape = z.object({ [ROOTS]: z.unknown().optional() }).catch(() => ({}));

/** An entry of the list that is a pair of text, and nothing else. */
const itemShape = z.object({ key: z.string().min(1), dir: z.string().min(1) });

/** The list one text of the file holds, an entry that is no pair of text left out. */
export function rootsOf(source: string): RootItem[] {
    let parsed: unknown;
    try {
        parsed = parse(source);
    } catch {
        return [];
    }
    const held = (sourcesShape.parse(parsed) as Record<string, unknown>)[ROOTS];
    if (!Array.isArray(held)) return [];
    return held.flatMap((item) => {
        const one = itemShape.safeParse(item);
        return one.success ? [{ key: one.data.key, dir: one.data.dir }] : [];
    });
}

/** The list the file holds now, or null when it is gone or does not parse. */
export function rootsNow(file: string): RootItem[] | null {
    try {
        return rootsOf(readFileSync(file, 'utf8'));
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'EACCES') throw error;
        return null;
    }
}

/** The text of each entry as the file writes it, by key, so an entry kept is kept byte for byte. */
function writtenItems(source: string): Map<string, string> {
    const kept = new Map<string, string>();
    const root = parseDocument(source).contents;
    if (!isYamlMap(root)) return kept;
    const list = root.get(ROOTS, true);
    if (!isSeq(list)) return kept;
    for (const node of list.items) {
        const range = (node as { range?: [number, number, number] | null } | null)?.range;
        const item = itemShape.safeParse((node as { toJSON?: () => unknown } | null)?.toJSON?.());
        if (range === undefined || range === null || !item.success) continue;
        kept.set(item.data.key, source.slice(range[0], range[1]));
    }
    return kept;
}

/** A dir written plainly where that reads back as itself, and quoted otherwise. */
function dirText(dir: string): string {
    return /^[A-Za-z0-9_./~-]+$/.test(dir) && dir !== '~' ? dir : JSON.stringify(dir);
}

/** One entry as the line the file carries: a flow map. */
function itemText(item: RootItem): string {
    return `{ key: ${dirText(item.key)}, dir: ${dirText(item.dir)} }`;
}

/** The folder as sources.yml writes it: `~/...` under the home folder, else the whole path. */
export function dirAsWritten(dir: string): string {
    const home = homedir();
    if (dir === home) return '~';
    return dir.startsWith(home + sep) ? `~/${relative(home, dir).split(sep).join('/')}` : dir;
}

/**
 * Whether the edited source still says what the original said with the one list replaced: it must
 * parse, hold exactly the entries asked for, and leave every other top-level key unchanged.
 */
function kept(source: string, edited: string, wanted: RootItem[]): boolean {
    const read = readBack(source, edited);
    if (read === null) return false;
    if (othersThan(read.before, [ROOTS]) !== othersThan(read.after, [ROOTS])) return false;
    return isDeepStrictEqual(rootsOf(edited), wanted);
}

/**
 * Write the list as `wanted`. Entries already in the file keep their text. A list the file already
 * holds writes nothing and answers so.
 */
export function writeRoots(file: string, wanted: RootItem[], id?: string): RootsOutcome {
    let source: string;
    try {
        source = readFileSync(file, 'utf8');
    } catch {
        return { error: 'unwritable' };
    }
    const before = rootsOf(source);
    const written = writtenItems(source);
    const items = wanted.map((one) => {
        const same = before.find((held) => held.key === one.key && held.dir === one.dir);
        return same === undefined ? itemText(one) : (written.get(one.key) ?? itemText(one));
    });
    const edited = setItems(source, null, ROOTS, items);
    if (!kept(source, edited, wanted)) return { error: 'invalid' };
    if (edited === source) return { changed: [], refused: [], ...(id === undefined ? {} : { id }) };
    try {
        writeTextAtomic(file, edited);
    } catch {
        return { error: 'unwritable' };
    }
    return {
        changed: [ROOTS],
        refused: [],
        records: [{ file, key: ROOTS, field: ROOTS, before, after: wanted, undo: 'field' }],
        ...(id === undefined ? {} : { id })
    };
}

/**
 * Add a folder to the list under a key made from its name. The folders the file lists now count as
 * held beside the ones served, since the served list is the configuration the request read.
 */
export function addRootTo(file: string, typed: string, held: RootsHeld): RootsOutcome {
    const list = rootsNow(file);
    if (list === null) return { error: 'unwritable' };
    const listed = list.map((one) => ({ key: one.key, dir: expandHome(one.dir) }));
    const found = folderToAdd(typed, [...held.served(), ...listed]);
    if ('error' in found) return found;
    const key = rootKey(found.dir, [...held.keys(), ...list.map((one) => one.key)]);
    return writeRoots(file, [...list, { key, dir: dirAsWritten(found.dir) }], key);
}

/** Take one entry out of the list. The hub and the engine's config folder are never in it. */
export function removeRootFrom(file: string, key: string): RootsOutcome {
    if (key === HUB_ROOT || key === ENGINE_ROOT) return { error: 'root-fixed' };
    const list = rootsNow(file);
    if (list === null) return { error: 'unwritable' };
    if (!list.some((one) => one.key === key)) return { error: 'no-such-root' };
    return writeRoots(
        file,
        list.filter((one) => one.key !== key)
    );
}

/**
 * What the roots in force hold, for an added folder: the roots the file browser serves under the
 * configuration the request read, and every key in force, which is those and the keys of every
 * saved workspace's roots, so a root added now never shares a key with one a switch would show.
 */
export function rootsHeldIn(
    engine: string,
    merged: Record<string, unknown>,
    hub: string,
    workspaces: string | undefined
): RootsHeld {
    const file = workspaces ?? defaultWorkspacesPath();
    const served = () => browserRoots({ config: merged, engine, local: { hub, workspaces } });
    return {
        served,
        keys: () => [
            ...served().map((one) => one.key),
            ...readSaved(file).workspaces.flatMap((one) => one.roots.map((root) => root.key))
        ]
    };
}
