// Layer 2, server. A search across the files of the served roots, run by ripgrep.
//
// The binary is the one `@vscode/ripgrep` carries, never the machine's own PATH: a machine with no
// `rg` searches all the same, and which version answers is the lockfile's rather than whatever the
// account happens to have installed.
//
// This module has one subprocess call site, as server/core/git.ts does: one list argument vector,
// never a shell string, a timeout, and a bounded read, so a pattern the reader typed can never be
// read as syntax and a slow mount cannot hold a request open. The arguments and every refusal come
// from data/helpers/search.ts, which the page runs too, so the two sides cannot disagree about what
// a query is.
//
// The cap bounds the work and not only the answer. The child's output is read as it arrives, line
// by line, and folded as it is read; the moment a match arrives with no room left the child is
// killed, so a one-letter pattern over a large root buffers what the cap needs instead of the whole
// stream. MAX_OUTPUT is the bound on one root's read while it is still under the cap.
//
// Nothing is searched outside a served root: the roots come in as the list the route composed, and
// a key that is not one of them is refused before any process starts.

import { spawn } from 'node:child_process';
import { rgPath } from '@vscode/ripgrep';
import {
    pathIn,
    rootsOf,
    searchQuery,
    trimAround,
    type SearchQuery,
    type SearchRefusal
} from '../../data/helpers/search.ts';
import type { SearchAnswer, SearchFailure, SearchFile, SearchHit } from '../../data/model/index.ts';
import type { Root } from './files.ts';

/**
 * How much of one root's output is read while the fold still has room for what it carries, counted
 * in characters of the decoded stream. The fold's own cut is what ends an ordinary run; this ends a
 * run whose every record the fold had to drop, so no output can grow without a bound.
 */
export const MAX_OUTPUT = 32 * 1024 * 1024;

/** How much of a root's error output is kept, which is more than the one line ever shown. */
const MAX_STDERR = 4096;

/** What a root whose search did not run is reported as. */
export const TIMED_OUT = 'the search timed out';

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
};

/** What a search answers: the files, or the reason it did not run. */
export type SearchOutcome =
    | { ok: true; answer: SearchAnswer }
    | { ok: false; refused: SearchRefusal }
    | { ok: false; error: string };

/** ripgrep's exit status for a run that failed rather than one that found nothing. */
const FAILED = 2;

/**
 * The one subprocess call site. A list, never a shell; a timeout; and a read the caller stops. The
 * child's own input is closed, so ripgrep reads the directory it was given rather than waiting on a
 * pipe nobody writes to. A failure to start and a timeout both come back as an outcome rather than
 * as a throw, so every caller above reads one shape.
 */
function runRipgrep(
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
export function reasonOf(stderr: string): string {
    const lines = stderr
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line !== '');
    const last = lines.at(-1) ?? '';
    return last.length > 200 ? `${last.slice(0, 200)}...` : last;
}

/** One line of `rg --json`, or null for a line that is not one. */
function record(line: string): Record<string, unknown> | null {
    if (line.trim() === '') return null;
    try {
        const held: unknown = JSON.parse(line);
        if (typeof held !== 'object' || held === null || Array.isArray(held)) return null;
        return held as Record<string, unknown>;
    } catch {
        return null;
    }
}

/** A `{ text }` field of ripgrep's output, and null where it carried bytes instead. */
function textOf(value: unknown): string | null {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
    const text = (value as Record<string, unknown>).text;
    return typeof text === 'string' ? text : null;
}

/** ripgrep's own count of the matching lines of one file, from its `end` record, or null. */
function matchedLines(data: Record<string, unknown>): number | null {
    const stats = data.stats;
    if (typeof stats !== 'object' || stats === null || Array.isArray(stats)) return null;
    const count = (stats as Record<string, unknown>).matched_lines;
    return typeof count === 'number' ? count : null;
}

/**
 * One match record as a hit. ripgrep counts its submatch offsets in bytes of the line; the line is
 * read back as characters, so the offset is turned into a character column through the same bytes.
 */
function hitOf(data: Record<string, unknown>): SearchHit | null {
    const line = data.line_number;
    const text = textOf(data.lines);
    if (typeof line !== 'number' || text === null) return null;
    const submatches = data.submatches;
    const first =
        Array.isArray(submatches) && submatches.length > 0
            ? (submatches[0] as Record<string, unknown>)
            : null;
    const matched = first === null ? null : textOf(first.match);
    const start = first === null ? 0 : first.start;
    const before = typeof start === 'number' ? start : 0;
    const column = characters(text, before) + 1;
    const length = matched === null ? 0 : matched.length;
    const cut = trimAround(text, column, length);
    return { line, column: cut.column, length, text: cut.text };
}

