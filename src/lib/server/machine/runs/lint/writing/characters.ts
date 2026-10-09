// Layer 2, server. The characters the hub's writing rules ban, found in the ranges of a text that
// are open to marks, each with its fixes. The six classes are the ellipsis character, the curly
// quotes, the non-breaking spaces (U+00A0 and U+202F), the en dash, the em dash and the arrows.
// This module reads text and nothing else; which ranges of a file are prose (a Markdown file's
// text outside its code, a YAML file's text outside its URLs, a code file's comments) is the
// business of markdown.ts, yaml.ts and comments.ts, and the catalog words of the rows are
// rows.ts's.
//
// Every offset is into the text as the editor holds it (no byte order mark), in UTF-16 units, and
// a range ends before its second offset. One character is one mark. A mark carries its fixes in
// the order they are offered:
//
// - A fix (`kind: 'fix'`) is exact and is what Fix All applies: the ellipsis to `...`, a curly
//   single quote to `'` and a curly double quote to `"`, a non-breaking space to a space, an en
//   dash with no space on either side (`2<en dash>4`, `Kaplan<en dash>Meier`) to `-`, and an
//   arrow that has an ASCII form to it (`->`, `=>`, `<-`, `<->`, `<=>`).
// - A suggestion (`kind: 'suggestion'`) is offered and never applied by Fix All: the three
//   rewordings of a dash (the dash and the spaces around it replaced by `, `, `: ` or `; `), which
//   an em dash and an en dash between spaces or at the edge of a line have in place of a fix, and
//   the word ` to ` for an arrow that has an ASCII form.
// - An arrow with no ASCII form (any other character of the arrow blocks) has neither.
//
// A caller that knows more than the text does (a YAML scalar that is quoted, a Python docstring
// that a quote would end) changes a mark's fix with `withText` or turns it into a suggestion with
// `demoted`.

/** A range of a text, the end not included. */
export type Range = readonly [number, number];

/** One replacement in a text: the range `from` to `to` becomes `text`. */
export type Replacement = { from: number; to: number; text: string };

/** The catalog sentence a mark or a fix says, by its key under `lint.` and its arguments. */
export type Line = { id: LineId; args?: (string | number)[] };

/** The catalog keys of the writing rules' sentences, each under `lint.` in the catalog. */
type LineId =
    | 'writing_message_em_dash'
    | 'writing_message_en_dash'
    | 'writing_message_en_dash_range'
    | 'writing_message_curly_quote'
    | 'writing_message_ellipsis'
    | 'writing_message_arrow'
    | 'writing_message_arrow_other'
    | 'writing_message_nbsp'
    | 'writing_message_wrapped'
    | 'writing_fix_ellipsis'
    | 'writing_fix_quote_single'
    | 'writing_fix_quote_double'
    | 'writing_fix_nbsp'
    | 'writing_fix_hyphen'
    | 'writing_fix_arrow'
    | 'writing_fix_join'
    | 'writing_suggest_comma'
    | 'writing_suggest_colon'
    | 'writing_suggest_semicolon'
    | 'writing_suggest_arrow';

/** The `code` of a row. */
type WritingCode =
    'em-dash' | 'en-dash' | 'curly-quote' | 'ellipsis' | 'arrow' | 'nbsp' | 'wrapped-paragraph';

/** A fix or a suggestion of a mark: its title and the replacements it makes together. */
type MarkFix = { kind: 'fix' | 'suggestion'; title: Line; edits: Replacement[] };

/** One thing the writing rules mark: a range of the text, its code, its message and its fixes. */
export type Mark = {
    from: number;
    to: number;
    code: WritingCode;
    message: Line;
    fixes: MarkFix[];
};

/** The ASCII form of each arrow that has one. */
const ASCII_ARROWS: Partial<Record<string, string>> = {
    '\u2192': '->',
    '\u27f6': '->',
    '\u21d2': '=>',
    '\u27f9': '=>',
    '\u2190': '<-',
    '\u27f5': '<-',
    '\u2194': '<->',
    '\u27f7': '<->',
    '\u21d4': '<=>',
    '\u27fa': '<=>'
};

const ARROW_BLOCKS = '\u2190-\u21ff\u27f0-\u27ff\u2900-\u297f';
const BANNED = `\u2026\u2018\u2019\u201c\u201d\u00a0\u202f\u2013\u2014`;

