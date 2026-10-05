// Layer 2, server. Taking one recorded change back: what the file holds at that address now, and
// the write that puts the earlier value there.
//
// One table, read twice. A change names a body kind and an undo kind, and this is the one place
// that says, for each pair, where the value sits and which writer restores it; the check and the
// write read the same row, so a change can never be checked at one address and written at another.
// Every writer it reaches is the writer the change itself came from, so an undo is an ordinary
// write and is recorded like one.
//
// The check is why an undo is safe to offer: the value the record says the write left is compared
// with the value the file holds now, and a field edited since is refused rather than written over.
//
// A manifest change that removed a field carries the removed text. The manifest writer puts it
// back where it stood, and writes the value as any value is written only when it fits nowhere: on
// a new line, or inside its line for text removed from a flow map. A change that rewrote a bare
// note or a list of one note as a map carries the text it replaced, which the manifest writer puts
// back over the lines the write left while the file still holds them.

import { isAbsolute, join, resolve } from 'node:path';
import { z } from 'zod';
import { scalar } from '../../../data/helpers/guards.ts';
import { same } from '../../core/changes.ts';
import { mapShape, stringItemsShape } from '../../../data/shapes/shapes.ts';
import { feedValueShape } from './bodies.ts';
import {
    FEED_RULES,
    deleteFeedEntry,
    isFeedKind,
    readFeedFile,
    removeRadarEntry,
    restoreFeedEntry,
    writeFeedField
} from '../feeds.ts';
import { overrides, setFlag, setOverride } from '../../sessions/overrides.ts';
import { deckNow, writeDeck } from './config/deck.ts';
import { configKeyNow, writeConfigKey } from './config/config-key.ts';
import { configValueNow, putBackConfigValue, writeConfigValue } from './config/config-value.ts';
import { railNow, writeRail } from './config/rail.ts';
import { rootsNow, writeRoots } from './config/roots.ts';
import { railRows } from '../../../data/sources/config/rail.ts';
import {
    createEntry,
    entryOf,
    identityOrder,
    idOfIdentity,
    readCollection,
    removeEntry,
    reorderCollection,
    writeEntry
} from './entries.ts';
import { manifestValue, writeManifest } from './manifest.ts';
import {
    hostStatus,
    restoreSubtask,
    subtaskValue,
    writeHost,
    writeSubtask,
    writeSubtaskAdd
} from './subtasks.ts';
import type { Collection } from './entries.ts';
import type { FeedKind } from '../../../data/model/index.ts';
import type { Change, ChangeRecord } from '../../core/changes.ts';
import type { SubtaskTarget } from './subtasks.ts';
import type { WriteOutcome, WriteTarget } from '../writes.ts';

/**
 * Why an undo was not made, or the outcome of the write that made it. `unwritable` is a file the
 * writer could not read or write. `refused` carries what the writer would not write: an undo that
 * changed no byte is a refusal and never an answer the page can read as success, since the row
 * would otherwise say the value is back when it is not.
 */
export type UndoOutcome =
    | { error: 'unknown' | 'gone' | 'moved' | 'nothing' | 'copy-gone' }
    | { error: 'unwritable'; records?: ChangeRecord[] }
    | { error: 'refused'; refused: WriteOutcome['refused'] }
    | WriteOutcome;

/**
 * The absolute path a record's `file` names: it is hub-relative inside the hub and absolute
 * outside.
 */
function fileOf(into: WriteTarget, change: Change): string {
    return resolve(isAbsolute(change.file) ? change.file : join(into.hub, change.file));
}

/** The collection key whose file a record names, or null when the record names another file. */
function collectionOf(into: WriteTarget, change: Change): string | null {
    const path = fileOf(into, change);
    if (path === resolve(into.bookmarks)) return 'bookmarks';
    const found = into.config.collections.find((one) => resolve(join(into.hub, one.file)) === path);
    return found?.key ?? null;
}

