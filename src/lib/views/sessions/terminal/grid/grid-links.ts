// Layer 3, view helper of TerminalGrid.svelte. The links a task terminal's output carries: a line
// naming a file of the command's repository that is there is a link to that file at its line. The
// line is matched with `errorMatch`, the file is looked up in the repository through what the grid
// is handed, and a line of a terminal that is not a task is no link.

import type { ILink, ILinkProvider, Terminal } from '@xterm/xterm';
import { errorMatch } from '$lib/state/sessions/terminal/commands.svelte';

/** What the provider reads and calls, handed in by the grid from the commands store. */
export type ErrorLinkDeps = {
    /** Whether the terminal runs a task, whose output is read for errors. */
    isTask: () => boolean;
    /** The repository and the path a file named in the output is, or null when it is not there. */
    errorFile: (file: string) => Promise<{ repo: string; path: string } | null>;
    /** Open a file of a repository at a line. */
    openAt: (repo: string, path: string, line: number) => void;
};

/** The link provider of one grid, which xterm asks for the links of each line it draws. */
export function errorLinks(term: Terminal, deps: ErrorLinkDeps): ILinkProvider {
    return {
        provideLinks(y: number, done: (links: ILink[] | undefined) => void) {
            const line = term.buffer.active.getLine(y - 1)?.translateToString(true) ?? '';
            const match = errorMatch(line);
            if (match === null || !deps.isTask()) {
                done(undefined);
                return;
            }
            void deps.errorFile(match.file).then((found) => {
                if (found === null) {
                    done(undefined);
                    return;
                }
                const end = match.start + match.length;
                done([
                    {
                        range: { start: { x: match.start + 1, y }, end: { x: end, y } },
                        text: line.slice(match.start, end),
                        activate: () => deps.openAt(found.repo, found.path, match.line)
                    }
                ]);
            });
        }
    };
}
