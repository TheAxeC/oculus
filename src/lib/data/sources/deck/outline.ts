// Layer 1, data, pure. A Markdown file read as the outline of a talk: one slide for each level-1
// heading, written as the text of a slide file.
//
// The headings are found by the Markdown lexer, so a `#` line inside a fenced block, an indented
// code block or an HTML block is no heading, and a level-1 heading written as a line of text over
// `===` is one. A slide is its heading and everything after it up to the next level-1 heading.
// Text before the first heading becomes a title slide, and a file with no level-1 heading is one
// text slide.
//
// A line holding only `---` would cut a slide in the slide file's own format (split.ts), so each
// one in the text is rewritten before the slides are joined: the underline of a level-2 heading
// written as text over `---` makes it a `## ` heading, and any other such line becomes `***`, the
// same thematic break. The file's own YAML front matter is dropped. Slides are joined by a
// separator line with a blank line after it, so the lines that follow a separator are never read
// as that slide's front matter.

import { Lexer, type Token, type Tokens } from 'marked';
import { splitFrontmatter } from '../documents/docs.ts';
import { separators, trimmed } from './split.ts';

/** What a file makes of itself as a deck: its title, and the text of its slide file. */
export type Outline = { title: string; slides: string };

/** A line that cuts a slide file, as the reader finds it. */
const CUT = /^---[ \t]*$/;

/** The heading a level-2 or level-1 heading written over an underline is, as one `#` line. */
function atx(token: Tokens.Heading): string {
    return `${'#'.repeat(token.depth)} ${token.text.replace(/\s*\n\s*/g, ' ')}`;
}

/** Whether a heading token is written as a line of text over an underline. */
function underlined(token: Tokens.Heading): boolean {
    return !/^ {0,3}#/.test(token.raw);
}

/** The text of a token with every line the reader would cut at made safe. */
function safe(token: Token): string {
    if (token.type === 'heading' && underlined(token as Tokens.Heading)) {
        const trail = /\n*$/.exec(token.raw)?.[0] ?? '';
        return `${atx(token as Tokens.Heading)}${trail}`;
    }
    if (token.type === 'hr') {
        return token.raw
            .split('\n')
            .map((line) => (CUT.test(line) ? '***' : line))
            .join('\n');
    }
    return token.raw;
}

/** A slide's lines with any line the reader would cut at turned into a thematic break. */
function sealed(text: string): string {
    const lines = text.split('\n');
    const marks = separators(lines);
    return lines.map((line, at) => (marks[at] ? '***' : line)).join('\n');
}

/** The slide file text of a deck outlined from a Markdown file, and the deck's title. */
export function outlineOf(text: string, stem: string): Outline {
    const body = splitFrontmatter(text.replace(/\r\n?/g, '\n')).body;
    const slides: string[][] = [];
    const before: string[] = [];
    let title: string | null = null;
    for (const token of Lexer.lex(body)) {
        if (token.type === 'heading' && (token as Tokens.Heading).depth === 1) {
            const heading = token as Tokens.Heading;
            title ??= heading.text.trim() === '' ? null : heading.text.trim();
            slides.push([
                underlined(heading) ? safe(token) : heading.raw.replace(/[ \t]+(\n*)$/, '$1')
            ]);
            continue;
        }
        (slides.at(-1) ?? before).push(safe(token));
    }
    const name = title ?? stem;
    const own = (parts: string[]): string => sealed(trimmed(parts.join('').split('\n')));
    const made = slides.map(own);
    const preface = own(before);
    if (made.length === 0) {
        return { title: name, slides: `---\nkind: text\n---\n${preface}\n` };
    }
    if (preface !== '') {
        made.unshift(`---\nkind: title\n---\n# ${name}\n\n${preface}`);
    }
    return { title: name, slides: `${made.join('\n\n---\n\n')}\n` };
}
