// Layer 2, client state. How the output of a task terminal is read for problems. `errorMatch` reads
// the `file:line[:column]: error|warning` line every command's output is read for when it names no
// problem matcher. A command that names matchers (`$name`, declared by an app under
// `contributes.problemMatchers`) is read by those instead, line by line, as VS Code reads a task's
// output: `stepMatcher` takes a matcher, where it stood after the previous line and the line, and
// answers where it stands now and the problem the line completed, if any.
//
// A matcher's patterns match consecutive lines: the first pattern's line starts a problem, each
// next pattern's line adds fields, and the last pattern's line completes it. A last pattern with
// `loop` stays the last pattern for the lines that follow, each of which completes another problem
// with the fields of the earlier patterns. A line that does not match the pattern a matcher waits
// for drops what it held and is tried against the first pattern. A background matcher also reads
// the lines that begin and end one round of its task's output. A line of more than `LINE_MAX`
// characters is not read, and a pattern whose expression does not compile never matches.

import { appViewId } from '../../../../data/helpers/files/apps/apps.ts';
import type {
    AppProblemMatcher,
    AppProblemPattern,
    CommandSeverity
} from '../../../../data/model/index.ts';

/** The longest line a matcher reads. */
const LINE_MAX = 10_000;

/** A line of output that names a place and a severity; the severity is read in any letter case. */
const ERROR_LINE =
    /^(?<file>[^\s:][^:]*):(?<line>\d+)(?::(?<column>\d+))?:\s*(?<severity>error|warning)\b:?\s*(?<message>.*)$/i;

/** Colour and cursor codes of the terminal, which are no part of a line's text. */
/* eslint-disable no-control-regex -- the codes are the control characters of the terminal. */
export const ESCAPES =
    /\u001b\[[0-9;?]*[ -/]*[@-~]|\u001b\][^\u0007]*(?:\u0007|\u001b\\)|\u001b[@-Z\\-_]/g;
/* eslint-enable no-control-regex */

/** One matched line, and the span of its `file:line[:column]` in the line. */
export type ErrorMatch = {
    file: string;
    line: number;
    column?: number;
    severity: 'error' | 'warning';
    message: string;
    start: number;
    length: number;
};

/** The error a line of output holds, or null for a line that holds none. */
export function errorMatch(text: string): ErrorMatch | null {
    const found = ERROR_LINE.exec(text);
    const groups = found?.groups;
    if (groups === undefined) return null;
    // A group that took no part in the match is absent, which the index type does not say.
    const column = groups.column as string | undefined;
    const place = `${groups.file}:${groups.line}${column === undefined ? '' : `:${column}`}`;
    return {
        file: groups.file,
        line: Number(groups.line),
        ...(column === undefined ? {} : { column: Number(column) }),
        severity: groups.severity.toLowerCase() === 'warning' ? 'warning' : 'error',
        message: groups.message,
        start: 0,
        length: place.length
    };
}

/** What the lines of a problem gave, each field absent until a pattern names it. */
type Fields = {
    file?: string;
    line?: number;
    column?: number;
    endLine?: number;
    endColumn?: number;
    severity?: string;
    code?: string;
    message?: string;
};

/** A problem a matcher completed. */
type Hit = {
    file: string;
    line: number;
    column?: number;
    endLine?: number;
    endColumn?: number;
    severity: CommandSeverity;
    code?: string;
    message: string;
};

/** Where a matcher stands: the pattern it waits for and the fields the earlier lines gave. */
export type MatcherRun = { next: number; held: Fields };

/** A matcher that has read nothing. */
export const FRESH: MatcherRun = { next: 0, held: {} };

/** What a line did to a matcher. */
export type Step = {
    run: MatcherRun;
    hit: Hit | null;
    /** The line began a round of a background task's output: the problems of the last are stale. */
    begin: boolean;
};

/** The expression of a pattern, or null when it does not compile. */
function expressionOf(text: string): RegExp | null {
    try {
        return new RegExp(text);
    } catch {
        return null;
    }
}

/** The text of a group of a match, or undefined when the pattern names none or it took no part. */
function groupOf(found: RegExpExecArray, index: number): string | undefined {
    return index > 0 && index < found.length ? found[index] : undefined;
}

/** The whole number a group holds, or undefined. */
function numberOf(found: RegExpExecArray, index: number): number | undefined {
    const text = groupOf(found, index);
    if (text === undefined || !/^\d+$/.test(text.trim())) return undefined;
    return Number(text.trim());
}

