// Layer 2, client state. A shell started in a folder and shown, the one path every "a shell here"
// action takes: the Repositories view's shell in a repository or a worktree (the repositories
// store's `shellIn`) and the Files view's Open in Integrated Terminal
// (views/shared/explorer/tree/menu/row-menu.ts). The terminals store starts the shell and shows it
// in the Terminal tab that owns it, or the page's Terminal tab, or a new one, which the label names
// until the shell's own name arrives. A refusal is handed back as the server's words, and each
// caller says it on its own line. It sits with the shapes of the shared stores, below both
// state/sessions and state/sources, since the repositories store may import neither the terminals
// store nor anything beside it.

/**
 * What a shell needs of the terminals store (state/sessions/terminals.svelte.ts), which satisfies
 * it: a shell started in a folder, and a terminal shown.
 */
export type ShellStarter = {
    startTerminal: (
        kind: 'shell',
        cwd: string
    ) => Promise<{ ok: boolean; id: string; error: string }>;
    showTerminal: (id: string, label?: string) => void;
};

/** Start a shell in `cwd` and show it; the refusal's words, or null once it is shown. */
export async function openShell(
    terminals: ShellStarter,
    cwd: string,
    label: string
): Promise<string | null> {
    const answer = await terminals.startTerminal('shell', cwd);
    if (!answer.ok) return answer.error;
    terminals.showTerminal(answer.id, label);
    return null;
}
