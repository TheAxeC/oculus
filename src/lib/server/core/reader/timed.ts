// Layer 2, server. A fetch with a time limit, the one every request oculus sends out waits by: the
// reader's (call.ts), and the calendar's and the mail's pollers and token calls
// (server/accounts/). It sits at the foot of the server layer so each of them imports it downward.

/** What a request throws when it had no answer within its time, so a caller can say so. */
export class ReadTimeout extends Error {
    /** The time the request waited, in milliseconds. */
    readonly ms: number;

    constructor(ms: number) {
        super(`no answer within ${String(ms)} ms`);
        this.name = 'ReadTimeout';
        this.ms = ms;
    }
}

/**
 * A fetcher whose every call gives up after `ms`: the call's signal is the time limit, joined with
 * any signal the caller passed, so a service that never answers costs its caller one request and
 * never holds it. The limit covers the whole answer, its body included, and a call or a body read
 * it cut off throws ReadTimeout; any other failure is thrown as it came.
 */
export function timedFetcher(fetcher: typeof fetch, ms: number): typeof fetch {
    return async (input, init) => {
        const limit = AbortSignal.timeout(ms);
        const own = init?.signal;
        const signal = own ? AbortSignal.any([own, limit]) : limit;
        /** Whether a failure was the limit's doing rather than the caller's or the service's. */
        const cutOff = (): boolean => limit.aborted && own?.aborted !== true;
        let response: Response;
        try {
            response = await fetcher(input, { ...init, signal });
        } catch (error) {
            if (cutOff()) throw new ReadTimeout(ms);
            throw error;
        }
        if (response.body === null) return response;
        const reader = response.body.getReader();
        const body = new ReadableStream<Uint8Array>({
            async pull(controller) {
                try {
                    const { done, value } = await reader.read();
                    if (done) controller.close();
                    else controller.enqueue(value);
                } catch (error) {
                    controller.error(cutOff() ? new ReadTimeout(ms) : error);
                }
            },
            cancel(reason) {
                return reader.cancel(reason);
            }
        });
        return new Response(body, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
        });
    };
}
