// Layer 3, primitive. What the transport (../transport.ts) and the host that registers models with
// it share: the protocol's messages and ranges as the client and the relay write them, the fields
// of a message that hold the address of a document, the constants of the requests the transport
// answers itself, and the readings of a message it makes (the address a model is known by, the
// edits a change event makes, the files a code action's edit touches). The functions are pure and
// read no state.

/** One change of a model's text, as Monaco reports it. */
export type ModelChange = {
    range: {
        startLineNumber: number;
        startColumn: number;
        endLineNumber: number;
        endColumn: number;
    };
    rangeLength: number;
    text: string;
};

/** What the transport reads of a Monaco model. */
export type LspModel = {
    readonly uri: { toString(skipEncoding?: boolean): string };
    getValue(): string;
    getVersionId(): number;
    getLanguageId(): string;
    onDidChangeContent(listener: (event: { changes: readonly ModelChange[] }) => void): {
        dispose(): void;
    };
};

/** A range in the protocol's form: lines and characters from zero. */
export type LspRange = {
    start: { line: number; character: number };
    end: { line: number; character: number };
};

/** One edit of the protocol. */
export type TextEdit = { range: LspRange; newText: string };

/**
 * What adds to the answer of a completion request made for one model: it is given the position the
 * request was made at and the answer as the client will get it (a list of items or a list object),
 * and answers that result, changed or as it was.
 */
export type CompletionHook = (
    position: { line: number; character: number },
    result: unknown
) => Promise<unknown>;

/** A JSON-RPC message as the client and the relay write it. */
export type Rpc = {
    jsonrpc: '2.0';
    id?: number | string | null;
    method?: string;
    params?: unknown;
    result?: unknown;
    error?: { code: number; message: string; data?: unknown };
};

/** The message the client's synchroniser sends for every model of the page, never passed on. */
export const SYNC: readonly string[] = [
    'textDocument/didOpen',
    'textDocument/didChange',
    'textDocument/didClose'
];

/** The fields of a message that hold the address of a document. */
export const ADDRESSES: readonly string[] = ['uri', 'targetUri', 'file'];

/**
 * The prefix of an id the transport gives its own requests, which the client's counter cannot make.
 */
export const OWN = 'own:';

/**
 * The requests whose parameters are the document's identifier itself, `{ uri }`, as clangd's
 * `textDocument/switchSourceHeader` reads them; every other request names it as `textDocument`.
 */
export const BARE_DOCUMENT: readonly string[] = ['textDocument/switchSourceHeader'];

/** The error code the relay answers a request with when no server is running to take it. */
export const REQUEST_CANCELLED = -32800;

/** How many variants of an address are tried before a peek is given up. */
export const SPELLINGS = 8;

/** The kind a code action of Organize Imports has. */
export const ORGANIZE = 'source.organizeImports';

/**
 * The command that applies an edit the transport kept for a code action. A server's edit is never
 * handed to Monaco, which would apply it to the models it can name; the transport keeps it under a
 * token and the action's command names the token.
 */
export const APPLY_COMMAND = 'oculus.applyEdit';

/**
 * The requests whose parameters name no document: a hierarchy follow-up carries the item an
 * answer gave, and the workspace symbols a query. The relay finds the server by the item's file, or
 * by the `root` the transport adds to the symbol query.
 */
export const NO_DOCUMENT: readonly string[] = [
    'callHierarchy/incomingCalls',
    'callHierarchy/outgoingCalls',
    'typeHierarchy/supertypes',
    'typeHierarchy/subtypes',
    'workspace/symbol'
];

/** What `ask` rejects with when the port is closed or the transport ended. */
export class Closed extends Error {
    constructor() {
        super('the language server channel is closed');
    }
}

/** A value that stands for a location the page cannot be given, dropped with what holds it. */
export const DROP = Symbol('dropped');

export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The key a model is known by in the client's address. */
export function keyOf(model: LspModel): string {
    return model.uri.toString(true);
}

/** The edits of the protocol a model's change event makes. */
export function changesOf(changes: readonly ModelChange[]): unknown[] {
    return changes.map((change) => ({
        range: {
            start: {
                line: change.range.startLineNumber - 1,
                character: change.range.startColumn - 1
            },
            end: { line: change.range.endLineNumber - 1, character: change.range.endColumn - 1 }
        },
        rangeLength: change.rangeLength,
        text: change.text
    }));
}