/** The feed whose file a record names, or null when the record names another file. */
function feedOf(into: WriteTarget, change: Change): FeedKind | null {
    const path = fileOf(into, change);
    for (const [kind, relative] of Object.entries(into.config.feeds)) {
        if (isFeedKind(kind) && resolve(join(into.hub, relative)) === path) return kind;
    }
    return null;
}

/** What a subtask change hangs under: one manifest by its id, or one entry of one collection. */
function subtaskTarget(into: WriteTarget, change: Change): SubtaskTarget {
    const collection = collectionOf(into, change);
    return collection === null ? { id: change.key } : { id: change.key, collection };
}

/** One collection read for an undo, by the key whose file the record names. */
function collectionFor(
    into: WriteTarget,
    change: Change
): { key: string; held: Collection } | null {
    const key = collectionOf(into, change);
    if (key === null) return null;
    const held = readCollection(into.hub, into.config, key, into.bookmarks);
    return held === null ? null : { key, held };
}

/**
 * What the file holds now at the address the change names, and whether that address is still there
 * at all. A `found: false` means the project, the entry, the host or the file has gone, which is as
 * good a reason to refuse an undo as a value that has moved.
 */
export function valueNow(into: WriteTarget, change: Change): { found: boolean; value: unknown } {
    if (change.kind === 'manifest') {
        return manifestValue(into.hub, into.config, change.key, change.field);
    }
    if (change.kind === 'session') {
        const held = overrides(into.overrides);
        const entry = change.key in held ? held[change.key] : {};
        return { found: true, value: entry[change.field] ?? null };
    }
    if (change.kind === 'host') return hostStatus(into.hub, change.key, into.career);
    if (change.kind === 'deck') {
        const lists = deckNow(into.config);
        return lists === null ? { found: false, value: null } : { found: true, value: lists };
    }
    if (change.kind === 'rail') {
        const rail = railNow(into.layoutFile);
        return rail === null ? { found: false, value: null } : { found: true, value: rail };
    }
    if (change.kind === 'roots') {
        const roots = into.sources === undefined ? null : rootsNow(into.sources.file);
        return roots === null ? { found: false, value: null } : { found: true, value: roots };
    }
    if (change.kind === 'config-key') return configKeyNow(into.engine, change.key, change.field);
    if (change.kind === 'config-value') {
        return configValueNow(into.engine, change.key, change.field);
    }
    if (change.kind === 'subtask' || change.kind === 'subtask-add') {
        return subtaskValue(into.hub, into.config, subtaskTarget(into, change), change.field);
    }
    if (
        change.kind === 'feed-field' ||
        change.kind === 'feed-delete' ||
        change.kind === 'lead-add' ||
        change.kind === 'radar-add'
    ) {
        const feed = feedOf(into, change);
        if (feed === null) return { found: false, value: null };
        const read = readFeedEntry(into, feed, change.key);
        if (change.kind === 'feed-field') {
            return { found: read !== undefined, value: read?.[change.field] ?? null };
        }
        return { found: true, value: read ?? null };
    }
    const collection = collectionFor(into, change);
    if (collection === null) return { found: false, value: null };
    if (change.kind === 'reorder') return { found: true, value: identityOrder(collection.held) };
    const entry = entryOf(collection.held, change.key);
    if (change.kind === 'entry') {
        return { found: entry !== undefined, value: entry?.[change.field] ?? null };
    }
    return { found: true, value: entry ?? null };
}

/** One feed entry by its feed-specific identity, or undefined when the feed no longer holds it. */
function readFeedEntry(
    into: WriteTarget,
    feed: FeedKind,
    id: string
): Record<string, unknown> | undefined {
    try {
        const read = readFeedFile(into.hub, into.config, feed);
        const ident = FEED_RULES[feed].identity;
        return read?.entries.find((one) => scalar(one[ident]) === id);
    } catch {
        return undefined;
    }
}

// What a record's `before` value is read as, by the writer it goes back through. The log is a file
// a hand may have edited, so a value of another type is read as the empty one of its kind.

