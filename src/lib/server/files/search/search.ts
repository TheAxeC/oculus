// Layer 2, server. A search across the files of the served roots, run by ripgrep.
//
// The binary is the one `@vscode/ripgrep` carries, never the machine's own PATH: a machine with no
// `rg` searches all the same, and which version answers is the lockfile's rather than whatever the
// account happens to have installed.
//
// This module has one subprocess call site, as server/core/git/run.ts does: one list argument
// vector, never a shell string, a timeout, and a bounded read, so a pattern the reader typed can
// never be read as syntax and a slow mount cannot hold a request open. The arguments and every
// refusal come from data/helpers/search/query.ts, which the page runs too, so the two sides cannot
// disagree about what a query is. The replace of the Search view
// (server/files/fs/operations/replace.ts) runs ripgrep through `runRipgrep` as well, which is why
// it is exported: this module stays the one place a process is started.
//
// The cap bounds the work and not only the answer. The child's output is read as it arrives, line
// by line, and folded as it is read; the moment a match arrives with no room left the child is
// killed, so a one-letter pattern over a large root buffers what the cap needs instead of the whole
// stream. MAX_OUTPUT is the bound on one root's read while it is still under the cap.
//
// Nothing is searched outside a served root: the roots come in as the list the route composed, and
// a key that is not one of them is refused before any process starts. A search leaves out the
// machine's private folders inside each root, as the names do, and reads each hub's notes folder
// beside the rest of the hub (query.ts's rootSearchArgs); a root that lies in a private folder is
// not searched.
//
// The names of the files of the served roots (`runNames`) are listed by the same call site with
// `--files`, one run for each root and all of them at once, so the answer waits at most one
// timeout. A request for all roots answers a name once: a file under two roots (one lies inside the
// other) is listed under the root whose folder is deeper. A request for one root answers every
// path listed under it, the files of a root nested inside it included. The machine's private
// folders are left out by a glob for each one inside a root, and a root that lies inside one is not
// listed at all. Each root stops at the cap, with the child ended when a name arrives past it, and
// the answer is the roots in order cut to the cap in all. A repository inside a root (one of
// `repositories`, the list the git watcher keeps) is listed by a run of its own in its folder, so
// its files are listed under its own ignore rules: the root's run leaves the repository out
// whenever the root's ignore rules name it, as a hub's exclude file names every repository inside
// the hub, and its files are then answered from the repository's run alone.

import { spawn } from 'node:child_process';
import { statSync } from 'node:fs';
import { relative, sep } from 'node:path';
import { rgPath } from '@vscode/ripgrep';
import { z } from 'zod';
import {
    ALL_ROOTS,
    namesArgs,
    namesRefusal,
    pathIn,
    rootSearchArgs,
    rootsOf,
    searchQuery,
    trimAround,
    HIT_WIDTH,
    type SearchQuery,
    type QueryRefusal
} from '../../../data/helpers/search/query.ts';
import { groupsFrom } from '../../../data/helpers/search/replace.ts';
import type {
    NamesAnswer,
    NamesRoot,
    SearchAnswer,
    SearchFailure,
    SearchFile,
    SearchHit
} from '../../../data/model/index.ts';
import { anyNumberShape } from '../../../data/shapes/shapes.ts';
import { below, realPath, under } from '../../core/paths.ts';
import { expandHome, resolveRootPath, type Root } from '../files.ts';
import { notesFolderState } from '../fs/notes.ts';

/**
 * How much of one root's output is read while the fold still has room for what it carries, counted
 * in characters of the decoded stream. The fold's own cut is what ends an ordinary run; this ends a
 * run whose every record the fold had to drop, so no output can grow without a bound.
 */
const MAX_OUTPUT = 32 * 1024 * 1024;

/** How much of a root's error output is kept, which is more than the one line ever shown. */
const MAX_STDERR = 4096;

/** What a root whose search did not run is reported as. */
const TIMED_OUT = 'the search timed out';

/** What one run of the binary answered. `code` is ripgrep's own exit status. */
export type RunOutcome = {
    code: number;
    stderr: string;
    timedOut: boolean;
    /** Whether the child was killed before it finished, by the fold or by the read bound. */
    stopped: boolean;
};

/** One line of ripgrep's JSON stream, handed over as it arrives. `false` stops the run. */
export type OnLine = (line: string) => boolean;

/** How one root is searched. A test hands in its own so no case has to start a process. */
export type SearchRunner = (
    dir: string,
    args: string[],
    timeout: number,
    onLine: OnLine
) => Promise<RunOutcome>;

