// Layer 1, data. The folders of this machine that hold its own state or secrets: the machine's
// `~/.oculus` and the folder of secrets of every hub, which is each folder of the open workspace
// that holds `.oculus/config.yml`, each hub's folder its own `secrets_dir`. No library file lies in
// them (server/machine/lsp/library/rules.ts), no file of them is given to the YAML language server,
// and no language server's edit changes one (server/files/fs/lsp-edit.ts and the page's plan). The
// library rules also withhold oculus's own config folder, which the caller names, since a workspace
// folder can hold it. It is one definition for the server and the page, which each compare a file
// with it: the server marks each hub with its `secrets_dir` from the hub's settings
// (`withSecrets`), and the page reads the mark the workspaces answer gives each hub's folder. A hub
// is marked the same way with its notes folder, its `notes_dir` (`withNotes`), for the readers of
// the notes that are handed the served roots.

import { joinPath } from './paths.ts';

/** The machine's state folder inside the home folder, oculus's own place for its state. */
const STATE_FOLDER = '.oculus';

/**
 * A served root as far as the hubs among them are concerned: where it is, whether it is one, its
 * folder of secrets against it, the hub's `secrets_dir`, empty or absent for none, and its notes
 * folder against it, the hub's `notes_dir`, absent until a reader marks it (`withNotes`).
 */
export type HubMarked = { dir: string; hub?: boolean; secrets?: string; notes?: string };

/** Each hub of the roots marked with its folder of secrets, as `secretsOf` reads it. */
export function withSecrets<T extends HubMarked>(
    roots: readonly T[],
    secretsOf: (dir: string) => string
): T[] {
    return roots.map((one) => (one.hub === true ? { ...one, secrets: secretsOf(one.dir) } : one));
}

/** Each hub of the roots marked with its notes folder, as `notesOf` reads it. */
export function withNotes<T extends HubMarked>(
    roots: readonly T[],
    notesOf: (dir: string) => string
): T[] {
    return roots.map((one) => (one.hub === true ? { ...one, notes: notesOf(one.dir) } : one));
}

/** The notes folder a root is marked with: the empty text for a root that is no hub or unmarked. */
export function notesMark(root: HubMarked | undefined): string {
    return root?.hub === true ? (root.notes ?? '') : '';
}

/**
 * The state folder and the folder of secrets of each hub, written as the page writes paths: with
 * `/` and without a trailing slash. A machine with no hub served has the state folder alone, a hub
 * whose `secrets_dir` is empty adds none, and a page that has not yet been told the home folder (an
 * empty text) has the folders of secrets alone.
 */
export function privateFolders(roots: readonly HubMarked[], home: string): string[] {
    const state = home === '' ? [] : [joinPath(home, STATE_FOLDER)];
    const secrets = roots.flatMap((one) =>
        one.hub === true && one.secrets !== undefined && one.secrets !== ''
            ? [joinPath(one.dir, one.secrets)]
            : []
    );
    return [...state, ...secrets];
}
