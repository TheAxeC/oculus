// Layer 3, primitive, pure. What the editor reads of a LaTeX text to preview it: the math span
// under a position, the picture a position names, the file that picture is, and the room the
// preview has beside the line. The page reads nothing else here; the widget that draws the preview
// is kit/latex/latex-widget.ts's.
//
// A span is found by a scan from the start of the text, so a `%` comment and an escaped character
// (`\$`, `\%`) never open or close one. A single `$` span does not cross a blank line, which is
// where a lone dollar sign in running text ends.

/**
 * The height a preview may take beside a line, in pixels: the larger of the room above the line
 * and the room below it within the editor's visible height, so the preview fits on one side of
 * the line and Monaco places it there, as its own hovers are placed. `top` and `height` are the
 * line's, from the top of the editor's visible part.
 */
export function previewRoom(top: number, height: number, viewport: number): number {
    return Math.max(0, top, viewport - top - height);
}

/** A math span: its offsets in the text (the end is past the closing delimiter), the source KaTeX
 * is given and whether it is set as a display formula. */
export type MathSpan = { start: number; end: number; source: string; display: boolean };

/**
 * What a display math environment is typeset as inside KaTeX: null for one KaTeX takes whole
 * (equation), the inner environment for one it only knows in its inner form.
 */
function typesetAs(name: string): string | null {
    if (name === 'align') return 'aligned';
    if (name === 'gather' || name === 'multline') return 'gathered';
    return null;
}

/** Whether the line break at `at` is followed by a blank line, which ends a paragraph. */
function endsParagraph(text: string, at: number): boolean {
    const next = text.indexOf('\n', at + 1);
    return next >= 0 && text.slice(at + 1, next).trim() === '';
}

/** The offset of the first `closer` at or after `from`, skipping escaped characters, or -1. */
function closing(text: string, from: number, closer: string, paragraph: boolean): number {
    for (let at = from; at < text.length; at += 1) {
        if (text.startsWith(closer, at)) return at;
        if (text[at] === '\\') at += 1;
        else if (paragraph && text[at] === '\n' && endsParagraph(text, at)) return -1;
    }
    return -1;
}

/** The span that opens at `at`, or null when nothing opens there. */
function spanAt(text: string, at: number): MathSpan | null {
    const wrap = (
        length: number,
        closer: string,
        display: boolean,
        paragraph = false
    ): MathSpan | null => {
        const close = closing(text, at + length, closer, paragraph);
        if (close < 0) return null;
        const source = text.slice(at + length, close);
        return { start: at, end: close + closer.length, source, display };
    };
    if (text.startsWith('$$', at)) return wrap(2, '$$', true);
    if (text.startsWith('$', at)) return wrap(1, '$', false, true);
    if (text.startsWith('\\(', at)) return wrap(2, '\\)', false);
    if (text.startsWith('\\[', at)) return wrap(2, '\\]', true);
    // Matched at the offset only, so a scan over a long text never copies the rest of it.
    const opening = /\\begin\{(equation|align|gather|multline)(\*?)\}/y;
    opening.lastIndex = at;
    const begun = opening.exec(text);
    if (begun === null) return null;
    const name = begun[1];
    const found = wrap(begun[0].length, `\\end{${name}${begun[2]}}`, true);
    const kind = typesetAs(name);
    if (found === null || kind === null) return found;
    return { ...found, source: `\\begin{${kind}}${found.source}\\end{${kind}}` };
}

/** The math span the offset is inside (a delimiter counts), or null when it is in none. */
export function mathSpanAt(text: string, offset: number): MathSpan | null {
    let at = 0;
    while (at < text.length && at <= offset) {
        const char = text[at];
        if (char === '%') {
            const eol = text.indexOf('\n', at);
            at = eol < 0 ? text.length : eol;
            continue;
        }
        const span = char === '$' || char === '\\' ? spanAt(text, at) : null;
        if (span !== null) {
            if (offset >= span.start && offset <= span.end) return span;
            at = span.end;
            continue;
        }
        at += char === '\\' ? 2 : 1;
    }
    return null;
}

/** An `\includegraphics` call: an optional bracket argument, then the braced path. */
const PICTURE = /\\includegraphics\*?\s*(?:\[[^\]]*\])?\s*\{([^}]*)\}/g;

/** An `\includegraphics` call: its offsets in the text and the path it names. */
export type PictureCall = { start: number; end: number; path: string };

/** The `\includegraphics` call the offset is inside, or null. */
export function pictureAt(text: string, offset: number): PictureCall | null {
    for (const match of text.matchAll(PICTURE)) {
        const [start, end] = [match.index, match.index + match[0].length];
        if (offset >= start && offset <= end) return { start, end, path: match[1].trim() };
    }
    return null;
}

/** The extensions a picture is looked for under, in the order they are tried. */
export const PICTURE_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg'] as const;

/** A path against a folder with its dot segments resolved, or null when it leaves the root. */
function resolveAgainst(folder: string, path: string): string | null {
    const parts = folder === '' ? [] : folder.split('/');
    for (const part of path.split('/')) {
        if (part === '' || part === '.') continue;
        if (part !== '..') parts.push(part);
        else if (parts.pop() === undefined) return null;
    }
    return parts.join('/');
}

/**
 * The file a picture path names, as a path against the root, among those `exists` knows. The path
 * is resolved from `folder`; a path that is absolute or leaves the root names nothing, and one
 * without a known extension is tried under each extension in turn.
 */
export async function pictureFile(
    path: string,
    folder: string,
    exists: (path: string) => Promise<boolean>
): Promise<string | null> {
    if (path === '' || path.startsWith('/') || path.startsWith('~')) return null;
    const resolved = resolveAgainst(folder, path);
    if (resolved === null || resolved === '') return null;
    const extension = resolved.split('/').at(-1)?.split('.').at(-1)?.toLowerCase() ?? '';
    const known = (PICTURE_EXTENSIONS as readonly string[]).includes(extension);
    const tries = known ? [resolved] : PICTURE_EXTENSIONS.map((one) => `${resolved}.${one}`);
    for (const one of tries) {
        if (await exists(one)) return one;
    }
    return null;
}