export type SearchOptions = {
    /** How one root is searched; the real binary when absent. */
    run?: SearchRunner;
    /** Milliseconds one root's search is given, from `search.timeout_s` in config/behavior.yml. */
    timeout: number;
    /** The clock the elapsed time is read from, so a test can hold it still. */
    now?: () => number;
    /**
     * The folders no hit is answered from (`privateFolders`), as absolute paths; none by default.
     */
    withheld?: string[];
};

/** What a search answers: the files, or the reason it did not run. */
export type SearchOutcome =
    | { ok: true; answer: SearchAnswer }
    | { ok: false; refused: QueryRefusal }
    | { ok: false; error: string; timedOut: boolean };

/** ripgrep's exit status for a run that failed rather than one that found nothing. */
const FAILED = 2;

/**
 * The one subprocess call site. A list, never a shell; a timeout; and a read the caller stops. The
 * child's own input is closed, so ripgrep reads the directory it was given rather than waiting on a
 * pipe nobody writes to. A failure to start and a timeout both come back as an outcome rather than
 * as a throw, so every caller above reads one shape.
 */
export function runRipgrep(
    dir: string,
    args: string[],
    timeout: number,
    onLine: OnLine
): Promise<RunOutcome> {
    return new Promise((settle) => {
        const child = spawn(rgPath, args, { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'] });
        let rest = '';
        let stderr = '';
        let read = 0;
        let stopped = false;
        let timedOut = false;
        let settled = false;
        const timer = setTimeout(() => {
            timedOut = true;
            child.kill('SIGKILL');
        }, timeout);
        const finish = (code: number): void => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            settle({ code, stderr, timedOut, stopped });
        };
        const stop = (): void => {
            stopped = true;
            child.kill('SIGKILL');
        };
        child.stdout.setEncoding('utf8');
        child.stdout.on('data', (chunk: string) => {
            if (stopped || timedOut) return;
            read += chunk.length;
            rest += chunk;
            let at = rest.indexOf('\n');
            while (at !== -1) {
                const line = rest.slice(0, at);
                rest = rest.slice(at + 1);
                if (!onLine(line)) {
                    stop();
                    return;
                }
                at = rest.indexOf('\n');
            }
            // The tail is a line still being written; a tail past the bound is a line nobody sent.
            if (read > MAX_OUTPUT) stop();
        });
        child.stderr.setEncoding('utf8');
        child.stderr.on('data', (chunk: string) => {
            if (stderr.length < MAX_STDERR) stderr += chunk;
        });
        child.on('error', (error: Error) => {
            if (stderr === '') stderr = error.message;
            finish(FAILED);
        });
        child.on('close', (code: number | null) => {
            if (!stopped && !timedOut && rest.trim() !== '') onLine(rest);
            finish(typeof code === 'number' ? code : FAILED);
        });
    });
}

/**
 * The runner's answer, or a timed-out one when the timeout passes first. The real runner carries
 * the same timeout and kills its own process, so this is the bound on a runner that answers late or
 * not at all rather than a second way of stopping one.
 */
function within(work: Promise<RunOutcome>, timeout: number): Promise<RunOutcome> {
    return new Promise((settle) => {
        const timer = setTimeout(
            () => settle({ code: FAILED, stderr: '', timedOut: true, stopped: false }),
            timeout
        );
        void work.then((outcome) => {
            clearTimeout(timer);
            settle(outcome);
        });
    });
}

/** ripgrep's reason for a failure, as the one line the page shows. */
function reasonOf(stderr: string): string {
    const lines = stderr
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line !== '');
    const last = lines.at(-1) ?? '';
    return last.length > 200 ? `${last.slice(0, 200)}...` : last;
}

/** A `{ text }` field of ripgrep's output; one that carried bytes instead reads as absent. */
const textFieldShape = z.object({ text: z.string() }).optional().catch(undefined);

/**
 * One submatch of a match record: the text it matched, the byte offset it starts at and, when
 * ripgrep was given a replacement, the text it replaces the match with.
 */
const submatchShape = z.object({
    match: textFieldShape,
    replacement: textFieldShape,
    start: anyNumberShape.optional().catch(undefined),
    end: anyNumberShape.optional().catch(undefined)
});

/**
 * One record of `rg --json` this fold reads, by its type: the start of a file, the end of one with
 * ripgrep's own count of its matching lines, and a match. A record of another type, and one whose
 * `data` is no map, is refused; a field of a record that is odd reads as absent.
 */
