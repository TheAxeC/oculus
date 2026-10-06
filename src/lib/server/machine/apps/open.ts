// Layer 2, server. Whether an app may have a file of a root opened in oculus: the checks of
// `open({ file: { root, path } })` that need the disk, in the order DESIGN.md's "Opening things in
// oculus" gives, answered as `ok`, `closed` or `missing`.
//
// The order is what keeps the answer for a hidden path from depending on the disk or on which roots
// are shown: the segment rule and `closed_paths` on the path as given (the page ran them already,
// and a request to this route runs them again); the key `engine`; for a root app, any root but its
// own; whether the root is shown; the checks on the real path; and last whether the file exists.
// The real-path checks compare the real paths as the disk spells them, case included. They are
// made on the file's folder first, so a path inside oculus's own config folder is answered
// `closed` without a stat, a real path or a read of the file itself, and then on the file, so a
// link out of the root or into a dot folder is `closed` too. The file system is an argument, so a
// test records every read it was asked for.

import { readlinkSync, statSync } from 'node:fs';
import { isAbsolute, basename, dirname, join, relative, resolve, sep } from 'node:path';
import { inClosedPaths, pathSegmentsOpen } from '../../../data/helpers/files/apps.ts';
import { below, realPath } from '../../core/paths.ts';
import { ENGINE_ROOT, type Root } from '../../files/files.ts';
import type { HeldApp } from './held.ts';

/** What the checks ask of the disk. */
export type OpenFs = {
    /** The real path of something that exists, as the disk spells it, or null. */
    realPath: (path: string) => string | null;
    /** The target text of a link, or null when the path is no link. */
    linkTarget: (path: string) => string | null;
    /** Whether a real path is a regular file. */
    isFile: (path: string) => boolean;
};

/** The disk itself, with real paths as the operating system spells them. */
export const diskFs: OpenFs = {
    realPath: (path) => realPath(path, true),
    linkTarget: (path) => {
        try {
            return readlinkSync(path);
        } catch {
            return null;
        }
    },
    isFile: (path) => {
        try {
            return statSync(path).isFile();
        } catch {
            return false;
        }
    }
};

export type OpenAnswer = 'ok' | 'closed' | 'missing';

/** What the checks are made against. */
export type OpenContext = {
    /** The roots the file browser shows, with their directories written out. */
    roots: Root[];
    /** Oculus's own config folder. */
    configDir: string;
    /** The folders `closed_paths` names, or null while the key is missing or is no list. */
    closedPaths: readonly string[] | null;
    fs: OpenFs;
};

/** Whether a real path is the folder or lies below it. */
function within(path: string, folder: string): boolean {
    return path === folder || below(path, folder);
}

/** The real path of a path that may not exist: its deepest existing folder and the rest after it.
 * */
function resolved(path: string, fs: OpenFs): string | null {
    const rest: string[] = [];
    let probe = path;
    for (;;) {
        const real = fs.realPath(probe);
        if (real !== null) return join(real, ...rest);
        const target = fs.linkTarget(probe);
        if (target !== null) {
            const at = isAbsolute(target) ? target : resolve(dirname(probe), target);
            return join(at, ...rest);
        }
        const up = dirname(probe);
        if (up === probe) return null;
        rest.unshift(basename(probe));
        probe = up;
    }
}

/** Whether the part of a real path under its root breaks the segment rule or `closed_paths`. */
function hiddenUnder(rootReal: string, real: string, closed: readonly string[]): boolean {
    const under = relative(rootReal, real).split(sep).join('/');
    return !pathSegmentsOpen(under) || inClosedPaths(under, closed);
}

/** Answer whether the app may have this file of this root opened. */
export function checkOpen(
    ask: { app: HeldApp; root: string; path: string },
    context: OpenContext
): OpenAnswer {
    const { app, root, path } = ask;
    const { closedPaths, fs } = context;
    if (closedPaths === null) return 'closed';
    if (!pathSegmentsOpen(path) || inClosedPaths(path, closedPaths)) return 'closed';
    if (root === ENGINE_ROOT) return 'closed';
    if (app.row.root !== '' && root !== app.row.root) return 'closed';
    const shown = context.roots.find((one) => one.key === root);
    if (shown === undefined) return 'missing';

    const rootReal = fs.realPath(shown.dir);
    if (rootReal === null) return 'missing';
    const configReal = fs.realPath(context.configDir);
    const full = join(shown.dir, path);
    const folderReal = resolved(dirname(full), fs);
    if (folderReal === null || !within(folderReal, rootReal)) return 'closed';
    const guess = join(folderReal, basename(full));
    if (configReal !== null && within(guess, configReal)) return 'closed';
    if (hiddenUnder(rootReal, guess, closedPaths)) return 'closed';

    const real = fs.realPath(full);
    if (real === null) {
        const target = fs.linkTarget(full);
        if (target === null) return 'missing';
        const at = isAbsolute(target) ? target : resolve(dirname(full), target);
        const through = resolved(at, fs);
        return through !== null && within(through, rootReal) ? 'missing' : 'closed';
    }
    if (!within(real, rootReal)) return 'closed';
    if (configReal !== null && within(real, configReal)) return 'closed';
    if (hiddenUnder(rootReal, real, closedPaths)) return 'closed';
    return fs.isFile(real) ? 'ok' : 'missing';
}
