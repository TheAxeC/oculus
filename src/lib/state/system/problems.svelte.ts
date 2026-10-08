// Layer 2, client state. The problems store: every problem the page knows of, from every source,
// folded once for the Problems view, the status bar, the view's tab badge, the Files decorations
// and the walk through the problems that F8 takes.
//
// A source is a function that answers its problems now (the language servers', the project
// commands', the LaTeX builds'); it reads reactive stores, so the fold is made again when any of
// them changes. A source joins by `register`, and a later source (a linter, another language
// server) adds its rows without an edit to this store. Problems are per page: a pop-out window
// folds its own.
//
// The fold gives each file its rows sorted by severity then position, the files sorted by worst
// severity then path, and the counts of each file, of each folder (errors and warnings only, which
// is what the Files tree draws) and of all. The walk takes the files in that order and the rows of
// each file by position, as Monaco's own walk does within a file.

export type ProblemSeverity = 'error' | 'warning' | 'info';

/**
 * One problem. `root` is a root key, and empty for a file in no served root (`path` is then as the
 * source wrote it and the row opens nothing) and for a library file (`path` is its address and
 * `library` its name). Lines and columns count from one; a column of 0 is a source that names
 * none, and an end line of 0 is a place with no end.
 */
export type Problem = {
    root: string;
    path: string;
    library?: string;
    language?: string;
    /**
     * The owner of the marker the row stands for in a Monaco model: `lsp-<language>` for a
     * language server, `LATEX_OWNER` for a LaTeX build and `COMMAND_OWNER` for a project command
     * (state/system/problem-sources.ts).
     */
    owner: string;
    severity: ProblemSeverity;
    line: number;
    column: number;
    endLine: number;
    endColumn: number;
    message: string;
    source: string;
    code?: string;
};

/** What a source answers: its problems now. */
export type ProblemSource = () => readonly Problem[];

type ProblemCounts = { errors: number; warnings: number; infos: number };

/** One file's problems, sorted, with the file's counts. */
export type ProblemFile = {
    key: string;
    root: string;
    path: string;
    library?: string;
    rows: Problem[];
    counts: ProblemCounts;
};

/** Where the reader is: the source tab on screen, or the last one focused, and its caret. */
type ProblemHere = {
    instance: string;
    root: string;
    path: string;
    line: number;
    column: number;
};

/** The fold of every source's rows. */
type ProblemFold = {
    files: ProblemFile[];
    total: ProblemCounts;
    /** The openable rows in the walk's order, each with its file's place in `files`. */
    walk: { rank: number; row: Problem }[];
    fileCounts: Map<string, ProblemCounts>;
    folderCounts: Map<string, ProblemCounts>;
};

const RANK: Record<ProblemSeverity, number> = { error: 0, warning: 1, info: 2 };

/** The key of a file, or of a folder of a root. */
export function problemKey(root: string, path: string): string {
    return JSON.stringify([root, path]);
}

/** Whether a row opens a tab: a file of a served root, or a library file. */
export function opens(row: Pick<Problem, 'root' | 'library'>): boolean {
    return row.root !== '' || row.library !== undefined;
}

function none(): ProblemCounts {
    return { errors: 0, warnings: 0, infos: 0 };
}

function counted(counts: ProblemCounts, severity: ProblemSeverity): void {
    if (severity === 'error') counts.errors += 1;
    else if (severity === 'warning') counts.warnings += 1;
    else counts.infos += 1;
}

function byPosition(left: Problem, right: Problem): number {
    return left.line - right.line || left.column - right.column;
}

function bySeverity(left: Problem, right: Problem): number {
    return (
        RANK[left.severity] - RANK[right.severity] ||
        byPosition(left, right) ||
        left.message.localeCompare(right.message)
    );
}

function worst(counts: ProblemCounts): number {
    if (counts.errors > 0) return 0;
    return counts.warnings > 0 ? 1 : 2;
}

