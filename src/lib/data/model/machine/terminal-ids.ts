// Layer 1, data. What a terminal's id says, and what is read of an agent in a pane. Oculus mints
// one shape of id and the pane list another, so which of the two an id has decides whether oculus
// may write to the tmux session behind it; the server and the page both test by these, so the
// module imports nothing.

/** The shape of a terminal id the server's start makes: six hex digits and the kind. */
const OWN_TERMINAL_ID = /^[0-9a-f]{6}-(claude|codex|shell|app)$/;

/**
 * The shape of the id of an agent in a tmux pane oculus did not start: `h`, the pid of the tmux
 * server, `p`, the digits of the pane's `%<number>`, and the tool. The server pid is why a saved id
 * never names a pane of a later tmux server, which counts its panes from zero again.
 */
const BY_HAND_ID = /^h(\d+)p(\d+)-(claude|codex)$/;

/** The shape of a terminal id, either of the two. */
export const TERMINAL_ID = new RegExp(`${OWN_TERMINAL_ID.source}|${BY_HAND_ID.source}`);

/**
 * Whether an id names a terminal, by TERMINAL_ID, which the server and the page both test by. It
 * cannot collide with a Claude session id (a UUID) or a Codex slug (a day path), which is why a
 * terminal selects through the one selection the session views share.
 */
export function isTerminalId(id: unknown): id is string {
    return typeof id === 'string' && TERMINAL_ID.test(id);
}

/**
 * Whether an id is one oculus minted, so the tmux session behind it is oculus's to end, rename,
 * resize or mark.
 */
export function isOwnTerminal(id: unknown): id is string {
    return typeof id === 'string' && OWN_TERMINAL_ID.test(id);
}

/** The tmux server pid and the pane number a by-hand id names, or null for any other id. */
export function byHandPane(id: string): { server: number; pane: number } | null {
    const read = BY_HAND_ID.exec(id);
    return read === null ? null : { server: Number(read[1]), pane: Number(read[2]) };
}

/** The agent that runs in a pane: its tool and its own process, read from the process table. */
export type TerminalAgent = {
    tool: 'claude' | 'codex';
    pid: number;
};

/**
 * What a terminal of an agent in a pane oculus did not start carries: the tmux session's id, which
 * a control client attaches to, and the pane's size, which is the size its grid is drawn at.
 */
export type TerminalByHand = {
    session: string;
    cols: number;
    rows: number;
};
