// Layer 2, server. The notes of each hub: the Markdown files of the hub's `.oculus/notes/` folder
// and of every folder under it, each named by its title (data/prose/markdown/note-names.ts), read
// for the Notes section, Backlinks, Tags and the Notes Graph, and the order the reader keeps them
// in. A note is written, renamed, moved and trashed by the file operations (fs/ops.ts) like any
// other file of the hub, so it is logged and undone like one; this module reads the folder and
// writes only the order.
//
// A notes folder that is a link to a folder outside its hub is refused for that hub: its notes are
// not listed. A file or folder inside it that is a link out of the folder is not listed either, so
// it is never opened, linked or counted from here, which is the rule server/files/files.ts serves a
// root by. Dotfiles are left out, as the tree leaves them out, and so is the order file.
//
// The order is `order.json` at the top of the folder, `{ "version": 1, "order": [paths] }`, each
// note by its path inside the folder without `.md`. In each folder the folders come first, by name,
// then the notes the file does not name, newest first, then the notes it names in its order, then
// the other files by name, so a new note is on top. An order file that does not read lists the
// notes newest first, and only a reorder says so, by refusing to write over it.
//
// Each note's links and tags are read from its text with note-links.ts, and each link is answered
// with the file of the same folder it finds, so a page draws Backlinks, the tags and the graph
// from one answer. A note over the most a source tab reads is listed without its links.
//
// A name that lands in a notes folder, by a file operation's create, rename, move, copy or upload,
// follows the name rule (`noteLanding`): a name the rule refuses is `invalid_name`, a name another
// item of the folder already has but for letter case or normalisation is `exists`, and the name is
// written trimmed and in NFC. A note's rule is read on its name without `.md`.
//
// Nothing here holds state between calls; the hubs come in from the caller.

import { lstatSync, readFileSync, readdirSync, statSync, type Dirent } from 'node:fs';
import { join, resolve } from 'node:path';
import { z } from 'zod';
import type { HubNotes, NoteEntry } from '../../../data/model/index.ts';
import { resolveNote, scanNote } from '../../../data/prose/markdown/note-links.ts';
import {
    NOTES_FOLDER,
    NOTE_SUFFIX,
    ORDER_FILE,
    isNote,
    nameKey,
    noteName
} from '../../../data/prose/markdown/note-names.ts';
import { readJsonChecked, writeJsonAtomic } from '../../core/json.ts';
import { below, inside, realPath } from '../../core/paths.ts';

/** The most bytes of a note read for its links and tags. */
const SCAN_MAX = 1024 * 1024;

/** The most characters of a link's line kept for the Backlinks section. */
const LINE_MAX = 200;

/** The folder of a hub its notes live in. */
export function notesFolderOf(hubDir: string): string {
    return join(hubDir, ...NOTES_FOLDER.split('/'));
}

/** Why a notes folder is not read: a link out of its hub, or a read that failed. */
type FolderState = { state: 'ok' | 'none' | 'refused' } | { state: 'unreadable'; error: string };

/** What a hub's notes folder is: there and in the hub, not there yet, a link out, unreadable. */
export function notesFolderState(hubDir: string): FolderState {
    const folder = notesFolderOf(hubDir);
    try {
        lstatSync(folder);
    } catch {
        return { state: 'none' };
    }
    const real = realPath(folder);
    const hub = realPath(hubDir);
    if (real === null || hub === null || !inside(real, hub)) return { state: 'refused' };
    try {
        if (!statSync(real).isDirectory()) return { state: 'unreadable', error: 'not_a_folder' };
        readdirSync(real);
    } catch (error) {
        return { state: 'unreadable', error: (error as NodeJS.ErrnoException).code ?? 'failed' };
    }
    return { state: 'ok' };
}

/**
 * The file a path inside the folder names, or null when it is not one this folder holds: the
 * resolved path must lie in the folder, and a file already there must really be inside it, so a
 * link left in the folder pointing somewhere else is refused rather than read.
 */
export function noteFile(dir: string, path: string): string | null {
    if (path === '' || path.split('/').some((one) => one === '' || one === '..')) return null;
    const file = resolve(join(dir, ...path.split('/')));
    if (!below(file, dir)) return null;
    const folder = realPath(dir) ?? resolve(dir);
    const found = realPath(file);
    if (found === null) return file;
    return below(found, folder) ? file : null;
}

/** The order file's content: its version, and the notes' paths in the order the section lists. */
const orderShape = z.object({ version: z.literal(1), order: z.array(z.string()) });

/** Why the order of the notes was not written. */
export type NoteOrderRefusal = 'no-such-note' | 'notes-order-unreadable';

/**
 * The paths the order file names, in its order; undefined when there is no file, null when the
 * file does not read, is no order of this version, or is a link out of the folder.
 */
