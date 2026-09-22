// Layer 1, data. The canonical form of a search: what the page sends, what the server receives, and
// the one set of checks both of them run.
//
// It exists once because the page refuses a query before sending it and the server refuses the same
// query when it arrives, and a copy of the rule on each side would let the two disagree about what a
// query is. Nothing here runs a process or touches a file: a query in, the argument list and the
// refusal out.
//
// The argument list is ripgrep's, built as a list so the pattern is one argument and can never be
// read as syntax. The pattern goes in through --regexp, so a pattern that opens with a dash is still
// a pattern, and the directory to search is named as `.` rather than left out: ripgrep given no path
// and a pipe for its standard input reads that pipe instead of the working directory, which is what
// a server process hands a child, so a search with no path would wait for input nobody sends.

/** The root key that means every served root rather than one of them. */
export const ALL_ROOTS = 'all';

/** The longest pattern a query may carry. A longer one is a paste, not a search. */
export const MAX_QUERY = 1000;

/** How much of the matching line one hit carries, centred on the match. */
export const HIT_WIDTH = 240;

/** The largest file ripgrep opens, as ripgrep's own size word. */
export const MAX_FILESIZE = '2M';

/** The directories no search descends into, whatever a .gitignore says. */
export const SKIP_GLOBS = ['!node_modules', '!.git', '!.svelte-kit'];

/** One search as both sides hold it. */
export type SearchQuery = {
    /** The pattern: a literal unless `regex`. */
    q: string;
    /** A served root's key, or ALL_ROOTS. */
    root: string;
    /** Match whole words only. */
    word: boolean;
    /** Match the pattern's own case. */
    case: boolean;
    /** Read the pattern as a regular expression. */
    regex: boolean;
    /** How many hits the answer may carry. */
    max: number;
};

/** Why a query was refused, as a key each side says in its own words. */
export type SearchRefusal = 'empty' | 'too_long' | 'unknown_root';

/** The argument list a query runs as, or why it will not run. */
export type SearchPlan = { ok: true; args: string[] } | { ok: false; refused: SearchRefusal };

/** The query as it would be typed into a fresh view. */
export function emptyQuery(max: number): SearchQuery {
    return { q: '', root: ALL_ROOTS, word: false, case: false, regex: false, max };
}

/** A hit count held between one and the configured cap, so neither side can ask for nothing or for everything. */
export function clampMax(max: number, cap: number): number {
    if (!Number.isFinite(max) || max < 1) return cap;
    return Math.min(Math.floor(max), cap);
}

/** Why this query is refused, and null when it is not. */
export function refusalOf(query: SearchQuery, rootKeys: string[]): SearchRefusal | null {
    if (query.q.trim() === '') return 'empty';
    if (query.q.length > MAX_QUERY) return 'too_long';
    if (query.root !== ALL_ROOTS && !rootKeys.includes(query.root)) return 'unknown_root';
    return null;
}

/** The roots one query runs over: every served root, or the one it names. */
export function rootsOf<T extends { key: string }>(query: SearchQuery, list: T[]): T[] {
    if (query.root === ALL_ROOTS) return list;
    return list.filter((one) => one.key === query.root);
}

/** The directory ripgrep is pointed at, the working directory the call site sets. */
export const SEARCH_PATH = '.';

/**
 * How many matches ripgrep may print per file: one more than the answer can hold.
 *
 * ripgrep's `end` record counts the lines it printed rather than the lines the file holds, so a file
 * cut short by --max-count looks exactly like a file that held that many. Asking for one past the
 * cap makes the loss visible instead: a file with more matches than the answer has room for sends
 * one record the fold has nowhere to put, and that is what says the answer was cut.
 */
export function perFileCount(max: number): number {
    return max + 1;
}

/**
 * ripgrep's arguments for this query. The order is fixed so a test reads the list word for word: the
 * JSON stream, the caps, the skipped directories, the three options, the pattern, and the directory.
 */
export function searchArgs(query: SearchQuery): string[] {
    const args = [
        '--json',
        '--max-count',
        String(perFileCount(query.max)),
        '--max-filesize',
        MAX_FILESIZE
    ];
    for (const glob of SKIP_GLOBS) args.push('--glob', glob);
    if (!query.regex) args.push('--fixed-strings');
    if (query.word) args.push('--word-regexp');
    args.push(query.case ? '--case-sensitive' : '--ignore-case');
    args.push('--regexp', query.q, SEARCH_PATH);
    return args;
}

/** The checks and the arguments as one call, which is what both sides use. */
export function searchQuery(query: SearchQuery, rootKeys: string[]): SearchPlan {
    const refused = refusalOf(query, rootKeys);
    if (refused !== null) return { ok: false, refused };
    return { ok: true, args: searchArgs(query) };
}

/** A path as ripgrep printed it against `.`, as the path inside the root. */
export function pathIn(path: string): string {
    return path.startsWith('./') ? path.slice(2) : path;
}

/**
 * One matching line cut to a window around the match, with the match's place in the window. A line
 * shorter than the window is left as it is; a longer one keeps the match and as much of each side as
 * fits, so a minified file answers a readable row rather than a screen of one line.
 */
export function trimAround(
    text: string,
    column: number,
    length: number,
    width: number = HIT_WIDTH
): { text: string; column: number } {
    const line = text.replace(/\r?\n$/, '');
    if (line.length <= width) return { text: line, column };
    const start = Math.max(0, column - 1);
    // Half the room that the match itself does not take, on each side of it.
    const room = Math.max(0, width - Math.min(length, width));
    const from = Math.max(0, Math.min(start - Math.floor(room / 2), line.length - width));
    return { text: line.slice(from, from + width), column: column - from };
}

/** The parameter names GET /api/search reads, so the page writes what the server reads. */
export function searchParams(query: SearchQuery): URLSearchParams {
    return new URLSearchParams({
        root: query.root,
        q: query.q,
        word: query.word ? '1' : '0',
        case: query.case ? '1' : '0',
        regex: query.regex ? '1' : '0',
        max: String(query.max)
    });
}

/** The address one query is fetched at. */
export function searchUrl(query: SearchQuery): string {
    return `/api/search?${searchParams(query).toString()}`;
}

/** The query a request carries, with the cap applied and every absent parameter at its default. */
export function queryFrom(parameters: URLSearchParams, cap: number): SearchQuery {
    const flag = (name: string): boolean => parameters.get(name) === '1';
    const max = Number(parameters.get('max') ?? '');
    return {
        q: parameters.get('q') ?? '',
        root: parameters.get('root') ?? ALL_ROOTS,
        word: flag('word'),
        case: flag('case'),
        regex: flag('regex'),
        max: clampMax(max, cap)
    };
}

/**
 * The hit cap of config/behavior.yml's `search:` block, which the page reads off the configuration
 * the config channel carries. Zero until that push has landed; the server clamps a query's `max` to
 * its own cap when it arrives, so a query sent before then is answered at the configured cap rather
 * than at a number written here.
 */
export function searchCap(config: Record<string, unknown>): number {
    const held = config.search;
    if (typeof held !== 'object' || held === null || Array.isArray(held)) return 0;
    const max = (held as Record<string, unknown>).max_hits;
    return typeof max === 'number' && Number.isFinite(max) && max > 0 ? Math.floor(max) : 0;
}
