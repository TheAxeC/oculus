// Layer 4, test helper. A directory of a case's own under the system temporary directory, taken
// away again when the file that made it is done.
//
// Every scratch directory a test makes comes from here, so that a run leaves the temporary directory
// with the count it found. The sweep is registered by the suite that uses it, with its own runner:
// a vitest file calls afterAll(sweepScratch) and a browser spec calls test.afterAll(sweepScratch),
// so one helper serves both layers and a red case takes its directory with it either way.
//
// The path is checked to be inside the system temporary directory before it is handed back, which is
// what keeps a case that joins a path onto it from writing into the checkout or the hub.

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';

const made: string[] = [];

/** A new empty directory under the system temporary directory, remembered for the sweep. */
export function scratchDir(prefix: string): string {
    const dir = mkdtempSync(join(tmpdir(), prefix));
    if (!resolve(dir).startsWith(resolve(tmpdir()) + sep)) {
        throw new Error(`the scratch directory is outside the temporary directory: ${dir}`);
    }
    made.push(dir);
    return dir;
}

/** Remove every directory made so far. A file whose own hooks need it may call it early. */
export function sweepScratch(): void {
    for (const dir of made.splice(0)) rmSync(dir, { recursive: true, force: true });
}

/** What has been made and not yet swept, for the cases over this helper. */
export function scratchMade(): string[] {
    return [...made];
}
