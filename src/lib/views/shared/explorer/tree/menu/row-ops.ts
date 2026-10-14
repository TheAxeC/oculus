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
// typed in it (which makes the item or renames the row), and testing a name against the folder. A
// tree whose names mean more hands in `NamingHooks`: the Notes section refuses a typed name its
// rule refuses, makes a typed name a note (`<name>.md`, in a notes folder made first when the hub
// has none), lists its folders from the notes it holds, and opens the note it made. A name that
// lands in a hub's notes folder and breaks the name rule of the notes is refused before anything is
// sent, in the sentence that names why (`refuse`), whichever tree it was typed in.

import {
    ancestorsOf,
    parentOf,
    setExpanded,
    treeKey,
    type FilesView,
    type TreeRow
} from '$lib/state/sources/fs';
import { namingStarted, type Naming } from '$lib/state/sources/explorer/naming';
import { actable } from '$lib/state/sources/explorer/acts/selection';
import {
    MAX_UPLOAD_BYTES,
    checkName,
    type Confirm,
    type ExplorerStore,
    type Placed,
    type Place,
    type Question
} from '$lib/state/sources/explorer/ops.svelte';
import { base64Of, encoded } from '$lib/ui/forms/file/file-data';
import { refusalSentence as refusalWordSentence } from '$lib/state/shared/answers/answers';

type Words = (key: string, ...args: (string | number)[]) => string;

export const ROW_NEW_FILE = 'new-file';
export const ROW_NEW_FOLDER = 'new-folder';
export const ROW_NEW_DECK = 'new-present';
export const ROW_DECK_OUTLINE = 'new-present-outline';
export const ROW_UPLOAD = 'upload';
export const ROW_PASTE = 'paste';
export const ROW_CUT = 'cut';
export const ROW_COPY = 'copy';
export const ROW_RENAME = 'rename';
export const ROW_DELETE = 'delete';
export const ROW_SELECT_COMPARE = 'select-compare';
export const ROW_COMPARE_WITH = 'compare-with';
export const ROW_COMPARE_SELECTED = 'compare-selected';

/**
 * The questions the view draws: the delete of one row, the delete of several (their names, how many
 * are files and how many folders), a drag's move into a folder, and the undo of a delete. The
 * others are the explorer's own.
 */
export type AskedQuestion =
    | { kind: 'delete'; name: string; folder: boolean; unsaved: boolean }
    | { kind: 'delete-many'; names: string[]; files: number; folders: number; unsaved: boolean }
    | { kind: 'move'; names: string[]; into: string }
    | { kind: 'undo-delete' }
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
    /**
     * Start typing the name of a new file or folder in a folder, the title of a new presentation
     * there, or a new name for a row.
     */
    startName: (mode: 'file' | 'folder' | 'deck' | 'rename', row: TreeRow) => void;
    /**
     * Make a presentation from a Markdown file and show it: the sentence for why it was not made,
     * and the empty string when it was.
     */
    outline: (file: Place) => Promise<string>;
    /** Open the comparison of `file` (the right side) against `against` (the left). */
    openCompare: (file: Place, against: Place) => void;
    /** Whether an open tab holds text of a file that is not saved. */
    draftOf: (row: TreeRow) => boolean;
    /** The rows selected, as places; one row until the tree takes more. */
    selected?: () => Place[];
    /**
     * The rows a pick on a row acts on: the selection when the row is in it, else the row alone,
     * as the tree draws them. Omitted, the row alone.
     */
    acting?: (row: TreeRow) => TreeRow[];
    /** Whether a delete to the Trash asks first (`files.confirm_delete`); omitted, it does. */
    confirmDelete?: () => boolean;
};

/**
 * The refusal words a sentence is held for, as the catalog's literal keys, and the sentence of a
 * refusal that came with its own (a rename or move of notes whose link edit was refused).
 */
function refusalSentence(outcome: Extract<Placed, { ok: false }>, t: Words): string {
    if (outcome.error === 'said') return outcome.said;
    return outcome.error === 'network'
        ? t('files.refused_network')
        : refusalWordSentence(outcome.error, t);
}

/** What a refused operation says, and the empty string for one that went through. */
export function refusalLine(outcome: Placed, t: Words): string {
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

/**
 * Upload files into a folder one after another, as the Upload... pick and a drop from Finder do:
 * a file too large or unreadable is refused with its reason and the rest go on. The answer is the
 * sentence for the tree's line, how many landed and then each refusal.
 */
export function uploader(
    deps: { explorer: Pick<ExplorerStore, 'upload'>; confirm: RowOpsDeps['confirm'] },
    t: Words
): (into: Place, files: readonly File[]) => Promise<string> {
    const replace: Confirm = (question) => deps.confirm({ ...question, upload: true });
    return async (into, files) => {
        let landed = 0;
        const refused: string[] = [];
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
            const outcome = await deps.explorer.upload(into, file.name, data, replace);
            if (outcome.ok) landed += 1;
            else refused.push(t('files.upload_refused', file.name, refusalLine(outcome, t)));
        }
        return [t('files.upload_done', landed), ...refused].join(' ');
    };
}