/** How many characters the first `bytes` bytes of a line hold. */
function characters(text: string, bytes: number): number {
    if (bytes <= 0) return 0;
    const encoder = new TextEncoder();
    let seen = 0;
    for (let at = 0; at < text.length; at += 1) {
        if (seen >= bytes) return at;
        seen += encoder.encode(text[at]).length;
    }
    return text.length;
}

/** One root's stream folded into files as its lines arrive. */
export type Fold = {
    /** Take one line of the stream. */
    line: (text: string) => void;
    /** Whether a match has already been dropped for want of room, which is when a run may stop. */
    cut: () => boolean;
    /** The files, the hits kept, and whether the stream had more to give. */
    done: () => { files: SearchFile[]; total: number; truncated: boolean };
};

/**
 * The fold over one root's JSON stream, keeping at most `room` hits.
 *
 * `truncated` has two sources. A match that arrives with no room left is the fold's own cut, and it
 * is what a file holding more matches than the answer can carry produces, since ripgrep is asked
 * for one match per file past the cap. A file whose `end` record counts more matching lines than
 * the hits kept for it is the second: that record counts what ripgrep printed, so the two differ
 * only where a printed record was one this fold could not read.
 */
export function createFold(root: string, room: number): Fold {
    const files: SearchFile[] = [];
    let held: SearchFile | null = null;
    let total = 0;
    let truncated = false;

    function close(): void {
        if (held !== null && held.hits.length > 0) files.push(held);
        held = null;
    }

    return {
        line(text: string): void {
            const held_ = record(text);
            if (held_ === null) return;
            const data = held_.data;
            if (typeof data !== 'object' || data === null || Array.isArray(data)) return;
            const fields = data as Record<string, unknown>;
            if (held_.type === 'begin') {
                close();
                const path = textOf(fields.path);
                held = path === null ? null : { root, path: pathIn(path), hits: [] };
                return;
            }
            if (held_.type === 'end') {
                const counted = matchedLines(fields);
                if (held !== null && counted !== null && counted > held.hits.length) {
                    truncated = true;
                }
                close();
                return;
            }
            if (held_.type !== 'match' || held === null) return;
            if (total >= room) {
                truncated = true;
                return;
            }
            const hit = hitOf(fields);
            if (hit === null) return;
            held.hits.push(hit);
            total += 1;
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

/** One whole stream folded at once, for a caller that already holds all of it. */
export function foldStream(
    output: string,
    root: string,
    room: number
): { files: SearchFile[]; total: number; truncated: boolean } {
    const fold = createFold(root, room);
    for (const line of output.split('\n')) fold.line(line);
    return fold.done();
}

/**
 * The query over one root or every one of them. Each root is searched in turn and the cap is the
 * whole answer's, so a first root full of hits leaves the later ones unsearched and the answer says
 * it was cut rather than pretending the rest held nothing.
 *
 * A root ripgrep could not read is not an error for the whole search: it is named in `failed` with
 * its own reason, and that reason is the answer only when no root answered anything, since one
 * missing directory must not take away the hits of the others.
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
    const run = options.run ?? runRipgrep;
    const clock = options.now ?? Date.now;
    const started = clock();
    const files: SearchFile[] = [];
    const failed: SearchFailure[] = [];
    let total = 0;
    let truncated = false;
    for (const root of rootsOf(query, roots)) {
        if (total >= query.max) {
            // The cap is spent, so the roots behind it are not opened at all.
            truncated = true;
            break;
        }
        const fold = createFold(root.key, query.max - total);
        const outcome = await within(
            run(root.dir, plan.args, options.timeout, (line) => {
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
            truncated = true;
            failed.push({ root: root.key, reason: TIMED_OUT });
        } else if (!outcome.stopped && outcome.code >= FAILED) {
            failed.push({ root: root.key, reason: reasonOf(outcome.stderr) });
        }
    }
    if (total === 0 && failed.length > 0) return { ok: false, error: failed[0].reason };
    return { ok: true, answer: { files, total, truncated, ms: clock() - started, failed } };
}
