// Layer 2, client state. The Processes view's reader of the single `processes` entity, the
// arrangement of its rows over the terminals the page holds, the head line, and the question that
// ends a terminal. The view never signals a process: a yes ends the terminal through the terminals
// store, which stops its tmux session and with it every process in it. It also reads the app hosts
// the view lists above its table, from the `app-hosts` entity, and counts the programs the view
// lists as running: the rows its table draws and the app hosts that are running or starting. That
// count is the one the view's tab carries.

import type { AppHostRow, ProcessesPayload, Terminal } from '../../../../data/model/index.ts';
import { t } from '../../../shared/words/text.ts';
import type { EntitiesStore } from '../../../shared/stores/shapes.ts';
import { arrange, headLine, readRows, type Arranged, type ProcessGroup } from './processes.ts';

/** The question before a terminal ends: the words, the line under them and what a yes runs. */
type StopAsk = { message: string; detail: string; act: () => void };

/**
 * What the store asks of the terminals store: a terminal's record, the name the terminals store
 * calls a terminal by, and the end of terminals.
 */
type TerminalEnding = {
    terminalById: (id: string | null) => Terminal | null;
    label: (held: Pick<Terminal, 'name' | 'title'>) => string;
    endTerminals: (ids: string[]) => void;
};

/** One client's reader of the Processes read, and its one question. */
export type ProcessesStore = {
    /** The latest read with only the rows that read, or null before the first one. */
    read: () => ProcessesPayload | null;
    /** The rows of the latest read as groups and matched rows. */
    arranged: () => Arranged;
    /** The head line of the latest read, or the empty string before the first one. */
    head: () => string;
    /** The app hosts the view lists above its table, the rows of the `app-hosts` entity. */
    hosts: () => AppHostRow[];
    /**
     * How many programs the view lists as running: the process rows its table draws, each process
     * one row (a group's pane process when it has a pid, the group's other processes and the
     * matched ones), and each app host of `hosts` that is running or starting, the hosts the view
     * draws with Stop. The table's rows of the last good read count after a failed one, and none
     * count before the first read; a host that ended or waits is not counted.
     */
    count: () => number;
    /** The question that ends a group's terminal; its yes ends the terminal and nothing else. */
    stopAsk: (group: ProcessGroup) => StopAsk;
};

export function createProcesses(
    entities: EntitiesStore,
    terminals: TerminalEnding
): ProcessesStore {
    /** The rows of each payload object are read once. */
    let source: ProcessesPayload | null = null;
    let kept: ProcessesPayload | null = null;

    function read(): ProcessesPayload | null {
        const payload = entities.processes();
        if (payload === null) return null;
        if (payload !== source) {
            source = payload;
            kept = { ...payload, rows: readRows(payload.rows) };
        }
        return kept;
    }

    function arranged(): Arranged {
        return arrange(read()?.rows ?? [], terminals.terminalById, terminals.label);
    }

    function hosts(): AppHostRow[] {
        return entities.appHosts()?.rows ?? [];
    }

    /** The process rows the view's table draws; the table is not drawn for a read with no rows. */
    function tableRows(): number {
        if ((read()?.rows.length ?? 0) === 0) return 0;
        const { groups, matched } = arranged();
        return groups.reduce(
            (sum, group) => sum + (group.head.pid > 0 ? 1 : 0) + group.rows.length,
            matched.length
        );
    }

    function count(): number {
        const live = hosts().filter((one) => one.state === 'running' || one.state === 'starting');
        return tableRows() + live.length;
    }

    return {
        read,
        arranged,
        hosts,
        count,
        head() {
            const payload = read();
            return payload === null ? '' : headLine(payload.projects, payload.agents);
        },
        stopAsk: (group) => ({
            message: t('processes.stop_question', group.name, group.head.command, group.head.pid),
            detail: '',
            act: () => terminals.endTerminals([group.terminal])
        })
    };
}
