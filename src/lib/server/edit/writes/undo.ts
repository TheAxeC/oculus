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

import { join, resolve, sep } from 'node:path';
import { z } from 'zod';
import { scalar } from '../../../data/helpers/guards.ts';
import { HUB_LAYER } from '../../../data/helpers/hub-names.ts';
import { keptValues, same } from '../../core/changes.ts';
import { appById } from '../../machine/apps/read/held.ts';
import { APP_STORE, storeNow, writeAppStore } from './apps/store.ts';
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
import { deckSlidesNow, undoDeckSlides } from './config/lists/deck/deck.ts';
import { appSettingNow, undoAppSetting } from './config/app-setting.ts';
import { configKeyNow, writeConfigKey } from './config/config-key.ts';
import { configValueNow, putBackConfigValue, writeConfigValue } from './config/config-value.ts';
import { machineHubs, takeOutAdded } from './config/config-checks.ts';
import { railNow, writeRail } from './config/lists/rail.ts';
import { foldersValueNow, workspaceValueShape, writeFolders } from './config/lists/folders.ts';
import { hubOfFile } from '../../files/workspace/open.ts';
import { railRows } from '../../../data/sources/config/rail.ts';
import {
    createEntry,
    identityOrder,
    idOfIdentity,
    removeEntry,
    reorderCollection,
    writeEntry
} from './entries.ts';
import { holding, primaryOf } from './hubs.ts';
import { manifestValue, writeManifest } from './manifest.ts';
import {
    hostStatus,
    restoreSubtask,
    subtaskValue,
    writeHost,
    writeSubtask,
    writeSubtaskAdd
} from './subtasks.ts';
import { entryId, entryOf, readCollection, type Collection } from '../../files/fs/collections.ts';
import type { FeedKind } from '../../../data/model/index.ts';
import type { Change, ChangeRecord } from '../../core/changes.ts';
import type { SubtaskTarget } from './subtasks.ts';
import type { PrimaryTarget, WriteOutcome, WriteTarget } from '../writes.ts';

/**
 * Why an undo was not made, or the outcome of the write that made it. `unwritable` is a file the
 * writer could not read or write. `refused` carries what the writer would not write: an undo that
 * changed no byte is a refusal and never an answer the page can read as success, since the row
 * would otherwise say the value is back when it is not.
 */
export type UndoOutcome =
    | { error: 'unknown' | 'gone' | 'moved' | 'nothing' | 'copy-gone' | 'deck-gone' | 'outside' }
    | { error: 'unwritable'; records?: ChangeRecord[] }
    | { error: 'refused'; refused: WriteOutcome['refused'] }
    | WriteOutcome;

/** The absolute path a record's `file` names; every record names its file by its absolute path. */
function fileOf(change: Change): string {
    return resolve(change.file);
}

/**
 * The hub a record of a config write was written under: the hub when the file it names lies in the
 * hub's config layer, and none when it lies in the engine's, since a key of the hub list whose
 * write went to the engine's file is taken back there.
 */
function layerHub(into: WriteTarget, change: Change): string | undefined {
    if (into.hub === null) return undefined;
    const layer = resolve(into.hub, HUB_LAYER) + sep;
    return fileOf(change).startsWith(layer) ? into.hub : undefined;
}

/** The paths a record says its write made, as absolute paths. */
function madeBy(change: Change): string[] {
    return (change.created ?? []).map((path) => resolve(path));
}

/** The collection key whose file a record names, or null when the record names another file. */
function collectionOf(into: PrimaryTarget, change: Change): string | null {
    const path = fileOf(change);
    if (into.bookmarks !== undefined && path === resolve(into.bookmarks)) return 'bookmarks';
    const found = into.config.collections.find((one) => resolve(join(into.hub, one.file)) === path);
    return found?.key ?? null;
}

