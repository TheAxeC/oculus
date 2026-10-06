// Layer 2, server. Start one of the four update tasks. The tray's press reaches it through the
// terminal endpoint (pty/routes.ts) and a schedule's run (schedules/run.ts) calls it at a due time,
// so both start the same ordinary interactive Claude session in the hub root.
//
// The task is `<claude> '/research-cockpit <kind>'`: the skill invocation is the session's first
// message, passed as the positional argument, so every permission prompt the CLI raises is
// answered in the terminal pane by the reader. A schedule's Run unattended puts
// `--dangerously-skip-permissions` in front of it, which runs the task with nobody asked; a press
// never does. The start keeps no record: a press belongs to no schedule, and a schedule's run is
// recorded by the watcher (schedules/watch.ts).

import type { Terminal, TerminalRefusal } from '../../../data/model/index.ts';
import type { UpdateTask } from '../../../data/helpers/run/tasks.ts';
import { shellWord } from '../pty/shell-word.ts';
import { startTerminal, type StartOptions } from '../pty/sessions.ts';
import { TerminalRefused } from '../pty/refusal.ts';

/** What starts an update task, beyond the tmux options of every terminal start. */
export type TaskStartOptions = StartOptions & {
    /** The hub root the session starts in. */
    hub: string;
    /** The `claude` program, as `claude_bin` of the machine's configuration names it. */
    claudeBin: string;
    /** The terminal's grid: the page's size for a press, a fixed one for a scheduled run. */
    size: { cols: unknown; rows: unknown };
};

/** The terminal a start made, or the word it was refused with. */
export type TaskStart = { terminal: Terminal } | { refused: TerminalRefusal; names: string[] };

/** The grid of a scheduled run, which no page is sized for. */
export const SCHEDULED_SIZE = { cols: 80, rows: 24 };

/**
 * The server-built shell command for one update task: the skill invocation as the session's first
 * message, with the flag that turns the prompts off only when the caller asks for it.
 */
function taskCommand(binary: string, kind: UpdateTask, skip: boolean): string {
    const argv = [binary];
    if (skip) argv.push('--dangerously-skip-permissions');
    argv.push(`/research-cockpit ${kind}`);
    return argv.map(shellWord).join(' ');
}

/**
 * Start one update task as a Claude terminal in the configured hub root. `skip` is the caller's:
 * a press passes false and a schedule its `unattended`. A refusal that names its cause comes back
 * as its word; any other failure is thrown for the caller to answer.
 */
export async function startUpdateTask(
    kind: UpdateTask,
    skip: boolean,
    options: TaskStartOptions
): Promise<TaskStart> {
    try {
        const terminal = await startTerminal(
            {
                kind: 'claude',
                cwd: options.hub,
                cols: options.size.cols,
                rows: options.size.rows,
                name: `task ${kind}`
            },
            { ...options, command: taskCommand(options.claudeBin, kind, skip) }
        );
        return { terminal };
    } catch (error) {
        if (error instanceof TerminalRefused) return { refused: error.word, names: error.names };
        throw error;
    }
}
