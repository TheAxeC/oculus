// Layer 4, server test. The files oculus keeps one of for a workspace (`bookmarks`, `schedules`,
// `apps_dir`) are named by the primary hub's `.oculus/config.yml`, read through the merged config:
// a path relative to the hub, `~/` and an absolute path each name their place, and a hub that sets
// none of them has them in its own `.oculus/` folder, oculus's defaults. A hub's `local.yml` that
// names one is a key `local.yml` does not take (tests/data/sources/config/local/).
//
// Each case merges the whole config folder and takes over 100 ms, so the cases are tagged slow.

import { homedir } from 'node:os';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { engineDir, loadConfig } from '../../../../src/lib/data/sources/config.ts';
import { perOculus } from '../../../../src/lib/server/files/workspace/paths.ts';
import { plantHub } from '../../../fixtures/hubs/workspace.ts';
import { it, scratchDir } from '../../../fixtures/scratch.ts';

/** The per-oculus paths of a scratch hub whose settings file holds `settings`. */
function placesOf(settings: string): { hub: string; places: ReturnType<typeof perOculus> } {
    const hub = plantHub(scratchDir('oculus-hub-'), settings);
    return { hub, places: perOculus(hub, loadConfig(engineDir(), { hub }).config) };
}

describe("the per-oculus paths from the primary hub's config.yml", { tags: ['slow'] }, () => {
    it('takes each of the three keys the hub names, relative, under home or absolute', () => {
        const { hub, places } = placesOf(
            'bookmarks: marks.yml\nschedules: ~/oculus-schedules.yml\napps_dir: /opt/oculus-apps\n'
        );
        expect(places).toEqual({
            bookmarks: join(hub, 'marks.yml'),
            schedules: join(homedir(), 'oculus-schedules.yml'),
            appsDir: '/opt/oculus-apps'
        });
    });

    it("puts each in the hub's own .oculus folder when the hub names none", () => {
        const { hub, places } = placesOf('{}\n');
        expect(places).toEqual({
            bookmarks: join(hub, '.oculus', 'bookmarks.yml'),
            schedules: join(hub, '.oculus', 'schedules.yml'),
            appsDir: join(hub, '.oculus', 'apps')
        });
    });

    it('has no place for a relative path with no primary hub', () => {
        expect(perOculus(null, loadConfig(engineDir()).config)).toEqual({
            bookmarks: null,
            schedules: null,
            appsDir: null
        });
    });
});
