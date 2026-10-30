// Layer 2, client state. A collection entry placed in, or found in, the unsaved text of a source
// tab: a lead's `applied` control puts an application entry into the Applications file's text, and
// Edit in File finds the entry the card draws. The text rules (where the entry goes, which fields
// it starts with, where an existing entry stands) are data/helpers/files/yaml/collection-text.ts;
// this module reads the draft, refuses a draft whose text differs from the disk's, makes the edit
// through the source store and words what it cannot do.
//
// They run synchronously from the draft they are given, so two presses whose reads were in flight
// together place one entry and the second finds it untouched.

import type { KeyFault, SchemaField } from '../../../data/model/index.ts';
import {
    entryAt,
    entryAtIndex,
    entryStub,
    type EntryRefusal,
    type TextPlace
} from '../../../data/helpers/files/yaml/collection-text.ts';
import { t } from '../../shared/words/text.ts';
import type { SourceStore } from './source.svelte.ts';

/**
 * What a placement or a search answers: the place to open the tab at, or why none could be and the
 * line to open the tab at for it (null where the tab stays as it is).
 */
export type EntryAnswer =
    | { ok: true; line: number; column: number }
    | { ok: false; sentence: string; line: number | null };

/** What a file's entries are keyed by: its primary key, or why it has none (`keyFaultOf`). */
export type Keyed = { primary_key?: string; key_fault?: KeyFault };

/** Which entry Edit in File finds: by a field's value (the nth that holds it) or by position. */
export type EntryAt = ({ field: string; value: string; nth?: number } | { index: number }) & {
    label: string;
};

/** The part of the source store these functions read and write. */
type DraftSource = Pick<SourceStore, 'sourceDraft' | 'editSourceDraft'>;

/** The last segment of a file's path, which is what a sentence names the file by. */
function nameOf(file: string): string {
    const path = file.slice(file.indexOf('/') + 1);
    return path.slice(path.lastIndexOf('/') + 1);
}

/** The sentence of a text refusal, naming the file; `fault` is why the file has no primary key. */
function refused(refusal: EntryRefusal, file: string, fault?: KeyFault): EntryAnswer {
    const name = nameOf(file);
    return { ok: false, sentence: refusalText(refusal, name, fault), line: refusal.line };
}

/** The words of a text refusal, naming the file by `name`. */
function refusalText(refusal: EntryRefusal, name: string, fault?: KeyFault): string {
    switch (refusal.code) {
        case 'file_unparsed':
            return t('collection.file_unparsed', name, t('collection.line', refusal.line));
        case 'list_inline':
            return t('collection.list_inline', name);
        case 'list_not_a_list':
            return t('collection.list_not_a_list', name, refusal.key);
        case 'no_primary_key':
            return noPrimaryKeyLine(name, fault);
        case 'stub_unparsed':
            return t('collection.stub_unparsed', name);
    }
}

/**
 * The line saying that the file `name` takes no write because it has no primary key, naming the
 * cause `fault` (`keyFaultOf`) and what takes it away. A card's line about its disabled controls
 * and the refusal to place an entry in the file's text both say it.
 */
export function noPrimaryKeyLine(name: string, fault: KeyFault | undefined): string {
    switch (fault?.cause) {
        case 'two':
            return t('collection.no_primary_key_two', name, fault.fields.join(', '));
        case 'unkeyed':
            return t('collection.no_primary_key_unkeyed', name, fault.field, fault.type);
        case 'beside':
            return t('collection.no_primary_key_beside', name, fault.named, fault.field);
        case 'missing':
            return t('collection.no_primary_key_missing', name);
        case 'unread':
            return t('collection.no_primary_key_unread', name);
        case 'none':
            if (fault.named !== undefined) {
                return t('collection.no_primary_key_named', name, fault.named);
            }
            return t('collection.no_primary_key_none', name);
        default:
            return t('collection.no_primary_key_none', name);
    }
}

/** The sentence of a draft whose text must not be edited, or '' when it may be. */
function unfit(draft: ReturnType<DraftSource['sourceDraft']>): string {
    if (draft.readonly) return t('source.readonly');
    if (draft.truncated) return t('source.truncated');
    if (draft.notText) return t('source.not_text');
    if (draft.disk === 'changed') return t('source.disk_changed');
    if (draft.disk === 'gone') return t('source.disk_gone');
    if (draft.disk === 'unserved') return t('source.disk_unserved');
    return '';
}

/**
 * Put a new entry into the tab's text, built from the file's schema with the fields `values` names,
 * and answer where the caret goes. `keyed` is the file's collection: its primary key, absent for a
 * file with none, and then why it has none. A tab holding the entry already, untouched, answers
 * its place and edits nothing. A draft whose text differs from the disk's, or a text that cannot
 * take the entry, is answered with its sentence and the line the tab opens at.
 */
export function placeEntry(
    source: DraftSource,
    id: string,
    schema: SchemaField[] | undefined,
    keyed: Keyed,
    values: Record<string, unknown> = {}
): EntryAnswer {
    const draft = source.sourceDraft(id);
    const sentence = unfit(draft);
    if (sentence !== '') return { ok: false, sentence, line: null };
    const stub = entryStub(draft.text, schema, keyed.primary_key ?? null, values);
    if ('code' in stub) return refused(stub, draft.file, keyed.key_fault);
    if (stub.edits.length > 0) source.editSourceDraft(id, stub.text, stub.edits);
    return { ok: true, line: stub.line, column: stub.column };
}

/**
 * The answer of a search: the place found, the sentence of a refusal, or, when the text does not
 * hold what `label` names, `collection.entry_gone` naming it and the file.
 */
function answered(
    found: TextPlace | EntryRefusal | null,
    label: string,
    file: string
): EntryAnswer {
    if (found === null) {
        return { ok: false, sentence: t('collection.entry_gone', label, nameOf(file)), line: null };
    }
    if ('code' in found) return refused(found, file);
    return { ok: true, line: found.line, column: found.column };
}

/** Where an entry stands in the tab's text, or why it is not found. */
export function findEntry(source: DraftSource, id: string, at: EntryAt): EntryAnswer {
    const draft = source.sourceDraft(id);
    const found =
        'index' in at
            ? entryAtIndex(draft.text, at.index)
            : entryAt(draft.text, at.field, at.value, at.nth ?? 0);
    return answered(found, at.label, draft.file);
}
