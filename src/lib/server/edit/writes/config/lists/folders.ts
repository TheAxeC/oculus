// Layer 2, server. The folders of the open workspace, written into its workspace file
// (`<hub>/.oculus/workspaces/<name>.yml`) by the Files view's Add Folder to Workspace and Remove
// Folder from Workspace, or into the state (`~/.oculus/workspace.json`) while the workspace is
// unsaved.
//
// The file is edited over its bytes through server/edit/list-edit.ts: every other line of it is
// kept, the entries already in the list keep the text they were written with, and the result is
// read back and compared with the original before anything is written. Removing the folder the file
// names as its `primary` removes the `primary:` line in the same write, and the change record holds
// both values (`before` and `after` are the list with the primary), so taking the write back puts
// the entry and the primary back together. A file that does not parse is never written: the write
// is refused with the reason and the file stays as it is. A rewrite that would drop a line of the
// list the reader wrote (a comment between two entries, an entry that is no name and path pair) is
// refused `invalid` and writes nothing.
//
// A new folder is filed under a name made from the folder's base name, taken against every name in
// the file, and its path is written as `~/...` when the folder is under the home folder. The roots
// a workspace serves are the folders, so adding or removing one changes what the server serves at
// the next poll of the follower (workspace/follow.ts).

import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { isMap as isYamlMap, isScalar, isSeq, parse, parseDocument } from 'yaml';
import { z } from 'zod';
import { writeTextAtomic } from '../../../../core/json.ts';
import type { ChangeRecord } from '../../../../core/changes.ts';
import {
    expandHome,
    folderName,
    folderToAdd,
    pathAsWritten
} from '../../../../files/workspace/folders.ts';
import { scalarText, type FolderRefusal } from '../../../../files/workspace/folders.ts';
import type { OpenWorkspace } from '../../../../files/workspace/open.ts';
import { readState, writeState } from '../../../../files/workspace/state.ts';
import { othersThan, readBack, setItems } from '../../../list-edit.ts';

/** The top-level key of a workspace file the folders live under. */
const FOLDERS = 'folders';

/** The top-level key naming the primary hub. */
const PRIMARY = 'primary';

/** One entry of the list: a name and the path as the file writes it. */
type FolderItem = { name: string; path: string };

/** What a change record holds of a workspace file: its list and its primary. */
export type WorkspaceValue = { folders: FolderItem[]; primary: string | null };

/** What a folders write answers with: what it changed and the name it made, or the refusal. */
export type FoldersOutcome =
    | { changed: string[]; refused: []; records?: ChangeRecord[]; id?: string }
    | {
          error:
              | FolderRefusal
              | 'no-such-root'
              | 'roots-changed'
              | 'invalid'
              | 'unwritable'
              | 'unreadable';
          reason?: string;
      };

const itemShape = z.object({ name: z.string().min(1), path: z.string().min(1) });

/** The value a change record holds: the list and the primary, empty for anything else. */
export const workspaceValueShape = z.catch(
    z.object({
        folders: z.array(z.unknown()).transform((rows) =>
            rows.flatMap((row) => {
                const one = itemShape.safeParse(row);
                return one.success ? [one.data] : [];
            })
        ),
        primary: z.string().nullable().catch(null)
    }),
    () => ({ folders: [], primary: null })
);

/** The list one text of the file holds, an entry that is no pair of text left out. */
function itemsOf(held: unknown): FolderItem[] {
    if (!Array.isArray(held)) return [];
    return held.flatMap((item) => {
        const one = itemShape.safeParse(item);
        return one.success ? [{ name: one.data.name, path: one.data.path }] : [];
    });
}

/** The list and the primary a text holds, or null when it does not parse as a map. */
function valueOf(source: string): WorkspaceValue | null {
    let parsed: unknown;
    try {
        parsed = parse(source);
    } catch {
        return null;
    }
    if (parsed === null || parsed === undefined) return { folders: [], primary: null };
    if (typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const record = parsed as Record<string, unknown>;
    const primary = record[PRIMARY];
    return {
        folders: itemsOf(record[FOLDERS]),
        primary: typeof primary === 'string' ? primary : null
    };
}

/**
 * What an undo reads of a workspace file: the list and the primary it holds, and whether the file
 * is there and reads.
 */
export function foldersValueNow(file: string): { found: boolean; value: unknown } {
    try {
        const value = valueOf(readFileSync(file, 'utf8'));
        return value === null ? { found: false, value: null } : { found: true, value };
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'EACCES') throw error;
        return { found: false, value: null };
    }
}

