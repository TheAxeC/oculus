// Layer 2, server. The writing rules as a linter: the banned characters of the hub's writing rules
// and, in Markdown, paragraphs broken across lines, read from one file and answered as rows. It is
// the fifth linter of the lint route and runs no program (the route's `runWriting` calls this
// module with the file's text).
//
// The file kind is its extension. Markdown (markdown.ts) and YAML (yaml.ts) are read whole in the
// route's process. A code file is read for its comments and Python docstrings, which a grammar
// finds (comments.ts, in a worker thread): a file without a banned character is never sent to the
// thread, and one with some is sent up to the end of the last line that holds one, since a
// grammar's state only flows forward. A character in a comment is marked unless it is in an
// address; a character in code is not.
//
// A file is skipped, answering `off`, when a glob of `lint.writing_skip` matches its path from its
// root, and `glyphs.yml` is skipped whatever the setting holds, being the vocabulary of the glyphs
// the rules ban elsewhere. Arrows are not marked in a file a glob of `lint.writing_glyphs`
// matches, where they are the icons of a surface.
//
// A Python docstring's quote fix is offered, never applied, when the straight quote it writes is
// the character the docstring is delimited with.

import { basename, extname } from 'node:path';
import { globTest } from '../../../../../data/helpers/search/glob.ts';
import type { LintRow } from '../../../../../data/model/index.ts';
import type { LintSettings } from '../../../../../data/sources/config.ts';
import { sourceOf, type Source } from '../readers.ts';
import { demoted, lastBanned, marksOf, withoutUrls, type Mark, type Range } from './characters.ts';
import { languageOf, type CommentRange, type HeldComments } from './comments.ts';
import { markdownMarks } from './markdown.ts';
import { reasonOf, rowsOf } from './rows.ts';
import { yamlMarks } from './yaml.ts';

/** The name of the file that holds the glyphs the rules ban, which is never read. */
const GLYPHS_FILE = 'glyphs.yml';

/** What a file's reading came to: its rows, or the state it gave none in. */
export type WritingOutcome =
    { ok: true; rows: LintRow[] } | { ok: false; state: 'off' | 'failed'; reason?: string };

/** What the reading needs besides the file: the settings, the comment thread, the words. */
export type WritingOptions = {
    settings: LintSettings;
    comments: HeldComments;
    catalog: Record<string, string>;
    signal: AbortSignal;
};

/** Whether a path, from its root, is a file the writing rules do not read. */
export function isSkipped(path: string, settings: LintSettings): boolean {
    if (basename(path) === GLYPHS_FILE) return true;
    return settings.writingSkip.some((glob) => globTest(glob)(path));
}

/** Whether a path, from its root, is where arrows are icons and are left unmarked. */
function isGlyphSurface(path: string, settings: LintSettings): boolean {
    return settings.writingGlyphs.some((glob) => globTest(glob)(path));
}

/** Whether a file's text holds a character the rules mark there, read without the readers. */
export function holdsBanned(path: string, text: string, settings: LintSettings): boolean {
    return lastBanned(text, !isGlyphSurface(path, settings)) >= 0;
}

/** The end of the line that holds the text's last banned character, or 0 when none is. */
function endOfLastBanned(text: string, arrows: boolean): number {
    const last = lastBanned(text, arrows);
    if (last < 0) return 0;
    const lineEnd = /\r\n|\r|\n/g;
    lineEnd.lastIndex = last;
    return lineEnd.exec(text)?.index ?? text.length;
}

/** The quote a Python docstring is delimited with, or an empty string. */
function delimiterOf(text: string, range: CommentRange): string {
    return /["']/.exec(text.slice(range.from, range.to))?.[0] ?? '';
}

/** The marks of the comments of a code file, or why the thread could not read them. */
async function commentMarks(
    path: string,
    source: Source,
    arrows: boolean,
    options: WritingOptions
): Promise<{ marks: Mark[] } | { reason: string }> {
    const language = languageOf(path);
    const end = endOfLastBanned(source.text, arrows);
    if (language === null || end === 0) return { marks: [] };
    const read = await options.comments.read(source.text.slice(0, end), language, options.signal);
    if (!read.ok) return { reason: reasonOf(options.catalog, read.failure) };
    const open: Range[] = read.ranges.map((range) => [range.from, range.to]);
    const marks = marksOf(source.text, withoutUrls(source.text, open), arrows);
    const docstrings = read.ranges.filter((range) => range.docstring);
    return {
        marks: marks.map((mark) => {
            const fix = mark.fixes.at(0);
            const within = docstrings.find((one) => mark.from >= one.from && mark.from < one.to);
            if (within === undefined || fix?.kind !== 'fix' || mark.code !== 'curly-quote') {
                return mark;
            }
            return fix.edits[0].text === delimiterOf(source.text, within) ? demoted(mark) : mark;
        })
    };
}

/**
 * The rows of one file. `path` is the file's path from its root; `content` its bytes as text.
 * The run answers `off` for a skipped file, and `failed` with a sentence when a code file's
 * comments could not be read.
 */
export async function runWriting(
    path: string,
    content: string,
    options: WritingOptions
): Promise<WritingOutcome> {
    if (isSkipped(path, options.settings)) return { ok: false, state: 'off' };
    const source = sourceOf(content);
    const arrows = !isGlyphSurface(path, options.settings);
    const extension = extname(path).toLowerCase();
    let marks: Mark[];
    if (['.md', '.markdown', '.mkdown', '.mkd'].includes(extension)) {
        marks = markdownMarks(source.text, arrows).marks;
    } else if (['.yml', '.yaml'].includes(extension)) {
        marks = yamlMarks(source.text, arrows);
    } else {
        const found = await commentMarks(path, source, arrows, options);
        if ('reason' in found) return { ok: false, state: 'failed', reason: found.reason };
        marks = found.marks;
    }
    return { ok: true, rows: rowsOf(marks, source, options.catalog) };
}
