// Layer 2, server. The plan of a folder's Fix All: which files under a folder the writing rules can
// fix, and the edits that fix them. The plan writes nothing; the page shows it, the reader ticks
// the files, and POST /api/ops `writing-fix` (server/files/fs/lsp-edit.ts) writes the ticked ones.
//
// The walk starts at a folder of a served root and lists the files the writing rules take. It does
// not follow a link, enter a `node_modules` folder or a folder whose name starts with a dot, or
// enter the `secrets` folder of every hub or `~/.oculus`, and a plan that starts in one of those,
// or under one, is refused with a sentence before any file is listed. The walk leaves out the files
// the server never writes (the machine's `local.yml`) and the files `lint.writing_skip` skips. A
// folder that holds more than `MAX_FILES` such files is refused with a sentence that names how many
// it holds.
//
// Each file is read by the same reader a tab's lint runs (writing.ts). Its edits are the first
// `kind: 'fix'` fix of each row, a fix whose edits cross an edit already taken left out, as Fix All
// in a tab takes them. The edits are applied to the text and the result is checked before the file
// is answered: a YAML file must parse to the value it has, and a Markdown file must lex to the same
// blocks. A file whose result fails the check is answered with no edits and the sentence that says
// so, and so are a file that could not be read and a file whose comments could not be read. A file
// with no fix is left out. A file larger than a write keeps a copy of is never given to the reader,
// which would hold the server's event loop: it is answered as too large when its text holds a
// character the rules mark, and left out otherwise; a file over the read limit (`TEXT_LIMIT`) is
// left out unread. The answer's edits are in the protocol's positions.

import { readdirSync, readFileSync, statSync, type Dirent } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';
import { homedir } from 'node:os';
import { hubDirs, privateFolders } from '../../../../../data/helpers/files/private-folders.ts';
import { HUB_ROOT } from '../../../../../data/helpers/hub-names.ts';
import { TEXT_LIMIT } from '../../../../../data/file-ops.ts';
import { isWholeText } from '../../../../../data/helpers/files/text-kind.ts';
import {
    lintersOf,
    type LintFolderAnswer,
    type LintFolderFile,
    type LintRow
} from '../../../../../data/model/index.ts';
import type { LintSettings } from '../../../../../data/sources/config.ts';
import { applyTextEdits, type TextEdit } from '../../../../../data/prose/text-edits.ts';
import { hashOf, splitMark } from '../../../../core/file-bytes.ts';
import { realPath, under } from '../../../../core/paths.ts';
import { words } from '../../../../core/words.ts';
import { copyLimit } from '../../../../files/fs/history.ts';
import type { Root } from '../../../../files/files.ts';
import { splitFrontmatter } from '../../../../../data/sources/docs.ts';
import { shapeOfText } from './markdown-blocks.ts';
import { holdsBanned, isSkipped, runWriting, type WritingOptions } from './writing.ts';
import { sameValue } from './yaml.ts';

/** The most files a folder may hold that the writing rules take. */
const MAX_FILES = 2000;

/** What a plan runs over: the roots, the settings, the comment thread, the words, the guard. */
export type FolderScope = {
    roots: Root[];
    settings: LintSettings;
    comments: WritingOptions['comments'];
    catalog: Record<string, string>;
    /** Whether a real path is a file the server never writes. */
    isProtected: (real: string) => boolean;
};

/** Whether a position of the editor is before another. */
function before(a: { line: number; column: number }, b: { line: number; column: number }): boolean {
    return a.line < b.line || (a.line === b.line && a.column < b.column);
}

/** The edits Fix All takes from a file's rows, and how many fixes they make. */
function editsOf(rows: readonly LintRow[]): { edits: TextEdit[]; count: number } {
    const taken: LintRow['fixes'][number]['edits'] = [];
    const edits: TextEdit[] = [];
    let count = 0;
    for (const row of rows) {
        const fix = row.fixes.find((one) => one.kind === 'fix');
        if (fix === undefined) continue;
        const crosses = fix.edits.some((edit) =>
            taken.some(
                (held) =>
                    before(edit, { line: held.endLine, column: held.endColumn }) &&
                    before(
                        { line: held.line, column: held.column },
                        { line: edit.endLine, column: edit.endColumn }
                    )
            )
        );
        if (crosses) continue;
        taken.push(...fix.edits);
        count += 1;
        for (const edit of fix.edits) {
            edits.push({
                range: {
                    start: { line: edit.line - 1, character: edit.column - 1 },
                    end: { line: edit.endLine - 1, character: edit.endColumn - 1 }
                },
                newText: edit.text
            });
        }
    }
    return { edits, count };
}

