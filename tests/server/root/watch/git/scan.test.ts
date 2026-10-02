// Layer 4, test. watchGit over a configured root that is no repository: each direct subfolder
// holding a `.git` is a root of the channel after it, read at start, on a config push and at an
// event on the root's top level, never deeper; a subfolder that is a link and `node_modules` are
// skipped, and a configured root that is itself a repository is not scanned.
//
// Every folder here is made inside a temporary directory and every watcher a case opens is closed.

import { mkdirSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, vi } from 'vitest';
import { Hub } from '../../../../../src/lib/server/core/channels.ts';
import { watchGit } from '../../../../../src/lib/server/root/watch/git.ts';
import type { Watcher } from '../../../../../src/lib/server/root/watch/portfolio.ts';
import { it, scratchDir } from '../../../../fixtures/scratch.ts';
import { recording, until } from '../probe.ts';
import { announce, latest, manual, put, repositoryIn } from '../repos.ts';

vi.setConfig({ testTimeout: 20000 });

const WAIT = 6000;
const watchers: Watcher[] = [];

afterEach(() => {
    while (watchers.length > 0) watchers.pop()?.close();
});

/** A folder holding no `.git` and the repositories the case names under it, by relative path. */
function holder(): { dir: string; root: string } {
    const dir = scratchDir('oculus-scan-');
    const root = join(dir, 'R');
    mkdirSync(root);
    return { dir, root };
}

function start(always: string, roots: () => string[], clock = manual()) {
    const hub = new Hub();
    const client = recording();
    hub.subscribe(client.sink, ['git']);
    announce(hub, []);
    watchers.push(watchGit(hub, { always, clock: clock.clock, roots }));
    return { hub, client, clock };
}

describe('the repositories found one folder deep', () => {
    it('lists a subfolder that holds a .git after its root, and no other', async () => {
        const { dir, root } = holder();
        const always = repositoryIn(dir, 'hub');
        const a = repositoryIn(root, 'a');
        mkdirSync(join(root, 'b'));
        repositoryIn(join(root, 'b'), 'c');
        mkdirSync(join(root, 'node_modules'));
        repositoryIn(join(root, 'node_modules'), 'x');
        const elsewhere = repositoryIn(dir, 'elsewhere');
        symlinkSync(elsewhere, join(root, 'l'));
        mkdirSync(join(root, 'plain'));
        const { client } = start(always, () => [root]);
        await until(() => Object.keys(latest(client.got)).includes(a), WAIT);
        expect(Object.keys(latest(client.got))).toEqual([always, root, a]);
    });

    it('does not scan a configured root that is itself a repository', async () => {
        const { dir } = holder();
        const always = repositoryIn(dir, 'hub');
        const repo = repositoryIn(dir, 'repo');
        repositoryIn(repo, 'inner');
        const { client } = start(always, () => [repo]);
        await until(() => Object.keys(latest(client.got)).includes(repo), WAIT);
        expect(Object.keys(latest(client.got))).toEqual([always, repo]);
    });

    it('finds a subfolder made later at the next event on the top level of the root', async () => {
        const { dir, root } = holder();
        const always = repositoryIn(dir, 'hub');
        const clock = manual();
        const { client } = start(always, () => [root], clock);
        await until(() => Object.keys(latest(client.got)).includes(root), WAIT);
        expect(Object.keys(latest(client.got))).toEqual([always, root]);
        const d = repositoryIn(root, 'd');
        await until(() => clock.pending() > 0, WAIT);
        clock.fire();
        await until(() => Object.keys(latest(client.got)).includes(d), WAIT);
        expect(Object.keys(latest(client.got))).toEqual([always, root, d]);
    });

    it('does not look again for an event deeper than the top level', async () => {
        const { dir, root } = holder();
        const always = repositoryIn(dir, 'hub');
        const a = repositoryIn(root, 'a');
        const clock = manual();
        const { client } = start(always, () => [root], clock);
        await until(() => Object.keys(latest(client.got)).includes(a), WAIT);
        clock.fire();
        // A folder with a .git made under a subfolder is a write below the top level.
        mkdirSync(join(root, 'plain'));
        clock.fire();
        const deep = repositoryIn(join(root, 'plain'), 'deep');
        put(join(root, 'plain'), 'note.txt', 'x\n');
        await new Promise((resolve) => setTimeout(resolve, 600));
        clock.fire();
        await new Promise((resolve) => setTimeout(resolve, 300));
        expect(Object.keys(latest(client.got))).not.toContain(deep);
    });
});
