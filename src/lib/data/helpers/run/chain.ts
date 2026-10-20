// Layer 1, data. What one press of a project command runs: the command and the commands it
// `depends_on`, each once, in the order the dependencies are listed. The server resolves a press
// by it (server/machine/runs/commands/run.ts), and chainLine
// (server/machine/runs/commands/chain.ts) builds the line from it; the command form draws, under
// its fields, the chain its draft would run by the same rule (`draftChain`), so the lines the form
// shows are the lines its Save approves. `draftOf` is the draft an Edit opens the form with.
//
// A dependency name resolves to the first command of that name in the order the repository lists
// them (the file's, the found, the apps'). A cycle, a command that depends on itself, a name that
// is no command and a name that is a task of an app are refused as words with the names they are
// about, before anything starts: an app's task runs in a terminal of its own, so it is not a step
// of a shell line.

import type {
    ChainLine,
    CommandDefault,
    CommandSource,
    ProjectCommand,
    TerminalRefusal
} from '../../model/index.ts';
import { foldedPath, joinPath, pathUnder } from '../files/paths.ts';

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

/** A command as the form drafts it, with its folder relative to the repository. */
export type DraftCommand = {
    name: string;
    run: string;
    cwd?: string;
    depends_on?: string[];
    default?: CommandDefault;
};

/** The form's draft of an entry of the file, with its folder written relative to the repository. */
export function draftOf(repo: string, command: ProjectCommand): DraftCommand {
    const folder = pathUnder(repo, command.cwd) ?? '';
    return {
        name: command.name,
        run: command.run,
        ...(folder === '' ? {} : { cwd: folder }),
        ...(command.depends_on.length === 0 ? {} : { depends_on: command.depends_on }),
        ...(command.default === undefined ? {} : { default: command.default })
    };
}

/**
 * The lines a press of the drafted command would run, over the repository's listed commands: the
 * draft stands where the entry it edits (`was`, the entry's name in the file) is listed, and a new
 * draft after the last command of the file, where Save adds it. Each line carries its folder
 * relative to the repository, `.` for the repository itself. A chain that does not resolve
 * answers the word and the names of `resolveChain`.
 */
export function draftChain(
    repo: string,
    draft: DraftCommand,
    commands: readonly ProjectCommand[],
    was: string | null
): { lines: ChainLine[] } | { error: TerminalRefusal; names: string[] } {
    const drafted: ProjectCommand = {
        name: draft.name,
        run: draft.run,
        cwd:
            draft.cwd === undefined || draft.cwd === ''
                ? repo
                : foldedPath(joinPath(repo, draft.cwd)),
        depends_on: draft.depends_on ?? [],
        source: 'file'
    };
    const held = commands.findIndex((one) => one.source === 'file' && one.name === was);
    const files = commands.filter((one) => one.source === 'file').length;
    const list =
        was !== null && held >= 0
            ? commands.map((one, at) => (at === held ? drafted : one))
            : [...commands.slice(0, files), drafted, ...commands.slice(files)];
    const resolved = resolveChain(list, drafted.name, 'file');
    if ('error' in resolved) return resolved;
    return {
        lines: resolved.chain.map((one) => {
            const under = pathUnder(repo, one.cwd);
            return { folder: under === null || under === '' ? '.' : under, run: one.run };
        })
    };
}
