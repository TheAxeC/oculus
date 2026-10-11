// Layer 2, server. The check a host start makes right before the process is spawned: the app's
// folder is walked and hashed again, and the host starts only when the approvals file holds that
// hash. The hash is the whole folder's (read/record.ts), so a changed host file, a changed library
// of the host or a changed manifest all fail it, and an app kept approved while it is edited does
// not start its host on files nobody approved. The recorded files come from the same walk the hash
// was taken over, as real paths, which is the set of files the runner lets the host load.

import { readFileSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import type { HeldApp } from '../read/held.ts';
import { hashApp, walkApp, type WalkLimits } from '../read/record.ts';

/** The real paths of the recorded files of an app whose current hash is approved, or null. */
export function approvedFiles(
    app: HeldApp,
    approved: ReadonlySet<string>,
    limits: WalkLimits
): string[] | null {
    const folder = app.row.folder;
    const walk = walkApp(folder, limits);
    if (walk.tooLarge) return null;
    try {
        const manifest = readFileSync(join(folder, 'app.yml'));
        if (!approved.has(hashApp(folder, app.row.name, manifest, walk.files))) return null;
        return walk.files.map((file) => realpathSync(join(folder, file.path)));
    } catch {
        return null;
    }
}
