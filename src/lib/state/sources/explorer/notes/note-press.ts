// Layer 2, client state, pure. What a note's rendered half and its Markdown Preview are drawn with
// and what a press in them does: the context a note is drawn in (`noteDrawing`, the links of its
// hub resolved, the files of its notes folder at the file route's address, the embedded notes'
// texts), and the reading of a press on a link or a tag (`notePressed`), which opens the note at
// its heading, makes a missing note, says why a name the rule refuses makes nothing, or opens the
// search of a tag.
//
// A link resolves among the files of its own hub's notes folder only (note-links.ts's
// resolveNote), so a press never reaches another hub's note. A missing note is made where decision
// 11 says: at the top of the hub's notes folder for a bare name, in the folders `[[folder/name]]`
// names for one with folders, the notes folder itself made by the same create when the hub has
// none yet (`noteMaking`).

import type { HubNotes } from '../../../../data/model/index.ts';
import { fileBytesUrl } from '../../../../data/helpers/files/address.ts';
import { resolveNote, scanNote } from '../../../../data/prose/markdown/note-links.ts';
import { NOTE_SUFFIX, nameKey, noteName } from '../../../../data/prose/markdown/note-names.ts';
import {
    pressedNote,
    pressedTag,
    type NoteDrawing
} from '../../../../data/prose/markdown/note-render.ts';
import { noteOf } from './note-index.ts';
import { nameRefusalSentence, noteMaking, notePath } from './note-tree.ts';

type Words = (key: string, ...args: (string | number)[]) => string;

/** What a press on a note's link or tag asks for. */
export type NotePress =
    /** Open a note, a path under the hub's root, at the heading named, '' for its top. */
    | { kind: 'open'; root: string; path: string; heading: string }
    /** Make a missing note, created into `into` under `name`, then open it at `path`. */
    | { kind: 'make'; root: string; path: string; into: string; name: string }
    /** A name the rule refuses: the sentence saying why, and nothing made. */
    | { kind: 'refused'; sentence: string }
    /** Open the search of a tag. */
    | { kind: 'tag'; tag: string };

/** The files of a hub's notes folder, as paths inside it. */
function filesOf(hub: HubNotes): string[] {
    return hub.entries.filter((one) => one.kind === 'file').map((one) => one.path);
}

/** The sentence a name of a link is refused with, segment by segment, or null for one it takes. */
function refusalOf(name: string, t: Words): string | null {
    for (const part of name.split('/')) {
        const made = noteName(part);
        if (!made.ok) return nameRefusalSentence(made.refusal, t);
    }
    return null;
}

/**
 * What a press on an address of a note's drawing asks for, the note being a file of `root`, or
 * null for an address that is no link's or tag's, and for a link in a file of no hub's notes.
 */
export function notePressed(
    hubs: readonly HubNotes[],
    root: string,
    href: string,
    t: Words
): NotePress | null {
    const tag = pressedTag(href);
    if (tag !== null) return { kind: 'tag', tag };
    const link = pressedNote(href);
    const hub = hubs.find((one) => one.root === root && one.state !== 'refused');
    if (link === null || hub === undefined) return null;
    const found = resolveNote(link.name, filesOf(hub));
    if (found !== null) return { kind: 'open', root, path: notePath(found), heading: link.heading };
    const refused = refusalOf(link.name, t);
    if (refused !== null) return { kind: 'refused', sentence: refused };
    const parts = link.name.split('/').map((part) => part.trim().normalize('NFC'));
    const inside = `${parts.join('/')}${NOTE_SUFFIX}`;
    const making = noteMaking(hub, inside);
    return { kind: 'make', root, path: notePath(inside), into: making.into, name: making.name };
}

/** The line, from one, of a note's heading of these words (without letter case), or 0 for none. */
export function headingLine(text: string, heading: string): number {
    if (heading === '') return 0;
    const key = nameKey(heading.trim());
    const found = scanNote(text).headings.find((one) => nameKey(one.text) === key);
    return found === undefined ? 0 : found.line + 1;
}

/**
 * What a file of `root` is drawn with when it is a note of a hub whose notes read: its links
 * resolved among that hub's notes folder, its embedded pictures at the file route's address, a
 * refused name's sentence, and an embedded note's text as `text` answers it (null while unread);
 * null for any other file, which is drawn by the document rule alone.
 */
export function noteDrawing(
    hubs: readonly HubNotes[],
    file: { root: string; path: string },
    text: (path: string) => string | null,
    t: Words
): NoteDrawing | null {
    if (noteOf(hubs, file.root, file.path) === null) return null;
    const hub = hubs.find((one) => one.root === file.root);
    if (hub === undefined) return null;
    const files = filesOf(hub);
    return {
        resolve: (name) => resolveNote(name, files),
        fileAddress: (path) => fileBytesUrl(file.root, notePath(path)),
        refusal: (name) => refusalOf(name, t),
        text
    };
}
