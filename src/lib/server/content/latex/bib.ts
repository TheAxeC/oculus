// Layer 2, server. The citations of a main file: the entries of every `.bib` file its closure holds
// (the files its `\bibliography` and `\addbibresource` name), read with latex-utensils' BibTeX
// parser through the shared reader of data/prose/bib.ts, for the citation browser.
//
// Each file is named in the answer against the served root, with each entry's line, so a pick can
// open it. A file too large to read, or one the parser refuses, is named in `unread` and gives no
// entries, so a half-read bibliography is never mistaken for a short one.

import { relative, sep } from 'node:path';
import { bibtexParser } from 'latex-utensils';
import { citesWith, type Cite } from '../../../data/prose/bib.ts';
import { readBounded } from './reader.ts';
import { closureOf } from './root.ts';

/** The largest `.bib` file read; a larger one is named in `unread`. */
const BIB_MAX_BYTES = 8 * 1024 * 1024;

/** One citation with the file it is in. */
type FileCite = Cite & { file: string };

/** The citations of a main file's bibliographies and the bibliographies that gave none. */
export type Citations = { entries: FileCite[]; unread: string[] };

/**
 * The citations of the `.bib` files in the closure of `main`, a real path inside `bound`, named
 * against `bound`. `folders` are the folders its build writes to, where its `.fls` may be.
 */
export function citationsOf(bound: string, main: string, folders: string[] = []): Citations {
    const entries: FileCite[] = [];
    const unread: string[] = [];
    for (const path of closureOf(bound, main, folders)) {
        if (!path.toLowerCase().endsWith('.bib')) continue;
        const name = relative(bound, path).split(sep).join('/');
        const text = readBounded(path, BIB_MAX_BYTES);
        const found =
            text === null ? null : citesWith((source) => bibtexParser.parse(source), text);
        if (found === null) {
            unread.push(name);
            continue;
        }
        entries.push(...found.map((cite) => ({ ...cite, file: name })));
    }
    return { entries, unread };
}
