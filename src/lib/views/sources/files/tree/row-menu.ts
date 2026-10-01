// Layer 3, view partial. The right-click menu of a row of the Files view, as VS Code's Explorer
// builds its row menu: which items a file, a folder and a root offer, in VS Code's groups, the two
// paths the copy items put on the clipboard, and what each pick does. Only the items oculus can run
// are offered, and each pick runs what the view or the stores already have: a file opened as a
// press opens it but in a pane beside (opening.ts), a file or folder revealed in Finder through the
// open endpoint, a shell started in the folder (state/shared/stores/shell.ts, `openShell`), the
// file's bytes saved from api/file as the file view's link saves them, the Search view opened on
// the folder, the view's add-root form, and its removal behind its question. The items that write
// (New File..., Cut, Paste, Rename..., Delete, Upload..., the compare items) are drawn here and
// picked in row-ops.ts.
//
// The items are a pure function of the row, so which items a row offers is asserted without a
// DOM, and the words come in as `t` so every label is a catalog key. The picks take the stores and
// the view's own form, question and refusal line as calls handed in, so a test hands in fakes.

import { grouped, type MenuItem } from '$lib/ui/menu/menu-items';
import {
    absoluteOf,
    languageOf,
    nameOf,
    type LanguageMap,
    type TreeRow
} from '$lib/state/sources/fs';
import { sourceTabState } from '$lib/state/sessions/source.svelte';
import type { ClientState } from '$lib/state/client/context';
import type { ExplorerStore } from '$lib/state/sources/explorer/ops.svelte';
import { fileUrl } from '../../../shared/links/file-url';
import { openRowBeside } from '../opening';
import { openShell } from '$lib/state/shared/stores/shell';
import {
    ROW_COMPARE_SELECTED,
    ROW_COMPARE_WITH,
    ROW_COPY,
    ROW_CUT,
    ROW_DELETE,
    ROW_NEW_FILE,
    ROW_NEW_FOLDER,
    ROW_PASTE,
    ROW_RENAME,
    ROW_SELECT_COMPARE,
    ROW_UPLOAD
} from './row-ops';

type Words = (key: string, ...args: (string | number)[]) => string;

export const ROW_OPEN_SIDE = 'open-side';
export const ROW_REVEAL = 'reveal';
export const ROW_TERMINAL = 'terminal';
export const ROW_FIND = 'find';
export const ROW_DOWNLOAD = 'download';
export const ROW_COPY_PATH = 'copy-path';
export const ROW_COPY_RELATIVE = 'copy-relative';
export const ROW_ADD_ROOT = 'add-root';
export const ROW_REMOVE_ROOT = 'remove-root';
export const ROW_PREVIEW = 'preview';

/**
 * What the menu is built from: a root's own line, a folder or a file, its path under its root,
 * for a root whether the reader added it, which is the root a removal takes, and whether the
 * view's add-root form can be opened, which it cannot while it is open already. Beside those, what
 * the file operations read: whether the clipboard holds anything (Paste is drawn disabled without),
 * the name of the file selected for compare when there is one and it is not this row, and how many
 * rows are selected, which is one until the tree takes more.
 */
export type RowMenuFacts = {
    kind: 'root' | 'dir' | 'file';
    path: string;
    removable: boolean;
    addable: boolean;
    clipboard: boolean;
    compareWith: string | null;
    selection: number;
    markdown: boolean;
};

/** The facts of one row of the tree, with the root keys a removal refuses. */
export function rowFacts(
    row: TreeRow,
    fixed: readonly string[],
    addable: boolean,
    explorer: Pick<ExplorerStore, 'clipboard' | 'compareFile'>,
    languages: LanguageMap
): RowMenuFacts {
    const kind = row.depth === 0 ? 'root' : row.kind;
    const removable = kind === 'root' && !fixed.includes(row.root);
    const held = explorer.compareFile();
    const other = held !== null && !(held.root === row.root && held.path === row.path);
    return {
        kind,
        path: row.path,
        removable,
        addable,
        clipboard: explorer.clipboard() !== null,
        compareWith: other ? nameOf(held.path) : null,
        selection: 1,
        markdown: kind === 'file' && languageOf(row.path, languages) === 'markdown'
    };
}

