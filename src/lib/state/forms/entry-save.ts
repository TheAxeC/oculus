// Layer 2, client state. What a save of an entry form posts and where: the changed fields of a page
// entry (page-entry.ts), as the one `entry` write of a collection entry, one `feed-field` write per
// field for a feed entry, or the one `career` write of the career file; and the delete of an entry.
//
// A field is posted when the draft holds an edit of it, the form writes it, and its payload
// differs from the saved one (record-values.ts). The fields go in the schema's order. A feed
// entry's fields are written one after another, each its own row of History, and the answers are
// merged into one: the save is ok when every write was, and lists every field changed and every
// field refused. A write refused as a whole stops the save there: the answer is not ok, lists the
// fields written before it, and the fields after it are not sent.

import type { WriteAnswer, WritesStore } from '../shared/stores/shapes.ts';
import { t } from '../shared/words/text.ts';
import { fieldDiffers, payloadOf } from './record-values.ts';
import { sampleOf, type PageEntry } from './page-entry.ts';
import type { FormField } from './schema.ts';

/** What a save posts: the payload of each changed field, and the edit each was made from. */
export type Payload = { body: Record<string, unknown>; taken: Record<string, unknown> };

/**
 * The fields of `page` the draft's `edits` would write, in the schema's order. `taken` holds the
 * edits themselves, which the draft compares with what was typed while the save was on its way.
 */
export function pagePayload(
    page: PageEntry,
    fields: readonly FormField[],
    edits: Record<string, unknown>
): Payload {
    const body: Record<string, unknown> = {};
    const taken: Record<string, unknown> = {};
    for (const field of fields) {
        if (!(field.field in edits) || page.fixed.includes(field.field)) continue;
        const edit = edits[field.field];
        const saved = page.values[field.field];
        if (!fieldDiffers(field, edit, saved, sampleOf(page, field.field))) continue;
        body[field.field] = payloadOf(field, edit, saved);
        taken[field.field] = edit;
    }
    return { body, taken };
}

/** The writes a save is made through. */
export type SaveWrites = Pick<WritesStore, 'writeEntry' | 'writeFeedField' | 'writeCareer'>;

/**
 * The value a feed field is written as: a feed holds text, numbers, booleans and nothing else, and
 * a cleared field is null. A list or a map has no such value, so it is undefined and refused.
 */
function feedValue(value: unknown): string | number | boolean | null | undefined {
    if (value === null) return null;
    return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
        ? value
        : undefined;
}

/**
 * Post the changed fields of a page entry; the answer lists what changed and what was refused, and
 * for a feed entry whose later write was refused as a whole, the fields written before it.
 */
export async function savePage(
    page: PageEntry,
    body: Record<string, unknown>,
    writes: SaveWrites
): Promise<WriteAnswer> {
    if (page.kind === 'career') return writes.writeCareer(body);
    if (page.kind === 'collection') return writes.writeEntry(page.collection, page.writeId, body);
    const merged: WriteAnswer = { ok: true, changed: [], refused: [] };
    for (const [field, value] of Object.entries(body)) {
        const one = feedValue(value);
        if (one === undefined) {
            merged.refused.push({ field, reason: t('entry_form.feed_scalar', field) });
            continue;
        }
        const answer = await writes.writeFeedField(
            page.collection,
            page.writeId,
            field,
            one,
            page.root
        );
        merged.changed.push(...answer.changed);
        merged.refused.push(...answer.refused);
        if (!answer.ok) {
            merged.ok = false;
            merged.error = answer.error;
            break;
        }
    }
    return merged;
}

/**
 * Delete the entry a page shows: `delete-entry` for a collection entry, `feed-delete` in the hub
 * that holds a feed entry. The career file is not deletable.
 */
export async function deletePage(
    page: PageEntry,
    writes: Pick<WritesStore, 'deleteEntry' | 'deleteFeedEntry'>
): Promise<WriteAnswer> {
    return page.kind === 'feed'
        ? writes.deleteFeedEntry(page.collection, page.writeId, page.root)
        : writes.deleteEntry(page.collection, page.writeId);
}