/** The characters of every class, a fresh expression with its own position per call. */
function bannedExpression(arrows: boolean): RegExp {
    return new RegExp(`[${BANNED}${arrows ? ARROW_BLOCKS : ''}]`, 'g');
}

/** The offset of the last character of any class in a text, the arrows counting only where
 * `arrows`; -1 when it holds none. */
export function lastBanned(text: string, arrows: boolean): number {
    let last = -1;
    for (const found of text.matchAll(bannedExpression(arrows))) last = found.index;
    return last;
}

/** The text with each character of the classes written as its ASCII form, which a fix writes. */
export function asciiOf(text: string): string {
    return text.replace(new RegExp(`[${BANNED}${ARROW_BLOCKS}]`, 'g'), (one) => {
        switch (one) {
            case '\u2026':
                return '...';
            case '\u2018':
            case '\u2019':
                return "'";
            case '\u201c':
            case '\u201d':
                return '"';
            case '\u00a0':
            case '\u202f':
                return ' ';
            case '\u2013':
                return '-';
            default:
                return ASCII_ARROWS[one] ?? one;
        }
    });
}

/** A space for the rules of the en dash: a blank, a line end, a non-breaking space, or the edge. */
function isSpace(char: string | undefined): boolean {
    return char === undefined || /[ \t\r\n\u00a0\u202f]/.test(char);
}

/** The offset the spaces and tabs before `at` start at, never past `floor`. */
function blanksBefore(text: string, at: number, floor: number): number {
    let start = at;
    while (start > floor && (text[start - 1] === ' ' || text[start - 1] === '\t')) start -= 1;
    return start;
}

/** The offset the spaces and tabs from `at` end at, never past `ceiling`. */
function blanksAfter(text: string, at: number, ceiling: number): number {
    let end = at;
    while (end < ceiling && (text[end] === ' ' || text[end] === '\t')) end += 1;
    return end;
}

/** The three rewordings of a dash, each replacing the dash and the blanks around it. */
function dashSuggestions(text: string, at: number, bounds: Range): MarkFix[] {
    const from = blanksBefore(text, at, bounds[0]);
    const to = blanksAfter(text, at + 1, bounds[1]);
    const lineEnds = to >= text.length || text[to] === '\n' || text[to] === '\r';
    const rest = lineEnds ? '' : ' ';
    const make = (id: LineId, mark: string): MarkFix => ({
        kind: 'suggestion',
        title: { id },
        edits: [{ from, to, text: `${mark}${rest}` }]
    });
    return [
        make('writing_suggest_comma', ','),
        make('writing_suggest_colon', ':'),
        make('writing_suggest_semicolon', ';')
    ];
}

/** A fix replacing the one character at `at` with `text`. */
function replacing(at: number, title: Line, text: string): MarkFix {
    return { kind: 'fix', title, edits: [{ from: at, to: at + 1, text }] };
}

/** The mark of the character `char` at `at`, `bounds` being the range it was found in. */
function markOf(text: string, at: number, char: string, bounds: Range): Mark {
    const range = { from: at, to: at + 1 };
    switch (char) {
        case '\u2026':
            return {
                ...range,
                code: 'ellipsis',
                message: { id: 'writing_message_ellipsis' },
                fixes: [replacing(at, { id: 'writing_fix_ellipsis' }, '...')]
            };
        case '\u2018':
        case '\u2019':
            return {
                ...range,
                code: 'curly-quote',
                message: { id: 'writing_message_curly_quote' },
                fixes: [replacing(at, { id: 'writing_fix_quote_single' }, "'")]
            };
        case '\u201c':
        case '\u201d':
            return {
                ...range,
                code: 'curly-quote',
                message: { id: 'writing_message_curly_quote' },
                fixes: [replacing(at, { id: 'writing_fix_quote_double' }, '"')]
            };
        case '\u00a0':
        case '\u202f':
            return {
                ...range,
                code: 'nbsp',
                message: { id: 'writing_message_nbsp' },
                fixes: [replacing(at, { id: 'writing_fix_nbsp' }, ' ')]
            };
        case '\u2013':
            if (!isSpace(text[at - 1]) && !isSpace(text[at + 1])) {
                return {
                    ...range,
                    code: 'en-dash',
                    message: { id: 'writing_message_en_dash_range' },
                    fixes: [replacing(at, { id: 'writing_fix_hyphen' }, '-')]
                };
            }
            return {
                ...range,
                code: 'en-dash',
                message: { id: 'writing_message_en_dash' },
                fixes: dashSuggestions(text, at, bounds)
            };
        case '\u2014':
            return {
                ...range,
                code: 'em-dash',
                message: { id: 'writing_message_em_dash' },
                fixes: dashSuggestions(text, at, bounds)
            };
        default:
            return arrowMark(text, at, char, bounds);
    }
}

