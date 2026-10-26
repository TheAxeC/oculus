// Layer 2, server. Start what a schedule runs, for a due time or a Run now. An update task starts
// as the tray's press starts it (schedules/task.ts) with the entry's `unattended` as its flag, in
// the hub its `hub` names among the hubs at the call, the primary when it names none; a hub taken
// out of the workspace since the entry was read is refused with `hub-unknown`. A command of a
// repository's `.oculus/commands.yml` starts as the command route starts it (commands/run.ts
// `runCommand`), from the repository the entry names, with an empty context. A prompt starts a
// Claude session in its folder with the prompt as the one argument after `--`, which tmux hands to
// the process as it is, so no shell reads it.
//
// The answer is the terminal or the word that refused the start with the names its sentence is
// about, and nothing is thrown for a start the system refused. A command chain that needs the
// reader's approval starts nothing and is refused with `needs-approval`: a schedule is no place to
// ask, and the chain is approved by a save of the schedule or of the command (Schedule... or Edit
// in the repository's command bar). The folder of a prompt and the prompt itself are checked again
// here, since the file or the roots the file browser serves may have changed since the entry was
// read.

import { readEntry } from '../../../../data/helpers/run/schedules.ts';
import type { ScheduleEntry, Terminal } from '../../../../data/model/index.ts';
import { runCommand } from '../commands/run.ts';
import { TerminalRefused } from '../../pty/refusal.ts';
import { startTerminal, type StartOptions } from '../../pty/sessions.ts';
import { promptFolder, resolveFolder } from './file.ts';
import { namedHub, startUpdateTask, type TaskHubs } from './task.ts';

/** What a run needs besides the tmux options of every terminal start. */
export type RunEntryOptions = StartOptions & {
    /**
     * The open workspace's hubs, read at the call: the hub an update task's `hub` names, and the
     * primary, whose folder is the one of a task that names none and what `hub` of a folder names;
     * with no primary a run that needs it is refused.
     */
    hubs: TaskHubs;
    /** The `claude` program, as `claude_bin` of the machine's configuration names it. */
    claudeBin: string;
    /** The text catalog, which holds the sentence an update task starts with. */
    text: Record<string, string>;
    /** The directories the file browser serves, read at the call. */
    rootsFor: () => string[];
    /**
     * The approvals file a command chain is checked against. Defaults to ~/.oculus/approvals.json.
     */
    approvalsFor?: () => string;
};

/** The terminal a run started, or the word that refused it and the names its sentence is about. */
export type RunAnswer = { terminal: Terminal } | { refused: string; names: string[] };

/** Start what the entry runs in a terminal of the given grid. */
export async function runEntry(
    entry: ScheduleEntry,
    size: { cols: number; rows: number },
    options: RunEntryOptions
): Promise<RunAnswer> {
    const { hubs, claudeBin, text, rootsFor, approvalsFor, ...tmux } = options;
    const hub = hubs.primaryDir;
    const runs = entry.runs;
    try {
        if ('task' in runs) {
            const named = namedHub(hubs, runs.hub);
            if ('refused' in named) return named;
            return await startUpdateTask(runs.task, entry.unattended, {
                ...tmux,
                hub: named.hub,
                claudeBin,
                text,
                size
            });
        }
        if ('command' in runs) {
            const folder = resolveFolder(runs.folder, hub);
            if (folder === null) return { refused: 'no-primary', names: [] };
            const started = await runCommand(folder, runs.command, 'file', {}, size, {
                ...tmux,
                rootsFor,
                approvalsFor
            });
            if ('approve' in started) return { refused: 'needs-approval', names: [runs.command] };
            return started;
        }
        const checked = readEntry({ name: entry.name, runs });
        if (checked.problem !== null) {
            return { refused: checked.problem.word, names: checked.problem.names };
        }
        const found = promptFolder(runs.folder, { hub, roots: rootsFor() });
        if (!('cwd' in found)) return { refused: found.word, names: found.names };
        const flags = entry.unattended ? ['--dangerously-skip-permissions'] : [];
        const terminal = await startTerminal(
            { kind: 'claude', cwd: found.cwd, cols: size.cols, rows: size.rows, name: entry.name },
            { ...tmux, argv: [claudeBin, ...flags, '--', runs.prompt] }
        );
        return { terminal };
    } catch (error) {
        if (error instanceof TerminalRefused) return { refused: error.word, names: error.names };
        return { refused: 'terminal-failed', names: [] };
    }
}
