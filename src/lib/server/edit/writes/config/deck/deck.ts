// Layer 2, server. The lists of a deck's `present.yml` written, and taken back: the `slides:` of
// any number of groups and the `order:` list, in one edit of the file.
//
// The file is any `present.yml` under a served root: the hub's portfolio deck, a project's deck or
// a custom deck. The request names the root and the file's path under it, one `{ group, base,
// slides }` for each group it changes, and `order: { base, entries }` for the order. It is refused
// whole, with nothing written, unless the path is a `present.yml` inside a served root, the file
// holds each `base`, no name is repeated in a list, `entries` is a permutation of the order's
// `base`, and every name of a group's list is a member, a candidate, a missing name or a
// conflicting deck of that group as the reader sees it now (server/content/deck/read.ts), or a name
// that group's `find:` does not see and which the request takes out of another list. That last name
// is refused with a sentence of its own. The edits are over the bytes (server/edit/deck-edit.ts),
// each read back, and the one result is written atomically.
//
// A record carries the file, the list it holds (the group under `slides:<group>`, the order under
// `order`), its `before` and its `after`, and an undo writes the `before` list back while the file
// holds the `after` list, through the same edit without the check of names, since the `before`
// list is what the file held. A record whose key is a group's bare name is read as that group's
// list and taken back through the same path.

import { readFileSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { DECK_FILE } from '../../../../../data/sources/deck/read.ts';
import { orderTokensIn } from '../../../../../data/sources/deck/order-text.ts';
import { writeTextAtomic } from '../../../../core/json.ts';
import { inside, realPath } from '../../../../core/paths.ts';
import { words } from '../../../../core/words.ts';
import { readDeck } from '../../../../content/deck/read.ts';
import { resolveRootPath } from '../../../../files/files.ts';
import { groupSlides, setGroupSlides, setOrder } from '../../../deck-edit.ts';
import { hubSpelling } from './deck-files.ts';
import type { Change, ChangeRecord } from '../../../../core/changes.ts';
import type { WriteOutcome, WriteTarget } from '../../../writes.ts';

/** What the write answers with: what it changed and refused, or the word for an unusable file. */
export type DeckSlidesOutcome =
    | { changed: string[]; refused: WriteOutcome['refused']; records?: ChangeRecord[] }
    | { error: 'unwritable' };

/** One group's list of a request. */
export type GroupList = { group: string; base: string[]; slides: string[] };

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
    before: string[],
    after: string[]
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
    order: string[] | undefined
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
    }
): DeckSlidesOutcome {
    const { root, path, groups, order } = request;
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

    const deck = readDeck(
        { roots, hub: into.hub, config: into.config, projects: into.projects(), hubs: into.hubs },
        root,
        dirname(path)
    );
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

    return (
        put(into, at.path, groups, order?.entries) ??
        refuse(words(text, 'server.deck_slides.not_kept'))
    );
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

/** The list a record's group or order holds now, and whether the file and the list exist. */
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
    const held =
        change.field === ORDER_FIELD
            ? orderTokensIn(source)
            : groupSlides(source, groupOf(change.key));
    return { found: held !== null, value: held };
}

/** Put a record's `before` list back into its group, or the order. */
export function undoDeckSlides(
    into: WriteTarget,
    change: Change,
    before: string[]
): DeckSlidesOutcome | null {
    const file = deckFileOf(into, change);
    if (file === null) return null;
    if (change.field === ORDER_FIELD) return put(into, file, [], before);
    const group = groupOf(change.key);
    return put(into, file, [{ group, base: [], slides: before }], undefined);
}
