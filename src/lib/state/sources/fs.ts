// Layer 2, client state. The pure half of the file browser: what the tree draws. What a name says
// about a file is state/sources/explorer/file-type.ts's, exported from here with the rest of the
// browser.
//
// The tree is a flat list rather than a component that renders itself. A row carries its depth, so
// one `each` draws the whole tree and the view holds no recursion; and because the list is computed
// from the listings the server answered and the set of open folders, what is on screen is state
// rather than what some component last did to the DOM.
//
// The path rules come from data/helpers/files/paths.ts (`deepestHolding`).

export { opensInProgram } from '../../data/helpers/files/opens-in-program.ts';
export {
    extensionOf,
    languageOf,
    languages,
    nameOf,
    typeOfFile,
    type FileKind,
    type FileType
} from './explorer/file-type.ts';
import { z } from 'zod';
import { TEXT_LIMIT } from '../../data/file-ops.ts';
import { fieldItemsShape, readAs } from '../../data/shapes/shapes.ts';
import { deepestHolding } from '../../data/helpers/files/paths.ts';
import { isMap } from '../../data/helpers/guards.ts';
import type { Naming } from './explorer/naming.ts';

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

/** One entry of one directory, as /api/fs answers it. */
export type FsEntry = {
    name: string;
    kind: 'file' | 'dir';
    size: number;
    mtime: number;
    /** True for a symbolic link, whose `kind` is that of what it points at. */
    link?: true;
};

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
    /** True for a symbolic link, whose `kind` is that of what it points at. */
    link?: true;
    depth: number;
    open: boolean;
    /**
     * Set on the row where a name is typed: `new` for the pending row of a new file or folder,
     * which has no name yet, and `rename` for the row whose name the input replaces.
     */
    editing?: 'new' | 'rename';
};

/**
 * The largest text a code window draws, which is data/file-ops.ts's. A longer file is cut here and
 * the view says so.
 */
export { TEXT_LIMIT };

/** How one open folder is addressed in the set of open folders, and in a listing's own cache. */
export function treeKey(root: string, path: string): string {
    return `${root}:${path}`;
}

/** The path of one entry under a folder. */
export function childPath(path: string, name: string): string {
    return path === '' ? name : `${path}/${name}`;
}

/** The one field of an instance's state that holds its open folders. */
const expandedHeldShape = z.object({ expanded: fieldItemsShape });

/**
 * The open folders an instance's state holds, which is what the tree remembers across a tab switch.
 */
