// Layer 3, view partial. What a pick of a Files row's menu does when it writes: New File... and New
// Folder... start the name input, Rename... starts it on the row, Cut, Copy and Paste work the
// explorer store's clipboard, Delete asks its question and then moves the row to the Trash,
// Upload... reads the files a chooser hands over and posts them one by one, and Select for Compare
// and the two compare items choose and open the comparison of two files.
//
// The stores come in as calls (`RowOpsDeps`), as row-menu.ts's picks do, so a test hands in fakes
// and the questions are a call that answers yes or no. A refusal is said on the tree's refusal line
// in the sentence of the refusal word (`files.refused_*`), never as the word.
//
// rowNaming holds the three calls of the name input the same way: starting one, accepting the text
// typed in it (which makes the item or renames the row), and testing a name against the folder.

import {
    ancestorsOf,
    parentOf,
    setExpanded,
    treeKey,
    type FilesView,
    type TreeRow
} from '$lib/state/sources/fs';
import { namingStarted } from '$lib/state/sources/explorer/naming';
import {
    MAX_UPLOAD_BYTES,
    checkName,
    type Confirm,
    type ExplorerStore,
    type Outcome,
    type Place,
    type Question
} from '$lib/state/sources/explorer/ops.svelte';
import { base64Of, encoded } from '$lib/ui/forms/file/file-data';

type Words = (key: string, ...args: (string | number)[]) => string;

export const ROW_NEW_FILE = 'new-file';
export const ROW_NEW_FOLDER = 'new-folder';
export const ROW_UPLOAD = 'upload';
export const ROW_PASTE = 'paste';
export const ROW_CUT = 'cut';
export const ROW_COPY = 'copy';
export const ROW_RENAME = 'rename';
export const ROW_DELETE = 'delete';
export const ROW_SELECT_COMPARE = 'select-compare';
export const ROW_COMPARE_WITH = 'compare-with';
export const ROW_COMPARE_SELECTED = 'compare-selected';

/** The question the delete asks, which the view draws; the others are the explorer's own. */
export type AskedQuestion =
    | { kind: 'delete'; name: string; folder: boolean; unsaved: boolean }
    | (Question & { upload?: boolean });

/** What a pick needs: the store, the view's questions and name input, and its refusal line. */
export type RowOpsDeps = {
    explorer: Pick<
        ExplorerStore,
        | 'copy'
        | 'cut'
        | 'paste'
        | 'trash'
        | 'upload'
        | 'selectForCompare'
        | 'compareFile'
        | 'clipboard'
    >;
    /** Say a refusal or a result on the tree's line. */
    say: (note: string) => void;
    /** Ask a question and answer whether it was confirmed. */
    confirm: (question: AskedQuestion) => Promise<boolean>;
    /** Open the browser's file dialog; the files chosen, and none when it was left. */
    choose: () => Promise<File[]>;
    /** Start typing the name of a new file or folder in a folder, or a new name for a row. */
    startName: (mode: 'file' | 'folder' | 'rename', row: TreeRow) => void;
    /** Open the comparison of `file` (the right side) against `against` (the left). */
    openCompare: (file: Place, against: Place) => void;
    /** Whether an open tab holds text of a file that is not saved. */
    draftOf: (row: TreeRow) => boolean;
    /** The rows selected, as places; one row until the tree takes more. */
    selected?: () => Place[];
};

/** The refusal words a sentence is held for, as the catalog's literal keys. */
function refusalSentence(outcome: Extract<Outcome, { ok: false }>, t: Words): string {
    switch (outcome.error) {
        case 'outside':
            return t('files.refused_outside');
        case 'missing':
            return t('files.refused_missing');
        case 'root':
            return t('files.refused_root');
        case 'protected':
            return t('files.refused_protected');
        case 'invalid_name':
            return t('files.refused_invalid_name');
        case 'exists':
            return t('files.refused_exists');
        case 'into_itself':
            return t('files.refused_into_itself');
        case 'not_a_folder':
            return t('files.refused_not_a_folder');
        case 'denied':
            return t('files.refused_denied');
        case 'trash_failed':
            return t('files.refused_trash_failed');
        case 'too_large':
            return t('files.refused_too_large');
        case 'not_base64':
            return t('files.refused_not_base64');
        case 'token':
            return t('files.refused_token');
        case 'not-an-action':
            return t('files.refused_not_an_action');
        case 'network':
            return t('files.refused_network');
    }
}

