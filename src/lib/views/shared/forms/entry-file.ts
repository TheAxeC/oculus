// Layer 3, shared view support. What Edit in File, a lead's `applied` control and a press on a row
// of the Focus board's career banner do: open the YAML file in a source tab and put the caret where
// the entry or the section is, or in a new entry placed in the tab's unsaved text. The text rules
// and the refusals are state/sessions/source/draft-entry.ts; this opens the tab around them
// (`openFound`, which Edit in File and the career banner share). The Add of a collection, a
// registry view, the leads feed and Lit Watch writes the entry itself and opens its page
// (entry/entry-add.ts).
//
// The tab is kept, so a single click elsewhere cannot point a preview tab at another file and drop
// the new entry with it. The place is opened as an empty range, which the editor's range command
// makes a caret, and asking the same place twice goes there again.

import { tick } from 'svelte';
import type { ClientState } from '$lib/state/client/context';
import {
    primaryKeyOf,
    type Entry,
    type IdentityFault,
    type SchemaField
} from '$lib/state/boards/collection';
import {
    findEntry,
    noPrimaryKeyLine,
    placeEntry,
    type EntryAnswer,
    type EntryAt,
    type Keyed
} from '$lib/state/sessions/source/draft-entry';
import type { ViewSource } from '$lib/state/sessions/view-source';
import { t } from '$lib/state/shared/words/text';
import { openSourceFile } from '../links/source-file';
import { bareId } from '$lib/state/shared/page/hubs';

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
 * Place a new entry in a file: the tab opened, the entry placed in its unsaved text, and the caret
 * in it. `keyed` is the file's collection: its primary key, absent for a file with none, which
 * takes no entry, and then why it has none. `values` are fields the entry starts with. `open`
 * opens the tab (beside the reader's view for a lead's `applied`); the place is opened in the tab
 * that holds the file. Nothing is placed and nothing said when no tab could be opened.
 */
export async function placeInFile(
    client: ClientState,
    file: ViewSource,
    schema: SchemaField[] | undefined,
    keyed: Keyed,
    values: Record<string, unknown> = {},
    open: (file: ViewSource) => string = (one) => openSourceFile(client, one)
): Promise<Placed> {
    const id = await openedDraft(client, file, open);
    if (id === '') return { placed: false, sentence: '' };
    const answer = placeEntry(client.source, id, schema, keyed, values);
    return { placed: answer.ok, sentence: await arrived(client, file, answer) };
}

/**
 * Open a file at a place found in its text: the tab opened and kept, its draft read, `find` asked
 * for the place in the tab's text by the tab's id, and the tab opened there. When `find` answers no
 * place, the sentence is its answer's, and the tab is opened at the line a refusal names, or with
 * no line when the text does not hold the place, so a tab newly opened shows the file's top and one
 * already open stays where it was. The sentence is '' when the place is found, and when no tab
 * could be opened.
 */
export async function openFound(
    client: ClientState,
    file: ViewSource,
    find: (tab: string) => EntryAnswer
): Promise<string> {
    const id = await openedDraft(client, file, (one) => openSourceFile(client, one));
    if (id === '') return '';
    return arrived(client, file, find(id));
}

/**
 * Which entry of a file Edit in File opens at: by its value of the primary key `schema` flags when
 * a write can address the entry by it, and by its position in the file when the file has no
 * primary key or the entry's value of it is empty or one that another entry holds, so each of two
 * entries sharing a key opens at its own lines.
 */
function entryTarget(
    entry: Entry,
    schema: SchemaField[] | undefined,
    fault: IdentityFault | undefined
): EntryAt {
    const label = entry.title === '' ? bareId(entry) : entry.title;
    const field = schema === undefined ? null : primaryKeyOf(schema);
    return fault?.own === true || field === null
        ? { index: entry.index, label }
        : { field, value: bareId(entry), label };
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
    const at = entryTarget(entry, schema, fault);
    const sentence = await openFound(client, file, (tab) => findEntry(client.source, tab, at));
    if (sentence !== '') onsaid(sentence);
}

/**
 * The words saying why the controls that write an entry are disabled, or '' when they are not: the
 * file has unsaved text in a source tab, the file has no primary key, or the entry has no value of
 * it a write can address. The unsaved text comes first, since saving it can change the primary key
 * too.
 */
export function blockedBy(
    file: ViewSource | null,
    unsaved: boolean,
    fault: IdentityFault | undefined
): string {
    if (unsaved && file !== null) {
        return t('collection.file_unsaved', fileNameOf(file));
    }
    if (fault === undefined) return '';
    if (fault.kind === 'unkeyed') return noPrimaryKeyLine(fileNameOf(file), fault.cause);
    return t('collection.identity_unusable', fault.field, fault.value);
}

/** The name of the file a control opens, which its title names. */
export function fileNameOf(file: ViewSource | null): string {
    return file === null ? '' : file.path.slice(file.path.lastIndexOf('/') + 1);
}
