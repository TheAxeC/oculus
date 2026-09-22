// Layer 2, server. The authenticated calls both connectors make: one paged GET, one POST, the rows
// of a paged answer, and the check a provider's own address is put through.
//
// It exists so the refusal sentence is written once. Both providers answer a refusal as JSON with a
// code in it, and the line the view shows is the status and that code alone: a provider's body can
// carry the account's own address, a calendar's name or a correspondent's, and none of that belongs
// on a page or in a log.

import { isMap, str } from '../../../data/helpers/guards.ts';
import type { ConnectProvider } from '../../../data/model.ts';
import type { Fetcher } from './oauth.ts';

/**
 * The error code a provider put in its refusal, or nothing when it put none there. Google names it
 * `status` and repeats the HTTP status under `code`; Microsoft names it `code`. A numeric code is
 * left out, since it says no more than the status the line already carries.
 */
function codeOf(body: unknown): string {
    if (!isMap(body)) return '';
    const error = body.error;
    if (typeof error === 'string') return error;
    if (isMap(error)) return str(error.status) ?? str(error.code) ?? '';
    return '';
}

/** One line saying what a provider refused: the provider, the status and its own code. */
export function refusalLine(provider: ConnectProvider, status: number, body: unknown): string {
    const code = codeOf(body);
    return `${provider}: ${status}${code === '' ? '' : ` ${code}`}`;
}

/** Read one answer as a parsed object, saying whether it could be read at all. */
async function parsed(response: Response): Promise<{ read: boolean; body: unknown }> {
    try {
        return { read: true, body: await response.json() };
    } catch {
        return { read: false, body: null };
    }
}

/**
 * One authenticated GET, answered as a parsed object. A refused call throws the one line the view
 * shows: the provider, the status and the provider's own code.
 *
 * An answer this cannot read is a refusal too, whatever its status: a 2xx whose body is not JSON, or
 * is JSON that is not an object, tells nothing about the account, and reading it as an empty answer
 * would mark the account connected and replace its last good rows with nothing.
 */
export async function getJson(
    provider: ConnectProvider,
    url: string,
    args: { token: string; fetcher: Fetcher; headers?: Record<string, string> }
): Promise<Record<string, unknown>> {
    const response = await args.fetcher(url, {
        headers: { authorization: `Bearer ${args.token}`, ...(args.headers ?? {}) }
    });
    const answer = await parsed(response);
    if (!response.ok) throw new Error(refusalLine(provider, response.status, answer.body));
    if (!answer.read || !isMap(answer.body)) {
        throw new Error(`${provider}: ${response.status} unreadable answer`);
    }
    return answer.body;
}

/**
 * One authenticated POST of a JSON body, answered as a parsed object. A provider that answers a
 * write with no body at all (Graph answers a reply with 202 and nothing) is a good answer and reads
 * as the empty object, since what a write needs back is that it happened.
 */
export async function postJson(
    provider: ConnectProvider,
    url: string,
    args: { token: string; fetcher: Fetcher; body: unknown }
): Promise<Record<string, unknown>> {
    const response = await args.fetcher(url, {
        method: 'POST',
        headers: {
            authorization: `Bearer ${args.token}`,
            'content-type': 'application/json'
        },
        body: JSON.stringify(args.body)
    });
    const answer = await parsed(response);
    if (!response.ok) throw new Error(refusalLine(provider, response.status, answer.body));
    return isMap(answer.body) ? answer.body : {};
}

/** The rows of a paged answer, under the key the provider lists them at. */
export function rowsOf(body: Record<string, unknown>, key: string): Record<string, unknown>[] {
    const held = body[key];
    return Array.isArray(held) ? held.filter(isMap) : [];
}

/** How many pages one listing is followed over, so a wrong answer cannot loop for ever. */
export const PAGE_MAX = 20;

/**
 * A provider's page for something, and nothing when what it gave is not an `https` address. The link
 * is the one field of a provider's answer that the operating system or the browser is later asked to
 * open, so a scheme that is not `https` is dropped here rather than carried into a payload.
 */
export function httpsLink(value: string | undefined): string | undefined {
    if (value === undefined) return undefined;
    try {
        return new URL(value).protocol === 'https:' ? value : undefined;
    } catch {
        return undefined;
    }
}