/** What a refused operation says, and the empty string for one that went through. */
export function refusalLine(outcome: Outcome, t: Words): string {
    return outcome.ok ? '' : refusalSentence(outcome, t);
}

/**
 * Whether deleting a row takes what is inside it: a folder does, and a link to a folder does not,
 * since only the link is removed (VS Code's `isDirectory && !isSymbolicLink`, fileActions.ts:277).
 */
export function holdsContents(row: TreeRow): boolean {
    return row.kind === 'dir' && row.link !== true;
}

/** The place a row is, for the store's calls. */
function placeOf(row: TreeRow): Place {
    return { root: row.root, path: row.path };
}

/** What a pick from a row's menu does when it writes, over the calls handed in. */
export function rowOpsPicker(deps: RowOpsDeps, t: Words): (row: TreeRow, pick: string) => void {
    const asked: Confirm = (question) => deps.confirm(question);

    /** Say what an operation came to, and nothing when it went through. */
    function report(outcome: Outcome): void {
        if (!outcome.ok) deps.say(refusalLine(outcome, t));
    }

    async function remove(row: TreeRow): Promise<void> {
        const sure = await deps.confirm({
            kind: 'delete',
            name: row.name,
            folder: holdsContents(row),
            unsaved: deps.draftOf(row)
        });
        if (!sure) return;
        report(await deps.explorer.trash([placeOf(row)], asked));
    }

    async function pasteInto(row: TreeRow): Promise<void> {
        report(await deps.explorer.paste(placeOf(row), asked));
    }

    /** Upload the files a chooser hands over, one after another, and say how it went. */
    async function upload(into: TreeRow): Promise<void> {
        const files = await deps.choose();
        if (files.length === 0) return;
        let landed = 0;
        const refused: string[] = [];
        const replace: Confirm = (question) => deps.confirm({ ...question, upload: true });
        for (const file of files) {
            if (file.size > MAX_UPLOAD_BYTES) {
                refused.push(t('files.upload_refused', file.name, t('files.refused_too_large')));
                continue;
            }
            let data: string;
            try {
                data = base64Of(await encoded(file));
            } catch {
                refused.push(t('files.upload_refused', file.name, t('files.refused_not_base64')));
                continue;
            }
            const outcome = await deps.explorer.upload(placeOf(into), file.name, data, replace);
            if (outcome.ok) landed += 1;
            else refused.push(t('files.upload_refused', file.name, refusalLine(outcome, t)));
        }
        deps.say([t('files.upload_done', landed), ...refused].join(' '));
    }

    function compareSelected(): void {
        const pair = deps.selected?.() ?? [];
        if (pair.length === 2) deps.openCompare(pair[1], pair[0]);
    }

    return (row, pick) => {
        if (pick === ROW_NEW_FILE) deps.startName('file', row);
        else if (pick === ROW_NEW_FOLDER) deps.startName('folder', row);
        else if (pick === ROW_RENAME) deps.startName('rename', row);
        else if (pick === ROW_CUT) deps.explorer.cut([placeOf(row)]);
        else if (pick === ROW_COPY) deps.explorer.copy([placeOf(row)]);
        else if (pick === ROW_PASTE) void pasteInto(row);
        else if (pick === ROW_DELETE) void remove(row);
        else if (pick === ROW_UPLOAD) void upload(row);
        else if (pick === ROW_SELECT_COMPARE) deps.explorer.selectForCompare(placeOf(row));
        else if (pick === ROW_COMPARE_WITH) {
            const against = deps.explorer.compareFile();
            if (against !== null) deps.openCompare(placeOf(row), against);
        } else if (pick === ROW_COMPARE_SELECTED) compareSelected();
    };
}

