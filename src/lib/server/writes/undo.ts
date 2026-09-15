// Layer 2, server. Taking one recorded change back: what the file holds at that address now, and
// the write that puts the earlier value there.
//
// One table, read twice. A change names a body kind and an undo kind, and this is the one place that
// says, for each pair, where the value sits and which writer restores it; the check and the write
// read the same row, so a change can never be checked at one address and written at another. Every
// writer it reaches is the writer the change itself came from, so an undo is an ordinary write and
// is recorded like one.
//
// The check is why an undo is safe to offer: the value the record says the write left is compared
// with the value the file holds now, and a field edited since is refused rather than written over.

import { isAbsolute, join, resolve } from 'node:path';
import { fields, scalar } from '../../data/guards.ts';
import { same } from '../changes.ts';
import {
    FEED_RULES,
    deleteFeedEntry,
    isFeedKind,
    readFeedFile,
    restoreFeedEntry,
    writeFeedField
} from '../feeds.ts';
import { overrides, setHidden, setOverride } from '../sessions/overrides.ts';
import { deckNow, writeDeck } from './deck.ts';
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
import type { FeedKind } from '../../data/model.ts';
import type { Change } from '../changes.ts';
import type { SubtaskTarget } from './subtasks.ts';
import type { WriteOutcome, WriteTarget } from '../writes.ts';

/**
 * Why an undo was not made, or the outcome of the write that made it. `refused` carries what the
 * writer would not write: an undo that changed no byte is a refusal and never an answer the page can
 * read as success, since the row would otherwise say the value is back when it is not.
 */
export type UndoOutcome =
    | { error: 'unknown' | 'gone' | 'moved' | 'nothing' }
    | { error: 'refused'; refused: WriteOutcome['refused'] }
    | WriteOutcome;

/** The absolute path a record's `file` names: it is hub-relative inside the hub and absolute outside. */
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
    if (change.kind === 'host') return hostStatus(into.hub, change.key);
    if (change.kind === 'deck') {
        const lists = deckNow(into.config);
        return lists === null ? { found: false, value: null } : { found: true, value: lists };
    }
    if (change.kind === 'subtask' || change.kind === 'subtask-add') {
        return subtaskValue(into.hub, into.config, subtaskTarget(into, change), change.field);
    }
    if (
        change.kind === 'feed-field' ||
        change.kind === 'feed-delete' ||
        change.kind === 'lead-add'
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

/** A list of words out of a record, or an empty list for anything else. */
function wordsOf(value: unknown): string[] {
    return Array.isArray(value)
        ? value.filter((one): one is string => typeof one === 'string')
        : [];
}

/**
 * The write that takes one change back, or the word saying why none was made. The value at the
 * address is checked first: an undo never writes over an edit made since the change it takes back.
 */
export function undoChange(into: WriteTarget, change: Change): UndoOutcome {
    if (change.undo === 'none') return { error: 'nothing' };
    const now = valueNow(into, change);
    if (!now.found) return { error: 'gone' };
    if (!same(now.value, change.after)) return { error: 'moved' };
    const outcome = apply(into, change);
    if (outcome === null) return { error: 'nothing' };
    // A writer that wrote no byte has not put the value back, whatever it said about the fields it
    // would not write, so the answer is a refusal and carries what it objected to.
    if (outcome.changed.length === 0) return { error: 'refused', refused: outcome.refused };
    return outcome;
}

/** The writer one change goes back through, or null when its kind has none. */
function apply(into: WriteTarget, change: Change): WriteOutcome | null {
    const { hub, config } = into;
    if (change.kind === 'manifest') {
        return writeManifest(hub, config, change.key, { [change.field]: change.before });
    }
    if (change.kind === 'session') {
        if (change.field === 'hidden') {
            return outcomeOf(setHidden(change.key, change.before === true, into.overrides));
        }
        const value = typeof change.before === 'string' ? change.before : '';
        return outcomeOf(setOverride(change.key, { [change.field]: value }, into.overrides));
    }
    if (change.kind === 'host') {
        return writeHost(hub, change.key, typeof change.before === 'string' ? change.before : '');
    }
    if (change.kind === 'deck') {
        const before = fields(change.before);
        const outcome = writeDeck(
            config,
            into.projects(),
            wordsOf(before.selection),
            wordsOf(before.order)
        );
        return 'error' in outcome ? null : { found: true, ...outcome };
    }
    if (change.kind === 'subtask') {
        const target = subtaskTarget(into, change);
        if (change.undo === 'delete')
            return writeSubtaskAdd(hub, config, target, fields(change.before));
        return restoreSubtask(hub, config, target, change.field, fields(change.before));
    }
    if (change.kind === 'subtask-add') {
        return writeSubtask(hub, config, subtaskTarget(into, change), change.field, 'delete');
    }
    if (
        change.kind === 'feed-field' ||
        change.kind === 'feed-delete' ||
        change.kind === 'lead-add'
    ) {
        return feedUndo(into, change);
    }
    return collectionUndo(into, change);
}

/** The three feed writes, taken back through the writers they came from. */
function feedUndo(into: WriteTarget, change: Change): WriteOutcome | null {
    const feed = feedOf(into, change);
    if (feed === null) return null;
    if (change.kind === 'feed-field') {
        const before = change.before;
        const value =
            before === null ||
            typeof before === 'string' ||
            typeof before === 'number' ||
            typeof before === 'boolean'
                ? before
                : null;
        return writeFeedField(into.hub, into.config, feed, change.key, change.field, value);
    }
    if (change.kind === 'feed-delete') {
        return restoreFeedEntry(into.hub, into.config, feed, fields(change.before));
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
        return reorderCollection(hub, config, key, wordsOf(change.before), bookmarks);
    }
    if (change.kind === 'new-entry') {
        const id = idOfIdentity(held, change.key);
        return id === null ? null : removeEntry(hub, config, key, id, bookmarks);
    }
    if (change.kind === 'delete-entry') {
        return createEntry(hub, config, key, fields(change.before), bookmarks);
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