export function expandedOf(state: unknown): string[] {
    return readAs(expandedHeldShape, state)?.expanded ?? [];
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
        /** The name being typed for a new file or folder, or a renamed row; null for none. */
        naming: Naming | null;
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

/** A count a saved record holds, and 0 for anything that is not a whole number from 0 up. */
const countShape = z.number().int().min(0).catch(0);

/** A row a saved record names: a root key and a path. */
const refShape = z.object({ root: z.string(), path: z.string() }) satisfies z.ZodType<RowRef>;

/** The ask a saved record holds: a named root, a path, which ask it is and if it is settled. */
const askShape = z.object({
    root: z.string().min(1),
    path: z.string(),
    asked: z.number().int().min(1),
    settled: z.boolean()
}) satisfies z.ZodType<RevealAsk>;

/** The outcome a saved record holds: a kind, the row asked, the row shown and the reason. */
const outcomeShape = z.object({
    kind: z.enum(['found', 'missing', 'unread', 'no-root', 'no-roots']),
    asked: refShape,
    shown: refShape.nullable().catch(null),
    error: z.string().catch('')
}) satisfies z.ZodType<RevealOutcome>;

/** The row selected, which names a root. */
const selectedShape = z.object({ root: z.string().min(1), path: z.string() });

/** The open form a saved record names, and no form for a name that is none of the three. */
const formShape = z.enum(['', 'root', 'workspace', 'bookmark']).catch('');

/** The pending name a saved record holds: a kind, a named root and a path. */
const namingShape = z.object({
    mode: z.enum(['file', 'folder', 'rename']),
    root: z.string().min(1),
    path: z.string()
}) satisfies z.ZodType<Naming>;

/** A file browser's instance state with every field defaulted, so a state from any source draws. */
const filesViewShape = z
    .object({
        expanded: fieldItemsShape,
        selected: selectedShape.nullable().catch(null),
        filter: z.string().catch(''),
        collapsed: fieldItemsShape,
        form: formShape,
        editing: z.string().catch(''),
        typed: z.string().catch(''),
        opening: countShape,
        reveal: askShape.nullable().catch(null),
        revealed: outcomeShape.nullable().catch(null),
        revealing: countShape,
        note: z.string().catch(''),
        said: z.string().catch(''),
        naming: namingShape.nullable().catch(null),
        hidden: z.boolean().catch(false),
        ignored: z.boolean().catch(false)
    })
    .transform((held): FilesView => ({
        ...held,
        editing: held.form === 'bookmark' ? held.editing : '',
        typed: isLineForm(held.form) ? held.typed : '',
        // A rename names the row it renames, so a rename of no path is none.
        naming: held.naming?.mode === 'rename' && held.naming.path === '' ? null : held.naming
    }));

/** The file browser's instance state, every field defaulted, so a state from any source draws. */
export function filesViewOf(state: unknown): FilesView {
    return readAs(filesViewShape, state) ?? emptyFilesView();
}

/** A file browser with nothing open, selected or typed. */
function emptyFilesView(): FilesView {
    return {
        expanded: [],
        selected: null,
        filter: '',
        collapsed: [],
        form: '',
        editing: '',
        typed: '',
        opening: 0,
        reveal: null,
        revealed: null,
        revealing: 0,
        note: '',
        said: '',
        naming: null,
        hidden: false,
        ignored: false
    };
}

/** The two toggles of one file browser, which is what each of its listings is asked with. */
export function shownOf(view: ListingShown): ListingShown {
    return { hidden: view.hidden, ignored: view.ignored };
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
    const kept = isMap(state) ? state : {};
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
    return { ...(isMap(kept) ? kept : {}), ...part };
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
                ...(entry.link === true ? { link: true as const } : {}),
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
    return entries.flatMap((one) => {
        const row = readAs(refShape, one.fields);
        return row === null ? [] : [treeKey(row.root, row.path)];
    });
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
 * under it, so the tree grows as the answers land rather than waiting for all of them. The name
 * being typed (`naming`) is a row too: for a new file or folder the first row under its folder,
 * and for a rename the renamed row itself, each marked `editing`.
 */
export function treeRows(
    roots: FsRoot[],
    entriesOf: (root: string, path: string) => FsEntry[],
    expanded: string[],
    top: TreeTop | null = null,
    naming: Naming | null = null
): TreeRow[] {
    const rows: TreeRow[] = [];
    const walk = (root: string, path: string, depth: number): void => {
        if (
            naming !== null &&
            naming.mode !== 'rename' &&
            naming.root === root &&
            naming.path === path
        ) {
            rows.push({
                root,
                path: `${path}/`,
                name: '',
                kind: naming.mode === 'folder' ? 'dir' : 'file',
                size: 0,
                depth,
                open: false,
                editing: 'new'
            });
        }
        for (const entry of entriesOf(root, path)) {
            const child = childPath(path, entry.name);
            const open = entry.kind === 'dir' && expanded.includes(treeKey(root, child));
            const renaming =
                naming?.mode === 'rename' && naming.root === root && naming.path === child;
            rows.push({
                root,
                path: child,
                name: entry.name,
                kind: entry.kind,
                size: entry.size,
                ...(entry.link === true ? { link: true as const } : {}),
                depth,
                open,
                ...(renaming ? { editing: 'rename' as const } : {})
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
    const found = deepestHolding(roots, (root) => root.dir, dir);
    return found === null ? null : { root: found.item, path: found.path };
}

/**
 * Whether a Files tab follows the workspace of the selected session: `follow: true` in its
 * instance's layout state, which the sessions arrangement gives its Files tab.
 */
export function followsSession(state: unknown): boolean {
    return isMap(state) && state.follow === true;
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
    return { ...(isMap(state) ? state : {}), follow: on };
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
