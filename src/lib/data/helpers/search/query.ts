// Layer 1, data. The canonical form of a search: what the page sends, what the server receives, and
// the one set of checks both of them run.
//
// It exists once because the page refuses a query before sending it and the server refuses the same
// query when it arrives, and a copy of the rule on each side would let the two disagree about what
// a query is. Nothing here runs a process or touches a file: a query in, the argument list and the
// refusal out.
//
// The argument list is ripgrep's, built as a list so the pattern is one argument and can never be
// read as syntax. The pattern goes in through --regexp, so a pattern that opens with a dash is
// still a pattern, and the directory to search is named as `.` rather than left out: ripgrep given
// no path and a pipe for its standard input reads that pipe instead of the working directory, which
// is what a server process hands a child, so a search with no path would wait for input nobody
// sends. A search scoped to one folder (`under`) names `./<folder>` there instead.
//
// The route also lists the names of the files of the served roots (`list=names`), for the palette's
// file mode. That request carries no pattern, so it has its own small shape beside the query: the
// root it names or every root, the arguments `--files` runs with, and the same refusal of a root
// that is not served. It reads the same `SKIP_GLOBS`, so a search and a name list leave out the
// same folders.
//
// In regular-expression mode the arguments also carry the replacement template of ./replace.ts, so
// that each match ripgrep reports holds the text of every group of the pattern. A replace names one
// file instead of a directory and asks for every match of it (`fileArgs`).

import { z } from 'zod';
import { fields } from '../guards.ts';
import { replaceTemplate } from './replace.ts';

/** The root key that means every served root rather than one of them. */
export const ALL_ROOTS = 'all';

/** The longest pattern a query may carry. A longer one is a paste, not a search. */
const MAX_QUERY = 1000;

/** How much of the matching line one hit carries, centred on the match. */
export const HIT_WIDTH = 240;

/** The largest file ripgrep opens, as ripgrep's own size word. */
const MAX_FILESIZE = '2M';

/** The directories no search descends into, whatever a .gitignore says. */
const SKIP_GLOBS = ['!node_modules', '!.git', '!.svelte-kit', '!.svelte-kit-app'];

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
    /** A folder under the root the search is scoped to, `''` for the whole root. */
    under: string;
};

/** Why a query was refused before anything ran, as a key each side says in its own words. */
export type QueryRefusal = 'empty' | 'too_long' | 'unknown_root' | 'outside' | 'missing';

/**
 * Why a search was refused, as a key each side says in its own words: a refusal of the query, the
 * write token, a pattern ripgrep could not read, and a search that ran out of time.
 */
export type SearchRefusal = QueryRefusal | 'token' | 'pattern' | 'timed_out';

const REFUSAL_WORDS: readonly string[] = [
    'empty',
    'too_long',
    'unknown_root',
    'outside',
    'missing',
    'token',
    'pattern',
    'timed_out'
];

/** The refusal a server answer names, or null for a value that is none of them. */
export function refusalFrom(value: unknown): SearchRefusal | null {
    return typeof value === 'string' && REFUSAL_WORDS.includes(value)
        ? (value as SearchRefusal)
        : null;
}

/** The argument list a query runs as, or why it will not run. */
export type SearchPlan = { ok: true; args: string[] } | { ok: false; refused: QueryRefusal };

/** The query as it would be typed into a fresh view. */
export function emptyQuery(max: number): SearchQuery {
    return { q: '', root: ALL_ROOTS, word: false, case: false, regex: false, max, under: '' };
}

/**
 * A hit count held between one and the configured cap, so neither side can ask for nothing or for
 * everything.
 */
export function clampMax(max: number, cap: number): number {
    if (!Number.isFinite(max) || max < 1) return cap;
    return Math.min(Math.floor(max), cap);
}

/** Why this query is refused, and null when it is not. */
export function refusalOf(query: SearchQuery, rootKeys: string[]): QueryRefusal | null {
    if (query.q.trim() === '') return 'empty';
    if (query.q.length > MAX_QUERY) return 'too_long';
    if (query.root !== ALL_ROOTS && !rootKeys.includes(query.root)) return 'unknown_root';
    if (query.under !== '' && !scopedInside(query)) return 'outside';
    return null;
}

/**
 * Whether the folder a query is scoped to can lie under one root: a relative path with no `..`
 * segment, on a query that names one root. Whether the folder is really there, and not a link out
 * of the root, is the server's to read from the disk.
 */
function scopedInside(query: SearchQuery): boolean {
    if (query.root === ALL_ROOTS) return false;
    if (query.under.startsWith('/') || query.under.startsWith('\\')) return false;
    return !query.under.split(/[\\/]/).includes('..');
}

/** The roots one query runs over: every served root, or the one it names. */
export function rootsOf<T extends { key: string }>(query: SearchQuery, list: T[]): T[] {
    if (query.root === ALL_ROOTS) return list;
    return list.filter((one) => one.key === query.root);
}

/** The directory ripgrep is pointed at, the working directory the call site sets. */
const SEARCH_PATH = '.';

/**
 * How many matches ripgrep may print per file: one more than the answer can hold.
 *
 * ripgrep's `end` record counts the lines it printed rather than the lines the file holds, so a
 * file cut short by --max-count looks exactly like a file that held that many. Asking for one past
 * the cap makes the loss visible instead: a file with more matches than the answer has room for
 * sends one record the fold has nowhere to put, and that is what says the answer was cut.
 */
function perFileCount(max: number): number {
    return max + 1;
}

/** The half of a query that decides what matches. */
type MatchQuery = Pick<SearchQuery, 'q' | 'word' | 'case' | 'regex'>;

