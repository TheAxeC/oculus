// Layer 2, server. The commands of one repository: the three sources read in their order, the file
// of the repository first, the commands the reader saved second and the commands oculus found last.
// A name that two sources hold is listed twice, and a name another command depends on resolves to
// the first of them (resolve.ts). A role (`default: build`, `default: test`) belongs to the first
// command that claims it, in that order.
//
// Listing reads files and starts no process.

import type { CommandsAnswer } from '../../../data/model/index.ts';
import { readCommandsFile, type Taken } from './files.ts';
import { findCommands } from './found.ts';
import { readSavedCommands, savedPath } from './saved.ts';

/**
 * The commands of a repository and what could not be read. `repo` is its real path, and the saved
 * commands are those the machine's `commands.json` holds under that path.
 */
export function listCommands(repo: string): CommandsAnswer {
    const taken: Taken = new Set();
    const file = readCommandsFile(repo, taken);
    const saved = readSavedCommands(savedPath(), repo, taken);
    const found = findCommands(repo);
    return {
        commands: [...file.commands, ...saved.commands, ...found.commands],
        findings: [...file.findings, ...saved.findings, ...found.findings]
    };
}