/** True only for a `true`, which is how a dismissal or a pin is put back. */
const flagBeforeShape = z.boolean().catch(false);

/** The text a field held, or the empty text, which clears the field. */
const textBeforeShape = z.string().catch('');

/** The map an entry or a line held, answered as the record holds it, or the empty map. */
const mapBeforeShape = z.catch(mapShape, () => ({}));

/** The string items of a list the record holds, none for anything that is not a list. */
const wordsBeforeShape = z.catch(stringItemsShape, () => []);

/** The deck's two lists a record holds, each empty when it is missing or no list. */
const deckBeforeShape = z
    .object({ selection: wordsBeforeShape, order: wordsBeforeShape })
    .catch(() => ({ selection: [], order: [] }));

/** The rail a record holds, as the rows the rail rule reads out of it; none for anything else. */
const railBeforeShape = z.unknown().transform((before) => railRows(before) ?? []);

/** The roots list a record holds: the entries that are a pair of text, none for anything else. */
const rootsBeforeShape = z.catch(
    z.array(z.object({ key: z.string().min(1), dir: z.string().min(1) })),
    () => []
);

/** The scalar a feed field held, or null, which clears the field. */
const scalarBeforeShape = z.catch(feedValueShape, null);

/**
 * The write that takes one change back, or the word saying why none was made. The value at the
 * address is checked first: an undo never writes over an edit made since the change it takes back.
 */
export function undoChange(into: WriteTarget, change: Change): UndoOutcome {
    if (change.undo === 'none') return { error: 'nothing' };
    let outcome;
    try {
        const now = valueNow(into, change);
        if (!now.found) return { error: 'gone' };
        if (!same(now.value, change.after)) return { error: 'moved' };
        outcome = apply(into, change);
    } catch {
        // The file is the reader's own and anything about it can go wrong on this machine; the
        // answer is the one a write of the same file gives, and the file is left alone.
        return UNWRITABLE;
    }
    if (outcome === null) return { error: 'nothing' };
    if ('error' in outcome) return outcome;
    // A writer that wrote no byte has not put the value back, whatever it said about the fields it
    // would not write, so the answer is a refusal and carries what it objected to.
    if (outcome.changed.length === 0) return { error: 'refused', refused: outcome.refused };
    return outcome;
}

/** The answer of an undo whose file could not be read or written. */
const UNWRITABLE = { error: 'unwritable' } as const;

/**
 * The writer one change goes back through, or null when its kind has none. A writer that answers
 * `unwritable` gives that answer; any other refusal word of a config writer leaves nothing to
 * write.
 */
