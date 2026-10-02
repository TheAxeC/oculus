// Layer 2, client state, pure. The choices of the palette's `:workspace` command: the default
// workspace and every saved one, the one in force marked, narrowed by the words after the command.
// The default workspace has no name of its own (the empty string is its name in the workspaces
// file), so the label it is listed and matched under comes in from the catalog.

/** One workspace the palette lists. */
export type WorkspaceChoice = { name: string; label: string; current: boolean };

/**
 * The workspaces whose label holds every word of the argument, without regard to case, the default
 * workspace first and the saved ones in the order the file holds them.
 */
export function workspaceMatches(
    argument: string,
    saved: string[],
    current: string,
    defaultLabel: string
): WorkspaceChoice[] {
    const words = argument
        .toLowerCase()
        .split(/\s+/)
        .filter((one) => one !== '');
    const all = ['', ...saved.filter((name) => name !== '')].map((name) => ({
        name,
        label: name === '' ? defaultLabel : name,
        current: name === current
    }));
    return all.filter((one) => words.every((word) => one.label.toLowerCase().includes(word)));
}
