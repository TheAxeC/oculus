// Layer 2, server. Start one update task of a hub. The tray's press reaches it through the terminal
// endpoint (pty/routes.ts) and a schedule's run (schedules/run.ts) calls it at a due time, so both
// start the same ordinary interactive Claude session in the root of the hub they name.
//
// A hub's update tasks are the rows of its `update_tasks` (settings/hub-rows.ts), each naming a
// file of the hub, `.oculus/tasks/<task>.md`, that a Claude Code session follows on its own. The
// tray offers each row of every hub of the open workspace whose file the hub holds
// (`offeredTasks`), and a press or a schedule names the hub whose task it runs, the primary when it
// names none. The task is `<claude> '<sentence>'`: the catalog's sentence naming that file is the
// session's first message, passed as the positional argument, so every permission prompt the CLI
// raises is answered in the terminal pane by the reader. A task the hub's `update_tasks` does not
// list is refused with `update-task-unlisted`, and one whose file the hub does not hold with
// `task-file-missing`, each naming the hub, and nothing starts. A schedule's Run unattended puts
// `--dangerously-skip-permissions` in front of it, which runs the task with nobody asked; a press
// never does. The start keeps no record: a press belongs to no schedule, and a schedule's run is
// recorded by the watcher (schedules/watch.ts).
//
// No print-mode flag is passed (`-p`, `--output-format stream-json`, `--verbose`, `--include-
// partial-messages`), so a task is the interactive session the chat terminal already is, and a
// press adds no flag.

import { statSync } from 'node:fs';
import { join } from 'node:path';
import type { HubSettings } from '../../../../data/index.ts';
import type {
    HubTask,
    Terminal,
    TerminalRefusal,
    UpdateTask
} from '../../../../data/model/index.ts';
import { HUB_FILE } from '../../../../data/helpers/hub-names.ts';
import {
    updateTasks,
    type UpdateTaskRow
} from '../../../../data/sources/config/settings/hub-rows.ts';
import type { OpenWorkspace } from '../../../files/workspace/open.ts';
import { words } from '../../../core/words.ts';
import { shellWord } from '../../pty/shell-word.ts';
import { startTerminal, type StartOptions } from '../../pty/sessions.ts';
import { TerminalRefused } from '../../pty/refusal.ts';

/**
 * The hubs of the open workspace a task runs in, read from it at the call, and the merged settings
 * of each, which its `update_tasks` is read from.
 */
export type TaskHubs = Pick<OpenWorkspace, 'primary' | 'primaryDir' | 'hubs'> & {
    /** The merged settings of the hub whose folder is `dir`. */
    settingsOf: (dir: string) => Record<string, unknown>;
};

/** One hub of the open workspace: its name and its folder. */
type HubFolder = TaskHubs['hubs'][number];

/**
 * The hubs of `open` with their settings: the primary's the merged config `primary` gives, every
 * other hub's its own parse that `settings` gives.
 */
export function taskHubs(
    open: Pick<OpenWorkspace, 'primary' | 'primaryDir' | 'hubs'>,
    primary: () => Record<string, unknown>,
    settings: HubSettings
): TaskHubs {
    return {
        primary: open.primary,
        primaryDir: open.primaryDir,
        hubs: open.hubs,
        settingsOf: (dir) => (dir === open.primaryDir ? primary() : settings(dir).config)
    };
}

/** What starts an update task, beyond the tmux options of every terminal start. */
export type TaskStartOptions = StartOptions & {
    /** The hub whose task it is: its name, which a refusal names, and the folder it starts in. */
    hub: HubFolder;
    /** The tasks the rows of the hub's `update_tasks` name, which the task must be one of. */
    listed: readonly UpdateTask[];
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

/** The rows of the `update_tasks` of a hub that its rule takes, in the file's order. */
function rowsOf(open: TaskHubs, hub: HubFolder): UpdateTaskRow[] {
    return updateTasks(open.settingsOf(hub.dir));
}

/** The tasks the rows of a hub's `update_tasks` name, in the file's order. */
export function taskNames(open: TaskHubs, hub: HubFolder): UpdateTask[] {
    return rowsOf(open, hub).map((row) => row.task);
}

/**
 * The update tasks the hubs offer: one per row of a hub's `update_tasks` whose file the hub holds,
 * by hub, the primary first and the other hubs in the folders' order, and within one hub in the
 * order of its rows. Empty when no hub offers a task, and null while the workspace holds no hub.
 */
export function offeredTasks(open: TaskHubs): HubTask[] | null {
    if (open.hubs.length === 0) return null;
    const hubs = [
        ...open.hubs.filter((one) => one.name === open.primary),
        ...open.hubs.filter((one) => one.name !== open.primary)
    ];
    return hubs.flatMap((one) =>
        rowsOf(open, one)
            .filter((row) => hasTaskFile(one.dir, row.task))
            .map((row) => ({
                task: row.task,
                hub: one.name,
                label: row.label,
                note: row.note,
                view: row.view,
                lastRun: row.lastRun,
                file: join(one.dir, HUB_FILE),
                at: row.at
            }))
    );
}

/**
 * The name of the hub a schedule's task names (the primary for no name) and the tasks its
 * `update_tasks` lists, or null when it names no hub of the workspace or there is no primary.
 */
export function listedTasks(
    open: TaskHubs,
    name: string | undefined
): { hub: string; tasks: UpdateTask[] } | null {
    const named = namedHub(open, name);
    if ('refused' in named) return null;
    return { hub: named.hub.name, tasks: taskNames(open, named.hub) };
}

/**
 * The hub a press or a schedule names: the primary for no name, else the hub of that name, compared
 * as written. A name no hub of the workspace holds is refused with `hub-unknown` naming it, and no
 * name with no primary with `no-primary`.
 */
export function namedHub(
    open: TaskHubs,
    name: string | undefined
): { hub: HubFolder } | { refused: 'hub-unknown' | 'no-primary'; names: string[] } {
    if (name !== undefined) {
        const hub = open.hubs.find((one) => one.name === name);
        return hub === undefined ? { refused: 'hub-unknown', names: [name] } : { hub };
    }
    if (open.primary === null || open.primaryDir === null)
        return { refused: 'no-primary', names: [] };
    return { hub: { name: open.primary, dir: open.primaryDir } };
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
 * Start one update task as a Claude terminal in the root of the hub `options.hub`. `skip` is the
 * caller's: a press passes false and a schedule its `unattended`. A refusal that names its cause
 * comes back as its word; any other failure is thrown for the caller to answer.
 */
export async function startUpdateTask(
    kind: UpdateTask,
    skip: boolean,
    options: TaskStartOptions
): Promise<TaskStart> {
    const hub = options.hub;
    if (!options.listed.includes(kind)) {
        return { refused: 'update-task-unlisted', names: [kind, hub.name] };
    }
    if (!hasTaskFile(hub.dir, kind)) {
        return { refused: 'task-file-missing', names: [taskFile(kind), hub.name] };
    }
    try {
        const terminal = await startTerminal(
            {
                kind: 'claude',
                cwd: hub.dir,
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
