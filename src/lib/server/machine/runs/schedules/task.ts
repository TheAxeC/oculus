// Layer 2, server. Start one of the four update tasks. The tray's press reaches it through the
// terminal endpoint (pty/routes.ts) and a schedule's run (schedules/run.ts) calls it at a due time,
// so both start the same ordinary interactive Claude session in the hub root.
//
// A task is a file of the primary hub, `.oculus/tasks/<kind>.md`, that a Claude Code session
// follows on its own. The task is `<claude> '<sentence>'`: the catalog's sentence naming that file
// is the session's first message, passed as the positional argument, so every permission prompt
// the CLI raises is answered in the terminal pane by the reader. A hub that holds no file for the
// task is refused with `task-file-missing` and nothing starts. A schedule's Run unattended puts
// `--dangerously-skip-permissions` in front of it, which runs the task with nobody asked; a press
// never does. The start keeps no record: a press belongs to no schedule, and a schedule's run is
// recorded by the watcher (schedules/watch.ts).
//
// No print-mode flag is passed (`-p`, `--output-format stream-json`, `--verbose`, `--include-
// partial-messages`), so a task is the interactive session the chat terminal already is, and a
// press adds no flag.

import { statSync } from 'node:fs';
import { join } from 'node:path';
import type { Terminal, TerminalRefusal } from '../../../../data/model/index.ts';
import { UPDATE_TASKS, type UpdateTask } from '../../../../data/helpers/run/tasks.ts';
import { words } from '../../../core/words.ts';
import { shellWord } from '../../pty/shell-word.ts';
import { startTerminal, type StartOptions } from '../../pty/sessions.ts';
import { TerminalRefused } from '../../pty/refusal.ts';

/** What starts an update task, beyond the tmux options of every terminal start. */
export type TaskStartOptions = StartOptions & {
    /** The primary hub's folder the session starts in; null while the workspace has no primary. */
    hub: string | null;
    /** The `claude` program, as `claude_bin` of the machine's configuration names it. */
    claudeBin: string;
    /** The terminal's grid: the page's size for a press, a fixed one for a scheduled run. */
    size: { cols: unknown; rows: unknown };
    /** The text catalog, which holds the sentence the session is started with. */
    text: Record<string, string>;
};

/** The terminal a start made, or the word it was refused with. */
export type TaskStart = { terminal: Terminal } | { refused: TerminalRefusal; names: string[] };

/** The grid of a scheduled run, which no page is sized for. */
export const SCHEDULED_SIZE = { cols: 80, rows: 24 };

/** The folder of a hub that holds the task files, relative to the hub. */
export const TASKS_FOLDER = '.oculus/tasks';

/** The file a task's session follows, relative to the hub, as the session's sentence names it. */
function taskFile(kind: UpdateTask): string {
    return `${TASKS_FOLDER}/${kind}.md`;
}

/** Whether the hub holds the task's file, following a link to a file. */
function hasTaskFile(hub: string, kind: UpdateTask): boolean {
    try {
        return statSync(join(hub, taskFile(kind))).isFile();
    } catch {
        return false;
    }
}

/** The update tasks whose file the hub holds, in the order of UPDATE_TASKS; none without a hub. */
export function tasksWithFile(hub: string | null): UpdateTask[] {
    return hub === null ? [] : UPDATE_TASKS.filter((kind) => hasTaskFile(hub, kind));
}

/**
 * The server-built shell command for one update task: the sentence naming the task's file as the
 * session's first message, with the flag that turns the prompts off only when the caller asks.
 */
function taskCommand(
    binary: string,
    kind: UpdateTask,
    skip: boolean,
    text: Record<string, string>
): string {
    const argv = [binary];
    if (skip) argv.push('--dangerously-skip-permissions');
    argv.push(words(text, 'server.task.update_task', taskFile(kind)));
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
    if (options.hub === null) return { refused: 'no-primary', names: [] };
    if (!hasTaskFile(options.hub, kind)) {
        return { refused: 'task-file-missing', names: [taskFile(kind)] };
    }
    try {
        const terminal = await startTerminal(
            {
                kind: 'claude',
                cwd: options.hub,
                cols: options.size.cols,
                rows: options.size.rows,
                name: `task ${kind}`
            },
            {
                ...options,
                command: taskCommand(options.claudeBin, kind, skip, options.text)
            }
        );
        return { terminal };
    } catch (error) {
        if (error instanceof TerminalRefused) return { refused: error.word, names: error.names };
        throw error;
    }
}
