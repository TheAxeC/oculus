// Layer 4, test helper. A directory of a case's own under the system temporary directory, taken
// away again when the file that made it is done.
//
// Every scratch directory a test makes comes from here, so that a run leaves the temporary
// directory with the count it found. The sweep is this module's own: `it` and `test` below are
// vitest's, extended with one automatic fixture scoped to the file, which hands nothing to a case
// and sweeps once the file's cases and the hooks it runs through `test.beforeAll` and
// `test.afterAll` are done, red ones included. A file that makes scratch directories takes its
// `it`, `test` and those hooks from here rather than from vitest, and registers nothing itself. It
// makes none while it loads, since a run that skips every case of a file never sets its fixture
// up. A script run outside vitest registers sweepScratch with its own runner.
//
// The path is checked to be inside the system temporary directory before the directory is made,
// which is what keeps a case that joins a path onto it from writing into the checkout or the hub,
// and a prefix that climbs out of it from making anything at all.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { test as vitestTest } from 'vitest';

const made: string[] = [];

/** A new empty directory under the system temporary directory, remembered for the sweep. */
export function scratchDir(prefix: string): string {
    const planned = join(tmpdir(), prefix);
    if (!resolve(planned).startsWith(resolve(tmpdir()) + sep)) {
        throw new Error(`the scratch directory is outside the temporary directory: ${planned}`);
    }
    const dir = mkdtempSync(planned);
    made.push(dir);
    return dir;
}

/**
 * A new scratch directory holding the given files, by their paths relative to it. Each path is
 * checked to stay inside the directory before it is written, so a planted `../` writes nothing.
 */
export function plantScratch(prefix: string, files: Record<string, string>): string {
    const dir = scratchDir(prefix);
    for (const [rel, body] of Object.entries(files)) {
        const full = join(dir, rel);
        if (!resolve(full).startsWith(resolve(dir) + sep)) {
            throw new Error(`the planted file is outside its scratch directory: ${rel}`);
        }
        mkdirSync(dirname(full), { recursive: true });
        writeFileSync(full, body);
    }
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

/**
 * A hook that sweeps before its error goes on. vitest runs a file fixture's teardown in the same
 * `try` as the file's afterAll hooks, so a hook that throws skips the fixture's sweep; this one
 * sweeps first. vitest reads a hook's first parameter as the fixtures it asks for, so the hook
 * given is called with none.
 */
export function sweepingOnError(hook: () => unknown): (context: object) => Promise<void> {
    // eslint-disable-next-line no-empty-pattern -- vitest reads a hook's fixtures from this
    return async ({}) => {
        try {
            await hook();
        } catch (error) {
            sweepScratch();
            throw error;
        }
    };
}

const fixtured = vitestTest.extend<{ sweep: undefined }>({
    sweep: [
        // eslint-disable-next-line no-empty-pattern -- vitest reads a fixture's needs from this
        async ({}, use) => {
            await use(undefined);
            sweepScratch();
        },
        { scope: 'file', auto: true }
    ]
});

/**
 * vitest's test API with the sweep as an automatic fixture of the file: set up before the file's
 * first case or `test.beforeAll`, it hands the cases nothing, and sweeps every directory the file
 * made once its last case and its `test.afterAll` hooks are done. Its `test.afterAll` sweeps too
 * when the hook it is given throws, which the fixture alone would not.
 */
const fixturedAfterAll = fixtured.afterAll.bind(fixtured);

export const test = Object.assign(fixtured, {
    afterAll: (hook: () => unknown, timeout?: number) =>
        fixturedAfterAll(sweepingOnError(hook), timeout)
});

/** The same API under the name most files write their cases with. */
export const it = test;
