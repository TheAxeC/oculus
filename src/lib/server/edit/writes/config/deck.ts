// Layer 2, server. One group's `slides:` written into a deck's `present.yml`, and taken back.
//
// The file is any `present.yml` under a served root: the hub's portfolio deck, a project's deck or
// a custom deck. The request names the root and the file's path under it, the group, `base` (the
// list the page read) and `slides` (the list it wants). It is refused, with nothing written, unless
// the path is a `present.yml` inside a served root, the file holds `base` for that group, no
// name is repeated, and every name is a member, a candidate, a missing name or a conflicting deck
// of the group as the reader sees it now (server/content/deck/read.ts). The edit is over the bytes
// (server/edit/deck-edit.ts) and its result is read back, so a file whose shape the edit cannot
// keep is refused whole.
//
// The record carries the file and the group, its `before` list and its `after` list, and an
// undo writes the `before` list back while the file holds the `after` list, through the same edit
// without the check of names, since the `before` list is what the file held.

import { readFileSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { DECK_FILE } from '../../../../data/sources/deck/read.ts';
import { writeTextAtomic } from '../../../core/json.ts';
import { inside, realPath } from '../../../core/paths.ts';
import { words } from '../../../core/words.ts';
import { readDeck } from '../../../content/deck/read.ts';
import { resolveRootPath } from '../../../files/files.ts';
import { groupSlides, setGroupSlides } from '../../deck-edit.ts';
import type { Change, ChangeRecord } from '../../../core/changes.ts';
import type { WriteOutcome, WriteTarget } from '../../writes.ts';

/** What the write answers with: what it changed and refused, or the word for an unusable file. */
export type DeckSlidesOutcome =
    | { changed: string[]; refused: WriteOutcome['refused']; records?: ChangeRecord[] }
    | { error: 'unwritable' };

/** The one record a write of a group's list leaves. */
function recordOf(file: string, group: string, before: string[], after: string[]): ChangeRecord {
    return { file, key: group, field: 'slides', before, after, undo: 'field' };
}

/**
 * Write one list into a file the caller has checked: the edit, its read-back and the atomic write.
 * Null when the edit could not keep the file as it was.
 */
function put(
    into: WriteTarget,
    file: string,
    group: string,
    slides: string[]
): DeckSlidesOutcome | null {
    const source = readFileSync(file, 'utf8');
    const before = groupSlides(source, group);
    if (before === null) return null;
    const edited = setGroupSlides(source, group, slides);
    if (edited === null) return null;
    if (edited === source) return { changed: [], refused: [] };
    writeTextAtomic(file, edited);
    return {
        changed: [group],
        refused: [],
        records: [recordOf(hubSpelling(into.hub, file), group, before, slides)]
    };
}

/**
 * A real path under the hub's real folder spelled under the hub's own path, so the record names a
 * hub file by its path in the hub whether or not the hub's folder is reached through a link.
 */
function hubSpelling(hub: string, file: string): string {
    const real = realPath(hub);
    return real !== null && inside(file, real) ? join(hub, relative(real, file)) : file;
}

/** Whether a list holds a name twice. */
function repeats(names: string[]): boolean {
    return new Set(names).size !== names.length;
}

/**
 * Set one group's `slides:` of the `present.yml` at `path` under the served root `root`. The names
 * of the new list are checked against the group as the reader finds it now.
 */
export function writeDeckSlides(
    into: WriteTarget,
    request: { root: string; path: string; group: string; base: string[]; slides: string[] }
): DeckSlidesOutcome {
    const { root, path, group, base, slides } = request;
    const text = into.config.text;
    const roots = into.files?.roots();
    if (roots === undefined) return { error: 'unwritable' };
    const refuse = (reason: string): DeckSlidesOutcome => ({
        changed: [],
        refused: [{ field: `${path}:${group}`, reason }]
    });
    if (basename(path) !== DECK_FILE) return refuse(words(text, 'server.deck_slides.not_a_deck'));
    const at = resolveRootPath(roots, root, path);
    if ('error' in at) return refuse(words(text, 'server.deck_slides.outside'));

    const source = readFileSync(at.path, 'utf8');
    const held = groupSlides(source, group);
    if (held === null) return refuse(words(text, 'server.deck_slides.no_group', group));
    if (!isDeepStrictEqual(held, base)) return refuse(words(text, 'server.deck_slides.changed'));
    if (repeats(slides)) return refuse(words(text, 'server.deck_slides.repeated'));

    const deck = readDeck(
        { roots, hub: into.hub, config: into.config, projects: into.projects() },
        root,
        dirname(path)
    );
    const found = deck === 'outside' ? undefined : deck.groups.find((one) => one.name === group);
    if (found === undefined) return refuse(words(text, 'server.deck_slides.no_group', group));
    const known = new Set([
        ...found.members.map((one) => one.name),
        ...found.candidates.map((one) => one.name),
        ...found.conflicts.map((one) => one.name),
        ...found.missing
    ]);
    const stray = slides.find((name) => !known.has(name));
    if (stray !== undefined) return refuse(words(text, 'server.deck_slides.unknown_name', stray));

    return put(into, at.path, group, slides) ?? refuse(words(text, 'server.deck_slides.not_kept'));
}

/**
 * The real path of a `deck-slides` record's file, when it is a `present.yml` in a served root. A
 * root that is a link is compared by its real path.
 */
function deckFileOf(into: WriteTarget, change: Change): string | null {
    const named = resolve(isAbsolute(change.file) ? change.file : join(into.hub, change.file));
    const file = realPath(named) ?? named;
    const roots = into.files?.roots() ?? [];
    if (basename(file) !== DECK_FILE) return null;
    return roots.some((one) => inside(file, realPath(one.dir) ?? one.dir)) ? file : null;
}

/** The list a record's group holds now, and whether the file and the group exist. */
export function deckSlidesNow(
    into: WriteTarget,
    change: Change
): { found: boolean; value: string[] | null } {
    const file = deckFileOf(into, change);
    if (file === null) return { found: false, value: null };
    let source: string;
    try {
        source = readFileSync(file, 'utf8');
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'EACCES') throw error;
        return { found: false, value: null };
    }
    const held = groupSlides(source, change.key);
    return { found: held !== null, value: held };
}

/** Put a record's `before` list back into its group. */
export function undoDeckSlides(
    into: WriteTarget,
    change: Change,
    before: string[]
): DeckSlidesOutcome | null {
    const file = deckFileOf(into, change);
    return file === null ? null : put(into, file, change.key, before);
}
