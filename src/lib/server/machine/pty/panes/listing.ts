// Layer 2, server. The panes of the tmux server as one list call answers them, and what the
// terminal list and the Processes view read from it. The list call is `list-sessions` and
// `list-panes -a` joined by tmux's `;`, so one process gives both and the rows agree; a pane row is
// told from a session row by the word `pane` in its second field, where a session row holds a time.
//
// `terminalsOf` is the one reading of that answer with a process table: the sessions as
// parseTerminals reads them, each with its agent, and each pane of a session oculus did not start
// that runs an agent as a terminal of its own. A pane's id is minted here alone, from the row tmux
// gave, so a session named like one stays `foreign` and no target is built from its name.

import { isOwnTerminal, type Terminal } from '../../../../data/model/index.ts';
import { USAGE_PREFIX } from '../../../transcripts/names.ts';
import { paneAgent, childrenOf, withAgents } from '../../processes/agents.ts';
import type { Entry } from '../../processes/table.ts';
import { listArgs, parseTerminals, terminalId, type RunOptions } from '../sessions.ts';
import { run } from '../tmux.ts';

/** The fields of a pane row; the pid of the tmux server is the last, as in a session row. */
const PANE_FORMAT = [
    '#{pane_id}',
    'pane',
    '#{pane_pid}',
    '#{pane_width}',
    '#{pane_height}',
    '#{session_id}',
    '#{session_created}',
    '#{session_attached}',
    '#{pane_current_command}',
    '#{session_name}',
    '#{pane_current_path}',
    '#{pid}'
].join('\t');

/** A row of the pane list, by the name of each field of PANE_FORMAT that is read. */
type PaneRow = {
    number: string;
    pid: number;
    cols: number;
    rows: number;
    session: string;
    created: number;
    attached: boolean;
    command: string;
    name: string;
    cwd: string;
    server: string;
};

/** The arguments of the list: every session, then every pane, in one tmux process. */
export function paneListArgs(): string[] {
    return [...listArgs(), ';', 'list-panes', '-a', '-F', PANE_FORMAT];
}

/** One line of the list as a pane row, or null for a session row or a pane with no pid. */
function paneRow(line: string): PaneRow | null {
    const fields = line.split('\t');
    if (fields[1] !== 'pane' || fields.length < 12) return null;
    const [id, , pid, cols, rows, session, created, attached, command, name, cwd] = fields;
    const server = fields.at(-1) ?? '';
    if (!/^%\d+$/.test(id) || !/^[1-9]\d*$/.test(pid) || !/^\d+$/.test(server)) return null;
    return {
        number: id.slice(1),
        pid: Number(pid),
        cols: Number(cols),
        rows: Number(rows),
        session,
        created: Number(created),
        attached: Number(attached) > 0,
        command,
        name,
        cwd,
        server
    };
}

/** Whether a tmux session's name says oculus started it, for a terminal or a usage run. */
function isOculusSession(name: string): boolean {
    return name.startsWith(USAGE_PREFIX) || isOwnTerminal(terminalId(name));
}

/**
 * The rows of a list, one per pane. tmux prints a pane once per session holding its window, and one
 * pane is one terminal; a pane an oculus session holds is that session's.
 */
function onePerPane(rows: readonly PaneRow[]): PaneRow[] {
    const panes = new Map<string, PaneRow>();
    for (const row of rows) {
        const held = panes.get(row.number);
        const ours = held !== undefined && isOculusSession(row.name) && !isOculusSession(held.name);
        if (held === undefined || ours) panes.set(row.number, row);
    }
    return [...panes.values()];
}

/** The terminal of one pane of a session oculus did not start, while it runs an agent. */
function byHandRow(row: PaneRow, table: readonly Entry[], children: Map<number, Entry[]>) {
    const agent = paneAgent(row.pid, table, children);
    if (agent === null) return null;
    const id = `h${row.server}p${row.number}-${agent.tool}`;
    const terminal: Terminal = {
        id,
        name: row.name,
        title: '',
        icon: '',
        color: '',
        kind: agent.tool,
        app: '',
        cwd: row.cwd,
        command: row.command,
        pid: row.pid,
        created: new Date(row.created * 1000).toISOString(),
        attached: row.attached,
        resumes: null,
        task: false,
        exit: null,
        job: null,
        agent,
        byHand: { session: row.session, cols: row.cols, rows: row.rows }
    };
    return terminal;
}

/**
 * The terminals of one list answer over a process table. A pane that runs an agent takes the place
 * of the `foreign` row of each session holding it, and of a `foreign` row whose name is the pane's
 * own id.
 */
export function terminalsOf(text: string, table: readonly Entry[]): Terminal[] {
    const children = childrenOf(table);
    const panes = text.split('\n').flatMap((line) => paneRow(line) ?? []);
    const shown = onePerPane(panes)
        .filter((row) => !isOculusSession(row.name))
        .flatMap((row) => {
            const terminal = byHandRow(row, table, children);
            return terminal === null ? [] : [{ terminal, number: row.number }];
        });
    const numbers = new Set(shown.map((one) => one.number));
    const taken = new Set([
        ...panes.filter((row) => numbers.has(row.number)).map((row) => terminalId(row.name)),
        ...shown.map((one) => one.terminal.id)
    ]);
    const listed = withAgents(parseTerminals(text), table);
    return [
        ...listed.filter((one) => one.foreign !== true || !taken.has(one.id)),
        ...shown.map((one) => one.terminal)
    ];
}

/** The pane process of one pane of an oculus session. */
export type Pane = {
    session: string;
    /** The terminal id of a terminal session; null for a hidden usage session. */
    terminal: string | null;
    /** True for a hidden usage session. */
    usage: boolean;
    pid: number;
};

/** The arguments of the pane list: every pane of every session, with its session and pane pid. */
function paneArgs(): string[] {
    return ['list-panes', '-a', '-F', '#{session_name} #{pane_pid}'];
}

/**
 * The panes of the terminal sessions and of the hidden usage sessions, one per line of the list.
 * A session that is neither (not oculus's, or named `oculus-` by hand with no terminal id) and a
 * line with no whole positive pid are left out.
 */
function parsePanes(text: string): Pane[] {
    const panes: Pane[] = [];
    for (const line of text.split('\n')) {
        const cut = line.lastIndexOf(' ');
        const field = line.slice(cut + 1);
        if (cut < 0 || !/^\d+$/.test(field) || Number(field) === 0) continue;
        const session = line.slice(0, cut);
        const pid = Number(field);
        if (session.startsWith(USAGE_PREFIX)) {
            panes.push({ session, terminal: null, usage: true, pid });
            continue;
        }
        const id = terminalId(session);
        if (isOwnTerminal(id)) panes.push({ session, terminal: id, usage: false, pid });
    }
    return panes;
}

/** Every pane of every terminal and usage session; none when tmux is not running. */
export async function listPanes(options: RunOptions = {}): Promise<Pane[]> {
    try {
        return parsePanes(await (options.run ?? run)(paneArgs(), options));
    } catch {
        return [];
    }
}
