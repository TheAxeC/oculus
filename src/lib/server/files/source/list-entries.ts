// Layer 2, server. The writes of one list of maps in a file of a repository's `.oculus` folder, the
// `configurations` of `launch.yml` and of `cpp.yml`: an entry appended, the file made when it is
// absent; the changes a form sends made to an entry in its place, each a key set to its new value
// or taken out by a null; an entry taken out. The edit is made over the bytes of the file
// (key-path.ts): only the keys changed are written and every other byte stays, comments and the
// file's own indentation and flow or block styles included, and the result must read back as the
// file with exactly that edit made. A file that is not YAML, whose top is not a map or whose list
// is not a list is left as it is and the write refused; so is an entry with no name, a name
// another entry of the list or the caller's `taken` already holds, an entry the file does not
// hold, an entry the caller's `check` finds a fault in, and an edit the bytes cannot take. The
// answer names the line the entry written starts on.
//
// An entry is found by its name, or by its place in the list and the value it held when the form
// was filled, for a file whose entries may have no name or a repeated one; an entry at that place
// that no longer holds that value is refused as stale rather than overwritten.
//
// Each write is an operation of the Files view's writer (files/fs/ops.ts), so the History lists it
// and its Undo puts the file back as it was: removed for a file the write made, with its old text
// for a file it replaced. The file is read and the new text made inside the writer's turn in the
// write chain, so two writes never read the same file.

import { existsSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { isNode, isSeq, LineCounter, parse, parseDocument } from 'yaml';
import type { UploadAs } from '../../../data/file-ops.ts';
import { isMap as isPlainMap } from '../../../data/helpers/guards.ts';
import { inside, realPath } from '../../core/paths.ts';
import { runOps, runOpsFrom, type OpsTarget } from '../fs/ops.ts';
import { addListEntry, removeListEntry, setKeyPath } from '../../core/files/yaml/key-path.ts';
import { isBlockMap } from '../../core/files/yaml/yaml-values.ts';

/** The folder of a repository that holds the files these writes are of. */
const FOLDER = '.oculus';

/** What a write came to: the line of the entry written, or the word of why nothing was written. */
export type Edited =
    | { ok: true; line: number }
    | {
          ok: false;
          word: 'name' | 'exists' | 'missing' | 'stale' | 'fault' | 'unreadable' | 'unwritable';
          detail: string;
      };

/** How an entry of the list is found: by its name, or by its place and the value it held. */
type Found = { name: string } | { at: number; was: unknown };

/**
 * One write of the list: an entry appended; the entry found given `changes`, each key set to its
 * value or taken out when the value is null; the entry found taken out.
 */
export type EntryEdit =
    | { kind: 'add'; entry: Record<string, unknown> }
    | { kind: 'set'; found: Found; changes: Record<string, unknown> }
    | { kind: 'delete'; found: Found };

/** The file a write is of and what the caller holds it to. */
export type EntriesFile = {
    /** The file's name in the `.oculus` folder, such as `launch.yml`. */
    name: string;
    /** The key of the list at the top of the file. */
    list: string;
    /** The key an entry is named by, `name` when none is given. */
    nameKey?: string;
    /** The History word the write is recorded under, the configuration's words when none. */
    recordAs?: UploadAs;
    /** Names no entry may take beside those of the list. */
    taken?: readonly string[];
    /**
     * A fault of the written text at the entry's place in the list, as one sentence, or null; it
     * is asked only of a write that leaves an entry there.
     */
    check?: (text: string, place: number) => string | null;
};

/** The name of an entry under the file's name key, or null when it has none. */
function nameOf(entry: Record<string, unknown>, key: string): string | null {
    const name = entry[key];
    return typeof name === 'string' && name.trim() !== '' ? name : null;
}

/** The place of the entry found in the list, or why there is none. */
function placeOf(
    items: unknown[],
    names: unknown[],
    found: Found
): number | Extract<Edited, { ok: false }> {
    if ('name' in found) {
        const at = names.indexOf(found.name);
        return at < 0 ? { ok: false, word: 'missing', detail: found.name } : at;
    }
    if (!Number.isInteger(found.at) || found.at < 0 || found.at >= items.length) {
        return { ok: false, word: 'missing', detail: String(found.at + 1) };
    }
    if (!isDeepStrictEqual(items[found.at], found.was)) {
        return { ok: false, word: 'stale', detail: String(found.at + 1) };
    }
    return found.at;
}

/** The entry as a map of its keys, the empty map for an entry that is no map. */
function mapOf(value: unknown): Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
        ? { ...(value as Record<string, unknown>) }
        : {};
}

