// Layer 2, server. Whether Recover may fetch a dataset's credentialed sources: for each PhysioNet,
// Kaggle and Synapse source, the `downloads` row of its service in the primary hub's `local.yml`
// and one login request by the server with it (PhysioNet's `SHA256SUMS.txt` of the set, Kaggle's
// file list of the dataset, Synapse's user profile). No row, or a row the service answers with 401
// or 403, is access missing, which disables Fetch and shows the row to add.
//
// A PhysioNet set is credentialed when its `SHA256SUMS.txt` answers 401 or 403 to a request
// without a row; an open set (mitdb) answers 200 and needs no row. Oculus reads no other file for
// a credential: never `~/.netrc` nor `~/.kaggle/kaggle.json`. A Kaggle source signs in with the
// `kaggle` row alone, so a file holding only a `kaggle-token` row is Kaggle access missing.

import type { RecoverAccess, RecoverService, RecoverSource } from '../../../../data/model/index.ts';
import { authHeader, getText, isRefusal, type ListDeps } from './files.ts';
import { physionetBase } from './sources/physionet.ts';
import { kaggleListUrl, SYNAPSE_API } from './sources/tokened.ts';

/** The access of one service a dataset's sources need, with the status of its login request. */
export type ServiceAccess = RecoverAccess;

/** The service of a source whose files need a credential, or of a PhysioNet source. */
function serviceOf(source: RecoverSource): RecoverService | null {
    return source.kind === 'physionet' || source.kind === 'kaggle' || source.kind === 'synapse'
        ? source.kind
        : null;
}

/** The answer's status as an access state. */
function stateOf(status: number): 'ok' | 'missing' | 'unreachable' {
    if (status === 401 || status === 403) return 'missing';
    return status >= 200 && status <= 299 ? 'ok' : 'unreachable';
}

/** The status of one login request, or null when no answer came. */
async function statusOf(
    deps: ListDeps,
    service: RecoverService,
    url: string,
    headers: Record<string, string>
): Promise<number | null> {
    const answer = await getText(deps, service, url, headers);
    return isRefusal(answer) ? null : answer.status;
}

/** The access of one source, or null when it needs none. */
async function sourceAccess(source: RecoverSource, deps: ListDeps): Promise<ServiceAccess | null> {
    const service = serviceOf(source);
    if (service === null) return null;
    const headers = authHeader(service, deps.downloads);
    const row = headers.authorization !== undefined;
    const reached = (status: number | null): ServiceAccess =>
        status === null
            ? { service, state: 'unreachable', row }
            : { service, state: stateOf(status), row, status };
    if (source.kind === 'physionet') {
        const sums = `${physionetBase(source.project, source.version)}SHA256SUMS.txt`;
        const open = await statusOf(deps, service, sums, {});
        if (open !== null && open >= 200 && open <= 299) return null;
        if (open === null || (open !== 401 && open !== 403)) return reached(open);
        return row ? reached(await statusOf(deps, service, sums, headers)) : reached(open);
    }
    if (!row) return { service, state: 'missing', row };
    if (source.kind === 'kaggle') {
        const list = kaggleListUrl(source.dataset);
        return list === null
            ? reached(null)
            : reached(await statusOf(deps, service, list, headers));
    }
    return reached(await statusOf(deps, service, `${SYNAPSE_API}/userProfile`, headers));
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
