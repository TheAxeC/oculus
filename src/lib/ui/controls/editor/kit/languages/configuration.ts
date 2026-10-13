// Layer 3, primitive. A language configuration file of an app, as Monaco takes it. The file is
// VS Code's: comments, brackets, auto-closing and surrounding pairs, folding markers, the word
// pattern, indentation rules and `onEnterRules`. A pattern is a string or `{ pattern, flags }`; a
// pattern that does not compile, and a part of the wrong shape, is left out and the rest applies.
// The function builds the object without Monaco (the indent actions are its enum's numbers), so the
// reading is the same wherever it runs.

import type * as Monaco from 'monaco-editor';

type Configuration = Monaco.languages.LanguageConfiguration;

/** A value that is a plain object. */
function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** A regular expression from a string or a `{ pattern, flags }`, or undefined when it has none. */
function expression(value: unknown): RegExp | undefined {
    const source = typeof value === 'string' ? value : isRecord(value) ? value.pattern : undefined;
    if (typeof source !== 'string' || source === '') return undefined;
    const flags = isRecord(value) && typeof value.flags === 'string' ? value.flags : '';
    try {
        return new RegExp(source, flags);
    } catch {
        return undefined;
    }
}

/** A pair of strings, or undefined. */
function pairOf(value: unknown): Monaco.languages.CharacterPair | undefined {
    if (!Array.isArray(value) || value.length !== 2) return undefined;
    const [open, close] = value as unknown[];
    return typeof open === 'string' && typeof close === 'string' ? [open, close] : undefined;
}

/** The brackets, each a two-string list. */
function bracketsOf(value: unknown): Monaco.languages.CharacterPair[] | undefined {
    if (!Array.isArray(value)) return undefined;
    return value.flatMap((one) => {
        const pair = pairOf(one);
        return pair === undefined ? [] : [pair];
    });
}

/** The pairs of auto-closing: `[open, close]` or `{ open, close, notIn }`. */
function closingOf(value: unknown): Monaco.languages.IAutoClosingPairConditional[] | undefined {
    if (!Array.isArray(value)) return undefined;
    return value.flatMap((one) => {
        const pair = pairOf(one);
        if (pair !== undefined) return [{ open: pair[0], close: pair[1] }];
        if (!isRecord(one) || typeof one.open !== 'string' || typeof one.close !== 'string') {
            return [];
        }
        const notIn = Array.isArray(one.notIn)
            ? one.notIn.filter((place): place is string => typeof place === 'string')
            : undefined;
        return [
            {
                open: one.open,
                close: one.close,
                ...(notIn === undefined ? {} : { notIn })
            }
        ];
    });
}

/** The pairs of surrounding: `[open, close]` or `{ open, close }`. */
function surroundingOf(value: unknown): Monaco.languages.IAutoClosingPair[] | undefined {
    if (!Array.isArray(value)) return undefined;
    return value.flatMap((one) => {
        const pair = pairOf(one);
        if (pair !== undefined) return [{ open: pair[0], close: pair[1] }];
        if (isRecord(one) && typeof one.open === 'string' && typeof one.close === 'string') {
            return [{ open: one.open, close: one.close }];
        }
        return [];
    });
}

/** The comment markers: a line comment (a string or `{ comment }`) and a block comment pair. */
function commentsOf(value: unknown): Monaco.languages.CommentRule | undefined {
    if (!isRecord(value)) return undefined;
    const line = value.lineComment;
    const lineComment =
        typeof line === 'string'
            ? line
            : isRecord(line) && typeof line.comment === 'string'
              ? line.comment
              : undefined;
    const blockComment = pairOf(value.blockComment);
    if (lineComment === undefined && blockComment === undefined) return undefined;
    return {
        ...(lineComment === undefined ? {} : { lineComment }),
        ...(blockComment === undefined ? {} : { blockComment })
    };
}

/** The folding markers and the off-side flag. */
function foldingOf(value: unknown): Monaco.languages.FoldingRules | undefined {
    if (!isRecord(value)) return undefined;
    const offSide = typeof value.offSide === 'boolean' ? value.offSide : undefined;
    const markers = isRecord(value.markers) ? value.markers : undefined;
    const start = expression(markers?.start);
    const end = expression(markers?.end);
    if (offSide === undefined && (start === undefined || end === undefined)) return undefined;
    return {
        ...(offSide === undefined ? {} : { offSide }),
        ...(start === undefined || end === undefined ? {} : { markers: { start, end } })
    };
}

/** The indentation rules; the increase and decrease patterns are required by Monaco. */
function indentationOf(value: unknown): Monaco.languages.IndentationRule | undefined {
    if (!isRecord(value)) return undefined;
    const increase = expression(value.increaseIndentPattern);
    const decrease = expression(value.decreaseIndentPattern);
    if (increase === undefined || decrease === undefined) return undefined;
    const next = expression(value.indentNextLinePattern);
    const unIndented = expression(value.unIndentedLinePattern);
    return {
        increaseIndentPattern: increase,
        decreaseIndentPattern: decrease,
        ...(next === undefined ? {} : { indentNextLinePattern: next }),
        ...(unIndented === undefined ? {} : { unIndentedLinePattern: unIndented })
    };
}

/** Monaco's `IndentAction` numbers by VS Code's names. */
const INDENT_ACTIONS: Record<string, number> = {
    none: 0,
    indent: 1,
    indentOutdent: 2,
    outdent: 3
};

/** The rules of the Enter key. */
function enterOf(value: unknown): Monaco.languages.OnEnterRule[] | undefined {
    if (!Array.isArray(value)) return undefined;
    return value.flatMap((one) => {
        if (!isRecord(one) || !isRecord(one.action)) return [];
        const before = expression(one.beforeText);
        const action = one.action;
        const indent =
            typeof action.indent === 'string' && Object.hasOwn(INDENT_ACTIONS, action.indent)
                ? INDENT_ACTIONS[action.indent]
                : undefined;
        if (before === undefined || indent === undefined) return [];
        const after = expression(one.afterText);
        const previous = expression(one.previousLineText);
        return [
            {
                beforeText: before,
                ...(after === undefined ? {} : { afterText: after }),
                ...(previous === undefined ? {} : { previousLineText: previous }),
                action: {
                    indentAction: indent,
                    ...(typeof action.appendText === 'string'
                        ? { appendText: action.appendText }
                        : {}),
                    ...(typeof action.removeText === 'number'
                        ? { removeText: action.removeText }
                        : {})
                }
            }
        ];
    });
}

/** The configuration a file holds, in the shape of Monaco's `setLanguageConfiguration`. */
export function languageConfiguration(file: unknown): Configuration {
    if (!isRecord(file)) return {};
    const out: Configuration = {};
    const comments = commentsOf(file.comments);
    if (comments !== undefined) out.comments = comments;
    const brackets = bracketsOf(file.brackets);
    if (brackets !== undefined) out.brackets = brackets;
    const closing = closingOf(file.autoClosingPairs);
    if (closing !== undefined) out.autoClosingPairs = closing;
    const surrounding = surroundingOf(file.surroundingPairs);
    if (surrounding !== undefined) out.surroundingPairs = surrounding;
    const folding = foldingOf(file.folding);
    if (folding !== undefined) out.folding = folding;
    const word = expression(file.wordPattern);
    if (word !== undefined) out.wordPattern = word;
    const indentation = indentationOf(file.indentationRules);
    if (indentation !== undefined) out.indentationRules = indentation;
    const enter = enterOf(file.onEnterRules);
    if (enter !== undefined) out.onEnterRules = enter;
    return out;
}
