// Layer 2, server. VS Code's `Position`, `Range`, `Selection` and `Location` as the host's object
// offers them, in the zero-based lines and characters of the language server protocol. The
// runner imports it before it installs its import guard.

import { Uri } from './uri.mjs';

export class Position {
    constructor(line, character) {
        if (line < 0 || character < 0 || !Number.isInteger(line) || !Number.isInteger(character)) {
            throw new Error('illegal argument: line and character must be non-negative integers');
        }
        this.line = line;
        this.character = character;
        Object.freeze(this);
    }

    isBefore(other) {
        return this.compareTo(other) < 0;
    }

    isBeforeOrEqual(other) {
        return this.compareTo(other) <= 0;
    }

    isAfter(other) {
        return this.compareTo(other) > 0;
    }

    isAfterOrEqual(other) {
        return this.compareTo(other) >= 0;
    }

    isEqual(other) {
        return this.compareTo(other) === 0;
    }

    compareTo(other) {
        if (this.line !== other.line) return this.line < other.line ? -1 : 1;
        if (this.character !== other.character) return this.character < other.character ? -1 : 1;
        return 0;
    }

    translate(lineDelta, characterDelta) {
        const change =
            typeof lineDelta === 'object' && lineDelta !== null
                ? lineDelta
                : { lineDelta, characterDelta };
        return new Position(
            this.line + (change.lineDelta ?? 0),
            this.character + (change.characterDelta ?? 0)
        );
    }

    with(line, character) {
        const change = typeof line === 'object' && line !== null ? line : { line, character };
        return new Position(change.line ?? this.line, change.character ?? this.character);
    }
}

export class Range {
    /** A range of two positions, or of four numbers. */
    constructor(startOrLine, endOrCharacter, endLine, endCharacter) {
        const four = typeof startOrLine === 'number';
        const a = four ? new Position(startOrLine, endOrCharacter) : startOrLine;
        const b = four ? new Position(endLine, endCharacter) : endOrCharacter;
        const swap = a.isAfter(b);
        this.start = swap ? b : a;
        this.end = swap ? a : b;
    }

    get isEmpty() {
        return this.start.isEqual(this.end);
    }

    get isSingleLine() {
        return this.start.line === this.end.line;
    }

    contains(target) {
        if (target instanceof Range) {
            return this.contains(target.start) && this.contains(target.end);
        }
        return target.isAfterOrEqual(this.start) && target.isBeforeOrEqual(this.end);
    }

    isEqual(other) {
        return this.start.isEqual(other.start) && this.end.isEqual(other.end);
    }

    intersection(other) {
        const start = this.start.isAfter(other.start) ? this.start : other.start;
        const end = this.end.isBefore(other.end) ? this.end : other.end;
        return start.isAfter(end) ? undefined : new Range(start, end);
    }

    union(other) {
        return new Range(
            this.start.isBefore(other.start) ? this.start : other.start,
            this.end.isAfter(other.end) ? this.end : other.end
        );
    }

    with(start, end) {
        const change = start instanceof Position || start === undefined ? { start, end } : start;
        return new Range(change.start ?? this.start, change.end ?? this.end);
    }
}

export class Selection extends Range {
    constructor(anchorOrLine, activeOrCharacter, activeLine, activeCharacter) {
        const four = typeof anchorOrLine === 'number';
        const anchor = four ? new Position(anchorOrLine, activeOrCharacter) : anchorOrLine;
        const active = four ? new Position(activeLine, activeCharacter) : activeOrCharacter;
        super(anchor, active);
        this.anchor = anchor;
        this.active = active;
    }

    get isReversed() {
        return this.anchor.isAfter(this.active);
    }
}

export class Location {
    constructor(uri, rangeOrPosition) {
        this.uri = uri;
        this.range =
            rangeOrPosition instanceof Range
                ? rangeOrPosition
                : new Range(rangeOrPosition, rangeOrPosition);
    }

    /** A location from the LSP form `{ uri, range }`. */
    static from(value) {
        return new Location(Uri.parse(value.uri), toRange(value.range));
    }
}

/** A `Range` from an LSP range. */
export function toRange(range) {
    return new Range(range.start.line, range.start.character, range.end.line, range.end.character);
}

/** An LSP range of a `Range`. */
export function fromRange(range) {
    return {
        start: { line: range.start.line, character: range.start.character },
        end: { line: range.end.line, character: range.end.character }
    };
}

/** A `Position` from an LSP position. */
export function toPosition(position) {
    return new Position(position.line, position.character);
}