/** The feed whose file a record names, or null when the record names another file. */
function feedOf(into: PrimaryTarget, change: Change): FeedKind | null {
    const path = fileOf(change);
    for (const [kind, relative] of Object.entries(into.config.feeds)) {
        if (isFeedKind(kind) && resolve(join(into.hub, relative)) === path) return kind;
    }
    return null;
}

/** What a subtask change hangs under: one manifest by its id, or one entry of one collection. */
function subtaskTarget(into: PrimaryTarget, change: Change): SubtaskTarget {
    const collection = collectionOf(into, change);
    return collection === null ? { id: change.key } : { id: change.key, collection };
}

/** One collection read for an undo, by the key whose file the record names. */
function collectionFor(
    into: PrimaryTarget,
    change: Change
): { key: string; held: Collection } | null {
    const key = collectionOf(into, change);
    if (key === null) return null;
    const held = readCollection(into.hub, into.config, key, into.bookmarks);
    return held === null ? null : { key, held };
}

/** What a value read answers for an address that is not there. */
const ABSENT = { found: false, value: null } as const;

/**
 * What the file holds now at the address the change names, and whether that address is still there
 * at all. A `found: false` means the project, the entry, the host or the file has gone, or that a
 * collection record names its entry by a value that is not the entry's identity, which is as good
 * a reason to refuse an undo as a value that has moved.
 */
export function valueNow(into: WriteTarget, change: Change): { found: boolean; value: unknown } {
    const own = primaryOf(into);
    if (change.kind === 'manifest') {
        return own === null ? ABSENT : manifestValue(own.hub, own.config, change.key, change.field);
    }
    if (change.kind === 'session') {
        const held = overrides(into.overrides);
        const entry = change.key in held ? held[change.key] : {};
        return { found: true, value: entry[change.field] ?? null };
    }
    if (change.kind === 'host') {
        return own === null ? ABSENT : hostStatus(own.hub, change.key, into.career);
    }
    if (change.kind === 'deck-slides') return deckSlidesNow(into, change);
    if (change.kind === 'rail') {
        const rail = railNow(into.layoutFile);
        return rail === null ? { found: false, value: null } : { found: true, value: rail };
    }
    if (change.kind === 'roots') {
        const file = fileOf(change);
        if (into.workspace === undefined || hubOfFile(file) === null) {
            return { found: false, value: null };
        }
        return foldersValueNow(file);
    }
    if (change.kind === 'config-key') {
        return configKeyNow(into.engine, change.key, change.field, layerHub(into, change));
    }
    if (change.kind === 'app-setting') {
        return appSettingNow(into.engine, into.hub ?? undefined, change.field);
    }
    if (change.kind === 'config-value') {
        return configValueNow(into.engine, change.key, change.field, layerHub(into, change));
    }
    if (own === null) return ABSENT;
    if (change.kind === 'subtask' || change.kind === 'subtask-add') {
        return subtaskValue(own.hub, own.config, subtaskTarget(own, change), change.field);
    }
    if (
        change.kind === 'feed-field' ||
        change.kind === 'feed-delete' ||
        change.kind === 'lead-add' ||
        change.kind === 'radar-add'
    ) {
        const feed = feedOf(own, change);
        if (feed === null) return ABSENT;
        const read = readFeedEntry(own, feed, change.key);
        if (change.kind === 'feed-field') {
            return { found: read !== undefined, value: read?.[change.field] ?? null };
        }
        return { found: true, value: read ?? null };
    }
    const collection = collectionFor(own, change);
    if (collection === null) return ABSENT;
    if (namesOldIdentity(collection.held, change)) return { found: false, value: null };
    if (change.kind === 'reorder') return { found: true, value: identityOrder(collection.held) };
    const entry =
        change.kind === 'entry'
            ? renamedEntry(collection.held, change)
            : entryOf(collection.held, change.key);
    if (change.kind === 'entry') {
        return { found: entry !== undefined, value: entry?.[change.field] ?? null };
    }
    return { found: true, value: entry ?? null };
}

