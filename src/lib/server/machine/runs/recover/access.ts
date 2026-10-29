// Layer 2, server. Whether Recover may fetch a dataset's sources that sign in: for each source
// whose row of `recover.sources` has an `access` address and an `auth` entry that sends a
// credential, the `downloads` row that entry names in the primary hub's `local.yml` and the answer
// of the address. No row, or a row the address answers with 401 or 403, is access missing, which
// disables Fetch and shows the row to add.
//
// An entry that is `required` is missing with nothing asked when its `downloads` row is absent,
// and is asked once with the row when it is there. Any other entry's address is asked first
// without a credential: a 2xx answer is an open set that needs none, 401 or 403 a set that needs
// the row, asked again with it when the row is there, and any other answer or none is unreachable.
// Oculus reads no other file for a credential: never `~/.netrc` nor a key file a service's own
// tool keeps in the home folder.

import type { RecoverAccess, RecoverSource } from '../../../../data/model/index.ts';
import type { Auth, ReaderRow } from '../../../../data/sources/config/settings/rows/grammar.ts';
import { fillAddress } from '../../../../data/sources/config/settings/rows/holes.ts';
import { ReaderStop, send } from '../../../core/reader/call.ts';
import { applyAuth } from '../../../core/reader/request.ts';
import { rowOf, senderOf, type ListDeps } from './files.ts';

/** The access of one service a dataset's sources need, with the status of its request. */
export type ServiceAccess = RecoverAccess;

/** The entry of a row's `auth` that signs in: the first that sends a user or a header. */
function signIn(row: ReaderRow): Auth | undefined {
    return row.auth?.find((entry) => entry.basic === true || entry.header !== undefined);
}

/** The answer's status as an access state. */
function stateOf(status: number): 'ok' | 'missing' | 'unreachable' {
    if (status === 401 || status === 403) return 'missing';
    return status >= 200 && status <= 299 ? 'ok' : 'unreachable';
}

/** The status of one request of the access address, or null when no answer came. */
async function statusOf(
    deps: ListDeps,
    row: ReaderRow,
    url: string,
    headers: Record<string, string>
): Promise<number | null> {
    try {
        return (await send(senderOf(deps), { url, headers }, row)).status;
    } catch (error) {
        if (error instanceof ReaderStop) return error.status ?? null;
        throw error;
    }
}

/** The access of one source, or null when it needs none. */
async function sourceAccess(source: RecoverSource, deps: ListDeps): Promise<ServiceAccess | null> {
    const row = rowOf(deps.rows, source.kind);
    const entry = row === undefined ? undefined : signIn(row);
    if (row?.access === undefined || entry === undefined) return null;
    const applied = applyAuth([entry], deps.downloads);
    const held = applied.keyed;
    const base = {
        service: entry.row,
        name: row.name,
        basic: entry.basic === true,
        ...(entry.help === undefined ? {} : { help: entry.help })
    };
    const reached = (status: number | null): ServiceAccess =>
        status === null
            ? { ...base, state: 'unreachable', row: held }
            : { ...base, state: stateOf(status), row: held, status };
    const url = fillAddress(row.access.address, (name) => source[name]);
    if (entry.required === true) {
        if (!held) return { ...base, state: 'missing', row: false };
        return reached(url === undefined ? null : await statusOf(deps, row, url, applied.headers));
    }
    if (url === undefined) return reached(null);
    const open = await statusOf(deps, row, url, {});
    if (open !== null && open >= 200 && open <= 299) return null;
    if (open === null || (open !== 401 && open !== 403)) return reached(open);
    return held ? reached(await statusOf(deps, row, url, applied.headers)) : reached(open);
}

/**
 * The access of each service the sources need, one entry per service in the sources' order; a
 * service two sources need is missing when either finds it missing.
 */
export async function accessOf(
    retrieval: RecoverSource[],
    deps: ListDeps
): Promise<ServiceAccess[]> {
    const found: ServiceAccess[] = [];
    for (const source of retrieval) {
        const access = await sourceAccess(source, deps);
        if (access === null) continue;
        const held = found.findIndex((one) => one.service === access.service);
        if (held === -1) found.push(access);
        else if (found[held].state === 'ok') found[held] = access;
    }
    return found;
}

/** Whether a Fetch may start: every service the sources need answers its row. */
export function accessGranted(access: ServiceAccess[]): boolean {
    return access.every((one) => one.state === 'ok');
}
