// Layer 1, data, pure. The text of a slide file edited one slide at a time: a slide copied after
// itself, a slide taken out, a line added at the end of a slide, and the text of a new slide.
//
// Every edit cuts the file where the reader cuts it (split.ts's spans), so the lines it moves are
// the lines the reader calls one slide, and each one reads its own result back with the reader: the
// slides of the edited text must be the slides of the original with the one change, or the edit
// answers null and the caller refuses. A slide with front matter owns the separator line before it,
// which is the opener of its front matter, so it travels with its text; a slide with none is cut
// from the separator ahead of it.

import { isDeepStrictEqual } from 'node:util';
import { splitSlides, type RawSlide } from './split.ts';

/** The line ending a file is written with, which the lines an edit adds use too. */
function newlineOf(text: string): string {
    return text.includes('\r\n') ? '\r\n' : '\n';
}

/** The lines joined as the file was, a final newline kept when the file had one. */
function joined(lines: string[], text: string): string {
    const kept = text.endsWith('\n') && lines.at(-1) !== '' ? [...lines, ''] : lines;
    return kept.join(newlineOf(text));
}

/** Whether the edited text reads as exactly these slides. */
function reads(edited: string, expected: RawSlide[]): boolean {
    return isDeepStrictEqual(splitSlides(edited).slides, expected);
}

/**
 * The slide copied right after itself, or null when the file has no such slide or cannot keep it.
 */
export function duplicateSlide(text: string, index: number): string | null {
    const file = splitSlides(text);
    const slide = file.slides.at(index);
    const span = file.spans.at(index);
    if (slide === undefined || span === undefined) return null;
    const own = file.lines.slice(span.first, span.end);
    const copy = slide.meta === null ? ['---', ...own] : own;
    const lines = [...file.lines.slice(0, span.end), ...copy, ...file.lines.slice(span.end)];
    const edited = joined(lines, text);
    return reads(edited, file.slides.toSpliced(index + 1, 0, slide)) ? edited : null;
}

/**
 * The file without one slide, or null when the file holds that slide alone (the file goes, not its
 * text) or the edit cannot keep the others. A slide after the first takes the separator before it
 * along. The first slide takes the lines up to the second slide's separator, which stays as the
 * file's opening line when the second slide has front matter (it is that front matter's opener)
 * and goes otherwise.
 */
export function deleteSlide(text: string, index: number): string | null {
    const file = splitSlides(text);
    const span = file.spans.at(index);
    if (span === undefined || file.slides.length < 2) return null;
    const next = file.slides.at(1);
    const from = index === 0 ? 0 : span.before;
    const to = index === 0 && next?.meta === null ? span.end + 1 : span.end;
    const edited = joined(file.lines.toSpliced(from, to - from), text);
    return reads(edited, file.slides.toSpliced(index, 1)) ? edited : null;
}

/**
 * The slide with `line` added after its last line of text, a blank line before it, or null when
 * the file has no such slide or cannot keep the others as they were.
 */
export function appendToSlide(text: string, index: number, line: string): string | null {
    const file = splitSlides(text);
    const slide = file.slides.at(index);
    const span = file.spans.at(index);
    if (slide === undefined || span === undefined) return null;
    let last = span.end - 1;
    while (last > span.first && file.lines[last].trim() === '') last -= 1;
    const lines = file.lines.toSpliced(last + 1, 0, '', line);
    const body = slide.body === '' ? line : `${slide.body}\n\n${line}`;
    const edited = joined(lines, text);
    return reads(edited, file.slides.toSpliced(index, 1, { ...slide, body })) ? edited : null;
}

/** The text of a new slide file: `kind: text` front matter and the heading. */
export function newSlideText(heading: string): string {
    return `---\nkind: text\n---\n# ${heading}\n`;
}

/**
 * A title as one line: each run of control characters, a tab and a line break among them, becomes
 * one space and the ends are trimmed.
 */
export function oneLine(title: string): string {
    let line = '';
    let inRun = false;
    for (const char of title) {
        const code = char.charCodeAt(0);
        const control = code < 32 || code === 127;
        if (!control) line += char;
        else if (!inRun) line += ' ';
        inRun = control;
    }
    return line.trim();
}

/** The text of a deck's `present.yml`: its title in a single-quoted scalar, and its slide files. */
export function presentText(title: string, files: string[]): string {
    const quoted = `'${title.replaceAll("'", "''")}'`;
    const order = files.map((file) => `    - ${file}`).join('\n');
    return `deck:\n    title: ${quoted}\n\norder:\n${order}\n`;
}

/** The text of a deck's closing slide: `kind: closing` front matter and the title as heading. */
export function closingText(title: string): string {
    return `---\nkind: closing\n---\n# ${title}\n`;
}
