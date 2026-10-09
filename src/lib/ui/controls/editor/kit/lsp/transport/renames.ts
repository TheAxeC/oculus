// Layer 3, primitive. What the transport does for a rename and for a jump to a definition, apart
// from the documents it owns: the requests it holds back until the server answered, the sentence
// a refused rename is rejected with, and the places a definition's answer named.
//
// Monaco's rename shows a string a provider rejects with at the caret and opens no box, which is
// how VS Code shows a language client's refusal; any other rejection only reaches the console. The
// transport therefore holds a `prepareRename` back until the answer is in (`Settling`), and rejects
// it with the server's sentence when the server refused it or answered none, "The element can't be
// renamed." The refusal of the rename itself comes after the box was closed, where the caret may
// have moved, so it is told as a notice of the page.
//
// A jump into another file is opened by Monaco at the start of the range it was given, collapsed.
// The places an answer names are told to the host (`placesOf`), which opens the one that starts
// where Monaco was told to go with its whole range selected.

import { REQUEST_CANCELLED, isRecord, type LspRange, type Rpc } from './messages';

/** The request that asks whether a rename can be made at a position. */
export const PREPARE = 'textDocument/prepareRename';

/** The request that renames. */
export const RENAME = 'textDocument/rename';

/** The requests whose answers name the places a jump goes to. */
export const JUMPS: readonly string[] = [
    'textDocument/definition',
    'textDocument/declaration',
    'textDocument/typeDefinition',
    'textDocument/implementation'
];

/** A request the transport answers the client for only when the server has answered it. */
export class Settling {
    readonly promise: Promise<void>;
    resolve: () => void = () => undefined;
    reject: (reason: string) => void = () => undefined;

    constructor() {
        this.promise = new Promise<void>((resolve, reject) => {
            this.resolve = resolve;
            this.reject = (reason) => {
                // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors -- Monaco shows a string at the caret and nothing else
                reject(reason);
            };
        });
    }
}

/**
 * The sentence a `prepareRename` answer is rejected with, or null when the answer is one to give
 * the client. A cancelled request (the relay has no server to take it) is no refusal.
 */
export function refusalOf(
    answer: Rpc,
    words: (key: string, ...words: string[]) => string
): string | null {
    if (answer.error !== undefined) {
        if (answer.error.code === REQUEST_CANCELLED) return null;
        return answer.error.message === ''
            ? words('lsp_rename_refused_empty')
            : answer.error.message;
    }
    return answer.result == null ? words('rename_none') : null;
}

/** A place a jump answer names: the client's address of a file and a range of it. */
export type Jump = { address: string; range: LspRange };

function rangeOf(value: unknown): LspRange | null {
    if (!isRecord(value) || !isRecord(value.start) || !isRecord(value.end)) return null;
    const { start, end } = value;
    const whole = [start.line, start.character, end.line, end.character];
    return whole.every((one) => typeof one === 'number') ? (value as LspRange) : null;
}

/**
 * The places a definition-like answer names, in the client's addresses: the selection range of a
 * link, the range of a location.
 */
export function placesOf(answer: unknown): Jump[] {
    const items = Array.isArray(answer) ? (answer as unknown[]) : answer == null ? [] : [answer];
    const places: Jump[] = [];
    for (const item of items) {
        if (!isRecord(item)) continue;
        const address = typeof item.uri === 'string' ? item.uri : item.targetUri;
        const range = rangeOf(item.targetSelectionRange ?? item.targetRange ?? item.range);
        if (typeof address === 'string' && range !== null) places.push({ address, range });
    }
    return places;
}
