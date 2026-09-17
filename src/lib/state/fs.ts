// Layer 2, client state. The pure half of the file browser: what a name is, and what the tree draws.
//
// The tree is a flat list rather than a component that renders itself. A row carries its depth, so
// one `each` draws the whole tree and the view holds no recursion; and because the list is computed
// from the listings the server answered and the set of open folders, what is on screen is state
// rather than what some component last did to the DOM.
//
// The formats a browser draws are read from the name: the server sends no type with a listing, the
// same answer has to serve a tree drawn before anything is opened, and a name is what the reader
// picks by. Whether anything else is text is the file's own first bytes, through data/text-kind.ts,
// because a name says nothing reliable about that and a list of extensions is wrong about every
// name nobody put on it.

import { isTextBytes } from '../data/text-kind.ts';

export { opensInProgram } from '../data/opens-in-program.ts';

/**
 * The key the engine's own `config/` folder is served under, which is what the Config view lists and
 * opens a file of. It is the client's half of the key lib/server/files.ts serves that folder under,
 * since nothing client-side may import a server module; tests/routes/file.test.ts holds the two to
 * one another.
 */
export const ENGINE_ROOT = 'engine';

/** How a file opens: an HTML document, a code window, an image, a PDF, or a name and a link. */
export type FileKind = 'html' | 'text' | 'image' | 'pdf' | 'other';

/** One entry of one directory, as /api/fs answers it. */
export type FsEntry = { name: string; kind: 'file' | 'dir'; size: number; mtime: number };

/** One root as /api/fs answers it: `fixed` is a configured root, which a removal refuses. */
export type FsRoot = { key: string; dir: string; fixed: boolean };

/** One line of the tree: what it is, how deep it sits, and whether a folder is open. */
export type TreeRow = {
    root: string;
    /** The path under the root. The empty string is the root's own line. */
    path: string;
    name: string;
    kind: 'file' | 'dir';
    /** The file's size in bytes, and zero for a folder. */
    size: number;
    depth: number;
    open: boolean;
};

/** A file's type, and for a text file the highlighter's name for its language. */
export type FileType = { kind: FileKind; language: string };

/** The largest text a code window draws. A longer file is cut here and the view says so. */
export const TEXT_LIMIT = 2 * 1024 * 1024;

/** The extensions each language claims. A text file outside this map is painted as plain text. */
const LANGUAGES: Record<string, string[]> = {
    typescript: ['.ts', '.tsx', '.mts', '.cts'],
    javascript: ['.js', '.jsx', '.mjs', '.cjs'],
    python: ['.py'],
    yaml: ['.yml', '.yaml'],
    json: ['.json', '.ipynb'],
    bash: ['.sh', '.bash', '.zsh', '.slurm'],
    markdown: ['.md'],
    latex: ['.tex', '.bib', '.sty', '.cls'],
    css: ['.css'],
    xml: ['.xml', '.svelte'],
    lisp: ['.lisp', '.el', '.scm'],
    ocaml: ['.ml', '.mli'],
    r: ['.r'],
    matlab: ['.m'],
    julia: ['.jl'],
    ini: ['.toml', '.ini']
};

/**
 * The whole names a language claims, for a file that carries no extension to be read from. The name
 * is compared lowercased, which is what makes `Makefile` and `makefile` the same file to a reader.
 */
const NAMES: Record<string, string[]> = {
    makefile: ['makefile']
};

/** What the highlighter calls a file it has no language for. */
const PLAIN = 'plaintext';

/** The extensions drawn as a picture. */
const IMAGES = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];

/** The extensions that open in the document view, which is the one type this view hands on. */
const PAGES = ['.html', '.htm'];

/** The extension of a name, lowercased and with its dot, or the empty string for a name with none. */
export function extensionOf(name: string): string {
    const base =
        name
            .split('/')
            .filter((part) => part !== '')
            .at(-1) ?? name;
    const at = base.lastIndexOf('.');
    return at <= 0 ? '' : base.slice(at).toLowerCase();
}

/** The last segment of a path, which is what a tab is labelled with. */
export function nameOf(path: string): string {
    return (
        path
            .split('/')
            .filter((part) => part !== '')
            .at(-1) ?? path
    );
}

/** The highlighter's name for a file's language, from its extension or from its whole name. */
export function languageOf(name: string): string {
    const suffix = extensionOf(name);
    for (const [language, list] of Object.entries(LANGUAGES)) {
        if (list.includes(suffix)) return language;
    }
    const bare = nameOf(name).toLowerCase();
    for (const [language, list] of Object.entries(NAMES)) {
        if (list.includes(bare)) return language;
    }
    return PLAIN;
}