function apply(into: WriteTarget, change: Change): WriteOutcome | { error: 'unwritable' } | null {
    const { hub, config } = into;
    if (change.kind === 'manifest') {
        // The record holds the value the file had, so it is written as that value and not read as
        // a form, which would take an empty list, an empty text or `false` out of the file. A field
        // the write removed also holds the lines it removed, which go back where they stood, and a
        // note it rewrote as a map holds the text it replaced, which goes back over its lines.
        return writeManifest(
            hub,
            config,
            change.key,
            { [change.field]: change.before },
            'record',
            change.removed,
            change.replaced
        );
    }
    if (change.kind === 'session') {
        if (change.field === 'hidden' || change.field === 'top') {
            const on = flagBeforeShape.parse(change.before);
            return outcomeOf(setFlag(change.key, change.field, on, into.overrides));
        }
        const value = textBeforeShape.parse(change.before);
        return outcomeOf(setOverride(change.key, { [change.field]: value }, into.overrides));
    }
    if (change.kind === 'host') {
        return writeHost(hub, change.key, textBeforeShape.parse(change.before), into.career);
    }
    if (change.kind === 'deck') {
        const before = deckBeforeShape.parse(change.before);
        const outcome = writeDeck(config, into.projects(), before.selection, before.order);
        if ('error' in outcome) return outcome.error === 'unwritable' ? UNWRITABLE : null;
        return { found: true, ...outcome };
    }
    if (change.kind === 'rail') {
        const outcome = writeRail(
            into.layoutFile,
            railBeforeShape.parse(change.before),
            into.glyphs
        );
        if ('error' in outcome) return outcome.error === 'unwritable' ? UNWRITABLE : null;
        return { found: true, ...outcome };
    }
    if (change.kind === 'roots') {
        if (into.sources === undefined) return UNWRITABLE;
        const outcome = writeRoots(into.sources.file, rootsBeforeShape.parse(change.before));
        if ('error' in outcome) return outcome.error === 'unwritable' ? UNWRITABLE : null;
        return { found: true, ...outcome };
    }
    if (change.kind === 'config-key') {
        const outcome = writeConfigKey(into.engine, change.key, change.field, change.before);
        return { found: true, ...outcome };
    }
    if (change.kind === 'config-value') {
        // The text the write replaced goes back as it was when the file still holds what the write
        // left; any other file is put right through the value write.
        const outcome =
            putBackConfigValue(into.engine, change.key, change.field, change) ??
            writeConfigValue(into.engine, change.key, change.field, change.before, change.after);
        return { found: true, ...outcome };
    }
    if (change.kind === 'subtask') {
        const target = subtaskTarget(into, change);
        const before = mapBeforeShape.parse(change.before);
        if (change.undo === 'delete') return writeSubtaskAdd(hub, config, target, before);
        return restoreSubtask(hub, config, target, change.field, before);
    }
    if (change.kind === 'subtask-add') {
        return writeSubtask(hub, config, subtaskTarget(into, change), change.field, 'delete');
    }
    if (
        change.kind === 'feed-field' ||
        change.kind === 'feed-delete' ||
        change.kind === 'lead-add' ||
        change.kind === 'radar-add'
    ) {
        return feedUndo(into, change);
    }
    return collectionUndo(into, change);
}

/** The four feed writes, taken back through the writers they came from. */
function feedUndo(into: WriteTarget, change: Change): WriteOutcome | null {
    const feed = feedOf(into, change);
    if (feed === null) return null;
    if (change.kind === 'feed-field') {
        const value = scalarBeforeShape.parse(change.before);
        return writeFeedField(into.hub, into.config, feed, change.key, change.field, value);
    }
    if (change.kind === 'feed-delete') {
        return restoreFeedEntry(into.hub, into.config, feed, mapBeforeShape.parse(change.before));
    }
    if (change.kind === 'radar-add') {
        return removeRadarEntry(into.hub, into.config, change.key, change.replaced);
    }
    return deleteFeedEntry(into.hub, into.config, feed, change.key);
}

/** The four collection writes, taken back through the writers they came from. */
function collectionUndo(into: WriteTarget, change: Change): WriteOutcome | null {
    const collection = collectionFor(into, change);
    if (collection === null) return null;
    const { key, held } = collection;
    const { hub, config, bookmarks } = into;
    if (change.kind === 'reorder') {
        return reorderCollection(
            hub,
            config,
            key,
            wordsBeforeShape.parse(change.before),
            bookmarks
        );
    }
    if (change.kind === 'new-entry') {
        const id = idOfIdentity(held, change.key);
        return id === null ? null : removeEntry(hub, config, key, id, bookmarks);
    }
    if (change.kind === 'delete-entry') {
        return createEntry(hub, config, key, mapBeforeShape.parse(change.before), bookmarks);
    }
    const id = idOfIdentity(held, change.key);
    if (id === null) return null;
    return writeEntry(hub, config, key, id, { [change.field]: change.before }, bookmarks);
}

/** An overrides write as the outcome every other writer answers with. */
function outcomeOf(result: {
    changed: string[];
    refused: { field: string; reason: string }[];
    records: WriteOutcome['records'];
}): WriteOutcome {
    return {
        found: true,
        changed: result.changed,
        refused: result.refused,
        records: result.records
    };
}
