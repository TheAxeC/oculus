// Layer 2, server. The conversions between the language server protocol's JSON and the value
// classes of VS Code's API, in the two directions a provider needs: the params of a request into
// the arguments of a provider call (positions, ranges, uris, documents), and the value a provider
// answers into the protocol's result. The numbers of VS Code's enums are zero-based where the
// protocol's are one-based (symbol, completion item and highlight kinds, diagnostic severity), and
// a text is a string or a `MarkdownString`. The runner imports it before it installs its import
// guard.

import {
    Position,
    Range,
    Location,
    fromRange,
    toPosition,
    toRange
} from '../../values/position-range.mjs';
import { Diagnostic, TextEdit } from '../../values/text.mjs';
import { Uri } from '../../values/uri.mjs';

/** A uri as the protocol writes it. */
export const uriText = (uri) => (typeof uri === 'string' ? uri : uri.toString());

/** A position in the protocol's form. */
export const fromPosition = (position) => ({ line: position.line, character: position.character });

/** The text of a documentation value: a string, or a markdown string as `MarkupContent`. */
export function markup(value) {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'string') return value;
    return { kind: 'markdown', value: String(value.value ?? '') };
}

/** One `MarkedString`, a markdown string or a language and a value, as markdown text. */
function markedText(value) {
    if (typeof value === 'string') return value;
    if (typeof value?.language === 'string') {
        return `\`\`\`${value.language}\n${value.value}\n\`\`\``;
    }
    return String(value?.value ?? '');
}

/** The `contents` of a hover. */
export function hoverContents(contents) {
    const list = Array.isArray(contents) ? contents : [contents];
    return { kind: 'markdown', value: list.map(markedText).join('\n\n') };
}

/** A command in the protocol's form. */
export function fromCommand(command) {
    if (command === undefined || command === null) return undefined;
    return {
        title: command.title ?? '',
        command: command.command,
        arguments: command.arguments
    };
}

/** A text edit in the protocol's form. */
export function fromTextEdit(edit) {
    return { range: fromRange(edit.range), newText: edit.newText };
}

/** A `WorkspaceEdit` in the protocol's form. */
export function fromWorkspaceEdit(edit) {
    if (edit === undefined || edit === null) return null;
    const changes = {};
    for (const [uri, edits] of edit.entries()) changes[uri.toString()] = edits.map(fromTextEdit);
    const operations = edit.fileOperations().map((one) => {
        if (one.kind === 'create') return { kind: 'create', uri: one.uri.toString() };
        if (one.kind === 'delete') return { kind: 'delete', uri: one.uri.toString() };
        return { kind: 'rename', oldUri: one.uri.toString(), newUri: one.to.toString() };
    });
    if (operations.length === 0) return { changes };
    return {
        documentChanges: [
            ...Object.entries(changes).map(([uri, edits]) => ({
                textDocument: { uri, version: null },
                edits
            })),
            ...operations
        ]
    };
}

/** A completion item in the protocol's form. */
export function fromCompletionItem(item) {
    const label = typeof item.label === 'string' ? item.label : item.label.label;
    const out = {
        label,
        kind: typeof item.kind === 'number' ? item.kind + 1 : undefined,
        tags: item.tags,
        detail: item.detail ?? (typeof item.label === 'object' ? item.label.detail : undefined),
        documentation: markup(item.documentation),
        sortText: item.sortText,
        filterText: item.filterText,
        preselect: item.preselect,
        commitCharacters: item.commitCharacters,
        command: fromCommand(item.command),
        additionalTextEdits: item.additionalTextEdits?.map(fromTextEdit),
        data: item.data
    };
    if (typeof item.label === 'object') {
        out.labelDetails = { detail: item.label.detail, description: item.label.description };
    }
    const insert = item.insertText ?? label;
    const text = typeof insert === 'string' ? insert : insert.value;
    out.insertTextFormat = typeof insert === 'string' ? 1 : 2;
    const range = item.range;
    if (range !== undefined) {
        if (range instanceof Range) {
            out.textEdit = { range: fromRange(range), newText: text };
        } else {
            out.textEdit = {
                insert: fromRange(range.inserting),
                replace: fromRange(range.replacing),
                newText: text
            };
        }
    } else {
        out.insertText = text;
    }
    return out;
}

