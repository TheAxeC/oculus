// Layer 4, test. watchBookmarks against a bookmarks file in a temporary directory.
//
// Every file this opens is inside a scratch directory of the case's own, which the scratch helper
// makes only under the system temporary directory, and each file is asserted to be inside it before
// it is written; the reader's own ~/.oculus is never watched, read or written here. Every watcher a
// case opens is closed when it ends.
//
// The waits are generous because the case waits on a real file observation and the suite runs
// several files at once: they are how long a failure takes, not how long a pass takes.

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { afterEach, beforeEach, expect, vi } from 'vitest';
import { Hub } from '../../../../src/lib/server/core/channels.ts';
import { watchBookmarks } from '../../../../src/lib/server/root/watch/bookmarks.ts';
import type { FilesPayload, Message } from '../../../../src/lib/data/model/index.ts';
import type { Watcher } from '../../../../src/lib/server/root/watch/portfolio.ts';
import { noop } from '../../../fixtures/doubles.ts';
import { recording, sleep, until } from './probe.ts';
import { it, scratchDir } from '../../../fixtures/scratch.ts';

vi.setConfig({ testTimeout: 20000 });

/** How long a publish is waited for before the assertion runs and fails. */
const WAIT = 6000;

/** Milliseconds of quiet the cases run the watcher with, so a burst closes quickly. */
const DEBOUNCE = 50;

const watchers: Watcher[] = [];

let dir = '';

beforeEach(() => {
    dir = scratchDir('oculus-watch-bookmarks-');
});

afterEach(() => {
    while (watchers.length > 0) watchers.pop()?.close();
});

/** One file inside the case's own directory, and nowhere else. */
function put(folder: string, name: string, body: string): void {
    const full = join(folder, name);
    expect(resolve(full).startsWith(resolve(folder) + sep)).toBe(true);
    writeFileSync(full, body);
}

/** The folder of a machine that has written a bookmark, with the file the watcher is given. */
function bookmarksFile(): string {
    const folder = join(dir, '.oculus');
    mkdirSync(folder);
    put(folder, 'bookmarks.yml', 'title: Bookmarks\n');
    return join(folder, 'bookmarks.yml');
}

/**
 * A watcher over that file, with whatever its own opening delivered dropped. The first stat sample
 * can observe the write that made the fixture; a case counts what its own writes caused.
 */
async function armed(
    hub: Hub,
    file: string,
    got: Message[],
    debounce = DEBOUNCE
): Promise<{ watcher: Watcher; got: Message[] }> {
    const watcher = watchBookmarks(hub, { file, debounce });
    watchers.push(watcher);
    await sleep(debounce * 4);
    got.length = 0;
    return { watcher, got };
}

it('publishes a bookmark message when the file is written outside oculus', async () => {
    const file = bookmarksFile();
    const hub = new Hub();
    const client = recording();
    hub.subscribe(client.sink, ['files']);
    await armed(hub, file, client.got);

    writeFileSync(file, 'title: Bookmarks\nentries:\n  - { label: one }\n');
    await until(() => client.got.length > 0, WAIT);

    expect(client.got.map((message) => message.channel)).toEqual(['files']);
    const payload = client.got[0].payload as FilesPayload;
    // the file lies under no root, so the message names none and says which file it is
    expect(payload).toEqual({ root: '', bookmarks: true });
});

it('says nothing for another file written in the same folder', async () => {
    const file = bookmarksFile();
    const folder = join(dir, '.oculus');
    const hub = new Hub();
    const client = recording();
    hub.subscribe(client.sink, ['files']);
    await armed(hub, file, client.got);

    // The transcript cache sits beside the bookmarks and every session scan rewrites it.
    put(folder, 'transcript-cache.json', '{"at":1}');
    put(folder, 'sessions.json', '{"at":1}');
    await sleep(DEBOUNCE * 4);
    expect(client.got).toEqual([]);

    // The same folder, the one name that is watched: the handle is delivering events either way.
    writeFileSync(file, 'title: Bookmarks\nentries: []\n');
    await until(() => client.got.length > 0, WAIT);
    expect(client.got).toHaveLength(1);
});

it('publishes once for a burst of writes, and nothing at all once it is closed', async () => {
    const file = bookmarksFile();
    const hub = new Hub();
    const client = recording();
    hub.subscribe(client.sink, ['files']);
    // A window wide enough that three writes a moment apart are one burst, since the whole point is
    // that a file saved three times in a row is one read on the page and not three.
    const window = 300;
    const { watcher } = await armed(hub, file, client.got, window);

    for (const label of ['one', 'two', 'three']) {
        writeFileSync(file, `title: Bookmarks\nentries:\n  - { label: ${label} }\n`);
        await sleep(20);
    }
    await until(() => client.got.length > 0, WAIT);
    await sleep(window * 2);
    expect(client.got).toHaveLength(1);

    watcher.close();
    writeFileSync(file, 'title: Bookmarks\nentries: []\n');
    await sleep(window * 2);
    expect(client.got).toHaveLength(1);
});

it('makes the folder it watches when the machine has none, and publishes for the file made in it', async () => {
    const said = vi.spyOn(console, 'error').mockImplementation(noop);
    const folder = join(dir, 'never-made');
    const file = join(folder, 'bookmarks.yml');
    const hub = new Hub();
    const client = recording();
    hub.subscribe(client.sink, ['files']);
    await armed(hub, file, client.got);

    // Nothing was said, since a machine with no folder yet is no failure, and the folder is there
    // to be watched: the first bookmark written into it is seen without the server being started
    // again.
    expect(said).not.toHaveBeenCalled();
    expect(existsSync(folder)).toBe(true);
    // The file itself is the first bookmark's to write, so the watcher made none.
    expect(existsSync(file)).toBe(false);
    said.mockRestore();

    put(folder, 'bookmarks.yml', 'title: Bookmarks\n');
    await until(() => client.got.length > 0, WAIT);
    expect(client.got).toHaveLength(1);
});
