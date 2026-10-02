// Layer 2, client state, pure. The Outline section's reading of a file: the headings of a Markdown
// file and the sectioning commands of a LaTeX file, each with its line and the depth it is nested
// at. Any other language has no symbols yet, which is a different answer from a file with no
// headings: the first says nothing is read for the language, the second that the file has none.
//
// A Markdown heading is a line of one to six `#` then a space, outside fenced code and outside a
// leading front matter block; its closing `#` run is not part of its text. A LaTeX heading is
// `\part` to `\subparagraph`, starred or not, with an optional short title, outside a `%` comment
// and outside a verbatim block; its text is the braces' content with lines joined.

/** One entry of the outline: its text, its line (from one), its level and its depth in the list. */
export type OutlineItem = { title: string; line: number; level: number; depth: number };

/**
 * The depth each heading is drawn at: one more than the nearest heading before it of a lower
 * level, so a skipped level (a `###` straight under a `#`) nests one step and not two.
 */
function nested(found: Omit<OutlineItem, 'depth'>[]): OutlineItem[] {
    const open: number[] = [];
    return found.map((one) => {
        while (open.length > 0 && open[open.length - 1] >= one.level) open.pop();
        open.push(one.level);
        return { ...one, depth: open.length - 1 };
    });
}

/** The lines of a leading front matter block (`---` to `---`), which hold no headings. */
function frontMatterEnd(lines: string[]): number {
    if (lines[0]?.trim() !== '---') return 0;
    const end = lines.findIndex((line, at) => at > 0 && /^(---|\.\.\.)\s*$/.test(line));
    return end < 0 ? 0 : end + 1;
}

/** The Markdown headings of a text: `#` to `######`, outside fenced code. */
export function markdownOutline(text: string): OutlineItem[] {
    const lines = text.split(/\r?\n/);
    const found: Omit<OutlineItem, 'depth'>[] = [];
    let fence: { char: string; size: number } | null = null;
    for (let at = frontMatterEnd(lines); at < lines.length; at += 1) {
        const line = lines[at];
        const opens = /^ {0,3}(`{3,}|~{3,})/.exec(line);
        if (fence !== null) {
            const closes = new RegExp(`^ {0,3}${fence.char}{${String(fence.size)},}\\s*$`);
            if (closes.test(line)) fence = null;
            continue;
        }
        if (opens !== null) {
            const run = opens[1];
            fence = { char: run[0], size: run.length };
            continue;
        }
        const heading = /^ {0,3}(#{1,6})[ \t]+(.*?)(?:[ \t]+#+)?[ \t]*$/.exec(line);
        const title = heading?.[2]?.trim() ?? '';
        if (heading === null || title === '') continue;
        found.push({ title, line: at + 1, level: heading[1].length });
    }
    return nested(found);
}

/** The LaTeX sectioning commands, from the outermost to the innermost. */
const LATEX_LEVELS = [
    'part',
    'chapter',
    'section',
    'subsection',
    'subsubsection',
    'paragraph',
    'subparagraph'
];

/** The environments whose lines hold no commands. */
const VERBATIM = ['verbatim', 'lstlisting', 'minted', 'comment'];

/** A line with its `%` comment taken off; a `%` after an odd run of backslashes is a letter. */
function uncommented(line: string): string {
    for (let at = 0; at < line.length; at += 1) {
        if (line[at] !== '%') continue;
        let slashes = 0;
        while (at - 1 - slashes >= 0 && line[at - 1 - slashes] === '\\') slashes += 1;
        if (slashes % 2 === 0) return line.slice(0, at);
    }
    return line;
}

/** The text between the brace opening at `from` and its match, or null when it never closes. */
function braced(text: string, from: number): string | null {
    let depth = 0;
    for (let at = from; at < text.length; at += 1) {
        const char = text[at];
        const escaped = at > 0 && text[at - 1] === '\\';
        if (char === '{' && !escaped) depth += 1;
        else if (char === '}' && !escaped) {
            depth -= 1;
            if (depth === 0) return text.slice(from + 1, at);
        }
    }
    return null;
}

/** The LaTeX sectioning commands of a text: `\part` to `\subparagraph`, outside comments. */
export function latexOutline(text: string): OutlineItem[] {
    let skipping: string | null = null;
    const kept = text.split(/\r?\n/).map((line) => {
        const code = uncommented(line);
        if (skipping !== null) {
            if (code.includes(`\\end{${skipping}}`)) skipping = null;
            return '';
        }
        const begun = VERBATIM.find((name) => code.includes(`\\begin{${name}}`));
        if (begun !== undefined && !code.includes(`\\end{${begun}}`)) {
            skipping = begun;
            return '';
        }
        return code;
    });
    const clean = kept.join('\n');
    const found: Omit<OutlineItem, 'depth'>[] = [];
    const command = new RegExp(
        `\\\\(${LATEX_LEVELS.join('|')})\\*?\\s*(?:\\[[^\\]\\n]*\\])?\\s*\\{`,
        'g'
    );
    for (let match = command.exec(clean); match !== null; match = command.exec(clean)) {
        const open = match.index + match[0].length - 1;
        const title = braced(clean, open)?.replace(/\s+/g, ' ').trim() ?? '';
        if (title === '') continue;
        found.push({
            title,
            line: clean.slice(0, match.index).split('\n').length,
            level: LATEX_LEVELS.indexOf(match[1]) + 1
        });
    }
    return nested(found);
}

/**
 * The outline of a file by its language, or null for a language that has no symbols yet. An empty
 * list is a Markdown or LaTeX file without headings.
 */
export function outlineOf(language: string, text: string): OutlineItem[] | null {
    if (language === 'markdown') return markdownOutline(text);
    if (language === 'latex') return latexOutline(text);
    return null;
}
