// Layer 2, server. Which files outside every served root may be named to a page as library files.
// A file the file routes would never serve whatever the roots is never named: a path with a segment
// that starts with a dot, a path holding a folder `closed_paths` names, and the folders of this
// machine that hold its own state or secrets (the engine's `config/` folder, which holds
// `local.yml`, `~/.oculus`, and the hub's `secrets` folder). `closed_paths` is read as a list of
// folders each relative to a root and applied to every root (data/helpers/files/apps.ts); a path
// outside every root has no root to be relative to, so a folder is matched wherever its segments
// follow each other in the path. A `closed_paths` key that is missing or is no list closes every
// file, as it does for an app.
//
// One exception is made to the dot rule: a Python library lives in a virtual environment or a
// version manager's folder, whose path holds a dot segment (`.venv`, `.pyenv`), so a file under
// the `sys.prefix` or `sys.base_prefix` of the interpreter pyright runs with is named to the page
// whatever dot segments its path holds, and only for the pyright server it is the interpreter of.
// The other two refusals hold for it, and no server but pyright has the exception. A prefix that is
// the filesystem root, the home folder or a folder that holds the home folder gives none, since
// every dot folder of the machine (`~/.ssh`) would then lie under it.

import { homedir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { inClosedPaths, pathSegmentsOpen } from '../../../../data/helpers/files/apps.ts';
import { privateFolders } from '../../../../data/helpers/files/private-folders.ts';
import { namesInterpreterLibrary } from '../../../../data/prose/lsp-servers.ts';
import { inside, realPath, under } from '../../../core/paths.ts';

/** What the rules read of this machine. */
export type LibraryRules = {
    /** The folders `closed_paths` names, null while the key is missing or is no list. */
    closed: readonly string[] | null;
    /** Absolute folders no library file lies in. */
    withheld: readonly string[];
    /** The home folder of the machine, which an interpreter prefix may not reach; this one's. */
    home?: string;
};

/** Rules that name no file: what a relay has until it is given its own. */
export const NO_LIBRARY: LibraryRules = { closed: null, withheld: [] };

/** The folders of this machine that hold its own state or secrets, from the engine and the hub. */
export function withheldFolders(engineConfig: string, hub: string): string[] {
    return [engineConfig, ...privateFolders(hub, homedir())];
}

/** The server a path is asked for, and what it is the interpreter's folders of. */
export type Naming = {
    /** The registry id of the server that named the file. */
    server: string;
    /** The `sys.prefix` and `sys.base_prefix` of the interpreter that server runs with. */
    prefixes: readonly string[];
};

/** Whether a folder `closed_paths` names appears in a path, matched from any of its segments. */
function inClosed(path: string, closed: readonly string[]): boolean {
    const parts = path.split('/').filter((part) => part !== '');
    return parts.some((_, at) => inClosedPaths(parts.slice(at).join('/'), closed));
}

/** Whether a prefix is the filesystem root, the home folder or a folder holding the home folder. */
function tooWide(prefix: string, home: string): boolean {
    const homes = [resolve(home), realPath(home, true)].flatMap((one) =>
        one === null ? [] : [one]
    );
    const forms = [resolve(prefix), realPath(prefix, true)].flatMap((one) =>
        one === null ? [] : [one]
    );
    return forms.some((form) => dirname(form) === form || homes.some((one) => inside(one, form)));
}

/** Whether a file at a real path outside every root may be named to a page by this server. */
export function mintable(real: string, rules: LibraryRules, naming: Naming): boolean {
    if (rules.closed === null) return false;
    if (under(real, rules.withheld)) return false;
    if (inClosed(real, rules.closed)) return false;
    if (pathSegmentsOpen(real.replace(/^\/+/, ''))) return true;
    if (!namesInterpreterLibrary(naming.server)) return false;
    const home = rules.home ?? homedir();
    return under(
        real,
        naming.prefixes.filter((prefix) => prefix !== '' && !tooWide(prefix, home))
    );
}
