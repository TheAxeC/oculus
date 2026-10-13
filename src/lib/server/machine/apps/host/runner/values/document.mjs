// Layer 2, server. VS Code's `TextDocument` as the host's object offers it: the text of one
// document a language server was given, with its lines, offsets and positions in the zero-based
// UTF-16 units of the language server protocol. A change from the protocol (`apply`) replaces
// ranges of the text and raises the version. The runner imports it before it installs its import
// guard.

import { Position, Range } from './position-range.mjs';
import { EndOfLine } from './text.mjs';
import { Uri } from './uri.mjs';

/** The offsets at which each line of the text starts. */
function starts(text) {
    const lines = [0];
    for (let at = 0; at < text.length; at += 1) {
        const char = text[at];
        if (char === '\r' && text[at + 1] === '\n') at += 1;
        else if (char !== '\r' && char !== '\n') continue;
        lines.push(at + 1);
    }
    return lines;
}

export class TextDocument {
    #text;
    #starts;

    constructor(uri, languageId, version, text) {
        this.uri = uri instanceof Uri ? uri : Uri.parse(String(uri));
        this.languageId = languageId;
        this.version = version;
        this.isClosed = false;
        this.isDirty = false;
        this.isUntitled = false;
        this.#text = text;
        this.#starts = starts(text);
    }

    get fileName() {
        return this.uri.fsPath;
    }

    get eol() {
        return this.#text.includes('\r\n') ? EndOfLine.CRLF : EndOfLine.LF;
    }

    get lineCount() {
        return this.#starts.length;
    }

    /** Replace the whole text, as a full synchronisation does. */
    replace(version, text) {
        this.version = version;
        this.#text = text;
        this.#starts = starts(text);
    }

    /** Apply the changes of a `didChange`, in order. */
    apply(version, changes) {
        let text = this.#text;
        for (const change of changes) {
            if (change.range === undefined) {
                text = change.text;
                this.#text = text;
                this.#starts = starts(text);
                continue;
            }
            this.#text = text;
            this.#starts = starts(text);
            const from = this.offsetAt(
                new Position(change.range.start.line, change.range.start.character)
            );
            const to = this.offsetAt(
                new Position(change.range.end.line, change.range.end.character)
            );
            text = text.slice(0, from) + change.text + text.slice(to);
        }
        this.version = version;
        this.#text = text;
        this.#starts = starts(text);
    }

    getText(range) {
        if (range === undefined) return this.#text;
        const valid = this.validateRange(range);
        return this.#text.slice(this.offsetAt(valid.start), this.offsetAt(valid.end));
    }

    /** The line at a number or at a position's line: its text, range and whether it is blank. */
    lineAt(lineOrPosition) {
        const line = typeof lineOrPosition === 'number' ? lineOrPosition : lineOrPosition.line;
        if (line < 0 || line >= this.lineCount) throw new Error('illegal value for `line`');
        const from = this.#starts[line];
        const next = line + 1 < this.lineCount ? this.#starts[line + 1] : this.#text.length;
        let end = next;
        while (end > from && (this.#text[end - 1] === '\n' || this.#text[end - 1] === '\r')) {
            end -= 1;
        }
        const text = this.#text.slice(from, end);
        const first = text.search(/\S/);
        return {
            lineNumber: line,
            text,
            range: new Range(line, 0, line, text.length),
            rangeIncludingLineBreak: new Range(
                line,
                0,
                line + 1 < this.lineCount ? line + 1 : line,
                line + 1 < this.lineCount ? 0 : next - from
            ),
            firstNonWhitespaceCharacterIndex: first === -1 ? text.length : first,
            isEmptyOrWhitespace: first === -1
        };
    }

    offsetAt(position) {
        const valid = this.validatePosition(position);
        return this.#starts[valid.line] + valid.character;
    }

    positionAt(offset) {
        const clamped = Math.max(0, Math.min(offset, this.#text.length));
        let low = 0;
        let high = this.#starts.length - 1;
        while (low < high) {
            const middle = Math.ceil((low + high) / 2);
            if (this.#starts[middle] <= clamped) low = middle;
            else high = middle - 1;
        }
        return new Position(low, clamped - this.#starts[low]);
    }

    validatePosition(position) {
        const line = Math.max(0, Math.min(position.line, this.lineCount - 1));
        const max = this.lineAt(line).text.length;
        return new Position(line, Math.max(0, Math.min(position.character, max)));
    }

    validateRange(range) {
        return new Range(this.validatePosition(range.start), this.validatePosition(range.end));
    }

    /** The range of the word at a position, by the pattern when one is given. */
    getWordRangeAtPosition(position, pattern) {
        const line = this.lineAt(position.line).text;
        const word = pattern ?? /[A-Za-z0-9_]+/g;
        const flags = word.flags.includes('g') ? word.flags : `${word.flags}g`;
        const matcher = new RegExp(word.source, flags);
        for (const match of line.matchAll(matcher)) {
            const begin = match.index;
            const end = begin + match[0].length;
            if (begin <= position.character && position.character <= end && end > begin) {
                return new Range(position.line, begin, position.line, end);
            }
        }
        return undefined;
    }

    save() {
        return Promise.resolve(false);
    }
}