/** The options that say how the pattern is read, in the order every list of arguments has them. */
function matchArgs(query: MatchQuery): string[] {
    const args: string[] = [];
    if (!query.regex) args.push('--fixed-strings');
    if (query.word) args.push('--word-regexp');
    args.push(query.case ? '--case-sensitive' : '--ignore-case');
    const template = replaceTemplate(query.q, query.regex);
    if (template !== '') args.push('--replace', template);
    args.push('--regexp', query.q);
    return args;
}

/**
 * ripgrep's arguments for this query. The order is fixed so a test reads the list word for word:
 * the JSON stream, the caps, the skipped directories, the options that say how the pattern is read
 * (with the replacement template in regular-expression mode), the pattern, and the directory.
 */
function searchArgs(query: SearchQuery): string[] {
    const args = [
        '--json',
        '--max-count',
        String(perFileCount(query.max)),
        '--max-filesize',
        MAX_FILESIZE
    ];
    for (const glob of SKIP_GLOBS) args.push('--glob', glob);
    args.push(...matchArgs(query), query.under === '' ? SEARCH_PATH : `./${query.under}`);
    return args;
}

/**
 * ripgrep's arguments for every match of the query in one file, named by its path under the root:
 * no cap and no skipped directory, since a file named to ripgrep is searched whatever a glob or a
 * .gitignore says.
 */
export function fileArgs(query: MatchQuery, path: string): string[] {
    return ['--json', ...matchArgs(query), `./${path}`];
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
 * shorter than the window is left as it is; a longer one keeps the match and as much of each side
 * as fits, so a minified file answers a readable row rather than a screen of one line.
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

/**
 * The parameter names GET /api/search reads, so the page writes what the server reads. `under` is
 * written only when the search is scoped to a folder, so a search of a whole root is the address it
 * always was.
 */
function searchParams(query: SearchQuery): URLSearchParams {
    const parameters = new URLSearchParams({
        root: query.root,
        q: query.q,
        word: query.word ? '1' : '0',
        case: query.case ? '1' : '0',
        regex: query.regex ? '1' : '0',
        max: String(query.max)
    });
    if (query.under !== '') parameters.set('under', query.under);
    return parameters;
}

/** The address one query is fetched at. */
export function searchUrl(query: SearchQuery): string {
    return `/api/search?${searchParams(query).toString()}`;
}

/** What a request to the search route asks for. */
export type SearchRequest =
    | { kind: 'search'; query: SearchQuery }
    | { kind: 'names'; root: string }
    | { kind: 'refused'; refused: 'list' };

/** The only value the `list` parameter takes. */
const NAMES_LIST = 'names';

/**
 * Whether a request asks for a search or for the names of the served roots. No `list` parameter is
 * a search; `list` given once with the value `names` lists names, and an empty, repeated or other
 * `list` is refused, so a typo never runs a search nobody asked for.
 */
export function requestFrom(parameters: URLSearchParams, cap: number): SearchRequest {
    if (!parameters.has('list')) return { kind: 'search', query: queryFrom(parameters, cap) };
    const lists = parameters.getAll('list');
    if (lists.length !== 1 || lists[0] !== NAMES_LIST) return { kind: 'refused', refused: 'list' };
    return { kind: 'names', root: parameters.get('root') ?? ALL_ROOTS };
}

/** Why a names request is refused before anything ran: a root key that no served root has. */
export function namesRefusal(root: string, rootKeys: string[]): 'unknown_root' | null {
    return root === ALL_ROOTS || rootKeys.includes(root) ? null : 'unknown_root';
}

/** The address the names of one root, or of every root, are fetched at. */
export function namesUrl(root: string = ALL_ROOTS): string {
    const parameters = new URLSearchParams({ list: NAMES_LIST });
    if (root !== ALL_ROOTS) parameters.set('root', root);
    return `/api/search?${parameters.toString()}`;
}

/** A path as a glob that matches that path alone: its glob characters and spaces escaped. */
function globEscape(path: string): string {
    return path.replace(/[\\*?[\]{}!\s]/g, (one) => `\\${one}`);
}

/**
 * ripgrep's arguments for the names of one root: every file with hidden ones, the skipped folders,
 * and one anchored glob for each folder inside the root that no name may be answered from (the
 * machine's private folders, given as paths inside the root). The directory is named `.` as a
 * search names it, and the paths come back as `./<path>`, which `pathIn` reads.
 */
export function namesArgs(withheld: string[]): string[] {
    const args = ['--files', '--hidden'];
    for (const glob of SKIP_GLOBS) args.push('--glob', glob);
    for (const path of withheld) args.push('--glob', `!/${globEscape(path)}`);
    args.push(SEARCH_PATH);
    return args;
}

/** The query a request carries, with the cap applied and every absent parameter at its default. */
function queryFrom(parameters: URLSearchParams, cap: number): SearchQuery {
    const flag = (name: string): boolean => parameters.get(name) === '1';
    const max = Number(parameters.get('max') ?? '');
    return {
        q: parameters.get('q') ?? '',
        root: parameters.get('root') ?? ALL_ROOTS,
        word: flag('word'),
        case: flag('case'),
        regex: flag('regex'),
        max: clampMax(max, cap),
        under: parameters.get('under') ?? ''
    };
}

/** The configured cap: a finite number above zero, cut to its whole part. */
const searchCapShape = z.number().positive().transform(Math.floor);

/**
 * The hit cap of config/behavior.yml's `search:` block, which the page reads off the configuration
 * the config channel carries. Zero until that push has landed; the server clamps a query's `max` to
 * its own cap when it arrives, so a query sent before then is answered at the configured cap rather
 * than at a number written here.
 */
export function searchCap(config: Record<string, unknown>): number {
    return searchCapShape.safeParse(fields(config.search).max_hits).data ?? 0;
}
