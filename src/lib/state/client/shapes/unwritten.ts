// Layer 2, client state. Telling whatever registered of a write that did not land: one the server
// refused, in whole or a field of it, or one that got no answer. It is apart from the store
// (writes.svelte.ts) because it holds what the listeners hear, and the store what is sent.

import type { SendOptions, UnwrittenListener, WriteAnswer } from '../../shared/stores/shapes.ts';

/**
 * One write's answer, whether the server gave it or the write got none, and whether its `error` is
 * the one the server's answer named (`coded`), which a caller's `words` say as a sentence.
 */
export type Exchange = { answer: WriteAnswer; answered: boolean; coded?: boolean };

/** The listeners of a store, and the call that tells them of a write. */
type Unwritten = {
    onUnwritten: (listener: UnwrittenListener) => void;
    tell: (sent: Exchange, options: SendOptions) => WriteAnswer;
};

export function createUnwritten(): Unwritten {
    /** What registered to hear a write that did not land. */
    const listeners: UnwrittenListener[] = [];

    function onUnwritten(listener: UnwrittenListener): void {
        listeners.push(listener);
    }

    /**
     * Say a write that did not land to every listener: one the server refused, in whole or a field
     * of it, or one that got no answer, a refusal the server named by a code in the caller's
     * `words` for it, and the git action the write was when it was one. A listener that fails
     * leaves the caller the answer it already has, which is what the caller acts on.
     */
    function tell(sent: Exchange, options: SendOptions): WriteAnswer {
        const { answer, answered } = sent;
        if (options.said === true || (answer.ok && answer.refused.length === 0)) return answer;
        if (answer.code !== undefined && options.asked?.includes(answer.code) === true) {
            return answer;
        }
        const fields = answer.refused.map((one) => one.reason).filter((one) => one !== '');
        const { words } = options;
        const named = sent.coded === true && words !== undefined && answer.error !== undefined;
        const error = named ? words(answer.error ?? '', answer.reason) : (answer.error ?? '');
        const reason = fields.length > 0 ? fields.join('; ') : error;
        for (const listener of listeners) {
            try {
                listener(reason, answered, options.action);
            } catch {
                continue;
            }
        }
        return answer;
    }

    return { onUnwritten, tell };
}
