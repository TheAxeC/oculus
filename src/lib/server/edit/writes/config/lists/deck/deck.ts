// Layer 2, server. The lists of a deck's `present.yml` written, and taken back: the `slides:` of
// any number of groups, the `order:` list and the keys the Slides view sets beside them
// (deck-keys.ts), in one edit of the file.
//
// The file is any `present.yml` under a served root: the hub's portfolio deck, a project's deck or
// a custom deck. The request names the root and the file's path under it, one `{ group, base,
// slides }` for each group it changes, `order: { base, entries }` for the order, and `{ path, base,
// value }` for each key, `base` the value the page read and `value` null to take the key out. It is
// refused whole, with nothing written, unless every key is one the Slides view sets, of a group the
// file holds, holding its `base` and given a value it takes, and unless the path is a `present.yml`
// inside a served root, the file holds each `base`, no name is repeated in a list, `entries` is a
// permutation of the order's `base`, and every name of a group's list is a member, a candidate, a
// missing name or a conflicting deck of that group as the reader sees it now
// (server/content/deck/read.ts), or a name that group's `find:` does not see and which the request
// takes out of another list. That last name is refused with a sentence of its own. The edits are
// over the bytes (server/edit/deck-edit.ts), each read back, and the one result is written
// atomically.
//
// A record carries the file, the list it holds (the group under `slides:<group>`, the order under
// `order`, a key under the map that holds it with the key as its field), its `before` and its
// `after`, and an undo writes the `before` list or value back while the file holds the `after` one,
// through the same edit without the check of names, since the `before` is what the file held. A
// record whose key is a group's bare name is read as that group's list and taken back through the
// same path.

import { readFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { DECK_FILE } from '../../../../../../data/sources/deck/read.ts';
import { orderTokensIn } from '../../../../../../data/sources/deck/order-text.ts';
import { writeTextAtomic } from '../../../../../core/json.ts';
import { inside, realPath } from '../../../../../core/paths.ts';
import { words } from '../../../../../core/words.ts';
import { readDeck } from '../../../../../content/deck/read.ts';
import { resolveRootPath } from '../../../../../files/files.ts';
import {
    deckKeyAt,
    groupSlides,
    setDeckKeys,
    setGroupSlides,
    setOrder,
    type DeckKey
} from '../../../../deck-edit.ts';
import { deckSourceOf, hubSpelling } from './deck-files.ts';
import { KEY_FIELDS, keyRefusal, recordKey, recordPath } from './deck-keys.ts';
import type { Change, ChangeRecord } from '../../../../../core/changes.ts';
import type { WriteOutcome, WriteTarget } from '../../../../writes.ts';

/** What the write answers with: what it changed and refused, or the word for an unusable file. */
export type DeckSlidesOutcome =
    | { changed: string[]; refused: WriteOutcome['refused']; records?: ChangeRecord[] }
    | { error: 'unwritable' };

/** One group's list of a request. */
export type GroupList = { group: string; base: string[]; slides: string[] };

/** One key of a request: its path, the value the page read, and the value to write. */
export type KeyEdit = { path: string[]; base: unknown; value: unknown };

/** The key a group's list is recorded under, and the field and key of the order's record. */
const SLIDES_KEY = 'slides:';
const ORDER_FIELD = 'order';

/** The group a record's key names: a record keyed by the bare group name names that group. */
function groupOf(key: string): string {
    return key.startsWith(SLIDES_KEY) ? key.slice(SLIDES_KEY.length) : key;
}

/** The one record a write of a list leaves. */
function recordOf(
    file: string,
    key: string,
    field: string,
    before: unknown,
    after: unknown
): ChangeRecord {
    return { file, key, field, before, after, undo: 'field' };
}

/** Whether a list holds a name twice. */
function repeats(names: string[]): boolean {
    return new Set(names).size !== names.length;
}

/** The names one group knows in a deck: its members, candidates, conflicting decks and missing. */
function knownIn(group: {
    members: { name: string }[];
    candidates: { name: string }[];
    conflicts: { name: string }[];
    missing: string[];
}): Set<string> {
    return new Set([
        ...group.members.map((one) => one.name),
        ...group.candidates.map((one) => one.name),
        ...group.conflicts.map((one) => one.name),
        ...group.missing
    ]);
}

/**
 * Write the lists into a file the caller has checked: each edit over the text the one before
 * left, then the atomic write. Null when an edit could not keep the file as it was.
 */
function put(
    into: WriteTarget,
    file: string,
    lists: GroupList[],
    order: string[] | undefined,
    keys: DeckKey[] = []
): DeckSlidesOutcome | null {
    const source = readFileSync(file, 'utf8');
    const spelled = hubSpelling(into.hub, file);
    let text = source;
    const changed: string[] = [];
    const records: ChangeRecord[] = [];
    for (const list of lists) {
        const before = groupSlides(text, list.group);
        const edited = setGroupSlides(text, list.group, list.slides);
        if (before === null || edited === null) return null;
        text = edited;
        if (isDeepStrictEqual(before, list.slides)) continue;
        changed.push(list.group);
        records.push(
            recordOf(spelled, `${SLIDES_KEY}${list.group}`, 'slides', before, list.slides)
        );
    }
    if (order !== undefined) {
        const before = orderTokensIn(text);
        const edited = setOrder(text, order);
        if (before === null || edited === null) return null;
        text = edited;
        if (!isDeepStrictEqual(before, order)) {
            changed.push(ORDER_FIELD);
            records.push(recordOf(spelled, ORDER_FIELD, ORDER_FIELD, before, order));
        }
    }
    if (keys.length > 0) {
        const before = keys.map((one) => deckKeyAt(text, one.path));
        const edited = setDeckKeys(text, keys);
        if (edited === null) return null;
        text = edited;
        keys.forEach((one, at) => {
            if (isDeepStrictEqual(before[at], one.value)) return;
            const field = one.path[one.path.length - 1];
            changed.push(one.path.join('.'));
            records.push(recordOf(spelled, recordKey(one.path), field, before[at], one.value));
        });
    }
    if (text === source) return { changed: [], refused: [] };
    writeTextAtomic(file, text);
    return { changed, refused: [], records };
}

/**
 * Set the lists of the `present.yml` at `path` under the served root `root`. The names of each new
 * list are checked against its group as the reader finds it now.
 */
export function writeDeckSlides(
    into: WriteTarget,
    request: {
        root: string;
        path: string;
        groups: GroupList[];
        order?: { base: string[]; entries: string[] };
        keys?: KeyEdit[];
    }
): DeckSlidesOutcome {
    const { root, path, groups, order } = request;
    const keys = request.keys ?? [];
    const text = into.config.text;
    const roots = into.files?.roots();
    if (roots === undefined) return { error: 'unwritable' };
    const refuse = (reason: string): DeckSlidesOutcome => ({
        changed: [],
        refused: [{ field: path, reason }]
    });
    if (basename(path) !== DECK_FILE) return refuse(words(text, 'server.deck_slides.not_a_deck'));
    const at = resolveRootPath(roots, root, path);
    if ('error' in at) return refuse(words(text, 'server.deck_slides.outside'));

    const source = readFileSync(at.path, 'utf8');
    for (const list of groups) {
        const held = groupSlides(source, list.group);
        if (held === null) return refuse(words(text, 'server.deck_slides.no_group', list.group));
        if (!isDeepStrictEqual(held, list.base)) {
            return refuse(words(text, 'server.deck_slides.changed'));
        }
        if (repeats(list.slides)) return refuse(words(text, 'server.deck_slides.repeated'));
    }
    if (order !== undefined) {
        const held = orderTokensIn(source);
        if (held === null) return refuse(words(text, 'server.deck_slides.not_kept'));
        if (!isDeepStrictEqual(held, order.base)) {
            return refuse(words(text, 'server.deck_slides.order_changed'));
        }
        const sorted = (names: string[]): string[] => [...names].sort();
        if (!isDeepStrictEqual(sorted(order.entries), sorted(order.base))) {
            return refuse(words(text, 'server.deck_slides.order_not_a_permutation'));
        }
    }
    for (const key of keys) {
        const refused = keyRefusal(text, key.path, key.value);
        if (refused !== null) return refuse(refused);
        if (key.path[0] === 'groups' && groupSlides(source, key.path[1]) === null) {
            return refuse(words(text, 'server.deck_slides.no_group', key.path[1]));
        }
        if (!isDeepStrictEqual(deckKeyAt(source, key.path), key.base ?? null)) {
            return refuse(words(text, 'server.deck_slides.key_changed', key.path.join('.')));
        }
    }

    const deck = readDeck(deckSourceOf(into, roots), root, dirname(path));
    if (deck === 'outside') return refuse(words(text, 'server.deck_slides.outside'));
    for (const list of groups) {
        const found = deck.groups.find((one) => one.name === list.group);
        if (found === undefined)
            return refuse(words(text, 'server.deck_slides.no_group', list.group));
        const known = knownIn(found);
        for (const name of list.slides) {
            if (known.has(name)) continue;
            const left = groups.some((one) => one !== list && one.base.includes(name));
            if (left) {
                return refuse(words(text, 'server.deck_slides.not_found_by', name, list.group));
            }
            return refuse(words(text, 'server.deck_slides.unknown_name', name));
        }
    }

    const edits = keys.map((one) => ({ path: one.path, value: one.value }));
    return (
        put(into, at.path, groups, order?.entries, edits) ??
        refuse(words(text, 'server.deck_slides.not_kept'))
    );
}

/**
 * The real path of a `deck-slides` record's file, when it is a `present.yml` in a served root. A
 * root that is a link is compared by its real path.
 */
function deckFileOf(into: WriteTarget, change: Change): string | null {
    const named = resolve(change.file);
    const file = realPath(named) ?? named;
    const roots = into.files?.roots() ?? [];
    if (basename(file) !== DECK_FILE) return null;
    return roots.some((one) => inside(file, realPath(one.dir) ?? one.dir)) ? file : null;
}

/** Whether a record is of a key rather than of a list. */
function ofKey(change: Change): boolean {
    return (KEY_FIELDS as readonly string[]).includes(change.field);
}

/**
 * The list a record's group or order holds now, or the value of its key, and whether the file and
 * the list exist; a key is there whenever the file is.
 */
export function deckSlidesNow(
    into: WriteTarget,
    change: Change
): { found: boolean; value: unknown } {
    const file = deckFileOf(into, change);
    if (file === null) return { found: false, value: null };
    let source: string;
    try {
        source = readFileSync(file, 'utf8');
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'EACCES') throw error;
        return { found: false, value: null };
    }
    if (ofKey(change)) {
        return { found: true, value: deckKeyAt(source, recordPath(change.key, change.field)) };
    }
    const held =
        change.field === ORDER_FIELD
            ? orderTokensIn(source)
            : groupSlides(source, groupOf(change.key));
    return { found: held !== null, value: held };
}

/**
 * Put a record's `before` back: a list into its group or the order, a value into its key. Null
 * when the record names no deck file of a served root, or a list record's `before` is no list.
 */
export function undoDeckSlides(
    into: WriteTarget,
    change: Change,
    held: unknown
): DeckSlidesOutcome | null {
    const file = deckFileOf(into, change);
    if (file === null) return null;
    if (ofKey(change)) {
        const path = recordPath(change.key, change.field);
        return put(into, file, [], undefined, [{ path, value: held ?? null }]);
    }
    if (!Array.isArray(held) || !held.every((one) => typeof one === 'string')) return null;
    if (change.field === ORDER_FIELD) return put(into, file, [], held);
    const group = groupOf(change.key);
    return put(into, file, [{ group, base: [], slides: held }], undefined);
}
