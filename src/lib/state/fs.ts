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
