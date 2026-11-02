// Layer 2, server. The tmux target of a terminal id. Every tmux command oculus builds for a
// terminal goes through `targetOf`, so a by-hand id reaches its one pane and an id oculus minted
// its session. It sits apart from sessions.ts so that module, the channels and the driver can all
// import it.

import { byHandPane } from '../../../../data/model/index.ts';
import { PREFIX } from '../../../transcripts/names.ts';

/** The tmux session name of a terminal id. */
export function sessionName(id: string): string {
    return `${PREFIX}${id}`;
}

/** The `%<number>` of the pane a by-hand id names, or null for any other id. */
export function paneTarget(id: string): string | null {
    const named = byHandPane(id);
    return named === null ? null : `%${String(named.pane)}`;
}

/** Where a tmux command for a terminal goes: its pane for a by-hand id, otherwise its session. */
export function targetOf(id: string): string {
    return paneTarget(id) ?? sessionName(id);
}
