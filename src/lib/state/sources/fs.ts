// Layer 2, client state. The pure half of the file browser: what a name is, and what the tree
// draws.
//
// The tree is a flat list rather than a component that renders itself. A row carries its depth, so
// one `each` draws the whole tree and the view holds no recursion; and because the list is computed
// from the listings the server answered and the set of open folders, what is on screen is state
// rather than what some component last did to the DOM.
//
// The formats a browser draws are read from the name: the server sends no type with a listing, the
// same answer has to serve a tree drawn before anything is opened, and a name is what the reader
// picks by. Whether anything else is text is the file's own first bytes, through
// data/helpers/text-kind.ts, because a name says nothing reliable about that and a list of
// extensions is wrong about every name nobody put on it.

import { isTextBytes } from '../../data/helpers/text-kind.ts';

export { opensInProgram } from '../../data/helpers/opens-in-program.ts';

/** The root api/file serves the hub itself under, for a link that is a path inside the hub. */
export const HUB_ROOT = 'hub';

/**
 * A path by its segments: the empty and the `.` ones dropped, and each `..` taking the segment
 * before it away, so `funding/x/`, `./funding//x` and `network/../funding/x` are one path. A `..`
 * with no segment before it is kept, which is how a path climbing above its root still says so.
 */
export function normalisePath(path: string): string {
    const kept: string[] = [];
    for (const part of path.split('/')) {
        if (part === '' || part === '.') continue;
        if (part === '..' && kept.length > 0 && kept[kept.length - 1] !== '..') {
            kept.pop();
            continue;
        }
        kept.push(part);
    }
    return kept.join('/');
}

/**
 * The key the engine's own `config/` folder is served under, which is what the Config view lists
 * and opens a file of. It is the client's half of the key lib/server/files/files.ts serves that
 * folder under, since nothing client-side may import a server module;
 * tests/routes/files/file.test.ts holds the two to one another.
 */
export const ENGINE_ROOT = 'engine';

/** How a file opens: an HTML document, a code window, an image, a PDF, or a name and a link. */
export type FileKind = 'html' | 'text' | 'image' | 'pdf' | 'other';

/** One entry of one directory, as /api/fs answers it. */
export type FsEntry = { name: string; kind: 'file' | 'dir'; size: number; mtime: number };

/** One root as /api/fs answers it: `fixed` is a configured root, which a removal refuses. */
export type FsRoot = { key: string; dir: string; fixed: boolean };

/**
 * What a listing asks to see beside what the tree offers by default: the dotfiles and the build
 * folders (`hidden`), and the entries git ignores (`ignored`). A file browser's two toggles.
 */
export type ListingShown = { hidden: boolean; ignored: boolean };

/** What every listing shows unless a file browser's toggles ask for more. */
export const SHOWN_DEFAULT: ListingShown = { hidden: false, ignored: false };

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

/**
 * The extension of a name, lowercased and with its dot, or the empty string for a name with none.
 */
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

/**
 * The open folders an instance's state holds, which is what the tree remembers across a tab switch.
 */
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
 * The forms of one file browser: which one is open, the bookmark the bookmark form edits ('' while
 * it adds one), the text typed into the root or the workspace line form, and how many times a press
 * has opened or closed a form. Each string is '' where the open form does not have it, so a record
 * naming a bookmark while no bookmark form is open names nothing. The count tells one opening of a
 * form from the next opening of the same form, which is what an answer to a request from the first
 * must not close.
 */
export type FilesForms = { form: FilesForm; editing: string; typed: string; opening: number };

/**
 * What one file browser keeps about itself across a tab switch and a saved page: the open folders,
 * the selected row, the filter text, the sections under the tree that are closed, its open form
 * with what was typed into a line form, the refusal and outcome lines that answered its last press,
 * which come back with the form they answered, and its two toggles, whether hidden files and the
 * files git ignores are listed. A bookmark form's typed values are not here: they are the form
 * drafts of state/forms/form-drafts.svelte.ts, kept beside this record as every entry form's are.
 */
export type FilesView = FilesForms &
    ListingShown & {
        expanded: string[];
        selected: RowRef | null;
        filter: string;
        collapsed: string[];
        /**
         * The path another view asked this browser to show, until it is selected and scrolled to.
         */
        reveal: RevealAsk | null;
        /** What the last ask came to when it did not find its path, for the view's outcome line. */
        revealed: RevealOutcome | null;
        /**
         * How many times this browser has been asked to show a path, which tells one ask from the
         * next.
         */
        revealing: number;
        /**
         * What the last press was refused with, in the reader's words, and the empty string for
         * none.
         */
        note: string;
        /** What the bookmark form's last write answered, which is a report and not a refusal. */
        said: string;
    };