/**
 * How a file opens. The three formats a browser draws itself are the name's: an SVG is a picture
 * rather than text, as it is drawn everywhere else in the application. Everything else is text when
 * its first bytes say so and a download when they do not, so a `.txt` holding an archive is a
 * download and a script nobody gave an extension is text. A caller with no bytes yet gets `other`,
 * which is what the file view draws while it has none.
 */
export function typeOfFile(name: string, bytes?: Uint8Array): FileType {
    const suffix = extensionOf(name);
    if (PAGES.includes(suffix)) return { kind: 'html', language: PLAIN };
    if (IMAGES.includes(suffix)) return { kind: 'image', language: PLAIN };
    if (suffix === '.pdf') return { kind: 'pdf', language: PLAIN };
    const text = bytes !== undefined && isTextBytes(bytes);
    return { kind: text ? 'text' : 'other', language: languageOf(name) };
}

/** Every language the code window registers, which is every one a name can resolve to. */
export function languages(): string[] {
    return [...new Set([...Object.keys(LANGUAGES), ...Object.keys(NAMES)])];
}

/** How one open folder is addressed in the set of open folders, and in a listing's own cache. */
export function treeKey(root: string, path: string): string {
    return `${root}:${path}`;
}

/** The path of one entry under a folder. */
export function childPath(path: string, name: string): string {
    return path === '' ? name : `${path}/${name}`;
}

/** The open folders an instance's state holds, which is what the tree remembers across a tab switch. */
export function expandedOf(state: unknown): string[] {
    if (typeof state !== 'object' || state === null || Array.isArray(state)) return [];
    const held = (state as Record<string, unknown>).expanded;
    if (!Array.isArray(held)) return [];
    return held.filter((one): one is string => typeof one === 'string');
}

/** The same set with one folder opened or closed. */
export function toggleExpanded(expanded: string[], key: string): string[] {
    return expanded.includes(key) ? expanded.filter((one) => one !== key) : [...expanded, key];
}

/** One row as the tree addresses it: which root, and which path under it. */
export type RowRef = { root: string; path: string };

/** Which form is open over the trees: a root's folder, a workspace's name, a bookmark, or none. */
export type FilesForm = 'root' | 'workspace' | 'bookmark' | '';

/**
 * The forms of one file browser: which one is open, the bookmark the bookmark form edits ('' while it
 * adds one), the text typed into the root or the workspace line form, and how many times a press has
 * opened or closed a form. Each string is '' where the open form does not have it, so a record naming
 * a bookmark while no bookmark form is open names nothing. The count tells one opening of a form from
 * the next opening of the same form, which is what an answer to a request from the first must not
 * close.
 */
export type FilesForms = { form: FilesForm; editing: string; typed: string; opening: number };

/**
 * What one file browser keeps about itself across a tab switch and a saved page: the open folders,
 * the selected row, the filter text, the sections under the tree that are closed, and its open form
 * with what was typed into a line form. A bookmark form's typed values are not here: they are the
 * form drafts of state/form-drafts.svelte.ts, kept beside this record as every entry form's are.
 */
export type FilesView = FilesForms & {
    expanded: string[];
    selected: RowRef | null;
    filter: string;
    collapsed: string[];
};

/** Whether a form is one of the two a line of text is typed into. */
function isLineForm(form: FilesForm): boolean {
    return form === 'root' || form === 'workspace';
}

/** The open form a saved record names, and no form for a name that is none of the three. */
function formOf(raw: unknown): FilesForm {
    return raw === 'root' || raw === 'workspace' || raw === 'bookmark' ? raw : '';
}

/** The file browser's instance state, every field defaulted, so a state from any source draws. */
export function filesViewOf(state: unknown): FilesView {
    const map =
        typeof state === 'object' && state !== null && !Array.isArray(state)
            ? (state as Record<string, unknown>)
            : {};
    const picked = map.selected as Record<string, unknown> | null | undefined;
    const selected =
        typeof picked === 'object' &&
        picked !== null &&
        typeof picked.root === 'string' &&
        typeof picked.path === 'string' &&
        picked.root !== ''
            ? { root: picked.root, path: picked.path }
            : null;
    const collapsed = Array.isArray(map.collapsed)
        ? map.collapsed.filter((one): one is string => typeof one === 'string')
        : [];
    const form = formOf(map.form);
    return {
        expanded: expandedOf(state),
        selected,
        filter: typeof map.filter === 'string' ? map.filter : '',
        collapsed,
        form,
        editing: form === 'bookmark' && typeof map.editing === 'string' ? map.editing : '',
        typed: isLineForm(form) && typeof map.typed === 'string' ? map.typed : '',
        opening:
            typeof map.opening === 'number' && Number.isSafeInteger(map.opening) && map.opening >= 0
                ? map.opening
                : 0
    };
}

