// Layer 1, data. Reads one Markdown document, and reports which documents a project folder has.
// Server side only: it reads the filesystem and no client module may import it.
//
// Neither function is called by the portfolio build. Documents stay out of the snapshot on
// purpose (DESIGN.md, "Layer 1, data"): the snapshot is a few hundred kilobytes because the READMEs
// are not in it, and a view that opens one asks the server for that one file. readDoc is what that
// request calls; projectDocs is the cheap existence check a project card shows, and it reads
// nothing. Hub-level documents (HPC-UTwente-howto.md, RESEARCH-APPROACH.md, AGENT-APPROACH.md) go
// through readDoc like any other.

import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import type { DocPresence, Finding } from '../model.ts';

/** One Markdown document: its body, and the leading YAML block when it had one. */
export type Doc = {
    /** The document with any frontmatter block removed. */
    text: string;
    frontmatter: Record<string, unknown> | null;
};

/** What readDoc gives back: the document, or the one problem that stopped it being read. */
export type DocRead = Doc | Finding;

/** Narrow a readDoc result. A Finding carries a message; a Doc carries text. */
export function isFinding(result: DocRead): result is Finding {
    return 'message' in result;
}

/**
 * The documents a project folder is asked about, in this order. Folder-relative, and every one is
 * a file: nothing under `attic/` is on the list, so an attic copy is never seen.
 */
export const PROJECT_DOCS = [
    'README.md',
    'PRESENT.md',
    'RESULTS.md',
    'code/README.md',
    'manuscript/main.pdf',
    'manuscript/main.tex'
];

/**
 * A `---` line at the very start of the file, the block up to the next line that is `---` or
 * `...`, and the rest. No `m` flag, so `^` is the start of the file and a `---` rule further down
 * a document is never mistaken for an opening delimiter. The block group either is empty or ends
 * in a newline, which is what puts the closing delimiter at the start of its own line and lets an
 * empty block (`---` immediately followed by `---`) split.
 */
const FRONTMATTER = /^---[ \t]*\r?\n((?:[\s\S]*?\r?\n)?)(?:---|\.\.\.)[ \t]*(?:\r?\n|$)/;

/** Whether the path is a file, and when it was last written; 0 for anything that is not one. */
function fileStat(path: string): { present: boolean; mtime: number } {
    try {
        const stat = statSync(path);
        return stat.isFile()
            ? { present: true, mtime: stat.mtimeMs }
            : { present: false, mtime: 0 };
    } catch {
        return { present: false, mtime: 0 };
    }
}

/**
 * Read one Markdown file and split a leading YAML frontmatter block when it has one. A file with
 * no block, which is every project README on the hub today, comes back whole with a null
 * frontmatter. A file that cannot be read, or whose block does not parse or does not parse to a
 * map, is a Finding; nothing here throws and nothing is repaired.
 */
export function readDoc(path: string): DocRead {
    let text: string;
    try {
        text = readFileSync(path, 'utf8');
    } catch {
        return { file: path, key: '', message: 'document does not exist' };
    }

    const match = FRONTMATTER.exec(text);
    if (match === null) return { text, frontmatter: null };

    let parsed: unknown;
    try {
        // An empty block parses to null; it means no keys, the same as loadLocal reads an empty file.
        parsed = parse(match[1]) ?? {};
    } catch (error) {
        const message = error instanceof Error ? error.message.split('\n')[0] : String(error);
        return { file: path, key: 'frontmatter', message: `does not parse: ${message}` };
    }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return { file: path, key: 'frontmatter', message: 'is not a map of keys' };
    }
    return {
        text: text.slice(match[0].length),
        frontmatter: parsed as Record<string, unknown>
    };
}

/**
 * Which of PROJECT_DOCS the folder has, one record per name in that order, whether present or not,
 * and when each was last written. No file is opened: it is the one stat per name the presence check
 * already made, so this stays cheap enough to run over every project on a rebuild. A directory
 * named like a document counts as absent. The mtime is what normalise reads a project's staleness
 * from: a document written after the project.yml is a manifest that is behind its own folder.
 */
export function projectDocs(folder: string): DocPresence[] {
    return PROJECT_DOCS.map((name) => {
        const path = join(folder, name);
        const stat = fileStat(path);
        return { name, path, present: stat.present, mtime: stat.mtime };
    });
}
