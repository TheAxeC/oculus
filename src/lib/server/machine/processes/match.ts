// Layer 2, server. The rule that says which command lines the Processes view lists and which are an
// agent. A program name equals the file name of the command line's first word or of its second
// word, exactly: a script run by its interpreter (`node /usr/local/bin/codex`) matches by the
// script's name, and a path that only holds the name (`/bin/zsh -c source ~/.claude/s.sh`) does
// not.

/** The agents the head line counts, by the program name. */
const AGENTS = ['claude', 'codex'] as const;

/** One of the two agent programs. */
type Agent = (typeof AGENTS)[number];

function isAgent(program: string): program is Agent {
    return AGENTS.some((agent) => agent === program);
}

/** The file names of the first two words of a command line. */
function programsOf(commandLine: string): string[] {
    return commandLine
        .split(/\s+/)
        .filter((word) => word !== '')
        .slice(0, 2)
        .map((word) => word.slice(word.lastIndexOf('/') + 1));
}

/** Whether a program name of the list equals the file name of the first or second word. */
export function matches(commandLine: string, patterns: readonly string[]): boolean {
    return programsOf(commandLine).some((program) => patterns.includes(program));
}

/** The agent a command line runs by the same rule, or null. */
export function agentOf(commandLine: string): Agent | null {
    return programsOf(commandLine).find((program): program is Agent => isAgent(program)) ?? null;
}
