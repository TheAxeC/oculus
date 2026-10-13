// Layer 2, server. The commands of one repository: the three sources read in their order, the file
// of the repository first, the commands the reader saved second and the commands oculus found last.
// A name that two sources hold is listed twice, and a name another command depends on resolves to
// the first of them (resolve.ts). A role (`default: build`, `default: test`) belongs to the first
// command that claims it, in that order.
//
// The apps' tasks come last, after the commands of the three sources (`listAll`): a typed entry of
// the file is resolved by the app that defines its type, and every task provider of an acting app
// adds its tasks (apps/tools/run/tasks.ts).
//
// Listing reads files and starts no process of its own; resolving a typed entry and asking a task
// provider are requests to the app's host, which is started for them.

import type { CommandsAnswer } from '../../../../data/model/index.ts';
import type { AppTasks } from '../../apps/tools/run/tasks.ts';
import { readCommandsFile, type Taken } from './files.ts';
import { findCommands } from './found.ts';
import { readSavedCommands, savedPath } from './saved.ts';

/**
 * The commands of a repository and what could not be read. `repo` is its real path, and the saved
 * commands are those `savedFile`, the machine's `commands.json` unless a caller names another,
 * holds under that path.
 */
export function listCommands(repo: string, savedFile: string = savedPath()): CommandsAnswer {
    const taken: Taken = new Set();
    const file = readCommandsFile(repo, taken);
    const saved = readSavedCommands(savedFile, repo, taken);
    const found = findCommands(repo);
    return {
        commands: [...file.commands, ...saved.commands, ...found.commands],
        findings: [...file.findings, ...saved.findings, ...found.findings]
    };
}

/** What the commands need of the apps: the listing of their tasks and the run of one. */
export type CommandTasks = Pick<AppTasks, 'commands' | 'run'>;

/** The commands of a repository with the tasks of the apps added, when the apps are given. */
export async function listAll(
    repo: string,
    savedFile: string = savedPath(),
    tasks?: CommandTasks
): Promise<CommandsAnswer> {
    const listed = listCommands(repo, savedFile);
    return tasks === undefined ? listed : tasks.commands(repo, listed);
}
