// Layer 2, client state. The words of the status bar's first four items, made from what the socket
// and the usage, HPC and sessions channels hold. The page reads those stores and hands the shell
// these words, since the shell's row of the boundary table names none of them; the fifth item, the
// unsaved tabs, is counted by the shell from the layout and ui stores it does read.

import type { HpcPayload, SessionsPayload, UsagePayload } from '../../../data/model.ts';
import { t } from '../../words/text.ts';

/** The socket's three states, as state/client/socket.svelte.ts names them. */
export type SocketState = 'connecting' | 'open' | 'closed';

/** The words the status bar draws for the socket, the usage, the HPC poll and the live count. */
export type StatusWords = { socket: string; usage: string; hpc: string; live: number };

/** The socket's state in the bar's own short words. */
export function socketWords(state: SocketState): string {
    if (state === 'connecting') return t('workbench.status_socket_connecting');
    if (state === 'open') return t('workbench.status_socket_open');
    return t('workbench.status_socket_closed');
}

/**
 * The usage refreshers taken together: down when one is down, refreshing while one runs, ok when
 * every one ran, and none when no account has one.
 */
export function usageWords(usage: UsagePayload | null): string {
    const states = (usage?.accounts ?? []).flatMap((account) =>
        account.refresher === undefined ? [] : [account.refresher.state]
    );
    if (states.length === 0) return t('workbench.status_usage_none');
    if (states.includes('down')) return t('workbench.status_usage_down');
    if (states.includes('refreshing')) return t('workbench.status_usage_refreshing');
    return t('workbench.status_usage_ok');
}

/** The Live HPC poll in the words its own head uses: the state, and the counts once live. */
export function hpcWords(data: HpcPayload | null): string {
    if (data === null || data.status === 'starting') return t('hpc.polling');
    if (data.status === 'unreachable') return t('hpc.unreachable');
    if (data.status === 'error') return t('hpc.error');
    return t('hpc.queue_summary', data.running, data.pending, data.total);
}

/** How many sessions the sessions channel holds live. */
export function liveCount(sessions: SessionsPayload | null): number {
    return (sessions?.records ?? []).filter((record) => record.live).length;
}

/** The four items' words at once, which is what the page hands the shell. */
export function statusWords(
    state: SocketState,
    usage: UsagePayload | null,
    hpc: HpcPayload | null,
    sessions: SessionsPayload | null
): StatusWords {
    return {
        socket: socketWords(state),
        usage: usageWords(usage),
        hpc: hpcWords(hpc),
        live: liveCount(sessions)
    };
}