const ripgrepLineShape = z.discriminatedUnion('type', [
    z.object({ type: z.literal('begin'), data: z.object({ path: textFieldShape }) }),
    z.object({
        type: z.literal('end'),
        data: z.object({
            stats: z
                .object({ matched_lines: anyNumberShape.optional().catch(undefined) })
                .optional()
                .catch(undefined)
        })
    }),
    z.object({
        type: z.literal('match'),
        data: z.object({
            line_number: anyNumberShape.optional().catch(undefined),
            absolute_offset: anyNumberShape.optional().catch(undefined),
            lines: textFieldShape,
            submatches: z.array(z.unknown()).optional().catch(undefined)
        })
    })
]);

type RipgrepLine = z.output<typeof ripgrepLineShape>;

/** The data of a match record of `rg --json`. */
type MatchData = Extract<RipgrepLine, { type: 'match' }>['data'];

/** One line of `rg --json` as a record this module reads, or null for a line that is not one. */
export function ripgrepRecord(line: string): RipgrepLine | null {
    if (line.trim() === '') return null;
    let held: unknown;
    try {
        held = JSON.parse(line);
    } catch {
        return null;
    }
    const parsed = ripgrepLineShape.safeParse(held);
    return parsed.success ? parsed.data : null;
}

/**
 * The characters before byte `bytes` of a line, counted in UTF-16 units and never past the end of
 * the line. A line whose bytes are as many as its characters is ASCII, where the two counts are
 * one.
 */
function charactersBefore(line: Buffer, text: string, bytes: number): number {
    if (bytes <= 0) return 0;
    if (line.length === text.length) return Math.min(bytes, text.length);
    return line.subarray(0, bytes).toString('utf8').length;
}

/**
 * One match of a line as ripgrep reported it: the line, the place the match starts at in
 * characters and in bytes, the text it matched and, when ripgrep was given a replacement, the text
 * it replaces the match with. `offset` is the byte at which the line starts in its file.
 */
export type LineMatch = {
    line: number;
    /** The whole line, with its line end. */
    text: string;
    /** Where the match starts in the line, in UTF-16 units counted from zero. */
    at: number;
    /** Where the match starts and ends in the line, in bytes. */
    start: number;
    end: number;
    offset: number;
    matched: string | undefined;
    replacement: string | undefined;
};

/**
 * The matches of one match record, one per submatch that can be read. ripgrep counts its submatch
 * offsets in bytes of the line, and the line is read back as characters, so each offset is turned
 * into a character place through the same bytes.
 */
export function lineMatches(data: MatchData): LineMatch[] {
    const line = data.line_number;
    const text = data.lines?.text;
    if (line === undefined || text === undefined) return [];
    const bytes = Buffer.from(text, 'utf8');
    return (data.submatches ?? []).flatMap((one) => {
        const parsed = submatchShape.safeParse(one);
        if (!parsed.success) return [];
        const start = parsed.data.start ?? 0;
        return [
            {
                line,
                text,
                at: charactersBefore(bytes, text, start),
                start,
                end: parsed.data.end ?? start,
                offset: data.absolute_offset ?? 0,
                matched: parsed.data.match?.text,
                replacement: parsed.data.replacement?.text
            }
        ];
    });
}

/**
 * One match as a hit. In regular-expression mode the replacement ripgrep reported holds the text
 * of every group, which is split back into `groups`.
 */
export function hitOf(found: LineMatch, pattern: string | undefined): SearchHit {
    const length = found.matched === undefined ? 0 : found.matched.length;
    const cut = trimAround(found.text, found.at + 1, length);
    const hit: SearchHit = {
        line: found.line,
        column: cut.column,
        length,
        text: cut.text,
        at: found.at
    };
    if (pattern !== undefined && found.replacement !== undefined) {
        const groups = groupsFrom(found.replacement, pattern);
        if (groups !== null) hit.groups = groups;
    }
    // A match longer than the window is cut in `text`, so the whole of it travels as group 0.
    if (length > HIT_WIDTH && found.matched !== undefined) {
        hit.groups = { ...hit.groups, '0': found.matched };
    }
    return hit;
}

/**
 * The hits of one match record, one per match. A record with no match that can be read is one hit
 * at the start of its line, so a line ripgrep matched is never left out of the answer.
 */
