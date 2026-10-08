// Layer 1, data. The folders of this machine that hold its own state or secrets, which no library
// file lies in (server/machine/lsp/library/rules.ts) and no file of is given to the YAML language
// server: the machine's `~/.oculus` and the hub's `secrets` folder. The engine's own config folder
// is withheld as well, and is named by the caller, since the engine's config folder is served.
// It is one definition for the server and the page, which each compare a file with it.

import { joinPath } from './paths.ts';

/** The machine's state folder inside the home folder. */
const STATE_FOLDER = '.oculus';

/** The hub's folder of secrets. */
const SECRETS_FOLDER = 'secrets';

/**
 * The two folders, written as the page writes paths: with `/` and without a trailing slash. A
 * machine with no hub root served has the state folder alone, and a page that has not yet been told
 * the home folder (an empty text) has the secrets folder alone.
 */
export function privateFolders(hub: string | null, home: string): string[] {
    const state = home === '' ? [] : [joinPath(home, STATE_FOLDER)];
    return hub === null ? state : [...state, joinPath(hub, SECRETS_FOLDER)];
}
