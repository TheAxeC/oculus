// Layer 2, server. Add an app from a folder: the checks, then a copy that appears whole or not at
// all.
//
// The folder chosen must hold an `app.yml` and have a name that matches the app name pattern and
// that no entry of the machine's apps folder holds (an app, a refused folder or any file). It must
// lie neither inside the apps folder nor hold it, and it must fit `apps.max_files` and
// `apps.max_mb`; every check is made before a byte is copied, and a link is never followed. The
// copy leaves out links and dot-led names, as the approval hash does, goes into a temporary folder
// beside the apps folder, and is renamed into place, so no partial app folder is ever read. The
// copied app appears unapproved and asks as any app does.

import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, renameSync, rmSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { APP_NAME } from '../../../../data/helpers/files/apps.ts';
import { below, realPath } from '../../../core/paths.ts';
import { walkApp, type WalkLimits } from '../read/record.ts';

/** The words an addition is refused with. */
type AddRefusal =
    'not_folder' | 'no_manifest' | 'name' | 'exists' | 'inside' | 'holds' | 'too_large' | 'copy';

/** What an addition came to: the name of the new app, or the word it was refused with. */
type AddOutcome = { ok: true; name: string } | { ok: false; error: AddRefusal };

/** Whether something is at the path, a link that points at nothing included. */
function present(path: string): boolean {
    try {
        lstatSync(path);
        return true;
    } catch {
        return false;
    }
}

/** Whether a copy of `root` keeps this path: the root itself, else no dot-led name and no link. */
function keeping(root: string): (path: string) => boolean {
    return (path) =>
        path === root || (!basename(path).startsWith('.') && !lstatSync(path).isSymbolicLink());
}

/**
 * The real path of a folder that may not exist yet: its deepest existing ancestor resolved, the
 * names below it kept, so a folder reached through a link compares equal to the same folder read
 * from the other side.
 */
function resolvedFolder(path: string): string {
    const rest: string[] = [];
    let probe = path;
    for (;;) {
        const real = realPath(probe, true);
        if (real !== null) return join(real, ...rest);
        const parent = dirname(probe);
        if (parent === probe) return path;
        rest.unshift(basename(probe));
        probe = parent;
    }
}

/** Copy the folder chosen into the apps folder as a new app. */
export function addApp(chosen: string, appsFolder: string, limits: WalkLimits): AddOutcome {
    const source = realPath(chosen, true);
    if (source === null || !lstatSync(source).isDirectory())
        return { ok: false, error: 'not_folder' };
    if (!existsSync(join(source, 'app.yml')) || !lstatSync(join(source, 'app.yml')).isFile()) {
        return { ok: false, error: 'no_manifest' };
    }
    const name = basename(chosen);
    if (!APP_NAME.test(name)) return { ok: false, error: 'name' };
    const target = resolvedFolder(appsFolder);
    if (source === target || below(source, target)) return { ok: false, error: 'inside' };
    if (below(target, source)) return { ok: false, error: 'holds' };
    if (present(join(target, name))) return { ok: false, error: 'exists' };
    if (walkApp(source, limits).tooLarge) return { ok: false, error: 'too_large' };
    const parent = dirname(target);
    mkdirSync(target, { recursive: true });
    const staging = mkdtempSync(join(parent, '.app-adding-'));
    try {
        cpSync(source, join(staging, name), {
            recursive: true,
            dereference: false,
            filter: keeping(source)
        });
        renameSync(join(staging, name), join(target, name));
    } catch {
        return { ok: false, error: 'copy' };
    } finally {
        rmSync(staging, { recursive: true, force: true });
    }
    return { ok: true, name };
}
