#!/usr/bin/env node
// Layer 4, test. Prove that the revert a test case names turns that case red.
//
// A case carries its revert beside the prose one, in the shape
//
//     // revert: <path> "<the target line's text>" => <replacement text>
//     // revert: <path> "<the target line's text>" => delete
//
// and names its target line by that line's whole text, indentation trimmed, which has to equal the
// trimmed text of exactly one line of the file. The text is a JSON string, so a quote or a
// backslash in it is written with JSON escapes, and a `=>` inside the quotes is never read as the
// start of the replacement. Where the target line's own text is not
// unique in its file, the directive names the nearest line above it whose text is, followed by
// `+<n>`, the count of lines down from that line to the target. A range names its first line and
// its last, each by the same rule: `"<first>" [+<n>] .. "<last>" [+<n>]`. A text that matches no
// line or several, and an offset that runs past the end of the file, leave the directive unproven,
// never resolved to a guess, so a target line that changed or went is found rather than another
// line reverted in its place. A directive that names its line by number, `<path>:<line>`, is not
// read: it is unproven and says to convert it, which bin/migrations/revert-anchors.mjs does.
//
// The replacement is the content of the line; the line's own indentation is kept, so a directive
// stays one line that the formatter does not wrap. A directive on the line above a case belongs to
// that case; anywhere else it belongs to the case whose body it sits in.
//
// A directive fails when its case stays green: a case that passes with its named revert applied
// does not hold the rule it is cited for. Where the run cannot say that much, the directive is
// unproven and the line says why, never red: a revert that changes nothing, a case that did not
// run, was skipped or shares its name with another, a target the copy does not hold, a script the
// revert leaves unparsable, and a build that refused the edit are all unproven.
//
// A directive is proven on one of two paths, every refusal made before either, and its line does
// not say which. A unit case is tried first in memory: one Vitest instance over one copy of the
// tree made for the run, whose first plugin answers the target's path with the reverted text, so
// the revert reaches every module the case imports without a copy per directive. One result of the
// case's name, failed with the revert and passed without, is red. The copy is the case's working
// directory and module home, so a reverted line that writes relative to either never reaches the
// tree checked. Each in-memory run starts with an empty temporary directory, and a run after which
// a path of the run's folder outside it was added, removed, or changed in mode, size or time of
// change has the folder emptied and the copy and the instance made again. Vitest's own temporary
// directory lies outside the run's folder; a write outside the run's folder, there or anywhere else
// through an absolute path, is not seen. A green in memory is never a verdict, since a case
// that reads its target from disk or runs it as a process never sees a text served in memory; that
// and every other outcome go to the copy path, which writes the edit into a copy of its own and
// runs the case in a process, where every way a case reaches its target sees the revert. A browser
// case takes the copy path, as its build reads disk. The copy path lives in copy.mjs beside this
// file, the in-memory path in memory.mjs, and the reading and resolving of directives in
// directives.mjs.
//
// A browser case serves on a port of its own, one the system says is free, named to the copy's
// Playwright configuration and server through OCULUS_BROWSER_PORT: another run of the browser layer
// on the machine serves on its own port, so the case never presses a page built from another tree,
// and a run whose server found its port taken all the same is run again on a new one.
//
// The case runs with its temporary directory inside the copy, and a run stopped by a signal removes
// the copy in hand; the in-memory path has one folder for the run, holding the run's copy, removed
// at the end and on a signal. Either way a run leaves nothing in the system's temporary directory.
//
// A case with no machine-readable revert is unchecked. Unchecked counts in the summary and in the
// exit status, since a case nothing proves is what this exists to find; the argument list is what
// the caller vouches for, so a file whose cases the caller does not own is left off it.
//
// With `--base <dir>`, a folder holding the tree the change starts from, the check proves only what
// the change added or changed. A directive is left out, its line `unchanged`, where the base holds
// its test file and its target, the target's text is the same, the file holds one case of the
// directive's case name in each folder with the same text, the directive's line inside it, and the
// file's text with every case taken out is the same: such a directive was proven on the base, and
// nothing that decides its run has changed since. A case with no directive that is unchanged from
// the base by the same rules is not listed as unchecked. A refused directive, a file that does not
// parse and a case the parse does not find are proven as without a base. The rule compares the
// case, the file around the cases and the target only: a change to a module the case imports other
// than the target leaves the directive out all the same. The base is read, never run, copied or
// written, and the summary line gains the count of directives left out; without the flag every
// line is as it was. A `--base` given twice, naming no folder or naming the tree checked itself,
// where every directive would read unchanged and nothing would be proven, prints the usage. The
// comparison lives in base.mjs, loaded only when the flag is given.
//
// It runs no git command: the files to read are the argument list, which is what
// `git diff --name-only <commit>` prints. Usage:
//
//     node bin/revert-check/revert-check.mjs [--root <dir>] [--base <dir>] <file> [<file> ...]

import { readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applied, caseNames, directives, real } from './directives.mjs';
import { checkOne, editRefusal, isBrowserCase, refusal, unproven, whereOf } from './copy.mjs';
import { memoryRun } from './memory.mjs';

/**
 * The arguments: an optional root, every base given, then the files whose directives are read. A
 * `--base` with nothing after it is read as the empty path, which names no folder.
 */
export function readArgs(argv) {
    const files = [];
    const bases = [];
    let root = null;
    for (let at = 0; at < argv.length; at += 1) {
        if (argv[at] === '--root') {
            root = argv[at + 1] ?? null;
            at += 1;
        } else if (argv[at] === '--base') {
            bases.push(argv[at + 1] ?? '');
            at += 1;
        } else files.push(argv[at]);
    }
    return { root, bases, files };
}

/** Whether a path names a folder. */
function isFolder(path) {
    try {
        return statSync(path).isDirectory();
    } catch {
        return false;
    }
}

/**
 * Whether the bases given leave the run without one base to compare with: a `--base` given twice,
 * one naming no folder, or one naming the tree checked, against which nothing would be proven.
 */
function badBase(tree, bases) {
    if (bases.length === 0) return false;
    if (bases.length > 1) return true;
    if (!isFolder(bases[0])) return true;
    return real(bases[0]) === real(tree);
}

/**
 * One unit directive: every refusal first, then the case in memory, and the copy for whatever the
 * in-memory path does not prove red. A target whose path runs through a link is refused here as the
 * copy refuses it, since the copy's links point back at the tree.
 */
async function checkUnit(root, directive, memory) {
    const early = refusal(root, directive);
    if (early !== null) return early;
    const target = join(root, directive.target);
    let parsed = false;
    try {
        const { first, last, replacement } = directive;
        const edit = applied(readFileSync(target, 'utf8'), first, last, replacement);
        const refused = editRefusal(directive, edit);
        if (refused !== null) return refused;
        const rel = relative(root, target);
        if (real(target) !== join(real(root), rel))
            return unproven(directive, ', which is outside the copy');
        const run = memory();
        const broken = await run.unparsable(directive, rel, edit.text);
        if (broken) return broken;
        parsed = broken === null;
        const proven = await run.red(directive, rel, edit.text);
        if (proven) return { ok: true, line: `red       ${whereOf(directive)}` };
    } catch {
        // What the in-memory path could not settle, the copy settles and says.
    }
    return checkOne(root, directive, parsed);
}

/**
 * Whether a directive is left out of the run: one the base holds unchanged and that is not refused
 * before any run, since a refused directive was never proven on the base either.
 */
function leftOut(tree, directive, same) {
    return same !== null && refusal(tree, directive) === null && same.directiveUnchanged(directive);
}

async function main() {
    const { root, bases, files } = readArgs(process.argv.slice(2));
    const tree = resolve(root ?? join(dirname(fileURLToPath(import.meta.url)), '..', '..'));
    if (files.length === 0 || badBase(tree, bases)) {
        process.stdout.write(
            'usage: node bin/revert-check/revert-check.mjs [--root <dir>] [--base <dir>]' +
                ' <file> [<file> ...]\n'
        );
        process.exitCode = 2;
        return;
    }
    // The comparison loads the TypeScript and Svelte parsers, which a run with no base never needs.
    const same =
        bases.length === 0 ? null : (await import('./base.mjs')).baseline(tree, resolve(bases[0]));
    const found = directives(tree, files);
    const covered = new Set(found.map((one) => `${one.file}::${one.caseName}`));
    let bad = 0;
    let unchanged = 0;
    let run = null;
    const memory = () => (run ??= memoryRun(tree));
    try {
        for (const directive of found) {
            if (leftOut(tree, directive, same)) {
                unchanged += 1;
                process.stdout.write(`unchanged ${whereOf(directive)}\n`);
                continue;
            }
            const result = isBrowserCase(directive.file)
                ? checkOne(tree, directive)
                : await checkUnit(tree, directive, memory);
            if (!result.ok) bad += 1;
            process.stdout.write(`${result.line}\n`);
        }
    } finally {
        if (run !== null) await run.close();
    }
    let unchecked = 0;
    for (const one of caseNames(tree, files)) {
        if (covered.has(`${one.file}::${one.caseName}`)) continue;
        if (same !== null && same.caseUnchanged(one.file, one.caseName)) continue;
        unchecked += 1;
        process.stdout.write(`unchecked ${one.file} :: ${one.caseName}\n`);
    }
    const kept = same === null ? '' : `, ${unchanged} unchanged`;
    process.stdout.write(
        `${found.length} reverts, ${bad} unproven, ${unchecked} unchecked${kept}\n`
    );
    process.exitCode = bad === 0 && unchecked === 0 ? 0 : 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
