// Layer 4, test. watchLocal against a config folder in a temporary directory: a write of
// local.yml, whether in place or by a rename as every oculus write and most editors make it, is
// one call after a short quiet; a write of any other file in the folder is none; a closed watcher
// makes no call.
//
// Every file is inside a directory of the case's own from scratchDir, which refuses a path outside
// the system temporary directory before it makes one. The waits are how long a failure takes, not
// a pass.

import { mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, expect, vi } from 'vitest';
import { watchLocal, type LocalWatcher } from '../../../../src/lib/server/root/watch/local.ts';
import { holdsDebounce, sleep, until, type HeldWatches } from './probe.ts';
import { it, scratchDir } from '../../../fixtures/scratch.ts';

const watches = vi.hoisted((): HeldWatches => ({ held: false, listeners: new Map() }));

vi.mock('node:fs', async (original) =>
    (await import('./probe.ts')).heldWatches(await original(), watches)
);

vi.setConfig({ testTimeout: 20000 });

const WAIT = 6000;
const DEBOUNCE = 50;

const watchers: LocalWatcher[] = [];

afterEach(() => {
    while (watchers.length > 0) watchers.pop()?.close();
    watches.held = false;
    vi.useRealTimers();
});

/** An engine of the case's own with its config folder made, and that folder. */
function engine(): { root: string; config: string } {
    const root = scratchDir('oculus-watch-local-');
    const config = join(root, 'config');
    mkdirSync(config);
    return { root, config };
}

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

it('debounces a burst into one call, waits the whole quiet again, and calls none after close', async () => {
    const { root, config } = engine();
    const changed = vi.fn();
    watches.held = true;
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const watcher = watchLocal(root, changed, { debounce: DEBOUNCE });
    watchers.push(watcher);
    const listener = watches.listeners.get(config);
    expect(listener).toBeDefined();
    await holdsDebounce(
        () => listener?.('rename', 'local.yml'),
        DEBOUNCE,
        () => changed.mock.calls.length,
        () => watcher.close()
    );
});
