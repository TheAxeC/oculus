// Layer 3, primitive. What the language server kit is handed by the source view, since `ui/`
// imports no state: the page's end of a language's channel, the reads and the opens it needs of
// the file browser, and the places it reports to. The kit never opens a socket, reads a file or
// draws a notice itself.
//
// The messages on a port are the protocol's JSON-RPC messages and the relay's own (those with an
// `oculus` field, which the state side reads; the kit ignores them). A port carries one language's
// channel, `lsp:<language>`, and one page socket, so a message is a map and never a string.

import type { Diagnostic, DocumentSymbol } from 'vscode-languageserver-protocol';
import type { Target } from './uris';

/** The state of the page socket as a port reports it. */
export type PortState = 'open' | 'connecting' | 'closed';

/** One message of a channel, as the page socket carries it. */
export type LspFrame = Record<string, unknown>;

/** The page's end of one language's channel on the page socket. */
export type LspPort = {
    /** Open while the page socket is open and subscribed with the write token. */
    readonly state: {
        readonly value: PortState;
        onChange(fn: (value: PortState) => void): () => void;
    };
    /** Send one message; false when the socket is not open, and nothing is queued. */
    send(payload: LspFrame): boolean;
    /** Hear every message of the channel; the call it returns stops listening. */
    listen(fn: (payload: LspFrame) => void): () => void;
};

/** A diagnostic in the protocol's shape, its related locations in the page's address form. */
export type LspDiagnostic = Diagnostic;

/** A document symbol in the protocol's shape. */
export type LspSymbol = DocumentSymbol;

/** The answer for the symbols of one tab: the tree, a request in flight, or none to give. */
export type LspSymbols = readonly LspSymbol[] | 'loading' | 'none';

/** What the language server kit needs from the page, passed in by the source view. */
export type LspServices = {
    /** The port of a language's channel. */
    port(language: string): LspPort;
    /**
     * A file's text and language for a peek model; null when the read fails or is truncated. A
     * library file is read through the channel and is the language of the server that named it; one
     * whose read the relay refuses has an empty text, so the location stays and its tab says why.
     */
    readFile(target: Target): Promise<{ text: string; language: string } | null>;
    /**
     * Opens the file in a source tab at the line, the same tab when it is open. A column means the
     * word at it is selected; an open that names no position gives none.
     */
    open(target: Target, line: number, column?: number): void;
    /**
     * A language server named a library file in an answer to a request made for a document of the
     * root, on the channel of the language: the page may read it for as long as the connection
     * lasts.
     */
    library(address: string, root: string, language: string): void;
    /** Hands a server's diagnostics for one file to the page's store. */
    diagnostics(
        root: string,
        path: string,
        language: string,
        items: readonly LspDiagnostic[]
    ): void;
    /** Hands the document symbols of one tab instance. */
    symbols(instance: string, answer: LspSymbols): void;
    /** Shows a notice of the source tab by its name, as the tab's other notices are shown. */
    notice(key: string, ...words: string[]): void;
    /** A catalog line, for the labels of the actions the kit adds. */
    words(key: string): string;
};
