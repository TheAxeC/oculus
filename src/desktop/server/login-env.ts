// Layer 2, server (the desktop host). The login shell's environment for an app started from the
// Dock. launchd gives such an app a bare PATH, so the server it runs would find no tmux, no
// Homebrew git and no claude. `shell-env` asks the user's login shell for its whole environment;
// the answer is merged over the inherited one. A shell that takes longer than the limit, or fails,
// answers null and the server starts on the inherited environment.

import { shellEnv } from 'shell-env';

/** How long the login shell may take, in milliseconds. */
const LOGIN_SHELL_LIMIT_MS = 10_000;

/** The login shell's environment, or null when it did not answer in time or failed. */
export async function loginEnvironment(
    limitMs: number = LOGIN_SHELL_LIMIT_MS
): Promise<Record<string, string> | null> {
    let timer: NodeJS.Timeout | undefined;
    const slow = new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), limitMs);
    });
    try {
        return await Promise.race([shellEnv(), slow]);
    } catch {
        return null;
    } finally {
        clearTimeout(timer);
    }
}
