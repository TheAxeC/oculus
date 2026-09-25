// Layer 2, server. The write bodies the endpoint knows, each as the type it is and the one
// function that reads a request body into it, or into null.
//
// Nothing here touches a file. A parser is pure over its one argument, which is what lets
// tests/routes/edit/write.test.ts cover every refusal without a request, and a body of the wrong
// shape is refused whole rather than having its bad field dropped quietly: the reader is told what
// was wrong.
//
// server/edit/writes.ts is the route and re-exports everything here.

import { isMap } from '../../../data/helpers/guards.ts';
import type { SubtaskAction, SubtaskTarget } from './subtasks.ts';

/** The body a write carries. `kind` is the discriminator later writes are added on. */
export type ManifestWrite = { kind: 'manifest'; id: string; fields: Record<string, unknown> };

/**
 * The other body: one session dismissed from the rail or brought back to it, pinned to an area or
 * unpinned, renamed or given its own title back. A field the body does not name is not touched, and
 * a body naming none of the three is not a write.
 */
export type SessionWrite = {
    kind: 'session';
    id: string;
    hidden?: boolean;
    /** An absolute directory to pin the session to, or the empty string to unpin it. */
    area?: string;
    /** The title to show instead of the transcript's own, or the empty string to clear it. */
    title?: string;
};

/** One collection entry's fields set from the entry editor. */
export type EntryWrite = {
    kind: 'entry';
    collection: string;
    id: string;
    fields: Record<string, unknown>;
};

/** One subtask line acted on: the host it hangs under, which line, and what the button does. */
export type SubtaskWrite = {
    kind: 'subtask';
    target: SubtaskTarget;
    key: string;
    action: SubtaskAction;
    value?: string;
};

/** One subtask line added to a host that may not have a block yet. */
export type SubtaskAddWrite = {
    kind: 'subtask-add';
    target: SubtaskTarget;
    fields: Record<string, unknown>;
};

/** One host of registries/career.yml moved along the pipeline. */
export type HostWrite = { kind: 'host'; name: string; status: string };

/** One new entry of one collection, and one new idea folder. */
export type NewEntryWrite = {
    kind: 'new-entry';
    collection: string;
    fields: Record<string, unknown>;
};
export type NewIdeaWrite = { kind: 'new-idea'; fields: Record<string, unknown> };

/** One collection's entries in the order a drag left them: the identity values, all of them. */
export type ReorderWrite = { kind: 'reorder'; collection: string; order: string[] };

/** One entry of one collection taken out of its file, by the id the reader gave it. */
export type DeleteEntryWrite = { kind: 'delete-entry'; collection: string; id: string };

/** One allowed scalar field of one generated feed entry. */
export type FeedFieldWrite = {
    kind: 'feed-field';
    feed: string;
    id: string;
    field: string;
    value: string | number | boolean | null;
};

/** One generated feed entry removed by its feed-specific identity. */
export type FeedDeleteWrite = { kind: 'feed-delete'; feed: string; id: string };

/** One position lead appended from the feed file's own form schema. */
export type LeadAddWrite = { kind: 'lead-add'; fields: Record<string, unknown> };

/**
 * The public deck's saved lists: which slides it shows, and where every slide of the catalog sits.
 * `order` carries the whole catalog, shown or not, so a slide unchecked and checked again comes
 * back where the reader left it.
 */
export type DeckWrite = { kind: 'deck'; selection: string[]; order: string[] };

/** One LinkedIn idea stub and one idea promoted to a numbered post. */
export type LinkedinIdeaWrite = { kind: 'linkedin-idea'; title: string; category: string };
export type LinkedinPostWrite = { kind: 'linkedin-post'; file: string };

/** One audit finding parked, or brought back, by the signature the scan gave it. */
export type AuditMuteWrite = { kind: 'audit-mute'; signature: string; muted: boolean };

/** The rail's whole list of pages, in order, each entry a label, a glyph name and a page key. */
export type RailWrite = { kind: 'rail'; rail: { label: string; glyph: string; page: string }[] };

const ACTIONS: SubtaskAction[] = ['done', 'reopen', 'snooze', 'delete'];

/** The `target` of a subtask body: `{ id }` for a manifest, `{ collection, id }` for an entry. */
function targetOf(raw: unknown): SubtaskTarget | null {
    if (!isMap(raw)) return null;
    if (typeof raw.id !== 'string' || raw.id === '') return null;
    if (raw.collection === undefined) return { id: raw.id };
    if (typeof raw.collection !== 'string' || raw.collection === '') return null;
    return { id: raw.id, collection: raw.collection };
}

