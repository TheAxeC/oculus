// Layer 2, server. What one press of a project command runs: the command and the commands it
// `depends_on`, each once, in the order the dependencies are listed. chainLine (chain.ts) builds
// the line from it, and the task terminal's mark carries the chain it resolved.
//
// A dependency name resolves to the first command of that name in the order the repository lists
// them (the file's, the saved, the found, the apps'). A cycle, a command that depends on itself, a
// name that is no command and a name that is a task of an app are refused as words with the names
// they are about, before anything starts: an app's task runs in a terminal of its own, so it is
// not a step of a shell line.

import type {
    CommandSource,
    ProjectCommand,
    TerminalRefusal
} from '../../../../data/model/index.ts';

/** The commands to run in order, or the word that refuses the press and the names it is about. */
export type Chain = { chain: ProjectCommand[] } | { error: TerminalRefusal; names: string[] };

type Refused = { error: TerminalRefusal; names: string[] };

/** The chain for the command of that name and source. */
export function resolveChain(
    commands: ProjectCommand[],
    name: string,
    source: CommandSource
): Chain {
    const root = commands.find((one) => one.name === name && one.source === source);
    if (root === undefined) return { error: 'command-unknown', names: [name] };
    const ordered: ProjectCommand[] = [];
    const walking: ProjectCommand[] = [];
    const visit = (command: ProjectCommand): Refused | null => {
        if (ordered.includes(command)) return null;
        walking.push(command);
        for (const dependency of command.depends_on) {
            const next = commands.find((one) => one.name === dependency);
            if (next === undefined) {
                return { error: 'dependency-unknown', names: [command.name, dependency] };
            }
            if (next === command) return { error: 'dependency-self', names: [command.name] };
            if (walking.includes(next)) {
                const path = [...walking.slice(walking.indexOf(next)), next];
                return {
                    error: 'dependency-cycle',
                    names: [path.map((one) => one.name).join(' -> ')]
                };
            }
            if (next.task !== undefined) {
                return { error: 'dependency-task', names: [command.name, dependency] };
            }
            const refused = visit(next);
            if (refused !== null) return refused;
        }
        walking.pop();
        ordered.push(command);
        return null;
    };
    const refused = visit(root);
    return refused ?? { chain: ordered };
}
