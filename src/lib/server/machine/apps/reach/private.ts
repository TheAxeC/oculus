// Layer 2, server. The folders and files that hold this machine's own state or secrets, which no
// app reaches whatever root covers them: `~/.oculus`, the `secrets` folder of each hub
// (`privateFolders`), and each state file or folder `local.yml` places elsewhere, so a root over
// one of them never lets an app read a token or a key. The set is one function of the machine's
// values, taken as real paths as the disk spells them (a path that does not exist yet stays as
// written). The reader of a manifest's `files` refuses an entry in it, and `locate` and the file
// listing answer `closed` for a real path in it.

import { isAbsolute, resolve } from 'node:path';
import { hubDirs, privateFolders } from '../../../../data/helpers/files/private-folders.ts';
import type { LocalConfig } from '../../../../data/sources/config.ts';
import { realPath } from '../../../core/paths.ts';
import { expandHome, type Root } from '../../../files/files.ts';

/** What the set is made from. */
export type PrivateSource = {
    /** The home folder, whose `.oculus` folder holds the machine's state. */
    home: string;
    /** The directory the configuration is read from, which relative paths of `local.yml` follow. */
    engine: string;
    local: LocalConfig;
    /** The roots the file browser shows, the hubs among them marked. */
    roots: readonly Root[];
};

/** The paths of `local.yml` that place the machine's state, each written out. */
function placed(source: PrivateSource): string[] {
    const { local } = source;
    const named = [
        local.sessionsCache,
        local.sessionsOverrides,
        local.workspaces,
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
        .map((path) => {
            const home = expandHome(path);
            return isAbsolute(home) ? home : resolve(source.engine, home);
        });
}

/** The real paths closed to every app, each once. */
export function closedToApps(source: PrivateSource): string[] {
    const hubs = hubDirs(
        source.local.hub,
        source.roots.map((root) => ({ dir: expandHome(root.dir), hub: root.hub }))
    );
    const paths = [...privateFolders(hubs, source.home), ...placed(source)];
    return [...new Set(paths.map((path) => realPath(path, true) ?? path))];
}
