// Layer 2, server. The scratch notes: one plain-text file per note under ~/.oculus/notes/, written
// while the reader types and read back by the Files view's Notes section.
//
// A note is a file and not a record in a store so that it is a thing the reader can open, copy and
// delete with anything else on this machine; it never leaves it, since nothing here reads or writes
// anything outside the folder the caller names. The first line is the title and everything after it
// is the body, which is what makes the listing readable without parsing the file: the title the
// section draws is the line a `head -1` would give.
//
// Every path is checked three times: an id is one plain name, the path it resolves to has to be
// inside the folder, and a file that is already there has to really be inside it. So an id carrying
// a separator or a pair of dots is refused rather than followed, nothing the shape rule let through
// can land outside the folder, and a link left in the folder pointing somewhere else is refused
// rather than read through, which is the rule server/files/files.ts applies to a root.
//
// Nothing here holds state between calls; the folder comes in from the caller.

import { existsSync, readFileSync, readdirSync, realpathSync, rmSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { writeTextAtomic } from '../../sessions/stores/json.ts';

/** The extension every note is written under. */
const NOTE_SUFFIX = '.md';

/** One note as the Files view lists it. */
export type NoteRow = { id: string; title: string; modified: number };

/** One note as its own view reads it: the row, and the text under the title. */
export type NoteText = NoteRow & { body: string };

/** ~/.oculus/notes, resolved at the call rather than at import. */
export function defaultNotesDir(): string {
    return join(homedir(), '.oculus', 'notes');
}

/** The real path of a file or directory, or null when there is nothing there to resolve. */
function real(path: string): string | null {
    try {
        return realpathSync(path);
    } catch {
        return null;
    }
}

/**
 * The file one id names inside the folder, or null when the id is not one this folder holds. An id
 * is one name and no path: a separator or a pair of dots is refused rather than cleaned up and
 * followed, and the resolved path is checked against the folder after that, so nothing the shape
 * rule let through can still land outside.
 *
 * A file that is already there is followed to what it really is. A link left in the folder pointing
 * at a file elsewhere is not one of this folder's notes, so it is refused rather than read; a name
 * nothing is at yet is the file a first save writes.
 */
export function noteFile(dir: string, id: string): string | null {
    if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(id)) return null;
    const path = resolve(join(dir, `${id}${NOTE_SUFFIX}`));
    if (!path.startsWith(resolve(dir) + sep)) return null;
    const folder = real(dir) ?? resolve(dir);
    const found = real(path);
    if (found === null) return path;
    return found.startsWith(folder + sep) ? path : null;
}

/** The title and the body of one note's text: the first line, and everything after it. */
export function splitNote(text: string): { title: string; body: string } {
    const at = text.indexOf('\n');
    if (at < 0) return { title: text, body: '' };
    return { title: text.slice(0, at), body: text.slice(at + 1) };
}

/** The text one note is written as: the title on its own line, then the body. */
export function noteText(title: string, body: string): string {
    return `${title.replace(/[\r\n]+/g, ' ')}\n${body}`;
}

/** One note, or null when there is no such note or it cannot be read. */
export function readNote(dir: string, id: string): NoteText | null {
    const file = noteFile(dir, id);
    if (file === null) return null;
    try {
        const { title, body } = splitNote(readFileSync(file, 'utf8'));
        return { id, title, body, modified: statSync(file).mtimeMs };
    } catch {
        return null;
    }
}

/**
 * Every note in the folder, newest first. A folder that is not there is no notes rather than an
 * error: a machine that has written none has no folder.
 */
export function listNotes(dir: string): NoteRow[] {
    let names: string[];
    try {
        names = readdirSync(dir);
    } catch {
        return [];
    }
    const rows: NoteRow[] = [];
    for (const name of names) {
        if (!name.endsWith(NOTE_SUFFIX)) continue;
        const found = readNote(dir, name.slice(0, -NOTE_SUFFIX.length));
        if (found !== null)
            rows.push({ id: found.id, title: found.title, modified: found.modified });
    }
    rows.sort((left, right) => right.modified - left.modified);
    return rows;
}

/**
 * Write one note whole, making the folder on the first one. An id that is not one name, or one whose
 * file is a link out of the folder, is refused as null and nothing is written.
 */
export function saveNote(dir: string, id: string, title: string, body: string): NoteRow | null {
    const file = noteFile(dir, id);
    if (file === null) return null;
    writeTextAtomic(file, noteText(title, body));
    return { id, title, modified: statSync(file).mtimeMs };
}

/** Take one note off the disk. A note that is not there is not an error; it is already gone. */
export function deleteNote(dir: string, id: string): boolean {
    const file = noteFile(dir, id);
    if (file === null) return false;
    if (!existsSync(file)) return true;
    rmSync(file, { force: true });
    return true;
}
