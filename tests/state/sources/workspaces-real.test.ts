// Layer 2, client-state tests. The `real` folder of a root in the workspaces answer: the server
// writes it (lib/server/files/fs.ts, `workspacesAnswer`) as the folder with every symlink
// resolved, empty for a folder that does not exist, and the page reads it with the rest of the root
// (lib/state/sources/fs-transport.ts, `workspacesShape`). A repository's folder is a real path, so
// the page compares it with this folder, not with the configured one.
//
// Every directory here is under the system temporary directory; nothing reads ~/.oculus.

import { mkdirSync, realpathSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { fsWrites } from '../../../src/lib/server/core/json.ts';
import { ignoredCache, workspacesAnswer } from '../../../src/lib/server/files/fs.ts';
import { readAs } from '../../../src/lib/data/shapes/shapes.ts';
import { workspacesShape } from '../../../src/lib/state/sources/fs-transport.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';

describe('the real folder of a root in the workspaces answer', () => {
    it('is the folder a symlinked root leads to, and empty for a folder that is not there', () => {
        const dir = scratchDir('oculus-real-');
        const folder = join(dir, 'repository');
        mkdirSync(folder);
        const link = join(dir, 'link');
        symlinkSync(folder, link);
        const answer = workspacesAnswer(
            {
                file: join(dir, 'workspaces.json'),
                bookmarks: join(dir, 'bookmarks.yml'),
                notes: join(dir, 'notes'),
                fixed: [
                    { key: 'linked', dir: link },
                    { key: 'missing', dir: join(dir, 'missing') }
                ],
                writes: fsWrites(),
                ignored: ignoredCache()
            },
            { current: '', workspaces: [], dropped: [] }
        );
        const read = readAs(workspacesShape, JSON.parse(JSON.stringify(answer)));
        const roots = read?.workspaces[0].roots ?? [];
        expect(roots.find((one) => one.key === 'linked')).toMatchObject({
            dir: link,
            real: realpathSync(folder)
        });
        expect(roots.find((one) => one.key === 'missing')?.real).toBe('');
    });

    it('is left out by a body that carries none, and read as nothing', () => {
        const read = readAs(workspacesShape, {
            home: '/home/u',
            current: 'main',
            workspaces: [{ name: 'main', roots: [{ key: 'a', dir: '/w/a', fixed: false }] }],
            dropped: []
        });
        expect(read?.workspaces[0].roots[0].real).toBeUndefined();
    });
});
