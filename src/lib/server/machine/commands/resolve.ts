// Layer 2, server. What one press of a project command runs: the command and the commands it
// `depends_on`, each once, in the order the dependencies are listed. chainLine (chain.ts) builds
// the line from it, and the task terminal's mark carries the chain it resolved.
//
// A dependency name resolves to the first command of that name in the order the repository lists
// them (the file's, the saved, the found). A cycle, a command that depends on itself and a name
// that is no command are refused with the names, before anything starts.

import type { CommandSource, ProjectCommand } from '../../../data/model/index.ts';

/** The commands to run in order, or the sentence that refuses the press. */
export type Chain = { chain: ProjectCommand[] } | { error: string };

/** The chain for the command of that name and source. */
export function resolveChain(
    commands: ProjectCommand[],
    name: string,
    source: CommandSource
): Chain {
    const root = commands.find((one) => one.name === name && one.source === source);
    if (root === undefined) return { error: `${name} is not a command of this repository` };
    const ordered: ProjectCommand[] = [];
    const walking: ProjectCommand[] = [];
    const visit = (command: ProjectCommand): string | null => {
        if (ordered.includes(command)) return null;
        walking.push(command);
        for (const dependency of command.depends_on) {
            const next = commands.find((one) => one.name === dependency);
            if (next === undefined) {
                return `the command ${command.name} depends on ${dependency}, which is not a command`;
            }
            if (next === command) return `the command ${command.name} depends on itself`;
            if (walking.includes(next)) {
                const path = [...walking.slice(walking.indexOf(next)), next];
                return `the commands depend on each other in a cycle: ${path.map((one) => one.name).join(' -> ')}`;
            }
            const refused = visit(next);
            if (refused !== null) return refused;
        }
        walking.pop();
        ordered.push(command);
        return null;
    };
    const refused = visit(root);
    return refused === null ? { chain: ordered } : { error: refused };
}
