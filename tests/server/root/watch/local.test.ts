// Layer 4, test. watchLocal against a config folder in a temporary directory: a write of
// local.yml, whether in place or by a rename as every oculus write and most editors make it, is
// one call after a short quiet; a write of any other file in the folder is none; a closed watcher
// makes no call.
//
// Every file is inside a directory of the case's own, asserted to be under the system temporary
// directory before anything is written. The waits are how long a failure takes, not a pass.

import { mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { afterAll, afterEach, expect, it, vi } from 'vitest';
import { watchLocal, type LocalWatcher } from '../../../../src/lib/server/root/watch/local.ts';
import { sleep, until } from './probe.ts';
import { scratchDir, sweepScratch } from '../../../fixtures/scratch.ts';

afterAll(sweepScratch);

vi.setConfig({ testTimeout: 20000 });

const WAIT = 6000;
const DEBOUNCE = 50;

const watchers: LocalWatcher[] = [];

afterEach(() => {
    while (watchers.length > 0) watchers.pop()?.close();
});

/** An engine of the case's own with its config folder made, and that folder. */
function engine(): { root: string; config: string } {
    const root = scratchDir('oculus-watch-local-');
    expect(resolve(root).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    const config = join(root, 'config');
    mkdirSync(config);
    return { root, config };
}

// revert: src/lib/server/root/watch/local.ts:37 => if (closed) return;
it('calls once for a local.yml written by a rename, and never for another file', async () => {
    const { root, config } = engine();
    const changed = vi.fn();
    watchers.push(watchLocal(root, changed, { debounce: DEBOUNCE }));

    writeFileSync(join(config, 'oculus.yml'), 'other: 1\n');
    await sleep(DEBOUNCE * 6);
    expect(changed).toHaveBeenCalledTimes(0);

    writeFileSync(join(config, '.local.yml.tmp'), 'hub: /x\n');
    renameSync(join(config, '.local.yml.tmp'), join(config, 'local.yml'));
    await until(() => changed.mock.calls.length > 0, WAIT);
    await sleep(DEBOUNCE * 4);
    expect(changed).toHaveBeenCalledTimes(1);
});

// revert: src/lib/server/root/watch/local.ts:52 => delete
it('makes no call after it is closed', async () => {
    const { root, config } = engine();
    const changed = vi.fn();
    // A quiet long enough that the write's event is in and its call still pending at the close.
    const quiet = 1500;
    const watcher = watchLocal(root, changed, { debounce: quiet });

    writeFileSync(join(config, 'local.yml'), 'hub: /x\n');
    await sleep(500);
    watcher.close();
    await sleep(quiet + 500);

    expect(changed).toHaveBeenCalledTimes(0);
});
