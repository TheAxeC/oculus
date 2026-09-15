// Layer 2, client state. The pure half of the file browser: what a name is, and what the tree draws.
//
// The tree is a flat list rather than a component that renders itself. A row carries its depth, so
// one `each` draws the whole tree and the view holds no recursion; and because the list is computed
// from the listings the server answered and the set of open folders, what is on screen is state
// rather than what some component last did to the DOM.
//
// A file's type is read from its name alone. The server sends no type with a listing: the same
// answer has to serve a tree drawn before anything is opened, and a name is what the reader picks by.

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

/** The extensions each language claims. Anything in `TEXT` that is not here is plain text. */
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

/** The extensions that open in the code window, over and above the ones a language claims. */
const TEXT = ['.txt', '.csv', '.tsv', '.log', '.cfg', '.conf', '.c', '.h', '.cpp', '.hpp', '.sql'];

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

/**
 * How a file opens, by its name. An SVG is a picture rather than a code window: it is drawn as one
 * everywhere else in the application.
 */
export function typeOfFile(name: string): FileType {
    const suffix = extensionOf(name);
    if (PAGES.includes(suffix)) return { kind: 'html', language: PLAIN };
    if (IMAGES.includes(suffix)) return { kind: 'image', language: PLAIN };
    if (suffix === '.pdf') return { kind: 'pdf', language: PLAIN };
    for (const [language, list] of Object.entries(LANGUAGES)) {
        if (list.includes(suffix)) return { kind: 'text', language };
    }
    const bare = nameOf(name).toLowerCase();
    for (const [language, list] of Object.entries(NAMES)) {
        if (list.includes(bare)) return { kind: 'text', language };
    }
    if (TEXT.includes(suffix)) return { kind: 'text', language: PLAIN };
    return { kind: 'other', language: PLAIN };
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