/** The folders a path of a root sits in, from the nearest to the root's own, which is ''. */
function foldersOf(path: string): string[] {
    const parts = path.split('/').filter(Boolean);
    return parts.map((_, at) => parts.slice(0, parts.length - 1 - at).join('/'));
}

/** Fold the rows of every source. */
function foldProblems(rows: readonly Problem[]): ProblemFold {
    const grouped = new Map<string, ProblemFile>();
    const total = none();
    for (const row of rows) {
        counted(total, row.severity);
        const key = problemKey(row.root, row.path);
        let file = grouped.get(key);
        if (file === undefined) {
            file = {
                key,
                root: row.root,
                path: row.path,
                ...(row.library === undefined ? {} : { library: row.library }),
                rows: [],
                counts: none()
            };
            grouped.set(key, file);
        }
        file.rows.push(row);
        counted(file.counts, row.severity);
    }
    const files = [...grouped.values()]
        .map((file) => ({ ...file, rows: file.rows.sort(bySeverity) }))
        .sort(
            (left, right) =>
                worst(left.counts) - worst(right.counts) ||
                left.path.localeCompare(right.path) ||
                left.root.localeCompare(right.root)
        );
    const fileCounts = new Map<string, ProblemCounts>();
    const folderCounts = new Map<string, ProblemCounts>();
    for (const file of files) {
        fileCounts.set(file.key, file.counts);
        if (file.root === '' || file.library !== undefined) continue;
        if (file.counts.errors + file.counts.warnings === 0) continue;
        for (const folder of foldersOf(file.path)) {
            const key = problemKey(file.root, folder);
            const held = folderCounts.get(key) ?? none();
            held.errors += file.counts.errors;
            held.warnings += file.counts.warnings;
            folderCounts.set(key, held);
        }
    }
    const walk = files.flatMap((file, rank) =>
        [...file.rows]
            .sort(byPosition)
            .filter(opens)
            .map((row) => ({ rank, row }))
    );
    return { files, total, walk, fileCounts, folderCounts };
}

/** Whether a row's range holds the position: its start, its end, or between. */
function holds(row: Problem, line: number, column: number): boolean {
    const endLine = row.endLine > 0 ? row.endLine : row.line;
    const endColumn = row.endLine > 0 ? row.endColumn : row.column;
    const after = line > row.line || (line === row.line && column >= row.column);
    const before = line < endLine || (line === endLine && column <= endColumn);
    return after && before;
}

/** Where a row is in the walk's order, as a comparison of ranks, lines and columns. */
function compared(rank: number, row: Problem, at: { rank: number; line: number; column: number }) {
    return rank - at.rank || row.line - at.line || row.column - at.column;
}

/**
 * The row the walk steps to from where the reader is: the next row after the caret in its file,
 * else the first row of the next file, and backward the previous row, else the last row of the
 * previous file, wrapping at either end. A caret inside a row's range counts as at the row's
 * start, so a row just stepped to is not stepped to again. A reader in a file with no problems, or
 * in no file, steps to the first row going forward and the last going back. Null with no row.
 */
function stepProblem(
    fold: ProblemFold,
    here: Pick<ProblemHere, 'root' | 'path' | 'line' | 'column'> | null,
    by: 1 | -1
): Problem | null {
    const { walk } = fold;
    if (walk.length === 0) return null;
    const rank =
        here === null
            ? -1
            : fold.files.findIndex((one) => one.key === problemKey(here.root, here.path));
    if (here === null || rank === -1) return (by === 1 ? walk[0] : walk[walk.length - 1]).row;
    const inside = walk.find((one) => one.rank === rank && holds(one.row, here.line, here.column));
    const at = {
        rank,
        line: inside?.row.line ?? here.line,
        column: inside?.row.column ?? here.column
    };
    if (by === 1) {
        const next = walk.find((one) => compared(one.rank, one.row, at) > 0);
        return (next ?? walk[0]).row;
    }
    const before = walk.filter((one) => compared(one.rank, one.row, at) < 0);
    return (before.at(-1) ?? walk[walk.length - 1]).row;
}

