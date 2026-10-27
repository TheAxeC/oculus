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
//
// The same module merges the workspace edits several roots answer for one move (`MergedEdits`).

/**
 * The id of the change annotation a rename of a hub key carries on each of its edits. The
 * annotation asks to be confirmed, its label is the old key and its description the new one; the
 * server's answer sets it and the page's plan reads it.
 */
export const RENAME_ANNOTATION = 'hub-key';

/** The byte order mark of a UTF-8 text, which a position never counts. */
const BOM = '\uFEFF';

/** The text without a leading byte order mark. */
export function withoutMark(text: string): string {
    return text.startsWith(BOM) ? text.slice(1) : text;
}

/** A position of the protocol: a line from zero and a character of it from zero. */
type TextPosition = { line: number; character: number };

/** A range of the protocol. */
type TextRange = { start: TextPosition; end: TextPosition };

/** One edit of the protocol: the text of a range replaced. */
export type TextEdit = { range: TextRange; newText: string };

/** Why a list of edits was not applied to a text. */
export type TextEditRefusal = 'range' | 'overlap';

/** The offset of the start of each line of a text, in UTF-16 units; the first is 0. */
export function lineStarts(text: string): number[] {
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

/** The text a range of a text names, or null when the range names a line the text lacks. */
export function textInRange(text: string, range: TextRange): string | null {
    const starts = lineStarts(text);
    const from = offsetOf(text, starts, range.start);
    const to = offsetOf(text, starts, range.end);
    return from === null || to === null || to < from ? null : text.slice(from, to);
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

/** The units of a text: each line with the line end that closes it, the last without one. */
function unitsOf(text: string): string[] {
    const starts = lineStarts(text);
    const units = starts.map((start, at) => text.slice(start, starts[at + 1] ?? text.length));
    return units[units.length - 1] === '' ? units.slice(0, -1) : units;
}

/** The length of a unit's own characters, before its line end. */
function bodyLength(unit: string): number {
    return unit.length - (unit.endsWith('\r\n') ? 2 : /[\r\n]$/.test(unit) ? 1 : 0);
}

/** The position of the start of unit `at` of these units, or of the end of the text past them. */
function unitStart(units: string[], at: number): TextPosition {
    if (at < units.length) return { line: at, character: 0 };
    const last = units.at(-1);
    if (last === undefined) return { line: 0, character: 0 };
    return bodyLength(last) < last.length
        ? { line: units.length, character: 0 }
        : { line: units.length - 1, character: last.length };
}

/** The edit that turns one line, with its line end, into another, over what differs only. */
function lineEdit(line: number, from: string, to: string): TextEdit | null {
    if (from === to) return null;
    let head = 0;
    const most = Math.min(from.length, to.length);
    while (head < most && from[head] === to[head]) head += 1;
    // A cut never lands inside a pair of UTF-16 units that stand for one character.
    if (head > 0 && /[\ud800-\udbff]/.test(from[head - 1])) head -= 1;
    let tail = 0;
    while (tail < most - head && from[from.length - 1 - tail] === to[to.length - 1 - tail]) {
        tail += 1;
    }
    if (tail > 0 && /[\udc00-\udfff]/.test(from[from.length - tail])) tail -= 1;
    const body = bodyLength(from);
    const stop = from.length - tail;
    return {
        range: {
            start: { line, character: head },
            end: stop <= body ? { line, character: stop } : { line: line + 1, character: 0 }
        },
        newText: to.slice(head, to.length - tail)
    };
}

/**
 * The edits that turn one text into another, the smallest the lines allow: the lines the two texts
 * share at the start and at the end are left, and what lies between is one edit per line when both
 * texts have as many lines there, and one edit over the whole span when they do not. A line that
 * differs is edited over the characters that differ. An editor that applies them keeps its
 * selections and its scroll where the text did not change, and undoes them as one step.
 */
export function editsBetween(from: string, to: string): TextEdit[] {
    if (from === to) return [];
    const before = unitsOf(from);
    const after = unitsOf(to);
    const most = Math.min(before.length, after.length);
    let head = 0;
    while (head < most && before[head] === after[head]) head += 1;
    let tail = 0;
    while (
        tail < most - head &&
        before[before.length - 1 - tail] === after[after.length - 1 - tail]
    ) {
        tail += 1;
    }
    const removed = before.slice(head, before.length - tail);
    const added = after.slice(head, after.length - tail);
    if (removed.length !== added.length || removed.length === 0) {
        return [
            {
                range: {
                    start: unitStart(before, head),
                    end: unitStart(before, before.length - tail)
                },
                newText: added.join('')
            }
        ];
    }
    return removed.flatMap((unit, at) => lineEdit(head + at, unit, added[at]) ?? []);
}

/**
 * The catalog keys, under `source.`, of the notices that say why an edit a language server asked
 * for was not made, or why a rename the server refused was not made (`lsp_edit_refused`, whose one
 * word is the server's sentence). The page's edit (state/system/machine/lsp/edits.ts) names one of
 * them and the words that fill it.
 */
export const LSP_EDIT_NOTICES = [
    'lsp_edit_changed',
    'lsp_edit_elsewhere',
    'lsp_edit_loading',
    'lsp_edit_empty',
    'lsp_edit_failed',
    'lsp_edit_gone',
    'lsp_edit_library',
    'lsp_edit_local',
    'lsp_edit_not_text',
    'lsp_edit_outside',
    'lsp_edit_partial',
    'lsp_edit_partial_one',
    'lsp_edit_readonly',
    'lsp_edit_refused',
    'lsp_edit_structure',
    'lsp_edit_too_large',
    'lsp_edit_typed',
    'lsp_edit_typed_one',
    'lsp_rename_refused_empty'
] as const;

/** One of those notices. */
export type LspEditNotice = (typeof LSP_EDIT_NOTICES)[number];

// ---------------------------------------------------------------------------------------------
// The workspace edits of several served roots for one move, made into one. Each root's Markdown
// server edits the files of its folder, and a file of an inner root is a file of the outer root
// too, so one file can come back from more than one root. Every edit of every root is kept; an
// edit the same as one already kept (the same range and the same new text) is kept once; a file
// two roots rewrite differently over the same text is left out whole and named. The relay merges
// the roots it asked (server/machine/lsp/held/requests/links.ts) and the page merges the answers
// it got for several roots (state/system/machine/refactor/link-rewrite.ts).

/** The edits of one file, and whether two roots disagreed about them. */
type FileEdits = { entry: Record<string, unknown>; edits: TextEdit[]; overlap: boolean };

/** Whether a value is an object. */
function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Whether a value is a position. */
function isTextPosition(value: unknown): value is TextPosition {
    return isObject(value) && typeof value.line === 'number' && typeof value.character === 'number';
}

/** Whether a value is a text edit. */
function isEdit(value: unknown): value is TextEdit {
    return (
        isObject(value) &&
        isObject(value.range) &&
        isTextPosition(value.range.start) &&
        isTextPosition(value.range.end) &&
        typeof value.newText === 'string'
    );
}

/** Whether the first position comes before the second. */
function before(a: TextPosition, b: TextPosition): boolean {
    return a.line < b.line || (a.line === b.line && a.character < b.character);
}

/** Whether two edits have the same range. */
function sameRange(a: TextEdit, b: TextEdit): boolean {
    return (
        a.range.start.line === b.range.start.line &&
        a.range.start.character === b.range.start.character &&
        a.range.end.line === b.range.end.line &&
        a.range.end.character === b.range.end.character
    );
}

/** Whether two edits change the same text: one range, or ranges that share some of it. */
function overlaps(a: TextEdit, b: TextEdit): boolean {
    return (
        sameRange(a, b) ||
        (before(a.range.start, b.range.end) && before(b.range.start, a.range.end))
    );
}

/** The address of the file an entry of a workspace edit is for, or null for any other entry. */
function nameOf(entry: unknown): string | null {
    if (!isObject(entry) || !isObject(entry.textDocument)) return null;
    const uri = entry.textDocument.uri;
    return typeof uri === 'string' && Array.isArray(entry.edits) ? uri : null;
}

/** The edits of the roots asked so far, by the address of the file. */
export class MergedEdits {
    #files = new Map<string, FileEdits>();
    #others: unknown[] = [];

    /** Add the entries of the edit one root answered, in the page's addresses. */
    add(entries: readonly unknown[]): void {
        for (const entry of entries) {
            const name = nameOf(entry);
            if (name === null) {
                this.#others.push(entry);
                continue;
            }
            const edits = (entry as { edits: unknown[] }).edits.filter(isEdit);
            const known = this.#files.get(name);
            if (known === undefined) {
                this.#files.set(name, {
                    entry: { ...(entry as Record<string, unknown>) },
                    edits: [...edits],
                    overlap: false
                });
                continue;
            }
            const earlier = known.edits.length;
            for (const edit of edits) {
                const prior = known.edits.slice(0, earlier);
                if (prior.some((one) => sameRange(one, edit) && one.newText === edit.newText)) {
                    continue;
                }
                if (prior.some((one) => overlaps(one, edit))) known.overlap = true;
                known.edits.push(edit);
            }
        }
    }

    /** The one edit: the entries of the files all roots agree about, and the files left out. */
    result(): { changes: unknown[]; overlaps: string[] } {
        const changes: unknown[] = [...this.#others];
        const left: string[] = [];
        for (const [name, file] of this.#files) {
            if (file.overlap) left.push(name);
            else changes.push({ ...file.entry, edits: file.edits });
        }
        return { changes, overlaps: left };
    }
}
