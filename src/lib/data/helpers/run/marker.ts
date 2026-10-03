// Layer 1, data. The marker a project command's chain prints before each command: the run's token,
// a blank and the command's name. The server writes it into the chain's line and the page reads the
// task's output by it, so the two read one rule.

/** The marker a chain's line prints before a command. */
export function chainMarker(token: string, name: string): string {
    return `${token} ${name}`;
}
