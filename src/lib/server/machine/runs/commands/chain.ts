// Layer 2, server. The one shell line that runs a press's chain in a task terminal: the commands
// resolveChain (resolve.ts) ordered, each after the one before it. Before each command the line
// prints a marker, the run's token and the command's name, which the page reads its output by: the
// token is minted at each start, so a command's own output never prints the marker of the next.

import type { ProjectCommand } from '../../../../data/model/index.ts';
import { chainMarker } from '../../../../data/helpers/run/marker.ts';
import { shellWord } from '../../pty/shell-word.ts';

/**
 * A line that holds a command separator, a background mark, an `||`, a pipe, a comment or a line
 * break is run as a group of its own, so what it does ends at its own end: a `#` does not comment
 * out the commands after it, an `||` does not let a failure through and a `;` does not leave the
 * rest of the chain to run when the folder could not be entered.
 */
const NEEDS_GROUP = /[;&|#\n]|\\\s*$/;

/**
 * One command's line, in a group when its text needs one. The group's closing brace is on a line
 * of its own, and a line that ends in a backslash is followed by an empty line first, since a
 * backslash before the line break joins the brace onto the command.
 */
function lineOf(run: string): string {
    if (!NEEDS_GROUP.test(run)) return run;
    return run.endsWith('\\') ? `{ ${run}\n\n}` : `{ ${run}\n}`;
}

/**
 * The one line a chain runs: each command as `cd <folder> && printf '%s\n' <marker> && <line>`,
 * joined by `&&` so that a command that fails stops the commands after it. The folder and the
 * marker are each one shell word.
 */
export function chainLine(chain: ProjectCommand[], token: string): string {
    return chain
        .map(
            (command) =>
                `cd ${shellWord(command.cwd)} && printf '%s\\n' ${shellWord(chainMarker(token, command.name))} && ${lineOf(command.run)}`
        )
        .join(' && ');
}
