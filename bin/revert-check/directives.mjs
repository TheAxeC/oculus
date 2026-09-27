// Layer 4, test. The revert directives of bin/revert-check/revert-check.mjs: how one is read from a
// line of a case file, the case it belongs to, the lines its anchors name in its target, and the
// target's text with the directive applied. Nothing here copies or runs anything, so the migration
// in bin/migrations/revert-anchors.mjs reads directives by the same parser and resolver.

import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';

/** One quoted text of a directive: a JSON string literal. */
const TEXT = String.raw`"(?:[^"\\]|\\.)*"`;

/**
 * A directive: the target's path, the text of its first line with the offset from it, the text of
 * its last line with its offset where it names a range, and the replacement. The quoted text comes
 * before the `=>`, so a `=>` inside it is never read as the start of the replacement.
 */
const DIRECTIVE = new RegExp(
    String.raw`\/\/\s*revert:\s*(\S+)\s+(${TEXT})(?:\s+\+(\d+))?(?:\s+\.\.\s+(${TEXT})(?:\s+\+(\d+))?)?\s*=>\s*(.+?)\s*$`
);

/** A directive that names its target line by number, which is refused. */
export const NUMBERED = /\/\/\s*revert:\s*([^\s:]+):(\d+)(?:-(\d+))?\s*=>\s*(.+?)\s*$/;

