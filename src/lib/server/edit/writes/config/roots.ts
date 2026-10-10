// Layer 2, server. The default workspace's folders, written into the `roots:` list of the hub's own
// config layer, `<hub>/.oculus/config/sources.yml`, by the Files view's Add Folder to Workspace and
// Remove Folder from Workspace.
//
// The default workspace shows the hub, the engine's config folder and the roots of sources.yml, so
// its folders are that list, and adding or removing one edits it. The layer's file, or the `roots:`
// key in it, may not exist: the list in force (`base`) is then the one the write starts from, and
// the write adds the key at the end of the file, creating the file and its folders. Its record
// carries the paths it made (`created`) and the text it added (`replaced`), which the undo takes
// out again (config-checks.ts `takeOutAdded`). The edit is over the bytes through
// server/edit/list-edit.ts: every other line of the file is kept, the items already in the list
// keep the text they were written with, and the result is read back and compared with the original
// before anything is written. A named workspace keeps its folders in workspaces.json instead,
// through POST /api/fs.
//
// The roots are put in a new order by the same rewrite: `order` names every key the list holds
// once. A rewrite that would drop a line of the list the reader wrote (a comment between two
// entries, an entry that is no key and dir pair) is refused `invalid` and writes nothing.
//
// A new root is filed under a key made from the folder's name, taken against every key in force
// (the hub, the engine's config folder, the configured roots and every saved workspace's roots), so
// switching workspaces never meets a second root under one key. Its dir is written as `~/...` when
// the folder is under the home folder, since the tracked file carries no user path. The hub and the
// engine's config folder are not in the list and are never removed.
//
// The watcher watches `config/`, so the file this writes is pushed on the `config` channel within
// a second and the tree redraws from it.

import { mkdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, relative, sep } from 'node:path';
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
import { absentIn, insertKey, madeAt, replacedText } from './config-checks.ts';
import type { ChangeRecord } from '../../../core/changes.ts';

/** The top-level key of the hub's sources.yml layer the roots live under. */
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
    | {
          error:
              | FolderRefusal
              | 'root-fixed'
              | 'no-such-root'
              | 'roots-changed'
              | 'invalid'
              | 'unwritable';
      };

/**
 * One entry of the list: a key, the dir as the file writes it, and `hub: true` when the root is
 * built as a hub of its own.
 */
export type RootItem = { key: string; dir: string; hub?: true };

/** The one key of the hub's sources.yml layer this write reads. */
const sourcesShape = z.object({ [ROOTS]: z.unknown().optional() }).catch(() => ({}));

/**
 * An entry of the list that is a pair of text, with `hub: true` when it says so; any other `hub`
 * value is left out, since the root is then read as a plain one.
 */
const itemShape = z.object({
    key: z.string().min(1),
    dir: z.string().min(1),
    hub: z.literal(true).optional().catch(undefined)
});

/** An entry as the list holds it, with `hub` only where it is true. */
function itemOf(one: z.infer<typeof itemShape>): RootItem {
    return one.hub === true
        ? { key: one.key, dir: one.dir, hub: true }
        : { key: one.key, dir: one.dir };
}

/**
 * The list a change record holds: its entries as RootItems, none for anything that is not a list.
 */
export const rootItemsShape = z.catch(z.array(itemShape.transform(itemOf)), () => []);

/** The entries of a `roots:` value that are a pair of text, any other entry left out. */
export function rootItemsOf(held: unknown): RootItem[] {
    if (!Array.isArray(held)) return [];
    return held.flatMap((item) => {
        const one = itemShape.safeParse(item);
        return one.success ? [itemOf(one.data)] : [];
    });
}

/** The list one text of the file holds, an entry that is no pair of text left out. */
export function rootsOf(source: string): RootItem[] {
    let parsed: unknown;
    try {
        parsed = parse(source);
    } catch {
        return [];
    }
    return rootItemsOf((sourcesShape.parse(parsed) as Record<string, unknown>)[ROOTS]);
}

/**
 * The list the file holds now, or null when it is gone or does not parse. Given the list in force
 * (`base`), a file that is not there or holds no `roots:` key is that list, since the hub's layer
 * then adds nothing to what the engine lists.
 */
function rootsNow(file: string, base?: RootItem[]): RootItem[] | null {
    try {
        const source = readFileSync(file, 'utf8');
        return base !== undefined && absentIn(source, ROOTS) ? base : rootsOf(source);
    } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (code === 'EACCES') throw error;
        return code === 'ENOENT' && base !== undefined ? base : null;
    }
}

/**
 * What an undo reads of the list: the entries the file holds, and a hub layer that holds none of
 * its own, a file that is not there or one without the key, as a found list with no value, since a
 * write that added the key leaves nothing there once taken back.
 */