function readNoteOrder(dir: string): string[] | null | undefined {
    const file = noteFile(dir, ORDER_FILE);
    if (file === null) return null;
    const read = readJsonChecked(file);
    if (!read.ok) return null;
    if (read.value === undefined) return undefined;
    const held = orderShape.safeParse(read.value);
    return held.success ? held.data.order : null;
}

/** One file found under the folder: its path inside it, its kind and when it was written. */
type Found = { path: string; kind: 'file' | 'dir'; modified: number };

/** Whether an entry of a folder is listed: no dotfile, no order file at the top. */
function listed(entry: Dirent, top: boolean): boolean {
    return !entry.name.startsWith('.') && !(top && entry.name === ORDER_FILE);
}

/**
 * Every file and folder under the folder, with the folder's real path: a link is followed when
 * what it points at lies in the folder and left out otherwise, and a folder that cannot be read is
 * left out with what is in it.
 */
function walk(dir: string): Found[] {
    const top = realPath(dir) ?? resolve(dir);
    const found: Found[] = [];
    const folders: { real: string; path: string }[] = [{ real: top, path: '' }];
    for (let next = folders.shift(); next !== undefined; next = folders.shift()) {
        let entries: Dirent[];
        try {
            entries = readdirSync(next.real, { withFileTypes: true });
        } catch {
            continue;
        }
        for (const entry of entries) {
            if (!listed(entry, next.path === '')) continue;
            const path = next.path === '' ? entry.name : `${next.path}/${entry.name}`;
            const real = realPath(join(next.real, entry.name));
            if (real === null || !below(real, top)) continue;
            try {
                const stat = statSync(real);
                if (stat.isDirectory()) {
                    found.push({ path, kind: 'dir', modified: stat.mtimeMs });
                    folders.push({ real, path });
                } else if (stat.isFile()) {
                    found.push({ path, kind: 'file', modified: stat.mtimeMs });
                }
            } catch {
                continue;
            }
        }
    }
    return found;
}

/**
 * The paths inside a notes folder of every file it lists, the notes and the other files alike, in
 * no order: what a link's name is looked for among.
 */
export function noteFiles(dir: string): string[] {
    return walk(dir)
        .filter((one) => one.kind === 'file')
        .map((one) => one.path);
}

/** The folder a path lies in, the empty path for the top. */
function parentOf(path: string): string {
    const at = path.lastIndexOf('/');
    return at < 0 ? '' : path.slice(0, at);
}

/** A note's path as the order file names it: without `.md`. */
function orderName(path: string): string {
    return path.slice(0, -NOTE_SUFFIX.length);
}

/**
 * The files in the order the section lists them, each folder's together and in the folder order
 * of a walk from the top: in a folder, its folders by name, its notes the order file does not name
 * newest first, the ones it names in its order, then its other files by name.
 */
function ordered(found: Found[], order: readonly string[]): Found[] {
    const byName = (left: Found, right: Found): number => left.path.localeCompare(right.path);
    const place = (one: Found): number => order.indexOf(orderName(one.path));
    const out: Found[] = [];
    const add = (folder: string): void => {
        const here = found.filter((one) => parentOf(one.path) === folder);
        const dirs = here.filter((one) => one.kind === 'dir').sort(byName);
        const notes = here.filter((one) => one.kind === 'file' && isNote(one.path));
        const fresh = notes
            .filter((one) => place(one) < 0)
            .sort((left, right) => right.modified - left.modified);
        const kept = notes
            .filter((one) => place(one) >= 0)
            .sort((left, right) => place(left) - place(right));
        const others = here.filter((one) => one.kind === 'file' && !isNote(one.path)).sort(byName);
        for (const one of [...dirs, ...fresh, ...kept, ...others]) {
            out.push(one);
            if (one.kind === 'dir') add(one.path);
        }
    };
    add('');
    return out;
}

/** The text of a note for its links, or null for one too large or that does not read. */
function noteText(dir: string, path: string): string | null {
    const file = noteFile(dir, path);
    if (file === null) return null;
    try {
        if (statSync(file).size > SCAN_MAX) return null;
        return readFileSync(file, 'utf8');
    } catch {
        return null;
    }
}

/** One note's links, each to the file it finds, and its tags, each at every line it is on. */
function linksOf(text: string, paths: readonly string[]): Pick<NoteEntry, 'links' | 'tags'> {
    const scan = scanNote(text);
    const lines = scan.text.split('\n');
    const links = scan.links.flatMap((link) => {
        const to = resolveNote(link.name, paths);
        if (to === null) return [];
        const line = (lines[link.line] ?? '').trim().slice(0, LINE_MAX);
        return [{ to, line: link.line, text: line }];
    });
    return { links, tags: scan.tags };
}

