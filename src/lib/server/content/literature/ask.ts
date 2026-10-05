// Layer 2, server. One request to one source, bounded: the time it is given, the size it is read
// to, and the state a failure of it is.
//
// A source's answer is read to at most 5 MB. A request that gets no answer in time, an answer above
// the cap, a refusal and a status that is not 2xx each stop the source's search with a SourceStop
// naming a state; the handler turns it into the source's answer and the other sources are not
// touched. The message of a SourceStop holds the source, the status and the source's own code
// when it gave a plain one, and never the address or the body: an address can hold a key, and a
// body can echo one.

import { ReadTimeout, timedFetcher, type Fetcher } from '../../accounts/connect/oauth.ts';
import type { LiteratureSource, SourceNotOk } from '../../../data/model/index.ts';

/** The most bytes of one answer that are read. */
const ANSWER_MAX = 5 * 1024 * 1024;

/** What one request answered with. */
export type Reply = { status: number; headers: Headers; text: string };

/** How an adapter asks its source for one address. */
export type Call = (url: string, headers?: Record<string, string>) => Promise<Reply>;

/** The states a stop can name. */
type StopState = Exclude<SourceNotOk['state'], 'no-key' | 'skipped'>;

/** A source's search that stops with a state. */
export class SourceStop extends Error {
    readonly state: StopState;
    readonly status: number | undefined;
    /** The seconds to wait, when the source named them. */
    readonly wait: number | undefined;

    constructor(
        source: LiteratureSource,
        state: StopState,
        detail: { status?: number; code?: string | undefined; wait?: number | undefined } = {}
    ) {
        const code = detail.code === undefined ? '' : ` ${detail.code}`;
        super(`${source}: ${detail.status === undefined ? state : String(detail.status)}${code}`);
        this.name = 'SourceStop';
        this.state = state;
        this.status = detail.status;
        this.wait = detail.wait;
    }
}

/** A word the source gave as its code for a refusal: a plain identifier and nothing longer. */
const CODE = /^[A-Za-z][A-Za-z0-9_.-]{0,39}$/;

/** The code a refusal body names under `code`, `error` or `status`, or nothing. */
function codeOf(text: string, secrets: string[]): string | undefined {
    let body: unknown;
    try {
        body = JSON.parse(text);
    } catch {
        return undefined;
    }
    if (typeof body !== 'object' || body === null) return undefined;
    for (const name of ['code', 'error', 'status']) {
        const held = (body as Record<string, unknown>)[name];
        if (typeof held === 'string' && CODE.test(held)) {
            return secrets.some((key) => key !== '' && held.includes(key)) ? undefined : held;
        }
    }
    return undefined;
}

/**
 * The seconds a 429 says to wait: `Retry-After` in seconds, or OpenAlex's reset of its daily
 * credits when none are left. OpenAlex's wait is only ever the daily reset, so the page words a
 * wait of that source as the daily limit. Nothing when the source names no wait.
 */
function waitOf(headers: Headers, source: LiteratureSource): number | undefined {
    if (source !== 'openalex') {
        const after = Number(headers.get('retry-after'));
        if (Number.isFinite(after) && after > 0) return Math.ceil(after);
        return undefined;
    }
    const reset = Number(headers.get('x-ratelimit-reset'));
    const left = headers.get('x-ratelimit-remaining');
    if (left === '0' && Number.isFinite(reset) && reset > 0) return Math.ceil(reset);
    return undefined;
}

/** Read a response to its end or to the cap, whichever comes first; above the cap is a failure. */
async function bounded(response: Response, source: LiteratureSource): Promise<string> {
    if (response.body === null) return '';
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > ANSWER_MAX) {
            await reader.cancel();
            throw new SourceStop(source, 'failed', { status: response.status });
        }
        chunks.push(value);
    }
    return new TextDecoder().decode(Buffer.concat(chunks));
}

/**
 * The call an adapter asks with: the given fetcher, limited to `ms`, one address at a time. A
 * non-2xx status stops the search with the state it names; `secrets` are the keys the machine
 * holds, kept out of any code a message would carry.
 */
export function callFor(
    source: LiteratureSource,
    fetcher: Fetcher,
    ms: number,
    signal: AbortSignal,
    secrets: string[]
): Call {
    const timed = timedFetcher(fetcher, ms);
    return async (url, headers = {}) => {
        let response: Response;
        let text: string;
        try {
            response = await timed(url, { headers, signal, redirect: 'follow' });
            text = await bounded(response, source);
        } catch (error) {
            if (error instanceof SourceStop) throw error;
            if (error instanceof ReadTimeout) throw new SourceStop(source, 'timeout');
            if (signal.aborted) throw error;
            throw new SourceStop(source, 'failed');
        }
        const { status } = response;
        if (status >= 200 && status < 300) return { status, headers: response.headers, text };
        const code = codeOf(text, secrets);
        if (status === 429) {
            throw new SourceStop(source, 'limited', {
                status,
                wait: waitOf(response.headers, source),
                code
            });
        }
        const state = status === 401 || status === 403 ? 'refused' : 'failed';
        throw new SourceStop(source, state, { status, code });
    };
}