/**
 * The text of each entry as the file writes it, by name, so an entry kept is kept byte for byte.
 */
function writtenItems(source: string): Map<string, string> {
    const kept = new Map<string, string>();
    const root = parseDocument(source).contents;
    if (!isYamlMap(root)) return kept;
    const list = root.get(FOLDERS, true);
    if (!isSeq(list)) return kept;
    for (const node of list.items) {
        const range = (node as { range?: [number, number, number] | null } | null)?.range;
        const item = itemShape.safeParse((node as { toJSON?: () => unknown } | null)?.toJSON?.());
        if (range === undefined || range === null || !item.success) continue;
        kept.set(item.data.name, source.slice(range[0], range[1]));
    }
    return kept;
}

/**
 * Whether the source lines of the list hold nothing but its entries: what lies in the list's span
 * outside the entries' own text is dashes, list brackets, commas and white space. A comment line
 * between two entries, a comment after an entry and an entry that is no name and path pair are
 * something else, and a rewrite of the list would lose them.
 */
function onlyEntries(source: string): boolean {
    const root = parseDocument(source).contents;
    if (!isYamlMap(root)) return true;
    const list = root.get(FOLDERS, true);
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

/** One entry as the line the file carries: a flow map. */
function itemText(item: FolderItem): string {
    return `{ name: ${scalarText(item.name)}, path: ${scalarText(item.path)} }`;
}

/** The source with the top-level `primary:` line set to `primary`, or removed when it is null. */
function withPrimary(source: string, primary: string | null): string {
    const root = parseDocument(source).contents;
    if (!isYamlMap(root)) return source;
    const pair = root.items.find((one) => isScalar(one.key) && one.key.value === PRIMARY);
    if (pair === undefined) {
        if (primary === null) return source;
        const lead = source === '' || source.endsWith('\n') ? source : `${source}\n`;
        return `${lead}${PRIMARY}: ${scalarText(primary)}\n`;
    }
    const key = (pair.key as { range?: [number, number, number] | null }).range;
    const value = (pair.value as { range?: [number, number, number] | null } | null)?.range;
    if (key === undefined || key === null) return source;
    const start = source.lastIndexOf('\n', key[0] - 1) + 1;
    if (primary === null) {
        const end = source.indexOf('\n', (value ?? key)[1]);
        return source.slice(0, start) + (end === -1 ? '' : source.slice(end + 1));
    }
    if (value === undefined || value === null) return source;
    return source.slice(0, value[0]) + scalarText(primary) + source.slice(value[1]);
}

/**
 * Whether the edited source still says what the original said with the list and the primary
 * replaced: it must parse, hold exactly the value asked for, and leave every other top-level key
 * unchanged.
 */
function kept(source: string, edited: string, wanted: WorkspaceValue): boolean {
    const read = readBack(source, edited);
    if (read === null) return false;
    const skip = [FOLDERS, PRIMARY];
    if (othersThan(read.before, skip) !== othersThan(read.after, skip)) return false;
    return isDeepStrictEqual(valueOf(edited), wanted);
}

/**
 * Write the file's list and primary as `wanted`. Entries already in the file keep their text. A
 * value the file already holds writes nothing and answers so, a list that holds anything but name
 * and path entries is refused `invalid`, and a file that does not read is refused `unreadable`.
 */
export function writeFolders(file: string, wanted: WorkspaceValue, id?: string): FoldersOutcome {
    const named = id === undefined ? {} : { id };
    let source: string;
    try {
        source = readFileSync(file, 'utf8');
    } catch {
        return { error: 'unwritable' };
    }
    const before = valueOf(source);
    if (before === null) return { error: 'unreadable' };
    if (!onlyEntries(source)) return { error: 'invalid' };
    const written = writtenItems(source);
    const items = wanted.folders.map((one) => {
        const same = before.folders.find((held) => isDeepStrictEqual(held, one));
        return same === undefined ? itemText(one) : (written.get(one.name) ?? itemText(one));
    });
    const edited = withPrimary(setItems(source, null, FOLDERS, items), wanted.primary);
    if (!kept(source, edited, wanted)) return { error: 'invalid' };
    if (edited === source) return { changed: [], refused: [], ...named };
    try {
        writeTextAtomic(file, edited);
    } catch {
        return { error: 'unwritable' };
    }
    return {
        changed: [FOLDERS],
        refused: [],
        records: [{ file, key: FOLDERS, field: FOLDERS, before, after: wanted, undo: 'field' }],
        ...named
    };
}

/** The list and the primary the open workspace holds now, from its file or from the state. */
function heldBy(open: OpenWorkspace): WorkspaceValue | FoldersOutcome {
    if (open.unreadable !== null) return { error: 'unreadable', reason: open.unreadable };
    if (open.file === null) {
        const { state } = readState(open.stateFolder);
        return {
            folders: state.unsaved.folders.map((one) => ({ name: one.name, path: one.path })),
            primary: state.unsaved.primary ?? null
        };
    }
    try {
        return valueOf(readFileSync(open.file, 'utf8')) ?? { error: 'unreadable' };
    } catch {
        return { error: 'unwritable' };
    }
}

/** Whether `held` is a value (the other answer being a refusal). */
function isValue(held: WorkspaceValue | FoldersOutcome): held is WorkspaceValue {
    return 'folders' in held;
}

/** Put `wanted` in the open workspace: its file, or the state while it is unsaved. */
function put(open: OpenWorkspace, wanted: WorkspaceValue, id?: string): FoldersOutcome {
    if (open.file !== null) return writeFolders(open.file, wanted, id);
    const read = readState(open.stateFolder);
    if (read.unreadable !== null) return { error: 'unreadable', reason: read.unreadable };
    const unsaved: { folders: FolderItem[]; primary?: string } = { folders: wanted.folders };
    if (wanted.primary !== null) unsaved.primary = wanted.primary;
    try {
        writeState(open.stateFolder, { ...read.state, unsaved });
    } catch {
        return { error: 'unwritable' };
    }
    return { changed: ['workspaces'], refused: [], ...(id === undefined ? {} : { id }) };
}

/**
 * Add a folder to the open workspace under a name made from its base name. The folders the
 * workspace serves count as held beside the file's entries.
 */
export function addFolder(open: OpenWorkspace, typed: string): FoldersOutcome {
    const held = heldBy(open);
    if (!isValue(held)) return held;
    const listed = held.folders.map((one) => ({ dir: expandHome(one.path) }));
    const found = folderToAdd(typed, [...open.roots, ...listed]);
    if ('error' in found) return found;
    const name = folderName(found.dir, [
        ...open.folders.map((one) => one.name),
        ...held.folders.map((one) => one.name)
    ]);
    return put(
        open,
        {
            folders: [...held.folders, { name, path: pathAsWritten(found.dir) }],
            primary: held.primary
        },
        name
    );
}

/** Take one entry out of the list; the primary goes with it when the entry is the primary. */
export function removeFolder(open: OpenWorkspace, name: string): FoldersOutcome {
    const held = heldBy(open);
    if (!isValue(held)) return held;
    if (!held.folders.some((one) => one.name === name)) return { error: 'no-such-root' };
    return put(open, {
        folders: held.folders.filter((one) => one.name !== name),
        primary: held.primary === name ? null : held.primary
    });
}

/**
 * Put the list's entries in the order `names` names, which must name each listed name exactly once:
 * a list that has changed since the caller read it is refused `roots-changed`.
 */
export function orderFolders(open: OpenWorkspace, names: string[]): FoldersOutcome {
    const held = heldBy(open);
    if (!isValue(held)) return held;
    const listed = new Set(held.folders.map((one) => one.name));
    if (
        names.length !== listed.size ||
        new Set(names).size !== names.length ||
        !names.every((name) => listed.has(name))
    ) {
        return { error: 'roots-changed' };
    }
    return put(open, {
        folders: names.flatMap((name) => held.folders.filter((one) => one.name === name)),
        primary: held.primary
    });
}
