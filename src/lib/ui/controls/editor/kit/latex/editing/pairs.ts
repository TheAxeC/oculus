// Layer 3, primitive, pure. The pairs of delimiters a LaTeX text holds, as offsets into the text:
// environments (`\begin{x}` to `\end{x}`), inline math (`\(` to `\)` and `$` to `$`), display math
// (`\[` to `\]` and `$$` to `$$`) and TeX conditionals (`\if...`, its `\else` and `\fi`). The
// editing commands (go to the other end of a pair, select an environment or its name or its
// content, close the open environment, switch display math and an environment) read them here.
//
// The scan is one pass over the text with a stack. A `%` comment (not `\%`) runs to the end of its
// line and holds no delimiter, and the body of a verbatim environment holds none either. An
// `\end{x}` closes the nearest open environment named x, and the environments opened after it are
// left open (`close` is null); a `\)`, `\]`, `\fi` with nothing of its kind open is ignored. A
// `\if` followed by `{` or `[` is a macro with arguments (`\ifthenelse{...}`), not a conditional,
// and `\iff` is the arrow.

/** A stretch of the text: where it starts and where it ends (after its last character). */
type Span = { start: number; end: number };

/** What a pair delimits. */
type PairKind = 'environment' | 'inline' | 'display' | 'conditional';

/** One pair: its opening, its closing (null while it is open), the `\else` between, its name. */
export type Pair = {
    kind: PairKind;
    open: Span;
    close: Span | null;
    /** The `\else` tokens of a conditional, in order; empty for any other pair. */
    mids: Span[];
    /** The environment's name, the empty string for any other pair. */
    name: string;
    /** The name inside `\begin{...}` and inside `\end{...}`, null for any other pair. */
    nameOpen: Span | null;
    nameClose: Span | null;
};

/** The environments whose body is not LaTeX. */
const VERBATIM: readonly string[] = [
    'verbatim',
    'verbatim*',
    'Verbatim',
    'lstlisting',
    'minted',
    'comment'
];

/** The macros that look like a conditional and are not one that `\fi` closes. */
const NOT_CONDITIONAL: readonly string[] = ['iff'];

/** A scan of the delimiters, made new for each text since a global pattern holds its position. */
function tokens(): RegExp {
    return /\\begin\{([^{}\n]*)\}|\\end\{([^{}\n]*)\}|\\\(|\\\)|\\\[|\\\]|\$\$|\$|\\if[A-Za-z@]*|\\else(?![A-Za-z@])|\\fi(?![A-Za-z@])|%|\\\\|\\./g;
}

/** An opened pair on the stack, with the delimiter that closes it. */
type Open = Pair & { closer: 'env' | 'paren' | 'bracket' | 'dollar' | 'dollars' | 'fi' };

/** The offset one past the end of the line that holds `at`. */
function lineEnd(text: string, at: number): number {
    const found = text.indexOf('\n', at);
    return found < 0 ? text.length : found;
}

