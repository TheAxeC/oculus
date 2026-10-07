// Layer 3, view partial. The right-click menu of a row of the Files view, as VS Code's Explorer
// builds its row menu: which items a file, a folder and a root offer, in VS Code's groups, the two
// paths the copy items put on the clipboard, and what each pick does. Only the items oculus can run
// are offered, and each pick runs what the view or the stores already have: a file opened as a
// press opens it but in a pane beside (opening.ts), a file the configuration names an application
// for (`open.program_ext`) handed to that application through the open endpoint, a picture, a PDF
// or an HTML page opened in a browser tab of its own (a PDF also in a tab of the page and in a
// window of its own), a file or folder bookmarked or its bookmark
// taken out as the row's star does, a file or folder revealed in Finder through the open endpoint,
// a shell started in the folder (state/shared/stores/shell.ts, `openShell`), the file's bytes saved
// from api/file as the file view's link saves them, the Search view opened on the folder, the
// view's add-root form, and its removal behind its question. The items that write (New File...,
// Cut, Paste, Rename..., Delete, Upload..., the compare items) are drawn here and picked in
// row-ops.ts.
//
// The items are a pure function of the row, so which items a row offers is asserted without a
// DOM, and the words come in as `t` so every label is a catalog key. The picks take the stores and
// the view's own form, question and refusal line as calls handed in, so a test hands in fakes.

import { grouped, type MenuItem } from '$lib/ui/menu/menu-items';
import { absoluteOf, fileTabState } from '$lib/state/workbench/navigation/pages';
import { tabDeck } from '$lib/state/life/present';
import {
    languageOf,
    markdownPreviewState,
    MARKDOWN_PREVIEW_VIEW,
    nameOf,
    opensInProgram,
    typeOfFile,
    type FsEntry,
    type LanguageMap,
    type RowRef,
    type TreeRow
} from '$lib/state/sources/fs';
import {
    chordHint,
    type FilesAction,
    type FilesChord,
    type KeyPlan,
    type KeyWords
} from '$lib/state/sources/explorer/acts/keys';
import type { CommandSource, ProjectCommand } from '$lib/state/sessions/terminal/commands.svelte';
import { commandKey, commandLabel, commandTip, keyOf } from '../../../sessions/commands';
import type { ClientState } from '$lib/state/client/context';
import type { ExplorerStore } from '$lib/state/sources/explorer/ops.svelte';
import { fileBytesUrl } from '$lib/state/sources/fs-transport';
import { openRowBeside } from '../../opening';
import { openShell } from '$lib/state/shared/stores/shell';
import {
    ROW_COMPARE_SELECTED,
    ROW_COMPARE_WITH,
    ROW_COPY,
    ROW_CUT,
    ROW_DECK_OUTLINE,
    ROW_DELETE,
    ROW_NEW_DECK,
    ROW_NEW_FILE,
    ROW_NEW_FOLDER,
    ROW_PASTE,
    ROW_RENAME,
    ROW_SELECT_COMPARE,
    ROW_UPLOAD
} from './row-ops';

type Words = (key: string, ...args: (string | number)[]) => string;

export const ROW_OPEN_SIDE = 'open-side';
export const ROW_OPEN_PROGRAM = 'open-program';
const ROW_OPEN_BROWSER = 'open-browser';
const ROW_OPEN_PDF_TAB = 'open-pdf-tab';
const ROW_OPEN_PDF_WINDOW = 'open-pdf-window';
const ROW_ADD_BOOKMARK = 'add-bookmark';
const ROW_REMOVE_BOOKMARK = 'remove-bookmark';
export const ROW_REVEAL = 'reveal';
export const ROW_TERMINAL = 'terminal';
export const ROW_FIND = 'find';
export const ROW_DOWNLOAD = 'download';
export const ROW_COPY_PATH = 'copy-path';
export const ROW_COPY_RELATIVE = 'copy-relative';
export const ROW_ADD_ROOT = 'add-root';
export const ROW_REMOVE_ROOT = 'remove-root';
export const ROW_PREVIEW = 'preview';
export const ROW_DECK = 'present';

/** The file a folder holds to be a deck, and the name that file is shown under. */
const DECK_FILE = 'present.yml';
const ROW_TIMELINE = 'timeline';
export const ROW_RUN = 'run-command';

/** The id of one command in the Run Command submenu, ahead of its source and its name. */
const RUN_PREFIX = 'run-command:';

