// Layer 2, server. The commands of one repository: the two sources read in their order, the file of
// the repository first (`.oculus/commands.yml`, which the command form writes too) and the commands
// oculus found last. A name that two sources hold is listed twice, and a name another command
// depends on resolves to the first of them (data/helpers/run/chain.ts). A role (`default: build`,
// `default: test`) belongs to the first command that claims it, in that order.
//
// The apps' tasks come last, after the commands of the two sources (`listAll`): a typed entry of
// the file is resolved by the app that defines its type, and every task provider of an acting app
// adds its tasks (apps/tools/run/tasks.ts).
//
// Listing reads files and starts no process of its own; resolving a typed entry and asking a task
// provider are requests to the app's host, which is started for them.

import type { CommandsAnswer } from '../../../../data/model/index.ts';
import type { AppTasks } from '../../apps/tools/run/tasks.ts';
import { readCommandsFile, readCommandsText, type Reading, type Taken } from './files.ts';
import { findCommands } from './found.ts';

/** The commands of the file's reading followed by the found ones, with the findings of both. */
function withFound(repo: string, file: Reading): CommandsAnswer {
    const found = findCommands(repo);
    return {
        commands: [...file.commands, ...found.commands],
        findings: [...file.findings, ...found.findings]
    };
}

/** The commands of a repository and what could not be read. `repo` is its real path. */
export function listCommands(repo: string): CommandsAnswer {
    const taken: Taken = new Set();
    return withFound(repo, readCommandsFile(repo, taken));
}

/**
 * The commands a repository would list with `text` as its `.oculus/commands.yml`, which a write of
 * the form reads before it writes, so the chain it approves is the one the written file runs.
 */
export function listWithText(repo: string, text: string): CommandsAnswer {
    const taken: Taken = new Set();
    return withFound(repo, readCommandsText(repo, text, taken));
}

/** What the commands need of the apps: the listing of their tasks and the run of one. */
export type CommandTasks = Pick<AppTasks, 'commands' | 'run'>;

/** The commands of a repository with the tasks of the apps added, when the apps are given. */
export async function listAll(repo: string, tasks?: CommandTasks): Promise<CommandsAnswer> {
    const listed = listCommands(repo);
    return tasks === undefined ? listed : tasks.commands(repo, listed);
}
