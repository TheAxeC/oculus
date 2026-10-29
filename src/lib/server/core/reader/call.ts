// Layer 2, server. One request of a reader row, bounded: the time it is given, the size its answer
// is read to, and the stop a failure of it is. Every request carries the User-Agent the reader is
// given, `oculus/<version>`, so a service sees which program asks.
//
// A request that gets no answer in time stops as `timeout`, one that gets no answer at all as
// `network`, an answer above the size cap as `answer`, a 429 as `limited` with the seconds the
// row's `wait` headers name, a 401 or 403 as `refused`, and any other status that is not 2xx as
// `status`. The message of a stop names the row's `name`, the state and the status, never the
// address or the body: an address can hold a secret, and a body can echo one.

import { ReadTimeout, timedFetcher } from './timed.ts';
import type { ReaderRow } from '../../../data/sources/config/settings/rows/grammar.ts';

/** The fetch a reading is handed, so a test answers it from a recorded answer. */
export type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

/** What one request answered with: its status, the address it ended at, its headers and body. */
export type Reply = { status: number; url: string; headers: Headers; text: string };

/** One request as the reader sends it. */
export type Outgoing = {
    url: string;
    method?: 'POST';
    headers: Record<string, string>;
    /** A JSON body, sent with its content type. */
    body?: string;
};

/** What every request of a reading is sent with. */
export type Sender = {
    fetcher: Fetcher;
    /** The User-Agent of every request. */
    agent: string;
    /** How long one request is given, in milliseconds. */
    timeoutMs: number;
    /** The most bytes of one answer that are read. */
    maxBytes: number;
    signal?: AbortSignal;
};

/** The states a request stops in. */
export type StopState = 'timeout' | 'network' | 'limited' | 'refused' | 'status' | 'answer';

/** A reading that stops: the row's name, the state, and the status and wait when there are. */
export class ReaderStop extends Error {
    readonly state: StopState;
    readonly status: number | undefined;
    /** The seconds to wait before asking again, when the answer named them. */
    readonly wait: number | undefined;

    constructor(
        name: string,
        state: StopState,
        detail: { status?: number | undefined; wait?: number | undefined } = {}
    ) {
        super(
            `${name}: ${detail.status === undefined ? state : `${state} ${String(detail.status)}`}`
        );
        this.name = 'ReaderStop';
        this.state = state;
        this.status = detail.status;
        this.wait = detail.wait;
    }
}

/**
 * The seconds a 429 says to wait, read through the row's `wait` headers: `retry_after` in seconds,
 * or `reset` when `remaining` says none is left (or names no header). Undefined when the answer
 * names no wait.
 */
function waitOf(headers: Headers, wait: ReaderRow['wait']): number | undefined {
    if (wait?.retry_after !== undefined) {
        const after = Number(headers.get(wait.retry_after));
        if (Number.isFinite(after) && after > 0) return Math.ceil(after);
    }
    if (wait?.reset !== undefined) {
        const left = wait.remaining === undefined ? '0' : headers.get(wait.remaining);
        const reset = Number(headers.get(wait.reset));
        if (left === '0' && Number.isFinite(reset) && reset > 0) return Math.ceil(reset);
    }
    return undefined;
}

/** A response's body read to its end or to the cap; above the cap the request stops. */
async function bounded(response: Response, max: number, name: string): Promise<string> {
    if (response.body === null) return '';
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > max) {
            await reader.cancel();
            throw new ReaderStop(name, 'answer', { status: response.status });
        }
        chunks.push(value);
    }
    return new TextDecoder().decode(Buffer.concat(chunks));
}

/** A fetch through the sender's fetcher, timed, with the address it ended at kept. */
async function fetched(
    sender: Sender,
    request: Outgoing,
    name: string,
    extra: Record<string, string> = {}
): Promise<{ response: Response; ended: string }> {
    let ended = request.url;
    const timed = timedFetcher(async (input, init) => {
        const url =
            typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        const response = await sender.fetcher(url, init);
        if (response.url !== '') ended = response.url;
        return response;
    }, sender.timeoutMs);
    const headers: Record<string, string> = {
        ...request.headers,
        ...extra,
        'user-agent': sender.agent
    };
    if (request.body !== undefined) headers['content-type'] = 'application/json';
    try {
        const response = await timed(request.url, {
            method: request.method ?? 'GET',
            headers,
            ...(request.body === undefined ? {} : { body: request.body }),
            redirect: 'follow',
            ...(sender.signal === undefined ? {} : { signal: sender.signal })
        });
        return { response, ended };
    } catch (error) {
        if (error instanceof ReadTimeout) throw new ReaderStop(name, 'timeout');
        if (sender.signal?.aborted === true) throw error;
        throw new ReaderStop(name, 'network');
    }
}

/** The stop a status that is not 2xx is. */
function statusStop(status: number, headers: Headers, row: ReaderRow): ReaderStop {
    if (status === 429) {
        return new ReaderStop(row.name, 'limited', { status, wait: waitOf(headers, row.wait) });
    }
    const state = status === 401 || status === 403 ? 'refused' : 'status';
    return new ReaderStop(row.name, state, { status });
}

/** One request of a row, its answer read whole when it is 2xx; any other answer stops. */
export async function send(sender: Sender, request: Outgoing, row: ReaderRow): Promise<Reply> {
    const { response, ended } = await fetched(sender, request, row.name);
    let text: string;
    try {
        text = await bounded(response, sender.maxBytes, row.name);
    } catch (error) {
        if (error instanceof ReaderStop) throw error;
        if (error instanceof ReadTimeout) throw new ReaderStop(row.name, 'timeout');
        if (sender.signal?.aborted === true) throw error;
        throw new ReaderStop(row.name, 'network');
    }
    const { status } = response;
    if (status >= 200 && status < 300) {
        return { status, url: ended, headers: response.headers, text };
    }
    throw statusStop(status, response.headers, row);
}

/**
 * The size of the file at an address and the address it ends at, by a GET of its first byte: the
 * total of `Content-Range` on a 206, `Content-Length` on a 2xx that ignored the range, and null
 * when the answer states neither. The body is not read. `name` is the name the stop carries.
 */
export async function firstByteSize(
    sender: Sender,
    request: Outgoing,
    row: ReaderRow,
    name: string = row.name
): Promise<{ size: number | null; url: string }> {
    const { response, ended } = await fetched(sender, request, name, { range: 'bytes=0-0' });
    await response.body?.cancel().catch(() => undefined);
    const { status } = response;
    if (status === 206) {
        const total = /\/(\d+)\s*$/.exec(response.headers.get('content-range') ?? '');
        return { size: total === null ? null : Number(total[1]), url: ended };
    }
    if (status >= 200 && status <= 299) {
        const length = response.headers.get('content-length');
        return {
            size: length !== null && /^\d+$/.test(length) ? Number(length) : null,
            url: ended
        };
    }
    const stop = statusStop(status, response.headers, row);
    throw new ReaderStop(name, stop.state, { status, wait: stop.wait });
}
