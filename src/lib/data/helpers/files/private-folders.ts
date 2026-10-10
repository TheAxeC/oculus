// Layer 1, data. The folders of this machine that hold its own state or secrets: the machine's
// `~/.oculus` and the `secrets` folder of every hub, the first hub's and each root marked
// `hub: true`. No library file lies in them (server/machine/lsp/library/rules.ts), no file of them
// is given to the YAML language server, and no language server's edit changes one
// (server/files/fs/lsp-edit.ts and the page's plan). The library rules also withhold the engine's
// own config folder, which the caller names, since that folder is served. It is one definition for
// the server and the page, which each compare a file with it.

import { joinPath } from './paths.ts';

/** The machine's state folder inside the home folder. */
const STATE_FOLDER = '.oculus';

/** A hub's folder of secrets. */
const SECRETS_FOLDER = 'secrets';

/** A served root as far as the hubs among them are concerned: where it is and whether it is one. */
export type HubMarked = { dir: string; hub?: boolean };

/**
 * The directories of every hub: the first hub (none when no hub root is served) and then each
 * served root marked `hub`, in the order they are served.
 */
export function hubDirs(first: string | null, roots: readonly HubMarked[]): string[] {
    const marked = roots.filter((one) => one.hub === true).map((one) => one.dir);
    return first === null ? marked : [first, ...marked];
}

/**
 * The state folder and the `secrets` folder of each hub, written as the page writes paths: with `/`
 * and without a trailing slash. A machine with no hub served has the state folder alone, and a page
 * that has not yet been told the home folder (an empty text) has the secrets folders alone.
 */
export function privateFolders(hubs: readonly string[], home: string): string[] {
    const state = home === '' ? [] : [joinPath(home, STATE_FOLDER)];
    return [...state, ...hubs.map((hub) => joinPath(hub, SECRETS_FOLDER))];
}
