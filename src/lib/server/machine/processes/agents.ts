// Layer 2, server. Which agent runs in a pane, read from the process table: tmux's own word for a
// pane cannot say, since it reports Claude Code by the version its binary is named after, and it
// names the shell for an agent typed in one. A pure reading of a table a caller hands it. `agentOf`
// (match.ts) answers another question, which agent a line of the Processes view belongs to, and
// matches the arguments of `man claude` as well; it is not used here.

import { isOwnTerminal, type Terminal, type TerminalAgent } from '../../../data/model/index.ts';
import type { Entry, TtyProcess } from './table.ts';

/** The runtimes a tool is started under, whose second word names the program. */
const RUNTIMES = ['node', 'bun'];

/** The file name of one word of a command line. */
function fileName(word: string | undefined): string {
    return word?.slice(word.lastIndexOf('/') + 1) ?? '';
}

/** The tool a word names, or null. */
function toolOf(word: string | undefined): TerminalAgent['tool'] | null {
    const name = fileName(word);
    return name === 'claude' || name === 'codex' ? name : null;
}

/**
 * The tool a command line runs: the file name of its first word, or of its second under a runtime.
 * A word further along is an argument, which is what tells `man claude` from claude.
 */
function runsAgent(command: string): TerminalAgent['tool'] | null {
    const [first, second] = command.trim().split(/\s+/);
    return toolOf(RUNTIMES.includes(fileName(first)) ? second : first);
}

/**
 * Whether an agent holds a terminal's foreground: a process of the group the terminal follows runs
 * one. A quit or suspended agent has given the foreground back, so a shell of any name answers no.
 */
export function foregroundAgent(processes: readonly TtyProcess[]): boolean {
    return processes.some((one) => one.pgid === one.tpgid && runsAgent(one.command) !== null);
}

/** The entries of a table by their parent's pid. */
export function childrenOf(table: readonly Entry[]): Map<number, Entry[]> {
    const children = new Map<number, Entry[]>();
    for (const entry of table) {
        const siblings = children.get(entry.ppid);
        if (siblings === undefined) children.set(entry.ppid, [entry]);
        else siblings.push(entry);
    }
    return children;
}

/**
 * The agent under a pane: the first entry that runs one, walking down from the pane's process
 * breadth first, so a claude under claude is the upper one. A process that is its own parent, or a
 * cycle of parents, ends the walk.
 */
export function paneAgent(
    pid: number,
    table: readonly Entry[],
    children: Map<number, Entry[]> = childrenOf(table)
): TerminalAgent | null {
    const seen = new Set<number>();
    let level = table.filter((entry) => entry.pid === pid);
    while (level.length > 0) {
        const next: Entry[] = [];
        for (const entry of level) {
            if (seen.has(entry.pid)) continue;
            seen.add(entry.pid);
            const tool = runsAgent(entry.command);
            if (tool !== null) return { tool, pid: entry.pid };
            next.push(...(children.get(entry.pid) ?? []));
        }
        level = next;
    }
    return null;
}

/**
 * The terminals with the agent each one's pane runs. A terminal whose id says `shell` is of the
 * agent's kind while one runs; an id that names its kind keeps it. A foreign terminal is left as it
 * was listed, since what runs in it is listed by its pane (server/machine/pty/panes/listing.ts).
 */
export function withAgents(terminals: readonly Terminal[], table: readonly Entry[]): Terminal[] {
    const children = childrenOf(table);
    return terminals.map((terminal) => {
        if (!isOwnTerminal(terminal.id)) return terminal;
        const agent = paneAgent(terminal.pid, table, children);
        const follows = terminal.id.endsWith('-shell') && agent !== null;
        return { ...terminal, agent, kind: follows ? agent.tool : terminal.kind };
    });
}