/** An entry with the changes made: each key set to its value, or taken out by a null. */
function changed(entry: unknown, changes: Record<string, unknown>): Record<string, unknown> {
    const next = { ...mapOf(entry), ...changes };
    return Object.fromEntries(
        Object.entries(next).filter(([key, value]) => value !== null || !(key in changes))
    );
}

/** The text of an entry written over the bytes of the file, or null when it cannot be. */
function written(
    text: string,
    list: string,
    edit: EntryEdit,
    at: number,
    entry: Record<string, unknown>
): string | null {
    if (edit.kind === 'delete') return removeListEntry(text, list, at);
    if (edit.kind === 'add') return isBlockMap(entry) ? addListEntry(text, list, entry) : null;
    let out: string | null = text;
    for (const [key, value] of Object.entries(edit.changes)) {
        if (out === null) return null;
        out = setKeyPath(out, [list, at, key], value);
    }
    return out;
}

/** The text of the file with the edit made, or why nothing is written. */
function edited(
    path: string,
    file: EntriesFile,
    edit: EntryEdit
): { text: string; line: number } | Extract<Edited, { ok: false }> {
    const text = existsSync(path) ? readFileSync(path, 'utf8') : '';
    const document = parseDocument(text);
    if (document.errors.length > 0) {
        return { ok: false, word: 'unreadable', detail: document.errors[0].message };
    }
    const top: unknown = document.toJS();
    if (top !== null && top !== undefined && !isPlainMap(top)) {
        return { ok: false, word: 'unreadable', detail: join(FOLDER, file.name) };
    }
    const before = isPlainMap(top) ? top : {};
    const held = before[file.list];
    if (held !== undefined && held !== null && !Array.isArray(held)) {
        return { ok: false, word: 'unreadable', detail: file.list };
    }
    const items: unknown[] = Array.isArray(held) ? held : [];
    const key = file.nameKey ?? 'name';
    const names = items.map((one) => mapOf(one)[key]);
    const at = edit.kind === 'add' ? -1 : placeOf(items, names, edit.found);
    if (typeof at !== 'number') return at;
    const entry =
        edit.kind === 'add'
            ? edit.entry
            : edit.kind === 'set'
              ? changed(items[at], edit.changes)
              : {};
    if (edit.kind !== 'delete') {
        const name = nameOf(entry, key);
        if (name === null) return { ok: false, word: 'name', detail: '' };
        if (names.some((one, index) => one === name && index !== at)) {
            return { ok: false, word: 'exists', detail: name };
        }
        if ((file.taken ?? []).includes(name)) return { ok: false, word: 'exists', detail: name };
    }
    const next =
        edit.kind === 'delete'
            ? items.toSpliced(at, 1)
            : at < 0
              ? [...items, entry]
              : items.with(at, entry);
    const out = written(text, file.list, edit, at, entry);
    const after: unknown = out === null ? undefined : parse(out);
    if (out === null || !isDeepStrictEqual(after, { ...before, [file.list]: next })) {
        return { ok: false, word: 'unwritable', detail: join(FOLDER, file.name) };
    }
    const place = edit.kind === 'delete' ? -1 : at < 0 ? next.length - 1 : at;
    if (place < 0) return { text: out, line: 1 };
    const fault = file.check?.(out, place) ?? null;
    if (fault !== null) return { ok: false, word: 'fault', detail: fault };
    return { text: out, line: lineOfEntry(out, file.list, place) };
}

/** The History word a write of the list is recorded under. */
function recordedAs(edit: EntryEdit): UploadAs {
    if (edit.kind === 'add') return 'add-configuration';
    return edit.kind === 'delete' ? 'delete-configuration' : 'edit-configuration';
}

/** What a write of a file's text came to: written, or the word of why not. */
export type TextWritten = { ok: true } | { ok: false; word: 'unwritable'; detail: string };