/**
 * What the menu is built from: a root's own line, a folder or a file, its path under its root,
 * for a root whether the reader added it, which is the root a removal takes, and whether the
 * view's add-root form can be opened, which it cannot while it is open already. Beside those, what
 * the file operations read: whether the clipboard holds anything (Paste is drawn disabled without),
 * the name of the file selected for compare when there is one and it is not this row, how many rows
 * the menu acts on (`selection`, one for a row outside the selection) and how many of them are
 * files, and the key hint each item shows at its end, by item id.
 */
export type RowMenuFacts = {
    kind: 'root' | 'dir' | 'file';
    path: string;
    removable: boolean;
    addable: boolean;
    clipboard: boolean;
    compareWith: string | null;
    selection: number;
    /** How many of the selected rows are files; every one of them when omitted. */
    selectedFiles?: number;
    markdown: boolean;
    /** Whether the row is a file `open.program_ext` names an application for. */
    program?: boolean;
    /** Whether the row is a file a browser tab shows: a picture, a PDF or an HTML page. */
    browser?: boolean;
    /**
     * Whether the row is bookmarked, or null for a row the star is not drawn on: the up row and a
     * root's own line.
     */
    bookmarked?: boolean | null;
    /** Whether the row is a PDF, which a tab of the page and a window of its own also show. */
    pdf?: boolean;
    /** Whether the row is a `present.yml` file or a folder whose listing holds one directly. */
    present?: boolean;
    /**
     * Whether the row is a folder or root whose listing was read and holds no `present.yml`, which
     * is where New Presentation... is offered.
     */
    newDeck?: boolean;
    /** The key hint of an item by its id; none when omitted. */
    hints?: Readonly<Record<string, string>>;
    /** The project commands of the repository a root or a folder row is; none when omitted. */
    commands?: readonly ProjectCommand[];
};

/**
 * The entries held for one folder of a root, or null when none are: what a menu reads, never asks.
 */
export type HeldEntries = (root: string, path: string) => FsEntry[] | null;

/** The kinds of file a browser tab draws itself. */
const BROWSER_KINDS: readonly string[] = ['html', 'image', 'pdf'];

/** The size of the selection a menu acts on, and how many of its rows are files. */
export type MenuSelection = { size: number; files: number };

/** The menu items that show a key, and the action whose first chord is the key they show. */
const HINTED: readonly (readonly [string, FilesAction])[] = [
    [ROW_RENAME, 'rename'],
    [ROW_DELETE, 'delete'],
    [ROW_CUT, 'cut'],
    [ROW_COPY, 'copy'],
    [ROW_PASTE, 'paste'],
    [ROW_COPY_PATH, 'copy-path'],
    [ROW_COPY_RELATIVE, 'copy-relative']
];

/**
 * The menu pick a key runs, for a key that does what an item of the menu does; null for the rest.
 */
export function pickOfKey(plan: KeyPlan): string | null {
    switch (plan) {
        case 'rename':
            return ROW_RENAME;
        case 'delete':
            return ROW_DELETE;
        case 'cut':
            return ROW_CUT;
        case 'copy':
            return ROW_COPY;
        case 'paste':
            return ROW_PASTE;
        case 'copy-path':
            return ROW_COPY_PATH;
        case 'copy-relative':
            return ROW_COPY_RELATIVE;
        default:
            return null;
    }
}

/** The key hint of each menu item that has one, in the words of the platform. */
export function menuHints(keymap: readonly FilesChord[], words: KeyWords): Record<string, string> {
    const hints: Record<string, string> = {};
    for (const [id, action] of HINTED) {
        const hint = chordHint(keymap, action, words);
        if (hint !== null) hints[id] = hint;
    }
    return hints;
}

/**
 * The facts of one row of the tree, with the root keys a removal refuses, the selection the menu
 * acts on (the row alone when it is not given), the hints of the items and the entries the fs store
 * holds or the menu read, which say whether a folder holds a `present.yml`, the applications
 * `open.program_ext` names by extension, which say whether a file opens in one, and whether the
 * row is bookmarked.
 */