/** The completion items of a list or an array. */
export function fromCompletions(value) {
    if (value === undefined || value === null) return null;
    const items = Array.isArray(value) ? value : value.items;
    return {
        isIncomplete: Array.isArray(value) ? false : value.isIncomplete === true,
        items: items.map(fromCompletionItem)
    };
}

/** A completion item of the protocol as the provider's `resolveCompletionItem` takes it. */
export function toCompletionItem(item) {
    return { ...item, kind: typeof item.kind === 'number' ? item.kind - 1 : undefined };
}

/** A location, or a location link, in the protocol's form. */
function fromLocationLike(one) {
    if (one instanceof Location || one.range !== undefined) {
        return { uri: uriText(one.uri), range: fromRange(one.range) };
    }
    return {
        targetUri: uriText(one.targetUri),
        targetRange: fromRange(one.targetRange),
        targetSelectionRange: fromRange(one.targetSelectionRange ?? one.targetRange),
        originSelectionRange:
            one.originSelectionRange === undefined ? undefined : fromRange(one.originSelectionRange)
    };
}

/** The answer of a definition-like provider. */
export function fromLocations(value) {
    if (value === undefined || value === null) return null;
    return Array.isArray(value) ? value.map(fromLocationLike) : fromLocationLike(value);
}

/** A hover in the protocol's form. */
export function fromHover(hover) {
    if (hover === undefined || hover === null) return null;
    return {
        contents: hoverContents(hover.contents),
        range: hover.range === undefined ? undefined : fromRange(hover.range)
    };
}

/** A document symbol or a symbol information in the protocol's form. */
export function fromSymbol(symbol) {
    if (symbol.location !== undefined) {
        return {
            name: symbol.name,
            kind: symbol.kind + 1,
            tags: symbol.tags,
            containerName: symbol.containerName,
            location: { uri: uriText(symbol.location.uri), range: fromRange(symbol.location.range) }
        };
    }
    return {
        name: symbol.name,
        detail: symbol.detail,
        kind: symbol.kind + 1,
        tags: symbol.tags,
        range: fromRange(symbol.range),
        selectionRange: fromRange(symbol.selectionRange),
        children: symbol.children?.map(fromSymbol)
    };
}

/** A code action or a command in the protocol's form. */
export function fromCodeAction(action) {
    if (typeof action.command === 'string') return fromCommand(action);
    return {
        title: action.title,
        kind: action.kind?.value ?? action.kind,
        diagnostics: action.diagnostics?.map(fromDiagnostic),
        edit: action.edit === undefined ? undefined : fromWorkspaceEdit(action.edit),
        command: fromCommand(action.command),
        isPreferred: action.isPreferred,
        disabled: action.disabled,
        data: action.data
    };
}

/** A code lens in the protocol's form. */
export function fromCodeLens(lens) {
    return { range: fromRange(lens.range), command: fromCommand(lens.command), data: lens.data };
}

/** A document link in the protocol's form. */
export function fromLink(link) {
    return {
        range: fromRange(link.range),
        target: link.target === undefined ? undefined : uriText(link.target),
        tooltip: link.tooltip,
        data: link.data
    };
}

/** A diagnostic in the protocol's form. */
export function fromDiagnostic(diagnostic) {
    const code = diagnostic.code;
    return {
        range: fromRange(diagnostic.range),
        message: diagnostic.message,
        severity: (diagnostic.severity ?? 0) + 1,
        source: diagnostic.source,
        code: typeof code === 'object' && code !== null ? code.value : code,
        codeDescription:
            typeof code === 'object' && code?.target !== undefined
                ? { href: uriText(code.target) }
                : undefined,
        tags: diagnostic.tags,
        relatedInformation: diagnostic.relatedInformation?.map((one) => ({
            location: { uri: uriText(one.location.uri), range: fromRange(one.location.range) },
            message: one.message
        }))
    };
}