/** What a pick from a row's menu does when it writes, over the calls handed in. */
export function rowOpsPicker(deps: RowOpsDeps, t: Words): (row: TreeRow, pick: string) => void {
    const asked: Confirm = (question) => deps.confirm(question);

    /** Say what an operation came to, and nothing when it went through. */
    function report(outcome: Placed): void {
        if (!outcome.ok) deps.say(refusalLine(outcome, t));
    }

    /**
     * The rows a pick acts on, a root's own line, the `..` line and a name being typed left out.
     */
    function acted(row: TreeRow): TreeRow[] {
        return (deps.acting?.(row) ?? [row]).filter(actable);
    }

    /**
     * Delete the rows acted on: one question for all of them, none while `files.confirm_delete`
     * is off, then one move to the Trash with every path.
     */
    async function remove(row: TreeRow): Promise<void> {
        const rows = acted(row);
        const only = rows.at(0);
        if (only === undefined) return;
        if (deps.confirmDelete?.() !== false) {
            const unsaved = rows.some((one) => deps.draftOf(one));
            const folders = rows.filter(holdsContents).length;
            const sure = await deps.confirm(
                rows.length === 1
                    ? { kind: 'delete', name: only.name, folder: holdsContents(only), unsaved }
                    : {
                          kind: 'delete-many',
                          names: rows.map((one) => one.name),
                          files: rows.length - folders,
                          folders,
                          unsaved
                      }
            );
            if (!sure) return;
        }
        report(await deps.explorer.trash(rows.map(placeOf), asked));
    }

    /** The folder a paste lands in: the row itself for a folder, the folder holding a file. */
    function pasteTarget(row: TreeRow): Place {
        if (row.kind === 'dir') return placeOf(row);
        const at = row.path.lastIndexOf('/');
        return { root: row.root, path: at < 0 ? '' : row.path.slice(0, at) };
    }

    async function pasteInto(row: TreeRow): Promise<void> {
        report(await deps.explorer.paste(pasteTarget(row), asked));
    }

    const uploading = uploader(deps, t);

    /** Upload the files a chooser hands over into a folder, and say how it went. */
    async function upload(into: TreeRow): Promise<void> {
        const files = await deps.choose();
        if (files.length === 0) return;
        deps.say(await uploading(placeOf(into), files));
    }

    function compareSelected(): void {
        const pair = deps.selected?.() ?? [];
        if (pair.length === 2) deps.openCompare(pair[1], pair[0]);
    }

    return (row, pick) => {
        if (pick === ROW_NEW_FILE) deps.startName('file', row);
        else if (pick === ROW_NEW_FOLDER) deps.startName('folder', row);
        else if (pick === ROW_NEW_DECK) deps.startName('deck', row);
        else if (pick === ROW_DECK_OUTLINE) void deps.outline(placeOf(row)).then(deps.say);
        else if (pick === ROW_RENAME) deps.startName('rename', row);
        else if (pick === ROW_CUT) deps.explorer.cut(acted(row).map(placeOf));
        else if (pick === ROW_COPY) deps.explorer.copy(acted(row).map(placeOf));
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

/** How many names a question lists before it says how many more there are. */
const NAMES_SHOWN = 10;

/**
 * What a question says: its message, its detail, its confirming words, and whether it may be
 * silenced.
 */
export type AskedWords = {
    message: string;
    detail: string;
    confirm: string;
    /** Whether the question carries the "Do not ask me again" box. */
    forgettable: boolean;
};

/** The names of a question, one a line, with the count of those past the tenth. */
function namesListed(names: readonly string[], t: Words): string {
    const shown = names.slice(0, NAMES_SHOWN).join('\n');
    const more = names.length - NAMES_SHOWN;
    return more > 0 ? `${shown}\n${t('files.names_more', more)}` : shown;
}

/** The lines of a detail that are not empty, one a line. */
function lines(...parts: string[]): string {
    return parts.filter((one) => one !== '').join('\n');
}

/**
 * The words of a question, in VS Code's English: the delete of one row, of several (what is
 * selected decides whether it says files, directories and their contents, or both), the move of a
 * drag, the undo of a delete, the permanent delete after a failed Trash and the replace of a name
 * that is taken. Only a delete to the Trash may be silenced.
 */
export function askedWords(question: AskedQuestion, t: Words): AskedWords {
    switch (question.kind) {
        case 'delete':
            return {
                message: question.folder
                    ? t('files.delete_question_folder', question.name)
                    : t('files.delete_question', question.name),
                detail: question.unsaved
                    ? `${t('files.delete_detail')} ${t('files.delete_detail_unsaved')}`
                    : t('files.delete_detail'),
                confirm: t('files.delete_button'),
                forgettable: true
            };
        case 'delete-many': {
            const count = question.names.length;
            return {
                message:
                    question.folders === 0
                        ? t('files.delete_many_files', count)
                        : question.files === 0
                          ? t('files.delete_many_folders', count)
                          : t('files.delete_many_both', count),
                detail: lines(
                    namesListed(question.names, t),
                    t('files.delete_detail_many'),
                    question.unsaved ? t('files.delete_detail_unsaved') : ''
                ),
                confirm: t('files.delete_button'),
                forgettable: true
            };
        }
        case 'move':
            return {
                message:
                    question.names.length === 1
                        ? t('files.move_question', question.names[0] ?? '', question.into)
                        : t('files.move_question_many', question.names.length, question.into),
                detail: question.names.length === 1 ? '' : namesListed(question.names, t),
                confirm: t('files.move_button'),
                forgettable: false
            };
        case 'undo-delete':
            return {
                message: t('files.undo_question', t('files.undo_delete_label')),
                detail: '',
                confirm: t('files.undo_button'),
                forgettable: false
            };
        case 'permanent':
            return {
                message: t('files.permanent_question'),
                detail: t('files.permanent_detail'),
                confirm: t('files.permanent_button'),
                forgettable: false
            };
        case 'replace':
            return {
                message: t('files.replace_question', question.name),
                detail: question.upload === true ? t('files.replace_detail_upload') : '',
                confirm: t('files.replace_button'),
                forgettable: false
            };
    }
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

/** What a tree whose names mean more does with a typed name (the Notes section's notes). */
export type NamingHooks = {
    /** The sentence refusing the text typed, and the empty string for a text the tree takes. */
    refuse?: (text: string) => string;
    /** The folder a new item is made in and the name it is made as, from the text typed. */
    making?: (naming: Naming, text: string) => { into: Place; name: string };
    /** The names a folder holds, where the tree lists folders of its own. */
    entries?: (root: string, path: string) => { name: string }[] | null;
    /** A file the name input made. */
    made?: (file: Place) => void;
};

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
    /**
     * Make a presentation in a folder with the title typed and show it: the sentence for why it was
     * not made, and the empty string when it was.
     */
    deck: (folder: Place, title: string) => Promise<string>;
    /**
     * The sentence refusing a name that lands at a path of a root, segments and all, and the
     * empty string for one the folders it lands in take.
     */
    refuse?: (root: string, path: string) => string;
    hooks?: NamingHooks;
};

/** The calls of the name input: start one, accept its text, and test a name against its folder. */
export function rowNaming(deps: RowNamingDeps, t: Words) {
    /** Start typing a name in a folder, or a new name for a row. */
    function start(mode: 'file' | 'folder' | 'deck' | 'rename', row: TreeRow): void {
        deps.say('');
        deps.patch(namingStarted(deps.view().expanded, mode, row));
    }

    /** The reader's name was accepted: make the item, or rename the row, and say a refusal. */
    async function named(text: string): Promise<void> {
        const naming = deps.view().naming;
        if (naming === null) return;
        deps.patch({ naming: null });
        const place = { root: naming.root, path: naming.path };
        if (naming.mode === 'deck') {
            deps.say(await deps.deck(place, text));
            return;
        }
        const own = deps.hooks?.refuse?.(text) ?? '';
        if (own !== '') {
            deps.say(own);
            return;
        }
        const making =
            naming.mode === 'rename'
                ? { into: parentOf(place) ?? place, name: text }
                : (deps.hooks?.making?.(naming, text) ?? { into: place, name: text });
        const landing =
            making.into.path === '' ? making.name : `${making.into.path}/${making.name}`;
        const refused = deps.refuse?.(naming.root, landing) ?? '';
        if (refused !== '') {
            deps.say(refused);
            return;
        }
        const outcome =
            naming.mode === 'rename'
                ? await deps.explorer.rename(place, text)
                : await deps.explorer.create(making.into, making.name, naming.mode === 'folder');
        deps.say(refusalLine(outcome, t));
        const made = outcome.ok && naming.mode !== 'rename' ? outcome.paths[0] : undefined;
        if (made === undefined) return;
        const row = { root: naming.root, path: made };
        if (naming.mode === 'file') deps.hooks?.made?.(row);
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
        const entries = deps.hooks?.entries ?? deps.entries;
        const named = (name: string): string =>
            row.editing === 'rename' || deps.hooks?.making === undefined
                ? name
                : (deps.hooks
                      .making(
                          {
                              mode: row.kind === 'dir' ? 'folder' : 'file',
                              root: row.root,
                              path: row.path.slice(0, -1)
                          },
                          name
                      )
                      .name.split('/')
                      .at(-1) ?? name);
        return (name: string) =>
            folder !== null &&
            (entries(folder.root, folder.path) ?? []).some(
                (entry) =>
                    entry.name.toLowerCase() === named(name).toLowerCase() &&
                    !(row.editing === 'rename' && entry.name === row.name)
            );
    }

    return { start, named, takenIn };
}
