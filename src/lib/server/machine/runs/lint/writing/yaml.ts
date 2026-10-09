// Layer 2, server. The marks of a YAML file: the banned characters of its text, comments and
// addresses aside (an address is left unmarked), each fix checked by parsing. The file is read with
// the `yaml` package the server reads every YAML file with.
//
// A YAML scalar is text with rules of its own, so a fix writes the scalar's own escaped form: `'`
// inside a single-quoted scalar is written `''`, and `"` inside a double-quoted scalar `\"`. Some
// fixes are never applied: a straight quote that would open a quoted scalar where a plain scalar
// starts, and `...` at the start of a line outside a quoted scalar, which ends the document.
//
// Every other fix is verified. The text with the fixes applied must parse without error to the
// value the file has now, each string of both read with the banned characters as their ASCII form
// (`sameValue`), so a fix that changes what the file says, or whether it parses, is a suggestion.
// All the fixes are tried together first; when they do not hold the set is halved until the parts
// that hold are found, and the parts must hold together. A file that does not parse as it is has
// no fix. The tries are at most `PARSES`; a fix not shown to hold within them is a suggestion.

import { parseAllDocuments, visit } from 'yaml';
import {
    asciiOf,
    demoted,
    holding,
    marksOf,
    withText,
    withoutUrls,
    type Mark
} from './characters.ts';
import { applied } from './markdown-blocks.ts';

/** The most parses a file's fixes may take to be verified. */
const PARSES = 128;

/** The value of every document of a text, or null when it does not parse. */
function valueOf(text: string): string | null {
    try {
        const documents = parseAllDocuments(text);
        if (documents.some((document) => document.errors.length > 0)) return null;
        return documents.map((document) => canonical(document.toJS())).join('\n---\n');
    } catch {
        return null;
    }
}

/** A value as text, every string with its banned characters as their ASCII form. */
function canonical(value: unknown): string {
    if (typeof value === 'string') return JSON.stringify(asciiOf(value));
    if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
    if (value instanceof Map) {
        const pairs = [...value].map(([key, one]) => `${canonical(key)}:${canonical(one)}`);
        return `{${pairs.join(',')}}`;
    }
    if (typeof value === 'object' && value !== null) {
        const pairs = Object.entries(value).map(
            ([key, one]) => `${canonical(key)}:${canonical(one)}`
        );
        return `{${pairs.join(',')}}`;
    }
    return `${typeof value}:${String(value)}`;
}

/** Whether two texts parse to the same value, the banned characters read as their ASCII form. */
export function sameValue(before: string, after: string): boolean {
    const was = valueOf(before);
    return was !== null && was === valueOf(after);
}

/** The scalars of a text with a style that decides how a quote is written. */
type Scalars = { from: number; to: number; type: string }[];

function scalarsOf(text: string): Scalars {
    const scalars: Scalars = [];
    for (const document of parseAllDocuments(text)) {
        visit(document, {
            Scalar(_key, node) {
                if (node.range && node.type) {
                    scalars.push({ from: node.range[0], to: node.range[1], type: node.type });
                }
            }
        });
    }
    return scalars.sort((a, b) => a.from - b.from);
}

/** The scalar whose value holds an offset, or null when the offset is not in a scalar. */
function scalarAt(scalars: Scalars, offset: number): Scalars[number] | null {
    let low = 0;
    let high = scalars.length - 1;
    while (low <= high) {
        const middle = Math.floor((low + high) / 2);
        const scalar = scalars[middle];
        if (offset < scalar.from) high = middle - 1;
        else if (offset >= scalar.to) low = middle + 1;
        else return scalar;
    }
    return null;
}

/** Whether `offset` is the first character of its line. */
function atLineStart(text: string, offset: number): boolean {
    return offset === 0 || text[offset - 1] === '\n' || text[offset - 1] === '\r';
}

/** The mark with its fix written in the form its scalar needs, or as a suggestion. */
function fitted(text: string, mark: Mark, scalars: Scalars): Mark {
    const fix = mark.fixes.at(0);
    if (fix?.kind !== 'fix') return mark;
    const scalar = scalarAt(scalars, mark.from);
    const quoted = scalar?.type === 'QUOTE_SINGLE' || scalar?.type === 'QUOTE_DOUBLE';
    const written = fix.edits[0].text;
    if (mark.code === 'ellipsis' && !quoted && atLineStart(text, mark.from)) return demoted(mark);
    if (mark.code !== 'curly-quote') return mark;
    if (scalar?.type === 'PLAIN' && scalar.from === mark.from) return demoted(mark);
    if (scalar?.type === 'QUOTE_SINGLE' && written === "'") return withText(mark, "''");
    if (scalar?.type === 'QUOTE_DOUBLE' && written === '"') return withText(mark, '\\"');
    return mark;
}

/** The marks of a YAML text. `arrows` is false where arrows are the surface's icons. */
export function yamlMarks(text: string, arrows: boolean): Mark[] {
    const marks = marksOf(text, withoutUrls(text, [[0, text.length]]), arrows);
    if (marks.length === 0) return marks;
    const before = valueOf(text);
    if (before === null)
        return marks.map((mark) => (mark.fixes[0]?.kind === 'fix' ? demoted(mark) : mark));
    const scalars = scalarsOf(text);
    const candidates = marks.map((mark) => fitted(text, mark, scalars));
    const fixes = candidates.filter((mark) => mark.fixes[0]?.kind === 'fix');
    let parses = 0;
    const holds = (some: readonly Mark[]): boolean => {
        if (parses >= PARSES) return false;
        parses += 1;
        const after = applied(
            text,
            some.flatMap((mark) => mark.fixes[0].edits)
        );
        return after !== null && valueOf(after) === before;
    };
    const kept = new Set(holding(fixes, holds));
    return candidates.map((mark) =>
        mark.fixes[0]?.kind === 'fix' && !kept.has(mark) ? demoted(mark) : mark
    );
}
