// Layer 2, route tests. The authenticated open endpoint's gates, against directories under system
// temporary storage. The opener is a stub, so no application is launched and no path outside the
// fixture is touched.

import { resolve, sep } from 'node:path';
import { describe, expect, vi } from 'vitest';
import { handleOpen } from '../../../src/lib/server/files/open.ts';
import { TOKEN, checkedIn, fixture, request, scratch } from './open-fixture.ts';
import { it } from '../../fixtures/scratch.ts';
import { TEXT } from '../../server/text.ts';

describe('the open endpoint', () => {
    it('requires the write token', async () => {
        const { folder, roots } = fixture();
        const response = await handleOpen(
            request({ path: folder }, ''),
            TOKEN,
            () => TEXT,
            roots,
            checkedIn,
            vi.fn()
        );
        expect(response.status).toBe(403);
    });

    it('refuses a directory outside every configured root', async () => {
        const { roots } = fixture();
        const outside = scratch('oculus-open-outside-');
        expect(roots.some((root) => resolve(outside).startsWith(resolve(root.dir) + sep))).toBe(
            false
        );
        const response = await handleOpen(
            request({ path: outside }),
            TOKEN,
            () => TEXT,
            roots,
            checkedIn,
            vi.fn()
        );
        expect(response.status).toBe(403);
        expect(await response.json()).toEqual({
            error: 'the path is outside the configured roots',
            refused: [{ field: 'path', reason: 'the path is outside the configured roots' }]
        });
    });
});