/** The forms part of a file browser's state, which is what a request is sent from. */
export function formsOf(view: FilesForms): FilesForms {
    return { form: view.form, editing: view.editing, typed: view.typed, opening: view.opening };
}

/**
 * The forms a section's own control leaves: the form it names opens, or closes when it is the one
 * open, and a bookmark form open over an entry gives way to the one that adds. Whatever line of text
 * was typed goes with the form it was typed into.
 */
export function formShown(now: FilesForms, which: Exclude<FilesForm, ''>): FilesForms {
    const closing = now.form === which && now.editing === '';
    return { form: closing ? '' : which, editing: '', typed: '', opening: now.opening + 1 };
}

/** The forms a bookmark row's edit control leaves: that bookmark's form, or none when it was open. */
export function editShown(now: FilesForms, id: string): FilesForms {
    const same = now.form === 'bookmark' && now.editing === id;
    return {
        form: same ? '' : 'bookmark',
        editing: same ? '' : id,
        typed: '',
        opening: now.opening + 1
    };
}

/**
 * Whether the bookmark form is open over a bookmark the bookmarks file no longer holds, read once the
 * file has been read without an error. Such a form has nothing to draw and nothing to save into.
 */
export function editedGone(
    now: FilesForms,
    marks: { entries: { id: string }[]; loading: boolean; error: string }
): boolean {
    if (now.form !== 'bookmark' || now.editing === '') return false;
    if (marks.loading || marks.error !== '') return false;
    return !marks.entries.some((one) => one.id === now.editing);
}

/**
 * Whether one instance holds a root or workspace line no save has taken: a file browser whose line
 * form is open with text in it other than spaces, which the add would take as nothing. The view is
 * checked first, since another view's record may hold keys of the same names.
 */
export function filesLineTyped(view: string | undefined, state: unknown): boolean {
    return view === 'files' && filesViewOf(state).typed.trim() !== '';
}

/**
 * The bookmark form a move from one set of forms to the next closes, as the bookmark it edited ('' for
 * the form that adds), or null when no bookmark form closes. A move that keeps the same bookmark form
 * open closes nothing.
 */
export function bookmarkLeft(now: FilesForms, next: FilesForms): { editing: string } | null {
    if (now.form !== 'bookmark') return null;
    if (next.form === 'bookmark' && next.editing === now.editing) return null;
    return { editing: now.editing };
}

/**
 * The forms an answer that closes a form leaves, or null when the form it answers is no longer the
 * one open. An answer arrives after its request went: by then the reader may have opened another
 * form, closed the form and opened the same one again, typed on in it, or closed the tab, which
 * takes the whole record away. Only the opening the request was made from, still holding what it
 * held, is closed by it.
 */
export function formSettled(now: FilesForms, asked: FilesForms): FilesForms | null {
    const same =
        now.form === asked.form &&
        now.editing === asked.editing &&
        now.typed === asked.typed &&
        now.opening === asked.opening;
    return same && asked.form !== ''
        ? { form: '', editing: '', typed: '', opening: now.opening }
        : null;
}

/** The key one row is addressed by among the rows, which is its key in the set of open folders. */
export function rowKey(row: RowRef): string {
    return treeKey(row.root, row.path);
}

/** The folder one path sits in, and null for a root's own line, which sits in nothing. */
export function parentOf(row: RowRef): RowRef | null {
    if (row.path === '') return null;
    const at = row.path.lastIndexOf('/');
    return { root: row.root, path: at < 0 ? '' : row.path.slice(0, at) };
}

/**
 * The rows a filter leaves: every root's line, every entry whose name holds the text whatever its
 * case, and every folder above one of those, drawn open so the match is seen under the folders it
 * sits in. The entries are the listings already read, `null` for a folder never read: a folder the
 * reader opened once and closed again is searched, and a folder nobody opened is not, since reading
 * it would walk the whole root for one keystroke. An empty filter is no filter, and the view draws
 * treeRows() for it instead.
 */
