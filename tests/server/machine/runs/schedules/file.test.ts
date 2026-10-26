// Layer 4, server test. The schedules file: a file that does not read is never written over, by the
// plan of an edit and by the route that commits it. Every case runs over a scratch folder, so
// nothing reaches ~/.oculus. What this does not cover: the text a write of a readable file gives
// (the route suite and the look read that), and the checks of an entry against the disk.

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, vi } from 'vitest';
import type { ScheduleEntry } from '../../../../../src/lib/data/model/index.ts';
import {
    planEdit,
    readSchedules,
    type Edit
} from '../../../../../src/lib/server/machine/runs/schedules/file.ts';
import { handleSchedules } from '../../../../../src/lib/server/machine/runs/schedules/routes.ts';
import type { SchedulesWatcher } from '../../../../../src/lib/server/machine/runs/schedules/watch.ts';
import { pagePost } from '../../../../fixtures/doubles.ts';
import { it, scratchDir } from '../../../../fixtures/scratch.ts';
import { routeOptions, world } from './schedules-fixture.ts';

const ENTRY: ScheduleEntry = {
    name: 'Weekly radar',
    runs: { task: 'litwatch' },
    when: '0 7 * * 1',
    paused: false,
    unattended: false
};

const EDITS: Edit[] = [
    { action: 'save', at: null, was: null, entry: ENTRY },
    { action: 'save', at: 0, was: 'Weekly radar', entry: ENTRY },
    { action: 'delete', at: 0, name: 'Weekly radar' },
    { action: 'pause', at: 0, name: 'Weekly radar' },
    { action: 'resume', at: 0, name: 'Weekly radar' }
];

const TOKEN = 'the write token of this test';

describe('the schedules file', () => {
    it('refuses a write over a schedules file it cannot read, leaving it', async () => {
        const dir = scratchDir('oculus-schedules-file-');
        const disk = { hub: dir, roots: [dir], hubs: [] };
        const w = world();
        const reload = vi.fn();
        const schedules: SchedulesWatcher = { reload, runNow: vi.fn(), close: vi.fn() };
        const files: [string, string, number | null][] = [
            ['an editor halfway through a line', '- name: [\n', 2],
            ['a map at the top', 'name: Weekly radar\nwhen: "0 7 * * 1"\n', null],
            ['a string at the top', '"Weekly radar"\n', null]
        ];
        for (const [name, held, line] of files) {
            const file = join(dir, 'schedules.yml');
            writeFileSync(file, held);
            expect(readSchedules(file, disk), name).toEqual({ ok: false, line });
            for (const edit of EDITS) {
                expect(planEdit(file, edit), `${name}: ${edit.action}`).toEqual({
                    ok: false,
                    status: 409,
                    error: 'schedules-unread',
                    names: []
                });
            }
            expect(readFileSync(file, 'utf8'), name).toBe(held);
            writeFileSync(w.files.schedules, held);
            for (const edit of EDITS) {
                const response = await handleSchedules(
                    pagePost('http://127.0.0.1:8791/api/schedules', edit, TOKEN),
                    TOKEN,
                    routeOptions(w, schedules)
                );
                const label = `${name}: ${edit.action} through the route`;
                expect(response.status, label).toBe(409);
                expect(await response.json(), label).toEqual({
                    error: 'schedules-unread',
                    names: []
                });
                expect(readFileSync(w.files.schedules, 'utf8'), label).toBe(held);
            }
        }
        expect(reload).not.toHaveBeenCalled();
    });
});
