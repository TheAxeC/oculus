// Layer 2, server. The three calls of a git host's Sign in by the device flow (RFC 8628, as GitHub
// runs it), made by hand beside oauth.ts with no new dependency: the POST to the row's
// `device_code` address with the client id and the row's `git_scope`, which answers the code the
// reader types and the address to type it at; the POST to the row's `token` address that polls for
// the token; and the GET of the row's `user` address with the token, which answers the login.
//
// The token is sent to the `user` address alone and is received from the `token` address alone,
// both of the host's own row. No error carries a body, the token or the device code: a failure is
// the HTTP status, or the provider's own error word.

import { z } from 'zod';
import { readAs } from '../../../../data/shapes/shapes.ts';
import type { Fetcher } from '../oauth.ts';

/** What the `device_code` address answered: the codes, the address, the timing in seconds. */
export type DeviceStart = {
    deviceCode: string;
    userCode: string;
    verificationUri: string;
    interval: number;
    expiresIn: number;
};

/** A call that failed, with the HTTP status or the provider's error word. */
export type Failed = { failed: string };

/** The interval the flow polls at when the answer names none, in seconds (RFC 8628 3.2). */
const DEFAULT_INTERVAL_S = 5;

const startShape = z.object({
    device_code: z.string().min(1),
    user_code: z.string().min(1),
    verification_uri: z.string().min(1),
    interval: z.number().positive().optional(),
    expires_in: z.number().positive()
});

/** The headers of a form POST whose answer is JSON. */
const FORM_HEADERS = {
    Accept: 'application/json',
    'Content-Type': 'application/x-www-form-urlencoded'
};

/** The answer's JSON, or null when it is none. */
async function jsonOf(response: Response): Promise<unknown> {
    try {
        return await response.json();
    } catch {
        return null;
    }
}

/** Ask the `device_code` address for a code, with the client id and the scope. */
export async function startDevice(
    address: string,
    clientId: string,
    scope: string,
    fetcher: Fetcher
): Promise<DeviceStart | Failed> {
    const response = await fetcher(address, {
        method: 'POST',
        headers: FORM_HEADERS,
        body: new URLSearchParams({ client_id: clientId, scope }).toString()
    });
    if (!response.ok) return { failed: `HTTP ${String(response.status)}` };
    const read = readAs(startShape, await jsonOf(response));
    if (read === null) return { failed: 'no device code in the answer' };
    return {
        deviceCode: read.device_code,
        userCode: read.user_code,
        verificationUri: read.verification_uri,
        interval: read.interval ?? DEFAULT_INTERVAL_S,
        expiresIn: read.expires_in
    };
}

/** What one poll of the `token` address answered. */
export type Polled =
    | { token: string }
    | { pending: true }
    | { slowDown: true }
    | { denied: true }
    | { expired: true }
    | Failed;

const pollShape = z.object({
    access_token: z.string().min(1).optional(),
    error: z.string().optional()
});

/** Poll the `token` address once for the token of a device code. */
export async function pollToken(
    address: string,
    clientId: string,
    deviceCode: string,
    fetcher: Fetcher
): Promise<Polled> {
    const response = await fetcher(address, {
        method: 'POST',
        headers: FORM_HEADERS,
        body: new URLSearchParams({
            client_id: clientId,
            device_code: deviceCode,
            grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
        }).toString()
    });
    const read = readAs(pollShape, await jsonOf(response));
    if (read === null) return { failed: `HTTP ${String(response.status)}` };
    if (read.access_token !== undefined && response.ok) return { token: read.access_token };
    switch (read.error) {
        case 'authorization_pending':
            return { pending: true };
        case 'slow_down':
            return { slowDown: true };
        case 'access_denied':
            return { denied: true };
        case 'expired_token':
            return { expired: true };
        case undefined:
            return { failed: `HTTP ${String(response.status)}` };
        default:
            return { failed: read.error };
    }
}

const userShape = z.object({ login: z.string().min(1) });

/** The login the token belongs to, read from the `user` address with the token. */
export async function readLogin(
    address: string,
    token: string,
    fetcher: Fetcher
): Promise<{ login: string } | Failed> {
    const response = await fetcher(address, {
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` }
    });
    if (!response.ok) return { failed: `HTTP ${String(response.status)}` };
    const read = readAs(userShape, await jsonOf(response));
    return read === null ? { failed: 'no login in the answer' } : { login: read.login };
}
