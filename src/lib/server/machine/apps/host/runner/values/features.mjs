// Layer 2, server. The value classes of VS Code's language features that a provider answers with
// and takes: completion items and lists, hovers, symbols, code actions and lenses, links, folding
// and selection ranges, inlay hints, signature help, highlights, semantic tokens and the call and
// type hierarchy items, with the enums around them. The numbers are VS Code's; the conversion to
// the protocol's is `languages/convert.mjs`. The runner imports it before it installs its guard.

import { Range } from './position-range.mjs';
import { MarkdownString } from './text.mjs';

export const CompletionItemKind = Object.freeze({
    Text: 0,
    Method: 1,
    Function: 2,
    Constructor: 3,
    Field: 4,
    Variable: 5,
    Class: 6,
    Interface: 7,
    Module: 8,
    Property: 9,
    Unit: 10,
    Value: 11,
    Enum: 12,
    Keyword: 13,
    Snippet: 14,
    Color: 15,
    File: 16,
    Reference: 17,
    Folder: 18,
    EnumMember: 19,
    Constant: 20,
    Struct: 21,
    Event: 22,
    Operator: 23,
    TypeParameter: 24,
    User: 25,
    Issue: 26
});

export const CompletionItemTag = Object.freeze({ Deprecated: 1 });

export const CompletionTriggerKind = Object.freeze({
    Invoke: 0,
    TriggerCharacter: 1,
    TriggerForIncompleteCompletions: 2
});

export class CompletionItem {
    constructor(label, kind) {
        this.label = label;
        this.kind = kind;
    }
}

export class CompletionList {
    constructor(items = [], isIncomplete = false) {
        this.items = items;
        this.isIncomplete = isIncomplete;
    }
}

export class Hover {
    constructor(contents, range) {
        this.contents = Array.isArray(contents) ? contents : [contents];
        this.range = range;
    }
}

export const SymbolKind = Object.freeze({
    File: 0,
    Module: 1,
    Namespace: 2,
    Package: 3,
    Class: 4,
    Method: 5,
    Property: 6,
    Field: 7,
    Constructor: 8,
    Enum: 9,
    Interface: 10,
    Function: 11,
    Variable: 12,
    Constant: 13,
    String: 14,
    Number: 15,
    Boolean: 16,
    Array: 17,
    Object: 18,
    Key: 19,
    Null: 20,
    EnumMember: 21,
    Struct: 22,
    Event: 23,
    Operator: 24,
    TypeParameter: 25
});

export const SymbolTag = Object.freeze({ Deprecated: 1 });

export class SymbolInformation {
    constructor(name, kind, containerNameOrRange, locationOrUri, containerName) {
        this.name = name;
        this.kind = kind;
        if (containerNameOrRange instanceof Range || containerNameOrRange?.start !== undefined) {
            this.containerName = containerName ?? '';
            this.location = { uri: locationOrUri, range: containerNameOrRange };
        } else {
            this.containerName = containerNameOrRange ?? '';
            this.location = locationOrUri;
        }
    }
}

export class DocumentSymbol {
    constructor(name, detail, kind, range, selectionRange) {
        this.name = name;
        this.detail = detail;
        this.kind = kind;
        this.range = range;
        this.selectionRange = selectionRange;
        this.children = [];
    }
}

export class CodeActionKind {
    constructor(value) {
        this.value = value;
    }

    append(part) {
        return new CodeActionKind(this.value === '' ? part : `${this.value}.${part}`);
    }

    contains(other) {
        return this.value === other.value || other.value.startsWith(`${this.value}.`);
    }

    intersects(other) {
        return this.contains(other) || other.contains(this);
    }

    static Empty = new CodeActionKind('');
    static QuickFix = new CodeActionKind('quickfix');
    static Refactor = new CodeActionKind('refactor');
    static RefactorExtract = new CodeActionKind('refactor.extract');
    static RefactorInline = new CodeActionKind('refactor.inline');
    static RefactorMove = new CodeActionKind('refactor.move');
    static RefactorRewrite = new CodeActionKind('refactor.rewrite');
    static Source = new CodeActionKind('source');
    static SourceOrganizeImports = new CodeActionKind('source.organizeImports');
    static SourceFixAll = new CodeActionKind('source.fixAll');
}

export const CodeActionTriggerKind = Object.freeze({ Invoke: 1, Automatic: 2 });

export class CodeAction {
    constructor(title, kind) {
        this.title = title;
        this.kind = kind;
    }
}

export class CodeLens {
    constructor(range, command) {
        this.range = range;
        this.command = command;
    }

    get isResolved() {
        return this.command !== undefined;
    }
}

export class DocumentLink {
    constructor(range, target) {
        this.range = range;
        this.target = target;
    }
}