const CASE = /^\s*(?:it|test)(?:\.\w+)?\s*\(/;
const NAME = /(['"`])([\s\S]*?)\1/;

/**
 * The name a case opens with, or null where the line does not open one.
 *
 * A case whose arguments are long enough is written with the name on the line under `it(`, so the
 * name is read from the opening line and, where it holds none, from the line after it.
 */
function caseName(lines, at) {
    if (!CASE.test(lines[at])) return null;
    const rest = lines[at].slice(lines[at].indexOf('(') + 1);
    const here = NAME.exec(rest);
    if (here !== null) return here[2];
    const under = at + 1 < lines.length ? NAME.exec(lines[at + 1]) : null;
    return under === null ? null : under[2];
}

/** The text and offset of one anchor, or null where the quoted text is not a JSON string. */
function anchorOf(quoted, offset) {
    try {
        return { text: JSON.parse(quoted), offset: Number(offset ?? 0) };
    } catch {
        return null;
    }
}

/**
 * One line read as a directive: its target, its anchors and its replacement, or the problem that
 * leaves it unproven, or null where the line holds no directive. The anchored form is read first,
 * so an anchor whose text holds a numbered directive is read as the anchor it is.
 */
export function parseDirective(line) {
    const match = DIRECTIVE.exec(line);
    if (match === null) {
        return NUMBERED.test(line) ? { problem: 'names a line number; convert it' } : null;
    }
    const first = anchorOf(match[2], match[3]);
    const last = match[4] === undefined ? first : anchorOf(match[4], match[5]);
    if (first === null || last === null) {
        return { problem: `names ${match[1]} by a text that is not a JSON string` };
    }
    return { target: match[1], first, last, replacement: match[6], problem: '' };
}

/**
 * The line an anchor names in a file's lines, counted from 1, or the reason it names none: a text
 * that equals no trimmed line or several, or an offset past the end.
 */
export function resolveAnchor(lines, anchor) {
    let found = 0;
    let at = 0;
    for (let one = 0; one < lines.length; one += 1) {
        if (lines[one].trim() !== anchor.text) continue;
        found += 1;
        at = one + 1;
    }
    if (found !== 1) return { line: 0, why: `which matches ${found} lines` };
    const line = at + anchor.offset;
    if (line > lines.length) {
        return { line: 0, why: `which runs to line ${line} of ${lines.length}` };
    }
    return { line, why: '' };
}

/** An anchor as a directive writes it: the quoted text, then the offset where there is one. */
export function spelled(anchor) {
    const text = JSON.stringify(anchor.text);
    return anchor.offset === 0 ? text : `${text} +${anchor.offset}`;
}

/**
 * The first and last line a directive's anchors name in its target, or the problem that leaves it
 * unproven. A target outside the tree or missing from it is not read here: the check says so of
 * it by name.
 */
function located(root, read) {
    const full = join(root, read.target);
    if (!inside(root, full) || !existsSync(full)) return { first: 0, last: 0, problem: '' };
    const lines = readFileSync(full, 'utf8').split('\n');
    const first = resolveAnchor(lines, read.first);
    const last = resolveAnchor(lines, read.last);
    for (const [anchor, held] of [
        [read.first, first],
        [read.last, last]
    ]) {
        if (held.why !== '') {
            return {
                first: 0,
                last: 0,
                problem: `names ${read.target} ${spelled(anchor)}, ${held.why}`
            };
        }
    }
    return { first: first.line, last: last.line, problem: '' };
}

/**
 * Every directive the given files hold, each with the case it sits in and the lines its anchors
 * resolve to.
 *
 * The case is the nearest `it(` or `test(` above the directive line, which is where a revert is
 * written: inside the body it belongs to, or on the line above the case it opens.
 */
export function directives(root, files) {
    const found = [];
    for (const file of files) {
        const full = join(root, file);
        if (!existsSync(full)) continue;
        const lines = readFileSync(full, 'utf8').split('\n');
        for (let at = 0; at < lines.length; at += 1) {
            const read = parseDirective(lines[at]);
            if (read === null) continue;
            const where =
                read.problem === ''
                    ? located(root, read)
                    : { first: 0, last: 0, problem: read.problem };
            found.push({
                file,
                line: at + 1,
                caseName: caseAbove(lines, at),
                target: read.target ?? '',
                first: where.first,
                last: where.last,
                replacement: read.replacement ?? '',
                problem: where.problem
            });
        }
    }
    return found;
}

/** Whether a line is a comment line and nothing else. */
const COMMENT = /^\s*(\/\/|\/\*|\*)/;

/**
 * The name of the case a directive belongs to, or null where it belongs to none.
 *
 * A directive above a case opens that case, with nothing but comment lines between them, which is
 * why the lines under it are read first: the prose revert may sit between the directive and the
 * case it names. Anywhere else it belongs to the case whose body it sits in, the nearest one above
 * it.
 */
function caseAbove(lines, at) {
    let next = at + 1;
    while (next < lines.length && COMMENT.test(lines[next])) next += 1;
    const under = next < lines.length ? caseName(lines, next) : null;
    if (under !== null) return under;
    for (let back = at; back >= 0; back -= 1) {
        const name = caseName(lines, back);
        if (name !== null) return name;
    }
    return null;
}

/** Every case name the given files declare, so one without a directive can be named. */
export function caseNames(root, files) {
    const found = [];
    for (const file of files) {
        const full = join(root, file);
        if (!existsSync(full)) continue;
        const lines = readFileSync(full, 'utf8').split('\n');
        for (let at = 0; at < lines.length; at += 1) {
            const name = caseName(lines, at);
            if (name !== null) found.push({ file, caseName: name });
        }
    }
    return found;
}

/** A line no revert of it can change the run: nothing on it, or nothing but a comment. */
function inert(line) {
    const text = line.trim();
    return text === '' || text.startsWith('//') || text.startsWith('*') || text.startsWith('/*');
}

/**
 * Why a directive changes nothing, or the empty string where it does change something.
 *
 * A revert proves a rule by taking the rule out; one that names a blank line or a comment, or whose
 * replacement is the line it replaces, leaves the tree saying the same thing, so a case that goes
 * red under it is red for a reason the directive does not name.
 */
export function changesNothing(lines, first, last, replacement) {
    const named = lines.slice(first - 1, last);
    if (named.every(inert)) {
        return named.length === 1
            ? 'the line it names is blank or a comment'
            : 'every line it names is blank or a comment';
    }
    if (replacement === 'delete') return '';
    const indent = /^\s*/.exec(lines[first - 1])[0];
    const written = indent + replacement;
    if (last === first && written === lines[first - 1])
        return 'the replacement is the line it replaces';
    return '';
}

/** The text of a file with one directive applied, or a failure naming what was out of reach. */
export function applied(text, first, last, replacement) {
    const lines = text.split('\n');
    if (first < 1 || last > lines.length || last < first) {
        return { text: null, why: `lines ${first}-${last} of ${lines.length}` };
    }
    const idle = changesNothing(lines, first, last, replacement);
    if (idle !== '') return { text: null, idle, why: idle };
    const kept = lines.slice(0, first - 1);
    if (replacement !== 'delete') {
        const indent = /^\s*/.exec(lines[first - 1])[0];
        kept.push(indent + replacement);
    }
    return { text: [...kept, ...lines.slice(last)].join('\n'), why: '' };
}

/**
 * Whether a path stays under a root: what a directive may read, and where the edit may be written.
 * The link a path goes through is followed before the comparison, since a symlink inside the tree
 * names a file outside it and a lexical comparison cannot tell.
 */
export function inside(root, path) {
    const held = real(path);
    const base = real(root);
    return held === base || held.startsWith(base + sep);
}

/** A path with every link on it followed, as far as the tree holds one. */
export function real(path) {
    const held = resolve(path);
    try {
        return realpathSync(held);
    } catch {
        // Nothing is there yet, which is the copy's own target: follow the folder that holds it.
        try {
            return join(realpathSync(dirname(held)), held.slice(dirname(held).length + 1));
        } catch {
            return held;
        }
    }
}
