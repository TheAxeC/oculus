// Layer 2, client state. The Claude Code hooks block oculus asks to be installed, as data: a pure
// function over the address the page was served on, with no rune and no other module behind it.
//
// The block is a settings fragment, so it is built here as data: the shape is what Claude Code
// reads, and its one variable is the origin the hook posts to. `-m 1` caps the transfer at a second and `timeout: 1` caps the hook the runner waits
// for, so a session whose oculus is down costs a second at most; `|| true` keeps a refused post
// from failing the session.

/** One command hook as Claude Code's settings file holds it. */
type CommandHook = { type: string; timeout: number; command: string };

/** The two events oculus listens for, each a matcher carrying one command hook. */
type Block = { hooks: Record<string, { hooks: CommandHook[] }[]> };

/** How long the runner waits for the hook, in seconds, and how long curl waits for the transfer. */
const SECONDS = 1;

/**
 * The hooks block for the top level of ~/.claude/settings.json, posting to `origin`, the page's own
 * (`location.origin`: scheme, host and port as served), so the block a reader copies reaches the
 * server that printed it whatever port or scheme it was served on.
 */
export function hooksSnippet(origin: string): string {
    const command = `curl -s -m ${SECONDS} -X POST ${origin}/api/hook -H 'Content-Type: application/json' -d @- >/dev/null 2>&1 || true`;
    const hook: CommandHook = { type: 'command', timeout: SECONDS, command };
    const block: Block = {
        hooks: {
            Notification: [{ hooks: [hook] }],
            Stop: [{ hooks: [hook] }]
        }
    };
    return JSON.stringify(block, null, 2);
}
