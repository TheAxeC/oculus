// Layer 2, server. The requests of the Zenodo deposit, over InvenioRDM's REST calls ("Drafts and
// records"): every request is built from the address of `deposit.zenodo` and a path, never from a
// link an answer gives, waits by `timedFetcher` (an upload for `deposit.zenodo.timeout_s`, every
// other call for the Recover request limit `REQUEST_MS`) and carries the run's Cancel signal unless
// the call says otherwise. The token is read from the `downloads` row the row's `auth` names
// through `applyAuth`, and goes in the header its entry names, to that address alone; no answer,
// sentence or log line of this module holds it.
//
// `readerAccounts` is the machine's `downloads` rows without the rows `deposit.zenodo.auth` of any
// hub of the workspace names, which the Recover route hands its reader rows, so no reader row is
// given the Zenodo token.

import {
    zenodoSettings,
    type ZenodoSettings
} from '../../../data/sources/config/settings/files.ts';
import { READER_AGENT } from '../../core/reader/agent.ts';
import { applyAuth, type Account } from '../../core/reader/request.ts';
import { timedFetcher } from '../../core/reader/timed.ts';
import { REQUEST_MS } from '../../machine/runs/recover/files.ts';

/** The redirect statuses whose `Location` names a record the read follows. */
const REDIRECTS = [301, 302, 303, 307, 308];

/**
 * What one call answered: its status and JSON body, or why it has none; a redirect to a record of
 * the same API carries that record's id as `moved`.
 */
export type Answer =
    | { ok: true; status: number; body: unknown }
    | { ok: false; status: number; moved?: string }
    | { ok: false; cancelled: true }
    | { ok: false; unanswered: true };

/** The token's headers, or the `downloads` row that is missing. */
export type Access = { headers: Record<string, string> } | { missing: string };

/** The calls of one press: each by its method and the path after the address. */
export type ZenodoClient = {
    /** The address with its trailing `/api` removed, which a record's page is under. */
    site: string;
    /**
     * One call. `body` is sent as JSON, or as the bytes of an upload; `own` is null for a call a
     * Cancel does not end, the publish and what follows it and the deletion of a draft after a
     * Cancel, which the call's time limit alone bounds.
     */
    call: (method: string, path: string, body?: unknown, own?: null) => Promise<Answer>;
    /** A record by its id, a redirect to another record of the address followed once. */
    record: (id: string) => Promise<Answer>;
    /** The latest version of a record, the redirect Zenodo answers with followed once. */
    latest: (id: string) => Promise<Answer>;
};

/**
 * The headers the token goes in, or the row that is missing: the first required entry's row, or,
 * with no entry that applies, the rows the entries name.
 */
export function zenodoAccess(settings: ZenodoSettings, downloads: readonly Account[]): Access {
    const applied = applyAuth(settings.auth, downloads);
    if (applied.missing !== undefined) return { missing: applied.missing.row };
    if (!applied.keyed) return { missing: settings.auth.map((one) => one.row).join(', ') };
    return { headers: applied.headers };
}

/** Whether the token's row is held: what the deposit GET answers, never the token itself. */
export function zenodoReady(
    config: Record<string, unknown>,
    downloads: readonly Account[]
): boolean {
    return 'headers' in zenodoAccess(zenodoSettings(config), downloads);
}

/**
 * The machine's `downloads` rows without the ones the `deposit.zenodo.auth` of any of these hubs'
 * settings reads the token from, since a press reads the row its project's own hub names.
 */
export function readerAccounts(
    downloads: readonly Account[],
    configs: readonly Record<string, unknown>[]
): Account[] {
    const held = new Set(configs.flatMap((one) => zenodoSettings(one).auth.map((row) => row.row)));
    return downloads.filter((one) => !held.has(one.service));
}

/** The calls of one press, sent with `fetcher` under the run's `signal`. */
export function zenodoClient(
    settings: ZenodoSettings,
    headers: Record<string, string>,
    fetcher: typeof fetch,
    signal?: AbortSignal
): ZenodoClient {
    const call: ZenodoClient['call'] = async (method, path, body, own) => {
        const upload = body instanceof Uint8Array;
        const timed = timedFetcher(fetcher, upload ? settings.timeoutS * 1000 : REQUEST_MS);
        const waits = own === null ? undefined : signal;
        const sent: Record<string, string> = { ...headers, 'user-agent': READER_AGENT };
        if (body !== undefined) {
            sent['content-type'] = upload ? 'application/octet-stream' : 'application/json';
        }
        let response: Response;
        try {
            response = await timed(`${settings.address}${path}`, {
                method,
                headers: sent,
                redirect: 'manual',
                ...(body === undefined
                    ? {}
                    : { body: upload ? sendable(body) : JSON.stringify(body) }),
                ...(waits === undefined ? {} : { signal: waits })
            });
        } catch {
            return waits?.aborted === true
                ? { ok: false, cancelled: true }
                : { ok: false, unanswered: true };
        }
        if (REDIRECTS.includes(response.status)) {
            return { ok: false, status: response.status, ...locationOf(response) };
        }
        let read: unknown = null;
        try {
            const text = await response.text();
            read = text === '' ? null : (JSON.parse(text) as unknown);
        } catch {
            // A body that is not JSON is read as none; one cut off by Cancel is the Cancel.
            if (waits?.aborted === true) return { ok: false, cancelled: true };
        }
        if (!response.ok) return { ok: false, status: response.status };
        return { ok: true, status: response.status, body: read };
    };
    const followed = async (path: string): Promise<Answer> => {
        const read = await call('GET', path);
        if (read.ok || !('status' in read) || read.moved === undefined) return read;
        return call('GET', `/records/${read.moved}`);
    };
    return {
        site: settings.address.replace(/\/api$/, ''),
        call,
        record: (id) => followed(`/records/${id}`),
        latest: (id) => followed(`/records/${id}/versions/latest`)
    };
}

/**
 * The bytes of an upload as a request body takes them: over the buffer they lie in, with no copy,
 * and copied only when that buffer is a shared one.
 */
function sendable(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
    if (bytes.buffer instanceof ArrayBuffer) {
        return new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    }
    return new Uint8Array(bytes);
}

/**
 * The record id a redirect's `Location` names when it is a record of the same API, which the read
 * asks for again from the address rather than from the link.
 */
function locationOf(response: Response): { moved?: string } {
    const found = /\/records\/(\d+)\/?$/.exec(response.headers.get('location') ?? '');
    return found === null ? {} : { moved: found[1] };
}