/** The sentence for a file whose result is not the file it was, or null when the result holds. */
function checkedResult(
    path: string,
    text: string,
    edits: TextEdit[],
    catalog: Record<string, string>
): string | null {
    const result = applyTextEdits(text, edits);
    if (!result.ok) return words(catalog, 'lint.writing_folder_unapplied');
    const extension = extname(path).toLowerCase();
    if (extension === '.yml' || extension === '.yaml') {
        return sameValue(text, result.text) ? null : words(catalog, 'lint.writing_folder_unparsed');
    }
    if (['.md', '.markdown', '.mkdown', '.mkd'].includes(extension)) {
        const same =
            shapeOfText(splitFrontmatter(text).body) ===
            shapeOfText(splitFrontmatter(result.text).body);
        return same ? null : words(catalog, 'lint.writing_folder_blocks');
    }
    return null;
}

/** The files under a folder, links not followed and the folders the walk never enters left out. */
function filesUnder(folder: string, withheld: readonly string[]): string[] {
    const found: string[] = [];
    let entries: Dirent[];
    try {
        entries = readdirSync(folder, { withFileTypes: true }).sort((a, b) =>
            a.name.localeCompare(b.name)
        );
    } catch {
        return found;
    }
    for (const entry of entries) {
        const full = join(folder, entry.name);
        if (entry.isSymbolicLink()) continue;
        if (entry.isFile()) found.push(full);
        else if (
            entry.isDirectory() &&
            entry.name !== 'node_modules' &&
            !entry.name.startsWith('.') &&
            !under(full, withheld)
        ) {
            found.push(...filesUnder(full, withheld));
        }
    }
    return found;
}

/** One file's entry of the plan, or null when the file has nothing to fix. */
async function entryOf(
    path: string,
    real: string,
    scope: FolderScope,
    signal: AbortSignal
): Promise<LintFolderFile | null> {
    const refusal = (reason: string, hash: string): LintFolderFile => ({
        path,
        hash,
        count: 0,
        edits: [],
        reason
    });
    let bytes: Buffer;
    let content: string;
    try {
        if (statSync(real).size > TEXT_LIMIT) return null;
        bytes = readFileSync(real);
        content = bytes.toString('utf8');
    } catch {
        return refusal(words(scope.catalog, 'lint.writing_folder_unread'), '');
    }
    if (!isWholeText(bytes)) return null;
    if (bytes.length > copyLimit('writing-fix')) {
        return holdsBanned(path, content, scope.settings)
            ? refusal(words(scope.catalog, 'lint.writing_folder_large'), hashOf(bytes))
            : null;
    }
    const ran = await runWriting(path, content, { ...scope, signal });
    if (!ran.ok) return ran.state === 'failed' ? refusal(ran.reason ?? '', hashOf(bytes)) : null;
    const { edits, count } = editsOf(ran.rows);
    if (count === 0) return null;
    const text = splitMark(bytes).body.toString('utf8');
    const failure = checkedResult(path, text, edits, scope.catalog);
    return failure === null
        ? { path, hash: hashOf(bytes), count, edits }
        : refusal(failure, hashOf(bytes));
}

/**
 * The plan of a folder: the files under it the writing rules can fix. `real` is the folder's real
 * path and `rootReal` its root's. A folder that holds more than `MAX_FILES` files the rules take is
 * refused with a sentence.
 */
export async function planFolder(
    scope: FolderScope,
    folder: { real: string; rootReal: string },
    signal: AbortSignal
): Promise<LintFolderAnswer> {
    const first = scope.roots.find((one) => one.key === HUB_ROOT);
    const placed = (dir: string): string => realPath(dir) ?? dir;
    const withheld = privateFolders(
        hubDirs(
            first === undefined ? null : placed(first.dir),
            scope.roots.map((one) => ({ dir: placed(one.dir), hub: one.hub }))
        ),
        homedir()
    );
    if (under(folder.real, withheld)) {
        return { ok: false, reason: words(scope.catalog, 'lint.writing_folder_private') };
    }
    const taken = filesUnder(folder.real, withheld).flatMap((real) => {
        const path = relative(folder.rootReal, real).split(sep).join('/');
        const takes = lintersOf(path).includes('writing') && !isSkipped(path, scope.settings);
        return takes && !scope.isProtected(real) ? [{ path, real }] : [];
    });
    if (taken.length > MAX_FILES) {
        return {
            ok: false,
            reason: words(scope.catalog, 'lint.writing_folder_too_many', taken.length, MAX_FILES)
        };
    }
    const files: LintFolderFile[] = [];
    for (const one of taken) {
        if (signal.aborted)
            return { ok: false, reason: words(scope.catalog, 'lint.writing_folder_stopped') };
        await new Promise<void>((resolve) => setImmediate(resolve));
        const entry = await entryOf(one.path, one.real, scope, signal);
        if (entry !== null) files.push(entry);
    }
    return { ok: true, files };
}
