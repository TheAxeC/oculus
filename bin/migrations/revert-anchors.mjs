#!/usr/bin/env node
// Layer 4, test. Rewrite every revert directive under tests/ that names its target line by number
// into the form bin/revert-check/revert-check.mjs reads, which names the line by its text.
//
// The anchor is the target line's whole text with its indentation trimmed, written as a JSON
// string. Where that text is not unique in its file, the anchor is the nearest line above whose
// text is, and `+<n>` counts down from it to the target; a range names its first and its last line
// each by the same rule, joined by `..`. Only the location changes: what comes before `revert:` and
// the replacement after `=>` are kept byte for byte.
//
// Before a file is written, every directive rewritten in it is proven: the new line is read by the
// parser of bin/revert-check/directives.mjs and its anchors are resolved by that file's resolver,
// over every file as it will stand after the run, and must give the same target, the same
// replacement and exactly the lines the old number named. A directive that fails, or whose line no
// anchor can name, is left as it was and printed as refused. Usage:
//
//     node bin/migrations/revert-anchors.mjs [--check] [--root <dir>]
//
// With --check it writes nothing and prints the count of what it would do. The exit status is 1
// when a directive was refused.

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NUMBERED, parseDirective, resolveAnchor, spelled } from '../revert-check/directives.mjs';

/** Every file under a folder, as a path relative to the root, skipping installed dependencies. */
function filesUnder(root, folder) {
    const found = [];
    const full = join(root, folder);
    if (!existsSync(full)) return found;
    for (const entry of readdirSync(full, { withFileTypes: true })) {
        const rel = `${folder}/${entry.name}`;
        if (entry.isDirectory() && entry.name !== 'node_modules')
            found.push(...filesUnder(root, rel));
        else if (entry.isFile()) found.push(rel);
    }
    return found;
}

/** How many lines of a file carry each trimmed text. */
function counts(lines) {
    const held = new Map();
    for (const line of lines) held.set(line.trim(), (held.get(line.trim()) ?? 0) + 1);
    return held;
}

/**
 * The anchor naming one line: its own text where that is unique, otherwise the nearest unique line
 * above it with the offset down to the line, or null where no line at or above it is unique.
 */
export function anchorFor(lines, number) {
    const held = counts(lines);
    for (let at = number; at >= 1; at -= 1) {
        const text = lines[at - 1].trim();
        if (held.get(text) === 1) return { text, offset: number - at };
    }
    return null;
}

/** The lines of a file as the run leaves it: the rewrites it keeps applied, or the file as read. */
function linesAfter(root, target, plan) {
    const rewrites = plan.get(target);
    const lines = readFileSync(join(root, target), 'utf8').split('\n');
    for (const one of rewrites ?? []) if (!one.refused) lines[one.at] = one.next;
    return lines;
}

/**
 * The new form of one old directive line, or the reason it has none. The location is computed from
 * the target as it stands before the run.
 */
function rewrite(root, line) {
    const match = NUMBERED.exec(line);
    if (match === null) return null;
    const [, target, from, to] = match;
    const first = Number(from);
    const last = Number(to ?? from);
    const base = resolve(root);
    const full = resolve(base, target);
    const head = { target, first, last, replacement: match[4] };
    if (!full.startsWith(base + sep) || !existsSync(full)) {
        return { ...head, why: 'the target is not in the tree' };
    }
    const lines = readFileSync(full, 'utf8').split('\n');
    if (first < 1 || last > lines.length || last < first) {
        return { ...head, why: `lines ${first}-${last} of ${lines.length}` };
    }
    const one = anchorFor(lines, first);
    const other = anchorFor(lines, last);
    if (one === null || other === null) return { ...head, why: 'no unique line at or above it' };
    const location = last === first ? spelled(one) : `${spelled(one)} .. ${spelled(other)}`;
    const old = to === undefined ? `${target}:${from}` : `${target}:${from}-${to}`;
    const at = line.indexOf(old, match.index);
    const next = `${line.slice(0, at)}${target} ${location}${line.slice(at + old.length)}`;
    return { ...head, next, why: '' };
}

/** Why a rewritten line does not name what the old one named, or the empty string where it does. */
function disproof(root, one, plan) {
    const read = parseDirective(one.next);
    if (read === null || read.problem !== '') return 'the new line does not read as a directive';
    if (read.target !== one.target || read.replacement !== one.replacement) {
        return 'the new line names another target or replacement';
    }
    const lines = linesAfter(root, one.target, plan);
    const first = resolveAnchor(lines, read.first);
    const last = resolveAnchor(lines, read.last);
    if (first.why !== '') return `${spelled(read.first)}, ${first.why}`;
    if (last.why !== '') return `${spelled(read.last)}, ${last.why}`;
    if (first.line !== one.first || last.line !== one.last) {
        return `the anchors name lines ${first.line}-${last.line}`;
    }
    return '';
}

/** The rewrites of every file under tests/, each proven or refused. */
export function planFor(root) {
    const plan = new Map();
    for (const file of filesUnder(root, 'tests')) {
        const lines = readFileSync(join(root, file), 'utf8').split('\n');
        const found = [];
        lines.forEach((line, at) => {
            const one = rewrite(root, line);
            if (one !== null) found.push({ ...one, file, at, refused: one.why !== '' });
        });
        if (found.length > 0) plan.set(file, found);
    }
    // A refusal puts a line back as it was, which can change a file another proof reads, so the
    // proofs run again until a pass refuses nothing more.
    for (let changed = true; changed;) {
        changed = false;
        for (const one of [...plan.values()].flat()) {
            if (one.refused) continue;
            const why = disproof(root, one, plan);
            if (why === '') continue;
            Object.assign(one, { refused: true, why });
            changed = true;
        }
    }
    return plan;
}

function main() {
    const args = process.argv.slice(2);
    const check = args.includes('--check');
    const at = args.indexOf('--root');
    if (at !== -1 && args[at + 1] === undefined) {
        process.stdout.write(
            'usage: node bin/migrations/revert-anchors.mjs [--check] [--root <dir>]\n'
        );
        process.exitCode = 2;
        return;
    }
    const root = resolve(
        at === -1 ? join(dirname(fileURLToPath(import.meta.url)), '..', '..') : args[at + 1]
    );
    const plan = planFor(root);
    let converted = 0;
    let files = 0;
    let refused = 0;
    for (const [file, found] of plan) {
        const kept = found.filter((one) => !one.refused);
        for (const one of found.filter((each) => each.refused)) {
            const range = one.last === one.first ? '' : `-${one.last}`;
            const where = `${file}:${one.at + 1} names ${one.target}:${one.first}${range}`;
            process.stdout.write(`refused   ${where}: ${one.why}\n`);
        }
        refused += found.length - kept.length;
        converted += kept.length;
        if (kept.length === 0) continue;
        files += 1;
        if (check) continue;
        writeFileSync(join(root, file), linesAfter(root, file, plan).join('\n'), 'utf8');
    }
    process.stdout.write(
        `${converted} directives converted in ${files} files written, ${refused} refused\n`
    );
    process.exitCode = refused === 0 ? 0 : 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
