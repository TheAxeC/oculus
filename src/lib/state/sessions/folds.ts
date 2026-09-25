// Layer 2, client state. The folds the session views draw from: the session rows of the tree the
// selectors group, the tree cut to the rows a list keeps, how many rows a workspace or a list
// holds, where a terminal may start, and a session's agents newest first. Pure over the payloads
// they are handed, so every one is checked without a browser.

import type { Area, GroupedSession, SessionAgent, Workspace } from '../../data/model/index.ts';

/** Every session row of the tree, workspace by workspace and area by area. */
export function sessionRows(tree: Workspace[]): GroupedSession[] {
    return tree.flatMap((workspace) => workspace.areas.flatMap((area) => area.sessions));
}

/** The tree cut to the rows `keep` holds, an area or a workspace left with none dropped. */
export function pruneTree(tree: Workspace[], keep: (row: GroupedSession) => boolean): Workspace[] {
    const found: Workspace[] = [];
    for (const workspace of tree) {
        const areas: Area[] = [];
        for (const area of workspace.areas) {
            const sessions = area.sessions.filter(keep);
            if (sessions.length > 0) areas.push({ ...area, sessions });
        }
        if (areas.length > 0) found.push({ ...workspace, areas });
    }
    return found;
}

/** How many session rows one workspace's areas hold. */
export function sessionCount(workspace: Workspace): number {
    return workspace.areas.reduce((total, area) => total + area.sessions.length, 0);
}

/** How many of the rows are live. */
export function liveCount(rows: readonly { live: boolean }[]): number {
    return rows.filter((row) => row.live).length;
}

/** How many of the rows `hidden` says are hidden, and how many ended rows it leaves shown. */
export function hiddenCounts(
    rows: GroupedSession[],
    hidden: (row: GroupedSession) => boolean
): { dismissed: number; ended: number } {
    return {
        dismissed: rows.filter((row) => hidden(row)).length,
        ended: rows.filter((row) => !row.live && !hidden(row)).length
    };
}

/** Where a terminal may start: the hub and every workspace the tree names, once each, by name. */
export function terminalPlaces(hub: string, tree: Workspace[]): string[] {
    return [...new Set([hub, ...tree.map((one) => one.key)])].filter((key) => key !== '').sort();
}

/**
 * A session's agents newest first by the moment each started. The server lists the transcript's
 * subagents and the launched builders in two runs, so the order is the stamps', not the list's; an
 * agent with no stamp goes last.
 */
export function newestFirst(agents: readonly SessionAgent[]): SessionAgent[] {
    return [...agents].sort((a, b) => (b.started ?? '').localeCompare(a.started ?? ''));
}

/** Whether any agent is still running, which is what keeps a running count moving. */
export function anyRunning(agents: readonly SessionAgent[]): boolean {
    return agents.some((agent) => agent.status === 'running');
}