export function rowFacts(
    row: TreeRow,
    fixed: readonly string[],
    addable: boolean,
    explorer: Pick<ExplorerStore, 'clipboard' | 'compareFile'>,
    languages: LanguageMap,
    selection: MenuSelection = { size: 1, files: row.kind === 'file' ? 1 : 0 },
    hints: Readonly<Record<string, string>> = {},
    entriesOf: HeldEntries = () => null,
    commands: readonly ProjectCommand[] = [],
    programs: Readonly<Record<string, string>> = {},
    bookmarked = false
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
        selection: selection.size,
        selectedFiles: selection.files,
        markdown: kind === 'file' && languageOf(row.path, languages) === 'markdown',
        program: kind === 'file' && opensInProgram(row.path, programs),
        browser: kind === 'file' && BROWSER_KINDS.includes(typeOfFile(row.name).kind),
        bookmarked: row.up !== true && row.path !== '' ? bookmarked : null,
        pdf: kind === 'file' && typeOfFile(row.name).kind === 'pdf',
        present:
            kind === 'file'
                ? row.name === DECK_FILE
                : (entriesOf(row.root, row.path) ?? []).some(
                      (one) => one.kind === 'file' && one.name === DECK_FILE
                  ),
        newDeck:
            kind !== 'file' &&
            row.up !== true &&
            !(entriesOf(row.root, row.path) ?? [{ kind: 'file', name: DECK_FILE }]).some(
                (one) => one.kind === 'file' && one.name === DECK_FILE
            ),
        hints,
        commands
    };
}

/**
 * The row's items, in VS Code's groups. A file: Open to the Side, with Open in Program after it on
 * a file `open.program_ext` names an application for, Reveal in Finder and Open in Integrated
 * Terminal (a shell in its folder), the compare items, Open Timeline in a group of its own, Cut and
 * Copy, Download..., the two copies, Open Preview on a Markdown file, then Rename... and Delete. A
 * PDF also offers Open in New Tab and Open in New Window after Open to the Side. Open Presentation
 * is its own group after Reveal in Finder and the terminal, on a `present.yml` file and on a folder
 * or root whose listing holds one: the listing the fs store holds, else the one the menu read when
 * it opened (picks.svelte.ts); New Presentation... is in that group on a folder or root whose
 * listing holds none, and New Presentation from Outline on a Markdown file.
 * A folder: New File... and New Folder...,
 * Reveal in Finder and its shell, Find in Folder..., Cut, Copy and Paste, Upload..., the two
 * copies, then Rename... and Delete. A folder or root that is a repository with project commands
 * also offers Run Command, a submenu of them. A root: those of a folder without Cut, Copy,
 * Rename... and Delete, and Add Folder to Workspace... with Remove Folder from Workspace on a root
 * the reader added. Compare with Selected needs a file selected for compare. With two or more rows
 * selected the menu is the one for the selection: Compare Selected for exactly two files, Cut and
 * Copy, the two copies of every path, and Delete. Each item carries the key hint its id has in
 * `hints`.
 */