/** A diagnostic of the protocol as the provider's code action context holds it. */
export function toDiagnostic(diagnostic) {
    const out = new Diagnostic(
        toRange(diagnostic.range),
        diagnostic.message,
        (diagnostic.severity ?? 1) - 1
    );
    out.source = diagnostic.source;
    out.code = diagnostic.code;
    out.tags = diagnostic.tags;
    return out;
}

/** The signature help in the protocol's form. */
export function fromSignatureHelp(help) {
    if (help === undefined || help === null) return null;
    return {
        signatures: help.signatures.map((signature) => ({
            label: signature.label,
            documentation: markup(signature.documentation),
            activeParameter: signature.activeParameter,
            parameters: signature.parameters?.map((one) => ({
                label: one.label,
                documentation: markup(one.documentation)
            }))
        })),
        activeSignature: help.activeSignature ?? 0,
        activeParameter: help.activeParameter ?? 0
    };
}

const FOLDING_KINDS = { 1: 'comment', 2: 'imports', 3: 'region' };

/** A folding range in the protocol's form. */
export function fromFolding(range) {
    return {
        startLine: range.start,
        endLine: range.end,
        kind: range.kind === undefined ? undefined : FOLDING_KINDS[range.kind]
    };
}

/** A selection range in the protocol's form, with its parents. */
export function fromSelection(range) {
    return {
        range: fromRange(range.range),
        parent: range.parent === undefined ? undefined : fromSelection(range.parent)
    };
}

/** An inlay hint in the protocol's form. */
export function fromInlayHint(hint) {
    return {
        position: fromPosition(hint.position),
        label:
            typeof hint.label === 'string'
                ? hint.label
                : hint.label.map((part) => ({
                      value: part.value,
                      tooltip: markup(part.tooltip),
                      location:
                          part.location === undefined
                              ? undefined
                              : {
                                    uri: uriText(part.location.uri),
                                    range: fromRange(part.location.range)
                                },
                      command: fromCommand(part.command)
                  })),
        kind: hint.kind,
        textEdits: hint.textEdits?.map(fromTextEdit),
        tooltip: markup(hint.tooltip),
        paddingLeft: hint.paddingLeft,
        paddingRight: hint.paddingRight,
        data: hint.data
    };
}

/** A document highlight in the protocol's form. */
export function fromHighlight(highlight) {
    return { range: fromRange(highlight.range), kind: (highlight.kind ?? 0) + 1 };
}

/** A call or type hierarchy item in the protocol's form. */
export function fromHierarchyItem(item) {
    return {
        name: item.name,
        kind: item.kind + 1,
        tags: item.tags,
        detail: item.detail,
        uri: uriText(item.uri),
        range: fromRange(item.range),
        selectionRange: fromRange(item.selectionRange),
        data: item.data
    };
}

/** A hierarchy item of the protocol as a provider takes it. */
export function toHierarchyItem(item) {
    return {
        ...item,
        kind: item.kind - 1,
        uri: Uri.parse(item.uri),
        range: toRange(item.range),
        selectionRange: toRange(item.selectionRange)
    };
}

/** The tokens of a semantic tokens answer in the protocol's form. */
export function fromTokens(tokens) {
    if (tokens === undefined || tokens === null) return null;
    return { resultId: tokens.resultId, data: Array.from(tokens.data) };
}

/** A text edit of the protocol as the provider's own class. */
export function toTextEdit(edit) {
    return new TextEdit(toRange(edit.range), edit.newText);
}

export { Position, Range, toPosition, toRange, fromRange };
