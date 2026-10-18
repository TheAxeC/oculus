// Layer 2, client-state test. The page reads each workspace folder's `.oculus/settings.yml` with
// the rest of the folder from the workspaces answer (lib/state/sources/fs-transport.ts,
// `workspacesAnswer`): the text a folder carries is kept, and an answer that carries none, or
// carries no text, reads as null. The server's reading of the file is
// tests/server/files/workspace/folder-settings.test.ts and its watch
// tests/server/root/watch/settings-watch.test.ts.

import { describe, expect, it } from 'vitest';
import { pageWorkspaces } from '../../fixtures/hubs/workspace.ts';

/** The settings text the answer carries for its first folder. */
const TEXT = 'editor:\n  languages: {}\n';

describe('the settings text of each folder the page reads', () => {
    it('is the text an answer carries, and null where it carries none or no text', async () => {
        const read = await pageWorkspaces({
            home: '/home/u',
            open: null,
            folders: [
                { name: 'held', dir: '/w/held', hub: false, settings: TEXT },
                { name: 'null', dir: '/w/null', hub: false, settings: null },
                { name: 'a', dir: '/w/a', hub: false },
                { name: 'b', dir: '/w/b', hub: false, settings: 7 }
            ],
            primary: null,
            engine: null,
            recent: [],
            available: []
        });
        expect(read.folders.map((one) => [one.key, one.settings ?? null])).toEqual([
            ['held', TEXT],
            ['null', null],
            ['a', null],
            ['b', null]
        ]);
    });
});