/**
 * Write a file under one of the roots of `into` as one operation of the Files view's writer, its
 * new text made by `make` from the text it holds (the empty text for a file not there) inside the
 * writer's turn; `make` answers why not, which is answered as it is, and nothing is written. The
 * file's folder must be there; the file is found by its real path, so a root named through a link
 * holds it. A folder found at the path in the writer's turn is refused as `exists`, the name being
 * taken.
 */
export async function writeOwnText<Why>(
    into: OpsTarget,
    named: string,
    make: (text: string) => { text: string } | Why,
    uploadAs: UploadAs
): Promise<TextWritten | Why> {
    const path =
        realPath(named) ?? join(realPath(dirname(named)) ?? dirname(named), basename(named));
    const root = into.roots.find((one) => {
        const dir = realPath(one.dir);
        return dir !== null && inside(path, dir);
    });
    const dir = root === undefined ? null : realPath(root.dir);
    if (root === undefined || dir === null) {
        return { ok: false, word: 'unwritable', detail: 'outside' };
    }
    let outcome: TextWritten | Why = { ok: false, word: 'unwritable', detail: '' };
    const done = await runOpsFrom(
        into,
        () => {
            if (existsSync(path) && !statSync(path).isFile()) {
                outcome = { ok: false, word: 'unwritable', detail: 'exists' };
                return { ok: false, error: 'exists' };
            }
            const next = make(existsSync(path) ? readFileSync(path, 'utf8') : '');
            if (!isText(next)) {
                outcome = next;
                return { ok: false, error: 'not-an-action' };
            }
            outcome = { ok: true };
            return {
                op: 'upload',
                root: root.key,
                path: relative(dir, dirname(path)),
                name: basename(path),
                data: Buffer.from(next.text, 'utf8').toString('base64'),
                replace: existsSync(path)
            };
        },
        { trashReplaced: false, uploadAs }
    );
    if (isText(outcome) && !done.ok) return { ok: false, word: 'unwritable', detail: done.error };
    return outcome;
}

/** Whether a made text is one, rather than the reason there is none. */
function isText(made: unknown): made is { text: string } {
    return typeof made === 'object' && made !== null && 'text' in made;
}

/**
 * Make one write of a repository's file. `named` is the repository's path, which lies under one of
 * the roots of `into` by its real path.
 */
export async function editEntries(
    into: OpsTarget,
    named: string,
    file: EntriesFile,
    edit: EntryEdit
): Promise<Edited> {
    const repo = realPath(named) ?? named;
    const root = into.roots.find((one) => {
        const dir = realPath(one.dir);
        return dir !== null && inside(repo, dir);
    });
    const dir = root === undefined ? null : realPath(root.dir);
    if (root === undefined || dir === null) {
        return { ok: false, word: 'unwritable', detail: 'outside' };
    }
    const path = join(repo, FOLDER, file.name);
    // A write the file would refuse makes no folder, so a refusal leaves nothing behind.
    const first = edited(path, file, edit);
    if (!('text' in first)) return first;
    if (!existsSync(join(repo, FOLDER))) {
        const made = await runOps(into, {
            op: 'create',
            root: root.key,
            path: relative(dir, repo),
            name: FOLDER,
            folder: true
        });
        if (!made.ok) return { ok: false, word: 'unwritable', detail: made.error };
    }
    let line = 1;
    const done = await writeOwnText(
        into,
        path,
        (): { text: string } | Extract<Edited, { ok: false }> => {
            const next = edited(path, file, edit);
            if ('text' in next) line = next.line;
            return next;
        },
        file.recordAs ?? recordedAs(edit)
    );
    return done.ok ? { ok: true, line } : done;
}

/** The line the entry at `place` of the list starts on in the written text, or 1. */
function lineOfEntry(text: string, key: string, place: number): number {
    const counter = new LineCounter();
    const document = parseDocument(text, { lineCounter: counter });
    const list = document.get(key, true);
    const entry: unknown = isSeq(list) ? list.items[place] : undefined;
    const start = isNode(entry) ? entry.range?.[0] : undefined;
    return start === undefined ? 1 : counter.linePos(start).line;
}
