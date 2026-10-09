// Layer 2, server. The edits of a move for the backticked paths of a Markdown text. The Markdown
// server rewrites the links that lead to a moved file or folder (`markdown/getEditForFileRenames`)
// and knows nothing of backticks, so the paths that were written as `docs/DATA.md:3` are rewritten
// here, in the form they were written in: from the root, or from the folder of the file.
//
// The move has happened when this is asked, so the rule of backticks.ts is run over the disk as it
// was before: a place under a moved item was there if the item is there now, and a place under a
// new place was not. A path that led to something that moved leads to its new place, written again
// the way it was written; the file's own folder is its old folder when the file itself moved.

import { readdirSync } from 'node:fs';
import { basename, dirname, relative, sep } from 'node:path';
import { normal } from '../../uris.ts';
import { diskGround, resolvedPaths, type Ground, type Kind } from './backticks.ts';
import type { Reach } from './places.ts';

/** One item that moved, by real paths. */
export type Moved = { from: string; to: string };

/** A change of a text, in the protocol's form. */
export type TextChange = {
    range: { start: { line: number; character: number }; end: { line: number; character: number } };
    newText: string;
};

/** Whether a path is another or lies under it. */
function isUnder(path: string, folder: string): boolean {
    return path === folder || path.startsWith(folder + sep);
}

/** The place a path went, or the path itself when no move touched it. */
function after(path: string, moves: readonly Moved[]): string {
    for (const { from, to } of moves) {
        if (isUnder(path, from)) return to + path.slice(from.length);
    }
    return path;
}

/** The place a path was before the moves, or the path itself when no move touched it. */
function before(path: string, moves: readonly Moved[]): string {
    for (const { from, to } of moves) {
        if (isUnder(path, to)) return from + path.slice(to.length);
    }
    return path;
}

/** The disk as it was before the moves. */
function groundBefore(reach: Reach, moves: readonly Moved[]): Ground {
    const now = diskGround(reach.root.real);
    const base = reach.root.real;
    const kind = (path: string): Kind => {
        for (const move of moves) {
            if (isUnder(path, move.from)) return now.kind(move.to + path.slice(move.from.length));
            if (isUnder(path, move.to)) return 'none';
        }
        return now.kind(path);
    };
    const topNow = new Set(readdirSync(base).map((one) => normal(one)));
    const topBefore = new Set(topNow);
    for (const { from, to } of moves) {
        if (dirname(to) === base) topBefore.delete(normal(basename(to)));
        if (dirname(from) === base) topBefore.add(normal(basename(from)));
    }
    return { kind, top: (name) => topBefore.has(normal(name)) };
}

/** The path written as a path written from a folder reads, with `/` and a closing `/` kept. */
function written(target: string, folder: string, original: string): string {
    const path = relative(folder, target).split(sep).join('/');
    return original.endsWith('/') && !path.endsWith('/') ? `${path}/` : path;
}

/**
 * The changes to the backticked paths of one text that the moves make wrong. `file` is the real
 * path of the file now and `text` its text; the moves are real paths of items that were moved
 * within the root.
 */
export function movedPathChanges(
    text: string,
    file: string,
    reach: Reach,
    moves: readonly Moved[]
): TextChange[] {
    const ground = groundBefore(reach, moves);
    const wasAt = before(file, moves);
    const changes: TextChange[] = [];
    for (const span of resolvedPaths(text, wasAt, reach, ground)) {
        if (span.real === null) continue;
        const target = after(span.real, moves);
        const folder = span.from === 'root' ? reach.root.real : dirname(file);
        const path = written(target, folder, span.path);
        if (path === span.path) continue;
        changes.push({
            range: {
                start: { line: span.line, character: span.start },
                end: { line: span.line, character: span.end }
            },
            newText: path
        });
    }
    return changes;
}
