// The roots of the personal board against a synthetic hub, engine and roots in temporary
// directories: the watcher opens each root's .oculus folder, rebuilds on a manifest written,
// edited or removed there, follows the workspaces file, and publishes nothing after close.
// Nothing outside the temporary directories is read or written, and every watcher is closed when
// the test ends.
// @module-tag slow: its cases wait on real portfolio file events, so npm test leaves it out.

import { mkdirSync, rmSync, symlinkSync } from 'node:fs';
import { basename, join } from 'node:path';
import { afterEach, describe, expect, vi } from 'vitest';
import type { Message, Snapshot } from '../../../../../src/lib/data/model/index.ts';
import type { Root } from '../../../../../src/lib/server/files/files.ts';
import { MANIFEST, sleep, until, write } from '../probe.ts';
import { it, scratchDir } from '../../../../fixtures/scratch.ts';
import { manual } from '../repos.ts';
import { on, quiet, start, stopWatchers } from './start.ts';

afterEach(() => {
    stopWatchers();
    vi.useRealTimers();
});

describe('the roots of the personal board', () => {
    const ROOT_MANIFEST = 'title: Tool\nstatus: running\neli5: A tool.\nnext: ""\nlinks: []\n';

    /** The ids of the side projects the newest portfolio message holds. */
    function personalIds(got: Message[]): string[] {
        const last = on(got, 'portfolio').at(-1)?.payload as Snapshot | undefined;
        return Object.keys(last?.entities.personal ?? {}).sort();
    }

    function titleOf(got: Message[], id: string): string | undefined {
        const last = on(got, 'portfolio').at(-1)?.payload as Snapshot | undefined;
        return last?.entities.personal[id]?.title;
    }

    it('rebuilds on a manifest written into a .oculus folder that was there, and on its removal', async () => {
        const dir = scratchDir('oculus-root-');
        mkdirSync(join(dir, '.oculus'));
        const started = start(
            undefined,
            { set: {} },
            { debounce: 20 },
            {
                roots: () => [{ key: 'tool', dir }]
            }
        );
        await quiet(started.got);
        expect(personalIds(started.got)).toEqual([]);

        write(dir, '.oculus/project.yml', ROOT_MANIFEST);
        await until(() => personalIds(started.got).length === 1, 3000);
        expect(personalIds(started.got)).toEqual(['root:tool']);

        await quiet(started.got);
        write(dir, '.oculus/project.yml', ROOT_MANIFEST.replace('Tool', 'Tool two'));
        await until(() => titleOf(started.got, 'root:tool') === 'Tool two', 3000);
        expect(titleOf(started.got, 'root:tool')).toBe('Tool two');

        await quiet(started.got);
        rmSync(join(dir, '.oculus/project.yml'));
        await until(() => personalIds(started.got).length === 0, 3000);
        expect(personalIds(started.got)).toEqual([]);
    });

    it('rebuilds on a manifest written into a .oculus folder that was not there', async () => {
        const dir = scratchDir('oculus-root-');
        const started = start(
            undefined,
            { set: {} },
            { debounce: 20 },
            {
                roots: () => [{ key: 'tool', dir }]
            }
        );
        await quiet(started.got);
        expect(personalIds(started.got)).toEqual([]);

        write(dir, '.oculus/project.yml', ROOT_MANIFEST);
        await until(() => personalIds(started.got).length === 1, 3000);
        expect(personalIds(started.got)).toEqual(['root:tool']);

        await quiet(started.got);
        write(dir, '.oculus/project.yml', ROOT_MANIFEST.replace('Tool', 'Tool two'));
        await until(() => titleOf(started.got, 'root:tool') === 'Tool two', 3000);
        expect(titleOf(started.got, 'root:tool')).toBe('Tool two');
    });

    it('rebuilds for the manifest of the .oculus folder and not for another yml beside it', async () => {
        const dir = scratchDir('oculus-root-');
        mkdirSync(join(dir, '.oculus'));
        const started = start(
            undefined,
            { set: {} },
            { debounce: 20 },
            { roots: () => [{ key: 'tool', dir }] }
        );
        await quiet(started.got);
        write(dir, '.oculus/project.yml', ROOT_MANIFEST);
        await until(() => personalIds(started.got).length === 1, 3000);
        expect(personalIds(started.got)).toEqual(['root:tool']);

        const settled = await quiet(started.got);
        write(dir, '.oculus/notes.yml', 'a: 1\n');
        await sleep(400);
        expect(started.got.length).toBe(settled);
    });

    it('watches a .oculus folder again that was removed and made again', async () => {
        const dir = scratchDir('oculus-root-');
        write(dir, '.oculus/project.yml', ROOT_MANIFEST);
        const started = start(
            undefined,
            { set: {} },
            { debounce: 20 },
            {
                roots: () => [{ key: 'tool', dir }]
            }
        );
        await quiet(started.got);
        expect(personalIds(started.got)).toEqual(['root:tool']);

        rmSync(join(dir, '.oculus'), { recursive: true, force: true });
        await until(() => personalIds(started.got).length === 0, 3000);
        expect(personalIds(started.got)).toEqual([]);

        await quiet(started.got);
        write(dir, '.oculus/project.yml', ROOT_MANIFEST);
        await until(() => personalIds(started.got).length === 1, 3000);
        expect(personalIds(started.got)).toEqual(['root:tool']);

        await quiet(started.got);
        write(dir, '.oculus/project.yml', ROOT_MANIFEST.replace('Tool', 'Tool again'));
        await until(() => titleOf(started.got, 'root:tool') === 'Tool again', 3000);
        expect(titleOf(started.got, 'root:tool')).toBe('Tool again');
    });

    it('draws no card for a root under another key that is the engine config folder', async () => {
        let configFolder = '';
        const started = start(
            (_hub, engine) => {
                configFolder = join(engine, 'config');
                write(configFolder, '.oculus/project.yml', ROOT_MANIFEST);
            },
            { set: {} },
            { debounce: 20 },
            { roots: () => [{ key: 'cfg', dir: configFolder }] }
        );
        await quiet(started.got);
        expect(on(started.got, 'portfolio').length).toBeGreaterThan(0);
        expect(personalIds(started.got)).toEqual([]);
    });

    it('draws one card for a directory listed twice, by a link or under the hub', async () => {
        const dir = scratchDir('oculus-root-');
        write(dir, '.oculus/project.yml', ROOT_MANIFEST);
        const link = join(scratchDir('oculus-root-link-'), 'tool-link');
        symlinkSync(dir, link);
        let hubDir = '';
        const started = start(
            (hub) => {
                hubDir = hub;
                write(hub, '.oculus/project.yml', ROOT_MANIFEST);
            },
            { set: {} },
            { debounce: 20 },
            {
                roots: () => [
                    { key: 'again', dir: hubDir },
                    { key: 'tool', dir },
                    { key: 'twice', dir: join(dir, '..', basename(dir)) },
                    { key: 'link', dir: link }
                ]
            }
        );
        await quiet(started.got);
        expect(on(started.got, 'portfolio').length).toBeGreaterThan(0);
        expect(personalIds(started.got)).toEqual(['root:tool']);
    });

    it('drops the card of a root whose whole directory is removed', async () => {
        const dir = join(scratchDir('oculus-root-'), 'repo');
        write(dir, '.oculus/project.yml', ROOT_MANIFEST);
        const started = start(
            undefined,
            { set: {} },
            { debounce: 20 },
            { roots: () => [{ key: 'tool', dir }] }
        );
        await quiet(started.got);
        expect(personalIds(started.got)).toEqual(['root:tool']);

        const before = on(started.got, 'portfolio').length;
        rmSync(dir, { recursive: true });
        await until(() => personalIds(started.got).length === 0, 3000);
        expect(on(started.got, 'portfolio').length).toBeGreaterThan(before);
        expect(personalIds(started.got)).toEqual([]);
    });

    it('drops the card of a root removed whole after another root was listed first', async () => {
        const base = scratchDir('oculus-root-');
        const gone = join(base, 'gone');
        const kept = join(base, 'kept');
        write(gone, '.oculus/project.yml', ROOT_MANIFEST);
        write(kept, '.oculus/project.yml', ROOT_MANIFEST.replace('Tool', 'Kept'));
        const started = start(
            undefined,
            { set: {} },
            { debounce: 20 },
            {
                roots: () => [
                    { key: 'gone', dir: gone },
                    { key: 'kept', dir: kept }
                ]
            }
        );
        await quiet(started.got);
        expect(personalIds(started.got)).toEqual(['root:gone', 'root:kept']);

        rmSync(gone, { recursive: true });
        await until(() => personalIds(started.got).length === 1, 3000);
        expect(personalIds(started.got)).toEqual(['root:kept']);
    });

    it('stops hearing a root once it leaves the list of roots', async () => {
        const dir = join(scratchDir('oculus-root-'), 'repo');
        mkdirSync(dir);
        const files = scratchDir('oculus-workspaces-');
        const workspacesFile = join(files, 'workspaces.json');
        const clock = manual();
        let listed: Root[] = [{ key: 'tool', dir }];
        let asked = 0;
        const started = start(
            undefined,
            { set: {} },
            { debounce: 20, clock: clock.clock },
            {
                roots: () => {
                    asked += 1;
                    return listed;
                },
                workspacesFile
            }
        );
        await quiet(started.got);
        const before = asked;

        listed = [];
        write(files, 'workspaces.json', '{"current":"","workspaces":[]}');
        clock.fire();
        await until(() => asked > before, 3000);
        const settled = await quiet(started.got);

        rmSync(dir, { recursive: true });
        await sleep(400);
        expect(started.got.length).toBe(settled);
    });

    it('reads the roots again at the next tick after the workspaces file changed', async () => {
        const dir = scratchDir('oculus-root-');
        write(dir, '.oculus/project.yml', ROOT_MANIFEST);
        const files = scratchDir('oculus-workspaces-');
        const workspacesFile = join(files, 'workspaces.json');
        const clock = manual();
        let listed: Root[] = [];
        const started = start(
            undefined,
            { set: {} },
            { debounce: 20, clock: clock.clock },
            { roots: () => listed, workspacesFile }
        );
        await quiet(started.got);
        expect(personalIds(started.got)).toEqual([]);

        // The write lands with no file event of the watcher's own to announce it: the tick is the
        // case's, and it is what reads the roots again.
        listed = [{ key: 'tool', dir }];
        write(files, 'workspaces.json', '{"current":"","workspaces":[]}');
        clock.fire();
        await until(() => personalIds(started.got).length === 1, 3000);
        expect(personalIds(started.got)).toEqual(['root:tool']);
    });

    it('lets the newest roots win when the file was written while a rebuild was running', async () => {
        const first = scratchDir('oculus-root-');
        write(first, '.oculus/project.yml', ROOT_MANIFEST);
        const second = scratchDir('oculus-root-');
        write(second, '.oculus/project.yml', ROOT_MANIFEST.replace('Tool', 'Second'));
        const files = scratchDir('oculus-workspaces-');
        const workspacesFile = join(files, 'workspaces.json');
        const clock = manual();
        let listed: Root[] = [{ key: 'first', dir: first }];
        const started = start(
            undefined,
            { set: {} },
            { debounce: 20, clock: clock.clock },
            { roots: () => listed, workspacesFile }
        );
        await quiet(started.got);
        expect(personalIds(started.got)).toEqual(['root:first']);

        // The next portfolio publication is the rebuild's own, so the write below lands after the
        // rebuild has read its roots.
        let armed = true;
        started.channels.subscribe(
            {
                send: () => {
                    if (armed) {
                        armed = false;
                        listed = [{ key: 'second', dir: second }];
                        write(files, 'workspaces.json', '{"current":"b","workspaces":[]}');
                    }
                    return Promise.resolve();
                },
                close: () => undefined
            },
            ['portfolio']
        );
        write(started.hub, 'projects/active/loewner/project.yml', MANIFEST + 'status: run\n');
        await until(() => !armed, 3000);
        expect(armed).toBe(false);
        await quiet(started.got);
        clock.fire();
        await until(() => personalIds(started.got).includes('root:second'), 3000);
        expect(personalIds(started.got)).toEqual(['root:second']);
    });
});
