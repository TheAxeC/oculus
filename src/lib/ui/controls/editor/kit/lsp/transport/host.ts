// Layer 3, primitive. What the host of a language server transport (transport.ts) does for it: the
// models it makes and drops, the edits it applies, the words and notices it shows, and what it is
// told of the server's diagnostics, inactive regions, library files, capabilities and the features
// registered after them. It is a module of its own so the transport holds only the carrying of
// messages.

import type { LspDiagnostic, LspEditOutcome } from '../services';
import type { LspModel, LspRange, TextEdit } from './messages';
import type { Jump } from './renames';
import type { Place, Target } from '../uris';

/** What the host does for the transport. */
export type TransportHost = {
    /**
     * Make a read-only model of a file no tab holds, under the page's address of it, `spelling`
     * naming the variant of the address to use when the plain one differs from another model's only
     * by case (0 for the plain one). Null when the file cannot be read.
     */
    peek(target: Target, page: string, spelling: number): Promise<LspModel | null>;
    /** Dispose a peek model the transport has no use for. */
    drop(model: LspModel): void;
    /** Apply edits to a registered model as one undo stop; false when it could not be. */
    apply(model: LspModel, edits: readonly TextEdit[]): boolean;
    /**
     * Make the edit a server asked for, all or none; the outcome says why not. `preview` is set for
     * the answer of a rename the reader asked to see before it is made, which is then shown and
     * not made until the reader says so.
     */
    applyEdit(edit: unknown, preview: boolean): Promise<LspEditOutcome>;
    /** The reader asks for the next rename to be previewed, or the mark is cleared (false). */
    markPreview(marked: boolean): void;
    /** Whether the next rename was marked for the preview; reading it clears the mark. */
    takePreview(): boolean;
    /**
     * The places the answer to a jump named, for the editor with the address `asking` (the
     * client's address of its model), in the client's addresses.
     */
    targeted(asking: string, places: readonly Jump[]): void;
    /** A catalog line of the page's words, filled with `words`. */
    words(key: string, ...words: string[]): string;
    /**
     * A server's diagnostics for one file, whether or not a model holds it: the file's address,
     * and its place when it is a file of a served root.
     */
    diagnostics(page: string, place: Place | null, items: readonly LspDiagnostic[]): void;
    /** The regions of a file clangd found inactive, by the file's address. */
    inactive(page: string, regions: readonly LspRange[]): void;
    /** A server named a library file in an answer to a request made for a document of the root. */
    library(address: string, root: string): void;
    /** The server asks for its semantic tokens again. */
    refreshTokens(): void;
    /** The capabilities the server's `initialize` answer declared. */
    declared(capabilities: Record<string, unknown>): void;
    /**
     * Features the relay registered with the client after `initialize` (`added`), or withdrew, each
     * by its registration's id and method.
     */
    registered(added: boolean, list: readonly { id: string; method: string }[]): void;
    /**
     * Shows a notice by its catalog key, with the words it is said with, under the editor of the
     * model whose request it answers (`asking`, the model's key), or null for one the server made.
     */
    notice(asking: string | null, key: string, ...words: string[]): void;
    /**
     * The answer to a completion request, or the one item a resolve answers, in the client's form,
     * for the host to add to; `request` is the client's params of the completion request. It
     * answers `result` itself when it adds nothing.
     */
    completed(request: unknown, result: unknown): Promise<unknown>;
};

/**
 * Of the registered models' tabs, by each model's key, the one a notice is told through: the tab
 * whose model asked, so the reader sees it under the editor where the request was made, else the
 * tab registered last, for a request the server made itself; `first` when none is registered.
 */
export function noticeTab<S>(
    tabs: readonly { key: string; services: S }[],
    asking: string | null,
    first: S
): S {
    const own = asking === null ? undefined : tabs.find((tab) => tab.key === asking);
    return (own ?? tabs.at(-1))?.services ?? first;
}