/**
 * One ask to show a path: the row asked for, which ask it is, and whether the view has read the
 * folders on its way and selected what it found (`settled`), which leaves only the scroll to it.
 */
export type RevealAsk = RowRef & { asked: number; settled: boolean };

/**
 * What one ask came to: the path was found, it is not on the disk (the nearest folder on its way is
 * shown), a folder on its way could not be read (the last one read is shown, with the reason), the
 * workspace in force has no such root, or the roots of the workspace could not be read at all (with
 * the reason); in the last two nothing is shown.
 */
export type RevealOutcome = {
    kind: 'found' | 'missing' | 'unread' | 'no-root' | 'no-roots';
    asked: RowRef;
    shown: RowRef | null;
    error: string;
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
        opening: countOf(map.opening),
        reveal: askOf(map.reveal),
        revealed: outcomeOf(map.revealed),
        revealing: countOf(map.revealing),
        note: typeof map.note === 'string' ? map.note : '',
        said: typeof map.said === 'string' ? map.said : '',
        hidden: map.hidden === true,
        ignored: map.ignored === true
    };
}

/** The two toggles of one file browser, which is what each of its listings is asked with. */
export function shownOf(view: ListingShown): ListingShown {
    return { hidden: view.hidden, ignored: view.ignored };
}

/** A count a saved record holds, and 0 for anything that is not a whole number from 0 up. */
function countOf(raw: unknown): number {
    return typeof raw === 'number' && Number.isSafeInteger(raw) && raw >= 0 ? raw : 0;
}

/** A row a saved record names, or null for anything that is not a root key and a path. */
function refOf(raw: unknown): RowRef | null {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
    const held = raw as Record<string, unknown>;
    if (typeof held.root !== 'string' || typeof held.path !== 'string') return null;
    return { root: held.root, path: held.path };
}

/** The ask a saved record holds, or null for anything that is not one. */
function askOf(raw: unknown): RevealAsk | null {
    const row = refOf(raw);
    if (row === null || row.root === '') return null;
    const held = raw as Record<string, unknown>;
    if (countOf(held.asked) === 0 || typeof held.settled !== 'boolean') return null;
    return { ...row, asked: countOf(held.asked), settled: held.settled };
}

const OUTCOMES: RevealOutcome['kind'][] = ['found', 'missing', 'unread', 'no-root', 'no-roots'];

/** The outcome a saved record holds, or null for anything that is not one. */
function outcomeOf(raw: unknown): RevealOutcome | null {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
    const held = raw as Record<string, unknown>;
    const kind = OUTCOMES.find((one) => one === held.kind);
    const asked = refOf(held.asked);
    if (kind === undefined || asked === null) return null;
    return {
        kind,
        asked,
        shown: refOf(held.shown),
        error: typeof held.error === 'string' ? held.error : ''
    };
}

/**
 * An instance's state with one more ask to show a path in it, the rest kept. A path given with no
 * root is a path of the hub, and it is asked for by its segments (collection.ts's normalisePath),
 * so `network/../funding` is `funding`; a path still climbing above its root is asked for as it is
 * and is shown at the root's own line, since no listing holds an entry named `..`. The filter is
 * cleared, since a filter would leave the row asked for out of the tree, and the last ask's outcome
 * goes with it.
 */
export function revealAsked(state: unknown, path: string, root: string = HUB_ROOT): object {
    const kept = typeof state === 'object' && state !== null && !Array.isArray(state) ? state : {};
    const revealing = filesViewOf(state).revealing + 1;
    const reveal: RevealAsk = { root, path: normalisePath(path), asked: revealing, settled: false };
    return { ...kept, filter: '', reveal, revealed: null, revealing };
}

/** The folders a row sits under, outermost first: the root's own line, then each folder down. */
export function ancestorsOf(row: RowRef): RowRef[] {
    const parts = row.path.split('/').filter((part) => part !== '');
    return parts.map((_, at) => ({ root: row.root, path: parts.slice(0, at).join('/') }));
}

/**
 * Read the folders on the way to one path, outermost first, each only after the one above it said
 * the next name is a folder, and say what the path came to. The reader is the store's own listing
 * read, which answers a folder already read without a request.
 */