/**
 * The row's items, in VS Code's groups. A file: Open to the Side, Reveal in Finder and Open in
 * Integrated Terminal (a shell in its folder), the compare items, Cut and Copy, Download..., the
 * two copies, Open Preview on a Markdown file, then Rename... and Delete. A folder: New File... and
 * New Folder..., Reveal in Finder and its shell, Find in Folder..., Cut, Copy and Paste, Upload...,
 * the two copies, then Rename... and Delete. A root: those of a folder without Cut, Copy, Rename...
 * and Delete, and Add Folder to Workspace... with Remove Folder from Workspace on a root the reader
 * added. Compare with Selected needs a file selected for compare, and with two rows selected the
 * compare items give way to Compare Selected.
 */
export function rowMenu(facts: RowMenuFacts, t: Words): MenuItem[] {
    const item = (id: string, label: string): MenuItem => ({ id, label });
    const terminal = item(ROW_TERMINAL, t('files.menu_terminal'));
    const reveal = item(ROW_REVEAL, t('files.menu_reveal'));
    const copies = [
        item(ROW_COPY_PATH, t('files.menu_copy_path')),
        item(ROW_COPY_RELATIVE, t('files.menu_copy_relative'))
    ];
    const cutCopy = [item(ROW_CUT, t('files.menu_cut')), item(ROW_COPY, t('files.menu_copy'))];
    const modify = [
        item(ROW_RENAME, t('files.menu_rename')),
        item(ROW_DELETE, t('files.menu_delete'))
    ];
    const paste = { ...item(ROW_PASTE, t('files.menu_paste')), disabled: !facts.clipboard };
    if (facts.kind === 'file') {
        const pair = facts.selection === 2;
        return grouped([
            [item(ROW_OPEN_SIDE, t('files.menu_open_side'))],
            [reveal, terminal],
            [
                ...(!pair && facts.compareWith !== null
                    ? [item(ROW_COMPARE_WITH, t('files.menu_compare_with'))]
                    : []),
                ...(!pair ? [item(ROW_SELECT_COMPARE, t('files.menu_select_compare'))] : []),
                ...(pair ? [item(ROW_COMPARE_SELECTED, t('files.menu_compare_selected'))] : [])
            ],
            cutCopy,
            [item(ROW_DOWNLOAD, t('files.menu_download'))],
            copies,
            facts.markdown ? [item(ROW_PREVIEW, t('files.menu_preview'))] : [],
            modify
        ]);
    }
    const created = [
        item(ROW_NEW_FILE, t('files.menu_new_file')),
        item(ROW_NEW_FOLDER, t('files.menu_new_folder'))
    ];
    const find = [item(ROW_FIND, t('files.menu_find'))];
    const upload = [item(ROW_UPLOAD, t('files.menu_upload'))];
    if (facts.kind === 'dir') {
        return grouped([
            created,
            [reveal, terminal],
            find,
            [...cutCopy, paste],
            upload,
            copies,
            modify
        ]);
    }
    return grouped([
        created,
        [reveal, terminal],
        find,
        [paste],
        upload,
        copies,
        [
            ...(facts.addable ? [item(ROW_ADD_ROOT, t('files.menu_add_root'))] : []),
            ...(facts.removable ? [item(ROW_REMOVE_ROOT, t('files.menu_remove_root'))] : [])
        ]
    ]);
}

/**
 * The two paths a row copies: its absolute path, and its path under its root, which for the root
 * itself is `.`, as VS Code copies a workspace folder's relative path.
 */
export function rowPaths(dir: string, path: string): { absolute: string; relative: string } {
    return { absolute: absoluteOf(dir, path), relative: path === '' ? '.' : path };
}

/** The folder a shell opened on a row starts in: the row itself, or the folder holding a file. */
export function shellFolder(dir: string, row: Pick<TreeRow, 'kind' | 'path'>): string {
    if (row.kind === 'dir') return absoluteOf(dir, row.path);
    const at = row.path.lastIndexOf('/');
    return absoluteOf(dir, at < 0 ? '' : row.path.slice(0, at));
}

