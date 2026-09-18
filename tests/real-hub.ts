// Layer 4, test helper. Whether the real hub is there to be read, for the cases that read it.
//
// A case over the real hub skips where the hub is not on the machine. The hub's path existing is not
// that question: a sparse checkout of this repository holds the root and its documents and none of
// the data folders, so the path is there and every folder under it is empty. A case guarded on the
// path alone then runs against nothing and fails on a count, which reads as a defect in the code and
// is a fact about the checkout. The question asked here is whether the folders the config names hold
// anything, so such a checkout skips and a hub that lost its data still fails loudly.

import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadConfig, loadLocal, engineDir } from '../src/lib/data/sources/config.ts';
import { portfolioConfigFrom } from '../src/lib/data/index.ts';

/** Whether a folder is there and holds anything at all. */
function filled(path: string): boolean {
    try {
        return readdirSync(path).length > 0;
    } catch {
        return false;
    }
}

/**
 * The real hub's path, and whether it is there with its data. Read once per file: the answer cannot
 * change while a suite runs, and every case over the hub asks the same question.
 */
export function realHub(engine: string = engineDir()): { hub: string; present: boolean } {
    const hub = loadLocal(engine).hub;
    if (!existsSync(hub)) return { hub, present: false };
    const config = portfolioConfigFrom(loadConfig(engine).config, engine);
    // The registries file the config names, and a scan folder with projects in it. A hub may not
    // carry every folder the scan lists, so one that is filled is what says the data is here.
    const registries = existsSync(join(hub, config.registries.venues));
    const scanned = config.scan.some((rule) => filled(join(hub, rule.dir)));
    return { hub, present: registries && scanned };
}