export async function resolveReveal(
    ask: RowRef,
    roots: string[],
    read: (root: string, path: string) => Promise<{ entries: FsEntry[]; error: string }>
): Promise<RevealOutcome> {
    const asked = { root: ask.root, path: ask.path };
    if (!roots.includes(ask.root)) return { kind: 'no-root', asked, shown: null, error: '' };
    const parts = ask.path.split('/').filter((part) => part !== '');
    for (let at = 0; at < parts.length; at += 1) {
        const folder = { root: ask.root, path: parts.slice(0, at).join('/') };
        const listing = await read(folder.root, folder.path);
        if (listing.error !== '') {
            return { kind: 'unread', asked, shown: folder, error: listing.error };
        }
        const entry = listing.entries.find((one) => one.name === parts[at]);
        const last = at === parts.length - 1;
        if (entry === undefined || (!last && entry.kind !== 'dir')) {
            return { kind: 'missing', asked, shown: folder, error: '' };
        }
    }
    return { kind: 'found', asked, shown: asked, error: '' };
}

/**
 * What an ask comes to while the file browser could not read its roots: nothing can be looked for,
 * so the ask is answered at once with the reason rather than left waiting for a later read, which
 * would select a row long after the press that asked for it.
 */
export function rootsUnread(ask: RowRef, error: string): RevealOutcome {
    return { kind: 'no-roots', asked: { root: ask.root, path: ask.path }, shown: null, error };
}

/** Whether the ask an instance holds is this very ask, in the same phase. */
function sameAsk(held: RevealAsk | null, ask: RevealAsk): boolean {
    return (
        held !== null &&
        held.root === ask.root &&
        held.path === ask.path &&
        held.asked === ask.asked &&
        held.settled === ask.settled
    );
}

/**
 * What an answered ask writes, or null when the instance no longer holds that ask: a later ask
 * replaced it, the reader closed the tab (whose record is then gone), or another reading of the
 * same ask has already settled it. The folders above the row shown are opened, the row is
 * selected, and the ask waits for its scroll; a root the workspace lacks has nothing to scroll to.
 */
export function revealSettled(
    now: FilesView,
    ask: RevealAsk,
    outcome: RevealOutcome
): Partial<FilesView> | null {
    if (ask.settled || !sameAsk(now.reveal, ask)) return null;
    const revealed = outcome.kind === 'found' ? null : outcome;
    if (outcome.shown === null) return { reveal: null, revealed };
    const expanded = ancestorsOf(outcome.shown).reduce(
        (open, row) => (open.includes(rowKey(row)) ? open : setExpanded(open, rowKey(row), true)),
        now.expanded
    );
    return { expanded, selected: outcome.shown, reveal: { ...ask, settled: true }, revealed };
}

/** What the scroll to a settled ask writes, or null when the instance holds another ask. */
export function revealScrolled(now: FilesView, ask: RevealAsk): Partial<FilesView> | null {
    return ask.settled && sameAsk(now.reveal, ask) ? { reveal: null } : null;
}

/** The forms part of a file browser's state, which is what a request is sent from. */
export function formsOf(view: FilesForms): FilesForms {
    return { form: view.form, editing: view.editing, typed: view.typed, opening: view.opening };
}

/**
 * The forms a section's own control leaves: the form it names opens, or closes when it is the one
 * open, and a bookmark form open over an entry gives way to the one that adds. Whatever line of
 * text was typed goes with the form it was typed into.
 */
export function formShown(now: FilesForms, which: Exclude<FilesForm, ''>): FilesForms {
    const closing = now.form === which && now.editing === '';
    return { form: closing ? '' : which, editing: '', typed: '', opening: now.opening + 1 };
}

/**
 * The forms a bookmark row's edit control leaves: that bookmark's form, or none when it was open.
 */
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
 * Whether the bookmark form is open over a bookmark the bookmarks file no longer holds, read once
 * the file has been read without an error. Such a form has nothing to draw and nothing to save
 * into.
 *
 * A form with a save of its own out (`saving`) is not one of them until its answer lands: a write
 * from elsewhere on the page can take the bookmark away while the reader is typing into that form,
 * and closing it then would take the words out from under them. Once the answer has landed the form
 * is read like any other.
 */
export function editedGone(
    now: FilesForms,
    marks: { entries: { id: string }[]; loading: boolean; error: string },
    saving: boolean
): boolean {
    if (now.form !== 'bookmark' || now.editing === '') return false;
    if (marks.loading || marks.error !== '' || saving) return false;
    return !marks.entries.some((one) => one.id === now.editing);
}

/** The view id of the file browser, whose instance records are the ones holding FilesForms. */
export const FILES_VIEW = 'files';

