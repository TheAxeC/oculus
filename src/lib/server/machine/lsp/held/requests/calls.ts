// Layer 2, server. The requests the relay itself makes of a language server, besides those it
// forwards for the page: the pull of a document's diagnostics, the ask for the edit of a move, the
// notices a path watcher sends. Each has an id of its own, a string no page and no relay counter
// can equal, and the answer is read here and never reaches the page.

import type { LspRpc } from '../../../../../data/model/index.ts';

/** The prefix of every id this module makes. */
const PREFIX = 'oculus-call:';

export class Calls {
    #next = 0;
    #waiting = new Map<string, (answer: LspRpc | null) => void>();

    /**
     * Make a request and hand its message to `send`, which answers whether the server took it. The
     * promise is the server's answer, or null when the server did not take the request or ended
     * before it answered.
     */
    begin(
        method: string,
        params: unknown,
        send: (message: LspRpc) => boolean
    ): Promise<LspRpc | null> {
        this.#next += 1;
        const id = `${PREFIX}${this.#next}`;
        return new Promise((resolve) => {
            this.#waiting.set(id, resolve);
            if (!send({ jsonrpc: '2.0', id, method, params })) {
                this.#waiting.delete(id);
                resolve(null);
            }
        });
    }

    /** Take a message of the server when it answers one of these; false for any other. */
    take(message: LspRpc): boolean {
        if (message.method !== undefined || typeof message.id !== 'string') return false;
        const resolve = this.#waiting.get(message.id);
        if (resolve === undefined) return false;
        this.#waiting.delete(message.id);
        resolve(message);
        return true;
    }

    /** The server is gone: every request waiting is answered with nothing. */
    end(): void {
        for (const resolve of this.#waiting.values()) resolve(null);
        this.#waiting.clear();
    }
}