/** A place in a file: a line, and a column and the end of a range from there when known. */
type ProblemPlace = { line: number; column?: number; endLine?: number; endColumn?: number };

/** What a row opens: a file of a served root, or a library file, and the place in it. */
type ProblemTarget =
    | ({ root: string; path: string } & ProblemPlace)
    | ({ library: string; name: string } & ProblemPlace);

/**
 * The file a row opens and the place in it, or null for a row that opens nothing. A range that
 * ends where it starts is a place, and a source that names no column gives the line alone.
 */
export function problemTarget(row: Problem): ProblemTarget | null {
    const ranged = row.endLine > 0 && (row.endLine !== row.line || row.endColumn !== row.column);
    const place: ProblemPlace = {
        line: row.line,
        ...(row.column > 0 ? { column: row.column } : {}),
        ...(ranged ? { endLine: row.endLine, endColumn: row.endColumn } : {})
    };
    if (row.library !== undefined) return { library: row.path, name: row.library, ...place };
    return row.root === '' ? null : { root: row.root, path: row.path, ...place };
}

/**
 * How a row's place is shown. `kept` keeps the tab, as Enter and a double press do, and otherwise
 * the place shows in the pane's preview tab; `focus` puts the keyboard in the editor. `leaving`
 * is the instance of the source tab a step leaves when it goes to another file, so that tab can be
 * told its editor lost the keyboard.
 */
type ProblemOpen = { kept: boolean; focus: boolean; leaving: string | null };

/** What the store needs of the page. */
export type ProblemsDeps = {
    /** The source tab on screen or last focused, and its caret; null when there is none. */
    here: () => ProblemHere | null;
    /** Show a row's place; see `ProblemOpen`. */
    open: (row: Problem, how: ProblemOpen) => void;
    /** Show the Problems view limited to one root. */
    show: (root: string) => void;
};

export type ProblemsStore = {
    /** Add a source; the call it returns takes it away again. */
    register: (source: ProblemSource) => () => void;
    fold: () => ProblemFold;
    /** The counts of all rows. */
    total: () => ProblemCounts;
    /** The counts of one file, or null for a file with no problem. */
    fileCounts: (root: string, path: string) => ProblemCounts | null;
    /** The errors and warnings under one folder of a root, or null when there are none. */
    folderCounts: (root: string, folder: string) => ProblemCounts | null;
    /** Step to the next (1) or previous (-1) row and open it; false when there is none. */
    walk: (by: 1 | -1) => boolean;
    /** Show a row's place. */
    open: (row: Problem, how: ProblemOpen) => void;
    /** Where the reader is: the source tab on screen or the last one focused, and its caret. */
    here: () => ProblemHere | null;
    /** Show the Problems view limited to one root. */
    show: (root: string) => void;
};

export function createProblems(deps: ProblemsDeps): ProblemsStore {
    let sources = $state.raw<readonly ProblemSource[]>([]);
    const rows = $derived(sources.flatMap((source) => source()));
    const folded = $derived(foldProblems(rows));

    function register(source: ProblemSource): () => void {
        sources = [...sources, source];
        return () => {
            sources = sources.filter((one) => one !== source);
        };
    }

    function walk(by: 1 | -1): boolean {
        const here = deps.here();
        const row = stepProblem(folded, here, by);
        if (row === null) return false;
        const moves = here !== null && (here.root !== row.root || here.path !== row.path);
        deps.open(row, { kept: false, focus: true, leaving: moves ? here.instance : null });
        return true;
    }

    return {
        register,
        fold: () => folded,
        total: () => folded.total,
        fileCounts: (root, path) => folded.fileCounts.get(problemKey(root, path)) ?? null,
        folderCounts: (root, folder) => folded.folderCounts.get(problemKey(root, folder)) ?? null,
        walk,
        open: deps.open,
        here: deps.here,
        show: deps.show
    };
}
