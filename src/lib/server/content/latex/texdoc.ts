// Layer 2, server. texdoc, which opens the documentation of a TeX package in this machine's PDF
// application. The name comes from the page, so it is checked before any process starts: letters,
// digits, dots, underscores and dashes, and no leading dash, which texdoc would read as an option.
// The program runs with no shell and the name as one argument, in plain-list mode, so it never
// waits for an answer to a menu. The names a root's documents load with `\usepackage` are what the
// page offers for the name (`packagesOf`).

import { isTexSource, usedPackages } from '../../../data/prose/latex.ts';
import { readBounded } from './reader.ts';
import { closureOf } from './root.ts';
import { run, type Run, type Tools } from './tools.ts';

/** What a package name may be. */
const NAME = /^[A-Za-z0-9._][A-Za-z0-9._-]*$/;

/** The name when it may be given to texdoc, or null. */
export function texdocName(value: unknown): string | null {
    return typeof value === 'string' && NAME.test(value) ? value : null;
}

/** Open the documentation of one package. */
export function texdoc(name: string, tools?: Tools): Promise<Run> {
    return run('texdoc', ['-I', name], {}, tools);
}

/**
 * The packages the documents of the closure of `main`, a real path inside `bound`, load, each once
 * and in the order they are found. `folders` are the folders its build writes to, where its `.fls`
 * may be.
 */
export function packagesOf(bound: string, main: string, folders: string[] = []): string[] {
    const names: string[] = [];
    for (const path of closureOf(bound, main, folders)) {
        if (!isTexSource(path)) continue;
        const text = readBounded(path);
        if (text === null) continue;
        for (const name of usedPackages(text)) {
            if (!names.includes(name)) names.push(name);
        }
    }
    return names;
}