export function filterRows(
    roots: FsRoot[],
    heldOf: (root: string, path: string) => FsEntry[] | null,
    text: string
): TreeRow[] {
    const wanted = text.trim().toLowerCase();
    const walk = (root: string, path: string, depth: number): TreeRow[] => {
        const found: TreeRow[] = [];
        for (const entry of heldOf(root, path) ?? []) {
            const child = childPath(path, entry.name);
            const below = entry.kind === 'dir' ? walk(root, child, depth + 1) : [];
            if (below.length === 0 && !entry.name.toLowerCase().includes(wanted)) continue;
            found.push({
                root,
                path: child,
                name: entry.name,
                kind: entry.kind,
                size: entry.size,
                depth,
                open: below.length > 0
            });
            found.push(...below);
        }
        return found;
    };
    return roots.flatMap((root) => {
        const below = walk(root.key, '', 1);
        const own: TreeRow = {
            root: root.key,
            path: '',
            name: root.key,
            kind: 'dir',
            size: 0,
            depth: 0,
            open: below.length > 0
        };
        return [own, ...below];
    });
}

/** The same set of open folders with one folder set open or closed, whatever it was before. */
export function setExpanded(expanded: string[], key: string, open: boolean): string[] {
    const rest = expanded.filter((one) => one !== key);
    return open ? [...rest, key] : rest;
}

/**
 * The rows as the tree's keyboard reads them (ui/tree-keys.ts's KeyRow): each row's key, the key of
 * the row it sits under, and whether a folder is open. While a filter draws the rows, a folder is
 * open because the filter holds it so, and the keyboard steps through it without opening or closing
 * it, which is what leaves the reader's own open folders as they were when the filter is cleared.
 */
export function treeKeyRows(
    rows: TreeRow[],
    filtering: boolean
): { id: string; parent: string | null; open?: boolean; fixed?: boolean }[] {
    return rows.map((row) => {
        const parent = parentOf(row);
        return {
            id: rowKey(row),
            parent: parent === null ? null : rowKey(parent),
            open: row.kind === 'dir' ? row.open : undefined,
            fixed: filtering
        };
    });
}

/**
 * The label a file is bookmarked under from the tree: its own name, or its path under the root when
 * another bookmark already carries that name, since the label is what a bookmark is found by.
 */
export function markLabel(row: RowRef & { name: string }, labels: string[]): string {
    return labels.includes(row.name) ? row.path : row.name;
}

/**
 * The segments of the path one row sits at: the root, then each folder down to the row itself, each
 * with the row it names.
 */
export function crumbsOf(selected: RowRef | null): { row: RowRef; label: string }[] {
    if (selected === null) return [];
    const parts = selected.path.split('/').filter((part) => part !== '');
    return [
        { row: { root: selected.root, path: '' }, label: selected.root },
        ...parts.map((part, at) => ({
            row: { root: selected.root, path: parts.slice(0, at + 1).join('/') },
            label: part
        }))
    ];
}

/** The open folders with every folder under one root closed, the root's own line left as it was. */
export function collapseRoot(expanded: string[], root: string): string[] {
    const own = treeKey(root, '');
    return expanded.filter((key) => key === own || !key.startsWith(own));
}

/**
 * The lines of the tree: every root, and under each open folder the entries the server answered for
 * it. A folder that is open but whose listing has not arrived contributes its own line and nothing
 * under it, so the tree grows as the answers land rather than waiting for all of them.
 */
export function treeRows(
    roots: FsRoot[],
    entriesOf: (root: string, path: string) => FsEntry[],
    expanded: string[]
): TreeRow[] {
    const rows: TreeRow[] = [];
    const walk = (root: string, path: string, depth: number): void => {
        for (const entry of entriesOf(root, path)) {
            const child = childPath(path, entry.name);
            const open = entry.kind === 'dir' && expanded.includes(treeKey(root, child));
            rows.push({
                root,
                path: child,
                name: entry.name,
                kind: entry.kind,
                size: entry.size,
                depth,
                open
            });
            if (open) walk(root, child, depth + 1);
        }
    };
    for (const root of roots) {
        const open = expanded.includes(treeKey(root.key, ''));
        rows.push({
            root: root.key,
            path: '',
            name: root.key,
            kind: 'dir',
            size: 0,
            depth: 0,
            open
        });
        if (open) walk(root.key, '', 1);
    }
    return rows;
}

/**
 * The workspaces a reader picks among, in their order: the configured roots first, which have no
 * name, then every saved workspace by its name.
 */
export function workspaceChoices(names: string[]): string[] {
    return ['', ...names.filter((name) => name !== '')];
}