export function rowMenu(facts: RowMenuFacts, t: Words): MenuItem[] {
    const item = (id: string, label: string): MenuItem => {
        const hint = facts.hints?.[id];
        return hint === undefined ? { id, label } : { id, label, hint };
    };
    const terminal = item(ROW_TERMINAL, t('files.menu_terminal'));
    const reveal = item(ROW_REVEAL, t('files.menu_reveal'));
    const copies = [
        item(ROW_COPY_PATH, t('files.menu_copy_path')),
        item(ROW_COPY_RELATIVE, t('files.menu_copy_relative'))
    ];
    const cutCopy = [item(ROW_CUT, t('files.menu_cut')), item(ROW_COPY, t('files.menu_copy'))];
    const decks = [
        ...(facts.present === true ? [item(ROW_DECK, t('files.menu_present'))] : []),
        ...(facts.newDeck === true ? [item(ROW_NEW_DECK, t('files.menu_new_present'))] : []),
        ...(facts.markdown ? [item(ROW_DECK_OUTLINE, t('files.menu_present_outline'))] : [])
    ];
    const bookmark =
        facts.bookmarked === null || facts.bookmarked === undefined
            ? []
            : [
                  facts.bookmarked
                      ? item(ROW_REMOVE_BOOKMARK, t('files.menu_remove_bookmark'))
                      : item(ROW_ADD_BOOKMARK, t('files.menu_add_bookmark'))
              ];
    const remove = item(ROW_DELETE, t('files.menu_delete'));
    const modify = [item(ROW_RENAME, t('files.menu_rename')), remove];
    const paste = { ...item(ROW_PASTE, t('files.menu_paste')), disabled: !facts.clipboard };
    if (facts.selection > 1) {
        const pair = facts.selection === 2 && (facts.selectedFiles ?? 2) === 2;
        return grouped([
            pair ? [item(ROW_COMPARE_SELECTED, t('files.menu_compare_selected'))] : [],
            cutCopy,
            copies,
            [remove]
        ]);
    }
    if (facts.kind === 'file') {
        return grouped([
            [
                item(ROW_OPEN_SIDE, t('files.menu_open_side')),
                ...(facts.pdf === true
                    ? [
                          item(ROW_OPEN_PDF_TAB, t('files.menu_open_tab')),
                          item(ROW_OPEN_PDF_WINDOW, t('files.menu_open_window'))
                      ]
                    : []),
                ...(facts.browser === true
                    ? [item(ROW_OPEN_BROWSER, t('files.menu_open_browser'))]
                    : []),
                ...(facts.program === true
                    ? [item(ROW_OPEN_PROGRAM, t('files.menu_open_program'))]
                    : [])
            ],
            [reveal, terminal],
            decks,
            [
                ...(facts.compareWith !== null
                    ? [item(ROW_COMPARE_WITH, t('files.menu_compare_with'))]
                    : []),
                item(ROW_SELECT_COMPARE, t('files.menu_select_compare'))
            ],
            [item(ROW_TIMELINE, t('files.menu_timeline'))],
            cutCopy,
            [item(ROW_DOWNLOAD, t('files.menu_download'))],
            copies,
            bookmark,
            facts.markdown ? [item(ROW_PREVIEW, t('files.menu_preview'))] : [],
            modify
        ]);
    }
    const created = [
        item(ROW_NEW_FILE, t('files.menu_new_file')),
        item(ROW_NEW_FOLDER, t('files.menu_new_folder'))
    ];
    const find = [item(ROW_FIND, t('files.menu_find'))];
    const run: MenuItem[] =
        (facts.commands ?? []).length === 0
            ? []
            : [
                  {
                      id: ROW_RUN,
                      label: t('commands.run_menu'),
                      items: (facts.commands ?? []).map((command) => ({
                          id: `${RUN_PREFIX}${commandKey(command)}`,
                          label: commandLabel(command, facts.commands ?? []),
                          title: commandTip(command)
                      }))
                  }
              ];
    const upload = [item(ROW_UPLOAD, t('files.menu_upload'))];
    if (facts.kind === 'dir') {
        return grouped([
            created,
            [reveal, terminal],
            decks,
            find,
            run,
            [...cutCopy, paste],
            upload,
            copies,
            bookmark,
            modify
        ]);
    }
    return grouped([
        created,
        [reveal, terminal],
        decks,
        find,
        run,
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
    showDeck: ClientState['layout']['showDeck'];
    showTimeline: ClientState['layout']['showTimeline'];
    openInWindow: ClientState['windows']['openInWindow'];
    keepPreview: ClientState['layout']['keepPreview'];
    readFileKind: ClientState['fs']['readFileKind'];
    holds: ClientState['apps']['holds'];
    openFile: ClientState['writes']['openFile'];
    revealPath: ClientState['writes']['revealPath'];
    openFolder: ClientState['writes']['openFolder'];
    startTerminal: ClientState['terminals']['startTerminal'];
    showTerminal: ClientState['terminals']['showTerminal'];
    setSearchState: ClientState['search']['setSearchState'];
    /** Write to the clipboard; rejects when the page's clipboard refuses the write. */
    copy: (text: string) => Promise<void>;
    download: (url: string, name: string) => void;
};

/** The store calls out of the client, with the clipboard's write and a link's download. */
export function rowStores(client: ClientState): RowStores {
    return {
        openBeside: client.layout.openBeside,
        openView: client.layout.openView,
        showDeck: (ref, label, beside) =>
            client.layout.showDeck(tabDeck(ref, client.present.portfolio()), label, beside),
        showTimeline: client.layout.showTimeline,
        openInWindow: client.windows.openInWindow,
        keepPreview: client.layout.keepPreview,
        readFileKind: client.fs.readFileKind,
        holds: client.apps.holds,
        openFile: client.writes.openFile,
        revealPath: client.writes.revealPath,
        openFolder: client.writes.openFolder,
        startTerminal: client.terminals.startTerminal,
        showTerminal: client.terminals.showTerminal,
        setSearchState: client.search.setSearchState,
        copy: (text) => navigator.clipboard.writeText(text),
        download: (url, name) => {
            const link = document.createElement('a');
            link.href = url;
            link.download = name;
            link.click();
        }
    };
}

/**
 * What the tree calls a root: the name of the row that draws it (the depth-0 row of the root's
 * own folder), else the root's key.
 */
export function rootNameIn(rows: TreeRow[], root: string): string {
    const own = rows.find(
        (one) => one.root === root && one.depth === 0 && one.path === '' && one.up !== true
    );
    return own?.name ?? root;
}

/** What a pick needs: the stores' calls, and the view's own form, question and refusal line. */
export type RowPickDeps = RowStores & {
    /** The folder of a root key the tree draws, or the empty string. */
    dirOf: (root: string) => string;
    /** What the tree calls a root: its row's name, else the root's key. */
    rootName: (root: string) => string;
    /** Say a refusal on the tree's refusal line. */
    say: (note: string) => void;
    /** Bookmark the row, or take its bookmark out; the star on the row does the same. */
    bookmark: (row: TreeRow) => void;
    addRoot: () => void;
    removeRoot: (root: string) => void;
    /** Run the project command of that name and source in the repository at an absolute folder. */
    runCommand: (repo: string, name: string, source: CommandSource) => void;
    /**
     * The rows a pick on a row acts on: the selection when the row is in it, else the row alone.
     * Omitted, the row alone.
     */
    acting?: (row: TreeRow) => RowRef[];
};

/** The PDF of a row opened as a tab of the page, which answers the tab's id. */
function openPdf(deps: RowStores, row: TreeRow): string {
    return deps.openView('file', fileTabState(row));
}

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

    /** The file handed to its application, a refusal said on the tree. */
    async function program(row: TreeRow): Promise<void> {
        const answer = await deps.openFile(row.root, row.path);
        if (!answer.ok) deps.say(t('file.open_failed', answer.error ?? ''));
    }

    /** A shell in the row's folder, by the one start-and-show path, a refusal said on the tree. */
    async function shell(row: TreeRow, dir: string): Promise<void> {
        const cwd = shellFolder(dir, row);
        const refused = await openShell(deps, cwd, nameOf(cwd));
        if (refused !== null) deps.say(refused);
    }

    /** The paths a copy puts on the clipboard: those of every row acted on, one a line. */
    function copied(row: TreeRow, which: 'absolute' | 'relative'): string {
        const rows = deps.acting?.(row) ?? [row];
        return rows.map((one) => rowPaths(deps.dirOf(one.root), one.path)[which]).join('\n');
    }

    /** Copy to the clipboard, saying the refusal sentence the tab menu says when it is refused. */
    async function copy(text: string): Promise<void> {
        try {
            await deps.copy(text);
        } catch {
            deps.say(t('ui.tab_copy_refused'));
        }
    }

    /**
     * The Present view on the deck a row is about: a folder's or root's own, or the folder of the
     * `present.yml` file. The tab is labelled with the folder's name, and a root with the name its
     * row has in the tree.
     */
    function present(row: TreeRow): void {
        const own =
            row.kind === 'dir'
                ? row.path
                : row.path.slice(0, Math.max(0, row.path.lastIndexOf('/')));
        const label = own === '' ? deps.rootName(row.root) : nameOf(own);
        deps.showDeck({ root: row.root, path: own }, label);
    }

    return (row, pick) => {
        const dir = deps.dirOf(row.root);
        const paths = rowPaths(dir, row.path);
        if (pick === ROW_OPEN_SIDE) void openRowBeside(deps, row);
        else if (pick === ROW_OPEN_PROGRAM) void program(row);
        else if (pick === ROW_OPEN_BROWSER)
            window.open(fileBytesUrl(row.root, row.path), '_blank', 'noopener');
        else if (pick === ROW_ADD_BOOKMARK || pick === ROW_REMOVE_BOOKMARK) deps.bookmark(row);
        else if (pick === ROW_REVEAL) void reveal(row, paths.absolute);
        else if (pick === ROW_TERMINAL) void shell(row, dir);
        else if (pick === ROW_FIND)
            deps.setSearchState(deps.openView('search'), { root: row.root, under: row.path });
        else if (pick === ROW_DOWNLOAD) deps.download(fileBytesUrl(row.root, row.path), row.name);
        else if (pick === ROW_COPY_PATH) void copy(copied(row, 'absolute'));
        else if (pick === ROW_COPY_RELATIVE) void copy(copied(row, 'relative'));
        else if (pick === ROW_ADD_ROOT) deps.addRoot();
        else if (pick === ROW_REMOVE_ROOT) deps.removeRoot(row.root);
        else if (pick === ROW_OPEN_PDF_TAB) deps.keepPreview(openPdf(deps, row));
        else if (pick === ROW_OPEN_PDF_WINDOW) deps.openInWindow(openPdf(deps, row));
        else if (pick === ROW_DECK) present(row);
        else if (pick === ROW_TIMELINE) deps.showTimeline(row.path, row.root);
        else if (pick.startsWith(RUN_PREFIX)) {
            const command = keyOf(pick.slice(RUN_PREFIX.length));
            if (command !== null) deps.runCommand(paths.absolute, command.name, command.source);
        } else if (pick === ROW_PREVIEW) {
            deps.keepPreview(
                deps.openView(MARKDOWN_PREVIEW_VIEW, markdownPreviewState(row.root, row.path))
            );
        }
    };
}