/** The mark of an arrow: a fix and the word `to` when it has an ASCII form, else neither. */
function arrowMark(text: string, at: number, char: string, bounds: Range): Mark {
    const ascii = ASCII_ARROWS[char];
    const range = { from: at, to: at + 1, code: 'arrow' as const };
    if (ascii === undefined) {
        return { ...range, message: { id: 'writing_message_arrow_other' }, fixes: [] };
    }
    const from = blanksBefore(text, at, bounds[0]);
    const to = blanksAfter(text, at + 1, bounds[1]);
    return {
        ...range,
        message: { id: 'writing_message_arrow', args: [ascii] },
        fixes: [
            replacing(at, { id: 'writing_fix_arrow', args: [ascii] }, ascii),
            {
                kind: 'suggestion',
                title: { id: 'writing_suggest_arrow' },
                edits: [{ from, to, text: ' to ' }]
            }
        ]
    };
}

/**
 * The marks of every character of the classes inside the open ranges of a text, in the order of
 * the text. The arrows are marked only where `arrows` is true. `open` is sorted and its ranges do
 * not overlap.
 */
export function marksOf(text: string, open: readonly Range[], arrows: boolean): Mark[] {
    const marks: Mark[] = [];
    for (const range of open) {
        const inside = text.slice(range[0], range[1]);
        for (const found of inside.matchAll(bannedExpression(arrows))) {
            marks.push(markOf(text, range[0] + found.index, found[0], range));
        }
    }
    return marks;
}

/** An address as the rules leave it unmarked: `http` or `https` up to a blank, quote or bracket. */
const URL = /https?:\/\/[^\s"'<>)\]]*/g;

/** The ranges with the addresses in `text` taken out. */
export function withoutUrls(text: string, open: readonly Range[]): Range[] {
    const holes: Range[] = [];
    for (const found of text.matchAll(URL))
        holes.push([found.index, found.index + found[0].length]);
    return without(open, holes);
}

/** The ranges of `open` with the ranges of `holes` taken out; both are sorted. */
export function without(open: readonly Range[], holes: readonly Range[]): Range[] {
    const kept: Range[] = [];
    let first = 0;
    for (const range of open) {
        let from = range[0];
        while (first < holes.length && holes[first][1] <= from) first += 1;
        for (let at = first; at < holes.length && holes[at][0] < range[1]; at += 1) {
            if (holes[at][0] > from) kept.push([from, holes[at][0]]);
            from = Math.max(from, holes[at][1]);
        }
        if (from < range[1]) kept.push([from, range[1]]);
    }
    return kept;
}

/** The mark with the fix at `index` written as a suggestion, which Fix All leaves alone. */
export function demoted(mark: Mark, index = 0): Mark {
    return {
        ...mark,
        fixes: mark.fixes.map((fix, at) => (at === index ? { ...fix, kind: 'suggestion' } : fix))
    };
}

/** The mark with the replacement text of its first fix written as `text`. */
export function withText(mark: Mark, text: string): Mark {
    const [fix, ...rest] = mark.fixes;
    return {
        ...mark,
        fixes: [{ ...fix, edits: fix.edits.map((one) => ({ ...one, text })) }, ...rest]
    };
}

/**
 * The marks whose first fix holds when applied together: all of them, else the halves that hold,
 * else none. `holds` says whether a set of marks does; a set made of halves that each hold must
 * hold together too.
 */
export function holding(marks: readonly Mark[], holds: (some: readonly Mark[]) => boolean): Mark[] {
    if (marks.length === 0) return [];
    if (holds(marks)) return [...marks];
    if (marks.length === 1) return [];
    const middle = Math.floor(marks.length / 2);
    const kept = [
        ...holding(marks.slice(0, middle), holds),
        ...holding(marks.slice(middle), holds)
    ];
    return kept.length > 0 && holds(kept) ? kept : [];
}
