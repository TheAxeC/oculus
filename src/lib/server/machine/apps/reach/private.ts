// Layer 2, server. The folders and files that hold this machine's own state or secrets, which no
// app reaches whatever folder of the workspace covers them: `~/.oculus`, the `secrets` folder of
// each hub (`privateFolders`), the machine's `local.yml` files, and each state file or folder the
// machine's values place elsewhere, so a folder over one of them never lets an app read a token or
// a key. The set is one function of the machine's values and the workspace's folders, taken as real
// paths as the disk spells them (a path that does not exist yet stays as written). The reader of a
// manifest's `files` refuses an entry in it, and `locate` and the file listing answer `closed` for
// a real path in it.

import { hubDirs, privateFolders } from '../../../../data/helpers/files/private-folders.ts';
import type { LocalConfig } from '../../../../data/sources/config.ts';
import { realPath } from '../../../core/paths.ts';
import { expandHome, type Root } from '../../../files/workspace/folders.ts';
import { machineFilesOf } from '../../../files/workspace/machine-file.ts';

/** What the set is made from. */
export type PrivateSource = {
    /** The home folder, whose `.oculus` folder holds the machine's state. */
    home: string;
    /** Oculus's own config folder, whose `local.yml` is closed with the hubs'. */
    config: string;
    local: LocalConfig;
    /** The folders of the workspace, the hubs among them marked. */
    roots: readonly Root[];
};

/** The paths of `local.yml` that place the machine's state, each written out. */
function placed(source: PrivateSource): string[] {
    const { local } = source;
    const named = [
        local.sessionsCache,
        local.sessionsOverrides,
        local.bookmarks,
        local.notes,
        local.changes,
        local.history,
        local.approvals,
        local.schedules,
        local.scheduleRecord,
        local.calendarDir,
        local.appsDir,
        local.mailDir,
        ...local.accounts.map((account) => account.dir)
    ];
    return named
        .filter((path): path is string => path !== undefined && path !== '')
        .map((path) => expandHome(path));
}

/** The real paths closed to every app, each once. */
export function closedToApps(source: PrivateSource): string[] {
    const folders = source.roots.map((root) => ({ dir: expandHome(root.dir), hub: root.hub }));
    const hubs = hubDirs(folders);
    const paths = [
        ...privateFolders(hubs, source.home),
        ...machineFilesOf(folders, source.config),
        ...placed(source)
    ];
    return [...new Set(paths.map((path) => realPath(path, true) ?? path))];
}
