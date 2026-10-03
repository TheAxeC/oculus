// Layer 2, server. One read of the Processes view: the process table, oculus's own processes (the
// trees under the pane of every terminal session), the processes the pattern list matches, the
// agents of the whole table, the working folder of each listed process, and the count of projects
// in flight. The table, the tmux panes, `lsof` and the project folders are reached through
// ReadDeps, so a test passes fixed tables and nothing reads or signals the machine's processes.

import { sep } from 'node:path';
import type { ProcessRow } from '../../../data/model/index.ts';
import { realPath } from '../../core/paths.ts';
import type { Pane } from '../pty/sessions.ts';
import { agentOf, matches } from './match.ts';
import { ReadFailure } from './failure.ts';
import type { Entry } from './table.ts';

export type ReadDeps = {
    /** The process table of the machine; aborting the signal ends the run that reads it. */
    table: (signal?: AbortSignal) => Promise<Entry[]>;
    /** Every pane of every terminal and usage session of oculus. */
    panes: () => Promise<Pane[]>;
    /** The working folder of each pid `lsof` answered for. */
    folders: (pids: number[], signal?: AbortSignal) => Promise<Map<number, string>>;
    /** The absolute folder of every project of the hub. */
    projects: () => string[];
};

/** What one read lists. */
type Read = { rows: ProcessRow[]; agents: number; projects: number };

/**
 * The pids under `start` by parent pid, `start` included, each pid once over every walk that shares
 * `seen`; a process that is its own parent, or a cycle of parents, ends the walk.
 */
function tree(start: number, children: Map<number, Entry[]>, seen: Set<number>): number[] {
    const found: number[] = [];
    const pending = [start];
    for (let pid = pending.pop(); pid !== undefined; pid = pending.pop()) {
        if (seen.has(pid)) continue;
        seen.add(pid);
        found.push(pid);
        for (const child of children.get(pid) ?? []) pending.push(child.pid);
    }
    return found;
}

/** The real path of each project folder that exists. */
function realProjects(folders: string[]): string[] {
    return folders.flatMap((folder) => realPath(folder, true) ?? []);
}

/** The deepest project that holds `folder`, matched by whole path segments over real paths. */
function projectOf(folder: string, projects: string[]): string | null {
    const real = realPath(folder, true);
    if (real === null) return null;
    let deepest: string | null = null;
    for (const project of projects) {
        const holds =
            real === project || real.startsWith(project.endsWith(sep) ? project : project + sep);
        if (holds && (deepest === null || project.length > deepest.length)) deepest = project;
    }
    return deepest;
}

/** Read the machine once for the given program names. */
export async function readProcesses(
    deps: ReadDeps,
    patterns: readonly string[],
    signal?: AbortSignal
): Promise<Read> {
    const [table, panes] = await Promise.all([deps.table(signal), deps.panes()]);
    if (table.length === 0) throw new ReadFailure('empty');

    const byPid = new Map(table.map((entry) => [entry.pid, entry]));
    const children = new Map<number, Entry[]>();
    for (const entry of table) {
        const siblings = children.get(entry.ppid);
        if (siblings === undefined) children.set(entry.ppid, [entry]);
        else siblings.push(entry);
    }

    // Oculus's own: the trees under the panes of its terminal sessions, each process to the first
    // pane that reaches it. The hidden usage sessions' trees are kept apart and are not own.
    const owned = new Set<number>();
    const byTerminal = new Map<string, number[]>();
    for (const pane of panes) {
        if (pane.usage || pane.terminal === null) continue;
        const found = tree(pane.pid, children, owned);
        byTerminal.set(pane.terminal, [...(byTerminal.get(pane.terminal) ?? []), ...found]);
    }
    const usage = new Set<number>();
    for (const pane of panes) if (pane.usage) tree(pane.pid, children, usage);

    const own: { entry: Entry; terminal: string }[] = [];
    for (const [terminal, pids] of byTerminal) {
        const listed = pids.flatMap((pid) => byPid.get(pid) ?? []);
        for (const entry of listed.sort((a, b) => a.pid - b.pid)) own.push({ entry, terminal });
    }
    const matched = table
        .filter((entry) => !owned.has(entry.pid) && matches(entry.command, patterns))
        .sort((a, b) => b.cpu - a.cpu || a.pid - b.pid);

    // The agents of the whole table; a process whose parent runs the same program is not counted
    // again.
    const agents = table.filter((entry) => {
        const agent = agentOf(entry.command);
        if (agent === null || usage.has(entry.pid)) return false;
        const parent = entry.ppid === entry.pid ? undefined : byPid.get(entry.ppid);
        return parent === undefined || agentOf(parent.command) !== agent;
    });

    const asked = [
        ...new Set([
            ...own.map(({ entry }) => entry.pid),
            ...matched.map((entry) => entry.pid),
            ...agents.map((entry) => entry.pid)
        ])
    ].sort((a, b) => a - b);
    const folders =
        asked.length === 0 ? new Map<number, string>() : await deps.folders(asked, signal);
    const folderOf = (pid: number): string => folders.get(pid) ?? '';

    const rows: ProcessRow[] = [
        ...own.map(({ entry, terminal }) => ({ ...entry, folder: folderOf(entry.pid), terminal })),
        ...matched.map((entry) => ({ ...entry, folder: folderOf(entry.pid) }))
    ];

    const projects = realProjects(deps.projects());
    const inFlight = new Set<string>();
    for (const pid of new Set([
        ...own.map(({ entry }) => entry.pid),
        ...agents.map((entry) => entry.pid)
    ])) {
        const project = projectOf(folderOf(pid), projects);
        if (project !== null) inFlight.add(project);
    }
    return { rows, agents: agents.length, projects: inFlight.size };
}
