// Layer 2, server. The diagnostics of a server that answers `textDocument/diagnostic` and publishes
// nothing (the Markdown server). A document's diagnostics are asked for 500 ms after it was opened
// or last changed, so typing is not followed by a request per key, and for every open document when
// the server says its answers changed (`workspace/diagnostic/refresh`). An answer is published as
// the `textDocument/publishDiagnostics` the page already reads, in the server's addresses, and is
// dropped when the document was changed, closed or opened again while it was out, since the answer
// is then about text other than the one the server holds.

import type { LspRpc } from '../../../../../data/model/index.ts';
import { docKey } from '../doc-key.ts';
import type { Doc, Held } from '../held.ts';

/** The milliseconds a document waits after its last open or change before it is asked about. */
const PULL_MS = 500;

export class Pulls {
    #held: Held;
    #publish: (message: LspRpc) => void;
    #timers = new Map<string, ReturnType<typeof setTimeout>>();

    constructor(held: Held, publish: (message: LspRpc) => void) {
        this.#held = held;
        this.#publish = publish;
    }

    /** Ask for a document's diagnostics 500 ms from now, in place of an ask already waiting. */
    schedule(doc: Doc): void {
        const key = docKey(doc.fileUri);
        this.#forget(key);
        const timer = setTimeout(() => {
            this.#timers.delete(key);
            void this.#pull(key);
        }, PULL_MS);
        if (typeof timer === 'object' && typeof timer.unref === 'function') timer.unref();
        this.#timers.set(key, timer);
    }

    /** A document was closed: nothing is asked about it. */
    forget(doc: Doc): void {
        this.#forget(docKey(doc.fileUri));
    }

    /** Ask for the diagnostics of every open document now. */
    all(): void {
        for (const key of [...this.#held.docs.keys()]) {
            this.#forget(key);
            void this.#pull(key);
        }
    }

    /** Ask about nothing more. */
    clear(): void {
        for (const timer of this.#timers.values()) clearTimeout(timer);
        this.#timers.clear();
    }

    #forget(key: string): void {
        const timer = this.#timers.get(key);
        if (timer !== undefined) clearTimeout(timer);
        this.#timers.delete(key);
    }

    async #pull(key: string): Promise<void> {
        const doc = this.#held.docs.get(key);
        if (doc === undefined) return;
        const version = doc.version;
        const answer = await this.#held.call('textDocument/diagnostic', {
            textDocument: { uri: doc.fileUri }
        });
        if (this.#held.docs.get(key) !== doc || doc.version !== version) return;
        const result = answer?.result;
        if (answer?.error !== undefined || typeof result !== 'object' || result === null) return;
        const items = (result as { items?: unknown }).items;
        if (!Array.isArray(items)) return;
        this.#publish({
            jsonrpc: '2.0',
            method: 'textDocument/publishDiagnostics',
            params: { uri: doc.fileUri, version: doc.version, diagnostics: items }
        });
    }
}
