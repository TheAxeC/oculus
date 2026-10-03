// Layer 2, client state. The Processes view's pure parts: the rows read out of a kept payload, the
// arrangement of those rows into one group per oculus terminal and the matched processes, the head
// line, and the sort a column head sets. No runes and no store here, so each is tested directly.

import { z } from 'zod';
import { isMap, text } from '../../../data/helpers/guards.ts';
import type { ProcessRow, Terminal } from '../../../data/model/index.ts';
import { readOr } from '../../../data/shapes/shapes.ts';
import { t } from '../../shared/words/text.ts';

export type { ProcessRow } from '../../../data/model/index.ts';

/** A finite number of at least 0, else 0. */
function figure(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
}

/** One row of a kept payload, or null when it has no numeric pid or no text for a command. */
function readRow(raw: unknown): ProcessRow | null {
    if (!isMap(raw)) return null;
    if (typeof raw.pid !== 'number' || !Number.isFinite(raw.pid)) return null;
    if (typeof raw.command !== 'string') return null;
    const row: ProcessRow = {
        pid: raw.pid,
        ppid: figure(raw.ppid),
        user: text(raw.user),
        started: text(raw.started),
        cpu: figure(raw.cpu),
        memory: figure(raw.memory),
        command: raw.command,
        folder: text(raw.folder)
    };
    if (typeof raw.terminal === 'string' && raw.terminal !== '') row.terminal = raw.terminal;
    return row;
}

/** The rows of a payload's list that read, in their order; none for anything but a list. */
export function readRows(raw: unknown): ProcessRow[] {
    return Array.isArray(raw) ? raw.flatMap((one) => readRow(one) ?? []) : [];
}

/** One oculus terminal with the processes under it. */
export type ProcessGroup = {
    terminal: string;
    /** The terminal as the terminals store draws it: its title, else its name, else its id. */
    name: string;
    /** The terminal's pane process: the table's row of it, else one drawn from the record. */
    head: ProcessRow;
    /** Whether `head` is the table's row and not drawn from the terminal's record. */
    listed: boolean;
    /** The other processes of the terminal, by pid. */
    rows: ProcessRow[];
    /** Whether the page may end the terminal: the page holds its record and oculus minted it. */
    stoppable: boolean;
};

/** The groups in the order the payload first names their terminals, then the matched rows. */
export type Arranged = { groups: ProcessGroup[]; matched: ProcessRow[] };

/** The row a group is drawn with when the table has none for the pane process. */
function drawnHead(terminal: string, record: Terminal | null): ProcessRow {
    return {
        pid: record?.pid ?? 0,
        ppid: 0,
        user: '',
        started: '',
        cpu: 0,
        memory: 0,
        command: record?.command ?? '',
        folder: '',
        terminal
    };
}

/** Arrange the rows of a payload over the terminals the page holds. */
export function arrange(
    rows: readonly ProcessRow[],
    terminalById: (id: string) => Terminal | null,
    label: (held: Pick<Terminal, 'name' | 'title'>) => string
): Arranged {
    const owned = new Map<string, ProcessRow[]>();
    const matched: ProcessRow[] = [];
    for (const row of rows) {
        if (row.terminal === undefined) {
            matched.push(row);
            continue;
        }
        const held = owned.get(row.terminal);
        if (held === undefined) owned.set(row.terminal, [row]);
        else held.push(row);
    }
    const groups: ProcessGroup[] = [];
    for (const [terminal, held] of owned) {
        const record = terminalById(terminal);
        const found = record === null ? undefined : held.find((row) => row.pid === record.pid);
        const others = held.filter((row) => row !== found).sort((a, b) => a.pid - b.pid);
        groups.push({
            terminal,
            name: record === null ? terminal : label(record),
            head: found ?? drawnHead(terminal, record),
            listed: found !== undefined,
            rows: others,
            stoppable: record !== null && record.foreign !== true
        });
    }
    return { groups, matched };
}

/** The head line: the projects in flight and the agents running, each in its singular form. */
export function headLine(projects: number, agents: number): string {
    return t(
        'processes.head',
        projects === 1 ? t('processes.head_project_one') : t('processes.head_projects', projects),
        agents === 1 ? t('processes.head_agent_one') : t('processes.head_agents', agents)
    );
}

/** The columns a head press sorts by, the keys of a row. */
const SORT_KEYS = ['pid', 'ppid', 'user', 'started', 'cpu', 'memory', 'command', 'folder'] as const;

/** Which column the rows are sorted by, and which way. */
export type ProcessesSort = { key: (typeof SORT_KEYS)[number]; direction: 'asc' | 'desc' };

/** What one Processes pane holds. */
type ProcessesViewState = { sort: ProcessesSort };

/** The sort a pane starts with, the busiest process first; a new object for each pane. */
function defaultSort(): ProcessesSort {
    return { key: 'cpu', direction: 'desc' };
}

const stateShape = z.object({
    sort: z.object({ key: z.enum(SORT_KEYS), direction: z.enum(['asc', 'desc']) })
}) satisfies z.ZodType<ProcessesViewState>;

/** The state a pane holds, or the default sort for anything that does not read. */
export function parseProcessesState(raw: unknown): ProcessesViewState {
    return readOr(stateShape, raw, { sort: defaultSort() });
}

/** The sort after a press on a column head: a new column sorts up, the column in force turns. */
export function pressed(sort: ProcessesSort, key: ProcessesSort['key']): ProcessesSort {
    if (sort.key !== key) return { key, direction: 'asc' };
    return { key, direction: sort.direction === 'asc' ? 'desc' : 'asc' };
}
