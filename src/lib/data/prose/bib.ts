// Layer 1, data, pure. The one reader of BibTeX text: the entries a `.bib` file holds, for the
// citation browser, and the two rewrites of a `.bib` file the editor offers, Align (every entry
// laid out with its field names padded so the equals signs line up) and Sort (the entries ordered
// by citation key).
//
// Like the LaTeX reader (data/prose/latex.ts) it holds no parser. It takes latex-utensils'
// `bibtexParser.parse` as an argument, so the server binds the package with a static import and the
// page binds it through a dynamic import, which loads the package as a chunk of its own on first
// use. The rewrites work on the text: an entry's own text is replaced by its aligned layout, and a
// sort moves the entries between the places entries already stand at, so every comment, `@string`
// and `@preamble` stays exactly where it is and every field value is kept as it was written, its
// delimiters and its `#` joins included.

import type { bibtexParser as bp } from 'latex-utensils';

/** The parser the reader takes: latex-utensils' `bibtexParser.parse`. */
export type BibParse = (text: string) => bp.BibtexAst;

/**
 * One entry as the citation browser lists it: its key and type, the three fields it shows, its
 * line.
 */
export type Cite = {
    key: string;
    type: string;
    title: string;
    author: string;
    year: string;
    line: number;
};

/** One entry of the parse tree with its key and its place in the text. */
type Placed = { entry: bp.Entry; key: string; start: number; end: number };

/** The entries of a text in order with their places, or null when the parser refuses the text. */
function placedWith(parse: BibParse, text: string): Placed[] | null {
    try {
        const placed: Placed[] = [];
        for (const node of parse(text).content) {
            // `@string`, `@preamble` and `@comment` have no key and are no citation.
            if (!('internalKey' in node) || typeof node.internalKey !== 'string') continue;
            const { start, end } = node.location;
            placed.push({
                entry: node,
                key: node.internalKey,
                start: start.offset,
                end: end.offset
            });
        }
        return placed;
    } catch {
        return null;
    }
}

/** The text of a field value as written, and the empty string when the value has no place. */
function valueText(text: string, field: bp.Field): string {
    return text.slice(field.value.location.start.offset, field.value.location.end.offset);
}

/**
 * A value without its outer braces or quotes and with its inner braces cut, for one line of
 * listing.
 */
function shown(raw: string): string {
    const bare = raw.trim().replace(/^[{"]|[}"]$/g, '');
    return bare.replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();
}

/** The entries of a text for the citation browser, or null when the parser refuses the text. */
export function citesWith(parse: BibParse, text: string): Cite[] | null {
    const entries = placedWith(parse, text);
    if (entries === null) return null;
    return entries.map(({ entry, key }) => {
        const field = (name: string): string => {
            const found = entry.content.find((one) => one.name.toLowerCase() === name);
            return found === undefined ? '' : shown(valueText(text, found));
        };
        return {
            key,
            type: entry.entryType.toLowerCase(),
            title: field('title'),
            author: field('author'),
            year: field('year'),
            line: entry.location.start.line
        };
    });
}

/** The spaces of one indentation level in an aligned entry. */
const INDENT = '  ';

/** One entry laid out with its names padded to the longest one. */
function aligned(text: string, entry: bp.Entry, key: string): string {
    const width = Math.max(0, ...entry.content.map((field) => field.name.length));
    const rows = entry.content.map(
        (field) => `${INDENT}${field.name.padEnd(width)} = ${valueText(text, field)}`
    );
    const body = rows.length === 0 ? '' : `\n${rows.join(',\n')}\n`;
    return `@${entry.entryType}{${key},${body}}`;
}

/** The text with the given texts put where the entries were, in order, and everything else kept. */
function replaced(text: string, places: Placed[], texts: string[]): string {
    let out = '';
    let at = 0;
    places.forEach((place, index) => {
        out += text.slice(at, place.start) + texts[index];
        at = place.end;
    });
    return out + text.slice(at);
}

/** The text with every entry laid out aligned, or null when the parser refuses the text. */
function alignWith(parse: BibParse, text: string): string | null {
    const places = placedWith(parse, text);
    if (places === null) return null;
    return replaced(
        text,
        places,
        places.map(({ entry, key }) => aligned(text, entry, key))
    );
}

/** The text with its entries ordered by key, case ignored, or null when the parser refuses it. */
function sortWith(parse: BibParse, text: string): string | null {
    const places = placedWith(parse, text);
    if (places === null) return null;
    const order = places
        .map((place, index) => ({ index, key: place.key.toLowerCase() }))
        .sort((left, right) => left.key.localeCompare(right.key) || left.index - right.index);
    const own = places.map((place) => text.slice(place.start, place.end));
    return replaced(
        text,
        places,
        order.map((one) => own[one.index])
    );
}

/** The text sorted, then aligned, or null when the parser refuses it. */
function alignSortWith(parse: BibParse, text: string): string | null {
    const sorted = sortWith(parse, text);
    return sorted === null ? null : alignWith(parse, sorted);
}

/** What `import('latex-utensils')` gives: the package's named exports, or the CommonJS default. */
export type BibModule = {
    bibtexParser?: { parse: BibParse };
    default?: { bibtexParser: { parse: BibParse } };
};

/**
 * The rewrites of a `.bib` text a reader asks for; each answers null when the text does not parse.
 */
export type BibRewrites = {
    align: (text: string) => Promise<string | null>;
    sort: (text: string) => Promise<string | null>;
    alignSort: (text: string) => Promise<string | null>;
};

/** The rewrites over a parser loaded by `load` on the first call and never loaded twice. */
export function lazyRewrites(load: () => Promise<BibModule>): BibRewrites {
    let loading: Promise<BibParse> | null = null;
    const parsed = async (): Promise<BibParse> => {
        loading ??= load().then((loaded) => {
            const parser = loaded.bibtexParser ?? loaded.default?.bibtexParser;
            if (parser === undefined) throw new Error('latex-utensils holds no bibtexParser');
            return (text: string) => parser.parse(text);
        });
        return loading.catch((error: unknown) => {
            loading = null;
            throw error;
        });
    };
    return {
        align: async (text) => alignWith(await parsed(), text),
        sort: async (text) => sortWith(await parsed(), text),
        alignSort: async (text) => alignSortWith(await parsed(), text)
    };
}
