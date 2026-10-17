// Layer 1, data. The marker a project command's chain prints before each command: the run's token,
// a blank and the command's name. The server writes it into the chain's line and the page reads the
// task's output by it, so the two read one rule. It is printed concealed (SGR 8), on a line of its
// own: the page reads it from the terminal's output with its escapes taken out, and the terminal
// draws none of its words, only the empty line it takes. It keeps a line of its own, since text a
// command wrote over it in the same read of the pane would trim it from what tmux sends the page.

/** The marker a chain's line prints before a command. */
export function chainMarker(token: string, name: string): string {
    return `${token} ${name}`;
}

/** The printf format that prints a marker concealed on a line of its own, inside single quotes. */
export const MARKER_FORMAT = '\\033[8m%s\\033[28m\\n';
