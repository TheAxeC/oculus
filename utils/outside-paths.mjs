#!/usr/bin/env node
// Layer 4, test. Print the paths a step changed that its brief does not name.
//
// A step's brief ends in a section, "## Paths this step writes", that lists the files and folders
// the step may change. This compares that list with what the checkout changed since a base commit
// and prints, one per line and sorted, each changed path that no entry of the list covers. An empty
// output is no path outside the list. Run from the root of the checkout it reports on:
//
//     node utils/outside-paths.mjs <brief> <base>
//
// The changed paths are the tracked ones that differ from the base, both sides of a rename since
// renames are not followed, and the untracked ones git does not ignore. They are read with NUL
// separators, so a path holding a space or a non-ASCII letter is printed as it is.
//
// An entry is a backticked token with a `/` or a `.` and no space that stands in a bullet of the
// section ("- ") outside every parenthesis of that bullet, in a place of the bullet's list: at the
// bullet's start, or after a comma, a colon, "and", "or", "a folder" or "a file". A parenthesis is
// a note on the entry before it, and a token inside one, in a clause of the bullet's prose (such
// as "since `data/helpers/` is full"), or in a paragraph that is no bullet, is prose and never an
// entry; a token that holds parentheses of its own, such as `routes/api/(files)/ops/+server.ts`,
// is read whole. A token with a `/` covers a changed path that equals it or ends with `/` followed
// by it, so an entry written relative to `tools/oculus` covers `tools/oculus/<entry>`; when it ends
// with `/` it also covers every path under such a folder. A token with no `/` covers only the path
// equal to it. A line range written after a token (`file.ts:12-30`) is read as the whole file.
// Exit 0 after printing; exit 2 with a sentence on stderr for a brief that cannot be read, a brief
// with no such section, or a base git does not know.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** The heading of the section the entries are read from. */
const HEADING = '## Paths this step writes';

/** A line range after a path: `:12`, `:12-30` or a list of them. */
const RANGE = /:\d+(?:-\d+)?(?:,\d+(?:-\d+)?)*$/;

/**
 * The text of the section: the lines under the heading up to the next heading, or null for a brief
 * with no such section.
 *
 * @param {string} brief
 */
export function sectionOf(brief) {
    const lines = brief.split('\n');
    const start = lines.findIndex((line) => line.trimEnd() === HEADING);
    if (start < 0) return null;
    const rest = lines.slice(start + 1);
    const end = rest.findIndex((line) => /^#{1,6} /.test(line));
    return (end < 0 ? rest : rest.slice(0, end)).join('\n');
}

/** What may stand between a list place of a bullet and the entry after it. */
const LEAD = /(?:^\s*[-*]|,|:|\band|\bor|\ba folder|\ba file)\s*$/;

/**
 * The backticked tokens of one bullet that stand outside every parenthesis and in a place of the
 * bullet's list, in order.
 *
 * @param {string} line
 */
function tokensOutsideParentheses(line) {
    /** @type {string[]} */
    const found = [];
    let depth = 0;
    let after = 0;
    for (let at = 0; at < line.length; at += 1) {
        const char = line[at];
        if (char === '`') {
            const close = line.indexOf('`', at + 1);
            if (close < 0) break;
            const lead = line.slice(after, at);
            if (depth === 0 && LEAD.test(lead)) found.push(line.slice(at + 1, close));
            at = close;
            after = close + 1;
        } else if (char === '(') {
            depth += 1;
        } else if (char === ')' && depth > 0) {
            depth -= 1;
            if (depth === 0) after = at + 1;
        }
    }
    return found;
}

/**
 * The entries of a section: the backticked tokens of its bullets that stand outside every
 * parenthesis, with a `/` or a `.` and no space, without the line range a token may carry.
 *
 * @param {string} section
 */
export function entriesOf(section) {
    /** @type {string[]} */
    const found = [];
    for (const line of section.split('\n')) {
        if (!/^\s*[-*] /.test(line)) continue;
        for (const raw of tokensOutsideParentheses(line)) {
            const token = raw.replace(RANGE, '');
            if (/\s/.test(token) || !/[/.]/.test(token)) continue;
            found.push(token);
        }
    }
    return found;
}

/**
 * Whether an entry covers a changed path.
 *
 * @param {string} entry
 * @param {string} path
 */
export function covers(entry, path) {
    if (!entry.includes('/')) return path === entry;
    if (path === entry || path.endsWith(`/${entry}`)) return true;
    return entry.endsWith('/') && (path.startsWith(entry) || path.includes(`/${entry}`));
}

/**
 * The changed paths that no entry covers, sorted.
 *
 * @param {string[]} changed
 * @param {string[]} entries
 */
export function outside(changed, entries) {
    const left = changed.filter((path) => !entries.some((entry) => covers(entry, path)));
    return [...new Set(left)].sort();
}

/**
 * Git's NUL-separated output as a list of paths.
 *
 * @param {string[]} args
 */
function gitPaths(args) {
    const out = execFileSync('git', args, { encoding: 'utf8', maxBuffer: 1 << 28 });
    return out.split('\0').filter((path) => path !== '');
}

/**
 * Say why nothing was compared, and fail.
 *
 * @param {string} sentence
 */
function refuse(sentence) {
    process.stderr.write(`${sentence}\n`);
    process.exitCode = 2;
}

function main() {
    const [briefPath, base] = process.argv.slice(2);
    if (briefPath === undefined || base === undefined) {
        refuse('usage: node utils/outside-paths.mjs <brief> <base>');
        return;
    }
    let brief;
    try {
        brief = readFileSync(briefPath, 'utf8');
    } catch {
        refuse(`the brief cannot be read: ${briefPath}`);
        return;
    }
    const section = sectionOf(brief);
    if (section === null) {
        refuse(`the brief has no "${HEADING}" section: ${briefPath}`);
        return;
    }
    try {
        execFileSync('git', ['rev-parse', '--verify', '--quiet', `${base}^{commit}`], {
            stdio: 'ignore'
        });
    } catch {
        refuse(`git does not know the base: ${base}`);
        return;
    }
    const changed = [
        ...gitPaths(['diff', '--name-only', '-z', '--no-renames', base]),
        ...gitPaths(['ls-files', '--others', '--exclude-standard', '-z'])
    ];
    for (const path of outside(changed, entriesOf(section))) process.stdout.write(`${path}\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