function hitsOf(data: MatchData, pattern: string | undefined): SearchHit[] {
    const found = lineMatches(data);
    if (found.length > 0) return found.map((one) => hitOf(one, pattern));
    const line = data.line_number;
    const text = data.lines?.text;
    if (line === undefined || text === undefined) return [];
    return [{ line, column: 1, length: 0, text: trimAround(text, 1, 0).text, at: 0 }];
}

/** One root's stream folded into files as its lines arrive. */
type Fold = {
    /** Take one line of the stream. */
    line: (text: string) => void;
    /** Whether a match has already been dropped for want of room, which is when a run may stop. */
    cut: () => boolean;
    /** The files, the hits kept, and whether the stream had more to give. */
    done: () => { files: SearchFile[]; total: number; truncated: boolean };
};

/**
 * The fold over one root's JSON stream, keeping at most `room` hits. A line holding two matches is
 * two hits. `pattern` is the query's pattern in regular-expression mode, which is what the groups
 * of each hit are split out of the replacement ripgrep reported, and absent for a literal search.
 *
 * `truncated` has two sources. A match that arrives with no room left is the fold's own cut, and it
 * is what a file holding more matches than the answer can carry produces, since ripgrep is asked
 * for one matching line per file past the cap. A file whose `end` record counts more matching lines
 * than the lines the fold kept for it is the second: that record counts what ripgrep printed, so
 * the two differ only where a printed record was one this fold could not read.
 */
function createFold(root: string, room: number, pattern?: string): Fold {
    const files: SearchFile[] = [];
    let held: SearchFile | null = null;
    let lines = new Set<number>();
    let total = 0;
    let truncated = false;

    function close(): void {
        if (held !== null && held.hits.length > 0) files.push(held);
        held = null;
        lines = new Set<number>();
    }

    return {
        line(text: string): void {
            const held_ = ripgrepRecord(text);
            if (held_ === null) return;
            if (held_.type === 'begin') {
                close();
                const path = held_.data.path?.text;
                held = path === undefined ? null : { root, path: pathIn(path), hits: [] };
                return;
            }
            if (held_.type === 'end') {
                const counted = held_.data.stats?.matched_lines;
                if (held !== null && counted !== undefined && counted > lines.size) {
                    truncated = true;
                }
                close();
                return;
            }
            if (held === null) return;
            if (total >= room) {
                truncated = true;
                return;
            }
            for (const hit of hitsOf(held_.data, pattern)) {
                if (total >= room) {
                    truncated = true;
                    return;
                }
                held.hits.push(hit);
                lines.add(hit.line);
                total += 1;
            }
        },
        cut(): boolean {
            return truncated && total >= room;
        },
        done(): { files: SearchFile[]; total: number; truncated: boolean } {
            close();
            return { files, total, truncated };
        }
    };
}

/**
 * Why the folder a query is scoped to cannot be searched, or null. It is resolved by real path
 * under the root it names, so a link to a folder outside the root is `outside`, and a folder that
 * is not there, or a path that is a file, is `missing`. A search of every root scoped to the notes
 * folder is read per root, as each hub's notes folder is there or not.
 */
function scopeRefusal(roots: Root[], query: SearchQuery): 'outside' | 'missing' | null {
    if (query.under === '' || query.root === ALL_ROOTS) return null;
    const found = resolveRootPath(roots, query.root, query.under);
    if ('error' in found) return found.error;
    try {
        return statSync(found.path).isDirectory() ? null : 'missing';
    } catch {
        return 'missing';
    }
}

/**
 * The query over one root or every one of them. Each root is searched in turn and the cap is the
 * whole answer's, so a first root full of hits leaves the later ones unsearched and the answer says
 * it was cut rather than pretending the rest held nothing.
 *
 * A root ripgrep could not read is not an error for the whole search: it is named in `failed` with
 * whether it ran out of time or failed, and its own reason, and that reason is the answer only when
 * no root answered anything, since one missing directory must not take away the hits of the others.
 */
