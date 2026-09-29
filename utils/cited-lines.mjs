#!/usr/bin/env node
// Layer 4, test. Print the line the tree holds at every `path:line` a report cites.
//
// A report that cites a line by number is checked against the tree before it is sent: the citation
// is read out of the report, the file is opened, and the line is printed beside it. A path the tree
// does not hold, a number past the end of the file, a number below one, a range that runs backwards
// or spans more than a screenful, and a number that lands on a line holding nothing or nothing but
// a brace are printed as MISSING and make the command fail, which is the wrong-citation half of the
// rule that a claim names what it was read from. A line with nothing to read on it is a miss
// because a citation stands for a line a reader can read back, and a line number that has drifted
// by one lands on the blank or the brace between two blocks as often as on a line of code.
//
// A citation may name one line (`src/lib/server/core/git.ts:121`), a range (`:138-144`) or a list
// (`:55,185,193`); every line named is printed. Usage:
//
//     node utils/cited-lines.mjs [--root <dir>] <report>

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

/**
 * A path with an extension the tree uses, followed by one or more line numbers.
 *
 * A number may carry a minus so that `:-5` is read as the citation it is meant to be and refused by
 * name, rather than falling outside the pattern and being counted as no citation at all.
 */
const CITATION =
    /(?<![\w/.-])((?:[\w.-]+\/)*[\w.-]+\.(?:ts|tsx|mjs|js|svelte|md|yml|yaml|css|html|json|sh|txt)):(-?\d+(?:[-,]-?\d+)*)/g;

/**
 * The arguments: an optional root, then the one report file. A line that does not read (a flag
 * this does not know, `--root` with nothing after it) names no report, which prints the usage.
 *
 * @param {string[]} argv
 */
export function readArgs(argv) {
    try {
        const { values, positionals } = parseArgs({
            args: argv,
            options: { root: { type: 'string' } },
            allowPositionals: true
        });
        return { root: values.root ?? null, report: positionals[0] ?? null };
    } catch {
        return { root: null, report: null };
    }
}

/**
 * The lines a citation's number part names, a range written out, with the parts that name none.
 *
 * A range that runs backwards, or one wider than a screenful, names no line a reader can go to, and
 * a number below one names nothing at all; each is refused by name rather than read as its first
 * line, since a report's citation is meant to take a reader to one place.
 *
 * @param {string} part
 */
export function numbers(part) {
    const found = [];
    const refused = [];
    for (const piece of part.split(',')) {
        if (/^-?\d+$/.test(piece)) {
            const one = Number(piece);
            if (one < 1) refused.push(`${piece} is no line number`);
            else found.push(one);
            continue;
        }
        const range = /^(\d+)-(\d+)$/.exec(piece);
        if (range === null) {
            refused.push(`${piece} is no line number`);
            continue;
        }
        const first = Number(range[1]);
        const last = Number(range[2]);
        if (last < first) {
            refused.push(`the range ${piece} runs backwards`);
            continue;
        }
        if (last - first >= 200) {
            refused.push(`the range ${piece} is ${last - first + 1} lines wide`);
            continue;
        }
        for (let at = first; at <= last; at += 1) found.push(at);
    }
    return { found, refused };
}

/**
 * Why a line is not one a citation can stand for, or the empty string where it is.
 *
 * @param {string} line
 */
export function unreadable(line) {
    const text = line.trim();
    if (text === '') return 'the line is blank';
    if (/^[{}()[\];,]+$/.test(text)) return 'the line holds only punctuation';
    return '';
}

/**
 * Every citation the report holds, in the order it holds them, with duplicates dropped.
 *
 * @param {string} text
 */
export function citations(text) {
    const found = [];
    const seen = new Set();
    for (const match of text.matchAll(CITATION)) {
        const key = `${match[1]}:${match[2]}`;
        if (seen.has(key)) continue;
        seen.add(key);
        found.push({ path: match[1], part: match[2] });
    }
    return found;
}

/**
 * Whether a cited path stays under the root, so a citation names a file of the tree and no other.
 *
 * @param {string} root
 * @param {string} path
 */
function under(root, path) {
    const base = resolve(root);
    const held = resolve(path);
    return held === base || held.startsWith(base + sep);
}

/**
 * One line of output per line cited: the tree's text there, or why there is none.
 *
 * @param {string} root
 * @param {string} text
 */
export function lines(root, text) {
    const out = [];
    for (const citation of citations(text)) {
        const full = join(root, citation.path);
        if (!under(root, full)) {
            out.push(`MISSING ${citation.path}:${citation.part} the path leaves the tree`);
            continue;
        }
        if (!existsSync(full)) {
            out.push(`MISSING ${citation.path}:${citation.part} no such file`);
            continue;
        }
        const held = readFileSync(full, 'utf8').split('\n');
        const asked = numbers(citation.part);
        for (const why of asked.refused) {
            out.push(`MISSING ${citation.path}:${citation.part} ${why}`);
        }
        for (const at of asked.found) {
            if (at > held.length) {
                out.push(`MISSING ${citation.path}:${at} the file has ${held.length} lines`);
                continue;
            }
            const why = unreadable(held[at - 1]);
            if (why !== '') {
                out.push(`MISSING ${citation.path}:${at} ${why}`);
                continue;
            }
            out.push(`${citation.path}:${at} | ${held[at - 1]}`);
        }
    }
    return out;
}

function main() {
    const { root, report } = readArgs(process.argv.slice(2));
    const base = resolve(root ?? join(dirname(fileURLToPath(import.meta.url)), '..'));
    if (report === null) {
        process.stdout.write('usage: node utils/cited-lines.mjs [--root <dir>] <report>\n');
        process.exitCode = 2;
        return;
    }
    if (!existsSync(report)) {
        process.stdout.write(`no such report: ${report}\n`);
        process.exitCode = 2;
        return;
    }
    const out = lines(base, readFileSync(report, 'utf8'));
    for (const line of out) process.stdout.write(`${line}\n`);
    const missing = out.filter((line) => line.startsWith('MISSING')).length;
    process.stdout.write(`${out.length} cited lines, ${missing} missing\n`);
    process.exitCode = missing === 0 ? 0 : 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
