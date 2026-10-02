// Which roots of the file browser the side-project reader is handed: personalRoots is the one place
// that decides it, so every rule about a root that is not a repository of its own is asserted here
// over real directories in a temporary directory. Nothing outside it is read or written.

import { existsSync, mkdirSync, symlinkSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { personalRoots } from '../../../../../src/lib/server/root/watch/portfolio.ts';
import { it, scratchDir } from '../../../../fixtures/scratch.ts';

/** A hub, the engine's config folder and a repository, each a real directory of its own. */
function places(): { hub: string; engineConfig: string; repo: string; base: string } {
    const base = scratchDir('oculus-personal-roots-');
    const hub = join(base, 'hub');
    const engineConfig = join(base, 'engine', 'config');
    const repo = join(base, 'repo');
    for (const dir of [hub, engineConfig, repo]) mkdirSync(dir, { recursive: true });
    return { hub, engineConfig, repo, base };
}

describe('personalRoots', () => {
    it('drops the hub and engine keys whatever directory they carry', () => {
        const { hub, engineConfig, repo } = places();
        expect(
            personalRoots(
                [
                    { key: 'hub', dir: '/not/read/hub' },
                    { key: 'engine', dir: '/not/read/engine' },
                    { key: 'tool', dir: repo }
                ],
                hub,
                engineConfig
            )
        ).toEqual([{ key: 'tool', dir: repo }]);
    });

    it('drops a root under another key whose directory is the hub, itself or by a link', () => {
        const { hub, engineConfig, repo, base } = places();
        const link = join(base, 'hub-link');
        symlinkSync(hub, link);
        expect(
            personalRoots(
                [
                    { key: 'again', dir: hub },
                    { key: 'via', dir: link },
                    { key: 'tool', dir: repo }
                ],
                hub,
                engineConfig
            )
        ).toEqual([{ key: 'tool', dir: repo }]);
    });

    it("drops a root under another key whose directory is the engine's config folder", () => {
        const { hub, engineConfig, repo, base } = places();
        const link = join(base, 'config-link');
        symlinkSync(engineConfig, link);
        expect(
            personalRoots(
                [
                    { key: 'cfg', dir: engineConfig },
                    { key: 'via', dir: link },
                    { key: 'tool', dir: repo }
                ],
                hub,
                engineConfig
            )
        ).toEqual([{ key: 'tool', dir: repo }]);
    });

    it('keeps one root per real directory, under the first key that reaches it', () => {
        const { hub, engineConfig, repo, base } = places();
        const link = join(base, 'repo-link');
        symlinkSync(repo, link);
        const spelled = join(repo, '..', 'repo');
        expect(
            personalRoots(
                [
                    { key: 'first', dir: repo },
                    { key: 'second', dir: spelled },
                    { key: 'link', dir: link }
                ],
                hub,
                engineConfig
            )
        ).toEqual([{ key: 'first', dir: repo }]);
        expect(
            personalRoots(
                [
                    { key: 'link', dir: link },
                    { key: 'real', dir: repo }
                ],
                hub,
                engineConfig
            )
        ).toEqual([{ key: 'link', dir: link }]);
    });

    it('keeps one root for two letter cases of one directory on a case-insensitive file system', ({
        skip
    }) => {
        const { hub, engineConfig, base } = places();
        const upper = join(base, 'Tool');
        mkdirSync(upper);
        const lower = join(base, 'tool');
        if (!existsSync(lower)) {
            skip('the file system tells letter cases apart, so these are two directories');
        }
        expect(
            personalRoots(
                [
                    { key: 'upper', dir: upper },
                    { key: 'lower', dir: lower }
                ],
                hub,
                engineConfig
            )
        ).toEqual([{ key: 'upper', dir: upper }]);
    });

    it('keeps a root that is not on this machine, for the reader to find nothing in', () => {
        const { hub, engineConfig, base } = places();
        const gone = join(base, 'never', 'made');
        expect(personalRoots([{ key: 'gone', dir: gone }], hub, engineConfig)).toEqual([
            { key: 'gone', dir: gone }
        ]);
    });

    it('expands a leading ~ to the home directory', () => {
        const { hub, engineConfig } = places();
        expect(
            personalRoots(
                [
                    { key: 'home', dir: '~' },
                    { key: 'proj', dir: '~/proj' }
                ],
                hub,
                engineConfig
            )
        ).toEqual([
            { key: 'home', dir: homedir() },
            { key: 'proj', dir: join(homedir(), 'proj') }
        ]);
    });

    it('drops a second root that carries the key of an earlier one', () => {
        const { hub, engineConfig, repo, base } = places();
        const other = join(base, 'other');
        mkdirSync(other);
        expect(
            personalRoots(
                [
                    { key: 'tool', dir: repo },
                    { key: 'tool', dir: other }
                ],
                hub,
                engineConfig
            )
        ).toEqual([{ key: 'tool', dir: repo }]);
    });
});
