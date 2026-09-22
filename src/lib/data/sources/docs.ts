// Layer 1, data. Reads one Markdown document, and reports which documents a project folder has.
// Server side only: it reads the filesystem and no client module may import it.
//
// The long documents stay out of the snapshot (DESIGN.md, "Layer 1, data"): the snapshot is a few
// hundred kilobytes because the READMEs are not in it, and a view that opens one asks the server
// for that one file. readDoc is what that request calls, and hub-level documents
// (HPC-UTwente-howto.md, RESEARCH-APPROACH.md, AGENT-APPROACH.md) go through it like any other.
// projectDocs is the cheap existence check a project card shows, and it opens no file. The one
// document the build does read is PRESENT.md, through sources/present.ts, which splits its front
// matter with splitFrontmatter below so the two readers agree on where a block ends.

import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { findingText, type TextCatalog } from '../helpers/finding-text.ts';
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
 * The four documents a project folder is asked about, in this order. Folder-relative, and every one
 * is a file: nothing under `attic/` is on the list, so an attic copy is never seen.
 */
export const PROJECT_DOCS = [
    { name: 'README.md', label: 'README' },
    { name: 'code/README.md', label: 'CODE' },
    { name: 'manuscript/main.pdf', label: 'PDF' },
    { name: 'manuscript/main.tex', label: 'TEX' }
];

/** The document marks follow labels: a future NOTES or DIARY is a document the reader owns. */
function marks(label: string): { human: boolean } {
    return { human: label === 'NOTES' || label === 'DIARY' };
}

/**
 * A `---` line at the very start of the file, the block up to the next line that is `---` or
 * `...`, and the rest. No `m` flag, so `^` is the start of the file and a `---` rule further down
 * a document is never mistaken for an opening delimiter. The block group either is empty or ends
 * in a newline, which is what puts the closing delimiter at the start of its own line and lets an
 * empty block (`---` immediately followed by `---`) split.
 */
const FRONTMATTER = /^---[ \t]*\r?\n((?:[\s\S]*?\r?\n)?)(?:---|\.\.\.)[ \t]*(?:\r?\n|$)/;

/**
 * One document split in two: the frontmatter block as it was written, null when the file opens with
 * no block, and everything after it. Text only, so a reader that wants the body of a file whose
 * block does not parse still has it.
 */
export function splitFrontmatter(text: string): { block: string | null; body: string } {
    const match = FRONTMATTER.exec(text);
    if (match === null) return { block: null, body: text };
    return { block: match[1], body: text.slice(match[0].length) };
}

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
export function readDoc(path: string, catalog: TextCatalog): DocRead {
    let text: string;
    try {
        text = readFileSync(path, 'utf8');
    } catch {
        return { file: path, key: '', message: findingText(catalog, 'findings.docs.missing') };
    }

    const { block, body } = splitFrontmatter(text);
    if (block === null) return { text, frontmatter: null };

    const read = readFrontmatter(block, path, catalog);
    if ('message' in read) return read;
    return { text: body, frontmatter: read.frontmatter };
}

/**
 * One frontmatter block as the map it holds, or the one problem that stopped it being read. An
 * empty block is no keys, the same as loadLocal reads an empty file.
 */
export function readFrontmatter(
    block: string,
    path: string,
    catalog: TextCatalog
): { frontmatter: Record<string, unknown> } | Finding {
    let parsed: unknown;
    try {
        parsed = parse(block) ?? {};
    } catch (error) {
        const message = error instanceof Error ? error.message.split('\n')[0] : String(error);
        return {
            file: path,
            key: 'frontmatter',
            message: findingText(catalog, 'findings.file.does_not_parse', message)
        };
    }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return {
            file: path,
            key: 'frontmatter',
            message: findingText(catalog, 'findings.file.not_a_map')
        };
    }
    return { frontmatter: parsed as Record<string, unknown> };
}

/**
 * Which of PROJECT_DOCS the folder has, one record per name in that order, whether present or not,
 * and when each was last written. No file is opened: it is the one stat per name the presence check
 * already made, so this stays cheap enough to run over every project on a rebuild. A directory
 * named like a document counts as absent. The mtime is what normalise reads a project's staleness
 * from: a document written after the project.yml is a manifest that is behind its own folder.
 */
export function projectDocs(folder: string): DocPresence[] {
    return PROJECT_DOCS.map(({ name, label }) => {
        const path = join(folder, name);
        const stat = fileStat(path);
        return { name, label, path, present: stat.present, mtime: stat.mtime, ...marks(label) };
    });
}
