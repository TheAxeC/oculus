// Layer 1, data. The directory of the checkout the code runs from, found by walking up from a file.
// Server side only: it reads the filesystem and no client module may import it.
//
// It lives apart from the config reader because the start checks of the built server, the app and
// the `pre*` hooks (server/root/process/start/first-run.ts) run before the packages are known to be
// installed. An ES module resolves every import before it runs, so a module that imports a package
// cannot say that the package is missing; this one imports `node:` modules only. The config reader
// re-exports it (data/sources/config.ts), so every other caller keeps its import.

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Walk up from a starting file until a directory holds both package.json and config/.
 * In development that lands on oculus's folder from src/lib/data/places; in the adapter-node
 * build it lands on the same directory from build/server/chunks or build-app/server/chunks.
 */
export function engineDir(from: string = fileURLToPath(import.meta.url)): string {
    let dir = dirname(from);
    for (;;) {
        if (existsSync(join(dir, 'package.json')) && existsSync(join(dir, 'config'))) return dir;
        const up = dirname(dir);
        if (up === dir) throw new Error(`no oculus engine directory above ${from}`);
        dir = up;
    }
}