/**
 * Whether a collection record names its entry by a value that is not the entry's identity,
 * which is what a record made while the file's first schema field was another field does: the
 * entry the file lists under that field's value is not the one the record is about. A record of a
 * new or a deleted entry holds the entry's fields, and the identity field of those fields must
 * hold the value the record names it by; a new entry's record whose fields lack it still names its
 * entry when the file holds an entry under the record's key, as when a title was already the key.
 * A reorder record holds identity values, and one of them
 * that is no identity now but is a field value of an entry now names an entry by that field.
 * A field write is not asked: the entry its key names is looked up by the identity field, and an
 * old key finds none.
 */
function namesOldIdentity(held: Collection, change: Change): boolean {
    if (change.kind === 'new-entry' || change.kind === 'delete-entry') {
        const fields = mapShape.safeParse(
            change.kind === 'new-entry' ? change.after : change.before
        );
        const named = fields.success && scalar(fields.data[held.ident]) === change.key;
        if (change.kind === 'delete-entry') return !named;
        return !named && entryOf(held, change.key) === undefined;
    }
    if (change.kind !== 'reorder') return false;
    const identities = new Set(identityOrder(held));
    return wordsBeforeShape
        .parse(change.after)
        .some(
            (word) =>
                !identities.has(word) &&
                held.items.some((item) => Object.values(item).some((one) => scalar(one) === word))
        );
}