/**
 * One instance's record with part of a file browser's own state written over it, keeping whatever
 * else the record holds. What the ui store has under an id is whatever was saved there, which may
 * be anything at all, so a record that is not a map is read as an empty one.
 */
export function patchedFilesView(kept: unknown, part: Partial<FilesView>): Record<string, unknown> {
    const held = typeof kept === 'object' && kept !== null && !Array.isArray(kept) ? kept : {};
    return { ...held, ...part };
}

/**
 * Whether one instance holds a root or workspace line no save has taken: a file browser whose line
 * form is open with text in it other than spaces, which the add would take as nothing. The view is
 * checked first, since another view's record may hold keys of the same names.
 */
export function filesLineTyped(view: string | undefined, state: unknown): boolean {
    return view === FILES_VIEW && filesViewOf(state).typed.trim() !== '';
}

/**
 * The bookmark form a move from one set of forms to the next closes, as the bookmark it edited (''
 * for the form that adds), or null when no bookmark form closes. A move that keeps the same
 * bookmark form open closes nothing.
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
    text: string,
    top: TreeTop | null = null
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
        const path = top?.path ?? '';
        const below = walk(root.key, path, 1);
        const own: TreeRow = {
            root: root.key,
            path,
            name: top?.name ?? root.key,
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
 * The rows as the tree's keyboard reads them (ui/tree/tree-keys.ts's KeyRow): each row's key, the
 * key of the row it sits under, and whether a folder is open. While a filter draws the rows, a
 * folder is open because the filter holds it so, and the keyboard steps through it without opening
 * or closing it, which is what leaves the reader's own open folders as they were when the filter is
 * cleared.
 */
export function treeKeyRows(
    rows: TreeRow[],
    filtering: boolean
): { id: string; parent: string | null; open?: boolean; fixed?: boolean }[] {
    return rows.map((row) => {
        // A tree drawn from a folder inside its root has that folder as its head, with no parent.
        const parent = row.depth === 0 ? null : parentOf(row);
        return {
            id: rowKey(row),
            parent: parent === null ? null : rowKey(parent),
            open: row.kind === 'dir' ? row.open : undefined,
            fixed: filtering
        };
    });
}

/**
 * The row keys the reader's own bookmarks name, which the tree draws its star from. An entry whose
 * root or path is not a string names no row.
 */
export function markedKeys(entries: { fields: Record<string, unknown> }[]): string[] {
    return entries.flatMap((one) =>
        typeof one.fields.root === 'string' && typeof one.fields.path === 'string'
            ? [treeKey(one.fields.root, one.fields.path)]
            : []
    );
}

/**
 * The bookmarks schema the entry form draws, with the roots of the workspace in force as the
 * choices of its root field. The file's own schema names the field and its type; which roots there
 * are is the reader's workspace and changes under it, so it is supplied here rather than written
 * into the file, where a root added later would not be one a bookmark could name.
 */
