// Layer 3, primitive, pure. The formatting shortcuts of a LaTeX tab (`\textbf`, `\emph`, `\mathbb`
// and the others the Cmd+L and Ctrl+Shift+M chords name) as one editing command over every
// selection: a selection that is wrapped in the command is unwrapped, any other selection is
// wrapped in it, a caret inside the command's braces on its line takes the command off, and a caret
// anywhere else puts `\command{}` there with the caret between the braces.

import type { Change, Edit, Selected } from './edit';

/** The span of `\keyword{...}` on one line around `offset`, with the braces' content. */
function surrounding(
    text: string,
    keyword: string,
    offset: number
): { start: number; end: number; inner: string } | null {
    const lineStart = text.lastIndexOf('\n', offset - 1) + 1;
    const lineStop = text.indexOf('\n', offset);
    const line = text.slice(lineStart, lineStop < 0 ? text.length : lineStop);
    const opener = `\\${keyword}{`;
    let best: { start: number; end: number; inner: string } | null = null;
    for (let at = line.indexOf(opener); at >= 0; at = line.indexOf(opener, at + 1)) {
        let depth = 1;
        let close = -1;
        for (let step = at + opener.length; step < line.length && close < 0; step += 1) {
            if (line[step] === '\\') step += 1;
            else if (line[step] === '{') depth += 1;
            else if (line[step] === '}') {
                depth -= 1;
                if (depth === 0) close = step;
            }
        }
        const start = lineStart + at;
        const end = lineStart + close + 1;
        if (close >= 0 && start <= offset && offset <= end) {
            best = { start, end, inner: line.slice(at + opener.length, close) };
        }
    }
    return best;
}

/** The change that toggles `keyword` over `selections`, taken in the order they lie in the text. */
export function toggleKeyword(
    text: string,
    selections: readonly Selected[],
    keyword: string
): Change {
    const edits: Edit[] = [];
    const select: Selected[] = [];
    let moved = 0;
    const ordered = [...selections].sort(
        (left, right) => Math.min(left.anchor, left.active) - Math.min(right.anchor, right.active)
    );
    for (const one of ordered) {
        const from = Math.min(one.anchor, one.active);
        const to = Math.max(one.anchor, one.active);
        const chosen = text.slice(from, to);
        if (from === to) {
            const around = surrounding(text, keyword, from);
            if (around !== null) {
                edits.push({ start: around.start, end: around.end, text: around.inner });
                const caret =
                    around.start +
                    moved +
                    Math.max(from - around.start - `\\${keyword}{`.length, 0);
                select.push({ anchor: caret, active: caret });
                moved += around.inner.length - (around.end - around.start);
            } else {
                const wrapped = `\\${keyword}{}`;
                edits.push({ start: from, end: from, text: wrapped });
                const caret = from + moved + wrapped.length - 1;
                select.push({ anchor: caret, active: caret });
                moved += wrapped.length;
            }
            continue;
        }
        const opener = chosen.startsWith(`\\${keyword}{`)
            ? `\\${keyword}{`
            : chosen.startsWith(`${keyword}{`)
              ? `${keyword}{`
              : '';
        const next =
            opener !== '' && chosen.endsWith('}')
                ? chosen.slice(opener.length, -1)
                : `\\${keyword}{${chosen}}`;
        edits.push({ start: from, end: to, text: next });
        select.push({ anchor: from + moved, active: from + moved + next.length });
        moved += next.length - chosen.length;
    }
    return { edits, select };
}