export async function runSearch(
    roots: Root[],
    query: SearchQuery,
    options: SearchOptions
): Promise<SearchOutcome> {
    const plan = searchQuery(
        query,
        roots.map((one) => one.key)
    );
    if (!plan.ok) return { ok: false, refused: plan.refused };
    const scope = scopeRefusal(roots, query);
    if (scope !== null) return { ok: false, refused: scope };
    const run = options.run ?? runRipgrep;
    const clock = options.now ?? Date.now;
    const started = clock();
    const files: SearchFile[] = [];
    const failed: SearchFailure[] = [];
    let total = 0;
    let truncated = false;
    const places = namesPlans(roots, options.withheld ?? [], false, []);
    for (const root of rootsOf(query, roots)) {
        if (total >= query.max) {
            // The cap is spent, so the roots behind it are not opened at all.
            truncated = true;
            break;
        }
        const place = places.find((one) => one.key === root.key);
        if (place?.private === true) continue;
        const notes = root.hub === true && notesFolderState(expandHome(root.dir)).state === 'ok';
        const args = rootSearchArgs(query, { withheld: place?.withheld ?? [], notes });
        if (args === null) continue;
        const fold = createFold(root.key, query.max - total, query.regex ? query.q : undefined);
        const outcome = await within(
            run(root.dir, args, options.timeout, (line) => {
                fold.line(line);
                return !fold.cut();
            }),
            options.timeout
        );
        const folded = fold.done();
        files.push(...folded.files);
        total += folded.total;
        if (folded.truncated || outcome.stopped) truncated = true;
        if (outcome.timedOut) {
            failed.push({ root: root.key, why: 'timed-out', reason: TIMED_OUT });
        } else if (!outcome.stopped && outcome.code >= FAILED) {
            failed.push({ root: root.key, why: 'failed', reason: reasonOf(outcome.stderr) });
        }
    }
    if (total === 0 && failed.length > 0) {
        return { ok: false, error: failed[0].reason, timedOut: failed[0].reason === TIMED_OUT };
    }
    return { ok: true, answer: { files, total, truncated, ms: clock() - started, failed } };
}

/** How the names are listed: the process, the timeout, the cap and the folders kept private. */
export type NamesOptions = {
    /** How one root is listed; the real binary when absent. */
    run?: SearchRunner;
    /** Milliseconds one root's listing is given, from `search.timeout_s` in config/behavior.yml. */
    timeout: number;
    /** How many names the whole answer carries, from `search.max_names` in config/behavior.yml. */
    max: number;
    /** The folders no name is answered from (`privateFolders`), as absolute paths. */
    withheld: string[];
    /** The repositories of the workspace as the git watcher last found them, as absolute paths. */
    repositories?: readonly string[];
};

/** What a names request answers: the roots' names, or the reason it did not run. */
export type NamesOutcome =
    { ok: true; answer: NamesAnswer } | { ok: false; refused: 'unknown_root' };

/** One root as a listing sees it. */
type NamesPlan = {
    key: string;
    dir: string;
    /** The paths inside this root that a deeper root lists, so it does not; none for one root. */
    deeper: string[];
    /** The private folders inside this root, as paths inside it. */
    withheld: string[];
    /** Whether the root is a private folder or lies in one, which lists nothing. */
    private: boolean;
    /**
     * The repositories inside this root that no deeper root holds, each listed by its own run: its
     * folder, its path inside the root, and the private folders inside it as paths inside it.
     */
    nested: { dir: string; path: string; withheld: string[] }[];
};

/** A path inside a root written with `/`, whatever the platform separates with. */
function slashed(path: string): string {
    return sep === '/' ? path : path.split(sep).join('/');
}

/**
 * Each root with what a listing of it leaves out: the folders of the deeper roots inside it, when
 * every root is listed (`shared`), so that a file is listed once, under the deepest root holding
 * it, and the private folders inside it. A listing of one root leaves out no deeper root's folder:
 * it answers every path ripgrep lists under that root. Roots and folders are compared by their real
 * paths in the file system's own spelling, so a link names the same place as its target and a
 * private folder written in another letter case is excluded by the name it has on disk. A root with
 * no directory on this machine is listed as it is and fails there.
 */
function namesPlans(
    roots: Root[],
    withheld: string[],
    shared: boolean,
    repositories: readonly string[]
): NamesPlan[] {
    const dirs = roots.map((root) => {
        const dir = expandHome(root.dir);
        return { key: root.key, dir, real: realPath(dir, true) ?? dir };
    });
    const folders = withheld.map(
        (folder) => realPath(expandHome(folder), true) ?? expandHome(folder)
    );
    const repos = repositories.map((dir) => realPath(dir, true) ?? dir);
    return dirs.map((root) => {
        const deeper = shared
            ? dirs
                  .filter((other) => other.key !== root.key && below(other.real, root.real))
                  .map((other) => slashed(relative(root.real, other.real)))
            : [];
        const inside = (path: string): string[] =>
            folders
                .filter((folder) => below(folder, path))
                .map((one) => slashed(relative(path, one)));
        return {
            key: root.key,
            dir: root.dir,
            deeper,
            withheld: inside(root.real),
            private: under(root.real, folders),
            nested: repos
                .filter((repo) => below(repo, root.real) && !under(repo, folders))
                .map((repo) => ({
                    dir: repo,
                    path: slashed(relative(root.real, repo)),
                    withheld: inside(repo)
                }))
                .filter((repo) => !deeper.some((folder) => atOrBelow(repo.path, folder)))
        };
    });
}