/** Every pair of a text, ordered by where it opens; an open pair has a null `close`. */
export function pairsOf(text: string): Pair[] {
    const made: Open[] = [];
    const stack: Open[] = [];
    const scan = tokens();
    let found = scan.exec(text);
    while (found !== null) {
        const token = found[0];
        const start = found.index;
        const span = { start, end: start + token.length };
        if (token === '%') {
            scan.lastIndex = lineEnd(text, start);
        } else if (token.startsWith('\\begin{')) {
            const name = found[1];
            const nameStart = start + '\\begin{'.length;
            const pair: Open = {
                kind: 'environment',
                open: span,
                close: null,
                mids: [],
                name,
                nameOpen: { start: nameStart, end: nameStart + name.length },
                nameClose: null,
                closer: 'env'
            };
            made.push(pair);
            stack.push(pair);
            if (VERBATIM.includes(name)) {
                const stop = text.indexOf(`\\end{${name}}`, span.end);
                scan.lastIndex = stop < 0 ? text.length : stop;
            }
        } else if (token.startsWith('\\end{')) {
            const name = found[2];
            let at = stack.length - 1;
            while (at >= 0 && !(stack[at].closer === 'env' && stack[at].name === name)) at -= 1;
            if (at >= 0) {
                const pair = stack[at];
                const nameStart = start + '\\end{'.length;
                pair.close = span;
                pair.nameClose = { start: nameStart, end: nameStart + name.length };
                stack.length = at;
            }
        } else if (token === '\\(' || token === '\\[') {
            const pair: Open = {
                kind: token === '\\(' ? 'inline' : 'display',
                open: span,
                close: null,
                mids: [],
                name: '',
                nameOpen: null,
                nameClose: null,
                closer: token === '\\(' ? 'paren' : 'bracket'
            };
            made.push(pair);
            stack.push(pair);
        } else if (token === '\\)' || token === '\\]') {
            const closer = token === '\\)' ? 'paren' : 'bracket';
            const at = stack.map((one) => one.closer).lastIndexOf(closer);
            if (at >= 0) {
                stack[at].close = span;
                stack.length = at;
            }
        } else if (token === '$' || token === '$$') {
            const closer = token === '$' ? 'dollar' : 'dollars';
            const top = stack.at(-1);
            if (top?.closer === closer) {
                top.close = span;
                stack.pop();
            } else {
                const pair: Open = {
                    kind: token === '$' ? 'inline' : 'display',
                    open: span,
                    close: null,
                    mids: [],
                    name: '',
                    nameOpen: null,
                    nameClose: null,
                    closer
                };
                made.push(pair);
                stack.push(pair);
            }
        } else if (token.startsWith('\\if')) {
            const next = text[span.end];
            if (NOT_CONDITIONAL.includes(token.slice(1)) || next === '{' || next === '[') {
                found = scan.exec(text);
                continue;
            }
            const pair: Open = {
                kind: 'conditional',
                open: span,
                close: null,
                mids: [],
                name: token.slice(1),
                nameOpen: null,
                nameClose: null,
                closer: 'fi'
            };
            made.push(pair);
            stack.push(pair);
        } else if (token.startsWith('\\else')) {
            const at = stack.map((one) => one.closer).lastIndexOf('fi');
            if (at >= 0) stack[at].mids.push(span);
        } else if (token.startsWith('\\fi')) {
            const at = stack.map((one) => one.closer).lastIndexOf('fi');
            if (at >= 0) {
                stack[at].close = span;
                stack.length = at;
            }
        }
        found = scan.exec(text);
    }
    return made.map((one) => ({
        kind: one.kind,
        open: one.open,
        close: one.close,
        mids: one.mids,
        name: one.name,
        nameOpen: one.nameOpen,
        nameClose: one.nameClose
    }));
}

/** The pairs whose body holds `offset`, outermost first. */
function surrounding(pairs: readonly Pair[], offset: number): Pair[] {
    return pairs.filter(
        (one) => one.open.start <= offset && (one.close === null || offset < one.close.end)
    );
}

/**
 * Where Navigate to Matching `\begin{}`/`\end{}` goes from `offset`: from an opening, to the start
 * of the next delimiter of the pair (its first `\else`, else its closing); from an `\else`, to the
 * next one; from a closing, to the start of its opening. Null when `offset` is on no delimiter.
 */
export function counterpart(pairs: readonly Pair[], offset: number): number | null {
    const on = (span: Span): boolean => span.start <= offset && offset <= span.end;
    const candidates = pairs.filter(
        (one) => on(one.open) || one.mids.some(on) || (one.close !== null && on(one.close))
    );
    const pair = candidates.at(-1);
    if (pair === undefined) return null;
    if (on(pair.open)) return (pair.mids.at(0) ?? pair.close)?.start ?? null;
    const at = pair.mids.findIndex(on);
    if (at >= 0) return (pair.mids.at(at + 1) ?? pair.close)?.start ?? null;
    return pair.open.start;
}

/** The innermost closed environment or display math whose body holds `offset`, or null. */
export function innermostNamed(pairs: readonly Pair[], offset: number): Pair | null {
    const found = surrounding(pairs, offset).filter(
        (one) => one.close !== null && (one.kind === 'environment' || one.kind === 'display')
    );
    return found.at(-1) ?? null;
}

/**
 * The pairs `Select Environment Content` and `Select Environment` walk outward through, from the
 * innermost: every closed pair whose body holds `offset`.
 */
export function enclosing(pairs: readonly Pair[], offset: number): Pair[] {
    return surrounding(pairs, offset)
        .filter((one) => one.close !== null)
        .reverse();
}

/** The innermost pair still open at `offset`, which Close Environment ends, or null. */
export function openAt(pairs: readonly Pair[], offset: number): Pair | null {
    const found = surrounding(pairs, offset).filter(
        (one) => one.close === null && one.kind === 'environment'
    );
    return found.at(-1) ?? null;
}
