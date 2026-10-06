// Layer 3, primitive. The folding of the languages whose blocks are braces and for which Monaco
// ships no language service: C, C++, Java, Dart, R and rite. Without a provider Monaco folds them
// by indentation, which gives sticky scroll and the folding gutter nothing for a block whose body
// is not indented. A range runs from the line of a `{` that is not closed on its line to the line
// before its matching `}`; a block of fewer than two lines gives none. Braces inside strings and
// comments are not counted, by each language's own rules. In C++ a line holding only `public:`,
// `protected:` or `private:` opens a range to the line before the next such label of the same
// block, or before the block's closing brace.
//
// While a language server serves a model its folding ranges are the ones used (clangd's), and the
// braces answer nothing for it: Monaco joins the ranges of every provider of a language, so two
// answers for one block would be drawn twice. Monaco is told to ask again when what is served
// changes.

import type * as Monaco from 'monaco-editor';

/** One folding range, from its first line to its last, both counted from one. */
export type FoldingRange = { start: number; end: number };

/** How a language writes the text that holds no braces. */
type Lexicon = {
    /** What starts a comment that runs to the end of the line. */
    line: string;
    /** Whether block comments, between a slash and a star, run over lines. */
    block: boolean;
    /** The characters that quote a string or a character. */
    quotes: string;
};

const C_FAMILY: Lexicon = { line: '//', block: true, quotes: '"\'' };

const LEXICONS: Readonly<Record<string, Lexicon>> = {
    c: C_FAMILY,
    cpp: C_FAMILY,
    java: C_FAMILY,
    dart: C_FAMILY,
    r: { line: '#', block: false, quotes: '"\'' },
    rite: { line: ';', block: false, quotes: '"' }
};

/** The languages the provider is registered for. */
export const FOLDING_LANGUAGES: readonly string[] = Object.keys(LEXICONS);

/** The access labels of C++, each of which opens a range of its own. */
const LABELS: readonly string[] = ['public:', 'protected:', 'private:'];

/** A brace block still open: its first line, and the line of its latest access label. */
type Open = { start: number; label: number | null };

/** The braces of one line, in order, with whether a block comment is still open at its end. */
function bracesOf(
    text: string,
    lexicon: Lexicon,
    inBlock: boolean
): { braces: ('{' | '}')[]; inBlock: boolean } {
    const braces: ('{' | '}')[] = [];
    let at = 0;
    let comment = inBlock;
    while (at < text.length) {
        if (comment) {
            const close = text.indexOf('*/', at);
            if (close === -1) return { braces, inBlock: true };
            comment = false;
            at = close + 2;
            continue;
        }
        const char = text[at];
        if (text.startsWith(lexicon.line, at)) break;
        if (lexicon.block && text.startsWith('/*', at)) {
            comment = true;
            at += 2;
        } else if (lexicon.quotes.includes(char)) {
            at += 1;
            while (at < text.length && text[at] !== char) at += text[at] === '\\' ? 2 : 1;
            at += 1;
        } else {
            if (char === '{' || char === '}') braces.push(char);
            at += 1;
        }
    }
    return { braces, inBlock: comment };
}

/** The folding ranges of a language's lines, ordered by first line, wider ranges first. */
export function foldingRanges(language: string, lines: readonly string[]): FoldingRange[] {
    const lexicon = Object.hasOwn(LEXICONS, language) ? LEXICONS[language] : null;
    if (lexicon === null) return [];
    const ranges: FoldingRange[] = [];
    const opened: Open[] = [];
    const add = (start: number, end: number): void => {
        if (end > start) ranges.push({ start, end });
    };
    let inBlock = false;
    lines.forEach((text, at) => {
        const line = at + 1;
        const top = opened.at(-1);
        if (language === 'cpp' && !inBlock && top !== undefined && LABELS.includes(text.trim())) {
            if (top.label !== null) add(top.label, line - 1);
            top.label = line;
        }
        const found = bracesOf(text, lexicon, inBlock);
        inBlock = found.inBlock;
        for (const brace of found.braces) {
            if (brace === '{') {
                opened.push({ start: line, label: null });
                continue;
            }
            const closed = opened.pop();
            if (closed === undefined) continue;
            if (closed.label !== null) add(closed.label, line - 1);
            add(closed.start, line - 1);
        }
    });
    return ranges.sort((one, two) => one.start - two.start || two.end - one.end);
}

/** Which models a language server serves, and the call that hears it change. */
export type FoldingServed = {
    has(model: Monaco.editor.ITextModel): boolean;
    onChange(listener: () => void): { dispose(): void };
};

/** Register the folding of each language of `FOLDING_LANGUAGES` with Monaco. */
export function registerFolding(
    monaco: Pick<typeof Monaco, 'languages'>,
    served?: FoldingServed
): Monaco.IDisposable {
    const registered = FOLDING_LANGUAGES.map((language) => {
        const provider: Monaco.languages.FoldingRangeProvider = {
            onDidChange: (listener) =>
                served?.onChange(() => {
                    listener(provider);
                }) ?? { dispose: () => undefined },
            provideFoldingRanges: (model) =>
                served?.has(model) === true
                    ? []
                    : foldingRanges(model.getLanguageId(), model.getLinesContent())
        };
        return monaco.languages.registerFoldingRangeProvider(language, provider);
    });
    return { dispose: () => registered.forEach((one) => one.dispose()) };
}
