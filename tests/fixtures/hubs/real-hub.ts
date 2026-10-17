// Layer 4, test helper. The real hub the cases over a real hub read, and the demo hub the cases
// that check oculus's own code read.
//
// Oculus is a repository of its own, so no hub sits at a fixed place beside it: the real hub is
// the folder the environment variable OCULUS_TEST_HUB names. Unset, the cases over a real hub skip,
// the file prints one line naming the variable, and the name of each skipped describe or case ends
// with the same reason. Set to a folder that holds no
// `.oculus/config.yml`, those cases fail with words naming the variable and the folder, so a
// mistyped path reads as a mistake and never as a skip. The cases that check oculus's own code run
// over the demo hub of tests/fixtures/hubs/demo/, which is always there, and never skip.

import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { engineDir } from '../../../src/lib/data/sources/config.ts';
import { HUB_FILE } from '../../../src/lib/data/helpers/hub-names.ts';

/** The environment variable that names the real hub. */
const TEST_HUB_VARIABLE = 'OCULUS_TEST_HUB';

/** The demo hub, the synthetic research hub the tests read. */
export const DEMO_HUB = join(engineDir(), 'tests', 'fixtures', 'hubs', 'demo');

/** The real hub as the environment names it. */
type RealHub = {
    /** The hub folder, resolved; empty when the variable is unset. */
    hub: string;
    /** Whether the variable is set, so the cases over a real hub run. */
    asked: boolean;
    /** The words a case fails with when the folder is no hub, or null when it is one. */
    wrong: string | null;
};

/** The real hub the environment names, read once per file. */
export function realHub(env: NodeJS.ProcessEnv = process.env): RealHub {
    const named = env[TEST_HUB_VARIABLE] ?? '';
    if (named === '') return { hub: '', asked: false, wrong: null };
    const hub = resolve(named);
    if (existsSync(join(hub, HUB_FILE))) return { hub, asked: true, wrong: null };
    const wrong = `${TEST_HUB_VARIABLE} names ${hub}, which is no hub: it holds no ${HUB_FILE}`;
    return { hub, asked: true, wrong };
}

/** The one line a file prints when its cases over a real hub skip. */
export function skipLine(file: string): string {
    return `${file}: the cases over a real hub skipped, since ${TEST_HUB_VARIABLE} is not set`;
}

/**
 * The name of a describe or a case over the real hub, which carries the reason when it skips, so
 * the reporter that lists the skipped names says why.
 */
export function realHubName(name: string, real: RealHub): string {
    return real.asked ? name : `${name} (skipped: ${TEST_HUB_VARIABLE} is not set)`;
}

/** The hub folder of a case over the real hub, which fails when the variable names no hub. */
export function hubOf(real: RealHub): string {
    if (real.wrong !== null) throw new Error(real.wrong);
    return real.hub;
}
