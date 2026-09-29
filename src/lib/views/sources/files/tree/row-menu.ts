// Layer 3, view partial. The right-click menu of a row of the Files view, as VS Code's Explorer
// builds its row menu: which items a file, a folder and a root offer, in VS Code's groups, the two
// paths the copy items put on the clipboard, and what each pick does. Only the items oculus can run
// are offered, and each pick runs what the view or the stores already have: a file opened as a
// press opens it but in a pane beside (opening.ts), a folder revealed in Finder through the open
// endpoint, a shell started in the folder (state/shared/stores/shell.ts, `openShell`), the
// file's bytes saved from api/file as the file view's link saves them, the Search view opened on
// the root, the view's add-root form, and its removal behind its question.
//
// The items are a pure function of the row, so which items a row offers is asserted without a
// DOM, and the words come in as `t` so every label is a catalog key. The picks take the stores and
// the view's own form, question and refusal line as calls handed in, so a test hands in fakes.

import { grouped, type MenuItem } from '$lib/ui/menu/menu-items';
import { absoluteOf, languageOf, nameOf, type TreeRow } from '$lib/state/sources/fs';
import { sourceTabState } from '$lib/state/sessions/source.svelte';
import type { ClientState } from '$lib/state/client/context';
import { fileUrl } from '../../../shared/links/file-url';
import { openRowBeside } from '../opening';
import { openShell } from '$lib/state/shared/stores/shell';

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
 * view's add-root form can be opened, which it cannot while it is open already.
 */
export type RowMenuFacts = {
    kind: 'root' | 'dir' | 'file';
    path: string;
    removable: boolean;
    addable: boolean;
};

/** The facts of one row of the tree, with the root keys a removal refuses. */
export function rowFacts(row: TreeRow, fixed: readonly string[], addable: boolean): RowMenuFacts {
    const kind = row.depth === 0 ? 'root' : row.kind;
    const removable = kind === 'root' && !fixed.includes(row.root);
    return { kind, path: row.path, removable, addable };
}

/** Whether a file is Markdown, which the source tab shows with its rendered half. */
function markdown(path: string): boolean {
    return languageOf(path) === 'markdown';
}

/**
 * The row's items. A file: Open to the Side, Open in Integrated Terminal (a shell in its folder),
 * Download..., the two copies, and Open Preview on a Markdown file. A folder: Reveal in Finder, its
 * shell and the two copies. A root: those of a folder, Find in Workspace... after the shell, and
 * Add Folder to Workspace... with Remove Folder from Workspace on a root the reader added.
 */
export function rowMenu(facts: RowMenuFacts, t: Words): MenuItem[] {
    const item = (id: string, label: string): MenuItem => ({ id, label });
    const terminal = item(ROW_TERMINAL, t('files.menu_terminal'));
    const copies = [
        item(ROW_COPY_PATH, t('files.menu_copy_path')),
        item(ROW_COPY_RELATIVE, t('files.menu_copy_relative'))
    ];
    if (facts.kind === 'file') {
        return grouped([
            [item(ROW_OPEN_SIDE, t('files.menu_open_side'))],
            [terminal],
            [item(ROW_DOWNLOAD, t('files.menu_download'))],
            copies,
            markdown(facts.path) ? [item(ROW_PREVIEW, t('files.menu_preview'))] : []
        ]);
    }
    const reveal = [item(ROW_REVEAL, t('files.menu_reveal')), terminal];
    if (facts.kind === 'dir') return grouped([reveal, copies]);
    return grouped([
        reveal,
        [item(ROW_FIND, t('files.menu_find'))],
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
     * A folder by its root and path, and a root's own line by its folder, since the open endpoint
     * takes no empty path under a root.
     */
    async function reveal(row: TreeRow, absolute: string): Promise<void> {
        const answer =
            row.path === ''
                ? await deps.openFolder(absolute)
                : await deps.openFile(row.root, row.path);
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
            deps.setSearchState(deps.openView('search'), { root: row.root });
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
