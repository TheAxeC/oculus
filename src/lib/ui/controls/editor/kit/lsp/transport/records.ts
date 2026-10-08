// Layer 3, primitive. The records the transport keeps: the documents the server holds, the requests
// of the client and of the host that wait for an answer, and the peek models made for files no tab
// holds.

import type { LspModel } from './messages';
import type { Place } from '../uris';

/** A document the server holds: the file, its models, the version last sent. */
export type Doc = {
    place: Place;
    page: string;
    language: string;
    models: LspModel[];
    version: number;
};

/** A request of the client that waits for its answer. */
export type Waiting = {
    method: string;
    params: unknown;
    asking: string | null;
    /** The versions of the documents when the request was made, for a request that gets an edit. */
    asked: ReadonlyMap<string, number> | null;
    /**
     * For the resolve of a completion item, the params of the completion request whose answer the
     * client listed when it asked; that list is open while the item is resolved.
     */
    listed?: unknown;
};

/** The requests whose answers hold an edit the transport applies. */
export const EDITING: readonly string[] = [
    'textDocument/rename',
    'textDocument/codeAction',
    'codeAction/resolve'
];

/** A request of the host that waits for its answer. */
export type Own = {
    resolve: (value: unknown) => void;
    reject: (reason: Error) => void;
    /** The root of the document the request was made for, null for a request of none. */
    root: string | null;
};

/** A peek model and when it was made. */
export type Peek = { model: LspModel; page: string; made: number };
