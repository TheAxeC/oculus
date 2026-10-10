// Layer 2, server. The backticked paths of a Markdown text: a span between single backticks that
// names a file or folder of the hub, as `tools/cockpit/src/cockpit/schema.py:61` does. The hub's
// documents name files this way far more often than they link them, so the Markdown entry reads
// them like links: a path that is not there is a warning, and a press with Cmd on one opens it.
//
// A span is counted when it sits outside fenced code blocks, is a single-backtick span, holds no
// whitespace and at least one `/`, no `://` and none of `* { } < > $ ~ |`; its path is its text up
// to the first `:` or `#` with a trailing `,`, `.` or `;` taken off; and its first segment names an
// entry at the top of the file's root, so `see the/path` and `foo/bar.md` are prose, not paths. A
// counted span is resolved from the root and, failing that, from the file's own folder. A path in
// the `secrets` folder of every hub or `~/.oculus`, or the machine's `local.yml`, is not counted at
// all, so no mark or answer ever says whether such a file exists. A `:<n>` or `:<n>-<m>` after the
// path names a line.

import { readdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { inside } from '../../../../core/paths.ts';
import { normal } from '../../uris.ts';
import { withheld, type Reach } from './places.ts';

/** A counted span of one line of a text. */
type Backticked = {
    /** The line, from 0. */
    line: number;
    /** The columns of the path in the line, and of the whole span between the backticks. */
    start: number;
    end: number;
    spanStart: number;
    spanEnd: number;
    /** The path as written, without a line suffix or a trailing mark. */
    path: string;
    /** The line the suffix names, from 1, or 1. */
    target: number;
};

/** What a counted span leads to. */
export type Resolved = Backticked & {
    /** The real path it leads to, null when nothing is there. */
    real: string | null;
    /** Whether the path was found from the root or from the file's folder. */
    from: 'root' | 'folder';
    kind: Kind;
};

/** The characters no path of a span holds. */
const NOT_A_PATH = /[*{}<>$~|]/;

/** A line suffix: `:12` or `:12-15`. */
const LINE_SUFFIX = /^:(\d+)(?:-\d+)?/;

/** The marks that end a sentence and are not part of a path. */
const TRAILING = /[,.;]$/;

/** The start of a fenced code block's line, or its end, with the fence it is made of. */
const FENCE = /^ {0,3}(`{3,}|~{3,})/;

/** The single-backtick spans of a line, as the columns of the text between the backticks. */
function spansOf(line: string): { start: number; end: number }[] {
    const runs = [...line.matchAll(/`+/g)].map((one) => ({ at: one.index, size: one[0].length }));
    const spans: { start: number; end: number }[] = [];
    for (let at = 0; at < runs.length; at += 1) {
        const open = runs[at];
        const close = runs.findIndex((one, next) => next > at && one.size === open.size);
        if (close < 0) continue;
        if (open.size === 1) spans.push({ start: open.at + 1, end: runs[close].at });
        at = close;
    }
    return spans;
}

/** The counted spans of a text, outside its fenced code blocks. */
function backtickedPaths(text: string): Backticked[] {
    const found: Backticked[] = [];
    let fence: string | null = null;
    text.split(/\r\n|\r|\n/).forEach((line, row) => {
        const marked = FENCE.exec(line)?.[1];
        if (fence !== null) {
            const closes =
                marked !== undefined &&
                marked.startsWith(fence[0]) &&
                marked.length >= fence.length;
            if (closes && /^ {0,3}[`~]+\s*$/.test(line)) fence = null;
            return;
        }
        if (marked !== undefined) {
            fence = marked;
            return;
        }
        for (const { start, end } of spansOf(line)) {
            const span = line.slice(start, end);
            if (span === '' || /\s/.test(span) || !span.includes('/')) continue;
            if (span.includes('://') || NOT_A_PATH.test(span)) continue;
            const cut = span.search(/[:#]/);
            const path = (cut < 0 ? span : span.slice(0, cut)).replace(TRAILING, '');
            if (path === '') continue;
            const given = cut < 0 ? null : LINE_SUFFIX.exec(span.slice(cut));
            found.push({
                line: row,
                start,
                end: start + path.length,
                spanStart: start,
                spanEnd: end,
                path,
                target: given === null ? 1 : Math.max(1, Number(given[1]))
            });
        }
    });
    return found;
}

/** What is at a path, following links. */
export type Kind = 'file' | 'folder' | 'none';

/**
 * What the rule asks of the disk: what is at a path, and whether a name is at the top of the
 * root.
 */
export type Ground = { kind: (path: string) => Kind; top: (name: string) => boolean };

/** The disk as it is now; a name is at the top of the root by its exact spelling. */
export function diskGround(root: string): Ground {
    let names: Set<string> | null = null;
    return {
        kind: (path) => {
            try {
                return statSync(path).isDirectory() ? 'folder' : 'file';
            } catch {
                return 'none';
            }
        },
        top: (name) => {
            names ??= new Set(readdirSync(root).map((one) => normal(one)));
            return names.has(normal(name));
        }
    };
}

/**
 * The spans of a text that are paths in the root of the file, each with what it leads to. `file` is
 * the real path of the file the text is of; `ground` is the disk, or what the disk held before a
 * move when a rewrite asks where a path pointed.
 */
export function resolvedPaths(
    text: string,
    file: string,
    reach: Reach,
    ground: Ground = diskGround(reach.root.real)
): Resolved[] {
    const base = reach.root.real;
    const resolved: Resolved[] = [];
    for (const span of backtickedPaths(text)) {
        const first = span.path.split('/')[0];
        if (first === '' || first === '.' || first === '..' || !ground.top(first)) continue;
        const candidates = [
            { from: 'root' as const, real: resolve(base, span.path) },
            { from: 'folder' as const, real: resolve(dirname(file), span.path) }
        ];
        if (candidates.some((one) => withheld(one.real, reach))) continue;
        const inRoot = candidates.filter((one) => inside(one.real, base));
        const hit = inRoot.find((one) => ground.kind(one.real) !== 'none');
        const own = hit ?? inRoot.at(0);
        if (own === undefined) continue;
        resolved.push({
            ...span,
            real: hit === undefined ? null : hit.real,
            from: own.from,
            kind: hit === undefined ? 'none' : ground.kind(hit.real)
        });
    }
    return resolved;
}

/** The span at a position of a line, when it is inside the text between the backticks. */
export function spanAt(
    spans: readonly Resolved[],
    line: number,
    character: number
): Resolved | undefined {
    return spans.find(
        (one) => one.line === line && character >= one.spanStart && character <= one.spanEnd
    );
}