/** What the input says about the text typed in it: a message, and whether it is a refusal. */
export type NameMessage = { text: string; error: boolean };

/**
 * The message under the name input for what is typed, in VS Code's order (`validateFileName`,
 * fileActions.ts:714-770): an empty name, a leading slash, a name already in the folder, a name no
 * file can have, and last the warning about whitespace at an end of a segment. `taken` says whether
 * the folder already holds the whole name typed, compared by the caller as the folder compares
 * names: a name of several segments is not taken because its first segment is there.
 */
export function nameMessage(
    text: string,
    taken: (name: string) => boolean,
    t: Words
): NameMessage | null {
    const checked = checkName(text);
    if (!checked.ok && checked.why === 'empty') {
        return { text: t('files.name_empty'), error: true };
    }
    if (!checked.ok && checked.why === 'leading_slash') {
        return { text: t('files.name_leading_slash'), error: true };
    }
    const shown = text.replace(/^\t+|\t+$/g, '').replace(/[\\/]+$/, '');
    if (taken(shown)) return { text: t('files.name_taken', shown), error: true };
    if (!checked.ok) return { text: t('files.name_invalid', shown), error: true };
    return checked.whitespace ? { text: t('files.name_whitespace'), error: false } : null;
}

/** What the name being typed needs: the store, the Files view's state and the folder listings. */
export type RowNamingDeps = {
    explorer: Pick<ExplorerStore, 'create' | 'rename'>;
    /** What the Files view remembers now. */
    view: () => FilesView;
    /** Write part of what the Files view remembers. */
    patch: (part: Partial<FilesView>) => void;
    /** Say a refusal on the tree's line. */
    say: (note: string) => void;
    /** The entries a folder's listing holds under the shown kinds, and null while unlisted. */
    entries: (root: string, path: string) => { name: string }[] | null;
};

/** The calls of the name input: start one, accept its text, and test a name against its folder. */
export function rowNaming(deps: RowNamingDeps, t: Words) {
    /** Start typing a name in a folder, or a new name for a row. */
    function start(mode: 'file' | 'folder' | 'rename', row: TreeRow): void {
        deps.say('');
        deps.patch(namingStarted(deps.view().expanded, mode, row));
    }

    /** The reader's name was accepted: make the item, or rename the row, and say a refusal. */
    async function named(text: string): Promise<void> {
        const naming = deps.view().naming;
        if (naming === null) return;
        deps.patch({ naming: null });
        const place = { root: naming.root, path: naming.path };
        const outcome =
            naming.mode === 'rename'
                ? await deps.explorer.rename(place, text)
                : await deps.explorer.create(place, text, naming.mode === 'folder');
        deps.say(refusalLine(outcome, t));
        const made = outcome.ok && naming.mode !== 'rename' ? outcome.paths[0] : undefined;
        if (made === undefined) return;
        const row = { root: naming.root, path: made };
        const opened = ancestorsOf(row).reduce(
            (kept, one) => setExpanded(kept, treeKey(one.root, one.path), true),
            deps.view().expanded
        );
        deps.patch({ expanded: opened, selected: row });
    }

    /** Whether a folder already holds a name, as the folder compares names (without case). */
    function takenIn(row: TreeRow): (name: string) => boolean {
        const folder =
            row.editing === 'rename'
                ? parentOf(row)
                : { root: row.root, path: row.path.slice(0, -1) };
        return (name: string) =>
            folder !== null &&
            (deps.entries(folder.root, folder.path) ?? []).some(
                (entry) =>
                    entry.name.toLowerCase() === name.toLowerCase() &&
                    !(row.editing === 'rename' && entry.name === row.name)
            );
    }

    return { start, named, takenIn };
}