export function rootsValueNow(file: string, hub: boolean): { found: boolean; value: unknown } {
    try {
        const source = readFileSync(file, 'utf8');
        if (hub && absentIn(source, ROOTS)) return { found: true, value: null };
        return { found: true, value: rootsOf(source) };
    } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (code === 'EACCES') throw error;
        return code === 'ENOENT' && hub
            ? { found: true, value: null }
            : { found: false, value: null };
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

/**
 * Whether the source lines of the list hold nothing but its entries: what lies in the list's span
 * outside the entries' own text is dashes, list brackets, commas and white space. A comment line
 * between two entries, a comment after an entry and an entry that is no key and dir pair are
 * something else, and a rewrite of the list would lose them.
 */
function onlyEntries(source: string): boolean {
    const root = parseDocument(source).contents;
    if (!isYamlMap(root)) return true;
    const list = root.get(ROOTS, true);
    if (!isSeq(list)) return true;
    const span = (list as { range?: [number, number, number] | null }).range;
    if (span === undefined || span === null) return true;
    let rest = '';
    let at = span[0];
    for (const node of list.items) {
        const range = (node as { range?: [number, number, number] | null } | null)?.range;
        const item = itemShape.safeParse((node as { toJSON?: () => unknown } | null)?.toJSON?.());
        if (range === undefined || range === null || !item.success) return false;
        rest += source.slice(at, range[0]);
        at = range[1];
    }
    rest += source.slice(at, span[1]);
    return /^[\s,[\]-]*$/.test(rest);
}

/** A dir written plainly where that reads back as itself, and quoted otherwise. */
function dirText(dir: string): string {
    return /^[A-Za-z0-9_./~-]+$/.test(dir) && dir !== '~' ? dir : JSON.stringify(dir);
}

/** One entry as the line the file carries: a flow map. */
function itemText(item: RootItem): string {
    const hub = item.hub === true ? ', hub: true' : '';
    return `{ key: ${dirText(item.key)}, dir: ${dirText(item.dir)}${hub} }`;
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
 * holds writes nothing and answers so, and a list that holds anything but key and dir entries (a
 * comment line between two of them) is refused `invalid` and left as it is.
 */
export function writeRoots(
    file: string,
    wanted: RootItem[],
    id?: string,
    base?: RootItem[]
): RootsOutcome {
    let source: string | null = null;
    try {
        source = readFileSync(file, 'utf8');
    } catch (error) {
        if (base === undefined || (error as NodeJS.ErrnoException).code !== 'ENOENT') {
            return { error: 'unwritable' };
        }
    }
    if (base !== undefined && (source === null || absentIn(source, ROOTS))) {
        return addRootsKey(file, source, base, wanted, id);
    }
    if (source === null || !onlyEntries(source)) return { error: 'invalid' };
    const before = rootsOf(source);
    const written = writtenItems(source);
    const items = wanted.map((one) => {
        const same = before.find((held) => isDeepStrictEqual(held, one));
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
 * Add the `roots:` key to the hub layer's file, creating the file and its folders when they are not
 * there. A list equal to the one in force writes nothing.
 */
function addRootsKey(
    file: string,
    source: string | null,
    base: RootItem[],
    wanted: RootItem[],
    id?: string
): RootsOutcome {
    const named = id === undefined ? {} : { id };
    if (isDeepStrictEqual(base, wanted)) return { changed: [], refused: [], ...named };
    const text = source ?? '';
    const edited = insertKey(text, ROOTS, wanted);
    if (edited === null || !kept(text, edited, wanted)) return { error: 'invalid' };
    const made = madeAt(file);
    try {
        mkdirSync(dirname(file), { recursive: true });
        writeTextAtomic(file, edited);
    } catch {
        return { error: 'unwritable' };
    }
    return {
        changed: [ROOTS],
        refused: [],
        records: [
            {
                file,
                key: ROOTS,
                field: ROOTS,
                before: base,
                after: wanted,
                undo: 'field',
                replaced: replacedText(text, edited) ?? { offset: 0, before: '', after: '' },
                created: made
            }
        ],
        ...named
    };
}

/**
 * Add a folder to the list under a key made from its name. The folders the file lists now count as
 * held beside the ones served, since the served list is the configuration the request read.
 */
export function addRootTo(
    file: string,
    typed: string,
    held: RootsHeld,
    base?: RootItem[]
): RootsOutcome {
    const list = rootsNow(file, base);
    if (list === null) return { error: 'unwritable' };
    const listed = list.map((one) => ({ key: one.key, dir: expandHome(one.dir) }));
    const found = folderToAdd(typed, [...held.served(), ...listed]);
    if ('error' in found) return found;
    const key = rootKey(found.dir, [...held.keys(), ...list.map((one) => one.key)]);
    return writeRoots(file, [...list, { key, dir: dirAsWritten(found.dir) }], key, base);
}

/** Take one entry out of the list. The hub and the engine's config folder are never in it. */
export function removeRootFrom(file: string, key: string, base?: RootItem[]): RootsOutcome {
    if (key === HUB_ROOT || key === ENGINE_ROOT) return { error: 'root-fixed' };
    const list = rootsNow(file, base);
    if (list === null) return { error: 'unwritable' };
    if (!list.some((one) => one.key === key)) return { error: 'no-such-root' };
    return writeRoots(
        file,
        list.filter((one) => one.key !== key),
        undefined,
        base
    );
}

/**
 * Put the list's roots in the order `keys` names, which must name each listed key exactly once:
 * a list that has changed since the caller read it is refused `roots-changed` and written nowhere.
 */
export function orderRootsIn(file: string, keys: string[], base?: RootItem[]): RootsOutcome {
    const list = rootsNow(file, base);
    if (list === null) return { error: 'unwritable' };
    const held = new Set(list.map((one) => one.key));
    if (keys.length !== held.size || new Set(keys).size !== keys.length) {
        return { error: 'roots-changed' };
    }
    if (!keys.every((key) => held.has(key))) return { error: 'roots-changed' };
    return writeRoots(
        file,
        keys.flatMap((key) => list.filter((one) => one.key === key)),
        undefined,
        base
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
    const file = workspaces ?? defaultWorkspacesPath(hub);
    const served = () => browserRoots({ config: merged, engine, local: { hub, workspaces } });
    return {
        served,
        keys: () => [
            ...served().map((one) => one.key),
            ...readSaved(file).workspaces.flatMap((one) => one.roots.map((root) => root.key))
        ]
    };
}
