// Layer 2, server. The one quoting of a value for a shell command line: every value a server
// builds into a line that tmux hands to `sh -c` goes through shellWord, so no character of it is
// read as shell syntax.

/**
 * One value as one shell word: single-quoted always, with each single quote inside it closed,
 * double-quoted and reopened, so `a'b` is read back as `a'b` and `$(x)` is read as those
 * characters.
 */
export function shellWord(value: string): string {
    return `'${value.replaceAll("'", `'"'"'`)}'`;
}