/**
 * The notes of one hub's folder for the Notes section: every file and folder in the section's
 * order, each note with its links and tags. A folder that is not there, a link out of the hub and
 * a folder that does not read answer their state with no entries.
 */
function readHubNotes(hub: { name: string; dir: string }, primary: boolean): HubNotes {
    const answer = (state: HubNotes['state'], error = ''): HubNotes => ({
        root: hub.name,
        primary,
        state,
        error,
        entries: []
    });
    const held = notesFolderState(hub.dir);
    if (held.state === 'unreadable') return answer('unreadable', held.error);
    if (held.state !== 'ok') return answer(held.state);
    const dir = notesFolderOf(hub.dir);
    const found = walk(dir);
    const paths = found.flatMap((one) => (one.kind === 'file' ? [one.path] : []));
    const entries = ordered(found, readNoteOrder(dir) ?? []).map((one): NoteEntry => {
        if (one.kind !== 'file' || !isNote(one.path)) return one;
        const text = noteText(dir, one.path);
        return text === null ? one : { ...one, ...linksOf(text, paths) };
    });
    return { ...answer('ok'), entries };
}

/**
 * The notes of every hub, in the workspace's folder order, a folder served under two names read
 * once, under its first.
 */
export function readAllNotes(
    hubs: readonly { name: string; dir: string }[],
    primary: string | null
): HubNotes[] {
    const seen = new Set<string>();
    const out: HubNotes[] = [];
    for (const hub of hubs) {
        const real = realPath(hub.dir) ?? resolve(hub.dir);
        if (seen.has(real)) continue;
        seen.add(real);
        out.push(readHubNotes(hub, hub.name === primary));
    }
    return out;
}

/**
 * Write the order the notes are listed in, as paths inside the folder without `.md`. A path that
 * is no note's, or is named again, is dropped, and a list that names no note after that is refused
 * `no-such-note` with nothing written, as is a link out of the folder at the file's place, which
 * is left as it is. A file that does not read, or reads as another shape, is refused
 * `notes-order-unreadable` and left as it is.
 */
export function writeNoteOrder(dir: string, paths: string[]): NoteOrderRefusal | null {
    const file = noteFile(dir, ORDER_FILE);
    if (file === null) return 'no-such-note';
    if (readNoteOrder(dir) === null) return 'notes-order-unreadable';
    const kept: string[] = [];
    for (const path of paths) {
        const note = noteFile(dir, `${path}${NOTE_SUFFIX}`);
        if (kept.includes(path) || note === null) continue;
        try {
            if (!statSync(note).isFile()) continue;
        } catch {
            continue;
        }
        kept.push(path);
    }
    if (kept.length === 0) return 'no-such-note';
    writeJsonAtomic(file, { version: 1, order: kept });
    return null;
}

/** A name as it lands in a folder: the name to write, or the refusal of the file operations. */
export type Landing = { name: string } | { refused: 'invalid_name' | 'exists' };

/** A path by its real path, read through its nearest folder that is there when it is not there. */
function wouldBeReal(path: string): string {
    let known = resolve(path);
    let rest = '';
    while (realPath(known) === null) {
        const up = resolve(known, '..');
        if (up === known) return resolve(path);
        rest = rest === '' ? known.slice(up.length + 1) : join(known.slice(up.length + 1), rest);
        known = up;
    }
    return join(realPath(known) ?? known, rest);
}

/**
 * Whether a folder lies in one of the hubs' notes folders, each path read as its real path where it
 * is there and through its nearest folder that is there where it is not, so a folder of a hub with
 * no notes folder yet is inside the folder the first note makes.
 */
function inNotesFolder(hubs: readonly string[], folder: string): boolean {
    const real = wouldBeReal(folder);
    return hubs.some((hub) => inside(real, wouldBeReal(notesFolderOf(hub))));
}

/**
 * The name an item takes when it lands in `folder` under `name`, by the rule of a notes folder when
 * the folder lies in one (`hubs` the folders of the served hubs), else the name unchanged. `own` is
 * the item's own name in that folder for a rename there, which never takes its own name, so a
 * rename that changes only the case of a name lands.
 */
export function noteLanding(
    hubs: readonly string[],
    folder: string,
    name: string,
    own?: string
): Landing {
    if (!inNotesFolder(hubs, folder)) return { name };
    const suffix = name.toLowerCase().endsWith(NOTE_SUFFIX) ? name.slice(-NOTE_SUFFIX.length) : '';
    const made = noteName(name.slice(0, name.length - suffix.length));
    if (!made.ok) return { refused: 'invalid_name' };
    const written = `${made.name}${suffix}`;
    let names: string[];
    try {
        names = readdirSync(folder);
    } catch {
        names = [];
    }
    const key = nameKey(written);
    const taken = names.some((one) => one !== own && nameKey(one) === key);
    return taken ? { refused: 'exists' } : { name: written };
}