export function markSchemaFor<T extends { field: string }>(
    schema: T[],
    roots: { key: string }[]
): (T & { options?: string[] })[] {
    return schema.map((field) =>
        field.field === 'root' ? { ...field, options: roots.map((one) => one.key) } : field
    );
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

/**
 * The open folders with every folder under one root closed, the root's own line left as it was;
 * with `from`, only the folders under that folder of the root, the folder's own line left as it
 * was.
 */
export function collapseRoot(expanded: string[], root: string, from = ''): string[] {
    const own = treeKey(root, from);
    const under = from === '' ? own : `${own}/`;
    return expanded.filter((key) => key === own || !key.startsWith(under));
}

/**
 * The lines of the tree: every root, and under each open folder the entries the server answered for
 * it. A folder that is open but whose listing has not arrived contributes its own line and nothing
 * under it, so the tree grows as the answers land rather than waiting for all of them.
 */
export function treeRows(
    roots: FsRoot[],
    entriesOf: (root: string, path: string) => FsEntry[],
    expanded: string[],
    top: TreeTop | null = null
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
        const path = top?.path ?? '';
        const open = expanded.includes(treeKey(root.key, path));
        rows.push({
            root: root.key,
            path,
            name: top?.name ?? root.key,
            kind: 'dir',
            size: 0,
            depth: 0,
            open
        });
        if (open) walk(root.key, path, 1);
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

/**
 * The root a folder lies in and its path inside that root, the deepest root holding it winning, or
 * null when no root holds it. A Files tab in follow mode shows the root holding the followed
 * session's workspace, and the composer's attach picker lists the workspace through the same root.
 */
export function rootHolding(roots: FsRoot[], dir: string): { root: FsRoot; path: string } | null {
    const wanted = dir.endsWith('/') && dir.length > 1 ? dir.slice(0, -1) : dir;
    let best: { root: FsRoot; path: string } | null = null;
    for (const root of roots) {
        const base =
            root.dir.endsWith('/') && root.dir.length > 1 ? root.dir.slice(0, -1) : root.dir;
        if (base === '') continue;
        const inside =
            wanted === base
                ? ''
                : wanted.startsWith(`${base}/`)
                  ? wanted.slice(base.length + 1)
                  : null;
        if (inside === null) continue;
        if (best === null || base.length > best.root.dir.length) best = { root, path: inside };
    }
    return best;
}

/**
 * Whether a Files tab follows the workspace of the selected session: `follow: true` in its
 * instance's layout state, which the sessions arrangement gives its Files tab.
 */
export function followsSession(state: unknown): boolean {
    return (
        typeof state === 'object' &&
        state !== null &&
        !Array.isArray(state) &&
        (state as Record<string, unknown>).follow === true
    );
}

/**
 * The folder a tree is drawn from when it is not its root's top: its path inside the root, and the
 * name its head row shows.
 */
export type TreeTop = { path: string; name: string };

/** What a Files tab's follow mode draws: the folder followed, its root, and the roots drawn. */
export type FollowView = {
    following: boolean;
    dir: string | null;
    found: { root: FsRoot; path: string } | null;
    /** The roots the tree draws: the one holding the followed folder, or all of them. */
    roots: FsRoot[];
    /** The followed folder as the head of the tree, which is then that folder and what is in it. */
    top: TreeTop | null;
};

/** The last segment of a folder, the name a tree drawn from it shows on its head. */
function folderName(dir: string): string {
    const trimmed = dir.endsWith('/') && dir.length > 1 ? dir.slice(0, -1) : dir;
    const at = trimmed.lastIndexOf('/');
    return at < 0 ? trimmed : trimmed.slice(at + 1);
}

/**
 * The follow mode of one Files tab, from its layout state, its workspace's roots and a folder: the
 * tree is the followed folder itself, as the head of its own tree, read through the root that holds
 * it.
 */
export function followView(state: unknown, roots: FsRoot[], dir: string | null): FollowView {
    if (!followsSession(state)) {
        return { following: false, dir: null, found: null, roots, top: null };
    }
    const found = dir === null ? null : rootHolding(roots, dir);
    if (found === null || dir === null) {
        return { following: true, dir, found: null, roots: [], top: null };
    }
    return {
        following: true,
        dir,
        found,
        roots: [found.root],
        top: { path: found.path, name: folderName(dir) }
    };
}

/**
 * The folder follow mode shows for the selection: a session's workspace, else its folder, else a
 * selected terminal's folder, and null when nothing selected names one.
 */
export function followedDirOf(
    session: { workspace: string; cwd?: string | null } | null,
    terminal: { cwd: string } | null
): string | null {
    const dir =
        session !== null
            ? session.workspace === ''
                ? (session.cwd ?? '')
                : session.workspace
            : (terminal?.cwd ?? '');
    return dir === '' ? null : dir;
}

/** A tab's layout state with follow mode set on or off, the rest of it kept. */
export function withFollow(state: unknown, on: boolean): Record<string, unknown> {
    const kept = typeof state === 'object' && state !== null && !Array.isArray(state) ? state : {};
    return { ...kept, follow: on };
}

/**
 * A tab's layout state pinned to one session or terminal, which it then follows instead of the
 * selection, or with its pin taken away for null; follow mode stays on either way.
 */
export function withFollowPin(state: unknown, session: string | null): Record<string, unknown> {
    const kept: Record<string, unknown> = { ...withFollow(state, true) };
    delete kept.session;
    return session === null ? kept : { ...kept, session };
}

/** A tab's instance state with the followed folder, the head of its tree, open. */
export function followRevealed(held: unknown, found: { root: FsRoot; path: string }): object {
    const key = treeKey(found.root.key, found.path);
    return patchedFilesView(held, {
        expanded: setExpanded(filesViewOf(held).expanded, key, true)
    });
}

/** The drag type a file row carries: its absolute path, for a drop target that takes a file. */
export const FILE_DRAG = 'application/x-oculus-file';

/** The absolute path of a row, from its root's folder and its path inside it. */
export function absoluteOf(rootDir: string, path: string): string {
    const base = rootDir.endsWith('/') ? rootDir.slice(0, -1) : rootDir;
    return path === '' ? base : `${base}/${path}`;
}
