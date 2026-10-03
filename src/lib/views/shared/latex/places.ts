// Layer 3, shared view partial. What the LaTeX rows open and say, apart from the markup so the
// choices can be read without a rendering: the file and line a problem opens, the order the
// problems are listed in, the words that say where a problem is, and the log a build left beside
// its main file.

import type { LatexIssue } from '$lib/state/sessions/latex.svelte';
import { normalisePath } from '$lib/state/sources/fs';
import { t } from '$lib/state/shared/words/text';
import type { SourceFile } from '../links/source-file';

/** One problem of a list, with its severity. */
export type Problem = { issue: LatexIssue; severity: 'error' | 'warning' };

/** The problems of a build in the order they are listed: every error, then every warning. */
export function problemRows(errors: LatexIssue[], warnings: LatexIssue[]): Problem[] {
    return [
        ...errors.map((issue): Problem => ({ issue, severity: 'error' })),
        ...warnings.map((issue): Problem => ({ issue, severity: 'warning' }))
    ];
}

/**
 * The file a press on a problem opens, and the line it opens at. A problem that names no file is
 * the main file's; one that names no line opens the top of its file.
 */
export function problemFile(issue: LatexIssue, root: string, mainPath: string): SourceFile {
    const path = issue.file === '' ? mainPath : issue.file;
    return issue.line === null ? { root, path } : { root, path, line: issue.line };
}

/** Where a problem is, as far as the log said: the file and the line, one of them, or neither. */
export function placeOf(issue: LatexIssue): string {
    if (issue.file !== '' && issue.line !== null) return t('latex.at', issue.file, issue.line);
    if (issue.file !== '') return issue.file;
    return issue.line === null ? '' : t('latex.at_line', issue.line);
}

/** A name in the folder `dir` of a root, both against the root; the root's own folder is empty. */
export function inFolder(dir: string, name: string): string {
    return normalisePath(`${dir}/${name}`);
}

/** The log latexmk wrote beside a main file of the folder `dir`, as the file a press opens. */
export function logFile(root: string, dir: string, main: string): SourceFile {
    return { root, path: inFolder(dir, `${main.replace(/\.tex$/i, '')}.log`) };
}
