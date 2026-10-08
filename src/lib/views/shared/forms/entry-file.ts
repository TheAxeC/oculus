// Layer 3, shared view support. What the Add and Edit in File controls of a collection, a registry
// view and the leads feed do: open the YAML file in a source tab and put the caret where the entry
// is, or in a new entry placed in the tab's unsaved text. The text rules and the refusals are
// state/sessions/source/draft-entry.ts; this opens the tab around them.
//
// The tab is kept, so a single click elsewhere cannot point a preview tab at another file and drop
// the new entry with it. The place is opened as an empty range, which the editor's range command
// makes a caret, and asking the same place twice goes there again.

import { tick } from 'svelte';
import type { ClientState } from '$lib/state/client/context';
import {
    identityField,
    identityValue,
    type Entry,
    type IdentityFault,
    type SchemaField
} from '$lib/state/boards/collection';
import {
    findEntry,
    placeEntry,
    type EntryAnswer,
    type EntryAt
} from '$lib/state/sessions/source/draft-entry';
import type { ViewSource } from '$lib/state/sessions/view-source';
import { t } from '$lib/state/shared/words/text';
import { openSourceFile } from '../links/source-file';

/** The file's tab opened without a place, kept, and its draft read; '' when none was opened. */
async function openedDraft(
    client: ClientState,
    file: ViewSource,
    open: (file: ViewSource) => string
): Promise<string> {
    const id = open(file);
    if (id === '') return '';
    client.layout.keepPreview(id);
    await client.source.loadSourceDraft(id, file.root, file.path);
    return client.ui.instanceState(id) === undefined ? '' : id;
}

/** Open the tab at an answer: its place, or the line a refusal names, and say the sentence. */
async function arrived(
    client: ClientState,
    file: ViewSource,
    answer: EntryAnswer
): Promise<string> {
    // The editor takes the text the edit made before it takes the place.
    await tick();
    if (answer.ok) {
        openSourceFile(client, {
            ...file,
            line: answer.line,
            column: answer.column,
            endLine: answer.line,
            endColumn: answer.column
        });
        return '';
    }
    if (answer.line !== null) openSourceFile(client, { ...file, line: answer.line });
    return answer.sentence;
}

/** What an Add did: whether the entry is placed in the tab's text, and the sentence to draw. */
export type Placed = { placed: boolean; sentence: string };

/**
 * Add a new entry to a file: the tab opened, the entry placed in its unsaved text, and the caret in
 * it. `values` are fields the entry starts with. `open` opens the tab (beside the reader's view for
 * a lead's `applied`); the place is opened in the tab that holds the file. Nothing is placed and
 * nothing said when no tab could be opened.
 */
export async function placeInFile(
    client: ClientState,
    file: ViewSource,
    schema: SchemaField[] | undefined,
    collection: string,
    values: Record<string, unknown> = {},
    open: (file: ViewSource) => string = (one) => openSourceFile(client, one)
): Promise<Placed> {
    const id = await openedDraft(client, file, open);
    if (id === '') return { placed: false, sentence: '' };
    const answer = placeEntry(client.source, id, schema, collection, values);
    return { placed: answer.ok, sentence: await arrived(client, file, answer) };
}

/** Add a new entry to a file as `placeInFile` does; the answer is the sentence to draw, or ''. */
export async function addInFile(
    client: ClientState,
    file: ViewSource,
    schema: SchemaField[] | undefined,
    collection: string,
    values: Record<string, unknown> = {}
): Promise<string> {
    return (await placeInFile(client, file, schema, collection, values)).sentence;
}

/**
 * Open a file at an entry. The sentence is `collection.entry_gone` when the file's text does not
 * hold the entry, in which case the tab stays where it was, and '' otherwise.
 */
async function editInFile(client: ClientState, file: ViewSource, at: EntryAt): Promise<string> {
    const id = await openedDraft(client, file, (one) => openSourceFile(client, one));
    if (id === '') return '';
    return arrived(client, file, findEntry(client.source, id, at));
}

/**
 * Which entry of a file Edit in File opens at: by the identity field's value when a write can
 * address the entry by it, and by its position in the file when its own identity is empty or one
 * that another entry holds, so each of two entries sharing a title opens at its own lines.
 */
function entryTarget(
    entry: Entry,
    schema: SchemaField[] | undefined,
    fault: IdentityFault | undefined
): EntryAt {
    const label = entry.title === '' ? entry.id : entry.title;
    return fault?.own === true
        ? { index: entry.index, label }
        : { field: identityField(schema), value: identityValue(entry, schema), label };
}

/**
 * Edit in File for one card: the file opened at the entry, the sentence of a refusal said through
 * the card's `onsaid`.
 */
export async function openEntry(
    client: ClientState,
    file: ViewSource | null,
    entry: Entry,
    schema: SchemaField[] | undefined,
    fault: IdentityFault | undefined,
    onsaid: (said: string) => void
): Promise<void> {
    if (file === null) return;
    const sentence = await editInFile(client, file, entryTarget(entry, schema, fault));
    if (sentence !== '') onsaid(sentence);
}

/**
 * The words saying why the controls that write an entry are disabled, or '' when they are not: the
 * file has unsaved text in a source tab, or the entry has no identity a write can address. The
 * unsaved text comes first, since saving it can change the identity too.
 */
export function blockedBy(
    file: ViewSource | null,
    unsaved: boolean,
    fault: IdentityFault | undefined
): string {
    if (unsaved && file !== null) {
        return t('collection.file_unsaved', fileNameOf(file));
    }
    return fault === undefined ? '' : t('collection.identity_unusable', fault.field, fault.value);
}

/** The name of the file a control opens, which its title names. */
export function fileNameOf(file: ViewSource | null): string {
    return file === null ? '' : file.path.slice(file.path.lastIndexOf('/') + 1);
}