/** The calls a pick makes on the stores, and on the page's clipboard and downloads. */
export type RowStores = {
    openBeside: ClientState['layout']['openBeside'];
    openView: ClientState['layout']['openView'];
    keepPreview: ClientState['layout']['keepPreview'];
    readFileKind: ClientState['fs']['readFileKind'];
    openFile: ClientState['writes']['openFile'];
    revealPath: ClientState['writes']['revealPath'];
    openFolder: ClientState['writes']['openFolder'];
    startTerminal: ClientState['terminals']['startTerminal'];
    showTerminal: ClientState['terminals']['showTerminal'];
    setSearchState: ClientState['search']['setSearchState'];
    copy: (text: string) => void;
    download: (url: string, name: string) => void;
};

/** The store calls out of the client, with the clipboard's write and a link's download. */
export function rowStores(client: ClientState): RowStores {
    return {
        openBeside: client.layout.openBeside,
        openView: client.layout.openView,
        keepPreview: client.layout.keepPreview,
        readFileKind: client.fs.readFileKind,
        openFile: client.writes.openFile,
        revealPath: client.writes.revealPath,
        openFolder: client.writes.openFolder,
        startTerminal: client.terminals.startTerminal,
        showTerminal: client.terminals.showTerminal,
        setSearchState: client.search.setSearchState,
        copy: (text) => void navigator.clipboard.writeText(text).catch(() => undefined),
        download: (url, name) => {
            const link = document.createElement('a');
            link.href = url;
            link.download = name;
            link.click();
        }
    };
}

/** What a pick needs: the stores' calls, and the view's own form, question and refusal line. */
export type RowPickDeps = RowStores & {
    /** The folder of a root key the tree draws, or the empty string. */
    dirOf: (root: string) => string;
    /** Say a refusal on the tree's refusal line. */
    say: (note: string) => void;
    addRoot: () => void;
    removeRoot: (root: string) => void;
};

/** What a pick from a row's menu does, over the calls handed in. */
export function rowPicker(deps: RowPickDeps, t: Words): (row: TreeRow, pick: string) => void {
    /**
     * A file or folder by its root and path, shown in Finder with the item selected, and a root's
     * own line by its folder, since the open endpoint takes no empty path under a root.
     */
    async function reveal(row: TreeRow, absolute: string): Promise<void> {
        const answer =
            row.path === ''
                ? await deps.openFolder(absolute)
                : await deps.revealPath(row.root, row.path);
        if (!answer.ok) deps.say(t('files.reveal_failed', answer.error ?? ''));
    }

    /** A shell in the row's folder, by the one start-and-show path, a refusal said on the tree. */
    async function shell(row: TreeRow, dir: string): Promise<void> {
        const cwd = shellFolder(dir, row);
        const refused = await openShell(deps, cwd, nameOf(cwd));
        if (refused !== null) deps.say(refused);
    }

    return (row, pick) => {
        const dir = deps.dirOf(row.root);
        const paths = rowPaths(dir, row.path);
        if (pick === ROW_OPEN_SIDE) void openRowBeside(deps, row);
        else if (pick === ROW_REVEAL) void reveal(row, paths.absolute);
        else if (pick === ROW_TERMINAL) void shell(row, dir);
        else if (pick === ROW_FIND)
            deps.setSearchState(deps.openView('search'), { root: row.root, under: row.path });
        else if (pick === ROW_DOWNLOAD) deps.download(fileUrl(row.root, row.path), row.name);
        else if (pick === ROW_COPY_PATH) deps.copy(paths.absolute);
        else if (pick === ROW_COPY_RELATIVE) deps.copy(paths.relative);
        else if (pick === ROW_ADD_ROOT) deps.addRoot();
        else if (pick === ROW_REMOVE_ROOT) deps.removeRoot(row.root);
        else if (pick === ROW_PREVIEW) {
            deps.keepPreview(deps.openView('source', sourceTabState(row.root, row.path)));
        }
    };
}