/** The fields a line gave under one pattern. */
function fieldsOf(pattern: AppProblemPattern, found: RegExpExecArray): Fields {
    const out: Fields = {};
    const set = <K extends keyof Fields>(key: K, value: Fields[K] | undefined): void => {
        if (value !== undefined) out[key] = value;
    };
    set('file', groupOf(found, pattern.file));
    const place = groupOf(found, pattern.location);
    if (place !== undefined) {
        const parts = place.split(',').map((one) => Number(one.trim()));
        if (parts.every((one) => Number.isInteger(one) && one >= 0) && parts.length > 0) {
            if (parts.length === 1) set('line', parts[0]);
            else if (parts.length === 2) {
                set('line', parts[0]);
                set('column', parts[1]);
            } else if (parts.length >= 4) {
                set('line', parts[0]);
                set('column', parts[1]);
                set('endLine', parts[2]);
                set('endColumn', parts[3]);
            }
        }
    }
    set('line', numberOf(found, pattern.line));
    set('column', numberOf(found, pattern.column));
    set('endLine', numberOf(found, pattern.endLine));
    set('endColumn', numberOf(found, pattern.endColumn));
    set('severity', groupOf(found, pattern.severity));
    set('code', groupOf(found, pattern.code));
    set('message', groupOf(found, pattern.message));
    return out;
}

/** The severity a word names, or the matcher's own when the word names none. */
function severityOf(word: string | undefined, fallback: string): CommandSeverity {
    const text = (word ?? fallback).trim().toLowerCase();
    if (text.startsWith('warn')) return 'warning';
    if (text.startsWith('info') || text.startsWith('hint') || text.startsWith('note'))
        return 'info';
    return 'error';
}

/** The problem the fields describe, or null while they name no file. */
function hitOf(fields: Fields, fallback: string): Hit | null {
    if (fields.file === undefined || fields.file === '') return null;
    return {
        file: fields.file,
        line: fields.line !== undefined && fields.line > 0 ? fields.line : 1,
        ...(fields.column === undefined ? {} : { column: fields.column }),
        ...(fields.endLine === undefined ? {} : { endLine: fields.endLine }),
        ...(fields.endColumn === undefined ? {} : { endColumn: fields.endColumn }),
        severity: severityOf(fields.severity, fallback),
        ...(fields.code === undefined ? {} : { code: fields.code }),
        message: fields.message ?? ''
    };
}

/** Whether a background matcher's pattern holds the line. */
function holds(text: string, line: string): boolean {
    return text !== '' && expressionOf(text)?.test(line) === true;
}

/** Read one line of output with one matcher. */
export function stepMatcher(matcher: AppProblemMatcher, run: MatcherRun, line: string): Step {
    if (line.length > LINE_MAX) return { run, hit: null, begin: false };
    const begin = matcher.background !== null && holds(matcher.background.beginsPattern, line);
    const patterns = matcher.patterns;
    if (patterns.length === 0) return { run: begin ? FRESH : run, hit: null, begin };
    const last = patterns.length - 1;
    let at = begin ? 0 : Math.min(run.next, last);
    let held = begin ? {} : run.held;
    let found = expressionOf(patterns[at].regexp)?.exec(line) ?? null;
    if (found === null && at > 0) {
        at = 0;
        held = {};
        found = expressionOf(patterns[0].regexp)?.exec(line) ?? null;
    }
    if (found === null) return { run: FRESH, hit: null, begin };
    const given = { ...held, ...fieldsOf(patterns[at], found) };
    if (at < last) return { run: { next: at + 1, held: given }, hit: null, begin };
    const hit = hitOf(given, matcher.severity);
    return {
        run: patterns[last].loop && last > 0 ? { next: last, held } : FRESH,
        hit,
        begin
    };
}

/** The declared matchers of an app, as the rows of the Views list hold them. */
export type DeclaringApp = {
    name: string;
    root: string;
    contributes: { problemMatchers: AppProblemMatcher[] };
};

/**
 * The matchers a command names (`$name`), each looked up first among the matchers of the app that
 * runs it, then among those of every other app. A name no app declares is left out.
 */
export function matchersFor(
    names: readonly string[],
    app: string | undefined,
    declaring: readonly DeclaringApp[]
): AppProblemMatcher[] {
    const ordered = [
        ...declaring.filter((one) => appViewId(one.root, one.name) === app),
        ...declaring.filter((one) => appViewId(one.root, one.name) !== app)
    ];
    return names.flatMap((name) => {
        const wanted = name.startsWith('$') ? name.slice(1) : name;
        const found = ordered
            .flatMap((one) => one.contributes.problemMatchers)
            .find((one) => one.name === wanted);
        return found === undefined ? [] : [found];
    });
}