export const FoldingRangeKind = Object.freeze({ Comment: 1, Imports: 2, Region: 3 });

export class FoldingRange {
    constructor(start, end, kind) {
        this.start = start;
        this.end = end;
        this.kind = kind;
    }
}

export class SelectionRange {
    constructor(range, parent) {
        this.range = range;
        this.parent = parent;
    }
}

export const InlayHintKind = Object.freeze({ Type: 1, Parameter: 2 });

export class InlayHintLabelPart {
    constructor(value) {
        this.value = value;
    }
}

export class InlayHint {
    constructor(position, label, kind) {
        this.position = position;
        this.label = label;
        this.kind = kind;
    }
}

export const SignatureHelpTriggerKind = Object.freeze({
    Invoke: 1,
    TriggerCharacter: 2,
    ContentChange: 3
});

export class ParameterInformation {
    constructor(label, documentation) {
        this.label = label;
        this.documentation = documentation;
    }
}

export class SignatureInformation {
    constructor(label, documentation) {
        this.label = label;
        this.documentation = documentation;
        this.parameters = [];
    }
}

export class SignatureHelp {
    constructor() {
        this.signatures = [];
        this.activeSignature = 0;
        this.activeParameter = 0;
    }
}

export const DocumentHighlightKind = Object.freeze({ Text: 0, Read: 1, Write: 2 });

export class DocumentHighlight {
    constructor(range, kind = DocumentHighlightKind.Text) {
        this.range = range;
        this.kind = kind;
    }
}

export class SemanticTokensLegend {
    constructor(tokenTypes, tokenModifiers = []) {
        this.tokenTypes = tokenTypes;
        this.tokenModifiers = tokenModifiers;
    }
}

export class SemanticTokens {
    constructor(data, resultId) {
        this.data = data;
        this.resultId = resultId;
    }
}

export class SemanticTokensBuilder {
    #legend;
    #tokens = [];

    constructor(legend) {
        this.#legend = legend;
    }

    push(lineOrRange, startCharacterOrType, lengthOrModifiers, tokenType, tokenModifiers) {
        if (typeof lineOrRange === 'number') {
            this.#tokens.push([
                lineOrRange,
                startCharacterOrType,
                lengthOrModifiers,
                this.#typeOf(tokenType),
                this.#modifiersOf(tokenModifiers)
            ]);
            return;
        }
        const range = lineOrRange;
        this.#tokens.push([
            range.start.line,
            range.start.character,
            range.end.character - range.start.character,
            this.#typeOf(startCharacterOrType),
            this.#modifiersOf(lengthOrModifiers)
        ]);
    }

    #typeOf(type) {
        if (typeof type === 'number') return type;
        const at = this.#legend?.tokenTypes.indexOf(type) ?? -1;
        return at === -1 ? 0 : at;
    }

    #modifiersOf(modifiers) {
        if (typeof modifiers === 'number') return modifiers;
        let bits = 0;
        for (const one of modifiers ?? []) {
            const at = this.#legend?.tokenModifiers.indexOf(one) ?? -1;
            if (at !== -1) bits |= 1 << at;
        }
        return bits;
    }

    build(resultId) {
        const sorted = [...this.#tokens].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
        const data = [];
        let line = 0;
        let character = 0;
        for (const [tokenLine, tokenCharacter, length, type, modifiers] of sorted) {
            const deltaLine = tokenLine - line;
            const deltaCharacter = deltaLine === 0 ? tokenCharacter - character : tokenCharacter;
            data.push(deltaLine, deltaCharacter, length, type, modifiers);
            line = tokenLine;
            character = tokenCharacter;
        }
        return new SemanticTokens(Uint32Array.from(data), resultId);
    }
}

export class CallHierarchyItem {
    constructor(kind, name, detail, uri, range, selectionRange) {
        this.kind = kind;
        this.name = name;
        this.detail = detail;
        this.uri = uri;
        this.range = range;
        this.selectionRange = selectionRange;
    }
}

export class CallHierarchyIncomingCall {
    constructor(item, fromRanges) {
        this.from = item;
        this.fromRanges = fromRanges;
    }
}

export class CallHierarchyOutgoingCall {
    constructor(item, fromRanges) {
        this.to = item;
        this.fromRanges = fromRanges;
    }
}

export class TypeHierarchyItem {
    constructor(kind, name, detail, uri, range, selectionRange) {
        this.kind = kind;
        this.name = name;
        this.detail = detail;
        this.uri = uri;
        this.range = range;
        this.selectionRange = selectionRange;
    }
}

/** A markdown string from a hover content, which may be a plain string or a code block pair. */
export function markdownOf(content) {
    if (typeof content === 'string') return new MarkdownString(content);
    if (typeof content?.language === 'string') {
        return new MarkdownString().appendCodeblock(content.value, content.language);
    }
    return content;
}
