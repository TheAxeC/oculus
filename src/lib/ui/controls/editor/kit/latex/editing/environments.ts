// Layer 3, primitive, pure. The commands on environments and display math of a LaTeX text, each a
// function from the text and the caret to a change (edit.ts): go to the other end of a pair, select
// an environment or its content or its name, put a cursor in both names, switch between display
// math and an environment, close the environment still open, and the Enter that carries `\item` to
// the next line. They read the pairs of pairs.ts; none of them holds a Monaco value.

import type { Change, Edit, Selected } from './edit';
import { counterpart, enclosing, innermostNamed, openAt, pairsOf } from './pairs';

/** The offset the caret is moved to by Navigate to Matching `\begin{}`/`\end{}`, or null. */
export function navigateTo(text: string, caret: number): number | null {
    return counterpart(pairsOf(text), caret);
}

/**
 * Select the environment (`whole`) or what it holds (`content`) around the caret, the innermost
 * first. A press from a selection that ends where an environment ends moves out to the one around
 * it. A caret outside every pair changes nothing.
 */
export function selectEnclosing(
    text: string,
    caret: number,
    mode: 'content' | 'whole'
): Change | null {
    const around = enclosing(pairsOf(text), caret);
    let chosen: Selected | null = null;
    for (const pair of around) {
        if (pair.close === null) continue;
        chosen =
            mode === 'content'
                ? { anchor: pair.open.end, active: pair.close.start }
                : { anchor: pair.open.start, active: pair.close.end };
        if (
            Math.min(chosen.anchor, chosen.active) <= caret &&
            caret <= Math.max(chosen.anchor, chosen.active)
        ) {
            break;
        }
    }
    return chosen === null ? null : { edits: [], select: [chosen] };
}

/** The environments that switching display math turns into `\\[...\\]`, each also with a star. */
const DISPLAY_ENVIRONMENTS: readonly string[] = [
    'equation',
    'align',
    'flalign',
    'alignat',
    'gather',
    'multline',
    'eqnarray'
];

/** What a command on the name of an environment does. */
export type NameAction = 'select' | 'cursors' | 'toggle';

/**
 * The commands on the environment or display math around the caret: select its name where it opens
 * and where it closes, put a cursor in both, or switch it. Display math (`\[...\]`, `$$...$$`) has
 * no name, so it becomes `\begin{equation*}...\end{equation*}` with the name selected, and one of
 * the equation environments (starred or not) switched becomes `\[...\]`; any other environment is
 * left as it is.
 */
export function onEnvironmentName(text: string, caret: number, action: NameAction): Change | null {
    const pair = innermostNamed(pairsOf(text), caret);
    if (pair?.close == null) return null;
    const { open, close } = pair;
    if (pair.kind === 'display') {
        const name = action === 'cursors' ? '' : 'equation*';
        const begin = `\\begin{${name}}`;
        const end = `\\end{${name}}`;
        const edits: Edit[] = [
            { start: open.start, end: open.end, text: begin },
            { start: close.start, end: close.end, text: end }
        ];
        const first = open.start + '\\begin{'.length;
        const second = close.start + (begin.length - (open.end - open.start)) + '\\end{'.length;
        if (action === 'toggle') {
            const moved = caret >= open.end ? begin.length - (open.end - open.start) : 0;
            return { edits, select: [{ anchor: caret + moved, active: caret + moved }] };
        }
        return { edits, select: names(first, second, name.length, action === 'select') };
    }
    if (action === 'toggle') {
        if (!DISPLAY_ENVIRONMENTS.includes(pair.name.replace(/\*$/, ''))) return null;
        const edits: Edit[] = [
            { start: open.start, end: open.end, text: '\\[' },
            { start: close.start, end: close.end, text: '\\]' }
        ];
        const moved = caret >= open.end ? 2 - (open.end - open.start) : 0;
        const at = Math.max(caret + moved, open.start);
        return { edits, select: [{ anchor: at, active: at }] };
    }
    if (pair.nameOpen === null || pair.nameClose === null) return null;
    return {
        edits: [],
        select: names(
            pair.nameOpen.start,
            pair.nameClose.start,
            pair.name.length,
            action === 'select'
        )
    };
}

/** The selections of the two names: each covering its name, or an empty one at its start. */
function names(first: number, second: number, length: number, whole: boolean): Selected[] {
    return [first, second].map((start) => ({
        anchor: start,
        active: whole ? start + length : start
    }));
}

/**
 * Close the environment still open at the caret: `\end{name}` at the caret. When the caret and the
 * `\begin` each have only whitespace before them on their lines, the `\end` takes the indentation
 * of the `\begin`.
 */
export function closeEnvironment(text: string, caret: number): Change | null {
    const pair = openAt(pairsOf(text), caret);
    if (pair === null) return null;
    const lineOf = (offset: number): number => text.lastIndexOf('\n', offset - 1) + 1;
    const beginIndent = text.slice(lineOf(pair.open.start), pair.open.start);
    const caretLine = lineOf(caret);
    const caretIndent = text.slice(caretLine, caret);
    const end = `\\end{${pair.name}}`;
    if (/^\s*$/.test(beginIndent) && /^\s*$/.test(caretIndent)) {
        const at = caretLine + beginIndent.length + end.length;
        return {
            edits: [{ start: caretLine, end: caret, text: beginIndent + end }],
            select: [{ anchor: at, active: at }]
        };
    }
    return {
        edits: [{ start: caret, end: caret, text: end }],
        select: [{ anchor: caret + end.length, active: caret + end.length }]
    };
}

/**
 * What Enter does at the end of a line that starts with `\item`: an empty `\item` is cleared, an
 * item with an optional label starts the next line with `\item[] `, any other item with `\item `.
 * It answers null unless every caret is at the end of such a line, so the editor types the newline
 * itself.
 */
export function enterOnItem(text: string, carets: readonly number[]): Change | null {
    const edits: Edit[] = [];
    const select: Selected[] = [];
    let moved = 0;
    for (const caret of [...carets].sort((left, right) => left - right)) {
        const start = text.lastIndexOf('\n', caret - 1) + 1;
        const stop = text.indexOf('\n', caret);
        const line = text.slice(start, stop < 0 ? text.length : stop);
        const column = caret - start;
        if (!/^\s*\\item/.test(line) || line.slice(column).trim() !== '') return null;
        const indent = /^\s*/.exec(line)?.[0] ?? '';
        if (/^\s*\\item(\[\s*\])?\s*$/.test(line)) {
            edits.push({ start: start + indent.length, end: start + line.length, text: '' });
            select.push({
                anchor: start + indent.length + moved,
                active: start + indent.length + moved
            });
            moved -= line.length - indent.length;
            continue;
        }
        const next = /^\s*\\item\[[^[\]]*\]/.test(line)
            ? `\n${indent}\\item[] `
            : `\n${indent}\\item `;
        edits.push({ start: caret, end: caret, text: next });
        select.push({ anchor: caret + moved + next.length, active: caret + moved + next.length });
        moved += next.length;
    }
    return edits.length === 0 ? null : { edits, select };
}