/** One feed entry by its feed-specific identity, or undefined when the feed no longer holds it. */
function readFeedEntry(
    into: PrimaryTarget,
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

/** The rail a record holds, as the rows the rail rule reads out of it; none for anything else. */
const railBeforeShape = z.unknown().transform((before) => railRows(before) ?? []);

/** The scalar a feed field held, or null, which clears the field. */
const scalarBeforeShape = z.catch(feedValueShape, null);

/** The kinds of change that write a record of a hub, which an undo takes back in that hub. */
const RECORD_KINDS: readonly string[] = [
    'manifest',
    'subtask',
    'subtask-add',
    'host',
    'feed-field',
    'feed-delete',
    'lead-add',
    'radar-add',
    'entry',
    'new-entry',
    'delete-entry',
    'reorder'
];

/**
 * The write that takes one change back, or the word saying why none was made. The value at the
 * address is checked first: an undo never writes over an edit made since the change it takes back.
 */
export function undoChange(request: WriteTarget, change: Change): UndoOutcome {
    if (change.undo === 'none') return { error: 'nothing' };
    if (change.kind === 'deck') return { error: 'deck-gone' };
    if (change.kind === APP_STORE) return undoStore(request, change);
    // A change to a record is taken back in the hub whose folder holds its file, and in no hub at
    // all when none does: the id it was written under could name a record of another hub.
    const into = RECORD_KINDS.includes(change.kind) ? holding(request, change.file) : request;
    if (into === null) return { error: 'outside' };
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

/**
 * The undo of a store write. The record holds byte sizes, so the two values come from the file the
 * change log kept for it: `nothing` when that file is gone, `gone` when no held app has the view
 * id, `moved` when the store holds a value other than the one the write left, and otherwise the
 * value before goes back through the store writer, which records the undo like any other write.
 */
function undoStore(into: WriteTarget, change: Change): UndoOutcome {
    if (into.apps === undefined || into.changes === undefined) return UNWRITABLE;
    const kept = keptValues(into.changes, change.at);
    if (kept === null) return { error: 'nothing' };
    const app = appById(into.apps.held(), change.key);
    if (app === undefined) return { error: 'gone' };
    let outcome;
    try {
        if (!same(storeNow(into, app), kept.after)) return { error: 'moved' };
        outcome = writeAppStore(into, app, kept.before);
    } catch {
        return UNWRITABLE;
    }
    if ('error' in outcome) return outcome;
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
    const own = primaryOf(into);
    if (change.kind === 'manifest') {
        if (own === null) return null;
        // The record holds the value the file had, so it is written as that value and not read as
        // a form, which would take an empty list, an empty text or `false` out of the file. A field
        // the write removed also holds the lines it removed, which go back where they stood, and a
        // note it rewrote as a map holds the text it replaced, which goes back over its lines.
        return writeManifest(
            own.hub,
            own.config,
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
        if (own === null) return null;
        return writeHost(own.hub, change.key, textBeforeShape.parse(change.before), into.career);
    }
    if (change.kind === 'deck-slides') {
        const outcome = undoDeckSlides(into, change, wordsBeforeShape.parse(change.before));
        if (outcome === null) return null;
        if ('error' in outcome) return outcome;
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
        const file = fileOf(change);
        if (into.workspace === undefined || hubOfFile(file) === null) return UNWRITABLE;
        const outcome = writeFolders(file, workspaceValueShape.parse(change.before));
        if ('error' in outcome) return outcome.error === 'unwritable' ? UNWRITABLE : null;
        return { found: true, ...outcome };
    }
    if (change.kind === 'app-setting') {
        return { found: true, ...undoAppSetting(into, change, madeBy(change)) };
    }
    if (change.kind === 'config-key' || change.kind === 'config-value') {
        const layer = layerHub(into, change);
        // A write that added a key to the hub's config layer is taken back by taking the added text
        // out and removing the file and folders it made.
        if (change.created !== undefined) {
            const outcome = takeOutAdded(
                into.engine,
                into.hub ?? undefined,
                change.key,
                change.field,
                change,
                madeBy(change)
            );
            return outcome === null ? null : { found: true, ...outcome };
        }
        if (change.kind === 'config-key') {
            const outcome = writeConfigKey(
                into.engine,
                change.key,
                change.field,
                change.before,
                undefined,
                layer,
                machineHubs(into)
            );
            return { found: true, ...outcome };
        }
        // The text the write replaced goes back as it was when the file still holds what the write
        // left; any other file is put right through the value write.
        const outcome =
            putBackConfigValue(
                into.engine,
                change.key,
                change.field,
                change,
                layer,
                machineHubs(into)
            ) ??
            writeConfigValue(
                into.engine,
                change.key,
                change.field,
                change.before,
                change.after,
                undefined,
                layer,
                machineHubs(into)
            );
        return { found: true, ...outcome };
    }
    if (own === null) return null;
    if (change.kind === 'subtask') {
        const target = subtaskTarget(own, change);
        const before = mapBeforeShape.parse(change.before);
        if (change.undo === 'delete') return writeSubtaskAdd(own.hub, own.config, target, before);
        return restoreSubtask(own.hub, own.config, target, change.field, before);
    }
    if (change.kind === 'subtask-add') {
        const target = subtaskTarget(own, change);
        return writeSubtask(own.hub, own.config, target, change.field, 'delete');
    }
    if (
        change.kind === 'feed-field' ||
        change.kind === 'feed-delete' ||
        change.kind === 'lead-add' ||
        change.kind === 'radar-add'
    ) {
        return feedUndo(own, change);
    }
    return collectionUndo(own, change);
}

/** The four feed writes, taken back through the writers they came from. */
function feedUndo(into: PrimaryTarget, change: Change): WriteOutcome | null {
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
function collectionUndo(into: PrimaryTarget, change: Change): WriteOutcome | null {
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
    const entry = renamedEntry(held, change);
    if (entry === undefined) return null;
    return writeEntry(
        hub,
        config,
        key,
        entryId(entry, held.ident),
        { [change.field]: change.before },
        bookmarks
    );
}

/**
 * The entry a field record is about: the one listed under its key, else, for a record of a write
 * that renamed the entry, the one listed under the identity before it, which is where the entry is
 * once another record of that write has been undone.
 */
function renamedEntry(held: Collection, change: Change): ReturnType<typeof entryOf> {
    const found = entryOf(held, change.key);
    return found !== undefined || change.was === undefined ? found : entryOf(held, change.was);
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
