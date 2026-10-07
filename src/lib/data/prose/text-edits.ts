// Layer 1, data. The text edits of the Language Server Protocol applied to a text: the one reading
// of a position that the server's `lsp-edit` operation (server/files/fs/lsp-edit.ts) and the page's
// edit of an open tab (state/system/machine/lsp/edits.ts) share, so the two write the same bytes
// for the same edit.
//
// A position is a line and a character counted in UTF-16 code units of that line, over the lines
// the text itself has: a line ends at `\n`, `\r\n` or `\r`, whichever the text uses, and the end
// stays as it was. A character past the end of its line is the end of the line, as the protocol
// says; a line past the last is refused. Every position names the text before any edit, so a
// position never moves under another edit, and two edits whose ranges overlap are refused whole.
// Edits that touch (one ends where the next starts) and inserts at one place are applied in the
// order given. The text an edit brings is written with the line ends the text has, which are CRLF
// when CR and CRLF line ends together outnumber half of all of them (the rule of a text model of
// the editor) and LF otherwise.

/** A position of the protocol: a line from zero and a character of it from zero. */
type TextPosition = { line: number; character: number };

/** A range of the protocol. */
type TextRange = { start: TextPosition; end: TextPosition };

/** One edit of the protocol: the text of a range replaced. */
export type TextEdit = { range: TextRange; newText: string };

/** Why a list of edits was not applied to a text. */
export type TextEditRefusal = 'range' | 'overlap';

/** The offset of the start of each line of a text, in UTF-16 units; the first is 0. */
function lineStarts(text: string): number[] {
    const starts = [0];
    for (let at = 0; at < text.length; at += 1) {
        const code = text.charCodeAt(at);
        if (code === 0x0d && text.charCodeAt(at + 1) === 0x0a) at += 1;
        else if (code !== 0x0d && code !== 0x0a) continue;
        starts.push(at + 1);
    }
    return starts;
}

/** The offset of the end of a line's own characters: before its line end. */
function lineEnd(text: string, starts: number[], line: number): number {
    if (line + 1 >= starts.length) return text.length;
    let end = starts[line + 1] - 1;
    if (end > starts[line] && text.charCodeAt(end) === 0x0a && text.charCodeAt(end - 1) === 0x0d) {
        end -= 1;
    }
    return end;
}

/** The offset a position names in a text, or null for a line the text does not have. */
function offsetOf(text: string, starts: number[], at: TextPosition): number | null {
    if (!Number.isInteger(at.line) || !Number.isInteger(at.character)) return null;
    if (at.line < 0 || at.character < 0 || at.line >= starts.length) return null;
    return Math.min(starts[at.line] + at.character, lineEnd(text, starts, at.line));
}

/** Whether a text ends its lines with CRLF, by the rule in the head of this module. */
function usesCrlf(starts: number[], text: string): boolean {
    let carriage = 0;
    for (const start of starts.slice(1)) {
        const before = text.charCodeAt(start - 1) === 0x0a ? start - 2 : start - 1;
        if (text.charCodeAt(before) === 0x0d) carriage += 1;
    }
    return starts.length > 1 && carriage > (starts.length - 1) / 2;
}

/**
 * The text with the edits applied, or why they cannot be. A range that ends before it starts, or
 * names a line the text does not have, is `range`; two ranges that cross are `overlap`.
 */
export function applyTextEdits(
    text: string,
    edits: readonly TextEdit[]
): { ok: true; text: string } | { ok: false; reason: TextEditRefusal } {
    const starts = lineStarts(text);
    const ending = usesCrlf(starts, text) ? '\r\n' : '\n';
    const placed: { from: number; to: number; newText: string }[] = [];
    for (const edit of edits) {
        const from = offsetOf(text, starts, edit.range.start);
        const to = offsetOf(text, starts, edit.range.end);
        if (from === null || to === null || to < from) return { ok: false, reason: 'range' };
        placed.push({ from, to, newText: edit.newText.replace(/\r\n|\r|\n/g, ending) });
    }
    // Array.prototype.sort is stable, so inserts at one place keep the order they were given in.
    const ordered = [...placed].sort((a, b) => a.from - b.from || a.to - b.to);
    for (let index = 1; index < ordered.length; index += 1) {
        if (ordered[index].from < ordered[index - 1].to) return { ok: false, reason: 'overlap' };
    }
    let result = '';
    let at = 0;
    for (const one of ordered) {
        result += text.slice(at, one.from) + one.newText;
        at = one.to;
    }
    return { ok: true, text: result + text.slice(at) };
}

/**
 * The catalog keys, under `source.`, of the notices that say why an edit a language server asked
 * for was not made. The page's edit (state/system/machine/lsp/edits.ts) names one of them and the
 * words that fill it.
 */
export const LSP_EDIT_NOTICES = [
    'lsp_edit_changed',
    'lsp_edit_elsewhere',
    'lsp_edit_empty',
    'lsp_edit_failed',
    'lsp_edit_gone',
    'lsp_edit_library',
    'lsp_edit_outside',
    'lsp_edit_partial',
    'lsp_edit_partial_one',
    'lsp_edit_protected',
    'lsp_edit_structure',
    'lsp_edit_typed',
    'lsp_edit_typed_one'
] as const;

/** One of those notices. */
export type LspEditNotice = (typeof LSP_EDIT_NOTICES)[number];