/** The body as a manifest write, or null when it is not one. */
export function manifestWrite(body: unknown): ManifestWrite | null {
    if (!isMap(body)) return null;
    if (body.kind !== 'manifest' || typeof body.id !== 'string' || body.id === '') return null;
    const fields = body.fields;
    if (!isMap(fields)) return null;
    return { kind: 'manifest', id: body.id, fields };
}

/**
 * The body as a session write, or null when it is not one. A field of the wrong type makes the
 * whole body unknown rather than being dropped quietly, and a body carrying none of the three
 * fields is not a write either: there would be nothing to do and nothing to answer with.
 */
export function sessionWrite(body: unknown): SessionWrite | null {
    if (!isMap(body)) return null;
    if (body.kind !== 'session' || typeof body.id !== 'string' || body.id === '') return null;
    const write: SessionWrite = { kind: 'session', id: body.id };
    if (body.hidden !== undefined) {
        if (typeof body.hidden !== 'boolean') return null;
        write.hidden = body.hidden;
    }
    for (const key of ['area', 'title'] as const) {
        const value = body[key];
        if (value === undefined) continue;
        if (typeof value !== 'string') return null;
        write[key] = value;
    }
    if (write.hidden === undefined && write.area === undefined && write.title === undefined) {
        return null;
    }
    return write;
}

/** The body as an entry write, or null when it is not one. */
export function entryWrite(body: unknown): EntryWrite | null {
    if (!isMap(body) || body.kind !== 'entry') return null;
    if (typeof body.collection !== 'string' || body.collection === '') return null;
    if (typeof body.id !== 'string' || body.id === '') return null;
    if (!isMap(body.fields)) return null;
    return { kind: 'entry', collection: body.collection, id: body.id, fields: body.fields };
}

/** The body as a subtask write, or null when it is not one. */
export function subtaskWrite(body: unknown): SubtaskWrite | null {
    if (!isMap(body) || body.kind !== 'subtask') return null;
    const target = targetOf(body.target);
    if (target === null) return null;
    if (typeof body.key !== 'string' || body.key === '') return null;
    const action = body.action;
    if (typeof action !== 'string' || !ACTIONS.includes(action as SubtaskAction)) return null;
    const write: SubtaskWrite = {
        kind: 'subtask',
        target,
        key: body.key,
        action: action as SubtaskAction
    };
    if (body.value !== undefined) {
        if (typeof body.value !== 'string') return null;
        write.value = body.value;
    }
    return write;
}

/** The body as a subtask add, or null when it is not one. */
export function subtaskAdd(body: unknown): SubtaskAddWrite | null {
    if (!isMap(body) || body.kind !== 'subtask-add') return null;
    const target = targetOf(body.target);
    if (target === null || !isMap(body.fields)) return null;
    if (typeof body.fields.do !== 'string' || body.fields.do.trim() === '') return null;
    return { kind: 'subtask-add', target, fields: body.fields };
}

/** The body as a host write, or null when it is not one. */
export function hostWrite(body: unknown): HostWrite | null {
    if (!isMap(body) || body.kind !== 'host') return null;
    if (typeof body.name !== 'string' || body.name === '') return null;
    if (typeof body.status !== 'string' || body.status === '') return null;
    return { kind: 'host', name: body.name, status: body.status };
}

/** The body as a new entry, or null when it is not one. */
export function newEntry(body: unknown): NewEntryWrite | null {
    if (!isMap(body) || body.kind !== 'new-entry') return null;
    if (typeof body.collection !== 'string' || body.collection === '') return null;
    if (!isMap(body.fields)) return null;
    return { kind: 'new-entry', collection: body.collection, fields: body.fields };
}

/**
 * The body as a reorder, or null when it is not one. An order of no values is a reorder of a file
 * with no entries in it and is answered by the writer, not refused here: what is refused here is a
 * body that is not the shape, an order that is not a list of words above all.
 */
export function reorderWrite(body: unknown): ReorderWrite | null {
    if (!isMap(body) || body.kind !== 'reorder') return null;
    if (typeof body.collection !== 'string' || body.collection === '') return null;
    if (!Array.isArray(body.order)) return null;
    if (!body.order.every((one) => typeof one === 'string' && one !== '')) return null;
    return { kind: 'reorder', collection: body.collection, order: body.order as string[] };
}

/** The body as an entry deletion, or null when it is not one. */
export function deleteEntryWrite(body: unknown): DeleteEntryWrite | null {
    if (!isMap(body) || body.kind !== 'delete-entry') return null;
    if (typeof body.collection !== 'string' || body.collection === '') return null;
    if (typeof body.id !== 'string' || body.id === '') return null;
    return { kind: 'delete-entry', collection: body.collection, id: body.id };
}

