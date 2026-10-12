// Layer 1, data. A slide file cut into its slides.
//
// A slide file is an optional front matter and a body. The body is cut into slides at each line
// holding only `---` that is outside a fenced code block, of any fence length, and outside an HTML
// comment, including one that spans lines. A slide after a separator opens with its own front
// matter when the separator is followed directly, with no blank line, by lines and a closing line,
// the front matter rule of docs.ts, and those lines read as a YAML map with a key; lines that do
// not (a heading and a list, which YAML reads as a comment and a sequence) are the slide's body.
// The first slide's front matter is the file's, and is found by the same rule with the start of the
// file standing for the separator.
//
// A file with only a front matter is one slide, and a file with nothing in it is none. A slide with
// neither a front matter nor a body, such as the one a trailing separator leaves, is not a slide.
//
// Nothing here throws. A front matter that cannot be read as YAML at all is reported through
// `unreadable` and its lines stay in the slide's body, so the words of the slide are not lost.
//
// Each slide also says which lines of the file are its own (`SlideSpan`), so the edits of a slide
// file (deck/slide-text.ts) and the line a view opens a slide at cut the file where the reader
// cut it, by the one rule.

import { parseFrontmatter, splitFrontmatter } from '../documents/docs.ts';

/** One slide as the file holds it: its front matter, and the Markdown after it. */
export type RawSlide = {
    meta: Record<string, unknown> | null;
    body: string;
};

/**
 * The lines of a file one slide owns, 0-based. `before` is the separator line ahead of the slide,
 * which is the opener of its front matter when it has one, and -1 for the first slide of a file
 * that does not open with a separator. `first` is the slide's first line: that opener when the
 * slide has front matter, else its first body line. `end` is one past its last line, the next
 * separator or the end of the file.
 */
type SlideSpan = { before: number; first: number; end: number };

/** What a file was cut into, and whether its own front matter was YAML that does not parse. */
export type SlideFile = {
    slides: RawSlide[];
    /** The lines each slide owns, in the order of `slides`. */
    spans: SlideSpan[];
    /** The file's lines, line endings normalised to `\n`. */
    lines: string[];
    unreadable: boolean;
};

/** A line that is a separator and nothing else. */
const SEPARATOR = /^---[ \t]*$/;

/** The opening of a fenced code block: up to three spaces, then three or more of one mark. */
const FENCE = /^ {0,3}(`{3,}|~{3,})/;

/** What closes a fence: the same mark, at least as many, and nothing after it. */
const CLOSE = /^ {0,3}(`{3,}|~{3,})[ \t]*$/;

/** What each line of a file is for the cut: a separator, or anything else. */
export function separators(lines: string[]): boolean[] {
    const marks: boolean[] = [];
    let fence: { mark: string; length: number } | null = null;
    let comment = false;
    for (const line of lines) {
        let separator = false;
        if (comment) {
            if (line.includes('-->')) comment = false;
        } else if (fence !== null) {
            const closing = CLOSE.exec(line)?.[1];
            if (closing?.startsWith(fence.mark) === true && closing.length >= fence.length) {
                fence = null;
            }
        } else {
            const opening = FENCE.exec(line)?.[1];
            if (opening !== undefined) fence = { mark: opening[0], length: opening.length };
            else if (SEPARATOR.test(line)) separator = true;
            else {
                const open = line.lastIndexOf('<!--');
                comment = open >= 0 && !line.includes('-->', open);
            }
        }
        marks.push(separator);
    }
    return marks;
}

/** The text of lines, with the blank lines at both ends dropped. */
export function trimmed(lines: string[]): string {
    return lines
        .join('\n')
        .replace(/^\s*\n/, '')
        .trimEnd();
}

/** Cut one slide file into its slides. */
export function splitSlides(text: string): SlideFile {
    const lines = text.replace(/\r\n?/g, '\n').split('\n');
    const marks = separators(lines);
    const slides: RawSlide[] = [];
    const spans: SlideSpan[] = [];
    let unreadable = false;
    // A slide starts on the line after a separator; the first one on the first line of the file,
    // which stands for a separator when it is one.
    let start = marks[0] ? 1 : 0;
    let first = true;
    for (;;) {
        let meta: Record<string, unknown> | null = null;
        let from = start;
        const open = start > 0 ? start - 1 : 0;
        if ((start > 0 || marks[0]) && start < lines.length && lines[start].trim() !== '') {
            let close = start;
            while (close < lines.length && !marks[close]) close += 1;
            if (close < lines.length) {
                // The same rule as a document's: the separator, a block, and its closing line.
                const chunk = lines.slice(open, close + 1).join('\n');
                const { block, body } = splitFrontmatter(chunk);
                const read = block === null ? null : parseFrontmatter(block);
                if (read !== null && 'problem' in read) {
                    unreadable = unreadable || (first && read.problem === 'parse');
                } else if (read !== null && Object.keys(read.frontmatter).length > 0) {
                    meta = read.frontmatter;
                    const left = body === '' ? 0 : body.split('\n').length;
                    from = close + 1 - left;
                }
            }
        }
        let end = from;
        while (end < lines.length && !marks[end]) end += 1;
        const body = trimmed(lines.slice(from, end));
        if (meta !== null || body !== '') {
            slides.push({ meta, body });
            spans.push({ before: start - 1, first: meta === null ? from : open, end });
        }
        if (end >= lines.length) break;
        start = end + 1;
        first = false;
    }
    return { slides, spans, lines, unreadable };
}
