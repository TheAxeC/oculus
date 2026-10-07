// Layer 2, client state, pure. The Outline section's reading of a file: the headings of a Markdown
// file and the sectioning commands of a LaTeX file, each with its line and the depth it is nested
// at, and the headings of a rendered document (a Doc or a Markdown preview tab), each with the id
// the render gave it and the depth `markdownOutline` nests a heading at. Any other language has no
// symbols yet, which is a different answer from a file with no headings: the first says nothing is
// read for the language, the second that the file has none.
//
// A Markdown heading is a line of one to six `#` then a space, outside fenced code and outside a
// leading front matter block; its closing `#` run is not part of its text. A LaTeX heading is
// `\part` to `\subparagraph`, starred or not, with an optional short title, outside a `%` comment
// and outside a verbatim block; its text is the last braces' content with lines joined. The
// LaTeX reading is data/prose/latex.ts's, over a parser the page loads as a chunk of its own the
// first time a LaTeX file is outlined, so a LaTeX outline is an answer that arrives and a Markdown
// outline is one that is there. The reader that holds the loaded parser is the client state's
// (`latexReader`, made by createLatexReader), so no parser is held at module scope.

import type { RenderedHeading } from '../../../../data/model/index.ts';
import { lazyRewrites, type BibRewrites } from '../../../../data/prose/bib.ts';
import {
    lazyReader,
    lazyTree,
    scanSections,
    type LazyReader,
    type Section
} from '../../../../data/prose/latex.ts';

/** One entry of the outline: its text, its line (from one), its level and its depth in the list. */
export type OutlineItem = { title: string; line: number; level: number; depth: number };

/**
 * The depth each heading is drawn at: one more than the nearest heading before it of a lower
 * level, so a skipped level (a `###` straight under a `#`) nests one step and not two.
 */
function nested<T extends { level: number }>(found: T[]): (T & { depth: number })[] {
    const open: number[] = [];
    return found.map((one) => {
        while (open.length > 0 && open[open.length - 1] >= one.level) open.pop();
        open.push(one.level);
        return { ...one, depth: open.length - 1 };
    });
}

/** One heading of a rendered document: its words, the id the render gave it and its depth. */
export type OutlineHeading = { title: string; id: string; level: number; depth: number };

/** The headings of a rendered document, nested by level as the Markdown outline nests them. */
export function headingOutline(headings: readonly RenderedHeading[]): OutlineHeading[] {
    return nested(
        headings
            .filter((one) => one.text.trim() !== '')
            .map((one) => ({ title: one.text.trim(), id: one.id, level: one.level }))
    );
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

/**
 * The client state's LaTeX reader, which loads the parser on its first read: the sections and
 * includes of a text, its parse tree, and the rewrites of a `.bib` text.
 */
export type LatexReader = {
    read: LazyReader;
    tree: (text: string) => Promise<object | null>;
    bib: BibRewrites;
};

/**
 * A reader of LaTeX texts with latex-utensils, which it fetches once, on its first read. The client
 * state makes one and holds it.
 */
export function createLatexReader(): LatexReader {
    return {
        read: lazyReader(() => import('latex-utensils')),
        tree: lazyTree(() => import('latex-utensils')),
        bib: lazyRewrites(() => import('latex-utensils'))
    };
}

/** The outline items of a list of sections, nested by level. */
function itemsOf(sections: Section[]): OutlineItem[] {
    return nested(
        sections.map((one) => ({ title: one.title, line: one.line, level: one.level + 1 }))
    );
}

/**
 * The LaTeX sectioning commands of a text: `\part` to `\subparagraph`, read by the shared reader
 * (data/prose/latex.ts), so this list and the server's outline agree on what a heading is. A text
 * the parser refuses has the headings the reader's line scan finds. When the parser cannot be
 * loaded, the outline is that line scan's.
 */
export async function latexOutline(reader: LatexReader, text: string): Promise<OutlineItem[]> {
    try {
        return itemsOf((await reader.read(text)).sections);
    } catch {
        return itemsOf(scanSections(text));
    }
}

/**
 * Follows a text that changes: each `ask` starts a LaTeX outline and `deliver`s it unless a later
 * `ask`, or `stop`, came first, so an outline that arrives late never replaces a newer one.
 */
export function outlineFollower(
    reader: LatexReader,
    deliver: (items: OutlineItem[]) => void
): {
    ask: (text: string) => void;
    stop: () => void;
} {
    let turn = 0;
    return {
        ask(text) {
            turn += 1;
            const mine = turn;
            void latexOutline(reader, text).then((items) => {
                if (mine === turn) deliver(items);
            });
        },
        stop() {
            turn += 1;
        }
    };
}

/**
 * The outline of a file by its language, or null for a language that has no symbols yet or whose
 * outline arrives later (LaTeX, through `latexOutline`). An empty list is a Markdown file without
 * headings.
 */
export function outlineOf(language: string, text: string): OutlineItem[] | null {
    if (language === 'markdown') return markdownOutline(text);
    return null;
}