/** The body as one feed field write, including null to clear the field. */
export function feedFieldWrite(body: unknown): FeedFieldWrite | null {
    if (!isMap(body) || body.kind !== 'feed-field') return null;
    if (typeof body.feed !== 'string' || body.feed === '') return null;
    if (typeof body.id !== 'string' || body.id === '') return null;
    if (typeof body.field !== 'string' || body.field === '') return null;
    if (
        body.value !== null &&
        typeof body.value !== 'string' &&
        typeof body.value !== 'number' &&
        typeof body.value !== 'boolean'
    ) {
        return null;
    }
    return {
        kind: 'feed-field',
        feed: body.feed,
        id: body.id,
        field: body.field,
        value: body.value
    };
}

/** The body as one feed deletion. */
export function feedDeleteWrite(body: unknown): FeedDeleteWrite | null {
    if (!isMap(body) || body.kind !== 'feed-delete') return null;
    if (typeof body.feed !== 'string' || body.feed === '') return null;
    if (typeof body.id !== 'string' || body.id === '') return null;
    return { kind: 'feed-delete', feed: body.feed, id: body.id };
}

/** The body as one new position lead. */
export function leadAddWrite(body: unknown): LeadAddWrite | null {
    if (!isMap(body) || body.kind !== 'lead-add' || !isMap(body.fields)) return null;
    return { kind: 'lead-add', fields: body.fields };
}

/** The body as one new LinkedIn idea. Empty titles reach the writer and become field refusals. */
export function linkedinIdeaWrite(body: unknown): LinkedinIdeaWrite | null {
    if (!isMap(body) || body.kind !== 'linkedin-idea') return null;
    if (typeof body.title !== 'string') return null;
    if (body.category !== undefined && typeof body.category !== 'string') return null;
    return { kind: 'linkedin-idea', title: body.title, category: body.category ?? '' };
}

/** The body as one LinkedIn idea filename to promote. */
export function linkedinPostWrite(body: unknown): LinkedinPostWrite | null {
    if (!isMap(body) || body.kind !== 'linkedin-post' || typeof body.file !== 'string') return null;
    return { kind: 'linkedin-post', file: body.file };
}

/** A list of words, which is what both halves of a deck write are. */
function keyList(value: unknown): string[] | null {
    if (!Array.isArray(value)) return null;
    return value.every((one) => typeof one === 'string' && one !== '') ? (value as string[]) : null;
}

/**
 * The body as a deck write, or null when it is not one. An empty selection is a list of the right
 * shape and reaches the writer, which is where it is refused: the refusal names what was wrong with
 * it rather than the body being unknown to the route.
 */
export function deckWrite(body: unknown): DeckWrite | null {
    if (!isMap(body) || body.kind !== 'deck') return null;
    const selection = keyList(body.selection);
    const order = keyList(body.order);
    if (selection === null || order === null) return null;
    return { kind: 'deck', selection, order };
}

/** One recorded change taken back, addressed by the moment the log stamped it. */
export type UndoWrite = { kind: 'undo'; at: string };

/** The body as an undo, or null when it is not one. */
export function undoWrite(body: unknown): UndoWrite | null {
    if (!isMap(body) || body.kind !== 'undo') return null;
    if (typeof body.at !== 'string' || body.at === '') return null;
    return { kind: 'undo', at: body.at };
}

/** The body as a new idea, or null when it is not one. */
export function newIdea(body: unknown): NewIdeaWrite | null {
    if (!isMap(body) || body.kind !== 'new-idea') return null;
    if (!isMap(body.fields)) return null;
    if (typeof body.fields.id !== 'string' || body.fields.id === '') return null;
    return { kind: 'new-idea', fields: body.fields };
}

/**
 * The body as a mute write, or null when it is not one. The signature itself is checked by the
 * writer.
 */
export function auditMuteWrite(body: unknown): AuditMuteWrite | null {
    if (!isMap(body) || body.kind !== 'audit-mute') return null;
    if (typeof body.signature !== 'string' || body.signature === '') return null;
    if (typeof body.muted !== 'boolean') return null;
    return { kind: 'audit-mute', signature: body.signature, muted: body.muted };
}

/**
 * The body as a rail write, or null when it is not one: a list of maps of three strings. What the
 * strings may be is the writer's to check, against the file it writes.
 */
export function railWrite(body: unknown): RailWrite | null {
    if (!isMap(body) || body.kind !== 'rail') return null;
    if (!Array.isArray(body.rail)) return null;
    const rail: RailWrite['rail'] = [];
    for (const row of body.rail) {
        if (!isMap(row)) return null;
        const { label, glyph, page } = row;
        if (typeof label !== 'string' || typeof glyph !== 'string' || typeof page !== 'string') {
            return null;
        }
        rail.push({ label, glyph, page });
    }
    return { kind: 'rail', rail };
}
