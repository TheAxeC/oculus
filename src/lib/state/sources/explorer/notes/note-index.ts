// Layer 2, client state, pure. What the page reads out of the notes of every hub (GET
// /api/fs?notes=1, whose every note carries the files its links find and its tags): whether a file
// is a note and of which hub, the notes that link to one (the Backlinks section), every tag with
// the notes that carry it (the Tags section) and the graph of notes and links (the Notes Graph
// view, in the Map's graph shape of state/boards/structure/graph.ts, so the Map's drawing,
// views/shared/graph/Graph.svelte, draws it), and the search a press on a tag opens.
//
// A link never leaves its hub: the server answers each link with the file of the same notes folder
// it finds (note-links.ts's resolveNote), so a note's backlinks and its edges are its own hub's. A
// link to no note, and an embed of a file that is no note, draws no edge and is no backlink.
//
// A tag is counted once per note however often the note carries it, and compared without letter
// case, as the search a press on it opens is; it is listed by its words as first met, nested on
// `/`, a part that no note carries itself drawn without a count. The search a press opens lists the
// places the tag index holds for the tag and no other: ripgrep finds the lines that may carry it
// (`tagPattern`), and the hits on a line the index does not hold are left out (`taggedHits`).

import type { HubNotes, NoteEntry, NoteLinkRow, SearchFile } from '../../../../data/model/index.ts';
import {
    NOTES_FOLDER,
    inNotes,
    isNote,
    noteTitle
} from '../../../../data/prose/markdown/note-names.ts';

/** A note of a hub: the hub's root key and the note's path inside its notes folder. */
export type NotePlace = { root: string; path: string };

/** The note a file of a served root is, or null for a file of no hub's notes folder. */
export function noteOf(hubs: readonly HubNotes[], root: string, path: string): NotePlace | null {
    const inside = inNotes(path);
    if (inside === null || inside === '' || !isNote(inside)) return null;
    const hub = hubs.find((one) => one.root === root && one.state === 'ok');
    return hub === undefined ? null : { root, path: inside };
}

/** The notes of a hub, in the order the section lists them. */
export function notesOf(hub: HubNotes): NoteEntry[] {
    return hub.entries.filter((one) => one.kind === 'file' && isNote(one.path));
}

/** One link to a note, for the Backlinks section: the note it is in, its line and its text. */
export type Backlink = { path: string; title: string; line: number; text: string };

/** The links to a note from the other notes of its hub, each note's in its order. */
export function backlinksOf(hubs: readonly HubNotes[], note: NotePlace): Backlink[] {
    const hub = hubs.find((one) => one.root === note.root);
    if (hub === undefined) return [];
    return notesOf(hub).flatMap((one) =>
        one.path === note.path
            ? []
            : (one.links ?? [])
                  .filter((link: NoteLinkRow) => link.to === note.path)
                  .map((link) => ({
                      path: one.path,
                      title: noteTitle(one.path),
                      line: link.line,
                      text: link.text
                  }))
    );
}

/** One row of the Tags section: the tag's whole words, its last part, its depth and its count. */
export type TagRow = {
    tag: string;
    name: string;
    depth: number;
    /** How many notes carry the tag itself, and null for a part no note carries alone. */
    count: number | null;
    /** Whether tags nest under it. */
    parent: boolean;
};

/** The key two tags are compared by. */
function tagKey(tag: string): string {
    return tag.toLowerCase();
}

/**
 * Every tag of every hub's notes, nested on `/` and sorted by name at each depth, each with the
 * number of notes that carry it.
 */
export function tagRows(hubs: readonly HubNotes[]): TagRow[] {
    const shown = new Map<string, string>();
    const counts = new Map<string, number>();
    const add = (tag: string, counted: boolean): void => {
        const key = tagKey(tag);
        if (!shown.has(key)) shown.set(key, tag);
        if (counted) counts.set(key, (counts.get(key) ?? 0) + 1);
    };
    for (const hub of hubs) {
        for (const note of notesOf(hub)) {
            const carried = (note.tags ?? []).map((one) => one.tag);
            const own = new Set(carried.map(tagKey));
            for (const key of own) {
                const tag = carried.find((one) => tagKey(one) === key) ?? key;
                const parts = tag.split('/').filter((one) => one !== '');
                parts.forEach((_, at) =>
                    add(parts.slice(0, at + 1).join('/'), at === parts.length - 1)
                );
            }
        }
    }
    const keys = [...shown.keys()];
    const rows: TagRow[] = [];
    const walk = (prefix: string, depth: number): void => {
        const here = keys
            .filter((key) => key.startsWith(prefix) && !key.slice(prefix.length).includes('/'))
            .sort((left, right) => left.localeCompare(right));
        for (const key of here) {
            const tag = shown.get(key) ?? key;
            const parent = keys.some((one) => one.startsWith(`${key}/`));
            rows.push({
                tag,
                name: tag.slice(tag.lastIndexOf('/') + 1),
                depth,
                count: counts.get(key) ?? null,
                parent
            });
            if (parent) walk(`${key}/`, depth + 1);
        }
    };
    walk('', 0);
    return rows;
}

/** Escape a tag's words for a regular expression. */
function escaped(tag: string): string {
    return tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * The regular expression a press on a tag searches every hub's notes folder for, without letter
 * case: a line that may carry the tag, read one line at a time. That is the tag written in a note's
 * text after a space, at the start of a line or after the marks of emphasis there (`**#idea**`),
 * and not followed by a letter, a digit, `_`, `-` or `/`; a `tags:` key line holding the tag's
 * words (`tags: [idea, paper]`, `tags: idea`); and any line holding the tag's words between spaces,
 * commas, brackets or quotes, which covers an item of a list under the key (`- idea`), a list in
 * brackets over several lines (`  idea,`) and a block text over several lines (`  idea paper`).
 * Such a line is also found where the section counts no tag: in a block of code, in a link's text,
 * or in prose. `taggedHits` keeps the hits on the lines the tag index holds the tag at, so the
 * search lists exactly the notes the Tags section counts, each at the line of each of its tags.
 */
export function tagPattern(tag: string): string {
    const word = escaped(tag);
    const inline = `(?:^|\\s)[*_~]*#${word}/*(?:$|[^\\p{L}\\p{N}_/-])`;
    const key = `^(?-i:tags):.*?[\\s\\[,'"#:]${word}(?:$|[\\s\\],'"])`;
    const listed = `(?:^|[\\s,\\['"])#?${word}(?:$|[\\s,\\]'"])`;
    return [inline, key, listed].join('|');
}

/**
 * The hits of a tag's search that the tag index holds: in a note of a hub, on a line at which the
 * note carries the tag (a hit's line counts from one, an index line from zero).
 */
export function taggedHits(
    hubs: readonly HubNotes[],
    tag: string,
    files: readonly SearchFile[]
): SearchFile[] {
    const key = tagKey(tag);
    return files.flatMap((file) => {
        const note = noteOf(hubs, file.root, file.path);
        const hub = hubs.find((one) => one.root === file.root);
        const entry = hub?.entries.find((one) => note !== null && one.path === note.path);
        const lines = new Set(
            (entry?.tags ?? []).filter((one) => tagKey(one.tag) === key).map((one) => one.line + 1)
        );
        const hits = file.hits.filter((hit) => lines.has(hit.line));
        return hits.length > 0 ? [{ ...file, hits }] : [];
    });
}

/** The folder under every hub the search a tag press opens is scoped to. */
export const TAGGED_UNDER = NOTES_FOLDER;
