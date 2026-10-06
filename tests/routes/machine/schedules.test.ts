// Layer 2, route tests. POST /api/schedules: the write token every write needs. The handler is
// called with the scratch files of a scratch world, a write chain and a watcher that counts what it
// is asked, so a refused request is shown to have written nothing and run nothing. What this does
// NOT cover: the origin rule, which hooks.server.ts applies to every request under /api/ ahead of a
// route seeing it (tests/server/root/hooks-server.test.ts).

import { readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, vi } from 'vitest';
import { fsWrites } from '../../../src/lib/server/core/json.ts';
import { handleSchedules } from '../../../src/lib/server/machine/schedules/routes.ts';
import type { SchedulesWatcher } from '../../../src/lib/server/machine/schedules/watch.ts';
import { pagePost } from '../../fixtures/doubles.ts';
import { it } from '../../fixtures/scratch.ts';
import { entryText, world } from '../../server/machine/schedules/schedules-fixture.ts';

const TOKEN = 'the write token of this test';
const HOST = 'http://127.0.0.1:8791';

describe('POST /api/schedules', () => {
    it('refuses a request without the write token', async () => {
        const w = world();
        const held = entryText(w, 'task');
        writeFileSync(w.files.schedules, held);
        const reload = vi.fn();
        const runNow = vi.fn(() => Promise.resolve({ refused: 'record-unread', names: [] }));
        const schedules: SchedulesWatcher = { reload, runNow, close: vi.fn() };
        const entry = {
            name: 'Daily radar',
            runs: { task: 'scout' },
            when: '0 9 * * *',
            paused: false,
            unattended: false
        };
        const bodies = [
            { action: 'save', at: null, was: null, entry },
            { action: 'delete', at: 0, name: 'Weekly radar' },
            { action: 'pause', at: 0, name: 'Weekly radar' },
            { action: 'resume', at: 0, name: 'Weekly radar' },
            { action: 'run', name: 'Weekly radar' }
        ];
        for (const token of ['wrong', '']) {
            for (const body of bodies) {
                const response = await handleSchedules(
                    pagePost(`${HOST}/api/schedules`, body, token),
                    TOKEN,
                    {
                        files: () => w.files,
                        rootsFor: () => [w.repo],
                        hubFor: () => w.hub,
                        writes: fsWrites(),
                        schedules
                    }
                );
                expect(response.status, `${body.action} with token ${JSON.stringify(token)}`).toBe(
                    403
                );
            }
        }
        expect(readFileSync(w.files.schedules, 'utf8')).toBe(held);
        expect(reload).not.toHaveBeenCalled();
        expect(runNow).not.toHaveBeenCalled();
    });
});