/** Whether a path is the folder or lies below it, both written with `/`. */
function atOrBelow(path: string, folder: string): boolean {
    return path === folder || path.startsWith(`${folder}/`);
}

/** What one run of a listing read: the paths, whether the cap cut it, and how it ended. */
type Listed = { paths: string[]; cut: boolean; outcome: RunOutcome };

/**
 * The names one run lists in `dir`, each written as a path inside the root by `prefix`, up to the
 * cap. A path `skip` refuses is not listed. The child is ended when a name arrives past the cap,
 * which is how a list cut at the cap knows more names existed.
 */
async function listOne(
    dir: string,
    withheld: string[],
    prefix: string,
    skip: (path: string) => boolean,
    options: NamesOptions
): Promise<Listed> {
    const paths: string[] = [];
    let cut = false;
    const run = options.run ?? runRipgrep;
    const outcome = await within(
        run(dir, namesArgs(withheld), options.timeout, (line) => {
            const found = pathIn(line);
            const path = found === '' || prefix === '' ? found : `${prefix}/${found}`;
            if (found === '' || skip(path)) return true;
            if (paths.length >= options.max) {
                cut = true;
                return false;
            }
            paths.push(path);
            return true;
        }),
        options.timeout
    );
    return { paths, cut, outcome };
}

/**
 * The names of one root, up to the cap: the root's own run, which leaves out the folders of the
 * deeper roots and of the repositories inside it, then each repository's run. The runs go at once,
 * so the root waits at most one timeout, and the names a repository's run lists are not listed
 * again from the root's.
 */
async function listRoot(
    plan: NamesPlan,
    options: NamesOptions
): Promise<{ listed: NamesRoot; cut: boolean }> {
    if (plan.private) return { listed: { root: plan.key, paths: [] }, cut: false };
    const held = [...plan.deeper, ...plan.nested.map((repo) => repo.path)];
    const runs = await Promise.all([
        listOne(
            plan.dir,
            [...plan.withheld, ...plan.nested.map((repo) => repo.path)],
            '',
            (path) => held.some((one) => atOrBelow(path, one)),
            options
        ),
        ...plan.nested.map((repo) =>
            listOne(
                repo.dir,
                repo.withheld,
                repo.path,
                (path) => plan.deeper.some((one) => atOrBelow(path, one)),
                options
            )
        )
    ]);
    const all = runs.flatMap((one) => one.paths);
    const paths = all.slice(0, options.max);
    const listed: NamesRoot = { root: plan.key, paths };
    if (runs.some((one) => one.outcome.timedOut)) listed.error = 'timed_out';
    else if (runs.some((one) => !one.outcome.stopped && one.outcome.code >= FAILED)) {
        listed.error = 'failed';
    }
    return { listed, cut: runs.some((one) => one.cut) || all.length > paths.length };
}

/**
 * The names of one served root or of all of them. A request for one root answers every path
 * ripgrep lists under it, the files of a served root nested inside it included; a request for all
 * of them lists each file once, under the deepest root that holds it. A root key that is none of
 * the served ones is refused before any process starts. The roots run at once; the answer keeps
 * them in the order given, cut to the cap in all, and says it was cut. A root whose listing did not
 * finish is named with why and keeps the names read before it stopped.
 */
export async function runNames(
    roots: Root[],
    root: string,
    options: NamesOptions
): Promise<NamesOutcome> {
    const refused = namesRefusal(
        root,
        roots.map((one) => one.key)
    );
    if (refused !== null) return { ok: false, refused };
    const shared = root === ALL_ROOTS;
    const plans = namesPlans(roots, options.withheld, shared, options.repositories ?? []).filter(
        (plan) => root === ALL_ROOTS || plan.key === root
    );
    const listings = await Promise.all(plans.map((plan) => listRoot(plan, options)));
    let room = options.max;
    let cut = listings.some((one) => one.cut);
    const answered = listings.map(({ listed }) => {
        const kept = listed.paths.slice(0, room);
        if (kept.length < listed.paths.length) cut = true;
        room -= kept.length;
        return { ...listed, paths: kept };
    });
    return { ok: true, answer: { roots: answered, cut } };
}
